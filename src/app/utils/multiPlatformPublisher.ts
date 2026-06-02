// =============================================================================
// MULTI-PLATFORM PUBLISHER — Medium, LinkedIn, Dev.to, Hashnode
// =============================================================================

export type PublishingPlatform = 'medium' | 'linkedin' | 'devto' | 'hashnode';

export interface PublishingConfig {
  platform: PublishingPlatform;
  apiKey?: string;
  accessToken?: string;
  organizationId?: string;
  publicationId?: string;
}

export interface PublishRequest {
  title: string;
  content: string;
  tags?: string[];
  canonicalUrl?: string;
  publishStatus?: 'public' | 'draft' | 'unlisted';
  coverImage?: string;
  subtitle?: string;
}

export interface PublishResult {
  success: boolean;
  url?: string;
  id?: string;
  error?: string;
  platform: PublishingPlatform;
}

/**
 * Format content for each platform
 */
export function formatContentForPlatform(
  content: string,
  platform: PublishingPlatform
): string {
  switch (platform) {
    case 'medium':
      return formatForMedium(content);
    case 'linkedin':
      return formatForLinkedIn(content);
    case 'devto':
      return formatForDevTo(content);
    case 'hashnode':
      return formatForHashnode(content);
    default:
      return content;
  }
}

/**
 * Format content for Medium
 * Medium uses Markdown-like format
 */
function formatForMedium(content: string): string {
  // Medium supports standard Markdown
  // Add Medium-specific formatting

  // Convert code blocks to Medium's format
  let formatted = content.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
    return `\`\`\`${lang || ''}\n${code}\`\`\``;
  });

  // Add Medium's emphasis
  formatted = formatted.replace(/\*\*\*(.*?)\*\*\*/g, '***$1***');

  return formatted;
}

/**
 * Format content for LinkedIn
 * LinkedIn has character limits and limited Markdown support
 */
