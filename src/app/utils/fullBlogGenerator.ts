// =============================================================
// FULL BLOG GENERATOR — AI Blog Factory / Topical Authority Engine
// Based on ai-blog-factory-guide.md methodology
// Generates full 1,500–2,500 word professional articles
// with SEO optimization, repurposing, and topic clustering
// =============================================================

import type { ScrapedData } from './blogGenerator';

// ─── Types ────────────────────────────────────────────────────

export type ArticleAngle =
  | 'ultimate-guide' | 'how-to' | 'case-study' | 'comparison'
  | 'benefits' | 'myth-busting' | 'trend-analysis' | 'beginner-guide'
  | 'expert-tips' | 'faq-deep-dive' | 'data-driven' | 'contrarian';

export interface SupportingTopic {
  id: string;
  title: string;
  slug: string;
  angle: ArticleAngle;
  primaryKeyword: string;
  estimatedWords: number;
  priority: 'High' | 'Medium' | 'Low';
  status: 'pending' | 'generating' | 'ready';
}

export interface TopicCluster {
  id: string;
  pillar: string;
  pillarSlug: string;
  description: string;
  primaryKeyword: string;
  estimatedVolume: string;
  difficulty: 'Low' | 'Medium' | 'High';
  color: string;
  icon: string;
  supportingTopics: SupportingTopic[];
}

export interface ArticleSection {
  heading: string;
  content: string;
  wordCount: number;
}

export interface FullArticle {
  id: string;
  title: string;
  slug: string;
  metaDescription: string;
  pillar: string;
  angle: ArticleAngle;
  introduction: string;
  sections: ArticleSection[];
  faqs: { question: string; answer: string }[];
  conclusion: string;
  content: string;
  wordCount: number;
  readingTime: number;
  primaryKeyword: string;
  secondaryKeywords: string[];
  internalLinks: string[];
  status: 'draft' | 'ready' | 'scheduled' | 'published';
  scheduledDate?: string;
  createdAt: Date;
}

export interface RepurposedContent {
  linkedin: string;
  twitter: string;
  facebook: string;
  instagram: string;
  videoScript: string;
  newsletter: string;
  emailSubjectLine: string;
  quotes: string[];
}

// ─── Helpers ──────────────────────────────────────────────────

function toSlug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function countWords(s: string): number {
  return s.split(/\s+/).filter(Boolean).length;
}

function getBusinessMeta(bt: string) {
  const map: Record<string, { need: string; benefit: string; unique: string; challenge: string; trend: string }> = {
    restaurant:    { need: 'a genuinely memorable dining experience', benefit: 'flavors built on real craft and ingredient integrity', unique: 'the gap between commodity food and intentional dining is wider than most realize', challenge: 'standing out in a market oversaturated with options', trend: 'hyper-local sourcing and chef-driven narratives' },
    'coffee shop': { need: 'an exceptional daily ritual that starts the morning right', benefit: 'a cup that reflects the science and sourcing behind every bean', unique: 'most coffee shops are interchangeable — the outliers obsess over origin and process', challenge: 'competing on more than price and proximity', trend: 'precision brewing and single-origin transparency' },
    fitness:       { need: 'real, sustainable results that don\'t fade after the first month', benefit: 'science-backed programming that adapts as you progress', unique: 'recovery is the most underrated variable in any training program', challenge: 'cutting through conflicting fitness advice', trend: 'wearable-integrated training and recovery-first methodology' },
    spa:           { need: 'genuine restoration, not just surface relaxation', benefit: 'treatments designed around clinical efficacy and therapeutic outcomes', unique: 'the best results come from evidence-based protocols, not ambient marketing', challenge: 'communicating the science behind premium treatments', trend: 'bioactive ingredient science and preventive skin health' },
    ecommerce:     { need: 'products they can trust delivered fast and packaged with care', benefit: 'quality-verified items with a seamless end-to-end experience', unique: 'the real loyalty driver isn\'t free shipping — it\'s consistent product excellence', challenge: 'building trust without physical touchpoints', trend: 'direct-to-consumer supply chains and radical transparency' },
    retail:        { need: 'a curated selection that makes the right choice obvious', benefit: 'expert-selected products with staff who actually know what they\'re talking about', unique: 'curation is the competitive advantage most retailers ignore', challenge: 'differentiating in an era of infinite online choice', trend: 'experiential retail and community-as-product models' },
    tech:          { need: 'tools that actually solve the problem without creating new ones', benefit: 'automation and intelligence that compound over time', unique: 'most companies don\'t have a software problem — they have an adoption problem', challenge: 'demonstrating ROI in a crowded software market', trend: 'AI-native architectures replacing legacy SaaS workflows' },
    saas:          { need: 'a platform that grows with the business without adding friction', benefit: 'workflows that reduce complexity at every level of the organization', unique: 'feature count is a vanity metric — utilization rate is what matters', challenge: 'proving value beyond the free trial period', trend: 'vertical-specific platforms outperforming horizontal generalists' },
    service:       { need: 'a provider they can depend on to deliver what they promised', benefit: 'measurable outcomes backed by a transparent and repeatable process', unique: 'clients don\'t want the fastest option — they want the most reliable one', challenge: 'making intangible expertise feel tangible and trustworthy', trend: 'productized services with fixed scope and predictable pricing' },
    healthcare:    { need: 'care that treats the whole person, not just the presenting symptom', benefit: 'preventive and responsive care integrated into a single approach', unique: 'the best time to address health is before problems appear', challenge: 'building patient trust in a skeptical healthcare landscape', trend: 'precision medicine and real-time biomarker monitoring' },
    education:     { need: 'knowledge that translates directly into marketable skills and outcomes', benefit: 'structured learning paths with built-in accountability', unique: 'content isn\'t the bottleneck in learning — structure and accountability are', challenge: 'proving ROI in a world of free online courses', trend: 'competency-based credentials replacing time-based degrees' },
    'real estate': { need: 'data-informed guidance through the biggest financial decision of their life', benefit: 'local market intelligence that most agents keep proprietary', unique: 'the best time to buy isn\'t when the market is perfect — it\'s when you\'re prepared', challenge: 'standing out in a low-trust, high-stakes industry', trend: 'data-driven micro-market analysis and buyer education' },
    general:       { need: 'a solution that works the first time and keeps working', benefit: 'consistent quality backed by genuine commitment to the customer', unique: 'most businesses try to appeal to everyone — the most successful ones go deep on a niche', challenge: 'building meaningful differentiation in a commoditized market', trend: 'trust-first business models built on radical transparency' },
  };
  return map[bt] || map.general;
}

