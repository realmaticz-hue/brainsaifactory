// =============================================================================
// SMART CONTENT RECOMMENDATIONS — AI-Powered Content Suggestions
// =============================================================================

import type { BlogPost } from './blogGenerator';

export interface ContentRecommendation {
  id: string;
  type: 'similar' | 'gap' | 'trending' | 'refresh' | 'related';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  tags?: string[];
  estimatedImpact?: number; // 0-100
  relatedPosts?: string[]; // Post IDs
}

export interface TopicGap {
  topic: string;
  searchVolume: number;
  competition: number;
  opportunity: number; // 0-100
  suggestedKeywords: string[];
}

export interface TrendingTopic {
  topic: string;
  trend: 'rising' | 'hot' | 'steady';
  searchVolume: number;
  relatedKeywords: string[];
  suggestedTitle: string;
}

export interface ContentRefreshSuggestion {
  postId: string;
  reason: string;
  lastUpdated: Date;
  currentPerformance: number;
  potentialImprovement: number;
  suggestions: string[];
}

/**
 * Generate smart content recommendations
 */
export function generateRecommendations(posts: BlogPost[]): ContentRecommendation[] {
  const recommendations: ContentRecommendation[] = [];

  // Find similar content opportunities
  const similarRecs = findSimilarContentOpportunities(posts);
  recommendations.push(...similarRecs);

  // Identify topic gaps
  const gapRecs = identifyTopicGaps(posts);
  recommendations.push(...gapRecs);

  // Suggest trending topics
  const trendingRecs = suggestTrendingTopics(posts);
  recommendations.push(...trendingRecs);

  // Find content to refresh
  const refreshRecs = findContentToRefresh(posts);
  recommendations.push(...refreshRecs);

  // Sort by priority and impact
  return recommendations.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
    if (priorityDiff !== 0) return priorityDiff;

    return (b.estimatedImpact || 0) - (a.estimatedImpact || 0);
  });
}

/**
 * Find similar content opportunities
 */
function findSimilarContentOpportunities(posts: BlogPost[]): ContentRecommendation[] {
  const recommendations: ContentRecommendation[] = [];

  // Group posts by topic similarity
  const topicClusters = clusterPostsByTopic(posts);

  topicClusters.forEach(cluster => {
    if (cluster.posts.length >= 3) {
      // Opportunity for series or pillar content
      recommendations.push({
        id: `similar-${cluster.topic}`,
        type: 'similar',
        title: `Create a comprehensive guide on "${cluster.topic}"`,
        description: `You have ${cluster.posts.length} posts on this topic. Combine them into an ultimate guide.`,
        priority: 'high',
        tags: [cluster.topic],
        estimatedImpact: 85,
        relatedPosts: cluster.posts.map(p => p.id),
      });
    }
  });

  return recommendations;
}

/**
 * Identify topic gaps
 */
function identifyTopicGaps(posts: BlogPost[]): ContentRecommendation[] {
  const recommendations: ContentRecommendation[] = [];

  // Extract covered topics
  const coveredTopics = new Set<string>();
  posts.forEach(post => {
    const keywords = [post.primaryKeyword, ...(post.secondaryKeywords || [])].filter(Boolean);
    keywords.forEach(kw => coveredTopics.add(kw.toLowerCase()));
  });

  // Identify gaps (simulated - in production, use real keyword research API)
  const potentialTopics = [
    { topic: 'AI automation', volume: 12000, competition: 45 },
    { topic: 'productivity hacks', volume: 8500, competition: 60 },
    { topic: 'remote work tips', volume: 15000, competition: 55 },
    { topic: 'content marketing', volume: 22000, competition: 70 },
    { topic: 'SEO strategies', volume: 18000, competition: 75 },
    { topic: 'social media growth', volume: 9500, competition: 50 },
  ];

  potentialTopics.forEach(({ topic, volume, competition }) => {
    if (!coveredTopics.has(topic.toLowerCase())) {
      const opportunity = calculateOpportunityScore(volume, competition);

      if (opportunity > 50) {
        recommendations.push({
          id: `gap-${topic.replace(/\s+/g, '-')}`,
          type: 'gap',
          title: `Write about "${topic}"`,
          description: `High opportunity topic with ${volume.toLocaleString()} monthly searches and ${competition}% competition.`,
          priority: opportunity > 70 ? 'high' : 'medium',
          tags: [topic],
          estimatedImpact: opportunity,
        });
      }
    }
  });

  return recommendations;
}

