// =============================================================================
// AI CODE REVIEW — Automated Code Quality & Security Analysis
// =============================================================================

import type { ProgrammingLanguage } from './codeGenerator';

export type ReviewSeverity = 'info' | 'warning' | 'error' | 'critical';
export type ReviewCategory = 'security' | 'performance' | 'style' | 'bug' | 'best-practice' | 'documentation';

export interface CodeReviewIssue {
  id: string;
  line: number;
  column?: number;
  severity: ReviewSeverity;
  category: ReviewCategory;
  title: string;
  description: string;
  suggestion?: string;
  codeSnippet?: string;
  learnMoreUrl?: string;
}

export interface CodeReviewResult {
  score: number; // 0-100
  issues: CodeReviewIssue[];
  summary: {
    total: number;
    critical: number;
    errors: number;
    warnings: number;
    info: number;
  };
  metrics: CodeMetrics;
  suggestions: string[];
}

export interface CodeMetrics {
  complexity: number;
  maintainability: number;
  testCoverage?: number;
  duplication: number;
  linesOfCode: number;
  commentRatio: number;
}

export interface SecurityVulnerability {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  line: number;
  cwe?: string; // Common Weakness Enumeration
  remediation: string;
}

/**
 * Perform comprehensive code review
 */
export async function reviewCode(
  code: string,
  language: ProgrammingLanguage
): Promise<CodeReviewResult> {
  // Simulate AI analysis
  await new Promise(resolve => setTimeout(resolve, 1500));

  const issues: CodeReviewIssue[] = [];

  // Security analysis
  issues.push(...detectSecurityIssues(code, language));

  // Performance analysis
  issues.push(...detectPerformanceIssues(code, language));

  // Style analysis
  issues.push(...detectStyleIssues(code, language));

  // Best practices
  issues.push(...detectBestPracticeViolations(code, language));

  const summary = {
    total: issues.length,
    critical: issues.filter(i => i.severity === 'critical').length,
    errors: issues.filter(i => i.severity === 'error').length,
    warnings: issues.filter(i => i.severity === 'warning').length,
    info: issues.filter(i => i.severity === 'info').length,
  };

  const metrics = calculateMetrics(code, language);

  // Calculate overall score
  const score = calculateCodeScore(issues, metrics);

  const suggestions = generateSuggestions(issues, metrics);

  return {
    score,
    issues,
    summary,
    metrics,
    suggestions,
  };
}

/**
 * Detect security vulnerabilities
 */
