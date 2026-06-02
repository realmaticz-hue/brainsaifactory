// =============================================================================
// BLOG DATABASE — Client-Side Database API
// =============================================================================
//
// Client-side wrapper for database operations via HTTP endpoints.
// All operations communicate with the server via serverFetch.
//
// =============================================================================

import { serverFetch } from '../serverFetch';
import type { BlogPost } from '../blogGenerator';

// =============================================================================
// TYPES
// =============================================================================

export interface SavedBlogPost extends BlogPost {
  savedAt: string;
  userId?: string;
  published: boolean;
  publishedAt?: string;
  publishedUrl?: string;
  tags: string[];
  category: string;
}

export interface Campaign {
  id: string;
  name: string;
  description?: string;
  postIds: string[];
  status: 'draft' | 'active' | 'paused' | 'completed';
  createdAt: string;
  updatedAt: string;
  userId?: string;
  platforms: string[];
  schedule?: {
    startDate: string;
    endDate: string;
    frequency: string;
  };
}

export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  createdAt: string;
  preferences: {
    defaultLanguage: string;
    defaultCharacter?: string;
    autoSave: boolean;
    aiProvider?: 'openai' | 'anthropic' | 'google';
  };
}

export interface TokenUsageRecord {
  date: string; // YYYY-MM-DD
  totalTokens: number;
  totalCost: number;
  operations: {
    [operationName: string]: {
      count: number;
      tokens: number;
      cost: number;
    };
  };
}

// =============================================================================
// BLOG POST OPERATIONS
// =============================================================================

/**
 * Save a blog post to the database
 */
export async function saveBlogPost(post: SavedBlogPost): Promise<void> {
  const response = await serverFetch('/db/blog/save', {
    method: 'POST',
    body: JSON.stringify(post),
  });

  if (!response.ok) {
    throw new Error('Failed to save blog post');
  }
}

/**
 * Get a blog post by ID
 */
export async function getBlogPost(postId: string): Promise<SavedBlogPost | null> {
  const response = await serverFetch(`/db/blog/${postId}`);

  if (!response.ok) {
    throw new Error('Failed to get blog post');
  }

  const data = await response.json();
  return data.post;
}

/**
 * Get all blog posts (optionally filtered by user)
 */
export async function getBlogPosts(userId?: string): Promise<SavedBlogPost[]> {
  const url = userId ? `/db/blogs?userId=${encodeURIComponent(userId)}` : '/db/blogs';
  const response = await serverFetch(url);

  if (!response.ok) {
    throw new Error('Failed to get blog posts');
  }

  const data = await response.json();
  return data.posts || [];
}

/**
 * Delete a blog post
 */