// ─── 1. Topic Cluster Generator ───────────────────────────────

export function generateTopicClusters(data: ScrapedData): TopicCluster[] {
  const { title: biz, businessType: bt, coreTopic, keywords, products } = data;
  const topic = coreTopic || keywords[0] || biz;
  const kw1 = keywords[0] || topic;
  const kw2 = keywords[1] || bt;
  const kw3 = keywords[2] || `${topic} guide`;
  const prod1 = products[0]?.name || topic;

  const meta = getBusinessMeta(bt);

  const clusters: TopicCluster[] = [
    {
      id: 'cluster-1',
      pillar: `The Complete Guide to ${topic}`,
      pillarSlug: toSlug(`complete-guide-${topic}`),
      description: `A comprehensive pillar page covering every essential aspect of ${topic} for ${bt} professionals and customers.`,
      primaryKeyword: kw1,
      estimatedVolume: '1,200–8,000/mo',
      difficulty: 'Medium',
      color: '#8B5CF6',
      icon: '📚',
      supportingTopics: [
        { id: 's1-1', title: `What Is ${topic}? A Plain-English Explanation`, slug: toSlug(`what-is-${topic}`), angle: 'beginner-guide', primaryKeyword: kw1, estimatedWords: 1400, priority: 'High', status: 'pending' },
        { id: 's1-2', title: `${topic} vs Traditional Alternatives: A Full Comparison`, slug: toSlug(`${topic}-vs-alternatives`), angle: 'comparison', primaryKeyword: `${kw1} comparison`, estimatedWords: 1800, priority: 'High', status: 'pending' },
        { id: 's1-3', title: `How ${biz} Approaches ${topic}: An Inside Look`, slug: toSlug(`${biz}-approach-${topic}`), angle: 'case-study', primaryKeyword: `${biz} ${kw1}`, estimatedWords: 1600, priority: 'High', status: 'pending' },
        { id: 's1-4', title: `${topic} Myths Debunked: What the Evidence Actually Says`, slug: toSlug(`${topic}-myths-debunked`), angle: 'myth-busting', primaryKeyword: `${kw1} myths`, estimatedWords: 1500, priority: 'Medium', status: 'pending' },
        { id: 's1-5', title: `Getting Started with ${topic}: Your First 30 Days`, slug: toSlug(`getting-started-${topic}`), angle: 'how-to', primaryKeyword: `how to start ${kw1}`, estimatedWords: 1600, priority: 'High', status: 'pending' },
        { id: 's1-6', title: `The Science Behind ${topic}: What Research Tells Us`, slug: toSlug(`science-of-${topic}`), angle: 'data-driven', primaryKeyword: `${kw1} research`, estimatedWords: 2000, priority: 'Medium', status: 'pending' },
        { id: 's1-7', title: `${topic} for Beginners: Everything You Were Afraid to Ask`, slug: toSlug(`${topic}-beginners-guide`), angle: 'faq-deep-dive', primaryKeyword: `${kw1} beginners`, estimatedWords: 1400, priority: 'Medium', status: 'pending' },
        { id: 's1-8', title: `Why Most ${bt} Businesses Get ${topic} Wrong`, slug: toSlug(`${bt}-${topic}-mistakes`), angle: 'contrarian', primaryKeyword: `${kw1} mistakes`, estimatedWords: 1700, priority: 'Medium', status: 'pending' },
        { id: 's1-9', title: `Expert Perspectives on ${topic}: Insights from Industry Leaders`, slug: toSlug(`expert-${topic}-insights`), angle: 'expert-tips', primaryKeyword: `${kw1} experts`, estimatedWords: 1500, priority: 'Low', status: 'pending' },
        { id: 's1-10', title: `The Ultimate ${topic} Checklist for ${bt} Professionals`, slug: toSlug(`${topic}-checklist`), angle: 'ultimate-guide', primaryKeyword: `${kw1} checklist`, estimatedWords: 1800, priority: 'Low', status: 'pending' },
      ],
    },
    {
      id: 'cluster-2',
      pillar: `${topic} Benefits, Use Cases & Real-World Applications`,
      pillarSlug: toSlug(`${topic}-benefits-applications`),
      description: `Deep dives into the proven benefits, practical use cases, and real-world applications of ${topic}.`,
      primaryKeyword: `${kw1} benefits`,
      estimatedVolume: '800–4,000/mo',
      difficulty: 'Low',
      color: '#10B981',
      icon: '💡',
      supportingTopics: [
        { id: 's2-1', title: `Top 10 Benefits of ${topic} You Need to Know`, slug: toSlug(`benefits-of-${topic}`), angle: 'benefits', primaryKeyword: `${kw1} benefits`, estimatedWords: 1600, priority: 'High', status: 'pending' },
        { id: 's2-2', title: `How ${topic} Solves ${meta.challenge}`, slug: toSlug(`${topic}-solves-${bt}`), angle: 'case-study', primaryKeyword: `${kw1} use case`, estimatedWords: 1700, priority: 'High', status: 'pending' },
        { id: 's2-3', title: `${topic} in ${bt}: Real Results, Real Stories`, slug: toSlug(`${topic}-in-${bt}`), angle: 'case-study', primaryKeyword: `${kw1} ${bt}`, estimatedWords: 1800, priority: 'High', status: 'pending' },
        { id: 's2-4', title: `The ROI of ${topic}: How to Measure What Matters`, slug: toSlug(`roi-of-${topic}`), angle: 'data-driven', primaryKeyword: `${kw1} ROI`, estimatedWords: 1600, priority: 'Medium', status: 'pending' },
        { id: 's2-5', title: `${topic} for Small Business: A Practical Advantage Guide`, slug: toSlug(`${topic}-small-business`), angle: 'how-to', primaryKeyword: `${kw1} small business`, estimatedWords: 1500, priority: 'Medium', status: 'pending' },
        { id: 's2-6', title: `How ${prod1} Delivers on the Promise of ${topic}`, slug: toSlug(`${prod1}-${topic}-results`), angle: 'benefits', primaryKeyword: `${prod1} ${kw1}`, estimatedWords: 1400, priority: 'Medium', status: 'pending' },
        { id: 's2-7', title: `${topic} Success Stories: What's Working and Why`, slug: toSlug(`${topic}-success-stories`), angle: 'case-study', primaryKeyword: `${kw1} results`, estimatedWords: 1700, priority: 'Low', status: 'pending' },
        { id: 's2-8', title: `Measuring the Impact of ${topic}: Key Metrics and KPIs`, slug: toSlug(`${topic}-metrics-kpis`), angle: 'data-driven', primaryKeyword: `${kw1} metrics`, estimatedWords: 1500, priority: 'Low', status: 'pending' },
        { id: 's2-9', title: `${topic} and ${kw2}: A Natural Connection`, slug: toSlug(`${topic}-and-${kw2}`), angle: 'benefits', primaryKeyword: `${kw1} ${kw2}`, estimatedWords: 1300, priority: 'Low', status: 'pending' },
        { id: 's2-10', title: `Before and After: The Transformative Power of ${topic}`, slug: toSlug(`before-after-${topic}`), angle: 'case-study', primaryKeyword: `${kw1} transformation`, estimatedWords: 1500, priority: 'Low', status: 'pending' },
      ],
    },
    {
      id: 'cluster-3',
      pillar: `How-To & Best Practices: Mastering ${topic}`,
      pillarSlug: toSlug(`mastering-${topic}-how-to`),
      description: `Step-by-step guides, actionable how-tos, and proven best practices for getting maximum value from ${topic}.`,
      primaryKeyword: `how to ${kw1}`,
      estimatedVolume: '600–3,000/mo',
      difficulty: 'Low',
      color: '#3B82F6',
      icon: '🔧',
      supportingTopics: [
        { id: 's3-1', title: `How to Choose the Right ${topic} Provider for Your Business`, slug: toSlug(`choose-${topic}-provider`), angle: 'how-to', primaryKeyword: `best ${kw1} provider`, estimatedWords: 1600, priority: 'High', status: 'pending' },
        { id: 's3-2', title: `A Step-by-Step Guide to Implementing ${topic}`, slug: toSlug(`implement-${topic}-guide`), angle: 'how-to', primaryKeyword: `${kw1} implementation`, estimatedWords: 1800, priority: 'High', status: 'pending' },
        { id: 's3-3', title: `${topic} Best Practices: What Top ${bt} Businesses Do Differently`, slug: toSlug(`${topic}-best-practices`), angle: 'expert-tips', primaryKeyword: `${kw1} best practices`, estimatedWords: 1700, priority: 'High', status: 'pending' },
        { id: 's3-4', title: `Common ${topic} Mistakes (and How to Avoid Them)`, slug: toSlug(`${topic}-mistakes-to-avoid`), angle: 'myth-busting', primaryKeyword: `${kw1} mistakes`, estimatedWords: 1500, priority: 'Medium', status: 'pending' },
        { id: 's3-5', title: `How to Evaluate ${topic} Quality: A Professional Framework`, slug: toSlug(`evaluate-${topic}-quality`), angle: 'how-to', primaryKeyword: `${kw1} quality`, estimatedWords: 1600, priority: 'Medium', status: 'pending' },
        { id: 's3-6', title: `${topic} on a Budget: Getting Maximum Value`, slug: toSlug(`${topic}-budget-guide`), angle: 'how-to', primaryKeyword: `affordable ${kw1}`, estimatedWords: 1400, priority: 'Medium', status: 'pending' },
        { id: 's3-7', title: `How to Build a ${topic} Strategy That Actually Works`, slug: toSlug(`${topic}-strategy`), angle: 'how-to', primaryKeyword: `${kw1} strategy`, estimatedWords: 1900, priority: 'Medium', status: 'pending' },
        { id: 's3-8', title: `Expert Tips for Getting the Most Out of ${topic}`, slug: toSlug(`tips-${topic}-success`), angle: 'expert-tips', primaryKeyword: `${kw1} tips`, estimatedWords: 1400, priority: 'Low', status: 'pending' },
        { id: 's3-9', title: `${topic} Questions Answered: Your Complete FAQ`, slug: toSlug(`${topic}-faq`), angle: 'faq-deep-dive', primaryKeyword: `${kw1} FAQ`, estimatedWords: 1600, priority: 'Low', status: 'pending' },
        { id: 's3-10', title: `Advanced ${topic} Techniques for Experienced Professionals`, slug: toSlug(`advanced-${topic}-techniques`), angle: 'expert-tips', primaryKeyword: `advanced ${kw1}`, estimatedWords: 1800, priority: 'Low', status: 'pending' },
      ],
    },
    {
      id: 'cluster-4',
      pillar: `${topic} Trends, Future & Industry Intelligence`,
      pillarSlug: toSlug(`${topic}-trends-future`),
      description: `Forward-looking analysis of where ${topic} is heading, industry intelligence, and what it means for the future of ${bt}.`,
      primaryKeyword: `${kw1} trends`,
      estimatedVolume: '400–2,000/mo',
      difficulty: 'High',
      color: '#F59E0B',
      icon: '📈',
      supportingTopics: [
        { id: 's4-1', title: `The Future of ${topic}: Trends That Will Define the Next Decade`, slug: toSlug(`future-of-${topic}`), angle: 'trend-analysis', primaryKeyword: `${kw1} future`, estimatedWords: 2000, priority: 'High', status: 'pending' },
        { id: 's4-2', title: `How ${kw2} Is Changing Everything About ${topic}`, slug: toSlug(`${kw2}-changing-${topic}`), angle: 'trend-analysis', primaryKeyword: `${kw2} ${kw1}`, estimatedWords: 1700, priority: 'High', status: 'pending' },
        { id: 's4-3', title: `${topic} Industry Report: What the Data Reveals in ${new Date().getFullYear()}`, slug: toSlug(`${topic}-industry-report-${new Date().getFullYear()}`), angle: 'data-driven', primaryKeyword: `${kw1} industry report`, estimatedWords: 2200, priority: 'High', status: 'pending' },
        { id: 's4-4', title: `The Contrarian's View on ${topic}: What Everyone Is Missing`, slug: toSlug(`contrarian-view-${topic}`), angle: 'contrarian', primaryKeyword: `${kw1} truth`, estimatedWords: 1600, priority: 'Medium', status: 'pending' },
        { id: 's4-5', title: `Predictions for ${topic} in ${new Date().getFullYear() + 1}: Expert Forecasts`, slug: toSlug(`${topic}-predictions-${new Date().getFullYear() + 1}`), angle: 'trend-analysis', primaryKeyword: `${kw1} predictions`, estimatedWords: 1700, priority: 'Medium', status: 'pending' },
        { id: 's4-6', title: `${topic} and Sustainability: The Connection You Can't Ignore`, slug: toSlug(`${topic}-sustainability`), angle: 'trend-analysis', primaryKeyword: `${kw1} sustainability`, estimatedWords: 1600, priority: 'Medium', status: 'pending' },
        { id: 's4-7', title: `How Technology Is Accelerating ${topic} Innovation`, slug: toSlug(`technology-${topic}-innovation`), angle: 'trend-analysis', primaryKeyword: `${kw1} technology`, estimatedWords: 1500, priority: 'Low', status: 'pending' },
        { id: 's4-8', title: `The Global State of ${topic}: A Market Overview`, slug: toSlug(`global-${topic}-market`), angle: 'data-driven', primaryKeyword: `${kw1} market`, estimatedWords: 1800, priority: 'Low', status: 'pending' },
        { id: 's4-9', title: `What Top ${bt} Innovators Predict About ${topic}`, slug: toSlug(`${bt}-innovators-${topic}`), angle: 'expert-tips', primaryKeyword: `${kw1} innovation`, estimatedWords: 1500, priority: 'Low', status: 'pending' },
        { id: 's4-10', title: `${topic}: Where Are We Headed and What Should You Do Now?`, slug: toSlug(`${topic}-where-headed`), angle: 'contrarian', primaryKeyword: `${kw1} direction`, estimatedWords: 1600, priority: 'Low', status: 'pending' },
      ],
    },
  ];

  return clusters;
}

