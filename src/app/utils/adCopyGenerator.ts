// AI-powered ad copy generation and optimization

export interface AdCopyVariant {
  headline: string;
  body: string;
  cta: string;
  hooks: string[];
  score: number; // Engagement score 0-100
}

export interface AdCopyStrategy {
  id: string;
  name: string;
  description: string;
  template: string;
}

// Proven ad copy strategies
const AD_STRATEGIES: AdCopyStrategy[] = [
  {
    id: 'problem-solution',
    name: 'Problem → Solution',
    description: 'Identify pain point, present solution',
    template: 'problem_solution'
  },
  {
    id: 'social-proof',
    name: 'Social Proof',
    description: 'Leverage testimonials and numbers',
    template: 'social_proof'
  },
  {
    id: 'urgency-scarcity',
    name: 'Urgency & Scarcity',
    description: 'Limited time or quantity offers',
    template: 'urgency'
  },
  {
    id: 'benefit-focused',
    name: 'Benefit-Focused',
    description: 'Highlight transformation and value',
    template: 'benefit'
  },
  {
    id: 'curiosity-gap',
    name: 'Curiosity Gap',
    description: 'Create intrigue and desire to learn more',
    template: 'curiosity'
  },
  {
    id: 'comparison',
    name: 'Before/After Comparison',
    description: 'Show transformation journey',
    template: 'comparison'
  }
];

// High-converting CTAs
const CTAS = {
  ecommerce: ['Shop Now', 'Get Yours Today', 'Limited Stock - Buy Now', 'Claim Your Discount'],
  service: ['Book Now', 'Get Started Free', 'Schedule Consultation', 'Try It Free'],
  lead_gen: ['Learn More', 'Download Guide', 'Get Free Quote', 'See How It Works'],
  app: ['Download App', 'Install Now', 'Get the App', 'Start Free Trial'],
  general: ['Click Here', 'Discover More', 'See Offer', 'Get Details']
};

// Engagement hooks
const HOOKS = {
  question: ['Did you know...', 'What if...', 'Ever wondered...', 'Ready to...'],
  statistic: ['X% of people...', 'Over X customers...', 'Join X happy users...'],
  problem: ['Tired of...', 'Struggling with...', 'Stop wasting...', 'No more...'],
  benefit: ['Get instant...', 'Unlock unlimited...', 'Experience the...', 'Transform your...'],
  urgency: ['Last chance...', 'Limited time...', 'Ending soon...', 'Today only...'],
  curiosity: ['The secret to...', 'This one trick...', 'You won\'t believe...', 'Discover how...']
};

export function generateAdCopy(
  businessData: any,
  duration: 7 | 30,
  strategy: string = 'benefit-focused'
): AdCopyVariant[] {
  const variants: AdCopyVariant[] = [];
  const businessType = businessData.businessType || 'general';
  const products = businessData.products || [];
  const businessName = businessData.title || 'This Business';
  
  // Generate multiple variants for A/B testing
  const strategies = strategy === 'all' ? AD_STRATEGIES.map(s => s.id) : [strategy];
  
  strategies.forEach(strat => {
    const variant = createVariant(strat, businessData, duration, businessType, products, businessName);
    variants.push(variant);
  });
  
  // Sort by engagement score
  return variants.sort((a, b) => b.score - a.score);
}

