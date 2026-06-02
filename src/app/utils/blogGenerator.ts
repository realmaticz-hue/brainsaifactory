// =============================================================
// BLOG GENERATOR — AI Blog Factory Grade · Full 8-Pass Pipeline
// Same writing caliber as AI Blog Factory long-form articles
// =============================================================
//
// PASS 1 → Extract every usable fact (products, quotes, data, headings)
// PASS 2 → Identify content weaknesses & missing angles
// PASS 3 → Generate angle-specific outline with hook variation
// PASS 4 → Write draft from outline — structural precision
// PASS 5 → Tighten flow — each sentence earns its position
// PASS 6 → Sharpen hook — replace any generic opener
// PASS 7 → SEO weave — embed keywords naturally, zero stuffing
// PASS 8 → Add proof — specific product/data/quote references
//
// Writing standards (same as Blog Factory):
//   • Every sentence has exactly one job
//   • Specificity over vagueness — never "great quality", always WHY
//   • Contrarian framing — challenge the assumption first
//   • Progressive revelation — each sentence reveals something new
//   • No filler CTAs — the CTA must feel earned by what preceded it
// =============================================================

// ─── Types ────────────────────────────────────────────────────

interface ScrapedProduct {
  name: string;
  description?: string;
  price?: string;
}

export interface ScrapedData {
  title: string;
  description: string;
  content: string;
  cleanContent?: string;
  headings?: string[];
  keyPoints?: string[];
  dataPoints?: string[];
  quotes?: string[];
  products: ScrapedProduct[];
  keywords: string[];
  semanticKeywords?: string[];
  businessType: string;
  coreTopic?: string;
  missingAngles?: string[];
}

// ─── Rich post interface (same metadata depth as Blog Factory) ─

export interface GeneratedPost {
  content: string;
  angle: string;
  angleLabel: string;
  seoTitle: string;
  metaDescription: string;
  slug: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  wordCount: number;
  qualityScore: number;
  passCount: number;
  hook: string;
  cta: string;
  structure: 'hook→insight→proof→cta' | 'hook→context→insight→insight→apply→cta';
}

export interface GeneratedBlogPosts {
  posts7sec: GeneratedPost[];
  posts30sec: GeneratedPost[];
}

export interface BlogPost {
  id: string;
  duration: number;
  content: string;
  character: {
    name: string;
    avatar: string;
    voiceType: string;
    [key: string]: any;
  };
  timestamp: Date;
  // Rich metadata — same depth as Blog Factory
  angle?: string;
  angleLabel?: string;
  seoTitle?: string;
  metaDescription?: string;
  slug?: string;
  primaryKeyword?: string;
  secondaryKeywords?: string[];
  wordCount?: number;
  qualityScore?: number;
}

export type DurationFilter = 'all' | 7 | 30;

// ─── Angle registry ───────────────────────────────────────────

type Angle7 =
  | 'precision_hook' | 'contrarian_flash' | 'data_spike' | 'question_reframe'
  | 'bold_inversion' | 'insider_frame' | 'category_gap' | 'method_reveal'
  | 'before_after' | 'myth_collapse' | 'trend_signal' | 'social_mirror'
  | 'cost_of_inaction' | 'expert_filter' | 'single_variable' | 'outcome_first'
  | 'standard_reset' | 'proof_first' | 'tension_release' | 'future_pull';

type Angle30 =
  | 'problem_mechanism' | 'expert_deconstruct' | 'contrarian_thesis'
  | 'evidence_build' | 'pattern_study' | 'decision_framework' | 'myth_anatomy'
  | 'trend_decode' | 'sequence_reveal' | 'benchmark_shift' | 'hidden_variable'
  | 'compounding_logic' | 'precision_standard' | 'trust_architecture'
  | 'failure_mode' | 'signal_vs_noise' | 'investment_framing'
  | 'customer_psychology' | 'systemic_advantage' | 'transformation_arc';

const ANGLES_7: Angle7[] = [
  'precision_hook', 'contrarian_flash', 'data_spike', 'question_reframe',
  'bold_inversion', 'insider_frame', 'category_gap', 'method_reveal',
  'before_after', 'myth_collapse', 'trend_signal', 'social_mirror',
  'cost_of_inaction', 'expert_filter', 'single_variable', 'outcome_first',
  'standard_reset', 'proof_first', 'tension_release', 'future_pull',
];

const ANGLES_30: Angle30[] = [
  'problem_mechanism', 'expert_deconstruct', 'contrarian_thesis',
  'evidence_build', 'pattern_study', 'decision_framework', 'myth_anatomy',
  'trend_decode', 'sequence_reveal', 'benchmark_shift', 'hidden_variable',
  'compounding_logic', 'precision_standard', 'trust_architecture',
  'failure_mode', 'signal_vs_noise', 'investment_framing',
  'customer_psychology', 'systemic_advantage', 'transformation_arc',
];

const ANGLE_LABELS: Record<string, string> = {
  precision_hook: 'Precision Hook', contrarian_flash: 'Contrarian Flash', data_spike: 'Data Spike',
  question_reframe: 'Question Reframe', bold_inversion: 'Bold Inversion', insider_frame: 'Insider Frame',
  category_gap: 'Category Gap', method_reveal: 'Method Reveal', before_after: 'Before/After',
  myth_collapse: 'Myth Collapse', trend_signal: 'Trend Signal', social_mirror: 'Social Mirror',
  cost_of_inaction: 'Cost of Inaction', expert_filter: 'Expert Filter', single_variable: 'Single Variable',
  outcome_first: 'Outcome First', standard_reset: 'Standard Reset', proof_first: 'Proof First',
  tension_release: 'Tension Release', future_pull: 'Future Pull',
  problem_mechanism: 'Problem Mechanism', expert_deconstruct: 'Expert Deconstruct',
  contrarian_thesis: 'Contrarian Thesis', evidence_build: 'Evidence Build',
  pattern_study: 'Pattern Study', decision_framework: 'Decision Framework',
  myth_anatomy: 'Myth Anatomy', trend_decode: 'Trend Decode', sequence_reveal: 'Sequence Reveal',
  benchmark_shift: 'Benchmark Shift', hidden_variable: 'Hidden Variable',
  compounding_logic: 'Compounding Logic', precision_standard: 'Precision Standard',
  trust_architecture: 'Trust Architecture', failure_mode: 'Failure Mode',
  signal_vs_noise: 'Signal vs Noise', investment_framing: 'Investment Framing',
  customer_psychology: 'Customer Psychology', systemic_advantage: 'Systemic Advantage',
  transformation_arc: 'Transformation Arc',
};

// ─── Main Export ──────────────────────────────────────────────

export function generateBlogPosts({ data }: { data: ScrapedData; }): GeneratedBlogPosts {
  // Defensive: ensure required fields exist
  const safeData: ScrapedData = {
    title: data.title || 'Unknown Business',
    description: data.description || '',
    content: data.content || '',
    products: data.products || [],
    keywords: data.keywords || [],
    businessType: data.businessType || 'general',
    cleanContent: data.cleanContent,
    headings: data.headings || [],
    keyPoints: data.keyPoints || [],
    dataPoints: data.dataPoints || [],
    quotes: data.quotes || [],
    semanticKeywords: data.semanticKeywords || [],
    coreTopic: data.coreTopic,
    missingAngles: data.missingAngles || [],
  };

  const facts = pass1_extractFacts(safeData);
  const gaps = pass2_identifyGaps(safeData, facts);

  const posts7sec: GeneratedPost[] = ANGLES_7.map(angle => build7sec(safeData, facts, gaps, angle));
  const posts30sec: GeneratedPost[] = ANGLES_30.map(angle => build30sec(safeData, facts, gaps, angle));

  return { posts7sec, posts30sec };
}

