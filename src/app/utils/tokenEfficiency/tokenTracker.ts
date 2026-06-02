// =============================================================================
// TOKEN TRACKER — Real-Time Token Usage Monitoring & Budget Enforcement
// =============================================================================
//
// Enterprise-scale token efficiency monitoring system that prevents token explosion
// by tracking, analyzing, and optimizing token consumption across all AI operations.
//
// Key Features:
//   • Real-time token consumption tracking
//   • Budget enforcement with hard limits
//   • Per-operation token analytics
//   • Token cost prediction
//   • Usage optimization suggestions
//   • Historical trend analysis
//
// =============================================================================

export interface TokenUsage {
  operationId: string;
  operationType: string;
  timestamp: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cost: number; // In USD
  model: string;
  status: 'success' | 'failed' | 'rejected';
  metadata?: Record<string, any>;
}

export interface TokenBudget {
  maxTokensPerOperation: number;
  maxTokensPerHour: number;
  maxTokensPerDay: number;
  maxCostPerOperation: number;
  maxCostPerHour: number;
  maxCostPerDay: number;
  alertThresholds: {
    tokens: number; // Alert when % of budget used
    cost: number;
  };
}

export interface TokenStats {
  totalTokens: number;
  totalCost: number;
  operationCount: number;
  averageTokensPerOp: number;
  averageCostPerOp: number;
  hourlyUsage: number;
  dailyUsage: number;
  topConsumers: Array<{ operation: string; tokens: number; cost: number }>;
  efficiency: number; // 0-100 score
}

// Token pricing per 1M tokens (as of 2026)
const TOKEN_PRICING: Record<string, { input: number; output: number }> = {
  'gpt-4': { input: 30, output: 60 },
  'gpt-4-turbo': { input: 10, output: 30 },
  'gpt-3.5-turbo': { input: 0.5, output: 1.5 },
  'claude-opus': { input: 15, output: 75 },
  'claude-sonnet': { input: 3, output: 15 },
  'claude-haiku': { input: 0.25, output: 1.25 },
  'gemini-pro': { input: 0.5, output: 1.5 },
  'gemini-flash': { input: 0.075, output: 0.3 },
};

class TokenTracker {
  private usageHistory: TokenUsage[] = [];
  private budget: TokenBudget;
  private listeners: Set<(stats: TokenStats) => void> = new Set();

  constructor() {
    // Default budget - can be customized
    this.budget = {
      maxTokensPerOperation: 50000, // 50K tokens per operation
      maxTokensPerHour: 500000, // 500K tokens per hour
      maxTokensPerDay: 5000000, // 5M tokens per day
      maxCostPerOperation: 1.0, // $1 per operation
      maxCostPerHour: 10.0, // $10 per hour
      maxCostPerDay: 100.0, // $100 per day
      alertThresholds: {
        tokens: 80, // Alert at 80% usage
        cost: 80,
      },
    };

    // Load from localStorage if available
    this.loadHistory();
  }

  // ────────────────────────────────────────────────────────────────────────────
  // BUDGET MANAGEMENT
  // ────────────────────────────────────────────────────────────────────────────

  setBudget(budget: Partial<TokenBudget>): void {
    this.budget = { ...this.budget, ...budget };
    this.saveToStorage();
  }

  getBudget(): TokenBudget {
    return { ...this.budget };
  }

  // ────────────────────────────────────────────────────────────────────────────
  // TOKEN TRACKING
  // ────────────────────────────────────────────────────────────────────────────

  /**
   * Track token usage for an operation
   * Returns false if budget exceeded (operation should be rejected)
   */
  track(usage: Omit<TokenUsage, 'cost'>): boolean {
    const cost = this.calculateCost(
      usage.inputTokens,
      usage.outputTokens,
      usage.model
    );

    const fullUsage: TokenUsage = { ...usage, cost };

    // Check budget BEFORE recording
    const budgetCheck = this.checkBudget(fullUsage);
    if (!budgetCheck.allowed) {
      console.warn('[TokenTracker] Budget exceeded:', budgetCheck.reason);
      this.usageHistory.push({ ...fullUsage, status: 'rejected' });
      this.notifyListeners();
      return false;
    }

    // Record usage
    this.usageHistory.push(fullUsage);
    this.pruneOldEntries();
    this.saveToStorage();
    this.notifyListeners();

    // Check for alerts
    this.checkAlerts();

    return true;
  }