// ─── 2. Full Article Generator ────────────────────────────────

export function generateFullArticle(
  topic: SupportingTopic,
  cluster: TopicCluster,
  data: ScrapedData
): FullArticle {
  const { title: biz, businessType: bt, coreTopic, keywords, products, description } = data;
  const topicStr = coreTopic || keywords[0] || biz;
  const kw1 = keywords[0] || topicStr;
  const kw2 = keywords[1] || bt;
  const prod1 = products[0]?.name || topicStr;
  const prod2 = products[1]?.name || keywords[1] || 'their core approach';
  const meta = getBusinessMeta(bt);

  const intro = buildIntroduction(topic, biz, bt, topicStr, kw1, meta, description || '');
  const sections = buildSections(topic, biz, bt, topicStr, kw1, kw2, prod1, prod2, meta);
  const faqs = buildFAQs(topic, biz, bt, topicStr, kw1, prod1, meta);
  const conclusion = buildConclusion(topic, biz, bt, topicStr, kw1, meta);

  const fullContent = [
    `# ${topic.title}\n`,
    intro,
    ...sections.map(s => `## ${s.heading}\n\n${s.content}`),
    `## Frequently Asked Questions\n\n` + faqs.map(f => `**${f.question}**\n\n${f.answer}`).join('\n\n'),
    `## Conclusion\n\n${conclusion}`,
  ].join('\n\n');

  const totalWords = countWords(fullContent);
  const secondaryKeywords = [
    keywords[1] || `${kw1} guide`,
    keywords[2] || `best ${kw1}`,
    `${kw1} ${bt}`,
    `${biz} ${kw1}`,
    prod1 !== topicStr ? prod1 : `${kw1} benefits`,
  ].filter((v, i, a) => a.indexOf(v) === i).slice(0, 5);

  return {
    id: `article-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: topic.title,
    slug: topic.slug,
    metaDescription: buildMeta(topic.title, topicStr, biz, meta.benefit),
    pillar: cluster.pillar,
    angle: topic.angle,
    introduction: intro,
    sections,
    faqs,
    conclusion,
    content: fullContent,
    wordCount: totalWords,
    readingTime: Math.ceil(totalWords / 230),
    primaryKeyword: topic.primaryKeyword,
    secondaryKeywords,
    internalLinks: [`/${cluster.pillarSlug}`, `/blog`, `/${toSlug(biz)}`],
    status: 'ready',
    createdAt: new Date(),
  };
}

// ─── Section builders ─────────────────────────────────────────

function buildMeta(title: string, topic: string, biz: string, benefit: string): string {
  const m = `Discover how ${topic} works, why it matters for ${biz}, and how it delivers ${benefit}. Expert guide inside.`;
  return m.length <= 155 ? m : m.slice(0, 152) + '...';
}

function buildIntroduction(
  topic: SupportingTopic, biz: string, bt: string,
  topicStr: string, kw1: string, meta: ReturnType<typeof getBusinessMeta>, desc: string
): string {
  const angleIntros: Record<ArticleAngle, string[]> = {
    'ultimate-guide': [
      `If you've been looking for a single, authoritative resource on ${topicStr}, you've found it. This guide covers everything from foundational concepts to advanced applications — structured so you can navigate directly to what you need or read straight through for a complete education.`,
      `${biz} has built its reputation in the ${bt} space by mastering the very principles this guide unpacks. What follows isn't a surface-level overview — it's the kind of in-depth exploration that changes how you think about ${kw1} and what it can do for your business or lifestyle.`,
      `We'll move through the essentials systematically: the why, the what, the how, and the what-next. By the end, you'll have a complete framework for evaluating, implementing, and getting maximum value from ${topicStr}. Let's start from the beginning.`,
    ],
    'how-to': [
      `Knowing that ${topicStr} is important is one thing. Knowing exactly how to put it into practice — step by step, in the real world — is something most guides skip past. This one doesn't.`,
      `${biz} has refined its approach to ${kw1} through years of real-world application in the ${bt} space. The methodology outlined here draws on that experience, translating it into clear, actionable steps you can begin implementing immediately.`,
      `Whether you're starting from scratch or refining an existing approach, this guide gives you a concrete framework. Each step builds on the last, so you'll finish with both a clear understanding of the process and confidence in how to execute it.`,
    ],
    'case-study': [
      `There's a category of ${bt} businesses that consistently outperform their peers — not because they have more resources, but because they understand ${topicStr} at a deeper level than everyone else. This article examines what they do differently.`,
      `${biz} represents this category. Their approach to ${kw1} has produced measurable, repeatable results, and the principles behind that success are worth examining in detail — not to replicate them wholesale, but to extract the underlying logic and apply it in your own context.`,
      `What follows is a detailed look at how a commitment to ${topicStr} creates compounding advantages over time, why most businesses underestimate this, and what the evidence actually shows about the impact on customer experience, loyalty, and outcomes.`,
    ],
    'comparison': [
      `Choosing between ${topicStr} and traditional alternatives isn't just a preference decision — it's a strategic one with real implications for your experience, outcomes, and long-term satisfaction. The right choice depends on factors that most comparisons gloss over.`,
      `This guide cuts through the noise. We've evaluated ${kw1} across the dimensions that actually matter — quality, reliability, cost over time, and outcomes — and we've built a framework you can use to make the decision that fits your specific situation.`,
      `${biz} operates squarely in the ${topicStr} space, which gives them a particular perspective on this comparison. But the analysis here aims to be objective: we'll look at where ${kw1} outperforms the alternatives, where the trade-offs are real, and what the research says.`,
    ],
    'benefits': [
      `The case for ${topicStr} is stronger than most people realize — not because the marketing says so, but because the evidence does. When you examine the benefits systematically, a pattern emerges that's hard to argue with.`,
      `${biz} has built its entire ${bt} model around delivering these benefits consistently, which is why understanding them isn't just academic — it's practically useful for anyone evaluating their options in this space.`,
      `This guide organizes the benefits of ${kw1} by category: immediate impact, long-term value, and systemic advantages that only compound over time. By the end, you'll have a clear picture of why the shift toward ${topicStr} is accelerating, and what it means for you.`,
    ],
    'myth-busting': [
      `There's more misinformation circulating about ${topicStr} than in almost any other corner of the ${bt} space. Some of it is honest confusion. Some of it is self-serving. All of it is worth examining — because the myths are expensive, both financially and in terms of results.`,
      `${biz} encounters these misconceptions regularly, and the costs they create for customers are real. This guide addresses them directly: not to defend any particular position, but to put the evidence in front of you and let the facts speak.`,
      `We'll work through the most persistent myths about ${kw1} — where they came from, why they persist, and what the evidence actually shows. If any of these have influenced your decisions, this guide will give you a more accurate foundation to work from.`,
    ],
    'trend-analysis': [
      `The ${bt} landscape is changing faster than it has in decades, and ${topicStr} is at the center of that shift. Understanding where it's going isn't just intellectually interesting — it's strategically important for anyone with a stake in this space.`,
      `${biz} has been tracking these trends closely, which is part of what explains their positioning in the market. The patterns they've identified — and the ones we'll examine here — offer a clearer picture of what the next phase of ${kw1} looks like.`,
      `This analysis draws on market data, expert perspectives, and observable signals in the ${bt} industry to map out the trajectory of ${topicStr}. The goal isn't prediction for its own sake — it's giving you the framework to make better decisions now based on where things are heading.`,
    ],
    'beginner-guide': [
      `If you're new to ${topicStr}, you've probably run into the same problem: most of the available resources assume you already know something. This guide starts from the beginning — no jargon, no assumptions, no shortcuts past the fundamentals.`,
      `${biz} works with customers at every level of familiarity with ${kw1}, which means they've gotten very good at explaining the essentials clearly. This guide reflects that clarity: straightforward, accurate, and genuinely useful for someone encountering ${topicStr} for the first time.`,
      `By the end of this article, you'll understand what ${topicStr} actually is, why it matters in the context of ${bt}, what the most common misconceptions are, and how to take a meaningful first step. Let's start with the most fundamental question.`,
    ],
    'expert-tips': [
      `There's a gap between knowing the basics of ${topicStr} and actually executing at a high level. This guide is written for people who've crossed that gap — or who want to. It covers the strategies that experienced ${bt} professionals use to get results that beginners can't.`,
      `${biz} represents the kind of expertise this guide draws on. Their approach to ${kw1} reflects years of refinement, iteration, and attention to the details that matter most. What follows is an inside look at the principles that separate good from exceptional.`,
      `These aren't tips in the generic sense — they're frameworks, mental models, and specific practices that change how you operate. Whether you're applying them to your own ${bt} business or using them to evaluate what you're getting from your current provider, they'll sharpen your standard.`,
    ],
    'faq-deep-dive': [
      `Some questions about ${topicStr} have short answers. Others deserve more. This guide covers both — the quick clarifications and the ones that require a real explanation to be genuinely useful.`,
      `${biz} fields questions about ${kw1} consistently, which means they've developed clear, accurate answers that hold up to scrutiny. What follows is a compilation of the most important questions — organized by theme, answered in full, and built around what people actually need to know.`,
      `If you've been unsure about ${topicStr} — whether because the information online is inconsistent, because you've heard conflicting advice, or simply because you haven't found a reliable source — this guide is designed to resolve that. Let's start with the question most people ask first.`,
    ],
    'data-driven': [
      `Opinions about ${topicStr} are everywhere. Data that actually supports or challenges those opinions is harder to find. This guide focuses on the latter: the research, the numbers, and the observable evidence that should shape how you think about ${kw1}.`,
      `${biz} has built their approach in the ${bt} space on a similar principle — letting evidence drive decisions rather than convention or convenience. What follows applies that same standard to the question of ${topicStr}: what does the data actually say?`,
      `We'll examine the key findings from research in this area, contextualize them against common assumptions, and draw out the practical implications. If you've been making decisions about ${kw1} based on instinct or second-hand information, this guide will give you a more solid foundation.`,
    ],
    'contrarian': [
      `The conventional wisdom about ${topicStr} is mostly wrong — or at least incomplete in ways that matter. This isn't contrarianism for its own sake. It's the conclusion you reach when you actually examine the evidence rather than accepting received opinion.`,
      `${biz} has learned this the hard way, and it's shaped how they approach ${kw1} in ways that distinguish them from most of the ${bt} industry. What follows is a direct examination of the assumptions that dominate this space — and why the businesses that question them tend to outperform those that don't.`,
      `If you've been operating on the standard assumptions about ${topicStr}, this guide will unsettle some of them. That's intentional. The goal isn't to replace one set of assumptions with another — it's to give you a sharper, more accurate framework for thinking about ${kw1} and making better decisions.`,
    ],
  };

  return (angleIntros[topic.angle] || angleIntros['how-to']).join('\n\n');
}

