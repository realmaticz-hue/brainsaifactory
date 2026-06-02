// =============================================================================
// AI PROVIDER ABSTRACTION — Multi-Provider AI Integration
// =============================================================================
//
// Supports: OpenAI, Claude (Anthropic), Gemini (Google)
// Features:
//   • Automatic provider selection based on task & budget
//   • Fallback handling (if one fails, try another)
//   • Cost optimization (use cheapest suitable model)
//   • Token tracking integration
//   • Rate limit handling
//   • Streaming support
//
// =============================================================================

import { tokenTracker, estimateTokens } from '../tokenEfficiency/tokenTracker';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type AIModel =
  // OpenAI
  | 'gpt-4' | 'gpt-4-turbo' | 'gpt-3.5-turbo'
  // Anthropic Claude
  | 'claude-opus' | 'claude-sonnet' | 'claude-haiku'
  // Google Gemini
  | 'gemini-pro' | 'gemini-flash';

export type TaskComplexity = 'simple' | 'medium' | 'complex';

export interface AIRequest {
  prompt: string;
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
  model?: AIModel; // Optional: specify model or let it auto-select
  stream?: boolean;
}

export interface AIResponse {
  content: string;
  model: AIModel;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cost: number;
  provider: 'openai' | 'anthropic' | 'google';
  cached?: boolean;
}

export interface AIProviderConfig {
  apiKey: string;
  enabled: boolean;
  priority?: number; // Lower = higher priority
  maxRetries?: number;
}

export interface AIConfig {
  openai?: AIProviderConfig;
  anthropic?: AIProviderConfig;
  google?: AIProviderConfig;

  // Global settings
  autoSelectProvider?: boolean; // Default: true
  preferCheapest?: boolean; // Default: true
  fallbackEnabled?: boolean; // Default: true
}

// ─────────────────────────────────────────────────────────────────────────────
// MODEL CAPABILITIES & PRICING
// ─────────────────────────────────────────────────────────────────────────────

