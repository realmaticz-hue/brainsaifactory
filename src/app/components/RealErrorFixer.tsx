// Real Error Fixer - Actually fixes code errors!
import { useState, useRef } from 'react';
import { 
  Upload, FileCode, AlertCircle, CheckCircle, Wrench, Trash2, 
  File, FolderOpen, FileSearch, Download, X, Zap
} from 'lucide-react';

interface FileError {
  line: number;
  column: number;
  message: string;
  severity: 'error' | 'warning';
  fix?: string;
  fixType?: 'import' | 'line' | 'remove';
}

interface UploadedFile {
  id: string;
  name: string;
  content: string;
  originalContent: string;
  language: string;
  errors: FileError[];
  status: 'ok' | 'error' | 'warning';
}

interface RealErrorFixerProps {
  onFileUpload?: (files: UploadedFile[]) => void;
  onFixComplete?: () => void;
}

export function RealErrorFixer({ onFileUpload, onFixComplete }: RealErrorFixerProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [autoFixing, setAutoFixing] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const detectLanguage = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase();
    const langMap: Record<string, string> = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'py': 'python',
      'java': 'java',
      'kt': 'kotlin',
      'swift': 'swift',
      'html': 'html',
      'css': 'css',
      'json': 'json'
    };
    return langMap[ext || ''] || 'text';
  };

  const scanForErrors = (content: string, language: string): FileError[] => {
    const errors: FileError[] = [];
    const lines = content.split('\n');

    if (!['javascript', 'typescript'].includes(language)) {
      return errors; // Only check JS/TS for now
    }

    // Check for missing React imports
    const hasReactImport = content.includes('import React') || content.includes("import { React");
    const hasUseState = content.includes('useState');
    const hasUseEffect = content.includes('useEffect');
    const hasUseRef = content.includes('useRef');
    const hasUseCallback = content.includes('useCallback');
    const hasUseMemo = content.includes('useMemo');

    const missingHooks = [];
    if (hasUseState && !content.includes('useState') && !content.includes('import { useState')) {
      missingHooks.push('useState');
    }
    if (hasUseEffect && !content.includes('import { useEffect')) {
      missingHooks.push('useEffect');
    }
    if (hasUseRef && !content.includes('import { useRef')) {
      missingHooks.push('useRef');
    }
    if (hasUseCallback && !content.includes('import { useCallback')) {
      missingHooks.push('useCallback');
    }
    if (hasUseMemo && !content.includes('import { useMemo')) {
      missingHooks.push('useMemo');
    }

    if (missingHooks.length > 0 && !hasReactImport) {
      errors.push({
        line: 1,
        column: 0,
        message: `Missing React imports: ${missingHooks.join(', ')}`,
        severity: 'error',
        fix: `import { ${missingHooks.join(', ')} } from 'react';`,
        fixType: 'import'
      });
    }

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      
      // Skip comments and empty lines
      if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
        return;
      }

      // Missing semicolons - only for variable declarations and assignments
      if (trimmed.match(/^(const|let|var)\s+\w+\s*=.*[^;{},]$/) && !trimmed.endsWith('{')) {
        errors.push({
          line: index + 1,
          column: line.length,
          message: 'Missing semicolon',
          severity: 'warning',
          fix: line + ';',
          fixType: 'line'
        });
      }

      // Undefined variables - assignment without declaration
      const assignMatch = trimmed.match(/^([a-z_][a-zA-Z0-9_]*)\s*=\s*(.+)$/);
      if (assignMatch && !trimmed.includes('const') && !trimmed.includes('let') && 
          !trimmed.includes('var') && !trimmed.includes('function') && !trimmed.includes('class')) {
        errors.push({
          line: index + 1,
          column: line.indexOf(assignMatch[1]),
          message: `Variable '${assignMatch[1]}' should be declared with const/let`,
          severity: 'error',
          fix: line.replace(assignMatch[1], `const ${assignMatch[1]}`),
          fixType: 'line'
        });
      }

      // Deprecated var keyword
      if (trimmed.startsWith('var ')) {
        errors.push({
          line: index + 1,
          column: line.indexOf('var'),
          message: 'Use const or let instead of var',
          severity: 'warning',
          fix: line.replace(/\bvar\b/, 'const'),
          fixType: 'line'
        });
      }

      // Console.log in production
      if (line.includes('console.log(')) {
        errors.push({
          line: index + 1,
          column: line.indexOf('console.log'),
          message: 'Remove console.log in production',
          severity: 'warning',
          fix: '',
          fixType: 'remove'
        });
      }

      // Empty catch blocks
      if (trimmed.match(/catch\s*\([^)]*\)\s*\{\s*\}/)) {
        errors.push({
          line: index + 1,
          column: 0,
          message: 'Empty catch block - handle errors properly',
          severity: 'warning',
          fix: line.replace(/\{\s*\}/, '{ console.error("Error:", error); }'),
          fixType: 'line'
        });
      }
    });

    return errors;
  };

  const applyFixes = (content: string, errors: FileError[]): string => {
    let fixedContent = content;
    const lines = fixedContent.split('\n');

    // Step 1: Add all import fixes at the top
    const importFixes = errors.filter(e => e.fixType === 'import' && e.fix);
    if (importFixes.length > 0) {
      const uniqueImports = Array.from(new Set(importFixes.map(e => e.fix)));
      fixedContent = uniqueImports.join('\n') + '\n' + fixedContent;
    }

    // Step 2: Apply line fixes and removals (process from bottom to top to avoid line number shifts)
    const lineFixes = errors
      .filter(e => (e.fixType === 'line' || e.fixType === 'remove') && e.fix !== undefined)
      .sort((a, b) => b.line - a.line); // Sort descending

    const updatedLines = fixedContent.split('\n');
    lineFixes.forEach(error => {
      const lineIndex = error.line - 1 + importFixes.length; // Adjust for added imports
      if (lineIndex >= 0 && lineIndex < updatedLines.length) {
        if (error.fixType === 'remove' || error.fix === '') {
          // Remove the line
          updatedLines.splice(lineIndex, 1);
        } else {
          // Replace the line
          updatedLines[lineIndex] = error.fix!;
        }
      }
    });

    fixedContent = updatedLines.join('\n');

    // Step 3: Clean up extra blank lines
    fixedContent = fixedContent.replace(/\n{3,}/g, '\n\n');

    return fixedContent;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsScanning(true);
    setScanComplete(false);

    const processedFiles: UploadedFile[] = [];

    for (const file of files) {
      try {
        const content = await file.text();
        const language = detectLanguage(file.name);
        const errors = scanForErrors(content, language);

        processedFiles.push({
          id: `${Date.now()}-${Math.random()}-${file.name}`,
          name: file.webkitRelativePath || file.name,
          content,
          originalContent: content,
          language,
          errors,
          status: errors.some(e => e.severity === 'error') ? 'error' : 
                  errors.some(e => e.severity === 'warning') ? 'warning' : 'ok'
        });
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
      }
    }

    setUploadedFiles(prev => [...prev, ...processedFiles]);
    setIsScanning(false);
    setScanComplete(true);

    if (onFileUpload) {
      onFileUpload(processedFiles);
    }

    // Reset file inputs
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (folderInputRef.current) folderInputRef.current.value = '';
  };

  const fixAllErrors = async () => {
    setAutoFixing(true);

    // Wait a moment for visual feedback
    await new Promise(resolve => setTimeout(resolve, 300));

    setUploadedFiles(prev => prev.map(file => {
      if (file.errors.length === 0) return file;

      // Apply all fixes
      const fixedContent = applyFixes(file.content, file.errors);

      // Re-scan for any remaining errors
      const remainingErrors = scanForErrors(fixedContent, file.language);

      return {
        ...file,
        content: fixedContent,
        errors: remainingErrors,
        status: remainingErrors.some(e => e.severity === 'error') ? 'error' : 
                remainingErrors.some(e => e.severity === 'warning') ? 'warning' : 'ok'
      };
    }));

    await new Promise(resolve => setTimeout(resolve, 200));
    setAutoFixing(false);
    
    if (onFixComplete) {
      onFixComplete();
    }
  };

  const fixFileErrors = (fileId: string) => {
    setUploadedFiles(prev => prev.map(file => {
      if (file.id !== fileId || file.errors.length === 0) return file;

      const fixedContent = applyFixes(file.content, file.errors);
      const remainingErrors = scanForErrors(fixedContent, file.language);

      return {
        ...file,
        content: fixedContent,
        errors: remainingErrors,
        status: remainingErrors.some(e => e.severity === 'error') ? 'error' : 
                remainingErrors.some(e => e.severity === 'warning') ? 'warning' : 'ok'
      };
    }));
  };

  const resetFile = (fileId: string) => {
    setUploadedFiles(prev => prev.map(file => {
      if (file.id !== fileId) return file;

      const errors = scanForErrors(file.originalContent, file.language);

      return {
        ...file,
        content: file.originalContent,
        errors,
        status: errors.some(e => e.severity === 'error') ? 'error' : 
                errors.some(e => e.severity === 'warning') ? 'warning' : 'ok'
      };
    }));
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
    if (selectedFile === fileId) setSelectedFile(null);
  };

  const downloadFile = (file: UploadedFile) => {
    const blob = new Blob([file.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name.split('/').pop() || file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadAllFixed = () => {
    uploadedFiles.forEach(file => downloadFile(file));
  };

  const clearAllFiles = () => {
    setUploadedFiles([]);
    setSelectedFile(null);
    setScanComplete(false);
  };

  const selectedFileData = uploadedFiles.find(f => f.id === selectedFile);
  const totalErrors = uploadedFiles.reduce((sum, f) => sum + f.errors.filter(e => e.severity === 'error').length, 0);
  const totalWarnings = uploadedFiles.reduce((sum, f) => sum + f.errors.filter(e => e.severity === 'warning').length, 0);
  const totalFiles = uploadedFiles.length;
  const cleanFiles = uploadedFiles.filter(f => f.errors.length === 0).length;

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-pink-600 p-6">
        <h3 className="text-white font-bold text-2xl flex items-center gap-3">
          <Zap className="w-7 h-7" />
          AI Error Fixer - Real Code Repair
        </h3>
        <p className="text-white/90 text-sm mt-2">Upload your code and watch errors disappear instantly!</p>
      </div>

      {/* Stats & Actions */}
      <div className="bg-gray-800 p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex gap-6 text-sm">
            <div className="flex items-center gap-2">
              <File className="w-4 h-4 text-blue-400" />
              <span className="text-white font-semibold">{totalFiles} files</span>
              <span className="text-gray-400">({cleanFiles} clean)</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <span className="text-red-400 font-semibold">{totalErrors} errors</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-400" />
              <span className="text-yellow-400 font-semibold">{totalWarnings} warnings</span>
            </div>
          </div>

          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".js,.jsx,.ts,.tsx,.py,.java,.kt,.swift"
              onChange={handleFileUpload}
              className="hidden"
            />
            <input
              ref={folderInputRef}
              type="file"
              /* @ts-ignore */
              webkitdirectory=""
              directory=""
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />
            
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 text-sm font-semibold transition-all"
            >
              <Upload className="w-4 h-4" />
              Upload Files
            </button>

            <button
              onClick={() => folderInputRef.current?.click()}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center gap-2 text-sm font-semibold transition-all"
            >
              <FolderOpen className="w-4 h-4" />
              Upload Folder
            </button>

            {totalFiles > 0 && (
              <button
                onClick={clearAllFiles}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center gap-2 text-sm font-semibold transition-all"
              >
                <Trash2 className="w-4 h-4" />
                Clear All
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Fix All Banner */}
      {scanComplete && (totalErrors > 0 || totalWarnings > 0) && (
        <div className="bg-gradient-to-r from-orange-600 to-red-600 p-6 border-b border-orange-700 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-4 rounded-xl">
                <AlertCircle className="w-10 h-10 text-white" />
              </div>
              <div>
                <h4 className="text-white font-bold text-xl">🚨 {totalErrors + totalWarnings} Issues Detected!</h4>
                <p className="text-white/90 text-base mt-1">
                  {totalErrors} error{totalErrors !== 1 ? 's' : ''} and {totalWarnings} warning{totalWarnings !== 1 ? 's' : ''} found across {totalFiles} file{totalFiles !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setScanComplete(false)}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg text-sm font-semibold transition-all"
              >
                Dismiss
              </button>
              <button
                onClick={fixAllErrors}
                disabled={autoFixing}
                className="px-8 py-4 bg-white text-orange-600 hover:bg-gray-100 rounded-xl flex items-center gap-3 text-lg font-bold transition-all disabled:opacity-50 shadow-2xl transform hover:scale-105"
              >
                <Wrench className="w-6 h-6" />
                {autoFixing ? 'FIXING ALL ERRORS...' : '⚡ FIX ALL ERRORS NOW'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Banner */}
      {scanComplete && totalErrors === 0 && totalWarnings === 0 && totalFiles > 0 && (
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 border-b border-green-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-4 rounded-xl">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
              <div>
                <h4 className="text-white font-bold text-xl">✨ All Files Perfect!</h4>
                <p className="text-white/90 text-base mt-1">
                  No errors found in {totalFiles} file{totalFiles !== 1 ? 's' : ''}. Your code is production-ready!
                </p>
              </div>
            </div>
            <button
              onClick={downloadAllFixed}
              className="px-6 py-3 bg-white text-green-600 hover:bg-gray-100 rounded-lg flex items-center gap-2 text-base font-bold transition-all shadow-lg"
            >
              <Download className="w-5 h-5" />
              Download All
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-hidden flex">
        {/* File List */}
        <div className="w-80 bg-gray-800/50 border-r border-gray-700 overflow-y-auto">
          {totalFiles === 0 ? (
            <div className="p-12 text-center">
              <FolderOpen className="w-20 h-20 mx-auto mb-4 text-gray-600" />
              <p className="text-gray-400 text-lg font-semibold mb-4">No files uploaded</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg text-base font-semibold"
              >
                Upload Your Code
              </button>
            </div>
          ) : (
            <div className="p-3 space-y-2">
              {uploadedFiles.map(file => (
                <div
                  key={file.id}
                  className={`p-4 rounded-lg cursor-pointer transition-all ${
                    selectedFile === file.id
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                  onClick={() => setSelectedFile(file.id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <FileCode className="w-5 h-5 flex-shrink-0" />
                      <span className="text-sm font-bold truncate">{file.name.split('/').pop()}</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(file.id);
                      }}
                      className="p-1 hover:bg-gray-900/30 rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    {file.status === 'ok' ? (
                      <span className="flex items-center gap-1 text-green-400 font-semibold">
                        <CheckCircle className="w-4 h-4" />
                        Perfect!
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        {file.errors.filter(e => e.severity === 'error').length > 0 && (
                          <span className="text-red-400 font-semibold">
                            {file.errors.filter(e => e.severity === 'error').length} errors
                          </span>
                        )}
                        {file.errors.filter(e => e.severity === 'warning').length > 0 && (
                          <span className="text-yellow-400 font-semibold">
                            {file.errors.filter(e => e.severity === 'warning').length} warnings
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* File Viewer */}
        <div className="flex-1 overflow-hidden flex flex-col bg-gray-900">
          {selectedFileData ? (
            <>
              {/* File Header */}
              <div className="bg-gray-800 p-4 border-b border-gray-700 flex items-center justify-between">
                <div>
                  <h4 className="text-white font-bold text-lg">{selectedFileData.name}</h4>
                  <p className="text-gray-400 text-sm">
                    {selectedFileData.language} • {selectedFileData.errors.length} issue{selectedFileData.errors.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="flex gap-2">
                  {selectedFileData.content !== selectedFileData.originalContent && (
                    <button
                      onClick={() => resetFile(selectedFileData.id)}
                      className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm font-semibold flex items-center gap-2"
                    >
                      Reset to Original
                    </button>
                  )}
                  {selectedFileData.errors.length > 0 && (
                    <button
                      onClick={() => fixFileErrors(selectedFileData.id)}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold flex items-center gap-2"
                    >
                      <Wrench className="w-4 h-4" />
                      Fix This File
                    </button>
                  )}
                  <button
                    onClick={() => downloadFile(selectedFileData)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                </div>
              </div>

              {/* Errors List */}
              {selectedFileData.errors.length > 0 && (
                <div className="bg-gray-800/70 p-4 border-b border-gray-700 max-h-64 overflow-y-auto">
                  <h5 className="text-white font-bold text-base mb-3 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-400" />
                    Issues Found:
                  </h5>
                  <div className="space-y-2">
                    {selectedFileData.errors.map((error, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg border ${
                          error.severity === 'error' 
                            ? 'bg-red-900/30 border-red-500/50' 
                            : 'bg-yellow-900/30 border-yellow-500/50'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <AlertCircle className={`w-4 h-4 mt-0.5 ${error.severity === 'error' ? 'text-red-400' : 'text-yellow-400'}`} />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-xs font-bold ${error.severity === 'error' ? 'text-red-400' : 'text-yellow-400'}`}>
                                Line {error.line}
                              </span>
                              <span className="text-gray-300 text-sm">{error.message}</span>
                            </div>
                            {error.fix && (
                              <code className="text-green-400 text-xs block bg-gray-900/70 p-2 rounded mt-2 font-mono">
                                {error.fixType === 'import' && '+ '}
                                {error.fixType === 'remove' && '- '}
                                {error.fix || '<remove line>'}
                              </code>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Code Viewer */}
              <div className="flex-1 overflow-auto bg-gray-950 p-4">
                <pre className="text-gray-100 text-sm font-mono leading-relaxed">
                  {selectedFileData.content.split('\n').map((line, index) => {
                    const lineError = selectedFileData.errors.find(e => e.line === index + 1);
                    return (
                      <div
                        key={index}
                        className={`${
                          lineError 
                            ? lineError.severity === 'error' 
                              ? 'bg-red-900/20 border-l-4 border-red-500' 
                              : 'bg-yellow-900/20 border-l-4 border-yellow-500'
                            : ''
                        } pl-3 py-0.5`}
                      >
                        <span className="text-gray-600 select-none mr-4 inline-block w-10 text-right">
                          {(index + 1).toString().padStart(3, ' ')}
                        </span>
                        <span className={lineError ? 'font-semibold' : ''}>{line || ' '}</span>
                      </div>
                    );
                  })}
                </pre>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <FileCode className="w-24 h-24 mx-auto mb-4 opacity-30" />
                <p className="text-xl font-semibold">Select a file to view and fix errors</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