  /**
   * Predict token usage for an operation before executing
   */
  predictUsage(
    operationType: string,
    estimatedInputTokens: number,
    model: string
  ): {
    allowed: boolean;
    estimatedCost: number;
    reason?: string;
  } {
    // Estimate output tokens based on historical data
    const avgRatio = this.getAverageOutputRatio(operationType, model);
    const estimatedOutputTokens = Math.round(estimatedInputTokens * avgRatio);
    const estimatedCost = this.calculateCost(
      estimatedInputTokens,
      estimatedOutputTokens,
      model
    );

    const dummyUsage: TokenUsage = {
      operationId: 'prediction',
      operationType,
      timestamp: Date.now(),
      inputTokens: estimatedInputTokens,
      outputTokens: estimatedOutputTokens,
      totalTokens: estimatedInputTokens + estimatedOutputTokens,
      cost: estimatedCost,
      model,
      status: 'success',
    };

    const check = this.checkBudget(dummyUsage);
    return {
      allowed: check.allowed,
      estimatedCost,
      reason: check.reason,
    };
  }

  // ────────────────────────────────────────────────────────────────────────────
  // STATISTICS & ANALYTICS
  // ────────────────────────────────────────────────────────────────────────────

  getStats(): TokenStats {
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;
    const oneDayAgo = now - 24 * 60 * 60 * 1000;

    const successfulOps = this.usageHistory.filter(u => u.status === 'success');
    const hourlyOps = successfulOps.filter(u => u.timestamp > oneHourAgo);
    const dailyOps = successfulOps.filter(u => u.timestamp > oneDayAgo);

    const totalTokens = successfulOps.reduce((sum, u) => sum + u.totalTokens, 0);
    const totalCost = successfulOps.reduce((sum, u) => sum + u.cost, 0);

    // Calculate top consumers
    const consumerMap = new Map<string, { tokens: number; cost: number }>();
    successfulOps.forEach(u => {
      const existing = consumerMap.get(u.operationType) || { tokens: 0, cost: 0 };
      consumerMap.set(u.operationType, {
        tokens: existing.tokens + u.totalTokens,
        cost: existing.cost + u.cost,
      });
    });

    const topConsumers = Array.from(consumerMap.entries())
      .map(([operation, stats]) => ({ operation, ...stats }))
      .sort((a, b) => b.tokens - a.tokens)
      .slice(0, 10);

    // Calculate efficiency score (0-100)
    // Based on: rejection rate, average tokens per op, cost efficiency
    const rejectionRate =
      this.usageHistory.filter(u => u.status === 'rejected').length /
      Math.max(this.usageHistory.length, 1);
    const avgTokens = totalTokens / Math.max(successfulOps.length, 1);
    const tokenEfficiency = Math.max(0, 100 - (avgTokens / 1000) * 10); // Penalty for high avg
    const costEfficiency = Math.max(0, 100 - totalCost * 10); // Penalty for high cost
    const efficiency = Math.round(
      (1 - rejectionRate) * 40 + tokenEfficiency * 0.3 + costEfficiency * 0.3
    );

    return {
      totalTokens,
      totalCost,
      operationCount: successfulOps.length,
      averageTokensPerOp: avgTokens,
      averageCostPerOp: totalCost / Math.max(successfulOps.length, 1),
      hourlyUsage: hourlyOps.reduce((sum, u) => sum + u.totalTokens, 0),
      dailyUsage: dailyOps.reduce((sum, u) => sum + u.totalTokens, 0),
      topConsumers,
      efficiency,
    };
  }

  getUsageHistory(limit?: number): TokenUsage[] {
    return limit
      ? this.usageHistory.slice(-limit)
      : [...this.usageHistory];
  }

  clearHistory(): void {
    this.usageHistory = [];
    this.saveToStorage();
    this.notifyListeners();
  }

  // ────────────────────────────────────────────────────────────────────────────
  // OPTIMIZATION SUGGESTIONS
  // ────────────────────────────────────────────────────────────────────────────

