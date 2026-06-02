import { useState, useEffect } from 'react';
import { Send, Image, Calendar, Tag, Folder, CheckCircle, XCircle, Loader } from 'lucide-react';
import {
  getWordPressClient,
  isWordPressConfigured,
  publishToWordPress,
  publishBulkToWordPress,
  syncCategoriesAndTags,
  type WordPressPost,
} from '../utils/wordpress/wordpressClient';
import type { BlogPost } from '../utils/blogGenerator';
import { toast } from 'sonner';
import { trackBlogPublish } from '../utils/analytics/analyticsTracker';

interface WordPressPublishModalProps {
  isopen: boolean;
  onClose: () => void;
  posts: BlogPost[];
  onPublished?: (postIds: string[], wordpressUrls: string[]) => void;
}

type PublishStatus = 'idle' | 'publishing' | 'success' | 'error';

interface PostPublishState {
  postId: string;
  status: PublishStatus;
  wordpressId?: number;
  wordpressUrl?: string;
  error?: string;
}

export function WordPressPublishModal({
  isopen,
  onClose,
  posts,
  onPublished,
}: WordPressPublishModalProps) {
  const [publishStatus, setPublishStatus] = useState<'draft' | 'publish'>('publish');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [publishStates, setPublishStates] = useState<PostPublishState[]>([]);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (isopen) {
      // Initialize publish states
      setPublishStates(
        posts.map(p => ({
          postId: p.id,
          status: 'idle' as PublishStatus,
        }))
      );
      setProgress(0);
    }
  }, [isopen, posts]);

  if (!isopen) return null;

  const isBulk = posts.length > 1;

  const handlePublish = async () => {
    if (!isWordPressConfigured()) {
      toast.error('WordPress not configured. Please configure it first.');
      return;
    }

    setPublishing(true);
    setProgress(0);

    try {
      // Prepare category and tags
      let categoryIds: number[] = [];
      let tagIds: number[] = [];

      if (category || tags) {
        const categoryNames = category ? [category] : [];
        const tagNames = tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [];

        const synced = await syncCategoriesAndTags(categoryNames, tagNames);
        if (synced) {
          categoryIds = synced.categories;
          tagIds = synced.tags;
        }
      }

      // Prepare WordPress posts
      const wpPosts: WordPressPost[] = posts.map(post => {
        const wpPost: WordPressPost = {
          title: post.seoTitle || `Blog Post - ${new Date(post.timestamp).toLocaleDateString()}`,
          content: post.content,
          excerpt: post.metaDescription || post.content.substring(0, 150) + '...',
          status: scheduleDate ? 'future' : publishStatus,
          categories: categoryIds,
          tags: tagIds,
          slug: post.slug,
        };

        if (scheduleDate) {
          wpPost.date = new Date(scheduleDate).toISOString();
        }

        if (post.metaDescription) {
          wpPost.meta = {
            description: post.metaDescription,
            keywords: [post.primaryKeyword, ...(post.secondaryKeywords || [])]
              .filter(Boolean)
              .join(', '),
          };
        }

        return wpPost;
      });

      // Publish posts
      if (isBulk) {
        // Bulk publish with progress tracking
        const results = await publishBulkToWordPress(wpPosts, undefined, (current, total) => {
          setProgress(Math.round((current / total) * 100));

          // Update individual post status
          setPublishStates(prev =>
            prev.map((state, idx) => {
              if (idx < current - 1) {
                return { ...state, status: 'success' as PublishStatus };
              } else if (idx === current - 1) {
                return { ...state, status: 'publishing' as PublishStatus };
              }
              return state;
            })
          );
        });

        // Update final states
        setPublishStates(prev =>
          prev.map((state, idx) => ({
            ...state,
            status: results[idx].success ? 'success' : 'error',
            wordpressId: results[idx].postId,
            wordpressUrl: results[idx].postUrl,
            error: results[idx].error,
          }))
        );

        const successCount = results.filter(r => r.success).length;
        if (successCount === results.length) {
          toast.success(`All ${successCount} posts published successfully!`);
        } else {
          toast.warning(`${successCount}/${results.length} posts published successfully`);
        }

        // Callback with published post IDs and URLs
        const publishedIds = posts
          .filter((_, idx) => results[idx].success)
          .map(p => p.id);
        const publishedUrls = results
          .filter(r => r.success && r.postUrl)
          .map(r => r.postUrl!);

        // Track successful WordPress publishes
        posts.forEach((post, idx) => {
          if (results[idx].success) {
            trackBlogPublish(post.id, 'wordpress', {
              wordpressUrl: results[idx].postUrl,
              wordpressId: results[idx].postId,
              title: post.seoTitle,
              bulk: true,
            });
          }
        });

        onPublished?.(publishedIds, publishedUrls);
      } else {
        // Single post publish
        setPublishStates([{ postId: posts[0].id, status: 'publishing' }]);

        const result = await publishToWordPress(wpPosts[0]);

        setPublishStates([{
          postId: posts[0].id,
          status: result.success ? 'success' : 'error',
          wordpressId: result.postId,
          wordpressUrl: result.postUrl,
          error: result.error,
        }]);

        if (result.success) {
          toast.success('Post published to WordPress!');
          onPublished?.([posts[0].id], result.postUrl ? [result.postUrl] : []);

          // Track successful WordPress publish
          trackBlogPublish(posts[0].id, 'wordpress', {
            wordpressUrl: result.postUrl,
            wordpressId: result.postId,
            title: posts[0].seoTitle,
          });
        } else {
          toast.error(`Failed to publish: ${result.error}`);
        }

        setProgress(100);
      }
    } catch (error) {
      console.error('[WordPress] Publish error:', error);
      toast.error('Failed to publish to WordPress');
      setPublishStates(prev =>
        prev.map(state => ({
          ...state,
          status: 'error' as PublishStatus,
          error: error instanceof Error ? error.message : 'Unknown error',
        }))
      );
    } finally {
      setPublishing(false);
    }
  };

  const allSuccess = publishStates.every(s => s.status === 'success');
  const anyError = publishStates.some(s => s.status === 'error');

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-2xl font-bold">
              Publish to WordPress
            </h2>
            <button
              onClick={onClose}
              disabled={publishing}
              className="text-white/80 hover:text-white transition-colors disabled:opacity-50"
            >
              <span className="text-2xl">×</span>
            </button>
          </div>
          <p className="text-white/90 text-sm">
            {isBulk
              ? `Publishing ${posts.length} blog posts to your WordPress site`
              : 'Publishing 1 blog post to your WordPress site'}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Configuration Not Found Warning */}
          {!isWordPressConfigured() && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <XCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-yellow-900">
                    WordPress Not Configured
                  </p>
                  <p className="text-xs text-yellow-700 mt-1">
                    Please configure your WordPress connection first in the WordPress Settings.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Post Settings */}
          <div className="space-y-4">
            {/* Publish Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setPublishStatus('publish')}
                  disabled={publishing}
                  className={`flex-1 px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${publishStatus === 'publish'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  Publish Immediately
                </button>
                <button
                  onClick={() => setPublishStatus('draft')}
                  disabled={publishing}
                  className={`flex-1 px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${publishStatus === 'draft'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  Save as Draft
                </button>
              </div>
            </div>

            {/* Schedule Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Schedule (Optional)
              </label>
              <input
                type="datetime-local"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                disabled={publishing || publishStatus === 'draft'}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              />
              <p className="text-xs text-gray-500 mt-1">
                Leave empty to publish immediately
              </p>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Folder className="w-4 h-4" />
                Category
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g., Technology, Marketing"
                disabled={publishing}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              />
              <p className="text-xs text-gray-500 mt-1">
                Will be created if it doesn't exist
              </p>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Tags (comma-separated)
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="e.g., AI, blogging, content marketing"
                disabled={publishing}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              />
              <p className="text-xs text-gray-500 mt-1">
                Separate multiple tags with commas
              </p>
            </div>
          </div>

          {/* Progress */}
          {publishing && isBulk && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-blue-900">
                  Publishing Progress
                </span>
                <span className="text-sm font-bold text-blue-700">{progress}%</span>
              </div>
              <div className="h-2 bg-blue-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Post Status List (for bulk) */}
          {isBulk && publishStates.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-900">Posts</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {publishStates.map((state, idx) => {
                  const post = posts[idx];
                  return (
                    <div
                      key={state.postId}
                      className={`p-3 rounded-lg border ${state.status === 'success'
                        ? 'bg-green-50 border-green-200'
                        : state.status === 'error'
                          ? 'bg-red-50 border-red-200'
                          : state.status === 'publishing'
                            ? 'bg-blue-50 border-blue-200'
                            : 'bg-gray-50 border-gray-200'
                        }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {post.seoTitle || `Post ${idx + 1}`}
                          </p>
                          {state.wordpressUrl && (
                            <a
                              href={state.wordpressUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:underline truncate block"
                            >
                              {state.wordpressUrl}
                            </a>
                          )}
                          {state.error && (
                            <p className="text-xs text-red-600 mt-0.5">{state.error}</p>
                          )}
                        </div>
                        <div className="flex-shrink-0">
                          {state.status === 'success' && (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          )}
                          {state.status === 'error' && (
                            <XCircle className="w-5 h-5 text-red-600" />
                          )}
                          {state.status === 'publishing' && (
                            <Loader className="w-5 h-5 text-blue-600 animate-spin" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Success/Error Summary */}
          {allSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm font-semibold text-green-900">
                    {isBulk ? 'All posts published successfully!' : 'Post published successfully!'}
                  </p>
                  <p className="text-xs text-green-700 mt-0.5">
                    Your content is now live on WordPress
                  </p>
                </div>
              </div>
            </div>
          )}

          {anyError && !allSuccess && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-600" />
                <div>
                  <p className="text-sm font-semibold text-red-900">
                    Some posts failed to publish
                  </p>
                  <p className="text-xs text-red-700 mt-0.5">
                    Check the error messages above for details
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex gap-3">
          <button
            onClick={onClose}
            disabled={publishing}
            className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors font-semibold"
          >
            {allSuccess ? 'Done' : 'Cancel'}
          </button>
          {!allSuccess && (
            <button
              onClick={handlePublish}
              disabled={publishing || !isWordPressConfigured()}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold flex items-center justify-center gap-2"
            >
              {publishing ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Publish to WordPress
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