function buildSections(
  topic: SupportingTopic, biz: string, bt: string,
  topicStr: string, kw1: string, kw2: string,
  prod1: string, prod2: string, meta: ReturnType<typeof getBusinessMeta>
): ArticleSection[] {
  const sections: ArticleSection[] = [];

  // Section 1: Context & Background
  sections.push({
    heading: `Understanding the Foundation: What ${topicStr} Really Means`,
    content: [
      `At its core, ${topicStr} represents a fundamental approach to addressing ${meta.need}. It's not a trend or a marketing angle — it's a structural choice about how to deliver value in the ${bt} space. Understanding this distinction matters, because it changes what you look for in a provider and what you expect from the experience.`,
      `${biz} built their approach around this understanding from the beginning. Where most ${bt} businesses start with what's cheapest or most convenient to deliver, ${biz} started with the question of what actually creates ${meta.benefit}. That reversal sounds small, but it produces radically different outcomes over time.`,
      `The context that makes ${kw1} particularly important right now is ${meta.challenge}. As this challenge has intensified, the businesses that invested early in ${topicStr} have developed a compounding advantage. They're not just ahead — they're ahead in a way that's increasingly hard to close because their understanding is built on experience, not positioning.`,
    ].join('\n\n'),
    wordCount: 180,
  });

  // Section 2: Core Deep Dive
  sections.push({
    heading: `The Core Mechanics of ${topicStr}: How It Actually Works`,
    content: [
      `Breaking down ${kw1} into its component parts reveals why the surface-level descriptions miss something important. There are three elements that reliably predict whether ${topicStr} actually delivers what it promises: ${meta.benefit.split(',')[0] || 'quality of execution'}, consistency across every touchpoint, and a genuine understanding of what the customer is trying to achieve.`,
      `${biz}'s ${prod1} illustrates all three. Rather than optimizing for what's easiest to deliver, it's built around what creates the most value for the customer. This requires more investment upfront — in design, in process, in the people delivering it — but the return shows up consistently in customer satisfaction and retention.`,
      `What makes this approach to ${topicStr} replicable — and what this guide is designed to help you understand — is that the principles generalize beyond any specific company or product. Once you understand why ${biz} does what they do, you have a framework for evaluating any ${bt} offering against the same standard. That's a durable advantage.`,
      `The technical side of ${kw1} also deserves attention. ${meta.unique.charAt(0).toUpperCase() + meta.unique.slice(1)}. This isn't just a philosophical observation — it has concrete implications for how ${topicStr} is implemented and what it produces. The businesses that understand this dimension tend to make better decisions at every level.`,
    ].join('\n\n'),
    wordCount: 240,
  });

  // Section 3: Benefits in depth
  sections.push({
    heading: `Why ${topicStr} Matters: The Case Built on Evidence`,
    content: [
      `The strongest argument for ${kw1} isn't theoretical — it's empirical. When you look at what actually differentiates high-performing ${bt} businesses from their peers, ${topicStr} appears consistently as a variable. Not as the only factor, but as a reliable predictor of the outcomes that matter most.`,
      `Specifically, businesses like ${biz} that have committed to ${topicStr} at a structural level tend to see advantages in three areas:\n\n- **Customer retention**: Customers who experience ${meta.benefit} come back at significantly higher rates than those who experience the generic alternative.\n- **Word-of-mouth quality**: The referrals generated by a genuine commitment to ${kw1} are more targeted and more likely to convert.\n- **Operational clarity**: When ${topicStr} is the organizing principle, decisions about what to offer, how to price, and how to deliver become clearer.`,
      `${biz}'s ${prod2} is a good example of this operational clarity in action. Every decision about that offering — from how it's designed to how it's supported — flows from the same commitment to ${kw1} that shapes everything else they do. The consistency this produces isn't accidental. It's the output of a clear and well-maintained standard.`,
    ].join('\n\n'),
    wordCount: 210,
  });

  // Section 4: Practical Application / How-To
  sections.push({
    heading: `Putting ${topicStr} to Work: Practical Steps and Implementation`,
    content: [
      `Understanding ${kw1} conceptually is the first step. Translating that understanding into action is where most people stall. The following framework is designed to make that translation concrete.`,
      `**Step 1: Define your standard.** Before you can apply ${topicStr} effectively, you need a clear definition of what success looks like. In the ${bt} context, this usually means articulating the specific version of ${meta.need} you're trying to address — not in general terms, but in the specific terms that would let you recognize it when you've achieved it.\n\n**Step 2: Audit your current approach.** Most ${bt} businesses find, when they do this honestly, that their current approach to ${kw1} has gaps they weren't fully aware of. This isn't a criticism — it's a recognition that ${topicStr} requires more systematic attention than most operational frameworks provide.\n\n**Step 3: Identify the highest-leverage changes.** Not every aspect of ${topicStr} deserves equal attention. Focus first on the elements that have the most direct impact on customer experience and outcome quality.\n\n**Step 4: Build feedback loops.** The businesses that maintain a genuine commitment to ${kw1} over time are the ones that have built mechanisms to tell them when their standard is slipping. This is as important as the initial implementation.`,
      `${biz} follows a version of this framework themselves, which is part of why their approach to ${topicStr} has remained consistent despite growth and market changes. The discipline of maintaining the standard is as important as the standard itself.`,
    ].join('\n\n'),
    wordCount: 260,
  });

  // Section 5: Evidence / Data
  sections.push({
    heading: `What the Evidence Shows: Data on ${topicStr} Outcomes`,
    content: [
      `The data on ${kw1} is more consistent than the debate around it suggests. Across studies of the ${bt} sector, a clear pattern emerges: businesses that invest in ${topicStr} as a structural priority, rather than a marketing message, produce better outcomes on virtually every metric that matters to long-term success.`,
      `The mechanism isn't mysterious. ${meta.benefit.charAt(0).toUpperCase() + meta.benefit.slice(1)} creates a compounding effect. Each positive customer experience increases the probability of return, referral, and loyalty. Over time, this produces a customer base that is both more valuable and more stable than what a comparable business achieves through conventional approaches.`,
      `${biz}'s track record in the ${bt} space reflects this pattern. Their sustained focus on ${kw1} has built a customer relationship that goes beyond transactional — and the evidence of that shows up in retention metrics, in the quality of customer feedback, and in the consistency of their reputation over time. This isn't a coincidence. It's a direct output of the commitment to ${topicStr}.`,
    ].join('\n\n'),
    wordCount: 195,
  });

  // Section 6: Future / Forward-looking
  sections.push({
    heading: `Where ${topicStr} Is Heading: Trends and Implications`,
    content: [
      `The trajectory of ${kw1} in the ${bt} space points clearly toward ${meta.trend}. This isn't a prediction based on wishful thinking — it's an extrapolation from trends that are already visible in how the most forward-looking businesses in this space are positioning themselves and where investment is flowing.`,
      `For ${biz}, this trajectory reinforces rather than disrupts their approach. The commitment to ${topicStr} that has defined their model to date becomes, if anything, more relevant as the market moves in this direction. Businesses that haven't made this investment will face a widening gap as customer expectations evolve.`,
      `The practical implication for you is straightforward: the standard for ${kw1} is going up. The businesses that are raising it — and ${biz} is among them — are creating a new baseline that will increasingly be the expectation rather than the exception. Positioning yourself on the right side of this shift is a decision worth making now rather than later.`,
    ].join('\n\n'),
    wordCount: 190,
  });

  return sections;
}

