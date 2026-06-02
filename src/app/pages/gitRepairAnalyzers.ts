// ─── GitRepair Analyzer Functions ─────────────────────────────────────────────
import type {
  RepoFile, DetectedError, ErrorSource, ErrorSeverity, FixStatus,
  BuildLogError, TurbopackInfo, AppTypeInfo, DependencyIssue, DependencyReport,
  TailwindMigrationFile, TailwindMigration,
} from './gitRepairTypes';

// ─── GitHub API helpers ────────────────────────────────────────────────────────

export function decodeBase64Safe(b64: string): string {
  try {
    const binStr = atob(b64);
    const bytes = new Uint8Array(binStr.length);
    for (let i = 0; i < binStr.length; i++) bytes[i] = binStr.charCodeAt(i);
    return new TextDecoder('utf-8', { fatal: false }).decode(bytes);
  } catch {
    try { return atob(b64); } catch { return ''; }
  }
}

export function classifyFile(path: string): RepoFile['type'] {
  const p = path.toLowerCase();
  if (p.includes('__tests__') || p.includes('.test.') || p.includes('.spec.')) return 'test';
  if (p.endsWith('.css') || p.endsWith('.scss') || p.endsWith('.less') || p.endsWith('.sass')) return 'style';
  if (p.endsWith('.json') || p.includes('tsconfig') || p.includes('webpack') ||
      p.includes('vite.config') || p.includes('next.config') || p.endsWith('.yaml') || p.endsWith('.yml')) return 'config';
  if (p.includes('/api/') || p.includes('/routes/') || p.includes('/server/') || p.includes('/handlers/')) return 'api';
  if (p.includes('/pages/') || p.includes('/views/') || p.includes('/screens/') || p.includes('/app/')) return 'page';
  if (p.includes('/hooks/') || p.includes('/utils/') || p.includes('/helpers/') || p.includes('/lib/') || p.includes('/services/')) return 'util';
  if (p.endsWith('.tsx') || p.endsWith('.jsx') || p.includes('/components/')) return 'component';
  return 'util';
}