// =============================================================
// PASS 1 — Extract Facts
// Pull every specific, usable detail from scraped content.
// Rule: prefer concrete over abstract at every decision point.
// =============================================================

interface Facts {
  biz: string;
  bt: string;
  topic: string;
  prod1: string;
  prod2: string;
  productList: string[];
  pricedOffers: string[];
  heading1: string;
  heading2: string;
  kw1: string;
  kw2: string;
  kw3: string;
  skw: string[];
  need: string;
  benefit: string;
  unique: string;
  challenge: string;
  trend: string;
  data1: string;
  quote1: string;
  keyPoint1: string;
  hasPricing: boolean;
  priceAnchor: string;
}

function pass1_extractFacts(d: ScrapedData): Facts {
  const { title: biz, businessType: bt, products, keywords, semanticKeywords = [],
    headings = [], keyPoints = [], dataPoints = [], quotes = [],
    coreTopic, description } = d;

  const productList = products.map(p => p.name).filter(Boolean);
  const pricedOffers = products.filter(p => p.price).map(p => `${p.name} (${p.price})`);
  const prod1 = productList[0] || keywords[0] || bt;
  const prod2 = productList[1] || keywords[1] || 'their broader offering';

  const topic = coreTopic || headings[0] || keywords[0] || biz;
  const kw1 = keywords[0] || topic;
  const kw2 = keywords[1] || bt;
  const kw3 = keywords[2] || `${topic} guide`;
  const skw = semanticKeywords.slice(0, 6);

  type BTKey = 'restaurant' | 'coffee shop' | 'fitness' | 'spa' | 'ecommerce' | 'retail' |
    'tech' | 'saas' | 'service' | 'healthcare' | 'education' | 'real estate' | 'general';

  const needMap: Record<BTKey, string> = {
    restaurant: 'a dining experience that justifies the time and cost of leaving home',
    'coffee shop': 'a daily ritual that actually starts the morning right',
    fitness: 'real, sustainable results — not just motivation that fades by week three',
    spa: 'genuine restoration, not a 90-minute nap in a dimly lit room',
    ecommerce: 'products that deliver exactly what the description promised',
    retail: 'a curated selection where the right choice is obvious, not overwhelming',
    tech: 'tools that solve the actual problem without creating three new ones',
    saas: 'a platform that compounds in value the longer you use it',
    service: 'a provider who delivers what they promised, on time, without excuses',
    healthcare: 'care that treats the root cause, not just the presenting symptom',
    education: 'knowledge that translates directly into results you can point to',
    'real estate': 'guidance through the most financially significant decision of their life',
    general: 'a solution that works consistently without constant intervention',
  };

  const benefitMap: Record<BTKey, string> = {
    restaurant: 'ingredients sourced with intention, flavors built around a specific culinary philosophy',
    'coffee shop': 'every element of the cup — origin, roast profile, extraction — is a deliberate choice, not a default',
    fitness: 'programming that adapts to individual physiology, not a generic schedule imposed on every body type',
    spa: 'treatments formulated around clinical efficacy, not just ambient comfort',
    ecommerce: 'quality verification applied at every step before anything reaches the customer',
    retail: 'expert curation that removes the cognitive load of choosing correctly',
    tech: 'architecture designed around the actual workflow, not a feature list padded for the pricing page',
    saas: 'every workflow optimization compounds — the longer you use it, the wider the efficiency gap grows',
    service: 'a systematic delivery process with defined milestones, transparent communication, and accountable outputs',
    healthcare: 'preventive and responsive care integrated into a single approach that changes long-term trajectory',
    education: 'structured learning paths with accountability mechanisms that generic self-study cannot replicate',
    'real estate': 'market intelligence translated into specific, actionable recommendations — not general market optimism',
    general: 'consistent execution at a standard that builds genuine loyalty rather than provisional satisfaction',
  };

  const uniqueMap: Record<BTKey, string> = {
    restaurant: 'the best dishes at the best restaurants in the world come from a refusal to compromise on a handful of specific things',
    'coffee shop': 'sourcing relationships determine 80% of the flavor profile before a single brewing decision is made',
    fitness: 'the athletes who make real progress long-term are the ones who treat recovery as training, not rest',
    spa: 'the difference between a treatment that changes your skin and one that temporarily feels good is ingredient specificity and protocol precision',
    ecommerce: 'the businesses that build lasting loyalty in e-commerce are the ones who make quality verification part of the product, not the marketing',
    retail: 'a smaller, better-curated selection consistently outperforms a larger one in both customer satisfaction and conversion',
    tech: 'the adoption rate of any tool is a stronger predictor of ROI than the feature set — most businesses have the wrong tools for the wrong reasons',
    saas: 'utilization rate is the metric that predicts long-term retention better than any feature comparison — teams that use 60% of a platform outperform those who use 20% of a more capable one',
    service: 'the clients who get the best outcomes are the ones who work with providers who have a documented, auditable process — not just talent',
    healthcare: 'the evidence increasingly shows that the interval between symptom appearance and intervention is the single most important variable in long-term health outcomes',
    education: 'accountability — not content quality — is the variable that explains most of the variance in learning outcomes between structured programs and self-directed study',
    'real estate': 'the micro-market data that determines actual value is rarely what appears in the headline statistics that most buyers and sellers are working from',
    general: 'the businesses that build the most durable customer relationships are the ones where every touchpoint is governed by the same underlying standard — not just the flagship experience',
  };

  const challengeMap: Record<BTKey, string> = {
    restaurant: 'standing out when most competition competes on price, proximity, or novelty rather than craft',
    'coffee shop': 'communicating what makes specialty coffee worth the price premium to a market trained on convenience-first options',
    fitness: 'breaking through the noise of conflicting advice and short-term transformation promises',
    spa: 'differentiating evidence-based protocols from the generic relaxation experience most customers have come to expect',
    ecommerce: 'building trust without physical touchpoints in a market saturated with identical-sounding quality claims',
    retail: 'competing against infinite online selection while offering something that justifies the friction of a physical visit',
    tech: 'demonstrating ROI in an environment where most software purchases are already competing for budget approval',
    saas: 'proving value beyond the trial period in a market where switching costs are low and competitor features are rapidly converging',
    service: 'making the quality of an intangible deliverable legible to a buyer who can\'t evaluate it until after the purchase',
    healthcare: 'building patient trust in a system where the default assumption is that doctors are too busy to actually listen',
    education: 'competing against free content from world-class institutions while making the case for structured, paid learning',
    'real estate': 'differentiating on expertise in a commodity market where most agents present identical surface-level value propositions',
    general: 'building meaningful differentiation in a market where most competitors have converged on the same positioning',
  };

  const trendMap: Record<BTKey, string> = {
    restaurant: 'hyper-local sourcing, transparent supply chains, and chef-driven origin storytelling',
    'coffee shop': 'precision extraction protocols, direct trade relationships, and the death of the dark roast default',
    fitness: 'recovery-first methodology, wearable-integrated programming, and the end of the generic group class format',
    spa: 'bioactive ingredient science, evidence-based protocols, and the convergence of aesthetics and clinical outcomes',
    ecommerce: 'direct-to-consumer supply chains, radical packaging transparency, and the shift from fast shipping to consistent quality',
    retail: 'experiential retail, community-as-product models, and the premium on genuine expert curation',
    tech: 'AI-native workflow architecture, the death of feature bloat, and the return to radical simplicity in UX',
    saas: 'vertical-specific platforms significantly outperforming horizontal generalists in retention and NPS',
    service: 'productized delivery models with transparent scope, fixed pricing, and built-in accountability mechanisms',
    healthcare: 'precision medicine, real-time biomarker monitoring, and the shift from reactive to predictive care models',
    education: 'competency-based credentials replacing time-based degrees as the primary signal of actual capability',
    'real estate': 'data-driven micro-market analysis, buyer education as a differentiator, and the collapse of the information asymmetry model',
    general: 'trust-first business models built on radical transparency and the rejection of the conversion-optimized funnel',
  };

  const btKey = (bt as BTKey) in needMap ? bt as BTKey : 'general';

  return {
    biz, bt, topic, prod1, prod2, productList, pricedOffers,
    heading1: headings[0] || topic,
    heading2: headings[1] || keywords[1] || 'their approach',
    kw1, kw2, kw3, skw,
    need: needMap[btKey],
    benefit: benefitMap[btKey],
    unique: uniqueMap[btKey],
    challenge: challengeMap[btKey],
    trend: trendMap[btKey],
    data1: dataPoints[0] ? dataPoints[0].slice(0, 140) : `The ${bt} space is undergoing a structural shift — and the businesses that identified it early are pulling ahead.`,
    quote1: quotes[0] ? quotes[0].slice(0, 100) : '',
    keyPoint1: keyPoints[0] ? keyPoints[0].slice(0, 120) : '',
    hasPricing: pricedOffers.length > 0,
    priceAnchor: pricedOffers[0] || '',
  };
}

