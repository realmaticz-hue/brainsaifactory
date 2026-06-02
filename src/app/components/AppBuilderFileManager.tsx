import { useState, useRef } from 'react';
import { 
  Upload, FileCode, AlertCircle, CheckCircle, Wrench, Trash2, 
  File, FolderOpen, FileSearch, Plus, Download, X
} from 'lucide-react';

interface FileError {
  line: number;
  column: number;
  message: string;
  severity: 'error' | 'warning';
  fix?: string;
}

interface UploadedFile {
  id: string;
  name: string;
  content: string;
  language: string;
  errors: FileError[];
  status: 'ok' | 'error' | 'warning';
}

interface AppBuilderFileManagerProps {
  onFileUpload?: (files: UploadedFile[]) => void;
  onFixAllErrors?: () => void;
}

export function AppBuilderFileManager({ onFileUpload, onFixAllErrors }: AppBuilderFileManagerProps) {
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

    lines.forEach((line, index) => {
      // Check for common syntax errors
      
      // Missing semicolons (JavaScript/TypeScript)
      if (['javascript', 'typescript'].includes(language)) {
        if (line.trim() && !line.trim().endsWith(';') && !line.trim().endsWith('{') && 
            !line.trim().endsWith('}') && !line.trim().endsWith(',') && 
            !line.trim().startsWith('//') && !line.trim().startsWith('/*') &&
            !line.trim().startsWith('*') && !line.trim().startsWith('import') &&
            !line.trim().startsWith('export') && line.includes('=')) {
          errors.push({
            line: index + 1,
            column: line.length,
            message: 'Missing semicolon',
            severity: 'warning',
            fix: line + ';'
          });
        }

        // Undefined variables (simple check)
        const varMatch = line.match(/\b([a-z_][a-zA-Z0-9_]*)\s*=/);
        if (varMatch && !line.includes('const') && !line.includes('let') && !line.includes('var')) {
          errors.push({
            line: index + 1,
            column: line.indexOf(varMatch[1]),
            message: `Variable '${varMatch[1]}' used before declaration`,
            severity: 'error',
            fix: line.replace(varMatch[1], `const ${varMatch[1]}`)
          });
        }

        // Missing imports for React
        if (line.includes('useState') && !content.includes("import { useState }") && !content.includes("import * as React")) {
          errors.push({
            line: index + 1,
            column: line.indexOf('useState'),
            message: 'useState is not imported',
            severity: 'error',
            fix: "import { useState } from 'react';"
          });
        }

        if (line.includes('useEffect') && !content.includes("import { useEffect }") && !content.includes("import * as React")) {
          errors.push({
            line: index + 1,
            column: line.indexOf('useEffect'),
            message: 'useEffect is not imported',
            severity: 'error',
            fix: "import { useEffect } from 'react';"
          });
        }
      }

      // Unclosed brackets
      const openBrackets = (line.match(/\{/g) || []).length;
      const closeBrackets = (line.match(/\}/g) || []).length;
      if (openBrackets > closeBrackets && !line.trim().endsWith(',')) {
        errors.push({
          line: index + 1,
          column: line.length,
          message: 'Unclosed bracket',
          severity: 'error'
        });
      }

      // Console.log statements (best practice)
      if (line.includes('console.log')) {
        errors.push({
          line: index + 1,
          column: line.indexOf('console.log'),
          message: 'Remove console.log in production',
          severity: 'warning',
          fix: line.replace(/console\.log\([^)]*\);?/, '')
        });
      }

      // Deprecated syntax
      if (line.includes('var ')) {
        errors.push({
          line: index + 1,
          column: line.indexOf('var'),
          message: 'Use const or let instead of var',
          severity: 'warning',
          fix: line.replace('var ', 'const ')
        });
      }

      // Empty catch blocks
      if (line.trim() === 'catch (e) {}' || line.trim() === 'catch (error) {}') {
        errors.push({
          line: index + 1,
          column: 0,
          message: 'Empty catch block - handle errors properly',
          severity: 'warning',
          fix: line.replace('{}', '{ console.error(error); }')
        });
      }
    });

    return errors;
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
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (folderInputRef.current) {
      folderInputRef.current.value = '';
    }
  };

  const fixError = (fileId: string, errorIndex: number) => {
    setUploadedFiles(prev => prev.map(file => {
      if (file.id !== fileId) return file;

      const error = file.errors[errorIndex];
      if (!error.fix) return file;

      let newContent = file.content;
      const lines = newContent.split('\n');

      // Apply the fix
      if (error.fix.startsWith('import')) {
        // Add import at the top
        newContent = error.fix + '\n' + newContent;
      } else {
        // Replace the line with the fix
        lines[error.line - 1] = error.fix;
        newContent = lines.join('\n');
      }

      // Re-scan for errors
      const newErrors = scanForErrors(newContent, file.language);

      return {
        ...file,
        content: newContent,
        errors: newErrors,
        status: newErrors.some(e => e.severity === 'error') ? 'error' : 
                newErrors.some(e => e.severity === 'warning') ? 'warning' : 'ok'
      };
    }));
  };

  const fixAllErrorsInFile = (fileId: string) => {
    setUploadedFiles(prev => prev.map(file => {
      if (file.id !== fileId) return file;

      let newContent = file.content;
      const fixableErrors = file.errors.filter(e => e.fix);

      // Group errors by type
      const importFixes = fixableErrors.filter(e => e.fix?.startsWith('import'));
      const lineFixes = fixableErrors.filter(e => !e.fix?.startsWith('import'));

      // Apply import fixes
      if (importFixes.length > 0) {
        const imports = Array.from(new Set(importFixes.map(e => e.fix))).join('\n');
        newContent = imports + '\n' + newContent;
      }

      // Apply line fixes
      const lines = newContent.split('\n');
      lineFixes.forEach(error => {
        if (error.fix && error.line <= lines.length) {
          lines[error.line - 1] = error.fix;
        }
      });
      newContent = lines.join('\n');

      // Re-scan for errors
      const newErrors = scanForErrors(newContent, file.language);

      return {
        ...file,
        content: newContent,
        errors: newErrors,
        status: newErrors.some(e => e.severity === 'error') ? 'error' : 
                newErrors.some(e => e.severity === 'warning') ? 'warning' : 'ok'
      };
    }));
  };

  const fixAllErrors = async () => {
    setAutoFixing(true);

    // Process all files at once instead of sequentially
    setUploadedFiles(prev => prev.map(file => {
      if (file.errors.length === 0) return file;

      let newContent = file.content;
      const fixableErrors = file.errors.filter(e => e.fix);

      if (fixableErrors.length === 0) return file;

      // Group errors by type
      const importFixes = fixableErrors.filter(e => e.fix?.startsWith('import'));
      const lineFixes = fixableErrors.filter(e => !e.fix?.startsWith('import'));

      // Apply import fixes first
      if (importFixes.length > 0) {
        const uniqueImports = Array.from(new Set(importFixes.map(e => e.fix))).join('\n');
        newContent = uniqueImports + '\n' + newContent;
      }

      // Apply line fixes (sort by line number descending to avoid line shifts)
      const lines = newContent.split('\n');
      lineFixes.sort((a, b) => b.line - a.line).forEach(error => {
        if (error.fix && error.line <= lines.length) {
          lines[error.line - 1] = error.fix;
        }
      });
      newContent = lines.join('\n');

      // Re-scan for remaining errors
      const newErrors = scanForErrors(newContent, file.language);

      return {
        ...file,
        content: newContent,
        errors: newErrors,
        status: newErrors.some(e => e.severity === 'error') ? 'error' : 
                newErrors.some(e => e.severity === 'warning') ? 'warning' : 'ok'
      };
    }));

    // Small delay for visual feedback
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setAutoFixing(false);
    
    if (onFixAllErrors) {
      onFixAllErrors();
    }
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
    if (selectedFile === fileId) {
      setSelectedFile(null);
    }
  };

  const downloadFile = (file: UploadedFile) => {
    const blob = new Blob([file.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const clearAllFiles = () => {
    setUploadedFiles([]);
    setSelectedFile(null);
    setScanComplete(false);
  };

  const downloadAllFixed = () => {
    uploadedFiles.forEach(file => {
      downloadFile(file);
    });
  };

  const selectedFileData = uploadedFiles.find(f => f.id === selectedFile);
  const totalErrors = uploadedFiles.reduce((sum, f) => sum + f.errors.filter(e => e.severity === 'error').length, 0);
  const totalWarnings = uploadedFiles.reduce((sum, f) => sum + f.errors.filter(e => e.severity === 'warning').length, 0);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4">
        <h3 className="text-white font-bold text-lg flex items-center gap-2">
          <FileSearch className="w-5 h-5" />
          File Manager & Error Scanner
        </h3>
        <p className="text-white/80 text-sm mt-1">Upload files to scan for errors and auto-fix</p>
      </div>

      {/* Stats & Actions */}
      <div className="bg-gray-800 p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-2">
              <File className="w-4 h-4 text-blue-400" />
              <span className="text-gray-300">{uploadedFiles.length} files</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <span className="text-gray-300">{totalErrors} errors</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-400" />
              <span className="text-gray-300">{totalWarnings} warnings</span>
            </div>
          </div>

          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".js,.jsx,.ts,.tsx,.py,.java,.kt,.swift,.html,.css,.json"
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
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 text-sm font-semibold transition-colors"
            >
              <Upload className="w-4 h-4" />
              Upload Files
            </button>

            <button
              onClick={() => folderInputRef.current?.click()}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center gap-2 text-sm font-semibold transition-colors"
            >
              <FolderOpen className="w-4 h-4" />
              Upload Folder
            </button>

            {uploadedFiles.length > 0 && (
              <button
                onClick={clearAllFiles}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center gap-2 text-sm font-semibold transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Clear All
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Fix All Banner - Shows after scan complete with errors */}
      {scanComplete && (totalErrors > 0 || totalWarnings > 0) && (
        <div className="bg-gradient-to-r from-yellow-600 to-orange-600 p-4 border-b border-yellow-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-3 rounded-lg">
                <AlertCircle className="w-8 h-8 text-white" />
              </div>
              <div>
                <h4 className="text-white font-bold text-lg">Scan Complete - Issues Detected!</h4>
                <p className="text-white/90 text-sm">
                  Found {totalErrors} error{totalErrors !== 1 ? 's' : ''} and {totalWarnings} warning{totalWarnings !== 1 ? 's' : ''} across {uploadedFiles.length} file{uploadedFiles.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setScanComplete(false)}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg text-sm font-semibold transition-colors"
              >
                Dismiss
              </button>
              <button
                onClick={fixAllErrors}
                disabled={autoFixing}
                className="px-6 py-3 bg-white text-orange-600 hover:bg-gray-100 rounded-lg flex items-center gap-2 text-base font-bold transition-colors disabled:opacity-50 shadow-lg"
              >
                <Wrench className="w-5 h-5" />
                {autoFixing ? 'Fixing All Errors...' : 'Fix All Errors Now'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Banner - Shows after fixing all errors */}
      {scanComplete && totalErrors === 0 && totalWarnings === 0 && uploadedFiles.length > 0 && (
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-4 border-b border-green-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-3 rounded-lg">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <div>
                <h4 className="text-white font-bold text-lg">All Files Clean! ✨</h4>
                <p className="text-white/90 text-sm">
                  No errors found in {uploadedFiles.length} file{uploadedFiles.length !== 1 ? 's' : ''}. Ready to use!
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setScanComplete(false)}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg text-sm font-semibold transition-colors"
              >
                Dismiss
              </button>
              <button
                onClick={downloadAllFixed}
                className="px-6 py-3 bg-white text-green-600 hover:bg-gray-100 rounded-lg flex items-center gap-2 text-base font-bold transition-colors shadow-lg"
              >
                <Download className="w-5 h-5" />
                Download All Files
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-hidden flex">
        {/* File List */}
        <div className="w-64 bg-gray-800/50 border-r border-gray-700 overflow-y-auto">
          {uploadedFiles.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No files uploaded</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
              >
                Upload Files
              </button>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {uploadedFiles.map(file => (
                <div
                  key={file.id}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedFile === file.id
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                  onClick={() => setSelectedFile(file.id)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <FileCode className="w-4 h-4 flex-shrink-0" />
                      <span className="text-sm font-semibold truncate">{file.name}</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(file.id);
                      }}
                      className="p-1 hover:bg-gray-800/50 rounded"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    {file.status === 'ok' && (
                      <span className="flex items-center gap-1 text-green-400">
                        <CheckCircle className="w-3 h-3" />
                        No issues
                      </span>
                    )}
                    {file.status === 'error' && (
                      <span className="flex items-center gap-1 text-red-400">
                        <AlertCircle className="w-3 h-3" />
                        {file.errors.filter(e => e.severity === 'error').length} errors
                      </span>
                    )}
                    {file.status === 'warning' && (
                      <span className="flex items-center gap-1 text-yellow-400">
                        <AlertCircle className="w-3 h-3" />
                        {file.errors.filter(e => e.severity === 'warning').length} warnings
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* File Viewer */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {selectedFileData ? (
            <>
              {/* File Header */}
              <div className="bg-gray-800 p-3 border-b border-gray-700 flex items-center justify-between">
                <div>
                  <h4 className="text-white font-semibold">{selectedFileData.name}</h4>
                  <p className="text-gray-400 text-xs">{selectedFileData.language} • {selectedFileData.errors.length} issues found</p>
                </div>
                <div className="flex gap-2">
                  {selectedFileData.errors.some(e => e.fix) && (
                    <button
                      onClick={() => fixAllErrorsInFile(selectedFileData.id)}
                      className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm flex items-center gap-1"
                    >
                      <Wrench className="w-3 h-3" />
                      Fix All
                    </button>
                  )}
                  <button
                    onClick={() => downloadFile(selectedFileData)}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm flex items-center gap-1"
                  >
                    <Download className="w-3 h-3" />
                    Download
                  </button>
                </div>
              </div>

              {/* Errors List */}
              {selectedFileData.errors.length > 0 && (
                <div className="bg-gray-800/50 p-4 border-b border-gray-700 max-h-48 overflow-y-auto">
                  <h5 className="text-white font-semibold text-sm mb-3">Issues Found:</h5>
                  <div className="space-y-2">
                    {selectedFileData.errors.map((error, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg ${
                          error.severity === 'error' ? 'bg-red-900/30 border border-red-500/30' : 'bg-yellow-900/30 border border-yellow-500/30'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <AlertCircle className={`w-4 h-4 ${error.severity === 'error' ? 'text-red-400' : 'text-yellow-400'}`} />
                              <span className={`text-sm font-semibold ${error.severity === 'error' ? 'text-red-400' : 'text-yellow-400'}`}>
                                Line {error.line}:{error.column}
                              </span>
                            </div>
                            <p className="text-gray-300 text-sm">{error.message}</p>
                            {error.fix && (
                              <code className="text-green-400 text-xs mt-2 block bg-gray-900/50 p-2 rounded">
                                Fix: {error.fix.length > 100 ? error.fix.substring(0, 100) + '...' : error.fix}
                              </code>
                            )}
                          </div>
                          {error.fix && (
                            <button
                              onClick={() => fixError(selectedFileData.id, index)}
                              className="ml-2 px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs flex items-center gap-1"
                            >
                              <Wrench className="w-3 h-3" />
                              Fix
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Code Viewer */}
              <div className="flex-1 overflow-auto bg-gray-900 p-4">
                <pre className="text-gray-100 text-sm font-mono">
                  {selectedFileData.content.split('\n').map((line, index) => {
                    const lineError = selectedFileData.errors.find(e => e.line === index + 1);
                    return (
                      <div
                        key={index}
                        className={`${
                          lineError 
                            ? lineError.severity === 'error' 
                              ? 'bg-red-900/20 border-l-2 border-red-500' 
                              : 'bg-yellow-900/20 border-l-2 border-yellow-500'
                            : ''
                        } pl-2`}
                      >
                        <span className="text-gray-600 select-none mr-4">{(index + 1).toString().padStart(3, ' ')}</span>
                        {line || ' '}
                      </div>
                    );
                  })}
                </pre>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <FileCode className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">Select a file to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}