// ═══════════════════════════════════════════════════════════════════════════════
// BLOG WRITING AGENTS — AI-Powered Content Creation System
// Specialized agents for smart blog content generation integrated with SuperBrainBuilder
// ═══════════════════════════════════════════════════════════════════════════════

export type BlogAgentStatus = 'idle' | 'analyzing' | 'generating' | 'optimizing' | 'complete' | 'error';

export interface BlogAgent {
  id: number;
  name: string;
  category: BlogAgentCategory;
  status: BlogAgentStatus;
  capability: string;
  progress?: number;
  output?: any;
  startedAt?: number;
  completedAt?: number;
}

export type BlogAgentCategory =
  | 'Content Strategy'
  | 'Writing & Generation'
  | 'SEO & Optimization'
  | 'Quality Assurance'
  | 'Distribution & Analytics';

export const BLOG_AGENT_COLORS: Record<BlogAgentCategory, { bg: string; text: string; border: string; icon: string }> = {
  'Content Strategy':       { bg: 'bg-purple-950/40',  text: 'text-purple-400',  border: 'border-purple-800/50',  icon: '🎯' },
  'Writing & Generation':   { bg: 'bg-blue-950/40',    text: 'text-blue-400',    border: 'border-blue-800/50',    icon: '✍️' },
  'SEO & Optimization':     { bg: 'bg-green-950/40',   text: 'text-green-400',   border: 'border-green-800/50',   icon: '🔍' },
  'Quality Assurance':      { bg: 'bg-amber-950/40',   text: 'text-amber-400',   border: 'border-amber-800/50',   icon: '✅' },
  'Distribution & Analytics': { bg: 'bg-pink-950/40', text: 'text-pink-400',    border: 'border-pink-800/50',    icon: '📊' },
};

