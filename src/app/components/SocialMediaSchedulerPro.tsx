// =============================================================================
// SOCIAL MEDIA SCHEDULER PRO — Advanced Multi-Platform Publishing
// =============================================================================

import React, { useState, useEffect } from 'react';
import { X, Calendar, BarChart3, Settings, Clock, Send, Zap, TrendingUp, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import {
  socialScheduler,
  PLATFORM_SPECS,
  type SocialMediaPost,
  type SocialPlatform,
  type ScheduleConfig
} from '../utils/socialMediaScheduler';
import { toast } from 'sonner';
import type { BlogPost } from '../utils/blogGenerator';

interface SocialMediaSchedulerProProps {
  isopen: boolean;
  onClose: () => void;
  posts: BlogPost[];
}

type ViewMode = 'schedule' | 'analytics' | 'queue' | 'settings';

export function SocialMediaSchedulerPro({ isopen, onClose, posts }: SocialMediaSchedulerProProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('schedule');
  const [scheduledPosts, setScheduledPosts] = useState<SocialMediaPost[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<SocialPlatform[]>(['x', 'linkedin']);
  const [selectedBlogPost, setSelectedBlogPost] = useState<string>('');
  const [scheduleDate, setScheduleDate] = useState('');
  const [config, setConfig] = useState<ScheduleConfig>(socialScheduler.getConfig());
  const [stats, setStats] = useState(socialScheduler.getStats());

  useEffect(() => {
    if (isopen) {
      refreshData();
    }
  }, [isopen]);

  const refreshData = () => {
    setScheduledPosts(socialScheduler.getScheduledPosts());
    setStats(socialScheduler.getStats());
    setConfig(socialScheduler.getConfig());
  };

  if (!isopen) return null;

  const handleSchedulePost = () => {
    if (!selectedBlogPost) {
      toast.error('Select a blog post');
      return;
    }

    if (!scheduleDate) {
      toast.error('Select a date and time');
      return;
    }

    if (selectedPlatforms.length === 0) {
      toast.error('Select at least one platform');
      return;
    }

    const blogPost = posts.find(p => p.id === selectedBlogPost);
    if (!blogPost) return;

    const content = `${blogPost.seoTitle || 'New Blog Post'}\n\n${blogPost.metaDescription || ''}`;

    const post = socialScheduler.schedulePost({
      content,
      platforms: selectedPlatforms,
      scheduledDate: new Date(scheduleDate),
      caption: content,
      hashtags: [blogPost.primaryKeyword, ...(blogPost.secondaryKeywords || [])].filter(Boolean).map(k => `#${k.replace(/\s+/g, '')}`),
      mediaType: 'text',
    });

    toast.success(`Scheduled for ${selectedPlatforms.join(', ')}!`);
    refreshData();
    setSelectedBlogPost('');
    setScheduleDate('');
  };

  const handleBulkSchedule = () => {
    if (selectedPlatforms.length === 0) {
      toast.error('Select platforms first');
      return;
    }

    const now = new Date();
    now.setHours(now.getHours() + 1);

    let scheduled = 0;

    posts.slice(0, 10).forEach((post, index) => {
      const content = `${post.seoTitle || 'New Post'}\n\n${post.metaDescription || ''}`;
      const postDate = new Date(now);
      postDate.setHours(postDate.getHours() + (index * 24)); // Spread over days

      selectedPlatforms.forEach(platform => {
        socialScheduler.schedulePost({
          content,
          platforms: [platform],
          scheduledDate: postDate,
          caption: content,
          hashtags: [post.primaryKeyword || 'blog'].map(k => `#${k.replace(/\s+/g, '')}`),
          mediaType: 'text',
        });
        scheduled++;
      });
    });

    toast.success(`Scheduled ${scheduled} posts across platforms!`);
    refreshData();
  };

  const handlePostNow = async (postId: string) => {
    const success = await socialScheduler.postNow(postId);
    if (success) {
      toast.success('Posted successfully!');
    } else {
      toast.error('Failed to post');
    }
    refreshData();
  };

  const handleDeletePost = (postId: string) => {
    if (confirm('Delete this scheduled post?')) {
      socialScheduler.deletePost(postId);
      toast.success('Post deleted');
      refreshData();
    }
  };

  const updateConfig = (updates: Partial<ScheduleConfig>) => {
    socialScheduler.updateConfig(updates);
    setConfig(socialScheduler.getConfig());
    toast.success('Settings updated');
  };

  const getPlatformIcon = (platform: SocialPlatform) => {
    return PLATFORM_SPECS[platform]?.icon || '📱';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'posted': return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30';
      case 'scheduled': return 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30';
      case 'failed': return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30';
      default: return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/30';
    }
  };

  const renderScheduleView = () => (
    <div className="space-y-6">
      {/* Quick Schedule */}
      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
        <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-4">Quick Schedule</h3>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Select Blog Post
            </label>
            <select
              value={selectedBlogPost}
              onChange={(e) => setSelectedBlogPost(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Choose a post...</option>
              {posts.map(post => (
                <option key={post.id} value={post.id}>
                  {post.seoTitle || 'Untitled'} ({post.duration}sec)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Schedule Date & Time
            </label>
            <input
              type="datetime-local"
              value={scheduleDate}
              onChange={(e) => setScheduleDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Select Platforms
          </label>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            {(Object.keys(PLATFORM_SPECS) as SocialPlatform[]).map(platform => (
              <button
                key={platform}
                onClick={() => {
                  if (selectedPlatforms.includes(platform)) {
                    setSelectedPlatforms(selectedPlatforms.filter(p => p !== platform));
                  } else {
                    setSelectedPlatforms([...selectedPlatforms, platform]);
                  }
                }}
                className={`p-3 rounded-lg border transition-all ${selectedPlatforms.includes(platform)
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                  : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600'
                  }`}
              >
                <div className="text-2xl mb-1">{getPlatformIcon(platform)}</div>
                <div className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  {PLATFORM_SPECS[platform]?.name}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={handleSchedulePost}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold flex items-center justify-center gap-2"
          >
            <Calendar className="w-4 h-4" />
            Schedule Post
          </button>
          <button
            onClick={handleBulkSchedule}
            className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold flex items-center justify-center gap-2"
          >
            <Zap className="w-4 h-4" />
            Bulk Schedule (10 posts)
          </button>
        </div>
      </div>
    </div>
  );

  const renderQueueView = () => (
    <div className="space-y-4">
      {scheduledPosts.length === 0 ? (
        <div className="text-center py-16">
          <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No scheduled posts</h3>
          <p className="text-gray-500 dark:text-gray-400">Schedule your first post to get started</p>
        </div>
      ) : (
        scheduledPosts.map(post => (
          <div
            key={post.id}
            className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {post.platforms.map(platform => (
                    <span key={platform} className="text-lg">
                      {getPlatformIcon(platform)}
                    </span>
                  ))}
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusColor(post.status)}`}>
                    {post.status}
                  </span>
                </div>

                <p className="text-sm text-gray-900 dark:text-gray-100 mb-2 line-clamp-2">
                  {post.caption}
                </p>

                <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(post.scheduledDate).toLocaleString()}
                  </div>
                  {post.hashtags.length > 0 && (
                    <div className="flex gap-1">
                      {post.hashtags.slice(0, 3).map((tag, idx) => (
                        <span key={idx}>{tag}</span>
                      ))}
                      {post.hashtags.length > 3 && <span>+{post.hashtags.length - 3}</span>}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                {post.status === 'scheduled' && (
                  <button
                    onClick={() => handlePostNow(post.id)}
                    className="p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                    title="Post Now"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => handleDeletePost(post.id)}
                  className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                  title="Delete"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );

  const renderAnalyticsView = () => (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Posts', value: stats.total, icon: Calendar, color: 'blue' },
          { label: 'Scheduled', value: stats.scheduled, icon: Clock, color: 'yellow' },
          { label: 'Published', value: stats.posted, icon: CheckCircle, color: 'green' },
          { label: 'Failed', value: stats.failed, icon: XCircle, color: 'red' },
        ].map((stat, idx) => (
          <div key={idx} className={`bg-${stat.color}-50 dark:bg-${stat.color}-900/20 rounded-xl p-4 border border-${stat.color}-200 dark:border-${stat.color}-800`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stat.value}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">{stat.label}</div>
              </div>
              <stat.icon className={`w-8 h-8 text-${stat.color}-600 dark:text-${stat.color}-400`} />
            </div>
          </div>
        ))}
      </div>

      {/* Platform Breakdown */}
      <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-4">Posts by Platform</h3>
        <div className="space-y-3">
          {(Object.entries(stats.byPlatform) as [SocialPlatform, number][]).map(([platform, count]) => (
            <div key={platform} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{getPlatformIcon(platform)}</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {PLATFORM_SPECS[platform]?.name || platform}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all"
                    style={{ width: `${stats.total > 0 ? (count / stats.total) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-sm font-bold text-gray-900 dark:text-gray-100 w-8 text-right">
                  {count}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Best Posting Times */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800">
        <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          Optimal Posting Times
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          {selectedPlatforms.length > 0 ? (
            selectedPlatforms.map(platform => (
              <div key={platform} className="bg-white dark:bg-gray-800 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">{getPlatformIcon(platform)}</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {PLATFORM_SPECS[platform]?.name}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {PLATFORM_SPECS[platform]?.bestPostTimes.map((time, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-xs font-semibold"
                    >
                      {time}
                    </span>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-2 text-center text-gray-500 dark:text-gray-400 py-4">
              Select platforms to see optimal times
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderSettingsView = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-4">Posting Frequency</h3>

        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Posts per Day
            </label>
            <input
              type="number"
              min="1"
              max="20"
              value={config.postsPerDay}
              onChange={(e) => updateConfig({ postsPerDay: parseInt(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Posts per Week
            </label>
            <input
              type="number"
              min="1"
              max="50"
              value={config.postsPerWeek}
              onChange={(e) => updateConfig({ postsPerWeek: parseInt(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Posts per Month
            </label>
            <input
              type="number"
              min="1"
              max="200"
              value={config.postsPerMonth}
              onChange={(e) => updateConfig({ postsPerMonth: parseInt(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-4">Auto-Post Settings</h3>

        <label className="flex items-center gap-3 mb-4">
          <input
            type="checkbox"
            checked={config.autoPost}
            onChange={(e) => updateConfig({ autoPost: e.target.checked })}
            className="rounded"
          />
          <span className="text-gray-900 dark:text-gray-100">
            Enable automatic posting (posts will be published automatically at scheduled time)
          </span>
        </label>

        {config.autoPost && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-800 dark:text-yellow-200">
                Auto-posting requires platform authentication. Make sure you've connected your social media accounts.
              </div>
            </div>
          </div>
        )}
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
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Social Media Scheduler Pro</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Multi-platform content publishing & analytics
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
              { mode: 'schedule', label: 'Schedule', icon: Calendar },
              { mode: 'queue', label: 'Queue', icon: Clock },
              { mode: 'analytics', label: 'Analytics', icon: BarChart3 },
              { mode: 'settings', label: 'Settings', icon: Settings },
            ].map((tab) => (
              <button
                key={tab.mode}
                onClick={() => setViewMode(tab.mode as ViewMode)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all ${viewMode === tab.mode
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {viewMode === 'schedule' && renderScheduleView()}
          {viewMode === 'queue' && renderQueueView()}
          {viewMode === 'analytics' && renderAnalyticsView()}
          {viewMode === 'settings' && renderSettingsView()}
        </div>
      </div>
    </div>
  );
}
