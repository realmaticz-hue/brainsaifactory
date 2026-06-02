// =============================================================================
// ENGAGEMENT PREDICTOR AI — Viral Potential & Optimal Timing
// =============================================================================

export interface EngagementPrediction {
  viralScore: number; // 0-100
  factors: {
    headlineQuality: number;
    emotionalImpact: number;
    contentLength: number;
    readability: number;
    topicRelevance: number;
    keywordStrength: number;
  };
  platformScores: {
    twitter: number;
    linkedin: number;
    facebook: number;
    reddit: number;
    medium: number;
  };
  optimalPostingTimes: PostingTime[];
  predictions: {
    estimatedReach: number;
    estimatedEngagement: number;
    estimatedShares: number;
    confidenceLevel: 'low' | 'medium' | 'high';
  };
  improvements: string[];
  competitorComparison?: {
    betterThan: number; // percentage
    topPerformer: boolean;
  };
}

export interface PostingTime {
  platform: string;
  dayOfWeek: string;
  timeRange: string;
  expectedEngagement: number;
  timezone: string;
}

/**
 * Predict engagement potential for content
 */
export function predictEngagement(
  title: string,
  content: string,
  keywords: string[],
  platform?: string
): EngagementPrediction {
  // Analyze headline quality
  const headlineQuality = analyzeHeadline(title);

  // Analyze emotional impact
  const emotionalImpact = analyzeEmotionalImpact(content);

  // Analyze content length (sweet spot is 1500-2500 words for blogs)
  const wordCount = content.split(/\s+/).length;
  const contentLength = scoreContentLength(wordCount);

  // Analyze readability
  const readability = analyzeReadability(content);

  // Analyze topic relevance (based on trending topics)
  const topicRelevance = analyzeTopicRelevance(keywords);

  // Analyze keyword strength
  const keywordStrength = analyzeKeywordStrength(keywords, content);

  // Calculate overall viral score
  const viralScore = Math.round(
    headlineQuality * 0.25 +
    emotionalImpact * 0.2 +
    contentLength * 0.15 +
    readability * 0.15 +
    topicRelevance * 0.15 +
    keywordStrength * 0.1
  );

  // Platform-specific scores
  const platformScores = calculatePlatformScores(
    title,
    content,
    wordCount,
    emotionalImpact
  );

  // Optimal posting times
  const optimalPostingTimes = getOptimalPostingTimes(platform);

  // Engagement predictions
  const predictions = predictMetrics(viralScore, wordCount);

  // Generate improvements
  const improvements = generateImprovements({
    headlineQuality,
    emotionalImpact,
    contentLength,
    readability,
    topicRelevance,
    keywordStrength,
  });

  return {
    viralScore,
    factors: {
      headlineQuality,
      emotionalImpact,
      contentLength,
      readability,
      topicRelevance,
      keywordStrength,
    },
    platformScores,
    optimalPostingTimes,
    predictions,
    improvements,
  };
}

/**
 * Analyze headline quality using proven formulas
 */
function analyzeHeadline(title: string): number {
  let score = 50; // Base score

  const words = title.split(/\s+/).length;
  const chars = title.length;

  // Optimal length (6-12 words, 60-70 chars)
  if (words >= 6 && words <= 12) score += 15;
  else if (words < 6) score -= 10;
  else if (words > 15) score -= 15;

  if (chars >= 60 && chars <= 70) score += 15;

  // Power words
  const powerWords = [
    'ultimate', 'complete', 'essential', 'proven', 'amazing', 'incredible',
    'shocking', 'secret', 'effective', 'powerful', 'simple', 'easy',
    'quick', 'instant', 'guaranteed', 'free', 'new', 'revolutionary',
  ];

  const lowerTitle = title.toLowerCase();
  const hasPowerWord = powerWords.some(word => lowerTitle.includes(word));
  if (hasPowerWord) score += 10;

  // Numbers
  if (/\d+/.test(title)) score += 10;

  // Questions
  if (title.includes('?')) score += 5;

  // Emotional words
  const emotionalWords = ['love', 'hate', 'fear', 'surprise', 'joy', 'anger', 'trust'];
  const hasEmotion = emotionalWords.some(word => lowerTitle.includes(word));
  if (hasEmotion) score += 10;

  // Brackets/parentheses (proven to increase CTR)
  if (/[\[\(].*[\]\)]/.test(title)) score += 5;

  return Math.min(100, Math.max(0, score));
}

/**
 * Analyze emotional impact
 */
