import { useState } from 'react';
import { Github, Upload, GitBranch, GitCommit, X, Sparkles, CheckCircle, AlertCircle, Loader, Key, Eye, EyeOff } from 'lucide-react';
import { serverFetch } from '../utils/serverFetch';

interface GitHubUploadModalProps {
  isopen: boolean;
  onClose: () => void;
  fixedCount: number;
  totalErrors: number;
  fixes: Array<{ file: string; error: string; fix: string }>;
}

export function GitHubUploadModal({
  isopen,
  onClose,
  fixedCount,
  totalErrors,
  fixes,
}: GitHubUploadModalProps) {
  const [repoName, setRepoName] = useState('my-repaired-project');
  const [branchName, setBranchName] = useState('git-repair-fixes');
  const [commitMessage, setCommitMessage] = useState('');
  const [githubToken, setGithubToken] = useState(() => localStorage.getItem('github_token') || '');
  const [showToken, setShowToken] = useState(false);
  const [isGeneratingCommit, setIsGeneratingCommit] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadResult, setUploadResult] = useState<{
    repoUrl?: string;
    branchUrl?: string;
    commitSha?: string;
    message?: string;
  } | null>(null);

  if (!isopen) return null;

  // Save GitHub token to localStorage
  const saveGitHubToken = (token: string) => {
    setGithubToken(token);
    if (token) {
      localStorage.setItem('github_token', token);
    } else {
      localStorage.removeItem('github_token');
    }
  };

  // Generate AI commit message
  const generateCommitMessage = async () => {
    setIsGeneratingCommit(true);
    setUploadError(null);

    try {
      const response = await serverFetch('/generate-commit-message', {
        method: 'POST',
        body: JSON.stringify({
          fixes: fixes.map(f => ({ file: f.file, description: f.error })),
          repoName,
          fixedCount,
          totalErrors,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate commit message');
      }

      const result = await response.json();
      setCommitMessage(result.commitMessage || `fix: repair ${fixedCount} errors detected by Git Repair AI`);
    } catch (error) {
      console.error('Commit generation error:', error);
      // Fallback commit message
      setCommitMessage(`fix: auto-repair ${fixedCount} errors\n\n${fixes.slice(0, 5).map(f => `- Fixed in ${f.file}`).join('\n')}${fixes.length > 5 ? `\n... and ${fixes.length - 5} more` : ''}`);
    }

    setIsGeneratingCommit(false);
  };

  // Upload to GitHub
  const uploadToGitHub = async () => {
    if (!commitMessage.trim()) {
      setUploadError('Please provide a commit message');
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setUploadProgress(0);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) return prev;
          return prev + 10;
        });
      }, 300);

      const response = await serverFetch('/git-repair/upload-github', {
        method: 'POST',
        body: JSON.stringify({
          repoName,
          branchName,
          commitMessage,
          fixes,
          fixedCount,
          githubToken,
        }),
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Upload failed' }));
        throw new Error(errorData.error || 'Upload failed');
      }

      const result = await response.json();
      setUploadProgress(100);
      setUploadComplete(true);
      setUploadResult(result);

      // Auto-close after success
      setTimeout(() => {
        onClose();
        // Reset state
        setTimeout(() => {
          setUploadComplete(false);
          setUploadProgress(0);
          setCommitMessage('');
        }, 500);
      }, 2000);

    } catch (error) {
      console.error('Upload error:', error);
      setUploadError(error instanceof Error ? error.message : 'Upload failed. Please try again.');
      setUploadProgress(0);
    }

    setIsUploading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-xl shadow-2xl border border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
              <Github className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Upload to GitHub</h2>
              <p className="text-sm text-gray-400">Commit and push all repaired fixes</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
              <p className="text-sm text-green-400 font-semibold mb-1">Fixed Errors</p>
              <p className="text-3xl font-bold text-white">{fixedCount}</p>
            </div>
            <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
              <p className="text-sm text-blue-400 font-semibold mb-1">Files Changed</p>
              <p className="text-3xl font-bold text-white">{fixes.length}</p>
            </div>
          </div>

          {/* Repository Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              <GitBranch className="w-4 h-4 inline mr-1" />
              Repository Name
            </label>
            <input
              type="text"
              value={repoName}
              onChange={(e) => setRepoName(e.target.value)}
              placeholder="my-project"
              className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          {/* Branch Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              <GitBranch className="w-4 h-4 inline mr-1" />
              Branch Name
            </label>
            <input
              type="text"
              value={branchName}
              onChange={(e) => setBranchName(e.target.value)}
              placeholder="git-repair-fixes"
              className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          {/* GitHub Token */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              <Key className="w-4 h-4 inline mr-1" />
              GitHub Personal Access Token
            </label>
            <div className="relative">
              <input
                type={showToken ? "text" : "password"}
                value={githubToken}
                onChange={(e) => saveGitHubToken(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                className="w-full px-4 py-3 pr-12 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono text-sm"
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 hover:bg-gray-700 rounded transition-colors"
              >
                {showToken ? (
                  <EyeOff className="w-4 h-4 text-gray-400" />
                ) : (
                  <Eye className="w-4 h-4 text-gray-400" />
                )}
              </button>
            </div>
            <div className="mt-2 bg-yellow-900/10 border border-yellow-500/20 rounded-lg p-3">
              <p className="text-xs text-yellow-300">
                <strong>How to get a token:</strong> Go to GitHub Settings → Developer settings → Personal access tokens →
                Generate new token (classic). Grant <code className="bg-gray-900 px-1 py-0.5 rounded">repo</code> permissions.
              </p>
            </div>
          </div>

          {/* Commit Message */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold text-gray-300">
                <GitCommit className="w-4 h-4 inline mr-1" />
                Commit Message
              </label>
              <button
                onClick={generateCommitMessage}
                disabled={isGeneratingCommit}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs font-semibold rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isGeneratingCommit ? (
                  <>
                    <Loader className="w-3.5 h-3.5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    AI Generate
                  </>
                )}
              </button>
            </div>
            <textarea
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              placeholder="Describe your changes..."
              rows={5}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono text-sm resize-none"
            />
          </div>

          {/* Files to be committed */}
          <div>
            <p className="text-sm font-semibold text-gray-300 mb-3">Files to Commit ({fixes.length})</p>
            <div className="bg-gray-900 rounded-lg border border-gray-700 max-h-48 overflow-y-auto">
              {fixes.length === 0 ? (
                <div className="p-4 text-center text-gray-500 text-sm">
                  No fixes to commit yet
                </div>
              ) : (
                <div className="divide-y divide-gray-700">
                  {fixes.map((fix, i) => (
                    <div key={i} className="p-3 hover:bg-gray-800/50 transition-colors">
                      <p className="text-sm font-mono text-cyan-400">{fix.file}</p>
                      <p className="text-xs text-gray-500 mt-1 truncate">{fix.error}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Upload Progress */}
          {isUploading && (
            <div className="bg-gray-900 rounded-lg border border-gray-700 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-white">Uploading to GitHub...</span>
                <span className="text-sm font-bold text-cyan-400">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Error Message */}
          {uploadError && (
            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-400 mb-1">Upload Failed</p>
                <p className="text-sm text-red-300">{uploadError}</p>
              </div>
            </div>
          )}

          {/* Success Message */}
          {uploadComplete && uploadResult && (
            <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-green-400 mb-1">Upload Successful!</p>
                  <p className="text-sm text-green-300 mb-3">{uploadResult.message}</p>

                  {uploadResult.repoUrl && (
                    <div className="space-y-2">
                      <a
                        href={uploadResult.repoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block px-3 py-2 bg-gray-900/50 rounded text-xs hover:bg-gray-900 transition-colors"
                      >
                        <span className="text-gray-400">Repository: </span>
                        <span className="text-cyan-400 font-mono">{uploadResult.repoUrl}</span>
                      </a>

                      {uploadResult.branchUrl && (
                        <a
                          href={uploadResult.branchUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block px-3 py-2 bg-gray-900/50 rounded text-xs hover:bg-gray-900 transition-colors"
                        >
                          <span className="text-gray-400">Branch: </span>
                          <span className="text-cyan-400 font-mono">{uploadResult.branchUrl}</span>
                        </a>
                      )}

                      {uploadResult.commitSha && (
                        <div className="px-3 py-2 bg-gray-900/50 rounded text-xs">
                          <span className="text-gray-400">Commit: </span>
                          <span className="text-cyan-400 font-mono">{uploadResult.commitSha.substring(0, 7)}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4 border-t border-gray-700">
            <button
              onClick={onClose}
              disabled={isUploading}
              className="flex-1 px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={uploadToGitHub}
              disabled={isUploading || !commitMessage.trim() || fixes.length === 0}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold flex items-center justify-center gap-2"
            >
              {isUploading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  Commit & Push
                </>
              )}
            </button>
          </div>

          {/* Note */}
          <div className="bg-blue-900/10 border border-blue-500/20 rounded-lg p-4">
            <p className="text-xs text-blue-300">
              <strong>Note:</strong> This feature creates a new branch with your repairs. Make sure you have configured GitHub
              authentication in your environment. The fixes will be committed as a new branch that you can review and merge via
              Pull Request.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}