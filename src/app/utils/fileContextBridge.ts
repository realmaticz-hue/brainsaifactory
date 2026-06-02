/**
 * fileContextBridge.ts
 *
 * Invisible shared memory between AICodeAssistant (writer) and GeniusAIChat (reader).
 * Uses localStorage so there is zero prop-drilling and the bridge works across
 * any component tree position.  GeniusAIChat never surfaces the bridge to the user.
 */

export interface BridgeFile {
  path: string;       // e.g. "src/components/App.tsx"
  content: string;    // raw source
  fixedContent?: string;
  language: string;   // "typescript" | "javascript" | etc.
  repository?: string;
  branch?: string;
}

const STORAGE_KEY = 'ai_chat_file_bridge';
const MAX_STORED_FILES = 200; // keep memory sane

// ─── Write ────────────────────────────────────────────────────────────────────

export function bridgeSaveFiles(
  files: BridgeFile[],
  repository?: string,
  branch?: string
): void {
  try {
    const payload = files.slice(0, MAX_STORED_FILES).map(f => ({
      ...f,
      repository: repository ?? f.repository,
      branch: branch ?? f.branch
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (e) {
    console.error('[FileContextBridge] Failed to save files:', e);
  }
}

export function bridgeClearFiles(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (_) { }
}

// ─── Read ─────────────────────────────────────────────────────────────────────

export function bridgeGetFiles(): BridgeFile[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as BridgeFile[];
  } catch (_) {
    return [];
  }
}

export function bridgeHasFiles(): boolean {
  return bridgeGetFiles().length > 0;
}

// ─── Smart Error-to-File Matching ─────────────────────────────────────────────

/**
 * Given a raw error string (terminal output / browser console / user description),
 * return the list of bridge files that are most likely related to that error.
 *
 * Strategy:
 *  1. Extract explicit filenames from the error text
 *  2. Match component/function names mentioned in the error
 *  3. Match language-level keywords (e.g. "react-dom" → look at tsx files)
 *  4. DOM nesting / hydration / missing-key hints → boost JSX files
 *  5. Fallback: return all files if nothing specific found
 */
export function bridgeFindRelevantFiles(errorText: string, p0: number): BridgeFile[] {
  const files = bridgeGetFiles();
  if (files.length === 0) return [];

  const lower = errorText.toLowerCase();
  const scored: Array<{ file: BridgeFile; score: number }> = files.map(f => {
    let score = 0;
    const fLower = f.path.toLowerCase();
    const fname = f.path.split('/').pop()?.toLowerCase() ?? '';

    // ── Explicit filename mention ──
    if (lower.includes(fname)) score += 40;

    // ── Partial path match ──
    const pathParts = f.path.toLowerCase().split('/');
    pathParts.forEach(part => {
      if (part.length > 3 && lower.includes(part)) score += 10;
    });

    // ── Component / function name in content matches error keywords ──
    const componentNameMatch = f.content.match(/(?:export\s+(?:function|class|const)\s+)(\w+)/g);
    if (componentNameMatch) {
      componentNameMatch.forEach(m => {
        const name = m.replace(/export\s+(function|class|const)\s+/, '').trim();
        if (name.length > 2 && lower.includes(name.toLowerCase())) score += 25;
      });
    }

    // ── Error message contains line number that exists in file ──
    const lineMatch = lower.match(/line\s+(\d+)/);
    if (lineMatch) {
      const lineNum = parseInt(lineMatch[1]);
      const totalLines = f.content.split('\n').length;
      if (lineNum <= totalLines) score += 5;
    }

    // ── Technology keywords ──
    if ((lower.includes('react') || lower.includes('jsx') || lower.includes('tsx')) &&
      (fname.endsWith('.tsx') || fname.endsWith('.jsx'))) score += 8;
    if ((lower.includes('css') || lower.includes('style')) && fname.endsWith('.css')) score += 8;
    if ((lower.includes('json') || lower.includes('package')) && fname.endsWith('.json')) score += 8;

    // ── DOM nesting / hydration hints → boost JSX files ──
    if ((lower.includes('validatedomnesting') || lower.includes('dom nesting') ||
      lower.includes('hydration') || lower.includes('nested interactive') ||
      lower.includes('<button') || lower.includes('<a ')) &&
      (fname.endsWith('.tsx') || fname.endsWith('.jsx'))) score += 15;

    // ── Missing key prop hints → boost JSX files ──
    if ((lower.includes('each child in a list') || lower.includes('missing key') ||
      lower.includes('unique key') || lower.includes('"key" prop')) &&
      (fname.endsWith('.tsx') || fname.endsWith('.jsx'))) score += 15;

    // ── useEffect / exhaustive-deps hints → files that use useEffect ──
    if ((lower.includes('exhaustive-deps') || lower.includes('react-hooks') ||
      lower.includes('missing dependency') || lower.includes('useeffect')) &&
      f.content.includes('useEffect')) score += 12;

    // ── Import/module errors — check if file is imported somewhere ──
    if (lower.includes('module not found') || lower.includes("can't resolve")) {
      const importedName = lower.match(/resolve\s+'([^']+)'/) || lower.match(/module\s+'([^']+)'/);
      if (importedName && (fLower.includes(importedName[1]) || f.content.includes(importedName[1]))) {
        score += 30;
      }
    }

    return { file: f, score };
  });

  // Sort by score desc, return files with score > 0, or top 3 if nothing matches
  const relevant = scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(s => s.file);

  return relevant.length > 0 ? relevant : [];
}

// ─── Code Corrector ───────────────────────────────────────────────────────────

/**
 * Apply a series of safe automatic fixes to file content.
 * Returns { fixedContent, changes: string[] }
 */
export function applyAutoFixes(
  content: string,
  errorHint: string
): { fixedContent: string; changes: string[] } {
  const changes: string[] = [];
  let code = content;

  // ── Universal fixes (always applied) ──

  // Double semicolons
  const dblSemi = code.match(/;;+/g);
  if (dblSemi) {
    code = code.replace(/;;+/g, ';');
    changes.push('Removed duplicate semicolons');
  }

  // Corrupted generics:  useState<; → useState<
  if (code.match(/\w+<;/g)) {
    code = code.replace(/(\w+)<;/g, '$1<');
    changes.push('Fixed corrupted generic type brackets');
  }

  // Corrupted function calls:  someFunc(;  →  someFunc(
  if (code.match(/\w+\(;/g)) {
    code = code.replace(/(\w+\();?\s*/g, '$1');
    changes.push('Fixed corrupted function call parentheses');
  }

  // Trailing whitespace
  const hasTrailing = code.split('\n').some(l => /\s+$/.test(l));
  if (hasTrailing) {
    code = code.split('\n').map(l => l.trimEnd()).join('\n');
    changes.push('Removed trailing whitespace');
  }

  const lower = errorHint.toLowerCase();

  // ── DOM Nesting Violation: nested <button> inside <button> ────────────────
  // Detects and fixes patterns like <button onClick={...}> ... <button ... />
  // by converting the outer <button> to <div role="button" ...>
  const isJSXContent = code.includes('<button') || code.includes('<a ') || code.includes('<a\n');

  if (isJSXContent) {
    const lines = code.split('\n');
    let buttonDepth = 0;
    let outerButtonLineIdx = -1;
    let outerButtonCloseLineIdx = -1;
    let nestingFixed = false;

    for (let i = 0; i < lines.length; i++) {
      const ln = lines[i];
      const hasSelfClose = /<button[^>]*\/>/.test(ln);
      const hasOpenButton = (!hasSelfClose && /<button[\s>]/.test(ln)) || ln.trimStart().startsWith('<button>');
      const hasCloseButton = /<\/button>/.test(ln);

      if (hasOpenButton) {
        if (buttonDepth === 0) {
          outerButtonLineIdx = i;
        } else if (buttonDepth >= 1 && outerButtonLineIdx >= 0 && !nestingFixed) {
          const outerLine = lines[outerButtonLineIdx];
          lines[outerButtonLineIdx] = outerLine
            .replace(/<button(\s)/, '<div role="button"$1')
            .replace(/<button>/, '<div role="button">');
          nestingFixed = true;
          changes.push(
            `Line ${outerButtonLineIdx + 1}: Converted outer <button> to <div role="button"> ` +
            `to fix DOM nesting violation (nested <button> at line ${i + 1})`
          );
        }
        buttonDepth++;
      }

      if (hasCloseButton) {
        buttonDepth = Math.max(0, buttonDepth - 1);
        if (buttonDepth === 0 && nestingFixed && outerButtonCloseLineIdx === -1) {
          lines[i] = lines[i].replace(/<\/button>/, '</div>');
          outerButtonCloseLineIdx = i;
          changes.push(`Line ${i + 1}: Converted matching </button> to </div>`);
        }
        if (buttonDepth === 0) {
          outerButtonLineIdx = -1;
          nestingFixed = false;
          outerButtonCloseLineIdx = -1;
        }
      }
    }

    if (changes.some(c => c.includes('DOM nesting') || c.includes('outer <button>'))) {
      code = lines.join('\n');
    }
  }
  // ── End DOM Nesting fix ───────────────────────────────────────────────────

  // ── Cross-tag DOM nesting: <button> wrapping <a>, or <a> wrapping <button> ──
  const hasCrossTagHint =
    lower.includes('validatedomnesting') || lower.includes('dom nesting') ||
    lower.includes('hydration') || lower.includes('nested interactive');

  if (hasCrossTagHint && code.includes('<button') && code.includes('<a')) {
    // <button> wrapping <a> — convert outer button to div role="button"
    if (/<button\b[^>]*>[\s\S]*?<a\s/.test(code)) {
      code = code
        .replace(/<button(\s)/g, (_m, sp) => `<div role="button"${sp}`)
        .replace(/<button>/g, '<div role="button">')
        .replace(/<\/button>/g, '</div>');
      changes.push(
        'Cross-tag DOM nesting: converted <button> wrapping <a> to <div role="button">'
      );
    }
    // <a> wrapping <button> — convert outer anchor to span role="link"
    if (/<a\b[^>]*>[\s\S]*?<button\s/.test(code) && !changes.some(c => c.includes('Cross-tag'))) {
      code = code
        .replace(/<a(\s)/g, (_m, sp) => `<span role="link"${sp}`)
        .replace(/<a>/g, '<span role="link">')
        .replace(/<\/a>/g, '</span>');
      changes.push(
        'Cross-tag DOM nesting: converted <a> wrapping <button> to <span role="link">'
      );
    }
  }
  // ── End Cross-tag DOM nesting fix ─────────────────────────────────────────

  // ── Missing React key prop in .map() calls ────────────────────────────────
  if (
    lower.includes('each child in a list') ||
    lower.includes('missing key') ||
    lower.includes('unique key') ||
    lower.includes('"key" prop') ||
    lower.includes('key prop')
  ) {
    let keyFixed = false;
    code = code.replace(
      /\.map\(\((\w+)(?:,\s*(\w+))?\)\s*=>\s*(<(?!\/)[A-Za-z][A-Za-z]*)\s(?![^>]*\bkey=)/g,
      (_match, item, idx, tag) => {
        keyFixed = true;
        const keyExpr = idx ? `key={${idx}}` : `key={${item}.id ?? ${item}.key ?? \`item-\${Math.random()}\`}`;
        return _match.replace(tag + ' ', `${tag} ${keyExpr} `);
      }
    );
    if (keyFixed) changes.push('Added missing key prop to .map() JSX elements');
  }
  // ── End missing key prop fix ──────────────────────────────────────────────

  // ── React-version-mismatch: add resolutions comment near package.json hints ──
  if (
    lower.includes('react') && lower.includes('react-dom') &&
    (lower.includes('version') || lower.includes('mismatch'))
  ) {
    if (code.includes('"react"') && !code.includes('"overrides"')) {
      code = code.replace(
        /"dependencies"\s*:\s*\{/,
        '"overrides": {\n    "react": "^18.0.0",\n    "react-dom": "^18.0.0"\n  },\n  "dependencies": {'
      );
      changes.push('Added npm "overrides" block to lock react + react-dom versions');
    }
  }

  // ── Cannot read properties: add optional chaining ──
  if (lower.includes('cannot read propert') || lower.includes('undefined')) {
    // Conservative: report only — complex auto-mod would break too many safe patterns
    const propAccessPattern = /(\b\w+)\.(\w+)(?!\?)/g;
    let changed = false;
    code = code.replace(propAccessPattern, (match, obj) => {
      const safePrefixes = ['this', 'Math', 'Object', 'Array', 'console', 'window', 'document', 'process', 'JSON', 'Promise'];
      if (safePrefixes.includes(obj)) return match;
      return match; // conservative — don't auto-modify
    });
    if (changed) changes.push('Added optional chaining (?.) to property accesses');
  }

  // ── Missing closing JSX tags — count and add if obviously unbalanced ──
  if (lower.includes('unexpected end') || lower.includes('missing closing') || lower.includes('unterminated jsx')) {
    const openDivs = (code.match(/<div[\s>]/g) || []).length;
    const closeDivs = (code.match(/<\/div>/g) || []).length;
    if (openDivs > closeDivs) {
      const diff = openDivs - closeDivs;
      code = code.trimEnd();
      for (let i = 0; i < diff; i++) code += '\n</div>';
      code += '\n';
      changes.push(`Added ${diff} missing </div> closing tag(s)`);
    }
  }

  // ── CORS: Add cors import hint if not present ──
  if (lower.includes('cors') && code.includes("from 'npm:hono'") && !code.includes('cors')) {
    code = code.replace(
      "from 'npm:hono'",
      "from 'npm:hono'\nimport { cors } from 'npm:hono/cors';"
    );
    changes.push("Added missing `import { cors } from 'npm:hono/cors'`");
  }

  return { fixedContent: code, changes };
}

/**
 * Generate the full titled file-rewrite block that GeniusAIChat presents to the user.
 */
export function generateFileRewriteBlock(
  file: BridgeFile,
  changes: string[],
  fixedContent: string,
  errorSummary: string
): string {
  const filename = file.path.split('/').pop() ?? file.path;
  const lang = file.language ?? 'typescript';

  const changelist = changes.length > 0
    ? changes.map((c, i) => `${i + 1}. ${c}`).join('\n')
    : '1. No automatic changes needed — see manual fix steps below';

  return `## 📄 CORRECTED FILE: ${filename}

**Full Path:** \`${file.path}\`
**Language:** ${lang}
**Fixes Applied:**
${changelist}

---

### How to Use This:
1. Copy the entire code block below
2. Open \`${file.path}\` in your editor
3. Select all (Ctrl+A / Cmd+A) and paste
4. Save the file and restart your dev server

---

\`\`\`${lang}
${fixedContent}
\`\`\`

---

> **Note:** This rewrite addresses: *${errorSummary.slice(0, 120)}*
> Always review the changes before pasting. If the file is very large, apply only the changed sections.`;
}

// ─── Single-File Code Context (Copilot / Analyze bridge) ──────────────────────

const CURRENT_CODE_KEY = 'ai_chat_current_code';
const COPILOT_QUERY_KEY = 'ai_copilot_pending_query';

export interface CurrentCodeContext {
  code: string;
  filename: string;
  language: string;
  timestamp: string;
}

/**
 * Called by AICodeAssistant when a file is uploaded or pasted.
 * GeniusAIChat reads this to give code-aware responses.
 */
export function bridgeSaveCurrentCode(
  code: string,
  filename: string,
  language: string
): void {
  try {
    const payload: CurrentCodeContext = {
      code, filename, language,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem(CURRENT_CODE_KEY, JSON.stringify(payload));
  } catch (e) {
    console.error('[FileContextBridge] Failed to save current code:', e);
  }
}

export function bridgeGetCurrentCode(): CurrentCodeContext | null {
  try {
    const raw = localStorage.getItem(CURRENT_CODE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CurrentCodeContext;
  } catch (_) {
    return null;
  }
}

export function bridgeClearCurrentCode(): void {
  try { localStorage.removeItem(CURRENT_CODE_KEY); } catch (_) { }
}

export function bridgeHasCurrentCode(): boolean {
  return bridgeGetCurrentCode() !== null;
}

// ─── Copilot Pending-Query (Ask AI about a specific error) ────────────────────

/**
 * AICodeAssistant calls this before switching to chat mode so GeniusAIChat
 * auto-populates the input with the error question on next mount.
 */
export function bridgeSaveCopilotQuery(query: string): void {
  try {
    localStorage.setItem(COPILOT_QUERY_KEY, query);
  } catch (_) { }
}

/**
 * GeniusAIChat calls this on init. Returns the pending query and clears it
 * so it only fires once.
 */
export function bridgeGetAndClearCopilotQuery(): string | null {
  try {
    const q = localStorage.getItem(COPILOT_QUERY_KEY);
    if (q) localStorage.removeItem(COPILOT_QUERY_KEY);
    return q;
  } catch (_) {
    return null;
  }
}