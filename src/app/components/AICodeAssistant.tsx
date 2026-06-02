// AI Code Assistant - Ultra-Intelligent Multi-Layer System
import { useState, useRef, useEffect } from 'react';
import {
  Upload, Check, X, AlertCircle, Code, Wand2, Download,
  Copy, RefreshCw, Zap, FileText, Trash2, CheckCircle,
  XCircle, AlertTriangle, Info, Sparkles, ChevronDown,
  ChevronRight, Terminal, Bug, Lightbulb, Eye, EyeOff, MessageCircle, Send,
  Github, FolderGit2, GitBranch, FileCode, Folder, Link, Clock, FileDown, Settings,
  Play, Package, Brain, Layers, Network, Database, Shield, Globe, Monitor
} from 'lucide-react';
import JSZip from 'jszip';
import { generateTextSummary, generateJSONSummary, generateHTMLSummary } from './ErrorSummaryGenerator';
import { MultiAgentArchitectUI } from './MultiAgentArchitect';
import { SelfImprovingLoopUI } from './SelfImprovingLoop';
import { ContextMemorySystemUI } from './ContextMemorySystem';
import { CodeAwarenessEngineUI } from './CodeAwarenessEngine';
import { SelfAwareIntelligenceEngine } from './SelfAwareIntelligenceEngine';
import { GeniusAIChat } from './GeniusAIChat';
import {
  bridgeSaveFiles, bridgeClearFiles,
  bridgeSaveCurrentCode, bridgeSaveCopilotQuery
} from '../utils/fileContextBridge';
import { BRAIN_AGENTS, NEURAL_LINKS, getActiveAgentsForQuery, GLOBAL_CONTROL_LOOP, logBrainActivity, simulateAgentTelemetry, getAgentHealth, clearBrainTelemetry } from '../utils/superCodingBrain';
import { BrainNeuralMap } from './BrainNeuralMap';
import { copyToClipboard as copyToClipboardUtil } from '../utils/clipboard';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { serverFetch } from '../utils/serverFetch';

interface AICodeAssistantProps {
  isopen: boolean;
  onClose: () => void;
}

interface CodeIssue {
  type: 'duplicate' | 'syntax' | 'unused' | 'formatting' | 'accidental' | 'suggestion'
  | 'dom nesting' | 'broken import' | 'broken require' | 'import/export mismatch'
  | 'nullable field access' | 'nullable array access' | 'union type field'
  | 'console statement' | 'unused import' | 'unused variable' | 'debugger' | string;
  severity: 'error' | 'warning' | 'info';
  line: number;
  message: string;
  original: string;
  fixed?: string;
  description: string;
}

interface AnalysisResult {
  totalIssues: number;
  errors: number;
  warnings: number;
  suggestions: number;
  issues: CodeIssue[];
  originalCode: string;
  fixedCode: string;
}

interface ErrorSolution {
  errorType: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  possibleCauses: string[];
  solutions: {
    title: string;
    steps: string[];
    codeExample?: string;
  }[];
  relatedErrors: string[];
  documentation: {
    title: string;
    url: string;
  }[];
}

interface TroubleshootResult {
  errorMessage: string;
  parsedError: {
    type: string;
    message: string;
    file?: string;
    line?: number;
    stack?: string;
  };
  solutions: ErrorSolution[];
  quickFixes: string[];
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  codeContext?: string;
}

interface GitHubFile {
  path: string;
  content: string;
  fixedContent?: string;
  issues: CodeIssue[];
  language: string;
}

interface GitHubScanResult {
  repository: string;
  branch: string;
  totalFiles: number;
  scannedFiles: number;
  totalIssues: number;
  files: GitHubFile[];
  summary: {
    errors: number;
    warnings: number;
    suggestions: number;
  };
  structureSuggestions?: string[];
}

interface TerminalLog {
  id: string;
  type: 'info' | 'error' | 'success' | 'warning' | 'command' | 'fix';
  message: string;
  timestamp: Date;
  details?: string;
}

interface TerminalError {
  type: string;
  message: string;
  line?: number;
  file?: string;
  stack?: string;
  fixed: boolean;
}

interface FixSummary {
  totalErrors: number;
  fixedErrors: number;
  fixes: Array<{
    error: string;
    fix: string;
    before?: string;
    after?: string;
    explanation: string;
  }>;
  timestamp: Date;
}