function formatForLinkedIn(content: string): string {
  // LinkedIn Articles support limited HTML
  // Convert Markdown to HTML

  let formatted = content;

  // Convert headers
  formatted = formatted.replace(/^### (.*?)$/gm, '<h3>$1</h3>');
  formatted = formatted.replace(/^## (.*?)$/gm, '<h2>$1</h2>');
  formatted = formatted.replace(/^# (.*?)$/gm, '<h1>$1</h1>');

  // Convert bold
  formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  // Convert italic
  formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');

  // Convert links
  formatted = formatted.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  // Convert lists
  formatted = formatted.replace(/^- (.*?)$/gm, '<li>$1</li>');
  formatted = formatted.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');

  // Convert code
  formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>');

  return formatted;
}

/**
 * Format content for Dev.to
 * Dev.to uses Markdown with front matter
 */
function formatForDevTo(content: string): string {
  // Dev.to supports full Markdown with front matter
  return content;
}

/**
 * Format content for Hashnode
 * Hashnode uses Markdown
 */
function formatForHashnode(content: string): string {
  // Hashnode supports full Markdown
  return content;
}

/**
 * Publish to Medium
 */
export async function publishToMedium(
  config: PublishingConfig,
  request: PublishRequest
): Promise<PublishResult> {
  try {
    if (!config.accessToken) {
      throw new Error('Medium access token not configured');
    }

    // Get user ID first
    const userResponse = await fetch('https://api.medium.com/v1/me', {
      headers: {
        'Authorization': `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!userResponse.ok) {
      throw new Error('Failed to authenticate with Medium');
    }

    const userData = await userResponse.json();
    const userId = userData.data.id;

    // Create post
    const response = await fetch(`https://api.medium.com/v1/users/${userId}/posts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: request.title,
        contentFormat: 'markdown',
        content: formatForMedium(request.content),
        tags: request.tags?.slice(0, 5), // Medium allows max 5 tags
        publishStatus: request.publishStatus || 'draft',
        canonicalUrl: request.canonicalUrl,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.errors?.[0]?.message || 'Failed to publish to Medium');
    }

    const result = await response.json();

    return {
      success: true,
      url: result.data.url,
      id: result.data.id,
      platform: 'medium',
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      platform: 'medium',
    };
  }
}

/**
 * Publish to LinkedIn
 */
export async function publishToLinkedIn(
  config: PublishingConfig,
  request: PublishRequest
): Promise<PublishResult> {
  try {
    if (!config.accessToken) {
      throw new Error('LinkedIn access token not configured');
    }

    // LinkedIn Articles API
    const response = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify({
        author: `urn:li:person:${config.organizationId}`,
        lifecycleState: request.publishStatus === 'draft' ? 'DRAFT' : 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: request.title,
            },
            shareMediaCategory: 'ARTICLE',
            media: [
              {
                status: 'READY',
                description: {
                  text: request.subtitle || '',
                },
                originalUrl: request.canonicalUrl || '',
                title: {
                  text: request.title,
                },
              },
            ],
          },
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to publish to LinkedIn');
    }

    const result = await response.json();

    return {
      success: true,
      id: result.id,
      platform: 'linkedin',
      url: `https://www.linkedin.com/feed/update/${result.id}`,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      platform: 'linkedin',
    };
  }
}

/**
 * Publish to Dev.to
 */
export async function publishToDevTo(
  config: PublishingConfig,
  request: PublishRequest
): Promise<PublishResult> {
  try {
    if (!config.apiKey) {
      throw new Error('Dev.to API key not configured');
    }

    // Build front matter
    const frontMatter = [
      '---',
      `title: ${request.title}`,
      request.subtitle ? `description: ${request.subtitle}` : '',
      request.tags ? `tags: ${request.tags.join(', ')}` : '',
      request.publishStatus === 'draft' ? 'published: false' : 'published: true',
      request.canonicalUrl ? `canonical_url: ${request.canonicalUrl}` : '',
      request.coverImage ? `cover_image: ${request.coverImage}` : '',
      '---',
      '',
    ].filter(Boolean).join('\n');

    const response = await fetch('https://dev.to/api/articles', {
      method: 'POST',
      headers: {
        'api-key': config.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        article: {
          body_markdown: frontMatter + request.content,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to publish to Dev.to');
    }

    const result = await response.json();

    return {
      success: true,
      url: result.url,
      id: result.id.toString(),
      platform: 'devto',
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      platform: 'devto',
    };
  }
}

/**
 * Publish to Hashnode
 */
export async function publishToHashnode(
  config: PublishingConfig,
  request: PublishRequest
): Promise<PublishResult> {
  try {
    if (!config.apiKey) {
      throw new Error('Hashnode API key not configured');
    }

    if (!config.publicationId) {
      throw new Error('Hashnode publication ID not configured');
    }

    // Hashnode uses GraphQL
    const mutation = `
      mutation CreatePublicationStory($input: CreateStoryInput!) {
        createPublicationStory(input: $input) {
          code
          success
          message
          post {
            _id
            slug
            title
          }
        }
      }
    `;

    const variables = {
      input: {
        title: request.title,
        contentMarkdown: request.content,
        tags: request.tags?.map(tag => ({ _id: tag, name: tag, slug: tag })) || [],
        coverImageURL: request.coverImage,
        isPartOfPublication: {
          publicationId: config.publicationId,
        },
        subtitle: request.subtitle,
        canonicalUrl: request.canonicalUrl,
      },
    };

    const response = await fetch('https://api.hashnode.com', {
      method: 'POST',
      headers: {
        'Authorization': config.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: mutation, variables }),
    });

    if (!response.ok) {
      throw new Error('Failed to publish to Hashnode');
    }

    const result = await response.json();

    if (!result.data?.createPublicationStory?.success) {
      throw new Error(result.data?.createPublicationStory?.message || 'Failed to publish to Hashnode');
    }

    const post = result.data.createPublicationStory.post;

    return {
      success: true,
      id: post._id,
      url: `https://hashnode.com/post/${post.slug}`,
      platform: 'hashnode',
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      platform: 'hashnode',
    };
  }
}

/**
 * Publish to multiple platforms
 */
export async function publishToMultiplePlatforms(
  configs: PublishingConfig[],
  request: PublishRequest
): Promise<PublishResult[]> {
  const results = await Promise.all(
    configs.map(async (config) => {
      switch (config.platform) {
        case 'medium':
          return await publishToMedium(config, request);
        case 'linkedin':
          return await publishToLinkedIn(config, request);
        case 'devto':
          return await publishToDevTo(config, request);
        case 'hashnode':
          return await publishToHashnode(config, request);
        default:
          return {
            success: false,
            error: 'Unknown platform',
            platform: config.platform,
          };
      }
    })
  );

  return results;
}

/**
 * Get platform-specific configuration requirements
 */
export function getPlatformRequirements(platform: PublishingPlatform): {
  requiresApiKey: boolean;
  requiresAccessToken: boolean;
  requiresOrgId: boolean;
  requiresPublicationId: boolean;
  authUrl?: string;
} {
  switch (platform) {
    case 'medium':
      return {
        requiresApiKey: false,
        requiresAccessToken: true,
        requiresOrgId: false,
        requiresPublicationId: false,
        authUrl: 'https://medium.com/m/oauth/authorize',
      };
    case 'linkedin':
      return {
        requiresApiKey: false,
        requiresAccessToken: true,
        requiresOrgId: true,
        requiresPublicationId: false,
        authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
      };
    case 'devto':
      return {
        requiresApiKey: true,
        requiresAccessToken: false,
        requiresOrgId: false,
        requiresPublicationId: false,
      };
    case 'hashnode':
      return {
        requiresApiKey: true,
        requiresAccessToken: false,
        requiresOrgId: false,
        requiresPublicationId: true,
      };
  }
}