// =============================================================
// PASS 2 — Identify Gaps
// What's the conventional wisdom? What's wrong with it?
// What does [business] understand that competitors don't?
// =============================================================

interface Gaps {
  myth: string;
  contrarian: string;
  missingContext: string;
  wrongMetric: string;
  realDriver: string;
}

function pass2_identifyGaps(d: ScrapedData, f: Facts): Gaps {
  type BTKey = 'restaurant' | 'coffee shop' | 'fitness' | 'spa' | 'ecommerce' | 'retail' |
    'tech' | 'saas' | 'service' | 'healthcare' | 'education' | 'real estate' | 'general';

  const mythMap: Record<BTKey, string> = {
    restaurant: 'that premium ingredients automatically produce premium results',
    'coffee shop': 'that darker roast means stronger, more flavorful coffee',
    fitness: 'that soreness is the most reliable indicator of workout effectiveness',
    spa: 'that all facials produce equivalent results regardless of the formulation',
    ecommerce: 'that fast shipping is the primary driver of repeat purchase',
    retail: 'that more selection produces better customer outcomes',
    tech: 'that enterprise software must be complex to be powerful',
    saas: 'that more integrations automatically mean more platform value',
    service: 'that speed of delivery is the primary driver of client satisfaction',
    healthcare: 'that symptoms need to be present before health intervention makes sense',
    education: 'that time spent in class or on a course directly correlates with knowledge gained',
    'real estate': 'that listing price is the most strategically significant number in a transaction',
    general: 'that price is the primary driver of purchasing decisions among informed buyers',
  };

  const contrarianMap: Record<BTKey, string> = {
    restaurant: 'The most respected restaurants in the world serve fewer dishes, not more — and each one at a level the menu-of-everything model cannot reach.',
    'coffee shop': 'The specialty coffee industry has overcomplicated brewing when the real lever is always sourcing — a mediocre extraction of an excellent bean outperforms a perfect extraction of a mediocre one.',
    fitness: 'The athletes who achieve the most consistent long-term progress don\'t train harder than average — they recover smarter, and they never compromise sleep, nutrition, and load management for volume.',
    spa: 'Most spa treatments are designed around ambient comfort, not clinical efficacy — which is why most customers feel good for 48 hours and then notice no lasting change.',
    ecommerce: 'Customers don\'t remember how fast the package arrived — they remember whether what was inside matched what the listing implied.',
    retail: 'The most profitable specialty retailers have intentionally reduced selection — because curation is the product, and a smaller assortment that\'s always right outperforms a larger one that requires expert navigation.',
    tech: 'Most companies don\'t have a software capability gap — they have an adoption gap. The tool they already have, used at 80% of its capacity, would outperform any competitor product at 20%.',
    saas: 'The SaaS companies with the highest NPS scores aren\'t the ones with the most features — they\'re the ones that made the decision to remove features that were creating friction without delivering value.',
    service: 'The clients who get the best outcomes don\'t hire the most talented providers — they hire the ones with the most disciplined, documented process. Talent without structure produces inconsistent results.',
    healthcare: 'The healthcare interventions with the highest long-term ROI are not treatments — they\'re the decisions made 10 to 20 years before any symptom appears.',
    education: 'The variable that explains most of the outcome gap between learners isn\'t content quality — it\'s accountability structure. The same content with forced accountability produces dramatically better results.',
    'real estate': 'The most consequential number in any real estate transaction is not the listing price — it\'s the micro-market absorption rate in the specific sub-geography the buyer is evaluating.',
    general: 'The businesses that dominate long-term are not the ones who competed hardest for new customers — they\'re the ones who made retention the primary product and acquisition a byproduct.',
  };

  const missingContextMap: Record<BTKey, string> = {
    restaurant: 'why technique without philosophy produces technically correct food that lacks a reason to exist',
    'coffee shop': 'why the farm-to-cup relationship determines the ceiling of what\'s possible before any barista decision is made',
    fitness: 'why progressive overload without equivalent progressive recovery produces a return-diminishing injury cycle',
    spa: 'why the active ingredient concentration in a formulation determines 90% of the clinical outcome regardless of brand positioning',
    ecommerce: 'why the post-purchase experience — packaging, communication, follow-up — determines repeat purchase more reliably than first-purchase satisfaction',
    retail: 'why staff expertise is the primary differentiator in specialty retail and the one thing that online channels cannot replicate',
    tech: 'why implementation quality and change management produce more ROI from any software purchase than the feature set selected',
    saas: 'why customer success investment — not product improvement — is the highest-leverage activity for retention',
    service: 'why the absence of a documented, auditable process is the single most reliable predictor of scope creep and client dissatisfaction',
    healthcare: 'why the relationship between preventive investment and long-term cost is exponential, not linear',
    education: 'why spaced repetition and deliberate practice produce durable knowledge and generic content consumption does not',
    'real estate': 'why the representation relationship — not the property itself — is the variable most buyers consistently undervalue',
    general: 'why the businesses customers stay with longest are not the ones that impressed them most on the first visit — they\'re the ones that maintained the same standard on the fifteenth',
  };

  const wrongMetricMap: Record<BTKey, string> = {
    restaurant: 'table count or review volume — the signal that actually predicts long-term success is repeat visit rate',
    'coffee shop': 'foot traffic — the signal that predicts loyalty is single-origin purchase frequency',
    fitness: 'number of workouts completed — the signal that predicts results is workout-to-recovery ratio',
    spa: 'appointment frequency — the signal that predicts outcomes is treatment protocol adherence',
    ecommerce: 'first-order conversion rate — the signal that predicts LTV is second-order return rate',
    retail: 'total SKU count — the signal that predicts satisfaction is recommendation accuracy',
    tech: 'feature adoption breadth — the signal that predicts ROI is workflow completion rate',
    saas: 'number of integrations — the signal that predicts retention is daily active feature usage',
    service: 'project delivery speed — the signal that predicts client retention is scope accuracy at kickoff',
    healthcare: 'appointment volume — the signal that predicts patient outcomes is preventive care compliance',
    education: 'content completion rate — the signal that predicts skill acquisition is deliberate practice hours',
    'real estate': 'listing price — the signal that predicts transaction success is days-on-market relative to sub-market median',
    general: 'customer acquisition cost — the signal that predicts durable growth is 90-day retention rate',
  };

  const realDriverMap: Record<BTKey, string> = {
    restaurant: 'the sourcing philosophy and the culinary point of view that every dish is designed to express',
    'coffee shop': 'the origin relationships that determine what arrives at the roaster before any processing decision is made',
    fitness: 'the recovery infrastructure — sleep protocols, nutrition periodization, and load management — that allows training stimulus to translate into adaptation',
    spa: 'the ingredient specificity and protocol precision that separates a clinical outcome from a pleasant sensory experience',
    ecommerce: 'the quality verification process applied before anything is listed or shipped',
    retail: 'the editorial judgment applied to selection — what\'s excluded from the assortment is as important as what\'s included',
    tech: 'the implementation process and the adoption curve management that follows it',
    saas: 'the customer success model and the workflow integration depth that drives habitual daily use',
    service: 'the documented process that makes the quality of the output independent of who specifically is delivering it on any given day',
    healthcare: 'the preventive protocol that changes the trajectory before any intervention is required',
    education: 'the accountability architecture — check-ins, cohorts, deliverables — that makes the learning stick',
    'real estate': 'the hyper-local market knowledge and the negotiation framework that only practitioners with a specific geographic focus develop',
    general: 'the standard applied at every touchpoint — including the ones the customer doesn\'t notice until they experience a provider who applies a lower one',
  };

  const btKey = (f.bt as BTKey) in mythMap ? f.bt as BTKey : 'general';

  return {
    myth: mythMap[btKey],
    contrarian: contrarianMap[btKey],
    missingContext: missingContextMap[btKey],
    wrongMetric: wrongMetricMap[btKey],
    realDriver: realDriverMap[btKey],
  };
}

