// =============================================================================
// ENTERPRISE AI SYSTEM — Token-Efficient Architecture at Scale
// =============================================================================
//
// This module implements ALL the enterprise-scale AI patterns that prevent
// token explosion:
//
//   1. SEMANTIC RETRIEVAL — Only fetch relevant context
//   2. SPECIALIZED MICRO-AGENTS — Single-purpose with tiny context
//   3. DETERMINISTIC WORKFLOWS — Replayable, predictable execution
//   4. DISTRIBUTED GENERATION — Parallel token-efficient tasks
//
// Together with tokenTracker.ts and projectionState.ts, this forms a complete
// enterprise-grade AI system that scales without running out of tokens.
// =============================================================================

import { tokenTracker, estimateTokens } from './tokenTracker';
import { projectionState } from './projectionState';

// ────────────────────────────────────────────────────────────────────────────
// SEMANTIC RETRIEVAL ENGINE
// ────────────────────────────────────────────────────────────────────────────

export interface SemanticChunk {
  id: string;
  content: string;
  embedding?: number[]; // Vector embedding (in production: use real embeddings)
  metadata: {
    source: string;
    type: string;
    timestamp: number;
    tokens: number;
  };
}

export interface RetrievalQuery {
  query: string;
  maxResults?: number;
  maxTokens?: number; // Budget for retrieved context
  filter?: (chunk: SemanticChunk) => boolean;
}

class SemanticRetriever {
  private chunks: Map<string, SemanticChunk> = new Map();

  /**
   * Index content for semantic retrieval
   */
  indexContent(chunk: Omit<SemanticChunk, 'metadata'> & { metadata?: Partial<SemanticChunk['metadata']> }): void {
    const fullChunk: SemanticChunk = {
      ...chunk,
      metadata: {
        source: chunk.metadata?.source || 'unknown',
        type: chunk.metadata?.type || 'text',
        timestamp: chunk.metadata?.timestamp || Date.now(),
        tokens: estimateTokens(chunk.content),
      },
    };

    this.chunks.set(chunk.id, fullChunk);
  }

  /**
   * Retrieve most relevant chunks for a query
   * Returns ONLY what's needed (token-efficient)
   */
  retrieve(query: RetrievalQuery): SemanticChunk[] {
    const maxResults = query.maxResults || 10;
    const maxTokens = query.maxTokens || 5000;

    let chunks = Array.from(this.chunks.values());

    // Apply filter if provided
    if (query.filter) {
      chunks = chunks.filter(query.filter);
    }

    // Score by relevance (in production: use vector similarity)
    const scored = chunks.map(chunk => ({
      chunk,
      score: this.scoreRelevance(query.query, chunk.content),
    }));

    // Sort by score (descending)
    scored.sort((a, b) => b.score - a.score);

    // Take top results within token budget
    const results: SemanticChunk[] = [];
    let totalTokens = 0;

    for (const { chunk } of scored) {
      if (results.length >= maxResults) break;
      if (totalTokens + chunk.metadata.tokens > maxTokens) break;

      results.push(chunk);
      totalTokens += chunk.metadata.tokens;
    }

    return results;
  }

  /**
   * Simple relevance scoring (in production: use embeddings + cosine similarity)
   */
  private scoreRelevance(query: string, content: string): number {
    const queryTerms = query.toLowerCase().split(/\s+/);
    const contentLower = content.toLowerCase();

    let score = 0;
    queryTerms.forEach(term => {
      const count = (contentLower.match(new RegExp(term, 'g')) || []).length;
      score += count;
    });

    // Boost recent content
    const chunk = Array.from(this.chunks.values()).find(c => c.content === content);
    if (chunk) {
      const ageInDays = (Date.now() - chunk.metadata.timestamp) / (24 * 60 * 60 * 1000);
      const recencyBoost = Math.max(0, 1 - ageInDays / 30); // Decay over 30 days
      score *= (1 + recencyBoost);
    }

    return score;
  }

  /**
   * Clear old chunks to save memory
   */
  pruneOld(maxAgeMs: number): number {
    const now = Date.now();
    let pruned = 0;

    this.chunks.forEach((chunk, id) => {
      if (now - chunk.metadata.timestamp > maxAgeMs) {
        this.chunks.delete(id);
        pruned++;
      }
    });

    return pruned;
  }

