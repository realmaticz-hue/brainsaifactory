import { useState } from 'react';
import { Shield, AlertTriangle, AlertCircle, Info, CheckCircle, Bug, Zap, Code, FileText, Download, Copy } from 'lucide-react';
import {
  reviewCode,
  generateSecurityReport,
  autoFixIssues,
  type CodeReviewResult,
  type CodeReviewIssue,
  type SecurityVulnerability,
  type ReviewSeverity,
  type ReviewCategory,
} from '../utils/codeReview';
import { LANGUAGE_CONFIG, type ProgrammingLanguage, detectLanguage } from '../utils/codeGenerator';
import { toast } from 'sonner';

export function CodeReviewPanel() {
  const [code, setCode] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<ProgrammingLanguage>('javascript');
  const [reviewResult, setReviewResult] = useState<CodeReviewResult | null>(null);
  const [securityReport, setSecurityReport] = useState<SecurityVulnerability[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<'review' | 'security'>('review');
  const [filterSeverity, setFilterSeverity] = useState<ReviewSeverity | 'all'>('all');
  const [filterCategory, setFilterCategory] = useState<ReviewCategory | 'all'>('all');

  const languages = Object.keys(LANGUAGE_CONFIG) as ProgrammingLanguage[];

  const handleReviewCode = async () => {
    if (!code.trim()) {
      toast.error('Please enter code to review');
      return;
    }

    setIsAnalyzing(true);
    try {
      const detectedLang = detectLanguage(code);
      const result = await reviewCode(code, detectedLang);
      setReviewResult(result);
      setActiveTab('review');
      toast.success('Code review completed!');
    } catch (error) {
      toast.error('Failed to review code');
      console.error(error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSecurityScan = async () => {
    if (!code.trim()) {
      toast.error('Please enter code to scan');
      return;
    }

    setIsAnalyzing(true);
    try {
      const detectedLang = detectLanguage(code);
      const vulnerabilities = await generateSecurityReport(code, detectedLang);
      setSecurityReport(vulnerabilities);
      setActiveTab('security');
      toast.success('Security scan completed!');
    } catch (error) {
      toast.error('Failed to scan code');
      console.error(error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAutoFix = () => {
    if (!reviewResult) {
      toast.error('Run a code review first');
      return;
    }

    const fixedCode = autoFixIssues(code, reviewResult.issues);
    setCode(fixedCode);
    toast.success('Auto-fixes applied!');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const downloadReport = () => {
    if (!reviewResult) return;

    const report = `
CODE REVIEW REPORT
==================

Score: ${reviewResult.score}/100

Summary:
- Total Issues: ${reviewResult.summary.total}
- Critical: ${reviewResult.summary.critical}
- Errors: ${reviewResult.summary.errors}
- Warnings: ${reviewResult.summary.warnings}
- Info: ${reviewResult.summary.info}

Metrics:
- Complexity: ${reviewResult.metrics.complexity}
- Maintainability: ${reviewResult.metrics.maintainability}
- Lines of Code: ${reviewResult.metrics.linesOfCode}
- Comment Ratio: ${reviewResult.metrics.commentRatio}%

Issues:
${reviewResult.issues.map((issue, idx) => `
${idx + 1}. [${issue.severity.toUpperCase()}] ${issue.title}
   Category: ${issue.category}
   Line: ${issue.line}
   ${issue.description}
   ${issue.suggestion ? `Suggestion: ${issue.suggestion}` : ''}
`).join('\n')}

Suggestions:
${reviewResult.suggestions.map((s, idx) => `${idx + 1}. ${s}`).join('\n')}
    `.trim();

    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'code-review-report.txt';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Report downloaded!');
  };

  const getSeverityIcon = (severity: ReviewSeverity) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'error':
        return <AlertTriangle className="w-5 h-5 text-orange-600" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  const getSeverityColor = (severity: ReviewSeverity | string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800';
      case 'error':
      case 'high':
        return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800';
      case 'warning':
      case 'medium':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800';
      case 'info':
      case 'low':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600';
    }
  };

  const getCategoryIcon = (category: ReviewCategory) => {
    switch (category) {
      case 'security':
        return <Shield className="w-4 h-4" />;
      case 'performance':
        return <Zap className="w-4 h-4" />;
      case 'bug':
        return <Bug className="w-4 h-4" />;
      case 'style':
      case 'best-practice':
      case 'documentation':
        return <Code className="w-4 h-4" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    if (score >= 40) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreGrade = (score: number) => {
    if (score >= 90) return 'A+';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B';
    if (score >= 60) return 'C';
    if (score >= 50) return 'D';
    return 'F';
  };

  const filteredIssues = reviewResult?.issues.filter((issue) => {
    if (filterSeverity !== 'all' && issue.severity !== filterSeverity) return false;
    if (filterCategory !== 'all' && issue.category !== filterCategory) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
              AI Code Review
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Automated code quality and security analysis
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Paste your code
                </label>
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value as ProgrammingLanguage)}
                  className="mb-3 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                >
                  {languages.map((lang) => (
                    <option key={lang} value={lang}>
                      {LANGUAGE_CONFIG[lang].name}
                    </option>
                  ))}
                </select>
                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Paste code here for review..."
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-900 dark:text-white font-mono text-sm resize-none"
                  rows={20}
                  spellCheck={false}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleReviewCode}
                  disabled={isAnalyzing}
                  className="flex-1 bg-gradient-to-r from-red-600 to-orange-600 text-white py-3 rounded-lg font-medium hover:from-red-700 hover:to-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isAnalyzing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Code className="w-5 h-5" />
                      Review Code
                    </>
                  )}
                </button>

                <button
                  onClick={handleSecurityScan}
                  disabled={isAnalyzing}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Shield className="w-5 h-5" />
                  Security Scan
                </button>
              </div>

              {reviewResult && (
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={handleAutoFix}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                  >
                    Auto-Fix Simple Issues
                  </button>
                  <button
                    onClick={downloadReport}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-1">
            {reviewResult && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Overall Score</h3>

                <div className="text-center mb-6">
                  <div className={`text-6xl font-bold ${getScoreColor(reviewResult.score)}`}>
                    {reviewResult.score}
                  </div>
                  <div className="text-2xl font-semibold text-gray-600 dark:text-gray-400 mt-2">
                    Grade: {getScoreGrade(reviewResult.score)}
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <span className="text-sm font-medium text-red-700 dark:text-red-300">Critical</span>
                    <span className="text-lg font-bold text-red-700 dark:text-red-300">
                      {reviewResult.summary.critical}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                    <span className="text-sm font-medium text-orange-700 dark:text-orange-300">Errors</span>
                    <span className="text-lg font-bold text-orange-700 dark:text-orange-300">
                      {reviewResult.summary.errors}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <span className="text-sm font-medium text-yellow-700 dark:text-yellow-300">Warnings</span>
                    <span className="text-lg font-bold text-yellow-700 dark:text-yellow-300">
                      {reviewResult.summary.warnings}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Info</span>
                    <span className="text-lg font-bold text-blue-700 dark:text-blue-300">
                      {reviewResult.summary.info}
                    </span>
                  </div>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Code Metrics</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Complexity</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {reviewResult.metrics.complexity}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Maintainability</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {reviewResult.metrics.maintainability}/100
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Lines of Code</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {reviewResult.metrics.linesOfCode}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Comment Ratio</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {reviewResult.metrics.commentRatio}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Suggestions</h4>
                  <ul className="space-y-2">
                    {reviewResult.suggestions.map((suggestion, idx) => (
                      <li key={idx} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2">
                        <span className="text-red-600 dark:text-red-400 mt-0.5">•</span>
                        <span>{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>

        {(reviewResult || securityReport.length > 0) && (
          <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="border-b border-gray-200 dark:border-gray-700">
              <div className="flex gap-1 p-2">
                <button
                  onClick={() => setActiveTab('review')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeTab === 'review'
                      ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  Issues ({reviewResult?.issues.length || 0})
                </button>
                <button
                  onClick={() => setActiveTab('security')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeTab === 'security'
                      ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <Shield className="w-4 h-4" />
                  Security ({securityReport.length})
                </button>
              </div>
            </div>

            <div className="p-6">
              {activeTab === 'review' && reviewResult && (
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <select
                      value={filterSeverity}
                      onChange={(e) => setFilterSeverity(e.target.value as any)}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white"
                    >
                      <option value="all">All Severities</option>
                      <option value="critical">Critical</option>
                      <option value="error">Error</option>
                      <option value="warning">Warning</option>
                      <option value="info">Info</option>
                    </select>

                    <select
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value as any)}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white"
                    >
                      <option value="all">All Categories</option>
                      <option value="security">Security</option>
                      <option value="performance">Performance</option>
                      <option value="bug">Bug</option>
                      <option value="style">Style</option>
                      <option value="best-practice">Best Practice</option>
                      <option value="documentation">Documentation</option>
                    </select>
                  </div>

                  {filteredIssues && filteredIssues.length === 0 ? (
                    <div className="text-center py-12">
                      <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                      <p className="text-gray-600 dark:text-gray-400">No issues found with current filters</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredIssues?.map((issue) => (
                        <div
                          key={issue.id}
                          className={`p-4 border rounded-lg ${getSeverityColor(issue.severity)}`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 mt-0.5">
                              {getSeverityIcon(issue.severity)}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-semibold text-sm">{issue.title}</h4>
                                <span className="px-2 py-0.5 bg-white dark:bg-gray-800 rounded text-xs font-medium capitalize flex items-center gap-1">
                                  {getCategoryIcon(issue.category)}
                                  {issue.category}
                                </span>
                                <span className="text-xs">Line {issue.line}</span>
                              </div>

                              <p className="text-sm mb-2">{issue.description}</p>

                              {issue.suggestion && (
                                <div className="p-2 bg-white dark:bg-gray-800 rounded text-sm mt-2">
                                  <span className="font-medium">💡 Suggestion:</span> {issue.suggestion}
                                </div>
                              )}

                              {issue.codeSnippet && (
                                <pre className="mt-2 p-2 bg-gray-900 text-gray-100 rounded text-xs overflow-x-auto">
                                  <code>{issue.codeSnippet}</code>
                                </pre>
                              )}

                              {issue.learnMoreUrl && (
                                <a
                                  href={issue.learnMoreUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm underline mt-2 inline-block"
                                >
                                  Learn more →
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'security' && (
                <div className="space-y-4">
                  {securityReport.length === 0 ? (
                    <div className="text-center py-12">
                      <Shield className="w-12 h-12 text-green-500 mx-auto mb-3" />
                      <p className="text-gray-600 dark:text-gray-400">No security vulnerabilities found</p>
                      <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                        Your code passed the security scan
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {securityReport.map((vuln) => (
                        <div
                          key={vuln.id}
                          className={`p-4 border rounded-lg ${getSeverityColor(vuln.severity)}`}
                        >
                          <div className="flex items-start gap-3">
                            <Shield className="w-5 h-5 flex-shrink-0 mt-0.5" />

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-semibold text-sm">{vuln.type}</h4>
                                <span className="px-2 py-0.5 bg-white dark:bg-gray-800 rounded text-xs font-medium uppercase">
                                  {vuln.severity}
                                </span>
                                {vuln.cwe && (
                                  <span className="text-xs">CWE-{vuln.cwe}</span>
                                )}
                                <span className="text-xs">Line {vuln.line}</span>
                              </div>

                              <p className="text-sm mb-2">{vuln.description}</p>

                              <div className="p-2 bg-white dark:bg-gray-800 rounded text-sm mt-2">
                                <span className="font-medium">🔒 Remediation:</span> {vuln.remediation}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
