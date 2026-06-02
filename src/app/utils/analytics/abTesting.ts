// =============================================================================
// A/B TESTING FRAMEWORK — Variant Testing & Statistical Analysis
// =============================================================================
//
// Complete A/B testing system for blog posts with variant tracking,
// statistical significance calculation, and automatic winner selection.
//
// =============================================================================

import { analyticsTracker } from './analyticsTracker';

// =============================================================================
// TYPES
// =============================================================================

export interface ABTestVariant {
  id: string;
  name: string;
  content: string;
  weight: number; // 0-100, percentage of traffic
  metadata: Record<string, any>;
}

export interface ABTest {
  id: string;
  name: string;
  description?: string;
  variants: ABTestVariant[];
  status: 'draft' | 'running' | 'paused' | 'completed';
  startDate?: number;
  endDate?: number;
  targetMetric: 'clicks' | 'conversions' | 'engagement' | 'shares';
  minimumSampleSize: number;
  confidenceLevel: number; // 0.90, 0.95, 0.99
  winnerId?: string;
  createdAt: number;
  updatedAt: number;
}

export interface VariantMetrics {
  variantId: string;
  impressions: number;
  clicks: number;
  conversions: number;
  shares: number;
  engagement: number;
  conversionRate: number;
  clickThroughRate: number;
  engagementRate: number;
}

export interface ABTestResult {
  testId: string;
  variants: Array<{
    variantId: string;
    metrics: VariantMetrics;
    isWinner: boolean;
    confidenceScore: number;
  }>;
  isSignificant: boolean;
  confidenceLevel: number;
  recommendedAction: string;
  completedAt?: number;
}

// =============================================================================
// A/B TEST MANAGER
// =============================================================================

class ABTestManager {
  private tests: Map<string, ABTest> = new Map();
  private variantAssignments: Map<string, string> = new Map(); // userId/sessionId -> variantId

  constructor() {
    this.loadTests();
  }

  /**
   * Load tests from localStorage
   */
  private loadTests(): void {
    try {
      const stored = localStorage.getItem('ab_tests');
      if (stored) {
        const testsArray = JSON.parse(stored);
        testsArray.forEach((test: ABTest) => {
          this.tests.set(test.id, test);
        });
      }
    } catch (error) {
      console.error('[ABTest] Failed to load tests:', error);
    }
  }

  /**
   * Save tests to localStorage
   */
  private saveTests(): void {
    try {
      const testsArray = Array.from(this.tests.values());
      localStorage.setItem('ab_tests', JSON.stringify(testsArray));
    } catch (error) {
      console.error('[ABTest] Failed to save tests:', error);
    }
  }

