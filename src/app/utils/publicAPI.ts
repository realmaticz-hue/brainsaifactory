// =============================================================================
// PUBLIC API — REST API with TypeScript SDK
// =============================================================================

export interface APIKey {
  id: string;
  name: string;
  key: string;
  secret: string;
  createdAt: Date;
  lastUsed?: Date;
  expiresAt?: Date;
  permissions: APIPermission[];
  rateLimit: RateLimit;
  status: 'active' | 'revoked' | 'expired';
}

export type APIPermission =
  | 'posts:read'
  | 'posts:write'
  | 'posts:delete'
  | 'analytics:read'
  | 'media:upload'
  | 'publish:execute'
  | 'users:read'
  | 'webhooks:manage';

export interface RateLimit {
  requestsPerHour: number;
  requestsPerDay: number;
  burstLimit: number;
}

export interface APIUsage {
  apiKeyId: string;
  timestamp: Date;
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  ipAddress?: string;
}

export interface WebhookEndpoint {
  id: string;
  url: string;
  events: WebhookEvent[];
  secret: string;
  createdAt: Date;
  lastTriggered?: Date;
  status: 'active' | 'inactive';
  retryPolicy: {
    maxRetries: number;
    backoffMultiplier: number;
  };
}

export type WebhookEvent =
  | 'post.created'
  | 'post.updated'
  | 'post.published'
  | 'post.deleted'
  | 'analytics.generated'
  | 'media.uploaded';

/**
 * Generate new API key
 */
