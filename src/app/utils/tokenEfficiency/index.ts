// =============================================================================
// TOKEN EFFICIENCY ARCHITECTURE — Main Export
// =============================================================================

// Token Tracker
export {
  tokenTracker,
  estimateTokens,
  trackOperation,
  type TokenUsage,
  type TokenBudget,
  type TokenStats,
} from './tokenTracker';

// Projection State
export {
  projectionState,
  type ProjectionConfig,
  type Projection,
  type StateSnapshot,
} from './projectionState';

// Enterprise AI Components
export {
  semanticRetriever,
  microAgentOrchestrator,
  workflowEngine,
  type SemanticChunk,
  type RetrievalQuery,
  type MicroAgent,
  type AgentExecution,
  type WorkflowStep,
  type Workflow,
  type WorkflowExecution,
} from './enterpriseAI';

// =============================================================================
// QUICK START GUIDE
// =============================================================================

/**
 * Example 1: Track token usage for an operation
 *
 * ```typescript
 * import { trackOperation } from './utils/tokenEfficiency';
 *
 * const result = await trackOperation(
 *   'blog-generation',
 *   'claude-sonnet',
 *   inputText,
 *   async () => await generateBlog(inputText)
 * );
 * ```
 */

/**
 * Example 2: Store minimal state with projections
 *
 * ```typescript
 * import { projectionState } from './utils/tokenEfficiency';
 *
 * // Store minimal entity
 * projectionState.storeEntity({
 *   entityId: 'blog-123',
 *   type: 'blog-post',
 *   data: { content: '...' },
 * });
 *
 * // Compute view on-demand
 * const metadata = projectionState.project('blog-metadata', 'blog-123');
 * ```
 */

/**
 * Example 3: Semantic retrieval
 *
 * ```typescript
 * import { semanticRetriever } from './utils/tokenEfficiency';
 *
 * // Retrieve relevant context within token budget
 * const chunks = semanticRetriever.retrieve({
 *   query: 'SEO optimization tips',
 *   maxTokens: 2000,
 * });
 * ```
 */

/**
 * Example 4: Execute micro-agent
 *
 * ```typescript
 * import { microAgentOrchestrator } from './utils/tokenEfficiency';
 *
 * const result = await microAgentOrchestrator.execute('text-summarizer', {
 *   text: blogPost,
 * });
 * ```
 */

/**
 * Example 5: Run deterministic workflow
 *
 * ```typescript
 * import { workflowEngine } from './utils/tokenEfficiency';
 *
 * const execution = await workflowEngine.executeWorkflow('content-analysis', {
 *   text: blogPost,
 * });
 * ```
 */