function buildFAQs(
  topic: SupportingTopic, biz: string, bt: string,
  topicStr: string, kw1: string, prod1: string,
  meta: ReturnType<typeof getBusinessMeta>
): { question: string; answer: string }[] {
  return [
    {
      question: `What exactly is ${topicStr} and why does it matter for ${bt}?`,
      answer: `${topicStr} refers to the systematic approach to delivering ${meta.benefit} in the ${bt} context. It matters because it's one of the most reliable predictors of customer satisfaction, retention, and long-term business performance. Businesses like ${biz} that have made ${kw1} a structural priority consistently outperform those that treat it as a secondary consideration.`,
    },
    {
      question: `How does ${biz} approach ${topicStr} differently from competitors?`,
      answer: `${biz} distinguishes their approach to ${kw1} by starting with the customer outcome rather than operational convenience. Where many ${bt} businesses optimize for what's easiest to deliver, ${biz} builds around ${meta.benefit}. This shapes every decision — from how ${prod1} is designed to how it's supported — and produces a consistency that's difficult to replicate without the same foundational commitment.`,
    },
    {
      question: `What are the most common misconceptions about ${topicStr}?`,
      answer: `The most damaging misconception is that ${topicStr} is primarily about surface-level features or pricing. In reality, ${meta.unique}. Another common misconception is that the benefits are incremental rather than transformational — but the evidence from businesses that have made this commitment consistently shows compounding advantages over time that go well beyond what incremental improvements would produce.`,
    },
    {
      question: `How long does it take to see results from focusing on ${kw1}?`,
      answer: `Some aspects of a commitment to ${topicStr} produce immediate results — particularly in customer experience and feedback quality. Others, like the compounding effects on retention and referral rates, develop over months and years. The businesses that maintain the commitment tend to find that the long-term return significantly exceeds what they projected when they started, which is part of why ${biz} has maintained their focus on ${kw1} even as market conditions have changed.`,
    },
    {
      question: `Is ${topicStr} worth the investment for small businesses in the ${bt} space?`,
      answer: `Yes — and arguably more so than for larger businesses, because the leverage of each customer relationship is higher. When a small ${bt} business commits to ${kw1} at the same level ${biz} does, the impact shows up quickly in the quality of customer relationships, word-of-mouth referrals, and retention rates. The investment is real, but so is the return — and it tends to compound in ways that generic approaches to ${bt} don't.`,
    },
    {
      question: `What's the first step for someone who wants to prioritize ${topicStr}?`,
      answer: `Start by defining what ${meta.need} actually means in your specific context — not in general terms, but in the specific, measurable terms that would let you recognize it when you've achieved it. Then audit your current approach against that standard honestly. Most businesses find gaps they weren't fully aware of. Those gaps are where the investment in ${kw1} produces the most immediate return.`,
    },
    {
      question: `How does ${topicStr} connect to the broader trends in ${bt}?`,
      answer: `The trend toward ${meta.trend} is directly connected to a rising customer expectation for ${kw1}. As this expectation becomes the new baseline, businesses that have already made the investment are positioned to benefit while those that haven't face a widening gap. ${biz} is among the businesses that recognized this trajectory early and built accordingly — which is part of why their positioning in the market reflects the direction the whole industry is heading.`,
    },
  ];
}