  getOptimizationSuggestions(): string[] {
    const stats = this.getStats();
    const suggestions: string[] = [];

    // High token usage per operation
    if (stats.averageTokensPerOp > 10000) {
      suggestions.push(
        '🔴 HIGH TOKEN USAGE: Average tokens per operation exceeds 10K. ' +
        'Consider using smaller models (Haiku/Flash) or implementing context pruning.'
      );
    }

    // Expensive operations
    if (stats.averageCostPerOp > 0.1) {
      suggestions.push(
        '💰 HIGH COST: Average cost per operation > $0.10. ' +
        'Switch to cheaper models (Claude Haiku, Gemini Flash) for simple tasks.'
      );
    }

    // Top consumers analysis
    const topConsumer = stats.topConsumers[0];
    if (topConsumer && topConsumer.tokens > stats.totalTokens * 0.5) {
      suggestions.push(
        `⚠️ HOTSPOT: "${topConsumer.operation}" consumes ${Math.round(
          (topConsumer.tokens / stats.totalTokens) * 100
        )}% of all tokens. Optimize this operation first.`
      );
    }

    // Low efficiency
    if (stats.efficiency < 50) {
      suggestions.push(
        '📉 LOW EFFICIENCY: Token efficiency score below 50%. ' +
        'Review rejected operations and implement better budget controls.'
      );
    }

    // Approaching budget limits
    const hourlyPercent = (stats.hourlyUsage / this.budget.maxTokensPerHour) * 100;
    if (hourlyPercent > 80) {
      suggestions.push(
        `🚨 BUDGET ALERT: ${hourlyPercent.toFixed(0)}% of hourly token budget used. ` +
        'Increase budget or reduce operation frequency.'
      );
    }

    if (suggestions.length === 0) {
      suggestions.push('✅ Token usage is optimal. No suggestions at this time.');
    }

    return suggestions;
  }

  // ────────────────────────────────────────────────────────────────────────────
  // INTERNAL HELPERS
  // ────────────────────────────────────────────────────────────────────────────

  private calculateCost(
    inputTokens: number,
    outputTokens: number,
    model: string
  ): number {
    const pricing = TOKEN_PRICING[model] || TOKEN_PRICING['gpt-3.5-turbo'];
    const inputCost = (inputTokens / 1_000_000) * pricing.input;
    const outputCost = (outputTokens / 1_000_000) * pricing.output;
    return inputCost + outputCost;
  }

  private checkBudget(usage: TokenUsage): { allowed: boolean; reason?: string } {
    // Check per-operation limits
    if (usage.totalTokens > this.budget.maxTokensPerOperation) {
      return {
        allowed: false,
        reason: `Operation exceeds max tokens (${usage.totalTokens} > ${this.budget.maxTokensPerOperation})`,
      };
    }

    if (usage.cost > this.budget.maxCostPerOperation) {
      return {
        allowed: false,
        reason: `Operation exceeds max cost ($${usage.cost.toFixed(4)} > $${this.budget.maxCostPerOperation})`,
      };
    }

    // Check hourly limits
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;
    const hourlyTokens = this.usageHistory
      .filter(u => u.timestamp > oneHourAgo && u.status === 'success')
      .reduce((sum, u) => sum + u.totalTokens, 0);

    if (hourlyTokens + usage.totalTokens > this.budget.maxTokensPerHour) {
      return {
        allowed: false,
        reason: `Hourly token budget exceeded (${hourlyTokens + usage.totalTokens} > ${this.budget.maxTokensPerHour})`,
      };
    }

    // Check daily limits
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const dailyTokens = this.usageHistory
      .filter(u => u.timestamp > oneDayAgo && u.status === 'success')
      .reduce((sum, u) => sum + u.totalTokens, 0);

    if (dailyTokens + usage.totalTokens > this.budget.maxTokensPerDay) {
      return {
        allowed: false,
        reason: `Daily token budget exceeded (${dailyTokens + usage.totalTokens} > ${this.budget.maxTokensPerDay})`,
      };
    }

    return { allowed: true };
  }

  private getAverageOutputRatio(operationType: string, model: string): number {
    const relevantOps = this.usageHistory.filter(
      u =>
        u.operationType === operationType &&
        u.model === model &&
        u.status === 'success' &&
        u.inputTokens > 0
    );

    if (relevantOps.length === 0) {
      // Default ratios by operation type
      const defaultRatios: Record<string, number> = {
        'blog-generation': 3.0, // Output is ~3x input
        'code-generation': 2.5,
        'chat': 1.5,
        'summary': 0.3,
        'translation': 1.0,
        'analysis': 0.5,
      };
      return defaultRatios[operationType] || 1.5;
    }

    const avgRatio =
      relevantOps.reduce((sum, u) => sum + u.outputTokens / u.inputTokens, 0) /
      relevantOps.length;

    return avgRatio;
  }

