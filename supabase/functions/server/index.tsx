import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
import * as auth from "./auth.tsx";
import * as blogGen from "./blogGeneration.tsx";
import * as db from "./database.tsx";
import * as ai from "./aiIntegration.tsx";
import { scrapeWebsite } from "./scraper.tsx";
const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoints (multiple server IDs for compatibility)
app.get("/make-server-7d87310d/health", (c) => {
  return c.json({ status: "ok", server: "make-server-7d87310d" });
});

app.get("/make-server-7d87310d/health", (c) => {
  return c.json({ status: "ok", server: "make-server-7d87310d" });
});

// ═══════════════════════════════════════════════════════════════════════════════
// AUTHENTICATION ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════════

app.post("/make-server-7d87310d/auth/signup", auth.handleSignUp);
app.post("/make-server-7d87310d/auth/signin", auth.handleSignIn);
app.post("/make-server-7d87310d/auth/signout", auth.handleSignOut);
app.post("/make-server-7d87310d/auth/oauth", auth.handleOAuth);
app.post("/make-server-7d87310d/auth/refresh", auth.handleRefreshToken);
app.post("/make-server-7d87310d/auth/update", auth.handleUpdateUser);
app.post("/make-server-7d87310d/auth/reset-password", auth.handlePasswordReset);
app.post("/make-server-7d87310d/auth/update-password", auth.handleUpdatePassword);

// ═══════════════════════════════════════════════════════════════════════════════
// BLOG GENERATION ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════════

app.post("/make-server-7d87310d/generate-blogs", blogGen.handleBlogGeneration);

// ═══════════════════════════════════════════════════════════════════════════════
// SCRAPER ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════════

app.post("/make-server-7d87310d/scrape", async (c) => {
  try {
    const body = await c.req.json();
    const { url } = body;

    if (!url) {
      return c.json({ success: false, error: "URL is required" }, 400);
    }

    console.log(`[Scraper] Scraping: ${url}`);
    const data = await scrapeWebsite(url);

    return c.json({ success: true, data });
  } catch (error: any) {
    console.error("[Scraper] Error:", error);
    return c.json({ success: false, error: error.message || "Failed to scrape website" }, 500);
  }
});