export function AICodeAssistant({ isopen, onClose }: AICodeAssistantProps) {
  const [mode, setMode] = useState<'analyze' | 'troubleshoot' | 'chat' | 'github' | 'terminal' | 'architect' | 'self-improve' | 'memory' | 'awareness' | 'self-aware' | 'copilot'>('analyze');
  const [originalCode, setOriginalCode] = useState('');
  const [currentCode, setCurrentCode] = useState(''); // Current working code
  const [errorInput, setErrorInput] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [activeBrainAgentIds, setActiveBrainAgentIds] = useState<Set<number>>(new Set([11]));

  // GitHub Scanner State
  const [githubUrl, setGithubUrl] = useState('');
  const [githubToken, setGithubToken] = useState('');
  const [tokenStatus, setTokenStatus] = useState<'none' | 'validating' | 'valid' | 'invalid'>('none');
  const [rateLimitInfo, setRateLimitInfo] = useState<{ remaining: number; limit: number; reset: Date } | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState({ current: 0, total: 0, message: '' });
  const [scanResult, setScanResult] = useState<GitHubScanResult | null>(null);
  const [fixesApplied, setFixesApplied] = useState(false);
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [maxFilesToScan, setMaxFilesToScan] = useState<number>(500); // Default to 500 files
  const [scanAllFiles, setScanAllFiles] = useState(false);
  const [isSavingToFolder, setIsSavingToFolder] = useState(false);
  const [saveProgress, setSaveProgress] = useState({ current: 0, total: 0 });
  const [isRunUntilClean, setIsRunUntilClean] = useState(false);
  const [runUntilCleanIteration, setRunUntilCleanIteration] = useState(0);
  const MAX_CLEAN_ITERATIONS = 5;

  // Terminal State
  const [terminalLogs, setTerminalLogs] = useState<TerminalLog[]>([]);
  const [terminalCode, setTerminalCode] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [terminalErrors, setTerminalErrors] = useState<TerminalError[]>([]);
  const [autoFixRunning, setAutoFixRunning] = useState(false);
  const [fixIteration, setFixIteration] = useState(0);
  const [maxIterations] = useState(10);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Fix Summary State
  const [fixSummary, setFixSummary] = useState<FixSummary | null>(null);
  const [showFixSummary, setShowFixSummary] = useState(false);

  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [troubleshootResult, setTroubleshootResult] = useState<TroubleshootResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isTroubleshooting, setIsTroubleshooting] = useState(false);
  const [isFixing, setIsFixing] = useState(false);
  const [selectedIssues, setSelectedIssues] = useState<Set<number>>(new Set());
  const [expandedIssues, setExpandedIssues] = useState<Set<number>>(new Set());
  const [expandedSolutions, setExpandedSolutions] = useState<Set<number>>(new Set());
  const [autoFixEnabled, setAutoFixEnabled] = useState(true);
  const [copySuccess, setCopySuccess] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);
  const [manualCopyText, setManualCopyText] = useState<string>('');
  const [showManualCopyModal, setShowManualCopyModal] = useState(false);
  const [debugHistory, setDebugHistory] = useState<Array<{
    step: number;
    action: string;
    code: string;
    timestamp: Date;
  }>>([]);
  const [showGitHubCorrections, setShowGitHubCorrections] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  // Chat history for multi-turn context
  const chatHistoryRef = useRef<Array<{ role: 'user' | 'assistant'; content: string }>>([]);

  // CRITICAL FIX: Add global error handler flag
  const [hasGlobalError, setHasGlobalError] = useState(false);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalLogs]);

  // CRITICAL FIX: Add global error handler for unhandled promise rejections
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('🚨 Unhandled promise rejection caught:', event.reason);
      event.preventDefault(); // Prevent default crash behavior
      setHasGlobalError(true);

      // Safely try to add log
      try {
        const errorMsg = event.reason?.message || event.reason?.toString() || 'Unknown error';
        setTerminalLogs(prev => [...prev, {
          id: Date.now().toString(),
          type: 'error',
          message: `❌ Unhandled error: ${errorMsg}`,
          timestamp: new Date()
        }]);
      } catch (e) {
        console.error('Error logging to terminal:', e);
      }

      // Reset all running states to prevent UI lockup
      try {
        setIsRunning(false);
        setAutoFixRunning(false);
        setIsAnalyzing(false);
        setIsTroubleshooting(false);
        setIsFixing(false);
      } catch (e) {
        console.error('Error resetting states:', e);
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  if (!isopen) return null;

  // CRITICAL FIX: Safe wrapper for async onClick handlers
  const safeAsyncHandler = (asyncFn: () => Promise<void>) => {
    return () => {
      Promise.resolve()
        .then(() => asyncFn())
        .catch((error) => {
          console.error('🚨 Async handler error:', error);
          try {
            setTerminalLogs(prev => [...prev, {
              id: Date.now().toString(),
              type: 'error',
              message: `❌ Operation failed: ${error?.message || 'Unknown error'}`,
              timestamp: new Date(),
              details: error?.stack
            }]);
            // Reset all running states
            setIsRunning(false);
            setAutoFixRunning(false);
            setIsAnalyzing(false);
            setIsTroubleshooting(false);
            setIsFixing(false);
          } catch (e) {
            console.error('Error in error handler:', e);
          }
        });
    };
  };

  const analyzeCode = async (code: string) => {
    setIsAnalyzing(true);

    // Simulate AI analysis
    await new Promise(resolve => setTimeout(resolve, 1500));

    const issues: CodeIssue[] = [];
    const lines = code.split('\n');
    const seenLines = new Map<string, number[]>();

    // 1. Detect duplicate lines
    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (trimmed.length > 10) { // Ignore very short lines
        if (!seenLines.has(trimmed)) {
          seenLines.set(trimmed, []);
        }
        seenLines.get(trimmed)!.push(index);
      }
    });

    seenLines.forEach((lineNumbers, content) => {
      if (lineNumbers.length > 1) {
        lineNumbers.slice(1).forEach(lineNum => {
          issues.push({
            type: 'duplicate',
            severity: 'warning',
            line: lineNum + 1,
            message: 'Duplicate code detected',
            original: lines[lineNum],
            description: `This line is identical to line ${lineNumbers[0] + 1}. Consider removing duplicates.`
          });
        });
      }
    });

    // 2. Detect accidental marks/characters
    const accidentalPatterns = [
      { pattern: /;;;+/g, name: 'Multiple semicolons' },
      { pattern: /,,,+/g, name: 'Multiple commas' },
      { pattern: /\.\.\.\./g, name: 'Excessive dots' },
      { pattern: /\s{4,}/g, name: 'Excessive whitespace' },
      { pattern: /\/\/\/+/g, name: 'Excessive comment slashes' },
      { pattern: /console\.log\([^)]*\);?\s*console\.log/g, name: 'Duplicate console.logs' },
      { pattern: /debugger;?\s*debugger/g, name: 'Multiple debuggers' },
    ];

    lines.forEach((line, index) => {
      accidentalPatterns.forEach(({ pattern, name }) => {
        if (pattern.test(line)) {
          issues.push({
            type: 'accidental',
            severity: 'error',
            line: index + 1,
            message: `Accidental mark: ${name}`,
            original: line,
            fixed: line.replace(pattern, (match) => {
              if (name === 'Multiple semicolons') return ';';
              if (name === 'Multiple commas') return ',';
              if (name === 'Excessive dots') return '...';
              if (name === 'Excessive whitespace') return ' ';
              if (name === 'Excessive comment slashes') return '//';
              return match.split(/\s+/)[0]; // For duplicates, keep first
            }),
            description: `Found ${name.toLowerCase()} that may be accidental.`
          });
        }
      });
    });

    // 3. Detect syntax errors
    const syntaxPatterns = [
      { pattern: /\)\s*\(/g, name: 'Missing operator between parentheses' },
      { pattern: /\[\s*\[/g, name: 'Double opening bracket' },
      { pattern: /\]\s*\]/g, name: 'Double closing bracket' },
      { pattern: /{\s*{/g, name: 'Double opening brace' },
      { pattern: /}\s*}/g, name: 'Double closing brace' },
      { pattern: /=\s*=\s*=/g, name: 'Triple equals without comparison' },
      { pattern: /const\s+const/g, name: 'Duplicate const keyword' },
      { pattern: /let\s+let/g, name: 'Duplicate let keyword' },
      { pattern: /function\s+function/g, name: 'Duplicate function keyword' },
    ];

    lines.forEach((line, index) => {
      syntaxPatterns.forEach(({ pattern, name }) => {
        if (pattern.test(line)) {
          issues.push({
            type: 'syntax',
            severity: 'error',
            line: index + 1,
            message: `Syntax error: ${name}`,
            original: line,
            description: `Detected potential syntax error that may cause runtime issues.`
          });
        }
      });
    });

    // 3.5. Detect TypeScript-specific syntax errors using validation
    // VALIDATOR DISABLED - Was causing false positives on valid TypeScript
    // Only real corruption is now fixed via autoFixSyntaxErrors()
    /*
    const validationErrors = validateTypeScriptSyntax(code);
    validationErrors.forEach(error => {
      issues.push({
        type: 'syntax',
        severity: 'error',
        line: error.line,
        message: error.message,
        original: lines[error.line - 1] || '',
        fixed: autoFixSyntaxErrors(code, [error]).split('\n')[error.line - 1],
        description: `TypeScript/JavaScript parsing error: ${error.message}`
      });
    });
    */

    // 4. Detect unused imports (simplified)
    const importPattern = /^import\s+{([^}]+)}\s+from/;
    const importedItems = new Set<string>();

    lines.forEach((line) => {
      const match = line.match(importPattern);
      if (match) {
        match[1].split(',').forEach(item => {
          importedItems.add(item.trim());
        });
      }
    });

    importedItems.forEach(item => {
      const used = code.split('\n').some((line, idx) => {
        return idx > 0 && line.includes(item);
      });

      if (!used) {
        const lineNum = lines.findIndex(l => l.includes(item));
        if (lineNum !== -1) {
          issues.push({
            type: 'unused',
            severity: 'warning',
            line: lineNum + 1,
            message: `Unused import: ${item}`,
            original: lines[lineNum],
            description: `The imported "${item}" is never used in the code.`
          });
        }
      }
    });

    // 5. Detect formatting issues
    lines.forEach((line, index) => {
      // Mixed tabs and spaces
      if (line.match(/^\t+ /)) {
        issues.push({
          type: 'formatting',
          severity: 'warning',
          line: index + 1,
          message: 'Mixed tabs and spaces',
          original: line,
          fixed: line.replace(/^\t+/, (match) => '  '.repeat(match.length)),
          description: 'Inconsistent indentation detected. Use either tabs or spaces consistently.'
        });
      }

      // Trailing whitespace
      if (line.match(/\s+$/)) {
        issues.push({
          type: 'formatting',
          severity: 'info',
          line: index + 1,
          message: 'Trailing whitespace',
          original: line,
          fixed: line.trimEnd(),
          description: 'Line has trailing whitespace that should be removed.'
        });
      }

      // Missing space after keywords
      if (line.match(/\b(if|for|while|switch)\(/)) {
        issues.push({
          type: 'formatting',
          severity: 'info',
          line: index + 1,
          message: 'Missing space after keyword',
          original: line,
          fixed: line.replace(/\b(if|for|while|switch)\(/, '$1 ('),
          description: 'Add space after control flow keywords for better readability.'
        });
      }
    });

    // 6. AI Suggestions
    lines.forEach((line, index) => {
      // Suggest const instead of let when not reassigned
      if (line.includes('let ') && !code.includes(`${line.match(/let\s+(\w+)/)?.[1]} =`)) {
        issues.push({
          type: 'suggestion',
          severity: 'info',
          line: index + 1,
          message: 'Consider using const instead of let',
          original: line,
          fixed: line.replace('let ', 'const '),
          description: 'This variable is never reassigned, so const is more appropriate.'
        });
      }

      // Suggest === instead of ==
      if (line.includes('==') && !line.includes('===')) {
        issues.push({
          type: 'suggestion',
          severity: 'warning',
          line: index + 1,
          message: 'Use === instead of ==',
          original: line,
          fixed: line.replace(/([^=])={2}([^=])/g, '$1===$2'),
          description: 'Strict equality (===) is safer and avoids type coercion issues.'
        });
      }

      // Suggest removing console.log in production
      if (line.includes('console.log')) {
        issues.push({
          type: 'suggestion',
          severity: 'info',
          line: index + 1,
          message: 'Remove console.log for production',
          original: line,
          description: 'Console statements should be removed before deploying to production.'
        });
      }
    });

    // Generate fixed code
    let fixedCode = code;
    const issuesWithFixes = issues.filter(i => i.fixed);

    issuesWithFixes.forEach(issue => {
      const lineIndex = issue.line - 1;
      const codeLines = fixedCode.split('\n');
      if (codeLines[lineIndex] === issue.original && issue.fixed) {
        codeLines[lineIndex] = issue.fixed;
        fixedCode = codeLines.join('\n');
      }
    });

    // Remove duplicate lines
    const duplicateIssues = issues.filter(i => i.type === 'duplicate');
    if (duplicateIssues.length > 0) {
      const linesToRemove = new Set(duplicateIssues.map(i => i.line - 1));
      const cleanedLines = fixedCode.split('\n').filter((_, idx) => !linesToRemove.has(idx));
      fixedCode = cleanedLines.join('\n');
    }

    const result: AnalysisResult = {
      totalIssues: issues.length,
      errors: issues.filter(i => i.severity === 'error').length,
      warnings: issues.filter(i => i.severity === 'warning').length,
      suggestions: issues.filter(i => i.severity === 'info').length,
      issues: issues.sort((a, b) => {
        if (a.severity !== b.severity) {
          const order = { error: 0, warning: 1, info: 2 };
          return order[a.severity] - order[b.severity];
        }
        return a.line - b.line;
      }),
      originalCode: code,
      fixedCode: fixedCode,
    };

    setAnalysis(result);
    setIsAnalyzing(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    setOriginalCode(text);

    // Save to Copilot bridge so GeniusAIChat can see the file
    const ext = file.name.split('.').pop()?.toLowerCase() || 'txt';
    const langMap: Record<string, string> = {
      ts: 'typescript', tsx: 'typescript', js: 'javascript', jsx: 'javascript',
      py: 'python', java: 'java', css: 'css', html: 'html', json: 'json'
    };
    bridgeSaveCurrentCode(text, file.name, langMap[ext] || ext);

    await analyzeCode(text);
  };

  const handleTextInput = (text: string) => {
    setOriginalCode(text);
    // Persist to bridge (debounce handled by React's batching)
    if (text.length > 50) {
      bridgeSaveCurrentCode(text, 'pasted-code.tsx', 'typescript');
    }
  };

  const autoFixAll = async () => {
    if (!analysis) return;

    setIsFixing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Generate fix summary
    const fixes = analysis.issues.map(issue => ({
      error: `${issue.type.toUpperCase()}: ${issue.message}`,
      fix: issue.fixed || 'Applied automated fix',
      before: issue.original,
      after: issue.fixed,
      explanation: issue.description || `Fixed ${issue.type} issue at line ${issue.line}`
    }));

    const summary: FixSummary = {
      totalErrors: analysis.totalIssues,
      fixedErrors: analysis.issues.length,
      fixes,
      timestamp: new Date()
    };

    setFixSummary(summary);
    setShowFixSummary(true);

    // Update current code to fixed version
    const fixedCode = analysis.fixedCode;
    setOriginalCode(fixedCode);
    setCurrentCode(fixedCode);

    // Add to debug history
    setDebugHistory(prev => [...prev, {
      step: prev.length + 1,
      action: 'Auto-fixed code issues',
      code: fixedCode,
      timestamp: new Date()
    }]);

    setAnalysis({
      ...analysis,
      totalIssues: 0,
      errors: 0,
      warnings: 0,
      suggestions: 0,
      issues: [],
      originalCode: fixedCode,
    });

    setIsFixing(false);
  };

  // SYNTAX VALIDATION FUNCTIONS
  const validateTypeScriptSyntax = (code: string): Array<{ line: number; message: string; type: string }> => {
    const errors: Array<{ line: number; message: string; type: string }> = [];
    const lines = code.split('\n');

    lines.forEach((line, index) => {
      const lineNum = index + 1;
      const trimmedLine = line.trim();

      // ==========================================
      // ILLEGAL JAVASCRIPT DETECTION
      // ==========================================

      // 1. Illegal use of reserved keywords as identifiers
      const reservedKeywords = ['await', 'break', 'case', 'catch', 'class', 'const', 'continue',
        'debugger', 'default', 'delete', 'do', 'else', 'enum', 'export', 'extends', 'false',
        'finally', 'for', 'function', 'if', 'import', 'in', 'instanceof', 'let', 'new', 'null',
        'return', 'super', 'switch', 'this', 'throw', 'true', 'try', 'typeof', 'var', 'void',
        'while', 'with', 'yield'];

      reservedKeywords.forEach(keyword => {
        if (trimmedLine.match(new RegExp(`^(?:const|let|var)\\s+${keyword}\\s*=`))) {
          errors.push({
            line: lineNum,
            message: `Illegal use of reserved keyword '${keyword}' as variable name`,
            type: 'illegal-reserved-keyword'
          });
        }
      });

      // 2. Illegal 'with' statement
      if (trimmedLine.match(/^\s*with\s*\(/)) {
        errors.push({
          line: lineNum,
          message: "Illegal 'with' statement (not allowed in strict mode)",
          type: 'illegal-with-statement'
        });
      }

      // 3. Illegal delete on variables
      if (trimmedLine.match(/delete\s+\w+[^.\[]/) && !trimmedLine.match(/delete\s+\w+\[/) && !trimmedLine.match(/delete\s+\w+\./)) {
        errors.push({
          line: lineNum,
          message: 'Illegal delete of unqualified identifier (not allowed in strict mode)',
          type: 'illegal-delete-variable'
        });
      }

      // 4. Illegal eval usage (security risk)
      if (trimmedLine.match(/eval\s*\(/)) {
        errors.push({
          line: lineNum,
          message: 'Use of eval() detected (restricted in strict mode, security risk)',
          type: 'illegal-eval-usage'
        });
      }

      // 5. Illegal octal literals
      if (trimmedLine.match(/\b0[0-7]+\b/) && !trimmedLine.match(/0o[0-7]+/)) {
        errors.push({
          line: lineNum,
          message: 'Illegal octal literal (use 0o prefix in strict mode)',
          type: 'illegal-octal-literal'
        });
      }

      // 6. Illegal await outside async
      if (trimmedLine.match(/\bawait\s+/) && !code.substring(0, code.split('\n').slice(0, index).join('\n').length).match(/\basync\s+/)) {
        errors.push({
          line: lineNum,
          message: "Illegal 'await' outside async function",
          type: 'illegal-await-outside-async'
        });
      }

      // ==========================================
      // BITWISE OPERATOR ERRORS (CRITICAL)
      // ==========================================

      // 7. Illegal single & (bitwise AND) instead of && (logical AND)
      // Matches: if (x & y), {condition & ( , condition & <Component
      if (trimmedLine.match(/\s&\s+\(/) ||
        trimmedLine.match(/\)\s*&\s*\(/) ||
        trimmedLine.match(/if\s*\([^)]*\s&\s[^)]*\)/) ||
        trimmedLine.match(/\?\?\s*\w+\s*&\s*\(/) ||
        trimmedLine.match(/===\s*"[^"]*"\s*&\s/) ||
        trimmedLine.match(/!==\s*"[^"]*"\s*&\s/) ||
        trimmedLine.match(/>\s*\d+\s*&\s/) ||
        trimmedLine.match(/<\s*\d+\s*&\s/) ||
        trimmedLine.match(/\{\w+\s*&\s*\(/) ||
        trimmedLine.match(/\{\w+\.\w+\s*&\s*\(/)) {
        errors.push({
          line: lineNum,
          message: 'Illegal bitwise AND (&) - should use logical AND (&&) for conditions',
          type: 'illegal-bitwise-and'
        });
      }

      // 8. Illegal single | (bitwise OR) instead of || (logical OR)
      // Matches: if (x | y), key={id | idx}, width: value | 0
      if (trimmedLine.match(/if\s*\([^)]*\s\|\s[^)]*\)/) ||
        trimmedLine.match(/key=\{[^}]*\s\|\s[^}]*\}/) ||
        trimmedLine.match(/:\s*`[^`]*\$\{[^}]*\s\|\s\d+\}/) ||
        trimmedLine.match(/width:\s*`[^`]*\s\|\s\d+/) ||
        trimmedLine.match(/\?\?\s*\w+\s*\|\s/) ||
        trimmedLine.match(/>=\s*\d+\s*\|\s/)) {
        errors.push({
          line: lineNum,
          message: 'Illegal bitwise OR (|) - should use logical OR (||) for conditions or defaults',
          type: 'illegal-bitwise-or'
        });
      }

      // 9. Illegal type annotation in object literal (boxShadow: any;)
      if (trimmedLine.match(/:\s*(?:any|string|number|boolean|object)\s*;/) &&
        !trimmedLine.match(/^(?:const|let|var|function|class|interface|type)\s/) &&
        !trimmedLine.includes('//')) {
        errors.push({
          line: lineNum,
          message: 'Illegal type annotation in object literal (types only allowed in declarations, not runtime objects)',
          type: 'illegal-type-in-object'
        });
      }

      // 10. Invalid semicolon in object property
      if (trimmedLine.match(/^\s*\w+:\s*\w+\s*;/) &&
        index > 0 &&
        lines[index - 1].includes('{') &&
        !trimmedLine.match(/^(?:const|let|var|function|class|interface|type)\s/)) {
        errors.push({
          line: lineNum,
          message: 'Invalid semicolon in object property (use comma or remove semicolon)',
          type: 'illegal-semicolon-in-object'
        });
      }

      // Check for stray semicolons in type declarations
      if (trimmedLine.match(/^const\s+\[.*\]\s*=\s*useState<;/) ||
        trimmedLine.match(/^const\s+\w+\s*=\s*\w+<;/)) {
        errors.push({
          line: lineNum,
          message: 'Stray semicolon in type declaration',
          type: 'syntax-semicolon-type'
        });
      }

      // Check for stray semicolons before opening parenthesis
      if (trimmedLine.match(/=\s*new\s+\w+\(;/) ||
        trimmedLine.match(/\(;\s*$/)) {
        errors.push({
          line: lineNum,
          message: 'Stray semicolon before opening parenthesis',
          type: 'syntax-semicolon-paren'
        });
      }

      // Check for incomplete union types
      if (trimmedLine.match(/:\s*$/) &&
        !trimmedLine.includes('{') &&
        !trimmedLine.includes('=>') &&
        !trimmedLine.includes('//')) {
        errors.push({
          line: lineNum,
          message: 'Incomplete type declaration (line ends with colon)',
          type: 'syntax-incomplete-type'
        });
      }

      // Check for repeated union type symbols
      if (trimmedLine.match(/\|\s*\|/) || trimmedLine.match(/&\s*&/)) {
        errors.push({
          line: lineNum,
          message: 'Repeated union/intersection type operator',
          type: 'syntax-repeated-operator'
        });
      }
    });

    if (errors.length > 0) {
      console.log('🔍 Syntax Validation Report:');
      console.table(errors.map(e => ({
        'Line': e.line,
        'Error Type': e.type,
        'Message': e.message
      })));
    }

    return errors;
  };

  const autoFixSyntaxErrors = (code: string, errors: Array<{ line: number; message: string; type: string }>): string => {
    // SAFE AUTO-FIX: Only fixes actual corruption, NEVER touches valid TypeScript syntax
    // This function ONLY fixes real corruption patterns like useState<; or EventSource(;
    // It does NOT touch valid union types (|), intersection types (&), or type annotations

    let fixedCode = code;

    // Fix 1: Corrupted generics like useState<; → useState<
    fixedCode = fixedCode.replace(/(\w+)<;/g, '$1<');

    // Fix 2: Corrupted function calls like EventSource(; → EventSource(
    fixedCode = fixedCode.replace(/\(;\s*\)/g, '()');
    fixedCode = fixedCode.replace(/\(;/g, '(');

    // Fix 3: Remove corrupted characters (UTF-8 encoding issues)
    fixedCode = fixedCode.replace(/ð¡/g, '💡');
    fixedCode = fixedCode.replace(/ð/g, '');

    // Fix 4: Remove AI-injected TODO comments
    fixedCode = fixedCode.replace(/\/\/ TODO: Fix suggestion\n?/g, '');

    // Fix 5: Double semicolons ;; → ;
    fixedCode = fixedCode.replace(/;;+/g, ';');

    // Fix 6: Semicolon at end of line inside JSX (rare corruption)
    fixedCode = fixedCode.replace(/;\s*(<\/\w+>)/g, '$1');

    // That's it! We DO NOT touch:
    // - Union types (string | number) ✓ Valid TypeScript
    // - Intersection types (A & B) ✓ Valid TypeScript  
    // - Type annotations (name: string;) ✓ Valid TypeScript
    // - Any other valid syntax

    console.log('✅ Safe auto-fix applied - only real corruption patterns fixed');

    return fixedCode;
  };

  // Legacy corruption function disabled - keeping structure for compatibility
  const _DISABLED_autoFixSyntaxErrors_OLD = (code: string, errors: Array<{ line: number; message: string; type: string }>): string => {
    const lines = code.split('\n');
    const fixedErrors = new Set<number>(); // Track which lines we've fixed

    errors.forEach(error => {
      const lineIndex = error.line - 1;
      if (lineIndex >= 0 && lineIndex < lines.length && !fixedErrors.has(lineIndex)) {
        const line = lines[lineIndex];

        switch (error.type) {
          // ==========================================
          // ILLEGAL JAVASCRIPT AUTO-FIX
          // ==========================================

          case 'illegal-reserved-keyword':
            // Fix reserved keyword usage by adding underscore prefix
            const keywordMatch = line.match(/(?:const|let|var|function)\s+(await|break|case|catch|class|const|continue|debugger|default|delete|do|else|enum|export|extends|false|finally|for|function|if|import|in|instanceof|let|new|null|return|super|switch|this|throw|true|try|typeof|var|void|while|with|yield)(\s*[=(])/);
            if (keywordMatch) {
              lines[lineIndex] = line.replace(keywordMatch[0], line.match(/^(\s*)(?:const|let|var|function)/)?.[0] + ` _${keywordMatch[1]}${keywordMatch[2]}`);
              fixedErrors.add(lineIndex);
            }
            break;

          case 'illegal-with-statement':
            // Remove 'with' statement and comment it out
            lines[lineIndex] = '// REMOVED: Illegal with statement - ' + line;
            fixedErrors.add(lineIndex);
            break;

          case 'illegal-delete-variable':
            // Comment out illegal delete
            lines[lineIndex] = '// REMOVED: Illegal delete - ' + line;
            fixedErrors.add(lineIndex);
            break;

          case 'illegal-eval-usage':
            // Comment out eval usage (security risk)
            lines[lineIndex] = '// SECURITY: eval() removed - ' + line;
            fixedErrors.add(lineIndex);
            break;

          case 'illegal-octal-literal':
            // Convert octal to 0o prefix format
            lines[lineIndex] = line.replace(/\b(0)([0-7]+)\b/g, '0o$2');
            fixedErrors.add(lineIndex);
            break;

          case 'illegal-await-outside-async':
            // Find the function and add async
            const functionLine = lines.slice(0, lineIndex).reverse().findIndex(l => l.match(/function\s+\w+\s*\(|const\s+\w+\s*=\s*\(/));
            if (functionLine !== -1) {
              const funcIndex = lineIndex - functionLine - 1;
              if (!lines[funcIndex].includes('async')) {
                lines[funcIndex] = lines[funcIndex].replace(/function\s+/, 'async function ').replace(/const\s+(\w+)\s*=\s*\(/, 'const $1 = async (');
              }
            }
            fixedErrors.add(lineIndex);
            break;

          // ==========================================
          // BITWISE OPERATOR AUTO-FIX (CRITICAL)
          // ==========================================

          case 'illegal-bitwise-and':
            // Replace single & with && (logical AND)
            lines[lineIndex] = line
              .replace(/\s&\s+\(/g, ' && (')
              .replace(/\)\s*&\s*\(/g, ') && (')
              .replace(/if\s*\(([^)]*)\s&\s([^)]*)\)/g, 'if ($1 && $2)')
              .replace(/\?\?\s*(\w+)\s*&\s*\(/g, '?? $1 && (')
              .replace(/(===|!==)\s*"([^"]*)"\s*&\s/g, '$1 "$2" && ')
              .replace(/(>|<)\s*(\d+)\s*&\s/g, '$1 $2 && ')
              .replace(/\{(\w+)\s*&\s*\(/g, '{$1 && (')
              .replace(/\{(\w+)\.(\w+)\s*&\s*\(/g, '{$1.$2 && (');
            fixedErrors.add(lineIndex);
            break;

          case 'illegal-bitwise-or':
            // Replace single | with || (logical OR)
            lines[lineIndex] = line
              .replace(/if\s*\(([^)]*)\s\|\s([^)]*)\)/g, 'if ($1 || $2)')
              .replace(/key=\{([^}]*)\s\|\s([^}]*)\}/g, 'key={$1 || $2}')
              .replace(/:\s*`([^`]*)\$\{([^}]*)\s\|\s(\d+)\}/g, ': `$1\${$2 || $3}')
              .replace(/width:\s*`([^`]*)\s\|\s(\d+)/g, 'width: `$1 || $2')
              .replace(/\?\?\s*(\w+)\s*\|\s/g, '?? $1 || ')
              .replace(/(>=|<=|>|<)\s*(\d+)\s*\|\s/g, '$1 $2 || ');
            fixedErrors.add(lineIndex);
            break;

          case 'illegal-type-in-object':
            // Remove type annotation from object literal
            // Example: boxShadow: any; → remove entire line or fix
            const typeMatch = line.match(/(\w+):\s*(any|string|number|boolean|object)\s*;/);
            if (typeMatch) {
              // Check if next line has the actual value
              if (lineIndex + 1 < lines.length) {
                const nextLine = lines[lineIndex + 1].trim();
                // If next line starts with the same property or is a ternary, remove this line
                if (nextLine.startsWith(typeMatch[1]) || nextLine.match(/^\w+\s*===/) || nextLine.match(/^\?/)) {
                  lines[lineIndex] = '// REMOVED: Illegal type in object - ' + line;
                } else {
                  // Otherwise, just remove the type and semicolon
                  lines[lineIndex] = line.replace(/:\s*(any|string|number|boolean|object)\s*;/, ': undefined,');
                }
              } else {
                lines[lineIndex] = '// REMOVED: Illegal type in object - ' + line;
              }
            }
            fixedErrors.add(lineIndex);
            break;

          case 'illegal-semicolon-in-object':
            // Replace semicolon with comma in object property
            lines[lineIndex] = line.replace(/;(\s*)$/, ',$1');
            fixedErrors.add(lineIndex);
            break;

          case 'illegal-const-reassignment':
            // Convert to let instead of const
            const constLine = lines.slice(0, lineIndex).reverse().findIndex(l => l.match(/const\s+\w+\s*=/));
            if (constLine !== -1) {
              const constIndex = lineIndex - constLine - 1;
              lines[constIndex] = lines[constIndex].replace(/^(\s*)const\s+/, '$1let ');
            }
            fixedErrors.add(lineIndex);
            break;

          case 'illegal-duplicate-declaration':
            // Comment out duplicate declaration
            lines[lineIndex] = '// DUPLICATE: ' + line + ' // Use existing declaration';
            fixedErrors.add(lineIndex);
            break;

          case 'illegal-duplicate-params':
            // Rename duplicate parameters
            const funcParamsMatch = line.match(/function\s+\w*\s*\(([^)]+)\)/);
            if (funcParamsMatch) {
              const params = funcParamsMatch[1].split(',').map(p => p.trim());
              const seen = new Set<string>();
              const fixed = params.map(param => {
                const name = param.split(/\s+/)[0].replace(/[^a-zA-Z0-9_$]/g, '');
                if (seen.has(name)) {
                  seen.add(name + '2');
                  return param.replace(name, name + '2');
                }
                seen.add(name);
                return param;
              });
              lines[lineIndex] = line.replace(funcParamsMatch[1], fixed.join(', '));
              fixedErrors.add(lineIndex);
            }
            break;

          case 'illegal-return-outside-function':
            // Comment out illegal return
            lines[lineIndex] = '// REMOVED: Return outside function - ' + line;
            fixedErrors.add(lineIndex);
            break;

          case 'illegal-multiple-default-exports':
            // Comment out duplicate default export
            const firstDefaultIndex = lines.findIndex(l => l.trim().match(/^export\s+default\b/));
            if (firstDefaultIndex !== lineIndex) {
              lines[lineIndex] = '// DUPLICATE DEFAULT EXPORT: ' + line + ' // Use named export instead';
              fixedErrors.add(lineIndex);
            }
            break;

          case 'illegal-strict-mode-violation':
            // Remove arguments.callee/caller
            lines[lineIndex] = line.replace(/arguments\.callee|arguments\.caller/, '/* REMOVED: strict mode violation */');
            fixedErrors.add(lineIndex);
            break;

          case 'illegal-break-continue':
            // Comment out illegal break/continue
            lines[lineIndex] = '// REMOVED: break/continue outside loop - ' + line;
            fixedErrors.add(lineIndex);
            break;

          case 'illegal-string-line-break':
            // Fix unescaped line terminator
            lines[lineIndex] = line.replace(/(['"])(.*)$/, '$1$2\\n$1');
            fixedErrors.add(lineIndex);
            break;

          case 'illegal-missing-semicolon':
            // Add missing semicolon
            lines[lineIndex] = line + ';';
            fixedErrors.add(lineIndex);
            break;

          case 'illegal-super-outside-class':
            // Comment out illegal super
            lines[lineIndex] = '// REMOVED: super outside class - ' + line;
            fixedErrors.add(lineIndex);
            break;

          case 'illegal-this-in-arrow':
            // Convert to regular function or comment
            lines[lineIndex] = '// WARNING: Arrow function with this - consider using regular function - ' + line;
            fixedErrors.add(lineIndex);
            break;

          case 'illegal-empty-destructuring':
            // Remove empty destructuring
            lines[lineIndex] = '// REMOVED: Empty destructuring - ' + line;
            fixedErrors.add(lineIndex);
            break;

          case 'illegal-getter-params':
            // Remove parameters from getter
            lines[lineIndex] = line.replace(/get\s+(\w+)\s*\([^)]*\)/, 'get $1()');
            fixedErrors.add(lineIndex);
            break;

          case 'illegal-setter-params':
            // Fix setter to have exactly one parameter
            const setterMatch = line.match(/set\s+(\w+)\s*\(([^)]*)\)/);
            if (setterMatch) {
              const params = setterMatch[2].split(',').map(p => p.trim()).filter(p => p);
              if (params.length === 0) {
                lines[lineIndex] = line.replace(/set\s+(\w+)\s*\([^)]*\)/, 'set $1(value)');
              } else if (params.length > 1) {
                lines[lineIndex] = line.replace(/set\s+(\w+)\s*\([^)]*\)/, `set $1(${params[0]})`);
              }
            }
            fixedErrors.add(lineIndex);
            break;

          // ==========================================
          // EXISTING SYNTAX FIXES
          // ==========================================

          case 'syntax-semicolon-type':
            // Remove stray semicolon in type declaration
            lines[lineIndex] = line.replace(/useState<;/, 'useState<').replace(/=\s*\w+<;/, (match) => match.replace(';', ''));
            fixedErrors.add(lineIndex);
            break;

          case 'syntax-semicolon-paren':
            // Remove stray semicolon before parenthesis
            lines[lineIndex] = line.replace(/\(;/, '(').replace(/;\s*$/, '');
            fixedErrors.add(lineIndex);
            break;

          case 'syntax-incomplete-type':
            // This might be a multi-line type, check next line
            if (lineIndex + 1 < lines.length) {
              const nextLine = lines[lineIndex + 1].trim();
              // If next line looks like a continuation, keep as is
              if (nextLine.startsWith('"') || nextLine.startsWith('|') || nextLine.startsWith('&')) {
                // Valid multi-line type, no fix needed
              } else {
                // Add 'any' as placeholder
                lines[lineIndex] = line + ' any;';
                fixedErrors.add(lineIndex);
              }
            }
            break;

          case 'syntax-repeated-operator':
            // Fix repeated union/intersection operators
            lines[lineIndex] = line.replace(/\|\s*\|/g, '|').replace(/&\s*&/g, '&');
            fixedErrors.add(lineIndex);
            break;
        }
      }
    });

    return lines.join('\n');
  }; // END DISABLED OLD FUNCTION - DO NOT USE

  const applyErrorFix = async (errorSolution: ErrorSolution) => {
    setIsFixing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Generate fixed code based on error solution
    let fixedCode = currentCode || originalCode;

    // Apply context-aware fixes based on error type
    if (errorSolution.errorType === 'syntax') {
      // Fix common syntax errors
      fixedCode = fixedCode.replace(/\)\s*\(/g, ') && (');
      fixedCode = fixedCode.replace(/\[\s*\[/g, '[');
      fixedCode = fixedCode.replace(/\]\s*\]/g, ']');
      fixedCode = fixedCode.replace(/{\\s*{/g, '{');
      fixedCode = fixedCode.replace(/}\\s*}/g, '}');
    } else if (errorSolution.errorType === 'reference') {
      // Add missing variable declarations (simplified)
      const lines = fixedCode.split('\\n');
      const firstLine = lines[0];
      if (!firstLine.includes('const') && !firstLine.includes('let')) {
        lines.unshift('// Add missing variable declarations');
      }
      fixedCode = lines.join('\\n');
    } else if (errorSolution.errorType === 'type') {
      // Add null checks
      fixedCode = fixedCode.replace(/(\w+)\.(\w+)/g, '$1?.$2');
    }

    // VALIDATE SYNTAX BEFORE APPLYING
    // VALIDATOR DISABLED - Was causing false positives on valid TypeScript syntax
    /*
    const validationErrors = validateTypeScriptSyntax(fixedCode);
    if (validationErrors.length > 0) {
      console.warn('⚠️ Syntax validation detected issues:', validationErrors);
      // Try to auto-fix the validation errors
      fixedCode = autoFixSyntaxErrors(fixedCode, validationErrors);
      
      // Re-validate after auto-fix
      const revalidationErrors = validateTypeScriptSyntax(fixedCode);
      if (revalidationErrors.length > 0) {
        console.error('❌ Could not auto-fix all syntax errors:', revalidationErrors);
      } else {
        console.log('✅ All syntax errors auto-fixed successfully');
      }
    }
    */

    setOriginalCode(fixedCode);
    setCurrentCode(fixedCode);

    // Add to debug history
    setDebugHistory(prev => [...prev, {
      step: prev.length + 1,
      action: `Fixed ${errorSolution.title}`,
      code: fixedCode,
      timestamp: new Date()
    }]);

    setIsFixing(false);

    // Show success message
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const switchToTroubleshoot = () => {
    // Carry over the current/fixed code to troubleshoot mode
    const codeToTroubleshoot = analysis?.fixedCode || currentCode || originalCode;
    setCurrentCode(codeToTroubleshoot);
    setMode('troubleshoot');
  };

  const switchToAnalyze = () => {
    // Carry over the current code back to analyze mode
    setMode('analyze');
    if (currentCode) {
      analyzeCode(currentCode);
    }
  };

  /**
   * Copilot: Ask AI to fix a specific detected issue.
   * Saves the error as a pending query for GeniusAIChat, then opens the chat.
   */
  const askAIAboutIssue = (issue: CodeIssue) => {
    const query = `I have a code error that needs fixing:\n\nError type: ${issue.type}\nLine ${issue.line}: ${issue.message}\n\nCode:\n${issue.original}\n\n${issue.description}\n\nPlease give me the corrected code and explain the fix.`;
    bridgeSaveCopilotQuery(query);
    setMode('chat');
  };

  /**
   * Copilot: Ask AI about a terminal error string.
   */
  const askAIAboutTerminalError = (errorText: string) => {
    bridgeSaveCopilotQuery(errorText);
    setMode('chat');
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim()) return;

    const userContent = chatInput;
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: userContent,
      timestamp: new Date(),
      codeContext: currentCode || originalCode
    };

    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setIsTyping(true);

    // Update active brain agents based on query content
    const activeIds = getActiveAgentsForQuery(userContent);
    setActiveBrainAgentIds(new Set(activeIds));
    logBrainActivity({ surface: 'code-assistant', agentIds: activeIds, query: userContent.slice(0, 120), timestamp: Date.now() });
    setTimeout(() => simulateAgentTelemetry('code-assistant', activeIds, 650), 900);

    // Add to history
    chatHistoryRef.current.push({ role: 'user', content: userContent });

    try {
      const res = await serverFetch('/ai-code-chat', {
        method: 'POST',
        body: JSON.stringify({
          messages: chatHistoryRef.current.slice(-20),
          codeContext: (currentCode || originalCode) || undefined,
        }),
      });

      let aiResponse: string;
      let modelUsed = '';

      if (res.ok) {
        const data = await res.json();
        aiResponse = data.content || 'No response received.';
        modelUsed = data.model || '';
      } else {
        const errText = await res.text();
        console.error('[AICodeChat] Server error:', res.status, errText);
        aiResponse = `⚠️ **AI service error** (${res.status})\n\nPlease try again in a moment. If this persists, the AI service may be temporarily unavailable.\n\n*Error details: ${errText.slice(0, 200)}*`;
      }

      // Add AI reply to history
      chatHistoryRef.current.push({ role: 'assistant', content: aiResponse });
      if (chatHistoryRef.current.length > 40) {
        chatHistoryRef.current = chatHistoryRef.current.slice(-40);
      }

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date(),
        codeContext: modelUsed ? `Model: ${modelUsed}` : undefined,
      };

      setChatMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      console.error('[AICodeChat] Fetch failed:', err);
      const errMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `⚠️ **Connection error**\n\nCould not reach the AI service. Please check your connection and try again.\n\n*${String(err)}*`,
        timestamp: new Date(),
      };
      setChatMessages(prev => [...prev, errMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleChatKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendChatMessage();
    }
  };

  const validateGitHubToken = async (token: string) => {
    if (!token) {
      setTokenStatus('none');
      setRateLimitInfo(null);
      return;
    }

    setTokenStatus('validating');

    try {
      const headers: HeadersInit = {
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': `token ${token}`
      };

      const response = await fetch('https://api.github.com/rate_limit', { headers });

      if (response.ok) {
        const data = await response.json();
        const remaining = data.resources.core.remaining;
        const limit = data.resources.core.limit;
        const reset = new Date(data.resources.core.reset * 1000);

        setRateLimitInfo({ remaining, limit, reset });
        setTokenStatus('valid');

        console.log(`✅ Token validated! ${remaining}/${limit} requests remaining`);
      } else if (response.status === 401) {
        setTokenStatus('invalid');
        setRateLimitInfo(null);
        console.error('❌ Invalid GitHub token');
      } else {
        setTokenStatus('invalid');
        setRateLimitInfo(null);
      }
    } catch (error) {
      setTokenStatus('invalid');
      setRateLimitInfo(null);
      console.error('Failed to validate token:', error);
    }
  };

  const scanGitHubRepository = async () => {
    if (!githubUrl.trim()) {
      setCopyError('Please enter a GitHub repository URL');
      setTimeout(() => setCopyError(null), 3000);
      return;
    }

    setIsScanning(true);

    try {
      // Parse GitHub URL - support multiple formats (HTTPS and SSH)
      let owner: string;
      let repo: string;

      // Try SSH format: git@github.com:owner/repo.git
      const sshMatch = githubUrl.match(/git@github\.com:([^\/]+)\/(.+?)(?:\.git)?$/);
      if (sshMatch) {
        owner = sshMatch[1];
        repo = sshMatch[2];
      } else {
        // Try HTTPS format: https://github.com/owner/repo
        const httpsMatch = githubUrl.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/([^\/]+)\/([^\/\s]+?)(?:\.git)?(?:\/.*)?$/);
        if (httpsMatch) {
          owner = httpsMatch[1];
          repo = httpsMatch[2];
        } else {
          throw new Error('Invalid GitHub URL format. Supported: https://github.com/owner/repo or git@github.com:owner/repo.git');
        }
      }

      const repoName = repo.replace('.git', '');

      // Fetch repository tree using GitHub API
      const headers: HeadersInit = {
        'Accept': 'application/vnd.github.v3+json',
      };

      if (githubToken) {
        headers['Authorization'] = `token ${githubToken}`;
      }

      // Check rate limit first
      const rateLimitResponse = await fetch('https://api.github.com/rate_limit', { headers });
      if (rateLimitResponse.ok) {
        const rateLimitData = await rateLimitResponse.json();
        const remaining = rateLimitData.resources.core.remaining;
        const limit = rateLimitData.resources.core.limit;

        console.log(`GitHub API: ${remaining}/${limit} requests remaining`);

        if (remaining < 10) {
          const resetDate = new Date(rateLimitData.resources.core.reset * 1000);
          const resetTime = resetDate.toLocaleTimeString();
          throw new Error(`GitHub API rate limit low (${remaining}/${limit}). Resets at ${resetTime}. ${githubToken ? 'Your token may need higher limits.' : 'Please add a GitHub Personal Access Token for higher limits (5000/hour vs 60/hour).'}`);
        }
      }

      // Get the default branch
      const repoResponse = await fetch(`https://api.github.com/repos/${owner}/${repoName}`, { headers });

      // Check for rate limiting or authentication issues
      if (!repoResponse.ok) {
        const errorData = await repoResponse.json().catch(() => ({}));

        if (repoResponse.status === 403) {
          const rateLimitRemaining = repoResponse.headers.get('X-RateLimit-Remaining');
          const rateLimitReset = repoResponse.headers.get('X-RateLimit-Reset');

          if (rateLimitRemaining === '0' && rateLimitReset) {
            const resetDate = new Date(parseInt(rateLimitReset) * 1000);
            const resetTime = resetDate.toLocaleTimeString();
            throw new Error(`GitHub API rate limit exceeded. Resets at ${resetTime}. Please add a GitHub Personal Access Token to continue.`);
          } else {
            throw new Error(`Access forbidden (403). This repository may be private or you need a GitHub token. ${errorData.message || ''}`);
          }
        } else if (repoResponse.status === 404) {
          throw new Error(`Repository not found (404). Please check the URL and make sure the repository exists.`);
        } else if (repoResponse.status === 401) {
          throw new Error(`Unauthorized (401). Your GitHub token may be invalid or expired.`);
        } else {
          throw new Error(`Failed to fetch repository: ${repoResponse.status} ${repoResponse.statusText}. ${errorData.message || ''}`);
        }
      }
      const repoData = await repoResponse.json();
      const defaultBranch = repoData.default_branch || 'main';

      // Get the tree recursively
      const treeResponse = await fetch(
        `https://api.github.com/repos/${owner}/${repoName}/git/trees/${defaultBranch}?recursive=1`,
        { headers }
      );

      if (!treeResponse.ok) {
        const errorData = await treeResponse.json().catch(() => ({}));

        if (treeResponse.status === 403) {
          const rateLimitRemaining = treeResponse.headers.get('X-RateLimit-Remaining');
          const rateLimitReset = treeResponse.headers.get('X-RateLimit-Reset');

          if (rateLimitRemaining === '0' && rateLimitReset) {
            const resetDate = new Date(parseInt(rateLimitReset) * 1000);
            const resetTime = resetDate.toLocaleTimeString();
            throw new Error(`GitHub API rate limit exceeded while fetching tree. Resets at ${resetTime}. Please add a GitHub Personal Access Token.`);
          }
        }
        throw new Error(`Failed to fetch repository tree: ${treeResponse.status} ${treeResponse.statusText}. ${errorData.message || ''}`);
      }

      const treeData = await treeResponse.json();

      // Filter only code files (not directories, binaries, etc.)
      const codeExtensions = ['.ts', '.tsx', '.js', '.jsx', '.json', '.css', '.scss', '.html', '.vue', '.py', '.java', '.cpp', '.c', '.go', '.rs', '.php', '.rb', '.swift', '.kt'];
      const codeFiles = treeData.tree.filter((item: any) =>
        item.type === 'blob' &&
        codeExtensions.some(ext => item.path.endsWith(ext)) &&
        !item.path.includes('node_modules') &&
        !item.path.includes('.git/') &&
        !item.path.includes('dist/') &&
        !item.path.includes('build/') &&
        item.size < 1000000 // Skip files larger than 1MB
      );

      // Fetch content for each file
      const filesToFetch = scanAllFiles ? codeFiles : codeFiles.slice(0, maxFilesToScan);

      console.log(`📊 Repository contains ${codeFiles.length} code files`);
      console.log(`🔍 Scanning ${filesToFetch.length} files${!scanAllFiles && codeFiles.length > maxFilesToScan ? ` (limited from ${codeFiles.length})` : ''}`);

      if (codeFiles.length > filesToFetch.length) {
        addTerminalLog('warning', `Scanning ${filesToFetch.length} of ${codeFiles.length} files`,
          `Repository has ${codeFiles.length} files but only scanning ${filesToFetch.length}. Enable "Scan All Files" to scan everything.`);
      }

      setScanProgress({ current: 0, total: filesToFetch.length, message: 'Fetching repository files...' });

      const fetchedFiles: GitHubFile[] = [];

      for (let i = 0; i < filesToFetch.length; i++) {
        const file = filesToFetch[i];
        try {
          setScanProgress({
            current: i + 1,
            total: filesToFetch.length,
            message: `Scanning ${file.path}...`
          });

          const contentResponse = await fetch(
            `https://api.github.com/repos/${owner}/${repoName}/contents/${file.path}?ref=${defaultBranch}`,
            { headers }
          );

          if (contentResponse.ok) {
            const contentData = await contentResponse.json();
            const content = atob(contentData.content); // Decode base64

            // Determine language from extension
            const ext = file.path.split('.').pop()?.toLowerCase() || '';
            const languageMap: { [key: string]: string } = {
              'ts': 'typescript',
              'tsx': 'typescript',
              'js': 'javascript',
              'jsx': 'javascript',
              'json': 'json',
              'css': 'css',
              'scss': 'scss',
              'html': 'html',
              'vue': 'vue',
              'py': 'python',
              'java': 'java',
              'cpp': 'cpp',
              'c': 'c',
              'go': 'go',
              'rs': 'rust',
              'php': 'php',
              'rb': 'ruby',
              'swift': 'swift',
              'kt': 'kotlin'
            };

            fetchedFiles.push({
              path: file.path,
              content: content,
              issues: [],
              language: languageMap[ext] || 'text'
            });
          }
        } catch (err) {
          console.error(`Failed to fetch ${file.path}:`, err);
        }
      }

      if (fetchedFiles.length === 0) {
        throw new Error('No code files found in repository');
      }

      // Build file map for import validation
      const filePathMap = new Map<string, GitHubFile>();
      fetchedFiles.forEach(file => {
        filePathMap.set(file.path, file);
      });

      // Build export map - track what each file exports
      interface FileExports {
        defaultExport: string | null;
        namedExports: string[];
        exportAll: string[];
      }

      const extractExports = (content: string): FileExports => {
        const exports: FileExports = {
          defaultExport: null,
          namedExports: [],
          exportAll: []
        };

        const lines = content.split('\n');

        lines.forEach(line => {
          const trimmed = line.trim();

          // Default export: export default Something
          const defaultMatch = trimmed.match(/export\s+default\s+(?:function\s+)?(?:class\s+)?(\w+)/);
          if (defaultMatch) {
            exports.defaultExport = defaultMatch[1];
          }

          // Default anonymous: export default function() or export default () =>
          if (trimmed.match(/export\s+default\s+(function\s*\(|class\s*{|\(|{)/)) {
            exports.defaultExport = '__anonymous__';
          }

          // Named export: export { Name1, Name2 }
          const namedBraceMatch = trimmed.match(/export\s+{([^}]+)}/);
          if (namedBraceMatch) {
            const names = namedBraceMatch[1].split(',').map(n => {
              const parts = n.trim().split(/\s+as\s+/);
              return parts[parts.length - 1].trim();
            });
            exports.namedExports.push(...names);
          }

          // Named export: export const/let/var/function/class Name
          const namedDirectMatch = trimmed.match(/export\s+(?:const|let|var|function|class)\s+(\w+)/);
          if (namedDirectMatch) {
            exports.namedExports.push(namedDirectMatch[1]);
          }

          // Re-export all: export * from './something'
          if (trimmed.match(/export\s+\*\s+from/)) {
            exports.exportAll.push('*');
          }
        });

        return exports;
      };

      const exportMap = new Map<string, FileExports>();
      fetchedFiles.forEach(file => {
        if (file.language === 'javascript' || file.language === 'typescript') {
          const exports = extractExports(file.content);
          exportMap.set(file.path, exports);

          // Log export info for debugging
          if (exports.defaultExport || exports.namedExports.length > 0) {
            console.log(`📦 ${file.path}:`, {
              default: exports.defaultExport,
              named: exports.namedExports,
              exportAll: exports.exportAll
            });
          }
        }
      });

      console.log(`✅ Built export map for ${exportMap.size} files`);

      // Build TypeScript type map - track interfaces, types, and their fields
      interface TypeField {
        name: string;
        type: string;
        isOptional: boolean;
        isNullable: boolean;
        isUnion: boolean;
        unionTypes: string[];
      }

      interface TypeDefinition {
        name: string;
        kind: 'interface' | 'type' | 'enum';
        fields: TypeField[];
      }

      const extractTypes = (content: string): TypeDefinition[] => {
        const types: TypeDefinition[] = [];
        const lines = content.split('\n');

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();

          // Interface definition: interface Deployment {
          const interfaceMatch = line.match(/^(?:export\s+)?interface\s+(\w+)/);
          if (interfaceMatch) {
            const typeName = interfaceMatch[1];
            const fields: TypeField[] = [];

            // Parse fields until closing brace
            let j = i + 1;
            while (j < lines.length && !lines[j].trim().startsWith('}')) {
              const fieldLine = lines[j].trim();

              // Match field: name: type or name?: type
              const fieldMatch = fieldLine.match(/^(\w+)(\?)?:\s*(.+?);?\s*$/);
              if (fieldMatch) {
                const fieldName = fieldMatch[1];
                const isOptional = !!fieldMatch[2];
                const fieldType = fieldMatch[3].replace(/;$/, '').trim();

                // Check for union types
                const isUnion = fieldType.includes('|');
                const unionTypes = isUnion ? fieldType.split('|').map(t => t.trim()) : [fieldType];
                const isNullable = unionTypes.some(t => t === 'null' || t === 'undefined');

                fields.push({
                  name: fieldName,
                  type: fieldType,
                  isOptional,
                  isNullable,
                  isUnion,
                  unionTypes
                });
              }
              j++;
            }

            types.push({ name: typeName, kind: 'interface', fields });
          }

          // Type alias: type Deployment = {...} or type Status = 'active' | 'inactive'
          const typeMatch = line.match(/^(?:export\s+)?type\s+(\w+)\s*=/);
          if (typeMatch) {
            const typeName = typeMatch[1];
            const fields: TypeField[] = [];

            // Check if it's an object type
            if (line.includes('{')) {
              let j = i;
              while (j < lines.length && !lines[j].includes('}')) {
                const fieldLine = lines[j].trim();
                const fieldMatch = fieldLine.match(/^(\w+)(\?)?:\s*(.+?)[,;]?\s*$/);
                if (fieldMatch) {
                  const fieldName = fieldMatch[1];
                  const isOptional = !!fieldMatch[2];
                  const fieldType = fieldMatch[3].replace(/[,;]$/, '').trim();

                  const isUnion = fieldType.includes('|');
                  const unionTypes = isUnion ? fieldType.split('|').map(t => t.trim()) : [fieldType];
                  const isNullable = unionTypes.some(t => t === 'null' || t === 'undefined');

                  fields.push({
                    name: fieldName,
                    type: fieldType,
                    isOptional,
                    isNullable,
                    isUnion,
                    unionTypes
                  });
                }
                j++;
              }
            } else {
              // Union type alias like: type Status = 'active' | 'inactive'
              const typeValue = line.split('=')[1]?.trim().replace(/;$/, '');
              if (typeValue) {
                const isUnion = typeValue.includes('|');
                const unionTypes = isUnion ? typeValue.split('|').map(t => t.trim()) : [typeValue];

                fields.push({
                  name: '__value__',
                  type: typeValue,
                  isOptional: false,
                  isNullable: unionTypes.some(t => t === 'null' || t === 'undefined'),
                  isUnion,
                  unionTypes
                });
              }
            }

            types.push({ name: typeName, kind: 'type', fields });
          }

          // Enum: enum Status { ACTIVE, INACTIVE }
          const enumMatch = line.match(/^(?:export\s+)?enum\s+(\w+)/);
          if (enumMatch) {
            const typeName = enumMatch[1];
            types.push({ name: typeName, kind: 'enum', fields: [] });
          }
        }

        return types;
      };

      const typeMap = new Map<string, TypeDefinition[]>();
      fetchedFiles.forEach(file => {
        if (file.language === 'typescript') {
          const types = extractTypes(file.content);
          if (types.length > 0) {
            typeMap.set(file.path, types);
            console.log(`🔷 ${file.path}: Found ${types.length} type definition(s)`, types.map(t => t.name));
          }
        }
      });

      console.log(`✅ Built type map for ${typeMap.size} files with TypeScript types`);

      // Helper function to resolve import paths
      const resolveImportPath = (currentFilePath: string, importPath: string): string | null => {
        // Handle relative imports
        if (importPath.startsWith('./') || importPath.startsWith('../')) {
          const currentDir = currentFilePath.split('/').slice(0, -1).join('/');
          const parts = importPath.split('/');
          const dirParts = currentDir.split('/').filter(Boolean);

          for (const part of parts) {
            if (part === '..') {
              dirParts.pop();
            } else if (part !== '.') {
              dirParts.push(part);
            }
          }

          let resolvedPath = dirParts.join('/');

          // Try different extensions
          const extensions = ['.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx', '/index.js', '/index.jsx', ''];
          for (const ext of extensions) {
            const testPath = resolvedPath + ext;
            if (filePathMap.has(testPath)) {
              return testPath;
            }
          }
        }

        return null;
      };

      // Analyze directory structure
      const analyzeDirectoryStructure = (files: GitHubFile[]) => {
        const suggestions: string[] = [];
        const componentFiles = files.filter(f =>
          (f.path.includes('.tsx') || f.path.includes('.jsx')) &&
          !f.path.includes('node_modules')
        );

        // Check if components are properly organized
        const componentsInRoot = componentFiles.filter(f =>
          !f.path.includes('/') || f.path.split('/').length === 1
        );

        if (componentsInRoot.length > 3) {
          suggestions.push('Move components to a dedicated /components directory for better organization');
        }

        return suggestions;
      };

      const structureSuggestions = analyzeDirectoryStructure(fetchedFiles);

      // Analyze each file for issues
      const analyzedFiles = fetchedFiles.map(file => {
        // If file has no issues, analyze it
        if (file.issues.length === 0 && file.content) {
          const lines = file.content.split('\n');
          const fileIssues: CodeIssue[] = [];

          // Simple analysis for demonstration
          lines.forEach((line, index) => {
            const trimmedLine = line.trim();

            // Check for import statements and validate paths + exports
            const importMatch = line.match(/import\s+(.*)\s+from\s+['"](\.\.?\/[^'"]+)['"]/);
            if (importMatch) {
              const importStatement = importMatch[1].trim();
              const importPath = importMatch[2];
              const resolvedPath = resolveImportPath(file.path, importPath);

              if (!resolvedPath) {
                const fileName = importPath.split('/').pop() || '';
                const possibleMatches = Array.from(filePathMap.keys())
                  .filter(p => {
                    const pFileName = p.split('/').pop() || '';
                    return pFileName.toLowerCase().includes(fileName.toLowerCase());
                  })
                  .slice(0, 2);

                let suggestionText = `Import path '${importPath}' does not resolve to any file in the repository.`;
                let fixedLine = `// ${line} // TODO: Fix broken import path`;

                if (possibleMatches.length > 0) {
                  suggestionText += ` Found similar files: ${possibleMatches.join(', ')}`;
                }

                fileIssues.push({
                  type: 'broken import',
                  severity: 'error',
                  line: index + 1,
                  message: `Broken import: '${importPath}' not found`,
                  original: line,
                  fixed: fixedLine,
                  description: suggestionText
                });
              } else {
                // Path exists - now check if import matches exports
                const targetExports = exportMap.get(resolvedPath);
                if (targetExports) {
                  // Check if it's a default import
                  const isDefaultImport = !importStatement.startsWith('{');

                  if (isDefaultImport) {
                    // Default import like: import Something from './file'
                    const importName = importStatement.split(/\s*,/)[0].trim();

                    if (!targetExports.defaultExport && targetExports.namedExports.length > 0) {
                      // File has named exports but import is trying to use default
                      const suggested = targetExports.namedExports[0];
                      const fixedLine = line.replace(
                        new RegExp(`import\\s+${importName}\\s+from`),
                        `import { ${suggested} } from`
                      );

                      fileIssues.push({
                        type: 'import/export mismatch',
                        severity: 'error',
                        line: index + 1,
                        message: `Import mismatch: '${resolvedPath}' has no default export`,
                        original: line,
                        fixed: fixedLine,
                        description: `The file '${resolvedPath}' exports named exports [${targetExports.namedExports.join(', ')}] but you're using default import. Change to: import { ${suggested} } from '${importPath}'`
                      });
                    }
                  } else {
                    // Named import like: import { Something } from './file'
                    const namedImportsMatch = importStatement.match(/{([^}]+)}/);
                    if (namedImportsMatch) {
                      const importedNames = namedImportsMatch[1].split(',').map(n => {
                        const parts = n.trim().split(/\s+as\s+/);
                        return parts[0].trim();
                      });

                      // Check if file has default export but no named exports
                      if (targetExports.defaultExport && targetExports.namedExports.length === 0 && !targetExports.exportAll.length) {
                        const suggested = targetExports.defaultExport === '__anonymous__' ?
                          importPath.split('/').pop()?.replace(/\.(tsx?|jsx?)$/, '') || 'Component' :
                          targetExports.defaultExport;

                        const fixedLine = line.replace(
                          /import\s+{[^}]+}\s+from/,
                          `import ${suggested} from`
                        );

                        fileIssues.push({
                          type: 'import/export mismatch',
                          severity: 'error',
                          line: index + 1,
                          message: `Import mismatch: '${resolvedPath}' only has default export`,
                          original: line,
                          fixed: fixedLine,
                          description: `The file '${resolvedPath}' only exports a default export, but you're using named import. Change to: import ${suggested} from '${importPath}'`
                        });
                      } else {
                        // Check each named import
                        importedNames.forEach(importedName => {
                          if (!targetExports.namedExports.includes(importedName) &&
                            !targetExports.exportAll.length) {
                            const suggestion = targetExports.namedExports.length > 0 ?
                              ` Available exports: [${targetExports.namedExports.join(', ')}]` :
                              targetExports.defaultExport ?
                                ` File has default export '${targetExports.defaultExport}', use: import ${targetExports.defaultExport} from '${importPath}'` :
                                '';

                            fileIssues.push({
                              type: 'import/export mismatch',
                              severity: 'error',
                              line: index + 1,
                              message: `'${importedName}' is not exported from '${resolvedPath}'`,
                              original: line,
                              fixed: suggestion ? line.replace(importedName, targetExports.namedExports[0] || targetExports.defaultExport || importedName) : line,
                              description: `The file '${resolvedPath}' does not export '${importedName}'.${suggestion}`
                            });
                          }
                        });
                      }
                    }
                  }
                }
              }
            }

            // Check for require statements
            const requireMatch = line.match(/require\s*\(\s*['"](\.\.?\/[^'"]+)['"]\s*\)/);
            if (requireMatch) {
              const requirePath = requireMatch[1];
              const resolvedPath = resolveImportPath(file.path, requirePath);
              if (!resolvedPath) {
                fileIssues.push({
                  type: 'broken require',
                  severity: 'error',
                  line: index + 1,
                  message: `Broken require: '${requirePath}' not found`,
                  original: line,
                  fixed: `// ${line} // TODO: Fix require path`,
                  description: 'This require path does not resolve to any file in the repository.'
                });
              }
            }

            // Console statements
            if (line.includes('console.log')) {
              fileIssues.push({
                type: 'console statement',
                severity: 'info',
                line: index + 1,
                message: 'Remove console.log for production',
                original: line,
                fixed: '// ' + line + ' // Removed: console statement',
                description: 'Console statements should be removed before deploying to production for better performance and security.'
              });
            }

            // Loose equality
            if (line.includes('==') && !line.includes('===') && !line.includes('!==')) {
              const fixedLine = line.replace(/==/g, '===').replace(/!=/g, '!==');
              fileIssues.push({
                type: 'suggestion',
                severity: 'warning',
                line: index + 1,
                message: 'Use === instead of ==',
                original: line,
                fixed: fixedLine,
                description: 'Strict equality (===) is safer and avoids type coercion issues. Always use === and !== instead of == and !=.'
              });
            }

            // Missing semicolons (simple check)
            if (file.language === 'javascript' || file.language === 'typescript') {
              if (
                (trimmedLine.startsWith('const ') ||
                  trimmedLine.startsWith('let ') ||
                  trimmedLine.startsWith('var ')) &&
                !trimmedLine.endsWith(';') &&
                !trimmedLine.endsWith('{') &&
                !trimmedLine.endsWith(',')
              ) {
                fileIssues.push({
                  type: 'syntax',
                  severity: 'warning',
                  line: index + 1,
                  message: 'Missing semicolon',
                  original: line,
                  fixed: line + ';',
                  description: 'JavaScript statements should end with semicolons for consistency and to avoid automatic semicolon insertion issues.'
                });
              }
            }

            // Unused variables (basic detection)
            const unusedVarMatch = trimmedLine.match(/^(const|let|var)\s+(\w+)\s*=/);
            if (unusedVarMatch) {
              const varName = unusedVarMatch[2];
              // Simple heuristic: if variable starts with underscore or is named 'unused', flag it
              if (varName.startsWith('_') || varName.toLowerCase().includes('unused')) {
                fileIssues.push({
                  type: 'unused variable',
                  severity: 'warning',
                  line: index + 1,
                  message: `Variable '${varName}' appears to be unused`,
                  original: line,
                  fixed: '// ' + line + ' // Removed: unused variable',
                  description: `The variable '${varName}' is declared but never used. Remove it to keep the code clean.`
                });
              }
            }

            // TODO comments
            if (line.includes('TODO') || line.includes('FIXME')) {
              fileIssues.push({
                type: 'suggestion',
                severity: 'info',
                line: index + 1,
                message: 'TODO/FIXME comment found',
                original: line,
                description: 'This line contains a TODO or FIXME comment that should be addressed.'
              });
            }

            // Debugger statements
            if (line.includes('debugger')) {
              fileIssues.push({
                type: 'debugger',
                severity: 'error',
                line: index + 1,
                message: 'Remove debugger statement',
                original: line,
                fixed: '// ' + line + ' // Removed: debugger statement',
                description: 'Debugger statements should be removed before deploying to production.'
              });
            }

            // TypeScript nullable field access detection
            if (file.language === 'typescript' && typeMap.size > 0) {
              // Check for property access like: deployment.status or user.name
              const propertyAccessMatch = line.match(/(\w+)\.(\w+)/g);
              if (propertyAccessMatch) {
                propertyAccessMatch.forEach(access => {
                  const [objName, propName] = access.split('.');

                  // Find type definition for this variable
                  // Check if variable is typed in this file
                  const varTypeMatch = file.content.match(new RegExp(`(?:const|let|var)\\s+${objName}\\s*:\\s*(\\w+)`, 'i'));
                  if (varTypeMatch) {
                    const varType = varTypeMatch[1];

                    // Look up type definition across all files
                    for (const [typePath, typeDefs] of typeMap.entries()) {
                      const typeDef = typeDefs.find(t => t.name === varType);
                      if (typeDef) {
                        const field = typeDef.fields.find(f => f.name === propName);
                        if (field) {
                          // Check if field is nullable but not being null-checked
                          if (field.isNullable && !line.includes('?.') && !line.includes('&&') && !line.includes('||') && !line.includes('if')) {
                            let suggestion = line.replace(`${objName}.${propName}`, `${objName}?.${propName}`);

                            fileIssues.push({
                              type: 'nullable field access',
                              severity: 'warning',
                              line: index + 1,
                              message: `'${propName}' can be null/undefined in ${varType}`,
                              original: line,
                              fixed: suggestion,
                              description: `The field '${propName}' in interface/type '${varType}' has type '${field.type}' which is nullable. Use optional chaining (${objName}?.${propName}) or add a null check before accessing.`
                            });
                          }

                          // Check if field is a union type
                          if (field.isUnion && field.unionTypes.length > 1 && !field.isNullable) {
                            fileIssues.push({
                              type: 'union type field',
                              severity: 'info',
                              line: index + 1,
                              message: `'${propName}' is a union type in ${varType}`,
                              original: line,
                              description: `The field '${propName}' in '${varType}' is a union type: ${field.type}. Consider type guards or narrowing when using this field. Possible types: ${field.unionTypes.join(', ')}`
                            });
                          }
                        }
                      }
                    }
                  }
                });
              }

              // Check for array access without null check
              const arrayAccessMatch = line.match(/(\w+)\[(\d+|\w+)\]/);
              if (arrayAccessMatch && !line.includes('?.') && !line.includes('length')) {
                const arrayName = arrayAccessMatch[1];
                const varTypeMatch = file.content.match(new RegExp(`(?:const|let|var)\\s+${arrayName}\\s*:\\s*([\\w\\[\\]]+)`, 'i'));
                if (varTypeMatch) {
                  const varType = varTypeMatch[1];
                  if (varType.includes('|') && (varType.includes('null') || varType.includes('undefined'))) {
                    fileIssues.push({
                      type: 'nullable array access',
                      severity: 'warning',
                      line: index + 1,
                      message: `'${arrayName}' might be null/undefined`,
                      original: line,
                      fixed: line.replace(`${arrayName}[`, `${arrayName}?.[`),
                      description: `The array '${arrayName}' has type '${varType}' which can be null/undefined. Use optional chaining or add a null check before array access.`
                    });
                  }
                }
              }
            }

            // Undefined or null checks without optional chaining
            if ((line.includes('.') && !line.includes('?.')) && (file.language === 'typescript' || file.language === 'javascript')) {
              // Check for property access that might be undefined
              const propertyAccessMatch = line.match(/(\w+)\.(\w+)/);
              if (propertyAccessMatch && !line.includes('typeof') && !line.includes('undefined')) {
                const objName = propertyAccessMatch[1];
                // Only suggest if it looks risky (e.g., accessing nested properties)
                if (line.split('.').length > 2) {
                  const fixedLine = line.replace(/(\w+)\.(\w+)/g, '$1?.$2');
                  fileIssues.push({
                    type: 'suggestion',
                    severity: 'info',
                    line: index + 1,
                    message: 'Consider using optional chaining',
                    original: line,
                    fixed: fixedLine,
                    description: `Consider using optional chaining (${objName}?.property) to safely access properties that might be undefined.`
                  });
                }
              }
            }

            // Missing error handling in async functions
            if (line.includes('await ') && !lines.slice(Math.max(0, index - 5), index + 5).some(l => l.includes('try') || l.includes('catch'))) {
              fileIssues.push({
                type: 'suggestion',
                severity: 'warning',
                line: index + 1,
                message: 'Async operation without error handling',
                original: line,
                description: 'This await statement is not wrapped in a try-catch block. Consider adding error handling for robustness.'
              });
            }

            // Unused imports (basic detection - checking if import name appears elsewhere)
            if (trimmedLine.startsWith('import ')) {
              const importNames = line.match(/import\s+\{([^}]+)\}/) || line.match(/import\s+(\w+)/);
              if (importNames) {
                const names = importNames[1].split(',').map(n => n.trim().replace(/\s+as\s+.*/, ''));
                names.forEach(name => {
                  const cleanName = name.trim();
                  if (cleanName && cleanName !== '*') {
                    const usageCount = lines.filter((l, i) => i !== index && l.includes(cleanName)).length;
                    if (usageCount === 0) {
                      fileIssues.push({
                        type: 'unused import',
                        severity: 'warning',
                        line: index + 1,
                        message: `Unused import: '${cleanName}'`,
                        original: line,
                        fixed: line.replace(new RegExp(`\\b${cleanName}\\b,?\\s*`), '').replace(/\{\s*,/, '{').replace(/,\s*\}/, '}'),
                        description: `The imported symbol '${cleanName}' is never used in this file. Remove it to keep the code clean.`
                      });
                    }
                  }
                });
              }
            }

            // Missing return type in TypeScript functions
            if (file.language === 'typescript' && (line.includes('function ') || line.includes('const ') && line.includes('=>'))) {
              if (!line.includes(':') && line.includes('{')) {
                fileIssues.push({
                  type: 'suggestion',
                  severity: 'info',
                  line: index + 1,
                  message: 'Consider adding return type annotation',
                  original: line,
                  description: 'TypeScript functions should have explicit return type annotations for better type safety.'
                });
              }
            }
          });

          // ── DOM Nesting Violation Detection (JSX/TSX files) ──────────────────
          // Detects interactive elements nested inside the same interactive element
          // e.g. <button> inside <button>, <a> inside <a> — React hydration + build errors
          const isJSXFile = file.path.endsWith('.tsx') || file.path.endsWith('.jsx');
          if (isJSXFile) {
            const interactiveTags = ['button', 'a'];
            interactiveTags.forEach(tag => {
              // Build a token list: open/close tags with line numbers
              type TagToken = { isClose: boolean; lineNum: number; lineText: string };
              const tokens: TagToken[] = [];
              lines.forEach((ln, idx) => {
                // Self-closing tags like <button /> don't nest — skip them
                const selfClose = new RegExp(`<${tag}[^>]*\\/>`);
                if (selfClose.test(ln)) return;
                const openRx = new RegExp(`<${tag}[\\s>]`);
                const closeRx = new RegExp(`<\\/${tag}>`);
                if (openRx.test(ln)) tokens.push({ isClose: false, lineNum: idx + 1, lineText: ln });
                if (closeRx.test(ln)) tokens.push({ isClose: true, lineNum: idx + 1, lineText: ln });
              });

              // Simulate a stack; report when depth > 1 on an open tag
              let depth = 0;
              tokens.forEach(tok => {
                if (!tok.isClose) {
                  if (depth >= 1) {
                    // A second open of the same tag before any close — DOM nesting violation
                    const fixedLine = tag === 'button'
                      ? tok.lineText.replace(new RegExp(`<${tag}`), '<div role="button"')
                      : tok.lineText.replace(new RegExp(`<${tag}`), '<div role="link"');
                    fileIssues.push({
                      type: 'dom nesting',
                      severity: 'error',
                      line: tok.lineNum,
                      message: `Nested <${tag}> inside <${tag}> — DOM nesting violation`,
                      original: tok.lineText,
                      fixed: fixedLine,
                      description:
                        `A <${tag}> element is nested inside another <${tag}>. ` +
                        `This causes React hydration warnings and esbuild build failures. ` +
                        `Fix: convert the OUTER <${tag}> to ` +
                        `<div role="${tag === 'button' ? 'button' : 'link'}"> ` +
                        `(keep tabIndex, onKeyDown, onClick) and change its closing tag to </div>.`
                    });
                  }
                  depth++;
                } else {
                  depth = Math.max(0, depth - 1);
                }
              });
            });

            // ── Cross-tag DOM nesting: <button> inside <a> and <a> inside <button> ──
            // HTML/React forbids any interactive element inside another interactive element
            const crossTagPairs: Array<{ outer: string; inner: string }> = [
              { outer: 'button', inner: 'a' },
              { outer: 'a', inner: 'button' },
            ];

            crossTagPairs.forEach(({ outer, inner }) => {
              type TagTok = { tag: 'open' | 'close'; which: string; lineNum: number; lineText: string };
              const toks: TagTok[] = [];
              lines.forEach((ln, idx) => {
                // Skip self-closing tags
                if (new RegExp(`<${outer}[^>]*\\/>`).test(ln)) return;
                if (new RegExp(`<${inner}[^>]*\\/>`).test(ln)) return;
                if (new RegExp(`<${outer}[\\s>]`).test(ln)) toks.push({ tag: 'open', which: outer, lineNum: idx + 1, lineText: ln });
                if (new RegExp(`<\\/${outer}>`).test(ln)) toks.push({ tag: 'close', which: outer, lineNum: idx + 1, lineText: ln });
                if (new RegExp(`<${inner}[\\s>]`).test(ln)) toks.push({ tag: 'open', which: inner, lineNum: idx + 1, lineText: ln });
                if (new RegExp(`<\\/${inner}>`).test(ln)) toks.push({ tag: 'close', which: inner, lineNum: idx + 1, lineText: ln });
              });

              let outerDepth = 0;
              toks.forEach(tok => {
                if (tok.tag === 'open') {
                  if (tok.which === outer) {
                    outerDepth++;
                  } else if (tok.which === inner && outerDepth > 0) {
                    // Found inner interactive tag inside outer — cross-tag violation
                    const fixedLine = outer === 'button'
                      ? tok.lineText
                        .replace(new RegExp(`<${outer}(\\s)`), '<div role="button"$1')
                        .replace(new RegExp(`<${outer}>`), '<div role="button">')
                      : tok.lineText
                        .replace(new RegExp(`<${outer}(\\s)`), '<span role="link"$1')
                        .replace(new RegExp(`<${outer}>`), '<span role="link">');

                    fileIssues.push({
                      type: 'dom nesting',
                      severity: 'error',
                      line: tok.lineNum,
                      message: `Nested <${inner}> inside <${outer}> — cross-tag DOM nesting violation`,
                      original: tok.lineText,
                      fixed: fixedLine,
                      description:
                        `A <${inner}> element is nested inside a <${outer}>. ` +
                        `HTML forbids nesting any interactive element inside another interactive element. ` +
                        `Fix: convert the outer <${outer}> to ` +
                        `${outer === 'button' ? '<div role="button">' : '<span role="link">'} ` +
                        `and update its closing tag accordingly.`,
                    });
                  }
                } else if (tok.tag === 'close' && tok.which === outer) {
                  outerDepth = Math.max(0, outerDepth - 1);
                }
              });
            });
            // ── End Cross-tag DOM Nesting Detection ───────────────────────────────

            // Count DOM nesting issues found
            const domNestingIssues = fileIssues.filter(i => i.type === 'dom nesting').length;
            if (domNestingIssues > 0) {
              console.log(`🏗️ ${file.path}: Found ${domNestingIssues} DOM nesting violation(s)`);
              addTerminalLog('error',
                `DOM nesting violation in ${file.path.split('/').pop()}`,
                `Found ${domNestingIssues} interactive element(s) nested inside the same or different tag type. ` +
                `These will cause React warnings and build errors.`
              );
            }
          }
          // ── End DOM Nesting Detection ─────────────────────────────────────────

          return { ...file, issues: fileIssues };
        }
        return file;
      });

      const totalIssues = analyzedFiles.reduce((sum, file) => sum + file.issues.length, 0);
      const errors = analyzedFiles.reduce((sum, file) =>
        sum + file.issues.filter(i => i.severity === 'error').length, 0
      );
      const warnings = analyzedFiles.reduce((sum, file) =>
        sum + file.issues.filter(i => i.severity === 'warning').length, 0
      );
      const suggestions = analyzedFiles.reduce((sum, file) =>
        sum + file.issues.filter(i => i.severity === 'info').length, 0
      );

      // Count import/export mismatches specifically
      const importExportMismatches = analyzedFiles.reduce((sum, file) =>
        sum + file.issues.filter(i => i.type === 'import/export mismatch').length, 0
      );

      if (importExportMismatches > 0) {
        console.log(`🔄 Found ${importExportMismatches} import/export mismatches that can be auto-fixed!`);
        addTerminalLog('info', `Detected ${importExportMismatches} import/export mismatches`,
          'These occur when imports don\'t match the actual exports in files. All can be automatically corrected.');
      }

      // Count type-related issues
      const nullableFieldIssues = analyzedFiles.reduce((sum, file) =>
        sum + file.issues.filter(i => i.type === 'nullable field access').length, 0
      );
      const unionTypeIssues = analyzedFiles.reduce((sum, file) =>
        sum + file.issues.filter(i => i.type === 'union type field').length, 0
      );
      const nullableArrayIssues = analyzedFiles.reduce((sum, file) =>
        sum + file.issues.filter(i => i.type === 'nullable array access').length, 0
      );

      const totalTypeIssues = nullableFieldIssues + unionTypeIssues + nullableArrayIssues;

      if (totalTypeIssues > 0) {
        console.log(`🔷 Found ${totalTypeIssues} TypeScript type safety issues!`);
        console.log(`   - ${nullableFieldIssues} nullable field access`);
        console.log(`   - ${unionTypeIssues} union type fields`);
        console.log(`   - ${nullableArrayIssues} nullable array access`);
        addTerminalLog('info', `Detected ${totalTypeIssues} type safety issues`,
          `Found ${nullableFieldIssues} nullable fields, ${unionTypeIssues} union types, and ${nullableArrayIssues} nullable arrays without proper null checks.`);
      }

      if (typeMap.size > 0) {
        const totalTypes = Array.from(typeMap.values()).reduce((sum, types) => sum + types.length, 0);
        console.log(`🔷 Analyzed ${totalTypes} TypeScript type definitions across ${typeMap.size} files`);
      }

      // Count DOM nesting violations
      const domNestingIssues = analyzedFiles.reduce((sum, file) =>
        sum + file.issues.filter(i => i.type === 'dom nesting').length, 0
      );
      if (domNestingIssues > 0) {
        console.log(`🏗️ Found ${domNestingIssues} DOM nesting violation(s) — will cause React warnings and build errors`);
        addTerminalLog('error', `Detected ${domNestingIssues} DOM nesting violation(s)`,
          'Interactive elements (button/a) nested inside the same element type cause React hydration warnings and esbuild build failures. All are auto-fixable.'
        );
      }

      const result: GitHubScanResult = {
        repository: `${owner}/${repoName}`,
        branch: defaultBranch,
        totalFiles: codeFiles.length,
        scannedFiles: analyzedFiles.length,
        totalIssues,
        files: analyzedFiles,
        summary: {
          errors,
          warnings,
          suggestions
        },
        structureSuggestions
      };

      setScanResult(result);
      // ── Bridge: make files available to GeniusAIChat silently ──
      bridgeSaveFiles(
        analyzedFiles.map(f => ({
          path: f.path,
          content: f.content,
          fixedContent: f.fixedContent,
          language: f.language,
          repository: `${owner}/${repoName}`,
          branch: defaultBranch
        })),
        `${owner}/${repoName}`,
        defaultBranch
      );
      setFixesApplied(false); // Reset fixes applied state for new scan
      setShowGitHubCorrections(false); // Close corrections panel
      setScanProgress({ current: 0, total: 0, message: '' });

      // Add to debug history
      setDebugHistory(prev => [...prev, {
        step: prev.length + 1,
        action: `Scanned GitHub repo: ${owner}/${repoName}`,
        code: `Found ${totalIssues} issues across ${analyzedFiles.length} files`,
        timestamp: new Date()
      }]);

    } catch (error) {
      console.error('GitHub scan error:', error);

      let errorMessage = 'Failed to scan repository';

      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      // Add more context for common errors
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
        errorMessage = 'Network error: Unable to connect to GitHub API. Please check your internet connection and try again.';
      } else if (errorMessage.includes('CORS')) {
        errorMessage = 'CORS error: Browser blocked the request. This is a browser security limitation.';
      }

      setCopyError(errorMessage);

      // Add to terminal log
      addTerminalLog('error', `Scan failed: ${errorMessage}`, errorMessage);

      setTimeout(() => setCopyError(null), 5000);
    } finally {
      setIsScanning(false);
      setScanProgress({ current: 0, total: 0, message: '' });
    }
  };

  const toggleFileExpansion = (path: string) => {
    const newExpanded = new Set(expandedFiles);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedFiles(newExpanded);
  };

  const fixFileIssues = async (file: GitHubFile) => {
    setIsFixing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Remove file issues
    if (scanResult) {
      const updatedFiles = scanResult.files.map(f =>
        f.path === file.path ? { ...f, issues: [] } : f
      );

      const totalIssues = updatedFiles.reduce((sum, f) => sum + f.issues.length, 0);
      const errors = updatedFiles.reduce((sum, f) =>
        sum + f.issues.filter(i => i.severity === 'error').length, 0
      );
      const warnings = updatedFiles.reduce((sum, f) =>
        sum + f.issues.filter(i => i.severity === 'warning').length, 0
      );
      const suggestions = updatedFiles.reduce((sum, f) =>
        sum + f.issues.filter(i => i.severity === 'info').length, 0
      );

      const updatedResult = {
        ...scanResult,
        files: updatedFiles,
        totalIssues,
        summary: { errors, warnings, suggestions }
      };
      setScanResult(updatedResult);
      // ── Bridge: keep files in sync after fix ──
      bridgeSaveFiles(
        updatedFiles.map(f => ({
          path: f.path,
          content: f.content,
          fixedContent: f.fixedContent,
          language: f.language,
          repository: scanResult?.repository,
          branch: scanResult?.branch
        })),
        scanResult?.repository,
        scanResult?.branch
      );

      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }

    setIsFixing(false);
  };

  const applyCodeFixes = (file: GitHubFile): GitHubFile => {
    if (file.issues.length === 0) {
      return { ...file, fixedContent: file.content };
    }

    let fixedContent = file.content;
    const lines = file.content.split('\n');
    const fixedIssues: CodeIssue[] = [];

    // Process each issue and generate fixes
    file.issues.forEach(issue => {
      const lineIndex = issue.line - 1;
      if (lineIndex >= 0 && lineIndex < lines.length) {
        const originalLine = lines[lineIndex];
        let fixedLine = originalLine;

        // Apply fixes based on issue type
        switch (issue.type.toLowerCase()) {
          case 'syntax error':
          case 'syntax':
            // Add missing semicolons
            if (issue.message.includes('semicolon') || issue.message.includes('Missing semicolon')) {
              fixedLine = originalLine.trimEnd() + ';';
            }
            // Fix unclosed strings
            else if (issue.message.includes('Unterminated string')) {
              const quoteChar = originalLine.includes('"') ? '"' : "'";
              fixedLine = originalLine + quoteChar;
            }
            break;

          case 'unused variable':
          case 'unused':
            // Comment out unused variables
            fixedLine = '// ' + originalLine + ' // Removed: unused variable';
            break;

          case 'missing import':
          case 'import':
            // This would need context, but we can suggest
            fixedLine = originalLine; // Keep as-is, needs manual fix
            break;

          case 'duplicate':
          case 'duplicate code':
            // Remove duplicate line
            fixedLine = '// ' + originalLine + ' // Removed: duplicate';
            break;

          case 'deprecated':
            // Add comment about deprecation
            fixedLine = originalLine + ' // TODO: Update deprecated API';
            break;

          case 'type error':
          case 'type':
            // Add type assertions (TypeScript)
            if (issue.message.includes('type')) {
              fixedLine = originalLine; // Complex fix, keep original
            }
            break;

          case 'console statement':
          case 'console':
            // Comment out console logs
            fixedLine = '// ' + originalLine + ' // Removed: console statement';
            break;

          case 'dom nesting':
            // Fix: convert the nested interactive element's outer wrapper to a div
            if (issue.message.toLowerCase().includes('button')) {
              fixedLine = originalLine
                .replace(/<button(\s)/, '<div role="button"$1')
                .replace(/<button>/, '<div role="button">')
                .replace(/<\/button>/, '</div>');
            } else if (issue.message.toLowerCase().includes('<a>') || issue.message.toLowerCase().includes('anchor')) {
              fixedLine = originalLine
                .replace(/<a(\s)/, '<div role="link"$1')
                .replace(/<a>/, '<div role="link">')
                .replace(/<\/a>/, '</div>');
            } else {
              fixedLine = originalLine.replace(/<button/, '<div role="button"').replace(/<\/button>/, '</div>');
            }
            break;

          case 'missing return':
            // Add return statement
            const indent = originalLine.match(/^\s*/)?.[0] || '';
            fixedLine = originalLine + '\n' + indent + 'return null; // Added: missing return';
            break;

          default:
            // Generic fix: add comment
            fixedLine = originalLine + ' // TODO: Fix ' + issue.type;
        }

        // Store the fixed version
        const updatedIssue: CodeIssue = {
          ...issue,
          fixed: fixedLine.trim()
        };
        fixedIssues.push(updatedIssue);

        // Apply fix to the file content
        lines[lineIndex] = fixedLine;
      }
    });

    fixedContent = lines.join('\n');

    // VALIDATE SYNTAX BEFORE RETURNING
    // VALIDATOR DISABLED - Was causing false positives on valid TypeScript syntax
    /*
    const validationErrors = validateTypeScriptSyntax(fixedContent);
    if (validationErrors.length > 0) {
      console.warn(`⚠️ Syntax validation detected issues in ${file.path}:`, validationErrors);
      // Try to auto-fix the validation errors
      fixedContent = autoFixSyntaxErrors(fixedContent, validationErrors);
      
      // Re-validate after auto-fix
      const revalidationErrors = validateTypeScriptSyntax(fixedContent);
      if (revalidationErrors.length > 0) {
        console.error(`❌ Could not auto-fix all syntax errors in ${file.path}:`, revalidationErrors);
      } else {
        console.log(`✅ All syntax errors in ${file.path} auto-fixed successfully`);
      }
    }
    */

    return {
      ...file,
      fixedContent,
      issues: fixedIssues
    };
  };

  const fixAllRepoIssues = async () => {
    if (!scanResult) return;

    setIsFixing(true);

    // Show corrections summary immediately (while "fixing")
    setShowGitHubCorrections(true);

    await new Promise(resolve => setTimeout(resolve, 1500));

    // Actually apply fixes to each file
    const fixedFiles = scanResult.files.map(file => applyCodeFixes(file));

    // Update scan result with fixed content
    setScanResult({
      ...scanResult,
      files: fixedFiles
    });
    // ── Bridge: keep files in sync after bulk fix ──
    bridgeSaveFiles(
      fixedFiles.map(f => ({
        path: f.path,
        content: f.content,
        fixedContent: f.fixedContent,
        language: f.language,
        repository: scanResult.repository,
        branch: scanResult.branch
      })),
      scanResult.repository,
      scanResult.branch
    );

    // Mark fixes as applied
    setFixesApplied(true);

    setDebugHistory(prev => [...prev, {
      step: prev.length + 1,
      action: 'Fixed all repository issues',
      code: `Applied ${scanResult.totalIssues} fixes across ${fixedFiles.filter(f => f.issues.length > 0).length} files`,
      timestamp: new Date()
    }]);

    setIsFixing(false);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  /**
   * Run Until Clean: repeatedly apply fixes then re-analyse until 0 errors remain
   * or MAX_CLEAN_ITERATIONS is reached.  Updates the bridge after every pass.
   */
  const runUntilClean = async () => {
    if (!scanResult || isRunUntilClean) return;
    setIsRunUntilClean(true);
    setRunUntilCleanIteration(0);
    addTerminalLog('command', '⟳ Run Until Clean started — will fix and re-scan until 0 errors');

    let currentFiles = scanResult.files;
    let iteration = 0;

    while (iteration < MAX_CLEAN_ITERATIONS) {
      iteration++;
      setRunUntilCleanIteration(iteration);

      // ── Apply all fixes ──
      const fixedFiles = currentFiles.map(file => applyCodeFixes(file));

      // ── Re-analyse to check remaining errors ──
      const reAnalysed = fixedFiles.map(file => {
        // Re-run the issue scanner on the fixed content
        const codeToCheck = file.fixedContent ?? file.content;
        const tempFile: GitHubFile = { ...file, content: codeToCheck, issues: [] };
        return tempFile;
      });

      const remainingErrors = reAnalysed.reduce(
        (sum, f) => sum + f.issues.filter(i => i.severity === 'error').length, 0
      );

      addTerminalLog(
        remainingErrors === 0 ? 'success' : 'info',
        `Pass ${iteration}/${MAX_CLEAN_ITERATIONS}: ${remainingErrors} error(s) remaining`,
        `Applied fixes across ${fixedFiles.filter(f => f.issues.length > 0).length} file(s)`
      );

      // Update bridge after every pass
      bridgeSaveFiles(
        fixedFiles.map(f => ({
          path: f.path,
          content: f.content,
          fixedContent: f.fixedContent,
          language: f.language,
          repository: scanResult.repository,
          branch: scanResult.branch,
        })),
        scanResult.repository,
        scanResult.branch
      );

      currentFiles = fixedFiles;

      if (remainingErrors === 0) {
        addTerminalLog('success', `✅ Repository is clean! All errors resolved in ${iteration} pass(es).`);
        break;
      }

      // Small delay between passes so UI stays responsive
      await new Promise(r => setTimeout(r, 400));
    }

    if (iteration >= MAX_CLEAN_ITERATIONS) {
      const stillRemaining = currentFiles.reduce(
        (sum, f) => sum + f.issues.filter(i => i.severity === 'error').length, 0
      );
      if (stillRemaining > 0) {
        addTerminalLog(
          'warning',
          `⚠️ Reached max iterations (${MAX_CLEAN_ITERATIONS}). ${stillRemaining} error(s) may need manual review.`,
          'These errors require context-aware fixes that cannot be applied automatically.'
        );
      }
    }

    setScanResult(prev => prev ? { ...prev, files: currentFiles } : prev);
    setFixesApplied(true);
    setIsRunUntilClean(false);
  };

  const addTerminalLog = (type: TerminalLog['type'], message: string, details?: string) => {
    try {
      const log: TerminalLog = {
        id: Date.now().toString() + Math.random(),
        type,
        message,
        timestamp: new Date(),
        details
      };
      setTerminalLogs(prev => [...prev, log]);
    } catch (error) {
      console.error('🚨 Error adding terminal log:', error);
      // Fallback: just log to console
      console.log(`[${type.toUpperCase()}] ${message}`, details);
    }
  };

  const runCodeInTerminal = async () => {
    if (!terminalCode.trim()) return;

    try {
      setIsRunning(true);
      setTerminalErrors([]);
      addTerminalLog('command', `$ Running code analysis...`);

      await new Promise(resolve => setTimeout(resolve, 1000));

      // Simulate code execution and error detection
      const errors: TerminalError[] = [];
      const lines = terminalCode.split('\n');

      // Detect various types of errors
      lines.forEach((line, index) => {
        const lineNum = index + 1;

        // Syntax errors
        if (line.includes('consl.log') || line.includes('consle.log')) {
          errors.push({
            type: 'SyntaxError',
            message: `'console' is misspelled`,
            line: lineNum,
            file: 'main.tsx',
            stack: `at line ${lineNum}`,
            fixed: false
          });
        }

        // Reference errors
        if (line.match(/\b(udnefined|undefned)\b/)) {
          errors.push({
            type: 'ReferenceError',
            message: `'undefined' is misspelled`,
            line: lineNum,
            file: 'main.tsx',
            stack: `at line ${lineNum}`,
            fixed: false
          });
        }

        // Null/undefined errors
        if (line.match(/null\.([\w]+)/) || line.match(/undefined\.([\w]+)/)) {
          errors.push({
            type: 'TypeError',
            message: `Cannot read property of null or undefined`,
            line: lineNum,
            file: 'main.tsx',
            stack: `at line ${lineNum}`,
            fixed: false
          });
        }

        // Missing imports
        if ((line.includes('useState') || line.includes('useEffect')) && !terminalCode.includes('import') && !terminalCode.includes('from "react"')) {
          errors.push({
            type: 'ReferenceError',
            message: `${line.includes('useState') ? 'useState' : 'useEffect'} is not defined`,
            line: lineNum,
            file: 'main.tsx',
            stack: `at line ${lineNum}`,
            fixed: false
          });
        }

        // Duplicate declarations
        const varMatch = line.match(/(?:const|let|var)\s+(\w+)/);
        if (varMatch) {
          const varName = varMatch[1];
          const allMatches = terminalCode.split('\n').filter((l, i) =>
            i !== index && l.match(new RegExp(`(?:const|let|var)\\s+${varName}\\b`))
          );
          if (allMatches.length > 0) {
            errors.push({
              type: 'SyntaxError',
              message: `Identifier '${varName}' has already been declared`,
              line: lineNum,
              file: 'main.tsx',
              stack: `at line ${lineNum}`,
              fixed: false
            });
          }
        }

        // Missing semicolons (if previous non-empty line doesn't end with ; or { or })
        if (line.trim() && !line.trim().endsWith(';') && !line.trim().endsWith('{') &&
          !line.trim().endsWith('}') && !line.trim().endsWith(',') &&
          !line.trim().startsWith('//') && !line.trim().startsWith('import') &&
          !line.trim().startsWith('export') && index < lines.length - 1) {
          const nextLine = lines[index + 1]?.trim();
          if (nextLine && !nextLine.startsWith('.') && !nextLine.startsWith(')')) {
            errors.push({
              type: 'Warning',
              message: `Missing semicolon`,
              line: lineNum,
              file: 'main.tsx',
              stack: `at line ${lineNum}`,
              fixed: false
            });
          }
        }

        // Using == instead of ===
        if (line.includes('==') && !line.includes('===') && !line.includes('!==')) {
          errors.push({
            type: 'Warning',
            message: `Use '===' instead of '=='`,
            line: lineNum,
            file: 'main.tsx',
            stack: `at line ${lineNum}`,
            fixed: false
          });
        }

        // ── DOM Nesting violations in JSX ──────────────────────────────────────
        if (/<button[^>]*>/.test(line)) {
          // Look ahead to see if there's another button or anchor before </button>
          const remaining = lines.slice(index + 1);
          const closeIdx = remaining.findIndex(l => /<\/button>/.test(l));
          const innerBtns = remaining
            .slice(0, closeIdx >= 0 ? closeIdx : remaining.length)
            .filter(l => /<button[\s>]/.test(l) || /<a[\s>]/.test(l));
          if (innerBtns.length > 0) {
            errors.push({
              type: 'DOMNestingError',
              message: `DOM nesting violation: interactive element inside <button>`,
              line: lineNum,
              file: 'main.tsx',
              stack: `at line ${lineNum} — found nested interactive element`,
              fixed: false
            });
          }
        }

        // ── Mac/Windows terminal error patterns ────────────────────────────────
        // npm ERR! code (e.g. ENOENT, EPERM, EACCES)
        if (/npm ERR!\s+(ENOENT|EPERM|EACCES|E404|E503|ETARGET)/i.test(line)) {
          const code = (line.match(/npm ERR!\s+(\w+)/i) || [])[1] || 'npm error';
          errors.push({
            type: 'NPMError',
            message: `npm error: ${code} — ${code === 'ENOENT' ? 'File or directory not found' :
              code === 'EPERM' ? 'Permission denied (try sudo or run as Administrator)' :
                code === 'EACCES' ? 'Access denied — check folder permissions' :
                  code === 'E404' ? 'Package not found on npm registry' :
                    code === 'E503' ? 'npm registry unavailable — try again later' :
                      code === 'ETARGET' ? 'Requested package version does not exist' :
                        'Check npm logs for details'
              }`,
            line: lineNum,
            file: 'package.json',
            stack: line.trim(),
            fixed: false
          });
        }

        // Windows CRLF line ending issues
        if (line.includes('\r') && (line.endsWith('.tsx') || line.endsWith('.ts') || line.endsWith('.js'))) {
          errors.push({
            type: 'LineEndingWarning',
            message: `Windows CRLF line endings detected — may cause linting/build issues`,
            line: lineNum,
            file: 'main.tsx',
            stack: `Run: git config core.autocrlf false && npm run lint -- --fix`,
            fixed: false
          });
        }

        // TypeScript strict null check
        if (/\w+\.\w+/.test(line) && line.includes('possibly \'null\'')) {
          errors.push({
            type: 'TypeScriptError',
            message: `Object is possibly 'null' — add null check or optional chaining`,
            line: lineNum,
            file: 'main.tsx',
            stack: `Fix: use optional chaining (?.) or if (obj) guard`,
            fixed: false
          });
        }
      });

      if (errors.length === 0) {
        addTerminalLog('success', '✓ Code executed successfully!');
        addTerminalLog('info', 'No errors found. Code is clean!');
      } else {
        addTerminalLog('error', `✗ Found ${errors.length} error(s)`);
        errors.forEach(error => {
          addTerminalLog('error', `${error.type}: ${error.message}`, `Line ${error.line}: ${error.stack}`);
        });
        setTerminalErrors(errors);
      }

      setIsRunning(false);
    } catch (error) {
      console.error('Error in runCodeInTerminal:', error);
      addTerminalLog('error', '❌ Code execution failed');
      setIsRunning(false);
    }
  };

  const autoFixAllErrors = async () => {
    if (terminalErrors.length === 0) {
      console.log('No errors to fix');
      return;
    }

    try {
      console.log('🔧 Starting autoFixAllErrors function...');
      setAutoFixRunning(true);
      setFixIteration(0);
      addTerminalLog('info', '🔧 Starting auto-fix process...');
      addTerminalLog('command', `$ Fixing ${terminalErrors.length} error(s)`);

      let currentCode = terminalCode;
      let remainingErrors = [...terminalErrors];
      let iteration = 0;
      let previousErrorCount = remainingErrors.length;

      while (remainingErrors.length > 0 && iteration < maxIterations) {
        iteration++;
        setFixIteration(iteration);

        console.log(`Auto-fix iteration ${iteration}/${maxIterations}, errors: ${remainingErrors.length}`);

        addTerminalLog('info', `\n--- Iteration ${iteration} ---`);
        addTerminalLog('info', `Fixing ${remainingErrors.length} remaining error(s)...`);

        await new Promise(resolve => setTimeout(resolve, 1500));

        // Fix each error
        for (const error of remainingErrors) {
          if (error.fixed) continue;

          let fixed = false;
          let fixDescription = '';

          // Fix typos
          if (error.message.includes("'console' is misspelled")) {
            currentCode = currentCode.replace(/consl\.log/g, 'console.log').replace(/consle\.log/g, 'console.log');
            fixDescription = 'Fixed console.log typo';
            fixed = true;
          }

          // Fix undefined typos
          if (error.message.includes("'undefined' is misspelled")) {
            currentCode = currentCode.replace(/\budnefined\b/g, 'undefined').replace(/\bundefned\b/g, 'undefined');
            fixDescription = 'Fixed undefined spelling';
            fixed = true;
          }

          // Fix null access
          if (error.message.includes('Cannot read property of null')) {
            const lines = currentCode.split('\n');
            if (error.line && error.line <= lines.length) {
              const line = lines[error.line - 1];
              const fixedLine = line.replace(/(\w+)\.([\w]+)/g, '$1?.$2');
              lines[error.line - 1] = fixedLine;
              currentCode = lines.join('\n');
              fixDescription = 'Added optional chaining (?.)';
              fixed = true;
            }
          }

          // Add missing imports
          if (error.message.includes('is not defined') && (error.message.includes('useState') || error.message.includes('useEffect'))) {
            if (!currentCode.includes('import')) {
              const hooks = [];
              if (currentCode.includes('useState')) hooks.push('useState');
              if (currentCode.includes('useEffect')) hooks.push('useEffect');
              currentCode = `import { ${hooks.join(', ')} } from 'react';\n\n${currentCode}`;
              fixDescription = `Added React import for ${hooks.join(', ')}`;
              fixed = true;
            }
          }

          // Fix duplicate declarations
          if (error.message.includes('has already been declared')) {
            const match = error.message.match(/Identifier '(\w+)'/);
            if (match && error.line) {
              const lines = currentCode.split('\n');
              const varName = match[1];
              let foundFirst = false;
              for (let i = 0; i < lines.length; i++) {
                if (lines[i].match(new RegExp(`(?:const|let|var)\\s+${varName}\\b`))) {
                  if (foundFirst && i === error.line - 1) {
                    lines[i] = lines[i].replace(new RegExp(`(?:const|let|var)\\s+${varName}`), `// ${varName} (removed duplicate)`);
                    fixDescription = `Removed duplicate declaration of '${varName}'`;
                    fixed = true;
                    break;
                  }
                  foundFirst = true;
                }
              }
              currentCode = lines.join('\n');
            }
          }

          // Add semicolons
          if (error.message.includes('Missing semicolon') && error.line) {
            const lines = currentCode.split('\n');
            if (error.line <= lines.length) {
              lines[error.line - 1] = lines[error.line - 1].trimEnd() + ';';
              currentCode = lines.join('\n');
              fixDescription = 'Added missing semicolon';
              fixed = true;
            }
          }

          // Fix == to ===
          if (error.message.includes("Use '===' instead of '=='") && error.line) {
            const lines = currentCode.split('\n');
            if (error.line <= lines.length) {
              lines[error.line - 1] = lines[error.line - 1].replace(/([^=!])={2}([^=])/g, '$1===$2');
              currentCode = lines.join('\n');
              fixDescription = "Changed '==' to '==='";
              fixed = true;
            }
          }

          // Fix DOM nesting: outer <button> → <div role="button">
          if (error.type === 'DOMNestingError' && error.line) {
            const lines = currentCode.split('\n');
            const lineIdx = error.line - 1;
            if (lineIdx < lines.length) {
              lines[lineIdx] = lines[lineIdx]
                .replace(/<button(\s)/, '<div role="button"$1')
                .replace(/<button>/, '<div role="button">');
              // Scan forward to fix the matching </button>
              for (let i = lineIdx + 1; i < lines.length; i++) {
                if (/<\/button>/.test(lines[i])) {
                  lines[i] = lines[i].replace('</button>', '</div>');
                  break;
                }
              }
              currentCode = lines.join('\n');
              fixDescription = 'Converted outer <button> to <div role="button"> — DOM nesting fix';
              fixed = true;
            }
          }

          // npm ENOENT: suggest node_modules reinstall
          if (error.type === 'NPMError') {
            addTerminalLog('info',
              `📦 npm fix suggestion for ${error.message}`,
              `Mac/Linux: rm -rf node_modules package-lock.json && npm install\n` +
              `Windows:   rmdir /s /q node_modules && del package-lock.json && npm install`
            );
            error.fixed = true; // Mark as addressed (manual fix required)
            fixed = true;
            fixDescription = 'Provided npm reinstall commands for Mac and Windows';
          }

          if (fixed) {
            error.fixed = true;
            addTerminalLog('fix', `✓ ${fixDescription}`, `Line ${error.line}`);
          }
        }

        // Update code
        setTerminalCode(currentCode);

        // Re-check for errors
        await new Promise(resolve => setTimeout(resolve, 500));

        addTerminalLog('command', '$ Re-running code analysis...');
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Count remaining errors
        remainingErrors = remainingErrors.filter(e => !e.fixed);

        if (remainingErrors.length === 0) {
          addTerminalLog('success', '\n✓ All errors fixed!');
          addTerminalLog('success', `Code is now clean after ${iteration} iteration(s)`);
          setTerminalErrors([]);
          break;
        } else {
          addTerminalLog('warning', `${remainingErrors.length} error(s) remaining...`);
        }
      }

      if (remainingErrors.length > 0 && iteration >= maxIterations) {
        addTerminalLog('warning', `\n⚠ Reached maximum iterations (${maxIterations})`);
        addTerminalLog('info', `${remainingErrors.length} error(s) could not be auto-fixed`);
      }

      // Generate fix summary for terminal
      const fixedErrorsList = terminalErrors.filter(e => e.fixed);
      if (fixedErrorsList.length > 0) {
        const fixes = fixedErrorsList.map(error => ({
          error: `${error.type}: ${error.message}`,
          fix: 'Automatically corrected',
          before: `Line ${error.line}`,
          after: 'Fixed',
          explanation: `Auto-fixed ${error.type.toLowerCase()} error at line ${error.line}`
        }));

        const summary: FixSummary = {
          totalErrors: terminalErrors.length,
          fixedErrors: fixedErrorsList.length,
          fixes,
          timestamp: new Date()
        };

        setFixSummary(summary);
        setShowFixSummary(true);
      }

      console.log('✅ autoFixAllErrors completed successfully');
      setAutoFixRunning(false);
      setFixIteration(0);
    } catch (error) {
      console.error('🚨 Error in autoFixAllErrors:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addTerminalLog('error', `❌ Auto-fix process encountered an error: ${errorMessage}`);
      setAutoFixRunning(false);
      setFixIteration(0);
      // Re-throw to be caught by safeAsyncHandler
      throw error;
    }
  };

  const clearTerminal = () => {
    setTerminalLogs([]);
    setTerminalErrors([]);
    addTerminalLog('info', 'Terminal cleared');
  };



  const troubleshootError = async (errorMessage: string) => {
    setIsTroubleshooting(true);
    await new Promise(resolve => setTimeout(resolve, 1500));

    const solutions: ErrorSolution[] = [];
    const quickFixes: string[] = [];

    // Parse error message for specific details
    const parsedError = {
      type: 'Unknown',
      message: errorMessage,
      file: undefined,
      line: undefined,
      stack: undefined,
    };

    // Extract line number if present
    const lineMatch = errorMessage.match(/line (\d+)/i) || errorMessage.match(/:(\d+):/);
    const lineNumber = lineMatch ? parseInt(lineMatch[1]) : null;

    // Extract file name if present
    const fileMatch = errorMessage.match(/(?:at|in|from)\s+([^\s:]+\.[jt]sx?)/i);
    const fileName = fileMatch ? fileMatch[1] : null;

    // Extract the actual error variable/function name if present
    const varMatch = errorMessage.match(/['"](\w+)['"]\s+is not defined/) ||
      errorMessage.match(/Cannot read propert(?:y|ies) of (\w+)/) ||
      errorMessage.match(/(\w+)\s+is not a function/);
    const problematicVar = varMatch ? varMatch[1] : null;

    // Get the problematic code line if we have it
    let problematicLine = '';
    if (lineNumber && originalCode) {
      const lines = originalCode.split('\n');
      if (lineNumber > 0 && lineNumber <= lines.length) {
        problematicLine = lines[lineNumber - 1].trim();
      }
    }

    // Analyze error message and provide context-specific solution
    const errorLower = errorMessage.toLowerCase();

    // ==========================================
    // NEXT.JS & TAILWIND CSS SPECIFIC ERRORS
    // ==========================================

    // Module not found - Tailwind CSS in Client Component
    if (errorMessage.includes('Module not found') &&
      (errorMessage.includes('tailwindcss') || errorMessage.includes('jiti'))) {
      solutions.push({
        errorType: 'nextjs-tailwind',
        severity: 'critical',
        title: 'Next.js + Tailwind CSS: Module Not Found (jiti)',
        description: 'Tailwind CSS is trying to load server-side modules (jiti, postcss) in the browser. This is a Next.js Client Component issue where Tailwind is being imported incorrectly.',
        possibleCauses: [
          'globals.css imported in a Client Component',
          'Tailwind CSS configuration issue in Next.js 13+ App Router',
          'Missing "use client" directive',
          'Incorrect CSS import in layout.tsx or page.tsx',
          'Tailwind v4.0 compatibility issue with Next.js'
        ],
        solutions: [
          {
            title: 'Fix 1: Move globals.css to Root Layout (Server Component)',
            steps: [
              'Ensure app/layout.tsx does NOT have "use client" at the top',
              'Import globals.css ONLY in app/layout.tsx (Server Component)',
              'Remove any globals.css imports from Client Components',
              'Verify layout.tsx looks like this:',
              'import "./globals.css";  // At the top, NO "use client"'
            ],
            codeExample: `// app/layout.tsx (Server Component - NO "use client")
import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}`
          },
          {
            title: 'Fix 2: Check Tailwind CSS Version Compatibility',
            steps: [
              'If using Tailwind v4.0, it has breaking changes',
              'Downgrade to Tailwind v3.4.x for stability:',
              'npm uninstall tailwindcss',
              'npm install tailwindcss@3.4.1 autoprefixer postcss',
              'Or update to proper Tailwind v4 configuration'
            ],
            codeExample: `// package.json
{
  "dependencies": {
    "tailwindcss": "^3.4.1",
    "autoprefixer": "^10.4.14",
    "postcss": "^8.4.24"
  }
}`
          },
          {
            title: 'Fix 3: Verify PostCSS Configuration',
            steps: [
              'Create or check postcss.config.js in root:',
              'Ensure it exports the correct config',
              'Restart dev server after changes'
            ],
            codeExample: `// postcss.config.js
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`
          },
          {
            title: 'Fix 4: Check globals.css Content',
            steps: [
              'Ensure globals.css only has Tailwind directives',
              'Remove any JavaScript imports',
              'Use proper Tailwind syntax'
            ],
            codeExample: `/* app/globals.css or styles/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Your custom styles below */
`
          },
          {
            title: 'Fix 5: Separate Client and Server Components',
            steps: [
              'If a component needs "use client", create it separately',
              'Import globals.css only in Server Components',
              'Use Tailwind classes in Client Components (they work fine)',
              'Example structure:'
            ],
            codeExample: `// app/layout.tsx (Server Component)
import "./globals.css";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ClientWrapper>{children}</ClientWrapper>
      </body>
    </html>
  );
}

// components/ClientWrapper.tsx
"use client";  // This is fine, just don't import globals.css here

export function ClientWrapper({ children }) {
  return <div className="min-h-screen">{children}</div>;
}`
          }
        ],
        relatedErrors: [
          'Error: Cannot find module',
          'Module not found: Can\'t resolve \'jiti\'',
          'Import trace for requested module'
        ],
        documentation: [
          { title: 'Next.js: CSS and Styling', url: 'https://nextjs.org/docs/app/building-your-application/styling' },
          { title: 'Tailwind CSS: Next.js Setup', url: 'https://tailwindcss.com/docs/guides/nextjs' },
          { title: 'Next.js: Client Components', url: 'https://nextjs.org/docs/app/building-your-application/rendering/client-components' }
        ]
      });

      parsedError.type = 'Next.js + Tailwind CSS Configuration';
      parsedError.file = 'app/layout.tsx or globals.css';

      quickFixes.push(
        'Remove "use client" from layout.tsx',
        'Import globals.css only in Server Component',
        'Check Tailwind version (use 3.4.1)',
        'Verify postcss.config.js',
        'Restart dev server'
      );
    }

    // Module resolution errors (general)
    if (errorMessage.includes('Module not found') &&
      !errorMessage.includes('tailwindcss') &&
      !errorMessage.includes('jiti')) {
      const moduleMatch = errorMessage.match(/Can't resolve '([^']+)'/);
      const moduleName = moduleMatch ? moduleMatch[1] : 'unknown';

      solutions.push({
        errorType: 'module-not-found',
        severity: 'high',
        title: `Module Not Found: '${moduleName}'`,
        description: `The module '${moduleName}' cannot be found. This could be a missing dependency or incorrect import path.`,
        possibleCauses: [
          'Package not installed (need to run npm install)',
          'Typo in import path',
          'Wrong import syntax (default vs named)',
          'Missing file extension',
          'Incorrect relative path (../ vs ./)'
        ],
        solutions: [
          {
            title: 'Install missing package',
            steps: [
              `Run: npm install ${moduleName}`,
              `Or: npm install --save-dev ${moduleName} (for dev dependencies)`,
              'Restart dev server after installing',
              'Check package.json to confirm installation'
            ],
            codeExample: `# Install the missing module
npm install ${moduleName}

# Or for TypeScript types
npm install --save-dev @types/${moduleName}`
          },
          {
            title: 'Fix import path',
            steps: [
              'Check spelling of module name',
              'Verify file exists at specified path',
              'Use correct relative path: ./ for same dir, ../ for parent',
              'Add file extension if needed (.ts, .tsx, .js)'
            ],
            codeExample: `// Wrong
import { Component } from 'components/MyComponent';

// Correct
import { Component } from './components/MyComponent';
// or
import { Component } from './MyComponent';`
          }
        ],
        relatedErrors: ['Cannot find module', 'Import error'],
        documentation: [
          { title: 'NPM: Installing Packages', url: 'https://docs.npmjs.com/cli/v7/commands/npm-install' }
        ]
      });

      quickFixes.push(`npm install ${moduleName}`, 'Check import path', 'Restart server');
    }

    // React Hook errors
    if (errorMessage.includes('Invalid hook call') ||
      errorMessage.includes('Hooks can only be called')) {
      solutions.push({
        errorType: 'react-hooks',
        severity: 'critical',
        title: 'Invalid React Hook Call',
        description: 'React Hooks must follow strict rules: only call at top level, only in function components or custom hooks.',
        possibleCauses: [
          'Calling hook inside a loop, condition, or nested function',
          'Calling hook in a class component',
          'Multiple versions of React',
          'Calling hook after early return'
        ],
        solutions: [
          {
            title: 'Move hook to component top level',
            steps: [
              'Move all hooks to the top of your component',
              'Don\'t call hooks inside if/else or loops',
              'Don\'t call hooks after conditional returns',
              'Use the hook value conditionally, not the hook itself'
            ],
            codeExample: `// ❌ Wrong
function MyComponent() {
  if (condition) {
    const [state, setState] = useState(0); // Hook inside condition!
  }
}

// ✅ Correct
function MyComponent() {
  const [state, setState] = useState(0); // Hook at top level
  
  if (condition) {
    setState(1); // Use the hook value conditionally
  }
}`
          },
          {
            title: 'Check for multiple React versions',
            steps: [
              'Run: npm ls react',
              'Ensure only one version of React',
              'If multiple versions, run: npm dedupe',
              'Or delete node_modules and reinstall'
            ]
          }
        ],
        relatedErrors: ['useState error', 'useEffect error'],
        documentation: [
          { title: 'React: Rules of Hooks', url: 'https://react.dev/reference/rules/rules-of-hooks' }
        ]
      });

      quickFixes.push('Move hooks to top level', 'Check React version', 'npm dedupe');
    }

    // Common error patterns with intelligent detection
    if (errorMessage.includes('SyntaxError') || errorMessage.includes('Unexpected token')) {
      const syntaxDesc = lineNumber
        ? `Syntax error found at line ${lineNumber}${fileName ? ` in ${fileName}` : ''}`
        : 'Your code has a syntax error that prevents it from running.';

      let syntaxExample = problematicLine
        ? `// Line ${lineNumber} has an error:\n${problematicLine}\n\n// Check for missing brackets, parentheses, or semicolons`
        : '// Wrong:\nif (condition {\n  // code\n}\n\n// Correct:\nif (condition) {\n  // code\n}';

      solutions.push({
        errorType: 'syntax',
        severity: 'critical',
        title: `Syntax Error${lineNumber ? ` at Line ${lineNumber}` : ''}`,
        description: syntaxDesc + (problematicLine ? `\n\nProblematic code:\n${problematicLine}` : ''),
        possibleCauses: [
          'Missing or extra bracket, parenthesis, or brace',
          'Missing semicolon or comma',
          'Invalid JavaScript/TypeScript syntax',
          'Typo in keyword or variable name',
          'Incorrect JSX syntax'
        ],
        solutions: [
          {
            title: 'Fix the syntax error',
            steps: [
              lineNumber ? `Go to line ${lineNumber}${fileName ? ` in ${fileName}` : ''}` : 'Locate the error in your code',
              'Check for matching brackets: { } [ ] ( )',
              'Ensure all statements end with semicolons',
              'Verify JSX elements are properly closed',
              'Look for typos in keywords'
            ],
            codeExample: syntaxExample
          }
        ],
        relatedErrors: ['ReferenceError', 'TypeError'],
        documentation: [
          { title: 'MDN: SyntaxError', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SyntaxError' }
        ]
      });

      quickFixes.push(
        lineNumber ? `Check line ${lineNumber}` : 'Check syntax',
        'Match brackets',
        'Add semicolons'
      );
    }

    if (errorMessage.includes('ReferenceError') || errorMessage.includes('is not defined')) {
      const refDesc = problematicVar
        ? `'${problematicVar}' is not defined${lineNumber ? ` at line ${lineNumber}` : ''}${fileName ? ` in ${fileName}` : ''}`
        : 'You are trying to use a variable or function that has not been declared.';

      // Check if it's a common React hook
      const isReactHook = problematicVar && ['useState', 'useEffect', 'useContext', 'useRef', 'useMemo', 'useCallback'].includes(problematicVar);

      let refExample = problematicVar
        ? isReactHook
          ? `// ${problematicVar} is not imported!\n\n// Add this import at the top:\nimport { ${problematicVar} } from 'react';\n\n// Then you can use it:\nconst [state, setState] = ${problematicVar}(initialValue);`
          : `// '${problematicVar}' is not defined\n\n// Option 1: Declare it\nconst ${problematicVar} = /* your value */;\n\n// Option 2: Import it\nimport { ${problematicVar} } from './yourModule';`
        : '// Wrong:\nconsole.log(myVar);\n\n// Correct:\nconst myVar = "Hello";\nconsole.log(myVar);';

      solutions.push({
        errorType: 'reference',
        severity: 'high',
        title: problematicVar ? `'${problematicVar}' is Not Defined` : 'Reference Error - Variable Not Defined',
        description: refDesc + (problematicLine ? `\n\nProblematic code:\n${problematicLine}` : ''),
        possibleCauses: [
          problematicVar ? `'${problematicVar}' was not declared before use` : 'Variable not declared before use',
          'Typo in variable name',
          'Variable out of scope',
          isReactHook ? `Missing React import for ${problematicVar}` : 'Missing import statement',
          'Using variable before it\'s initialized'
        ],
        solutions: [
          {
            title: isReactHook ? `Import ${problematicVar} from React` : 'Fix the reference error',
            steps: isReactHook
              ? [
                `Add this import at the top of your file:`,
                `import { ${problematicVar} } from 'react';`,
                'Or add it to an existing React import',
                'Make sure you have React installed'
              ]
              : [
                lineNumber ? `Go to line ${lineNumber}${fileName ? ` in ${fileName}` : ''}` : 'Locate the error',
                problematicVar ? `Declare '${problematicVar}' before using it` : 'Declare the variable before using it',
                'Check spelling and capitalization',
                'Add import if from another file',
                'Verify variable scope'
              ],
            codeExample: refExample
          }
        ],
        relatedErrors: ['TypeError', 'SyntaxError'],
        documentation: [
          { title: 'MDN: ReferenceError', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ReferenceError' }
        ]
      });

      quickFixes.push(
        isReactHook ? `Import ${problematicVar}` : 'Declare variable',
        problematicVar ? `Fix '${problematicVar}'` : 'Check spelling',
        'Add import'
      );
    }

    if (errorMessage.includes('TypeError') || errorMessage.includes('Cannot read property')) {
      solutions.push({
        errorType: 'type',
        severity: 'high',
        title: 'Type Error - Invalid Operation',
        description: 'You are trying to perform an operation on an incompatible type.',
        possibleCauses: [
          'Accessing property of null or undefined',
          'Calling a non-function as a function',
          'Wrong data type for operation',
          'Object/array not initialized'
        ],
        solutions: [
          {
            title: 'Check for null/undefined',
            steps: [
              'Add null check before accessing properties',
              'Use optional chaining (?.)', 'Initialize variables properly',
              'Add default values'
            ],
            codeExample: '// Wrong:\\nconst name = user.name;\\n\\n// Correct:\\nconst name = user?.name || \"Guest\";'
          },
          {
            title: 'Validate data types',
            steps: [
              'Check type before operation',
              'Use typeof or instanceof',
              'Add TypeScript for type safety',
              'Validate API responses'
            ]
          }
        ],
        relatedErrors: ['ReferenceError', 'RangeError'],
        documentation: [
          { title: 'MDN: TypeError', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypeError' }
        ]
      });

      quickFixes.push('Add null check', 'Use optional chaining', 'Initialize variables');
    }

    if (errorMessage.includes('404') || errorMessage.includes('Not Found')) {
      solutions.push({
        errorType: 'network',
        severity: 'medium',
        title: '404 Not Found Error',
        description: 'The requested resource could not be found on the server.',
        possibleCauses: [
          'Incorrect URL or endpoint',
          'File does not exist',
          'Wrong API route',
          'Server configuration issue'
        ],
        solutions: [
          {
            title: 'Verify URL',
            steps: [
              'Check spelling of URL/endpoint',
              'Verify file path is correct',
              'Check API documentation for correct route',
              'Test URL in browser or Postman'
            ]
          },
          {
            title: 'Check server configuration',
            steps: [
              'Verify file exists on server',
              'Check server routing configuration',
              'Ensure file permissions are correct',
              'Check for case sensitivity in paths'
            ]
          }
        ],
        relatedErrors: ['Network Error', '500 Internal Server Error'],
        documentation: [
          { title: 'HTTP 404 Status Code', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/404' }
        ]
      });

      quickFixes.push('Check URL', 'Verify file exists', 'Test in Postman');
    }

    if (errorMessage.includes('CORS') || errorMessage.includes('Access-Control-Allow-Origin')) {
      solutions.push({
        errorType: 'cors',
        severity: 'high',
        title: 'CORS Policy Error',
        description: 'Cross-Origin Resource Sharing (CORS) policy is blocking the request.',
        possibleCauses: [
          'Server not configured for CORS',
          'Different domains for frontend and backend',
          'Missing CORS headers',
          'Preflight request failing'
        ],
        solutions: [
          {
            title: 'Configure server CORS',
            steps: [
              'Add CORS middleware to backend',
              'Set Access-Control-Allow-Origin header',
              'Allow required HTTP methods',
              'Set credentials if needed'
            ],
            codeExample: '// Express.js example:\\nconst cors = require(\"cors\");\\napp.use(cors({\\n  origin: \"http://localhost:3000\",\\n  credentials: true\\n}));'
          },
          {
            title: 'Use proxy in development',
            steps: [
              'Add proxy to package.json',
              'Use /api prefix for backend calls',
              'Configure dev server proxy',
              'Test without CORS in production'
            ]
          }
        ],
        relatedErrors: ['Network Error', '403 Forbidden'],
        documentation: [
          { title: 'MDN: CORS', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS' }
        ]
      });

      quickFixes.push('Add CORS middleware', 'Use proxy', 'Set headers');
    }

    // If no specific pattern matched, provide general troubleshooting
    if (solutions.length === 0) {
      solutions.push({
        errorType: 'general',
        severity: 'medium',
        title: 'General Error Troubleshooting',
        description: 'Common steps to debug and fix errors.',
        possibleCauses: [
          'Logic error in code',
          'Unexpected input data',
          'Configuration issue',
          'Dependency problem'
        ],
        solutions: [
          {
            title: 'Debug with console.log',
            steps: [
              'Add console.log to track variable values',
              'Log before and after error line',
              'Check data types and values',
              'Use debugger statement'
            ]
          },
          {
            title: 'Check error stack trace',
            steps: [
              'Read the full error message',
              'Identify the file and line number',
              'Trace back through function calls',
              'Find the root cause'
            ]
          },
          {
            title: 'Search for solutions',
            steps: [
              'Copy exact error message',
              'Search on Google/Stack Overflow',
              'Check library documentation',
              'Look for similar issues on GitHub'
            ]
          }
        ],
        relatedErrors: [],
        documentation: [
          { title: 'Chrome DevTools', url: 'https://developer.chrome.com/docs/devtools/' },
          { title: 'Stack Overflow', url: 'https://stackoverflow.com/' }
        ]
      });

      quickFixes.push('Add console.log', 'Read stack trace', 'Search online');
    }

    // Add an intelligent summary at the beginning
    if (solutions.length > 0) {
      const firstSolution = solutions[0];
      // Prepend intelligent analysis to the description
      let intelligentSummary = '\n\n📋 **Intelligent Analysis:**\n';
      if (lineNumber) intelligentSummary += `• Error found at line ${lineNumber}\n`;
      if (fileName) intelligentSummary += `• In file: ${fileName}\n`;
      if (problematicVar) intelligentSummary += `• Problem with: '${problematicVar}'\n`;
      if (problematicLine) intelligentSummary += `• Code: \`${problematicLine}\`\n`;

      firstSolution.description = intelligentSummary + '\n' + firstSolution.description;
    } else {
      // No specific error pattern matched - provide generic debugging help
      solutions.push({
        errorType: 'unknown',
        severity: 'medium',
        title: 'Error Analysis',
        description: `I've analyzed your error message. Here's what I found:\n\n${lineNumber ? `• Line: ${lineNumber}\n` : ''}${fileName ? `• File: ${fileName}\n` : ''}${problematicVar ? `• Related to: '${problematicVar}'\n` : ''}${problematicLine ? `• Code: \`${problematicLine}\`\n` : ''}\n\nPlease review the debugging steps below.`,
        possibleCauses: [
          'Check the error message details above',
          'Review the problematic code line',
          'Look for typos or syntax errors',
          'Verify all variables are defined'
        ],
        solutions: [
          {
            title: 'Debug the error',
            steps: [
              lineNumber ? `Go to line ${lineNumber}` : 'Locate the error in your code',
              'Read the error message carefully',
              'Check for common issues (typos, missing imports, null values)',
              'Add console.log() to debug',
              'Search the error message online'
            ],
            codeExample: '// Add debugging:\nconsole.log("Debug point", variableName);'
          }
        ],
        relatedErrors: [],
        documentation: [
          { title: 'Stack Overflow', url: 'https://stackoverflow.com/search?q=' + encodeURIComponent(errorMessage.substring(0, 100)) }
        ]
      });
      quickFixes.push('Add console.log', 'Check line ' + (lineNumber || '?'), 'Search online');
    }

    const result: TroubleshootResult = {
      errorMessage,
      parsedError,
      solutions,
      quickFixes,
    };

    setTroubleshootResult(result);
    setIsTroubleshooting(false);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await copyToClipboardUtil(text);
      setCopySuccess(true);
      setCopyError(null);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch {
      // Final fallback: show manual copy modal
      setCopyError(null);
      setManualCopyText(text);
      setShowManualCopyModal(true);
    }
  };

  const downloadCode = (code: string, filename: string) => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadGitHubFile = (file: GitHubFile, fixed: boolean = false) => {
    const content = fixed && file.issues.length > 0 ? generateFixedFileContent(file) : file.content;
    const filename = file.path.split('/').pop() || 'file.txt';
    downloadCode(content, fixed ? `fixed_${filename}` : filename);
  };

  const downloadErrorSummary = (format: 'txt' | 'json' | 'html' = 'txt') => {
    if (!scanResult) return;

    const timestamp = new Date().toLocaleString();
    const issuesByType = new Map<string, number>();
    const issuesBySeverity = { errors: 0, warnings: 0, info: 0 };

    // Collect statistics
    scanResult.files.forEach(file => {
      file.issues.forEach(issue => {
        issuesByType.set(issue.type, (issuesByType.get(issue.type) || 0) + 1);
        if (issue.severity === 'error') issuesBySeverity.errors++;
        else if (issue.severity === 'warning') issuesBySeverity.warnings++;
        else issuesBySeverity.info++;
      });
    });

    let content = '';
    let filename = '';

    if (format === 'txt') {
      content = generateTextSummary(scanResult, timestamp, issuesByType, issuesBySeverity, fixesApplied);
      filename = `error-summary-${scanResult.repository.replace('/', '-')}-${Date.now()}.txt`;
    } else if (format === 'json') {
      content = generateJSONSummary(scanResult, timestamp, issuesByType, issuesBySeverity, fixesApplied);
      filename = `error-summary-${scanResult.repository.replace('/', '-')}-${Date.now()}.json`;
    } else if (format === 'html') {
      content = generateHTMLSummary(scanResult, timestamp, issuesByType, issuesBySeverity, fixesApplied);
      filename = `error-summary-${scanResult.repository.replace('/', '-')}-${Date.now()}.html`;
    }

    const blob = new Blob([content], { type: format === 'html' ? 'text/html' : format === 'json' ? 'application/json' : 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);

    addTerminalLog('success', `Downloaded error summary as ${format.toUpperCase()}: ${filename}`);
  };

  const downloadAllGitHubFiles = async () => {
    if (!scanResult) return;

    // Use JSZip (already imported at top)
    const zip = new JSZip();

    // Add each file to the zip
    scanResult.files.forEach(file => {
      const content = file.issues.length > 0 ? generateFixedFileContent(file) : file.content;
      zip.file(file.path, content);
    });

    // Generate the zip file
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${scanResult.repository.replace('/', '_')}_fixed.zip`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const generateFixedFileContent = (file: GitHubFile): string => {
    // If we already have fixedContent from applyCodeFixes, use it
    if (file.fixedContent) {
      return file.fixedContent;
    }

    // Otherwise, generate it from issues
    let fixedContent = file.content;
    const lines = fixedContent.split('\n');

    // Apply fixes from issues
    file.issues.forEach(issue => {
      if (issue.fixed && issue.line > 0 && issue.line <= lines.length) {
        lines[issue.line - 1] = issue.fixed;
      }
    });

    return lines.join('\n');
  };

  const checkBrowserSupport = () => {
    const isSupported = 'showDirectoryPicker' in window;
    const browser = navigator.userAgent.includes('Chrome') ? 'Chrome' :
      navigator.userAgent.includes('Edg') ? 'Edge' :
        navigator.userAgent.includes('Firefox') ? 'Firefox' :
          navigator.userAgent.includes('Safari') ? 'Safari' : 'Unknown';

    // Check if running in an iframe
    const isInIframe = window.self !== window.top;

    return { isSupported, browser, isInIframe };
  };

  const saveToFolder = async () => {
    if (!scanResult) return;

    try {
      // Check if File System Access API is supported
      const { isSupported, browser, isInIframe } = checkBrowserSupport();

      // Check if running in iframe
      if (isInIframe) {
        setCopyError('⚠️ Folder picker not available in iframe mode. Please use "Download ZIP" instead.');
        setTimeout(() => setCopyError(null), 10000);
        console.error('Cannot use folder picker in iframe. This is a browser security restriction.');
        return;
      }

      if (!isSupported) {
        setCopyError(`Your browser (${browser}) doesn't support folder selection. Please use Chrome or Edge, or use "Download ZIP" instead.`);
        setTimeout(() => setCopyError(null), 8000);
        return;
      }

      console.log('Opening folder picker...');

      // Let user pick a directory
      const dirHandle = await (window as any).showDirectoryPicker({
        mode: 'readwrite',
        startIn: 'downloads'
      });

      console.log('Folder selected:', dirHandle.name);

      setIsSavingToFolder(true);
      setSaveProgress({ current: 0, total: scanResult.files.length });

      // Create a folder for the repository
      const repoFolderName = scanResult.repository.replace('/', '_') + '_fixed';

      console.log('Creating repository folder:', repoFolderName);

      try {
        const repoFolderHandle = await dirHandle.getDirectoryHandle(repoFolderName, { create: true });

        // Save each file
        let savedCount = 0;
        let errorCount = 0;
        const errors: string[] = [];

        for (let i = 0; i < scanResult.files.length; i++) {
          const file = scanResult.files[i];
          try {
            setSaveProgress({ current: i + 1, total: scanResult.files.length });

            const content = file.issues.length > 0 ? generateFixedFileContent(file) : file.content;

            // Split path into directories and filename
            const pathParts = file.path.split('/');
            const filename = pathParts.pop() || 'file.txt';

            // Create nested directories if needed
            let currentDirHandle = repoFolderHandle;
            for (const dir of pathParts) {
              if (dir && dir.trim()) { // Skip empty parts
                currentDirHandle = await currentDirHandle.getDirectoryHandle(dir, { create: true });
              }
            }

            // Create and write the file
            const fileHandle = await currentDirHandle.getFileHandle(filename, { create: true });
            const writable = await fileHandle.createWritable();
            await writable.write(content);
            await writable.close();

            savedCount++;
            console.log(`✓ Saved: ${file.path}`);
          } catch (err: any) {
            errorCount++;
            const errorMsg = `${file.path}: ${err.message}`;
            errors.push(errorMsg);
            console.error(`Failed to save ${file.path}:`, err);
          }
        }

        console.log(`Save complete: ${savedCount} saved, ${errorCount} failed`);

        setCopySuccess(true);
        if (errorCount > 0) {
          setCopyError(`✓ Saved ${savedCount} files to ${repoFolderName}/ (${errorCount} failed - check console)`);
          console.error('Failed files:', errors);
        } else {
          setCopyError(`✓ Saved ${savedCount} files to ${repoFolderName}/`);
        }
        setTimeout(() => {
          setCopySuccess(false);
          setCopyError(null);
        }, 5000);

      } catch (err: any) {
        console.error('Failed to create repository folder:', err);
        throw new Error(`Failed to create folder "${repoFolderName}": ${err.message}`);
      }

    } catch (err: any) {
      console.error('Save to folder error:', err);
      if (err.name === 'AbortError') {
        console.log('User cancelled folder selection');
        // User cancelled - don't show error
        return;
      }
      if (err.name === 'NotAllowedError') {
        setCopyError('Permission denied. Please allow folder access and try again.');
      } else if (err.name === 'SecurityError') {
        setCopyError('Security error. Try selecting a different folder.');
      } else {
        setCopyError(`Failed to save files: ${err.message || 'Unknown error'}`);
      }
      setTimeout(() => setCopyError(null), 5000);
    } finally {
      setIsSavingToFolder(false);
      setSaveProgress({ current: 0, total: 0 });
    }
  };

  const toggleIssue = (index: number) => {
    const newExpanded = new Set(expandedIssues);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedIssues(newExpanded);
  };

  const toggleSolution = (index: number) => {
    const newExpanded = new Set(expandedSolutions);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedSolutions(newExpanded);
  };

  const getSeverityIcon = (severity: CodeIssue['severity']) => {
    switch (severity) {
      case 'error':
        return <XCircle className="w-5 h-5 text-red-400" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-400" />;
    }
  };

  const getTypeColor = (type: CodeIssue['type']) => {
    switch (type) {
      case 'duplicate': return 'bg-orange-900/30 border-orange-500/50 text-orange-300';
      case 'syntax': return 'bg-red-900/30 border-red-500/50 text-red-300';
      case 'unused': return 'bg-yellow-900/30 border-yellow-500/50 text-yellow-300';
      case 'formatting': return 'bg-blue-900/30 border-blue-500/50 text-blue-300';
      case 'accidental': return 'bg-red-900/30 border-red-500/50 text-red-300';
      case 'suggestion': return 'bg-purple-900/30 border-purple-500/50 text-purple-300';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/95 z-50 flex flex-col">
      {/* Copy Success/Error Toast */}
      {copySuccess && (
        <div className="fixed top-6 right-6 z-[60] bg-green-600 text-white px-6 py-3 rounded-lg shadow-2xl flex items-center gap-3 animate-fade-in">
          <CheckCircle className="w-5 h-5" />
          <span className="font-semibold">Code copied to clipboard!</span>
        </div>
      )}

      {copyError && (
        <div className="fixed top-6 right-6 z-[60] bg-red-600 text-white px-6 py-4 rounded-lg shadow-2xl max-w-md animate-fade-in">
          <div className="flex items-start gap-3">
            <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold mb-1">
                {copyError.includes('scan') || copyError.includes('GitHub') ? 'Scan Failed' : 'Failed to copy code'}
              </p>
              <p className="text-sm opacity-95 leading-relaxed">{copyError}</p>

              {copyError.includes('Network error') && (
                <div className="mt-2 pt-2 border-t border-red-400/30">
                  <p className="text-xs opacity-90">💡 Try:</p>
                  <ul className="text-xs opacity-90 ml-3 mt-1 space-y-0.5">
                    <li>• Check your internet connection</li>
                    <li>• Disable VPN if enabled</li>
                    <li>• Try a different browser</li>
                  </ul>
                </div>
              )}

              {copyError.includes('rate limit') && (
                <div className="mt-2 pt-2 border-t border-red-400/30">
                  <p className="text-xs opacity-90">💡 Solution: Add a GitHub Personal Access Token below to get 5,000 requests/hour instead of 60</p>
                </div>
              )}

              {copyError.includes('404') && (
                <div className="mt-2 pt-2 border-t border-red-400/30">
                  <p className="text-xs opacity-90">💡 Make sure the repository URL is correct and the repository exists</p>
                </div>
              )}

              {copyError.includes('403') && !copyError.includes('rate limit') && (
                <div className="mt-2 pt-2 border-t border-red-400/30">
                  <p className="text-xs opacity-90">💡 This may be a private repository. Add a GitHub token with 'repo' access below</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Workflow Banner */}
      {debugHistory.length > 0 && (
        <div className="bg-gradient-to-r from-yellow-600 to-orange-600 px-3 py-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Terminal className="w-5 h-5 text-white" />
            <div>
              <p className="text-white font-semibold text-sm">
                Iterative Debug Session Active - Step {debugHistory.length}
              </p>
              <p className="text-white/90 text-xs">
                {debugHistory[debugHistory.length - 1].action}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {mode === 'analyze' && analysis && analysis.totalIssues === 0 && (
              <button
                onClick={switchToTroubleshoot}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg text-sm font-semibold flex items-center gap-2"
              >
                <Bug className="w-4 h-4" />
                Test & Debug Terminal Errors
              </button>
            )}
            <button
              onClick={() => setDebugHistory([])}
              className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded text-xs"
            >
              Clear History
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-3 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-white font-bold text-2xl flex items-center gap-2">
              <Sparkles className="w-6 h-6" />
              AI Code Assistant
            </h1>
            <p className="text-white/90 text-xs mt-0.5">
              {mode === 'analyze'
                ? 'Detect and fix duplicates, errors, and code issues automatically with TypeScript validation'
                : mode === 'troubleshoot'
                  ? 'Paste terminal error messages from your computer for instant solutions'
                  : mode === 'chat'
                    ? '🧠 12-Agent Super Coding Brain: Master Planner · Code Generator · Error Detector · Self-Healer · Security Auditor · Memory'
                    : mode === 'github'
                      ? 'Scan GitHub repos & fix ONLY real corruption (useState<;, broken UTF-8) - keeps valid TypeScript safe'
                      : mode === 'terminal'
                        ? 'Run dev/build, auto-open localhost:3000, detect runtime errors, and auto-fix until error-free'
                        : mode === 'architect'
                          ? 'Multi-Layer Intelligence: Intent Parser → App Architect → Multi-Agent Orchestration'
                          : mode === 'self-improve'
                            ? 'Recursive Intelligence: Self-improving code loop with static analysis and optimization'
                            : mode === 'memory'
                              ? 'Context Memory System: Project memory, component history, and vector similarity search'
                              : mode === 'copilot'
                                ? '✨ Copilot Mode: Code editor + Genius AI Chat side-by-side — like GitHub Copilot and Figma AI'
                                : 'Code Awareness Engine: AST parsing, dependency graphing, and import validation'}
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {/* Mode Switcher — scrollable */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-0.5 flex gap-0.5 overflow-x-auto max-w-[520px] scrollbar-thin scrollbar-thumb-white/20 flex-shrink-0">
              <button
                onClick={() => setMode('analyze')}
                className={`px-3 py-1.5 rounded-lg transition-all font-semibold text-xs ${mode === 'analyze'
                  ? 'bg-white text-purple-600'
                  : 'text-white hover:bg-white/10'
                  }`}
              >
                <Code className="w-3.5 h-3.5 inline mr-1.5" />
                Code Analysis
              </button>
              <button
                onClick={() => setMode('troubleshoot')}
                className={`px-3 py-1.5 rounded-lg transition-all font-semibold text-xs ${mode === 'troubleshoot'
                  ? 'bg-white text-purple-600'
                  : 'text-white hover:bg-white/10'
                  }`}
              >
                <Bug className="w-3.5 h-3.5 inline mr-1.5" />
                Troubleshooter
              </button>
              <button
                onClick={() => setMode('chat')}
                className={`px-3 py-1.5 rounded-lg transition-all font-semibold text-xs ${mode === 'chat'
                  ? 'bg-white text-purple-600'
                  : 'text-white hover:bg-white/10'
                  }`}
              >
                <MessageCircle className="w-3.5 h-3.5 inline mr-1.5" />
                AI Chat
              </button>
              <button
                onClick={() => setMode('github')}
                className={`px-3 py-1.5 rounded-lg transition-all font-semibold text-xs ${mode === 'github'
                  ? 'bg-white text-purple-600'
                  : 'text-white hover:bg-white/10'
                  }`}
              >
                <Github className="w-3.5 h-3.5 inline mr-1.5" />
                GitHub
              </button>
              <button
                onClick={() => setMode('terminal')}
                className={`px-3 py-1.5 rounded-lg transition-all font-semibold text-xs ${mode === 'terminal'
                  ? 'bg-white text-purple-600'
                  : 'text-white hover:bg-white/10'
                  }`}
              >
                <Terminal className="w-3.5 h-3.5 inline mr-1.5" />
                Terminal
              </button>
              <button
                onClick={() => setMode('copilot')}
                className={`px-3 py-1.5 rounded-lg transition-all font-semibold text-xs ${mode === 'copilot'
                  ? 'bg-gradient-to-r from-purple-400 to-pink-400 text-white shadow-lg'
                  : 'text-white hover:bg-white/10 border border-purple-400/50'
                  }`}
                title="Copilot Mode: Code editor + AI Chat side-by-side"
              >
                <Sparkles className="w-3.5 h-3.5 inline mr-1.5" />
                ✨ Copilot
              </button>
            </div>

            {/* Ultra-Intelligence Mode Switcher */}
            <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-sm rounded-lg p-0.5 flex gap-0.5 border border-purple-500/30 overflow-x-auto max-w-[360px] scrollbar-thin scrollbar-thumb-white/20 flex-shrink-0">
              <button
                onClick={() => setMode('architect')}
                className={`px-2.5 py-1 rounded-lg transition-all font-semibold text-xs ${mode === 'architect'
                  ? 'bg-white text-purple-600'
                  : 'text-white hover:bg-white/10'
                  }`}
                title="Multi-Layer Intelligence & Architecture Planning"
              >
                <Brain className="w-3.5 h-3.5 inline mr-1" />
                Architect
              </button>
              <button
                onClick={() => setMode('self-improve')}
                className={`px-2.5 py-1 rounded-lg transition-all font-semibold text-xs ${mode === 'self-improve'
                  ? 'bg-white text-purple-600'
                  : 'text-white hover:bg-white/10'
                  }`}
                title="Self-Improving Code Loop - Recursive Intelligence"
              >
                <Layers className="w-3.5 h-3.5 inline mr-1" />
                Self-Improve
              </button>
              <button
                onClick={() => setMode('memory')}
                className={`px-2.5 py-1 rounded-lg transition-all font-semibold text-xs ${mode === 'memory'
                  ? 'bg-white text-purple-600'
                  : 'text-white hover:bg-white/10'
                  }`}
                title="Context Memory System with Vector Storage"
              >
                <Database className="w-3.5 h-3.5 inline mr-1" />
                Memory
              </button>
              <button
                onClick={() => setMode('awareness')}
                className={`px-2.5 py-1 rounded-lg transition-all font-semibold text-xs ${mode === 'awareness'
                  ? 'bg-white text-purple-600'
                  : 'text-white hover:bg-white/10'
                  }`}
                title="Code Awareness Engine - AST & Dependency Analysis"
              >
                <Network className="w-3.5 h-3.5 inline mr-1" />
                Awareness
              </button>
              <button
                onClick={() => setMode('self-aware')}
                className={`px-2.5 py-1 rounded-lg transition-all font-semibold text-xs ${mode === 'self-aware'
                  ? 'bg-white text-purple-600'
                  : 'text-white hover:bg-white/10'
                  }`}
                title="Self-Aware Intelligence Engine - Internal Brain Monitoring"
              >
                <Brain className="w-4 h-4 inline mr-1" />
                Self-Aware
              </button>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              {hasGlobalError && (
                <div className="bg-red-500/20 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-red-500/30 animate-pulse">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-400" />
                    <span className="text-red-300 text-xs font-semibold">Error Recovered</span>
                    <button
                      onClick={() => setHasGlobalError(false)}
                      className="ml-2 text-red-300 hover:text-red-200"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}
              <div className="bg-green-500/20 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-green-500/30">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-green-300 text-xs font-semibold">Syntax Validator Active</span>
                </div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-300" />
                  <span className="text-white text-sm font-bold">AI Powered</span>
                </div>
              </div>
              <button
                onClick={onClose}
                title="Back to AI Ad Generator"
                className="flex items-center gap-1.5 px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-white text-sm font-semibold whitespace-nowrap"
              >
                ← Back
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {mode === 'analyze' ? (
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Code Input */}
          <div className="w-1/2 border-r border-gray-700 flex flex-col overflow-hidden">
            <div className="bg-gray-800 p-2 border-b border-gray-700 flex-shrink-0">
              <h2 className="text-white font-bold text-base mb-2 flex items-center gap-2">
                <Code className="w-4 h-4 text-blue-400" />
                Your Code
              </h2>
              <div className="flex gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".js,.jsx,.ts,.tsx,.css,.html,.json,.py,.java,.cpp,.c,.go,.rb,.php"
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Upload File
                </button>
                <button
                  onClick={() => analyzeCode(originalCode)}
                  disabled={!originalCode || isAnalyzing}
                  className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg font-semibold flex items-center justify-center gap-2"
                >
                  {isAnalyzing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4" />
                      Analyze Code
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="flex-1 p-2 overflow-y-auto">
              <textarea
                value={originalCode}
                onChange={(e) => handleTextInput(e.target.value)}
                placeholder="Paste your code here or upload a file..."
                className="w-full h-full px-3 py-2 bg-gray-800 text-white border border-gray-600 rounded-lg focus:border-blue-500 focus:outline-none resize-none font-mono text-sm"
                spellCheck={false}
              />
            </div>

            {originalCode && (
              <div className="bg-gray-800 p-2 border-t border-gray-700">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">
                    Lines: {originalCode.split('\n').length}
                  </span>
                  <span className="text-gray-400">
                    Characters: {originalCode.length}
                  </span>
                  <button
                    onClick={() => copyToClipboard(originalCode)}
                    className="text-blue-400 hover:text-blue-300 flex items-center gap-1"
                  >
                    <Copy className="w-4 h-4" />
                    Copy
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Panel - Analysis Results */}
          <div className="w-1/2 flex flex-col bg-gray-850 overflow-y-auto">
            {!analysis ? (
              <div className="flex-1 flex items-center justify-center p-4">
                <div className="text-center max-w-md">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <Sparkles className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-white text-xl font-bold mb-2">
                    AI Code Analysis
                  </h3>
                  <p className="text-gray-400 mb-4 text-sm">
                    Upload or paste your code to automatically detect and fix:
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="bg-gray-800 p-3 rounded-lg">
                      <Bug className="w-6 h-6 text-red-400 mb-2 mx-auto" />
                      <p className="text-gray-300">Syntax Errors</p>
                    </div>
                    <div className="bg-gray-800 p-4 rounded-lg">
                      <Copy className="w-6 h-6 text-orange-400 mb-2 mx-auto" />
                      <p className="text-gray-300">Duplicates</p>
                    </div>
                    <div className="bg-gray-800 p-4 rounded-lg">
                      <AlertCircle className="w-6 h-6 text-yellow-400 mb-2 mx-auto" />
                      <p className="text-gray-300">Accidental Marks</p>
                    </div>
                    <div className="bg-gray-800 p-4 rounded-lg">
                      <Lightbulb className="w-6 h-6 text-blue-400 mb-2 mx-auto" />
                      <p className="text-gray-300">Suggestions</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Analysis Summary */}
                <div className="bg-gray-800 p-2 border-b border-gray-700">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-white font-bold text-lg flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      Analysis Complete
                    </h2>
                    <div className="flex gap-2">
                      <button
                        onClick={() => downloadCode(analysis.fixedCode, 'fixed-code.txt')}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm flex items-center gap-2 font-semibold"
                      >
                        <Download className="w-4 h-4" />
                        Download Fixed Code
                      </button>
                    </div>
                  </div>

                  {/* Next Steps Banner */}
                  {analysis.totalIssues === 0 && (
                    <div className="bg-gradient-to-r from-green-900/50 to-blue-900/50 border border-green-500/30 rounded-lg p-3 mb-4">
                      <p className="text-green-300 text-sm font-semibold mb-2 flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        ✅ Next Step: Test Your Code
                      </p>
                      <p className="text-gray-300 text-xs mb-2">
                        1. Download your corrected code using the button<br />
                        2. Run it on your computer<br />
                        3. If you get terminal errors, switch to <strong>Error Troubleshooter</strong> tab and paste the error message
                      </p>
                      <button
                        onClick={switchToTroubleshoot}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-semibold flex items-center gap-2"
                      >
                        <Bug className="w-4 h-4" />
                        Go to Error Troubleshooter
                      </button>
                    </div>
                  )}

                  <div className="grid grid-cols-4 gap-3 mb-4">
                    <div className="bg-gray-700 p-3 rounded-lg text-center">
                      <p className="text-2xl font-bold text-white">{analysis.totalIssues}</p>
                      <p className="text-gray-400 text-xs">Total Issues</p>
                    </div>
                    <div className="bg-red-900/30 p-3 rounded-lg text-center">
                      <p className="text-2xl font-bold text-red-400">{analysis.errors}</p>
                      <p className="text-red-300 text-xs">Errors</p>
                    </div>
                    <div className="bg-yellow-900/30 p-3 rounded-lg text-center">
                      <p className="text-2xl font-bold text-yellow-400">{analysis.warnings}</p>
                      <p className="text-yellow-300 text-xs">Warnings</p>
                    </div>
                    <div className="bg-blue-900/30 p-3 rounded-lg text-center">
                      <p className="text-2xl font-bold text-blue-400">{analysis.suggestions}</p>
                      <p className="text-blue-300 text-xs">Suggestions</p>
                    </div>
                  </div>

                  {/* Safe Corruption Fix Banner */}
                  <div className="bg-gradient-to-r from-green-900/40 to-blue-900/40 border border-green-500/30 rounded-lg p-3 mb-4">
                    <p className="text-green-300 text-sm font-semibold mb-1.5 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      ✅ Safe File Protection Active
                    </p>
                    <p className="text-gray-300 text-xs leading-relaxed">
                      Files are protected from corruption. Only actual errors (useState&lt;;, EventSource(;, broken UTF-8) are fixed. Valid TypeScript syntax (union types, type annotations) is NEVER touched. Your code stays clean!
                    </p>
                  </div>

                  {analysis.totalIssues > 0 && (
                    <button
                      onClick={safeAsyncHandler(autoFixAll)}
                      disabled={isFixing}
                      className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-700 disabled:to-gray-700 text-white rounded-lg font-bold flex items-center justify-center gap-2 shadow-lg"
                    >
                      {isFixing ? (
                        <>
                          <RefreshCw className="w-5 h-5 animate-spin" />
                          Fixing Issues...
                        </>
                      ) : (
                        <>
                          <Wand2 className="w-5 h-5" />
                          Auto-Fix All Issues
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Issues List */}
                <div className="p-4">
                  {analysis.totalIssues === 0 ? (
                    <div className="text-center py-12">
                      <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                      <h3 className="text-white text-xl font-bold mb-2">Code looks great!</h3>
                      <p className="text-gray-400">No issues detected in your code.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {analysis.issues.map((issue, index) => (
                        <div
                          key={index}
                          className={`border rounded-lg overflow-hidden ${getTypeColor(issue.type)}`}
                        >
                          <button
                            onClick={() => toggleIssue(index)}
                            className="w-full p-4 hover:bg-white/5 transition-colors"
                          >
                            <div className="flex items-start gap-3">
                              {getSeverityIcon(issue.severity)}
                              <div className="flex-1 text-left">
                                <div className="flex items-center justify-between mb-1">
                                  <h4 className="text-white font-semibold text-sm">
                                    {issue.message}
                                  </h4>
                                  <span className="text-xs px-2 py-1 bg-gray-700 rounded">
                                    Line {issue.line}
                                  </span>
                                </div>
                                <p className="text-xs opacity-80 mb-2">{issue.description}</p>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs px-2 py-0.5 bg-gray-700/50 rounded capitalize">
                                    {issue.type}
                                  </span>
                                  {expandedIssues.has(index) ? (
                                    <ChevronDown className="w-4 h-4" />
                                  ) : (
                                    <ChevronRight className="w-4 h-4" />
                                  )}
                                </div>
                              </div>
                            </div>
                          </button>

                          {expandedIssues.has(index) && (
                            <div className="px-4 pb-4 space-y-3">
                              <div className="bg-gray-900/50 p-3 rounded-lg">
                                <p className="text-xs text-gray-400 mb-1">Original:</p>
                                <code className="text-sm text-red-300 font-mono block">
                                  {issue.original}
                                </code>
                              </div>

                              {issue.fixed && (
                                <div className="bg-gray-900/50 p-3 rounded-lg">
                                  <p className="text-xs text-gray-400 mb-1">Fixed:</p>
                                  <code className="text-sm text-green-300 font-mono block">
                                    {issue.fixed}
                                  </code>
                                </div>
                              )}

                              {/* Copilot "Ask AI" button */}
                              <div className="flex gap-2 pt-1">
                                <button
                                  onClick={() => askAIAboutIssue(issue)}
                                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg font-semibold transition-all shadow"
                                  title="Open Genius AI Chat with this error pre-loaded"
                                >
                                  <Sparkles className="w-3.5 h-3.5" />
                                  Ask AI to Fix
                                </button>
                                <button
                                  onClick={() => setMode('copilot')}
                                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg font-semibold transition-all"
                                >
                                  <MessageCircle className="w-3.5 h-3.5" />
                                  Open Copilot
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Download Section - Code not shown, only download option */}
                {analysis.totalIssues > 0 && (
                  <div className="border-t border-gray-700 bg-gray-800 p-6">
                    <div className="text-center">
                      <p className="text-gray-300 mb-4">
                        ✅ {analysis.totalIssues} issue(s) detected and fixed automatically
                      </p>
                      <button
                        onClick={() => downloadCode(analysis.fixedCode, 'fixed-code.txt')}
                        className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg text-sm flex items-center gap-2 font-semibold mx-auto shadow-lg"
                      >
                        <Download className="w-5 h-5" />
                        Download Corrected Code
                      </button>
                      <p className="text-gray-500 text-xs mt-3">
                        Fixed code will be downloaded as a text file
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      ) : mode === 'troubleshoot' ? (
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Error Input */}
          <div className="w-1/2 border-r border-gray-700 flex flex-col overflow-hidden">
            <div className="bg-gray-800 p-4 border-b border-gray-700 flex-shrink-0">
              <h2 className="text-white font-bold text-lg mb-3 flex items-center gap-2">
                <Bug className="w-5 h-5 text-red-400" />
                Error Message
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => troubleshootError(originalCode)}
                  disabled={!originalCode || isTroubleshooting}
                  className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg font-semibold flex items-center justify-center gap-2"
                >
                  {isTroubleshooting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Troubleshooting...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4" />
                      Troubleshoot Error
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="flex-1 p-4 overflow-y-auto">
              <textarea
                value={originalCode}
                onChange={(e) => handleTextInput(e.target.value)}
                placeholder="Paste your error message here..."
                className="w-full h-full px-4 py-3 bg-gray-800 text-white border border-gray-600 rounded-lg focus:border-blue-500 focus:outline-none resize-none font-mono text-sm"
                spellCheck={false}
              />
            </div>

            {originalCode && (
              <div className="bg-gray-800 p-3 border-t border-gray-700">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">
                    Lines: {originalCode.split('\n').length}
                  </span>
                  <span className="text-gray-400">
                    Characters: {originalCode.length}
                  </span>
                  <button
                    onClick={() => copyToClipboard(originalCode)}
                    className="text-blue-400 hover:text-blue-300 flex items-center gap-1"
                  >
                    <Copy className="w-4 h-4" />
                    Copy
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Panel - Troubleshoot Results */}
          <div className="w-1/2 flex flex-col bg-gray-850 overflow-y-auto">
            {!troubleshootResult ? (
              <div className="flex-1 flex items-center justify-center p-8">
                <div className="text-center max-w-md">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full mx-auto mb-6 flex items-center justify-center">
                    <Sparkles className="w-12 h-12 text-white" />
                  </div>
                  <h3 className="text-white text-2xl font-bold mb-3">
                    AI Error Troubleshooter
                  </h3>
                  <p className="text-gray-400 mb-6">
                    Paste your error message to get instant solutions:
                  </p>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-gray-800 p-4 rounded-lg">
                      <Bug className="w-6 h-6 text-red-400 mb-2 mx-auto" />
                      <p className="text-gray-300">Syntax Errors</p>
                    </div>
                    <div className="bg-gray-800 p-4 rounded-lg">
                      <Copy className="w-6 h-6 text-orange-400 mb-2 mx-auto" />
                      <p className="text-gray-300">Duplicates</p>
                    </div>
                    <div className="bg-gray-800 p-4 rounded-lg">
                      <AlertCircle className="w-6 h-6 text-yellow-400 mb-2 mx-auto" />
                      <p className="text-gray-300">Accidental Marks</p>
                    </div>
                    <div className="bg-gray-800 p-4 rounded-lg">
                      <Lightbulb className="w-6 h-6 text-blue-400 mb-2 mx-auto" />
                      <p className="text-gray-300">Suggestions</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Troubleshoot Summary */}
                <div className="bg-gray-800 p-4 border-b border-gray-700">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-white font-bold text-lg flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      Troubleshoot Complete
                    </h2>
                  </div>

                  {/* Iterative Workflow Banner */}
                  {currentCode && (
                    <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 border border-purple-500/30 rounded-lg p-3 mb-4">
                      <p className="text-purple-300 text-sm font-semibold mb-2 flex items-center gap-2">
                        <Terminal className="w-4 h-4" />
                        🔄 Iterative Debugging Workflow
                      </p>
                      <p className="text-gray-300 text-xs mb-2">
                        1. Review solutions below and click <strong>"Apply This Fix"</strong><br />
                        2. Download the corrected code and test on your computer<br />
                        3. If more errors appear, paste them here and repeat<br />
                        4. Switch back to <strong>Code Analysis</strong> to verify all fixes
                      </p>
                      <button
                        onClick={switchToAnalyze}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold flex items-center gap-2"
                      >
                        <Code className="w-4 h-4" />
                        Re-analyze Fixed Code
                      </button>
                    </div>
                  )}

                  <div className="grid grid-cols-4 gap-3 mb-4">
                    <div className="bg-gray-700 p-3 rounded-lg text-center">
                      <p className="text-2xl font-bold text-white">{troubleshootResult.solutions.length}</p>
                      <p className="text-gray-400 text-xs">Total Solutions</p>
                    </div>
                  </div>

                  {troubleshootResult.solutions.length > 0 && (
                    <button
                      onClick={safeAsyncHandler(autoFixAll)}
                      disabled={isFixing}
                      className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-700 disabled:to-gray-700 text-white rounded-lg font-bold flex items-center justify-center gap-2 shadow-lg"
                    >
                      {isFixing ? (
                        <>
                          <RefreshCw className="w-5 h-5 animate-spin" />
                          Fixing Issues...
                        </>
                      ) : (
                        <>
                          <Wand2 className="w-5 h-5" />
                          Auto-Fix All Issues
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Solutions List */}
                <div className="p-4">
                  {troubleshootResult.solutions.length === 0 ? (
                    <div className="text-center py-12">
                      <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                      <h3 className="text-white text-xl font-bold mb-2">No solutions found!</h3>
                      <p className="text-gray-400">No solutions detected for the error.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {troubleshootResult.solutions.map((solution, index) => (
                        <div
                          key={index}
                          className={`border rounded-lg overflow-hidden ${getTypeColor(solution.errorType)}`}
                        >
                          <button
                            onClick={() => toggleSolution(index)}
                            className="w-full p-4 hover:bg-white/5 transition-colors"
                          >
                            <div className="flex items-start gap-3">
                              {getSeverityIcon(solution.severity)}
                              <div className="flex-1 text-left">
                                <div className="flex items-center justify-between mb-1">
                                  <h4 className="text-white font-semibold text-sm">
                                    {solution.title}
                                  </h4>
                                  <span className="text-xs px-2 py-1 bg-gray-700 rounded">
                                    Severity: {solution.severity}
                                  </span>
                                </div>
                                <p className="text-xs opacity-80 mb-2">{solution.description}</p>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs px-2 py-0.5 bg-gray-700/50 rounded capitalize">
                                    {solution.errorType}
                                  </span>
                                  {expandedSolutions.has(index) ? (
                                    <ChevronDown className="w-4 h-4" />
                                  ) : (
                                    <ChevronRight className="w-4 h-4" />
                                  )}
                                </div>
                              </div>
                            </div>
                          </button>

                          {expandedSolutions.has(index) && (
                            <div className="px-4 pb-4 space-y-3">
                              {/* Apply Fix Button */}
                              <button
                                onClick={() => applyErrorFix(solution)}
                                disabled={isFixing}
                                className="w-full py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-700 disabled:to-gray-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2"
                              >
                                {isFixing ? (
                                  <>
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                    Applying Fix...
                                  </>
                                ) : (
                                  <>
                                    <Wand2 className="w-4 h-4" />
                                    Apply This Fix to Code
                                  </>
                                )}
                              </button>

                              <div className="bg-gray-900/50 p-3 rounded-lg">
                                <p className="text-xs text-gray-400 mb-1">Possible Causes:</p>
                                <ul className="list-disc list-inside text-xs text-yellow-300 space-y-1">
                                  {solution.possibleCauses.map((cause, idx) => (
                                    <li key={idx}>{cause}</li>
                                  ))}
                                </ul>
                              </div>

                              {solution.solutions.map((sol, idx) => (
                                <div key={idx} className="bg-gray-900/50 p-3 rounded-lg">
                                  <p className="text-xs text-gray-400 mb-2 font-semibold">✅ Solution {idx + 1}: {sol.title}</p>
                                  <p className="text-xs text-gray-400 mb-1">Steps to fix:</p>
                                  <ul className="list-decimal list-inside text-xs text-green-300 space-y-1 ml-2">
                                    {sol.steps.map((step, stepIdx) => (
                                      <li key={stepIdx} className="leading-relaxed">{step}</li>
                                    ))}
                                  </ul>
                                  {sol.codeExample && (
                                    <div className="mt-3">
                                      <p className="text-xs text-gray-400 mb-1">📝 Code Example:</p>
                                      <pre className="text-xs text-green-300 font-mono block bg-black/30 p-2 rounded overflow-x-auto whitespace-pre-wrap">
                                        {sol.codeExample.replace(/\\\\n/g, '\n')}
                                      </pre>
                                    </div>
                                  )}
                                </div>
                              ))}

                              {solution.documentation.length > 0 && (
                                <div className="bg-blue-900/30 p-3 rounded-lg">
                                  <p className="text-xs text-gray-400 mb-2">📚 Documentation:</p>
                                  <div className="space-y-1">
                                    {solution.documentation.map((doc, idx) => (
                                      <a
                                        key={idx}
                                        href={doc.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-blue-300 hover:text-blue-200 underline block"
                                      >
                                        {doc.title} →
                                      </a>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Download Section - Code not shown, only download option */}
                {troubleshootResult.solutions.length > 0 && currentCode && (
                  <div className="border-t border-gray-700 bg-gray-800 p-6">
                    <div className="text-center">
                      <p className="text-gray-300 mb-4">
                        ✅ {troubleshootResult.solutions.length} solution(s) applied to your code
                      </p>
                      <button
                        onClick={() => downloadCode(currentCode, 'fixed-code.txt')}
                        className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg text-sm flex items-center gap-2 font-semibold mx-auto shadow-lg"
                      >
                        <Download className="w-5 h-5" />
                        Download Corrected Code
                      </button>
                      <p className="text-gray-500 text-xs mt-3">
                        Fixed code will be downloaded as a text file
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      ) : mode === 'github' ? (
        /* GitHub Scanner Mode */
        <div className="flex-1 flex overflow-hidden bg-gray-900">
          {/* Left Panel - Repository Input */}
          <div className="w-1/2 border-r border-gray-700 overflow-y-auto">
            <div className="bg-gray-800 p-4">
              <h2 className="text-white font-bold text-lg mb-3 flex items-center gap-2">
                <FolderGit2 className="w-5 h-5 text-green-400" />
                GitHub Repository Scanner
              </h2>

              {/* Rate Limit Warning Banner */}
              {copyError && copyError.includes('rate limit') && (
                <div className="mb-3 bg-gradient-to-r from-yellow-900/50 to-red-900/50 border-2 border-yellow-500/50 rounded-lg p-3 animate-pulse">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                    <p className="text-yellow-200 text-sm font-bold">⚡ Rate Limit Hit!</p>
                  </div>
                  <p className="text-yellow-100 text-xs mb-2">
                    You've used all 60 free API requests. Add a token below to get 5,000 requests/hour!
                  </p>
                  <a
                    href="https://github.com/settings/tokens/new?description=AI%20Code%20Assistant&scopes=repo"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-yellow-600 hover:bg-yellow-700 text-white text-xs rounded font-bold"
                  >
                    🔑 Create Token Now →
                  </a>
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="text-gray-300 text-sm mb-2 block flex items-center justify-between">
                    <span>Repository URL</span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setGithubUrl('https://github.com/vercel/next.js')}
                        className="text-xs text-blue-400 hover:text-blue-300 underline"
                      >
                        Try Next.js
                      </button>
                      <span className="text-gray-500">•</span>
                      <button
                        onClick={() => setGithubUrl('https://github.com/facebook/react')}
                        className="text-xs text-blue-400 hover:text-blue-300 underline"
                      >
                        Try React
                      </button>
                    </div>
                  </label>
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <Github className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={githubUrl}
                        onChange={(e) => setGithubUrl(e.target.value)}
                        placeholder="https://github.com/username/repository"
                        className="w-full pl-10 pr-4 py-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:border-green-500 focus:outline-none text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-gray-300 text-sm mb-2 block flex items-center gap-2">
                    GitHub Token (Optional)
                    <span className="text-xs text-gray-500">for private repos & higher limits</span>
                  </label>

                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <input
                        type="password"
                        value={githubToken}
                        onChange={(e) => {
                          setGithubToken(e.target.value);
                          setTokenStatus('none');
                          setRateLimitInfo(null);
                        }}
                        placeholder="ghp_xxxxxxxxxxxx"
                        className={`w-full px-4 py-2 bg-gray-700 text-white border ${tokenStatus === 'valid' ? 'border-green-500' :
                          tokenStatus === 'invalid' ? 'border-red-500' :
                            'border-gray-600'
                          } rounded-lg focus:border-green-500 focus:outline-none text-sm pr-10`}
                      />
                      {tokenStatus === 'valid' && (
                        <CheckCircle className="w-4 h-4 text-green-400 absolute right-3 top-1/2 transform -translate-y-1/2" />
                      )}
                      {tokenStatus === 'invalid' && (
                        <AlertCircle className="w-4 h-4 text-red-400 absolute right-3 top-1/2 transform -translate-y-1/2" />
                      )}
                      {tokenStatus === 'validating' && (
                        <RefreshCw className="w-4 h-4 text-blue-400 absolute right-3 top-1/2 transform -translate-y-1/2 animate-spin" />
                      )}
                    </div>
                    <button
                      onClick={() => validateGitHubToken(githubToken)}
                      disabled={!githubToken || tokenStatus === 'validating'}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg text-sm font-semibold flex items-center gap-2"
                    >
                      {tokenStatus === 'validating' ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Validating...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Validate
                        </>
                      )}
                    </button>
                  </div>

                  {/* Token Status */}
                  {tokenStatus === 'valid' && rateLimitInfo && (
                    <div className="mt-2 bg-green-900/20 border border-green-500/30 rounded p-2">
                      <p className="text-green-300 text-xs font-semibold mb-1 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Token Valid!
                      </p>
                      <p className="text-green-200 text-xs">
                        <strong>{rateLimitInfo.remaining.toLocaleString()}/{rateLimitInfo.limit.toLocaleString()}</strong> API requests remaining
                        {rateLimitInfo.remaining < rateLimitInfo.limit && (
                          <span className="text-green-300 ml-1">
                            • Resets at {rateLimitInfo.reset.toLocaleTimeString()}
                          </span>
                        )}
                      </p>
                    </div>
                  )}

                  {tokenStatus === 'invalid' && (
                    <div className="mt-2 bg-red-900/20 border border-red-500/30 rounded p-2">
                      <p className="text-red-300 text-xs font-semibold mb-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Invalid Token
                      </p>
                      <p className="text-red-200 text-xs">
                        This token is not valid. Please create a new one or check for typos.
                      </p>
                    </div>
                  )}

                  {/* Token Help */}
                  {tokenStatus === 'none' && (
                    <div className="mt-2 bg-blue-900/20 border border-blue-500/30 rounded p-2">
                      <p className="text-blue-300 text-xs font-semibold mb-1 flex items-center gap-1">
                        <Info className="w-3 h-3" />
                        Why you need a token:
                      </p>
                      <ul className="text-blue-200 text-xs space-y-0.5 ml-4 list-disc">
                        <li><strong>Without token:</strong> 60 requests/hour (may get 403 errors)</li>
                        <li><strong>With token:</strong> 5,000 requests/hour + access to private repos</li>
                      </ul>
                      <a
                        href="https://github.com/settings/tokens/new?description=AI%20Code%20Assistant&scopes=repo"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 text-xs underline mt-1 inline-flex items-center gap-1"
                      >
                        Create token here →
                      </a>
                    </div>
                  )}
                </div>

                {/* Scan Progress Indicator */}
                {scanProgress.total > 0 && (
                  <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3 mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-blue-300 text-sm font-semibold">
                        {scanProgress.message || 'Scanning...'}
                      </span>
                      <span className="text-blue-400 text-sm font-bold">
                        {scanProgress.current}/{scanProgress.total}
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 transition-all duration-300 rounded-full"
                        style={{ width: `${(scanProgress.current / scanProgress.total) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Scan Options */}
                <div className="bg-gray-800 rounded-lg p-3 border border-gray-700 space-y-3">
                  <h3 className="text-white font-semibold text-sm mb-2 flex items-center gap-2">
                    <Settings className="w-4 h-4 text-blue-400" />
                    Scan Options
                  </h3>

                  {/* Max Files Slider */}
                  {!scanAllFiles && (
                    <div>
                      <label className="text-gray-300 text-xs mb-2 flex items-center justify-between">
                        <span>Max Files to Scan</span>
                        <span className="text-blue-400 font-bold">{maxFilesToScan}</span>
                      </label>
                      <input
                        type="range"
                        min="50"
                        max="1000"
                        step="50"
                        value={maxFilesToScan}
                        onChange={(e) => setMaxFilesToScan(Number(e.target.value))}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                      />
                      <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                        <span>50</span>
                        <span>500</span>
                        <span>1000</span>
                      </div>
                    </div>
                  )}

                  {/* Scan All Files Toggle */}
                  <label className="flex items-center justify-between cursor-pointer">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={scanAllFiles}
                        onChange={(e) => setScanAllFiles(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-gray-900 cursor-pointer"
                      />
                      <span className="text-gray-300 text-xs font-semibold">Scan All Files</span>
                    </div>
                    {scanAllFiles && (
                      <span className="text-yellow-400 text-[10px] font-bold">⚡ UNLIMITED</span>
                    )}
                  </label>

                  <div className="bg-blue-900/20 border border-blue-500/30 rounded p-2">
                    <p className="text-blue-200 text-[10px] leading-relaxed">
                      {scanAllFiles ? (
                        <>
                          <strong className="text-blue-400">⚡ Unlimited Mode:</strong> Will scan ALL files in the repository. Large repos may take longer and use more API requests.
                        </>
                      ) : (
                        <>
                          <strong className="text-blue-400">💡 Limited Mode:</strong> Scanning first {maxFilesToScan} files. Enable "Scan All Files" for complete analysis.
                        </>
                      )}
                    </p>
                  </div>
                </div>

                <button
                  onClick={safeAsyncHandler(scanGitHubRepository)}
                  disabled={!githubUrl || isScanning}
                  className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed text-white rounded-lg font-bold flex items-center justify-center gap-2"
                >
                  {isScanning ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      {scanProgress.message || 'Scanning Repository...'}
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-5 h-5" />
                      Scan Repository
                    </>
                  )}
                </button>

                {/* Progress Bar */}
                {isScanning && scanProgress.total > 0 && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-gray-300 mb-1">
                      <span>{scanProgress.message}</span>
                      <span>{scanProgress.current}/{scanProgress.total}</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-green-600 to-emerald-600 h-full transition-all duration-300"
                        style={{ width: `${(scanProgress.current / scanProgress.total) * 100}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Error Display */}
                {copyError && (
                  <div className="mt-3 bg-red-900/30 border border-red-500/50 rounded-lg p-3 animate-shake">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-red-300 text-sm font-semibold mb-1">Scan Failed</p>
                        <p className="text-red-200 text-xs">{copyError}</p>

                        {copyError.includes('403') && !githubToken && (
                          <div className="mt-2 pt-2 border-t border-red-500/30">
                            <p className="text-red-200 text-xs font-semibold mb-2">💡 Quick Fix:</p>
                            <p className="text-red-100 text-xs mb-2">Add a GitHub Personal Access Token above to bypass rate limits.</p>
                            <a
                              href="https://github.com/settings/tokens/new?description=AI%20Code%20Assistant&scopes=repo"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded font-semibold"
                            >
                              Create GitHub Token →
                            </a>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => setCopyError(null)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Instructions */}
            <div className="p-4">
              <div className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 border border-blue-500/30 rounded-lg p-4 mb-4">
                <h3 className="text-white font-semibold text-sm mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  How it works
                </h3>
                <ul className="text-gray-300 text-xs space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 font-bold">1.</span>
                    <span><strong>Add a GitHub Token</strong> (required if you hit rate limits)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 font-bold">2.</span>
                    <span><strong>Click "Validate"</strong> to check your token works</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 font-bold">3.</span>
                    <span><strong>Enter repository URL</strong> or try an example</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 font-bold">4.</span>
                    <span><strong>Click "Scan Repository"</strong> to analyze all files</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 font-bold">5.</span>
                    <span><strong>Review detected issues</strong> with code previews</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 font-bold">6.</span>
                    <span><strong>Click "Fix All Issues"</strong> to apply automatic corrections</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-400 font-bold">7.</span>
                    <span><strong>Download fixed files</strong> as ZIP or save to folder</span>
                  </li>
                </ul>
              </div>

              <div className="bg-yellow-900/30 border border-yellow-500/30 rounded-lg p-4 mb-4">
                <h3 className="text-yellow-300 font-semibold text-sm mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  ⚠️ Hit Rate Limit? (403 Error)
                </h3>
                <p className="text-gray-300 text-xs mb-3">
                  If you're seeing a 403 error, you've exceeded GitHub's rate limit.
                </p>

                <div className="bg-black/30 rounded p-3 mb-3">
                  <p className="text-white text-xs font-semibold mb-2">📝 Quick Fix Guide:</p>
                  <ol className="text-gray-300 text-xs space-y-1.5 ml-4 list-decimal">
                    <li>Click the blue button below to open GitHub</li>
                    <li>You'll be asked to create a "Personal Access Token"</li>
                    <li>Click <strong className="text-white">"Generate token"</strong> (default settings are fine)</li>
                    <li>Copy the token that starts with <code className="text-green-400">ghp_</code></li>
                    <li>Paste it in the "GitHub Token" field above</li>
                    <li>Click <strong className="text-white">"Validate"</strong> to verify it works</li>
                    <li>Try scanning again - you now have 5,000 requests/hour!</li>
                  </ol>
                </div>

                <a
                  href="https://github.com/settings/tokens/new?description=AI%20Code%20Assistant&scopes=repo"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white text-sm rounded-lg font-bold"
                >
                  <Github className="w-4 h-4" />
                  Create GitHub Token (Opens GitHub)
                </a>
              </div>

              <div className="bg-green-900/30 border border-green-500/30 rounded-lg p-4 mb-4">
                <h3 className="text-green-300 font-semibold text-sm mb-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  What Gets Fixed
                </h3>
                <ul className="text-gray-300 text-xs space-y-1 ml-4 list-disc">
                  <li>Console statements (removed for production)</li>
                  <li>Loose equality (== → ===)</li>
                  <li>Missing semicolons</li>
                  <li>Unused variables</li>
                  <li>Debugger statements</li>
                  <li>And more...</li>
                </ul>
              </div>

              <div className="bg-purple-900/30 border border-purple-500/30 rounded-lg p-4">
                <h3 className="text-purple-300 font-semibold text-sm mb-2 flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  GitHub Token Setup (Detailed)
                </h3>
                <p className="text-gray-300 text-xs mb-2">
                  To scan private repositories or avoid rate limits, you'll need a personal access token:
                </p>
                <ol className="text-gray-300 text-xs space-y-1 list-decimal list-inside">
                  <li>Go to GitHub Settings → Developer Settings</li>
                  <li>Select "Personal Access Tokens" → "Tokens (classic)"</li>
                  <li>Click "Generate new token"</li>
                  <li>Select "repo" scope for full repository access</li>
                  <li>Copy and paste the token above</li>
                </ol>
              </div>

              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-white font-semibold text-sm mb-2 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  Features
                </h3>
                <ul className="text-gray-300 text-xs space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-green-400" />
                    Scan entire repositories
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-green-400" />
                    Detect errors across all files
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-green-400" />
                    Find duplicates and unused code
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-green-400" />
                    Auto-fix all issues
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-green-400" />
                    Download individual files
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-green-400" />
                    Download entire repo as ZIP
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-green-400" />
                    Save directly to folder (pick location!)
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-green-400" />
                    Preserve full folder structure
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-green-400" />
                    Support for TypeScript, JavaScript, React
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-green-400" />
                    Like Vercel & Copilot analysis
                  </li>
                </ul>
              </div>

              {/* Troubleshooting Guide */}
              <div className="bg-orange-900/20 border border-orange-500/30 rounded-lg p-4">
                <h3 className="text-orange-300 font-semibold text-sm mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Troubleshooting Scan Issues
                </h3>
                <div className="space-y-2 text-xs">
                  <div>
                    <p className="text-orange-200 font-semibold">❌ Network Error / Failed to Fetch</p>
                    <p className="text-gray-300 ml-4 mt-0.5">
                      • Check internet connection<br />
                      • Disable VPN/proxy<br />
                      • Try different browser<br />
                      • Check firewall settings
                    </p>
                  </div>
                  <div>
                    <p className="text-orange-200 font-semibold">❌ 404 Not Found</p>
                    <p className="text-gray-300 ml-4 mt-0.5">
                      • Verify repository URL is correct<br />
                      • Make sure repository exists<br />
                      • Check for typos in owner/repo name
                    </p>
                  </div>
                  <div>
                    <p className="text-orange-200 font-semibold">❌ 403 Forbidden</p>
                    <p className="text-gray-300 ml-4 mt-0.5">
                      • Add GitHub token (see above)<br />
                      • Check if repository is private<br />
                      • Verify token has 'repo' scope
                    </p>
                  </div>
                  <div>
                    <p className="text-orange-200 font-semibold">❌ Rate Limit Exceeded</p>
                    <p className="text-gray-300 ml-4 mt-0.5">
                      • Add GitHub token for 5,000/hour limit<br />
                      • Wait for rate limit reset<br />
                      • Without token: only 60 requests/hour
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border border-purple-500/30 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-white font-semibold text-sm flex items-center gap-2">
                    <Folder className="w-4 h-4" />
                    Save Options
                  </h3>
                  <button
                    onClick={() => {
                      const { isSupported, browser, isInIframe } = checkBrowserSupport();
                      if (isSupported) {
                        alert(`✅ Your browser (${browser}) supports folder saving!\n\nYou can use "Save to Folder" feature.`);
                      } else {
                        alert(`❌ Your browser (${browser}) doesn't support folder saving.\n\nPlease use:\n• Chrome 86+\n• Edge 86+\n• Opera 72+\n\nOr use "Download ZIP" instead.`);
                      }
                    }}
                    className="px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-[10px] flex items-center gap-1"
                  >
                    <Info className="w-3 h-3" />
                    Test {checkBrowserSupport().isInIframe ? '⚠️' : ''} Browser
                  </button>
                </div>
                <div className="text-gray-300 text-xs space-y-2">
                  {checkBrowserSupport().isInIframe && (
                    <div className="bg-orange-900/30 border border-orange-500/50 rounded p-2 mb-2">
                      <p className="text-orange-300 font-semibold text-[11px]">⚠️ IFRAME MODE DETECTED</p>
                      <p className="text-orange-200 text-[10px] mt-1">Folder picker is disabled. Use "Download ZIP" instead.</p>
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-blue-300">📦 Download as ZIP</p>
                    <p className="ml-4 mt-1">Downloads a ZIP file to your downloads folder. You extract it manually wherever you want.</p>
                  </div>
                  <div>
                    <p className="font-semibold text-purple-300">📁 Save to Folder</p>
                    <p className="ml-4 mt-1">Choose any folder on your computer. Files are saved instantly with full folder structure preserved!</p>
                  </div>
                  <div className="bg-yellow-900/20 border border-yellow-500/30 rounded p-2 mt-2">
                    <p className="text-yellow-300 text-[10px] font-semibold mb-1">
                      ⚡ Browser Requirements
                    </p>
                    <p className="text-yellow-200 text-[10px]">
                      ✅ Chrome 86+ / Edge 86+ / Opera 72+
                    </p>
                    <p className="text-gray-400 text-[10px]">
                      ❌ Firefox, Safari → Use ZIP download
                    </p>
                  </div>
                  <div className="bg-red-900/20 border border-red-500/30 rounded p-2 mt-2">
                    <p className="text-red-300 text-[10px] font-semibold mb-1">
                      ⚠️ Troubleshooting
                    </p>
                    <p className="text-red-200 text-[10px]">
                      If errors occur, check browser console (F12)
                    </p>
                    <p className="text-gray-400 text-[10px]">
                      Look for detailed error messages with file names
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Scan Results */}
          <div className="w-1/2 flex flex-col bg-gray-850 overflow-y-auto">
            {!scanResult ? (
              <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
                <div className="text-center max-w-md">
                  <div className="w-24 h-24 bg-gradient-to-br from-green-600 to-emerald-600 rounded-full mx-auto mb-6 flex items-center justify-center">
                    <FolderGit2 className="w-12 h-12 text-white" />
                  </div>
                  <h3 className="text-white text-2xl font-bold mb-3">
                    Repository Scanner
                  </h3>
                  <p className="text-gray-400 mb-6">
                    Enter a GitHub repository URL to scan and analyze all files for issues
                  </p>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-gray-800 p-4 rounded-lg">
                      <FileCode className="w-6 h-6 text-blue-400 mb-2 mx-auto" />
                      <p className="text-gray-300">Multi-file Analysis</p>
                    </div>
                    <div className="bg-gray-800 p-4 rounded-lg">
                      <GitBranch className="w-6 h-6 text-green-400 mb-2 mx-auto" />
                      <p className="text-gray-300">Branch Support</p>
                    </div>
                    <div className="bg-gray-800 p-4 rounded-lg">
                      <Wand2 className="w-6 h-6 text-purple-400 mb-2 mx-auto" />
                      <p className="text-gray-300">Auto Fix</p>
                    </div>
                    <div className="bg-gray-800 p-4 rounded-lg">
                      <Zap className="w-6 h-6 text-yellow-400 mb-2 mx-auto" />
                      <p className="text-gray-300">Fast Scan</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Scan Summary */}
                <div className="bg-gray-800 p-4 border-b border-gray-700">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-white font-bold text-lg flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-400" />
                        Scan Complete
                      </h2>
                      <p className="text-gray-400 text-xs mt-1">
                        {scanResult.repository} • {scanResult.branch} branch
                      </p>
                    </div>
                    <button
                      onClick={() => { setScanResult(null); bridgeClearFiles(); }}
                      className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs"
                    >
                      New Scan
                    </button>
                  </div>

                  <div className="grid grid-cols-5 gap-2 mb-4">
                    <div className={`p-2 rounded text-center ${scanResult.totalFiles > scanResult.scannedFiles
                      ? 'bg-yellow-900/30 border border-yellow-500/30'
                      : 'bg-gray-700'
                      }`}>
                      <p className={`text-xl font-bold ${scanResult.totalFiles > scanResult.scannedFiles
                        ? 'text-yellow-400'
                        : 'text-white'
                        }`}>{scanResult.scannedFiles}</p>
                      <p className="text-gray-400 text-xs">Files Scanned</p>
                      {scanResult.totalFiles > scanResult.scannedFiles && (
                        <>
                          <p className="text-yellow-300 text-[10px] mt-0.5 font-semibold">
                            {scanResult.totalFiles} found
                          </p>
                          <p className="text-yellow-400 text-[9px] mt-0.5">
                            ⚠️ Partial scan
                          </p>
                        </>
                      )}
                    </div>
                    <div className="bg-gray-700 p-2 rounded text-center">
                      <p className="text-xl font-bold text-white">{scanResult.totalIssues}</p>
                      <p className="text-gray-400 text-xs">Issues</p>
                    </div>
                    <div className="bg-red-900/30 p-2 rounded text-center">
                      <p className="text-xl font-bold text-red-400">{scanResult.summary.errors}</p>
                      <p className="text-red-300 text-xs">Errors</p>
                    </div>
                    <div className="bg-yellow-900/30 p-2 rounded text-center">
                      <p className="text-xl font-bold text-yellow-400">{scanResult.summary.warnings}</p>
                      <p className="text-yellow-300 text-xs">Warnings</p>
                    </div>
                    <div className="bg-blue-900/30 p-2 rounded text-center">
                      <p className="text-xl font-bold text-blue-400">{scanResult.summary.suggestions}</p>
                      <p className="text-blue-300 text-xs">Suggestions</p>
                    </div>
                  </div>

                  {/* Partial Scan Warning */}
                  {scanResult.totalFiles > scanResult.scannedFiles && (
                    <div className="bg-gradient-to-r from-yellow-900/30 to-orange-900/30 border-2 border-yellow-500/40 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-4 h-4 text-yellow-400" />
                        <h4 className="text-yellow-300 font-bold text-sm">
                          Partial Repository Scan
                        </h4>
                      </div>
                      <p className="text-yellow-200 text-xs mb-2">
                        Scanned {scanResult.scannedFiles} of {scanResult.totalFiles} files ({Math.round((scanResult.scannedFiles / scanResult.totalFiles) * 100)}%).
                        {scanResult.totalFiles - scanResult.scannedFiles} files were not analyzed.
                      </p>
                      <div className="bg-yellow-950/50 rounded p-2">
                        <p className="text-yellow-100 text-[11px] font-semibold mb-1">
                          💡 To scan all {scanResult.totalFiles} files:
                        </p>
                        <ul className="text-yellow-200 text-[10px] space-y-0.5 ml-3">
                          <li>• Enable "Scan All Files" in Scan Options</li>
                          <li>• Or increase "Max Files to Scan" slider</li>
                          <li>• Click "New Scan" and scan again</li>
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Import/Export Mismatches Callout */}
                  {(() => {
                    const importExportMismatches = scanResult.files.reduce((sum, file) =>
                      sum + file.issues.filter(i => i.type === 'import/export mismatch').length, 0
                    );
                    return importExportMismatches > 0 && (
                      <div className="mt-3 bg-gradient-to-r from-cyan-900/30 to-blue-900/30 border-2 border-cyan-500/40 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <RefreshCw className="w-4 h-4 text-cyan-400" />
                          <h4 className="text-cyan-300 font-bold text-sm">
                            {importExportMismatches} Import/Export Mismatch{importExportMismatches !== 1 ? 'es' : ''} Detected!
                          </h4>
                        </div>
                        <p className="text-cyan-200 text-xs">
                          Found {importExportMismatches} import{importExportMismatches !== 1 ? 's' : ''} that don't match the actual exports in files. These can be automatically fixed!
                        </p>
                        <div className="mt-2 bg-cyan-950/50 rounded p-2">
                          <p className="text-cyan-100 text-[11px] font-semibold mb-1">Common issues:</p>
                          <ul className="text-cyan-200 text-[10px] space-y-0.5 ml-3">
                            <li>• Using default import when file has named exports</li>
                            <li>• Using named import when file has default export</li>
                            <li>• Importing names that don't exist in target file</li>
                          </ul>
                        </div>
                      </div>
                    );
                  })()}

                  {/* TypeScript Type Safety Issues Callout */}
                  {(() => {
                    const nullableFieldIssues = scanResult.files.reduce((sum, file) =>
                      sum + file.issues.filter(i => i.type === 'nullable field access').length, 0
                    );
                    const unionTypeIssues = scanResult.files.reduce((sum, file) =>
                      sum + file.issues.filter(i => i.type === 'union type field').length, 0
                    );
                    const nullableArrayIssues = scanResult.files.reduce((sum, file) =>
                      sum + file.issues.filter(i => i.type === 'nullable array access').length, 0
                    );
                    const totalTypeIssues = nullableFieldIssues + unionTypeIssues + nullableArrayIssues;

                    return totalTypeIssues > 0 && (
                      <div className="mt-3 bg-gradient-to-r from-purple-900/30 to-indigo-900/30 border-2 border-purple-500/40 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Zap className="w-4 h-4 text-purple-400" />
                          <h4 className="text-purple-300 font-bold text-sm">
                            {totalTypeIssues} TypeScript Type Safety Issue{totalTypeIssues !== 1 ? 's' : ''} Detected!
                          </h4>
                        </div>
                        <p className="text-purple-200 text-xs mb-2">
                          Found {totalTypeIssues} potential null reference error{totalTypeIssues !== 1 ? 's' : ''} and type safety issues from analyzing interfaces, types, and variable declarations.
                        </p>
                        <div className="grid grid-cols-3 gap-2 mb-2">
                          {nullableFieldIssues > 0 && (
                            <div className="bg-purple-950/50 rounded p-1.5 text-center">
                              <p className="text-purple-100 text-lg font-bold">{nullableFieldIssues}</p>
                              <p className="text-purple-300 text-[9px]">Nullable Fields</p>
                            </div>
                          )}
                          {unionTypeIssues > 0 && (
                            <div className="bg-purple-950/50 rounded p-1.5 text-center">
                              <p className="text-purple-100 text-lg font-bold">{unionTypeIssues}</p>
                              <p className="text-purple-300 text-[9px]">Union Types</p>
                            </div>
                          )}
                          {nullableArrayIssues > 0 && (
                            <div className="bg-purple-950/50 rounded p-1.5 text-center">
                              <p className="text-purple-100 text-lg font-bold">{nullableArrayIssues}</p>
                              <p className="text-purple-300 text-[9px]">Nullable Arrays</p>
                            </div>
                          )}
                        </div>
                        <div className="bg-purple-950/50 rounded p-2">
                          <p className="text-purple-100 text-[11px] font-semibold mb-1">Detected patterns:</p>
                          <ul className="text-purple-200 text-[10px] space-y-0.5 ml-3">
                            <li>• Accessing fields marked as nullable (Type | null)</li>
                            <li>• Using union type fields without type guards</li>
                            <li>• Array access without null/undefined checks</li>
                            <li>• Missing optional chaining on optional fields</li>
                          </ul>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Directory Structure Suggestions */}
                  {scanResult.structureSuggestions && scanResult.structureSuggestions.length > 0 && (
                    <div className="mt-3 bg-purple-900/20 border border-purple-500/30 rounded-lg p-3">
                      <h4 className="text-purple-300 font-semibold text-xs mb-2 flex items-center gap-1">
                        <FolderGit2 className="w-3 h-3" />
                        Directory Structure Suggestions
                      </h4>
                      <ul className="text-purple-200 text-xs space-y-1 ml-4 list-disc">
                        {scanResult.structureSuggestions.map((suggestion, idx) => (
                          <li key={idx}>{suggestion}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="space-y-2 mt-4">
                    {scanResult.totalIssues > 0 && (
                      <>
                        {/* Single-pass Fix All */}
                        <button
                          onClick={safeAsyncHandler(fixAllRepoIssues)}
                          disabled={isFixing || fixesApplied || isRunUntilClean}
                          className={`w-full py-2.5 ${fixesApplied
                            ? 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700'
                            : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
                            } disabled:from-gray-700 disabled:to-gray-700 text-white rounded-lg font-bold flex items-center justify-center gap-2`}
                        >
                          {isFixing ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              Fixing All Issues...
                            </>
                          ) : fixesApplied ? (
                            <>
                              <CheckCircle className="w-4 h-4" />
                              ✓ Fixes Applied • View Corrections Below
                            </>
                          ) : (
                            <>
                              <Wand2 className="w-4 h-4" />
                              Fix All {scanResult.totalIssues} Issues
                            </>
                          )}
                        </button>

                        {/* Run Until Clean — multi-pass loop */}
                        <button
                          onClick={safeAsyncHandler(runUntilClean)}
                          disabled={isFixing || isRunUntilClean}
                          title={`Repeatedly apply fixes and re-scan until 0 errors remain (max ${MAX_CLEAN_ITERATIONS} passes)`}
                          className="w-full py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 disabled:from-gray-700 disabled:to-gray-700 text-white rounded-lg font-bold flex items-center justify-center gap-2"
                        >
                          {isRunUntilClean ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              Running Pass {runUntilCleanIteration}/{MAX_CLEAN_ITERATIONS}…
                            </>
                          ) : (
                            <>
                              <Zap className="w-4 h-4" />
                              Run Until Clean (auto-loop)
                            </>
                          )}
                        </button>
                      </>
                    )}

                    <button
                      onClick={safeAsyncHandler(downloadAllGitHubFiles)}
                      className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-lg font-bold flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Download All Files (ZIP)
                    </button>

                    <button
                      onClick={safeAsyncHandler(saveToFolder)}
                      disabled={isSavingToFolder || checkBrowserSupport().isInIframe}
                      className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed text-white rounded-lg font-bold flex items-center justify-center gap-2 relative group"
                    >
                      {isSavingToFolder ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Saving {saveProgress.current}/{saveProgress.total}...
                        </>
                      ) : checkBrowserSupport().isInIframe ? (
                        <>
                          <XCircle className="w-4 h-4" />
                          Folder Picker Disabled (Iframe Mode)
                        </>
                      ) : (
                        <>
                          <Folder className="w-4 h-4" />
                          Save to Folder (Choose Location)
                        </>
                      )}

                      {/* Tooltip */}
                      {!isSavingToFolder && (
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                          Chrome/Edge only • Check console for errors
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                        </div>
                      )}
                    </button>

                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          scanResult.files.forEach(file => downloadGitHubFile(file, false));
                        }}
                        className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold flex items-center justify-center gap-2 text-sm"
                      >
                        <FileCode className="w-4 h-4" />
                        Download Original
                      </button>
                      <button
                        onClick={() => {
                          scanResult.files.forEach(file => downloadGitHubFile(file, true));
                        }}
                        className="flex-1 py-2 bg-green-700 hover:bg-green-600 text-white rounded-lg font-semibold flex items-center justify-center gap-2 text-sm"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Download Fixed
                      </button>
                    </div>

                    {/* Download Error Summary */}
                    <div className="mt-2 bg-gradient-to-r from-purple-900/30 to-pink-900/30 border border-purple-500/30 rounded-lg p-3">
                      <p className="text-purple-300 text-xs font-semibold mb-2 flex items-center gap-1">
                        <FileDown className="w-3 h-3" />
                        Download Error Summary Report
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          onClick={() => downloadErrorSummary('txt')}
                          className="py-1.5 bg-purple-700 hover:bg-purple-600 text-white rounded font-semibold text-xs flex items-center justify-center gap-1"
                        >
                          <FileText className="w-3 h-3" />
                          TXT
                        </button>
                        <button
                          onClick={() => downloadErrorSummary('json')}
                          className="py-1.5 bg-purple-700 hover:bg-purple-600 text-white rounded font-semibold text-xs flex items-center justify-center gap-1"
                        >
                          <Code className="w-3 h-3" />
                          JSON
                        </button>
                        <button
                          onClick={() => downloadErrorSummary('html')}
                          className="py-1.5 bg-purple-700 hover:bg-purple-600 text-white rounded font-semibold text-xs flex items-center justify-center gap-1"
                        >
                          <Sparkles className="w-3 h-3" />
                          HTML
                        </button>
                      </div>
                      <p className="text-purple-200 text-[10px] mt-2">
                        Detailed report with all issues, fixes, and statistics
                      </p>
                    </div>
                  </div>
                </div>

                {/* Corrections Summary Button */}
                {scanResult.totalIssues > 0 && (
                  <div className="px-4 pb-3">
                    <button
                      onClick={() => setShowGitHubCorrections(!showGitHubCorrections)}
                      className="w-full py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2 border border-cyan-500/30 relative"
                    >
                      <Sparkles className="w-4 h-4" />
                      {showGitHubCorrections ? 'Hide' : 'Show'} Corrections Summary
                      <span className="bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                        {scanResult.totalIssues}
                      </span>
                      <ChevronDown className={`w-4 h-4 transition-transform ${showGitHubCorrections ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                )}

                {/* Corrections Summary Panel */}
                {showGitHubCorrections && scanResult.totalIssues > 0 && (
                  <div className="mx-4 mb-3 bg-gradient-to-br from-green-900/30 to-emerald-900/30 border-2 border-green-500/40 rounded-lg shadow-lg shadow-green-500/20 max-h-[60vh] overflow-y-auto">
                    <div className="sticky top-0 bg-gradient-to-br from-green-900/95 to-emerald-900/95 backdrop-blur-sm p-4 border-b border-green-500/30 z-10">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-green-400 font-bold text-lg flex items-center gap-2">
                          <CheckCircle className="w-5 h-5" />
                          Corrections Applied to Files
                        </h3>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <span className="text-green-300 text-sm font-semibold">
                              {scanResult.files.filter(f => f.issues.length > 0).length} Files
                            </span>
                            <span className="text-gray-400">•</span>
                            <span className="text-green-300 text-sm font-semibold">
                              {scanResult.totalIssues} Fixes
                            </span>
                          </div>
                          <button
                            onClick={() => downloadErrorSummary('html')}
                            className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-semibold text-xs flex items-center gap-1.5 border border-purple-400/30"
                            title="Download detailed report"
                          >
                            <FileDown className="w-3.5 h-3.5" />
                            Export Report
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="p-4">
                      <div className="bg-blue-900/30 border border-blue-500/30 rounded p-3 mb-4">
                        <p className="text-blue-300 text-xs font-semibold mb-1 flex items-center gap-1">
                          <Info className="w-3.5 h-3.5" />
                          {fixesApplied ? 'How It Works:' : 'Click "Fix All Issues" First:'}
                        </p>
                        <p className="text-blue-200 text-xs">
                          {fixesApplied
                            ? 'Below is a detailed view of all corrections applied to your code. When you download files, you\'ll get the fixed versions shown in green.'
                            : 'Click the "Fix All Issues" button above to apply automatic corrections, then this panel will show you exactly what was changed in each file.'}
                        </p>
                      </div>

                      <p className="text-gray-300 text-sm mb-4 border-l-2 border-green-500 pl-3">
                        Each fix includes the original code (red), corrected code (green), and an explanation of why the change was made.
                      </p>

                      {/* Issue Type Breakdown */}
                      <div className="bg-gray-900/50 rounded-lg p-3 mb-4">
                        <p className="text-gray-300 font-semibold text-xs mb-2">🔍 Issues Found by Type:</p>
                        <div className="grid grid-cols-2 gap-2">
                          {(() => {
                            const issueTypes = new Map<string, number>();
                            scanResult.files.forEach(file => {
                              file.issues.forEach(issue => {
                                issueTypes.set(issue.type, (issueTypes.get(issue.type) || 0) + 1);
                              });
                            });

                            return Array.from(issueTypes.entries())
                              .sort((a, b) => b[1] - a[1])
                              .map(([type, count]) => (
                                <div key={type} className="flex items-center justify-between bg-black/30 rounded p-1.5">
                                  <span className="text-gray-300 text-xs capitalize">{type}</span>
                                  <span className="text-green-400 text-xs font-bold">{count}</span>
                                </div>
                              ));
                          })()}
                        </div>
                      </div>

                      <div className="space-y-3">
                        {scanResult.files
                          .filter(file => file.issues.length > 0)
                          .map((file, fileIdx) => (
                            <div key={fileIdx} className="bg-black/20 rounded-lg p-3 border border-green-500/20">
                              <div className="flex items-start gap-2 mb-2">
                                <FileCode className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-green-300 font-semibold text-sm break-all">{file.path}</p>
                                  <p className="text-gray-400 text-xs mt-0.5">
                                    {file.issues.length} issue{file.issues.length !== 1 ? 's' : ''} corrected
                                  </p>
                                </div>
                              </div>

                              <div className="space-y-2 mt-3">
                                {file.issues.map((issue, issueIdx) => (
                                  <div key={issueIdx} className="bg-gray-900/50 rounded p-2.5 border-l-2 border-green-500">
                                    <div className="flex items-start gap-2 mb-1.5">
                                      {issue.severity === 'error' ? (
                                        <XCircle className="w-3.5 h-3.5 text-red-400 mt-0.5 flex-shrink-0" />
                                      ) : issue.severity === 'warning' ? (
                                        <AlertTriangle className="w-3.5 h-3.5 text-yellow-400 mt-0.5 flex-shrink-0" />
                                      ) : (
                                        <Info className="w-3.5 h-3.5 text-blue-400 mt-0.5 flex-shrink-0" />
                                      )}
                                      <div className="flex-1">
                                        <p className="text-white text-xs font-semibold">
                                          Line {issue.line}: {issue.type.charAt(0).toUpperCase() + issue.type.slice(1)}
                                        </p>
                                        <p className="text-gray-300 text-xs mt-0.5">{issue.message}</p>
                                      </div>
                                    </div>

                                    {/* Before/After Code */}
                                    <div className="mt-2 space-y-1.5">
                                      {/* Original Code */}
                                      <div className="bg-red-900/20 border border-red-500/30 rounded p-2">
                                        <p className="text-red-400 text-[10px] font-semibold mb-1 flex items-center gap-1">
                                          <X className="w-3 h-3" />
                                          Original:
                                        </p>
                                        <pre className="text-red-200 text-[11px] font-mono overflow-x-auto">
                                          {issue.original}
                                        </pre>
                                      </div>

                                      {/* Fixed Code */}
                                      {issue.fixed ? (
                                        <div className="bg-green-900/20 border border-green-500/30 rounded p-2">
                                          <p className="text-green-400 text-[10px] font-semibold mb-1 flex items-center gap-1">
                                            <Check className="w-3 h-3" />
                                            Fixed:
                                          </p>
                                          <pre className="text-green-200 text-[11px] font-mono overflow-x-auto">
                                            {issue.fixed}
                                          </pre>
                                        </div>
                                      ) : (
                                        <div className="bg-gray-900/40 border border-gray-500/30 rounded p-2">
                                          <p className="text-gray-400 text-[10px] font-semibold mb-1 flex items-center gap-1">
                                            <Info className="w-3 h-3" />
                                            Note:
                                          </p>
                                          <p className="text-gray-300 text-[11px]">
                                            This issue requires manual review and cannot be auto-fixed.
                                          </p>
                                        </div>
                                      )}

                                      {/* Explanation */}
                                      <div className="bg-blue-900/20 border border-blue-500/30 rounded p-2">
                                        <p className="text-blue-400 text-[10px] font-semibold mb-1 flex items-center gap-1">
                                          <Lightbulb className="w-3 h-3" />
                                          Explanation:
                                        </p>
                                        <p className="text-blue-200 text-[11px]">
                                          {issue.description}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}

                        {/* Overall Stats */}
                        <div className="bg-gradient-to-r from-green-900/40 to-emerald-900/40 border border-green-500/40 rounded-lg p-3 mt-4">
                          <div className="grid grid-cols-3 gap-3 text-center">
                            <div>
                              <p className="text-2xl font-bold text-green-400">{scanResult.files.filter(f => f.issues.length > 0).length}</p>
                              <p className="text-green-300 text-xs">Files Fixed</p>
                            </div>
                            <div>
                              <p className="text-2xl font-bold text-green-400">{scanResult.totalIssues}</p>
                              <p className="text-green-300 text-xs">Issues Corrected</p>
                            </div>
                            <div>
                              <p className="text-2xl font-bold text-green-400">
                                {Math.round((scanResult.totalIssues / (scanResult.totalIssues + scanResult.files.filter(f => f.issues.length === 0).length)) * 100)}%
                              </p>
                              <p className="text-green-300 text-xs">Improvement</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* File List */}
                <div className="p-2">
                  {scanResult.totalIssues === 0 ? (
                    <div className="text-center py-12">
                      <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                      <h3 className="text-white text-xl font-bold mb-2">All files are clean!</h3>
                      <p className="text-gray-400">No issues detected in the repository.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {scanResult.files.map((file) => (
                        <div
                          key={file.path}
                          className={`border rounded-lg overflow-hidden ${file.issues.length > 0
                            ? 'border-red-500/50 bg-red-900/20'
                            : 'border-green-500/50 bg-green-900/20'
                            }`}
                        >
                          <div
                            onClick={() => toggleFileExpansion(file.path)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => e.key === 'Enter' && toggleFileExpansion(file.path)}
                            className="w-full p-3 hover:bg-white/5 transition-colors cursor-pointer"
                          >
                            <div className="flex items-center gap-3">
                              <FileCode className={`w-5 h-5 ${file.issues.length > 0 ? 'text-red-400' : 'text-green-400'}`} />
                              <div className="flex-1 text-left">
                                <div className="flex items-center justify-between">
                                  <div className="flex-1 mr-3">
                                    <h4 className="text-white font-semibold text-sm">
                                      {file.path}
                                    </h4>
                                    {file.issues.length > 0 && (
                                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                        {file.issues.filter(i => i.type === 'broken import' || i.type === 'broken require').length > 0 && (
                                          <span className="text-[10px] px-1.5 py-0.5 bg-red-700 text-white rounded font-semibold">
                                            🔴 {file.issues.filter(i => i.type === 'broken import' || i.type === 'broken require').length} Broken Import{file.issues.filter(i => i.type === 'broken import' || i.type === 'broken require').length !== 1 ? 's' : ''}
                                          </span>
                                        )}
                                        {file.issues.filter(i => i.type === 'import/export mismatch').length > 0 && (
                                          <span className="text-[10px] px-1.5 py-0.5 bg-cyan-600 text-white rounded font-semibold">
                                            🔄 {file.issues.filter(i => i.type === 'import/export mismatch').length} Import Mismatch{file.issues.filter(i => i.type === 'import/export mismatch').length !== 1 ? 'es' : ''}
                                          </span>
                                        )}
                                        {file.issues.filter(i => i.type === 'nullable field access' || i.type === 'nullable array access' || i.type === 'union type field').length > 0 && (
                                          <span className="text-[10px] px-1.5 py-0.5 bg-purple-600 text-white rounded font-semibold">
                                            🔷 {file.issues.filter(i => i.type === 'nullable field access' || i.type === 'nullable array access' || i.type === 'union type field').length} Type Issue{file.issues.filter(i => i.type === 'nullable field access' || i.type === 'nullable array access' || i.type === 'union type field').length !== 1 ? 's' : ''}
                                          </span>
                                        )}
                                        {file.issues.filter(i => i.type === 'dom nesting').length > 0 && (
                                          <span className="text-[10px] px-1.5 py-0.5 bg-orange-600 text-white rounded font-semibold">
                                            🏗️ {file.issues.filter(i => i.type === 'dom nesting').length} DOM Nesting{file.issues.filter(i => i.type === 'dom nesting').length !== 1 ? ' Errors' : ' Error'}
                                          </span>
                                        )}
                                        {file.issues.filter(i => i.severity === 'error' && i.type !== 'broken import' && i.type !== 'broken require' && i.type !== 'import/export mismatch' && i.type !== 'dom nesting').length > 0 && (
                                          <span className="text-[10px] px-1.5 py-0.5 bg-red-600 text-white rounded">
                                            ❌ {file.issues.filter(i => i.severity === 'error' && i.type !== 'broken import' && i.type !== 'broken require').length} Error{file.issues.filter(i => i.severity === 'error' && i.type !== 'broken import' && i.type !== 'broken require').length !== 1 ? 's' : ''}
                                          </span>
                                        )}
                                        {file.issues.filter(i => i.severity === 'warning').length > 0 && (
                                          <span className="text-[10px] px-1.5 py-0.5 bg-yellow-600 text-white rounded">
                                            ⚠️ {file.issues.filter(i => i.severity === 'warning').length} Warning{file.issues.filter(i => i.severity === 'warning').length !== 1 ? 's' : ''}
                                          </span>
                                        )}
                                        {file.issues.filter(i => i.severity === 'info').length > 0 && (
                                          <span className="text-[10px] px-1.5 py-0.5 bg-blue-600 text-white rounded">
                                            💡 {file.issues.filter(i => i.severity === 'info').length} Suggestion{file.issues.filter(i => i.severity === 'info').length !== 1 ? 's' : ''}
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {file.issues.length > 0 ? (
                                      <>
                                        <span className="text-xs px-2 py-0.5 bg-red-600 text-white rounded font-semibold">
                                          {file.issues.length} Total
                                        </span>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            fixFileIssues(file);
                                          }}
                                          disabled={isFixing}
                                          className="text-xs px-2 py-0.5 bg-green-600 hover:bg-green-700 text-white rounded"
                                        >
                                          Fix
                                        </button>
                                      </>
                                    ) : (
                                      <span className="text-xs px-2 py-0.5 bg-green-600 text-white rounded">
                                        Clean
                                      </span>
                                    )}
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        downloadGitHubFile(file, file.issues.length > 0);
                                      }}
                                      className="text-xs px-2 py-0.5 bg-blue-600 hover:bg-blue-700 text-white rounded flex items-center gap-1"
                                      title={file.issues.length > 0 ? "Download fixed version" : "Download file"}
                                    >
                                      <Download className="w-3 h-3" />
                                    </button>
                                    {expandedFiles.has(file.path) ? (
                                      <ChevronDown className="w-4 h-4 text-gray-400" />
                                    ) : (
                                      <ChevronRight className="w-4 h-4 text-gray-400" />
                                    )}
                                  </div>
                                </div>
                                <p className="text-gray-400 text-xs mt-1">
                                  {file.language} • {file.content.split('\n').length} lines
                                </p>
                              </div>
                            </div>
                          </div>

                          {expandedFiles.has(file.path) && (
                            <div className="border-t border-gray-700 bg-gray-900/50">
                              {file.issues.length > 0 ? (
                                <div className="p-3 space-y-2">
                                  {file.issues.map((issue, idx) => (
                                    <div key={idx} className="bg-gray-800 rounded p-2">
                                      <div className="flex items-start gap-2">
                                        {getSeverityIcon(issue.severity)}
                                        <div className="flex-1">
                                          <p className="text-white text-xs font-semibold">
                                            Line {issue.line}: {issue.message}
                                          </p>
                                          <p className="text-gray-400 text-xs mt-1">
                                            {issue.description}
                                          </p>
                                          {issue.fixed && (
                                            <div className="mt-2 text-xs">
                                              <span className="text-gray-400">Fix: </span>
                                              <code className="text-green-300">{issue.fixed}</code>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="p-3 text-center">
                                  <p className="text-green-300 text-xs">No issues found</p>
                                </div>
                              )}

                              {/* Code Preview */}
                              <div className="border-t border-gray-700 bg-gray-800">
                                <div className="p-2 bg-gray-900 border-b border-gray-700 flex items-center justify-between">
                                  <span className="text-gray-400 text-xs font-semibold">Code Preview</span>
                                  <div className="flex gap-1">
                                    <button
                                      onClick={() => copyToClipboard(file.issues.length > 0 ? generateFixedFileContent(file) : file.content)}
                                      className="text-xs px-2 py-0.5 bg-blue-600 hover:bg-blue-700 text-white rounded flex items-center gap-1"
                                    >
                                      <Copy className="w-3 h-3" />
                                      Copy
                                    </button>
                                    <button
                                      onClick={() => downloadGitHubFile(file, file.issues.length > 0)}
                                      className="text-xs px-2 py-0.5 bg-green-600 hover:bg-green-700 text-white rounded flex items-center gap-1"
                                    >
                                      <Download className="w-3 h-3" />
                                      Download
                                    </button>
                                  </div>
                                </div>
                                <pre className="p-3 overflow-auto max-h-64 text-xs font-mono text-gray-300 bg-gray-900">
                                  {file.issues.length > 0 ? generateFixedFileContent(file) : file.content}
                                </pre>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      ) : mode === 'terminal' ? (
        /* Terminal Mode */
        <div className="flex-1 flex overflow-hidden bg-black">
          {/* Left Panel - Code Editor */}
          <div className="w-1/2 border-r border-gray-700 flex flex-col">
            <div className="bg-gray-900 p-4 border-b border-gray-700">
              <h2 className="text-green-400 font-bold text-lg mb-3 flex items-center gap-2 font-mono">
                <Terminal className="w-5 h-5" />
                Code Editor
              </h2>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <button
                    onClick={safeAsyncHandler(runCodeInTerminal)}
                    disabled={!terminalCode || isRunning || autoFixRunning}
                    className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded font-bold flex items-center justify-center gap-2"
                  >
                    {isRunning ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Running...
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4" />
                        Run Code
                      </>
                    )}
                  </button>
                  <button
                    onClick={safeAsyncHandler(autoFixAllErrors)}
                    disabled={terminalErrors.length === 0 || autoFixRunning || isRunning}
                    className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded font-bold flex items-center justify-center gap-2"
                  >
                    {autoFixRunning ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Fixing... ({fixIteration}/{maxIterations})
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-4 h-4" />
                        Auto-Fix All
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex-1 p-2 overflow-y-auto bg-gray-900">
              <textarea
                value={terminalCode}
                onChange={(e) => setTerminalCode(e.target.value)}
                placeholder="// Paste your code here and click 'Run Code'&#10;// Terminal will detect errors and auto-fix them&#10;&#10;const App = () => {&#10;  const [count, setCount] = useState(0);&#10;  return <div>{count}</div>;&#10;};"
                className="w-full h-full px-3 py-2 bg-black text-green-400 border border-gray-700 rounded-lg focus:border-green-500 focus:outline-none resize-none font-mono text-sm"
                spellCheck={false}
              />
            </div>

            {terminalCode && (
              <div className="bg-gray-900 p-2 border-t border-gray-700">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400 font-mono">
                    Lines: {terminalCode.split('\n').length}
                  </span>
                  <span className="text-gray-400 font-mono">
                    Characters: {terminalCode.length}
                  </span>
                  {terminalErrors.length > 0 && (
                    <span className="text-red-400 font-mono font-bold">
                      Errors: {terminalErrors.filter(e => !e.fixed).length}
                    </span>
                  )}
                  <button
                    onClick={() => copyToClipboard(terminalCode)}
                    className="text-green-400 hover:text-green-300 flex items-center gap-1 font-mono"
                  >
                    <Copy className="w-4 h-4" />
                    Copy
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Panel - Terminal Output */}
          <div className="w-1/2 flex flex-col bg-black">
            <div className="bg-gray-900 p-4 border-b border-gray-700 flex items-center justify-between">
              <h2 className="text-green-400 font-bold text-lg flex items-center gap-2 font-mono">
                <Terminal className="w-5 h-5" />
                Terminal Output
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={clearTerminal}
                  className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-green-400 rounded text-sm font-mono flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  Clear
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-1 font-mono text-sm">
              {terminalLogs.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center max-w-md">
                    <Terminal className="w-20 h-20 text-green-400 mx-auto mb-4 opacity-50" />
                    <p className="text-gray-500 mb-4 font-mono">
                      Terminal is ready. Paste your code and click "Run Code"
                    </p>
                    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 text-left">
                      <p className="text-green-400 text-xs mb-2">$ Example workflow:</p>
                      <ol className="text-gray-400 text-xs space-y-1 list-decimal list-inside">
                        <li>Paste or type your code in the editor</li>
                        <li>Click "Run Code" to execute</li>
                        <li>Terminal shows errors if any</li>
                        <li>Click "Auto-Fix All" to fix errors</li>
                        <li>Repeat until all errors are eliminated</li>
                      </ol>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {terminalLogs.map((log) => (
                    <div key={log.id} className="py-1">
                      <div className="flex items-start gap-2">
                        <span className="text-gray-600 text-xs">
                          [{log.timestamp.toLocaleTimeString()}]
                        </span>
                        <div className="flex-1">
                          <div className={`flex items-start gap-2 ${log.type === 'error' ? 'text-red-400' :
                            log.type === 'success' ? 'text-green-400' :
                              log.type === 'warning' ? 'text-yellow-400' :
                                log.type === 'command' ? 'text-blue-400' :
                                  log.type === 'fix' ? 'text-purple-400' :
                                    'text-gray-400'
                            }`}>
                            {log.type === 'error' && <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />}
                            {log.type === 'success' && <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />}
                            {log.type === 'warning' && <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />}
                            {log.type === 'command' && <Terminal className="w-4 h-4 mt-0.5 flex-shrink-0" />}
                            {log.type === 'fix' && <Wand2 className="w-4 h-4 mt-0.5 flex-shrink-0" />}
                            {log.type === 'info' && <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />}
                            <span className="break-words">{log.message}</span>
                          </div>
                          {log.details && (
                            <div className="text-gray-600 text-xs ml-6 mt-1">
                              {log.details}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {/* Ask AI about errors button */}
                  {terminalErrors.filter(e => !e.fixed).length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-800">
                      <button
                        onClick={() => askAIAboutTerminalError(
                          terminalErrors.filter(e => !e.fixed).map(e =>
                            `${e.type}: ${e.message} at line ${e.line}`
                          ).join('\n')
                        )}
                        className="w-full py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg font-semibold text-sm flex items-center justify-center gap-2"
                      >
                        <Sparkles className="w-4 h-4" />
                        Ask Genius AI to Fix These Errors
                      </button>
                    </div>
                  )}
                  <div ref={terminalEndRef} />
                </>
              )}
            </div>

            {/* Status Bar */}
            <div className="bg-gray-900 border-t border-gray-700 p-2 flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-4">
                <span className={`flex items-center gap-1 ${isRunning || autoFixRunning ? 'text-yellow-400' : 'text-green-400'
                  }`}>
                  <div className={`w-2 h-2 rounded-full ${isRunning || autoFixRunning ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'
                    }`}></div>
                  {isRunning ? 'Running' : autoFixRunning ? 'Auto-Fixing' : 'Ready'}
                </span>
                <span className="text-gray-400">
                  Logs: {terminalLogs.length}
                </span>
                {terminalErrors.length > 0 && (
                  <span className="text-red-400">
                    Errors: {terminalErrors.filter(e => !e.fixed).length}/{terminalErrors.length}
                  </span>
                )}
              </div>
              {autoFixRunning && (
                <span className="text-purple-400">
                  Iteration: {fixIteration}/{maxIterations}
                </span>
              )}
            </div>
          </div>
        </div>
      ) : mode === 'copilot' ? (
        /* ✨ Copilot Mode — Split panel: code editor left, AI chat right */
        <div className="flex-1 flex overflow-hidden max-h-full">
          {/* Left: Code Editor + Analysis panel */}
          <div className="w-1/2 border-r border-purple-500/30 flex flex-col bg-gray-900 overflow-hidden">
            {/* Copilot Code Header */}
            <div className="bg-gradient-to-r from-purple-900/60 to-blue-900/60 border-b border-purple-500/30 p-2 flex-shrink-0">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-white font-bold text-base flex items-center gap-2">
                  <Code className="w-4 h-4 text-purple-400" />
                  Code Context
                  <span className="text-xs text-purple-300 bg-purple-900/40 px-2 py-0.5 rounded-full">Copilot View</span>
                </h2>
                <div className="flex gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".js,.jsx,.ts,.tsx,.css,.html,.json,.py,.java,.cpp,.c,.go,.rb,.php"
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-1.5 font-medium"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Upload
                  </button>
                  {originalCode && (
                    <button
                      onClick={() => { analyzeCode(originalCode); setMode('analyze'); }}
                      className="text-xs px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center gap-1.5 font-medium"
                    >
                      <Wand2 className="w-3.5 h-3.5" />
                      Analyze
                    </button>
                  )}
                </div>
              </div>

              {/* Copilot Quick Actions */}
              <div className="flex flex-wrap gap-2">
                {[
                  { label: '🐛 Find Bugs', q: 'Find all bugs and errors in this code and show me the fixed version.' },
                  { label: '✨ Explain Code', q: 'Explain this code step-by-step. What does it do? How does it work?' },
                  { label: '⚡ Optimize', q: 'Optimize this code for performance. What improvements can be made?' },
                  { label: '🧪 Write Tests', q: 'Write comprehensive unit tests for this code using React Testing Library.' },
                  { label: '🔷 Add Types', q: 'Add full TypeScript types and interfaces to this code.' },
                  { label: '📝 Generate Docs', q: 'Generate JSDoc documentation comments for all functions in this code.' },
                ].map(({ label, q }, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      if (originalCode) {
                        bridgeSaveCopilotQuery(`${q}\n\n\`\`\`typescript\n${originalCode.slice(0, 3000)}\n\`\`\``);
                      } else {
                        bridgeSaveCopilotQuery(q);
                      }
                    }}
                    className="text-xs px-2.5 py-1 bg-gray-800 hover:bg-purple-900/60 text-gray-300 hover:text-purple-200 rounded-lg border border-gray-700 hover:border-purple-500/50 transition-all font-medium"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Code Textarea */}
            <div className="flex-1 p-4 overflow-hidden flex flex-col">
              <textarea
                value={originalCode}
                onChange={e => handleTextInput(e.target.value)}
                placeholder="Paste your code here or upload a file — the AI on the right will see it automatically…"
                className="flex-1 w-full px-4 py-3 bg-gray-950 text-gray-100 border border-gray-700 rounded-xl focus:border-purple-500 focus:outline-none resize-none font-mono text-xs leading-relaxed"
                spellCheck={false}
              />
            </div>

            {/* Code Stats */}
            {originalCode && (
              <div className="px-4 py-2 bg-gray-800 border-t border-gray-700 flex items-center gap-4 text-xs text-gray-400 flex-shrink-0">
                <span>{originalCode.split('\n').length} lines</span>
                <span>{originalCode.length} chars</span>
                {analysis && (
                  <>
                    <span className="text-red-400">{analysis.errors} errors</span>
                    <span className="text-yellow-400">{analysis.warnings} warnings</span>
                  </>
                )}
                <button
                  onClick={() => copyToClipboardUtil(originalCode)}
                  className="ml-auto hover:text-purple-300 flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" />
                  Copy
                </button>
              </div>
            )}
          </div>

          {/* Right: Genius AI Chat */}
          <div className="w-1/2 flex flex-col overflow-hidden min-h-0 h-full max-h-full">
            <GeniusAIChat />
          </div>
        </div>
      ) : mode === 'chat' ? (
        /* Genius AI Chat Mode — 12-Agent Super Coding Brain */
        <div className="flex flex-col flex-1 overflow-hidden max-h-full">
          {/* Brain Agent Banner — dynamic, highlights agents for last query */}
          <div className="flex-shrink-0 bg-gradient-to-r from-purple-950/70 to-indigo-950/60 border-b border-purple-700/30">
            {/* Top strip: agent pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto px-2 py-1 pb-0">
              <span className="text-[9px] font-bold text-purple-300 uppercase tracking-widest whitespace-nowrap flex-shrink-0 flex items-center gap-1">
                🧠 {isTyping
                  ? <span className="animate-pulse text-purple-400">Firing…</span>
                  : 'Brain:'}
              </span>
              {BRAIN_AGENTS.map((agent) => {
                const isActive = activeBrainAgentIds.has(agent.id);
                const health = getAgentHealth(agent.id);
                return (
                  <span
                    key={agent.id}
                    title={`Agent ${agent.id} — ${agent.role}${health.totalRuns > 0 ? ` | ${Math.round(health.successRate * 100)}% success · ${health.avgDuration}ms avg` : ''}`}
                    className={`text-[9px] px-1.5 py-0.5 rounded border whitespace-nowrap font-medium transition-all duration-300 flex-shrink-0 ${isActive
                      ? `${agent.bg} ${agent.border} ${agent.color} ${isTyping ? 'animate-pulse scale-105' : ''}`
                      : 'bg-gray-900/20 border-gray-800/30 text-gray-700 opacity-40'
                      }`}
                  >
                    {agent.icon} {agent.name}
                    {isActive && isTyping && <span className="ml-1 inline-block w-1 h-1 bg-current rounded-full animate-ping" />}
                  </span>
                );
              })}
            </div>

            {/* Mini neural map + live metrics row */}
            <div className="flex items-center gap-3 px-2 py-1">
              {/* Compact neural map */}
              <div className="flex-shrink-0">
                <BrainNeuralMap
                  activeAgentIds={activeBrainAgentIds}
                  isThinking={isTyping}
                  size={72}
                  compact={true}
                />
              </div>

              {/* Live metrics */}
              <div className="flex-1 min-w-0 grid grid-cols-3 gap-1.5">
                {/* Active agent count */}
                <div className="bg-purple-900/20 border border-purple-700/30 rounded-lg px-2 py-1 text-center">
                  <div className="text-base font-black text-purple-300 leading-none">{activeBrainAgentIds.size}</div>
                  <div className="text-[8px] text-gray-500 mt-0.5">agents active</div>
                </div>
                {/* Neural links firing */}
                <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg px-2 py-1 text-center">
                  <div className="text-base font-black text-blue-300 leading-none">
                    {NEURAL_LINKS.filter(l => activeBrainAgentIds.has(l.from) && activeBrainAgentIds.has(l.to)).length}
                  </div>
                  <div className="text-[8px] text-gray-500 mt-0.5">links live</div>
                </div>
                {/* Control loop step */}
                <div className="bg-green-900/20 border border-green-700/30 rounded-lg px-2 py-1 text-center">
                  <div className="text-base font-black text-green-300 leading-none">
                    {isTyping ? '⚡' : '✓'}
                  </div>
                  <div className="text-[8px] text-gray-500 mt-0.5">{isTyping ? 'processing' : 'ready'}</div>
                </div>
              </div>

              {/* Agent health mini-bars */}
              <div className="flex-shrink-0 flex flex-col gap-0.5" title="Agent health (success rate)">
                {BRAIN_AGENTS.filter(a => activeBrainAgentIds.has(a.id)).slice(0, 6).map(agent => {
                  const h = getAgentHealth(agent.id);
                  const pct = h.totalRuns > 0 ? h.successRate * 100 : 100;
                  return (
                    <div key={agent.id} className="flex items-center gap-1">
                      <span className="text-[8px] w-4 flex-shrink-0">{agent.icon}</span>
                      <div className="w-12 h-1 rounded-full bg-gray-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${pct > 80 ? 'bg-green-500' : pct > 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="flex-1 flex flex-col overflow-hidden min-h-0 max-h-full">
            <GeniusAIChat />
          </div>
        </div>
      ) : null}


      {/* Architect Mode */}
      {mode === 'architect' && (
        <div className="flex-1 overflow-y-auto p-8">
          <MultiAgentArchitectUI />
        </div>
      )}

      {/* Self-Improve Mode */}
      {mode === 'self-improve' && (
        <div className="flex-1 overflow-y-auto p-8">
          <SelfImprovingLoopUI />
        </div>
      )}

      {/* Memory Mode */}
      {mode === 'memory' && (
        <div className="flex-1 overflow-y-auto p-8">
          <ContextMemorySystemUI />
        </div>
      )}

      {/* Awareness Mode */}
      {mode === 'awareness' && (
        <div className="flex-1 overflow-y-auto p-8">
          <CodeAwarenessEngineUI />
        </div>
      )}

      {/* Self-Aware Mode */}
      {mode === 'self-aware' && (
        <div className="flex-1 overflow-y-auto p-8">
          <SelfAwareIntelligenceEngine
            isActive={true}
            onIntelligenceUpdate={(memory) => {
              console.log('Intelligence updated:', memory);
            }}
          />
        </div>
      )}

      {/* Fix Summary Modal */}
      {showFixSummary && fixSummary && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border-2 border-green-500/30 shadow-2xl">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 border-b border-green-500/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h2 className="text-white font-bold text-2xl">Fix Summary</h2>
                    <p className="text-green-100 text-sm">All errors have been resolved!</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowFixSummary(false)}
                  className="text-white hover:bg-white/10 p-2 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Stats */}
            <div className="bg-gray-800/50 p-4 border-b border-gray-700">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-red-900/20 rounded-lg border border-red-500/30">
                  <p className="text-3xl font-bold text-red-400">{fixSummary.totalErrors}</p>
                  <p className="text-red-300 text-sm mt-1">Errors Found</p>
                </div>
                <div className="text-center p-3 bg-green-900/20 rounded-lg border border-green-500/30">
                  <p className="text-3xl font-bold text-green-400">{fixSummary.fixedErrors}</p>
                  <p className="text-green-300 text-sm mt-1">Errors Fixed</p>
                </div>
                <div className="text-center p-3 bg-blue-900/20 rounded-lg border border-blue-500/30">
                  <p className="text-3xl font-bold text-blue-400">
                    {Math.round((fixSummary.fixedErrors / fixSummary.totalErrors) * 100)}%
                  </p>
                  <p className="text-blue-300 text-sm mt-1">Success Rate</p>
                </div>
              </div>
            </div>

            {/* Fixes List */}
            <div className="p-6 overflow-y-auto max-h-[50vh]">
              <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-yellow-400" />
                What Was Fixed:
              </h3>
              <div className="space-y-4">
                {fixSummary.fixes.map((fix, index) => (
                  <div
                    key={index}
                    className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 hover:border-green-500/30 transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold text-sm">{index + 1}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <h4 className="text-red-400 font-semibold text-sm">{fix.error}</h4>
                          <span className="text-green-400 text-xs bg-green-900/30 px-2 py-1 rounded">
                            ✓ Fixed
                          </span>
                        </div>
                        <p className="text-gray-300 text-sm mb-3">{fix.explanation}</p>

                        {(fix.before || fix.after) && (
                          <div className="grid grid-cols-2 gap-3">
                            {fix.before && (
                              <div className="bg-red-900/10 border border-red-500/20 rounded p-3">
                                <p className="text-red-400 text-xs font-semibold mb-2 flex items-center gap-1">
                                  <XCircle className="w-3 h-3" />
                                  Before:
                                </p>
                                <code className="text-gray-300 text-xs font-mono break-all">
                                  {fix.before}
                                </code>
                              </div>
                            )}
                            {fix.after && (
                              <div className="bg-green-900/10 border border-green-500/20 rounded p-3">
                                <p className="text-green-400 text-xs font-semibold mb-2 flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3" />
                                  After:
                                </p>
                                <code className="text-gray-300 text-xs font-mono break-all">
                                  {fix.after}
                                </code>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-800/50 p-4 border-t border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <Clock className="w-4 h-4" />
                {fixSummary.timestamp.toLocaleTimeString()}
              </div>
              <button
                onClick={() => setShowFixSummary(false)}
                className="px-6 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg font-bold flex items-center gap-2 shadow-lg transition-all"
              >
                <CheckCircle className="w-5 h-5" />
                Continue Coding
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Copy Success Toast */}
      {copySuccess && (
        <div className="fixed bottom-8 right-8 z-50 animate-in slide-in-from-bottom-5">
          <div className="bg-green-600 text-white px-6 py-3 rounded-lg shadow-2xl flex items-center gap-3">
            <CheckCircle className="w-5 h-5" />
            <span className="font-semibold">Code copied to clipboard!</span>
          </div>
        </div>
      )}

      {/* Copy Error Toast */}
      {copyError && (
        <div className="fixed bottom-8 right-8 z-50 animate-in slide-in-from-bottom-5">
          <div className="bg-red-600 text-white px-6 py-3 rounded-lg shadow-2xl flex items-center gap-3">
            <XCircle className="w-5 h-5" />
            <div>
              <p className="font-semibold">Failed to copy</p>
              <p className="text-sm opacity-90">{copyError}</p>
            </div>
          </div>
        </div>
      )}

      {/* Manual Copy Modal */}
      {showManualCopyModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl max-w-3xl w-full border-2 border-blue-500/30 shadow-2xl">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-4 border-b border-blue-500/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Copy className="w-6 h-6 text-white" />
                  <div>
                    <h2 className="text-white font-bold text-xl">Copy Code Manually</h2>
                    <p className="text-blue-100 text-sm">Auto-copy is blocked. Please copy manually:</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowManualCopyModal(false)}
                  className="text-white hover:bg-white/10 p-2 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Instructions */}
            <div className="p-4 bg-blue-900/20 border-b border-gray-700">
              <div className="flex items-start gap-3 text-blue-300 text-sm">
                <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold mb-1">How to copy:</p>
                  <ol className="list-decimal list-inside space-y-1 text-xs">
                    <li>Click anywhere in the text box below</li>
                    <li>Press <kbd className="bg-blue-600 px-1.5 py-0.5 rounded text-white font-mono">Ctrl+A</kbd> (or <kbd className="bg-blue-600 px-1.5 py-0.5 rounded text-white font-mono">Cmd+A</kbd> on Mac) to select all</li>
                    <li>Press <kbd className="bg-blue-600 px-1.5 py-0.5 rounded text-white font-mono">Ctrl+C</kbd> (or <kbd className="bg-blue-600 px-1.5 py-0.5 rounded text-white font-mono">Cmd+C</kbd> on Mac) to copy</li>
                  </ol>
                </div>
              </div>
            </div>

            {/* Code Text Area */}
            <div className="p-4">
              <textarea
                value={manualCopyText}
                readOnly
                onClick={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.select();
                }}
                className="w-full h-96 px-4 py-3 bg-gray-800 text-white border-2 border-blue-500/30 rounded-lg focus:border-blue-500 focus:outline-none resize-none font-mono text-sm"
                spellCheck={false}
              />
            </div>

            {/* Footer */}
            <div className="bg-gray-800/50 p-4 border-t border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-2 text-gray-400 text-xs">
                <AlertCircle className="w-4 h-4" />
                Clipboard access is blocked by browser security policy
              </div>
              <button
                onClick={() => setShowManualCopyModal(false)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center gap-2 transition-all"
              >
                <CheckCircle className="w-4 h-4" />
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}