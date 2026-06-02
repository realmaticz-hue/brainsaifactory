// =============================================================================
// ENGAGEMENT PREDICTOR PANEL — AI-Powered Viral Potential Analysis
// =============================================================================

import React, { useState, useEffect } from 'react';
import { X, TrendingUp, Target, Clock, Share2, Eye, ThumbsUp, Zap } from 'lucide-react';
import { predictEngagement, generateHeadlineVariations, type EngagementPrediction } from '../utils/engagementPredictor';
import type { BlogPost } from '../utils/blogGenerator';

interface EngagementPredictorPanelProps {
  isopen: boolean;
  onClose: () => void;
  post: BlogPost;
}

export function EngagementPredictorPanel({ isopen, onClose, post }: EngagementPredictorPanelProps) {
  const [prediction, setPrediction] = useState<EngagementPrediction | null>(null);
  const [headlineVariations, setHeadlineVariations] = useState<string[]>([]);

  useEffect(() => {
    if (isopen && post) {
      const result = predictEngagement(
        post.seoTitle || 'Untitled',
        post.content,
        [post.primaryKeyword || '', ...(post.secondaryKeywords || [])].filter(Boolean)
      );
      setPrediction(result);

      const variations = generateHeadlineVariations(post.seoTitle || 'Untitled');
      setHeadlineVariations(variations);
    }
  }, [isopen, post]);

  if (!isopen || !prediction) return null;

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-100 dark:bg-green-900/30';
    if (score >= 60) return 'bg-yellow-100 dark:bg-yellow-900/30';
    return 'bg-red-100 dark:bg-red-900/30';
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-rose-500 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Engagement Predictor</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  AI-powered viral potential analysis
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

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Viral Score */}
          <div className="mb-8 bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 rounded-xl p-6 border border-pink-200 dark:border-pink-800">
            <div className="flex items-center gap-6">
              <div className={`w-32 h-32 rounded-full ${getScoreBg(prediction.viralScore)} flex items-center justify-center`}>
                <div className="text-center">
                  <div className={`text-4xl font-bold ${getScoreColor(prediction.viralScore)}`}>
                    {prediction.viralScore}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Viral Score</div>
                </div>
              </div>

              <div className="flex-1">
                <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg mb-2">
                  {prediction.viralScore >= 80 ? '🔥 High Viral Potential!' :
                    prediction.viralScore >= 60 ? '✨ Good Engagement Expected' :
                      '📈 Room for Improvement'}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {prediction.predictions.confidenceLevel === 'high' && 'High confidence prediction based on proven engagement factors.'}
                  {prediction.predictions.confidenceLevel === 'medium' && 'Moderate confidence - some factors could be optimized.'}
                  {prediction.predictions.confidenceLevel === 'low' && 'Low confidence - significant improvements recommended.'}
                </p>

                {/* Predictions */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white dark:bg-gray-900/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Eye className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      <span className="text-xs text-gray-500 dark:text-gray-400">Est. Reach</span>
                    </div>
                    <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                      {prediction.predictions.estimatedReach.toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-900/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <ThumbsUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span className="text-xs text-gray-500 dark:text-gray-400">Est. Engagement</span>
                    </div>
                    <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                      {prediction.predictions.estimatedEngagement.toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-900/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Share2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                      <span className="text-xs text-gray-500 dark:text-gray-400">Est. Shares</span>
                    </div>
                    <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                      {prediction.predictions.estimatedShares.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Factor Breakdown */}
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Score Breakdown</h3>
              <div className="space-y-3">
                {Object.entries(prediction.factors).map(([key, value]) => (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      <span className={`text-sm font-bold ${getScoreColor(value)}`}>
                        {value}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${value >= 80 ? 'bg-green-500' : value >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                        style={{ width: `${value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Platform Scores */}
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Platform Performance</h3>
              <div className="space-y-3">
                {Object.entries(prediction.platformScores).map(([platform, score]) => (
                  <div key={platform} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">
                        {platform === 'twitter' && '𝕏'}
                        {platform === 'linkedin' && '💼'}
                        {platform === 'facebook' && '👥'}
                        {platform === 'reddit' && '🔴'}
                        {platform === 'medium' && '📝'}
                      </span>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                        {platform}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-purple-500 h-2 rounded-full"
                          style={{ width: `${score}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold text-gray-900 dark:text-gray-100 w-8">
                        {score}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Optimal Posting Times */}
          <div className="mb-8">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              Best Times to Post
            </h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {prediction.optimalPostingTimes.map((time, idx) => (
                <div
                  key={idx}
                  className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                      {time.platform}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${getScoreBg(time.expectedEngagement)} ${getScoreColor(time.expectedEngagement)} font-bold`}>
                      {time.expectedEngagement}%
                    </span>
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    <div>{time.dayOfWeek}</div>
                    <div className="font-medium text-gray-900 dark:text-gray-100 mt-1">
                      {time.timeRange} {time.timezone}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Improvements */}
          <div className="mb-8">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              Recommended Improvements
            </h3>
            <div className="space-y-2">
              {prediction.improvements.map((improvement, idx) => (
                <div
                  key={idx}
                  className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3 border border-orange-200 dark:border-orange-800 text-sm text-gray-700 dark:text-gray-300"
                >
                  {improvement}
                </div>
              ))}
            </div>
          </div>

          {/* Headline Variations */}
          {headlineVariations.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                Alternative Headlines (A/B Test These!)
              </h3>
              <div className="space-y-2">
                {headlineVariations.map((headline, idx) => (
                  <div
                    key={idx}
                    className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-gray-100 hover:border-purple-300 dark:hover:border-purple-600 transition-colors cursor-pointer"
                  >
                    {headline}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
