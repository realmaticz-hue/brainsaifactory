// =============================================================================
// BLOG GENERATION — AI-Powered Blog Post Generation
// =============================================================================

import { generateWithAI, isAIConfigured } from "./aiIntegration.tsx";

/**
 * Generate blog posts using AI
 */
export async function handleBlogGeneration(c: any) {
  try {
    const body = await c.req.json();
    const { scrapedData, count7 = 10, count30 = 10 } = body;

    if (!scrapedData) {
      return c.json({ success: false, error: "Scraped data is required" }, 400);
    }

    console.log(`[BlogGen] Generating ${count7} 7-sec + ${count30} 30-sec posts`);

    // Check if AI is configured
    if (!isAIConfigured()) {
      console.log('[BlogGen] No AI configured, returning fallback signal');
      return c.json({
        success: false,
        error: 'No AI providers configured. Using template fallback.',
      });
    }

    // Build AI prompt for blog generation
    const prompt = buildBlogPrompt(scrapedData, count7, count30);

    // Generate with AI
    const result = await generateWithAI({
      prompt,
      complexity: 'medium',
      budgetPreference: 'balanced',
      maxTokens: 4000,
    });

    if (!result.success) {
      console.error('[BlogGen] AI generation failed:', result.error);
      return c.json({
        success: false,
        error: result.error || 'AI generation failed',
      });
    }

    // Parse AI response
    const { posts7sec, posts30sec, parseErrors } = parseBlogResponse(result.content);

    console.log(`[BlogGen] Parsed ${posts7sec.length} 7-sec + ${posts30sec.length} 30-sec posts`);

    return c.json({
      success: true,
      posts7sec,
      posts30sec,
      model: `${result.provider}/${result.model}`,
      tokens: result.tokens,
      cost: result.cost,
      parseErrors: parseErrors.length > 0 ? parseErrors : undefined,
    });
  } catch (error: any) {
    console.error("[BlogGen] Generation error:", error);
    return c.json({
      success: false,
      error: error.message || "Blog generation failed",
    }, 500);
  }
}

/**
 * Build AI prompt for blog generation
 */
function buildBlogPrompt(scrapedData: any, count7: number, count30: number): string {
  const topic = scrapedData.coreTopic || scrapedData.title || 'General topic';
  const description = scrapedData.description || '';
  const keyPoints = scrapedData.keyPoints?.slice(0, 5).join('\n- ') || '';
  const dataPoints = scrapedData.dataPoints?.slice(0, 3).join('\n- ') || '';

  return `You are an expert blog post writer specializing in viral, engaging content.

TOPIC: ${topic}
DESCRIPTION: ${description}

KEY POINTS:
${keyPoints ? `- ${keyPoints}` : 'N/A'}

DATA POINTS:
${dataPoints ? `- ${dataPoints}` : 'N/A'}

Generate ${count7} short blog posts (7-second read, ~50-100 words) and ${count30} longer blog posts (30-second read, ~200-250 words).

Each blog post should:
- Be engaging and viral-worthy
- Include buyer psychology triggers
- Be SEO-optimized
- Have a catchy headline
- Use conversational tone
- Include specific data points when relevant

Return your response in this exact JSON format:
{
  "posts7sec": [
    {
      "content": "Full blog post content here...",
      "seoTitle": "SEO-optimized title",
      "metaDescription": "Meta description for SEO",
      "slug": "url-friendly-slug",
      "primaryKeyword": "main keyword",
      "secondaryKeywords": ["keyword1", "keyword2"],
      "wordCount": 75,
      "qualityScore": 85,
      "angle": "buyer-psychology",
      "angleLabel": "Buyer Psychology"
    }
  ],
  "posts30sec": [
    {
      "content": "Full blog post content here...",
      "seoTitle": "SEO-optimized title",
      "metaDescription": "Meta description for SEO",
      "slug": "url-friendly-slug",
      "primaryKeyword": "main keyword",
      "secondaryKeywords": ["keyword1", "keyword2"],
      "wordCount": 225,
      "qualityScore": 90,
      "angle": "data-driven",
      "angleLabel": "Data-Driven Insights"
    }
  ]
}

IMPORTANT: Return ONLY valid JSON. No extra text before or after.`;
}

/**
 * Parse AI response into blog posts
 */
function parseBlogResponse(content: string): {
  posts7sec: any[];
  posts30sec: any[];
  parseErrors: string[];
} {
  const parseErrors: string[] = [];
  let posts7sec: any[] = [];
  let posts30sec: any[] = [];

  try {
    // Clean up response (remove markdown code blocks if present)
    let cleaned = content.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/^```json\s*/i, '').replace(/```\s*$/, '');
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```\s*/, '').replace(/```\s*$/, '');
    }

    const parsed = JSON.parse(cleaned);

    posts7sec = parsed.posts7sec || [];
    posts30sec = parsed.posts30sec || [];

    // Validate posts
    posts7sec = posts7sec.filter((post: any) => {
      if (!post.content || post.content.trim().length < 20) {
        parseErrors.push('7-sec post missing or too short content');
        return false;
      }
      return true;
    });

    posts30sec = posts30sec.filter((post: any) => {
      if (!post.content || post.content.trim().length < 50) {
        parseErrors.push('30-sec post missing or too short content');
        return false;
      }
      return true;
    });

    // Add defaults for missing fields
    posts7sec = posts7sec.map((post: any) => ({
      ...post,
      seoTitle: post.seoTitle || post.content.substring(0, 60),
      metaDescription: post.metaDescription || post.content.substring(0, 150),
      slug: post.slug || generateSlug(post.seoTitle || post.content),
      primaryKeyword: post.primaryKeyword || '',
      secondaryKeywords: post.secondaryKeywords || [],
      wordCount: post.wordCount || Math.ceil(post.content.split(/\s+/).length),
      qualityScore: post.qualityScore || 80,
      angle: post.angle || 'general',
      angleLabel: post.angleLabel || 'General',
    }));

    posts30sec = posts30sec.map((post: any) => ({
      ...post,
      seoTitle: post.seoTitle || post.content.substring(0, 60),
      metaDescription: post.metaDescription || post.content.substring(0, 150),
      slug: post.slug || generateSlug(post.seoTitle || post.content),
      primaryKeyword: post.primaryKeyword || '',
      secondaryKeywords: post.secondaryKeywords || [],
      wordCount: post.wordCount || Math.ceil(post.content.split(/\s+/).length),
      qualityScore: post.qualityScore || 85,
      angle: post.angle || 'general',
      angleLabel: post.angleLabel || 'General',
    }));

  } catch (error: any) {
    parseErrors.push(`JSON parse error: ${error.message}`);
    console.error('[BlogGen] Parse error:', error);
  }

  return { posts7sec, posts30sec, parseErrors };
}

/**
 * Generate URL-friendly slug from text
 */
function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 60);
}