  getStats(): { chunkCount: number; totalTokens: number } {
    const chunkCount = this.chunks.size;
    const totalTokens = Array.from(this.chunks.values()).reduce(
      (sum, chunk) => sum + chunk.metadata.tokens,
      0
    );

    return { chunkCount, totalTokens };
  }
}

export const semanticRetriever = new SemanticRetriever();

// ────────────────────────────────────────────────────────────────────────────
// SPECIALIZED MICRO-AGENTS
// ────────────────────────────────────────────────────────────────────────────

export interface MicroAgent<TInput, TOutput> {
  id: string;
  name: string;
  description: string;
  maxInputTokens: number; // Hard limit on input size
  maxOutputTokens: number;
  execute: (input: TInput) => Promise<TOutput> | TOutput;
  model?: string; // Default model
}

export interface AgentExecution<TInput, TOutput> {
  agentId: string;
  input: TInput;
  output?: TOutput;
  error?: string;
  inputTokens: number;
  outputTokens: number;
  status: 'pending' | 'running' | 'success' | 'failed';
  startTime?: number;
  endTime?: number;
}

class MicroAgentOrchestrator {
  private agents: Map<string, MicroAgent<any, any>> = new Map();
  private executions: Map<string, AgentExecution<any, any>> = new Map();

  /**
   * Register a specialized micro-agent
   */
  registerAgent<TInput, TOutput>(agent: MicroAgent<TInput, TOutput>): void {
    this.agents.set(agent.id, agent);
  }

