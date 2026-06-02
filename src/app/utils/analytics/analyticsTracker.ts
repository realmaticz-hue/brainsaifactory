// =============================================================================
// ANALYTICS TRACKER — Real-Time Event Tracking
// =============================================================================
//
// Comprehensive analytics system for tracking blog post performance,
// user engagement, campaign metrics, and content insights.
//
// =============================================================================

export type AnalyticsEventType =
  | 'blog_view'
  | 'blog_click'
  | 'blog_share'
  | 'blog_copy'
  | 'blog_download'
  | 'blog_publish'
  | 'campaign_create'
  | 'campaign_start'
  | 'campaign_pause'
  | 'campaign_complete'
  | 'user_signup'
  | 'user_signin'
  | 'ai_generate'
  | 'wordpress_publish'
  | 'social_schedule';

export interface AnalyticsEvent {
  id: string;
  type: AnalyticsEventType;
  timestamp: number;
  userId?: string;
  sessionId: string;
  metadata: Record<string, any>;
}

export interface BlogPerformance {
  postId: string;
  views: number;
  clicks: number;
  shares: number;
  copies: number;
  downloads: number;
  publishCount: number;
  avgTimeOnPage: number;
  bounceRate: number;
  conversionRate: number;
  engagementScore: number;
}

export interface CampaignMetrics {
  campaignId: string;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number; // Click-through rate
  conversionRate: number;
  roi: number;
  cost: number;
  revenue: number;
}

export interface UserEngagement {
  userId: string;
  sessionCount: number;
  totalTimeSpent: number;
  postsViewed: number;
  postsCreated: number;
  postsPublished: number;
  lastActiveAt: number;
  engagementLevel: 'low' | 'medium' | 'high';
}

// =============================================================================
// ANALYTICS TRACKER CLASS
// =============================================================================

class AnalyticsTracker {
  private events: AnalyticsEvent[] = [];
  private sessionId: string;
  private maxEvents: number = 1000;
  private subscribers: Set<(events: AnalyticsEvent[]) => void> = new Set();

  constructor() {
    this.sessionId = this.generateSessionId();
    this.loadEvents();
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    const existing = sessionStorage.getItem('analytics_session_id');
    if (existing) return existing;

    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('analytics_session_id', sessionId);
    return sessionId;
  }

  /**
   * Load events from localStorage
   */
  private loadEvents(): void {
    try {
      const stored = localStorage.getItem('analytics_events');
      if (stored) {
        this.events = JSON.parse(stored);
      }
    } catch (error) {
      console.error('[Analytics] Failed to load events:', error);
    }
  }

  /**
   * Save events to localStorage
   */
  private saveEvents(): void {
    try {
      // Keep only recent events
      const recent = this.events.slice(-this.maxEvents);
      localStorage.setItem('analytics_events', JSON.stringify(recent));
      this.events = recent;
    } catch (error) {
      console.error('[Analytics] Failed to save events:', error);
    }
  }

  /**
   * Track an analytics event
   */
  track(type: AnalyticsEventType, metadata: Record<string, any> = {}): void {
    const event: AnalyticsEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      timestamp: Date.now(),
      userId: metadata.userId,
      sessionId: this.sessionId,
      metadata,
    };

    this.events.push(event);
    this.saveEvents();
    this.notifySubscribers();