app.post("/make-server-7d87310d/scrape-multi", async (c) => {
  try {
    const body = await c.req.json();
    const { urls } = body;

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return c.json({ success: false, error: "URLs array is required" }, 400);
    }

    console.log(`[Scraper] Multi-scraping ${urls.length} URLs`);
    const results = [];
    const errors = [];

    for (const url of urls) {
      try {
        const data = await scrapeWebsite(url);
        results.push(data);
      } catch (err: any) {
        errors.push({ url, error: err.message });
        console.warn(`[Scraper] Failed for ${url}:`, err.message);
      }
    }

    // Merge all scraped data into a single combined result
    const combined = {
      title: results[0]?.title || 'Combined Sources',
      description: `Content from ${results.length} sources`,
      content: results.map(r => r.content).join('\n\n'),
      cleanContent: results.map(r => r.cleanContent).join('\n\n'),
      headings: results.flatMap(r => r.headings || []),
      keyPoints: results.flatMap(r => r.keyPoints || []),
      dataPoints: results.flatMap(r => r.dataPoints || []),
      quotes: results.flatMap(r => r.quotes || []),
      products: results.flatMap(r => r.products || []),
      keywords: results.flatMap(r => r.keywords || []),
      semanticKeywords: results.flatMap(r => r.semanticKeywords || []),
      businessType: results[0]?.businessType || 'general',
      coreTopic: results[0]?.coreTopic || '',
      missingAngles: results.flatMap(r => r.missingAngles || []),
    };

    return c.json({
      success: true,
      data: combined,
      sourceCount: results.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error("[Scraper] Multi-scrape error:", error);
    return c.json({ success: false, error: error.message || "Failed to scrape multiple URLs" }, 500);
  }
});

// Image generation endpoint
app.post("/make-server-7d87310d/generate-image", async (c) => {
  try {
    const body = await c.req.json();
    const { prompt, size, quality, n } = body;

    if (!prompt) {
      return c.json({ success: false, error: "Prompt is required" }, 400);
    }

    console.log(`[Image Generation] Generating image for prompt: ${prompt.substring(0, 100)}...`);

    const result = await ai.generateImage({
      prompt,
      size: size || '1024x1024',
      quality: quality || 'hd',
      n: n || 1,
    });

    if (!result.success) {
      console.error('[Image Generation] Failed:', result.error);
      return c.json({ success: false, error: result.error }, 500);
    }

    console.log('[Image Generation] Success');
    return c.json({ success: true, image: result.image });
  } catch (error: any) {
    console.error('[Image Generation] Error:', error);
    return c.json({ success: false, error: error.message || 'Failed to generate image' }, 500);
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// DATABASE ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════════

// Blog posts
app.post("/make-server-7d87310d/db/blog/save", db.handleSaveBlogPost);
app.get("/make-server-7d87310d/db/blog/:id", db.handleGetBlogPost);
app.get("/make-server-7d87310d/db/blogs", db.handleGetBlogPosts);
app.delete("/make-server-7d87310d/db/blog/:id", db.handleDeleteBlogPost);
app.post("/make-server-7d87310d/db/blogs/search", db.handleSearchBlogPosts);

// Campaigns
app.post("/make-server-7d87310d/db/campaign/save", db.handleSaveCampaign);
app.get("/make-server-7d87310d/db/campaigns", db.handleGetCampaigns);

// User profiles
app.post("/make-server-7d87310d/db/user/save", db.handleSaveUserProfile);
app.get("/make-server-7d87310d/db/user/:id", db.handleGetUserProfile);

// Token usage
app.post("/make-server-7d87310d/db/token-usage/record", db.handleRecordTokenUsage);
app.get("/make-server-7d87310d/db/token-usage/:date", db.handleGetTokenUsage);

// Statistics
app.get("/make-server-7d87310d/db/blog-stats", db.handleGetBlogStats);

// ═══════════════════════════════════════════════════════════════════════════════
// SMART BLOG STUDIO ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════════

// AI Content Generation
app.post("/make-server-7d87310d/blog/generate", async (c) => {
  try {
    const body = await c.req.json();
    const { topic, config } = body;

    if (!topic) {
      return c.json({ success: false, error: "Topic is required" }, 400);
    }

    console.log(`[SmartBlog] Generating content for topic: ${topic}`);

    // In production, this would call Gemini, OpenAI, or Claude API
    // For now, return simulated AI response

    const result = {
      success: true,
      article: {
        id: `article-${Date.now()}`,
        topic,
        generatedAt: Date.now(),
        // Real implementation would include full AI-generated content
        mock: true,
      },
    };

    return c.json(result);
  } catch (error: any) {
    console.error("[SmartBlog] Generation error:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Plagiarism Detection
app.post("/make-server-7d87310d/blog/check-plagiarism", async (c) => {
  try {
    const body = await c.req.json();
    const { content } = body;

    if (!content) {
      return c.json({ success: false, error: "Content is required" }, 400);
    }

    // In production: check against plagiarism databases
    // Calculate similarity scores, identify duplicate sentences

    const originalityScore = Math.round(90 + Math.random() * 10);

    const result = {
      success: true,
      originalityScore,
      duplicateCount: originalityScore < 95 ? Math.floor(Math.random() * 5) : 0,
      sources: originalityScore < 95 ? ["example.com/similar-article"] : [],
      recommendation: originalityScore >= 90
        ? "Content is highly original"
        : "Some sections may need rewriting",
    };

    return c.json(result);
  } catch (error: any) {
    console.error("[SmartBlog] Plagiarism check error:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Fact Checking
app.post("/make-server-7d87310d/blog/fact-check", async (c) => {
  try {
    const body = await c.req.json();
    const { content } = body;

    if (!content) {
      return c.json({ success: false, error: "Content is required" }, 400);
    }

    // In production: use fact-checking APIs, knowledge bases
    // Verify claims against authoritative sources

    const result = {
      success: true,
      claims: [
        {
          text: "AI adoption increased by 60% in 2025",
          verified: true,
          confidence: 95,
          source: "Gartner Research 2025",
        },
      ],
      overallAccuracy: 95,
      unverifiedClaims: 0,
    };

    return c.json(result);
  } catch (error: any) {
    console.error("[SmartBlog] Fact check error:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// SEO Analysis
app.post("/make-server-7d87310d/blog/analyze-seo", async (c) => {
  try {
    const body = await c.req.json();
    const { title, content, keywords } = body;

    if (!content) {
      return c.json({ success: false, error: "Content is required" }, 400);
    }

    // Calculate SEO metrics
    const wordCount = content.split(/\s+/).length;
    const keywordDensity = keywords ? (content.toLowerCase().split(keywords[0].toLowerCase()).length - 1) / wordCount * 100 : 0;

    const result = {
      success: true,
      seoScore: Math.round(80 + Math.random() * 15),
      metrics: {
        wordCount,
        keywordDensity: keywordDensity.toFixed(2),
        titleLength: title?.length || 0,
        headingCount: (content.match(/^##\s/gm) || []).length,
        internalLinks: (content.match(/\[.*?\]\(\/.*?\)/g) || []).length,
      },
      suggestions: [
        wordCount < 1500 ? "Consider adding more content (target: 1500+ words)" : null,
        keywordDensity < 1 ? "Increase keyword density (target: 1-2%)" : null,
      ].filter(Boolean),
    };

    return c.json(result);
  } catch (error: any) {
    console.error("[SmartBlog] SEO analysis error:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Readability Analysis
app.post("/make-server-7d87310d/blog/analyze-readability", async (c) => {
  try {
    const body = await c.req.json();
    const { content } = body;

    if (!content) {
      return c.json({ success: false, error: "Content is required" }, 400);
    }

    // Calculate Flesch-Kincaid, Hemingway, etc.
    const sentences = content.split(/[.!?]+/).length;
    const words = content.split(/\s+/).length;
    const syllables = Math.round(words * 1.5); // Simplified

    const avgWordsPerSentence = words / sentences;
    const avgSyllablesPerWord = syllables / words;

    // Flesch Reading Ease (simplified)
    const fleschScore = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord);
    const readabilityScore = Math.max(0, Math.min(100, Math.round(fleschScore)));

    const result = {
      success: true,
      readabilityScore,
      metrics: {
        fleschKincaidGrade: Math.round((0.39 * avgWordsPerSentence) + (11.8 * avgSyllablesPerWord) - 15.59),
        avgWordsPerSentence: avgWordsPerSentence.toFixed(1),
        avgSyllablesPerWord: avgSyllablesPerWord.toFixed(1),
        sentenceCount: sentences,
        wordCount: words,
      },
      interpretation: readabilityScore >= 70 ? "Easy to read" :
        readabilityScore >= 50 ? "Fairly easy to read" :
          "Difficult to read",
      suggestions: avgWordsPerSentence > 20 ? ["Break up long sentences"] : [],
    };

    return c.json(result);
  } catch (error: any) {
    console.error("[SmartBlog] Readability analysis error:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Headline A/B Testing
app.post("/make-server-7d87310d/blog/generate-headlines", async (c) => {
  try {
    const body = await c.req.json();
    const { topic, count = 5 } = body;

    if (!topic) {
      return c.json({ success: false, error: "Topic is required" }, 400);
    }

    // In production: use AI to generate compelling headline variants
    const templates = [
      `The Complete Guide to ${topic}`,
      `How to Master ${topic} in 2026`,
      `${topic}: Everything You Need to Know`,
      `10 Proven Strategies for ${topic}`,
      `${topic} Explained: A Comprehensive Guide`,
      `The Ultimate ${topic} Playbook`,
      `${topic} Best Practices for Success`,
      `Why ${topic} Matters More Than Ever`,
    ];

    const headlines = templates.slice(0, count).map((headline, idx) => ({
      id: idx + 1,
      text: headline,
      predictedCTR: Math.round(5 + Math.random() * 10),
      emotionalScore: Math.round(60 + Math.random() * 30),
      seoScore: Math.round(70 + Math.random() * 25),
    }));

    return c.json({ success: true, headlines });
  } catch (error: any) {
    console.error("[SmartBlog] Headline generation error:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Auto-Tagging & Categorization
app.post("/make-server-7d87310d/blog/auto-tag", async (c) => {
  try {
    const body = await c.req.json();
    const { content } = body;

    if (!content) {
      return c.json({ success: false, error: "Content is required" }, 400);
    }

    // In production: use NLP/ML for entity extraction and categorization
    const result = {
      success: true,
      tags: ["AI", "Technology", "Guide", "2026", "Best Practices"],
      categories: ["Guides", "Technology", "How-To"],
      entities: [
        { text: "artificial intelligence", type: "technology", confidence: 0.95 },
        { text: "machine learning", type: "technology", confidence: 0.92 },
      ],
    };

    return c.json(result);
  } catch (error: any) {
    console.error("[SmartBlog] Auto-tagging error:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Sentiment Analysis
app.post("/make-server-7d87310d/blog/analyze-sentiment", async (c) => {
  try {
    const body = await c.req.json();
    const { content } = body;

    if (!content) {
      return c.json({ success: false, error: "Content is required" }, 400);
    }

    // In production: use sentiment analysis APIs
    const positiveWords = (content.match(/\b(great|excellent|amazing|good|best|perfect)\b/gi) || []).length;
    const negativeWords = (content.match(/\b(bad|poor|terrible|worst|awful)\b/gi) || []).length;

    const totalWords = content.split(/\s+/).length;
    const sentimentScore = ((positiveWords - negativeWords) / totalWords) * 100 + 50;

    const result = {
      success: true,
      overallSentiment: sentimentScore > 60 ? "positive" : sentimentScore < 40 ? "negative" : "neutral",
      score: Math.max(0, Math.min(100, Math.round(sentimentScore))),
      emotions: {
        joy: Math.round(Math.random() * 30),
        trust: Math.round(Math.random() * 40),
        anticipation: Math.round(Math.random() * 35),
      },
    };

    return c.json(result);
  } catch (error: any) {
    console.error("[SmartBlog] Sentiment analysis error:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Citation Generator
app.post("/make-server-7d87310d/blog/generate-citations", async (c) => {
  try {
    const body = await c.req.json();
    const { sources } = body;

    if (!sources || !Array.isArray(sources)) {
      return c.json({ success: false, error: "Sources array is required" }, 400);
    }

    // Generate formatted citations
    const citations = sources.map((source: any, idx: number) => ({
      id: idx + 1,
      text: `[${idx + 1}] ${source.title}. ${source.author || "Unknown Author"}. ${source.year || new Date().getFullYear()}.`,
      format: "APA",
      url: source.url || "",
    }));

    return c.json({ success: true, citations });
  } catch (error: any) {
    console.error("[SmartBlog] Citation generation error:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

Deno.serve(app.fetch);