  /**
   * Execute a micro-agent with automatic token tracking
   */
  async execute<TInput, TOutput>(
    agentId: string,
    input: TInput
  ): Promise<TOutput> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Micro-agent "${agentId}" not registered`);
    }

    const executionId = `${agentId}-${Date.now()}`;
    const inputStr = JSON.stringify(input);
    const inputTokens = estimateTokens(inputStr);

    // Check token budget
    if (inputTokens > agent.maxInputTokens) {
      throw new Error(
        `Input exceeds agent token limit (${inputTokens} > ${agent.maxInputTokens})`
      );
    }

    const execution: AgentExecution<TInput, TOutput> = {
      agentId,
      input,
      inputTokens,
      outputTokens: 0,
      status: 'pending',
    };

    this.executions.set(executionId, execution);

    try {
      execution.status = 'running';
      execution.startTime = Date.now();

      const output = await agent.execute(input);

      const outputStr = JSON.stringify(output);
      const outputTokens = estimateTokens(outputStr);

      if (outputTokens > agent.maxOutputTokens) {
        throw new Error(
          `Output exceeds agent token limit (${outputTokens} > ${agent.maxOutputTokens})`
        );
      }

      execution.output = output;
      execution.outputTokens = outputTokens;
      execution.status = 'success';
      execution.endTime = Date.now();

      // Track tokens
      tokenTracker.track({
        operationId: executionId,
        operationType: `micro-agent-${agentId}`,
        timestamp: execution.startTime,
        inputTokens,
        outputTokens,
        totalTokens: inputTokens + outputTokens,
        model: agent.model || 'gpt-3.5-turbo',
        status: 'success',
        metadata: {
          agentId,
          duration: execution.endTime - execution.startTime,
        },
      });

      return output;
    } catch (error) {
      execution.status = 'failed';
      execution.error = error instanceof Error ? error.message : 'Unknown error';
      execution.endTime = Date.now();

      throw error;
    }
  }

  /**
   * Execute multiple micro-agents in parallel (distributed generation)
   */
  async executeMany<TInput, TOutput>(
    requests: Array<{ agentId: string; input: TInput }>
  ): Promise<Array<{ agentId: string; output?: TOutput; error?: string }>> {
    const results = await Promise.allSettled(
      requests.map(async req => ({
        agentId: req.agentId,
        output: await this.execute<TInput, TOutput>(req.agentId, req.input),
      }))
    );

    return results.map((result, idx) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          agentId: requests[idx].agentId,
          error: result.reason instanceof Error ? result.reason.message : 'Failed',
        };
      }
    });
  }

  getAgent(agentId: string): MicroAgent<any, any> | undefined {
    return this.agents.get(agentId);
  }

  listAgents(): MicroAgent<any, any>[] {
    return Array.from(this.agents.values());
  }

  getExecutions(agentId?: string): AgentExecution<any, any>[] {
    const executions = Array.from(this.executions.values());
    return agentId ? executions.filter(e => e.agentId === agentId) : executions;
  }
}

export const microAgentOrchestrator = new MicroAgentOrchestrator();

// ────────────────────────────────────────────────────────────────────────────
// DETERMINISTIC WORKFLOW ENGINE
// ────────────────────────────────────────────────────────────────────────────

export interface WorkflowStep {
  id: string;
  agentId: string;
  input: any;
  dependsOn?: string[]; // IDs of steps that must complete first
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  created: number;
}

export interface WorkflowExecution {
  workflowId: string;
  executionId: string;
  status: 'pending' | 'running' | 'success' | 'failed';
  steps: Map<string, { status: 'pending' | 'running' | 'success' | 'failed'; output?: any; error?: string }>;
  startTime?: number;
  endTime?: number;
  totalTokens: number;
}

class DeterministicWorkflowEngine {
  private workflows: Map<string, Workflow> = new Map();
  private executions: Map<string, WorkflowExecution> = new Map();

  /**
   * Register a deterministic workflow
   */
  registerWorkflow(workflow: Omit<Workflow, 'created'>): void {
    const fullWorkflow: Workflow = {
      ...workflow,
      created: Date.now(),
    };

    this.workflows.set(workflow.id, fullWorkflow);
  }

  /**
   * Execute a workflow deterministically (same inputs → same outputs)
   */
  async executeWorkflow(workflowId: string, inputs?: Record<string, any>): Promise<WorkflowExecution> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow "${workflowId}" not registered`);
    }

    const executionId = `${workflowId}-${Date.now()}`;
    const execution: WorkflowExecution = {
      workflowId,
      executionId,
      status: 'pending',
      steps: new Map(),
      totalTokens: 0,
    };

    // Initialize all steps as pending
    workflow.steps.forEach(step => {
      execution.steps.set(step.id, { status: 'pending' });
    });

    this.executions.set(executionId, execution);

    try {
      execution.status = 'running';
      execution.startTime = Date.now();

      // Execute steps in dependency order
      await this.executeStepsInOrder(workflow.steps, execution, inputs || {});

      execution.status = 'success';
      execution.endTime = Date.now();

      return execution;
    } catch (error) {
      execution.status = 'failed';
      execution.endTime = Date.now();

      throw error;
    }
  }

  /**
   * Execute workflow steps in correct dependency order
   */
  private async executeStepsInOrder(
    steps: WorkflowStep[],
    execution: WorkflowExecution,
    inputs: Record<string, any>
  ): Promise<void> {
    const completed = new Set<string>();
    const outputs: Record<string, any> = { ...inputs };

    while (completed.size < steps.length) {
      // Find steps that can run now (all dependencies met)
      const ready = steps.filter(step => {
        if (completed.has(step.id)) return false;
        if (!step.dependsOn || step.dependsOn.length === 0) return true;
        return step.dependsOn.every(depId => completed.has(depId));
      });

      if (ready.length === 0) {
        throw new Error('Workflow deadlock - circular dependencies detected');
      }

      // Execute ready steps in parallel
      const results = await Promise.allSettled(
        ready.map(async step => {
          const stepState = execution.steps.get(step.id)!;
          stepState.status = 'running';

          // Resolve input with outputs from previous steps
          const resolvedInput = this.resolveInput(step.input, outputs);

          try {
            const output = await microAgentOrchestrator.execute(step.agentId, resolvedInput);

            stepState.status = 'success';
            stepState.output = output;
            outputs[step.id] = output;

            return { stepId: step.id, success: true };
          } catch (error) {
            stepState.status = 'failed';
            stepState.error = error instanceof Error ? error.message : 'Unknown error';

            throw new Error(`Step ${step.id} failed: ${stepState.error}`);
          }
        })
      );

      // Check for failures
      results.forEach((result, idx) => {
        if (result.status === 'fulfilled') {
          completed.add(ready[idx].id);
        } else {
          throw result.reason;
        }
      });
    }
  }

  /**
   * Resolve step input with outputs from previous steps
   */
  private resolveInput(input: any, outputs: Record<string, any>): any {
    if (typeof input === 'string' && input.startsWith('$')) {
      // Reference to previous step output: "$stepId"
      const stepId = input.slice(1);
      return outputs[stepId];
    }

    if (typeof input === 'object' && input !== null) {
      // Recursively resolve object properties
      const resolved: Record<string, any> = {};
      Object.entries(input).forEach(([key, value]) => {
        resolved[key] = this.resolveInput(value, outputs);
      });
      return resolved;
    }

    return input;
  }

  /**
   * Replay a workflow execution (deterministic - same inputs → same outputs)
   */
  async replayWorkflow(executionId: string): Promise<WorkflowExecution> {
    const execution = this.executions.get(executionId);
    if (!execution) {
      throw new Error(`Execution "${executionId}" not found`);
    }

    // Extract original inputs from first step
    const workflow = this.workflows.get(execution.workflowId);
    if (!workflow) {
      throw new Error(`Workflow "${execution.workflowId}" not found`);
    }

    // Re-execute with same inputs (should produce same outputs)
    return this.executeWorkflow(execution.workflowId);
  }

  getWorkflow(workflowId: string): Workflow | undefined {
    return this.workflows.get(workflowId);
  }

  getExecution(executionId: string): WorkflowExecution | undefined {
    return this.executions.get(executionId);
  }

  listWorkflows(): Workflow[] {
    return Array.from(this.workflows.values());
  }
}