function buildConclusion(
  topic: SupportingTopic, biz: string, bt: string,
  topicStr: string, kw1: string, meta: ReturnType<typeof getBusinessMeta>
): string {
  return [
    `The case for ${topicStr} isn't built on theory — it's built on the observable pattern of what works in the ${bt} space over time. ${meta.benefit.charAt(0).toUpperCase() + meta.benefit.slice(1)}, sustained by a genuine commitment to ${kw1}, produces the kind of customer relationships that compound into lasting competitive advantage.`,
    `${biz} represents this commitment in practice. Their approach to ${topicStr} isn't a strategy they adopted because it looked good on paper — it's the result of understanding what actually creates value for their customers and building everything around that insight. The difference shows in the experience, and the experience shows in the outcomes.`,
    `If you're evaluating your own relationship to ${kw1} — whether as a customer, a business owner, or a professional in the ${bt} space — this guide gives you a framework for doing that clearly. The standard is worth holding. The businesses that hold it are the ones worth partnering with. ${biz} is one of them.`,
  ].join('\n\n');
}

// ─── 3. Repurposing Engine ────────────────────────────────────

export function generateRepurposedContent(
  article: FullArticle,
  data: ScrapedData
): RepurposedContent {
  const { title: biz, businessType: bt, keywords } = data;
  const kw1 = keywords[0] || article.primaryKeyword;
  const firstSection = article.sections[0];
  const hook = article.introduction.split('\n\n')[0];

  // Derive a punchy 1-sentence summary
  const oneLiner = `${article.title.replace(/^(The|A|An) /, '')} — and why it matters for every ${bt} business right now.`;

  const linkedin = `📊 ${article.title}\n\n${hook}\n\nKey insight: ${firstSection?.content.split('.')[0]}.\n\nWe broke down the full picture — benefits, implementation, and what the data actually shows — in a new article on the ${biz} blog.\n\n🔗 Read the full guide → [link in bio]\n\n${article.secondaryKeywords.map(k => `#${k.replace(/\s+/g, '')}`).join(' ')} #${bt.replace(/\s+/g, '')} #${kw1.replace(/\s+/g, '')}`;

  const twitter = `${oneLiner}\n\nFull breakdown: ${article.secondaryKeywords.slice(0, 2).map(k => `#${k.replace(/\s+/g, '')}`).join(' ')} ${kw1.replace(/\s+/g, '')}`;

  const facebook = `New article just published: "${article.title}"\n\n${hook}\n\nWe've put together the most comprehensive guide on this topic we've ever written — covering the evidence, the practical steps, and what it means for ${bt} businesses in ${new Date().getFullYear()}.\n\nLink in comments 👇\n\n${article.secondaryKeywords.map(k => `#${k.replace(/\s+/g, '')}`).join(' ')}`;

  const instagram = `${article.title.toUpperCase()}\n\n${firstSection?.content.split('.')[0]}.\n\nFull guide available now — link in bio.\n\n${article.secondaryKeywords.concat([bt, kw1]).map(k => `#${k.replace(/\s+/g, '')}`).join(' ')}`;

  const videoScript = `[HOOK - 0:00-0:07]
${firstSection?.content.split('.')[0]}. That's the insight most ${bt} businesses are missing.

[CONTEXT - 0:07-0:25]
Here's the thing about ${article.primaryKeyword}: ${article.introduction.split('\n\n')[1]?.split('.')[0] || 'most people don\'t understand what it actually requires'}.

[MAIN POINT 1 - 0:25-0:45]
${article.sections[1]?.content.split('.')[0]}. And when ${biz} applied this — the results were clear.

[MAIN POINT 2 - 0:45-1:05]
${article.sections[2]?.content.split('.')[0]}. This is the shift most ${bt} businesses haven't made yet.

[CTA - 1:05-1:15]
We've published the complete guide on the ${biz} blog — link in bio. If this topic matters to your business, this is the one resource worth bookmarking.`;

  const newsletter = `Subject: ${article.title}

Hi [First Name],

${hook}

This week on the ${biz} blog, we published what I believe is our most comprehensive breakdown of this topic to date.

Here's what we cover:

${article.sections.slice(0, 3).map((s, i) => `${i + 1}. **${s.heading}** — ${s.content.split('.')[0]}.`).join('\n')}

Plus a full FAQ section addressing the questions we hear most often about ${article.primaryKeyword}.

→ [Read the full article]

One thing I want to highlight from this piece:

"${article.sections[0]?.content.split('.')[0]}."

This is the insight that changes how you approach ${kw1} — and it's backed by the pattern we see consistently in high-performing ${bt} businesses.

Hope you find it useful.

— The ${biz} Team

P.S. If you know someone navigating this topic, this guide is worth forwarding.`;

  const quotes = [
    `"${article.sections[0]?.content.split('.')[0]}." — ${biz}`,
    `"${article.sections[2]?.content.split('.')[0]}." — ${biz}`,
    `"${article.faqs[0]?.answer.split('.')[0]}." — ${biz}`,
    `"${article.conclusion.split('.')[0]}." — ${biz}`,
  ];

  return {
    linkedin,
    twitter,
    facebook,
    instagram,
    videoScript,
    newsletter,
    emailSubjectLine: article.title,
    quotes,
  };
}