function detectSecurityIssues(code: string, language: ProgrammingLanguage): CodeReviewIssue[] {
  const issues: CodeReviewIssue[] = [];

  // SQL Injection
  if (code.match(/execute\([^?]*\+|query\([^?]*\+/i)) {
    issues.push({
      id: `sec-${Date.now()}-1`,
      line: findLineNumber(code, /execute\([^?]*\+|query\([^?]*\+/i),
      severity: 'critical',
      category: 'security',
      title: 'Potential SQL Injection',
      description: 'Dynamic SQL query construction detected. Use parameterized queries instead.',
      suggestion: 'Use prepared statements or ORM methods to prevent SQL injection.',
      learnMoreUrl: 'https://owasp.org/www-community/attacks/SQL_Injection',
    });
  }

  // XSS vulnerability
  if (code.match(/innerHTML|dangerouslySetInnerHTML/)) {
    issues.push({
      id: `sec-${Date.now()}-2`,
      line: findLineNumber(code, /innerHTML|dangerouslySetInnerHTML/),
      severity: 'error',
      category: 'security',
      title: 'Potential XSS Vulnerability',
      description: 'Direct HTML insertion can lead to XSS attacks.',
      suggestion: 'Sanitize user input or use safe alternatives like textContent.',
      learnMoreUrl: 'https://owasp.org/www-community/attacks/xss/',
    });
  }

  // Hardcoded secrets
  if (code.match(/(password|api[_-]?key|secret|token)\s*=\s*['"][^'"]+['"]/i)) {
    issues.push({
      id: `sec-${Date.now()}-3`,
      line: findLineNumber(code, /(password|api[_-]?key|secret|token)\s*=\s*['"][^'"]+['"]/i),
      severity: 'critical',
      category: 'security',
      title: 'Hardcoded Credentials',
      description: 'Sensitive credentials found in code.',
      suggestion: 'Use environment variables or secure vaults for credentials.',
    });
  }

  // eval() usage
  if (code.match(/\beval\s*\(/)) {
    issues.push({
      id: `sec-${Date.now()}-4`,
      line: findLineNumber(code, /\beval\s*\(/),
      severity: 'error',
      category: 'security',
      title: 'Use of eval()',
      description: 'eval() can execute arbitrary code and is a security risk.',
      suggestion: 'Avoid eval(). Use safer alternatives like JSON.parse() for data.',
    });
  }

  return issues;
}

/**
 * Detect performance issues
 */
function detectPerformanceIssues(code: string, language: ProgrammingLanguage): CodeReviewIssue[] {
  const issues: CodeReviewIssue[] = [];

  // Nested loops
  const nestedLoopPattern = /for\s*\([^)]+\)\s*{[^}]*for\s*\(/g;
  if (code.match(nestedLoopPattern)) {
    issues.push({
      id: `perf-${Date.now()}-1`,
      line: findLineNumber(code, nestedLoopPattern),
      severity: 'warning',
      category: 'performance',
      title: 'Nested Loops Detected',
      description: 'Nested loops can lead to O(n²) or worse complexity.',
      suggestion: 'Consider using hash maps or other optimizations to reduce complexity.',
    });
  }

  // Synchronous blocking in async context
  if (language === 'javascript' && code.match(/await.*forEach/)) {
    issues.push({
      id: `perf-${Date.now()}-2`,
      line: findLineNumber(code, /await.*forEach/),
      severity: 'warning',
      category: 'performance',
      title: 'Inefficient Async Pattern',
      description: 'forEach does not await promises. Use Promise.all() or for...of instead.',
      suggestion: 'Replace forEach with Promise.all(array.map(async ...)) for parallel execution.',
    });
  }

  return issues;
}

/**
 * Detect style issues
 */
function detectStyleIssues(code: string, language: ProgrammingLanguage): CodeReviewIssue[] {
  const issues: CodeReviewIssue[] = [];

  // Magic numbers
  const magicNumberPattern = /(?<![a-zA-Z0-9_])[0-9]{2,}(?![a-zA-Z0-9_])/g;
  const matches = code.match(magicNumberPattern);
  if (matches && matches.length > 3) {
    issues.push({
      id: `style-${Date.now()}-1`,
      line: 0,
      severity: 'info',
      category: 'style',
      title: 'Magic Numbers Detected',
      description: 'Multiple numeric literals found. Consider using named constants.',
      suggestion: 'Extract magic numbers into well-named constants.',
    });
  }

  // Long functions
  const lines = code.split('\n');
  if (lines.length > 50) {
    issues.push({
      id: `style-${Date.now()}-2`,
      line: 0,
      severity: 'info',
      category: 'style',
      title: 'Long Function',
      description: 'Function exceeds 50 lines. Consider breaking into smaller functions.',
      suggestion: 'Extract logical blocks into separate, well-named functions.',
    });
  }

  // TODO comments
  if (code.match(/\/\/\s*TODO|#\s*TODO/i)) {
    issues.push({
      id: `style-${Date.now()}-3`,
      line: findLineNumber(code, /\/\/\s*TODO|#\s*TODO/i),
      severity: 'info',
      category: 'documentation',
      title: 'TODO Comment Found',
      description: 'Incomplete work indicated by TODO comment.',
      suggestion: 'Complete the TODO or create a task in your issue tracker.',
    });
  }

  return issues;
}

/**
 * Detect best practice violations
 */
function detectBestPracticeViolations(code: string, language: ProgrammingLanguage): CodeReviewIssue[] {
  const issues: CodeReviewIssue[] = [];

  // Missing error handling
  if (language === 'javascript' || language === 'typescript') {
    const asyncFunctions = code.match(/async\s+function/g)?.length || 0;
    const tryCatches = code.match(/try\s*{/g)?.length || 0;

    if (asyncFunctions > 0 && tryCatches === 0) {
      issues.push({
        id: `bp-${Date.now()}-1`,
        line: 0,
        severity: 'warning',
        category: 'best-practice',
        title: 'Missing Error Handling',
        description: 'Async functions without try-catch blocks.',
        suggestion: 'Add try-catch blocks to handle potential errors in async code.',
      });
    }
  }

  // Console.log in production
  if (code.match(/console\.log/g)) {
    issues.push({
      id: `bp-${Date.now()}-2`,
      line: findLineNumber(code, /console\.log/),
      severity: 'info',
      category: 'best-practice',
      title: 'Console Statement',
      description: 'console.log() statement found.',
      suggestion: 'Remove console statements or use a proper logging library.',
    });
  }

  // Missing JSDoc/docstrings
  const functionCount = (code.match(/function\s+\w+|def\s+\w+|fn\s+\w+/g) || []).length;
  const docCount = (code.match(/\/\*\*|"""|'''/g) || []).length;

  if (functionCount > 2 && docCount < functionCount / 2) {
    issues.push({
      id: `bp-${Date.now()}-3`,
      line: 0,
      severity: 'info',
      category: 'documentation',
      title: 'Insufficient Documentation',
      description: 'Many functions lack documentation.',
      suggestion: 'Add JSDoc comments or docstrings to document function parameters and return values.',
    });
  }

  return issues;
}

/**
 * Calculate code metrics
 */
function calculateMetrics(code: string, language: ProgrammingLanguage): CodeMetrics {
  const lines = code.split('\n');
  const linesOfCode = lines.filter(l => l.trim() && !l.trim().startsWith('//')).length;

  const commentLines = lines.filter(l => {
    const trimmed = l.trim();
    return trimmed.startsWith('//') || trimmed.startsWith('#') || trimmed.startsWith('/*');
  }).length;

  const commentRatio = linesOfCode > 0 ? (commentLines / linesOfCode) * 100 : 0;

  // Cyclomatic complexity (simplified)
  const complexityIndicators = [
    /if\s*\(/g,
    /else\s+if/g,
    /for\s*\(/g,
    /while\s*\(/g,
    /case\s+/g,
    /\?\s*:/g, // ternary
    /&&|\|\|/g,
  ];

  const complexity = complexityIndicators.reduce((sum, pattern) => {
    return sum + (code.match(pattern)?.length || 0);
  }, 1);

  // Maintainability index (simplified, 0-100)
  const maintainability = Math.max(0, 100 - complexity - (linesOfCode / 10));

  return {
    complexity,
    maintainability: Math.round(maintainability),
    linesOfCode,
    commentRatio: Math.round(commentRatio),
    duplication: 0, // Would need more sophisticated analysis
  };
}

/**
 * Calculate overall code score
 */
function calculateCodeScore(issues: CodeReviewIssue[], metrics: CodeMetrics): number {
  let score = 100;

  // Deduct points for issues
  issues.forEach(issue => {
    switch (issue.severity) {
      case 'critical':
        score -= 20;
        break;
      case 'error':
        score -= 10;
        break;
      case 'warning':
        score -= 5;
        break;
      case 'info':
        score -= 1;
        break;
    }
  });

  // Adjust for metrics
  if (metrics.complexity > 20) score -= 10;
  if (metrics.commentRatio < 10) score -= 5;
  if (metrics.maintainability < 50) score -= 10;

  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Generate improvement suggestions
 */
function generateSuggestions(issues: CodeReviewIssue[], metrics: CodeMetrics): string[] {
  const suggestions: string[] = [];

  if (issues.some(i => i.category === 'security')) {
    suggestions.push('🔒 Address security vulnerabilities immediately');
  }

  if (metrics.complexity > 20) {
    suggestions.push('🔄 Reduce cyclomatic complexity by breaking down complex functions');
  }

  if (metrics.commentRatio < 10) {
    suggestions.push('📝 Add more comments and documentation');
  }

  if (issues.some(i => i.category === 'performance')) {
    suggestions.push('⚡ Optimize performance bottlenecks');
  }

  if (metrics.maintainability < 50) {
    suggestions.push('🛠️ Refactor to improve maintainability');
  }

  if (issues.filter(i => i.severity === 'error').length > 0) {
    suggestions.push('🐛 Fix critical errors before deployment');
  }

  if (suggestions.length === 0) {
    suggestions.push('✅ Code looks good! Consider adding tests for edge cases.');
  }

  return suggestions;
}

/**
 * Find line number of pattern match
 */
function findLineNumber(code: string, pattern: RegExp): number {
  const lines = code.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (pattern.test(lines[i])) {
      return i + 1;
    }
  }
  return 1;
}

/**
 * Generate security report
 */
export async function generateSecurityReport(
  code: string,
  language: ProgrammingLanguage
): Promise<SecurityVulnerability[]> {
  const vulnerabilities: SecurityVulnerability[] = [];

  // In production, use specialized security scanning tools (Snyk, SonarQube, etc.)
  await new Promise(resolve => setTimeout(resolve, 1000));

  const securityIssues = detectSecurityIssues(code, language);

  securityIssues.forEach((issue, idx) => {
    vulnerabilities.push({
      id: `vuln-${idx}`,
      type: issue.title,
      severity: issue.severity === 'critical' ? 'critical' : 'high',
      description: issue.description,
      line: issue.line,
      remediation: issue.suggestion || 'Review and fix the security issue',
    });
  });

  return vulnerabilities;
}

/**
 * Auto-fix simple issues
 */
export function autoFixIssues(code: string, issues: CodeReviewIssue[]): string {
  let fixedCode = code;

  // Auto-fix simple patterns
  issues.forEach(issue => {
    if (issue.category === 'style') {
      // Remove console.log
      if (issue.title.includes('Console Statement')) {
        fixedCode = fixedCode.replace(/console\.log\([^)]*\);?\n?/g, '');
      }
    }
  });

  return fixedCode;
}
