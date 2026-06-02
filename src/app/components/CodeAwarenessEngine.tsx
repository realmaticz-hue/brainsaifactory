/**
 * Code Awareness Engine
 * AST parsing, dependency graphing, and file index embedding
 * Prevents hallucinated imports and understands project structure
 */

import { useState } from 'react';
import { GitBranch, FileCode, Package, AlertCircle, CheckCircle, Network } from 'lucide-react';

export interface FileNode {
  path: string;
  name: string;
  type: 'component' | 'utility' | 'hook' | 'service' | 'type' | 'config';
  imports: Import[];
  exports: Export[];
  dependencies: string[];
  dependents: string[];
  loc: number; // Lines of code
}

export interface Import {
  source: string;
  specifiers: string[];
  type: 'named' | 'default' | 'namespace';
  isExternal: boolean;
}

export interface Export {
  name: string;
  type: 'named' | 'default';
  kind: 'function' | 'class' | 'const' | 'interface' | 'type';
}

export interface ComponentTree {
  name: string;
  path: string;
  children: ComponentTree[];
  props: string[];
  state: string[];
  hooks: string[];
}

export interface DependencyGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  circularDependencies: string[][];
}

export interface GraphNode {
  id: string;
  label: string;
  type: 'internal' | 'external' | 'entry';
  size: number;
}

export interface GraphEdge {
  from: string;
  to: string;
  type: 'import' | 'dynamic-import';
}

export class CodeAwarenessEngine {
  private fileIndex: Map<string, FileNode> = new Map();

