// AI Error Troubleshooter - Paste any error and get intelligent solutions
import { useState, useRef, useEffect } from 'react';
import { copyToClipboard } from '../utils/clipboard';
import { 
  AlertCircle, CheckCircle, Zap, Search, Code, Copy, 
  Download, ExternalLink, Loader, Sparkles, Terminal,
  FileCode, Globe, BookOpen, Lightbulb, Wrench, X,
  Send, Upload, ChevronDown, ChevronRight, Bug
} from 'lucide-react';

interface ErrorAnalysis {
  errorType: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  causes: string[];
  solutions: Solution[];
  codeExample?: string;
  relatedErrors: string[];
  webResources: WebResource[];
}

interface Solution {
  title: string;
  steps: string[];
  code?: string;
  autoFixAvailable: boolean;
}

interface WebResource {
  title: string;
  url: string;
  source: string;
  relevance: number;
}

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  analysis?: ErrorAnalysis;
  timestamp: number;
}

export function AIErrorTroubleshooter() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'system',
      content: '🔧 **AI Error Troubleshooter**\n\nPaste any error from your terminal, console, or IDE and I\'ll:\n• Analyze the error type and severity\n• Search web resources for solutions\n• Provide step-by-step fixes\n• Auto-fix your code when possible\n\n**Supported Errors:**\n• JavaScript/TypeScript errors\n• React errors\n• Node.js errors\n• Build/compilation errors\n• Runtime errors\n• Dependency errors\n• And more!',
      timestamp: Date.now()
    }
  ]);
  const [input, setInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [searchingWeb, setSearchingWeb] = useState(false);
  const [expandedSolutions, setExpandedSolutions] = useState<Set<number>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const exampleErrors = [
    {
      icon: <Bug className="w-5 h-5" />,
      title: 'Module Not Found',
      error: "Error: Cannot find module 'react'\nRequire stack:\n- /app/index.js",
      category: 'Dependency'
    },
    {
      icon: <Code className="w-5 h-5" />,
      title: 'Syntax Error',
      error: "SyntaxError: Unexpected token '}' in JSON at position 45",
      category: 'Syntax'
    },
    {
      icon: <Terminal className="w-5 h-5" />,
      title: 'Type Error',
      error: "TypeError: Cannot read property 'map' of undefined\n    at App.jsx:24:15",
      category: 'Runtime'
    },
    {
      icon: <AlertCircle className="w-5 h-5" />,
      title: 'React Hook Error',
      error: "Error: Rendered more hooks than during the previous render",
      category: 'React'
    }
  ];

  const analyzeError = async (errorText: string): Promise<ErrorAnalysis> => {
    // Simulate web search
    setSearchingWeb(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setSearchingWeb(false);

    const lowerError = errorText.toLowerCase();
    
    // Module/Dependency Errors
    if (lowerError.includes('cannot find module') || lowerError.includes('module not found')) {
      const moduleName = errorText.match(/['"]([^'"]+)['"]/)?.[1] || 'package';
      return {
        errorType: 'Module Not Found Error',
        severity: 'high',
        description: `The module "${moduleName}" is not installed or cannot be found in your project.`,
        causes: [
          'Package not installed via npm/yarn',
          'Typo in the import statement',
          'Package name changed or deprecated',
          'Missing from package.json dependencies'
        ],
        solutions: [
          {
            title: 'Install the missing package',
            steps: [
              'Open your terminal',
              `Run: npm install ${moduleName}`,
              'Or with yarn: yarn add ${moduleName}',
              'Restart your development server'
            ],
            code: `npm install ${moduleName}\n# or\nyarn add ${moduleName}`,
            autoFixAvailable: true
          },
          {
            title: 'Check import statement',
            steps: [
              'Verify the package name is spelled correctly',
              'Check if the package has been renamed',
              'Ensure the import path is correct'
            ],
            code: `// Correct import\nimport ${moduleName} from '${moduleName}';\n\n// Or for named imports\nimport { Component } from '${moduleName}';`,
            autoFixAvailable: false
          }
        ],
        relatedErrors: ['ERR_MODULE_NOT_FOUND', 'Cannot resolve module'],
        webResources: [
          {
            title: 'NPM Documentation - Installing Packages',
            url: 'https://docs.npmjs.com/cli/v8/commands/npm-install',
            source: 'NPM',
            relevance: 95
          },
          {
            title: 'Module Resolution in Node.js',
            url: 'https://nodejs.org/api/modules.html',
            source: 'Node.js',
            relevance: 90
          },
          {
            title: 'Common Module Errors - Stack Overflow',
            url: 'https://stackoverflow.com/questions/tagged/module-not-found',
            source: 'Stack Overflow',
            relevance: 85
          }
        ]
      };
    }

    // Type Errors
    if (lowerError.includes('typeerror') || lowerError.includes('cannot read property')) {
      const property = errorText.match(/property ['"]([^'"]+)['"]/)?.[1] || 'property';
      return {
        errorType: 'TypeError - Cannot Read Property',
        severity: 'critical',
        description: `Attempting to access property "${property}" on an undefined or null value.`,
        causes: [
          'Variable is undefined or null',
          'Asynchronous data not loaded yet',
          'Missing null/undefined check',
          'Incorrect data structure assumption'
        ],
        solutions: [
          {
            title: 'Add optional chaining',
            steps: [
              'Use optional chaining (?.) operator',
              'This safely accesses nested properties',
              'Returns undefined if any part is null/undefined'
            ],
            code: `// Before (causes error)\nconst value = data.${property};\n\n// After (safe)\nconst value = data?.${property};\n\n// Or with default value\nconst value = data?.${property} ?? 'default';`,
            autoFixAvailable: true
          },
          {
            title: 'Add conditional check',
            steps: [
              'Check if the object exists before accessing',
              'Use if statement or ternary operator',
              'Provide fallback value'
            ],
            code: `// Method 1: If statement\nif (data && data.${property}) {\n  const value = data.${property};\n}\n\n// Method 2: Ternary\nconst value = data ? data.${property} : null;\n\n// Method 3: Logical AND\nconst value = data && data.${property};`,
            autoFixAvailable: true
          },
          {
            title: 'Initialize with default value',
            steps: [
              'Ensure variables have initial values',
              'Use default parameters',
              'Set initial state properly'
            ],
            code: `// For function parameters\nfunction processData(data = {}) {\n  const value = data.${property};\n}\n\n// For React state\nconst [data, setData] = useState({ ${property}: null });\n\n// For variables\nconst data = someValue || {};`,
            autoFixAvailable: false
          }
        ],
        relatedErrors: ['TypeError: Cannot read properties of null', 'TypeError: Cannot read properties of undefined'],
        webResources: [
          {
            title: 'Optional Chaining - MDN',
            url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Optional_chaining',
            source: 'MDN',
            relevance: 98
          },
          {
            title: 'Handling Undefined in JavaScript',
            url: 'https://javascript.info/optional-chaining',
            source: 'javascript.info',
            relevance: 92
          }
        ]
      };
    }

    // React Hook Errors
    if (lowerError.includes('hook') || lowerError.includes('rendered more hooks') || lowerError.includes('rendered fewer hooks')) {
      return {
        errorType: 'React Hooks Rule Violation',
        severity: 'critical',
        description: 'Hooks are being called conditionally or in the wrong order, violating the Rules of Hooks.',
        causes: [
          'Hooks called inside conditions (if statements)',
          'Hooks called inside loops',
          'Hooks called in nested functions',
          'Early returns before hooks'
        ],
        solutions: [
          {
            title: 'Move hooks to top level',
            steps: [
              'Call all hooks at the top of your component',
              'Never call hooks conditionally',
              'Always call hooks in the same order',
              'Move conditional logic inside the hook'
            ],
            code: `// ❌ WRONG - Hook inside condition\nfunction Component({ condition }) {\n  if (condition) {\n    const [state, setState] = useState(0); // Error!\n  }\n}\n\n// ✅ CORRECT - Hook at top level\nfunction Component({ condition }) {\n  const [state, setState] = useState(0);\n  \n  if (condition) {\n    // Use state here\n  }\n}`,
            autoFixAvailable: true
          },
          {
            title: 'Remove early returns before hooks',
            steps: [
              'Move all early returns after hooks',
              'Use conditional rendering instead',
              'Ensure all hooks are called every render'
            ],
            code: `// ❌ WRONG - Return before hooks\nfunction Component({ user }) {\n  if (!user) return null; // Error!\n  const [data, setData] = useState();\n}\n\n// ✅ CORRECT - Hooks first\nfunction Component({ user }) {\n  const [data, setData] = useState();\n  \n  if (!user) return null; // OK now\n  return <div>{data}</div>;\n}`,
            autoFixAvailable: true
          }
        ],
        relatedErrors: ['Hooks can only be called inside function components', 'Invalid hook call'],
        webResources: [
          {
            title: 'Rules of Hooks - React Documentation',
            url: 'https://react.dev/reference/rules/rules-of-hooks',
            source: 'React',
            relevance: 100
          },
          {
            title: 'Common React Hooks Mistakes',
            url: 'https://react.dev/learn/hooks-faq',
            source: 'React',
            relevance: 95
          }
        ]
      };
    }

    // Syntax Errors
    if (lowerError.includes('syntaxerror') || lowerError.includes('unexpected token')) {
      return {
        errorType: 'Syntax Error',
        severity: 'critical',
        description: 'The code contains invalid JavaScript syntax that prevents it from being parsed.',
        causes: [
          'Missing or extra brackets/braces',
          'Missing commas or semicolons',
          'Unclosed strings or template literals',
          'Invalid JSON format'
        ],
        solutions: [
          {
            title: 'Check bracket/brace matching',
            steps: [
              'Ensure all opening brackets have closing brackets',
              'Use IDE auto-formatting (Prettier)',
              'Check for balanced parentheses',
              'Verify object and array syntax'
            ],
            code: `// ❌ WRONG\nconst obj = {\n  name: 'test',\n  value: 123\n// Missing closing brace\n\n// ✅ CORRECT\nconst obj = {\n  name: 'test',\n  value: 123\n};`,
            autoFixAvailable: true
          },
          {
            title: 'Validate JSON syntax',
            steps: [
              'Use JSON.parse() to validate',
              'Check for trailing commas (not allowed in JSON)',
              'Ensure all keys are quoted',
              'Use a JSON validator tool'
            ],
            code: `// ❌ WRONG JSON\n{\n  name: "test",    // Keys must be quoted\n  value: 123,      // Trailing comma not allowed\n}\n\n// ✅ CORRECT JSON\n{\n  "name": "test",\n  "value": 123\n}`,
            autoFixAvailable: true
          }
        ],
        relatedErrors: ['Unexpected end of JSON input', 'Unexpected token', 'Missing semicolon'],
        webResources: [
          {
            title: 'JavaScript Syntax - MDN',
            url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Errors',
            source: 'MDN',
            relevance: 95
          },
          {
            title: 'JSON Syntax Validator',
            url: 'https://jsonlint.com/',
            source: 'JSONLint',
            relevance: 90
          }
        ]
      };
    }

    // Build/Compilation Errors
    if (lowerError.includes('failed to compile') || lowerError.includes('build failed')) {
      return {
        errorType: 'Build/Compilation Error',
        severity: 'high',
        description: 'The build process failed due to errors in the code or configuration.',
        causes: [
          'TypeScript type errors',
          'Missing dependencies',
          'Configuration issues',
          'Syntax errors in code'
        ],
        solutions: [
          {
            title: 'Check TypeScript errors',
            steps: [
              'Review all type errors in the output',
              'Add proper type annotations',
              'Use type assertions if needed',
              'Update tsconfig.json if necessary'
            ],
            code: `// Fix type errors\n// Before\nconst value = data.map(item => item.value);\n\n// After (with types)\ninterface Item {\n  value: number;\n}\nconst value: number[] = data.map((item: Item) => item.value);`,
            autoFixAvailable: false
          },
          {
            title: 'Clear cache and rebuild',
            steps: [
              'Delete node_modules folder',
              'Delete package-lock.json',
              'Run: npm install',
              'Run: npm run build'
            ],
            code: `# Clear and reinstall\nrm -rf node_modules package-lock.json\nnpm install\nnpm run build`,
            autoFixAvailable: false
          }
        ],
        relatedErrors: ['Compilation error', 'Build process failed'],
        webResources: [
          {
            title: 'TypeScript Handbook',
            url: 'https://www.typescriptlang.org/docs/',
            source: 'TypeScript',
            relevance: 93
          }
        ]
      };
    }

    // Generic Error Response
    return {
      errorType: 'Unknown Error',
      severity: 'medium',
      description: 'An error occurred that requires further investigation.',
      causes: [
        'Review the full error message',
        'Check recent code changes',
        'Verify dependencies are installed',
        'Look for typos or syntax issues'
      ],
      solutions: [
        {
          title: 'Debug the error',
          steps: [
            'Read the full error message and stack trace',
            'Identify the file and line number',
            'Add console.log statements to debug',
            'Search for the error message online'
          ],
          code: `// Add debugging\nconsole.log('Debug checkpoint 1');\nconsole.log('Variable value:', someVariable);\n\ntry {\n  // Your code\n} catch (error) {\n  console.error('Caught error:', error);\n}`,
          autoFixAvailable: false
        }
      ],
      relatedErrors: [],
      webResources: [
        {
          title: 'Search Stack Overflow',
          url: `https://stackoverflow.com/search?q=${encodeURIComponent(errorText.split('\n')[0])}`,
          source: 'Stack Overflow',
          relevance: 80
        },
        {
          title: 'Search GitHub Issues',
          url: `https://github.com/search?type=issues&q=${encodeURIComponent(errorText.split('\n')[0])}`,
          source: 'GitHub',
          relevance: 75
        }
      ]
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isAnalyzing) return;

    const errorText = input;
    setInput('');

    // Add user message
    const userMessage: ChatMessage = {
      role: 'user',
      content: errorText,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, userMessage]);

    // Analyze error
    setIsAnalyzing(true);
    const analysis = await analyzeError(errorText);
    setIsAnalyzing(false);

    // Add assistant response
    const assistantMessage: ChatMessage = {
      role: 'assistant',
      content: `**${analysis.errorType}** (${analysis.severity.toUpperCase()} severity)\n\n${analysis.description}`,
      analysis,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, assistantMessage]);
  };

  const useExample = (error: string) => {
    setInput(error);
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

  const copyCode = (code: string) => {
    copyToClipboard(code);
  };

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 via-orange-600 to-yellow-600 p-4">
        <h3 className="text-white font-bold text-lg flex items-center gap-2">
          <Bug className="w-5 h-5" />
          AI Error Troubleshooter
        </h3>
        <p className="text-white/90 text-sm">Paste any error for intelligent analysis & solutions</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) => (
          <div key={index}>
            {/* Message Bubble */}
            <div
              className={`${
                msg.role === 'user'
                  ? 'ml-8 bg-blue-600 text-white'
                  : msg.role === 'system'
                  ? 'bg-gray-700 text-gray-100'
                  : 'mr-8 bg-gray-800 text-gray-100'
              } rounded-lg p-4`}
            >
              <div className="flex items-start gap-2">
                {msg.role === 'assistant' && <Sparkles className="w-4 h-4 mt-0.5 flex-shrink-0 text-yellow-400" />}
                {msg.role === 'user' && <Terminal className="w-4 h-4 mt-0.5 flex-shrink-0" />}
                <div className="flex-1 whitespace-pre-wrap text-sm font-mono">{msg.content}</div>
              </div>
            </div>

            {/* Analysis Card */}
            {msg.analysis && (
              <div className="mt-4 mr-8 bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
                {/* Severity Badge */}
                <div className={`p-3 ${
                  msg.analysis.severity === 'critical' ? 'bg-red-900/50 border-b border-red-800' :
                  msg.analysis.severity === 'high' ? 'bg-orange-900/50 border-b border-orange-800' :
                  msg.analysis.severity === 'medium' ? 'bg-yellow-900/50 border-b border-yellow-800' :
                  'bg-blue-900/50 border-b border-blue-800'
                }`}>
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    <span className="font-bold text-white">{msg.analysis.errorType}</span>
                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                      msg.analysis.severity === 'critical' ? 'bg-red-600' :
                      msg.analysis.severity === 'high' ? 'bg-orange-600' :
                      msg.analysis.severity === 'medium' ? 'bg-yellow-600' :
                      'bg-blue-600'
                    }`}>
                      {msg.analysis.severity}
                    </span>
                  </div>
                </div>

                {/* Causes */}
                <div className="p-4 border-b border-gray-700">
                  <h4 className="font-bold text-white mb-2 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-yellow-400" />
                    Possible Causes
                  </h4>
                  <ul className="space-y-1 text-sm text-gray-300">
                    {msg.analysis.causes.map((cause, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-yellow-400 mt-1">•</span>
                        <span>{cause}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Solutions */}
                <div className="p-4 border-b border-gray-700">
                  <h4 className="font-bold text-white mb-3 flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-green-400" />
                    Solutions ({msg.analysis.solutions.length})
                  </h4>
                  <div className="space-y-3">
                    {msg.analysis.solutions.map((solution, i) => (
                      <div key={i} className="bg-gray-900 rounded-lg border border-gray-700">
                        <button
                          onClick={() => toggleSolution(index * 100 + i)}
                          className="w-full p-3 flex items-center justify-between hover:bg-gray-800 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            {expandedSolutions.has(index * 100 + i) ? (
                              <ChevronDown className="w-4 h-4 text-gray-400" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-gray-400" />
                            )}
                            <span className="font-semibold text-white">{solution.title}</span>
                            {solution.autoFixAvailable && (
                              <span className="px-2 py-0.5 bg-green-600 text-white text-xs rounded font-bold">
                                AUTO-FIX
                              </span>
                            )}
                          </div>
                        </button>
                        
                        {expandedSolutions.has(index * 100 + i) && (
                          <div className="p-3 pt-0 space-y-3">
                            <div>
                              <p className="text-sm font-semibold text-gray-400 mb-2">Steps:</p>
                              <ol className="space-y-1 text-sm text-gray-300">
                                {solution.steps.map((step, j) => (
                                  <li key={j} className="flex items-start gap-2">
                                    <span className="text-green-400 font-bold">{j + 1}.</span>
                                    <span>{step}</span>
                                  </li>
                                ))}
                              </ol>
                            </div>
                            
                            {solution.code && (
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <p className="text-sm font-semibold text-gray-400">Code:</p>
                                  <button
                                    onClick={() => copyCode(solution.code!)}
                                    className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded"
                                  >
                                    <Copy className="w-3 h-3" />
                                  </button>
                                </div>
                                <pre className="bg-black p-3 rounded text-xs text-green-400 overflow-x-auto">
                                  {solution.code}
                                </pre>
                              </div>
                            )}
                            
                            {solution.autoFixAvailable && (
                              <button className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded font-semibold text-sm flex items-center justify-center gap-2">
                                <Zap className="w-4 h-4" />
                                Apply Auto-Fix
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Web Resources */}
                {msg.analysis.webResources.length > 0 && (
                  <div className="p-4">
                    <h4 className="font-bold text-white mb-3 flex items-center gap-2">
                      <Globe className="w-4 h-4 text-blue-400" />
                      Web Resources
                    </h4>
                    <div className="space-y-2">
                      {msg.analysis.webResources.map((resource, i) => (
                        <a
                          key={i}
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block p-3 bg-gray-900 rounded-lg border border-gray-700 hover:border-blue-600 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <BookOpen className="w-4 h-4 text-blue-400" />
                                <span className="font-semibold text-white text-sm">{resource.title}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-400">{resource.source}</span>
                                <span className="text-xs text-green-400">
                                  {resource.relevance}% relevant
                                </span>
                              </div>
                            </div>
                            <ExternalLink className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {isAnalyzing && (
          <div className="mr-8 bg-gray-800 rounded-lg p-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-blue-400">
                <Loader className="w-4 h-4 animate-spin" />
                <span className="text-sm">Analyzing error pattern...</span>
              </div>
              {searchingWeb && (
                <div className="flex items-center gap-2 text-green-400">
                  <Search className="w-4 h-4 animate-pulse" />
                  <span className="text-sm">Searching web for solutions...</span>
                </div>
              )}
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Example Errors */}
      <div className="p-4 border-t border-gray-700 bg-gray-800">
        <p className="text-gray-400 text-xs mb-2 font-semibold">Quick Examples:</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {exampleErrors.map((example, i) => (
            <button
              key={i}
              onClick={() => useExample(example.error)}
              className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-left transition-colors"
            >
              <div className="flex items-center gap-2 mb-1">
                <div className="text-yellow-400">{example.icon}</div>
                <span className="text-xs font-semibold text-gray-400">{example.category}</span>
              </div>
              <p className="text-white text-xs font-semibold truncate">{example.title}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-700 bg-gray-900">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste your error message, stack trace, or terminal output here..."
            className="flex-1 px-4 py-3 bg-gray-800 text-white border border-gray-700 rounded-lg focus:border-red-600 focus:outline-none resize-none font-mono text-sm"
            rows={3}
            disabled={isAnalyzing}
          />
          <button
            type="submit"
            disabled={!input.trim() || isAnalyzing}
            className="px-6 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 font-semibold"
          >
            {isAnalyzing ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Analyzing
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Analyze
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
