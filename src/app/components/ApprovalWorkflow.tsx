// =============================================================================
// APPROVAL WORKFLOW — Content Review & Publishing Dashboard
// =============================================================================

import React, { useState, useEffect } from 'react';
import { X, CheckCircle, XCircle, Clock, AlertCircle, MessageSquare, Send, Filter, UserCheck } from 'lucide-react';
import {
  getApprovalRequests,
  submitReview,
  addReviewComment,
  resolveComment,
  getApprovalStats,
  getPendingReviews,
  getOverdueRequests,
  type ApprovalRequest,
  type ApprovalStatus,
  type ReviewDecision
} from '../utils/approvalWorkflow';
import { toast } from 'sonner';
import type { BlogPost } from '../utils/blogGenerator';

interface ApprovalWorkflowProps {
  isopen: boolean;
  onClose: () => void;
  posts: BlogPost[];
  currentUserId: string;
}

type ViewMode = 'inbox' | 'submitted' | 'completed';

export function ApprovalWorkflow({ isopen, onClose, posts, currentUserId }: ApprovalWorkflowProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('inbox');
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null);
  const [filterStatus, setFilterStatus] = useState<ApprovalStatus | 'all'>('all');
  const [reviewDecision, setReviewDecision] = useState<ReviewDecision>('approve');
  const [reviewComment, setReviewComment] = useState('');
  const [stats, setStats] = useState(getApprovalStats(currentUserId));

  useEffect(() => {
    if (isopen) {
      refreshData();
    }
  }, [isopen, viewMode, filterStatus]);

  const refreshData = () => {
    let filtered: ApprovalRequest[];

    switch (viewMode) {
      case 'inbox':
        filtered = getPendingReviews(currentUserId);
        break;
      case 'submitted':
        filtered = getApprovalRequests({ submittedBy: currentUserId });
        break;
      case 'completed':
        filtered = getApprovalRequests({ reviewerId: currentUserId });
        break;
      default:
        filtered = getApprovalRequests();
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(r => r.status === filterStatus);
    }

    setRequests(filtered);
    setStats(getApprovalStats(currentUserId));
  };

  if (!isopen) return null;

  const handleSubmitReview = () => {
    if (!selectedRequest) return;

    try {
      const comments = reviewComment.trim()
        ? [{
          id: `comment-${Date.now()}`,
          text: reviewComment,
          createdAt: new Date(),
          resolved: false,
        }]
        : [];

      submitReview(selectedRequest.id, reviewDecision, comments);
      toast.success(`Review submitted: ${reviewDecision}`);
      setReviewComment('');
      setSelectedRequest(null);
      refreshData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const getStatusColor = (status: ApprovalStatus) => {
    switch (status) {
      case 'draft': return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/30';
      case 'pending_review': return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30';
      case 'approved': return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30';
      case 'rejected': return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30';
      case 'published': return 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30';
    }
  };

  const getStatusIcon = (status: ApprovalStatus) => {
    switch (status) {
      case 'pending_review': return <Clock className="w-4 h-4" />;
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'rejected': return <XCircle className="w-4 h-4" />;
      case 'published': return <Send className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 dark:text-red-400';
      case 'high': return 'text-orange-600 dark:text-orange-400';
      case 'medium': return 'text-yellow-600 dark:text-yellow-400';
      case 'low': return 'text-green-600 dark:text-green-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const renderRequestList = () => (
    <div className="space-y-3">
      {requests.length === 0 ? (
        <div className="text-center py-16">
          <UserCheck className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            {viewMode === 'inbox' ? 'No pending reviews' : 'No requests found'}
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            {viewMode === 'inbox' ? 'You\'re all caught up!' : 'Check back later'}
          </p>
        </div>
      ) : (
        requests.map(request => {
          const post = posts.find(p => p.id === request.contentId);
          const isOverdue = request.deadline && request.deadline < new Date();

          return (
            <div
              key={request.id}
              onClick={() => setSelectedRequest(request)}
              className={`bg-white dark:bg-gray-900 rounded-xl p-4 border transition-all cursor-pointer ${selectedRequest?.id === request.id
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600'
                }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                      {request.title}
                    </h3>
                    {isOverdue && (
                      <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                    )}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {post?.metaDescription?.substring(0, 120) || 'No description'}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${getStatusColor(request.status)}`}>
                    {getStatusIcon(request.status)}
                    {request.status.replace('_', ' ')}
                  </span>
                  <span className={`text-xs font-bold ${getPriorityColor(request.priority)}`}>
                    {request.priority.toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {request.submittedAt.toLocaleDateString()}
                </div>

                <div className="flex items-center gap-1">
                  <UserCheck className="w-3 h-3" />
                  {request.reviewers.length} reviewer{request.reviewers.length !== 1 ? 's' : ''}
                </div>

                <div className="flex items-center gap-1">
                  <MessageSquare className="w-3 h-3" />
                  {request.reviews.reduce((sum, r) => sum + r.comments.length, 0)} comment{request.reviews.reduce((sum, r) => sum + r.comments.length, 0) !== 1 ? 's' : ''}
                </div>

                {request.deadline && (
                  <div className={`flex items-center gap-1 ${isOverdue ? 'text-red-600 dark:text-red-400 font-semibold' : ''}`}>
                    Due: {request.deadline.toLocaleDateString()}
                  </div>
                )}
              </div>

              {/* Progress Bar */}
              {request.status === 'pending_review' && (
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-600 dark:text-gray-400">Review Progress</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {request.reviews.length} / {request.reviewers.length}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                    <div
                      className="bg-blue-500 h-1.5 rounded-full transition-all"
                      style={{ width: `${(request.reviews.length / request.reviewers.length) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );

  const renderReviewDetail = () => {
    if (!selectedRequest) return null;

    const post = posts.find(p => p.id === selectedRequest.contentId);
    const hasReviewed = selectedRequest.reviews.some(r => r.reviewerId === currentUserId);
    const canReview = selectedRequest.reviewers.includes(currentUserId) && !hasReviewed;

    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden h-full flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {selectedRequest.title}
            </h3>
            <button
              onClick={() => setSelectedRequest(null)}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${getStatusColor(selectedRequest.status)}`}>
              {getStatusIcon(selectedRequest.status)}
              {selectedRequest.status.replace('_', ' ')}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Submitted {selectedRequest.submittedAt.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Content Preview */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="mb-6">
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Content Preview</h4>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-sm text-gray-700 dark:text-gray-300">
              {post?.content.substring(0, 500) || 'No preview available'}...
            </div>
          </div>

          {/* Reviews */}
          <div className="mb-6">
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
              Reviews ({selectedRequest.reviews.length})
            </h4>

            {selectedRequest.reviews.length === 0 ? (
              <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                No reviews yet
              </div>
            ) : (
              <div className="space-y-3">
                {selectedRequest.reviews.map(review => (
                  <div key={review.id} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-semibold text-gray-900 dark:text-gray-100">
                        {review.reviewerName}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${review.decision === 'approve'
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                          : review.decision === 'reject'
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                            : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                          }`}>
                          {review.decision.replace('_', ' ')}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {review.reviewedAt.toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {review.comments.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {review.comments.map(comment => (
                          <div key={comment.id} className="bg-white dark:bg-gray-900 rounded p-3 text-sm">
                            <div className="text-gray-700 dark:text-gray-300 mb-1">{comment.text}</div>
                            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                              <span>{comment.createdAt.toLocaleString()}</span>
                              {comment.resolved && (
                                <span className="text-green-600 dark:text-green-400 font-semibold">
                                  ✓ Resolved
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Review Form */}
          {canReview && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Submit Your Review</h4>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Decision
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'approve', label: 'Approve', color: 'green' },
                      { value: 'request_changes', label: 'Request Changes', color: 'yellow' },
                      { value: 'reject', label: 'Reject', color: 'red' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setReviewDecision(option.value as ReviewDecision)}
                        className={`p-2 rounded-lg border transition-all text-sm font-semibold ${reviewDecision === option.value
                          ? `border-${option.color}-500 bg-${option.color}-100 dark:bg-${option.color}-900/30 text-${option.color}-700 dark:text-${option.color}-300`
                          : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
                          }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Comments (Optional)
                  </label>
                  <textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Add your feedback..."
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <button
                  onClick={handleSubmitReview}
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                >
                  Submit Review
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Approval Workflow</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Review and approve content before publishing
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

        {/* Stats */}
        <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-5 gap-3">
            {[
              { label: 'Pending', value: stats.pending, color: 'yellow' },
              { label: 'Approved', value: stats.approved, color: 'green' },
              { label: 'Rejected', value: stats.rejected, color: 'red' },
              { label: 'Avg Review Time', value: `${stats.avgReviewTime}h`, color: 'blue' },
              { label: 'Overdue', value: stats.overdueCount, color: 'red' },
            ].map((stat, idx) => (
              <div key={idx} className="bg-white dark:bg-gray-800 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stat.value}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs & Filters */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {[
                { mode: 'inbox', label: 'My Reviews' },
                { mode: 'submitted', label: 'Submitted' },
                { mode: 'completed', label: 'Completed' },
              ].map((tab) => (
                <button
                  key={tab.mode}
                  onClick={() => setViewMode(tab.mode as ViewMode)}
                  className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${viewMode === tab.mode
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as ApprovalStatus | 'all')}
                className="px-3 py-1 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
              >
                <option value="all">All Status</option>
                <option value="pending_review">Pending Review</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="published">Published</option>
              </select>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex gap-4 p-4">
          <div className="flex-1 overflow-y-auto">
            {renderRequestList()}
          </div>

          {selectedRequest && (
            <div className="w-1/2 overflow-hidden">
              {renderReviewDetail()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
