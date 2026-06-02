// =============================================================
// SCRAPER — Following the Blog Post Creation Guide
// Step 1: Clean & Structure | Step 2: Extract Core Ideas
// =============================================================

import { Context } from "hono";
import * as kv from "./kv_store.tsx";

interface ScrapedProduct {
  name: string;
  description?: string;
  price?: string;
}

export interface ScrapedData {
  title: string;
  description: string;
  content: string;            // Raw cleaned text (kept for compat)
  cleanContent: string;       // Guide Step 1: De-duplicated, noise-free content
  headings: string[];         // Guide Step 1: H1–H4 key sections
  keyPoints: string[];        // Guide Step 2: Core ideas / strong claims
  dataPoints: string[];       // Guide Step 2: Stats, numbers, evidence
  quotes: string[];           // Guide Step 1: Blockquotes & cited text
  products: ScrapedProduct[];
  keywords: string[];
  semanticKeywords: string[]; // Guide Step 7: SEO semantic keywords
  businessType: string;
  coreTopic: string;          // Guide Step 2: Core thesis
  missingAngles: string[];    // Guide Step 2: What the content doesn't address
}

// ─── Main Entry Point ─────────────────────────────────────────

export async function scrapeWebsite(url: string): Promise<ScrapedData> {
  console.log(`[Scraper] Starting guide-based scrape for: ${url}`);

  // Build a list of URLs to try in order
  const urlsToTry = buildFallbackUrls(url);
  let lastError = '';

  for (const candidate of urlsToTry) {
    try {
      console.log(`[Scraper] Trying: ${candidate}`);
      const html = await fetchHtml(candidate);
      return parseHtml(html, candidate);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      lastError = errorMessage;
      console.warn(`[Scraper] Failed (${candidate}): ${errorMessage}`);
    }
  }

  // All URLs failed — synthesise stub content from the domain so downstream
  // blog-generation still has something meaningful to work with
  console.warn(`[Scraper] All URLs failed. Using domain-stub fallback. Last error: ${lastError}`);
  return buildStubFromUrl(url, lastError);
}

// ─── URL Fallback Chain ────────────────────────────────────────

function buildFallbackUrls(raw: string): string[] {
  const candidates: string[] = [];

  // 1. Exact URL as supplied
  candidates.push(raw);

  try {
    const parsed = new URL(raw);

    // 2. Root of the same scheme+host
    const root = `${parsed.protocol}//${parsed.host}/`;
    if (root !== raw && root !== raw + '/') candidates.push(root);

    // 3. Try https if http was supplied (and vice-versa)
    const altScheme = parsed.protocol === 'https:' ? 'http:' : 'https:';
    candidates.push(`${altScheme}//${parsed.host}${parsed.pathname}`);
    candidates.push(`${altScheme}//${parsed.host}/`);

    // 4. Deduplicate while preserving order
    return [...new Set(candidates)];
  } catch {
    return candidates;
  }
}

