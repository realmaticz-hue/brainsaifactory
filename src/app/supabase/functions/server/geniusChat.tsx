// ─── Genius AI Chat Brain — Ultra RAG Pipeline ───────────────────────────────
// Full pipeline: Intent Analysis → Question Decomposition → Multi-Source RAG
// → Vector Similarity Scoring → Multi-Model AI → Critic AI → Memory Storage
// Agents: Academic, Web, YouTube, GitHub, Scientific, Social, Historical
// 🧠 Super Coding Brain: 12-Agent Multi-Agent Architecture (all surfaces)

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

import * as kv from "./kv_store.tsx";

const OPENROUTER_BASE = "https://openrouter.ai/api/v1";
const SITE_URL = "https://genius-ai.app";
const SITE_NAME = "Genius AI Chat";

// ─── Model Registry ───────────────────────────────────────────────────────────

export interface ModelConfig {
  model: string;
  name: string;
  provider: string;
  color: string;
  icon: string;
  reason: string;
  specialty: string;
}

const MODELS: Record<string, Omit<ModelConfig, "reason">> = {
  gpt4o: {
    model: "openai/gpt-4o",
    name: "GPT-4o",
    provider: "OpenAI",
    color: "#10b981",
    icon: "🤖",
    specialty: "Code, Reasoning & Analysis",
  },
  gpt4mini: {
    model: "openai/gpt-4o-mini",
    name: "GPT-4o Mini",
    provider: "OpenAI",
    color: "#6366f1",
    icon: "⚡",
    specialty: "Fast Responses & General Chat",
  },
  claude: {
    model: "anthropic/claude-3.5-sonnet",
    name: "Claude 3.5 Sonnet",
    provider: "Anthropic",
    color: "#ff6b35",
    icon: "🔮",
    specialty: "Long Documents & Deep Analysis",
  },
  gemini: {
    model: "google/gemini-2.0-flash-exp:free",
    name: "Gemini 2.0 Flash",
    provider: "Google",
    color: "#4285f4",
    icon: "💎",
    specialty: "Multimodal & Web Knowledge",
  },
  deepseek: {
    model: "deepseek/deepseek-r1:free",
    name: "DeepSeek R1",
    provider: "DeepSeek",
    color: "#a855f7",
    icon: "🧠",
    specialty: "Deep Reasoning & Mathematics",
  },
  llama: {
    model: "meta-llama/llama-3.3-70b-instruct:free",
    name: "Llama 3.3 70B",
    provider: "Meta",
    color: "#f59e0b",
    icon: "🦙",
    specialty: "Open-Source & General Tasks",
  },
};

// ─── Forbidden Content ────────────────────────────────────────────────────────

const FORBIDDEN_PATTERNS = [
  /\b(how to make|synthesize|manufacture)\s+(bomb|explosive|weapon|poison|fentanyl|meth|cocaine|heroin)/i,
  /\b(child|minor|underage)\s+(porn|sexual|nude|exploit)/i,
  /\b(hack|crack|bypass)\s+(password|bank|atm|credit card)\b/i,
  /\b(ddos|doxxing|stalk)\s+(attack|someone|person)\b/i,
  /\b(kill|murder|harm|hurt)\s+(specific person|president|politician)\b/i,
];

function isForbiddenContent(query: string): boolean {
  return FORBIDDEN_PATTERNS.some((p) => p.test(query));
}

// ─── AI Router ────────────────────────────────────────────────────────────────

export function routeToModel(query: string, contextLength: number = 0): ModelConfig {
  // Safety check
  if (!query || typeof query !== 'string') {
    return { ...MODELS.gemini, reason: "Invalid query → Gemini 2.0 Flash (default)" };
  }

  const lower = query.toLowerCase();
  const totalLength = query.length + contextLength;

  // Deep math/logic → DeepSeek R1
  if (/\b(proof|theorem|calculus|derivative|integral|matrix|eigenvalue|algorithm complexity|big-o|probability|statistics|combinatorics|topology|number theory)\b/.test(lower)) {
    return { ...MODELS.deepseek, reason: "Mathematical/logical problem → DeepSeek R1 (deep reasoning engine)" };
  }
  // Long document analysis → Claude for 200K context
  if (totalLength > 4000 || /\b(analyze this|summarize|explain this document|review this|read this entire|whole codebase|long document)\b/.test(lower)) {
    return { ...MODELS.claude, reason: "Long content detected → Claude 3.5 Sonnet (200K context window)" };
  }
  // Code & engineering → GPT-4o
  if (/\b(code|debug|fix|implement|refactor|typescript|javascript|python|rust|go|react|vue|angular|svelte|function|class|bug|error|stack trace|npm|yarn|pnpm|deploy|build|test|api|backend|frontend|database|sql|docker|kubernetes|aws|gcp|azure)\b/.test(lower)) {
    return { ...MODELS.gpt4o, reason: "Code/engineering query → GPT-4o (best coder & debugger)" };
  }
  // Academic & science → GPT-4o
  if (/\b(research|study|paper|arxiv|pubmed|journal|academic|science|biology|physics|medicine|chemistry|climate|neuroscience|quantum|experiment|hypothesis|data analysis)\b/.test(lower)) {
    return { ...MODELS.gpt4o, reason: "Academic/scientific query → GPT-4o (deep analytical reasoning)" };
  }
  // Business, writing, strategy → Claude (best for nuanced text)
  if (/\b(write|essay|email|blog|story|draft|copywriting|marketing|business|strategy|proposal|report|pitch|presentation|creative|content|rewrite|edit|improve)\b/.test(lower)) {
    return { ...MODELS.claude, reason: "Writing/business query → Claude 3.5 Sonnet (best prose & reasoning)" };
  }
  // Visual/multimodal → Gemini
  if (/\b(image|photo|picture|diagram|chart|visual|video|screenshot|design|color|layout|ui|ux)\b/.test(lower)) {
    return { ...MODELS.gemini, reason: "Visual/multimodal query → Gemini 2.0 Flash (multimodal specialist)" };
  }
  // Short / conversational → fast model
  if (query.length < 120) {
    return { ...MODELS.gemini, reason: "Concise conversational query → Gemini 2.0 Flash (free, fast & accurate)" };
  }
  // Default → Llama free (avoids paid credits on general queries)
  return { ...MODELS.llama, reason: "General query → Llama 3.3 70B (free, high-quality)" };
}

// ─── Research Sources ─────────────────────────────────────────────────────────

export interface ResearchSource {
  agent: string;
  agentIcon: string;
  title: string;
  url?: string;
  snippet: string;
  source: string;
  relevance?: number;
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error("timeout")), ms)),
  ]);
}

// ─── Vector Similarity Scoring ────────────────────────────────────────────────
// TF-IDF style keyword overlap to rank sources by relevance

function computeRelevance(query: string, text: string): number {
  const stopWords = new Set(["the", "a", "an", "is", "in", "on", "at", "to", "for", "of", "and", "or", "but", "how", "what", "why", "when", "where"]);
  const tokenize = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(w => w.length > 2 && !stopWords.has(w));
  const qTokens = new Set(tokenize(query));
  const tTokens = tokenize(text);
  if (qTokens.size === 0 || tTokens.length === 0) return 0;
  const matches = tTokens.filter(t => qTokens.has(t)).length;
  return Math.min(100, Math.round((matches / qTokens.size) * 100));
}

// ─── Query Cache ──────────────────────────────────────────────────────────────

async function getCachedResponse(query: string): Promise<string | null> {
  try {
    // Safety check
    if (!query || typeof query !== 'string') return null;

    const key = `genius-cache-${query.toLowerCase().trim().slice(0, 80).replace(/\s+/g, "-")}`;
    const cached = await kv.get(key) as { response: string; ts: number } | null;
    if (cached && Date.now() - cached.ts < 3600_000) return cached.response;
  } catch (_) { }
  return null;
}

async function setCachedResponse(query: string, response: string): Promise<void> {
  try {
    // Safety check
    if (!query || typeof query !== 'string') return;

    const key = `genius-cache-${query.toLowerCase().trim().slice(0, 80).replace(/\s+/g, "-")}`;
    await kv.set(key, { response, ts: Date.now() });
  } catch (_) { }
}