const MODEL_INFO: Record<AIModel, {
  provider: 'openai' | 'anthropic' | 'google';
  maxTokens: number;
  inputPricePer1M: number;
  outputPricePer1M: number;
  complexity: TaskComplexity[];
  speed: 'fast' | 'medium' | 'slow';
}> = {
  // OpenAI
  'gpt-4': {
    provider: 'openai',
    maxTokens: 8192,
    inputPricePer1M: 30,
    outputPricePer1M: 60,
    complexity: ['complex'],
    speed: 'slow',
  },
  'gpt-4-turbo': {
    provider: 'openai',
    maxTokens: 128000,
    inputPricePer1M: 10,
    outputPricePer1M: 30,
    complexity: ['medium', 'complex'],
    speed: 'medium',
  },
  'gpt-3.5-turbo': {
    provider: 'openai',
    maxTokens: 16384,
    inputPricePer1M: 0.5,
    outputPricePer1M: 1.5,
    complexity: ['simple', 'medium'],
    speed: 'fast',
  },

  // Anthropic Claude
  'claude-opus': {
    provider: 'anthropic',
    maxTokens: 200000,
    inputPricePer1M: 15,
    outputPricePer1M: 75,
    complexity: ['complex'],
    speed: 'slow',
  },
  'claude-sonnet': {
    provider: 'anthropic',
    maxTokens: 200000,
    inputPricePer1M: 3,
    outputPricePer1M: 15,
    complexity: ['medium', 'complex'],
    speed: 'medium',
  },
  'claude-haiku': {
    provider: 'anthropic',
    maxTokens: 200000,
    inputPricePer1M: 0.25,
    outputPricePer1M: 1.25,
    complexity: ['simple', 'medium'],
    speed: 'fast',
  },

  // Google Gemini
  'gemini-pro': {
    provider: 'google',
    maxTokens: 32768,
    inputPricePer1M: 0.5,
    outputPricePer1M: 1.5,
    complexity: ['medium', 'complex'],
    speed: 'fast',
  },
  'gemini-flash': {
    provider: 'google',
    maxTokens: 32768,
    inputPricePer1M: 0.075,
    outputPricePer1M: 0.3,
    complexity: ['simple', 'medium'],
    speed: 'fast',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// AI PROVIDER CLASS
// ─────────────────────────────────────────────────────────────────────────────

class AIProvider {
  private config: AIConfig = {
    autoSelectProvider: true,
    preferCheapest: true,
    fallbackEnabled: true,
  };

  constructor() {
    this.loadConfig();
  }

  // ───────────────────────────────────────────────────────────────────────────
  // CONFIGURATION
  // ───────────────────────────────────────────────────────────────────────────

  configure(p0: string, savedOpenAI: string, config: Partial<AIConfig>): void {
    this.config = { ...this.config, ...config };
    this.saveConfig();
  }

  getConfig(): AIConfig {
    return { ...this.config };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // MAIN API
  // ───────────────────────────────────────────────────────────────────────────

  /**
   * Generate AI content with automatic provider selection
   */
  async generate(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now();

    // 1. Select optimal model
    const model = request.model || this.selectOptimalModel(request);

    // 2. Check token budget
    const inputTokens = estimateTokens(request.prompt + (request.systemPrompt || ''));
    const prediction = tokenTracker.predictUsage(
      'ai-generation',
      inputTokens,
      model
    );

    if (!prediction.allowed) {
      throw new Error(`Token budget exceeded: ${prediction.reason}`);
    }

    // 3. Call provider with fallback
    let lastError: Error | null = null;
    const providers = this.getProviderFallbackChain(model);

    for (const providerModel of providers) {
      try {
        const response = await this.callProvider(providerModel, request);

        // 4. Track token usage
        tokenTracker.track({
          operationId: `ai-gen-${Date.now()}`,
          operationType: 'ai-generation',
          timestamp: startTime,
          inputTokens: response.inputTokens,
          outputTokens: response.outputTokens,
          totalTokens: response.totalTokens,
          model: response.model,
          status: 'success',
          metadata: {
            provider: response.provider,
            duration: Date.now() - startTime,
          },
        });

        return response;
      } catch (error) {
        lastError = error as Error;
        console.warn(`[AIProvider] ${providerModel} failed:`, error);

        if (!this.config.fallbackEnabled) {
          throw error;
        }
        // Continue to next provider in fallback chain
      }
    }

    throw lastError || new Error('All AI providers failed');
  }

  /**
   * Stream AI content (for real-time display)
   */
  async *generateStream(request: AIRequest): AsyncGenerator<string, AIResponse> {
    const model = request.model || this.selectOptimalModel(request);
    const provider = MODEL_INFO[model].provider;

    // Note: Streaming implementation would go here
    // For now, fall back to regular generation
    const response = await this.generate({ ...request, stream: false });
    yield response.content;
    return response;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // MODEL SELECTION
  // ───────────────────────────────────────────────────────────────────────────

  /**
   * Select optimal model based on task complexity and budget
   */
  selectOptimalModel(request: AIRequest): AIModel {
    const complexity = this.estimateComplexity(request);
    const inputTokens = estimateTokens(request.prompt + (request.systemPrompt || ''));

    // Find suitable models
    const suitableModels = (Object.entries(MODEL_INFO) as [AIModel, typeof MODEL_INFO[AIModel]][])
      .filter(([_, info]) => {
        // Must support this complexity
        if (!info.complexity.includes(complexity)) return false;

        // Must have enough token capacity
        if (inputTokens > info.maxTokens * 0.7) return false; // 70% safety margin

        // Must have enabled provider
        const providerConfig = this.config[info.provider];
        if (!providerConfig?.enabled) return false;

        return true;
      });

    if (suitableModels.length === 0) {
      throw new Error('No suitable AI model available for this task');
    }

    // Sort by cost (if preferCheapest) or by priority
    if (this.config.preferCheapest) {
      suitableModels.sort((a, b) => {
        const costA = a[1].inputPricePer1M + a[1].outputPricePer1M;
        const costB = b[1].inputPricePer1M + b[1].outputPricePer1M;
        return costA - costB;
      });
    } else {
      suitableModels.sort((a, b) => {
        const priorityA = this.config[a[1].provider]?.priority || 99;
        const priorityB = this.config[b[1].provider]?.priority || 99;
        return priorityA - priorityB;
      });
    }

    return suitableModels[0][0];
  }

  /**
   * Estimate task complexity from request
   */
  private estimateComplexity(request: AIRequest): TaskComplexity {
    const promptLength = request.prompt.length;
    const hasSystemPrompt = !!request.systemPrompt;
    const requestsLongOutput = (request.maxTokens || 0) > 1000;

    // Simple heuristics
    if (promptLength > 2000 || requestsLongOutput) return 'complex';
    if (promptLength > 500 || hasSystemPrompt) return 'medium';
    return 'simple';
  }

  /**
   * Get fallback chain for a model
   */
  private getProviderFallbackChain(primaryModel: AIModel): AIModel[] {
    if (!this.config.fallbackEnabled) {
      return [primaryModel];
    }

    const chain: AIModel[] = [primaryModel];
    const primaryInfo = MODEL_INFO[primaryModel];

    // Find fallbacks with same complexity from different providers
    const fallbacks = (Object.entries(MODEL_INFO) as [AIModel, typeof MODEL_INFO[AIModel]][])
      .filter(([model, info]) =>
        model !== primaryModel &&
        info.complexity.some(c => primaryInfo.complexity.includes(c)) &&
        this.config[info.provider]?.enabled
      )
      .sort((a, b) => {
        const costA = a[1].inputPricePer1M + a[1].outputPricePer1M;
        const costB = b[1].inputPricePer1M + b[1].outputPricePer1M;
        return costA - costB;
      })
      .slice(0, 2) // Max 2 fallbacks
      .map(([model]) => model);

    return [...chain, ...fallbacks];
  }

  // ───────────────────────────────────────────────────────────────────────────
  // PROVIDER IMPLEMENTATIONS
  // ───────────────────────────────────────────────────────────────────────────

  private async callProvider(model: AIModel, request: AIRequest): Promise<AIResponse> {
    const info = MODEL_INFO[model];
    const provider = info.provider;

    switch (provider) {
      case 'openai':
        return this.callOpenAI(model, request);
      case 'anthropic':
        return this.callAnthropic(model, request);
      case 'google':
        return this.callGoogle(model, request);
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  }

  private async callOpenAI(model: AIModel, request: AIRequest): Promise<AIResponse> {
    const config = this.config.openai;
    if (!config?.enabled || !config.apiKey) {
      throw new Error('OpenAI provider not configured');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: model,
        messages: [
          ...(request.systemPrompt ? [{ role: 'system', content: request.systemPrompt }] : []),
          { role: 'user', content: request.prompt },
        ],
        max_tokens: request.maxTokens || 2000,
        temperature: request.temperature ?? 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const usage = data.usage;
    const info = MODEL_INFO[model];

    return {
      content: data.choices[0].message.content,
      model,
      inputTokens: usage.prompt_tokens,
      outputTokens: usage.completion_tokens,
      totalTokens: usage.total_tokens,
      cost: (usage.prompt_tokens / 1_000_000) * info.inputPricePer1M +
        (usage.completion_tokens / 1_000_000) * info.outputPricePer1M,
      provider: 'openai',
    };
  }

  private async callAnthropic(model: AIModel, request: AIRequest): Promise<AIResponse> {
    const config = this.config.anthropic;
    if (!config?.enabled || !config.apiKey) {
      throw new Error('Anthropic provider not configured');
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: model,
        max_tokens: request.maxTokens || 2000,
        system: request.systemPrompt,
        messages: [
          { role: 'user', content: request.prompt },
        ],
        temperature: request.temperature ?? 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Anthropic API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const usage = data.usage;
    const info = MODEL_INFO[model];

    return {
      content: data.content[0].text,
      model,
      inputTokens: usage.input_tokens,
      outputTokens: usage.output_tokens,
      totalTokens: usage.input_tokens + usage.output_tokens,
      cost: (usage.input_tokens / 1_000_000) * info.inputPricePer1M +
        (usage.output_tokens / 1_000_000) * info.outputPricePer1M,
      provider: 'anthropic',
    };
  }

  private async callGoogle(model: AIModel, request: AIRequest): Promise<AIResponse> {
    const config = this.config.google;
    if (!config?.enabled || !config.apiKey) {
      throw new Error('Google provider not configured');
    }

    const modelName = model === 'gemini-pro' ? 'gemini-1.5-pro' : 'gemini-1.5-flash';

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${config.apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: request.systemPrompt
                ? `${request.systemPrompt}\n\n${request.prompt}`
                : request.prompt
            }]
          }],
          generationConfig: {
            temperature: request.temperature ?? 0.7,
            maxOutputTokens: request.maxTokens || 2000,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Google API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const content = data.candidates[0].content.parts[0].text;

    // Estimate tokens (Google doesn't always return exact counts)
    const inputTokens = estimateTokens(request.prompt + (request.systemPrompt || ''));
    const outputTokens = estimateTokens(content);
    const info = MODEL_INFO[model];

    return {
      content,
      model,
      inputTokens,
      outputTokens,
      totalTokens: inputTokens + outputTokens,
      cost: (inputTokens / 1_000_000) * info.inputPricePer1M +
        (outputTokens / 1_000_000) * info.outputPricePer1M,
      provider: 'google',
    };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // UTILITY
  // ───────────────────────────────────────────────────────────────────────────

  getAvailableModels(): AIModel[] {
    return (Object.entries(MODEL_INFO) as [AIModel, typeof MODEL_INFO[AIModel]][])
      .filter(([_, info]) => this.config[info.provider]?.enabled)
      .map(([model]) => model);
  }

  getModelInfo(model: AIModel) {
    return MODEL_INFO[model];
  }

  estimateCost(model: AIModel, inputTokens: number, outputTokens: number): number {
    const info = MODEL_INFO[model];
    return (inputTokens / 1_000_000) * info.inputPricePer1M +
      (outputTokens / 1_000_000) * info.outputPricePer1M;
  }

  private loadConfig(): void {
    try {
      const stored = localStorage.getItem('aiProviderConfig');
      if (stored) {
        this.config = { ...this.config, ...JSON.parse(stored) };
      }
    } catch (err) {
      console.warn('[AIProvider] Failed to load config:', err);
    }
  }

  private saveConfig(): void {
    try {
      localStorage.setItem('aiProviderConfig', JSON.stringify(this.config));
    } catch (err) {
      console.warn('[AIProvider] Failed to save config:', err);
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SINGLETON INSTANCE
// ─────────────────────────────────────────────────────────────────────────────

export const aiProvider = new AIProvider();

// ─────────────────────────────────────────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Quick helper for simple AI generation
 */
export async function generateAI(prompt: string, options?: Partial<AIRequest>): Promise<string> {
  const response = await aiProvider.generate({
    prompt,
    ...options,
  });
  return response.content;
}

/**
 * Check if any AI provider is configured
 */
export function isAIConfigured(): boolean {
  const config = aiProvider.getConfig();
  return !!(
    (config.openai?.enabled && config.openai?.apiKey) ||
    (config.anthropic?.enabled && config.anthropic?.apiKey) ||
    (config.google?.enabled && config.google?.apiKey)
  );
}