export function generateAPIKey(
  name: string,
  permissions: APIPermission[],
  options?: {
    expiresIn?: number; // days
    rateLimit?: Partial<RateLimit>;
  }
): APIKey {
  const apiKey: APIKey = {
    id: `key-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name,
    key: `pk_${generateRandomString(32)}`,
    secret: `sk_${generateRandomString(48)}`,
    createdAt: new Date(),
    expiresAt: options?.expiresIn
      ? new Date(Date.now() + options.expiresIn * 24 * 60 * 60 * 1000)
      : undefined,
    permissions,
    rateLimit: {
      requestsPerHour: options?.rateLimit?.requestsPerHour || 1000,
      requestsPerDay: options?.rateLimit?.requestsPerDay || 10000,
      burstLimit: options?.rateLimit?.burstLimit || 100,
    },
    status: 'active',
  };

  // Store API key
  const keys = getAPIKeys();
  keys.push(apiKey);
  saveAPIKeys(keys);

  return apiKey;
}

/**
 * Get all API keys
 */
export function getAPIKeys(): APIKey[] {
  const stored = localStorage.getItem('apiKeys');
  if (!stored) return [];

  const keys = JSON.parse(stored) as APIKey[];

  return keys.map(k => ({
    ...k,
    createdAt: new Date(k.createdAt),
    lastUsed: k.lastUsed ? new Date(k.lastUsed) : undefined,
    expiresAt: k.expiresAt ? new Date(k.expiresAt) : undefined,
  }));
}

/**
 * Save API keys
 */
function saveAPIKeys(keys: APIKey[]): void {
  localStorage.setItem('apiKeys', JSON.stringify(keys));
}

/**
 * Revoke API key
 */
export function revokeAPIKey(keyId: string): void {
  const keys = getAPIKeys();
  const key = keys.find(k => k.id === keyId);

  if (key) {
    key.status = 'revoked';
    saveAPIKeys(keys);
  }
}

/**
 * Validate API key
 */
export function validateAPIKey(
  key: string,
  requiredPermission?: APIPermission
): { valid: boolean; apiKey?: APIKey; error?: string } {
  const keys = getAPIKeys();
  const apiKey = keys.find(k => k.key === key || k.secret === key);

  if (!apiKey) {
    return { valid: false, error: 'Invalid API key' };
  }

  if (apiKey.status !== 'active') {
    return { valid: false, error: 'API key is not active' };
  }

  if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
    apiKey.status = 'expired';
    saveAPIKeys(keys);
    return { valid: false, error: 'API key has expired' };
  }

  if (requiredPermission && !apiKey.permissions.includes(requiredPermission)) {
    return { valid: false, error: 'Insufficient permissions' };
  }

  // Update last used
  apiKey.lastUsed = new Date();
  saveAPIKeys(keys);

  return { valid: true, apiKey };
}

/**
 * Check rate limit
 */
export function checkRateLimit(apiKeyId: string): {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
} {
  const usage = getAPIUsage(apiKeyId);
  const keys = getAPIKeys();
  const apiKey = keys.find(k => k.id === apiKeyId);

  if (!apiKey) {
    return { allowed: false, remaining: 0, resetAt: new Date() };
  }

  // Count requests in last hour
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recentRequests = usage.filter(u => u.timestamp > oneHourAgo);

  const remaining = apiKey.rateLimit.requestsPerHour - recentRequests.length;
  const resetAt = new Date(oneHourAgo.getTime() + 60 * 60 * 1000);

  return {
    allowed: remaining > 0,
    remaining: Math.max(0, remaining),
    resetAt,
  };
}

/**
 * Log API usage
 */
export function logAPIUsage(
  apiKeyId: string,
  endpoint: string,
  method: string,
  statusCode: number,
  responseTime: number
): void {
  const usage: APIUsage = {
    apiKeyId,
    timestamp: new Date(),
    endpoint,
    method,
    statusCode,
    responseTime,
  };

  const allUsage = getAPIUsage();
  allUsage.push(usage);

  // Keep last 10,000 entries
  const trimmed = allUsage.slice(-10000);
  localStorage.setItem('apiUsage', JSON.stringify(trimmed));
}

/**
 * Get API usage
 */
export function getAPIUsage(apiKeyId?: string): APIUsage[] {
  const stored = localStorage.getItem('apiUsage');
  if (!stored) return [];

  let usage = JSON.parse(stored) as APIUsage[];

  usage = usage.map(u => ({
    ...u,
    timestamp: new Date(u.timestamp),
  }));

  if (apiKeyId) {
    usage = usage.filter(u => u.apiKeyId === apiKeyId);
  }

  return usage;
}

/**
 * Get API usage statistics
 */
export function getAPIStats(apiKeyId?: string): {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  avgResponseTime: number;
  requestsByEndpoint: Record<string, number>;
  requestsByDay: Record<string, number>;
} {
  const usage = getAPIUsage(apiKeyId);

  const stats = {
    totalRequests: usage.length,
    successfulRequests: usage.filter(u => u.statusCode >= 200 && u.statusCode < 300).length,
    failedRequests: usage.filter(u => u.statusCode >= 400).length,
    avgResponseTime: usage.length > 0
      ? Math.round(usage.reduce((sum, u) => sum + u.responseTime, 0) / usage.length)
      : 0,
    requestsByEndpoint: {} as Record<string, number>,
    requestsByDay: {} as Record<string, number>,
  };

  // Group by endpoint
  usage.forEach(u => {
    stats.requestsByEndpoint[u.endpoint] = (stats.requestsByEndpoint[u.endpoint] || 0) + 1;

    const day = u.timestamp.toISOString().split('T')[0];
    stats.requestsByDay[day] = (stats.requestsByDay[day] || 0) + 1;
  });

  return stats;
}

/**
 * Create webhook endpoint
 */
export function createWebhook(
  url: string,
  events: WebhookEvent[]
): WebhookEndpoint {
  const webhook: WebhookEndpoint = {
    id: `webhook-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    url,
    events,
    secret: `whsec_${generateRandomString(32)}`,
    createdAt: new Date(),
    status: 'active',
    retryPolicy: {
      maxRetries: 3,
      backoffMultiplier: 2,
    },
  };

  const webhooks = getWebhooks();
  webhooks.push(webhook);
  saveWebhooks(webhooks);

  return webhook;
}

/**
 * Get webhooks
 */
export function getWebhooks(): WebhookEndpoint[] {
  const stored = localStorage.getItem('webhooks');
  if (!stored) return [];

  const webhooks = JSON.parse(stored) as WebhookEndpoint[];

  return webhooks.map(w => ({
    ...w,
    createdAt: new Date(w.createdAt),
    lastTriggered: w.lastTriggered ? new Date(w.lastTriggered) : undefined,
  }));
}

