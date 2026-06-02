import { useState, useEffect } from 'react';
import { Play, Square, Share2, Download, Trash2, Plus, FileCode, Terminal, Clock, MemoryStick } from 'lucide-react';
import {
  executeCode,
  createPlaygroundSession,
  getSessions,
  runSession,
  shareSession,
  deleteSession,
  getSupportedExecutionLanguages,
  type PlaygroundSession,
  type ExecutionResult,
} from '../utils/codePlayground';
import { LANGUAGE_CONFIG, type ProgrammingLanguage } from '../utils/codeGenerator';
import { toast } from 'sonner';

export function CodePlaygroundPanel() {
  const [sessions, setSessions] = useState<PlaygroundSession[]>(getSessions());
  const [activeSession, setActiveSession] = useState<PlaygroundSession | null>(
    sessions.length > 0 ? sessions[0] : null
  );
  const [code, setCode] = useState('');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState<ExecutionResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [showNewSessionModal, setShowNewSessionModal] = useState(false);
  const [newSessionLanguage, setNewSessionLanguage] = useState<ProgrammingLanguage>('javascript');

  const supportedLanguages = getSupportedExecutionLanguages();

  useEffect(() => {
    if (activeSession) {
      const mainFile = activeSession.files.find((f) => f.name === 'main');
      if (mainFile) {
        setCode(mainFile.content);
      }
    }
  }, [activeSession]);

  const handleCreateSession = () => {
    const session = createPlaygroundSession(newSessionLanguage);
    setSessions(getSessions());
    setActiveSession(session);
    setShowNewSessionModal(false);
    toast.success('Playground session created!');
  };

  const handleRunCode = async () => {
    if (!activeSession) {
      toast.error('No active session');
      return;
    }

    setIsRunning(true);
    setOutput(null);

    try {
      const result = await runSession(activeSession.id, input);
      setOutput(result);

      if (result.success) {
        toast.success('Code executed successfully!');
      } else {
        toast.error('Code execution failed');
      }

      setSessions(getSessions());
    } catch (error: any) {
      toast.error(error.message || 'Execution failed');
    } finally {
      setIsRunning(false);
    }
  };

  const handleShareSession = () => {
    if (!activeSession) return;

    try {
      const shareUrl = shareSession(activeSession.id);
      navigator.clipboard.writeText(shareUrl);
      toast.success('Share link copied to clipboard!');
    } catch (error) {
      toast.error('Failed to create share link');
    }
  };

  const handleDeleteSession = (sessionId: string) => {
    deleteSession(sessionId);
    setSessions(getSessions());

    if (activeSession?.id === sessionId) {
      const remaining = getSessions();
      setActiveSession(remaining.length > 0 ? remaining[0] : null);
    }

    toast.success('Session deleted');
  };

  const handleDownloadCode = () => {
    if (!activeSession) return;

    const mainFile = activeSession.files.find((f) => f.name === 'main');
    if (!mainFile) return;

    const blob = new Blob([mainFile.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `code${LANGUAGE_CONFIG[activeSession.language].extension}`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Code downloaded!');
  };

  const getLanguageTemplate = (language: ProgrammingLanguage): string => {
    const templates: Record<string, string> = {
      javascript: `// JavaScript Playground
console.log("Hello, World!");

// Try some code:
const sum = (a, b) => a + b;
console.log("2 + 3 =", sum(2, 3));`,
      python: `# Python Playground
print("Hello, World!")

# Try some code:
def sum(a, b):
    return a + b

print("2 + 3 =", sum(2, 3))`,
      java: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");

        // Try some code:
        int result = sum(2, 3);
        System.out.println("2 + 3 = " + result);
    }

    public static int sum(int a, int b) {
        return a + b;
    }
}`,
      cpp: `#include <iostream>
using namespace std;

int sum(int a, int b) {
    return a + b;
}

int main() {
    cout << "Hello, World!" << endl;

    // Try some code:
    cout << "2 + 3 = " << sum(2, 3) << endl;

    return 0;
}`,
      go: `package main

import "fmt"

func sum(a int, b int) int {
    return a + b
}

func main() {
    fmt.Println("Hello, World!")

    // Try some code:
    fmt.Printf("2 + 3 = %d\\n", sum(2, 3))
}`,
      rust: `fn sum(a: i32, b: i32) -> i32 {
    a + b
}

fn main() {
    println!("Hello, World!");

    // Try some code:
    println!("2 + 3 = {}", sum(2, 3));
}`,
      php: `<?php

function sum($a, $b) {
    return $a + $b;
}

echo "Hello, World!\\n";

// Try some code:
echo "2 + 3 = " . sum(2, 3) . "\\n";

?>`,
      ruby: `def sum(a, b)
    a + b
end

puts "Hello, World!"

# Try some code:
puts "2 + 3 = #{sum(2, 3)}"`,
      bash: `#!/bin/bash

sum() {
    echo $(($1 + $2))
}

echo "Hello, World!"

# Try some code:
result=$(sum 2 3)
echo "2 + 3 = $result"`,
    };

    return templates[language] || LANGUAGE_CONFIG[language]?.template || '';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-gradient-to-br from-green-500 to-teal-500 rounded-lg">
                  <Terminal className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
                  Code Playground
                </h1>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                Write and execute code in your browser
              </p>
            </div>

            <button
              onClick={() => setShowNewSessionModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg hover:from-green-700 hover:to-teal-700 transition-all"
            >
              <Plus className="w-4 h-4" />
              New Session
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Sessions</h2>

              {sessions.length === 0 ? (
                <div className="text-center py-8">
                  <FileCode className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">No sessions</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {sessions.map((session) => (
                    <div
                      key={session.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        activeSession?.id === session.id
                          ? 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700'
                          : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 hover:border-green-300 dark:hover:border-green-700'
                      }`}
                      onClick={() => setActiveSession(session)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-gray-900 dark:text-white">
                          {LANGUAGE_CONFIG[session.language].name}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSession(session.id);
                          }}
                          className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                          title="Delete session"
                        >
                          <Trash2 className="w-3 h-3 text-red-600 dark:text-red-400" />
                        </button>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(session.createdAt).toLocaleDateString()}
                      </div>
                      {session.lastRun && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Last run: {new Date(session.lastRun).toLocaleTimeString()}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-3">
            {activeSession ? (
              <div className="space-y-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                  <div className="border-b border-gray-200 dark:border-gray-700 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg text-sm font-medium">
                          {LANGUAGE_CONFIG[activeSession.language].name}
                        </span>
                        {isRunning && (
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                            Running...
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={handleShareSession}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          title="Share"
                        >
                          <Share2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        </button>
                        <button
                          onClick={handleDownloadCode}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          title="Download"
                        >
                          <Download className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="p-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Code Editor
                    </label>
                    <textarea
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder={getLanguageTemplate(activeSession.language)}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-900 dark:text-white font-mono text-sm resize-none"
                      rows={16}
                      spellCheck={false}
                    />
                  </div>

                  <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Standard Input (stdin)
                    </label>
                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Enter input for your program (optional)"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-900 dark:text-white font-mono text-sm resize-none"
                      rows={3}
                    />
                  </div>

                  <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                    <button
                      onClick={handleRunCode}
                      disabled={isRunning}
                      className="w-full bg-gradient-to-r from-green-600 to-teal-600 text-white py-3 rounded-lg font-medium hover:from-green-700 hover:to-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isRunning ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Running...
                        </>
                      ) : (
                        <>
                          <Play className="w-5 h-5" />
                          Run Code
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {output && (
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Output</h3>
                      <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {output.executionTime}ms
                        </div>
                        {output.memory && (
                          <div className="flex items-center gap-1">
                            <MemoryStick className="w-3 h-3" />
                            {(output.memory / 1024).toFixed(2)} KB
                          </div>
                        )}
                        {output.exitCode !== undefined && (
                          <div>
                            Exit: {output.exitCode}
                          </div>
                        )}
                      </div>
                    </div>

                    {output.success ? (
                      <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm whitespace-pre-wrap">
                        {output.output || '(no output)'}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {output.output && (
                          <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm whitespace-pre-wrap">
                            {output.output}
                          </div>
                        )}
                        <div className="bg-red-900/20 border border-red-800 text-red-400 p-4 rounded-lg font-mono text-sm whitespace-pre-wrap">
                          {output.error}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeSession.output.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Execution History</h3>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {activeSession.output.map((entry, idx) => (
                        <div
                          key={idx}
                          className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded text-xs font-mono text-gray-700 dark:text-gray-300"
                        >
                          {entry}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-12">
                <div className="text-center">
                  <Terminal className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    No Active Session
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Create a new playground session to start coding
                  </p>
                  <button
                    onClick={() => setShowNewSessionModal(true)}
                    className="px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg hover:from-green-700 hover:to-teal-700 transition-all"
                  >
                    Create Session
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showNewSessionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              New Playground Session
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Language
                </label>
                <select
                  value={newSessionLanguage}
                  onChange={(e) => setNewSessionLanguage(e.target.value as ProgrammingLanguage)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  {supportedLanguages.map((lang) => (
                    <option key={lang} value={lang}>
                      {LANGUAGE_CONFIG[lang].name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Your code will be executed in a secure sandbox environment
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowNewSessionModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateSession}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg hover:from-green-700 hover:to-teal-700 transition-all"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
