// =============================================================================
// SUBSCRIPTION TIERS — Stripe Integration & Feature Gating
// =============================================================================

export type SubscriptionTier = 'free' | 'pro' | 'enterprise';

export interface SubscriptionPlan {
  id: SubscriptionTier;
  name: string;
  price: number;
  billingPeriod: 'monthly' | 'annual';
  stripePriceId?: string;
  features: SubscriptionFeature[];
  limits: SubscriptionLimits;
  popular?: boolean;
}

export interface SubscriptionFeature {
  name: string;
  included: boolean;
  limit?: number;
  description?: string;
}

export interface SubscriptionLimits {
  maxBlogPosts: number;
  maxScheduledPosts: number;
  maxTeamMembers: number;
  maxAIGenerationsPerMonth: number;
  maxImageGenerationsPerMonth: number;
  multiPlatformPublishing: boolean;
  advancedAnalytics: boolean;
  whiteLabel: boolean;
  apiAccess: boolean;
  prioritySupport: boolean;
  customBranding: boolean;
}

export interface UserSubscription {
  tier: SubscriptionTier;
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  cancelAtPeriodEnd: boolean;
  usage: {
    blogPostsCreated: number;
    scheduledPosts: number;
    aiGenerations: number;
    imageGenerations: number;
  };
}

/**
 * Subscription plan definitions
 */
export const SUBSCRIPTION_PLANS: Record<SubscriptionTier, SubscriptionPlan> = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    billingPeriod: 'monthly',
    features: [
      { name: 'Up to 10 blog posts', included: true, limit: 10 },
      { name: 'Basic AI content generation', included: true },
      { name: 'Single platform publishing', included: true },
      { name: '5 AI generations/month', included: true, limit: 5 },
      { name: 'Community support', included: true },
      { name: 'Basic SEO tools', included: true },
      { name: 'Advanced analytics', included: false },
      { name: 'Team collaboration', included: false },
      { name: 'White-label branding', included: false },
      { name: 'API access', included: false },
    ],
    limits: {
      maxBlogPosts: 10,
      maxScheduledPosts: 5,
      maxTeamMembers: 1,
      maxAIGenerationsPerMonth: 5,
      maxImageGenerationsPerMonth: 2,
      multiPlatformPublishing: false,
      advancedAnalytics: false,
      whiteLabel: false,
      apiAccess: false,
      prioritySupport: false,
      customBranding: false,
    },
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 29,
    billingPeriod: 'monthly',
    stripePriceId: 'price_pro_monthly',
    popular: true,
    features: [
      { name: 'Unlimited blog posts', included: true },
      { name: 'Advanced AI content generation', included: true },
      { name: 'Multi-platform publishing', included: true },
      { name: '100 AI generations/month', included: true, limit: 100 },
      { name: '50 AI image generations/month', included: true, limit: 50 },
      { name: 'Advanced SEO & analytics', included: true },
      { name: 'Content calendar', included: true },
      { name: 'Email newsletter builder', included: true },
      { name: 'Priority support', included: true },
      { name: 'Team collaboration (up to 5)', included: true, limit: 5 },
      { name: 'White-label branding', included: false },
      { name: 'API access', included: false },
    ],
    limits: {
      maxBlogPosts: -1, // Unlimited
      maxScheduledPosts: 100,
      maxTeamMembers: 5,
      maxAIGenerationsPerMonth: 100,
      maxImageGenerationsPerMonth: 50,
      multiPlatformPublishing: true,
      advancedAnalytics: true,
      whiteLabel: false,
      apiAccess: false,
      prioritySupport: true,
      customBranding: true,
    },
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    price: 99,
    billingPeriod: 'monthly',
    stripePriceId: 'price_enterprise_monthly',
    features: [
      { name: 'Unlimited everything', included: true },
      { name: 'Unlimited AI generations', included: true },
      { name: 'Unlimited AI images', included: true },
      { name: 'Multi-platform publishing', included: true },
      { name: 'Advanced analytics & reporting', included: true },
      { name: 'White-label branding', included: true },
      { name: 'Custom domain', included: true },
      { name: 'API access with SDK', included: true },
      { name: 'Dedicated account manager', included: true },
      { name: 'Unlimited team members', included: true },
      { name: 'SLA guarantee', included: true },
      { name: 'Custom integrations', included: true },
    ],
    limits: {
      maxBlogPosts: -1,
      maxScheduledPosts: -1,
      maxTeamMembers: -1,
      maxAIGenerationsPerMonth: -1,
      maxImageGenerationsPerMonth: -1,
      multiPlatformPublishing: true,
      advancedAnalytics: true,
      whiteLabel: true,
      apiAccess: true,
      prioritySupport: true,
      customBranding: true,
    },
  },
};

/**
 * Get current user subscription
 */
export function getUserSubscription(): UserSubscription {
  const stored = localStorage.getItem('userSubscription');
  if (!stored) {
    // Default: Free tier with trial
    const now = new Date();
    const trialEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000); // 14 days

    return {
      tier: 'free',
      status: 'active',
      currentPeriodStart: now,
      currentPeriodEnd: trialEnd,
      cancelAtPeriodEnd: false,
      usage: {
        blogPostsCreated: 0,
        scheduledPosts: 0,
        aiGenerations: 0,
        imageGenerations: 0,
      },
    };
  }

  const sub = JSON.parse(stored) as UserSubscription;
  return {
    ...sub,
    currentPeriodStart: new Date(sub.currentPeriodStart),
    currentPeriodEnd: new Date(sub.currentPeriodEnd),
  };
}

/**
 * Save user subscription
 */
export function saveUserSubscription(subscription: UserSubscription): void {
  localStorage.setItem('userSubscription', JSON.stringify(subscription));
}

/**
 * Check if user can perform action
 */
