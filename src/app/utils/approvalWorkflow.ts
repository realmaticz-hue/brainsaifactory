// =============================================================================
// APPROVAL WORKFLOW — Content Review & Publishing Pipeline
// =============================================================================

export type ApprovalStatus = 'draft' | 'pending_review' | 'approved' | 'rejected' | 'published';
export type ReviewDecision = 'approve' | 'reject' | 'request_changes';

export interface ApprovalRequest {
  id: string;
  contentId: string;
  contentType: 'blog_post' | 'social_post' | 'email';
  title: string;
  submittedBy: string;
  submittedAt: Date;
  status: ApprovalStatus;
  reviewers: string[];
  reviews: Review[];
  deadline?: Date;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  metadata?: {
    wordCount?: number;
    platforms?: string[];
    scheduledDate?: Date;
  };
}

export interface Review {
  id: string;
  reviewerId: string;
  reviewerName: string;
  decision: ReviewDecision;
  comments: ReviewComment[];
  reviewedAt: Date;
}

export interface ReviewComment {
  id: string;
  text: string;
  lineNumber?: number;
  section?: string;
  createdAt: Date;
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: Date;
}

export interface ApprovalWorkflowSettings {
  autoApprove: boolean;
  requiredApprovals: number;
  allowSelfApproval: boolean;
  notifyReviewers: boolean;
  escalationEnabled: boolean;
  escalationHours: number;
}

/**
 * Get all approval requests
 */
export function getApprovalRequests(filter?: {
  status?: ApprovalStatus;
  reviewerId?: string;
  submittedBy?: string;
}): ApprovalRequest[] {
  const stored = localStorage.getItem('approvalRequests');
  if (!stored) return [];

  let requests = JSON.parse(stored) as ApprovalRequest[];

  // Convert dates
  requests = requests.map(req => ({
    ...req,
    submittedAt: new Date(req.submittedAt),
    deadline: req.deadline ? new Date(req.deadline) : undefined,
    reviews: req.reviews.map(rev => ({
      ...rev,
      reviewedAt: new Date(rev.reviewedAt),
      comments: rev.comments.map(c => ({
        ...c,
        createdAt: new Date(c.createdAt),
        resolvedAt: c.resolvedAt ? new Date(c.resolvedAt) : undefined,
      })),
    })),
  }));

  // Apply filters
  if (filter?.status) {
    requests = requests.filter(r => r.status === filter.status);
  }

  if (filter?.reviewerId) {
    requests = requests.filter(r => r.reviewers.includes(filter.reviewerId));
  }

  if (filter?.submittedBy) {
    requests = requests.filter(r => r.submittedBy === filter.submittedBy);
  }

  return requests;
}

/**
 * Save approval requests
 */
function saveApprovalRequests(requests: ApprovalRequest[]): void {
  localStorage.setItem('approvalRequests', JSON.stringify(requests));
}

/**
 * Submit content for approval
 */
export function submitForApproval(
  contentId: string,
  contentType: ApprovalRequest['contentType'],
  title: string,
  reviewers: string[],
  options?: {
    deadline?: Date;
    priority?: ApprovalRequest['priority'];
    metadata?: ApprovalRequest['metadata'];
  }
): ApprovalRequest {
  const requests = getApprovalRequests();
  const currentUserId = getCurrentUserId();

  const request: ApprovalRequest = {
    id: `approval-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    contentId,
    contentType,
    title,
    submittedBy: currentUserId,
    submittedAt: new Date(),
    status: 'pending_review',
    reviewers,
    reviews: [],
    deadline: options?.deadline,
    priority: options?.priority || 'medium',
    metadata: options?.metadata,
  };

  requests.push(request);
  saveApprovalRequests(requests);

  return request;
}

/**
 * Submit review
 */
export function submitReview(
  requestId: string,
  decision: ReviewDecision,
  comments?: ReviewComment[]
): void {
  const requests = getApprovalRequests();
  const request = requests.find(r => r.id === requestId);

  if (!request) {
    throw new Error('Approval request not found');
  }

  if (request.status !== 'pending_review') {
    throw new Error('Request is not pending review');
  }

  const currentUserId = getCurrentUserId();

  if (!request.reviewers.includes(currentUserId)) {
    throw new Error('You are not assigned as a reviewer');
  }

  // Check if already reviewed
  if (request.reviews.some(r => r.reviewerId === currentUserId)) {
    throw new Error('You have already reviewed this request');
  }

  const review: Review = {
    id: `review-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    reviewerId: currentUserId,
    reviewerName: 'Reviewer', // In production, get from user profile
    decision,
    comments: comments || [],
    reviewedAt: new Date(),
  };

  request.reviews.push(review);

  // Update status based on reviews
  updateApprovalStatus(request);

  saveApprovalRequests(requests);
}

/**
 * Update approval status based on reviews
 */
function updateApprovalStatus(request: ApprovalRequest): void {
  const settings = getWorkflowSettings();

  // Count approvals and rejections
  const approvals = request.reviews.filter(r => r.decision === 'approve').length;
  const rejections = request.reviews.filter(r => r.decision === 'reject').length;

  // If any rejection, mark as rejected
  if (rejections > 0) {
    request.status = 'rejected';
    return;
  }

  // If enough approvals, mark as approved
  if (approvals >= settings.requiredApprovals) {
    request.status = 'approved';
    return;
  }

  // Otherwise, still pending
  request.status = 'pending_review';
}

/**
 * Add comment to review
 */
