// =============================================================================
// SEO ANALYZER DASHBOARD — Real-time SEO Scoring & Optimization
// =============================================================================

import React, { useState, useEffect, useMemo } from 'react';
import { X, TrendingUp, AlertCircle, CheckCircle, Info, Target, BarChart3, FileText, Link as LinkIcon } from 'lucide-react';
import { analyzeSEO, type SEOAnalysisResult, type SEOIssue } from '../utils/seoAnalyzer';
import type { BlogPost } from '../utils/blogGenerator';

interface SEOAnalyzerDashboardProps {
  isopen: boolean;
  onClose: () => void;
  posts: BlogPost[];
}

export function SEOAnalyzerDashboard({ isopen, onClose, posts }: SEOAnalyzerDashboardProps) {
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [filterIssueType, setFilterIssueType] = useState<'all' | 'error' | 'warning' | 'info'>('all');

  useEffect(() => {
    if (isopen && posts.length > 0 && !selectedPost) {
      setSelectedPost(posts[0]);
    }
  }, [isopen, posts, selectedPost]);

  if (!isopen) return null;

  const analysis: SEOAnalysisResult | null = selectedPost
    ? analyzeSEO(
      selectedPost.content,
      selectedPost.seoTitle,
      selectedPost.metaDescription,
      selectedPost.primaryKeyword,
      selectedPost.slug
    )
    : null;

  const filteredIssues = analysis?.issues.filter(issue =>
    filterIssueType === 'all' || issue.type === filterIssueType
  ) || [];

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 dark:bg-green-900/30';
    if (score >= 60) return 'bg-yellow-100 dark:bg-yellow-900/30';
    return 'bg-red-100 dark:bg-red-900/30';
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden flex">
        {/* Sidebar - Post List */}
        <div className="w-80 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">All Posts</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{posts.length} posts</p>
          </div>

          <div className="p-2">
            {posts.map(post => {
              const postAnalysis = analyzeSEO(
                post.content,
                post.seoTitle,
                post.metaDescription,
                post.primaryKeyword,
                post.slug
              );

              return (
                <button
                  key={post.id}
                  onClick={() => setSelectedPost(post)}
                  className={`w-full text-left p-3 rounded-lg mb-2 transition-all ${selectedPost?.id === post.id
                      ? 'bg-purple-50 dark:bg-purple-900/20 border border-purple-300 dark:border-purple-600'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                      {post.seoTitle || 'Untitled'}
                    </span>
                    <span className={`text-xl font-bold ${getScoreColor(postAnalysis.score.overall)}`}>
                      {postAnalysis.score.overall}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {post.primaryKeyword || 'No keyword'}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">SEO Analyzer</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Real-time optimization insights
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

            {selectedPost && (
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                  {selectedPost.seoTitle || 'Untitled Post'}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedPost.metaDescription || 'No description'}
                </p>
              </div>
            )}
          </div>

          {/* Analysis Content */}
          {analysis && (
            <div className="flex-1 overflow-y-auto p-6">
              {/* Overall Score */}
              <div className="mb-8">
                <div className="flex items-center gap-6 mb-6">
                  <div className={`w-32 h-32 rounded-full ${getScoreBgColor(analysis.score.overall)} flex items-center justify-center`}>
                    <div className="text-center">
                      <div className={`text-4xl font-bold ${getScoreColor(analysis.score.overall)}`}>
                        {analysis.score.overall}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Overall Score</div>
                    </div>
                  </div>

                  {/* Score Breakdown */}
                  <div className="flex-1 grid grid-cols-3 gap-4">
                    {Object.entries(analysis.score.breakdown).map(([key, value]) => (
                      <div key={key} className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-gray-600 dark:text-gray-400 capitalize">
                            {key}
                          </span>
                          <span className={`text-sm font-bold ${getScoreColor(value)}`}>
                            {value}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full transition-all ${value >= 80 ? 'bg-green-500' : value >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                            style={{ width: `${value}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Keyword Analysis */}
              <div className="mb-8 bg-white dark:bg-gray-900/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-4">
                  <Target className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">Keyword Analysis</h3>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <div className="mb-3">
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Primary Keyword</div>
                      <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                        {analysis.keywords.primary || 'Not defined'}
                      </div>
                    </div>

                    <div className="mb-3">
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Density</div>
                      <div className="flex items-center gap-2">
                        <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                          {analysis.keywords.density.toFixed(2)}%
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${analysis.keywords.density >= 1 && analysis.keywords.density <= 2
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                            : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                          }`}>
                          {analysis.keywords.density >= 1 && analysis.keywords.density <= 2 ? 'Optimal' : 'Improve'}
                        </span>
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">Placement</div>
                      <div className="space-y-1">
                        {Object.entries(analysis.keywords.placement).map(([key, present]) => (
                          <div key={key} className="flex items-center gap-2 text-sm">
                            {present ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-gray-400" />
                            )}
                            <span className={present ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'}>
                              {key.replace(/([A-Z])/g, ' $1').trim()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">Related Keywords</div>
                    <div className="flex flex-wrap gap-2">
                      {analysis.keywords.relatedKeywords.slice(0, 10).map(keyword => (
                        <span
                          key={keyword}
                          className="px-3 py-1 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-full text-xs font-medium"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Readability */}
              <div className="mb-8 bg-white dark:bg-gray-900/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">Readability</h3>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Score</div>
                    <div className={`text-2xl font-bold ${getScoreColor(analysis.readability.score)}`}>
                      {Math.round(analysis.readability.score)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Grade Level</div>
                    <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {analysis.readability.gradeLevel}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Avg Sentence</div>
                    <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {analysis.readability.avgSentenceLength} words
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Passive Voice</div>
                    <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {analysis.readability.passiveVoice}%
                    </div>
                  </div>
                </div>
              </div>

              {/* Issues */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                    Issues & Recommendations
                  </h3>
                  <div className="flex gap-2">
                    {(['all', 'error', 'warning', 'info'] as const).map(type => (
                      <button
                        key={type}
                        onClick={() => setFilterIssueType(type)}
                        className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${filterIssueType === type
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                          }`}
                      >
                        {type === 'all' ? `All (${analysis.issues.length})` : type.charAt(0).toUpperCase() + type.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  {filteredIssues.map(issue => (
                    <div
                      key={issue.id}
                      className={`p-4 rounded-lg border ${issue.type === 'error'
                          ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                          : issue.type === 'warning'
                            ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                            : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                        }`}
                    >
                      <div className="flex items-start gap-3">
                        {issue.type === 'error' ? (
                          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                        ) : issue.type === 'warning' ? (
                          <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                        ) : (
                          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-gray-900 dark:text-gray-100">
                              {issue.message}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${issue.impact === 'high'
                                ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                : issue.impact === 'medium'
                                  ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                              }`}>
                              {issue.impact} impact
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            💡 {issue.suggestion}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}

                  {filteredIssues.length === 0 && (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
                      <p>No {filterIssueType === 'all' ? '' : filterIssueType} issues found!</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Recommendations */}
              {analysis.recommendations.length > 0 && (
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
                    🎯 Top Recommendations
                  </h3>
                  <ul className="space-y-2">
                    {analysis.recommendations.map((rec, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <span className="text-purple-600 dark:text-purple-400 font-bold">{idx + 1}.</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {!analysis && (
            <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
              <div className="text-center">
                <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Select a post to analyze</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
