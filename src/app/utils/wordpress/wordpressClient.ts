// =============================================================================
// WORDPRESS CLIENT — WordPress REST API Integration
// =============================================================================
//
// Provides WordPress REST API client for publishing blog posts, uploading
// media, and managing content on WordPress sites.
//
// Features:
// - Post creation and updates
// - Media upload (featured images)
// - Category and tag synchronization
// - Scheduled publishing
// - Bulk operations
// - Multi-site support
//
// =============================================================================

export interface WordPressConfig {
  siteUrl: string;
  username: string;
  applicationPassword: string; // WordPress Application Password
}

export interface WordPressPost {
  id?: number;
  title: string;
  content: string;
  excerpt?: string;
  status: 'draft' | 'publish' | 'pending' | 'future';
  categories?: number[];
  tags?: number[];
  featured_media?: number;
  date?: string; // ISO 8601 format for scheduled posts
  slug?: string;
  meta?: {
    description?: string;
    keywords?: string;
  };
}

export interface WordPressMedia {
  id: number;
  source_url: string;
  title: { rendered: string };
  alt_text: string;
}

export interface WordPressCategory {
  id: number;
  name: string;
  slug: string;
}

export interface WordPressTag {
  id: number;
  name: string;
  slug: string;
}

export interface PublishResult {
  success: boolean;
  postId?: number;
  postUrl?: string;
  error?: string;
}

// =============================================================================
// CONFIGURATION STORAGE
// =============================================================================

const WP_CONFIG_KEY = 'wordpress_config';
const WP_SITES_KEY = 'wordpress_sites'; // For multi-site support

/**
 * Save WordPress configuration
 */
export function saveWordPressConfig(config: WordPressConfig): void {
  localStorage.setItem(WP_CONFIG_KEY, JSON.stringify(config));
}

/**
 * Get WordPress configuration
 */
export function getWordPressConfig(): WordPressConfig | null {
  try {
    const config = localStorage.getItem(WP_CONFIG_KEY);
    return config ? JSON.parse(config) : null;
  } catch (error) {
    console.error('[WordPress] Error reading config:', error);
    return null;
  }
}

/**
 * Clear WordPress configuration
 */
export function clearWordPressConfig(): void {
  localStorage.removeItem(WP_CONFIG_KEY);
}

/**
 * Check if WordPress is configured
 */
export function isWordPressConfigured(): boolean {
  return getWordPressConfig() !== null;
}

/**
 * Save multiple WordPress sites (for multi-site support)
 */
export function saveWordPressSites(sites: Record<string, WordPressConfig>): void {
  localStorage.setItem(WP_SITES_KEY, JSON.stringify(sites));
}

/**
 * Get all WordPress sites
 */
export function getWordPressSites(): Record<string, WordPressConfig> {
  try {
    const sites = localStorage.getItem(WP_SITES_KEY);
    return sites ? JSON.parse(sites) : {};
  } catch (error) {
    console.error('[WordPress] Error reading sites:', error);
    return {};
  }
}

// =============================================================================
// API CLIENT
// =============================================================================

class WordPressClient {
  private config: WordPressConfig;

  constructor(config: WordPressConfig) {
    this.config = config;
  }

  /**
   * Get base API URL
   */
  private getApiUrl(): string {
    const url = this.config.siteUrl.replace(/\/$/, '');
    return `${url}/wp-json/wp/v2`;
  }

