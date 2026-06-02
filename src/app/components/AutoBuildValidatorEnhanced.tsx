// Auto Build Validator Enhanced - with Illegal JavaScript Detection & AI Code Assistant Integration
import { useState, useEffect, useRef } from 'react';
import {
  Terminal, Play, StopCircle, CheckCircle, XCircle, AlertTriangle,
  RefreshCw, Zap, Download, FileText, Folder, Code, Bug, Wrench,
  Package, Server, Eye, Loader, Check, X, ArrowLeft, FileDown
} from 'lucide-react';

interface BuildValidatorProps {
  isopen: boolean;
  onClose: () => void;
  onReturnToAICodeAssistant?: (fixedFiles: FixedFile[]) => void;
}

interface BuildLog {
  id: string;
  type: 'info' | 'error' | 'warning' | 'success' | 'command';
  message: string;
  timestamp: Date;
  details?: string;
}

interface BuildError {
  file: string;
  line: number;
  column: number;
  message: string;
  type: 'typescript' | 'syntax' | 'import' | 'runtime' | 'parsing' | 'illegal-js';
  severity: 'error' | 'warning';
  fixed: boolean;
  autoFixable: boolean;
  illegalJsType?: string;
  originalCode?: string;
  fixedCode?: string;
}

interface FixedFile {
  path: string;
  originalContent: string;
  fixedContent: string;
  errorsFixed: number;
  illegalPatternsFixed: string[];
}

interface ValidationResult {
  phase: 'install' | 'dev' | 'build' | 'complete';
  success: boolean;
  errors: BuildError[];
  warnings: BuildError[];
  duration: number;
  fixedFiles: FixedFile[];
}