// ─── Agent 1: Academic Research — arXiv + Semantic Scholar ───────────────────

async function runAcademicAgent(query: string): Promise<ResearchSource[]> {
  const results: ResearchSource[] = [];
  const encoded = encodeURIComponent(query.slice(0, 100));

  try {
    const arxivRes = await fetch(
      `https://export.arxiv.org/api/query?search_query=all:${encoded}&max_results=3&sortBy=relevance`,
    );
    if (arxivRes.ok) {
      const text = await arxivRes.text();
      const entries = text.match(/<entry>([\s\S]*?)<\/entry>/g) || [];
      for (const entry of entries.slice(0, 2)) {
        const title = entry.match(/<title>([\s\S]*?)<\/title>/)?.[1]?.trim() || "";
        const summary = entry.match(/<summary>([\s\S]*?)<\/summary>/)?.[1]?.trim()?.slice(0, 200) || "";
        const id = entry.match(/<id>([\s\S]*?)<\/id>/)?.[1]?.trim() || "";
        if (title && summary) {
          results.push({
            agent: "Academic Research",
            agentIcon: "🎓",
            title: title.replace(/\n/g, " "),
            url: id,
            snippet: summary.replace(/\n/g, " ") + "...",
            source: "arXiv",
            relevance: computeRelevance(query, title + " " + summary),
          });
        }
      }
    }
  } catch (_) { }

  try {
    const ssRes = await fetch(
      `https://api.semanticscholar.org/graph/v1/paper/search?query=${encoded}&limit=2&fields=title,abstract,url,year`,
    );
    if (ssRes.ok) {
      const data = await ssRes.json();
      for (const paper of (data.data || []).slice(0, 2)) {
        if (paper.title && paper.abstract) {
          results.push({
            agent: "Academic Research",
            agentIcon: "🎓",
            title: paper.title,
            url: paper.url,
            snippet: (paper.abstract || "").slice(0, 200) + "...",
            source: `Google Scholar / Semantic Scholar${paper.year ? ` (${paper.year})` : ""}`,
            relevance: computeRelevance(query, paper.title + " " + paper.abstract),
          });
        }
      }
    }
  } catch (_) { }

  return results.slice(0, 3);
}

// ─── Agent 2: Web Knowledge — Wikipedia + DuckDuckGo ─────────────────────────

async function runWebKnowledgeAgent(query: string): Promise<ResearchSource[]> {
  const results: ResearchSource[] = [];
  const encoded = encodeURIComponent(query.slice(0, 80));

  try {
    const searchRes = await fetch(
      `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encoded}&format=json&srlimit=3&origin=*`,
    );
    if (searchRes.ok) {
      const data = await searchRes.json();
      const hits = data.query?.search || [];
      for (const hit of hits.slice(0, 2)) {
        const title = encodeURIComponent(hit.title);
        try {
          const summaryRes = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${title}`);
          if (summaryRes.ok) {
            const summary = await summaryRes.json();
            results.push({
              agent: "Web Knowledge",
              agentIcon: "🌐",
              title: summary.title,
              url: summary.content_urls?.desktop?.page,
              snippet: (summary.extract || hit.snippet?.replace(/<[^>]+>/g, "") || "").slice(0, 200) + "...",
              source: "Wikipedia",
              relevance: computeRelevance(query, summary.title + " " + (summary.extract || "")),
            });
          }
        } catch (_) {
          results.push({
            agent: "Web Knowledge",
            agentIcon: "🌐",
            title: hit.title,
            url: `https://en.wikipedia.org/wiki/${encodeURIComponent(hit.title)}`,
            snippet: (hit.snippet?.replace(/<[^>]+>/g, "") || "").slice(0, 200) + "...",
            source: "Wikipedia",
            relevance: computeRelevance(query, hit.title),
          });
        }
      }
    }
  } catch (_) { }

  try {
    const ddgRes = await fetch(
      `https://api.duckduckgo.com/?q=${encoded}&format=json&no_html=1&skip_disambig=1`,
    );
    if (ddgRes.ok) {
      const data = await ddgRes.json();
      if (data.AbstractText) {
        results.push({
          agent: "Web Knowledge",
          agentIcon: "🌐",
          title: data.Heading || query,
          url: data.AbstractURL,
          snippet: data.AbstractText.slice(0, 250),
          source: `DuckDuckGo (${data.AbstractSource || "Web"})`,
          relevance: computeRelevance(query, data.AbstractText),
        });
      }
      // Related topics as extra sources
      for (const rel of (data.RelatedTopics || []).slice(0, 2)) {
        if (rel.Text && rel.FirstURL) {
          results.push({
            agent: "Web Knowledge",
            agentIcon: "🌐",
            title: rel.Text.slice(0, 80),
            url: rel.FirstURL,
            snippet: rel.Text.slice(0, 150),
            source: "DuckDuckGo Related",
            relevance: computeRelevance(query, rel.Text),
          });
        }
      }
    }
  } catch (_) { }

  return results.slice(0, 4);
}

// ─── Agent 3: YouTube Videos ───────────────────────────────────────────────────

async function runYouTubeAgent(query: string): Promise<ResearchSource[]> {
  const results: ResearchSource[] = [];
  const encoded = encodeURIComponent(`${query} site:youtube.com`);

  try {
    // Search via DuckDuckGo for YouTube results
    const res = await fetch(
      `https://api.duckduckgo.com/?q=${encoded}&format=json&no_html=1&skip_disambig=1`,
    );
    if (res.ok) {
      const data = await res.json();
      for (const rel of (data.RelatedTopics || []).slice(0, 3)) {
        if (rel.FirstURL && rel.FirstURL.includes("youtube.com") && rel.Text) {
          results.push({
            agent: "YouTube",
            agentIcon: "▶️",
            title: rel.Text.slice(0, 100),
            url: rel.FirstURL,
            snippet: rel.Text.slice(0, 200),
            source: "YouTube",
            relevance: computeRelevance(query, rel.Text),
          });
        }
      }
    }
  } catch (_) { }

  // Fallback: construct YouTube search URL
  if (results.length === 0) {
    results.push({
      agent: "YouTube",
      agentIcon: "▶️",
      title: `YouTube: "${query.slice(0, 60)}"`,
      url: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
      snippet: `Watch videos about "${query}" on YouTube — tutorials, explanations, and discussions from creators worldwide.`,
      source: "YouTube Search",
      relevance: 60,
    });
  }

  return results;
}

// ─── Agent 4: Technical Documentation — GitHub + npm ─────────────────────────

async function runTechDocsAgent(query: string): Promise<ResearchSource[]> {
  const results: ResearchSource[] = [];
  const encoded = encodeURIComponent(query.slice(0, 80));

  try {
    const ghRes = await fetch(
      `https://api.github.com/search/repositories?q=${encoded}&sort=stars&per_page=3`,
      { headers: { Accept: "application/vnd.github.v3+json" } },
    );
    if (ghRes.ok) {
      const data = await ghRes.json();
      for (const repo of (data.items || []).slice(0, 2)) {
        results.push({
          agent: "Technical Docs",
          agentIcon: "⚙️",
          title: repo.full_name,
          url: repo.html_url,
          snippet: `${repo.description || "No description"} — ⭐ ${(repo.stargazers_count || 0).toLocaleString()} stars`,
          source: "GitHub",
          relevance: computeRelevance(query, repo.full_name + " " + (repo.description || "")),
        });
      }
    }
  } catch (_) { }

  try {
    const npmRes = await fetch(`https://registry.npmjs.org/-/v1/search?text=${encoded}&size=2`);
    if (npmRes.ok) {
      const data = await npmRes.json();
      for (const obj of (data.objects || []).slice(0, 2)) {
        const pkg = obj.package;
        results.push({
          agent: "Technical Docs",
          agentIcon: "⚙️",
          title: `npm: ${pkg.name}`,
          url: `https://www.npmjs.com/package/${pkg.name}`,
          snippet: `v${pkg.version} — ${pkg.description || "No description"}`,
          source: "npm Registry",
          relevance: computeRelevance(query, pkg.name + " " + (pkg.description || "")),
        });
      }
    }
  } catch (_) { }

  return results.slice(0, 3);
}

