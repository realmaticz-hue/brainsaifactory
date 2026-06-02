// =============================================================================
// CONTENT RECOMMENDATIONS PANEL — AI-Powered Content Strategy
// =============================================================================

import React, { useState, useEffect } from 'react';
import { X, Lightbulb, TrendingUp, RefreshCw, Target, Sparkles, ChevronRight, Filter } from 'lucide-react';
import {
  generateRecommendations,
  analyzeTopicGaps,
  getTrendingTopics,
  getRefreshSuggestions,
  type ContentRecommendation,
  type TopicGap,
  type TrendingTopic,
  type ContentRefreshSuggestion
} from '../utils/contentRecommender';
import type { BlogPost } from '../utils/blogGenerator';

interface ContentRecommendationsPanelProps {
  isopen: boolean;
  onClose: () => void;
  posts: BlogPost[];
  onCreatePost?: (template: { title: string; keywords: string[] }) => void;
  onRefreshPost?: (postId: string) => void;
}

type RecommendationType = 'all' | 'similar' | 'gap' | 'trending' | 'refresh' | 'related';

export function ContentRecommendationsPanel({
  isopen,
  onClose,
  posts,
  onCreatePost,
  onRefreshPost
}: ContentRecommendationsPanelProps) {
  const [recommendations, setRecommendations] = useState<ContentRecommendation[]>([]);
  const [topicGaps, setTopicGaps] = useState<TopicGap[]>([]);
  const [trendingTopics, setTrendingTopics] = useState<TrendingTopic[]>([]);
  const [refreshSuggestions, setRefreshSuggestions] = useState<ContentRefreshSuggestion[]>([]);
  const [filterType, setFilterType] = useState<RecommendationType>('all');
  const [selectedRec, setSelectedRec] = useState<ContentRecommendation | null>(null);

  useEffect(() => {
    if (isopen && posts.length > 0) {
      const recs = generateRecommendations(posts);
      setRecommendations(recs);

      const gaps = analyzeTopicGaps(posts);
      setTopicGaps(gaps);

      const trending = getTrendingTopics();
      setTrendingTopics(trending);

      const refresh = getRefreshSuggestions(posts);
      setRefreshSuggestions(refresh);
    }
  }, [isopen, posts]);

  if (!isopen) return null;

  const filteredRecommendations = filterType === 'all'
    ? recommendations
    : recommendations.filter(r => r.type === filterType);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30';
      case 'medium': return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30';
      case 'low': return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30';
      default: return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/30';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'similar': return <Sparkles className="w-4 h-4" />;
      case 'gap': return <Target className="w-4 h-4" />;
      case 'trending': return <TrendingUp className="w-4 h-4" />;
      case 'refresh': return <RefreshCw className="w-4 h-4" />;
      default: return <Lightbulb className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'similar': return 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800';
      case 'gap': return 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800';
      case 'trending': return 'text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-900/20 border-pink-200 dark:border-pink-800';
      case 'refresh': return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
      default: return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <Lightbulb className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Content Recommendations</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  AI-powered content strategy insights
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

        {/* Filters */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <div className="flex items-center gap-2 overflow-x-auto">
            <Filter className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
            {[
              { value: 'all', label: 'All', count: recommendations.length },
              { value: 'trending', label: 'Trending', count: recommendations.filter(r => r.type === 'trending').length },
              { value: 'gap', label: 'Topic Gaps', count: recommendations.filter(r => r.type === 'gap').length },
              { value: 'similar', label: 'Similar Content', count: recommendations.filter(r => r.type === 'similar').length },
              { value: 'refresh', label: 'Refresh', count: recommendations.filter(r => r.type === 'refresh').length },
            ].map((filter) => (
              <button
                key={filter.value}
                onClick={() => setFilterType(filter.value as RecommendationType)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${filterType === filter.value
                    ? 'bg-purple-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600'
                  }`}
              >
                {filter.label} ({filter.count})
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredRecommendations.length === 0 ? (
            <div className="text-center py-16">
              <Lightbulb className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                No recommendations yet
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Create some blog posts to get personalized recommendations
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredRecommendations.map((rec) => (
                <div
                  key={rec.id}
                  className={`rounded-xl border p-5 hover:shadow-lg transition-all cursor-pointer ${getTypeColor(rec.type)}`}
                  onClick={() => setSelectedRec(rec)}
                >
                  {/* Priority Badge */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(rec.type)}
                      <span className="text-xs font-bold uppercase tracking-wide">
                        {rec.type}
                      </span>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${getPriorityColor(rec.priority)}`}>
                      {rec.priority}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-2 line-clamp-2">
                    {rec.title}
                  </h3>

                  {/* Description */}
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                    {rec.description}
                  </p>

                  {/* Impact Score */}
                  {rec.estimatedImpact !== undefined && (
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-gray-600 dark:text-gray-400">Estimated Impact</span>
                        <span className="font-bold text-gray-900 dark:text-gray-100">{rec.estimatedImpact}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                        <div
                          className="bg-gradient-to-r from-purple-500 to-pink-500 h-1.5 rounded-full transition-all"
                          style={{ width: `${rec.estimatedImpact}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Tags */}
                  {rec.tags && rec.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {rec.tags.slice(0, 3).map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-white dark:bg-gray-800 rounded text-xs font-medium text-gray-700 dark:text-gray-300"
                        >
                          {tag}
                        </span>
                      ))}
                      {rec.tags.length > 3 && (
                        <span className="px-2 py-1 text-xs text-gray-500 dark:text-gray-400">
                          +{rec.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Related Posts Count */}
                  {rec.relatedPosts && rec.relatedPosts.length > 0 && (
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      Related to {rec.relatedPosts.length} post{rec.relatedPosts.length !== 1 ? 's' : ''}
                    </div>
                  )}

                  {/* Action Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (rec.type === 'refresh' && rec.relatedPosts?.[0] && onRefreshPost) {
                        onRefreshPost(rec.relatedPosts[0]);
                      } else if (onCreatePost && rec.tags) {
                        onCreatePost({
                          title: rec.title,
                          keywords: rec.tags,
                        });
                      }
                    }}
                    className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg font-semibold text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    {rec.type === 'refresh' ? 'Update Post' : 'Create Now'}
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Additional Insights */}
          {posts.length > 0 && (
            <div className="mt-8 grid md:grid-cols-2 gap-6">
              {/* Topic Gaps */}
              {topicGaps.length > 0 && (
                <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-xl p-6 border border-orange-200 dark:border-orange-800">
                  <div className="flex items-center gap-2 mb-4">
                    <Target className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                    <h3 className="font-bold text-gray-900 dark:text-gray-100">Top Topic Gaps</h3>
                  </div>
                  <div className="space-y-3">
                    {topicGaps.slice(0, 4).map((gap, idx) => (
                      <div key={idx} className="bg-white dark:bg-gray-800 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                            {gap.topic}
                          </span>
                          <span className="text-xs font-bold text-orange-600 dark:text-orange-400">
                            {gap.opportunity}% opp.
                          </span>
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          {gap.searchVolume.toLocaleString()} monthly searches · {gap.competition}% competition
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Trending Topics */}
              {trendingTopics.length > 0 && (
                <div className="bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 rounded-xl p-6 border border-pink-200 dark:border-pink-800">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-5 h-5 text-pink-600 dark:text-pink-400" />
                    <h3 className="font-bold text-gray-900 dark:text-gray-100">Trending Now</h3>
                  </div>
                  <div className="space-y-3">
                    {trendingTopics.map((topic, idx) => (
                      <div key={idx} className="bg-white dark:bg-gray-800 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-lg ${topic.trend === 'hot' ? '🔥' : '📈'}`}>
                            {topic.trend === 'hot' ? '🔥' : '📈'}
                          </span>
                          <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                            {topic.topic}
                          </span>
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                          {topic.searchVolume.toLocaleString()} searches/month
                        </div>
                        <div className="text-xs text-gray-900 dark:text-gray-100 font-medium">
                          "{topic.suggestedTitle}"
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Detail Modal */}
        {selectedRec && (
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-10"
            onClick={() => setSelectedRec(null)}
          >
            <div
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {getTypeIcon(selectedRec.type)}
                    <span className="text-xs font-bold uppercase tracking-wide text-gray-600 dark:text-gray-400">
                      {selectedRec.type}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${getPriorityColor(selectedRec.priority)}`}>
                      {selectedRec.priority} priority
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                    {selectedRec.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {selectedRec.description}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedRec(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {selectedRec.tags && selectedRec.tags.length > 0 && (
                <div className="mb-4">
                  <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Keywords</div>
                  <div className="flex flex-wrap gap-2">
                    {selectedRec.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-sm text-gray-700 dark:text-gray-300"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedRec.relatedPosts && selectedRec.relatedPosts.length > 0 && (
                <div className="mb-4">
                  <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Related Posts ({selectedRec.relatedPosts.length})
                  </div>
                  <div className="space-y-2">
                    {selectedRec.relatedPosts.map((postId) => {
                      const post = posts.find(p => p.id === postId);
                      return post ? (
                        <div key={postId} className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 text-sm">
                          <div className="font-medium text-gray-900 dark:text-gray-100">
                            {post.seoTitle || 'Untitled'}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {post.duration}sec read
                          </div>
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    if (selectedRec.type === 'refresh' && selectedRec.relatedPosts?.[0] && onRefreshPost) {
                      onRefreshPost(selectedRec.relatedPosts[0]);
                    } else if (onCreatePost && selectedRec.tags) {
                      onCreatePost({
                        title: selectedRec.title,
                        keywords: selectedRec.tags,
                      });
                    }
                    setSelectedRec(null);
                  }}
                  className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold"
                >
                  {selectedRec.type === 'refresh' ? 'Update Post' : 'Create Content'}
                </button>
                <button
                  onClick={() => setSelectedRec(null)}
                  className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