/**
 * Suggest trending topics
 */
function suggestTrendingTopics(posts: BlogPost[]): ContentRecommendation[] {
  const recommendations: ContentRecommendation[] = [];

  // Trending topics (simulated - in production, use Google Trends API)
  const trending: TrendingTopic[] = [
    {
      topic: 'ChatGPT prompts',
      trend: 'hot',
      searchVolume: 45000,
      relatedKeywords: ['AI prompts', 'prompt engineering', 'GPT-4'],
      suggestedTitle: 'The Ultimate Guide to ChatGPT Prompts in 2026',
    },
    {
      topic: 'Sustainable living',
      trend: 'rising',
      searchVolume: 28000,
      relatedKeywords: ['eco-friendly', 'zero waste', 'green living'],
      suggestedTitle: '10 Sustainable Living Tips That Actually Work',
    },
    {
      topic: 'Web3 development',
      trend: 'rising',
      searchVolume: 12000,
      relatedKeywords: ['blockchain', 'dApps', 'smart contracts'],
      suggestedTitle: 'Getting Started with Web3 Development: A Complete Tutorial',
    },
  ];

  trending.forEach(topic => {
    recommendations.push({
      id: `trending-${topic.topic.replace(/\s+/g, '-')}`,
      type: 'trending',
      title: topic.suggestedTitle,
      description: `🔥 ${topic.trend === 'hot' ? 'Hot' : 'Rising'} trend with ${topic.searchVolume.toLocaleString()} monthly searches`,
      priority: topic.trend === 'hot' ? 'high' : 'medium',
      tags: [topic.topic, ...topic.relatedKeywords.slice(0, 2)],
      estimatedImpact: topic.trend === 'hot' ? 90 : 75,
    });
  });

  return recommendations;
}

/**
 * Find content to refresh
 */
function findContentToRefresh(posts: BlogPost[]): ContentRecommendation[] {
  const recommendations: ContentRecommendation[] = [];

  // Find old posts that could be updated
  const now = new Date();
  const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);

  posts.forEach(post => {
    const postDate = new Date(post.timestamp);

    if (postDate < sixMonthsAgo) {
      // Old post - suggest refresh
      const daysSinceUpdate = Math.floor((now.getTime() - postDate.getTime()) / (24 * 60 * 60 * 1000));

      recommendations.push({
        id: `refresh-${post.id}`,
        type: 'refresh',
        title: `Update: "${post.seoTitle || 'Untitled'}"`,
        description: `This post is ${daysSinceUpdate} days old. Add fresh data, update stats, and improve SEO.`,
        priority: daysSinceUpdate > 365 ? 'high' : 'medium',
        tags: [post.primaryKeyword || 'general'].filter(Boolean),
        estimatedImpact: 60,
        relatedPosts: [post.id],
      });
    }
  });

  return recommendations.slice(0, 5); // Limit refresh suggestions
}

/**
 * Find related posts
 */
export function findRelatedPosts(post: BlogPost, allPosts: BlogPost[], limit: number = 5): BlogPost[] {
  const postKeywords = new Set([
    post.primaryKeyword,
    ...(post.secondaryKeywords || []),
  ].filter(Boolean).map(k => k.toLowerCase()));

  // Score posts by keyword overlap
  const scored = allPosts
    .filter(p => p.id !== post.id)
    .map(p => {
      const otherKeywords = new Set([
        p.primaryKeyword,
        ...(p.secondaryKeywords || []),
      ].filter(Boolean).map(k => k.toLowerCase()));

      // Calculate Jaccard similarity
      const intersection = [...postKeywords].filter(k => otherKeywords.has(k)).length;
      const union = new Set([...postKeywords, ...otherKeywords]).size;
      const similarity = union > 0 ? intersection / union : 0;

      return { post: p, similarity };
    })
    .filter(({ similarity }) => similarity > 0.2)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);

  return scored.map(s => s.post);
}

/**
 * Cluster posts by topic
 */