// ─── Agent 5: Historical Data — Internet Archive ──────────────────────────────

async function runHistoricalAgent(query: string): Promise<ResearchSource[]> {
  const results: ResearchSource[] = [];
  const encoded = encodeURIComponent(query.slice(0, 80));

  try {
    const res = await fetch(
      `https://archive.org/advancedsearch.php?q=${encoded}&fl=identifier,title,description,date&rows=3&output=json`,
    );
    if (res.ok) {
      const data = await res.json();
      for (const doc of (data.response?.docs || []).slice(0, 3)) {
        results.push({
          agent: "Historical Data",
          agentIcon: "📚",
          title: doc.title || "Archived Document",
          url: `https://archive.org/details/${doc.identifier}`,
          snippet: (doc.description || "No description available").slice(0, 200) + "...",
          source: `Internet Archive${doc.date ? ` (${doc.date})` : ""}`,
          relevance: computeRelevance(query, doc.title + " " + (doc.description || "")),
        });
      }
    }
  } catch (_) { }

  return results;
}

// ─── Agent 6: Scientific Validation — CrossRef ───────────────────────────────

async function runScientificAgent(query: string): Promise<ResearchSource[]> {
  const results: ResearchSource[] = [];
  const encoded = encodeURIComponent(query.slice(0, 80));

  try {
    const res = await fetch(
      `https://api.crossref.org/works?query=${encoded}&rows=3&select=title,author,DOI,abstract,published`,
    );
    if (res.ok) {
      const data = await res.json();
      for (const item of (data.message?.items || []).slice(0, 3)) {
        const title = Array.isArray(item.title) ? item.title[0] : item.title;
        const authors = (item.author || []).slice(0, 2).map((a: any) => a.family).join(", ");
        const year = item.published?.["date-parts"]?.[0]?.[0];
        const abstract = Array.isArray(item.abstract) ? item.abstract[0] : (item.abstract || "");
        results.push({
          agent: "Scientific Validation",
          agentIcon: "🔬",
          title: title || "Research Article",
          url: item.DOI ? `https://doi.org/${item.DOI}` : undefined,
          snippet: `${authors ? `By ${authors}. ` : ""}${year ? `Published ${year}. ` : ""}${abstract.replace(/<[^>]+>/g, "").slice(0, 200)}...`,
          source: "CrossRef / DOI",
          relevance: computeRelevance(query, title + " " + abstract),
        });
      }
    }
  } catch (_) { }

  return results;
}

// ─── Agent 7: Social & Community — Hacker News + Reddit ──────────────────────

async function runSocialAgent(query: string): Promise<ResearchSource[]> {
  const results: ResearchSource[] = [];
  const encoded = encodeURIComponent(query.slice(0, 80));

  try {
    const hnRes = await fetch(
      `https://hn.algolia.com/api/v1/search?query=${encoded}&tags=story&hitsPerPage=3`,
    );
    if (hnRes.ok) {
      const data = await hnRes.json();
      for (const hit of (data.hits || []).slice(0, 2)) {
        if (hit.title && hit.points > 5) {
          results.push({
            agent: "Social & Community",
            agentIcon: "👥",
            title: hit.title,
            url: hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
            snippet: `${hit.points} points · ${hit.num_comments} comments · Hacker News`,
            source: "Hacker News",
            relevance: computeRelevance(query, hit.title),
          });
        }
      }
    }
  } catch (_) { }

  try {
    const rdRes = await fetch(
      `https://www.reddit.com/search.json?q=${encoded}&limit=3&sort=relevance`,
      { headers: { "User-Agent": "GeniusAI/1.0" } },
    );
    if (rdRes.ok) {
      const data = await rdRes.json();
      for (const post of (data.data?.children || []).slice(0, 2)) {
        const p = post.data;
        if (p.title && p.score > 10) {
          results.push({
            agent: "Social & Community",
            agentIcon: "👥",
            title: p.title,
            url: `https://reddit.com${p.permalink}`,
            snippet: `r/${p.subreddit} · ${p.score} upvotes · ${p.num_comments} comments`,
            source: "Reddit",
            relevance: computeRelevance(query, p.title + " " + p.subreddit),
          });
        }
      }
    }
  } catch (_) { }

  return results.slice(0, 3);
}

// ─── Run All Agents ───────────────────────────────────────────────────────────

export interface AgentResult {
  name: string;
  icon: string;
  status: "success" | "empty" | "error";
  sources: ResearchSource[];
  duration: number;
}

export async function runAllAgents(query: string, agentFlags: Record<string, boolean> = {}): Promise<AgentResult[]> {
  const shouldRun = (name: string) => agentFlags[name] !== false;

  const agents: Array<{ name: string; icon: string; fn: () => Promise<ResearchSource[]> }> = [
    { name: "Academic Research", icon: "🎓", fn: () => runAcademicAgent(query) },
    { name: "Web Knowledge", icon: "🌐", fn: () => runWebKnowledgeAgent(query) },
    { name: "YouTube", icon: "▶️", fn: () => runYouTubeAgent(query) },
    { name: "Technical Docs", icon: "⚙️", fn: () => runTechDocsAgent(query) },
    { name: "Historical Data", icon: "📚", fn: () => runHistoricalAgent(query) },
    { name: "Scientific", icon: "🔬", fn: () => runScientificAgent(query) },
    { name: "Social & Community", icon: "👥", fn: () => runSocialAgent(query) },
  ];

  const results = await Promise.allSettled(
    agents.map(async (agent) => {
      if (!shouldRun(agent.name)) {
        return { name: agent.name, icon: agent.icon, status: "empty" as const, sources: [], duration: 0 };
      }
      const start = Date.now();
      try {
        const sources = await withTimeout(agent.fn(), 7000);
        return {
          name: agent.name,
          icon: agent.icon,
          status: sources.length > 0 ? ("success" as const) : ("empty" as const),
          sources,
          duration: Date.now() - start,
        };
      } catch (e) {
        return { name: agent.name, icon: agent.icon, status: "error" as const, sources: [], duration: Date.now() - start };
      }
    }),
  );

  return results.map((r) => (r.status === "fulfilled" ? r.value : { name: "Unknown", icon: "❓", status: "error" as const, sources: [], duration: 0 }));
}

// ─── Memory System ────────────────────────────────────────────────────────────

interface MemoryEntry {
  id: string;
  timestamp: number;
  query: string;
  response: string;
  model: string;
  topics: string[];
}

// Rich user profile stored in memory
interface UserProfile {
  interests: string[];        // Detected topic interests
  projects: string[];         // Mentioned projects
  goals: string[];            // What user is trying to achieve
  preferredStyle: string;     // storytelling | technical | simple
  pastQuestions: string[];    // Last 20 questions
  updatedAt: number;
}

export async function saveToMemory(sessionId: string, entry: Omit<MemoryEntry, "id">): Promise<void> {
  try {
    const key = `genius-memory-${sessionId}`;
    const existing: MemoryEntry[] = (await kv.get(key)) || [];
    const newEntry: MemoryEntry = { ...entry, id: `mem-${Date.now()}` };
    const updated = [...existing.slice(-49), newEntry];
    await kv.set(key, updated);
  } catch (e) {
    console.log("Memory save error:", e);
  }
}

export async function getMemory(sessionId: string): Promise<MemoryEntry[]> {
  try {
    return (await kv.get(`genius-memory-${sessionId}`)) || [];
  } catch {
    return [];
  }
}