export function createBlogAgents(): BlogAgent[] {
  return [
    // ── Content Strategy (101-110) ──
    { id: 101, name: 'Topic Research Agent',        category: 'Content Strategy', status: 'idle', capability: 'Trend analysis, keyword research, topic clustering' },
    { id: 102, name: 'Audience Analyzer',           category: 'Content Strategy', status: 'idle', capability: 'Target audience profiling, pain point identification' },
    { id: 103, name: 'Competitive Intelligence',    category: 'Content Strategy', status: 'idle', capability: 'Competitor content analysis, gap identification' },
    { id: 104, name: 'Content Planner',             category: 'Content Strategy', status: 'idle', capability: 'Editorial calendar, content clustering strategy' },
    { id: 105, name: 'Intent Mapper',               category: 'Content Strategy', status: 'idle', capability: 'Search intent analysis, user journey mapping' },
    { id: 106, name: 'Brand Voice Analyzer',        category: 'Content Strategy', status: 'idle', capability: 'Tone analysis, voice consistency checking' },
    { id: 107, name: 'Content Gap Finder',          category: 'Content Strategy', status: 'idle', capability: 'Missing content opportunities, SERP gap analysis' },
    { id: 108, name: 'Semantic Keyword Expander',   category: 'Content Strategy', status: 'idle', capability: 'LSI keywords, semantic variations, related terms' },
    { id: 109, name: 'Question Mining Agent',       category: 'Content Strategy', status: 'idle', capability: 'People Also Ask, forum scraping, FAQ generation' },
    { id: 110, name: 'Trend Forecaster',            category: 'Content Strategy', status: 'idle', capability: 'Content trend prediction, seasonal planning' },

    // ── Writing & Generation (111-125) ──
    { id: 111, name: 'Outline Generator',           category: 'Writing & Generation', status: 'idle', capability: 'Hierarchical outlines, H2/H3 structure planning' },
    { id: 112, name: 'Introduction Writer',         category: 'Writing & Generation', status: 'idle', capability: 'Hook creation, problem/solution framing' },
    { id: 113, name: 'Body Content Generator',      category: 'Writing & Generation', status: 'idle', capability: 'Section writing, paragraph expansion' },
    { id: 114, name: 'Conclusion Synthesizer',      category: 'Writing & Generation', status: 'idle', capability: 'Key takeaways, CTA generation' },
    { id: 115, name: 'Headline Variant Generator',  category: 'Writing & Generation', status: 'idle', capability: 'A/B headline testing, CTR optimization' },
    { id: 116, name: 'Meta Description Writer',     category: 'Writing & Generation', status: 'idle', capability: 'SERP snippet optimization, character limits' },
    { id: 117, name: 'Long-Form Expander',          category: 'Writing & Generation', status: 'idle', capability: 'Content depth enhancement, 2000+ word articles' },
    { id: 118, name: 'Storytelling Agent',          category: 'Writing & Generation', status: 'idle', capability: 'Narrative flow, anecdote integration' },
    { id: 119, name: 'Data Visualizer',             category: 'Writing & Generation', status: 'idle', capability: 'Chart/graph suggestions, stat formatting' },
    { id: 120, name: 'Example Generator',           category: 'Writing & Generation', status: 'idle', capability: 'Use cases, code snippets, real-world examples' },
    { id: 121, name: 'FAQ Builder',                 category: 'Writing & Generation', status: 'idle', capability: 'Schema-ready Q&A pairs' },
    { id: 122, name: 'Tone Adjuster',               category: 'Writing & Generation', status: 'idle', capability: 'Casual, professional, technical tone shifting' },
    { id: 123, name: 'Citation Formatter',          category: 'Writing & Generation', status: 'idle', capability: 'Source attribution, link formatting' },
    { id: 124, name: 'Call-to-Action Optimizer',    category: 'Writing & Generation', status: 'idle', capability: 'CTA placement, conversion optimization' },
    { id: 125, name: 'Content Repurposer',          category: 'Writing & Generation', status: 'idle', capability: 'Social posts, email, infographic scripts' },

    // ── SEO & Optimization (126-140) ──
    { id: 126, name: 'Keyword Density Optimizer',   category: 'SEO & Optimization', status: 'idle', capability: 'Natural keyword placement, density balancing' },
    { id: 127, name: 'Internal Linking Agent',      category: 'SEO & Optimization', status: 'idle', capability: 'Anchor text suggestions, link insertion' },
    { id: 128, name: 'Schema Markup Generator',     category: 'SEO & Optimization', status: 'idle', capability: 'Article, FAQ, HowTo schema JSON-LD' },
    { id: 129, name: 'Readability Scorer',          category: 'SEO & Optimization', status: 'idle', capability: 'Flesch-Kincaid, Hemingway, grade level analysis' },
    { id: 130, name: 'SERP Feature Optimizer',      category: 'SEO & Optimization', status: 'idle', capability: 'Featured snippet, PAA targeting' },
    { id: 131, name: 'Image ALT Text Generator',    category: 'SEO & Optimization', status: 'idle', capability: 'Descriptive ALT tags, keyword inclusion' },
    { id: 132, name: 'URL Slug Optimizer',          category: 'SEO & Optimization', status: 'idle', capability: 'SEO-friendly URL generation' },
    { id: 133, name: 'Mobile Readability Check',    category: 'SEO & Optimization', status: 'idle', capability: 'Mobile-first content validation' },
    { id: 134, name: 'E-A-T Analyzer',              category: 'SEO & Optimization', status: 'idle', capability: 'Expertise, Authority, Trustworthiness scoring' },
    { id: 135, name: 'Semantic Enrichment',         category: 'SEO & Optimization', status: 'idle', capability: 'Entity detection, topic modeling' },
    { id: 136, name: 'Link Velocity Tracker',       category: 'SEO & Optimization', status: 'idle', capability: 'Backlink growth monitoring' },
    { id: 137, name: 'Core Web Vitals Advisor',     category: 'SEO & Optimization', status: 'idle', capability: 'LCP, FID, CLS content optimization' },
    { id: 138, name: 'Title Tag Optimizer',         category: 'SEO & Optimization', status: 'idle', capability: 'Character limits, keyword positioning' },
    { id: 139, name: 'Content Freshness Monitor',   category: 'SEO & Optimization', status: 'idle', capability: 'Update suggestions, date stamping' },
    { id: 140, name: 'Multilingual SEO',            category: 'SEO & Optimization', status: 'idle', capability: 'hreflang, translation optimization' },

    // ── Quality Assurance (141-155) ──
    { id: 141, name: 'Grammar & Spelling Checker',  category: 'Quality Assurance', status: 'idle', capability: 'Advanced grammar, style, punctuation' },
    { id: 142, name: 'Plagiarism Detector',         category: 'Quality Assurance', status: 'idle', capability: 'Duplicate content scanning, originality score' },
    { id: 143, name: 'Fact Checker',                category: 'Quality Assurance', status: 'idle', capability: 'Claim verification, source validation' },
    { id: 144, name: 'Sentiment Analyzer',          category: 'Quality Assurance', status: 'idle', capability: 'Emotional tone detection, sentiment scoring' },
    { id: 145, name: 'Engagement Predictor',        category: 'Quality Assurance', status: 'idle', capability: 'Read time, scroll depth, bounce prediction' },
    { id: 146, name: 'Clarity Analyzer',            category: 'Quality Assurance', status: 'idle', capability: 'Jargon detection, simplification suggestions' },
    { id: 147, name: 'Inclusivity Checker',         category: 'Quality Assurance', status: 'idle', capability: 'Bias detection, inclusive language' },
    { id: 148, name: 'Legal Compliance Scanner',    category: 'Quality Assurance', status: 'idle', capability: 'Copyright, disclosure, GDPR compliance' },
    { id: 149, name: 'Brand Guidelines Validator',  category: 'Quality Assurance', status: 'idle', capability: 'Style guide adherence, brand consistency' },
    { id: 150, name: 'Link Validator',              category: 'Quality Assurance', status: 'idle', capability: 'Broken link detection, redirect checking' },
    { id: 151, name: 'Content Structure Auditor',   category: 'Quality Assurance', status: 'idle', capability: 'Heading hierarchy, formatting validation' },
    { id: 152, name: 'Accessibility Checker',       category: 'Quality Assurance', status: 'idle', capability: 'WCAG compliance, screen reader optimization' },
    { id: 153, name: 'Citation Verifier',           category: 'Quality Assurance', status: 'idle', capability: 'Source credibility, link rot detection' },
    { id: 154, name: 'Content Uniqueness Scorer',   category: 'Quality Assurance', status: 'idle', capability: 'Differentiation from competitors' },
    { id: 155, name: 'Quality Score Calculator',    category: 'Quality Assurance', status: 'idle', capability: 'Composite quality metrics dashboard' },

    // ── Distribution & Analytics (156-165) ──
    { id: 156, name: 'Social Post Generator',       category: 'Distribution & Analytics', status: 'idle', capability: 'Platform-specific post variants' },
    { id: 157, name: 'Email Newsletter Builder',    category: 'Distribution & Analytics', status: 'idle', capability: 'Email formatting, subject lines' },
    { id: 158, name: 'Auto-Tagging Agent',          category: 'Distribution & Analytics', status: 'idle', capability: 'Category, tag, taxonomy suggestions' },
    { id: 159, name: 'Publishing Scheduler',        category: 'Distribution & Analytics', status: 'idle', capability: 'Optimal publish time prediction' },
    { id: 160, name: 'Cross-Promotion Suggester',   category: 'Distribution & Analytics', status: 'idle', capability: 'Related content linking strategy' },
    { id: 161, name: 'Performance Tracker',         category: 'Distribution & Analytics', status: 'idle', capability: 'Traffic, engagement, conversion analytics' },
    { id: 162, name: 'A/B Test Coordinator',        category: 'Distribution & Analytics', status: 'idle', capability: 'Variant testing, winner selection' },
    { id: 163, name: 'Content Amplifier',           category: 'Distribution & Analytics', status: 'idle', capability: 'Viral potential scoring, share triggers' },
    { id: 164, name: 'Influencer Outreach',         category: 'Distribution & Analytics', status: 'idle', capability: 'Mention-worthy content flagging' },
    { id: 165, name: 'ROI Calculator',              category: 'Distribution & Analytics', status: 'idle', capability: 'Content marketing ROI metrics' },
  ];
}