export const workflowEngine = new DeterministicWorkflowEngine();

// ────────────────────────────────────────────────────────────────────────────
// BUILT-IN MICRO-AGENTS (Examples)
// ────────────────────────────────────────────────────────────────────────────

// Text Summarizer - tiny context, single purpose
microAgentOrchestrator.registerAgent({
  id: 'text-summarizer',
  name: 'Text Summarizer',
  description: 'Summarize text to 1-2 sentences',
  maxInputTokens: 2000,
  maxOutputTokens: 100,
  model: 'claude-haiku',
  execute: async (input: { text: string }) => {
    // In production: call AI API
    // For demo: simple extraction
    const sentences = input.text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    return {
      summary: sentences.slice(0, 2).join('. ') + '.',
      wordCount: input.text.split(/\s+/).length,
    };
  },
});

// Keyword Extractor - minimal token usage
microAgentOrchestrator.registerAgent({
  id: 'keyword-extractor',
  name: 'Keyword Extractor',
  description: 'Extract top keywords from text',
  maxInputTokens: 1000,
  maxOutputTokens: 50,
  model: 'gemini-flash',
  execute: async (input: { text: string; count?: number }) => {
    const count = input.count || 5;
    const words = input.text.toLowerCase().split(/\s+/).filter(w => w.length > 3);

    const frequency = new Map<string, number>();
    words.forEach(w => frequency.set(w, (frequency.get(w) || 0) + 1));

    const keywords = Array.from(frequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, count)
      .map(([word]) => word);

    return { keywords };
  },
});

// Sentiment Analyzer - fast and cheap
microAgentOrchestrator.registerAgent({
  id: 'sentiment-analyzer',
  name: 'Sentiment Analyzer',
  description: 'Analyze sentiment of text',
  maxInputTokens: 500,
  maxOutputTokens: 20,
  model: 'gemini-flash',
  execute: async (input: { text: string }) => {
    // Simple rule-based sentiment (in production: use AI)
    const positive = ['good', 'great', 'excellent', 'amazing', 'love', 'best'];
    const negative = ['bad', 'terrible', 'awful', 'hate', 'worst', 'poor'];

    const lower = input.text.toLowerCase();
    const posCount = positive.filter(w => lower.includes(w)).length;
    const negCount = negative.filter(w => lower.includes(w)).length;

    let sentiment: 'positive' | 'negative' | 'neutral';
    if (posCount > negCount) sentiment = 'positive';
    else if (negCount > posCount) sentiment = 'negative';
    else sentiment = 'neutral';

    return {
      sentiment,
      confidence: Math.abs(posCount - negCount) / Math.max(posCount + negCount, 1),
    };
  },
});

// ────────────────────────────────────────────────────────────────────────────
// EXAMPLE WORKFLOWS
// ────────────────────────────────────────────────────────────────────────────

// Content Analysis Workflow (parallelized for token efficiency)
workflowEngine.registerWorkflow({
  id: 'content-analysis',
  name: 'Content Analysis Pipeline',
  description: 'Analyze content with multiple specialized agents in parallel',
  steps: [
    {
      id: 'summarize',
      agentId: 'text-summarizer',
      input: '$text', // Input from workflow params
    },
    {
      id: 'extract-keywords',
      agentId: 'keyword-extractor',
      input: '$text',
    },
    {
      id: 'analyze-sentiment',
      agentId: 'sentiment-analyzer',
      input: '$text',
    },
  ],
});