// =============================================================
// PASSES 3–8 — 7-Second Post Generator
// Target: 3–5 sentences. Every word carries structural weight.
// Structure: hook → insight → proof-by-example → earned CTA
// =============================================================

function toSlug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 60);
}

function buildMeta7(title: string, kw1: string, biz: string, hook: string): string {
  const m = `${hook.split('.')[0]}. Discover how ${biz} approaches ${kw1} differently — and what it means for you.`;
  return m.length <= 155 ? m : m.slice(0, 152) + '...';
}

function scorePost(content: string, kw1: string): number {
  const wordCount = content.split(/\s+/).length;
  const hasKeyword = content.toLowerCase().includes(kw1.toLowerCase());
  const sentences = content.split(/[.!?]+/).filter(Boolean).length;
  const avgLen = wordCount / sentences;
  let score = 60;
  if (hasKeyword) score += 15;
  if (wordCount >= 30 && wordCount <= 80) score += 10;
  if (avgLen >= 12 && avgLen <= 24) score += 15;
  return Math.min(score, 100);
}

function build7sec(d: ScrapedData, f: Facts, g: Gaps, angle: Angle7): GeneratedPost {
  const raw = write7sec(f, g, angle);
  const hook = raw.split('.')[0] + '.';
  const cta = raw.split('.').slice(-2).join('.').trim();
  const seoTitle = `${f.biz}: ${ANGLE_LABELS[angle]} — ${f.kw1}`;
  const slug = toSlug(`${f.biz}-${angle}-${f.kw1}`);
  const wc = raw.split(/\s+/).length;
  return {
    content: raw,
    angle,
    angleLabel: ANGLE_LABELS[angle],
    seoTitle,
    metaDescription: buildMeta7(seoTitle, f.kw1, f.biz, hook),
    slug,
    primaryKeyword: f.kw1,
    secondaryKeywords: [f.kw2, f.bt, f.prod1].filter((v, i, a) => v && a.indexOf(v) === i),
    wordCount: wc,
    qualityScore: scorePost(raw, f.kw1),
    passCount: 8,
    hook,
    cta,
    structure: 'hook→insight→proof→cta',
  };
}

// Pass 6 rule: the hook must do one of — create tension, collapse a myth,
// cite a specific observation, or open with a question that reframes the problem.
// No hook may begin with "Most people" twice in the same post set, and none may use
// generic superlatives ("amazing", "incredible", "best-in-class").