export async function deleteBlogPost(postId: string): Promise<void> {
  const response = await serverFetch(`/db/blog/${postId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('Failed to delete blog post');
  }
}

/**
 * Update blog post metadata (without replacing the entire post)
 */
export async function updateBlogPost(
  postId: string,
  updates: Partial<SavedBlogPost>
): Promise<void> {
  const existing = await getBlogPost(postId);
  if (!existing) throw new Error('Blog post not found');

  const updated = { ...existing, ...updates };
  await saveBlogPost(updated);
}

// =============================================================================
// CAMPAIGN OPERATIONS
// =============================================================================

/**
 * Save a campaign
 */
export async function saveCampaign(campaign: Campaign): Promise<void> {
  const response = await serverFetch('/db/campaign/save', {
    method: 'POST',
    body: JSON.stringify(campaign),
  });

  if (!response.ok) {
    throw new Error('Failed to save campaign');
  }
}

/**
 * Get a campaign by ID
 */
export async function getCampaign(campaignId: string): Promise<Campaign | null> {
  const campaigns = await getCampaigns();
  return campaigns.find(c => c.id === campaignId) || null;
}

/**
 * Get all campaigns (optionally filtered by user)
 */
export async function getCampaigns(userId?: string): Promise<Campaign[]> {
  const url = userId ? `/db/campaigns?userId=${encodeURIComponent(userId)}` : '/db/campaigns';
  const response = await serverFetch(url);

  if (!response.ok) {
    throw new Error('Failed to get campaigns');
  }

  const data = await response.json();
  return data.campaigns || [];
}

/**
 * Delete a campaign
 */
export async function deleteCampaign(campaignId: string): Promise<void> {
  // Note: Delete endpoint not yet implemented on server
  // For now, we can mark as deleted or skip this operation
  console.warn('Delete campaign not yet implemented');
}

/**
 * Update campaign
 */
export async function updateCampaign(
  campaignId: string,
  updates: Partial<Campaign>
): Promise<void> {
  const existing = await getCampaign(campaignId);
  if (!existing) throw new Error('Campaign not found');

  const updated = {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  await saveCampaign(updated);
}

// =============================================================================
// USER PROFILE OPERATIONS
// =============================================================================

/**
 * Save user profile
 */
export async function saveUserProfile(profile: UserProfile): Promise<void> {
  const response = await serverFetch('/db/user/save', {
    method: 'POST',
    body: JSON.stringify(profile),
  });

  if (!response.ok) {
    throw new Error('Failed to save user profile');
  }
}

/**
 * Get user profile by ID
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const response = await serverFetch(`/db/user/${userId}`);

  if (!response.ok) {
    throw new Error('Failed to get user profile');
  }

  const data = await response.json();
  return data.profile;
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  userId: string,
  updates: Partial<UserProfile>
): Promise<void> {
  const existing = await getUserProfile(userId);
  if (!existing) throw new Error('User profile not found');

  const updated = { ...existing, ...updates };
  await saveUserProfile(updated);
}

// =============================================================================
// TOKEN USAGE TRACKING
// =============================================================================

/**
 * Record token usage for a date
 */
export async function recordTokenUsage(
  date: string,
  operation: string,
  tokens: number,
  cost: number
): Promise<void> {
  const response = await serverFetch('/db/token-usage/record', {
    method: 'POST',
    body: JSON.stringify({ date, operation, tokens, cost }),
  });

  if (!response.ok) {
    throw new Error('Failed to record token usage');
  }
}

/**
 * Get token usage for a specific date
 */
export async function getTokenUsage(date: string): Promise<TokenUsageRecord | null> {
  const response = await serverFetch(`/db/token-usage/${date}`);

  if (!response.ok) {
    throw new Error('Failed to get token usage');
  }

  const data = await response.json();
  return data.usage;
}

/**
 * Get token usage for a date range
 */
export async function getTokenUsageRange(
  startDate: string,
  endDate: string
): Promise<TokenUsageRecord[]> {
  // For now, we'll need to fetch each date individually
  // A more efficient approach would be to add a server endpoint for this
  const records: TokenUsageRecord[] = [];

  // Simple implementation - can be optimized later
  const start = new Date(startDate);
  const end = new Date(endDate);
  const current = new Date(start);

  while (current <= end) {
    const dateStr = current.toISOString().split('T')[0];
    const usage = await getTokenUsage(dateStr);
    if (usage) {
      records.push(usage);
    }
    current.setDate(current.getDate() + 1);
  }

  return records.sort((a, b) => a.date.localeCompare(b.date));
}

// =============================================================================
// BATCH OPERATIONS
// =============================================================================

/**
 * Save multiple blog posts at once
 */
export async function saveBlogPosts(posts: SavedBlogPost[]): Promise<void> {
  // Save posts individually (can be optimized with a batch endpoint later)
  await Promise.all(posts.map(post => saveBlogPost(post)));
}

/**
 * Delete multiple blog posts at once
 */
export async function deleteBlogPosts(postIds: string[]): Promise<void> {
  // Delete posts individually (can be optimized with a batch endpoint later)
  await Promise.all(postIds.map(id => deleteBlogPost(id)));
}

// =============================================================================
// SEARCH & FILTER
// =============================================================================

/**
 * Search blog posts by content or metadata
 */
export async function searchBlogPosts(
  query: string,
  userId?: string
): Promise<SavedBlogPost[]> {
  const response = await serverFetch('/db/blogs/search', {
    method: 'POST',
    body: JSON.stringify({ query, userId }),
  });

  if (!response.ok) {
    throw new Error('Failed to search blog posts');
  }

  const data = await response.json();
  return data.posts || [];
}

/**
 * Get blog posts by category
 */
export async function getBlogPostsByCategory(
  category: string,
  userId?: string
): Promise<SavedBlogPost[]> {
  const posts = await getBlogPosts(userId);
  return posts.filter(p => p.category === category);
}

/**
 * Get blog posts by tag
 */
export async function getBlogPostsByTag(
  tag: string,
  userId?: string
): Promise<SavedBlogPost[]> {
  const posts = await getBlogPosts(userId);
  return posts.filter(p => p.tags?.includes(tag));
}

/**
 * Get published blog posts
 */
export async function getPublishedBlogPosts(userId?: string): Promise<SavedBlogPost[]> {
  const posts = await getBlogPosts(userId);
  return posts.filter(p => p.published);
}

// =============================================================================
// STATISTICS
// =============================================================================

/**
 * Get blog post statistics
 */
export async function getBlogStats(userId?: string): Promise<{
  totalPosts: number;
  publishedPosts: number;
  draftPosts: number;
  totalWordCount: number;
  averageQualityScore: number;
  categoryCounts: Record<string, number>;
  tagCounts: Record<string, number>;
}> {
  const url = userId ? `/db/blog-stats?userId=${encodeURIComponent(userId)}` : '/db/blog-stats';
  const response = await serverFetch(url);

  if (!response.ok) {
    throw new Error('Failed to get blog stats');
  }

  const data = await response.json();
  return data.stats;
}

/**
 * Get campaign statistics
 */
export async function getCampaignStats(userId?: string): Promise<{
  totalCampaigns: number;
  activeCampaigns: number;
  completedCampaigns: number;
  totalPosts: number;
  platformCounts: Record<string, number>;
}> {
  const campaigns = await getCampaigns(userId);

  const stats = {
    totalCampaigns: campaigns.length,
    activeCampaigns: campaigns.filter(c => c.status === 'active').length,
    completedCampaigns: campaigns.filter(c => c.status === 'completed').length,
    totalPosts: campaigns.reduce((sum, c) => sum + c.postIds.length, 0),
    platformCounts: {} as Record<string, number>,
  };

  // Count platforms
  campaigns.forEach(c => {
    c.platforms?.forEach(platform => {
      stats.platformCounts[platform] = (stats.platformCounts[platform] || 0) + 1;
    });
  });

  return stats;
}