  private checkAlerts(): void {
    const stats = this.getStats();

    // Token usage alerts
    const hourlyPercent = (stats.hourlyUsage / this.budget.maxTokensPerHour) * 100;
    if (hourlyPercent >= this.budget.alertThresholds.tokens) {
      console.warn(
        `[TokenTracker] 🚨 ALERT: ${hourlyPercent.toFixed(0)}% of hourly token budget used`
      );
    }

    // Cost alerts
    const hourlyCost = this.usageHistory
      .filter(u => u.timestamp > Date.now() - 60 * 60 * 1000 && u.status === 'success')
      .reduce((sum, u) => sum + u.cost, 0);
    const hourlyCostPercent = (hourlyCost / this.budget.maxCostPerHour) * 100;

    if (hourlyCostPercent >= this.budget.alertThresholds.cost) {
      console.warn(
        `[TokenTracker] 💰 ALERT: ${hourlyCostPercent.toFixed(0)}% of hourly cost budget used ($${hourlyCost.toFixed(2)})`
      );
    }
  }

  private pruneOldEntries(): void {
    // Keep last 7 days of data
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    this.usageHistory = this.usageHistory.filter(u => u.timestamp > sevenDaysAgo);
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(
        'tokenTrackerHistory',
        JSON.stringify({
          history: this.usageHistory.slice(-1000), // Keep last 1000 entries
          budget: this.budget,
        })
      );
    } catch (err) {
      console.warn('[TokenTracker] Failed to save to localStorage:', err);
    }
  }

  private loadHistory(): void {
    try {
      const stored = localStorage.getItem('tokenTrackerHistory');
      if (stored) {
        const data = JSON.parse(stored);
        this.usageHistory = data.history || [];
        this.budget = { ...this.budget, ...data.budget };
      }
    } catch (err) {
      console.warn('[TokenTracker] Failed to load from localStorage:', err);
    }
  }

  // ────────────────────────────────────────────────────────────────────────────
  // EVENT LISTENERS
  // ────────────────────────────────────────────────────────────────────────────

  subscribe(listener: (stats: TokenStats) => void): () => void {
    this.listeners.add(listener);
    // Immediately send current stats
    listener(this.getStats());
    // Return unsubscribe function
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    const stats = this.getStats();
    this.listeners.forEach(listener => listener(stats));
  }
}

// ────────────────────────────────────────────────────────────────────────────
// SINGLETON INSTANCE
// ────────────────────────────────────────────────────────────────────────────

export const tokenTracker = new TokenTracker();

// ────────────────────────────────────────────────────────────────────────────
// HELPER FUNCTIONS
// ────────────────────────────────────────────────────────────────────────────

/**
 * Estimate token count for a string (rough approximation)
 * Rule of thumb: ~4 characters per token for English text
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Helper to track an AI operation with automatic token estimation
 */
export async function trackOperation<T>(
  operationType: string,
  model: string,
  input: string,
  fn: () => Promise<T>
): Promise<T> {
  const inputTokens = estimateTokens(input);

  // Check budget before executing
  const prediction = tokenTracker.predictUsage(operationType, inputTokens, model);
  if (!prediction.allowed) {
    throw new Error(`Operation rejected: ${prediction.reason}`);
  }

  const operationId = `${operationType}-${Date.now()}`;
  const startTime = Date.now();

  try {
    const result = await fn();
    const outputTokens = typeof result === 'string' ? estimateTokens(result) : inputTokens * 1.5;

    // Track successful operation
    tokenTracker.track({
      operationId,
      operationType,
      timestamp: startTime,
      inputTokens,
      outputTokens,
      totalTokens: inputTokens + outputTokens,
      model,
      status: 'success',
      metadata: {
        duration: Date.now() - startTime,
      },
    });

    return result;
  } catch (error) {
    // Track failed operation
    tokenTracker.track({
      operationId,
      operationType,
      timestamp: startTime,
      inputTokens,
      outputTokens: 0,
      totalTokens: inputTokens,
      model,
      status: 'failed',
      metadata: {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    });

    throw error;
  }
}