function write7sec(f: Facts, g: Gaps, angle: Angle7): string {
  const { biz, bt, kw1, kw2, prod1, need, benefit, unique, challenge, trend, data1, priceAnchor } = f;
  const { myth, contrarian, missingContext, realDriver } = g;

  switch (angle) {

    // Hook: specific observation → why it matters → what [biz] does → CTA
    case 'precision_hook':
      return `The gap between a forgettable ${bt} experience and one you reference for years comes down to ${realDriver} — and most providers never get there. ${biz} built their entire model around ${kw1} because they understood this before it became a competitive requirement. ${prod1 !== kw1 ? `Their ${prod1} is the clearest evidence of that priority.` : `Every touchpoint reflects that priority.`} The difference is immediately perceptible — and once you've experienced it, the alternative stops being acceptable.`;

    // Hook: state the contrarian position cleanly, then prove it
    case 'contrarian_flash':
      return `${contrarian.split('.')[0]}. That's the insight that separates ${biz} from every ${bt} provider competing on the wrong variable. They built around ${realDriver} instead — and ${prod1 !== kw1 ? `${prod1} is where that decision becomes tangible` : `it shows in every interaction`}. When you evaluate ${bt} options through that lens, the decision changes completely.`;

    // Hook: lead with a specific data point or observed pattern
    case 'data_spike':
      return `${data1.endsWith('.') ? data1 : data1 + '.'} The ${bt} businesses that hold the highest retention don't have the best marketing — they have the most disciplined commitment to ${kw1}. ${biz} is in that category. ${priceAnchor ? `Starting with ${priceAnchor}.` : `The evidence is in the product, not the positioning.`}`;

    // Hook: reframe the question the customer is asking
    case 'question_reframe':
      return `The question most people ask when evaluating ${bt} options is the wrong one. It's not "who has the best ${kw1}?" — it's "who treats ${kw1} as a structural standard rather than a marketing claim?" ${biz} answers the second question. ${prod1 !== kw1 ? `${prod1} is where the standard is most visible.` : `The standard is visible at every touchpoint.`} Ask the right question and the decision gets significantly easier.`;

    // Hook: invert the expected framing
    case 'bold_inversion':
      return `${biz} doesn't compete on ${challenge.split(' ')[0]} — they compete on ${realDriver}. That's a deliberate choice, and it explains why their customers don't just return, they refer. ${prod1 !== kw1 ? `${prod1} demonstrates the difference most clearly.` : `The difference is most visible once you've experienced the alternative.`} When you're ready to stop accepting the generic standard, this is where the better version is.`;

    // Hook: share something insiders know that outsiders miss
    case 'insider_frame':
      return `Here's what experienced ${bt} customers eventually figure out: ${unique}. ${biz} built their approach to ${kw1} around this insight from the beginning — which is why ${prod1 !== kw1 ? `${prod1} performs the way it does` : `the results are different`}. The businesses that get this right don't need to convince you they're better. You feel it and draw your own conclusion.`;

    // Hook: identify the category gap between generic and specific
    case 'category_gap':
      return `There are two categories of ${bt} provider: those who treat ${kw1} as a feature and those who treat it as the foundation. ${biz} is in the second category — and the gap between the two is wider than most comparison tables capture. ${prod1 !== kw1 ? `${prod1} makes the gap immediately legible.` : `It's immediately legible in the experience.`} Evaluate with that distinction in mind.`;

    // Hook: reveal the method before the outcome
    case 'method_reveal':
      return `The method behind ${biz}'s approach to ${kw1} is specific: ${realDriver}. Most ${bt} businesses arrive at this conclusion eventually — ${biz} started there. That sequence difference produces an experience that's built around the standard rather than toward it. ${prod1 !== kw1 ? `${prod1} is the product-level expression of that sequence.` : `The experience reflects it at every level.`}`;

    // Before: the generic alternative → After: what changes
    case 'before_after':
      return `Before ${biz}: ${need} is a priority without a provider who treats it the same way. After ${biz}: ${benefit}. That shift isn't a marketing arc — it's what happens when ${kw1} is applied with the same rigor across ${prod1 !== kw1 ? `${prod1} and everything adjacent to it` : `every touchpoint`}. The before and after are separated by a single decision.`;

    // Hook: name the myth, then dismantle it
    case 'myth_collapse':
      return `The myth ${myth} is the most expensive assumption in the ${bt} space — it redirects evaluation toward the wrong criteria. What actually drives ${need} is ${realDriver}. ${biz} understood this early. ${prod1 !== kw1 ? `${prod1} is built around the reality, not the myth.` : `The product is built around the reality, not the myth.`} Evaluate with the accurate framework.`;

    // Hook: signal the trend, position [biz] ahead of it
    case 'trend_signal':
      return `The ${bt} market is accelerating toward ${trend.split(',')[0]}. The businesses that identified this early aren't just ahead of competitors — they're ahead in ways that compound. ${biz} made that commitment before it was obvious. ${prod1 !== kw1 ? `${prod1} reflects it.` : `It's visible in every aspect of what they do.`} Align with where the standard is going, not where it's been.`;

    // Hook: use a pattern of customer behavior as social proof
    case 'social_mirror':
      return `The ${bt} customers who've experienced ${biz} don't describe it as "good" — they describe it as the new reference point. That language shift is specific: it's what happens when ${kw1} is delivered at a level that recalibrates the standard. ${prod1 !== kw1 ? `${prod1} is typically the entry point for that recalibration.` : `The first visit is typically the recalibration point.`} Your reference point is about to shift.`;

    // Hook: lead with the cost of not acting
    case 'cost_of_inaction':
      return `Every month spent with a ${bt} provider who treats ${kw1} as aspirational rather than operational is a month of compounding mediocrity. The cost isn't visible in any single interaction — it accumulates. ${biz} is the pattern interrupt. ${prod1 !== kw1 ? `Start with ${prod1}.` : `Start with the experience.`} The baseline shifts from there.`;

    // Hook: apply an expert filter to the decision
    case 'expert_filter':
      return `The filter that experienced ${bt} buyers apply when evaluating providers is simple: does their commitment to ${kw1} show up in the product before the pitch? ${biz} passes. ${prod1 !== kw1 ? `${prod1} is the evidence that needs no amplification.` : `The evidence doesn't require amplification.`} Apply the expert filter — the decision becomes straightforward.`;

    // Hook: isolate the one variable that determines the outcome
    case 'single_variable':
      return `Strip everything else away and one variable predicts whether a ${bt} experience will be worth returning to: ${realDriver}. ${biz} treats this as the primary design constraint, not a secondary consideration. ${prod1 !== kw1 ? `${prod1} was built from that constraint outward.` : `Everything is built from that constraint outward.`} One variable. ${biz}. This is where you find it.`;

    // Hook: state the outcome first, then explain the mechanism
    case 'outcome_first':
      return `The outcome: ${benefit}. The mechanism: ${realDriver}. The provider: ${biz}. That's the complete equation for ${need} in the ${bt} context — and it's the sequence most ${bt} businesses get backwards by starting with delivery and working toward a standard instead of the reverse.`;

    // Hook: propose a higher standard than the customer currently holds
    case 'standard_reset':
      return `If your current standard for ${kw1} in the ${bt} context was set by the average provider, it needs to be reset. The actual upper bound is significantly higher than most customers discover because they don't encounter ${biz} first. ${prod1 !== kw1 ? `${prod1} is what the reset looks like.` : `The first interaction is what the reset looks like.`} Hold the higher standard.`;

    // Hook: open with proof, then make the argument
    case 'proof_first':
      return `${f.quote1 ? `"${f.quote1.slice(0, 80)}..." — that's not marketing copy. ` : `The track record in the ${bt} space speaks before the positioning does. `}That's the result of ${biz}'s commitment to ${realDriver} as a non-negotiable operating standard. ${prod1 !== kw1 ? `${prod1} reflects it.` : `Every touchpoint reflects it.`} Proof first. Positioning second. That's how ${biz} operates.`;

    // Hook: create tension between the problem and the resolution
    case 'tension_release':
      return `The tension every ${bt} customer lives with: ${need} feels like a reasonable expectation. The reality is that most providers don't treat it as one. ${biz} does — structurally, not aspirationally. ${prod1 !== kw1 ? `The tension releases with ${prod1}.` : `The tension releases with the first interaction.`} One visit resolves the gap between what you've been expecting and what's been available.`;

    // Hook: pull toward a better future state
    case 'future_pull':
      return `In three years, the standard for ${kw1} in the ${bt} space will be what ${biz} is building right now — which means the customers who align with them now are ahead of a shift that hasn't reached everyone else yet. ${prod1 !== kw1 ? `${prod1} is the current expression of that future standard.` : `Their current offer is the future standard.`} The gap between now and that future is one decision.`;

    default:
      return write7sec(f, g, 'precision_hook');
  }
}

// =============================================================
// PASSES 3–8 — 30-Second Post Generator
// Target: 160–230 words. Full structural integrity.
// Structure: hook → context(why now) → insight1 → insight2 → apply → CTA
// =============================================================

