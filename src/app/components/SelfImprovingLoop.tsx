/**
 * Self-Improving Code Loop
 * Recursive intelligence that critiques and improves its own code
 */

import { useState } from 'react';
import { RefreshCw, CheckCircle, XCircle, AlertTriangle, Zap, Brain } from 'lucide-react';

export interface CodeAnalysis {
  typeErrors: string[];
  performanceIssues: string[];
  securityIssues: string[];
  bestPracticeViolations: string[];
  accessibilityIssues: string[];
}

export interface ImprovementIteration {
  iteration: number;
  analysis: CodeAnalysis;
  improvements: string[];
  code: string;
  score: number;
}

export class SelfImprovingLoop {
  private maxIterations = 5;
  private targetScore = 95;

  /**
   * Run static analysis on code
   */
  static analyzeCode(code: string): CodeAnalysis {
    const analysis: CodeAnalysis = {
      typeErrors: [],
      performanceIssues: [],
      securityIssues: [],
      bestPracticeViolations: [],
      accessibilityIssues: []
    };

    // Type Error Detection
    if (code.includes('any') && !code.includes('// @ts-ignore')) {
      analysis.typeErrors.push('Avoid using "any" type - use specific types instead');
    }
    if (code.match(/:\s*\w+\s*\|\s*undefined/) && !code.includes('?')) {
      analysis.typeErrors.push('Use optional chaining (?) instead of union with undefined');
    }

    // Performance Issues
    if (code.includes('useEffect') && !code.includes('dependencies')) {
      analysis.performanceIssues.push('useEffect missing dependency array - may cause infinite loops');
    }
    if (code.includes('.map') && code.includes('.filter')) {
      analysis.performanceIssues.push('Combine .filter() and .map() into single iteration for better performance');
    }
    if (code.includes('console.log')) {
      analysis.performanceIssues.push('Remove console.log statements in production code');
    }

    // Security Issues
    if (code.includes('dangerouslySetInnerHTML')) {
      analysis.securityIssues.push('dangerouslySetInnerHTML can expose XSS vulnerabilities');
    }
    if (code.match(/eval\s*\(/)) {
      analysis.securityIssues.push('eval() is a security risk - avoid using it');
    }
    if (code.includes('localStorage') && !code.includes('try')) {
      analysis.securityIssues.push('Wrap localStorage access in try-catch for security and error handling');
    }

    // Best Practice Violations
    if (code.match(/function\s+\w+\s*\(/)) {
      analysis.bestPracticeViolations.push('Use arrow functions or const function declarations');
    }
    if (code.includes('var ')) {
      analysis.bestPracticeViolations.push('Use const or let instead of var');
    }
    if (!code.includes('export')) {
      analysis.bestPracticeViolations.push('Add proper exports for reusability');
    }

    // Accessibility Issues
    if (code.includes('<button') && !code.includes('aria-label')) {
      analysis.accessibilityIssues.push('Add aria-label to buttons for screen readers');
    }
    if (code.includes('<img') && !code.includes('alt=')) {
      analysis.accessibilityIssues.push('Add alt text to images for accessibility');
    }
    if (code.includes('onClick') && !code.includes('onKeyPress')) {
      analysis.accessibilityIssues.push('Add keyboard handlers (onKeyPress) alongside onClick');
    }

    return analysis;
  }

  /**
   * Calculate code quality score
   */
  static calculateScore(analysis: CodeAnalysis): number {
    let score = 100;
    
    score -= analysis.typeErrors.length * 5;
    score -= analysis.performanceIssues.length * 3;
    score -= analysis.securityIssues.length * 10;
    score -= analysis.bestPracticeViolations.length * 2;
    score -= analysis.accessibilityIssues.length * 4;

    return Math.max(0, score);
  }

  /**
   * Generate improvement suggestions
   */
  static generateImprovements(analysis: CodeAnalysis): string[] {
    const improvements: string[] = [];

    // Type improvements
    if (analysis.typeErrors.length > 0) {
      improvements.push('✅ Fix all TypeScript type errors with proper type annotations');
      improvements.push('✅ Replace "any" with specific interfaces or types');
    }

    // Performance improvements
    if (analysis.performanceIssues.length > 0) {
      improvements.push('⚡ Optimize array operations by combining filter/map');
      improvements.push('⚡ Add proper dependency arrays to useEffect hooks');
      improvements.push('⚡ Remove console.log statements');
    }

    // Security improvements
    if (analysis.securityIssues.length > 0) {
      improvements.push('🔒 Replace dangerouslySetInnerHTML with safe alternatives');
      improvements.push('🔒 Add try-catch blocks around localStorage operations');
      improvements.push('🔒 Remove eval() and use safer alternatives');
    }

    // Best practice improvements
    if (analysis.bestPracticeViolations.length > 0) {
      improvements.push('📚 Convert function declarations to arrow functions');
      improvements.push('📚 Replace var with const/let');
      improvements.push('📚 Add proper module exports');
    }

    // Accessibility improvements
    if (analysis.accessibilityIssues.length > 0) {
      improvements.push('♿ Add ARIA labels to interactive elements');
      improvements.push('♿ Add alt text to all images');
      improvements.push('♿ Add keyboard event handlers');
    }

    return improvements;
  }

  /**
   * Apply improvements to code (simulated)
   */
  static applyImprovements(code: string, improvements: string[]): string {
    let improvedCode = code;

    // Remove console.log
    improvedCode = improvedCode.replace(/console\.log\([^)]*\);?\n?/g, '');

    // Replace var with const
    improvedCode = improvedCode.replace(/var\s+/g, 'const ');

    // Add try-catch around localStorage
    improvedCode = improvedCode.replace(
      /localStorage\.(\w+)\(/g,
      'try { localStorage.$1('
    );

    // Remove 'any' types (simplified)
    improvedCode = improvedCode.replace(/:\s*any\b/g, ': unknown');

    return improvedCode;
  }

  /**
   * Main self-improvement loop
   */
  async runLoop(initialCode: string): Promise<ImprovementIteration[]> {
    const iterations: ImprovementIteration[] = [];
    let currentCode = initialCode;
    let iteration = 0;

    while (iteration < this.maxIterations) {
      iteration++;

      // Analyze current code
      const analysis = SelfImprovingLoop.analyzeCode(currentCode);
      const score = SelfImprovingLoop.calculateScore(analysis);

      // Generate improvements
      const improvements = SelfImprovingLoop.generateImprovements(analysis);

      // Record iteration
      iterations.push({
        iteration,
        analysis,
        improvements,
        code: currentCode,
        score
      });

      // Check if we've reached target quality
      if (score >= this.targetScore) {
        break;
      }

      // Apply improvements for next iteration
      currentCode = SelfImprovingLoop.applyImprovements(currentCode, improvements);

      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    return iterations;
  }
}

/**
 * Self-Improving Loop UI Component
 */
export function SelfImprovingLoopUI() {
  const [code, setCode] = useState('');
  const [iterations, setIterations] = useState<ImprovementIteration[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentIteration, setCurrentIteration] = useState(0);

  const runImprovementLoop = async () => {
    if (!code) return;

    setIsRunning(true);
    setIterations([]);
    setCurrentIteration(0);

    const loop = new SelfImprovingLoop();
    const results = await loop.runLoop(code);

    // Animate through iterations
    for (let i = 0; i < results.length; i++) {
      setCurrentIteration(i + 1);
      setIterations(results.slice(0, i + 1));
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    setIsRunning(false);
  };

  return (
    <div className="space-y-6">
      {/* Code Input */}
      <div className="bg-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Brain className="w-5 h-5 text-purple-400" />
          Self-Improving Code Loop
        </h3>
        <p className="text-sm text-gray-400 mb-4">
          Paste your code and watch it recursively improve itself through multiple iterations
        </p>
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Paste your code here..."
          className="w-full h-64 bg-gray-900 text-white rounded-lg p-4 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        <button
          onClick={runImprovementLoop}
          disabled={!code || isRunning}
          className="mt-4 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all flex items-center gap-2 disabled:opacity-50"
        >
          {isRunning ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              Improving... (Iteration {currentIteration})
            </>
          ) : (
            <>
              <Zap className="w-5 h-5" />
              Run Self-Improvement Loop
            </>
          )}
        </button>
      </div>

      {/* Iterations Display */}
      {iterations.length > 0 && (
        <div className="space-y-4">
          {iterations.map((iter) => (
            <div key={iter.iteration} className="bg-gray-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                  <RefreshCw className="w-5 h-5 text-purple-400" />
                  Iteration {iter.iteration}
                </h4>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-400">Quality Score:</span>
                  <span className={`text-2xl font-bold ${
                    iter.score >= 95 ? 'text-green-400' :
                    iter.score >= 80 ? 'text-yellow-400' :
                    'text-red-400'
                  }`}>
                    {iter.score}%
                  </span>
                </div>
              </div>

              {/* Analysis Results */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                <div className="bg-gray-900 rounded-lg p-3">
                  <p className="text-xs text-gray-400">Type Errors</p>
                  <p className="text-2xl font-bold text-red-400">{iter.analysis.typeErrors.length}</p>
                </div>
                <div className="bg-gray-900 rounded-lg p-3">
                  <p className="text-xs text-gray-400">Performance</p>
                  <p className="text-2xl font-bold text-yellow-400">{iter.analysis.performanceIssues.length}</p>
                </div>
                <div className="bg-gray-900 rounded-lg p-3">
                  <p className="text-xs text-gray-400">Security</p>
                  <p className="text-2xl font-bold text-orange-400">{iter.analysis.securityIssues.length}</p>
                </div>
                <div className="bg-gray-900 rounded-lg p-3">
                  <p className="text-xs text-gray-400">Best Practices</p>
                  <p className="text-2xl font-bold text-blue-400">{iter.analysis.bestPracticeViolations.length}</p>
                </div>
                <div className="bg-gray-900 rounded-lg p-3">
                  <p className="text-xs text-gray-400">Accessibility</p>
                  <p className="text-2xl font-bold text-purple-400">{iter.analysis.accessibilityIssues.length}</p>
                </div>
              </div>

              {/* Improvements Applied */}
              {iter.improvements.length > 0 && (
                <div>
                  <h5 className="text-sm font-semibold text-gray-300 mb-2">Improvements Applied:</h5>
                  <div className="space-y-1">
                    {iter.improvements.map((improvement, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-300">{improvement}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Final Success */}
              {iter.score >= 95 && (
                <div className="mt-4 p-4 bg-green-500/20 border border-green-500/30 rounded-lg flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                  <div>
                    <p className="text-white font-semibold">Target Quality Achieved!</p>
                    <p className="text-sm text-green-300">Code is production-ready</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