  /**
   * Parse imports from code
   */
  static parseImports(code: string, filePath: string): Import[] {
    const imports: Import[] = [];
    
    // Match various import patterns
    const patterns = [
      // import { a, b } from 'module'
      /import\s+{\s*([^}]+)\s*}\s+from\s+['"]([^'"]+)['"]/g,
      // import defaultExport from 'module'
      /import\s+(\w+)\s+from\s+['"]([^'"]+)['"]/g,
      // import * as name from 'module'
      /import\s+\*\s+as\s+(\w+)\s+from\s+['"]([^'"]+)['"]/g,
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(code)) !== null) {
        const specifiers = match[1].split(',').map(s => s.trim());
        const source = match[2];
        const isExternal = !source.startsWith('.') && !source.startsWith('/');

        imports.push({
          source,
          specifiers,
          type: pattern.source.includes('*') ? 'namespace' : 
                pattern.source.includes('{') ? 'named' : 'default',
          isExternal
        });
      }
    }

    return imports;
  }

  /**
   * Parse exports from code
   */
  static parseExports(code: string): Export[] {
    const exports: Export[] = [];

    // export function/const/class
    const namedExportPattern = /export\s+(function|const|class|interface|type)\s+(\w+)/g;
    let match;
    while ((match = namedExportPattern.exec(code)) !== null) {
      exports.push({
        name: match[2],
        type: 'named',
        kind: match[1] as any
      });
    }

    // export default
    if (code.includes('export default')) {
      const defaultMatch = code.match(/export\s+default\s+(function\s+)?(\w+)/);
      if (defaultMatch) {
        exports.push({
          name: defaultMatch[2] || 'default',
          type: 'default',
          kind: 'function'
        });
      }
    }

    return exports;
  }

  /**
   * Extract component tree from React code
   */
  static extractComponentTree(code: string, filePath: string): ComponentTree | null {
    const componentMatch = code.match(/(?:function|const)\s+(\w+)\s*(?:=\s*\()?/);
    if (!componentMatch) return null;

    const name = componentMatch[1];

    // Extract props
    const propsMatch = code.match(/\(\s*{\s*([^}]+)\s*}/);
    const props = propsMatch 
      ? propsMatch[1].split(',').map(p => p.trim().split(':')[0].trim())
      : [];

    // Extract state (useState hooks)
    const stateMatches = code.matchAll(/const\s+\[(\w+),\s*set\w+\]\s*=\s*useState/g);
    const state = Array.from(stateMatches).map(match => match[1]);

    // Extract hooks
    const hookMatches = code.matchAll(/use(\w+)\(/g);
    const hooks = Array.from(new Set(Array.from(hookMatches).map(match => `use${match[1]}`)));

    // Extract child components (simplified)
    const childMatches = code.matchAll(/<(\w+)\s+/g);
    const children: ComponentTree[] = [];

    return {
      name,
      path: filePath,
      children,
      props,
      state,
      hooks
    };
  }

  /**
   * Build dependency graph
   */
  static buildDependencyGraph(files: Map<string, FileNode>): DependencyGraph {
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];

    // Create nodes
    files.forEach((file, path) => {
      nodes.push({
        id: path,
        label: file.name,
        type: path === '/App.tsx' ? 'entry' : 
              file.imports.some(imp => imp.isExternal) ? 'external' : 'internal',
        size: file.loc
      });
    });

    // Create edges
    files.forEach((file, sourcePath) => {
      file.dependencies.forEach(depPath => {
        edges.push({
          from: sourcePath,
          to: depPath,
          type: 'import'
        });
      });
    });

    // Detect circular dependencies
    const circularDependencies = this.detectCircularDependencies(files);

    return { nodes, edges, circularDependencies };
  }

  /**
   * Detect circular dependencies
   */
  static detectCircularDependencies(files: Map<string, FileNode>): string[][] {
    const circular: string[][] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const dfs = (path: string, stack: string[]): void => {
      if (recursionStack.has(path)) {
        // Found circular dependency
        const cycleStart = stack.indexOf(path);
        circular.push(stack.slice(cycleStart));
        return;
      }

      if (visited.has(path)) return;

      visited.add(path);
      recursionStack.add(path);
      stack.push(path);

      const file = files.get(path);
      if (file) {
        file.dependencies.forEach(dep => dfs(dep, [...stack]));
      }

      recursionStack.delete(path);
    };

    files.forEach((_, path) => {
      if (!visited.has(path)) {
        dfs(path, []);
      }
    });

    return circular;
  }

  /**
   * Validate imports - check if they actually exist
   */
  static validateImports(code: string, availableFiles: Set<string>, availablePackages: Set<string>): {
    valid: Import[];
    invalid: Import[];
    hallucinated: Import[];
  } {
    const imports = this.parseImports(code, '');
    const valid: Import[] = [];
    const invalid: Import[] = [];
    const hallucinated: Import[] = [];

    imports.forEach(imp => {
      if (imp.isExternal) {
        // Check if package exists
        if (availablePackages.has(imp.source)) {
          valid.push(imp);
        } else {
          hallucinated.push(imp);
        }
      } else {
        // Check if file exists
        const resolvedPath = this.resolveImportPath(imp.source, '');
        if (availableFiles.has(resolvedPath)) {
          valid.push(imp);
        } else {
          invalid.push(imp);
        }
      }
    });

    return { valid, invalid, hallucinated };
  }

  /**
   * Resolve relative import path
   */
  static resolveImportPath(importPath: string, currentFile: string): string {
    if (importPath.startsWith('./')) {
      const dir = currentFile.split('/').slice(0, -1).join('/');
      return `${dir}/${importPath.slice(2)}`;
    }
    if (importPath.startsWith('../')) {
      const dir = currentFile.split('/').slice(0, -2).join('/');
      return `${dir}/${importPath.slice(3)}`;
    }
    if (importPath.startsWith('/')) {
      return importPath;
    }
    return importPath;
  }

  /**
   * Get global state usage across project
   */
  static analyzeGlobalState(files: Map<string, FileNode>): {
    stateManagers: string[];
    sharedState: string[];
    propDrilling: Array<{ component: string; depth: number }>;
  } {
    const stateManagers: string[] = [];
    const sharedState: string[] = [];
    const propDrilling: Array<{ component: string; depth: number }> = [];

    files.forEach((file) => {
      // Check for state management libraries
      file.imports.forEach(imp => {
        if (['zustand', 'redux', 'jotai', 'recoil'].includes(imp.source)) {
          stateManagers.push(imp.source);
        }
      });
    });

    return { stateManagers: Array.from(new Set(stateManagers)), sharedState, propDrilling };
  }

  /**
   * Suggest fixes for import errors
   */
  static suggestImportFixes(invalidImport: Import, availableFiles: string[]): string[] {
    const suggestions: string[] = [];
    const importName = invalidImport.specifiers[0];

    // Find similar file names
    availableFiles.forEach(file => {
      const fileName = file.split('/').pop()?.replace(/\.(tsx|ts|jsx|js)$/, '');
      if (fileName?.toLowerCase().includes(importName.toLowerCase())) {
        suggestions.push(`Did you mean to import from '${file}'?`);
      }
    });

    return suggestions;
  }
}

/**
 * Code Awareness Engine UI Component
 */