export function addReviewComment(
  requestId: string,
  text: string,
  options?: {
    lineNumber?: number;
    section?: string;
  }
): ReviewComment {
  const requests = getApprovalRequests();
  const request = requests.find(r => r.id === requestId);

  if (!request) {
    throw new Error('Approval request not found');
  }

  const currentUserId = getCurrentUserId();
  const review = request.reviews.find(r => r.reviewerId === currentUserId);

  if (!review) {
    throw new Error('You must submit a review first');
  }

  const comment: ReviewComment = {
    id: `comment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    text,
    lineNumber: options?.lineNumber,
    section: options?.section,
    createdAt: new Date(),
    resolved: false,
  };

  review.comments.push(comment);
  saveApprovalRequests(requests);

  return comment;
}

/**
 * Resolve comment
 */
export function resolveComment(
  requestId: string,
  commentId: string
): void {
  const requests = getApprovalRequests();
  const request = requests.find(r => r.id === requestId);

  if (!request) {
    throw new Error('Approval request not found');
  }

  const currentUserId = getCurrentUserId();

  // Find comment in any review
  for (const review of request.reviews) {
    const comment = review.comments.find(c => c.id === commentId);
    if (comment) {
      comment.resolved = true;
      comment.resolvedBy = currentUserId;
      comment.resolvedAt = new Date();
      saveApprovalRequests(requests);
      return;
    }
  }

  throw new Error('Comment not found');
}

/**
 * Withdraw approval request
 */
export function withdrawRequest(requestId: string): void {
  const requests = getApprovalRequests();
  const request = requests.find(r => r.id === requestId);

  if (!request) {
    throw new Error('Approval request not found');
  }

  const currentUserId = getCurrentUserId();

  if (request.submittedBy !== currentUserId) {
    throw new Error('Only the submitter can withdraw the request');
  }

  if (request.status === 'published') {
    throw new Error('Cannot withdraw published content');
  }

  request.status = 'draft';
  saveApprovalRequests(requests);
}

/**
 * Mark as published
 */
export function markAsPublished(requestId: string): void {
  const requests = getApprovalRequests();
  const request = requests.find(r => r.id === requestId);

  if (!request) {
    throw new Error('Approval request not found');
  }

  if (request.status !== 'approved') {
    throw new Error('Content must be approved before publishing');
  }

  request.status = 'published';
  saveApprovalRequests(requests);
}

/**
 * Get workflow settings
 */
export function getWorkflowSettings(): ApprovalWorkflowSettings {
  const stored = localStorage.getItem('approvalWorkflowSettings');
  if (!stored) {
    return {
      autoApprove: false,
      requiredApprovals: 1,
      allowSelfApproval: false,
      notifyReviewers: true,
      escalationEnabled: true,
      escalationHours: 48,
    };
  }

  return JSON.parse(stored);
}

/**
 * Update workflow settings
 */
export function updateWorkflowSettings(settings: Partial<ApprovalWorkflowSettings>): void {
  const current = getWorkflowSettings();
  const updated = { ...current, ...settings };
  localStorage.setItem('approvalWorkflowSettings', JSON.stringify(updated));
}

/**
 * Get approval statistics
 */
export function getApprovalStats(userId?: string): {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  published: number;
  avgReviewTime: number; // hours
  overdueCount: number;
} {
  const requests = getApprovalRequests(userId ? { reviewerId: userId } : undefined);
  const now = new Date();

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending_review').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
    published: requests.filter(r => r.status === 'published').length,
    avgReviewTime: 0,
    overdueCount: 0,
  };

  // Calculate average review time
  const reviewedRequests = requests.filter(r => r.reviews.length > 0);
  if (reviewedRequests.length > 0) {
    const totalTime = reviewedRequests.reduce((sum, req) => {
      const firstReview = req.reviews[0];
      const timeDiff = firstReview.reviewedAt.getTime() - req.submittedAt.getTime();
      return sum + timeDiff;
    }, 0);

    stats.avgReviewTime = Math.round(totalTime / reviewedRequests.length / (1000 * 60 * 60)); // hours
  }

  // Count overdue
  stats.overdueCount = requests.filter(r => {
    return r.status === 'pending_review' && r.deadline && r.deadline < now;
  }).length;

  return stats;
}

/**
 * Get pending reviews for user
 */
export function getPendingReviews(userId: string): ApprovalRequest[] {
  return getApprovalRequests({ status: 'pending_review', reviewerId: userId })
    .filter(req => !req.reviews.some(r => r.reviewerId === userId));
}

/**
 * Get overdue requests
 */
export function getOverdueRequests(): ApprovalRequest[] {
  const now = new Date();
  return getApprovalRequests({ status: 'pending_review' })
    .filter(req => req.deadline && req.deadline < now)
    .sort((a, b) => {
      if (!a.deadline || !b.deadline) return 0;
      return a.deadline.getTime() - b.deadline.getTime();
    });
}

/**
 * Get current user ID
 */
function getCurrentUserId(): string {
  let userId = localStorage.getItem('userId');
  if (!userId) {
    userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('userId', userId);
  }
  return userId;
}

/**
 * Delete approval request
 */
export function deleteApprovalRequest(requestId: string): void {
  const requests = getApprovalRequests();
  const filtered = requests.filter(r => r.id !== requestId);
  saveApprovalRequests(filtered);
}

/**
 * Bulk approve requests
 */
export function bulkApprove(requestIds: string[]): void {
  const requests = getApprovalRequests();

  requestIds.forEach(id => {
    const request = requests.find(r => r.id === id);
    if (request && request.status === 'pending_review') {
      submitReview(id, 'approve');
    }
  });
}

/**
 * Reassign reviewers
 */
export function reassignReviewers(
  requestId: string,
  newReviewers: string[]
): void {
  const requests = getApprovalRequests();
  const request = requests.find(r => r.id === requestId);

  if (!request) {
    throw new Error('Approval request not found');
  }

  request.reviewers = newReviewers;
  saveApprovalRequests(requests);
}