/**
 * Save webhooks
 */
function saveWebhooks(webhooks: WebhookEndpoint[]): void {
  localStorage.setItem('webhooks', JSON.stringify(webhooks));
}

/**
 * Delete webhook
 */
export function deleteWebhook(webhookId: string): void {
  const webhooks = getWebhooks();
  const filtered = webhooks.filter(w => w.id !== webhookId);
  saveWebhooks(filtered);
}

/**
 * Trigger webhook
 */
export async function triggerWebhook(
  event: WebhookEvent,
  payload: Record<string, any>
): Promise<void> {
  const webhooks = getWebhooks().filter(
    w => w.status === 'active' && w.events.includes(event)
  );

  for (const webhook of webhooks) {
    try {
      // In production, this would make actual HTTP request
      console.log(`Triggering webhook ${webhook.id}`, {
        url: webhook.url,
        event,
        payload,
      });

      webhook.lastTriggered = new Date();
      saveWebhooks(getWebhooks());
    } catch (error) {
      console.error(`Failed to trigger webhook ${webhook.id}:`, error);
    }
  }
}

/**
 * Generate random string
 */
function generateRandomString(length: number): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// =============================================================================
// TYPESCRIPT SDK
// =============================================================================

export class ContentCreatorSDK {
  private apiKey: string;
  private baseURL: string;

  constructor(apiKey: string, baseURL: string = 'https://api.yourapp.com/v1') {
    this.apiKey = apiKey;
    this.baseURL = baseURL;
  }

  /**
   * Make API request
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Posts API
   */
  posts = {
    list: async (params?: { limit?: number; offset?: number }) => {
      return this.request<any>('/posts', {
        method: 'GET',
      });
    },

    get: async (postId: string) => {
      return this.request<any>(`/posts/${postId}`, {
        method: 'GET',
      });
    },

    create: async (data: Record<string, any>) => {
      return this.request<any>('/posts', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    update: async (postId: string, data: Record<string, any>) => {
      return this.request<any>(`/posts/${postId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },

    delete: async (postId: string) => {
      return this.request<any>(`/posts/${postId}`, {
        method: 'DELETE',
      });
    },

    publish: async (postId: string, platforms: string[]) => {
      return this.request<any>(`/posts/${postId}/publish`, {
        method: 'POST',
        body: JSON.stringify({ platforms }),
      });
    },
  };

  /**
   * Analytics API
   */
  analytics = {
    get: async (postId: string) => {
      return this.request<any>(`/analytics/posts/${postId}`, {
        method: 'GET',
      });
    },

    overview: async () => {
      return this.request<any>('/analytics/overview', {
        method: 'GET',
      });
    },
  };

  /**
   * Media API
   */
  media = {
    upload: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${this.baseURL}/media`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      return response.json();
    },
  };

  /**
   * Webhooks API
   */
  webhooks = {
    list: async () => {
      return this.request<WebhookEndpoint[]>('/webhooks', {
        method: 'GET',
      });
    },

    create: async (url: string, events: WebhookEvent[]) => {
      return this.request<WebhookEndpoint>('/webhooks', {
        method: 'POST',
        body: JSON.stringify({ url, events }),
      });
    },

    delete: async (webhookId: string) => {
      return this.request<any>(`/webhooks/${webhookId}`, {
        method: 'DELETE',
      });
    },
  };
}

/**
 * SDK Usage Example:
 *
 * import { ContentCreatorSDK } from './publicAPI';
 *
 * const sdk = new ContentCreatorSDK('your-api-key');
 *
 * // Create a post
 * const post = await sdk.posts.create({
 *   title: 'My Blog Post',
 *   content: 'Post content here...',
 *   tags: ['tech', 'ai']
 * });
 *
 * // Publish to platforms
 * await sdk.posts.publish(post.id, ['medium', 'linkedin']);
 *
 * // Get analytics
 * const analytics = await sdk.analytics.get(post.id);
 */