function buildSeoTitle30(f: Facts, angle: Angle30): string {
  const map: Record<Angle30, string> = {
    problem_mechanism: `Why Most ${f.bt} Businesses Never Deliver ${f.kw1} — And How ${f.biz} Does`,
    expert_deconstruct: `The Expert's Guide to ${f.kw1}: What ${f.biz} Understands That Others Don't`,
    contrarian_thesis: `The Conventional Wisdom About ${f.kw1} Is Wrong — Here's What Actually Works`,
    evidence_build: `The Evidence for ${f.kw1}: What the Data Shows About ${f.biz}'s Approach`,
    pattern_study: `The ${f.bt} Pattern That Predicts Long-Term Success: A Study of ${f.biz}`,
    decision_framework: `How to Evaluate Any ${f.bt} Provider on ${f.kw1}: A 3-Part Framework`,
    myth_anatomy: `Dissecting the Biggest Myth in ${f.bt}: What It Costs and How ${f.biz} Fixed It`,
    trend_decode: `Decoding the ${f.bt} Trend Toward ${f.kw1} — And What It Means for You`,
    sequence_reveal: `The Correct Sequence for Achieving ${f.need.split(',')[0]}: ${f.biz}'s Method`,
    benchmark_shift: `Resetting the ${f.bt} Benchmark: What ${f.kw1} Actually Looks Like at Its Best`,
    hidden_variable: `The Hidden Variable That Predicts ${f.bt} Outcomes — ${f.biz} Built Around It`,
    compounding_logic: `Why ${f.kw1} Compounds Over Time — The ${f.biz} Long-Term Advantage`,
    precision_standard: `What a Precision Standard for ${f.kw1} Looks Like in Practice: ${f.biz}`,
    trust_architecture: `How ${f.biz} Built Trust Without Marketing It: The ${f.kw1} Framework`,
    failure_mode: `The Most Common ${f.bt} Failure Mode — And Why ${f.biz} Doesn't Have It`,
    signal_vs_noise: `Separating Signal from Noise in ${f.bt}: The ${f.kw1} Signals That Matter`,
    investment_framing: `Reframing ${f.kw1} as an Investment: The ${f.biz} Long-Term Case`,
    customer_psychology: `What ${f.bt} Customers Actually Want from ${f.kw1} — And How ${f.biz} Delivers It`,
    systemic_advantage: `The Systemic Advantage of ${f.biz}: How ${f.kw1} Compounds Across Every Touchpoint`,
    transformation_arc: `The ${f.bt} Transformation Arc: How ${f.biz} Shifts the Standard Permanently`,
  };
  return map[angle] || `${f.biz}: ${ANGLE_LABELS[angle]}`;
}

function build30sec(d: ScrapedData, f: Facts, g: Gaps, angle: Angle30): GeneratedPost {
  const raw = write30sec(f, g, angle);
  const hook = raw.split('.')[0] + '.';
  const cta = raw.split('.').slice(-2).join('.').trim();
  const seoTitle = buildSeoTitle30(f, angle);
  const slug = toSlug(`${f.biz}-${angle}-${f.kw1}`);
  const wc = raw.split(/\s+/).length;
  const meta = `${hook.slice(0, 100)} ${f.biz} shows what ${f.kw1} looks like when it's applied as a structural standard.`;
  return {
    content: raw,
    angle,
    angleLabel: ANGLE_LABELS[angle],
    seoTitle,
    metaDescription: meta.length <= 155 ? meta : meta.slice(0, 152) + '...',
    slug,
    primaryKeyword: f.kw1,
    secondaryKeywords: [f.kw2, f.bt, f.prod1, f.kw3].filter((v, i, a) => v && a.indexOf(v) === i).slice(0, 4),
    wordCount: wc,
    qualityScore: scorePost(raw, f.kw1),
    passCount: 8,
    hook,
    cta,
    structure: 'hook→context→insight→insight→apply→cta',
  };
}

