// =============================================================================
// SUBSCRIPTION MANAGER — Stripe Billing & Feature Gating
// =============================================================================

import React, { useState, useEffect } from 'react';
import { X, Check, Crown, Zap, Building2, TrendingUp, AlertCircle, CreditCard, Calendar } from 'lucide-react';
import {
  SUBSCRIPTION_PLANS,
  getUserSubscription,
  upgradeSubscription,
  cancelSubscription,
  getDaysUntilRenewal,
  getUsagePercentage,
  calculateProration,
  type SubscriptionTier,
  type UserSubscription
} from '../utils/subscriptionTiers';
import { toast } from 'sonner';

interface SubscriptionManagerProps {
  isopen: boolean;
  onClose: () => void;
  onUpgradeComplete?: () => void;
}

type ViewMode = 'plans' | 'billing' | 'usage';

export function SubscriptionManager({ isopen, onClose, onUpgradeComplete }: SubscriptionManagerProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('plans');
  const [subscription, setSubscription] = useState<UserSubscription>(getUserSubscription());
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionTier | null>(null);

  useEffect(() => {
    if (isopen) {
      setSubscription(getUserSubscription());
    }
  }, [isopen]);

  if (!isopen) return null;

  const currentPlan = SUBSCRIPTION_PLANS[subscription.tier];
  const daysRemaining = getDaysUntilRenewal();
  const aiUsagePercent = getUsagePercentage('aiGenerations');
  const imageUsagePercent = getUsagePercentage('imageGenerations');

  const handleUpgrade = async (tier: SubscriptionTier) => {
    if (tier === subscription.tier) {
      toast.info('You are already on this plan');
      return;
    }

    if (tier === 'free') {
      toast.error('Please use the cancel subscription option');
      return;
    }

    setIsProcessing(true);

    try {
      const result = await upgradeSubscription(tier);

      if (result.success) {
        toast.success(`Successfully upgraded to ${SUBSCRIPTION_PLANS[tier].name}!`);
        setSubscription(getUserSubscription());
        onUpgradeComplete?.();
        setSelectedPlan(null);
      } else {
        toast.error(result.error || 'Failed to upgrade');
      }
    } catch (error: any) {
      toast.error(error.message || 'Upgrade failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelSubscription = async (immediately: boolean = false) => {
    if (!confirm(immediately ? 'Cancel your subscription immediately?' : 'Cancel at end of billing period?')) {
      return;
    }

    setIsProcessing(true);

    try {
      const result = await cancelSubscription(immediately);

      if (result.success) {
        toast.success(immediately ? 'Subscription canceled' : 'Subscription will cancel at period end');
        setSubscription(getUserSubscription());
      } else {
        toast.error(result.error || 'Failed to cancel');
      }
    } catch (error: any) {
      toast.error(error.message || 'Cancellation failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const getTierIcon = (tier: SubscriptionTier) => {
    switch (tier) {
      case 'free': return Zap;
      case 'pro': return Crown;
      case 'enterprise': return Building2;
      default: return Zap;
    }
  };

  const getTierColor = (tier: SubscriptionTier) => {
    switch (tier) {
      case 'free': return 'from-gray-500 to-gray-600';
      case 'pro': return 'from-purple-500 to-pink-500';
      case 'enterprise': return 'from-orange-500 to-red-500';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const renderPlansView = () => (
    <div className="grid md:grid-cols-3 gap-6">
      {(Object.values(SUBSCRIPTION_PLANS) as typeof SUBSCRIPTION_PLANS[SubscriptionTier][]).map((plan) => {
        const Icon = getTierIcon(plan.id);
        const isCurrentPlan = plan.id === subscription.tier;
        const proration = isCurrentPlan ? 0 : calculateProration(subscription.tier, plan.id, daysRemaining);

        return (
          <div
            key={plan.id}
            className={`rounded-2xl border-2 overflow-hidden transition-all ${isCurrentPlan
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : plan.popular
                ? 'border-purple-500'
                : 'border-gray-200 dark:border-gray-700'
              } ${plan.popular ? 'transform scale-105' : ''}`}
          >
            {plan.popular && (
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-center py-2 text-sm font-bold">
                ⭐ MOST POPULAR
              </div>
            )}

            <div className="p-6">
              {/* Header */}
              <div className="text-center mb-6">
                <div className={`w-16 h-16 mx-auto mb-4 bg-gradient-to-br ${getTierColor(plan.id)} rounded-2xl flex items-center justify-center`}>
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  {plan.name}
                </h3>
                <div className="text-4xl font-bold text-gray-900 dark:text-gray-100">
                  ${plan.price}
                  <span className="text-lg text-gray-500 dark:text-gray-400">/mo</span>
                </div>
              </div>

              {/* Features */}
              <div className="space-y-3 mb-6">
                {plan.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    {feature.included ? (
                      <Check className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    ) : (
                      <X className="w-5 h-5 text-gray-300 dark:text-gray-600 flex-shrink-0 mt-0.5" />
                    )}
                    <span className={`text-sm ${feature.included
                      ? 'text-gray-900 dark:text-gray-100'
                      : 'text-gray-400 dark:text-gray-500 line-through'
                      }`}>
                      {feature.name}
                    </span>
                  </div>
                ))}
              </div>

              {/* CTA */}
              {isCurrentPlan ? (
                <div className="bg-blue-100 dark:bg-blue-900/30 rounded-lg py-3 text-center text-sm font-semibold text-blue-700 dark:text-blue-300">
                  Current Plan
                </div>
              ) : (
                <button
                  onClick={() => handleUpgrade(plan.id)}
                  disabled={isProcessing}
                  className={`w-full py-3 rounded-lg font-semibold transition-all ${plan.id === 'free'
                    ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                    : `bg-gradient-to-r ${getTierColor(plan.id)} text-white hover:opacity-90`
                    } disabled:opacity-50`}
                >
                  {plan.id === 'free' ? 'Downgrade' : `Upgrade to ${plan.name}`}
                </button>
              )}

              {/* Proration Notice */}
              {!isCurrentPlan && proration > 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                  Prorated charge: ${proration.toFixed(2)}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderBillingView = () => (
    <div className="space-y-6">
      {/* Current Subscription */}
      <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-4">Current Subscription</h3>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Plan</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {currentPlan.name}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              ${currentPlan.price}/month
            </div>
          </div>

          <div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Status</div>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-sm font-bold ${subscription.status === 'active'
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                }`}>
                {subscription.status}
              </span>
            </div>
            {subscription.cancelAtPeriodEnd && (
              <div className="text-xs text-orange-600 dark:text-orange-400 mt-2">
                Cancels on {subscription.currentPeriodEnd.toLocaleDateString()}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Current billing period</span>
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              {subscription.currentPeriodStart.toLocaleDateString()} - {subscription.currentPeriodEnd.toLocaleDateString()}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm mt-2">
            <span className="text-gray-600 dark:text-gray-400">Days remaining</span>
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              {daysRemaining} days
            </span>
          </div>
        </div>
      </div>

      {/* Payment Method */}
      <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900 dark:text-gray-100">Payment Method</h3>
          <button className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold">
            Update
          </button>
        </div>

        <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <CreditCard className="w-8 h-8 text-gray-400" />
          <div>
            <div className="font-semibold text-gray-900 dark:text-gray-100">•••• •••• •••• 4242</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Expires 12/2025</div>
          </div>
        </div>
      </div>

      {/* Billing History */}
      <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-4">Billing History</h3>

        <div className="space-y-3">
          {[
            { date: '2026-05-01', amount: currentPlan.price, status: 'Paid' },
            { date: '2026-04-01', amount: currentPlan.price, status: 'Paid' },
            { date: '2026-03-01', amount: currentPlan.price, status: 'Paid' },
          ].map((invoice, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {new Date(invoice.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  ${invoice.amount.toFixed(2)}
                </span>
                <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded text-xs font-bold">
                  {invoice.status}
                </span>
                <button className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300">
                  Download
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cancel Subscription */}
      {subscription.tier !== 'free' && !subscription.cancelAtPeriodEnd && (
        <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-6 border border-red-200 dark:border-red-800">
          <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-2">Cancel Subscription</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Your subscription will remain active until the end of your billing period.
          </p>
          <button
            onClick={() => handleCancelSubscription(false)}
            disabled={isProcessing}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold disabled:opacity-50"
          >
            Cancel Subscription
          </button>
        </div>
      )}
    </div>
  );

  const renderUsageView = () => (
    <div className="space-y-6">
      {/* Usage Overview */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* AI Generations */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900 dark:text-gray-100">AI Generations</h3>
            <Zap className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>

          <div className="mb-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {subscription.usage.aiGenerations}
              </span>
              <span className="text-gray-500 dark:text-gray-400">
                / {currentPlan.limits.maxAIGenerationsPerMonth === -1 ? '∞' : currentPlan.limits.maxAIGenerationsPerMonth}
              </span>
            </div>
          </div>

          {currentPlan.limits.maxAIGenerationsPerMonth !== -1 && (
            <div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-1">
                <div
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all"
                  style={{ width: `${aiUsagePercent}%` }}
                />
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                {aiUsagePercent.toFixed(0)}% used this month
              </div>
            </div>
          )}

          {aiUsagePercent > 80 && currentPlan.limits.maxAIGenerationsPerMonth !== -1 && (
            <div className="mt-4 bg-orange-100 dark:bg-orange-900/30 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-orange-800 dark:text-orange-200">
                You're running low on AI generations. Consider upgrading to continue.
              </div>
            </div>
          )}
        </div>

        {/* Image Generations */}
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900 dark:text-gray-100">Image Generations</h3>
            <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>

          <div className="mb-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {subscription.usage.imageGenerations}
              </span>
              <span className="text-gray-500 dark:text-gray-400">
                / {currentPlan.limits.maxImageGenerationsPerMonth === -1 ? '∞' : currentPlan.limits.maxImageGenerationsPerMonth}
              </span>
            </div>
          </div>

          {currentPlan.limits.maxImageGenerationsPerMonth !== -1 && (
            <div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-1">
                <div
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full transition-all"
                  style={{ width: `${imageUsagePercent}%` }}
                />
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                {imageUsagePercent.toFixed(0)}% used this month
              </div>
            </div>
          )}

          {imageUsagePercent > 80 && currentPlan.limits.maxImageGenerationsPerMonth !== -1 && (
            <div className="mt-4 bg-orange-100 dark:bg-orange-900/30 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-orange-800 dark:text-orange-200">
                You're running low on image generations. Consider upgrading to continue.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Additional Stats */}
      <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-4">Additional Usage</h3>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
              {subscription.usage.blogPostsCreated}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Blog Posts Created</div>
            {currentPlan.limits.maxBlogPosts !== -1 && (
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Limit: {currentPlan.limits.maxBlogPosts}
              </div>
            )}
          </div>

          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
              {subscription.usage.scheduledPosts}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Scheduled Posts</div>
            {currentPlan.limits.maxScheduledPosts !== -1 && (
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Limit: {currentPlan.limits.maxScheduledPosts}
              </div>
            )}
          </div>

          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
              {daysRemaining}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Days Until Renewal</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Resets {subscription.currentPeriodEnd.toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <Crown className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Subscription & Billing</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Manage your plan and usage
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex gap-1 p-2">
            {[
              { mode: 'plans', label: 'Plans' },
              { mode: 'billing', label: 'Billing' },
              { mode: 'usage', label: 'Usage' },
            ].map((tab) => (
              <button
                key={tab.mode}
                onClick={() => setViewMode(tab.mode as ViewMode)}
                className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${viewMode === tab.mode
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {viewMode === 'plans' && renderPlansView()}
          {viewMode === 'billing' && renderBillingView()}
          {viewMode === 'usage' && renderUsageView()}
        </div>
      </div>
    </div>
  );
}
