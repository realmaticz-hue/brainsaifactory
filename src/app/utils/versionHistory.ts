// =============================================================================
// VERSION HISTORY — Git-style Version Control for Blog Posts
// =============================================================================

export interface Version {
  id: string;
  postId: string;
  content: string;
  timestamp: Date;
  author?: string;
  message?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface DiffLine {
  type: 'add' | 'remove' | 'unchanged';
  content: string;
  lineNumber: number;
}

export interface DiffHunk {
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  lines: DiffLine[];
}

export interface Diff {
  hunks: DiffHunk[];
  additions: number;
  deletions: number;
  unchanged: number;
}

/**
 * Create a new version
 */
export function createVersion(
  postId: string,
  content: string,
  message?: string,
  author?: string,
  metadata?: Record<string, any>
): Version {
  return {
    id: `v-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    postId,
    content,
    timestamp: new Date(),
    author,
    message,
    metadata,
  };
}

/**
 * Calculate diff between two texts
 */
export function calculateDiff(oldText: string, newText: string): Diff {
  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');

  const hunks: DiffHunk[] = [];
  let additions = 0;
  let deletions = 0;
  let unchanged = 0;

  // Simple line-by-line diff (Myers algorithm simplified)
  const lcs = longestCommonSubsequence(oldLines, newLines);
  let oldIdx = 0;
  let newIdx = 0;
  let currentHunk: DiffLine[] | null = null;
  let hunkOldStart = 0;
  let hunkNewStart = 0;

  while (oldIdx < oldLines.length || newIdx < newLines.length) {
    if (
      oldIdx < oldLines.length &&
      newIdx < newLines.length &&
      lcs[oldIdx] === newIdx
    ) {
      // Unchanged line
      if (currentHunk) {
        // Close current hunk
        hunks.push({
          oldStart: hunkOldStart,
          oldLines: oldIdx - hunkOldStart,
          newStart: hunkNewStart,
          newLines: newIdx - hunkNewStart,
          lines: currentHunk,
        });
        currentHunk = null;
      }

      currentHunk = currentHunk || [];
      currentHunk.push({
        type: 'unchanged',
        content: oldLines[oldIdx],
        lineNumber: oldIdx + 1,
      });
      unchanged++;
      oldIdx++;
      newIdx++;
    } else if (oldIdx < oldLines.length && lcs[oldIdx] !== newIdx) {
      // Deleted line
      if (!currentHunk) {
        hunkOldStart = oldIdx;
        hunkNewStart = newIdx;
        currentHunk = [];
      }
      currentHunk.push({
        type: 'remove',
        content: oldLines[oldIdx],
        lineNumber: oldIdx + 1,
      });
      deletions++;
      oldIdx++;
    } else {
      // Added line
      if (!currentHunk) {
        hunkOldStart = oldIdx;
        hunkNewStart = newIdx;
        currentHunk = [];
      }
      currentHunk.push({
        type: 'add',
        content: newLines[newIdx],
        lineNumber: newIdx + 1,
      });
      additions++;
      newIdx++;
    }
  }

  // Close final hunk
  if (currentHunk && currentHunk.length > 0) {
    hunks.push({
      oldStart: hunkOldStart,
      oldLines: oldIdx - hunkOldStart,
      newStart: hunkNewStart,
      newLines: newIdx - hunkNewStart,
      lines: currentHunk,
    });
  }

  return {
    hunks,
    additions,
    deletions,
    unchanged,
  };
}

/**
 * Longest Common Subsequence (for diff algorithm)
 */
function longestCommonSubsequence(a: string[], b: string[]): Map<number, number> {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array(m + 1).fill(0).map(() => Array(n + 1).fill(0));

  // Build LCS table
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to find matching lines
  const matches = new Map<number, number>();
  let i = m;
  let j = n;

  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) {
      matches.set(i - 1, j - 1);
      i--;
      j--;
    } else if (dp[i - 1][j] > dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }

  return matches;
}

/**
 * Apply a diff to text
 */
export function applyDiff(originalText: string, diff: Diff): string {
  const lines = originalText.split('\n');
  const result: string[] = [];

  let lineIdx = 0;

  for (const hunk of diff.hunks) {
    // Add unchanged lines before hunk
    while (lineIdx < hunk.oldStart) {
      result.push(lines[lineIdx]);
      lineIdx++;
    }

    // Apply hunk changes
    for (const line of hunk.lines) {
      if (line.type === 'add') {
        result.push(line.content);
      } else if (line.type === 'remove') {
        lineIdx++; // Skip removed line
      } else {
        result.push(line.content);
        lineIdx++;
      }
    }
  }

  // Add remaining unchanged lines
  while (lineIdx < lines.length) {
    result.push(lines[lineIdx]);
    lineIdx++;
  }

  return result.join('\n');
}

/**
 * Get version history summary
 */
export function getVersionSummary(versions: Version[]): {
  total: number;
  lastModified: Date | null;
  authors: string[];
  totalChanges: number;
} {
  if (versions.length === 0) {
    return {
      total: 0,
      lastModified: null,
      authors: [],
      totalChanges: 0,
    };
  }

  const authors = Array.from(new Set(versions.map(v => v.author).filter(Boolean) as string[]));
  const lastModified = versions[0].timestamp;

  // Calculate total changes
  let totalChanges = 0;
  for (let i = 1; i < versions.length; i++) {
    const diff = calculateDiff(versions[i].content, versions[i - 1].content);
    totalChanges += diff.additions + diff.deletions;
  }

  return {
    total: versions.length,
    lastModified,
    authors,
    totalChanges,
  };
}

/**
 * Find versions by date range
 */
export function findVersionsByDateRange(
  versions: Version[],
  startDate: Date,
  endDate: Date
): Version[] {
  return versions.filter(v =>
    v.timestamp >= startDate && v.timestamp <= endDate
  );
}

/**
 * Find versions by author
 */
export function findVersionsByAuthor(
  versions: Version[],
  author: string
): Version[] {
  return versions.filter(v => v.author === author);
}

/**
 * Merge two versions (simple 3-way merge)
 */
export function mergeVersions(
  base: string,
  version1: string,
  version2: string
): { merged: string; conflicts: string[] } {
  const baseLines = base.split('\n');
  const v1Lines = version1.split('\n');
  const v2Lines = version2.split('\n');

  const merged: string[] = [];
  const conflicts: string[] = [];

  const diff1 = calculateDiff(base, version1);
  const diff2 = calculateDiff(base, version2);

  // Simple merge: if both changed the same line, it's a conflict
  for (let i = 0; i < baseLines.length; i++) {
    const line1 = v1Lines[i] || baseLines[i];
    const line2 = v2Lines[i] || baseLines[i];

    if (line1 === line2) {
      merged.push(line1);
    } else if (line1 === baseLines[i]) {
      merged.push(line2);
    } else if (line2 === baseLines[i]) {
      merged.push(line1);
    } else {
      // Conflict
      conflicts.push(`Line ${i + 1}: "${line1}" vs "${line2}"`);
      merged.push(`<<<<<<< VERSION 1\n${line1}\n=======\n${line2}\n>>>>>>> VERSION 2`);
    }
  }

  return {
    merged: merged.join('\n'),
    conflicts,
  };
}

/**
 * Storage interface for versions
 */
export class VersionStorage {
  private storageKey = 'blog-post-versions';

  /**
   * Save a version
   */
  saveVersion(version: Version): void {
    const versions = this.getAllVersions();
    versions.unshift(version);

    // Keep max 100 versions per post
    const postVersions = versions.filter(v => v.postId === version.postId);
    if (postVersions.length > 100) {
      const toRemove = postVersions.slice(100);
      const filtered = versions.filter(v =>
        !toRemove.some(r => r.id === v.id)
      );
      localStorage.setItem(this.storageKey, JSON.stringify(filtered));
    } else {
      localStorage.setItem(this.storageKey, JSON.stringify(versions));
    }
  }

  /**
   * Get all versions for a post
   */
  getVersions(postId: string): Version[] {
    const versions = this.getAllVersions();
    return versions
      .filter(v => v.postId === postId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  /**
   * Get a specific version
   */
  getVersion(versionId: string): Version | null {
    const versions = this.getAllVersions();
    return versions.find(v => v.id === versionId) || null;
  }

  /**
   * Delete a version
   */
  deleteVersion(versionId: string): void {
    const versions = this.getAllVersions();
    const filtered = versions.filter(v => v.id !== versionId);
    localStorage.setItem(this.storageKey, JSON.stringify(filtered));
  }

  /**
   * Delete all versions for a post
   */
  deletePostVersions(postId: string): void {
    const versions = this.getAllVersions();
    const filtered = versions.filter(v => v.postId !== postId);
    localStorage.setItem(this.storageKey, JSON.stringify(filtered));
  }

  /**
   * Get all versions
   */
  private getAllVersions(): Version[] {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (!data) return [];
      return JSON.parse(data).map((v: any) => ({
        ...v,
        timestamp: new Date(v.timestamp),
      }));
    } catch {
      return [];
    }
  }

  /**
   * Clear all versions
   */
  clearAll(): void {
    localStorage.removeItem(this.storageKey);
  }
}

export const versionStorage = new VersionStorage();
