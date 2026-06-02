// =============================================================================
// GRAMMAR CHECKER PANEL — Real-time Grammar & Style Analysis
// =============================================================================

import React, { useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info, Sparkles, Zap, RefreshCw, Wand2 } from 'lucide-react';
import { checkGrammarAndStyle, type GrammarCheckResult, type GrammarIssue } from '../utils/grammarChecker';
import { toast } from 'sonner';

interface GrammarCheckerPanelProps {
  isopen: boolean;
  onClose: () => void;
  text: string;
  onTextChange?: (newText: string) => void;
}

export function GrammarCheckerPanel({ isopen, onClose, text, onTextChange }: GrammarCheckerPanelProps) {
  const [result, setResult] = useState<GrammarCheckResult | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'error' | 'warning' | 'suggestion'>('all');
  const [useAPI, setUseAPI] = useState(true);

  useEffect(() => {
    if (isopen && text) {
      performCheck();
    }
  }, [isopen, text]);

  if (!isopen) return null;

  const performCheck = async () => {
    setIsChecking(true);
    try {
      const checkResult = await checkGrammarAndStyle(text, useAPI);
      setResult(checkResult);

      if (checkResult.stats.totalIssues === 0) {
        toast.success('No issues found! Your writing looks great. 🎉');
      } else {
        toast.info(`Found ${checkResult.stats.totalIssues} issue${checkResult.stats.totalIssues !== 1 ? 's' : ''}`);
      }
    } catch (error: any) {
      console.error('Grammar check error:', error);
      toast.error('Failed to check grammar');
    } finally {
      setIsChecking(false);
    }
  };

  const handleApplyFix = (issue: GrammarIssue) => {
    if (issue.replacements.length === 0) return;

    const newText =
      text.substring(0, issue.offset) +
      issue.replacements[0] +
      text.substring(issue.offset + issue.length);

    onTextChange?.(newText);
    toast.success('Fix applied');

    // Re-check after fix
    setTimeout(() => performCheck(), 100);
  };

  const handleApplyAllFixes = () => {
    if (!result?.correctedText) return;

    onTextChange?.(result.correctedText);
    toast.success(`Applied ${result.stats.totalIssues} fixes`);

    setTimeout(() => performCheck(), 100);
  };

  const filteredIssues = result?.issues.filter(issue =>
    filterType === 'all' || issue.type === filterType
  ) || [];

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-100 dark:bg-green-900/30';
    if (score >= 60) return 'bg-yellow-100 dark:bg-yellow-900/30';
    return 'bg-red-100 dark:bg-red-900/30';
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                <Wand2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Grammar & Style Checker</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {useAPI ? 'Powered by LanguageTool API' : 'Local Analysis'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <input
                  type="checkbox"
                  checked={useAPI}
                  onChange={(e) => setUseAPI(e.target.checked)}
                  className="rounded"
                />
                Use API
              </label>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          {result && (
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Issues</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {result.stats.totalIssues}
                </div>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
                <div className="text-xs text-red-600 dark:text-red-400 mb-1">Errors</div>
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {result.stats.errors}
                </div>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3">
                <div className="text-xs text-yellow-600 dark:text-yellow-400 mb-1">Warnings</div>
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {result.stats.warnings}
                </div>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                <div className="text-xs text-blue-600 dark:text-blue-400 mb-1">Suggestions</div>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {result.stats.suggestions}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isChecking ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <RefreshCw className="w-12 h-12 text-purple-600 dark:text-purple-400 animate-spin mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">Checking your content...</p>
              </div>
            </div>
          ) : result ? (
            <div className="space-y-6">
              {/* Style Analysis */}
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800">
                <div className="flex items-center gap-4 mb-4">
                  <div className={`w-24 h-24 rounded-full ${getScoreBg(result.styleAnalysis.score)} flex items-center justify-center`}>
                    <div className="text-center">
                      <div className={`text-3xl font-bold ${getScoreColor(result.styleAnalysis.score)}`}>
                        {result.styleAnalysis.score}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Style</div>
                    </div>
                  </div>

                  <div className="flex-1 grid grid-cols-3 gap-3">
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Hemingway Grade</div>
                      <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                        {result.styleAnalysis.hemingwayGrade}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Tone Consistency</div>
                      <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                        {result.styleAnalysis.toneConsistency}%
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Passive Voice</div>
                      <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                        {result.styleAnalysis.issues.passiveVoice}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Style Suggestions */}
                {result.styleAnalysis.suggestions.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">💡 Style Suggestions</h4>
                    <ul className="space-y-1">
                      {result.styleAnalysis.suggestions.map((suggestion, idx) => (
                        <li key={idx} className="text-sm text-gray-700 dark:text-gray-300">
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Issues List */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">Issues & Fixes</h3>
                  <div className="flex gap-2">
                    {(['all', 'error', 'warning', 'suggestion'] as const).map(type => (
                      <button
                        key={type}
                        onClick={() => setFilterType(type)}
                        className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${filterType === type
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                          }`}
                      >
                        {type === 'all' ? `All (${result.issues.length})` : type.charAt(0).toUpperCase() + type.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {filteredIssues.length > 0 ? (
                  <div className="space-y-3">
                    {filteredIssues.map((issue, idx) => (
                      <div
                        key={idx}
                        className={`p-4 rounded-lg border ${issue.type === 'error'
                          ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                          : issue.type === 'warning'
                            ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                            : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                          }`}
                      >
                        <div className="flex items-start gap-3">
                          {issue.type === 'error' ? (
                            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                          ) : issue.type === 'warning' ? (
                            <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                          ) : (
                            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                          )}

                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                                {issue.shortMessage}
                              </span>
                              <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
                                {issue.rule.category}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                              {issue.message}
                            </p>

                            {/* Context */}
                            <div className="bg-white dark:bg-gray-900 rounded px-3 py-2 font-mono text-xs mb-3">
                              <span className="text-gray-500 dark:text-gray-400">
                                {issue.context.text.substring(0, issue.context.offset)}
                              </span>
                              <span className="bg-yellow-200 dark:bg-yellow-900/50 text-yellow-900 dark:text-yellow-300 px-0.5">
                                {issue.context.text.substring(issue.context.offset, issue.context.offset + issue.context.length)}
                              </span>
                              <span className="text-gray-500 dark:text-gray-400">
                                {issue.context.text.substring(issue.context.offset + issue.context.length)}
                              </span>
                            </div>

                            {/* Replacements */}
                            {issue.replacements.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {issue.replacements.map((replacement, rIdx) => (
                                  <button
                                    key={rIdx}
                                    onClick={() => handleApplyFix(issue)}
                                    className="px-3 py-1 bg-green-600 text-white rounded text-xs font-medium hover:bg-green-700 transition-colors flex items-center gap-1"
                                  >
                                    <Sparkles className="w-3 h-3" />
                                    {replacement}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">
                      {filterType === 'all' ? 'No issues found!' : `No ${filterType}s found!`}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <Zap className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>Click "Check" to analyze your content</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <button
            onClick={performCheck}
            disabled={isChecking}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold disabled:opacity-50 flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
            {isChecking ? 'Checking...' : 'Re-check'}
          </button>

          {result && result.stats.totalIssues > 0 && result.correctedText && (
            <button
              onClick={handleApplyAllFixes}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Apply All Fixes ({result.stats.totalIssues})
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