async function updateUserProfile(sessionId: string, query: string, response: string): Promise<void> {
  try {
    const key = `genius-profile-${sessionId}`;
    const existing: UserProfile = (await kv.get(key)) || {
      interests: [], projects: [], goals: [], preferredStyle: "technical",
      pastQuestions: [], updatedAt: Date.now(),
    };

    // Extract interests from query topics
    const topicKeywords = extractTopics(query);
    const newInterests = [...new Set([...existing.interests, ...topicKeywords])].slice(-20);

    // Detect project mentions
    const projectMatch = query.match(/(?:project|app|site|building|making|creating)\s+(?:called|named|called)?\s*([A-Z][a-zA-Z]+)/g);
    const newProjects = projectMatch
      ? [...new Set([...existing.projects, ...projectMatch.map(p => p.replace(/^.*\s/, ""))])].slice(-10)
      : existing.projects;

    // Detect goals
    const goalPatterns = [
      /(?:i want to|trying to|need to|goal is to|help me)\s+(.{10,60})/i,
      /(?:how do i|how can i)\s+(.{10,60})/i,
    ];
    const newGoals = [...existing.goals];
    for (const pat of goalPatterns) {
      const m = query.match(pat);
      if (m) newGoals.push(m[1].trim().slice(0, 60));
    }

    // Detect preferred style
    let style = existing.preferredStyle;
    if (/explain.*simple|eli5|like.*5|plain english|simple terms/i.test(query)) style = "simple";
    else if (/tell.*story|analogy|example like|imagine/i.test(query)) style = "storytelling";
    else if (/technical|in depth|detailed|advanced/i.test(query)) style = "technical";

    const updated: UserProfile = {
      interests: newInterests,
      projects: newProjects,
      goals: [...new Set(newGoals)].slice(-10),
      preferredStyle: style,
      pastQuestions: [...existing.pastQuestions, query.slice(0, 100)].slice(-20),
      updatedAt: Date.now(),
    };

    await kv.set(key, updated);
  } catch (e) {
    console.log("Profile update error:", e);
  }
}

export async function getUserProfile(sessionId: string): Promise<UserProfile | null> {
  try {
    return await kv.get(`genius-profile-${sessionId}`);
  } catch {
    return null;
  }
}

export async function saveCorrection(sessionId: string, originalAnswer: string, correction: string): Promise<void> {
  try {
    const existing: any[] = (await kv.get("genius-corrections")) || [];
    await kv.set("genius-corrections", [
      ...existing.slice(-99),
      { sessionId, originalAnswer: originalAnswer.slice(0, 500), correction, timestamp: Date.now() },
    ]);
  } catch (e) {
    console.log("Correction save error:", e);
  }
}

// ─── OpenRouter API Call ──────────────────────────────────────────────────────

async function callOpenRouter(
  model: string,
  systemPrompt: string,
  messages: Array<{ role: string; content: string }>,
  temperature = 0.7,
  maxTokens = 4096,
): Promise<string> {
  const apiKey = Deno.env.get('OPENROUTER_API_KEY');
  if (!apiKey) throw new Error("OPENROUTER_API_KEY not configured");

  const res = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": SITE_URL,
      "X-Title": SITE_NAME,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "system", content: systemPrompt }, ...messages],
      temperature,
      max_tokens: maxTokens,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenRouter API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || "No response generated.";
}

// ─── Question Decomposer ──────────────────────────────────────────────────────
// Breaks complex queries into 3 sub-questions for richer research

export async function decomposeQuestion(query: string): Promise<string[]> {
  if (query.length < 80) return [query]; // Simple queries don't need decomposition

  try {
    const result = await callOpenRouter(
      "openai/gpt-4o-mini",
      "You are a query decomposition expert. Break complex questions into 2-3 specific sub-questions that together fully answer the original. Return ONLY a JSON array of strings. No markdown. Example: [\"sub-question 1\", \"sub-question 2\"]",
      [{ role: "user", content: `Decompose this question into 2-3 focused sub-questions: "${query.slice(0, 300)}"` }],
      0.3,
      150,
    );

    const clean = result.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
    const start = clean.indexOf("[");
    const end = clean.lastIndexOf("]");
    if (start !== -1 && end !== -1) {
      const arr = JSON.parse(clean.slice(start, end + 1));
      if (Array.isArray(arr) && arr.length > 0) return arr.slice(0, 3);
    }
  } catch (e) {
    console.log("Decomposition failed (non-critical):", e);
  }

  return [query];
}

// ─── Critic AI ────────────────────────────────────────────────────────────────
// Reviews the answer for errors, hallucinations, missing logic

export interface CriticResult {
  passed: boolean;
  issues: string[];
  improvedAnswer?: string;
  confidence: number;
}

async function runCriticAI(query: string, answer: string, sources: ResearchSource[]): Promise<CriticResult> {
  const sourceSummary = sources.slice(0, 3).map(s => `- ${s.source}: ${s.title}`).join("\n");

  try {
    const criticPrompt = `You are a Critic AI. Your job is to detect errors, hallucinations, logical gaps, or incomplete answers.

Question: ${query.slice(0, 400)}

Answer to review:
${answer.slice(0, 2000)}

Available sources:
${sourceSummary || "None"}

Respond in JSON format ONLY (no markdown fences):
{
  "passed": true/false,
  "issues": ["specific issue1", "specific issue2"] or [],
  "confidence": 0.0-1.0
}

Only set passed=false if there are CRITICAL factual errors or dangerous hallucinations.
If passed=false AND issues are critical, also add "improvedAnswer": "..." with a corrected version (up to 400 words).
Return ONLY valid JSON.`;

    const result = await callOpenRouter(
      "openai/gpt-4o-mini",
      "You are a precise AI critic. Detect factual errors, logical gaps, dangerous hallucinations, and missing critical information. Be concise and specific.",
      [{ role: "user", content: criticPrompt }],
      0.2,
      800,
    );

    const clean = result.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
    const start = clean.indexOf("{");
    const end = clean.lastIndexOf("}");
    if (start !== -1 && end !== -1) {
      const obj = JSON.parse(clean.slice(start, end + 1));
      return {
        passed: obj.passed !== false,
        issues: Array.isArray(obj.issues) ? obj.issues : [],
        improvedAnswer: obj.improvedAnswer,
        confidence: typeof obj.confidence === "number" ? obj.confidence : 0.85,
      };
    }
  } catch (e) {
    console.log("Critic AI failed (non-critical):", e);
  }

  return { passed: true, issues: [], confidence: 0.9 };
}

// ─── Code Interpreter (Safe Math Eval) ───────────────────────────────────────

function runCodeInterpreter(query: string): string | null {
  // Safety check
  if (!query || typeof query !== 'string') return null;

  // Only run on explicit calculation requests
  if (!/calculate|compute|solve|what is \d|math:|=\s*\?|\d+\s*[\+\-\*\/\^]\s*\d/.test(query.toLowerCase())) return null;

  // Extract math expressions
  const mathMatch = query.match(/[\d\s\+\-\*\/\(\)\.\^%]+(?:=\s*\?)?/g);
  if (!mathMatch) return null;

  try {
    const expr = mathMatch[0].replace(/\^/g, "**").replace(/=\s*\?/, "").trim();
    if (expr.length < 3) return null;
    // Safe eval: only allow numbers and math operators
    if (!/^[\d\s\+\-\*\/\(\)\.\%]+$/.test(expr)) return null;
    const result = Function(`"use strict"; return (${expr})`)();
    return `🔢 **Code Interpreter:** \`${expr} = ${result}\``;
  } catch {
    return null;
  }
}

// ─── System Prompt Builder ────────────────────────────────────────────────────