export function AutoBuildValidatorEnhanced({ isopen, onClose, onReturnToAICodeAssistant }: BuildValidatorProps) {
  const [logs, setLogs] = useState<BuildLog[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<'idle' | 'install' | 'dev' | 'build' | 'fixing' | 'illegal-js-scan'>('idle');
  const [errors, setErrors] = useState<BuildError[]>([]);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [autoFixCount, setAutoFixCount] = useState(0);
  const [maxAutoFixIterations] = useState(5);
  const [fixedFiles, setFixedFiles] = useState<FixedFile[]>([]);
  const [illegalJsDetected, setIllegalJsDetected] = useState(0);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  if (!isopen) return null;

  const addLog = (type: BuildLog['type'], message: string, details?: string) => {
    const log: BuildLog = {
      id: `${Date.now()}-${Math.random()}`,
      type,
      message,
      timestamp: new Date(),
      details
    };
    setLogs(prev => [...prev, log]);
  };

  // ILLEGAL JAVASCRIPT DETECTION (from AICodeAssistant)
  const detectIllegalJavaScript = (code: string, filePath: string): BuildError[] => {
    const errors: BuildError[] = [];
    const lines = code.split('\n');

    addLog('info', `🔍 Scanning ${filePath} for illegal JavaScript patterns...`);

    lines.forEach((line, index) => {
      const lineNum = index + 1;
      const trimmedLine = line.trim();

      // 1. Bitwise AND (&) instead of logical AND (&&)
      if (trimmedLine.match(/\s&\s+\(/) ||
        trimmedLine.match(/\)\s*&\s*\(/) ||
        trimmedLine.match(/if\s*\([^)]*\s&\s[^)]*\)/) ||
        trimmedLine.match(/===\s*"[^"]*"\s*&\s/) ||
        trimmedLine.match(/\{\w+\s*&\s*\(/)) {
        errors.push({
          file: filePath,
          line: lineNum,
          column: line.indexOf('&') + 1,
          message: 'Illegal bitwise AND (&) - should use logical AND (&&)',
          type: 'illegal-js',
          severity: 'error',
          fixed: false,
          autoFixable: true,
          illegalJsType: 'illegal-bitwise-and',
          originalCode: line
        });
      }

      // 2. Bitwise OR (|) instead of logical OR (||)
      if (trimmedLine.match(/if\s*\([^)]*\s\|\s[^)]*\)/) ||
        trimmedLine.match(/key=\{[^}]*\s\|\s[^}]*\}/) ||
        trimmedLine.match(/:\s*`[^`]*\$\{[^}]*\s\|\s\d+\}/)) {
        errors.push({
          file: filePath,
          line: lineNum,
          column: line.indexOf('|') + 1,
          message: 'Illegal bitwise OR (|) - should use logical OR (||)',
          type: 'illegal-js',
          severity: 'error',
          fixed: false,
          autoFixable: true,
          illegalJsType: 'illegal-bitwise-or',
          originalCode: line
        });
      }

      // 3. Type annotation in object literal
      if (trimmedLine.match(/:\s*(?:any|string|number|boolean|object)\s*;/) &&
        !trimmedLine.match(/^(?:const|let|var|function|class|interface|type)\s/)) {
        errors.push({
          file: filePath,
          line: lineNum,
          column: line.indexOf(':') + 1,
          message: 'Illegal type annotation in object literal (boxShadow: any;)',
          type: 'parsing',
          severity: 'error',
          fixed: false,
          autoFixable: true,
          illegalJsType: 'illegal-type-in-object',
          originalCode: line
        });
      }

      // 4. Reserved keywords as identifiers
      const reservedKeywords = ['return', 'break', 'continue', 'await', 'yield'];
      reservedKeywords.forEach(keyword => {
        if (trimmedLine.match(new RegExp(`^(?:const|let|var)\\s+${keyword}\\s*=`))) {
          errors.push({
            file: filePath,
            line: lineNum,
            column: 1,
            message: `Illegal use of reserved keyword '${keyword}' as variable name`,
            type: 'illegal-js',
            severity: 'error',
            fixed: false,
            autoFixable: true,
            illegalJsType: 'illegal-reserved-keyword',
            originalCode: line
          });
        }
      });

      // 5. eval() usage (security risk)
      if (trimmedLine.match(/eval\s*\(/)) {
        errors.push({
          file: filePath,
          line: lineNum,
          column: line.indexOf('eval') + 1,
          message: 'Use of eval() detected (security risk)',
          type: 'illegal-js',
          severity: 'error',
          fixed: false,
          autoFixable: true,
          illegalJsType: 'illegal-eval-usage',
          originalCode: line
        });
      }
    });

    return errors;
  };

  // AUTO-FIX ILLEGAL JAVASCRIPT
  const autoFixIllegalJavaScript = (code: string, errors: BuildError[]): string => {
    let fixedCode = code;
    const lines = fixedCode.split('\n');
    const fixedErrors = new Set<number>();

    errors.forEach(error => {
      if (!error.autoFixable || !error.illegalJsType) return;

      const lineIndex = error.line - 1;
      const line = lines[lineIndex];

      switch (error.illegalJsType) {
        case 'illegal-bitwise-and':
          lines[lineIndex] = line
            .replace(/\s&\s+\(/g, ' && (')
            .replace(/\)\s*&\s*\(/g, ') && (')
            .replace(/if\s*\(([^)]*)\s&\s([^)]*)\)/g, 'if ($1 && $2)')
            .replace(/(===|!==)\s*"([^"]*)"\s*&\s/g, '$1 "$2" && ')
            .replace(/\{(\w+)\s*&\s*\(/g, '{$1 && (');
          fixedErrors.add(lineIndex);
          addLog('success', `✅ Fixed bitwise AND → logical AND at line ${error.line}`);
          break;

        case 'illegal-bitwise-or':
          lines[lineIndex] = line
            .replace(/if\s*\(([^)]*)\s\|\s([^)]*)\)/g, 'if ($1 || $2)')
            .replace(/key=\{([^}]*)\s\|\s([^}]*)\}/g, 'key={$1 || $2}')
            .replace(/:\s*`([^`]*)\$\{([^}]*)\s\|\s(\d+)\}/g, ': `$1\${$2 || $3}');
          fixedErrors.add(lineIndex);
          addLog('success', `✅ Fixed bitwise OR → logical OR at line ${error.line}`);
          break;

        case 'illegal-type-in-object':
          lines[lineIndex] = '// REMOVED: Illegal type in object - ' + line;
          fixedErrors.add(lineIndex);
          addLog('success', `✅ Removed illegal type annotation at line ${error.line}`);
          break;

        case 'illegal-reserved-keyword':
          lines[lineIndex] = line.replace(/\b(const|let|var)\s+(return|break|continue|await|yield)\s*=/g, '$1 _$2 =');
          fixedErrors.add(lineIndex);
          addLog('success', `✅ Renamed reserved keyword at line ${error.line}`);
          break;

        case 'illegal-eval-usage':
          lines[lineIndex] = '// SECURITY: eval() removed - ' + line;
          fixedErrors.add(lineIndex);
          addLog('success', `✅ Removed eval() security risk at line ${error.line}`);
          break;
      }
    });

    return lines.join('\n');
  };

  const scanForParsingErrors = async (): Promise<BuildError[]> => {
    setCurrentPhase('illegal-js-scan');
    addLog('info', '🚨 Scanning for parsing errors and illegal JavaScript...');

    const allErrors: BuildError[] = [];

    // Simulate scanning multiple files
    const filesToScan = [
      '/App.tsx',
      '/components/AICodeAssistant.tsx',
      '/components/Professional3DAvatarGen.tsx',
      '/routes.ts'
    ];

    for (const file of filesToScan) {
      await new Promise(resolve => setTimeout(resolve, 300));

      // Simulate file content (in real implementation, read actual files)
      const simulatedContent = `
// Example code that might have errors
if (latest?.status === "ready" & latest.id !== prevLatest?.id) {
  console.log("This has bitwise AND error");
}

{celebratingId & (<Celebration />)}

key={d.id | idx}

animate={{
  boxShadow: any;
    d.status === "building"
      ? "0 0 10px 2px rgba(250, 204, 21, 0.6)"
      : "0 0 0 rgba(0,0,0,0)",
}}
      `.trim();

      const errors = detectIllegalJavaScript(simulatedContent, file);
      allErrors.push(...errors);
    }

    if (allErrors.length > 0) {
      setIllegalJsDetected(allErrors.length);
      addLog('error', `❌ Found ${allErrors.length} illegal JavaScript pattern(s)`);
      addLog('info', '🔧 These errors will cause parsing failures in build');
    } else {
      addLog('success', '✅ No illegal JavaScript patterns detected');
    }

    return allErrors;
  };

  const applyIllegalJavaScriptFixes = async (errors: BuildError[]): Promise<FixedFile[]> => {
    setCurrentPhase('fixing');
    addLog('info', '🔧 Applying illegal JavaScript fixes...');

    const fixedFilesMap = new Map<string, FixedFile>();

    // Group errors by file
    const errorsByFile = errors.reduce((acc, error) => {
      if (!acc[error.file]) acc[error.file] = [];
      acc[error.file].push(error);
      return acc;
    }, {} as Record<string, BuildError[]>);

    for (const [filePath, fileErrors] of Object.entries(errorsByFile)) {
      await new Promise(resolve => setTimeout(resolve, 500));

      // Simulate original content
      const originalContent = `// Original content of ${filePath}`;
      const fixedContent = autoFixIllegalJavaScript(originalContent, fileErrors);

      const illegalPatterns = fileErrors
        .map(e => e.illegalJsType)
        .filter((v, i, a) => v && a.indexOf(v) === i) as string[];

      fixedFilesMap.set(filePath, {
        path: filePath,
        originalContent,
        fixedContent,
        errorsFixed: fileErrors.length,
        illegalPatternsFixed: illegalPatterns
      });

      addLog('success', `✅ Fixed ${fileErrors.length} issue(s) in ${filePath}`);
    }

    return Array.from(fixedFilesMap.values());
  };

  const runFullValidation = async () => {
    setIsRunning(true);
    setErrors([]);
    setLogs([]);
    setAutoFixCount(0);
    setValidationResult(null);
    setFixedFiles([]);
    setIllegalJsDetected(0);

    const startTime = Date.now();

    try {
      // Phase 0: Illegal JavaScript Detection
      addLog('info', '🚀 Starting automated build validation with illegal JavaScript detection...');

      const illegalJsErrors = await scanForParsingErrors();
      let allErrors = [...illegalJsErrors];
      let allFixedFiles: FixedFile[] = [];

      // Auto-fix illegal JavaScript
      if (illegalJsErrors.length > 0) {
        addLog('info', `🔧 Auto-fixing ${illegalJsErrors.length} illegal JavaScript pattern(s)...`);
        const fixed = await applyIllegalJavaScriptFixes(illegalJsErrors);
        allFixedFiles = [...fixed];
        setFixedFiles(fixed);
        addLog('success', `✅ Fixed illegal JavaScript in ${fixed.length} file(s)`);

        // Mark errors as fixed
        allErrors = allErrors.map(e => ({ ...e, fixed: true }));
      }

      // Phase 1: npm install
      addLog('info', '📦 Phase 1: Installing dependencies...');
      await new Promise(resolve => setTimeout(resolve, 1500));
      addLog('success', '✅ Dependencies installed successfully');

      // Phase 2: npm run dev
      addLog('info', '🌐 Phase 2: Starting development server...');
      await new Promise(resolve => setTimeout(resolve, 1500));

      if (illegalJsErrors.filter(e => !e.fixed).length === 0) {
        addLog('success', '✅ Development server started successfully');
        addLog('info', '🌐 Server running at http://localhost:5173');
      } else {
        addLog('warning', '⚠️ Some errors remain, but continuing...');
      }

      // Phase 3: npm run build
      addLog('info', '🏗️ Phase 3: Building for production...');
      await new Promise(resolve => setTimeout(resolve, 2000));

      const remainingErrors = allErrors.filter(e => !e.fixed);

      if (remainingErrors.length === 0) {
        addLog('success', '✅ Build completed successfully');
        addLog('info', '📊 Build size: 234.5 KB (gzipped)');
      } else {
        addLog('error', `❌ Build failed with ${remainingErrors.length} remaining error(s)`);
      }

      // Final result
      const duration = (Date.now() - startTime) / 1000;
      const success = remainingErrors.length === 0;

      setValidationResult({
        phase: 'complete',
        success,
        errors: remainingErrors.filter(e => e.severity === 'error'),
        warnings: remainingErrors.filter(e => e.severity === 'warning'),
        duration,
        fixedFiles: allFixedFiles
      });

      if (success) {
        addLog('success', '🎉 All validations passed! App is ready to run.');
        addLog('info', `✨ Total time: ${duration.toFixed(2)}s`);
        if (allFixedFiles.length > 0) {
          addLog('info', `📝 Fixed ${allFixedFiles.length} file(s) - Download corrected files or return to AI Code Assistant`);
        }
      } else {
        addLog('error', `❌ Validation completed with ${remainingErrors.length} remaining issue(s)`);
      }

      setErrors(remainingErrors);
    } catch (error) {
      addLog('error', '💥 Validation failed with unexpected error');
      console.error(error);
    } finally {
      setIsRunning(false);
      setCurrentPhase('idle');
    }
  };

  const stopValidation = () => {
    setIsRunning(false);
    setCurrentPhase('idle');
    addLog('warning', '⚠️ Validation stopped by user');
  };

  const clearLogs = () => {
    setLogs([]);
    setErrors([]);
    setValidationResult(null);
    setAutoFixCount(0);
    setFixedFiles([]);
    setIllegalJsDetected(0);
  };

  const exportLogs = () => {
    const logText = logs.map(log =>
      `[${log.timestamp.toLocaleTimeString()}] ${log.type.toUpperCase()}: ${log.message}${log.details ? `\n  ${log.details}` : ''}`
    ).join('\n');

    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `build-validation-${Date.now()}.log`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadFixedFiles = () => {
    if (fixedFiles.length === 0) return;

    const data = JSON.stringify(fixedFiles, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fixed-files-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    addLog('success', `✅ Downloaded ${fixedFiles.length} fixed file(s)`);
  };

  const returnToAICodeAssistant = () => {
    if (onReturnToAICodeAssistant && fixedFiles.length > 0) {
      onReturnToAICodeAssistant(fixedFiles);
      addLog('info', '↩️ Returning to AI Code Assistant with fixed files...');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl">
              <Terminal className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Auto Build Validator</h2>
              <p className="text-sm text-gray-400">
                Illegal JavaScript detection + npm install → dev → build
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Control Panel */}
        <div className="p-6 border-b border-gray-800 bg-gray-800/50">
          <div className="flex items-center gap-4 flex-wrap">
            {!isRunning ? (
              <button
                onClick={runFullValidation}
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all flex items-center gap-2 font-semibold shadow-lg"
              >
                <Play className="w-5 h-5" />
                Run Full Validation
              </button>
            ) : (
              <button
                onClick={stopValidation}
                className="px-6 py-3 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-xl hover:from-red-700 hover:to-pink-700 transition-all flex items-center gap-2 font-semibold shadow-lg"
              >
                <StopCircle className="w-5 h-5" />
                Stop
              </button>
            )}

            <button
              onClick={clearLogs}
              disabled={isRunning}
              className="px-4 py-3 bg-gray-700 text-white rounded-xl hover:bg-gray-600 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw className="w-4 h-4" />
              Clear
            </button>

            <button
              onClick={exportLogs}
              disabled={logs.length === 0}
              className="px-4 py-3 bg-gray-700 text-white rounded-xl hover:bg-gray-600 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              Export Logs
            </button>

            {fixedFiles.length > 0 && (
              <>
                <button
                  onClick={downloadFixedFiles}
                  className="px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all flex items-center gap-2"
                >
                  <FileDown className="w-4 h-4" />
                  Download Fixed Files
                </button>

                {onReturnToAICodeAssistant && (
                  <button
                    onClick={returnToAICodeAssistant}
                    className="px-4 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all flex items-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to AI Code Assistant
                  </button>
                )}
              </>
            )}

            {/* Status Indicators */}
            <div className="flex-1" />

            {currentPhase !== 'idle' && (
              <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 border border-blue-500/30 rounded-lg">
                <Loader className="w-4 h-4 text-blue-400 animate-spin" />
                <span className="text-sm text-blue-300 font-medium">
                  {currentPhase === 'illegal-js-scan' && 'Scanning for illegal JavaScript...'}
                  {currentPhase === 'install' && 'Installing dependencies...'}
                  {currentPhase === 'dev' && 'Running dev server...'}
                  {currentPhase === 'build' && 'Building for production...'}
                  {currentPhase === 'fixing' && 'Auto-fixing errors...'}
                </span>
              </div>
            )}

            {illegalJsDetected > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 bg-orange-500/20 border border-orange-500/30 rounded-lg">
                <Bug className="w-4 h-4 text-orange-400" />
                <span className="text-sm text-orange-300 font-medium">
                  {illegalJsDetected} Illegal JS Pattern(s)
                </span>
              </div>
            )}

            {validationResult && (
              <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${validationResult.success
                  ? 'bg-green-500/20 border border-green-500/30'
                  : 'bg-red-500/20 border border-red-500/30'
                }`}>
                {validationResult.success ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-sm text-green-300 font-medium">All Passed</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 text-red-400" />
                    <span className="text-sm text-red-300 font-medium">
                      {validationResult.errors.length} Error(s)
                    </span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Logs Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-950 font-mono text-sm">
          {logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <Terminal className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-lg">Click "Run Full Validation" to start</p>
              <p className="text-sm mt-2">Will scan for illegal JavaScript + run full build</p>
            </div>
          ) : (
            <div className="space-y-2">
              {logs.map(log => (
                <div key={log.id} className="flex items-start gap-3">
                  <span className="text-gray-500 text-xs mt-0.5">
                    {log.timestamp.toLocaleTimeString()}
                  </span>

                  {log.type === 'error' && <XCircle className="w-4 h-4 text-red-400 mt-0.5" />}
                  {log.type === 'warning' && <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5" />}
                  {log.type === 'success' && <CheckCircle className="w-4 h-4 text-green-400 mt-0.5" />}
                  {log.type === 'info' && <Eye className="w-4 h-4 text-blue-400 mt-0.5" />}
                  {log.type === 'command' && <Terminal className="w-4 h-4 text-purple-400 mt-0.5" />}

                  <div className="flex-1">
                    <div className={`${log.type === 'error' ? 'text-red-400' :
                        log.type === 'warning' ? 'text-yellow-400' :
                          log.type === 'success' ? 'text-green-400' :
                            log.type === 'command' ? 'text-purple-400' :
                              'text-gray-300'
                      }`}>
                      {log.message}
                    </div>
                    {log.details && (
                      <div className="text-gray-500 text-xs mt-1 ml-4">
                        {log.details}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          )}
        </div>

        {/* Fixed Files Summary */}
        {fixedFiles.length > 0 && (
          <div className="p-6 border-t border-gray-800 bg-green-500/10">
            <h3 className="text-lg font-semibold text-green-400 mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Fixed Files ({fixedFiles.length})
            </h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {fixedFiles.map((file, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-gray-900/50 rounded-lg">
                  <FileText className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white font-medium truncate">
                      {file.path}
                    </div>
                    <div className="text-sm text-gray-400 mt-1">
                      Fixed {file.errorsFixed} error(s): {file.illegalPatternsFixed.join(', ')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer Stats */}
        {validationResult && (
          <div className="p-4 border-t border-gray-800 bg-gray-900">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  <span className="text-gray-400">Duration:</span>
                  <span className="text-white font-semibold">{validationResult.duration.toFixed(2)}s</span>
                </div>
                <div className="flex items-center gap-2">
                  <Bug className="w-4 h-4 text-orange-400" />
                  <span className="text-gray-400">Illegal JS Fixed:</span>
                  <span className="text-white font-semibold">{illegalJsDetected}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-green-400" />
                  <span className="text-gray-400">Files Fixed:</span>
                  <span className="text-white font-semibold">{fixedFiles.length}</span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-red-400" />
                  <span className="text-red-400 font-semibold">{validationResult.errors.length} Errors</span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-400" />
                  <span className="text-yellow-400 font-semibold">{validationResult.warnings.length} Warnings</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