  /**
   * Create a new A/B test
   */
  createTest(test: Omit<ABTest, 'id' | 'createdAt' | 'updatedAt'>): ABTest {
    const newTest: ABTest = {
      ...test,
      id: `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // Validate variant weights sum to 100
    const totalWeight = newTest.variants.reduce((sum, v) => sum + v.weight, 0);
    if (Math.abs(totalWeight - 100) > 0.01) {
      throw new Error(`Variant weights must sum to 100 (current: ${totalWeight})`);
    }

    this.tests.set(newTest.id, newTest);
    this.saveTests();

    console.log('[ABTest] Created test:', newTest.id);
    return newTest;
  }

  /**
   * Get a test by ID
   */
  getTest(testId: string): ABTest | undefined {
    return this.tests.get(testId);
  }

  /**
   * Get all tests
   */
  getAllTests(): ABTest[] {
    return Array.from(this.tests.values());
  }

  /**
   * Start a test
   */
  startTest(testId: string): void {
    const test = this.tests.get(testId);
    if (!test) throw new Error('Test not found');

    test.status = 'running';
    test.startDate = Date.now();
    test.updatedAt = Date.now();

    this.tests.set(testId, test);
    this.saveTests();

    console.log('[ABTest] Started test:', testId);
  }

  /**
   * Pause a test
   */
  pauseTest(testId: string): void {
    const test = this.tests.get(testId);
    if (!test) throw new Error('Test not found');

    test.status = 'paused';
    test.updatedAt = Date.now();

    this.tests.set(testId, test);
    this.saveTests();

    console.log('[ABTest] Paused test:', testId);
  }

  /**
   * Complete a test
   */
  completeTest(testId: string, winnerId?: string): void {
    const test = this.tests.get(testId);
    if (!test) throw new Error('Test not found');

    test.status = 'completed';
    test.endDate = Date.now();
    test.winnerId = winnerId;
    test.updatedAt = Date.now();

    this.tests.set(testId, test);
    this.saveTests();

    console.log('[ABTest] Completed test:', testId, 'Winner:', winnerId);
  }

  /**
   * Assign a variant to a user/session
   */
  assignVariant(testId: string, userId: string): ABTestVariant {
    const test = this.tests.get(testId);
    if (!test) throw new Error('Test not found');
    if (test.status !== 'running') throw new Error('Test is not running');

    // Check if already assigned
    const assignmentKey = `${testId}:${userId}`;
    const existingAssignment = this.variantAssignments.get(assignmentKey);
    if (existingAssignment) {
      const variant = test.variants.find(v => v.id === existingAssignment);
      if (variant) return variant;
    }

    // Assign based on weighted distribution
    const random = Math.random() * 100;
    let cumulative = 0;

    for (const variant of test.variants) {
      cumulative += variant.weight;
      if (random <= cumulative) {
        this.variantAssignments.set(assignmentKey, variant.id);
        return variant;
      }
    }

    // Fallback to first variant
    const firstVariant = test.variants[0];
    this.variantAssignments.set(assignmentKey, firstVariant.id);
    return firstVariant;
  }

  /**
   * Get metrics for a variant
   */
  getVariantMetrics(testId: string, variantId: string): VariantMetrics {
    const events = analyticsTracker.getEvents();
    const variantEvents = events.filter(
      e => e.metadata.testId === testId && e.metadata.variantId === variantId
    );

    const impressions = variantEvents.filter(e => e.type === 'blog_view').length;
    const clicks = variantEvents.filter(e => e.type === 'blog_click').length;
    const conversions = variantEvents.filter(e => e.type === 'blog_publish').length;
    const shares = variantEvents.filter(e => e.type === 'blog_share').length;
    const engagement = clicks + shares + conversions;

    return {
      variantId,
      impressions,
      clicks,
      conversions,
      shares,
      engagement,
      conversionRate: impressions > 0 ? (conversions / impressions) * 100 : 0,
      clickThroughRate: impressions > 0 ? (clicks / impressions) * 100 : 0,
      engagementRate: impressions > 0 ? (engagement / impressions) * 100 : 0,
    };
  }

  /**
   * Get test results with statistical analysis
   */
  getTestResults(testId: string): ABTestResult {
    const test = this.tests.get(testId);
    if (!test) throw new Error('Test not found');

    const variantResults = test.variants.map(variant => {
      const metrics = this.getVariantMetrics(testId, variant.id);
      return {
        variantId: variant.id,
        metrics,
        isWinner: false,
        confidenceScore: 0,
      };
    });

    // Find best performing variant based on target metric
    const metricKey = this.getMetricKey(test.targetMetric);
    const sortedVariants = [...variantResults].sort(
      (a, b) => b.metrics[metricKey] - a.metrics[metricKey]
    );

    const winner = sortedVariants[0];
    const runnerUp = sortedVariants[1];

    // Calculate statistical significance using Z-test for proportions
    const { isSignificant, confidenceScore } = this.calculateSignificance(
      winner.metrics,
      runnerUp?.metrics,
      test.confidenceLevel
    );

    // Mark winner
    if (winner) {
      const winnerIndex = variantResults.findIndex(v => v.variantId === winner.variantId);
      if (winnerIndex !== -1) {
        variantResults[winnerIndex].isWinner = true;
        variantResults[winnerIndex].confidenceScore = confidenceScore;
      }
    }

    // Determine recommended action
    let recommendedAction = 'Continue collecting data';

    if (winner.metrics.impressions >= test.minimumSampleSize) {
      if (isSignificant) {
        recommendedAction = `Declare ${winner.variantId} as winner with ${(confidenceScore * 100).toFixed(1)}% confidence`;
      } else {
        recommendedAction = 'Results not statistically significant. Consider running longer or increasing sample size.';
      }
    } else {
      const remaining = test.minimumSampleSize - winner.metrics.impressions;
      recommendedAction = `Need ${remaining} more impressions to reach minimum sample size`;
    }

    return {
      testId,
      variants: variantResults,
      isSignificant,
      confidenceLevel: test.confidenceLevel,
      recommendedAction,
      completedAt: test.endDate,
    };
  }

  /**
   * Get metric key based on target metric
   */
  private getMetricKey(targetMetric: string): keyof VariantMetrics {
    switch (targetMetric) {
      case 'clicks':
        return 'clickThroughRate';
      case 'conversions':
        return 'conversionRate';
      case 'engagement':
        return 'engagementRate';
      case 'shares':
        return 'shares';
      default:
        return 'conversionRate';
    }
  }

  /**
   * Calculate statistical significance using Z-test
   */
  private calculateSignificance(
    variant1: VariantMetrics,
    variant2: VariantMetrics | undefined,
    confidenceLevel: number
  ): { isSignificant: boolean; confidenceScore: number } {
    if (!variant2) {
      return { isSignificant: false, confidenceScore: 0 };
    }

    const n1 = variant1.impressions;
    const n2 = variant2.impressions;

    if (n1 === 0 || n2 === 0) {
      return { isSignificant: false, confidenceScore: 0 };
    }

    // Use conversion rate for Z-test
    const p1 = variant1.conversionRate / 100;
    const p2 = variant2.conversionRate / 100;

    // Pooled proportion
    const pPooled = ((p1 * n1) + (p2 * n2)) / (n1 + n2);

    // Standard error
    const se = Math.sqrt(pPooled * (1 - pPooled) * ((1 / n1) + (1 / n2)));

    if (se === 0) {
      return { isSignificant: false, confidenceScore: 0 };
    }

    // Z-score
    const z = Math.abs(p1 - p2) / se;

    // Critical values for different confidence levels
    const criticalValues: Record<number, number> = {
      0.90: 1.645,
      0.95: 1.96,
      0.99: 2.576,
    };

    const criticalValue = criticalValues[confidenceLevel] || 1.96;
    const isSignificant = z >= criticalValue;

    // Approximate confidence score (using normal distribution)
    const confidenceScore = this.normalCDF(z);

    return { isSignificant, confidenceScore };
  }

  /**
   * Normal cumulative distribution function (approximation)
   */
  private normalCDF(x: number): number {
    const t = 1 / (1 + 0.2316419 * Math.abs(x));
    const d = 0.3989423 * Math.exp(-x * x / 2);
    const prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));

    return x > 0 ? 1 - prob : prob;
  }

  /**
   * Auto-complete test if winner is clear
   */
  autoCompleteIfReady(testId: string): boolean {
    const test = this.tests.get(testId);
    if (!test || test.status !== 'running') return false;

    const results = this.getTestResults(testId);

    // Check if we have enough data and a significant winner
    const hasEnoughData = results.variants.every(
      v => v.metrics.impressions >= test.minimumSampleSize
    );

    if (hasEnoughData && results.isSignificant) {
      const winner = results.variants.find(v => v.isWinner);
      if (winner) {
        this.completeTest(testId, winner.variantId);
        return true;
      }
    }

    return false;
  }

  /**
   * Delete a test
   */
  deleteTest(testId: string): void {
    this.tests.delete(testId);
    this.saveTests();
    console.log('[ABTest] Deleted test:', testId);
  }

  /**
   * Clear all tests (for debugging)
   */
  clearAllTests(): void {
    this.tests.clear();
    this.variantAssignments.clear();
    localStorage.removeItem('ab_tests');
    console.log('[ABTest] Cleared all tests');
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

export const abTestManager = new ABTestManager();

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

/**
 * Create a simple A/B test with two variants
 */
export function createSimpleABTest(
  name: string,
  variantA: { name: string; content: string },
  variantB: { name: string; content: string },
  options: {
    targetMetric?: 'clicks' | 'conversions' | 'engagement' | 'shares';
    minimumSampleSize?: number;
    confidenceLevel?: 0.90 | 0.95 | 0.99;
  } = {}
): ABTest {
  return abTestManager.createTest({
    name,
    variants: [
      {
        id: 'variant_a',
        name: variantA.name,
        content: variantA.content,
        weight: 50,
        metadata: {},
      },
      {
        id: 'variant_b',
        name: variantB.name,
        content: variantB.content,
        weight: 50,
        metadata: {},
      },
    ],
    status: 'draft',
    targetMetric: options.targetMetric || 'conversions',
    minimumSampleSize: options.minimumSampleSize || 100,
    confidenceLevel: options.confidenceLevel || 0.95,
  });
}

/**
 * Track an impression for a variant
 */
export function trackVariantImpression(testId: string, variantId: string, postId: string): void {
  analyticsTracker.track('blog_view', {
    testId,
    variantId,
    postId,
  });
}

/**
 * Track a click for a variant
 */
export function trackVariantClick(testId: string, variantId: string, postId: string): void {
  analyticsTracker.track('blog_click', {
    testId,
    variantId,
    postId,
  });
}

/**
 * Track a conversion for a variant
 */
export function trackVariantConversion(testId: string, variantId: string, postId: string): void {
  analyticsTracker.track('blog_publish', {
    testId,
    variantId,
    postId,
  });
}

/**
 * Get recommended sample size for A/B test
 */
export function calculateRecommendedSampleSize(
  baselineRate: number,
  minimumDetectableEffect: number,
  confidenceLevel: number = 0.95,
  power: number = 0.80
): number {
  // Simplified sample size calculation
  // For more accurate results, use a proper statistical library

  const criticalValues: Record<number, number> = {
    0.90: 1.645,
    0.95: 1.96,
    0.99: 2.576,
  };

  const zAlpha = criticalValues[confidenceLevel] || 1.96;
  const zBeta = 0.84; // for 80% power

  const p1 = baselineRate;
  const p2 = baselineRate * (1 + minimumDetectableEffect);

  const pAvg = (p1 + p2) / 2;

  const n = Math.pow(zAlpha + zBeta, 2) * 2 * pAvg * (1 - pAvg) / Math.pow(p2 - p1, 2);

  return Math.ceil(n);
}
