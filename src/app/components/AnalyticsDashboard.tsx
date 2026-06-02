// =============================================================================
// ANALYTICS DASHBOARD — Real-Time Analytics & Insights
// =============================================================================

import React, { useState, useEffect } from 'react';
import {
  analyticsTracker,
  type AnalyticsEvent,
  type BlogPerformance,
} from '../utils/analytics/analyticsTracker';
import {
  abTestManager,
  type ABTest,
  type ABTestResult,
} from '../utils/analytics/abTesting';
import {
  Activity,
  TrendingUp,
  Users,
  FileText,
  Target,
  Award,
  AlertCircle,
  BarChart3,
  PieChart,
  LineChart,
  X,
} from 'lucide-react';

interface AnalyticsDashboardProps {
  onClose: () => void;
}

export function AnalyticsDashboard({ onClose }: AnalyticsDashboardProps) {
  const [events, setEvents] = useState<AnalyticsEvent[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [insights, setInsights] = useState<any[]>([]);
  const [topPosts, setTopPosts] = useState<any[]>([]);
  const [abTests, setAbTests] = useState<ABTest[]>([]);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'posts' | 'abtests' | 'insights'>('overview');

  useEffect(() => {
    loadAnalytics();

    // Subscribe to real-time updates
    const unsubscribe = analyticsTracker.subscribe((newEvents) => {
      setEvents(newEvents);
      loadAnalytics();
    });

    return () => unsubscribe();
  }, []);

  function loadAnalytics() {
    const allEvents = analyticsTracker.getEvents();
    const analyticsSummary = analyticsTracker.getSummary();
    const analyticsInsights = analyticsTracker.getInsights();
    const topPerformers = analyticsTracker.getTopPosts(10);
    const allTests = abTestManager.getAllTests();

    setEvents(allEvents);
    setSummary(analyticsSummary);
    setInsights(analyticsInsights);
    setTopPosts(topPerformers);
    setAbTests(allTests);
  }

  function clearAnalytics() {
    if (confirm('Are you sure you want to clear all analytics data? This cannot be undone.')) {
      analyticsTracker.clearEvents();
      loadAnalytics();
    }
  }

  function exportData() {
    const data = analyticsTracker.exportEvents();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-export-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <BarChart3 className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
              <p className="text-sm text-gray-500">Real-time tracking and insights</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={exportData}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Export Data
            </button>
            <button
              onClick={clearAnalytics}
              className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
            >
              Clear All
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b bg-gray-50">
          <button
            onClick={() => setSelectedTab('overview')}
            className={`px-6 py-3 font-medium transition-colors ${
              selectedTab === 'overview'
                ? 'text-purple-600 border-b-2 border-purple-600 bg-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setSelectedTab('posts')}
            className={`px-6 py-3 font-medium transition-colors ${
              selectedTab === 'posts'
                ? 'text-purple-600 border-b-2 border-purple-600 bg-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Top Posts
          </button>
          <button
            onClick={() => setSelectedTab('abtests')}
            className={`px-6 py-3 font-medium transition-colors ${
              selectedTab === 'abtests'
                ? 'text-purple-600 border-b-2 border-purple-600 bg-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            A/B Tests
          </button>
          <button
            onClick={() => setSelectedTab('insights')}
            className={`px-6 py-3 font-medium transition-colors ${
              selectedTab === 'insights'
                ? 'text-purple-600 border-b-2 border-purple-600 bg-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Insights
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {selectedTab === 'overview' && (
            <OverviewTab summary={summary} events={events} />
          )}
          {selectedTab === 'posts' && (
            <PostsTab topPosts={topPosts} />
          )}
          {selectedTab === 'abtests' && (
            <ABTestsTab abTests={abTests} onRefresh={loadAnalytics} />
          )}
          {selectedTab === 'insights' && (
            <InsightsTab insights={insights} />
          )}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// OVERVIEW TAB
// =============================================================================

function OverviewTab({ summary, events }: { summary: any; events: AnalyticsEvent[] }) {
  if (!summary) return <div className="text-gray-500">Loading...</div>;

  const stats = [
    { label: 'Total Events', value: summary.totalEvents, icon: Activity, color: 'bg-blue-100 text-blue-600' },
    { label: 'Unique Users', value: summary.uniqueUsers, icon: Users, color: 'bg-green-100 text-green-600' },
    { label: 'Unique Posts', value: summary.uniquePosts, icon: FileText, color: 'bg-purple-100 text-purple-600' },
    { label: 'Recent Activity (24h)', value: summary.recentActivity, icon: TrendingUp, color: 'bg-orange-100 text-orange-600' },
  ];

  const eventTypeData = Object.entries(summary.eventsByType || {}).map(([type, count]) => ({
    type,
    count: count as number,
  })).sort((a, b) => b.count - a.count);

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white border rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <div className={`p-2 rounded-lg ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <span className="text-2xl font-bold text-gray-900">{stat.value}</span>
            </div>
            <p className="text-sm text-gray-600">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Event Types Breakdown */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Events by Type</h3>
        <div className="space-y-3">
          {eventTypeData.slice(0, 8).map((item) => {
            const percentage = summary.totalEvents > 0
              ? (item.count / summary.totalEvents) * 100
              : 0;

            return (
              <div key={item.type}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700 capitalize">
                    {item.type.replace(/_/g, ' ')}
                  </span>
                  <span className="text-sm text-gray-500">{item.count} ({percentage.toFixed(1)}%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Events */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Events</h3>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {events.slice(-20).reverse().map((event) => (
            <div key={event.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span className="text-sm font-medium text-gray-700 capitalize min-w-[140px]">
                {event.type.replace(/_/g, ' ')}
              </span>
              <span className="text-xs text-gray-500 flex-1">
                {new Date(event.timestamp).toLocaleString()}
              </span>
              {event.metadata.postId && (
                <span className="text-xs text-gray-400 font-mono">
                  {event.metadata.postId.substring(0, 8)}...
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// POSTS TAB
// =============================================================================

function PostsTab({ topPosts }: { topPosts: any[] }) {
  if (topPosts.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>No post data available yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Top Performing Posts</h3>
      <div className="space-y-3">
        {topPosts.map((post, index) => {
          const perf = post.performance;
          return (
            <div key={post.postId} className="bg-white border rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {index < 3 && (
                    <div className={`p-2 rounded-lg ${
                      index === 0 ? 'bg-yellow-100' :
                      index === 1 ? 'bg-gray-100' :
                      'bg-orange-100'
                    }`}>
                      <Award className={`w-5 h-5 ${
                        index === 0 ? 'text-yellow-600' :
                        index === 1 ? 'text-gray-600' :
                        'text-orange-600'
                      }`} />
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-gray-900">Post #{index + 1}</p>
                    <p className="text-sm text-gray-500 font-mono">{post.postId.substring(0, 16)}...</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-purple-600">{perf.engagementScore}</div>
                  <div className="text-xs text-gray-500">Engagement Score</div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div>
                  <div className="text-lg font-semibold text-gray-900">{perf.views}</div>
                  <div className="text-xs text-gray-500">Views</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-gray-900">{perf.clicks}</div>
                  <div className="text-xs text-gray-500">Clicks</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-gray-900">{perf.shares}</div>
                  <div className="text-xs text-gray-500">Shares</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-gray-900">{perf.publishCount}</div>
                  <div className="text-xs text-gray-500">Publishes</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-gray-900">{perf.conversionRate.toFixed(1)}%</div>
                  <div className="text-xs text-gray-500">Conversion</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// =============================================================================
// A/B TESTS TAB
// =============================================================================

function ABTestsTab({ abTests, onRefresh }: { abTests: ABTest[]; onRefresh: () => void }) {
  const [selectedTest, setSelectedTest] = useState<string | null>(null);

  if (abTests.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>No A/B tests created yet</p>
        <p className="text-sm mt-2">Create an A/B test to start tracking variant performance</p>
      </div>
    );
  }

  const runningTests = abTests.filter(t => t.status === 'running');
  const completedTests = abTests.filter(t => t.status === 'completed');

  return (
    <div className="space-y-6">
      {/* Running Tests */}
      {runningTests.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Running Tests ({runningTests.length})
          </h3>
          <div className="space-y-3">
            {runningTests.map((test) => (
              <ABTestCard
                key={test.id}
                test={test}
                onRefresh={onRefresh}
                onSelect={() => setSelectedTest(test.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Completed Tests */}
      {completedTests.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Completed Tests ({completedTests.length})
          </h3>
          <div className="space-y-3">
            {completedTests.map((test) => (
              <ABTestCard
                key={test.id}
                test={test}
                onRefresh={onRefresh}
                onSelect={() => setSelectedTest(test.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ABTestCard({ test, onRefresh, onSelect }: { test: ABTest; onRefresh: () => void; onSelect: () => void }) {
  const results = abTestManager.getTestResults(test.id);

  function handleAutoComplete() {
    const completed = abTestManager.autoCompleteIfReady(test.id);
    if (completed) {
      onRefresh();
    }
  }

  return (
    <div className="bg-white border rounded-lg p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h4 className="font-semibold text-gray-900">{test.name}</h4>
          {test.description && (
            <p className="text-sm text-gray-500 mt-1">{test.description}</p>
          )}
          <div className="flex items-center gap-3 mt-2">
            <span className={`px-2 py-1 text-xs font-medium rounded ${
              test.status === 'running' ? 'bg-green-100 text-green-700' :
              test.status === 'completed' ? 'bg-blue-100 text-blue-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              {test.status}
            </span>
            <span className="text-xs text-gray-500">
              Target: {test.targetMetric} | Confidence: {(test.confidenceLevel * 100).toFixed(0)}%
            </span>
          </div>
        </div>
        {test.status === 'running' && (
          <button
            onClick={handleAutoComplete}
            className="px-3 py-1 text-xs font-medium text-purple-600 bg-purple-50 rounded hover:bg-purple-100 transition-colors"
          >
            Check Winner
          </button>
        )}
      </div>

      <div className="space-y-3">
        {results.variants.map((variant) => {
          const variantInfo = test.variants.find(v => v.id === variant.variantId);
          const metrics = variant.metrics;

          return (
            <div key={variant.variantId} className={`border rounded-lg p-4 ${
              variant.isWinner ? 'border-green-500 bg-green-50' : ''
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">{variantInfo?.name}</span>
                  {variant.isWinner && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded">
                      Winner ({(variant.confidenceScore * 100).toFixed(1)}%)
                    </span>
                  )}
                </div>
                <span className="text-sm text-gray-500">{variantInfo?.weight}% traffic</span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <div className="text-sm font-semibold text-gray-900">{metrics.impressions}</div>
                  <div className="text-xs text-gray-500">Impressions</div>
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-900">{metrics.clicks}</div>
                  <div className="text-xs text-gray-500">Clicks</div>
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-900">{metrics.clickThroughRate.toFixed(1)}%</div>
                  <div className="text-xs text-gray-500">CTR</div>
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-900">{metrics.conversionRate.toFixed(1)}%</div>
                  <div className="text-xs text-gray-500">Conversion</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 p-3 bg-gray-50 rounded text-sm text-gray-700">
        <strong>Recommendation:</strong> {results.recommendedAction}
      </div>
    </div>
  );
}

// =============================================================================
// INSIGHTS TAB
// =============================================================================

function InsightsTab({ insights }: { insights: any[] }) {
  if (insights.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>No insights available yet</p>
        <p className="text-sm mt-2">Generate more content and engagement data to see insights</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">AI-Powered Insights</h3>
      <div className="space-y-3">
        {insights.map((insight, index) => (
          <div
            key={index}
            className={`border-l-4 rounded-lg p-4 ${
              insight.priority === 'high' ? 'border-red-500 bg-red-50' :
              insight.priority === 'medium' ? 'border-yellow-500 bg-yellow-50' :
              'border-blue-500 bg-blue-50'
            }`}
          >
            <div className="flex items-start gap-3">
              <AlertCircle className={`w-5 h-5 mt-0.5 ${
                insight.priority === 'high' ? 'text-red-600' :
                insight.priority === 'medium' ? 'text-yellow-600' :
                'text-blue-600'
              }`} />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-gray-900 capitalize">
                    {insight.type.replace(/_/g, ' ')}
                  </span>
                  <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                    insight.priority === 'high' ? 'bg-red-100 text-red-700' :
                    insight.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {insight.priority} priority
                  </span>
                </div>
                <p className="text-sm text-gray-700">{insight.message}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