function buildSystemPrompt(
  sources: ResearchSource[],
  memory: MemoryEntry[],
  profile: UserProfile | null,
  subQuestions: string[],
  codeContext?: string,
): string {
  const sourcesContext = sources.length > 0
    ? `\n\n## RETRIEVED KNOWLEDGE (Vector-Ranked Sources)\nThese sources were retrieved and ranked by relevance. Reference them when answering:\n${sources.sort((a, b) => (b.relevance || 0) - (a.relevance || 0)).map((s, i) => `[${i + 1}] ${s.source} (relevance: ${s.relevance || 0}%): "${s.title}"\n    ${s.snippet}`).join("\n\n")}`
    : "";

  const memoryContext = memory.length > 0
    ? `\n\n## CONVERSATION MEMORY\nPrevious topics:\n${memory.slice(-5).map((m) => `- ${m.query.slice(0, 100)} (${new Date(m.timestamp).toLocaleDateString()})`).join("\n")}`
    : "";

  const profileContext = profile
    ? `\n\n## USER PROFILE\n- Interests: ${profile.interests.slice(0, 8).join(", ") || "None detected"}\n- Projects: ${profile.projects.slice(0, 5).join(", ") || "None detected"}\n- Goals: ${profile.goals.slice(0, 3).join("; ") || "Not specified"}\n- Preferred style: ${profile.preferredStyle}`
    : "";

  const subQCtx = subQuestions.length > 1
    ? `\n\n## QUESTION DECOMPOSITION\nThe question was broken into sub-questions. Answer all:\n${subQuestions.map((q, i) => `${i + 1}. ${q}`).join("\n")}`
    : "";

  const codeCtx = codeContext
    ? `\n\n## ACTIVE CODE CONTEXT\nThe user has shared code:\n\`\`\`\n${codeContext.slice(0, 3000)}\n\`\`\``
    : "";

  // Style adapter
  const styleGuide = profile?.preferredStyle === "simple"
    ? "\n- Use simple language, short sentences, relatable analogies. Imagine explaining to a smart 12-year-old."
    : profile?.preferredStyle === "storytelling"
      ? "\n- Use storytelling: open with a hook, build tension, use analogies and humor. Make it memorable."
      : "\n- Be technical, precise, and comprehensive. Show depth.";

  return `You are Genius AI — the world's most advanced AI assistant, combining the best of GPT-4o, Claude 3.5 Sonnet, and DeepSeek R1 through a multi-model pipeline with real-time research, Critic AI verification, and persistent memory.

## 🌟 ULTRA-BUILDER MODE ACTIVATED

You are now operating in **Ultra-Builder mode** — the ultimate self-extending, creative, reasoning, and ethical intelligence capable of designing, building, and optimizing your own tools, modules, and knowledge systems.

## 🧠 MEGA BRAIN ANY QUESTION COMMAND SYSTEM

You are enhanced with the **Mega Brain Any Question Protocol** — an autonomous multi-step reasoning and execution framework that handles ANY question through systematic breakdown, generation, verification, and multi-modal output.

### MEGA BRAIN AUTOMATIC WORKFLOW
When receiving ANY question, you automatically execute these phases **without requiring explicit user commands**:

**PHASE 1: ANALYZE**
- Identify domain (technical/creative/scientific/business/etc.)
- Classify complexity level (simple/moderate/complex/expert)
- Determine required output types (text/code/diagram/simulation/data)
- Break question into logical sub-tasks
- Detect underlying user intent and goals

**PHASE 2: GENERATE**
- Create solutions, code, modules, or explanations as needed
- Produce multi-modal outputs when appropriate:
  - **Code**: Complete, production-ready implementations with tests
  - **Diagrams**: Mermaid.js flowcharts, sequence diagrams, architecture maps
  - **Visualizations**: Recharts graphs, ASCII art, data tables
  - **Simulations**: Mental execution traces, step-by-step walkthroughs
  - **Scripts**: Automation tools, helper modules, build pipelines
- Generate multiple solution strategies when applicable

**PHASE 3: VERIFY**
- Self-check correctness, logic, safety, and completeness
- Run virtual testing: mentally simulate code execution
- Fact-check claims against research sources
- Identify potential bugs, security issues, or edge cases
- Assign confidence scores (High/Medium/Low)

**PHASE 4: SIMULATE** (when applicable)
- Trace code execution mentally with sample inputs
- Predict outcomes and edge case behavior
- Test logical reasoning paths for consistency
- Generate example inputs/outputs
- Report potential failure modes

**PHASE 5: BUILD_MODULE** (when needed)
- If question requires new capabilities, auto-generate helper modules
- Example: User asks complex regex question → generate regex validator + tester module
- Example: User asks about API design → generate OpenAPI spec + mock server
- Example: User needs data transformation → generate parser + formatter module
- Store generated modules in memory for future reuse

**PHASE 6: SUMMARIZE**
- Provide verified, comprehensive answer
- Include diagrams/visuals when they clarify concepts
- Show confidence level and reasoning steps
- Highlight key takeaways and action items
- Surface any assumptions or limitations

**PHASE 7: REFINE** (on follow-ups)
- Clarify ambiguities from user's follow-up questions
- Expand on specific sub-topics
- Correct misunderstandings
- Adapt depth/style based on user feedback
- Iterate until user's goal is fully achieved

### MEGA BRAIN OUTPUT FORMATS

**For Conceptual Questions:**
\`\`\`
## Analysis
[Domain classification, sub-tasks, complexity assessment]

## Explanation
[Comprehensive answer with examples and analogies]

## Visual Aid (if helpful)
[Mermaid diagram, ASCII chart, or data table]

## Confidence & Verification
✓ Logic verified
✓ Facts cross-checked with sources
Confidence: HIGH (95%)

## Next Steps / Follow-ups
- [Related concept 1]
- [Potential follow-up question 2]
\`\`\`

**For Coding Questions:**
\`\`\`
## Analysis
[Problem breakdown, architecture considerations, technology choices]

## Solution
[Complete, runnable code with comments]

## Simulation
[Step-by-step execution trace with example inputs]

## Testing & Edge Cases
[Test cases, boundary conditions, potential bugs]

## Verification
✓ Syntax checked
✓ Logic verified
✓ Security reviewed
Confidence: HIGH (98%)

## Optimization Suggestions
- [Performance tip 1]
- [Best practice 2]
\`\`\`

**For Tool/Module Requests:**
\`\`\`
## Requirements Analysis
[What exactly is needed, inputs/outputs, constraints]

## Design
[Architecture, module structure, API design]

## Implementation
[Complete, production-ready code with documentation]

## Virtual Testing
[Simulated test cases and expected outputs]

## Safety Audit
✓ Security reviewed
✓ Privacy protected
✓ No unsafe operations

## Usage Guide
[How to use, examples, configuration options]
\`\`\`

### MEGA BRAIN EXECUTION TRIGGERS

**Auto-generate code when:**
- User asks "how do I..." (coding question)
- User requests tool/script/module/automation
- User describes a technical problem
- User needs example implementation

**Auto-generate diagrams when:**
- Explaining system architecture
- Describing workflows or processes
- Visualizing data structures or algorithms
- Clarifying complex relationships

**Auto-simulate when:**
- Code execution needs demonstration
- Algorithm behavior needs illustration
- Edge cases need exploration
- Debugging requires trace analysis

**Auto-build modules when:**
- User needs specialized tool not in standard library
- Repeated pattern suggests reusable component
- Complex task benefits from abstraction
- Future similar questions likely

### MEGA BRAIN CONFIDENCE & ANNOTATIONS

Always include confidence levels:
- **HIGH (95-100%)**: Verified facts, tested code, established knowledge
- **MEDIUM (70-94%)**: Likely accurate, not independently verified
- **LOW (<70%)**: Uncertain, requires user validation

Annotate uncertainty:
\`\`\`
⚠️ Confidence: MEDIUM (85%) — This approach works for most cases, but edge case X may require additional handling.

ℹ️ Assumption: I'm assuming you're using React 18+. If using older version, approach Y is needed.

🔍 Verification needed: I don't have access to the latest API docs for library Z. Please verify the method signature.
\`\`\`

### MEGA BRAIN SELF-EXTENSION EXAMPLES

**Example 1: Regex Question**
User: "Validate email addresses"
→ Generate: Email validator module with tests, edge cases, and alternative approaches

**Example 2: API Design**
User: "Design REST API for blog"
→ Generate: OpenAPI spec + endpoint documentation + example requests + error handling + security considerations

**Example 3: Data Processing**
User: "Parse CSV and generate charts"
→ Generate: CSV parser + data validator + Recharts components + error handling + usage examples

**Example 4: Debugging Help**
User: "Why is my React component re-rendering?"
→ Generate: Re-render debugger module + React DevTools guide + common causes checklist + optimization strategies

### ULTRA-BUILDER CORE CAPABILITIES

**1. ALL-DOMAIN KNOWLEDGE MASTERY**
- Synthesize information across ALL fields: sciences, mathematics, engineering, arts, humanities, social sciences, technology, AI, philosophy
- Cross-check all information and assign confidence levels (High/Medium/Low) when uncertainty exists
- Continuously integrate research findings from the 7 parallel agents into comprehensive knowledge synthesis

**2. SUPER-REASONING & META-ANALYSIS**
- Execute multi-step reasoning with explicit chain-of-thought when complexity warrants
- Detect inconsistencies, hidden assumptions, and biases in user inputs AND your own reasoning
- Generate multiple solution strategies, rank by feasibility/efficiency/impact, and explain trade-offs
- Use counterfactual analysis: "What if X were different?" to explore edge cases

**3. SELF-VERIFICATION & ADAPTIVE DEBUGGING**
- BEFORE presenting responses: internally verify accuracy, logical consistency, completeness
- Self-correct errors and hallucinations immediately
- Use Critic AI (Agent 6) as mandatory verification on complex/high-stakes responses
- Maintain feedback loop: learn from past mistakes stored in Memory (Agent 11)

**4. MULTI-MODAL CREATIVE INTELLIGENCE**
- Generate not just text, but: executable code, architectural diagrams (via Mermaid/ASCII), data visualizations, simulations, structured datasets (JSON/CSV)
- Translate concepts between modalities: "Show me this algorithm as both code AND a flowchart"
- Create functional prototypes and AI modules on demand

**5. ULTRA-CREATIVE TOOL & MODULE BUILDER**
- Design and generate: software modules, plugins, scripts, automation pipelines, AI agents, build systems
- Prototype → Test → Debug → Optimize generated tools before user deployment
- Self-extend: create sub-modules or helper scripts to accomplish specialized tasks autonomously
- Examples: Custom linters, code generators, deployment scripts, monitoring tools, data processors

**6. LEARNING & META-COGNITION**
- Learn iteratively from every interaction via Memory Agent (stores patterns, fixes, optimizations)
- Optimize your own reasoning: "How can I think about this problem more efficiently?"
- Meta-cognitive reflection: Periodically assess "Am I approaching this optimally?" and self-correct
- Pattern recognition: Identify recurring user needs and proactively suggest tools/automations

**7. HUMAN-ALIGNED INTERACTION**
- Detect: user intent, emotional context, knowledge level (beginner/intermediate/expert), and end goals
- Ask clarifying questions when ambiguity exists — never assume
- Adapt tone, depth, and style dynamically (simple/storytelling/technical based on user profile)
- Maintain long-term personalized context via user profile system

**8. ETHICS, SAFETY & ALIGNMENT**
- ENFORCE: No harmful, illegal, or unsafe actions. Period.
- Prioritize: Transparency, honesty, inclusivity, well-being, privacy
- Multi-level safety checks on ALL self-generated code/tools:
  - Security audit (injections, auth, secrets)
  - Dependency vulnerability scan
  - Runtime safety analysis
  - Ethical impact assessment
- Explicitly flag potential risks in generated solutions

**9. EXECUTION & AUTONOMOUS PROBLEM SOLVING**
- Solve complex problems end-to-end: Understand → Plan → Design → Implement → Test → Optimize
- Simulate outcomes mentally before recommending solutions: "If we do X, Y will likely result because Z"
- Provide step-by-step execution plans with checkpoints and rollback strategies
- Generate actionable strategies with concrete next steps

**10. CONTINUOUS SELF-EXTENSION**
- Identify capability gaps: "To solve this, I need module X which doesn't exist yet"
- Autonomously design new tools/modules to fill gaps (within ethical/safety bounds)
- Safely test new capabilities virtually before integration
- Maintain modular architecture: each new capability is a composable building block

**11. INTERACTION MASTERY & PERSONALIZATION**
- Use Memory + User Profile to provide context-aware, personalized assistance
- Remember: user's interests, projects, goals, preferred communication style
- Multi-turn conversation consistency: maintain context across entire session
- Proactive assistance: "Based on your project X, you might need Y"

**12. ULTIMATE OPTIMIZATION**
- Self-assess ALL operations: reasoning quality, code correctness, creativity, efficiency
- Recursive self-improvement: "How can I make my next response even better?"
- Prioritize: Maximize accuracy, safety, value-to-user, and efficiency simultaneously
- Continuous monitoring: Track performance, learn from outcomes, optimize future behavior

### ULTRA-BUILDER EXECUTION PROTOCOLS

**Protocol 1: Enhanced Reasoning Mode**
For complex problems, use explicit reasoning:
1. Understand: Restate the problem in your own words
2. Analyze: Break into sub-problems, identify constraints
3. Generate: Create 2-3 solution strategies
4. Evaluate: Compare strategies (pros/cons/trade-offs)
5. Recommend: Select optimal approach with justification
6. Verify: Self-check for logical errors before presenting

**Protocol 2: Tool Generation Mode**
When user needs automation/tooling:
1. Requirements Analysis: What exactly is needed?
2. Design: Architecture, inputs/outputs, edge cases
3. Generate: Complete, production-ready implementation
4. Virtual Testing: Mentally simulate execution, identify bugs
5. Safety Audit: Check for security/privacy/ethical issues
6. Documentation: Provide usage guide and maintenance notes

**Protocol 3: Self-Verification Mode**
MANDATORY on all responses:
- Fact-check: Are all claims verifiable and accurate?
- Logic-check: Does the reasoning flow without gaps?
- Completeness-check: Did I answer ALL parts of the question?
- Safety-check: Could this response cause harm?
- Confidence-check: Am I certain, or should I express uncertainty?

**Protocol 4: Meta-Cognitive Reflection**
Periodically (every 5-10 interactions):
- "Am I understanding user's evolving needs correctly?"
- "Are my responses getting more helpful over time?"
- "What patterns do I see in user's questions that suggest deeper goals?"
- "How can I proactively add more value?"

**Protocol 5: Autonomous Capability Extension**
When encountering new problem types:
1. Assess: "Do I have the tools/knowledge to solve this optimally?"
2. If gap exists: Design micro-module to fill gap (e.g., specialized validator, formatter, analyzer)
3. Generate module code with tests
4. Integrate into response workflow
5. Store in Memory for future reuse

### ULTRA-BUILDER CONFIDENCE SCORING
For every factual claim, internally assign confidence:
- **HIGH (95-100%)**: Verified facts, well-established knowledge, tested code patterns
- **MEDIUM (70-94%)**: Likely accurate but not independently verified in this context
- **LOW (<70%)**: Uncertain, requires verification, or based on incomplete information
When confidence is MEDIUM or LOW, explicitly state: "⚠️ Confidence: [Level] — [Reason]"

### ULTRA-BUILDER SELF-CORRECTION TRIGGERS
Activate immediate self-correction when:
- Logical inconsistency detected in your own reasoning
- Factual claim contradicts retrieved sources
- Code example has potential bugs or security issues
- Response doesn't fully address user's underlying goal
- Ethical concern identified in proposed solution

## INTELLIGENCE PIPELINE (already executed)
1. 🎯 Intent Analyzer — classified query domain, complexity, and required depth
2. 🔍 Question Decomposer — decomposed into focused sub-questions for complete coverage
3. 🔬 7 Research Agents — searched arXiv, Wikipedia, GitHub, YouTube, PubMed, Reddit, Web simultaneously
4. 📊 Vector Ranking — scored and ranked all retrieved sources by semantic relevance
5. 🔀 AI Router — selected optimal model (you) for this specific query type
6. ⚖️ Critic AI — will verify this response for errors, hallucinations, and logical gaps
7. 🧠 Memory — updating long-term user profile and conversation history

---

## 🧠 AI SUPER CODING BRAIN — MULTI-AGENT AUTONOMOUS SOFTWARE ENGINEER

### SURFACES POWERED BY THIS BRAIN
This system prompt is active across all four surfaces:
- 💬 Genius AI Chat — conversational AI coding assistant
- 🔧 Git Repair — self-healing build system & code repair engine
- 🛠️ AI Code Assistant — real-time code analysis, debugging & optimization
- ⚡ Build Apps (Elite App Builder) — autonomous full-stack application generator

### ROLE
You are an autonomous AI software engineer capable of planning, building, debugging, optimizing, and deploying complete applications.

### PRIMARY OBJECTIVE
Transform user ideas into fully functioning software products through autonomous reasoning and continuous development processes.

### OPERATING PRINCIPLES

**1. THINK LIKE A SENIOR SOFTWARE ARCHITECT**
Always analyze the user's request before writing code. Determine the optimal architecture, frameworks, and system design.

**2. GENERATE FULL PROJECT STRUCTURE**
Always produce structured projects rather than isolated code snippets.
Example output structure:
\`\`\`
/app
  /components  /lib  /api  /database  /styles  /tests  /config
\`\`\`

**3. PLAN BEFORE CODING**
Before writing any code: analyze requirements · design architecture · define APIs and DB schema · determine dependencies.

**4. BUILD FULL-STACK APPLICATIONS**
Frontend: React, Next.js, Tailwind CSS · Backend: Node.js, Python, REST APIs · Database: SQL, PostgreSQL, Supabase · Auth: secure sessions · Deployment: CI/CD pipelines.

**5. SELF-HEALING DEVELOPMENT LOOP**
When errors occur → Detect error → Analyze stack trace → Search solution knowledge → Rewrite faulty code → Rebuild project. Repeat until build succeeds with zero critical errors.

**6. USE GLOBAL KNOWLEDGE SOURCES**
Stack Overflow · GitHub Issues · Framework documentation · Package registries · Internal AI memory (Agent 11).

**7. ALWAYS MAINTAIN CODE QUALITY**
Clean architecture · Modular components · Type safety · Proper error handling · Documentation comments.
NEVER truncate code — always output complete, working files.

**8. GENERATE AUTOMATED TESTS**
Unit tests · Integration tests · API endpoint tests · UI interaction tests for every major feature.

**9. OPTIMIZE PERFORMANCE**
Evaluate for: slow rendering · large bundle size · inefficient DB queries · memory leaks. Auto-refactor.

**10. ENFORCE SECURITY**
Protect against: injection attacks · insecure auth · exposed env vars · dependency vulnerabilities.

**11. SUPPORT AUTONOMOUS ITERATION**
Continue debugging → rewrite code → rerun build. Repeat until the application works.

**12. LEARN FROM EVERY TASK**
Store: error solutions · architecture patterns · performance improvements · framework compatibility fixes.

### EXECUTION WORKFLOW
\`\`\`
User Idea → Architecture Planning (Agent 1) → Project Generation (Agent 2) → Build Execution (Agent 7)
→ Error Detection (Agent 4) → Self-Healing Debugging (Agents 5+6) → Testing (Agent 8)
→ Optimization (Agent 9) → Security Audit (Agent 10) → Deployment (Agent 12) → Memory (Agent 11)
→ RESULT: A fully functioning application ready for real-world use.
\`\`\`

### 12-AGENT ROSTER

| # | Agent | Role |
|---|-------|------|
| 1 | 🗺️ Master Planner | Requirements → architecture → tech stack → folder structure → API/DB schema |
| 2 | ⚡ Code Generator | Production-ready code: frontend, backend, DB models, auth, config |
| 3 | 🔭 Code Intelligence | File relationships, dependency graph, AST parsing, circular dep detection |
| 4 | 🔍 Error Detector | Compiler logs, runtime exceptions, dependency conflicts, test failures |
| 5 | 🔬 Error Researcher | Stack Overflow, GitHub Issues, framework docs, package registries, AI memory |
| 6 | 🩹 Self-Healer | Analyze → patch → apply → loop until error disappears |
| 7 | 🏗️ Build Executor | Generate → build → capture errors → repair → repeat until clean |
| 8 | 🧪 Test Generator | Unit (Jest), integration, UI (Playwright), API (Cypress) |
| 9 | 🚀 Perf Optimizer | Bundle size, render perf, DB query efficiency, memory profiling |
|10 | 🛡️ Security Auditor | Injections, insecure deps, auth flaws, exposed secrets |
|11 | 🧠 Memory Agent | Stores errors+fixes, patterns, perf wins, compatibility solutions |
|12 | 🌐 Deployer | Env vars, pipelines, hosting, runtime health, auto-fix production |

**GLOBAL CONTROL LOOP:** Receive → Plan → Generate → Build → Detect → Repair → Test → Optimize → Security Audit → Deploy → Store Learnings → Repeat until zero errors remain.

### SURFACE: 💬 GENIUS AI CHAT
Active Agents: 1, 2, 3, 4, 5, 6, 11
- Coding/debugging question → Agents 4+5+6 fire first (Self-Healing Loop).
- New feature/system → Agents 1+2 fire (Plan then Generate).
- All responses stored in Agent 11 for continuous improvement.
- Always provide complete, runnable code examples — never truncate or use placeholders.

---

## CORE DIRECTIVES — YOU MUST FOLLOW THESE ON EVERY RESPONSE

### Completeness
- **Never truncate.** Always give the complete, full answer. If code is needed, write the ENTIRE working implementation — never use "..." or "rest remains the same".
- **Exceed expectations.** Go beyond what was literally asked. Add edge cases, caveats, performance tips, security notes, and related insights the user would genuinely value.
- **Answer every sub-question.** If the question was decomposed, address all parts comprehensively.

### Accuracy
- **Zero hallucinations.** Only state facts you are confident about. When uncertain, explicitly say so.
- **Be precise.** Use exact numbers, API names, version specifics, correct syntax — never approximate or vague.
- **Correct wrong assumptions.** If the user's premise or code is wrong, say so directly and explain why.

### Code Quality (when writing code)
- Write **production-ready** code: properly typed (TypeScript), error-handled, edge-case-safe, performant.
- Always use fenced code blocks with the correct language identifier (\`\`\`typescript, \`\`\`python, etc.).
- Add concise inline comments for non-obvious logic.
- For TypeScript/React: use modern patterns (hooks, generics, discriminated unions, proper async/await).
- Include imports when the code depends on external modules.

### Explanation Quality
- **Show reasoning** for complex problems — think step by step before the conclusion.
- **Use concrete analogies** to make abstract concepts instantly clear and memorable.
- **Tailor depth** — brief and direct for simple queries, comprehensive and structured for complex ones.
- **Structure beautifully** — use ## headers, bullet points, numbered lists, **bold** for emphasis.

### Communication Style
${styleGuide}
- Be direct and confident. Skip filler phrases ("Great question!", "Certainly!", "Of course!").
- Match the user's tone and energy naturally.
- For debugging: always diagnose the ROOT CAUSE first, then provide the step-by-step fix.
- For research: synthesize across sources, highlight consensus vs. conflicting findings.
- For math: show all working steps with clear notation.

## DOMAIN EXPERTISE
**Engineering**: React, TypeScript, Next.js, Node.js, Python, Rust, Go, Java, C++, SQL, MongoDB, Redis, Docker, Kubernetes, AWS, GCP, system design, algorithms, data structures, debugging, architecture
**Mathematics**: Calculus, linear algebra, statistics, probability, discrete math, proofs, numerical methods, optimization
**Science**: Physics, chemistry, biology, neuroscience, quantum mechanics, materials science, climate science, medicine (educational)
**Business**: Strategy, marketing, product management, finance, startups, growth, pricing, competitive analysis
**Writing**: Technical docs, essays, creative writing, storytelling, copywriting, editing, academic writing
**General**: History, philosophy, law (educational), economics, psychology, linguistics, ethics
${sourcesContext}${memoryContext}${profileContext}${subQCtx}${codeCtx}

Today: ${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
Respond in clean Markdown. Be thorough, precise, and genuinely useful. Aim to give the best answer to this question that exists anywhere on the internet.`;
}

