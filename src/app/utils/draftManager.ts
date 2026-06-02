// =============================================================================
// DRAFT MANAGER — Local Draft Storage
// =============================================================================

import type { BlogPost } from './blogGenerator';

export interface BlogDraft {
  id: string;
  postId: string;
  content: string;
  seoTitle?: string;
  metaDescription?: string;
  savedAt: number;
  autoSaved: boolean;
}

const DRAFTS_KEY = 'blog_drafts';
const MAX_DRAFTS = 100;

/**
 * Save a draft to localStorage
 */
export function saveDraft(postId: string, content: string, metadata?: Partial<BlogPost>, autoSaved = true): void {
  try {
    const drafts = getAllDrafts();

    const draft: BlogDraft = {
      id: `draft_${Date.now()}`,
      postId,
      content,
      seoTitle: metadata?.seoTitle,
      metaDescription: metadata?.metaDescription,
      savedAt: Date.now(),
      autoSaved,
    };

    // Remove old draft for this post if exists
    const filtered = drafts.filter(d => d.postId !== postId);

    // Add new draft
    filtered.unshift(draft);

    // Keep only recent drafts
    const trimmed = filtered.slice(0, MAX_DRAFTS);

    localStorage.setItem(DRAFTS_KEY, JSON.stringify(trimmed));

    if (!autoSaved) {
      console.log('[DraftManager] Manual save for post:', postId);
    }
  } catch (error) {
    console.error('[DraftManager] Failed to save draft:', error);
  }
}

/**
 * Get draft for a specific post
 */
export function getDraft(postId: string): BlogDraft | null {
  try {
    const drafts = getAllDrafts();
    return drafts.find(d => d.postId === postId) || null;
  } catch (error) {
    console.error('[DraftManager] Failed to get draft:', error);
    return null;
  }
}

/**
 * Get all drafts
 */
export function getAllDrafts(): BlogDraft[] {
  try {
    const stored = localStorage.getItem(DRAFTS_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (error) {
    console.error('[DraftManager] Failed to get all drafts:', error);
    return [];
  }
}

/**
 * Delete a draft
 */
export function deleteDraft(postId: string): void {
  try {
    const drafts = getAllDrafts();
    const filtered = drafts.filter(d => d.postId !== postId);
    localStorage.setItem(DRAFTS_KEY, JSON.stringify(filtered));
    console.log('[DraftManager] Deleted draft for post:', postId);
  } catch (error) {
    console.error('[DraftManager] Failed to delete draft:', error);
  }
}

/**
 * Clear all drafts
 */
export function clearAllDrafts(): void {
  try {
    localStorage.removeItem(DRAFTS_KEY);
    console.log('[DraftManager] Cleared all drafts');
  } catch (error) {
    console.error('[DraftManager] Failed to clear drafts:', error);
  }
}

/**
 * Check if post has unsaved draft
 */
export function hasDraft(postId: string): boolean {
  return getDraft(postId) !== null;
}

/**
 * Get time since last save
 */
export function getTimeSinceLastSave(postId: string): number | null {
  const draft = getDraft(postId);
  if (!draft) return null;
  return Date.now() - draft.savedAt;
}