export interface BlogPipeline {
  phaseId: number;
  phaseName: string;
  agentIds: number[];
  parallel: boolean;
  estimatedDuration: number; // seconds
}

export const BLOG_PIPELINE: BlogPipeline[] = [
  { phaseId: 1, phaseName: 'Research & Strategy',      agentIds: [101, 102, 103, 105, 107, 108, 109], parallel: true,  estimatedDuration: 15 },
  { phaseId: 2, phaseName: 'Outline & Planning',       agentIds: [104, 111, 115, 132],                parallel: true,  estimatedDuration: 8 },
  { phaseId: 3, phaseName: 'Content Generation',       agentIds: [112, 113, 114, 117, 120, 121],      parallel: true,  estimatedDuration: 20 },
  { phaseId: 4, phaseName: 'Tone & Style Refinement',  agentIds: [106, 118, 122],                     parallel: false, estimatedDuration: 10 },
  { phaseId: 5, phaseName: 'SEO Optimization',         agentIds: [126, 127, 128, 130, 131, 138],      parallel: true,  estimatedDuration: 12 },
  { phaseId: 6, phaseName: 'Quality Checks',           agentIds: [141, 142, 143, 144, 146, 149, 150], parallel: true,  estimatedDuration: 18 },
  { phaseId: 7, phaseName: 'Readability & Structure',  agentIds: [129, 133, 151, 152],                parallel: true,  estimatedDuration: 8 },
  { phaseId: 8, phaseName: 'Meta & Schema',            agentIds: [116, 128, 134],                     parallel: true,  estimatedDuration: 6 },
  { phaseId: 9, phaseName: 'Distribution Prep',        agentIds: [125, 156, 157, 158, 160],           parallel: true,  estimatedDuration: 10 },
  { phaseId: 10, phaseName: 'Final Validation',        agentIds: [155, 162],                          parallel: true,  estimatedDuration: 5 },
];

export function getBlogAgentsForPhase(phaseId: number): number[] {
  return BLOG_PIPELINE.find(p => p.phaseId === phaseId)?.agentIds || [];
}

export function getBlogCategories(): BlogAgentCategory[] {
  return [
    'Content Strategy',
    'Writing & Generation',
    'SEO & Optimization',
    'Quality Assurance',
    'Distribution & Analytics',
  ];
}

export function getBlogAgentsByCategory(agents: BlogAgent[]): Record<BlogAgentCategory, BlogAgent[]> {
  const result: Record<BlogAgentCategory, BlogAgent[]> = {
    'Content Strategy': [],
    'Writing & Generation': [],
    'SEO & Optimization': [],
    'Quality Assurance': [],
    'Distribution & Analytics': [],
  };
  for (const agent of agents) {
    result[agent.category].push(agent);
  }
  return result;
}