function analyzeEmotionalImpact(content: string): number {
  const emotionWords = {
    positive: ['amazing', 'incredible', 'wonderful', 'fantastic', 'excellent', 'outstanding', 'love', 'joy', 'happy', 'exciting'],
    negative: ['terrible', 'awful', 'horrible', 'disaster', 'crisis', 'problem', 'fail', 'worst', 'shocking', 'devastating'],
    urgency: ['now', 'today', 'urgent', 'immediately', 'hurry', 'limited', 'deadline', 'ending', 'last chance', 'don\'t miss'],
  };

  const lowerContent = content.toLowerCase();
  let score = 50;

  // Count emotional words
  const positiveCount = emotionWords.positive.filter(word => lowerContent.includes(word)).length;
  const negativeCount = emotionWords.negative.filter(word => lowerContent.includes(word)).length;
  const urgencyCount = emotionWords.urgency.filter(word => lowerContent.includes(word)).length;

  score += Math.min(20, positiveCount * 3);
  score += Math.min(15, negativeCount * 3);
  score += Math.min(15, urgencyCount * 4);

  // Questions engage readers
  const questionCount = (content.match(/\?/g) || []).length;
  score += Math.min(10, questionCount * 2);

  return Math.min(100, score);
}

/**
 * Score content length
 */
function scoreContentLength(wordCount: number): number {
  // Optimal: 1500-2500 words for blogs
  if (wordCount >= 1500 && wordCount <= 2500) return 100;
  if (wordCount >= 1000 && wordCount <= 3000) return 80;
  if (wordCount >= 500 && wordCount <= 4000) return 60;
  if (wordCount < 300) return 30;
  return 40;
}

/**
 * Analyze readability
 */
function analyzeReadability(content: string): number {
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = content.split(/\s+/).filter(w => w.trim().length > 0);

  if (sentences.length === 0 || words.length === 0) return 50;

  const avgSentenceLength = words.length / sentences.length;

  // Optimal: 15-20 words per sentence
  let score = 50;

  if (avgSentenceLength >= 15 && avgSentenceLength <= 20) score = 100;
  else if (avgSentenceLength < 25) score = 80;
  else if (avgSentenceLength < 30) score = 60;
  else score = 40;

  // Penalty for very short content
  if (words.length < 100) score -= 20;

  return Math.max(0, Math.min(100, score));
}

/**
 * Analyze topic relevance
 */
function analyzeTopicRelevance(keywords: string[]): number {
  if (keywords.length === 0) return 40;

  // Trending topics (simulated - in production, use real trending API)
  const trendingTopics = [
    'ai', 'artificial intelligence', 'machine learning', 'chatgpt',
    'cryptocurrency', 'blockchain', 'web3', 'metaverse',
    'sustainability', 'climate', 'remote work', 'productivity',
    'health', 'wellness', 'mindfulness', 'fitness',
  ];

  const relevantKeywords = keywords.filter(kw =>
    trendingTopics.some(topic => kw.toLowerCase().includes(topic))
  );

  const relevanceRatio = relevantKeywords.length / Math.max(keywords.length, 1);

  return Math.round(40 + relevanceRatio * 60);
}

/**
 * Analyze keyword strength
 */
function analyzeKeywordStrength(keywords: string[], content: string): number {
  if (keywords.length === 0) return 30;

  const lowerContent = content.toLowerCase();
  let score = 50;

  // Check keyword density
  keywords.forEach(keyword => {
    const count = (lowerContent.match(new RegExp(keyword.toLowerCase(), 'g')) || []).length;
    if (count > 0) score += 10;
    if (count >= 3) score += 10;
  });

  return Math.min(100, score);
}

/**
 * Calculate platform-specific scores
 */
function calculatePlatformScores(
  title: string,
  content: string,
  wordCount: number,
  emotionalImpact: number
): Record<string, number> {
  const baseScore = 50;

  return {
    twitter: Math.min(100, baseScore + (title.length < 100 ? 20 : 0) + (emotionalImpact * 0.3)),
    linkedin: Math.min(100, baseScore + (wordCount > 800 ? 20 : 0) + 10),
    facebook: Math.min(100, baseScore + (emotionalImpact * 0.4) + 10),
    reddit: Math.min(100, baseScore + (wordCount > 500 ? 15 : 0) + (title.includes('?') ? 15 : 0)),
    medium: Math.min(100, baseScore + (wordCount > 1500 ? 25 : 0) + 5),
  };
}

/**
 * Get optimal posting times by platform
 */