// ─── Single-URL Fetch ──────────────────────────────────────────

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
        '(KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
    // Follow redirects (fetch does this by default in Deno)
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch website: ${res.status} ${res.statusText}`);
  }

  return res.text();
}

// ─── HTML → ScrapedData ────────────────────────────────────────

function parseHtml(html: string, url: string): ScrapedData {
  // ── Guide Step 1: Clean & Structure ──────────────────────
  const cleanedHtml = removeNonContentElements(html);
  const rawText = extractTextFromHTML(cleanedHtml);
  const paragraphs = extractAndDedupeParagraphs(rawText);
  const cleanContent = paragraphs.join(' ');

  // ── Structured Extraction ─────────────────────────────────
  const title = extractTitle(html);
  const description = extractDescription(html);
  const headings = extractHeadings(html);
  const dataPoints = extractDataPoints(rawText);
  const keyPoints = extractKeyPoints(rawText, headings);
  const quotes = extractQuotes(html, rawText);
  const products = extractProducts(html, rawText);

  // ── Guide Step 2: Core Idea Analysis ─────────────────────
  const keywords = extractKeywords(rawText);
  const businessType = detectBusinessType(keywords, rawText);
  const coreTopic = detectCoreTopic(title, headings, keywords);
  const semanticKeywords = generateSemanticKeywords(keywords, businessType);
  const missingAngles = identifyMissingAngles(keyPoints, headings, businessType);

  console.log(
    `[Scraper] Complete (${url}). headings=${headings.length}, keyPoints=${keyPoints.length}, ` +
    `dataPoints=${dataPoints.length}, products=${products.length}`
  );

  return {
    title,
    description,
    content: rawText.slice(0, 2000),
    cleanContent: cleanContent.slice(0, 5000),
    headings,
    keyPoints,
    dataPoints,
    quotes,
    products,
    keywords,
    semanticKeywords,
    businessType,
    coreTopic,
    missingAngles,
  };
}

// ─── Domain-Stub Fallback ──────────────────────────────────────
// When every URL attempt fails, generate placeholder data from the
// domain name so the blog-post generator can still run.

function buildStubFromUrl(url: string, errorDetail: string): ScrapedData {
  let host = url;
  let pathname = '';
  try {
    const parsed = new URL(url);
    host = parsed.hostname.replace(/^www\./, '');
    pathname = parsed.pathname.replace(/\//g, ' ').trim();
  } catch { /* ignore */ }

  const brandName = host.split('.')[0];
  const title = brandName.charAt(0).toUpperCase() + brandName.slice(1);
  const topicHint = pathname || title;

  const description =
    `Content from ${host} — scraped page was unavailable (${errorDetail}). ` +
    `Blog content generated from brand identity and domain context.`;

  const keyPoints = [
    `${title} offers innovative solutions for their customers`,
    `Discover what makes ${title} stand out in their industry`,
    `${title} is committed to quality and customer satisfaction`,
  ];

  const headings = [
    `About ${title}`,
    `Why Choose ${title}`,
    `${title} Services & Solutions`,
    `Get Started with ${title}`,
  ];

  const keywords = [
    brandName, host.split('.')[1] || 'solutions',
    'quality', 'service', 'innovation', 'results',
  ].filter(Boolean);

  return {
    title,
    description,
    content: description,
    cleanContent: `${title} is a brand focused on delivering exceptional value. ${description}`,
    headings,
    keyPoints,
    dataPoints: [],
    quotes: [],
    products: [],
    keywords,
    semanticKeywords: generateSemanticKeywords(keywords, 'general'),
    businessType: 'general',
    coreTopic: `${title}: ${topicHint}`,
    missingAngles: [
      'founding story',
      'team expertise',
      'customer testimonials',
      'service details',
      'community impact',
    ],
  };
}

// ─── Step 1a: Remove Non-Content HTML Elements ────────────────
// Guide: "HTML noise, Navigation text, Ads, Repeated headers"

// Navigation / UI terms that should NEVER appear in content output
const NAV_NOISE_TERMS = new Set([
  'my account', 'sign in', 'sign up', 'log in', 'log out', 'login', 'logout',
  'register', 'create account', 'forgot password', 'cart', 'checkout', 'wishlist',
  'our partners', 'partners', 'return experience', 'returns', 'return policy',
  'supply chain story', 'supply chain', 'shipping policy', 'privacy policy',
  'terms of service', 'terms & conditions', 'cookie policy', 'sitemap',
  'search', 'menu', 'home', 'back to top', 'skip to content',
  'follow us', 'subscribe', 'newsletter', 'contact us', 'about us',
  'shop now', 'buy now', 'add to cart', 'view cart', 'proceed to checkout',
  'track order', 'order history', 'account settings', 'profile',
]);

function isNavNoise(text: string): boolean {
  const lower = text.toLowerCase().trim();
  if (NAV_NOISE_TERMS.has(lower)) return true;
  // Very short fragments with no real sentence structure
  if (lower.length <= 15 && !/[a-z]{4,}\s+[a-z]{4,}/i.test(lower)) return true;
  // Short nav-link-looking phrases (no punctuation, 1-3 words, contains nav keywords)
  if (lower.length <= 30 && /^[a-z\s&\/'-]+$/.test(lower) && !/[.!?,:;]/.test(lower)) {
    const words = lower.split(/\s+/);
    const navKeywords = ['account', 'partner', 'return', 'supply', 'cart', 'login',
      'register', 'policy', 'terms', 'sitemap', 'checkout', 'wishlist', 'order',
      'track', 'profile', 'settings', 'newsletter', 'subscribe'];
    if (words.length <= 3 && navKeywords.some(k => lower.includes(k))) return true;
  }
  return false;
}

function removeNonContentElements(html: string): string {
  let clean = html;

  // Remove elements that are structural noise per the guide
  const noiseElements = [
    'script', 'style', 'nav', 'footer', 'header', 'aside',
    'form', 'iframe', 'noscript', 'advertisement', 'ads',
  ];

  for (const el of noiseElements) {
    clean = clean.replace(new RegExp(`<${el}[^>]*>[\\s\\S]*?<\\/${el}>`, 'gi'), '');
  }

  // Remove div/section/ul blocks whose class or id signals navigation or UI chrome.
  // Catches Wix/Shopify/Squarespace sites that render nav inside <div>, not <nav>.
  const navClassPattern = /\b(nav|navigation|navbar|topbar|top-bar|site-header|page-header|mega-menu|account-menu|account-link|login-link|header-menu|hamburger|breadcrumb|pagination|sidebar|widget|cookie|banner|popup|modal|overlay|ad-|ads-|advertisement|announcement|promo-bar|partners-section|return-policy|supply-chain)\b/i;
  clean = clean.replace(/<(div|section|ul|ol|header|span)([^>]*(class|id)="([^"]*)"[^>]*)>/gi, (match, tag, attrs, _a, cls) => {
    return navClassPattern.test(cls || '') ? `<!--REMOVED_NAV-->` : match;
  });

  return clean;
}

// ─── Step 1b: Extract Clean Text ─────────────────────────────

function extractTextFromHTML(html: string): string {
  let text = html.replace(/<[^>]+>/g, ' ');

  // Decode HTML entities
  const entities: Record<string, string> = {
    '&nbsp;': ' ', '&amp;': '&', '&lt;': '<', '&gt;': '>',
    '&quot;': '"', '&#39;': "'", '&mdash;': '—', '&ndash;': '–',
    '&ldquo;': '"', '&rdquo;': '"', '&lsquo;': "'", '&rsquo;': "'",
  };
  for (const [entity, char] of Object.entries(entities)) {
    text = text.replace(new RegExp(entity, 'g'), char);
  }

  return text.replace(/\s+/g, ' ').trim();
}

// ─── Step 1c: De-duplicate Paragraphs ────────────────────────
// Guide: "De-duplicating paragraphs"

function extractAndDedupeParagraphs(text: string): string[] {
  // Split on sentence boundaries and filter meaningful segments
  const segments = text
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 40 && s.length < 800);

  const unique: string[] = [];

  for (const segment of segments) {
    const isDuplicate = unique.some(existing => wordOverlapSimilarity(existing, segment) > 0.65);
    if (!isDuplicate) {
      unique.push(segment);
    }
    if (unique.length >= 60) break;
  }

  return unique;
}

function wordOverlapSimilarity(a: string, b: string): number {
  const setA = new Set(a.toLowerCase().split(/\s+/).filter(w => w.length > 3));
  const setB = new Set(b.toLowerCase().split(/\s+/).filter(w => w.length > 3));
  if (setA.size === 0 || setB.size === 0) return 0;
  const intersection = [...setA].filter(w => setB.has(w)).length;
  return (2 * intersection) / (setA.size + setB.size);
}

// ─── Step 1d: Extract Headings ────────────────────────────────
// Guide: "Extracting headings, Identifying key sections"

function extractHeadings(html: string): string[] {
  const headings: string[] = [];
  const matches = html.matchAll(/<h([1-4])[^>]*>([\s\S]*?)<\/h\1>/gi);

  for (const match of matches) {
    const text = match[2].replace(/<[^>]+>/g, '').trim();
    // Reject noise: too short/long, or matches nav/UI blocklist
    if (text.length > 5 && text.length < 200 && !isNavNoise(text)) {
      headings.push(text);
    }
  }

  return [...new Set(headings)].slice(0, 20);
}

// ─── Step 2a: Extract Data Points ────────────────────────────
// Guide: "Data points, Statistics"

function extractDataPoints(text: string): string[] {
  const sentences = text.split(/(?<=[.!?])\s+/).map(s => s.trim());

  const dataPoints = sentences.filter(s => {
    if (s.length < 20 || s.length > 400) return false;
    return (
      /\d+(\.\d+)?%/.test(s) ||                           // percentages
      /\$[\d,]+/.test(s) ||                                // dollar amounts
      /\b\d{1,3}(,\d{3})+\b/.test(s) ||                  // large numbers
      /\b(million|billion|thousand)\b/i.test(s) ||         // magnitude words
      /\b\d+\s+(years?|months?|days?|hours?|times?)\b/i.test(s) || // time spans
      /#\d+|number\s+\d+|top\s+\d+|\d+\s+(ways|tips|steps|reasons)/i.test(s)
    );
  });

  return dataPoints.slice(0, 10);
}

// ─── Step 2b: Extract Key Points / Claims ────────────────────
// Guide: "Key claims, Main arguments"

function extractKeyPoints(text: string, headings: string[]): string[] {
  const sentences = text.split(/(?<=[.!?])\s+/).map(s => s.trim());

  const strongLanguage = /\b(key|important|critical|essential|crucial|proven|discover|transform|revolutionary|breakthrough|unique|exclusive|best|top|leading|certified|guaranteed|award|patented|proprietary|innovative|advanced|cutting.?edge|state.of.the.art)\b/i;

  const claims = sentences
    .filter(s => s.length > 40 && s.length < 300 && strongLanguage.test(s) && !isNavNoise(s))
    .slice(0, 10);

  // Only include headings that pass the nav-noise filter (already filtered in extractHeadings, but belt-and-suspenders)
  const cleanHeadings = headings.filter(h => !isNavNoise(h) && h.length > 8);
  const combined = [...new Set([...cleanHeadings.slice(0, 8), ...claims])];
  return combined.slice(0, 15);
}

// ─── Step 1e: Extract Quotes ──────────────────────────────────
// Guide: "Quotes"

function extractQuotes(html: string, text: string): string[] {
  const quotes: string[] = [];

  // Blockquotes
  const blockMatches = html.matchAll(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi);
  for (const m of blockMatches) {
    const q = m[1].replace(/<[^>]+>/g, '').trim();
    if (q.length > 20 && q.length < 500) quotes.push(q);
  }

  // Quoted text in body
  const inlineMatches = text.matchAll(/"([^"]{25,250})"/g);
  for (const m of inlineMatches) quotes.push(m[1]);

  return [...new Set(quotes)].slice(0, 5);
}

// ─── Metadata Extraction ──────────────────────────────────────

function extractTitle(html: string): string {
  // Try og:title first (usually cleaner)
  const og = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']*)["']/i);
  if (og) return og[1].trim();

  const title = html.match(/<title[^>]*>(.*?)<\/title>/i);
  if (title) return title[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

  return 'Untitled';
}

function extractDescription(html: string): string {
  const patterns = [
    /<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i,
    /<meta[^>]*content=["']([^"']*)["'][^>]*name=["']description["']/i,
    /<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']*)["']/i,
  ];
  for (const pattern of patterns) {
    const m = html.match(pattern);
    if (m) return m[1].trim();
  }
  return '';
}

// ─── Keyword Extraction ───────────────────────────────────────

function extractKeywords(text: string): string[] {
  const stopWords = new Set([
    'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'it', 'for',
    'not', 'on', 'with', 'as', 'you', 'do', 'at', 'this', 'but', 'his', 'by',
    'from', 'they', 'we', 'say', 'her', 'she', 'or', 'an', 'will', 'my', 'one',
    'all', 'would', 'there', 'their', 'what', 'so', 'up', 'out', 'if', 'about',
    'who', 'get', 'which', 'go', 'me', 'when', 'make', 'can', 'like', 'time',
    'no', 'just', 'him', 'know', 'take', 'people', 'into', 'year', 'your',
    'good', 'some', 'could', 'them', 'see', 'other', 'than', 'then', 'now',
    'look', 'only', 'come', 'its', 'over', 'also', 'back', 'after', 'use',
    'two', 'how', 'our', 'work', 'first', 'well', 'way', 'even', 'new', 'want',
    'because', 'any', 'these', 'give', 'day', 'most', 'been', 'are', 'was',
  ]);

  const words = text.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3 && !stopWords.has(w));

  const freq = new Map<string, number>();
  words.forEach(w => freq.set(w, (freq.get(w) || 0) + 1));

  return Array.from(freq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 25)
    .map(([w]) => w);
}

// ─── Business Type Detection ──────────────────────────────────

function detectBusinessType(keywords: string[], text: string): string {
  const lowerText = text.toLowerCase();
  const patterns = [
    { type: 'restaurant', words: ['restaurant', 'food', 'menu', 'dining', 'cuisine', 'chef', 'dish', 'meal', 'eat'] },
    { type: 'coffee shop', words: ['coffee', 'cafe', 'espresso', 'latte', 'brew', 'barista', 'roast', 'cappuccino'] },
    { type: 'fitness', words: ['fitness', 'gym', 'workout', 'training', 'health', 'exercise', 'yoga', 'trainer'] },
    { type: 'spa', words: ['spa', 'massage', 'facial', 'salon', 'beauty', 'wellness', 'relaxation', 'skincare'] },
    { type: 'ecommerce', words: ['shop', 'cart', 'checkout', 'shipping', 'order', 'buy', 'purchase', 'add to cart'] },
    { type: 'retail', words: ['store', 'products', 'items', 'merchandise', 'goods', 'price', 'sale', 'deal'] },
    { type: 'tech', words: ['software', 'technology', 'app', 'digital', 'platform', 'solution', 'api', 'data'] },
    { type: 'saas', words: ['subscription', 'dashboard', 'analytics', 'integration', 'cloud', 'saas', 'plan'] },
    { type: 'service', words: ['service', 'professional', 'consultation', 'expert', 'specialist', 'agency'] },
    { type: 'healthcare', words: ['health', 'medical', 'clinic', 'doctor', 'patient', 'treatment', 'care'] },
    { type: 'education', words: ['course', 'learn', 'education', 'training', 'student', 'teacher', 'class'] },
    { type: 'real estate', words: ['property', 'home', 'house', 'real estate', 'listing', 'agent', 'mortgage'] },
  ];

  let best = { type: 'general', score: 0 };
  for (const p of patterns) {
    const score = p.words.filter(w => lowerText.includes(w) || keywords.includes(w)).length;
    if (score > best.score) best = { type: p.type, score };
  }

  return best.type;
}

// ─── Guide Step 2: Core Topic (Thesis) ───────────────────────

function detectCoreTopic(title: string, headings: string[], keywords: string[]): string {
  if (headings.length > 0) {
    return headings[0].length > 10 ? headings[0] : `${title} — ${headings[0]}`;
  }
  if (keywords.length > 2) {
    return `${title}: ${keywords.slice(0, 3).join(', ')}`;
  }
  return title;
}

// ─── Guide Step 7: Semantic Keywords for SEO ─────────────────

function generateSemanticKeywords(keywords: string[], businessType: string): string[] {
  const semantic: Record<string, string[]> = {
    restaurant: ['farm-to-table', 'authentic cuisine', 'culinary experience', 'dining', 'chef-crafted', 'seasonal menu'],
    'coffee shop': ['specialty coffee', 'third wave', 'single origin', 'craft brew', 'sustainable sourcing', 'cafe culture'],
    fitness: ['strength training', 'body transformation', 'wellness journey', 'performance coaching', 'health optimization'],
    spa: ['holistic wellness', 'self-care', 'rejuvenation', 'therapeutic treatment', 'mindfulness', 'beauty ritual'],
    ecommerce: ['online shopping', 'fast shipping', 'customer reviews', 'product quality', 'secure checkout'],
    retail: ['in-store experience', 'product selection', 'value', 'quality merchandise', 'customer service'],
    tech: ['digital transformation', 'automation', 'scalability', 'cloud-based', 'AI-powered', 'efficiency'],
    saas: ['SaaS platform', 'subscription model', 'enterprise solution', 'workflow automation', 'data insights'],
    service: ['expert consultation', 'proven results', 'certified professionals', 'tailored solutions', 'ROI'],
    healthcare: ['patient care', 'clinical expertise', 'evidence-based', 'preventive health', 'wellness outcomes'],
    education: ['skill development', 'online learning', 'certification', 'career advancement', 'knowledge base'],
    'real estate': ['property investment', 'home buying', 'market analysis', 'local expertise', 'listings'],
    general: ['trusted brand', 'quality assured', 'customer-first', 'innovative approach', 'proven excellence'],
  };

  const base = semantic[businessType] || semantic.general;
  return [...new Set([...keywords.slice(0, 8), ...base])].slice(0, 18);
}

// ─── Guide Step 2: Identify Missing Angles ───────────────────
// Guide: "What is missing? What questions remain unanswered?"

function identifyMissingAngles(keyPoints: string[], headings: string[], businessType: string): string[] {
  const angles: Record<string, string[]> = {
    restaurant: ['origin story', 'ingredient sourcing transparency', 'chef philosophy', 'dietary inclusivity', 'community impact'],
    'coffee shop': ['bean origin story', 'roasting process deep-dive', 'sustainability practices', 'barista training'],
    fitness: ['recovery science', 'nutrition integration', 'mental health benefits', 'beginner progression', 'injury prevention'],
    spa: ['treatment science', 'ingredient efficacy', 'long-term wellness results', 'holistic philosophy'],
    ecommerce: ['product testing process', 'quality assurance story', 'customer success stories', 'product origin and craftsmanship'],
    retail: ['curation process', 'staff expertise', 'community involvement', 'product quality standards'],
    tech: ['security architecture', 'integration ecosystem', 'customer ROI data', 'roadmap transparency'],
    saas: ['onboarding experience', 'support quality', 'uptime reliability', 'pricing transparency'],
    service: ['methodology explanation', 'team credentials', 'case studies', 'guarantee details'],
    healthcare: ['evidence base', 'outcome data', 'care philosophy', 'patient journey', 'prevention focus'],
    education: ['learning outcomes', 'instructor credentials', 'peer community', 'practical application'],
    'real estate': ['market insights', 'neighborhood data', 'buying process clarity', 'investment returns'],
    general: ['founding story', 'team culture', 'community impact', 'future vision', 'customer testimonials'],
  };

  const covered = [...keyPoints, ...headings].join(' ').toLowerCase();
  const options = angles[businessType] || angles.general;

  return options.filter(angle => !covered.includes(angle.toLowerCase())).slice(0, 5);
}

// ─── Product Extraction (Enhanced) ───────────────────────────

function extractProducts(html: string, text: string): ScrapedProduct[] {
  const products: ScrapedProduct[] = [];

  // Pattern 1: JSON-LD structured data (most reliable)
  const jsonLdMatches = html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  for (const match of jsonLdMatches) {
    try {
      const data = JSON.parse(match[1]);
      const items = Array.isArray(data) ? data : [data];
      for (const item of items) {
        if (['Product', 'MenuItem', 'Service', 'Course'].includes(item['@type'])) {
          products.push({
            name: item.name || '',
            description: item.description?.slice(0, 200) || '',
            price: item.offers?.price
              ? `$${item.offers.price}`
              : item.price
                ? `$${item.price}`
                : undefined,
          });
        }
        if (item.hasMenuItem) {
          const menuItems = Array.isArray(item.hasMenuItem) ? item.hasMenuItem : [item.hasMenuItem];
          for (const mi of menuItems.slice(0, 5)) {
            products.push({
              name: mi.name || '',
              description: mi.description?.slice(0, 150) || '',
              price: mi.offers?.price ? `$${mi.offers.price}` : undefined,
            });
          }
        }
      }
    } catch (_) { /* ignore */ }
    if (products.length >= 10) break;
  }

  // Pattern 2: Product elements with price patterns
  if (products.length < 5) {
    const productHtmlMatches = html.matchAll(/<[^>]*class=["'][^"']*(?:product|item|card|listing)[^"']*["'][^>]*>([\s\S]*?)<\/(?:div|article|li|section)>/gi);
    for (const match of productHtmlMatches) {
      const inner = match[1];
      const itemText = inner.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      const priceMatch = inner.match(/\$\s*(\d+(?:[.,]\d{1,2})?)/);

      if (itemText.length > 5 && itemText.length < 300) {
        products.push({
          name: itemText.slice(0, 120),
          price: priceMatch ? `$${priceMatch[1]}` : undefined,
        });
      }
      if (products.length >= 15) break;
    }
  }

  // Pattern 3: List items with prices
  if (products.length < 5) {
    const listItems = html.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi);
    for (const match of listItems) {
      const itemText = match[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      const priceMatch = match[1].match(/\$\s*(\d+(?:[.,]\d{1,2})?)/);

      if (itemText.length > 5 && itemText.length < 200) {
        products.push({
          name: itemText.slice(0, 100),
          price: priceMatch ? `$${priceMatch[1]}` : undefined,
        });
      }
      if (products.length >= 15) break;
    }
  }

  // Deduplicate by name similarity
  const unique: ScrapedProduct[] = [];
  for (const p of products) {
    if (p.name.length < 3) continue;
    const isDup = unique.some(u => wordOverlapSimilarity(u.name, p.name) > 0.7);
    if (!isDup) unique.push(p);
  }

  return unique.slice(0, 15);
}

// =============================================================
// HTTP ENDPOINT: scrapeData
// =============================================================

/**
 * HTTP endpoint for scraping website data
 * POST /api/scrape
 * Body: { url: string, useCache?: boolean, cacheTTL?: number }
 */
export async function handleScrapeData(c: Context) {
  const startTime = Date.now();

  try {
    const body = await c.req.json();
    const { url, useCache = true, cacheTTL = 3600 } = body;

    // Validate URL
    if (!url || typeof url !== 'string') {
      return c.json({
        success: false,
        error: 'URL is required and must be a string',
        code: 'INVALID_URL'
      }, 400);
    }

    // Basic URL format validation
    try {
      new URL(url);
    } catch {
      return c.json({
        success: false,
        error: 'Invalid URL format',
        code: 'INVALID_URL_FORMAT'
      }, 400);
    }

    // Check cache if enabled
    let cachedData: ScrapedData | null = null;
    const cacheKey = `scrape:${url}`;

    if (useCache) {
      try {
        const cached = await kv.get(cacheKey);
        if (cached && cached.data) {
          cachedData = cached.data as ScrapedData;
          console.log(`[Scraper Endpoint] Cache hit for ${url}`);
        }
      } catch (cacheError) {
        console.warn(`[Scraper Endpoint] Cache check failed:`, cacheError);
      }
    }

    if (cachedData) {
      return c.json({
        success: true,
        data: cachedData,
        cached: true,
        timestamp: Date.now(),
        duration: Date.now() - startTime,
      });
    }

    // Perform scrape
    console.log(`[Scraper Endpoint] Scraping ${url}...`);
    const scrapedData = await scrapeWebsite(url);

    // Cache the result if enabled
    if (useCache) {
      try {
        await kv.set(cacheKey, scrapedData);
        console.log(`[Scraper Endpoint] Cached result for ${url}`);
      } catch (cacheError) {
        console.warn(`[Scraper Endpoint] Cache set failed:`, cacheError);
      }
    }

    return c.json({
      success: true,
      data: scrapedData,
      cached: false,
      timestamp: Date.now(),
      duration: Date.now() - startTime,
      meta: {
        url,
        headingsCount: scrapedData.headings.length,
        keyPointsCount: scrapedData.keyPoints.length,
        dataPointsCount: scrapedData.dataPoints.length,
        productsCount: scrapedData.products.length,
        businessType: scrapedData.businessType,
      }
    });

  } catch (error) {
    console.error('[Scraper Endpoint] Error:', error);

    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      code: 'SCRAPER_ERROR',
      timestamp: Date.now(),
      duration: Date.now() - startTime,
    }, 500);
  }
}

/**
 * Batch scrape multiple URLs
 * POST /api/scrape/batch
 * Body: { urls: string[], useCache?: boolean, cacheTTL?: number }
 */
export async function handleBatchScrape(c: Context) {
  const startTime = Date.now();

  try {
    const body = await c.req.json();
    const { urls, useCache = true, cacheTTL = 3600 } = body;

    // Validate URLs array
    if (!Array.isArray(urls) || urls.length === 0) {
      return c.json({
        success: false,
        error: 'urls must be a non-empty array',
        code: 'INVALID_URLS'
      }, 400);
    }

    if (urls.length > 10) {
      return c.json({
        success: false,
        error: 'Maximum 10 URLs per batch request',
        code: 'TOO_MANY_URLS'
      }, 400);
    }

    // Validate each URL format
    for (const url of urls) {
      if (typeof url !== 'string') {
        return c.json({
          success: false,
          error: 'All URLs must be strings',
          code: 'INVALID_URL_TYPE'
        }, 400);
      }
      try {
        new URL(url);
      } catch {
        return c.json({
          success: false,
          error: `Invalid URL format: ${url}`,
          code: 'INVALID_URL_FORMAT'
        }, 400);
      }
    }

    // Process URLs in parallel
    const results = await Promise.allSettled(
      urls.map(async (url) => {
        const cacheKey = `scrape:${url}`;

        // Check cache
        if (useCache) {
          try {
            const cached = await kv.get(cacheKey);
            if (cached && cached.data) {
              return { url, data: cached.data as ScrapedData, cached: true };
            }
          } catch { /* ignore cache errors */ }
        }

        // Scrape
        const data = await scrapeWebsite(url);

        // Cache result
        if (useCache) {
          try {
            await kv.set(cacheKey, data);
          } catch { /* ignore cache errors */ }
        }

        return { url, data, cached: false };
      })
    );

    // Format results
    const successful = results
      .filter((r): r is PromiseFulfilledResult<{ url: string; data: ScrapedData; cached: boolean }> => r.status === 'fulfilled')
      .map(r => ({
        url: r.value.url,
        success: true,
        data: r.value.data,
        cached: r.value.cached,
      }));

    const failed = results
      .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
      .map(r => ({
        url: urls[results.indexOf(r)],
        success: false,
        error: r.reason instanceof Error ? r.reason.message : 'Unknown error',
      }));

    return c.json({
      success: true,
      results: [...successful, ...failed],
      summary: {
        total: urls.length,
        successful: successful.length,
        failed: failed.length,
        cached: successful.filter(r => r.cached).length,
      },
      timestamp: Date.now(),
      duration: Date.now() - startTime,
    });

  } catch (error) {
    console.error('[Scraper Endpoint] Batch error:', error);

    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      code: 'BATCH_SCRAPER_ERROR',
      timestamp: Date.now(),
      duration: Date.now() - startTime,
    }, 500);
  }
}

/**
 * Clear cache for a specific URL or all scraper cache
 * DELETE /api/scrape/cache
 * Body: { url?: string }
 */
export async function handleClearScrapeCache(c: Context) {
  try {
    const body = await c.req.json();
    const { url } = body;

    if (url) {
      // Clear specific URL cache
      const cacheKey = `scrape:${url}`;
      await kv.del(cacheKey);
      return c.json({
        success: true,
        message: `Cache cleared for ${url}`,
      });
    } else {
      // Clear all scraper cache (requires pattern deletion)
      // Note: This depends on kv_store implementation supporting pattern deletion
      return c.json({
        success: false,
        error: 'Bulk cache deletion not implemented. Specify a URL.',
        code: 'NOT_IMPLEMENTED'
      }, 501);
    }

  } catch (error) {
    console.error('[Scraper Endpoint] Cache clear error:', error);

    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      code: 'CACHE_ERROR'
    }, 500);
  }
}