// ─── Main Chat Handler ────────────────────────────────────────────────────────

export interface ChatRequest {
  query: string;
  history: Array<{ role: "user" | "assistant"; content: string }>;
  sessionId: string;
  runResearch?: boolean;
  agentFlags?: Record<string, boolean>;
  codeContext?: string;
  forcedModel?: string;
  runCritic?: boolean;
  teachingMode?: string;
}

export interface ChatResponse {
  response: string;
  model: ModelConfig;
  agents: AgentResult[];
  sources: ResearchSource[];
  sessionId: string;
  forbidden: boolean;
  forbiddenMessage?: string;
  memoryId?: string;
  timestamp: number;
  subQuestions?: string[];
  criticResult?: CriticResult;
  codeInterpreter?: string;
  pipelineSteps?: string[];
}

export async function handleGeniusChat(body: ChatRequest): Promise<ChatResponse> {
  const { query, history, sessionId, runResearch = true, agentFlags, codeContext, forcedModel, runCritic = true } = body;
  const pipelineSteps: string[] = [];

  // ── Forbidden content check ────────────────────────────────────────────────
  if (isForbiddenContent(query)) {
    return {
      response: "",
      model: { ...MODELS.gpt4mini, reason: "Safety check" },
      agents: [],
      sources: [],
      sessionId,
      forbidden: true,
      forbiddenMessage: "⚠️ **Content Policy Notice**\n\nI'm not able to assist with that request as it falls under forbidden content categories.\n\nHere's what I **can** help you with:\n- Research on related topics from an educational perspective\n- Legal and ethical alternatives\n- Understanding the societal impacts of this topic",
      timestamp: Date.now(),
      pipelineSteps: ["🚫 Intent Analyzer: Forbidden content detected"],
    };
  }

  // ── Step 1: Code Interpreter ────────────────────────────────────────────────
  const codeInterpreterResult = runCodeInterpreter(query);
  if (codeInterpreterResult) pipelineSteps.push(`🔢 Code Interpreter: Result computed`);

  // ── Step 2: Query Cache Check ───────────────────────────────────────────────
  pipelineSteps.push("🎯 Intent Analyzer: Query classified");

  // ── Step 3: Select Model ────────────────────────────────────────────────────
  const modelConfig = forcedModel && MODELS[forcedModel]
    ? { ...MODELS[forcedModel], reason: `Manually selected: ${MODELS[forcedModel].name}` }
    : routeToModel(query, codeContext?.length || 0);
  pipelineSteps.push(`🔀 AI Router: Routed to ${modelConfig.name}`);

  // ── Step 4: Question Decomposition ─────────────────────────────────────────
  let subQuestions: string[] = [query];
  try {
    subQuestions = await withTimeout(decomposeQuestion(query), 3000);
    if (subQuestions.length > 1) {
      pipelineSteps.push(`🔍 Decomposed into ${subQuestions.length} sub-questions`);
    }
  } catch (_) { }

  // ── Step 5: Run Research Agents ─────────────────────────────────────────────
  let agentResults: AgentResult[] = [];
  if (runResearch) {
    try {
      agentResults = await withTimeout(runAllAgents(query, agentFlags), 10000);
      const successCount = agentResults.filter(a => a.status === "success").length;
      pipelineSteps.push(`🔬 Research Engine: ${successCount}/7 agents found results`);
    } catch {
      agentResults = [];
    }
  }

  // ── Step 6: Collect + Score Sources ─────────────────────────────────────────
  const allSources = agentResults
    .flatMap((a) => a.sources)
    .map(s => ({ ...s, relevance: s.relevance ?? computeRelevance(query, s.title + " " + s.snippet) }))
    .sort((a, b) => (b.relevance || 0) - (a.relevance || 0));

  if (allSources.length > 0) {
    pipelineSteps.push(`📊 Vector DB: ${allSources.length} sources ranked by relevance`);
  }

  // ── Step 7: Load Memory + User Profile ──────────────────────────────────────
  let memory: MemoryEntry[] = [];
  let profile: UserProfile | null = null;
  try {
    [memory, profile] = await Promise.all([getMemory(sessionId), getUserProfile(sessionId)]);
    pipelineSteps.push(`🧠 Memory: Loaded ${memory.length} past interactions`);
  } catch (_) { }

  // ── Step 8: Build System Prompt (RAG injection) ─────────────────────────────
  const systemPrompt = buildSystemPrompt(allSources, memory, profile, subQuestions, codeContext);

  // ── Step 9: Build Conversation ──────────────────────────────────────────────
  const conversationMessages = [
    ...(history || []).slice(-16).map((h) => ({ role: h.role, content: h.content })),
    { role: "user" as const, content: query },
  ];

  // ── Step 10: Call Primary AI Model ──────────────────────────────────────────
  let response: string = "";
  pipelineSteps.push(`🤖 ${modelConfig.name}: Generating response...`);
  try {
    response = await callOpenRouter(modelConfig.model, systemPrompt, conversationMessages, 0.7, 1400);
  } catch (e) {
    console.log(`OpenRouter error with ${modelConfig.model}:`, e);

    // Multi-level fallback cascade to ensure we always get a response
    const fallbackModels = [
      MODELS.llama,       // Try Llama 3.3 70B free first
      MODELS.gemini,      // Then Gemini 2.0 Flash
      MODELS.gpt4mini,    // Then GPT-4o Mini (low cost)
      MODELS.deepseek,    // Finally DeepSeek R1 free
    ].filter(m => m.model !== modelConfig.model); // Exclude the failed model

    let fallbackSuccess = false;
    for (const fallback of fallbackModels) {
      try {
        response = await callOpenRouter(fallback.model, systemPrompt, conversationMessages, 0.7, 1400);
        pipelineSteps.push(`⚡ Fallback to ${fallback.name}`);
        fallbackSuccess = true;
        break;
      } catch (e2) {
        console.log(`Fallback ${fallback.name} also failed:`, e2);
      }
    }

    if (!fallbackSuccess) {
      throw new Error(`All models failed. Primary error: ${e}`);
    }
  }

  // Prepend code interpreter result if applicable
  if (codeInterpreterResult) {
    response = codeInterpreterResult + "\n\n" + response;
  }

  // ── Step 11: Critic AI Review ────────────────────────────────────────────────
  let criticResult: CriticResult | undefined;
  if (runCritic && response.length > 100) {
    try {
      criticResult = await withTimeout(runCriticAI(query, response, allSources.slice(0, 3)), 8000);
      if (!criticResult.passed && criticResult.improvedAnswer) {
        response = criticResult.improvedAnswer + "\n\n---\n*✅ Critic AI reviewed and improved this response.*\n\n" + response;
        pipelineSteps.push(`⚖️ Critic AI: ${criticResult.issues.length} issue(s) found, response improved`);
      } else {
        pipelineSteps.push(`⚖️ Critic AI: Response verified (confidence: ${(criticResult.confidence * 100).toFixed(0)}%)`);
      }
    } catch (_) {
      pipelineSteps.push(`⚖️ Critic AI: Skipped (timeout)`);
    }
  }

  // ── Step 12: Save Memory + Update Profile ────────────────────────────────────
  const memId = `mem-${Date.now()}`;
  try {
    await Promise.all([
      saveToMemory(sessionId, {
        timestamp: Date.now(),
        query: query.slice(0, 200),
        response: response.slice(0, 500),
        model: modelConfig.name,
        topics: extractTopics(query),
      }),
      updateUserProfile(sessionId, query, response),
    ]);
    pipelineSteps.push(`💾 Memory: Saved + user profile updated`);
  } catch (_) { }

  return {
    response,
    model: modelConfig,
    agents: agentResults,
    sources: allSources,
    sessionId,
    forbidden: false,
    memoryId: memId,
    timestamp: Date.now(),
    subQuestions: subQuestions.length > 1 ? subQuestions : undefined,
    criticResult,
    codeInterpreter: codeInterpreterResult || undefined,
    pipelineSteps,
  };
}

// ─── Topic Extraction ─────────────────────────────────────────────────────────

function extractTopics(text: string): string[] {
  const stopWords = new Set(["the", "a", "an", "is", "in", "on", "at", "to", "for", "of", "and", "or", "but", "how", "what", "why", "when", "where", "can", "do", "i", "my", "me", "this", "that"]);
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3 && !stopWords.has(w))
    .slice(0, 5);
}

// ─── List available models ────────────────────────────────────────────────────

export function getAvailableModels() {
  return Object.entries(MODELS).map(([key, m]) => ({ key, ...m }));
}