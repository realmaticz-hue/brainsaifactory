// ─── Git Repair: Missing File Synthesizer ─────────────────────────────────────
// Scans all uploaded files for import/export references, identifies files that
// are imported but do not exist in the uploaded set, generates full stub
// implementations for every missing file, and detects files that may be living
// in the wrong directory.  All generated files are included in the ZIP download.

import type { RepoFile } from './gitRepairTypes';

// ────────────────────────────────────────────────────────────────────────────────
// 1. IMPORT GRAPH – resolve every local import to a canonical path
// ────────────────────────────────────────────────────────────────────────────────

/** Resolve a relative import path to an absolute repo path. */
function resolveImport(importPath: string, fromFile: string): string {
  if (!importPath.startsWith('.')) return ''; // skip node_modules
  const dir = fromFile.split('/').slice(0, -1).join('/');
  const raw = dir ? `${dir}/${importPath}` : importPath;
  const parts = raw.split('/');
  const out: string[] = [];
  for (const p of parts) {
    if (p === '..') out.pop();
    else if (p !== '.') out.push(p);
  }
  return out.join('/');
}

/** Try to match a base path against the known file set. */
function matchInSet(base: string, paths: Set<string>): string | null {
  if (paths.has(base)) return base;
  const exts = ['.ts', '.tsx', '.js', '.jsx', '.mts', '.mjs'];
  for (const ext of exts) {
    if (paths.has(base + ext)) return base + ext;
  }
  for (const ext of exts) {
    if (paths.has(`${base}/index${ext}`)) return `${base}/index${ext}`;
  }
  return null;
}

export interface ImportRef {
  fromFile: string;
  importPath: string;           // raw string from the import statement
  resolved: string;             // resolved absolute path (no extension)
  namedImports: string[];       // e.g. ['useAuth', 'AuthUser']
  defaultImport: string;        // e.g. 'AuthProvider'
  isTypeOnly: boolean;
}

/** Extract all local import references from a file's content. */
export function extractImports(filePath: string, content: string): ImportRef[] {
  const refs: ImportRef[] = [];
  const lines = content.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('import')) continue;

    // import type { X } from './path'   OR   import { X } from './path'
    const fullMatch = trimmed.match(
      /^import\s+(type\s+)?(\{[^}]*\}|[A-Za-z_$][\w$]*|\*\s+as\s+[A-Za-z_$][\w$]*)\s+from\s+['"]([^'"]+)['"]/
    );
    // import './path'  or  import './path.css'
    const bareMatch = !fullMatch && trimmed.match(/^import\s+['"]([^'"]+)['"]/);

    const rawPath = fullMatch ? fullMatch[3] : bareMatch ? bareMatch[1] : null;
    if (!rawPath || !rawPath.startsWith('.')) continue;

    const isTypeOnly = !!(fullMatch && fullMatch[1]);
    let namedImports: string[] = [];
    let defaultImport = '';

    if (fullMatch) {
      const specifier = fullMatch[2].trim();
      if (specifier.startsWith('{')) {
        namedImports = specifier
          .replace(/[{}]/g, '')
          .split(',')
          .map(s => s.trim().split(/\s+as\s+/).pop()?.trim() ?? '')
          .filter(s => s && /^[A-Za-z_$]/.test(s));
      } else if (!specifier.startsWith('*')) {
        defaultImport = specifier;
      }
    }

    const resolved = resolveImport(rawPath, filePath);
    if (resolved) {
      refs.push({ fromFile: filePath, importPath: rawPath, resolved, namedImports, defaultImport, isTypeOnly });
    }
  }
  return refs;
}

// ────────────────────────────────────────────────────────────────────────────────
// 2. MISSING FILE DETECTION
// ────────────────────────────────────────────────────────────────────────────────