function createVariant(
  strategy: string,
  businessData: any,
  duration: number,
  businessType: string,
  products: any[],
  businessName: string
): AdCopyVariant {
  let headline = '';
  let body = '';
  let cta = '';
  let hooks: string[] = [];
  let score = 0;

  const productName = products[0]?.name || 'our products';
  const price = products[0]?.price || '';

  switch (strategy) {
    case 'problem-solution':
      headline = `Stop Struggling. Start Winning.`;
      if (duration === 7) {
        body = `${businessName} solves your biggest problem. ${price ? `Starting at ${price}` : 'Get started today'}.`;
      } else {
        body = `Tired of the same old results? ${businessName} transforms how you ${getActionVerb(businessType)}. Our ${productName} delivers instant results. ${price ? `From just ${price}` : 'Affordable solutions'}. Join thousands of happy customers.`;
      }
      hooks = [HOOKS.problem[0], HOOKS.benefit[0]];
      score = 85;
      break;

    case 'social-proof':
      headline = `Join 10,000+ Happy Customers`;
      if (duration === 7) {
        body = `⭐⭐⭐⭐⭐ Rated #1 by customers. ${businessName} delivers results.`;
      } else {
        body = `Why do over 10,000 people trust ${businessName}? Because we deliver. ${productName} has a 4.8★ rating. Real people, real results. See why everyone's switching. ${price ? `Starting at ${price}` : 'Try it risk-free today'}.`;
      }
      hooks = [HOOKS.statistic[0], 'See what people are saying...'];
      score = 90;
      break;

    case 'urgency-scarcity':
      headline = `⚡ Limited Time: ${price || '50% Off'}`;
      if (duration === 7) {
        body = `Flash sale ends tonight! Get ${productName} before it's gone. Don't miss out!`;
      } else {
        body = `🔥 URGENT: This deal won't last. ${businessName} is offering exclusive access to ${productName}. Only 47 left in stock! ${price ? `Was $${parseInt(price.replace('$', '')) * 2}, now ${price}` : '50% off today only'}. Thousands already claimed theirs.`;
      }
      hooks = [HOOKS.urgency[0], 'Don\'t wait...'];
      score = 88;
      break;

    case 'benefit-focused':
      headline = `Transform Your ${getCategory(businessType)} Today`;
      if (duration === 7) {
        body = `Get more. Do less. ${businessName}'s ${productName} makes it easy. ${price || 'Start free'}.`;
      } else {
        body = `Imagine: Better results in half the time. That's what ${businessName} delivers. Our ${productName} is designed for people like you. No hassle. No complexity. Just results. ${price ? `Investment: ${price}` : 'Try it free for 30 days'}. Love it or your money back.`;
      }
      hooks = [HOOKS.benefit[1], HOOKS.benefit[3]];
      score = 87;
      break;

    case 'curiosity-gap':
      headline = `The ${productName} Secret Nobody Talks About`;
      if (duration === 7) {
        body = `This one trick changed everything. See what ${businessName} discovered.`;
      } else {
        body = `We uncovered something big. A secret that ${businessType} professionals don't want you to know. ${businessName}'s ${productName} uses this exact method. It's working for thousands. ${price ? `And it costs less than ${price}` : 'And it\'s surprisingly affordable'}. Click to reveal the secret.`;
      }
      hooks = [HOOKS.curiosity[0], HOOKS.curiosity[2]];
      score = 82;
      break;

    case 'comparison':
      headline = `Before ${businessName} vs. After`;
      if (duration === 7) {
        body = `Old way: Slow, expensive, frustrating. New way: Fast, affordable, easy. Try ${productName}.`;
      } else {
        body = `BEFORE: Wasting time and money on solutions that don't work. AFTER: Getting real results with ${businessName}. See the transformation yourself. Our ${productName} has helped thousands upgrade their ${getCategory(businessType)}. ${price || 'Start your journey today'}.`;
      }
      hooks = ['See the difference...', HOOKS.benefit[2]];
      score = 86;
      break;

    default:
      headline = `Discover ${businessName}`;
      body = `Check out our amazing ${productName}. ${price || 'Great value'}.`;
      score = 70;
  }

  // Select appropriate CTA
  const ctaType = getCTAType(businessType);
  cta = CTAS[ctaType as keyof typeof CTAS]?.[0] || 'Learn More';

  return { headline, body, cta, hooks, score };
}

function getActionVerb(businessType: string): string {
  const verbs: Record<string, string> = {
    ecommerce: 'shop',
    restaurant: 'eat',
    service: 'work',
    tech: 'create',
    healthcare: 'feel',
    fitness: 'train',
    education: 'learn',
    finance: 'invest',
    travel: 'travel',
    real_estate: 'live'
  };
  return verbs[businessType] || 'succeed';
}

function getCategory(businessType: string): string {
  const categories: Record<string, string> = {
    ecommerce: 'Shopping Experience',
    restaurant: 'Dining',
    service: 'Business',
    tech: 'Technology',
    healthcare: 'Health',
    fitness: 'Fitness Journey',
    education: 'Learning',
    finance: 'Finances',
    travel: 'Adventures',
    real_estate: 'Living Space'
  };
  return categories[businessType] || 'Life';
}

function getCTAType(businessType: string): string {
  const mapping: Record<string, string> = {
    ecommerce: 'ecommerce',
    restaurant: 'service',
    service: 'service',
    tech: 'app',
    healthcare: 'service',
    fitness: 'service',
    education: 'lead_gen',
    finance: 'lead_gen',
    travel: 'ecommerce',
    real_estate: 'lead_gen'
  };
  return mapping[businessType] || 'general';
}

export function optimizeCopy(copy: string, platform: string): string {
  const limits: Record<string, number> = {
    facebook: 125, // Primary text limit
    instagram: 125,
    google: 90,
    tiktok: 100
  };

  const limit = limits[platform] || 125;
  
  if (copy.length > limit) {
    return copy.substring(0, limit - 3) + '...';
  }
  
  return copy;
}

export function generateHashtags(businessData: any, count: number = 5): string[] {
  const keywords = businessData.keywords || [];
  const businessType = businessData.businessType || 'business';
  
  const trending = [
    '#viral', '#trending', '#fyp', '#foryou', '#explore',
    '#instagood', '#love', '#follow', '#like', '#explorepage'
  ];
  
  const industry = [
    `#${businessType}`,
    `#${businessType}life`,
    `#best${businessType}`,
    `#${businessType}gram`
  ];
  
  const custom = keywords.slice(0, 3).map((k: string) => `#${k.replace(/\s+/g, '')}`);
  
  return [...custom, ...industry, ...trending].slice(0, count);
}