    // Log for debugging
    console.log('[Analytics] Event tracked:', type, metadata);
  }

  /**
   * Subscribe to events
   */
  subscribe(callback: (events: AnalyticsEvent[]) => void): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  /**
   * Notify subscribers
   */
  private notifySubscribers(): void {
    this.subscribers.forEach(callback => callback([...this.events]));
  }

  /**
   * Get all events
   */
  getEvents(): AnalyticsEvent[] {
    return [...this.events];
  }

  /**
   * Get events by type
   */
  getEventsByType(type: AnalyticsEventType): AnalyticsEvent[] {
    return this.events.filter(e => e.type === type);
  }

  /**
   * Get events in time range
   */
  getEventsInRange(startTime: number, endTime: number): AnalyticsEvent[] {
    return this.events.filter(e => e.timestamp >= startTime && e.timestamp <= endTime);
  }

  /**
   * Get blog performance metrics
   */
  getBlogPerformance(postId: string): BlogPerformance {
    const blogEvents = this.events.filter(e => e.metadata.postId === postId);

    const views = blogEvents.filter(e => e.type === 'blog_view').length;
    const clicks = blogEvents.filter(e => e.type === 'blog_click').length;
    const shares = blogEvents.filter(e => e.type === 'blog_share').length;
    const copies = blogEvents.filter(e => e.type === 'blog_copy').length;
    const downloads = blogEvents.filter(e => e.type === 'blog_download').length;
    const publishCount = blogEvents.filter(e => e.type === 'blog_publish').length;

    // Calculate engagement metrics
    const totalEngagements = clicks + shares + copies + downloads;
    const engagementRate = views > 0 ? (totalEngagements / views) * 100 : 0;
    const conversionRate = views > 0 ? (publishCount / views) * 100 : 0;

    // Engagement score (0-100)
    const engagementScore = Math.min(
      100,
      (engagementRate * 0.6 + conversionRate * 0.4)
    );

    return {
      postId,
      views,
      clicks,
      shares,
      copies,
      downloads,
      publishCount,
      avgTimeOnPage: 0, // Requires time tracking
      bounceRate: views > 0 ? ((views - clicks) / views) * 100 : 0,
      conversionRate,
      engagementScore: Math.round(engagementScore),
    };
  }

  /**
   * Get campaign metrics
   */
  getCampaignMetrics(campaignId: string): CampaignMetrics {
    const campaignEvents = this.events.filter(e => e.metadata.campaignId === campaignId);

    const impressions = campaignEvents.filter(e => e.type === 'blog_view').length;
    const clicks = campaignEvents.filter(e => e.type === 'blog_click').length;
    const conversions = campaignEvents.filter(e => e.type === 'blog_publish').length;

    const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
    const conversionRate = clicks > 0 ? (conversions / clicks) * 100 : 0;

    return {
      campaignId,
      impressions,
      clicks,
      conversions,
      ctr,
      conversionRate,
      roi: 0, // Requires cost/revenue data
      cost: 0,
      revenue: 0,
    };
  }

  /**
   * Get user engagement metrics
   */
  getUserEngagement(userId: string): UserEngagement {
    const userEvents = this.events.filter(e => e.userId === userId);

    const sessions = new Set(userEvents.map(e => e.sessionId)).size;
    const postsViewed = new Set(
      userEvents.filter(e => e.type === 'blog_view').map(e => e.metadata.postId)
    ).size;
    const postsCreated = userEvents.filter(e => e.type === 'ai_generate').length;
    const postsPublished = userEvents.filter(e => e.type === 'blog_publish').length;

    const lastEvent = userEvents[userEvents.length - 1];
    const lastActiveAt = lastEvent?.timestamp || 0;

    // Calculate engagement level
    let engagementLevel: 'low' | 'medium' | 'high' = 'low';
    const activityScore = sessions * 10 + postsCreated * 5 + postsPublished * 10;

    if (activityScore >= 100) engagementLevel = 'high';
    else if (activityScore >= 50) engagementLevel = 'medium';

    return {
      userId,
      sessionCount: sessions,
      totalTimeSpent: 0, // Requires time tracking
      postsViewed,
      postsCreated,
      postsPublished,
      lastActiveAt,
      engagementLevel,
    };
  }

  /**
   * Get top performing posts
   */
  getTopPosts(limit: number = 10): Array<{ postId: string; performance: BlogPerformance }> {
    const postIds = new Set(
      this.events
        .filter(e => e.metadata.postId)
        .map(e => e.metadata.postId)
    );

    const posts = Array.from(postIds).map(postId => ({
      postId,
      performance: this.getBlogPerformance(postId),
    }));

    return posts
      .sort((a, b) => b.performance.engagementScore - a.performance.engagementScore)
      .slice(0, limit);
  }

  /**
   * Get insights and recommendations
   */
  getInsights(): Array<{ type: string; message: string; priority: 'low' | 'medium' | 'high' }> {
    const insights: Array<{ type: string; message: string; priority: 'low' | 'medium' | 'high' }> = [];

    // Analyze overall engagement
    const recentEvents = this.getEventsInRange(Date.now() - 7 * 24 * 60 * 60 * 1000, Date.now());
    const views = recentEvents.filter(e => e.type === 'blog_view').length;
    const publishes = recentEvents.filter(e => e.type === 'blog_publish').length;

    if (views > 0 && publishes / views < 0.1) {
      insights.push({
        type: 'low_conversion',
        message: 'Low publish rate (< 10%). Consider improving blog quality or CTAs.',
        priority: 'high',
      });
    }

    if (views > 100) {
      insights.push({
        type: 'high_traffic',
        message: `Strong engagement with ${views} views this week. Keep it up!`,
        priority: 'low',
      });
    }

    // Check for inactive periods
    const lastEvent = this.events[this.events.length - 1];
    if (lastEvent && Date.now() - lastEvent.timestamp > 24 * 60 * 60 * 1000) {
      insights.push({
        type: 'inactive',
        message: 'No activity in 24 hours. Generate new content to maintain momentum.',
        priority: 'medium',
      });
    }

    // Analyze top posts
    const topPosts = this.getTopPosts(3);
    if (topPosts.length > 0 && topPosts[0].performance.engagementScore > 80) {
      insights.push({
        type: 'high_performer',
        message: `Post ${topPosts[0].postId.substring(0, 8)}... has ${topPosts[0].performance.engagementScore}% engagement. Create similar content!`,
        priority: 'medium',
      });
    }

    return insights;
  }

  /**
   * Clear all events
   */
  clearEvents(): void {
    this.events = [];
    localStorage.removeItem('analytics_events');
    this.notifySubscribers();
  }

  /**
   * Export events as JSON
   */
  exportEvents(): string {
    return JSON.stringify(this.events, null, 2);
  }

  /**
   * Get analytics summary
   */
  getSummary(): {
    totalEvents: number;
    uniqueUsers: number;
    uniqueSessions: number;
    uniquePosts: number;
    eventsByType: Record<string, number>;
    recentActivity: number;
  } {
    const uniqueUsers = new Set(this.events.filter(e => e.userId).map(e => e.userId)).size;
    const uniqueSessions = new Set(this.events.map(e => e.sessionId)).size;
    const uniquePosts = new Set(
      this.events.filter(e => e.metadata.postId).map(e => e.metadata.postId)
    ).size;

    const eventsByType: Record<string, number> = {};
    this.events.forEach(e => {
      eventsByType[e.type] = (eventsByType[e.type] || 0) + 1;
    });

    const recentActivity = this.getEventsInRange(
      Date.now() - 24 * 60 * 60 * 1000,
      Date.now()
    ).length;

    return {
      totalEvents: this.events.length,
      uniqueUsers,
      uniqueSessions,
      uniquePosts,
      eventsByType,
      recentActivity,
    };
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

export const analyticsTracker = new AnalyticsTracker();

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

/**
 * Track blog view event
 */
export function trackBlogView(postId: string, metadata: Record<string, any> = {}): void {
  analyticsTracker.track('blog_view', { postId, ...metadata });
}

/**
 * Track blog click event
 */
export function trackBlogClick(postId: string, metadata: Record<string, any> = {}): void {
  analyticsTracker.track('blog_click', { postId, ...metadata });
}

/**
 * Track blog share event
 */
export function trackBlogShare(postId: string, platform: string, metadata: Record<string, any> = {}): void {
  analyticsTracker.track('blog_share', { postId, platform, ...metadata });
}

/**
 * Track blog copy event
 */
export function trackBlogCopy(postId: string, metadata: Record<string, any> = {}): void {
  analyticsTracker.track('blog_copy', { postId, ...metadata });
}

/**
 * Track blog download event
 */
export function trackBlogDownload(postId: string, metadata: Record<string, any> = {}): void {
  analyticsTracker.track('blog_download', { postId, ...metadata });
}

/**
 * Track blog publish event
 */
export function trackBlogPublish(postId: string, platform: string, metadata: Record<string, any> = {}): void {
  analyticsTracker.track('blog_publish', { postId, platform, ...metadata });
}

/**
 * Track AI generation event
 */
export function trackAIGenerate(count: number, provider: string, metadata: Record<string, any> = {}): void {
  analyticsTracker.track('ai_generate', { count, provider, ...metadata });
}

/**
 * Track user signup event
 */
export function trackUserSignup(userId: string, method: string, metadata: Record<string, any> = {}): void {
  analyticsTracker.track('user_signup', { userId, method, ...metadata });
}

/**
 * Track user signin event
 */
export function trackUserSignin(userId: string, method: string, metadata: Record<string, any> = {}): void {
  analyticsTracker.track('user_signin', { userId, method, ...metadata });
}