export interface MissingFile {
  path: string;                  // suggested canonical path WITH extension
  basePath: string;              // resolved path without extension
  refs: ImportRef[];             // all import references pointing to this file
  namedExports: string[];        // all named symbols expected by importers
  defaultExport: string;         // default export expected (e.g. component name)
  kind: 'component' | 'hook' | 'util' | 'type' | 'context' | 'api' | 'store' | 'config' | 'page' | 'unknown';
  generatedContent: string;      // full stub content ready to write
}

function detectKind(base: string, namedExports: string[], defaultExport: string): MissingFile['kind'] {
  const p = base.toLowerCase();
  if (p.includes('/hooks/') || /\/use[A-Z]/.test(base) || defaultExport.startsWith('use') ||
      namedExports.some(n => n.startsWith('use'))) return 'hook';
  if (p.includes('/context') || p.includes('/provider') ||
      namedExports.some(n => n.includes('Context') || n.includes('Provider'))) return 'context';
  if (p.includes('/store') || p.includes('/slice') || p.includes('/redux') ||
      namedExports.some(n => n.includes('Slice') || n.includes('Store') || n.includes('Reducer'))) return 'store';
  if (p.includes('/api/') || p.includes('/routes/') || p.includes('/handlers/')) return 'api';
  if (p.includes('/types') || p.includes('/interfaces') ||
      namedExports.every(n => /^[A-Z]/.test(n) && !/^use/.test(n)) &&
      namedExports.length > 0 && !defaultExport) return 'type';
  if (p.endsWith('.tsx') || p.endsWith('.jsx') || /\/components?\//.test(base) ||
      /\/pages?\//.test(base) || /^[A-Z]/.test(base.split('/').pop() ?? '') && !p.includes('/hooks')) return 'component';
  if (p.includes('/pages/') || p.includes('/views/') || p.includes('/screens/')) return 'page';
  if (p.includes('/config') || p.includes('/constants') || p.includes('/settings')) return 'config';
  return 'util';
}

function choosePath(base: string, kind: MissingFile['kind'], refs: ImportRef[]): string {
  // If the original import had an explicit extension, trust it
  const rawPaths = refs.map(r => r.importPath);
  for (const raw of rawPaths) {
    if (/\.(ts|tsx|js|jsx|mts|mjs)$/.test(raw)) {
      return resolveImport(raw, refs[0].fromFile);
    }
  }
  const usesTsx = kind === 'component' || kind === 'page' || kind === 'context';
  return base + (usesTsx ? '.tsx' : '.ts');
}

// ────────────────────────────────────────────────────────────────────────────────
// 3. STUB CONTENT GENERATION
// ────────────────────────────────────────────────────────────────────────────────

function generateStubContent(missing: Omit<MissingFile, 'generatedContent'>): string {
  const { path, namedExports, defaultExport, kind } = missing;
  const name = defaultExport || (namedExports[0] ?? path.split('/').pop()?.replace(/\.(ts|tsx|js|jsx)$/, '') ?? 'Module');
  const isTSX = path.endsWith('.tsx') || path.endsWith('.jsx');

  const header = `// AUTO-GENERATED by Git Repair — missing file stub\n// Original path: ${path}\n// TODO: Replace stub with real implementation\n\n`;

  // ── Type / interface file ──────────────────────────────────────────────────
  if (kind === 'type') {
    const exports = namedExports.map(n => {
      if (/^[A-Z]/.test(n)) return `export interface ${n} {\n  // TODO: define ${n} properties\n  [key: string]: unknown;\n}`;
      return `export type ${n} = unknown; // TODO: define ${n}`;
    }).join('\n\n');
    return header + (exports || `export type ${name} = unknown;\n`);
  }

  // ── Custom hook ────────────────────────────────────────────────────────────
  if (kind === 'hook') {
    const hookName = defaultExport.startsWith('use') ? defaultExport
      : namedExports.find(n => n.startsWith('use')) ?? `use${name.replace(/^use/, '')}`;
    const namedExportsCode = namedExports
      .filter(n => !n.startsWith('use'))
      .map(n => `export type ${n} = unknown; // TODO: define ${n}`)
      .join('\n');
    return `${header}import { useState, useEffect, useCallback } from 'react';\n\n${namedExportsCode ? namedExportsCode + '\n\n' : ''}export function ${hookName}() {\n  // TODO: implement ${hookName}\n  const [data, setData] = useState<unknown>(null);\n  const [loading, setLoading] = useState(false);\n  const [error, setError] = useState<Error | null>(null);\n\n  useEffect(() => {\n    // TODO: fetch or compute data\n  }, []);\n\n  return { data, loading, error };\n}\n${defaultExport && defaultExport.startsWith('use') ? `\nexport default ${hookName};\n` : ''}`;
  }

  // ── Context / Provider ─────────────────────────────────────────────────────
  if (kind === 'context') {
    const ctxName = name.replace(/Provider$/, '').replace(/Context$/, '');
    return `${header}import { createContext, useContext, useState, ReactNode } from 'react';\n\n// TODO: define the context value type\ninterface ${ctxName}ContextType {\n  // add your context fields here\n  [key: string]: unknown;\n}\n\nconst ${ctxName}Context = createContext<${ctxName}ContextType | null>(null);\n\nexport function ${ctxName}Provider({ children }: { children: ReactNode }) {\n  // TODO: provide real context value\n  const value: ${ctxName}ContextType = {};\n  return (\n    <${ctxName}Context.Provider value={value}>\n      {children}\n    </${ctxName}Context.Provider>\n  );\n}\n\nexport function use${ctxName}() {\n  const ctx = useContext(${ctxName}Context);\n  if (!ctx) throw new Error('use${ctxName} must be used within ${ctxName}Provider');\n  return ctx;\n}\n\nexport default ${ctxName}Context;\n`;
  }

  // ── Zustand / Redux store ─────────────────────────────────────────────────
  if (kind === 'store') {
    const namedCode = namedExports.map(n =>
      `export const ${n} = null; // TODO: implement ${n}`
    ).join('\n');
    return `${header}// TODO: implement store\n// Suggested: use Zustand (npm install zustand) or Redux Toolkit\n\n${namedCode}\n`;
  }

  // ── API route / handler ────────────────────────────────────────────────────
  if (kind === 'api') {
    return `${header}// TODO: implement API handler\nexport async function GET(request: Request) {\n  return Response.json({ message: 'TODO: implement GET' });\n}\n\nexport async function POST(request: Request) {\n  const body = await request.json();\n  return Response.json({ message: 'TODO: implement POST', body });\n}\n`;
  }

  // ── Config / constants ─────────────────────────────────────────────────────
  if (kind === 'config') {
    const namedCode = namedExports.map(n =>
      `export const ${n} = ${/^[A-Z_]+$/.test(n) ? "'TODO'" : 'null'}; // TODO: set ${n}`
    ).join('\n');
    return `${header}${namedCode || `export const config = {}; // TODO: add config values`}\n`;
  }

  // ── React Component (component / page / default) ───────────────────────────
  if (isTSX || kind === 'component' || kind === 'page') {
    const compName = defaultExport || (namedExports.find(n => /^[A-Z]/.test(n)) ?? name);
    const otherNamedExports = namedExports
      .filter(n => n !== compName)
      .map(n => {
        if (/^[A-Z]/.test(n)) {
          return `\nexport function ${n}() {\n  return <div className="p-4 text-gray-400">{/* TODO: implement ${n} */}</div>;\n}\n`;
        }
        return `\nexport const ${n} = null; // TODO: implement ${n}\n`;
      }).join('');

    return `${header}import React from 'react';\n\n// TODO: define props\ninterface ${compName}Props {\n  [key: string]: unknown;\n}\n${otherNamedExports}\nexport function ${compName}({ ...props }: ${compName}Props) {\n  return (\n    <div className="p-4 rounded-xl border border-dashed border-gray-600 text-center">\n      <p className="text-gray-400 text-sm">🔧 {/* TODO: implement ${compName} */}</p>\n      <p className="text-xs text-gray-600 mt-1">{JSON.stringify(props)}</p>\n    </div>\n  );\n}\n\nexport default ${compName};\n`;
  }

  // ── Generic utility ────────────────────────────────────────────────────────
  const namedCode = namedExports.map(n => {
    if (/^[A-Z]/.test(n)) return `export interface ${n} {}\n// TODO: implement ${n} interface`;
    return `export function ${n}(..._args: unknown[]): unknown {\n  // TODO: implement ${n}\n  throw new Error('${n} not yet implemented');\n}`;
  }).join('\n\n');

  const defaultCode = defaultExport && !/^[A-Z]/.test(defaultExport)
    ? `\nexport function ${defaultExport}(..._args: unknown[]): unknown {\n  // TODO: implement ${defaultExport}\n  throw new Error('${defaultExport} not yet implemented');\n}\n\nexport default ${defaultExport};\n`
    : '';

  return `${header}${namedCode || '// TODO: implement module exports'}\n${defaultCode}`;
}

// ────────────────────────────────────────────────────────────────────────────────
// 4. WRONG-FOLDER DETECTION
// ────────────────────────────────────────────────────────────────────────────────

export interface WrongFolderFile {
  originalPath: string;
  suggestedPath: string;
  reason: string;
}

export function detectWrongFolderFiles(
  files: RepoFile[],
  contents: Map<string, string>,
): WrongFolderFile[] {
  const results: WrongFolderFile[] = [];
  const seen = new Set<string>();

  for (const file of files) {
    if (seen.has(file.path)) continue;
    const content = contents.get(file.path) ?? '';
    const filename = file.path.split('/').pop() ?? '';
    const dir = file.path.split('/').slice(0, -1).join('/');

    // ── Hook not in /hooks/ ──────────────────────────────────────────────────
    if (/^use[A-Z]/.test(filename) && (filename.endsWith('.ts') || filename.endsWith('.tsx'))) {
      if (!file.path.includes('/hooks/') && !file.path.includes('/hook/')) {
        const suggested = dir.replace(/\/(components?|utils?|lib|pages?|src)\/?$/, '') + '/hooks/' + filename;
        results.push({ originalPath: file.path, suggestedPath: suggested, reason: `Custom hook "${filename}" should live in a /hooks/ directory` });
        seen.add(file.path);
        continue;
      }
    }

    // ── React component (.tsx with JSX) in /utils/ or /lib/ ─────────────────
    if (file.path.endsWith('.tsx') && (file.path.includes('/utils/') || file.path.includes('/lib/'))) {
      const hasJSX = /<[A-Z][A-Za-z]*[\s/>]|return\s*\(/.test(content);
      if (hasJSX) {
        const suggested = file.path.replace(/\/(utils|lib)\//, '/components/');
        results.push({ originalPath: file.path, suggestedPath: suggested, reason: `React component "${filename}" found in /utils/ — should be in /components/` });
        seen.add(file.path);
        continue;
      }
    }

    // ── Type-only file (.ts with only interfaces/types) in /components/ ──────
    if (file.path.includes('/components/') && file.path.endsWith('.ts') && !file.path.endsWith('.tsx')) {
      const hasOnlyTypes = /^export\s+(type|interface)\b/.test(content) &&
        !/^export\s+(function|const|class|let|var|default)\b/.test(content);
      if (hasOnlyTypes) {
        const suggested = file.path.replace('/components/', '/types/');
        results.push({ originalPath: file.path, suggestedPath: suggested, reason: `Type-only file "${filename}" found in /components/ — should be in /types/` });
        seen.add(file.path);
        continue;
      }
    }

    // ── Server-only utility with "use client" in wrong folder ─────────────────
    const top = content.slice(0, 200).trim();
    if ((top.startsWith('"use client"') || top.startsWith("'use client'")) &&
        (file.path.includes('/server/') || file.path.includes('/api/'))) {
      const suggested = file.path.replace(/\/(server|api)\//, '/components/');
      results.push({ originalPath: file.path, suggestedPath: suggested, reason: `File "${filename}" has "use client" but lives in ${file.path.includes('/server/') ? '/server/' : '/api/'} — move to /components/` });
      seen.add(file.path);
    }
  }

  return results;
}

// ────────────────────────────────────────────────────────────────────────────────
// 5. MAIN ENTRY POINT
// ────────────────────────────────────────────────────────────────────────────────

export function synthesizeMissingFiles(
  files: RepoFile[],
  contents: Map<string, string>,
): MissingFile[] {
  const knownPaths = new Set(files.map(f => f.path));
  const missingMap = new Map<string, ImportRef[]>(); // base → refs

  // Build import graph across all files
  for (const file of files) {
    const content = contents.get(file.path) ?? '';
    const ext = file.path.split('.').pop()?.toLowerCase() ?? '';
    if (!['ts','tsx','js','jsx','mts','mjs'].includes(ext)) continue;
    if (content.length < 5) continue;

    const refs = extractImports(file.path, content);
    for (const ref of refs) {
      if (!ref.resolved) continue;
      // Skip .css/.scss/.json/.svg/.png etc.
      if (/\.(css|scss|sass|less|json|svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|eot)$/.test(ref.resolved)) continue;
      if (matchInSet(ref.resolved, knownPaths)) continue; // already exists

      // Also skip if the raw import clearly has a media extension
      if (/\.(css|scss|json|svg|png|jpg|jpeg|gif|webp)$/.test(ref.importPath)) continue;

      const existing = missingMap.get(ref.resolved) ?? [];
      existing.push(ref);
      missingMap.set(ref.resolved, existing);
    }
  }

  const result: MissingFile[] = [];

  for (const [base, refs] of missingMap) {
    const namedExports = [...new Set(refs.flatMap(r => r.namedImports))];
    const defaultExport = refs.find(r => r.defaultImport)?.defaultImport ?? '';

    const kind = detectKind(base, namedExports, defaultExport);
    const path = choosePath(base, kind, refs);

    // Don't re-generate something that's already in the known set
    if (matchInSet(path, knownPaths)) continue;

    const partial: Omit<MissingFile, 'generatedContent'> = {
      path, basePath: base, refs, namedExports, defaultExport, kind,
    };
    const generatedContent = generateStubContent(partial);

    result.push({ ...partial, generatedContent });
  }

  // Sort: type files first, then hooks, then components, then utils
  const ORDER: Record<MissingFile['kind'], number> = {
    type: 0, config: 1, hook: 2, context: 3, store: 4, component: 5, page: 6, api: 7, util: 8, unknown: 9,
  };
  result.sort((a, b) => ORDER[a.kind] - ORDER[b.kind] || a.path.localeCompare(b.path));

  return result;
}

/** Build a human-readable summary row for the repair log. */
export function missingFileSummary(missing: MissingFile[]): string {
  if (missing.length === 0) return '✅ No missing imports detected — all referenced files exist in the upload.';
  const byKind = missing.reduce<Record<string, number>>((acc, f) => {
    acc[f.kind] = (acc[f.kind] ?? 0) + 1; return acc;
  }, {});
  const breakdown = Object.entries(byKind).map(([k, n]) => `${n} ${k}${n > 1 ? 's' : ''}`).join(', ');
  return `⚠️ ${missing.length} missing file${missing.length > 1 ? 's' : ''} synthesised: ${breakdown}`;
}

/** Apply wrong-folder rewrites to the contents map (clones entries to new paths). */
export function applyFolderRewrites(
  wrongFolderFiles: WrongFolderFile[],
  contents: Map<string, string>,
): Map<string, string> {
  const updated = new Map(contents);
  for (const wf of wrongFolderFiles) {
    const content = updated.get(wf.originalPath);
    if (content !== undefined) {
      updated.set(wf.suggestedPath, content);
      // Keep original too so existing imports still resolve during repair
    }
  }
  return updated;
}