function getOptimalPostingTimes(preferredPlatform?: string): PostingTime[] {
  const allTimes: PostingTime[] = [
    // Twitter
    { platform: 'Twitter', dayOfWeek: 'Wednesday', timeRange: '9:00-11:00 AM', expectedEngagement: 92, timezone: 'EST' },
    { platform: 'Twitter', dayOfWeek: 'Friday', timeRange: '12:00-1:00 PM', expectedEngagement: 88, timezone: 'EST' },

    // LinkedIn
    { platform: 'LinkedIn', dayOfWeek: 'Tuesday', timeRange: '7:00-9:00 AM', expectedEngagement: 95, timezone: 'EST' },
    { platform: 'LinkedIn', dayOfWeek: 'Thursday', timeRange: '10:00 AM-12:00 PM', expectedEngagement: 90, timezone: 'EST' },

    // Facebook
    { platform: 'Facebook', dayOfWeek: 'Thursday', timeRange: '1:00-3:00 PM', expectedEngagement: 85, timezone: 'EST' },
    { platform: 'Facebook', dayOfWeek: 'Friday', timeRange: '1:00-4:00 PM', expectedEngagement: 88, timezone: 'EST' },

    // Reddit
    { platform: 'Reddit', dayOfWeek: 'Monday', timeRange: '6:00-8:00 AM', expectedEngagement: 80, timezone: 'EST' },
    { platform: 'Reddit', dayOfWeek: 'Sunday', timeRange: '8:00-10:00 AM', expectedEngagement: 82, timezone: 'EST' },

    // Medium
    { platform: 'Medium', dayOfWeek: 'Tuesday', timeRange: '8:00-10:00 AM', expectedEngagement: 87, timezone: 'EST' },
  ];

  if (preferredPlatform) {
    return allTimes.filter(t => t.platform.toLowerCase() === preferredPlatform.toLowerCase());
  }

  return allTimes.sort((a, b) => b.expectedEngagement - a.expectedEngagement).slice(0, 5);
}

/**
 * Predict engagement metrics
 */
function predictMetrics(viralScore: number, wordCount: number): EngagementPrediction['predictions'] {
  const baseReach = 1000;
  const multiplier = viralScore / 50;

  const estimatedReach = Math.round(baseReach * multiplier);
  const estimatedEngagement = Math.round(estimatedReach * (viralScore / 100) * 0.05);
  const estimatedShares = Math.round(estimatedEngagement * 0.1);

  let confidenceLevel: 'low' | 'medium' | 'high' = 'medium';
  if (viralScore >= 80) confidenceLevel = 'high';
  else if (viralScore < 60) confidenceLevel = 'low';

  return {
    estimatedReach,
    estimatedEngagement,
    estimatedShares,
    confidenceLevel,
  };
}

/**
 * Generate improvement suggestions
 */
function generateImprovements(factors: EngagementPrediction['factors']): string[] {
  const improvements: string[] = [];

  if (factors.headlineQuality < 70) {
    improvements.push('🎯 Strengthen headline: Add numbers, power words, or make it more specific');
  }

  if (factors.emotionalImpact < 60) {
    improvements.push('💡 Increase emotional impact: Use more vivid language and emotional triggers');
  }

  if (factors.contentLength < 70) {
    improvements.push('📝 Optimize length: Aim for 1500-2500 words for maximum engagement');
  }

  if (factors.readability < 70) {
    improvements.push('✏️ Improve readability: Shorten sentences and use simpler words');
  }

  if (factors.topicRelevance < 60) {
    improvements.push('🔥 Cover trending topics: Include current hot topics in your niche');
  }

  if (factors.keywordStrength < 60) {
    improvements.push('🔑 Boost keyword usage: Include target keywords more naturally throughout');
  }

  if (improvements.length === 0) {
    improvements.push('🎉 Excellent! Your content has strong viral potential');
  }

  return improvements;
}

/**
 * A/B test headline variations
 */
export function generateHeadlineVariations(originalTitle: string): string[] {
  const variations: string[] = [];

  // Add numbers if missing
  if (!/\d/.test(originalTitle)) {
    variations.push(`7 Ways to ${originalTitle}`);
    variations.push(`${originalTitle}: 10 Expert Tips`);
  }

  // Add power words
  variations.push(`The Ultimate Guide to ${originalTitle}`);
  variations.push(`${originalTitle} (Proven Strategies)`);

  // Make it a question
  if (!originalTitle.includes('?')) {
    variations.push(`How to ${originalTitle}?`);
    variations.push(`Why ${originalTitle}?`);
  }

  // Add urgency
  variations.push(`${originalTitle} - Don't Miss This`);
  variations.push(`${originalTitle} in 2026`);

  return variations.slice(0, 5);
}