// ─── Real file content scanner ─────────────────────────────────────────────────
export function detectContentIssues(path: string, content: string): DetectedError[] {
  const issues: DetectedError[] = [];
  const ext = path.split('.').pop()?.toLowerCase() ?? '';
  const isTS = ext === 'ts' || ext === 'tsx';
  const isJS = isTS || ext === 'js' || ext === 'jsx';
  if (!isJS || content.length < 10) return [];

  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (issues.length >= 4) return;
    const lineNum = idx + 1;
    const tr = line.trim();
    if (!tr || tr.startsWith('//') || tr.startsWith('*')) return;

    if (isTS && (tr.includes(': any') || tr.includes('as any')) && !tr.includes('// ok')) {
      issues.push({
        id: `${path}:${lineNum}:any`, source: 'typescript', severity: 'warning',
        file: path, line: lineNum, code: 'TS7006',
        message: "Unsafe 'any' type — loses TypeScript safety",
        rootCause: `Explicit 'any' on line ${lineNum} bypasses type checking, hiding potential runtime errors.`,
        suggestion: "Replace with 'unknown' and add a type guard, or use a proper interface/type.",
        autoFixable: true, fixStatus: 'pending',
        originalCode: tr,
        fixedCode: tr.replace(/: any\b/g, ': unknown').replace(/\bas any\b/g, 'as unknown'),
      });
    } else if (isTS && (tr.includes('@ts-ignore') || tr.includes('@ts-nocheck'))) {
      issues.push({
        id: `${path}:${lineNum}:tsignore`, source: 'typescript', severity: 'error',
        file: path, line: lineNum, code: 'TS-SUPPRESS',
        message: "@ts-ignore / @ts-nocheck silences real type errors",
        rootCause: `TypeScript suppression on line ${lineNum} hides underlying type violations that may cause runtime crashes.`,
        suggestion: "Fix the underlying type error and remove the suppression comment.",
        autoFixable: false, fixStatus: 'pending',
      });
    } else if (isJS && tr.match(/useEffect\s*\(\s*\(\s*\)\s*=>/)) {
      const block = lines.slice(idx, idx + 12).join('\n');
      if (block.includes('}, [])') || block.includes('}, [ ])')) {
        issues.push({
          id: `${path}:${lineNum}:effect-deps`, source: 'eslint', severity: 'error',
          file: path, line: lineNum, code: 'react-hooks/exhaustive-deps',
          message: "useEffect empty dependency array — stale closure risk",
          rootCause: `useEffect on line ${lineNum} captures variables in its closure but declares no dependencies, causing stale reads after re-renders.`,
          suggestion: "Add all captured state/props to the deps array, or use useCallback to stabilise the callback.",
          autoFixable: false, fixStatus: 'pending',
        });
      }
    } else if (isJS && tr.match(/console\.(log|warn|error)\s*\(/) && !path.includes('.test.') && !path.includes('.spec.')) {
      issues.push({
        id: `${path}:${lineNum}:console`, source: 'lint', severity: 'warning',
        file: path, line: lineNum, code: 'no-console',
        message: "console statement should be removed before production",
        rootCause: `console.log on line ${lineNum} exposes internal state in users' browser DevTools in production.`,
        suggestion: "Remove the console call or replace with a structured logger (e.g. Sentry, LogRocket).",
        autoFixable: true, fixStatus: 'pending',
        originalCode: tr,
        fixedCode: `// ${tr}  // TODO: remove before release`,
      });
    } else if (tr.match(/\/\/\s*(TODO|FIXME|HACK|BUG)\b/i)) {
      const tag = tr.match(/TODO|FIXME|HACK|BUG/i)?.[0] ?? 'TODO';
      issues.push({
        id: `${path}:${lineNum}:${tag}`, source: 'lint', severity: 'info',
        file: path, line: lineNum, code: 'no-warning-comments',
        message: `Unresolved ${tag} comment`,
        rootCause: `Developer left a ${tag} on line ${lineNum} signalling incomplete or problematic code.`,
        suggestion: `Resolve the issue described after "${tag}:" and delete the marker comment.`,
        autoFixable: false, fixStatus: 'pending',
      });
    } else if (isJS && tr.match(/^\s*(const|let)\s+\w+\s*=\s*\w+\.(fetch|get|post|put|delete|request)\s*\(/)) {
      issues.push({
        id: `${path}:${lineNum}:missing-await`, source: 'runtime', severity: 'error',
        file: path, line: lineNum, code: 'MISSING_AWAIT',
        message: "Async call without await — returns Promise instead of value",
        rootCause: `Assignment on line ${lineNum} receives a Promise object, not the resolved data, causing downstream type errors and undefined behaviour.`,
        suggestion: "Add 'await' before the call and ensure the enclosing function is marked 'async'.",
        autoFixable: true, fixStatus: 'pending',
        originalCode: tr,
        fixedCode: tr.replace(/=\s+(\w+\.(fetch|get|post|put|delete|request)\s*\()/, '= await $1'),
      });
    }
  });

  return issues;
}

// ─── Client-boundary violation scanner ────────────────────────────────────────
const FS_ONLY_PKGS = [
  'fs', 'fs/promises', 'node:fs', 'node:fs/promises',
  'path', 'node:path',
  'os', 'node:os',
  'child_process', 'node:child_process',
  'fast-glob', 'glob', 'globby',
  '@nodelib/fs.scandir', '@nodelib/fs.walk', '@nodelib/fs.stat',
  'chokidar', 'rimraf', 'mkdirp', 'del', 'graceful-fs',
  'tailwind', 'tailwindcss',
];

const SERVER_SIDE_PKGS = [
  'next/headers', 'next/cookies', 'next/server',
  'drizzle-orm', '@prisma/client', 'pg', 'mysql2', 'mongoose',
  'redis', 'ioredis',
  'nodemailer', 'resend', '@sendgrid/mail',
  'aws-sdk', '@aws-sdk',
];

export function detectClientBoundaryIssues(path: string, content: string): DetectedError[] {
  const issues: DetectedError[] = [];
  const ext = path.split('.').pop()?.toLowerCase() ?? '';
  const isJS = ['ts','tsx','js','jsx','mts','cts','mjs'].includes(ext);
  if (!isJS || content.length < 20) return [];

  const lines = content.split('\n');
  const topFive = lines.slice(0, 5).map(l => l.trim());
  const isClientComponent = topFive.some(l => l === '"use client"' || l === "'use client'");
  const isServerUtil =
    !isClientComponent &&
    /\/(utils|lib|helpers|services|server|actions)\//i.test(path) &&
    ext !== 'test' && !path.includes('.spec.');

  if (isClientComponent) {
    lines.forEach((line, idx) => {
      if (issues.length >= 3) return;
      const trimmed = line.trim();
      if (!trimmed.startsWith('import')) return;

      for (const pkg of FS_ONLY_PKGS) {
        const pattern = new RegExp(`from\\s+['"]${pkg.replace(/\./g,'\\.')}['"]|require\\(['"]${pkg.replace(/\./g,'\\.')}['"]\\)`);
        if (pattern.test(trimmed)) {
          const isRemovable = /^import\s+\w+\s+from/.test(trimmed) || /^import\s+\*\s+as/.test(trimmed);
          issues.push({
            id: `${path}:${idx+1}:client-fs:${pkg}`,
            source: 'client-boundary',
            severity: 'critical',
            file: path,
            line: idx + 1,
            code: 'CLIENT_FS_IMPORT',
            message: `"use client" component imports filesystem package '${pkg}'`,
            rootCause: `This file has the "use client" directive at the top, making it part of the browser bundle. The package '${pkg}' uses Node.js filesystem APIs that do not exist in browsers — the build will fail or crash at runtime.`,
            suggestion: `Move this logic to a Server Component, API route, or Server Action. If the import is only used during build time, remove "use client" from this file (or split the component in two).\n\n✅ QUICK FIX OPTIONS:\n1. Remove the "use client" directive if this file doesn't need client interactivity\n2. Move the ${pkg} logic to a separate server utility (e.g. /utils/server/${pkg.split('/').pop()}.ts)\n3. Install 'server-only' and add \`import "server-only"\` to that utility to prevent accidental re-bundling\n\n❌ BAD (client component)\n"use client"\nimport fs from "${pkg}"\n\n✅ GOOD (server component or server action)\n// No "use client" at top\nimport fs from "${pkg}"\n// OR: create /utils/server/fileUtils.ts with \`import "server-only"\``,
            autoFixable: isRemovable,
            fixStatus: 'pending',
            originalCode: line,
            fixedCode: `// ❌ REMOVED: '${pkg}' cannot be imported in client components\n// → Move this logic to a Server Component / API route / Server Action`,
          });
          break;
        }
      }
    });
  }

  if (isServerUtil) {
    const hasServerSideImport = lines.some(line =>
      SERVER_SIDE_PKGS.some(pkg =>
        new RegExp(`from\\s+['"]${pkg.replace(/[@\/]/g, s => `\\${s}`)}['"]`).test(line)
      )
    );
    const hasServerOnlyGuard = lines.some(l =>
      /import\s+["']server-only["']/.test(l) ||
      /require\(["']server-only["']\)/.test(l)
    );

    if (hasServerSideImport && !hasServerOnlyGuard) {
      issues.push({
        id: `${path}:1:server-only`,
        source: 'server-only',
        severity: 'warning',
        file: path,
        line: 1,
        code: 'MISSING_SERVER_ONLY',
        message: `Server utility missing 'server-only' guard — can be accidentally bundled into client`,
        rootCause: `This file imports server-side packages (database, auth, file system) but has no protection against being imported from a client component. If a developer accidentally does \`import { myFn } from '${path}'\` inside a "use client" file, the entire server module — including secrets and DB connections — will leak into the browser bundle.`,
        suggestion: `Add \`import "server-only"\` as the very first line. Next.js will throw a clear build-time error if this module is ever accidentally imported from a client component.\n\nnpm install server-only\n\nThen at the top of ${path}:\nimport "server-only"  // ← prevents browser bundling\n\nThis is a zero-runtime-cost compile-time guard that Next.js enforces.`,
        autoFixable: true,
        fixStatus: 'pending',
        originalCode: lines[0] || '',
        fixedCode: `import "server-only"\n${lines[0] || ''}`,
      });
    }
  }

  return issues;
}

// ─── Hydration mismatch detector ───────────────────────────────────────────────
const HYDRATION_PATTERNS: Array<{
  pattern: RegExp;
  code: string;
  message: string;
  rootCause: string;
  suggestion: string;
  autoFixable: boolean;
  fixer?: (line: string) => string;
}> = [
  {
    pattern: /\b(localStorage|sessionStorage)\s*[\.\[]/,
    code: 'HYDRATION_STORAGE',
    message: 'localStorage / sessionStorage read during render — SSR has no storage API',
    rootCause: 'localStorage and sessionStorage do not exist on the server. Reading them during render produces a different value (undefined / error) on SSR vs the real browser value, causing a DOM mismatch.',
    suggestion: '// ✅ Safe pattern\nconst [value, setValue] = useState<string | null>(null);\nuseEffect(() => { setValue(localStorage.getItem("key")); }, []);\n\n// OR suppress on the element:\n<span suppressHydrationWarning>{localStorage.getItem("key")}</span>',
    autoFixable: true,
    fixer: (line) =>
      `// ⚠️ HYDRATION FIX: move to useEffect — localStorage is not available on the server\n// Original: ${line.trim()}\n// Fix: const [val, setVal] = useState<string|null>(null); useEffect(() => { setVal(localStorage.getItem("key")); }, []);`,
  },
  {
    pattern: /\btypeof\s+window\s*!==?\s*['"]undefined['"]/,
    code: 'HYDRATION_WINDOW_CHECK',
    message: 'typeof window guard in JSX — renders differently on server vs client',
    rootCause: '`typeof window !== "undefined"` is false on the server and true in the browser. Used inside JSX or state initialisation it causes the server-rendered tree to differ from the client tree, triggering hydration errors.',
    suggestion: '// ✅ Use useEffect + isMounted pattern:\nconst [isMounted, setIsMounted] = useState(false);\nuseEffect(() => setIsMounted(true), []);\nif (!isMounted) return null;\n\n// OR use next/dynamic with ssr: false:\nconst Widget = dynamic(() => import("./Widget"), { ssr: false });',
    autoFixable: false,
  },
  {
    pattern: /\b(Math\.random|Date\.now)\s*\(/,
    code: 'HYDRATION_NONDETERMINISTIC',
    message: 'Math.random() / Date.now() in render — produces different values on server vs client',
    rootCause: 'Math.random() and Date.now() return different values on every call. When called during rendering the server value differs from the client re-render value, causing a hydration mismatch.',
    suggestion: '// ✅ Stable ID — generate once in state:\nconst [id] = useState(() => Math.random().toString(36).slice(2));\n\n// ✅ Or use React 18 useId():\nconst id = useId();\n\n// ✅ For dates — generate in useEffect:\nconst [now, setNow] = useState<number | null>(null);\nuseEffect(() => setNow(Date.now()), []);',
    autoFixable: true,
    fixer: (line) =>
      line
        .replace(/Math\.random\s*\(\s*\)/g, '/* ⚠️ HYDRATION FIX → useState(() => Math.random()) or useId() */')
        .replace(/Date\.now\s*\(\s*\)/g, '/* ⚠️ HYDRATION FIX → useState<number|null>(null) + useEffect */'),
  },
  {
    pattern: /new\s+Date\s*\(\s*\)\s*\.(toLocaleString|toLocaleDateString|toLocaleTimeString)\s*\(/,
    code: 'HYDRATION_LOCALE_DATE',
    message: 'new Date().toLocaleString() in JSX — server (UTC) and browser (local TZ) produce different strings',
    rootCause: 'The server renders dates in UTC (or server timezone), while the browser formats them in the user\'s local timezone. This produces a "Text content did not match" hydration error.',
    suggestion: '// ✅ Render dates only on client:\nconst [dateStr, setDateStr] = useState("");\nuseEffect(() => setDateStr(new Date().toLocaleString()), []);\n<time suppressHydrationWarning>{dateStr}</time>\n\n// ✅ Or suppress on the wrapping element:\n<time suppressHydrationWarning>{new Date().toLocaleString()}</time>',
    autoFixable: true,
    fixer: (line) =>
      line.replace(
        /(new\s+Date\s*\(\s*\)\s*\.\s*(?:toLocaleString|toLocaleDateString|toLocaleTimeString)\s*\([^)]*\))/g,
        (_match) => `{/* suppressHydrationWarning — move to useEffect for SSR safety */}`
      ),
  },
  {
    pattern: /\buseLayoutEffect\s*\(/,
    code: 'HYDRATION_USELAYOUTEFFECT',
    message: 'useLayoutEffect is a no-op on server — causes SSR warning and potential hydration mismatch',
    rootCause: 'useLayoutEffect runs synchronously after DOM mutations but the server has no DOM. React emits a warning and skips it on SSR, which can cause layout flashes and hydration mismatches when the effect mutates the DOM.',
    suggestion: '// ✅ Replace with useEffect for effects that do not need synchronous DOM reads:\nuseEffect(() => { ... }, [deps]);\n\n// ✅ Or use the isomorphic pattern:\nconst useIsomorphicEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;',
    autoFixable: true,
    fixer: (line) =>
      line.replace(
        /\buseLayoutEffect\b/g,
        'useEffect /* ⚠️ HYDRATION FIX: useLayoutEffect → useEffect for SSR safety */'
      ),
  },
];

export function detectHydrationIssues(path: string, content: string): DetectedError[] {
  const issues: DetectedError[] = [];
  const ext = path.split('.').pop()?.toLowerCase() ?? '';
  const isJSX = ext === 'tsx' || ext === 'jsx';
  const isJS  = isJSX || ext === 'ts' || ext === 'js';
  if (!isJS || content.length < 20) return [];

  const isComponentOrPage =
    /\/(components?|pages?|app|views?|screens?)\//i.test(path) ||
    path.endsWith('.tsx') || path.endsWith('.jsx');
  if (!isComponentOrPage) return [];

  const lines = content.split('\n');
  const topFive = lines.slice(0, 5).map(l => l.trim());
  const isClientComponent = topFive.some(l => l === '"use client"' || l === "'use client'");

  lines.forEach((line, idx) => {
    if (issues.length >= 3) return;
    const tr = line.trim();
    if (!tr || tr.startsWith('//') || tr.startsWith('*')) return;

    for (const pat of HYDRATION_PATTERNS) {
      if (!pat.pattern.test(tr)) continue;
      if (pat.code === 'HYDRATION_WINDOW_CHECK' && isClientComponent) continue;

      const prevLines = lines.slice(Math.max(0, idx - 4), idx).join('\n');
      if (
        /(useEffect|useCallback|useMemo)\s*\(/.test(prevLines) &&
        pat.code !== 'HYDRATION_USELAYOUTEFFECT'
      ) continue;

      const fixedLine = pat.fixer ? pat.fixer(line) : undefined;
      issues.push({
        id: `${path}:${idx + 1}:${pat.code}`,
        source: 'hydration',
        severity: 'error',
        file: path,
        line: idx + 1,
        code: pat.code,
        message: pat.message,
        rootCause: pat.rootCause,
        suggestion: pat.suggestion,
        autoFixable: pat.autoFixable,
        fixStatus: 'pending',
        originalCode: tr,
        fixedCode: fixedLine ?? tr,
      });
      break;
    }
  });

  return issues;
}

// ─── Circular Dependency Detector ─────────────────────────────────────────────
export function detectCircularDependencies(
  files: { path: string }[],
  contents: Map<string, string>
): DetectedError[] {
  const graph = new Map<string, Set<string>>();

  for (const file of files) {
    const content = contents.get(file.path) || '';
    const ext = file.path.split('.').pop()?.toLowerCase() ?? '';
    const isJS = ['ts', 'tsx', 'js', 'jsx', 'mts', 'mjs'].includes(ext);
    if (!isJS) continue;

    const deps = new Set<string>();
    const lines = content.split('\n');
    for (const line of lines) {
      const m = line.match(/^import\s+.*?\s+from\s+['"](\.[^'"]+)['"]/);
      if (!m) continue;
      const importPath = m[1];
      const dir = file.path.split('/').slice(0, -1).join('/');
      const raw = dir ? `${dir}/${importPath}` : importPath;
      const parts = raw.split('/');
      const resolved: string[] = [];
      for (const p of parts) {
        if (p === '..') resolved.pop();
        else if (p !== '.') resolved.push(p);
      }
      const base = resolved.join('/');
      const match = files.find(f =>
        f.path === base ||
        f.path === base + '.ts'  || f.path === base + '.tsx' ||
        f.path === base + '.js'  || f.path === base + '.jsx' ||
        f.path === base + '/index.ts' || f.path === base + '/index.tsx'
      );
      if (match) deps.add(match.path);
    }
    graph.set(file.path, deps);
  }

  const visited  = new Set<string>();
  const inStack  = new Set<string>();
  const cycles: string[][] = [];

  function dfs(node: string, stack: string[]) {
    visited.add(node);
    inStack.add(node);
    stack.push(node);

    for (const neighbor of graph.get(node) ?? []) {
      if (!visited.has(neighbor)) {
        dfs(neighbor, stack);
      } else if (inStack.has(neighbor)) {
        const cycleStart = stack.indexOf(neighbor);
        if (cycleStart !== -1) {
          const cycle = stack.slice(cycleStart);
          if (cycle.length >= 2) cycles.push([...cycle, neighbor]);
        }
      }
    }

    stack.pop();
    inStack.delete(node);
  }

  for (const file of files) {
    if (!visited.has(file.path)) dfs(file.path, []);
    if (cycles.length >= 5) break;
  }

  const seen = new Set<string>();
  const unique = cycles.filter(c => {
    const key = [...c].sort().join('|');
    if (seen.has(key)) return false; seen.add(key); return true;
  });

  return unique.slice(0, 8).map((cycle, i) => ({
    id: `circular-${i}-${cycle[0].replace(/[^a-z0-9]/gi, '')}`,
    source: 'build' as const,
    severity: 'error' as const,
    file: cycle[0],
    line: 1,
    code: 'CIRCULAR_DEP',
    message: `Circular dependency detected: ${cycle.slice(0, 3).map(p => p.split('/').pop()).join(' → ')}${cycle.length > 3 ? ' …' : ''}`,
    rootCause: `Circular import chain: ${cycle.join(' → ')}. Circular dependencies cause:\n• Bundler instability (Turbopack / webpack may produce undefined module errors)\n• SSR hangs (Node module loader deadlocks on cycles)\n• Test isolation failures\n• Stale module caches after hot reload`,
    suggestion: `Break the cycle by:\n1. Extract shared logic to a new file that neither module imports from the cycle.\n2. Use dynamic import() / React.lazy() to defer one import.\n3. Invert the dependency (pass the value as a prop/parameter instead of importing).\n\nCycle: ${cycle.join(' → ')}`,
    autoFixable: false,
    fixStatus: 'pending' as const,
  }));
}

// ─── ESM / CommonJS Mixing Detector ───────────────────────────────────────────
export function detectESMCJSMixing(path: string, content: string): DetectedError[] {
  const issues: DetectedError[] = [];
  const ext = path.split('.').pop()?.toLowerCase() ?? '';
  const isJS = ['ts', 'tsx', 'js', 'jsx', 'mts', 'mjs', 'cjs'].includes(ext);
  if (!isJS || content.length < 20) return [];

  const hasESMImport  = /^import\s+/m.test(content);
  const hasESMExport  = /^export\s+(default|const|function|class|let|var|type|interface|enum|async)/m.test(content);
  const hasRequire    = /\brequire\s*\(\s*['"`]/.test(content);
  const hasModExports = /\bmodule\.exports\s*=/.test(content);
  const hasExportsRef = /\bexports\.\w+\s*=/.test(content);

  const isESM = hasESMImport || hasESMExport;
  const isCJS = hasRequire || hasModExports || hasExportsRef;

  if (isESM && isCJS) {
    const lines = content.split('\n');
    const culpritLine = lines.findIndex(l => /\brequire\s*\(/.test(l) || /module\.exports/.test(l) || /exports\.\w+/.test(l));

    issues.push({
      id: `${path}:esm-cjs-mix`,
      source: 'build',
      severity: 'error',
      file: path,
      line: culpritLine >= 0 ? culpritLine + 1 : 1,
      code: 'ESM_CJS_MIX',
      message: `ESM ↔ CJS mixing detected — import/export and require()/module.exports used in the same file`,
      rootCause: `This file uses both ES Module syntax (import / export) and CommonJS syntax (require / module.exports). This causes bundler errors in Vite, Turbopack, and modern Node.js because ESM and CJS cannot be mixed in the same file without a transform.`,
      suggestion: `Pick one module system:\n\n✅ Full ESM (recommended for React / Next.js / Vite):\n  • Replace require('x') with import x from 'x'\n  • Replace module.exports = with export default\n  • Replace exports.foo = with export const foo =\n\n✅ Full CJS (for Node.js-only utilities):\n  • Replace import x from 'x' with const x = require('x')\n  • Replace export default with module.exports =\n\nFor dynamic imports in ESM: use import() (returns Promise)`,
      autoFixable: false,
      fixStatus: 'pending',
    });
  }

  return issues;
}

// ─── Dead Import Detector ──────────────────────────────────────────────────────
export function detectDeadImports(path: string, content: string): DetectedError[] {
  const issues: DetectedError[] = [];
  const ext = path.split('.').pop()?.toLowerCase() ?? '';
  const isJS = ['ts', 'tsx', 'js', 'jsx'].includes(ext);
  if (!isJS || content.length < 30) return [];

  const lines = content.split('\n');
  const importedNames: { name: string; line: number }[] = [];

  lines.forEach((line, idx) => {
    const m = line.match(/^import\s+\{([^}]+)\}\s+from\s+['"][^'"]+['"]/);
    if (!m) return;
    m[1].split(',').forEach(part => {
      const name = part.trim().split(/\s+as\s+/).pop()?.trim() ?? '';
      if (name && /^[A-Za-z_$]/.test(name)) importedNames.push({ name, line: idx + 1 });
    });
  });

  if (importedNames.length === 0) return [];

  const bodyLines = lines.map((l) => {
    const isImportLine = /^\s*import\s+/.test(l);
    return isImportLine ? '' : l;
  });
  const body = bodyLines.join('\n');

  let deadCount = 0;
  for (const { name, line } of importedNames) {
    if (deadCount >= 3) break;
    const usages = (body.match(new RegExp(`\\b${name}\\b`, 'g')) || []).length;
    if (usages === 0) {
      deadCount++;
      issues.push({
        id: `${path}:${line}:dead-import:${name}`,
        source: 'lint',
        severity: 'warning',
        file: path,
        line,
        code: 'DEAD_IMPORT',
        message: `'${name}' is imported but never used`,
        rootCause: `The named export '${name}' is imported on line ${line} but never referenced in the file. Dead imports slow down tree-shaking, inflate bundle size, and confuse readers.`,
        suggestion: `Remove '${name}' from the import statement, or prefix with underscore (${name.replace(/^/, '_')}) to signal intentional non-use.\n\nIf this is a type-only import, use 'import type { ${name} }' for clarity.`,
        autoFixable: true,
        fixStatus: 'pending',
        originalCode: lines[line - 1]?.trim(),
        fixedCode: lines[line - 1]?.trim().replace(
          new RegExp(`\\b${name}\\s*,?\\s*|,?\\s*\\b${name}\\b`),
          ''
        ).replace(/,\s*}/, ' }').replace(/{\s*,/, '{ ').trim(),
      });
    }
  }

  return issues;
}

// ─── Security Vulnerability Scanner ───────────────────────────────────────────
const SECRET_PATTERNS: Array<{
  pattern: RegExp;
  name: string;
  code: string;
  suggestion: string;
  severity: ErrorSeverity;
}> = [
  {
    pattern: /\b(sk-[a-zA-Z0-9]{32,}|sk-proj-[a-zA-Z0-9_-]{32,})/,
    name: 'Hardcoded OpenAI API key', code: 'SECRET_OPENAI_KEY', severity: 'critical',
    suggestion: 'Move to environment variable: process.env.OPENAI_API_KEY. Add the key to .gitignore and rotate the leaked key immediately at platform.openai.com.',
  },
  {
    pattern: /\bghp_[a-zA-Z0-9]{36,}/,
    name: 'Hardcoded GitHub Personal Access Token', code: 'SECRET_GITHUB_TOKEN', severity: 'critical',
    suggestion: 'GitHub auto-revokes tokens found in public repos. Rotate at github.com/settings/tokens and store in an environment variable.',
  },
  {
    pattern: /['"](?:xox[pboas]-[a-zA-Z0-9-]{24,})/,
    name: 'Hardcoded Slack token', code: 'SECRET_SLACK_TOKEN', severity: 'critical',
    suggestion: 'Rotate the token at api.slack.com and store in an environment variable.',
  },
  {
    pattern: /\b(AIza[A-Za-z0-9_-]{35})/,
    name: 'Hardcoded Google API key', code: 'SECRET_GOOGLE_KEY', severity: 'critical',
    suggestion: 'Restrict the key in Google Cloud Console and move to an environment variable. Never commit Google API keys.',
  },
  {
    pattern: /(?:password|passwd|secret|api_key|apikey)\s*[:=]\s*['"][^'"]{8,}['"]/i,
    name: 'Hardcoded credential literal', code: 'SECRET_CREDENTIAL', severity: 'critical',
    suggestion: 'Never hardcode passwords or secrets. Use environment variables and a secrets manager (AWS Secrets Manager, HashiCorp Vault, or Supabase secrets).',
  },
  {
    pattern: /\beval\s*\(/,
    name: 'eval() usage — code injection risk', code: 'SECURITY_EVAL', severity: 'error',
    suggestion: 'eval() executes arbitrary code strings and is a major XSS vector. Replace with JSON.parse() for data, or a sandboxed interpreter library. CSP headers with "unsafe-eval" blocked will cause eval() to throw at runtime.',
  },
  {
    pattern: /new\s+Function\s*\(/,
    name: 'new Function() — dynamic code execution', code: 'SECURITY_NEW_FUNCTION', severity: 'error',
    suggestion: 'new Function() is essentially eval(). Use static code or a purpose-built expression parser library.',
  },
  {
    pattern: /dangerouslySetInnerHTML\s*=\s*\{\s*\{\s*__html\s*:/,
    name: 'dangerouslySetInnerHTML without sanitization', code: 'SECURITY_DSIHTML', severity: 'warning',
    suggestion: 'Always sanitize HTML before injecting:\n\nimport DOMPurify from "dompurify";\n<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(rawHtml) }} />\n\nnpm install dompurify @types/dompurify',
  },
  {
    pattern: /document\.write\s*\(/,
    name: 'document.write() — parser-blocking and XSS risk', code: 'SECURITY_DOC_WRITE', severity: 'error',
    suggestion: 'document.write() overwrites the DOM and is an XSS vector. Use document.body.insertAdjacentHTML("beforeend", DOMPurify.sanitize(html)) instead.',
  },
  {
    pattern: /innerHTML\s*[+]?=(?!\s*['"]<\/)/,
    name: 'innerHTML assignment — potential XSS', code: 'SECURITY_INNERHTML', severity: 'warning',
    suggestion: 'Assigning unsanitized content to innerHTML causes XSS. Use textContent for plain text, or DOMPurify.sanitize() before innerHTML.',
  },
  {
    pattern: /postMessage\s*\([^,]+,['"]\*['"]/,
    name: 'postMessage with wildcard origin — data leak risk', code: 'SECURITY_POSTMESSAGE_WILDCARD', severity: 'warning',
    suggestion: 'Using "*" targetOrigin broadcasts to ALL windows. Specify the exact origin: window.postMessage(data, "https://trusted.com")',
  },
];

export function detectSecurityIssues(path: string, content: string): DetectedError[] {
  const issues: DetectedError[] = [];
  const ext = path.split('.').pop()?.toLowerCase() ?? '';
  const isJS = ['ts', 'tsx', 'js', 'jsx', 'mts', 'mjs', 'cjs'].includes(ext);
  const isEnv = path.endsWith('.env') || path.includes('.env.');
  if (!isJS && !isEnv) return [];
  if (content.length < 10) return [];

  const isTest = path.includes('.test.') || path.includes('.spec.') || path.includes('__tests__') || path.includes('__mocks__');
  const lines = content.split('\n');

  lines.forEach((line, idx) => {
    if (issues.length >= 5) return;
    const tr = line.trim();
    if (!tr || /^\s*(\/\/|\/\*|\*)/.test(line)) return;

    for (const sp of SECRET_PATTERNS) {
      if (isTest && ['SECURITY_EVAL', 'SECURITY_NEW_FUNCTION'].includes(sp.code)) continue;
      if (!sp.pattern.test(tr)) continue;
      if (/process\.env\.|import\.meta\.env\./.test(tr)) continue;

      issues.push({
        id: `${path}:${idx + 1}:${sp.code}`,
        source: 'api' as ErrorSource,
        severity: sp.severity,
        file: path,
        line: idx + 1,
        code: sp.code,
        message: sp.name,
        rootCause: `Security vulnerability on line ${idx + 1}: ${sp.name}. This pattern exposes sensitive data or enables code injection attacks that can compromise your application and users.`,
        suggestion: sp.suggestion,
        autoFixable: false,
        fixStatus: 'pending',
        originalCode: tr.slice(0, 120),
      });
      break;
    }
  });

  return issues;
}

// ─── Performance Anti-Pattern Detector ────────────────────────────────────────
const PERF_PATTERNS: Array<{
  pattern: RegExp;
  code: string;
  message: string;
  rootCause: string;
  suggestion: string;
  autoFixable: boolean;
  fixer?: (line: string) => string;
  jsxOnly?: boolean;
}> = [
  {
    pattern: /JSON\.parse\s*\(\s*JSON\.stringify\s*\(/,
    code: 'PERF_JSON_DEEP_CLONE',
    message: 'JSON.parse(JSON.stringify()) deep clone — use structuredClone() instead',
    rootCause: 'JSON.parse(JSON.stringify(obj)) strips functions, Symbol keys, undefined values, and converts Dates to strings. It also throws on circular references and is slower than native structuredClone().',
    suggestion: '// ✅ Use native structuredClone() (Node 17+, browsers 2022+):\nconst clone = structuredClone(obj);\n\n// ✅ Shallow clone:\nconst clone = { ...obj };\n\n// ✅ Shallow nested:\nconst clone = { ...obj, nested: { ...obj.nested } };',
    autoFixable: true,
    fixer: (line) => line.replace(/JSON\.parse\s*\(\s*JSON\.stringify\s*\(([^)]+)\)\s*\)/g, 'structuredClone($1)'),
  },
  {
    pattern: /\bsetInterval\s*\(/,
    code: 'PERF_SETINTERVAL_LEAK',
    message: 'setInterval without clearInterval cleanup — memory leak on unmount',
    rootCause: 'setInterval created inside a component or hook without clearInterval in useEffect cleanup continues running after unmount, causing memory leaks and "Can\'t perform a React state update on an unmounted component" warnings.',
    suggestion: '// ✅ Always clear in useEffect cleanup:\nuseEffect(() => {\n  const id = setInterval(() => { /* ... */ }, 1000);\n  return () => clearInterval(id); // ← cleanup!\n}, []);',
    autoFixable: false,
  },
  {
    pattern: /\.map\s*\([^)]*\)\s*\.\s*(filter|find|some|every)\s*\(/,
    code: 'PERF_MAP_THEN_FILTER',
    message: '.map().filter() chain — iterates array twice; filter first for efficiency',
    rootCause: 'Chaining .map() then .filter() transforms every item before discarding some, wasting CPU cycles on items that will be filtered. Two passes = 2× the work.',
    suggestion: '// ✅ Filter FIRST (avoids transforming items you\'ll discard):\nconst result = items.filter(predicate).map(transform);\n\n// ✅ Single pass with .reduce():\nconst result = items.reduce((acc, item) => {\n  if (predicate(item)) acc.push(transform(item));\n  return acc;\n}, []);',
    autoFixable: false,
  },
  {
    pattern: /style\s*=\s*\{\s*\{[^}]+\}/,
    code: 'PERF_INLINE_STYLE_OBJECT',
    message: 'Inline style object literal in JSX — new object reference every render',
    rootCause: 'style={{ color: "red" }} creates a new object on every render, forcing React to diff and apply styles even when nothing changed. This causes unnecessary DOM work.',
    suggestion: '// ✅ Extract outside component or memoize:\nconst styles = { button: { color: "red", fontSize: 14 } }; // outside component\n<button style={styles.button}>\n\n// ✅ Or use Tailwind/CSS classes:\n<button className="text-red-500 text-sm">',
    autoFixable: false,
    jsxOnly: true,
  },
  {
    pattern: /async\s*\(\s*\)\s*=>\s*\{[\s\S]{0,50}?await[\s\S]{0,50}?\}\s*,\s*\[\s*\]\s*\)/,
    code: 'PERF_ASYNC_EFFECT_NO_CLEANUP',
    message: 'async useEffect with no abort/cleanup — stale response race condition',
    rootCause: 'An async effect with an empty deps array that fetches data can resolve after the component unmounts or after a newer effect fires, setting stale state. This causes "Can\'t update state on unmounted component" and race conditions.',
    suggestion: '// ✅ Use AbortController for cleanup:\nuseEffect(() => {\n  const controller = new AbortController();\n  async function fetchData() {\n    const res = await fetch(url, { signal: controller.signal });\n    const data = await res.json();\n    setState(data);\n  }\n  fetchData();\n  return () => controller.abort();\n}, []);',
    autoFixable: false,
  },
];

export function detectPerformanceIssues(path: string, content: string): DetectedError[] {
  const issues: DetectedError[] = [];
  const ext = path.split('.').pop()?.toLowerCase() ?? '';
  const isJSX = ext === 'tsx' || ext === 'jsx';
  const isJS  = isJSX || ext === 'ts' || ext === 'js';
  if (!isJS || content.length < 20) return [];

  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (issues.length >= 3) return;
    const tr = line.trim();
    if (!tr || tr.startsWith('//') || tr.startsWith('*')) return;

    for (const pp of PERF_PATTERNS) {
      if (pp.jsxOnly && !isJSX) continue;
      if (!pp.pattern.test(tr)) continue;

      const fixedCode = pp.fixer ? pp.fixer(line).trim() : undefined;
      issues.push({
        id: `${path}:${idx + 1}:${pp.code}`,
        source: 'lint' as ErrorSource,
        severity: 'warning',
        file: path,
        line: idx + 1,
        code: pp.code,
        message: pp.message,
        rootCause: pp.rootCause,
        suggestion: pp.suggestion,
        autoFixable: pp.autoFixable,
        fixStatus: 'pending',
        originalCode: tr.slice(0, 120),
        fixedCode,
      });
      break;
    }
  });

  return issues;
}

// ─── Build Log Error Parser ────────────────────────────────────────────────────
function stripLogPrefix(line: string): string {
  return line
    .replace(/^\[[\w:./ -]+\]\s*/, '')
    .replace(/^error\s+-\s+/i, '')
    .replace(/^warning\s+-\s+/i, '')
    .replace(/^\s*\d+\s+\|\s*/, '')
    .trim();
}

export function parseBuildErrorLog(rawLog: string): BuildLogError[] {
  const errors: BuildLogError[] = [];
  const lines = rawLog.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const stripped = stripLogPrefix(lines[i]);

    const fileMatch = stripped.match(
      /^\.?\/?([^:\s]+\.(ts|tsx|js|jsx|mts|cts|mjs|cjs)):(\d+):(\d+)/
    );
    if (!fileMatch) continue;

    const filePath = fileMatch[1].replace(/^\.\//, '');
    const lineNum  = parseInt(fileMatch[3]);
    const colNum   = parseInt(fileMatch[4]);

    let errorType: BuildLogError['errorType'] = 'unknown';
    let message       = '';
    let badExport     = '';
    let suggestedExport = '';
    let modulePath    = '';
    let importLine    = '';

    for (let j = i + 1; j < Math.min(i + 25, lines.length); j++) {
      const raw = lines[j];
      const ctx = stripLogPrefix(raw);

      const expMissing = ctx.match(
        /Export\s+['"]?(\w+)['"]?\s+doesn[''']t\s+exist\s+in\s+target\s+module/i
      );
      if (expMissing) { badExport = expMissing[1]; errorType = 'missing-export'; message = ctx; }

      const expNotFound = ctx.match(
        /The\s+export\s+['"]?(\w+)['"]?\s+was\s+not\s+found\s+in\s+module\s+([^\s[]+)/i
      );
      if (expNotFound) {
        if (!badExport) badExport = expNotFound[1];
        modulePath = expNotFound[2]; errorType = 'missing-export';
        if (!message) message = ctx;
      }

      const didYouMean = ctx.match(/Did\s+you\s+mean\s+to\s+import\s+['"]?(\w+)['"]?/i);
      if (didYouMean) suggestedExport = didYouMean[1];

      const ptrLine = raw.replace(/^\[[\w:./ -]+\]\s*/, '');
      const importMatch = ptrLine.match(
        /^>\s*\d+\s*\|\s*(import\s+\{[^}]+\}\s+from\s+['"][^'"]+['"])/
      );
      if (importMatch) importLine = importMatch[1];

      const modNotFound = ctx.match(
        /Module\s+not\s+found:\s+Can[''']t\s+resolve\s+['"]([^'"]+)['"]/i
      );
      if (modNotFound) { errorType = 'module-not-found'; modulePath = modNotFound[1]; if (!message) message = ctx; }

      if (/Type\s+error:/i.test(ctx)) { errorType = 'type-error'; if (!message) message = ctx; }
      if (/SyntaxError:/i.test(ctx)) { errorType = 'syntax-error'; if (!message) message = ctx; }

      if (j > i + 2 && /^\.?\/?[^:\s]+\.(ts|tsx|js|jsx):(\d+):/.test(ctx)) break;
    }

    if (!message && !badExport && errorType === 'unknown') continue;

    let fixedImportLine: string | undefined;
    if (importLine && badExport && suggestedExport) {
      fixedImportLine = importLine.replace(new RegExp(`\\b${badExport}\\b`), suggestedExport);
    }

    errors.push({
      id: `bld-${filePath.replace(/[^a-z0-9]/gi, '')}-${lineNum}-${Math.random().toString(36).slice(2, 6)}`,
      file: filePath, line: lineNum, col: colNum, errorType,
      message: message || `Build error in ${filePath}:${lineNum}`,
      importLine, badExport, suggestedExport, modulePath, fixedImportLine,
      severity: (errorType === 'missing-export' || errorType === 'module-not-found') ? 'error' : 'warning',
      autoFixable: !!(importLine && badExport && suggestedExport),
      fixStatus: 'pending',
    });
  }

  const seen = new Set<string>();
  return errors.filter(e => {
    const key = `${e.file}:${e.line}:${e.badExport || e.message.slice(0, 30)}`;
    if (seen.has(key)) return false; seen.add(key); return true;
  });
}

// ─── Named-export mismatch detector ───────────────────────────────────────────
export function detectNamedExportMismatches(
  path: string,
  content: string,
  allContents: Map<string, string>
): DetectedError[] {
  const issues: DetectedError[] = [];
  const ext = path.split('.').pop()?.toLowerCase() ?? '';
  const isJS = ['ts','tsx','js','jsx','mts','cts','mjs'].includes(ext);
  if (!isJS || content.length < 20) return [];

  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    const tr = line.trim();
    const importMatch = tr.match(/^import\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]/);
    if (!importMatch) return;

    const namedImports = importMatch[1].split(',').map(s => s.trim().replace(/\s+as\s+\w+$/, '').trim());
    const modPath      = importMatch[2];
    const isLocal = modPath.startsWith('.') || modPath.startsWith('@');
    if (!isLocal) return;

    const possibleKeys = [...allContents.keys()];
    const targetKey = possibleKeys.find(k => {
      const clean    = k.replace(/\.(ts|tsx|js|jsx)$/, '').replace(/\/index$/, '');
      const modClean = modPath.replace(/^@lib\//, 'lib/').replace(/^@\//, '').replace(/^\.\//, '').replace(/^\.\.\//g, '');
      return clean.endsWith(modClean) || clean.includes(modClean);
    });
    if (!targetKey) return;

    const targetContent = allContents.get(targetKey) || '';
    const exportedNames = new Set<string>();
    targetContent.split('\n').forEach(tl => {
      const fnMatch = tl.match(/^export\s+(?:async\s+)?(?:function|const|let|var|class|type|interface|enum)\s+(\w+)/);
      if (fnMatch) exportedNames.add(fnMatch[1]);
      const namedMatch = tl.match(/^export\s+\{([^}]+)\}/);
      if (namedMatch) namedMatch[1].split(',').forEach(s => { const nm = s.trim().match(/(\w+)(?:\s+as\s+\w+)?$/); if (nm) exportedNames.add(nm[1]); });
    });
    if (exportedNames.size === 0) return;

    for (const imp of namedImports) {
      if (!imp || imp === '*' || imp === 'default') continue;
      if (exportedNames.has(imp)) continue;

      let bestMatch = ''; let bestScore = Infinity;
      for (const exp of exportedNames) {
        const minLen = Math.min(imp.length, exp.length);
        let diff = Math.abs(imp.length - exp.length);
        for (let k = 0; k < minLen; k++) if (imp[k] !== exp[k]) diff++;
        if (diff < bestScore) { bestScore = diff; bestMatch = exp; }
      }

      issues.push({
        id: `${path}:${idx + 1}:missing-export:${imp}`,
        source: 'build', severity: 'error', file: path, line: idx + 1,
        code: 'MISSING_NAMED_EXPORT',
        message: `Export '${imp}' doesn't exist in '${modPath}'`,
        rootCause: `The named import \`${imp}\` does not appear in the exports of \`${targetKey}\`. This causes the Turbopack/webpack build error: "The export ${imp} was not found in module". ${bestMatch ? `Bundler suggestion: "Did you mean to import ${bestMatch}?"` : ''}`,
        suggestion: bestMatch
          ? `Replace \`${imp}\` with \`${bestMatch}\`.\n\n❌ BROKEN:\n${tr}\n\n✅ FIXED:\n${tr.replace(new RegExp(`\\b${imp}\\b`), bestMatch)}`
          : `Check exports of '${targetKey}'. Available: ${[...exportedNames].slice(0, 8).join(', ')}${exportedNames.size > 8 ? '…' : ''}`,
        autoFixable: !!bestMatch,
        fixStatus: 'pending',
        originalCode: tr,
        fixedCode: bestMatch ? tr.replace(new RegExp(`\\b${imp}\\b`), bestMatch) : undefined,
      });
    }
  });
  return issues;
}

// ─── Turbopack detector ────────────────────────────────────────────────────────
export function detectTurbopackConfig(path: string, content: string): { info: Partial<TurbopackInfo>; errors: DetectedError[] } {
  const errors: DetectedError[] = [];
  let info: Partial<TurbopackInfo> = { enabled: false, mode: 'unknown', incompatibilities: [] };

  const isNextConfig = /next\.config\.(js|ts|mjs|cjs)$/.test(path);
  const isPackageJson = path === 'package.json' || path.endsWith('/package.json');

  if (!isNextConfig && !isPackageJson) return { info, errors };

  if (isPackageJson) {
    try {
      const pkg = JSON.parse(content);
      const scripts: Record<string, string> = pkg.scripts || {};
      const devScript = scripts['dev'] || '';
      const buildScript = scripts['build'] || '';

      if (devScript.includes('--turbo') || buildScript.includes('--turbo') || devScript.includes('turbopack')) {
        info = { enabled: true, mode: 'cli-flag', version: pkg.dependencies?.next || pkg.devDependencies?.next || 'unknown', incompatibilities: [] };
        errors.push({
          id: `${path}:turbopack-cli`,
          source: 'turbopack', severity: 'info', file: path, line: 1,
          code: 'TURBOPACK_CLI',
          message: `Turbopack detected via --turbo CLI flag in package.json scripts`,
          rootCause: `The "dev" or "build" script uses the --turbo flag (e.g. "next dev --turbo"), enabling Turbopack as the bundler instead of webpack.`,
          suggestion: `Turbopack is stable in Next.js 15+ for development. Known incompatibilities:\n• Custom webpack() config in next.config.js is IGNORED by Turbopack\n• Some webpack plugins (BundleAnalyzerPlugin, etc.) don't work\n• Packages using filesystem APIs in their webpack loaders will fail\n• Use next.config.js "turbopack" key (not "experimental.turbo") for Next.js 15+`,
          autoFixable: false, fixStatus: 'pending',
        });
      }

      const nextVersion = pkg.dependencies?.next || pkg.devDependencies?.next;
      if (nextVersion) info.version = nextVersion;
    } catch { /* invalid JSON */ }
    return { info, errors };
  }

  if (isNextConfig) {
    const hasStableTurbopack   = /turbopack\s*:/.test(content);
    const hasExperimentalTurbo = /experimental\s*:\s*\{[^}]*turbo\s*:/s.test(content);
    const hasWebpackFn         = /webpack\s*\(\s*(config|cfg)/.test(content);
    const hasWebpackPlugins    = /new\s+(BundleAnalyzerPlugin|MiniCssExtractPlugin|CopyWebpackPlugin|HtmlWebpackPlugin|DefinePlugin)/.test(content);
    const usesNodePathOrFsGlob = /require\s*\(\s*['"](?:fast-glob|globby|@nodelib|fs)\s*['"]\)/.test(content);

    const hasResolveFallback = content.includes('resolve.fallback');
    const hasResolveFallbackFsOff = hasResolveFallback && content.includes('fs: false') && content.includes('path: false');
    const hasOnlyResolveFallback =
      hasWebpackFn && hasResolveFallback &&
      !hasWebpackPlugins &&
      !content.includes('config.module.rules') &&
      !content.includes('config.plugins.push') &&
      !content.includes('config.resolve.alias =');

    if (hasResolveFallbackFsOff) {
      errors.push({
        id: `${path}:resolve-fallback-safe`,
        source: 'turbopack', severity: 'info', file: path, line: 1,
        code: 'RESOLVE_FALLBACK_SAFE',
        message: `✅ resolve.fallback detected — correct pattern for Node built-in browser safety`,
        rootCause: `The webpack config sets config.resolve.fallback = { fs: false, path: false, os: false }. This is the canonical Next.js pattern that prevents "Module not found: Can't resolve 'fs'" errors in the browser bundle. Turbopack handles this natively and ignores this config harmlessly.`,
        suggestion: `This is CORRECT — keep it as-is. Your next.config.ts is following the recommended pattern.`,
        autoFixable: false,
        fixStatus: 'fixed',
      });
    }

    if (hasStableTurbopack) {
      info = { enabled: true, mode: 'stable', incompatibilities: [] };
      errors.push({
        id: `${path}:turbopack-stable`,
        source: 'turbopack', severity: 'info', file: path, line: 1,
        code: 'TURBOPACK_STABLE',
        message: `Turbopack (stable API) is configured in ${path}`,
        rootCause: 'The "turbopack" key at the root of next.config is the Next.js 15+ stable API for configuring Turbopack.',
        suggestion: 'Turbopack is active. Verify no webpack-only plugins are in use. The custom webpack() function in this config will be ignored during Turbopack builds.',
        autoFixable: false, fixStatus: 'pending',
      });
    }

    if (hasExperimentalTurbo && !hasStableTurbopack) {
      info = { enabled: true, mode: 'experimental', incompatibilities: [] };
      errors.push({
        id: `${path}:turbopack-experimental`,
        source: 'turbopack', severity: 'warning', file: path, line: 1,
        code: 'TURBOPACK_EXPERIMENTAL_API',
        message: `Using deprecated experimental.turbo API — migrate to stable turbopack key`,
        rootCause: 'The "experimental.turbo" config key was the old Turbopack API. In Next.js 15, Turbopack graduated to stable and the config key changed.',
        suggestion: `Migrate from:\n  experimental: { turbo: { rules: { ... } } }\nTo:\n  turbopack: { rules: { ... } }\n\nThe experimental key is still supported but will be removed in a future version.`,
        autoFixable: true, fixStatus: 'pending',
        originalCode: 'experimental: { turbo: {',
        fixedCode: 'turbopack: {',
      });
    }

    if ((hasStableTurbopack || hasExperimentalTurbo) && hasWebpackFn && !hasOnlyResolveFallback) {
      info.incompatibilities = [...(info.incompatibilities || []), 'webpack() function is ignored by Turbopack'];
      errors.push({
        id: `${path}:turbopack-webpack-conflict`,
        source: 'turbopack', severity: 'error', file: path, line: 1,
        code: 'TURBOPACK_WEBPACK_IGNORED',
        message: `webpack() config function is IGNORED when Turbopack is enabled`,
        rootCause: 'Turbopack has its own config API and does not run the webpack() function. Any customisations inside webpack() (aliases, plugins, rules) are silently skipped during Turbopack builds.',
        suggestion: `Migrate your webpack() customisations to the Turbopack API.\nSee https://nextjs.org/docs/app/api-reference/config/next-config-js/turbopack`,
        autoFixable: false, fixStatus: 'pending',
      });
    }

    if ((hasStableTurbopack || hasExperimentalTurbo) && hasWebpackPlugins) {
      info.incompatibilities = [...(info.incompatibilities || []), 'Webpack plugins incompatible with Turbopack'];
      errors.push({
        id: `${path}:turbopack-webpack-plugins`,
        source: 'turbopack', severity: 'error', file: path, line: 1,
        code: 'TURBOPACK_WEBPACK_PLUGINS',
        message: `Webpack-only plugins detected — incompatible with Turbopack`,
        rootCause: 'BundleAnalyzerPlugin, MiniCssExtractPlugin, and similar webpack plugins cannot run inside Turbopack because Turbopack does not use webpack\'s plugin API.',
        suggestion: `Remove webpack-only plugins from the webpack() function or guard them with process.env.ANALYZE checks.`,
        autoFixable: false, fixStatus: 'pending',
      });
    }

    if (usesNodePathOrFsGlob && (hasStableTurbopack || hasExperimentalTurbo)) {
      info.incompatibilities = [...(info.incompatibilities || []), 'Filesystem packages in config (fast-glob, globby, @nodelib)'];
      errors.push({
        id: `${path}:turbopack-fs-in-config`,
        source: 'turbopack', severity: 'critical', file: path, line: 1,
        code: 'TURBOPACK_FS_IN_CONFIG',
        message: `Filesystem package (fast-glob / globby / @nodelib) used in next.config — Turbopack config evaluation may fail`,
        rootCause: 'Turbopack evaluates next.config in a sandboxed environment. Packages that call Node.js filesystem APIs during config evaluation can fail because the sandbox has restricted fs access.',
        suggestion: `Move filesystem operations out of next.config into a build script or precompute them.`,
        autoFixable: false, fixStatus: 'pending',
      });
    }
  }

  return { info, errors };
}

// ─── App-type detection & dependency analysis ──────────────────────────────────

// Known latest versions — kept current as of 2026-Q1
export const LATEST_VERSIONS: Record<string, { version: string; majorChange?: boolean; devOnly?: boolean }> = {
  'react':                    { version: '19.0.0', majorChange: true },
  'react-dom':                { version: '19.0.0', majorChange: true },
  '@types/react':             { version: '19.0.7',   devOnly: true },
  '@types/react-dom':         { version: '19.0.3',   devOnly: true },
  'next':                     { version: '15.2.3' },
  'eslint-config-next':       { version: '15.2.3',   devOnly: true },
  'react-router':             { version: '7.4.0',  majorChange: true },
  'react-router-dom':         { version: '7.4.0',  majorChange: true },
  'typescript':               { version: '5.8.2',    devOnly: true },
  '@types/node':              { version: '22.13.9',  devOnly: true },
  'vite':                     { version: '6.2.1',  majorChange: true, devOnly: true },
  '@vitejs/plugin-react':     { version: '4.3.4',    devOnly: true },
  '@vitejs/plugin-react-swc': { version: '3.9.0',    devOnly: true },
  'tailwindcss':              { version: '4.0.12', majorChange: true },
  'eslint':                   { version: '9.22.0', majorChange: true, devOnly: true },
  'eslint-plugin-react':      { version: '7.37.4',   devOnly: true },
  'eslint-plugin-react-hooks':{ version: '5.1.0',    devOnly: true },
  'prettier':                 { version: '3.5.3',    devOnly: true },
  '@tanstack/react-query':    { version: '5.69.0', majorChange: true },
  '@tanstack/react-table':    { version: '8.21.2' },
  '@supabase/supabase-js':    { version: '2.49.1' },
  '@supabase/ssr':            { version: '0.5.2' },
  '@prisma/client':           { version: '6.4.1',  majorChange: true },
  'prisma':                   { version: '6.4.1',  majorChange: true, devOnly: true },
  'drizzle-orm':              { version: '0.40.0' },
  'drizzle-kit':              { version: '0.30.4',   devOnly: true },
  'zod':                      { version: '3.24.2' },
  'zustand':                  { version: '5.0.3',  majorChange: true },
  'jotai':                    { version: '2.12.2' },
  '@reduxjs/toolkit':         { version: '2.6.1' },
  'redux':                    { version: '5.0.1',  majorChange: true },
  'vitest':                   { version: '3.0.9',  majorChange: true, devOnly: true },
  'jest':                     { version: '29.7.0',   devOnly: true },
  '@testing-library/react':   { version: '16.2.0',   devOnly: true },
  '@testing-library/jest-dom':{ version: '6.6.3',    devOnly: true },
  'playwright':               { version: '1.50.1',   devOnly: true },
  'cypress':                  { version: '14.1.0',   devOnly: true },
  'lucide-react':             { version: '0.477.0' },
  'framer-motion':            { version: '12.4.7', majorChange: true },
  'motion':                   { version: '12.4.7' },
  'class-variance-authority': { version: '0.7.1' },
  'clsx':                     { version: '2.1.1' },
  'tailwind-merge':           { version: '3.0.2',  majorChange: true },
  'axios':                    { version: '1.7.9' },
  'swr':                      { version: '2.3.3' },
  'date-fns':                 { version: '4.1.0',  majorChange: true },
  'dayjs':                    { version: '1.11.13' },
  'next-auth':                { version: '5.0.0-beta.25', majorChange: true },
  'stripe':                   { version: '17.7.0', majorChange: true },
  '@stripe/stripe-js':        { version: '5.5.0',  majorChange: true },
  'next-intl':                { version: '4.0.2',  majorChange: true },
  'i18next':                  { version: '24.2.2', majorChange: true },
  'server-only':              { version: '0.0.1' },
};

export function parseSemVer(v: string): [number, number, number] {
  const clean = (v || '0').replace(/^[\^~>=v]/, '').split(/[-+]/)[0];
  const parts = clean.split('.').map(n => parseInt(n) || 0);
  return [parts[0] || 0, parts[1] || 0, parts[2] || 0];
}

function checkDepCompatibility(name: string, latestVer: string, appType: AppTypeInfo, combined: Record<string, string>): boolean {
  if ((name === 'react' || name === 'react-dom') && parseSemVer(latestVer)[0] >= 19) {
    if (appType.framework === 'nextjs') return parseSemVer(combined['next'] || '0')[0] >= 15;
  }
  if (name === 'zustand' && parseSemVer(latestVer)[0] >= 5) return parseSemVer(combined['react'] || '0')[0] >= 18;
  if (name === 'redux'   && parseSemVer(latestVer)[0] >= 5) return parseSemVer(combined['react'] || '0')[0] >= 18;
  return true;
}

export function detectAppType(files: RepoFile[], contents: Map<string, string>): AppTypeInfo {
  const pkgFile = files.find(f => f.path === 'package.json' || f.path.endsWith('/package.json'));
  let pkg: any = {};
  try { pkg = JSON.parse(contents.get(pkgFile?.path || '') || '{}'); } catch { /* ignore */ }

  const deps: Record<string, string> = { ...pkg.dependencies, ...pkg.devDependencies };
  const scripts: Record<string, string> = pkg.scripts || {};
  const devScript   = scripts['dev']   || scripts['start'] || '';
  const buildScript = scripts['build'] || '';

  let framework: AppTypeInfo['framework'] = 'unknown';
  let frameworkLabel = 'Unknown';
  let version = 'unknown';

  if (deps['next'])                         { framework = 'nextjs';      frameworkLabel = 'Next.js';                version = deps['next']; }
  else if (deps['nuxt'] || deps['nuxt3'])   { framework = 'nuxt';        frameworkLabel = 'Nuxt.js';                version = deps['nuxt'] || deps['nuxt3'] || ''; }
  else if (deps['@remix-run/react'])        { framework = 'remix';       frameworkLabel = 'Remix';                  version = deps['@remix-run/react'] || ''; }
  else if (deps['astro'])                   { framework = 'astro';       frameworkLabel = 'Astro';                  version = deps['astro'] || ''; }
  else if (deps['expo'])                    { framework = 'expo';        frameworkLabel = 'Expo (React Native)';    version = deps['expo'] || ''; }
  else if (deps['@angular/core'])           { framework = 'angular';     frameworkLabel = 'Angular';                version = deps['@angular/core'] || ''; }
  else if (deps['@sveltejs/kit'])           { framework = 'sveltekit';   frameworkLabel = 'SvelteKit';              version = deps['@sveltejs/kit'] || ''; }
  else if (deps['svelte'])                  { framework = 'svelte';      frameworkLabel = 'Svelte';                 version = deps['svelte'] || ''; }
  else if (deps['vue'])                     { framework = 'vue';         frameworkLabel = 'Vue.js';                 version = deps['vue'] || ''; }
  else if (deps['react']) {
    framework = (deps['vite'] || deps['@vitejs/plugin-react'] || deps['@vitejs/plugin-react-swc'])
      ? 'react-vite' : 'react-cra';
    frameworkLabel = framework === 'react-vite' ? 'React + Vite' : 'React (CRA/Custom)';
    version = deps['react'] || '';
  }

  let buildTool: AppTypeInfo['buildTool'] = 'unknown';
  if (deps['next'])         buildTool = (devScript.includes('--turbo') || buildScript.includes('--turbo')) ? 'turbopack' : 'webpack';
  else if (deps['vite'] || deps['@vitejs/plugin-react']) buildTool = 'vite';
  else if (deps['parcel'])  buildTool = 'parcel';
  else if (deps['webpack']) buildTool = 'webpack';

  const hasTsCfg  = files.some(f => f.path.endsWith('tsconfig.json'));
  const hasTsFile = files.some(f => f.path.endsWith('.ts') || f.path.endsWith('.tsx'));
  const hasJsFile = files.some(f => f.path.endsWith('.js') || f.path.endsWith('.jsx'));
  let language: AppTypeInfo['language'] = 'javascript';
  if ((hasTsCfg || deps['typescript']) && hasTsFile) language = hasJsFile ? 'mixed' : 'typescript';

  let packageManager: AppTypeInfo['packageManager'] = 'npm';
  const lockPaths = files.map(f => f.path.toLowerCase());
  if (lockPaths.some(f => f.endsWith('pnpm-lock.yaml'))) packageManager = 'pnpm';
  else if (lockPaths.some(f => f.endsWith('bun.lockb') || f.includes('bun.lock'))) packageManager = 'bun';
  else if (lockPaths.some(f => f.endsWith('yarn.lock'))) packageManager = 'yarn';

  let cssFramework: string | undefined;
  if (deps['tailwindcss'])           cssFramework = 'Tailwind CSS';
  else if (deps['@chakra-ui/react']) cssFramework = 'Chakra UI';
  else if (deps['@mui/material'])    cssFramework = 'Material UI';
  else if (deps['antd'])             cssFramework = 'Ant Design';
  else if (deps['styled-components'])cssFramework = 'Styled Components';
  else if (deps['@emotion/react'])   cssFramework = 'Emotion';

  let testFramework: string | undefined;
  if (deps['vitest'])      testFramework = 'Vitest';
  else if (deps['jest'])   testFramework = 'Jest';
  else if (deps['playwright']) testFramework = 'Playwright';
  else if (deps['cypress'])    testFramework = 'Cypress';

  let stateManagement: string | undefined;
  if (deps['zustand'])                    stateManagement = 'Zustand';
  else if (deps['jotai'])                 stateManagement = 'Jotai';
  else if (deps['recoil'])                stateManagement = 'Recoil';
  else if (deps['@reduxjs/toolkit'])      stateManagement = 'Redux Toolkit';
  else if (deps['@tanstack/react-query'] || deps['react-query']) stateManagement = 'TanStack Query';

  let deployTarget: string | undefined;
  if (files.some(f => f.path === 'vercel.json'))    deployTarget = 'Vercel';
  else if (files.some(f => f.path === 'netlify.toml')) deployTarget = 'Netlify';
  else if (files.some(f => f.path === 'fly.toml'))  deployTarget = 'Fly.io';
  else if (files.some(f => f.path.includes('railway'))) deployTarget = 'Railway';

  const pm  = packageManager;
  const run = pm === 'yarn' ? 'yarn' : pm === 'pnpm' ? 'pnpm' : pm === 'bun' ? 'bun run' : 'npm run';

  return {
    framework, frameworkLabel, buildTool, language, packageManager, version,
    cssFramework, testFramework, stateManagement, deployTarget,
    runScript: `${run} dev`, buildScript: `${run} build`,
  };
}

export function analyzeDependencies(files: RepoFile[], contents: Map<string, string>, appType: AppTypeInfo): DependencyReport {
  const pkgFile = files.find(f => f.path === 'package.json' || f.path.endsWith('/package.json'));
  let pkg: any = {};
  try { pkg = JSON.parse(contents.get(pkgFile?.path || '') || '{}'); } catch {
    return { totalDeps: 0, outdated: [], missing: [], conflicts: [], allDeps: {}, devDeps: {}, installCommands: [] };
  }

  const allDeps: Record<string, string> = { ...pkg.dependencies };
  const devDeps:  Record<string, string> = { ...pkg.devDependencies };
  const combined  = { ...allDeps, ...devDeps };

  const outdated: DependencyIssue[] = [];
  const missing:  DependencyIssue[] = [];
  const conflicts:DependencyIssue[] = [];

  for (const [name, latestInfo] of Object.entries(LATEST_VERSIONS)) {
    const current = combined[name];
    if (!current) continue;
    const [curMaj, curMin, curPatch] = parseSemVer(current);
    const [latMaj, latMin, latPatch] = parseSemVer(latestInfo.version);
    if (curMaj > latMaj) continue;

    if (latMaj > curMaj) {
      const compat = checkDepCompatibility(name, latestInfo.version, appType, combined);
      outdated.push({
        name, current, latest: latestInfo.version, type: 'outdated-major',
        severity: latestInfo.majorChange ? 'warning' : 'info',
        description: `${name} v${curMaj} → v${latMaj} (major update${latestInfo.majorChange ? ' — check breaking changes' : ''})`,
        autoFixable: compat, fixCommand: `npm install ${name}@latest`, compatible: compat,
      });
    } else if (latMin > curMin || (latMin === curMin && latPatch > curPatch)) {
      outdated.push({
        name, current, latest: latestInfo.version, type: 'outdated-minor',
        severity: 'info',
        description: `${name} ${current} → ${latestInfo.version}`,
        autoFixable: true, fixCommand: `npm install ${name}@latest`, compatible: true,
      });
    }
  }

  if (appType.framework === 'nextjs' && !combined['server-only']) {
    if (files.some(f => /\/(utils|lib|server|services|helpers)\//.test(f.path))) {
      missing.push({
        name: 'server-only', current: 'not installed', latest: '0.0.1',
        type: 'missing-required', severity: 'warning',
        description: 'server-only not installed — add to protect server utilities from browser bundle',
        autoFixable: true, fixCommand: 'npm install server-only', compatible: true,
      });
    }
  }
  if (appType.language === 'typescript' && !combined['@types/node']) {
    missing.push({
      name: '@types/node', current: 'not installed', latest: LATEST_VERSIONS['@types/node']?.version || 'latest',
      type: 'missing-required', severity: 'warning',
      description: '@types/node missing — TypeScript cannot resolve Node.js types (fs, path, process…)',
      autoFixable: true, fixCommand: 'npm install -D @types/node@latest', compatible: true,
    });
  }

  const [reactMaj] = parseSemVer(combined['react'] || '0');
  if (reactMaj >= 19) {
    for (const bad of ['react-beautiful-dnd', 'react-helmet', 'react-table']) {
      if (combined[bad]) conflicts.push({
        name: bad, current: combined[bad], latest: 'n/a',
        type: 'peer-conflict', severity: 'warning',
        description: `${bad} may not fully support React 19 — use --legacy-peer-deps or find a v19-compatible fork`,
        autoFixable: false, fixCommand: `npm install ${bad}@latest --legacy-peer-deps`, compatible: false,
      });
    }
  }
  if (reactMaj <= 17 && combined['react-router-dom']) {
    const [rrMaj] = parseSemVer(combined['react-router-dom']);
    if (rrMaj >= 6) conflicts.push({
      name: 'react-router-dom', current: combined['react-router-dom'],
      latest: LATEST_VERSIONS['react-router-dom']?.version || '7.x',
      type: 'peer-conflict', severity: 'critical',
      description: `react-router-dom v${rrMaj} requires React 18+ but react@${combined['react']} is installed`,
      autoFixable: true, fixCommand: 'npm install react@latest react-dom@latest', compatible: false,
    });
  }
  if (combined['@tanstack/react-query'] && reactMaj < 18) {
    const [tqMaj] = parseSemVer(combined['@tanstack/react-query']);
    if (tqMaj >= 5) conflicts.push({
      name: '@tanstack/react-query', current: combined['@tanstack/react-query'],
      latest: LATEST_VERSIONS['@tanstack/react-query']?.version || '5.x',
      type: 'peer-conflict', severity: 'critical',
      description: '@tanstack/react-query v5 requires React 18+ — upgrade react and react-dom first',
      autoFixable: true, fixCommand: 'npm install react@latest react-dom@latest', compatible: false,
    });
  }

  const pm = appType.packageManager;
  const add    = pm === 'yarn' ? 'yarn add' : pm === 'pnpm' ? 'pnpm add' : pm === 'bun' ? 'bun add' : 'npm install';
  const addDev = pm === 'yarn' ? 'yarn add -D' : pm === 'pnpm' ? 'pnpm add -D' : pm === 'bun' ? 'bun add -d' : 'npm install -D';

  const installCommands: string[] = [];
  const majorCompat = outdated.filter(d => d.type === 'outdated-major' && d.compatible);
  const prodUp = majorCompat.filter(d => !LATEST_VERSIONS[d.name]?.devOnly);
  const devUp  = majorCompat.filter(d =>  LATEST_VERSIONS[d.name]?.devOnly);
  if (prodUp.length > 0) installCommands.push(`${add} ${prodUp.map(d => `${d.name}@latest`).join(' ')}`);
  if (devUp.length  > 0) installCommands.push(`${addDev} ${devUp.map(d => `${d.name}@latest`).join(' ')}`);

  const missProd = missing.filter(d => !LATEST_VERSIONS[d.name]?.devOnly);
  const missDev  = missing.filter(d =>  LATEST_VERSIONS[d.name]?.devOnly);
  if (missProd.length > 0) installCommands.push(`${add} ${missProd.map(d => d.name).join(' ')}`);
  if (missDev.length  > 0) installCommands.push(`${addDev} ${missDev.map(d => d.name).join(' ')}`);

  return { totalDeps: Object.keys(combined).length, outdated, missing, conflicts, allDeps, devDeps, installCommands };
}

// ─── Tailwind v4 Migration Engine ─────────────────────────────────────────────
export function buildTailwindV4Migration(
  files: RepoFile[],
  contents: Map<string, string>,
  appType: AppTypeInfo,
  depReport: DependencyReport,
): TailwindMigration {
  const combined = { ...depReport.allDeps, ...depReport.devDeps };
  const currentTw = combined['tailwindcss'] || '';
  const [twMaj] = parseSemVer(currentTw);

  const detected = !!currentTw;
  const isV3 = detected && twMaj <= 3 && twMaj > 0;

  const cssFiles: TailwindMigrationFile[] = [];
  const configFiles: TailwindMigrationFile[] = [];
  const removedPackages: string[] = [];
  const addedPackages: Record<string, string> = {};
  const updatedPackages: Record<string, { from: string; to: string }> = {};
  const installCommands: string[] = [];
  const breakingChanges: string[] = [];
  const summary: string[] = [];

  let buildIntegration: TailwindMigration['buildIntegration'] = 'postcss';
  if (appType.framework === 'nextjs') buildIntegration = 'nextjs';
  else if (appType.buildTool === 'vite') buildIntegration = 'vite';

  if (!detected) {
    summary.push('Tailwind CSS not detected in this project — no migration needed.');
    return { detected, fromVersion: 'not installed', toVersion: '4.x', isV3: false, buildIntegration, cssFiles, configFiles, removedPackages, addedPackages, updatedPackages, installCommands, breakingChanges, summary };
  }

  if (!isV3) {
    summary.push(`Tailwind CSS ${currentTw} detected — already v4+ (no migration needed).`);
    return { detected, fromVersion: currentTw, toVersion: '4.x', isV3: false, buildIntegration, cssFiles, configFiles, removedPackages, addedPackages, updatedPackages, installCommands, breakingChanges, summary };
  }

  updatedPackages['tailwindcss'] = { from: currentTw, to: '^4.0.0' };

  if (combined['autoprefixer']) {
    removedPackages.push('autoprefixer');
    breakingChanges.push('autoprefixer is now built into Tailwind v4 — remove it from postcss.config and package.json.');
  }
  if (combined['postcss-import']) {
    breakingChanges.push('postcss-import: verify you still need it — @import is handled natively by Tailwind v4.');
  }

  if (buildIntegration === 'vite') {
    addedPackages['@tailwindcss/vite'] = '^4.0.0';
    installCommands.push(`npm install -D tailwindcss@latest @tailwindcss/vite`);
    if (combined['autoprefixer']) installCommands.push(`npm uninstall autoprefixer`);
    summary.push('Switch from PostCSS integration to the @tailwindcss/vite plugin (faster HMR).');
  } else {
    addedPackages['@tailwindcss/postcss'] = '^4.0.0';
    installCommands.push(`npm install -D tailwindcss@latest @tailwindcss/postcss`);
    if (combined['autoprefixer']) installCommands.push(`npm uninstall autoprefixer`);
    summary.push('Replace tailwindcss PostCSS plugin with @tailwindcss/postcss.');
  }

  for (const file of files) {
    if (!file.path.match(/\.(css|scss|sass|less)$/i)) continue;
    const content = contents.get(file.path) || '';
    if (!content.includes('@tailwind')) continue;

    let updated = content;
    updated = updated.replace(
      /@tailwind\s+base;\s*\n\s*@tailwind\s+components;\s*\n\s*@tailwind\s+utilities;/g,
      '@import "tailwindcss";'
    );
    updated = updated.replace(
      /@tailwind\s+base;\s*\n\s*@tailwind\s+utilities;/g,
      '@import "tailwindcss";'
    );
    updated = updated.replace(/@tailwind\s+base;/g, '/* removed: included in @import "tailwindcss" */');
    updated = updated.replace(/@tailwind\s+components;/g, '/* removed: included in @import "tailwindcss" */');
    updated = updated.replace(/@tailwind\s+utilities;/g, '/* removed: included in @import "tailwindcss" */');

    if (updated !== content) {
      cssFiles.push({ path: file.path, original: content, updated, description: 'Replaced @tailwind directives with @import "tailwindcss"' });
    }
  }

  for (const file of files) {
    if (!file.path.match(/postcss\.config\.(js|ts|cjs|mjs)$/i)) continue;
    const content = contents.get(file.path) || '';
    let updated = content;

    updated = updated.replace(/require\(\s*['"]tailwindcss['"]\s*\)/g, "require('@tailwindcss/postcss')");
    updated = updated.replace(/'tailwindcss'\s*:/g, "'@tailwindcss/postcss':");
    updated = updated.replace(/"tailwindcss"\s*:/g, '"@tailwindcss/postcss":');
    updated = updated.replace(/tailwindcss\s*:\s*\{\}/g, "'@tailwindcss/postcss': {}");
    updated = updated.replace(/,?\s*autoprefixer\s*:\s*\{\}\s*,?/g, '');
    updated = updated.replace(/,?\s*require\(\s*['"]autoprefixer['"]\s*\)\s*,?/g, '');

    if (updated !== content) {
      configFiles.push({ path: file.path, original: content, updated, description: 'Replaced tailwindcss PostCSS plugin with @tailwindcss/postcss; removed autoprefixer' });
    }
  }

  if (buildIntegration === 'vite') {
    for (const file of files) {
      if (!file.path.match(/vite\.config\.(ts|js|mts|mjs)$/i)) continue;
      const content = contents.get(file.path) || '';
      if (!content.includes('tailwindcss') && !content.includes('autoprefixer')) continue;

      let updated = content;
      if (!updated.includes('@tailwindcss/vite')) {
        updated = `import tailwindcss from '@tailwindcss/vite';\n` + updated;
      }
      updated = updated.replace(
        /css\s*:\s*\{[^}]*postcss[^}]*\}/gs,
        (m) => m.replace(/tailwindcss[^,\n}]*/g, '').replace(/autoprefixer[^,\n}]*/g, '').replace(/,\s*,/g, ',').replace(/\{\s*,/g, '{').replace(/,\s*\}/g, '}')
      );
      if (!updated.includes('tailwindcss()')) {
        updated = updated.replace(/plugins\s*:\s*\[/, 'plugins: [\n    tailwindcss(),');
      }

      if (updated !== content) {
        configFiles.push({ path: file.path, original: content, updated, description: 'Added @tailwindcss/vite plugin; removed PostCSS tailwindcss integration' });
      }
    }
  }

  const hasTwConfig = files.some(f => f.path.match(/tailwind\.config\.(js|ts|cjs|mjs)$/i));
  if (hasTwConfig) {
    breakingChanges.push('tailwind.config.js: v4 uses CSS-based config. Add @config "./tailwind.config.js" to your main CSS file, or migrate theme settings to @theme {} blocks in CSS.');
    summary.push('tailwind.config.js detected — add @config reference in CSS or migrate to @theme {}.');
  }

  breakingChanges.push('shadow, ring, and border default colors changed — verify UI appearance after upgrade.');
  breakingChanges.push('Content configuration is now automatic in v4 — remove the "content" array from tailwind.config.js if migrating to CSS config.');
  breakingChanges.push('Peer utilities (peer-*, group-*) require explicit variants — check any dynamic variant usage.');

  summary.push(`Migrate ${cssFiles.length} CSS file${cssFiles.length !== 1 ? 's' : ''}: @tailwind directives → @import "tailwindcss"`);
  if (configFiles.length > 0) summary.push(`Update ${configFiles.length} config file${configFiles.length !== 1 ? 's' : ''}: PostCSS / Vite / Vite config`);

  return { detected, fromVersion: currentTw, toVersion: '^4.0.0', isV3, buildIntegration, cssFiles, configFiles, removedPackages, addedPackages, updatedPackages, installCommands, breakingChanges, summary };
}

// ─── Generate updated package.json ────────────────────────────────────────────
export function generateUpdatedPackageJson(
  contents: Map<string, string>,
  depReport: DependencyReport,
  twMigration: TailwindMigration | null,
): string {
  const pkgPath = [...contents.keys()].find(k => k === 'package.json' || k.endsWith('/package.json'));
  if (!pkgPath) return '';
  let pkg: any = {};
  try { pkg = JSON.parse(contents.get(pkgPath) || '{}'); } catch { return ''; }

  const updated = JSON.parse(JSON.stringify(pkg));

  for (const dep of depReport.outdated) {
    const prefix = (updated.dependencies?.[dep.name] || updated.devDependencies?.[dep.name] || '^').match(/^[\^~>=]/)?.[0] ?? '^';
    if (updated.dependencies?.[dep.name]) updated.dependencies[dep.name] = `${prefix}${dep.latest}`;
    if (updated.devDependencies?.[dep.name]) updated.devDependencies[dep.name] = `${prefix}${dep.latest}`;
  }

  if (twMigration?.isV3) {
    for (const name of twMigration.removedPackages) {
      delete updated.dependencies?.[name];
      delete updated.devDependencies?.[name];
    }
    for (const [name, version] of Object.entries(twMigration.addedPackages)) {
      if (!updated.devDependencies) updated.devDependencies = {};
      updated.devDependencies[name] = version;
    }
    const twPrefix = (updated.devDependencies?.['tailwindcss'] || updated.dependencies?.['tailwindcss'] || '^').match(/^[\^~>=]/)?.[0] ?? '^';
    if (updated.devDependencies?.['tailwindcss']) updated.devDependencies['tailwindcss'] = `${twPrefix}4.0.0`;
    if (updated.dependencies?.['tailwindcss'])    updated.dependencies['tailwindcss']    = `${twPrefix}4.0.0`;
  }

  return JSON.stringify(updated, null, 2);
}
