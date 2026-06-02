// =============================================================================
// VERSION HISTORY MODAL — Git-style Version Control & Diff Viewer
// =============================================================================

import React, { useState, useEffect } from 'react';
import { X, Clock, GitBranch, RotateCcw, Eye, Download, Trash2, Plus, Minus } from 'lucide-react';
import { versionStorage, calculateDiff, createVersion, type Version, type Diff } from '../utils/versionHistory';
import { toast } from 'sonner';
import type { BlogPost } from '../utils/blogGenerator';

interface VersionHistoryModalProps {
  isopen: boolean;
  onClose: () => void;
  post: BlogPost;
  onRestore: (content: string) => void;
}

export function VersionHistoryModal({ isopen, onClose, post, onRestore }: VersionHistoryModalProps) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<Version | null>(null);
  const [compareVersion, setCompareVersion] = useState<Version | null>(null);
  const [diff, setDiff] = useState<Diff | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'diff'>('list');

  useEffect(() => {
    if (isopen) {
      loadVersions();
    }
  }, [isopen, post.id]);

  useEffect(() => {
    if (selectedVersion && compareVersion) {
      const calculatedDiff = calculateDiff(compareVersion.content, selectedVersion.content);
      setDiff(calculatedDiff);
      setViewMode('diff');
    } else {
      setDiff(null);
    }
  }, [selectedVersion, compareVersion]);

  if (!isopen) return null;

  const loadVersions = () => {
    const postVersions = versionStorage.getVersions(post.id);
    setVersions(postVersions);
  };

  const handleSaveCurrentVersion = () => {
    const version = createVersion(
      post.id,
      post.content,
      'Manual save',
      'User'
    );
    versionStorage.saveVersion(version);
    loadVersions();
    toast.success('Version saved!');
  };

  const handleRestore = (version: Version) => {
    if (confirm(`Restore to version from ${new Date(version.timestamp).toLocaleString()}?`)) {
      onRestore(version.content);

      // Save current state before restoring
      const currentVersion = createVersion(
        post.id,
        post.content,
        'Before restore',
        'System'
      );
      versionStorage.saveVersion(currentVersion);

      toast.success('Version restored!');
      onClose();
    }
  };

  const handleDeleteVersion = (version: Version) => {
    if (confirm('Delete this version?')) {
      versionStorage.deleteVersion(version.id);
      loadVersions();
      if (selectedVersion?.id === version.id) setSelectedVersion(null);
      if (compareVersion?.id === version.id) setCompareVersion(null);
      toast.success('Version deleted');
    }
  };

  const handleCompare = () => {
    if (versions.length >= 2) {
      setSelectedVersion(versions[0]);
      setCompareVersion(versions[1]);
    }
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    if (diffMins < 10080) return `${Math.floor(diffMins / 1440)}d ago`;

    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden flex">
        {/* Sidebar - Versions List */}
        <div className="w-80 border-r border-gray-200 dark:border-gray-700 flex flex-col">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Version History</h3>
            </div>
            <button
              onClick={handleSaveCurrentVersion}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-semibold"
            >
              Save Current Version
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {versions.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No versions saved yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {versions.map((version, idx) => (
                  <div
                    key={version.id}
                    onClick={() => {
                      if (!compareVersion) {
                        setSelectedVersion(version);
                        setViewMode('list');
                      } else {
                        if (selectedVersion?.id === version.id) {
                          setSelectedVersion(null);
                        } else {
                          setSelectedVersion(version);
                        }
                      }
                    }}
                    className={`p-3 rounded-lg cursor-pointer transition-all ${selectedVersion?.id === version.id
                      ? 'bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-300 dark:border-purple-600'
                      : compareVersion?.id === version.id
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-300 dark:border-blue-600'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 border-2 border-transparent'
                      }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
                            V{versions.length - idx}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {formatTimestamp(version.timestamp)}
                          </span>
                        </div>
                        {version.message && (
                          <p className="text-xs text-gray-700 dark:text-gray-300 mb-1">
                            {version.message}
                          </p>
                        )}
                        {version.author && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            by {version.author}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteVersion(version);
                        }}
                        className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="flex gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRestore(version);
                        }}
                        className="flex-1 px-2 py-1 bg-green-600 text-white rounded text-xs font-medium hover:bg-green-700 transition-colors"
                      >
                        Restore
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCompareVersion(version);
                        }}
                        className="px-2 py-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded text-xs font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        Compare
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {viewMode === 'diff' ? 'Diff Viewer' : 'Version Preview'}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {versions.length} version{versions.length !== 1 ? 's' : ''} saved
                </p>
              </div>

              <div className="flex items-center gap-3">
                {diff && (
                  <div className="flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                      <Plus className="w-4 h-4" />
                      {diff.additions}
                    </span>
                    <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                      <Minus className="w-4 h-4" />
                      {diff.deletions}
                    </span>
                  </div>
                )}
                <button
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {viewMode === 'diff' && diff ? (
              <div className="space-y-4">
                {diff.hunks.map((hunk, hunkIdx) => (
                  <div key={hunkIdx} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                    <div className="bg-gray-100 dark:bg-gray-900 px-4 py-2 text-xs font-mono text-gray-600 dark:text-gray-400">
                      @@ -{hunk.oldStart + 1},{hunk.oldLines} +{hunk.newStart + 1},{hunk.newLines} @@
                    </div>
                    <div>
                      {hunk.lines.map((line, lineIdx) => (
                        <div
                          key={lineIdx}
                          className={`px-4 py-1 font-mono text-sm ${line.type === 'add'
                            ? 'bg-green-50 dark:bg-green-900/20 text-green-900 dark:text-green-300'
                            : line.type === 'remove'
                              ? 'bg-red-50 dark:bg-red-900/20 text-red-900 dark:text-red-300'
                              : 'text-gray-700 dark:text-gray-300'
                            }`}
                        >
                          <span className="inline-block w-8 text-gray-400 select-none">
                            {line.type === 'add' ? '+' : line.type === 'remove' ? '-' : ' '}
                          </span>
                          {line.content}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {diff.hunks.length === 0 && (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <Eye className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No differences found</p>
                  </div>
                )}
              </div>
            ) : selectedVersion ? (
              <div className="prose dark:prose-invert max-w-none">
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 mb-6 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                        Version {versions.findIndex(v => v.id === selectedVersion.id) + 1}
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(selectedVersion.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRestore(selectedVersion)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-semibold flex items-center gap-2"
                      >
                        <RotateCcw className="w-4 h-4" />
                        Restore
                      </button>
                    </div>
                  </div>
                  {selectedVersion.message && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                      "{selectedVersion.message}"
                    </p>
                  )}
                </div>

                <div className="whitespace-pre-wrap text-gray-900 dark:text-gray-100 leading-relaxed">
                  {selectedVersion.content}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                <div className="text-center">
                  <GitBranch className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>Select a version to view</p>
                  <p className="text-sm mt-2">Or select two versions to compare</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