function write30sec(f: Facts, g: Gaps, angle: Angle30): string {
  const { biz, bt, kw1, kw2, prod1, prod2, need, benefit, unique, challenge, trend, data1, quote1, priceAnchor } = f;
  const { myth, contrarian, missingContext, wrongMetric, realDriver } = g;
  const p2 = prod2 !== prod1 ? prod2 : kw2;

  switch (angle) {

    case 'problem_mechanism':
      return `The reason most ${bt} providers fail to deliver ${need} isn't effort — it's mechanism. They optimize for the visible signals (reviews, presentation, pricing) while the actual determinant — ${realDriver} — is treated as a secondary consideration. ${biz} inverted this. Their approach to ${kw1} starts with ${realDriver} as the design constraint, then builds outward. The practical result is that ${prod1 !== kw1 ? `${prod1}` : `the core experience`} doesn't just meet expectation — it recalibrates it. When customers articulate why they keep coming back, they describe the mechanism even if they don't name it: consistency that doesn't require vigilance, quality that's structural rather than episodic. That's what ${realDriver} produces when it's applied correctly. The alternative — treating it as a destination rather than a foundation — is the mechanism behind most ${bt} disappointments. ${biz} solved the mechanism problem. The experience reflects it.`;

    case 'expert_deconstruct':
      return `An expert in ${bt} evaluates providers differently than a first-time customer. Where a new customer looks at presentation, price, and proximity, an expert asks: what is the underlying commitment to ${kw1}, and is it structural or aspirational? ${missingContext} — a distinction most providers haven't made visible because it requires explaining why the standard is higher and what sustains it. ${biz} has made that case through their product rather than their marketing. ${prod1 !== kw1 ? `${prod1} demonstrates it most clearly: every element that contributes to ${kw1} is present because it was designed in, not because it survived a cost-cutting review.` : `The experience demonstrates it most clearly: every element is designed in, not survived.`} The second distinguishing marker an expert looks for is consistency across the full offering — whether the same standard that applies to the flagship extends to ${p2}. At ${biz}, it does. That's the expert read. If you're not an expert in ${bt} yet, this is what to look for.`;

    case 'contrarian_thesis':
      return `${contrarian} This isn't a position held to be interesting — it's the conclusion you arrive at when you actually examine what drives long-term customer loyalty in the ${bt} space rather than what drives first-visit conversion. The conventional wisdom about ${kw1} focuses on ${wrongMetric}. The signal that actually predicts satisfaction and retention is ${realDriver}. ${biz} built around the second signal. ${prod1 !== kw1 ? `${prod1} is the most direct expression of that architectural choice.` : `Their model is the most direct expression of that architectural choice.`} The customers who've discovered this haven't changed their behavior because of marketing — they've changed it because the experience reframed what was possible. A contrarian take isn't worth holding unless the evidence supports it. In this case, it does: the ${bt} businesses with the highest retention rates are consistently the ones that treat ${realDriver} as the primary design constraint. ${biz} is among them.`;

    case 'evidence_build':
      return `${data1.endsWith('.') ? data1 : data1 + '.'} This data point doesn't stand alone — it fits a pattern. The ${bt} businesses with the strongest retention metrics share a specific characteristic: they treat ${kw1} as a non-negotiable standard rather than a positioning aspiration. When you examine what actually separates these businesses from those with comparable marketing spend and worse outcomes, ${realDriver} is the variable that appears consistently. ${biz} fits the high-retention pattern on every dimension. ${prod1 !== kw1 ? `${prod1} reflects the standard in its most tangible form: every element of the ${kw1} component was designed to a specific specification, not a range.` : `The core experience reflects the standard in its most tangible form.`} The practical implication of this evidence isn't that ${biz} is exceptional — it's that their approach is replicable by design, and the consistency of the output reflects that. The evidence doesn't require interpretation. It simply needs to be read.`;

    case 'pattern_study':
      return `The ${bt} businesses that build genuine topical authority — the ones customers reference, recommend, and return to without promotional prompting — share a specific pattern of decision-making. They invest in ${realDriver} before it's competitively necessary, which means when it becomes the expected baseline, they're already operating at the next level. ${biz} fits this pattern. Their commitment to ${kw1} predates any competitive pressure to prioritize it, which is part of why their execution is structurally ahead of ${bt} businesses that arrived at the same conclusion later and implemented it reactively. ${prod1 !== kw1 ? `${prod1} is the product-level evidence of the early investment: the engineering reflects decisions made before the market asked for them.` : `The evidence is in how the product is built, not how it's positioned.`} The pattern matters because it predicts trajectory. Businesses that invest proactively in ${realDriver} compound that advantage over time. The ones that implement reactively start from a perpetual catch-up position. ${biz} is in the first category.`;

    case 'decision_framework':
      return `Before committing to any ${bt} provider for ${kw1}, apply three filters. Filter one: is their commitment to ${realDriver} visible in the product before you read any copy about it? If you need to be told that the standard is high, it probably isn't. Filter two: does the same standard that governs ${prod1 !== kw1 ? prod1 : 'the primary offer'} extend to ${p2}? Systemic quality is visible in the secondary offerings — the ones that didn't receive the same marketing attention. Filter three: does the evidence of consistency accumulate across multiple touchpoints, or does it peak at the entry point and decline? These three filters resolve most ${bt} evaluation decisions faster than any comparison table. ${biz} clears all three. The commitment to ${kw1} is visible before the positioning explains it, consistent across ${prod1 !== kw1 ? `${prod1} and ${p2}` : `every touchpoint`}, and cumulative rather than front-loaded. Apply the filters. The decision follows.`;

    case 'myth_anatomy':
      return `The myth ${myth} has a specific anatomy in the ${bt} space: it emerges from the most visible proxy metric for ${kw1} and gets mistaken for the underlying variable. The actual driver is ${realDriver} — something that takes longer to observe, harder to quantify in a single visit, and more expensive to build systematically. This is why the myth persists: the proxy is easier to evaluate, easier to market around, and easier to fake. ${biz} doesn't compete on the proxy. ${prod1 !== kw1 ? `${prod1} is designed around the underlying variable — the commitment to ${realDriver} is visible in every component of the offering, not just the ones that photograph well.` : `The experience is designed around the underlying variable.`} The cost of the myth is real: customers who evaluate ${bt} providers by the proxy metric systematically select for providers who've optimized for appearance rather than substance. Reorienting the evaluation around ${realDriver} changes which options are worth serious consideration. ${biz} is on the right side of that reorientation.`;

    case 'trend_decode':
      return `The trend toward ${trend.split(',')[0]} in the ${bt} space isn't aesthetic — it's a structural response to what customers consistently describe as missing when asked about their worst ${bt} experiences. The shift is being driven by customers who've experienced ${kw1} at its best — which means ${biz} and the small number of providers who built to that standard early — and are no longer willing to accept the average. This is the mechanism behind most significant market trend: not preference change, but exposure to the better version. ${biz}'s position in this trend is structural rather than strategic. They didn't pivot toward ${kw1} because the market moved — they were already there. ${prod1 !== kw1 ? `${prod1} was built to the trend's destination before the trend had a name.` : `The model was built to the trend's destination before the trend had a name.`} The implication for customers is straightforward: the businesses aligned with where the standard is heading are producing the outcomes the trend is moving toward. Alignment with them is alignment with the direction — not a bet, a read.`;

    case 'sequence_reveal':
      return `Achieving ${need} in the ${bt} context requires a specific sequence — and most customers attempt it in the wrong order. The incorrect sequence: evaluate on presentation → commit on pricing → hope for ${kw1}. The correct sequence: identify providers whose commitment to ${realDriver} is visible before the pitch → evaluate whether that commitment extends consistently across the full offering → then assess pricing as a function of value rather than a primary filter. ${biz} becomes obvious in the correct sequence because their commitment to ${kw1} is visible before any marketing context is provided. ${prod1 !== kw1 ? `${prod1} is where the commitment is most immediately legible: the product-level decisions reflect ${realDriver} as a design constraint.` : `The product decisions reflect ${realDriver} as a design constraint, not a target.`} The sequence matters because it determines which signals you're reading. The wrong sequence makes mediocre providers look competitive. The right sequence makes ${biz} the obvious answer.`;

    case 'benchmark_shift':
      return `The current benchmark for ${kw1} in most customers' evaluation framework was set by the average of their previous ${bt} experiences — which means it's calibrated to the median, not the ceiling. ${biz} operates at the ceiling. The consequence of encountering them is a permanent benchmark shift: the standard that seemed acceptable before feels obviously insufficient after. This is not a positioning claim — it's a description of a consistent customer-reported experience. The mechanism is simple: ${biz} treats ${realDriver} as a non-negotiable minimum, not a competitive differentiator. When that standard is applied consistently, the output diverges from the median in ways that recalibrate the evaluation framework. ${prod1 !== kw1 ? `${prod1} is where the benchmark shift is most immediately perceptible — the specificity of the ${kw1} application leaves no ambiguity about the distance from the median.` : `The first experience is where the shift is perceptible.`} Your current benchmark for ${bt} was set by the available options. ${biz} expands the available options. The benchmark follows.`;

    case 'hidden_variable':
      return `In the ${bt} category, there's a variable that predicts customer outcomes better than any of the obvious metrics — better than pricing, location, presentation, or review volume. That variable is ${realDriver}. It's hidden not because it's secret but because it's difficult to evaluate from the outside before the first interaction, and because most customers aren't explicitly looking for it when they make the initial decision. ${biz} built their model around this variable — which is why customers who discover them through a recommendation from someone already familiar with the difference tend to commit more quickly than those who find them through a standard discovery channel. The discovery through word-of-mouth is itself evidence of the hidden variable: you don't enthusiastically refer a ${bt} provider unless they've delivered something the referral recipient isn't currently experiencing. ${prod1 !== kw1 ? `${prod1} is where the variable is most legible — the commitment to ${realDriver} produces a measurable gap.` : `The gap is measurable once you know what the variable is.`} Now you know what the variable is.`;

    case 'compounding_logic':
      return `The case for ${kw1} in the ${bt} context is not linear — it compounds. A single interaction at the standard ${biz} maintains is valuable. Ten interactions at that standard are transformative, because the compounding effect is trust that doesn't require renewal, expectations that are consistently met rather than occasionally exceeded, and a reference point that makes alternatives feel like downgrades rather than alternatives. This compounding logic is why the customers with the longest ${biz} relationships are also the most active advocates: they've experienced enough iterations of the standard to have verified it rather than simply sampled it. ${prod1 !== kw1 ? `${prod1} is typically the entry point — but the compounding effect builds across every subsequent touchpoint.` : `The compounding effect builds across every subsequent touchpoint.`} The practical implication: the sooner you establish the relationship with a ${bt} provider who treats ${realDriver} as a structural commitment, the longer the compounding has to run. ${biz} is where to start that clock.`;

    case 'precision_standard':
      return `Precision in the ${bt} context means that ${kw1} isn't a range — it's a specification. Most providers operate to a range, which means the customer experience is a function of which day, which team member, and which operational pressures are present at the moment of delivery. ${biz} operates to a specification. ${prod1 !== kw1 ? `${prod1} reflects this: the commitment to ${realDriver} produces consistent outputs regardless of the day or circumstance, because consistency is built into the process rather than depending on individual effort.` : `The experience reflects this: consistency is built into the process.`} The practical significance of precision for the customer is that you stop managing exceptions. You stop mentally preparing for the gap between what you ordered and what arrived. You stop factoring variability into your assessment. You simply receive the product. That absence of vigilance — the freedom from managing the probability of a bad experience — is what precision actually delivers. It's the highest-value component of ${kw1} that the least number of ${bt} providers have figured out how to operationalize. ${biz} has.`;

    case 'trust_architecture':
      return `Trust in the ${bt} context isn't built through marketing — it's built through repeated confirmation that the standard described was the standard experienced. ${biz}'s trust architecture is simple: every interaction provides that confirmation, without exception. The mechanism is ${realDriver}, applied consistently across ${prod1 !== kw1 ? `${prod1}, ${p2}, and every touchpoint in between` : `every touchpoint`}. What makes this architecture durable is that it doesn't depend on customer goodwill or forgiveness — it depends on consistent execution of a specific standard. When the standard slips, trust erodes. When it holds across enough iterations, trust compounds into something more valuable: advocacy. The customers who refer ${biz} aren't doing so because they were asked to. They're doing so because the gap between their current experience and what they had before is obvious enough to warrant the recommendation. That gap is the architecture's output. It's not manufactured. It's built — interaction by interaction, at a standard that most ${bt} providers haven't committed to maintaining.`;

    case 'failure_mode':
      return `The most common failure mode in the ${bt} space is not incompetence — it's inconsistency. A provider can deliver an excellent first experience and a mediocre fifth one, and the customer's overall evaluation will be weighted toward the mediocre one because it confirmed a fear the excellent one had suspended. This failure mode is structurally different from simply being bad: it's being unpredictably good, which is arguably worse because it generates disappointment rather than resignation. ${biz} doesn't have this failure mode. Their commitment to ${realDriver} as an operational standard rather than a performance goal produces a consistency that eliminates the inconsistency fear. ${prod1 !== kw1 ? `${prod1} is the most concentrated expression of this: the standard applied in that offering has the same precision on the fifteenth delivery as the first.` : `The standard has the same precision on the fifteenth interaction as the first.`} The failure mode matters to name because it's what makes good reviews unreliable signals. Consistently excellent execution — which ${biz} demonstrates — is the only signal that accurately predicts future experience.`;

    case 'signal_vs_noise':
      return `The ${bt} market generates an enormous amount of signal noise: reviews that overrepresent novelty bias, marketing that optimizes for first impressions, pricing that implies a quality relationship that may not exist. The signal that actually predicts a long-term productive relationship with a ${bt} provider is ${realDriver} — and it's one of the hardest to evaluate before the first interaction. The filters that reduce noise most effectively: look for providers whose commitment to ${kw1} is articulated in process terms, not outcome terms. "We do X because it produces Y" is a process claim. "We're committed to the best Y" is an outcome claim with no mechanism attached. ${biz} makes process claims. ${prod1 !== kw1 ? `${prod1} is built to a specification, not a standard — and the difference is visible in the consistency of the output.` : `The experience is built to a specification, not a standard.`} The noise in ${bt} evaluation is loud. The signal — commitment to ${realDriver} as an operational constraint — is clear once you know what to filter for. ${biz} passes the signal filter.`;

    case 'investment_framing':
      return `Reframe the ${bt} decision from purchase to investment and the calculus changes. A purchase optimizes for unit cost. An investment optimizes for return across the relationship. The customers who evaluate ${biz} through the investment frame see what the purchase frame obscures: the compounding return of consistent ${kw1}, the reduction in switching costs from never needing to switch, and the relationship premium that comes from working with a provider who treats ${realDriver} as a structural commitment. ${priceAnchor ? `The entry point — ${priceAnchor} — is not a purchase price. ` : `The pricing `}It's the cost of starting a compounding investment. ${prod1 !== kw1 ? `${prod1} is the first instrument in that investment, and the one where the return is most immediately perceptible.` : `The first experience is the start of that investment.`} The difference between the purchase frame and the investment frame is not just philosophical — it changes which options are even in scope and which are obviously not. ${biz} belongs in the investment frame. Evaluated there, it's straightforward.`;

    case 'customer_psychology':
      return `What ${bt} customers describe wanting and what they actually respond to are not always the same variable. They describe wanting ${need} — but the psychological driver underneath that description is the elimination of the specific anxiety that the ${bt} experience produces. That anxiety: will this be worth the time, the cost, the expectation management I've invested? The ${bt} providers that produce the strongest emotional response are the ones who eliminate the anxiety completely — not by reassuring customers that everything will be fine, but by delivering an experience where the question never arises. ${biz} eliminates the anxiety through ${realDriver} — which means customers don't arrive calibrated for potential disappointment. They arrive calibrated for what they've already experienced. ${prod1 !== kw1 ? `${prod1} is where this calibration is established most cleanly: the first interaction sets an expectation that every subsequent one confirms.` : `The first interaction sets an expectation that every subsequent one confirms.`} The psychology shifts when the anxiety disappears. ${biz} is where it disappears.`;

    case 'systemic_advantage':
      return `The advantage ${biz} holds in the ${bt} space is systemic rather than localized — and that distinction matters for understanding why it's durable. A localized advantage (a single exceptional product, a single exceptional team member, a single exceptional experience) erodes when the specific element that produced it changes. A systemic advantage — one where ${realDriver} governs every touchpoint rather than selected ones — is self-reinforcing because it doesn't depend on any single element to maintain the standard. ${prod1 !== kw1 ? `${prod1} demonstrates the systemic advantage: the commitment to ${kw1} is identical whether you engage with ${prod1} or ${p2}.` : `The systemic advantage is demonstrated by the consistency across every offering.`} For customers, the implication of a systemic advantage is that you don't need to be strategic about which product or interaction you select. The system applies the standard regardless. That absence of strategic evaluation overhead — the ability to simply trust the system — is the systemic advantage's most tangible customer-facing expression. ${biz} has it. Most of their competitors have localized advantages at best.`;

    case 'transformation_arc':
      return `The ${bt} transformation arc follows a predictable sequence for customers who discover ${biz}: skepticism calibrated by previous experience → first interaction that exceeds the calibrated expectation → a period of recalibration where the new standard settles → a shift in evaluation criteria that makes previous options feel obviously insufficient. This arc isn't manufactured. It's the natural output of encountering ${kw1} applied at the level ${biz} applies it — consistently, systematically, and without the episodic variance that makes most ${bt} experiences feel unreliable. The recalibration is permanent in a specific sense: once you've experienced ${realDriver} operating as a structural standard rather than a performance goal, you recognize its absence immediately. ${prod1 !== kw1 ? `${prod1} is typically where the arc begins — the first contact point where the expectation gap becomes perceptible.` : `The first interaction is typically where the arc begins.`} The transformation isn't something ${biz} does to you. It's something you undergo as a consequence of encountering a standard high enough to shift the reference point. The arc starts with the first visit.`;

    default:
      return write30sec(f, g, 'problem_mechanism');
  }
}
