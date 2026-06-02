// =============================================================================
// AI IMAGE GENERATOR — DALL-E 3 & Stable Diffusion Integration
// =============================================================================

export interface ImageGenerationOptions {
  prompt: string;
  style?: 'vivid' | 'natural' | 'artistic' | 'photographic' | 'digital-art';
  size?: '1024x1024' | '1792x1024' | '1024x1792';
  quality?: 'standard' | 'hd';
  n?: number; // Number of variations
}

export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  revisedPrompt?: string;
  altText: string;
  style: string;
  size: string;
  timestamp: Date;
}

/**
 * Generate image prompt from blog post content
 */
export function generateImagePromptFromContent(
  content: string,
  title: string,
  keywords: string[]
): string {
  // Extract key themes from content
  const firstParagraph = content.split('\n\n')[0] || content.substring(0, 500);

  // Build a rich, descriptive prompt
  const keywordStr = keywords.slice(0, 3).join(', ');

  const prompt = `Create a professional, eye-catching featured image for a blog post titled "${title}".
The image should visually represent: ${keywordStr}.
Style: Modern, clean, vibrant colors, high quality.
The image should be engaging and suitable for social media sharing.
Context: ${firstParagraph.substring(0, 200)}`;

  return prompt.replace(/\s+/g, ' ').trim();
}

/**
 * Generate alt text for an image
 */
export function generateAltText(prompt: string, title: string): string {
  // Create descriptive alt text from the prompt and title
  const altText = `Featured image for "${title}" - ${prompt.substring(0, 100)}`;
  return altText.replace(/\s+/g, ' ').trim();
}

/**
 * Get style-specific prompt modifications
 */
export function getStylePrompt(style: string): string {
  const stylePrompts: Record<string, string> = {
    vivid: 'ultra-detailed, vibrant colors, dramatic lighting, high contrast, bold composition',
    natural: 'natural lighting, realistic photography, authentic feel, organic composition',
    artistic: 'artistic interpretation, creative style, unique perspective, expressive colors',
    photographic: 'professional photography, studio quality, perfect lighting, sharp focus',
    'digital-art': 'digital illustration, modern design, clean vector style, contemporary aesthetic',
  };

  return stylePrompts[style] || stylePrompts.vivid;
}

/**
 * Generate featured image using AI (DALL-E 3 via backend)
 */
export async function generateFeaturedImage(
  options: ImageGenerationOptions,
  serverFetch: (url: string, init?: RequestInit) => Promise<Response>
): Promise<GeneratedImage> {
  const { prompt, style = 'vivid', size = '1024x1024', quality = 'hd' } = options;

  // Enhance prompt with style
  const enhancedPrompt = `${prompt}\nStyle: ${getStylePrompt(style)}`;

  const response = await serverFetch('/generate-image', {
    method: 'POST',
    body: JSON.stringify({
      prompt: enhancedPrompt,
      size,
      quality,
      n: 1,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to generate image' }));
    throw new Error(error.error || 'Failed to generate image');
  }

  const result = await response.json();

  if (!result.success || !result.image) {
    throw new Error(result.error || 'No image returned from server');
  }

  return {
    id: `img-${Date.now()}`,
    url: result.image.url,
    prompt: prompt,
    revisedPrompt: result.image.revised_prompt,
    altText: generateAltText(prompt, ''),
    style,
    size,
    timestamp: new Date(),
  };
}

/**
 * Generate multiple image variations
 */
export async function generateImageVariations(
  basePrompt: string,
  count: number,
  serverFetch: (url: string, init?: RequestInit) => Promise<Response>
): Promise<GeneratedImage[]> {
  const variations: GeneratedImage[] = [];
  const styles: Array<ImageGenerationOptions['style']> = ['vivid', 'natural', 'artistic', 'photographic', 'digital-art'];

  for (let i = 0; i < Math.min(count, 5); i++) {
    try {
      const style = styles[i % styles.length];
      const image = await generateFeaturedImage(
        {
          prompt: basePrompt,
          style,
          size: '1024x1024',
          quality: 'hd',
        },
        serverFetch
      );
      variations.push(image);
    } catch (error) {
      console.error(`Failed to generate variation ${i + 1}:`, error);
    }
  }

  return variations;
}

/**
 * Download image from URL
 */
export function downloadImage(url: string, filename: string) {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Get image URL from DALL-E response
 */
export function extractImageUrl(response: any): string {
  if (response.data && Array.isArray(response.data) && response.data.length > 0) {
    return response.data[0].url || response.data[0].b64_json;
  }
  throw new Error('Invalid image response format');
}