function clusterPostsByTopic(posts: BlogPost[]): Array<{ topic: string; posts: BlogPost[] }> {
  const clusters = new Map<string, BlogPost[]>();

  posts.forEach(post => {
    const topic = (post.primaryKeyword || post.angleLabel || 'general').toLowerCase();

    if (!clusters.has(topic)) {
      clusters.set(topic, []);
    }

    clusters.get(topic)!.push(post);
  });

  return Array.from(clusters.entries()).map(([topic, posts]) => ({ topic, posts }));
}

/**
 * Calculate opportunity score
 */
function calculateOpportunityScore(searchVolume: number, competition: number): number {
  // High volume + low competition = high opportunity
  const volumeScore = Math.min(100, (searchVolume / 1000) * 5);
  const competitionScore = 100 - competition;

  return Math.round((volumeScore * 0.6 + competitionScore * 0.4));
}

/**
 * Get topic gaps analysis
 */
export function analyzeTopicGaps(posts: BlogPost[]): TopicGap[] {
  const coveredTopics = new Set<string>();

  posts.forEach(post => {
    const keywords = [post.primaryKeyword, ...(post.secondaryKeywords || [])].filter(Boolean);
    keywords.forEach(kw => coveredTopics.add(kw.toLowerCase()));
  });

  // Industry-standard topics (simulated)
  const industryTopics = [
    { topic: 'AI automation', volume: 12000, competition: 45, keywords: ['machine learning', 'automation tools', 'AI workflows'] },
    { topic: 'content marketing', volume: 22000, competition: 70, keywords: ['content strategy', 'blog writing', 'SEO content'] },
    { topic: 'productivity', volume: 18000, competition: 60, keywords: ['time management', 'efficiency', 'work tips'] },
    { topic: 'remote work', volume: 15000, competition: 55, keywords: ['WFH', 'distributed teams', 'async work'] },
  ];

  return industryTopics
    .filter(({ topic }) => !coveredTopics.has(topic.toLowerCase()))
    .map(({ topic, volume, competition, keywords }) => ({
      topic,
      searchVolume: volume,
      competition,
      opportunity: calculateOpportunityScore(volume, competition),
      suggestedKeywords: keywords,
    }))
    .sort((a, b) => b.opportunity - a.opportunity);
}

/**
 * Get trending topics
 */
export function getTrendingTopics(): TrendingTopic[] {
  return [
    {
      topic: 'AI tools 2026',
      trend: 'hot',
      searchVolume: 50000,
      relatedKeywords: ['ChatGPT', 'Claude', 'Gemini', 'AI productivity'],
      suggestedTitle: 'Best AI Tools in 2026: Ultimate Guide',
    },
    {
      topic: 'Sustainable business',
      trend: 'rising',
      searchVolume: 32000,
      relatedKeywords: ['ESG', 'green business', 'sustainability'],
      suggestedTitle: 'How to Build a Sustainable Business in 2026',
    },
    {
      topic: 'Creator economy',
      trend: 'rising',
      searchVolume: 28000,
      relatedKeywords: ['monetization', 'content creators', 'influencer'],
      suggestedTitle: 'The Creator Economy: Complete Guide to Making Money Online',
    },
  ];
}

/**
 * Get content refresh suggestions
 */
export function getRefreshSuggestions(posts: BlogPost[]): ContentRefreshSuggestion[] {
  const now = new Date();
  const suggestions: ContentRefreshSuggestion[] = [];

  posts.forEach(post => {
    const postDate = new Date(post.timestamp);
    const daysSinceUpdate = Math.floor((now.getTime() - postDate.getTime()) / (24 * 60 * 60 * 1000));

    if (daysSinceUpdate > 90) {
      const performance = post.qualityScore || 70;
      const potentialImprovement = Math.min(100 - performance, 30);

      const refreshSuggestions: string[] = [];

      if (daysSinceUpdate > 365) {
        refreshSuggestions.push('Update statistics and data for 2026');
        refreshSuggestions.push('Add recent examples and case studies');
      }

      refreshSuggestions.push('Improve SEO with current keywords');
      refreshSuggestions.push('Add more visual content (images, charts)');
      refreshSuggestions.push('Expand with new insights and research');

      suggestions.push({
        postId: post.id,
        reason: `Last updated ${daysSinceUpdate} days ago`,
        lastUpdated: postDate,
        currentPerformance: performance,
        potentialImprovement,
        suggestions: refreshSuggestions,
      });
    }
  });

  return suggestions.slice(0, 10); // Top 10 suggestions
}