export function canPerformAction(
  action: keyof SubscriptionLimits,
  currentUsage?: number
): { allowed: boolean; reason?: string } {
  const subscription = getUserSubscription();
  const plan = SUBSCRIPTION_PLANS[subscription.tier];
  const limit = plan.limits[action];

  // Boolean features
  if (typeof limit === 'boolean') {
    return {
      allowed: limit,
      reason: limit ? undefined : `This feature requires ${subscription.tier === 'free' ? 'Pro or Enterprise' : 'Enterprise'} plan`,
    };
  }

  // Numeric limits (-1 = unlimited)
  if (typeof limit === 'number') {
    if (limit === -1) {
      return { allowed: true };
    }

    if (currentUsage !== undefined && currentUsage >= limit) {
      return {
        allowed: false,
        reason: `You've reached your ${action.replace(/([A-Z])/g, ' $1').toLowerCase()} limit (${limit}). Upgrade to increase your limit.`,
      };
    }

    return { allowed: true };
  }

  return { allowed: true };
}

/**
 * Track usage
 */
export function trackUsage(
  type: 'blogPost' | 'scheduledPost' | 'aiGeneration' | 'imageGeneration'
): void {
  const subscription = getUserSubscription();

  switch (type) {
    case 'blogPost':
      subscription.usage.blogPostsCreated++;
      break;
    case 'scheduledPost':
      subscription.usage.scheduledPosts++;
      break;
    case 'aiGeneration':
      subscription.usage.aiGenerations++;
      break;
    case 'imageGeneration':
      subscription.usage.imageGenerations++;
      break;
  }

  saveUserSubscription(subscription);
}

/**
 * Reset monthly usage
 */
export function resetMonthlyUsage(): void {
  const subscription = getUserSubscription();

  subscription.usage = {
    blogPostsCreated: subscription.usage.blogPostsCreated, // Keep total posts
    scheduledPosts: subscription.usage.scheduledPosts, // Keep scheduled posts
    aiGenerations: 0,
    imageGenerations: 0,
  };

  saveUserSubscription(subscription);
}

/**
 * Upgrade subscription
 */
export async function upgradeSubscription(
  newTier: SubscriptionTier,
  paymentMethodId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // In production, this would call Stripe API via backend
    // For now, simulate upgrade

    await new Promise(resolve => setTimeout(resolve, 2000));

    const subscription = getUserSubscription();
    const now = new Date();
    const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    subscription.tier = newTier;
    subscription.status = 'active';
    subscription.currentPeriodStart = now;
    subscription.currentPeriodEnd = nextMonth;
    subscription.cancelAtPeriodEnd = false;

    saveUserSubscription(subscription);

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Cancel subscription
 */
export async function cancelSubscription(
  immediately: boolean = false
): Promise<{ success: boolean; error?: string }> {
  try {
    // In production, call Stripe API via backend
    await new Promise(resolve => setTimeout(resolve, 1500));

    const subscription = getUserSubscription();

    if (immediately) {
      subscription.tier = 'free';
      subscription.status = 'canceled';
      subscription.currentPeriodEnd = new Date();
    } else {
      subscription.cancelAtPeriodEnd = true;
    }

    saveUserSubscription(subscription);

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Get usage percentage
 */
export function getUsagePercentage(
  limitType: 'aiGenerations' | 'imageGenerations'
): number {
  const subscription = getUserSubscription();
  const plan = SUBSCRIPTION_PLANS[subscription.tier];

  const usage = limitType === 'aiGenerations'
    ? subscription.usage.aiGenerations
    : subscription.usage.imageGenerations;

  const limit = limitType === 'aiGenerations'
    ? plan.limits.maxAIGenerationsPerMonth
    : plan.limits.maxImageGenerationsPerMonth;

  if (limit === -1) return 0; // Unlimited

  return Math.min(100, (usage / limit) * 100);
}

/**
 * Calculate proration for upgrade
 */
export function calculateProration(
  currentTier: SubscriptionTier,
  newTier: SubscriptionTier,
  daysRemaining: number
): number {
  const currentPlan = SUBSCRIPTION_PLANS[currentTier];
  const newPlan = SUBSCRIPTION_PLANS[newTier];

  const dailyCurrentRate = currentPlan.price / 30;
  const dailyNewRate = newPlan.price / 30;

  const creditFromCurrent = dailyCurrentRate * daysRemaining;
  const chargeForNew = dailyNewRate * daysRemaining;

  return Math.max(0, chargeForNew - creditFromCurrent);
}

/**
 * Get days until renewal
 */
export function getDaysUntilRenewal(): number {
  const subscription = getUserSubscription();
  const now = new Date();
  const end = subscription.currentPeriodEnd;

  const diffTime = end.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return Math.max(0, diffDays);
}

/**
 * Check if feature is available
 */
export function isFeatureAvailable(feature: string): boolean {
  const subscription = getUserSubscription();
  const plan = SUBSCRIPTION_PLANS[subscription.tier];

  const featureObj = plan.features.find(f => f.name.toLowerCase().includes(feature.toLowerCase()));
  return featureObj?.included || false;
}

/**
 * Get recommended plan for usage
 */
export function getRecommendedPlan(usage: {
  blogPosts: number;
  aiGenerations: number;
  imageGenerations: number;
  teamMembers: number;
}): SubscriptionTier {
  if (
    usage.blogPosts > 50 ||
    usage.aiGenerations > 100 ||
    usage.imageGenerations > 50 ||
    usage.teamMembers > 5
  ) {
    return 'enterprise';
  }

  if (
    usage.blogPosts > 10 ||
    usage.aiGenerations > 5 ||
    usage.imageGenerations > 2 ||
    usage.teamMembers > 1
  ) {
    return 'pro';
  }

  return 'free';
}
