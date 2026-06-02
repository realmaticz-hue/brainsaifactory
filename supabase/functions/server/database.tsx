// =============================================================================
// DATABASE ENDPOINTS — Blog Database via KV Store
// =============================================================================

import * as kv from "./kv_store.tsx";

// =============================================================================
// BLOG POST OPERATIONS
// =============================================================================

export async function handleSaveBlogPost(c: any) {
  try {
    const post = await c.req.json();
    const key = `blog:${post.id}`;
    await kv.set(key, JSON.stringify(post));
    return c.json({ success: true });
  } catch (error: any) {
    console.error("[Database] Save blog post error:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
}

export async function handleGetBlogPost(c: any) {
  try {
    const postId = c.req.param("id");
    const key = `blog:${postId}`;
    const data = await kv.get(key);
    return c.json({ success: true, post: data ? JSON.parse(data) : null });
  } catch (error: any) {
    console.error("[Database] Get blog post error:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
}

export async function handleGetBlogPosts(c: any) {
  try {
    const userId = c.req.query("userId");
    const posts = await kv.getByPrefix("blog:");
    let parsed = posts.map((p) => JSON.parse(p));

    if (userId) {
      parsed = parsed.filter((p) => p.userId === userId);
    }

    // Sort by savedAt descending
    parsed.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());

    return c.json({ success: true, posts: parsed });
  } catch (error: any) {
    console.error("[Database] Get blog posts error:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
}

export async function handleDeleteBlogPost(c: any) {
  try {
    const postId = c.req.param("id");
    const key = `blog:${postId}`;
    await kv.del(key);
    return c.json({ success: true });
  } catch (error: any) {
    console.error("[Database] Delete blog post error:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
}

export async function handleSearchBlogPosts(c: any) {
  try {
    const body = await c.req.json();
    const { query, userId } = body;

    const posts = await kv.getByPrefix("blog:");
    let parsed = posts.map((p) => JSON.parse(p));

    if (userId) {
      parsed = parsed.filter((p) => p.userId === userId);
    }

    if (query) {
      const lowerQuery = query.toLowerCase();
      parsed = parsed.filter((post) => {
        const searchableText = [
          post.content,
          post.seoTitle,
          post.metaDescription,
          post.primaryKeyword,
          ...(post.secondaryKeywords || []),
          ...(post.tags || []),
          post.category,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return searchableText.includes(lowerQuery);
      });
    }

    return c.json({ success: true, posts: parsed });
  } catch (error: any) {
    console.error("[Database] Search blog posts error:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
}

// =============================================================================
// CAMPAIGN OPERATIONS
// =============================================================================

export async function handleSaveCampaign(c: any) {
  try {
    const campaign = await c.req.json();
    const key = `campaign:${campaign.id}`;
    await kv.set(key, JSON.stringify(campaign));
    return c.json({ success: true });
  } catch (error: any) {
    console.error("[Database] Save campaign error:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
}

export async function handleGetCampaigns(c: any) {
  try {
    const userId = c.req.query("userId");
    const campaigns = await kv.getByPrefix("campaign:");
    let parsed = campaigns.map((c) => JSON.parse(c));

    if (userId) {
      parsed = parsed.filter((c) => c.userId === userId);
    }

    // Sort by updatedAt descending
    parsed.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    return c.json({ success: true, campaigns: parsed });
  } catch (error: any) {
    console.error("[Database] Get campaigns error:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
}

// =============================================================================
// USER PROFILE OPERATIONS
// =============================================================================

export async function handleSaveUserProfile(c: any) {
  try {
    const profile = await c.req.json();
    const key = `user:${profile.id}`;
    await kv.set(key, JSON.stringify(profile));
    return c.json({ success: true });
  } catch (error: any) {
    console.error("[Database] Save user profile error:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
}

export async function handleGetUserProfile(c: any) {
  try {
    const userId = c.req.param("id");
    const key = `user:${userId}`;
    const data = await kv.get(key);
    return c.json({ success: true, profile: data ? JSON.parse(data) : null });
  } catch (error: any) {
    console.error("[Database] Get user profile error:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
}

// =============================================================================
// TOKEN USAGE TRACKING
// =============================================================================

export async function handleRecordTokenUsage(c: any) {
  try {
    const body = await c.req.json();
    const { date, operation, tokens, cost } = body;

    const key = `token-usage:${date}`;
    const existing = await kv.get(key);

    const record = existing
      ? JSON.parse(existing)
      : {
          date,
          totalTokens: 0,
          totalCost: 0,
          operations: {},
        };

    // Update totals
    record.totalTokens += tokens;
    record.totalCost += cost;

    // Update operation-specific stats
    if (!record.operations[operation]) {
      record.operations[operation] = { count: 0, tokens: 0, cost: 0 };
    }
    record.operations[operation].count++;
    record.operations[operation].tokens += tokens;
    record.operations[operation].cost += cost;

    await kv.set(key, JSON.stringify(record));
    return c.json({ success: true });
  } catch (error: any) {
    console.error("[Database] Record token usage error:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
}

export async function handleGetTokenUsage(c: any) {
  try {
    const date = c.req.param("date");
    const key = `token-usage:${date}`;
    const data = await kv.get(key);
    return c.json({ success: true, usage: data ? JSON.parse(data) : null });
  } catch (error: any) {
    console.error("[Database] Get token usage error:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
}

// =============================================================================
// STATISTICS
// =============================================================================

export async function handleGetBlogStats(c: any) {
  try {
    const userId = c.req.query("userId");
    const posts = await kv.getByPrefix("blog:");
    let parsed = posts.map((p) => JSON.parse(p));

    if (userId) {
      parsed = parsed.filter((p) => p.userId === userId);
    }

    const stats = {
      totalPosts: parsed.length,
      publishedPosts: parsed.filter((p) => p.published).length,
      draftPosts: parsed.filter((p) => !p.published).length,
      totalWordCount: parsed.reduce((sum, p) => sum + (p.wordCount || 0), 0),
      averageQualityScore:
        parsed.reduce((sum, p) => sum + (p.qualityScore || 0), 0) / parsed.length || 0,
      categoryCounts: {} as Record<string, number>,
      tagCounts: {} as Record<string, number>,
    };

    // Count categories
    parsed.forEach((p) => {
      if (p.category) {
        stats.categoryCounts[p.category] = (stats.categoryCounts[p.category] || 0) + 1;
      }
    });

    // Count tags
    parsed.forEach((p) => {
      p.tags?.forEach((tag: string) => {
        stats.tagCounts[tag] = (stats.tagCounts[tag] || 0) + 1;
      });
    });

    return c.json({ success: true, stats });
  } catch (error: any) {
    console.error("[Database] Get blog stats error:", error);
    return c.json({ success: false, error: error.message }, 500);
  }
}