  /**
   * Get authentication headers
   */
  private getAuthHeaders(): Record<string, string> {
    const credentials = btoa(`${this.config.username}:${this.config.applicationPassword}`);
    return {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Make API request
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.getApiUrl()}${endpoint}`;
    const headers = {
      ...this.getAuthHeaders(),
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  /**
   * Test connection to WordPress site
   */
  async testConnection(): Promise<boolean> {
    try {
      // Try to fetch current user
      await this.request('/users/me');
      return true;
    } catch (error) {
      console.error('[WordPress] Connection test failed:', error);
      return false;
    }
  }

  /**
   * Create a new post
   */
  async createPost(post: WordPressPost): Promise<PublishResult> {
    try {
      const result = await this.request<any>('/posts', {
        method: 'POST',
        body: JSON.stringify(post),
      });

      return {
        success: true,
        postId: result.id,
        postUrl: result.link,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create post',
      };
    }
  }

  /**
   * Update an existing post
   */
  async updatePost(postId: number, post: Partial<WordPressPost>): Promise<PublishResult> {
    try {
      const result = await this.request<any>(`/posts/${postId}`, {
        method: 'POST',
        body: JSON.stringify(post),
      });

      return {
        success: true,
        postId: result.id,
        postUrl: result.link,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update post',
      };
    }
  }

  /**
   * Upload media file
   */
  async uploadMedia(file: File, altText?: string): Promise<WordPressMedia> {
    const formData = new FormData();
    formData.append('file', file);
    if (altText) {
      formData.append('alt_text', altText);
    }

    const url = `${this.getApiUrl()}/media`;
    const credentials = btoa(`${this.config.username}:${this.config.applicationPassword}`);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload media');
    }

    return response.json();
  }

  /**
   * Get all categories
   */
  async getCategories(): Promise<WordPressCategory[]> {
    return this.request<WordPressCategory[]>('/categories?per_page=100');
  }

  /**
   * Create a category
   */
  async createCategory(name: string, slug?: string): Promise<WordPressCategory> {
    return this.request<WordPressCategory>('/categories', {
      method: 'POST',
      body: JSON.stringify({
        name,
        slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
      }),
    });
  }

  /**
   * Get all tags
   */
  async getTags(): Promise<WordPressTag[]> {
    return this.request<WordPressTag[]>('/tags?per_page=100');
  }

  /**
   * Create a tag
   */
  async createTag(name: string, slug?: string): Promise<WordPressTag> {
    return this.request<WordPressTag>('/tags', {
      method: 'POST',
      body: JSON.stringify({
        name,
        slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
      }),
    });
  }

  /**
   * Get or create category by name
   */
  async getOrCreateCategory(name: string): Promise<number> {
    const categories = await this.getCategories();
    const existing = categories.find(c => c.name.toLowerCase() === name.toLowerCase());

    if (existing) {
      return existing.id;
    }

    const newCategory = await this.createCategory(name);
    return newCategory.id;
  }

  /**
   * Get or create tag by name
   */
  async getOrCreateTag(name: string): Promise<number> {
    const tags = await this.getTags();
    const existing = tags.find(t => t.name.toLowerCase() === name.toLowerCase());

    if (existing) {
      return existing.id;
    }

    const newTag = await this.createTag(name);
    return newTag.id;
  }

  /**
   * Get or create multiple tags
   */
  async getOrCreateTags(tagNames: string[]): Promise<number[]> {
    const tagIds: number[] = [];

    for (const name of tagNames) {
      const id = await this.getOrCreateTag(name);
      tagIds.push(id);
    }

    return tagIds;
  }

  /**
   * Delete a post
   */
  async deletePost(postId: number): Promise<boolean> {
    try {
      await this.request(`/posts/${postId}`, {
        method: 'DELETE',
      });
      return true;
    } catch (error) {
      console.error('[WordPress] Delete failed:', error);
      return false;
    }
  }

  /**
   * Get post by ID
   */
  async getPost(postId: number): Promise<any> {
    return this.request(`/posts/${postId}`);
  }
}

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

/**
 * Get WordPress client with current configuration
 */
export function getWordPressClient(): WordPressClient | null {
  const config = getWordPressConfig();
  if (!config) return null;
  return new WordPressClient(config);
}

/**
 * Test WordPress connection
 */
export async function testWordPressConnection(config?: WordPressConfig): Promise<boolean> {
  const clientConfig = config || getWordPressConfig();
  if (!clientConfig) return false;

  const client = new WordPressClient(clientConfig);
  return client.testConnection();
}

/**
 * Publish a blog post to WordPress
 */
export async function publishToWordPress(
  post: WordPressPost,
  config?: WordPressConfig
): Promise<PublishResult> {
  const clientConfig = config || getWordPressConfig();
  if (!clientConfig) {
    return {
      success: false,
      error: 'WordPress not configured',
    };
  }

  const client = new WordPressClient(clientConfig);
  return client.createPost(post);
}

/**
 * Publish multiple posts to WordPress
 */
export async function publishBulkToWordPress(
  posts: WordPressPost[],
  config?: WordPressConfig,
  onProgress?: (index: number, total: number) => void
): Promise<PublishResult[]> {
  const clientConfig = config || getWordPressConfig();
  if (!clientConfig) {
    return posts.map(() => ({
      success: false,
      error: 'WordPress not configured',
    }));
  }

  const client = new WordPressClient(clientConfig);
  const results: PublishResult[] = [];

  for (let i = 0; i < posts.length; i++) {
    onProgress?.(i + 1, posts.length);
    const result = await client.createPost(posts[i]);
    results.push(result);

    // Add delay between posts to avoid rate limiting
    if (i < posts.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return results;
}

/**
 * Upload featured image and get media ID
 */
export async function uploadFeaturedImage(
  file: File,
  altText?: string,
  config?: WordPressConfig
): Promise<number | null> {
  const clientConfig = config || getWordPressConfig();
  if (!clientConfig) return null;

  try {
    const client = new WordPressClient(clientConfig);
    const media = await client.uploadMedia(file, altText);
    return media.id;
  } catch (error) {
    console.error('[WordPress] Media upload failed:', error);
    return null;
  }
}

/**
 * Sync categories and tags
 */
export async function syncCategoriesAndTags(
  categoryNames: string[],
  tagNames: string[],
  config?: WordPressConfig
): Promise<{ categories: number[]; tags: number[] } | null> {
  const clientConfig = config || getWordPressConfig();
  if (!clientConfig) return null;

  try {
    const client = new WordPressClient(clientConfig);

    const categories = await Promise.all(
      categoryNames.map(name => client.getOrCreateCategory(name))
    );

    const tags = await client.getOrCreateTags(tagNames);

    return { categories, tags };
  } catch (error) {
    console.error('[WordPress] Sync failed:', error);
    return null;
  }
}

// Export WordPress client class for advanced usage
export { WordPressClient };