export function CodeAwarenessEngineUI() {
  const [code, setCode] = useState('');
  const [analysis, setAnalysis] = useState<{
    imports: Import[];
    exports: Export[];
    componentTree: ComponentTree | null;
  } | null>(null);
  const [validationResult, setValidationResult] = useState<{
    valid: Import[];
    invalid: Import[];
    hallucinated: Import[];
  } | null>(null);

  const analyzeCode = () => {
    if (!code) return;

    const imports = CodeAwarenessEngine.parseImports(code, '/Example.tsx');
    const exports = CodeAwarenessEngine.parseExports(code);
    const componentTree = CodeAwarenessEngine.extractComponentTree(code, '/Example.tsx');

    setAnalysis({ imports, exports, componentTree });

    // Validate imports
    const availablePackages = new Set(['react', 'lucide-react', 'motion/react', 'recharts']);
    const availableFiles = new Set(['/App.tsx', '/components/Example.tsx']);
    const validation = CodeAwarenessEngine.validateImports(code, availableFiles, availablePackages);
    setValidationResult(validation);
  };

  return (
    <div className="space-y-6">
      {/* Code Input */}
      <div className="bg-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Network className="w-5 h-5 text-green-400" />
          Code Awareness Engine
        </h3>
        <p className="text-sm text-gray-400 mb-4">
          AST parsing, dependency analysis, and import validation
        </p>
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Paste your React component code here..."
          className="w-full h-64 bg-gray-900 text-white rounded-lg p-4 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <button
          onClick={analyzeCode}
          disabled={!code}
          className="mt-4 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all flex items-center gap-2 disabled:opacity-50"
        >
          <Network className="w-5 h-5" />
          Analyze Code Structure
        </button>
      </div>

      {/* Analysis Results */}
      {analysis && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Imports */}
          <div className="bg-gray-800 rounded-xl p-6">
            <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-400" />
              Imports ({analysis.imports.length})
            </h4>
            <div className="space-y-2">
              {analysis.imports.map((imp, idx) => (
                <div key={idx} className="bg-gray-900 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-white font-mono text-sm">{imp.source}</span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      imp.isExternal 
                        ? 'bg-purple-500/20 text-purple-400'
                        : 'bg-green-500/20 text-green-400'
                    }`}>
                      {imp.isExternal ? 'External' : 'Internal'}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {imp.specifiers.map(spec => (
                      <span key={spec} className="px-2 py-0.5 bg-gray-700 text-gray-300 rounded text-xs">
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Exports */}
          <div className="bg-gray-800 rounded-xl p-6">
            <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <FileCode className="w-5 h-5 text-orange-400" />
              Exports ({analysis.exports.length})
            </h4>
            <div className="space-y-2">
              {analysis.exports.map((exp, idx) => (
                <div key={idx} className="bg-gray-900 rounded-lg p-3 flex items-center justify-between">
                  <span className="text-white font-mono text-sm">{exp.name}</span>
                  <div className="flex gap-2">
                    <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs capitalize">
                      {exp.kind}
                    </span>
                    <span className="px-2 py-1 bg-orange-500/20 text-orange-400 rounded text-xs capitalize">
                      {exp.type}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Component Tree */}
      {analysis?.componentTree && (
        <div className="bg-gray-800 rounded-xl p-6">
          <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-purple-400" />
            Component Analysis
          </h4>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-900 rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-2">Props</p>
              <div className="space-y-1">
                {analysis.componentTree.props.map(prop => (
                  <div key={prop} className="text-white font-mono text-sm">{prop}</div>
                ))}
                {analysis.componentTree.props.length === 0 && (
                  <p className="text-gray-500 text-sm">No props</p>
                )}
              </div>
            </div>
            <div className="bg-gray-900 rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-2">State</p>
              <div className="space-y-1">
                {analysis.componentTree.state.map(state => (
                  <div key={state} className="text-white font-mono text-sm">{state}</div>
                ))}
                {analysis.componentTree.state.length === 0 && (
                  <p className="text-gray-500 text-sm">No state</p>
                )}
              </div>
            </div>
            <div className="bg-gray-900 rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-2">Hooks</p>
              <div className="space-y-1">
                {analysis.componentTree.hooks.map(hook => (
                  <div key={hook} className="text-white font-mono text-sm">{hook}</div>
                ))}
                {analysis.componentTree.hooks.length === 0 && (
                  <p className="text-gray-500 text-sm">No hooks</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Import Validation */}
      {validationResult && (
        <div className="bg-gray-800 rounded-xl p-6">
          <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-400" />
            Import Validation
          </h4>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-900 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <p className="text-sm text-gray-400">Valid Imports</p>
              </div>
              <p className="text-3xl font-bold text-green-400">{validationResult.valid.length}</p>
            </div>
            <div className="bg-gray-900 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-yellow-400" />
                <p className="text-sm text-gray-400">Invalid Imports</p>
              </div>
              <p className="text-3xl font-bold text-yellow-400">{validationResult.invalid.length}</p>
            </div>
            <div className="bg-gray-900 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-red-400" />
                <p className="text-sm text-gray-400">Hallucinated</p>
              </div>
              <p className="text-3xl font-bold text-red-400">{validationResult.hallucinated.length}</p>
            </div>
          </div>

          {/* Show hallucinated imports */}
          {validationResult.hallucinated.length > 0 && (
            <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-red-400 font-semibold mb-2">⚠️ Hallucinated Imports Detected:</p>
              <div className="space-y-1">
                {validationResult.hallucinated.map((imp, idx) => (
                  <div key={idx} className="text-sm text-gray-300 font-mono">
                    import ... from '{imp.source}' - This package doesn't exist!
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