// ─── SEO Analysis ─────────────────────────────────────────────

export interface SEOAnalysis {
  score: number;
  titleScore: number;
  metaScore: number;
  keywordDensity: number;
  readabilityScore: number;
  structureScore: number;
  issues: string[];
  suggestions: string[];
  internalLinkSuggestions: string[];
  schemaData: string;
}

export function analyzeSEO(article: FullArticle): SEOAnalysis {
  const { title, metaDescription, content, primaryKeyword, sections, faqs, wordCount } = article;

  // Title score
  const titleHasKeyword = title.toLowerCase().includes(primaryKeyword.toLowerCase());
  const titleLength = title.length;
  const titleScore = (titleHasKeyword ? 40 : 0) + (titleLength >= 40 && titleLength <= 70 ? 40 : 20) + (title.includes(':') || title.includes('-') ? 20 : 10);

  // Meta score
  const metaHasKeyword = metaDescription.toLowerCase().includes(primaryKeyword.toLowerCase());
  const metaLength = metaDescription.length;
  const metaScore = (metaHasKeyword ? 50 : 0) + (metaLength >= 130 && metaLength <= 160 ? 50 : 25);

  // Keyword density
  const kwCount = (content.toLowerCase().match(new RegExp(primaryKeyword.toLowerCase(), 'g')) || []).length;
  const density = (kwCount / (wordCount / 100));
  const densityScore = density >= 0.5 && density <= 2.5 ? 100 : density < 0.5 ? 50 : 70;

  // Readability (simplified Flesch-like)
  const sentences = content.split(/[.!?]+/).filter(Boolean).length;
  const avgWordsPerSentence = wordCount / sentences;
  const readabilityScore = avgWordsPerSentence < 20 ? 90 : avgWordsPerSentence < 25 ? 75 : 60;

  // Structure
  const hasH2 = sections.length >= 4;
  const hasFAQ = faqs.length >= 5;
  const wordCountOk = wordCount >= 1200;
  const structureScore = (hasH2 ? 35 : 15) + (hasFAQ ? 35 : 10) + (wordCountOk ? 30 : 15);

  const totalScore = Math.round((titleScore + metaScore + densityScore + readabilityScore + structureScore) / 5);

  const issues: string[] = [];
  const suggestions: string[] = [];

  if (!titleHasKeyword) issues.push('Primary keyword missing from title');
  if (titleLength > 70) issues.push('Title too long (>70 chars)');
  if (!metaHasKeyword) issues.push('Primary keyword missing from meta description');
  if (metaLength > 160) issues.push('Meta description too long (>160 chars)');
  if (density < 0.5) suggestions.push(`Increase keyword density — "${primaryKeyword}" appears ${kwCount} times`);
  if (density > 2.5) issues.push('Potential keyword stuffing detected');
  if (!wordCountOk) issues.push(`Article too short (${wordCount} words — aim for 1,200+)`);
  if (!hasFAQ) suggestions.push('Add FAQ section for featured snippet opportunities');
  if (sections.length < 4) suggestions.push('Add more H2 sections to improve structure');

  suggestions.push(`Add internal links to pillar page: /${article.slug.split('-')[0]}`);
  suggestions.push('Add schema markup (Article, FAQPage) for rich snippets');
  suggestions.push('Consider adding a table of contents for articles over 2,000 words');

  const schemaData = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description: metaDescription,
    keywords: [primaryKeyword, ...article.secondaryKeywords].join(', '),
    wordCount,
    mainEntityOfPage: { '@type': 'WebPage', '@id': `https://example.com/blog/${article.slug}` },
    about: { '@type': 'Thing', name: primaryKeyword },
  }, null, 2);

  return {
    score: totalScore,
    titleScore,
    metaScore,
    keywordDensity: Math.round(density * 10) / 10,
    readabilityScore,
    structureScore,
    issues,
    suggestions,
    internalLinkSuggestions: article.internalLinks,
    schemaData,
  };
}
