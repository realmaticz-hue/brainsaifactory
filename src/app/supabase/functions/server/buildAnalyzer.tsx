// buildAnalyzer.tsx — AI-Powered Build Error Analyzer
// Uses OpenRouter (Claude / GPT-4o) to deeply analyze build logs and fix code.
// Surfaces: GitRepair Build Log tab + OneCompiler Code Fixer

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

const OPENROUTER_BASE = "https://openrouter.ai/api/v1";

// ─── Preferred models (falls back in order) ────────────────────────────────
const ANALYZE_MODELS = [
  "google/gemini-2.0-flash-001",
  "anthropic/claude-3.5-haiku",
  "openai/gpt-4o-mini",
  "meta-llama/llama-3.1-8b-instruct:free",
  "google/gemini-2.0-flash-exp:free",
  "mistralai/mistral-7b-instruct:free",
];

async function callOpenRouter(
  model: string,
  messages: { role: string; content: string }[],
  maxTokens = 2048,
): Promise<string> {
  const apiKey = Deno.env.get('OPENROUTER_API_KEY');
  if (!apiKey) throw new Error("OPENROUTER_API_KEY not set");

  const res = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://ai-app-builder.app",
      "X-Title": "Git Repair Self-Healing Build System",
    },
    body: JSON.stringify({ model, messages, max_tokens: maxTokens, temperature: 0.1 }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenRouter ${model}: ${res.status} — ${err.slice(0, 200)}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

async function callWithFallback(
  messages: { role: string; content: string }[],
  maxTokens = 2048,
): Promise<{ text: string; model: string }> {
  for (const model of ANALYZE_MODELS) {
    try {
      const text = await callOpenRouter(model, messages, maxTokens);
      if (text.trim()) return { text, model };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.log(`[BuildAnalyzer] Model ${model} failed: ${errorMessage} — trying next`);
    }
  }
  throw new Error("All OpenRouter models failed for build analysis");
}

// ─── BUILD LOG ANALYSIS ────────────────────────────────────────────────────────

export interface AIBuildAnalysis {
  summary: string;
  rootCauses: {
    file: string;
    line: number;
    errorType: string;
    description: string;
    fixedImport?: string;
    brokenImport?: string;
    steps: string[];
    autoFixable: boolean;
  }[];
  globalFixes: string[];
  patchBlocks: { file: string; original: string; fixed: string; description: string }[];
  model: string;
}

const BUILD_ANALYSIS_SYSTEM = `You are an expert TypeScript/JavaScript build engineer specializing in Next.js, Vite, and Turbopack error diagnosis.

Your task: analyze a raw build/CI log and return a structured JSON response.

Return ONLY valid JSON — no markdown fences, no prose before or after the JSON.

Schema:
{
  "summary": "One-sentence summary of the build failure",
  "rootCauses": [
    {
      "file": "relative/path/to/file.ts",
      "line": 5,
      "errorType": "missing-export | module-not-found | type-error | syntax-error | circular-dep | peer-conflict | unknown",
      "description": "Precise explanation of what is wrong",
      "brokenImport": "import { parseAICommandToStructuredPlan } from '@lib/ai/AIToNextResponsivePipeline'",
      "fixedImport": "import { generateResponsiveNextPage } from '@lib/ai/AIToNextResponsivePipeline'",
      "steps": ["Step 1 description", "Step 2 description"],
      "autoFixable": true
    }
  ],
  "globalFixes": ["npm install ...", "Add config.resolve.fallback to next.config.ts"],
  "patchBlocks": [
    {
      "file": "relative/path/to/file.ts",
      "original": "import { parseAICommandToStructuredPlan } from '@lib/ai/...'",
      "fixed": "import { generateResponsiveNextPage } from '@lib/ai/...'",
      "description": "Replace missing export with correct export name"
    }
  ]
}

Rules:
- Be precise. If the log says "Did you mean to import X?", always use X as the fixedImport.
- For missing-export errors: extract the exact import line from the log (lines starting with > or |).
- For module-not-found errors: suggest npm install <package> or path fix.
- patchBlocks must show ONLY the changed line(s), not the entire file.
- autoFixable = true ONLY when you have a confirmed fixedImport or clear one-line patch.
- globalFixes are repo-wide commands (npm install, tsconfig changes, etc.).`;

export async function analyzeBuildLog(rawLog: string): Promise<AIBuildAnalysis> {
  const truncated = rawLog.slice(0, 12000); // cap at ~12k chars to stay within context

  const messages = [
    { role: "system", content: BUILD_ANALYSIS_SYSTEM },
    {
      role: "user",
      content: `Analyze this build log and return the structured JSON:\n\n${truncated}`,
    },
  ];

  const { text, model } = await callWithFallback(messages, 3000);

  // Strip any accidental markdown fences
  const clean = text.replace(/^```(?:json)?\n?/gm, "").replace(/\n?```$/gm, "").trim();

  let parsed: any;
  try {
    parsed = JSON.parse(clean);
  } catch {
    // Try to extract JSON from the response
    const jsonMatch = clean.match(/\{[\s\S]+\}/);
    if (jsonMatch) {
      try { parsed = JSON.parse(jsonMatch[0]); } catch { parsed = null; }
    }
    if (!parsed) {
      // Fallback: return a minimal structure
      return {
        summary: "Could not parse AI response — see raw analysis below",
        rootCauses: [],
        globalFixes: [],
        patchBlocks: [],
        model,
      };
    }
  }

  return {
    summary: parsed.summary ?? "Build failure — see root causes below",
    rootCauses: Array.isArray(parsed.rootCauses) ? parsed.rootCauses : [],
    globalFixes: Array.isArray(parsed.globalFixes) ? parsed.globalFixes : [],
    patchBlocks: Array.isArray(parsed.patchBlocks) ? parsed.patchBlocks : [],
    model,
  };
}

// ─── AI CODE FIXER ────────────────────────────────────────────────────────────

export interface AICodeFix {
  fixedCode: string;
  explanation: string;
  rootCause: string;
  recommendations: string[];
  diffLines: { type: "add" | "remove" | "context"; content: string }[];
  model: string;
}

const CODE_FIX_SYSTEM = `You are an expert TypeScript/React senior engineer.

Given broken code and an error message, you must:
1. Fix the code
2. Explain root cause clearly
3. List 3-5 concrete recommendations

Return ONLY valid JSON — no markdown fences.

Schema:
{
  "fixedCode": "// The entire corrected code block",
  "rootCause": "One paragraph explaining exactly why this error occurs",
  "explanation": "What was changed and why",
  "recommendations": [
    "Recommendation 1",
    "Recommendation 2"
  ],
  "diffLines": [
    { "type": "remove", "content": "const x: any = foo()" },
    { "type": "add", "content": "const x: unknown = foo()" },
    { "type": "context", "content": "// surrounding unchanged line" }
  ]
}

Rules:
- fixedCode must be the complete corrected version — not a snippet.
- diffLines shows exactly what changed (3-5 context lines around each change).
- type: "add" = new line (green), "remove" = deleted line (red), "context" = unchanged (gray).
- If the error is a named export mismatch, fix the import statement to use the correct export name.
- If the error mentions "Did you mean X?", always use X.
- Never suggest disabling TypeScript or adding @ts-ignore.`;

export async function fixCodeWithAI(code: string, errorMessage: string): Promise<AICodeFix> {
  const truncCode = code.slice(0, 8000);
  const truncError = errorMessage.slice(0, 2000);

  const messages = [
    { role: "system", content: CODE_FIX_SYSTEM },
    {
      role: "user",
      content: `Broken code:\n\`\`\`\n${truncCode}\n\`\`\`\n\nError:\n${truncError}\n\nFix the code and return structured JSON.`,
    },
  ];

  const { text, model } = await callWithFallback(messages, 3500);

  const clean = text.replace(/^```(?:json)?\n?/gm, "").replace(/\n?```$/gm, "").trim();

  let parsed: any;
  try {
    parsed = JSON.parse(clean);
  } catch {
    const jsonMatch = clean.match(/\{[\s\S]+\}/);
    if (jsonMatch) {
      try { parsed = JSON.parse(jsonMatch[0]); } catch { parsed = null; }
    }
    if (!parsed) {
      return {
        fixedCode: code,
        explanation: "AI response could not be parsed. See raw output below:\n\n" + text.slice(0, 500),
        rootCause: errorMessage,
        recommendations: ["Review the error message manually", "Check TypeScript documentation"],
        diffLines: [],
        model,
      };
    }
  }

  return {
    fixedCode: parsed.fixedCode ?? code,
    explanation: parsed.explanation ?? "",
    rootCause: parsed.rootCause ?? errorMessage,
    recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
    diffLines: Array.isArray(parsed.diffLines) ? parsed.diffLines : [],
    model,
  };
}

// ─── PATCH FILE GENERATOR ─────────────────────────────────────────────────────
// Generates a unified diff / .patch file from a list of file changes.

export interface PatchEntry {
  path: string;
  original: string;
  fixed: string;
}

// Simple wrapper for single-file diffs (used by Git Repair fix endpoint)
export function generateUnifiedDiff(input: PatchEntry[] | { oldContent: string; newContent: string; fileName: string }, repoName = "repo"): { diff: string } {
  // Handle object format (single file)
  if (!Array.isArray(input)) {
    const { oldContent, newContent, fileName } = input;
    const entries: PatchEntry[] = [{
      path: fileName,
      original: oldContent,
      fixed: newContent,
    }];
    return { diff: generateUnifiedDiffFromArray(entries, repoName) };
  }

  // Handle array format (multiple files)
  return { diff: generateUnifiedDiffFromArray(input, repoName) };
}

function generateUnifiedDiffFromArray(entries: PatchEntry[], repoName = "repo"): string {
  const lines: string[] = [
    `# Git Repair AI — Unified Diff`,
    `# Repository: ${repoName}`,
    `# Generated: ${new Date().toISOString()}`,
    `# Apply with: git apply <filename>.patch`,
    ``,
  ];

  for (const entry of entries) {
    if (entry.original === entry.fixed) continue;

    const origLines = entry.original.split("\n");
    const fixedLines = entry.fixed.split("\n");

    lines.push(`--- a/${entry.path}`);
    lines.push(`+++ b/${entry.path}`);

    // Simple line-by-line diff (hunk generation)
    const hunks = buildHunks(origLines, fixedLines);
    for (const hunk of hunks) {
      lines.push(...hunk);
    }
    lines.push("");
  }

  return lines.join("\n");
}

// ─── REPO Q&A ─────────────────────────────────────────────────────────────────

export interface RepoQAResponse {
  answer: string;
  model: string;
}

const REPO_QA_SYSTEM = `You are an expert software architect and code reviewer. The user has uploaded a GitHub repository and you have been given snippets of its source files.

Your task: answer the user's question about the codebase concisely and accurately.

Rules:
- Be specific — reference actual file names, function names, and patterns you can see.
- Use code blocks for code examples.
- If you cannot answer from the provided context, say so honestly.
- Structure your answer clearly using markdown-style headings and bullet points.
- Keep answers focused and under 600 words unless a long answer is genuinely needed.`;

export async function askRepoQuestion(
  question: string,
  files: { path: string; snippet: string }[],
): Promise<RepoQAResponse> {
  const fileContext = files
    .slice(0, 25)
    .map(f => `--- ${f.path} ---\n${f.snippet.slice(0, 400)}`)
    .join('\n\n');

  const messages = [
    { role: 'system', content: REPO_QA_SYSTEM },
    {
      role: 'user',
      content: `Repository files (truncated snippets):\n\n${fileContext}\n\n---\n\nQuestion: ${question}`,
    },
  ];

  const { text, model } = await callWithFallback(messages, 1500);
  return { answer: text.trim(), model };
}

// ─── COMMIT MESSAGE GENERATOR ─────────────────────────────────────────────────

export interface CommitMessageResult {
  commitMessage: string;
  model: string;
}

const COMMIT_MSG_SYSTEM = `You are a senior engineering lead who writes precise, professional Git commit messages using the Conventional Commits specification.

Format:
fix(<scope>): <short imperative summary> (<N> issues fixed in <M> files)

<blank line>
<bullet list of the most significant changes, max 8 bullets>

Rules:
- scope = the primary area changed (e.g. types, hydration, security, deps, build)
- summary = max 72 chars, imperative mood, lowercase, no period
- bullets = start with a verb, cite file names where helpful, max 1 line each
- Do NOT include markdown fences, headers, or any text before/after the commit message
- If all fixes are in one category, use that as the scope. If mixed, use "repair"`;

export async function generateCommitMessage(
  fixes: { file: string; message: string; code?: string; source?: string }[],
  repoName: string,
  fixedCount: number,
  totalErrors: number,
): Promise<CommitMessageResult> {
  const fixList = fixes
    .slice(0, 30)
    .map(f => `- [${f.source?.toUpperCase() ?? 'FIX'}] ${f.file}: ${f.message.slice(0, 100)}`)
    .join('\n');

  const messages = [
    { role: 'system', content: COMMIT_MSG_SYSTEM },
    {
      role: 'user',
      content: `Repository: ${repoName}\nTotal issues found: ${totalErrors}\nIssues auto-fixed: ${fixedCount}\n\nFixed issues:\n${fixList}\n\nGenerate the Git commit message now.`,
    },
  ];

  const { text, model } = await callWithFallback(messages, 600);
  return { commitMessage: text.trim(), model };
}

function buildHunks(origLines: string[], fixedLines: string[]): string[][] {
  const hunks: string[][] = [];
  const MAX_LINES = 500;

  // Simple approach: find changed regions and output as hunks
  const ol = origLines.slice(0, MAX_LINES);
  const fl = fixedLines.slice(0, MAX_LINES);

  const maxLen = Math.max(ol.length, fl.length);
  let i = 0;
  let hunkStart = -1;
  let hunkLines: string[] = [];

  const CONTEXT = 3;

  while (i < maxLen) {
    const o = ol[i] ?? "";
    const f = fl[i] ?? "";

    if (o !== f) {
      if (hunkStart === -1) {
        hunkStart = Math.max(0, i - CONTEXT);
        // Add context before
        for (let c = hunkStart; c < i; c++) {
          hunkLines.push(` ${ol[c] ?? ""}`);
        }
      }
      if (o !== "") hunkLines.push(`-${o}`);
      if (f !== "") hunkLines.push(`+${f}`);
    } else {
      if (hunkStart !== -1) {
        // Add context after
        const ctxEnd = Math.min(i + CONTEXT, maxLen);
        for (let c = i; c < ctxEnd && c < ol.length; c++) {
          hunkLines.push(` ${ol[c]}`);
        }
        // Close hunk
        const origCount = hunkLines.filter(l => l.startsWith("-") || l.startsWith(" ")).length;
        const fixedCount = hunkLines.filter(l => l.startsWith("+") || l.startsWith(" ")).length;
        hunks.push([
          `@@ -${hunkStart + 1},${origCount} +${hunkStart + 1},${fixedCount} @@`,
          ...hunkLines,
        ]);
        hunkStart = -1;
        hunkLines = [];
        i = ctxEnd - 1;
      }
    }
    i++;
  }

  // Flush remaining hunk
  if (hunkStart !== -1 && hunkLines.length > 0) {
    const origCount = hunkLines.filter(l => l.startsWith("-") || l.startsWith(" ")).length;
    const fixedCount = hunkLines.filter(l => l.startsWith("+") || l.startsWith(" ")).length;
    hunks.push([
      `@@ -${hunkStart + 1},${origCount} +${hunkStart + 1},${fixedCount} @@`,
      ...hunkLines,
    ]);
  }

  return hunks;
}