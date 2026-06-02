import React, { useState, useEffect } from 'react';
import {
  Clock, Send, CheckCircle, AlertCircle, RefreshCw, Trash2,
  Play, Pause, Calendar, Filter, ChevronDown, Zap, RotateCcw
} from 'lucide-react';

interface ScheduledPost {
  id: string;
  content: string;
  platforms: string[];
  accountIds: string[];
  mediaUrls: string[];
  scheduledTime: number | null;
  status: 'draft' | 'scheduled' | 'queued' | 'publishing' | 'published' | 'failed';
  createdAt: number;
  aiScore?: number;
  retryCount?: number;
  publishedAt?: number;
  error?: string;
}

interface SocialSchedulerProps {
  posts: ScheduledPost[];
  onUpdatePost: (post: ScheduledPost) => void;
  onDeletePost: (postId: string) => void;
  onRetryPost: (postId: string) => void;
}

const statusConfig: Record<string, { icon: any; color: string; bg: string; label: string }> = {
  draft: { icon: Clock, color: 'text-gray-500', bg: 'bg-gray-100', label: 'Draft' },
  scheduled: { icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-100', label: 'Scheduled' },
  queued: { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-100', label: 'Queued' },
  publishing: { icon: RefreshCw, color: 'text-indigo-600', bg: 'bg-indigo-100', label: 'Publishing' },
  published: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100', label: 'Published' },
  failed: { icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-100', label: 'Failed' },
};

const platformColors: Record<string, string> = {
  facebook: 'bg-blue-500',
  instagram: 'bg-gradient-to-r from-purple-500 to-pink-500',
  tiktok: 'bg-black',
  twitter: 'bg-sky-500',
  linkedin: 'bg-blue-700',
  pinterest: 'bg-red-600',
  youtube: 'bg-red-600',
};

export function SocialScheduler({ posts, onUpdatePost, onDeletePost, onRetryPost }: SocialSchedulerProps) {
  const [filter, setFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'scheduled'>('scheduled');

  // Queue engine: auto-process scheduled posts
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      posts.forEach(post => {
        if (post.status === 'scheduled' && post.scheduledTime && post.scheduledTime <= now) {
          onUpdatePost({ ...post, status: 'queued' });
        }
        if (post.status === 'queued') {
          // Simulate publishing
          onUpdatePost({ ...post, status: 'publishing' });
          setTimeout(() => {
            const success = Math.random() > 0.15; // 85% success rate
            if (success) {
              onUpdatePost({ ...post, status: 'published', publishedAt: Date.now() });
            } else {
              const retryCount = (post.retryCount || 0) + 1;
              if (retryCount >= 3) {
                onUpdatePost({ ...post, status: 'failed', retryCount, error: 'Max retries exceeded' });
              } else {
                // Exponential backoff retry
                const retryDelay = retryCount === 1 ? 60000 : retryCount === 2 ? 300000 : 900000;
                onUpdatePost({
                  ...post,
                  status: 'scheduled',
                  scheduledTime: Date.now() + retryDelay,
                  retryCount,
                });
              }
            }
          }, 2000);
        }
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [posts]);

  const filteredPosts = posts
    .filter(p => filter === 'all' || p.status === filter)
    .sort((a, b) => {
      if (sortBy === 'scheduled') {
        return (a.scheduledTime || a.createdAt) - (b.scheduledTime || b.createdAt);
      }
      return b.createdAt - a.createdAt;
    });

  const stats = {
    total: posts.length,
    scheduled: posts.filter(p => p.status === 'scheduled').length,
    published: posts.filter(p => p.status === 'published').length,
    failed: posts.filter(p => p.status === 'failed').length,
    queued: posts.filter(p => p.status === 'queued' || p.status === 'publishing').length,
  };

  return (
    <div className="space-y-6">
      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Total Posts', value: stats.total, color: 'bg-gray-100 text-gray-700' },
          { label: 'Scheduled', value: stats.scheduled, color: 'bg-blue-100 text-blue-700' },
          { label: 'In Queue', value: stats.queued, color: 'bg-yellow-100 text-yellow-700' },
          { label: 'Published', value: stats.published, color: 'bg-green-100 text-green-700' },
          { label: 'Failed', value: stats.failed, color: 'bg-red-100 text-red-700' },
        ].map(stat => (
          <div key={stat.label} className={`${stat.color} rounded-xl p-4 text-center`}>
            <p className="text-2xl font-black">{stat.value}</p>
            <p className="text-xs font-bold uppercase tracking-wider opacity-70">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          {['all', 'scheduled', 'queued', 'publishing', 'published', 'failed'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-md text-xs font-bold capitalize transition-all ${
                filter === f ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="px-3 py-1.5 bg-white border rounded-lg text-xs font-bold text-gray-600"
          >
            <option value="scheduled">Sort: Schedule Time</option>
            <option value="newest">Sort: Newest First</option>
          </select>
        </div>
      </div>

      {/* Posts List */}
      {filteredPosts.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">No posts {filter !== 'all' ? `with status "${filter}"` : 'yet'}</p>
          <p className="text-sm text-gray-400 mt-1">Create posts in the Compose tab to see them here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredPosts.map(post => {
            const status = statusConfig[post.status] || statusConfig.draft;
            const StatusIcon = status.icon;
            const isAnimated = post.status === 'publishing';

            return (
              <div key={post.id} className="bg-white border-2 border-gray-200 rounded-xl p-5 hover:shadow-md transition-all">
                <div className="flex items-start gap-4">
                  {/* Status */}
                  <div className={`p-2 rounded-lg ${status.bg} flex-shrink-0`}>
                    <StatusIcon className={`w-5 h-5 ${status.color} ${isAnimated ? 'animate-spin' : ''}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${status.bg} ${status.color}`}>
                        {status.label}
                      </span>
                      {post.retryCount && post.retryCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-600">
                          Retry #{post.retryCount}
                        </span>
                      )}
                      {post.aiScore && (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                          post.aiScore >= 80 ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'
                        }`}>
                          Score: {post.aiScore}
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-gray-800 line-clamp-2 mb-2">{post.content}</p>

                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      {/* Platforms */}
                      <div className="flex items-center gap-1">
                        {post.platforms.map(p => (
                          <span key={p} className={`w-4 h-4 rounded ${platformColors[p] || 'bg-gray-400'}`} />
                        ))}
                      </div>

                      {post.scheduledTime && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(post.scheduledTime).toLocaleString()}
                        </span>
                      )}

                      {post.publishedAt && (
                        <span className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="w-3 h-3" />
                          Published {new Date(post.publishedAt).toLocaleString()}
                        </span>
                      )}

                      {post.error && (
                        <span className="flex items-center gap-1 text-red-500">
                          <AlertCircle className="w-3 h-3" />
                          {post.error}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {post.status === 'failed' && (
                      <button
                        onClick={() => onRetryPost(post.id)}
                        className="p-2 hover:bg-orange-50 rounded-lg text-orange-600 transition-colors"
                        title="Retry"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    )}
                    {(post.status === 'draft' || post.status === 'scheduled') && (
                      <button
                        onClick={() => onDeletePost(post.id)}
                        className="p-2 hover:bg-red-50 rounded-lg text-red-600 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
