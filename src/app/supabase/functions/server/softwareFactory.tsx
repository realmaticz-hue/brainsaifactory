// ═══════════════════════════════════════════════════════════════════════════════
// LEVEL-6 AUTONOMOUS AI SOFTWARE FACTORY — Server Engine
// SSE Streaming • Multi-Model Fallback • Iterative Refinement
// ═══════════════════════════════════════════════════════════════════════════════

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

import * as kv from "./kv_store.tsx";

// ── Types ────────────────────────────────────────────────────────────────────

export interface GeneratedFile {
  path: string;
  content: string;
  language: string;
  description?: string;
}

export interface ArchitectureReport {
  appName: string;
  description: string;
  techStack: string[];
  features: string[];
  fileTree: string[];
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
}

// ── Multi-Model Provider Abstraction ─────────────────────────────────────────

interface ProviderConfig {
  name: string;
  url: string;
  model: string;
  getHeaders: (apiKey: string) => Record<string, string>;
  buildBody: (
    systemPrompt: string,
    userPrompt: string,
    jsonMode: boolean,
    maxTokens: number,
    stream: boolean
  ) => Record<string, unknown>;
  extractContent: (data: any) => string;
  extractStreamDelta: (chunk: any) => string;
}

const PROVIDERS: ProviderConfig[] = [
  {
    name: "OpenRouter",
    url: "https://openrouter.ai/api/v1/chat/completions",
    model: "google/gemini-2.0-flash-001",
    getHeaders: (key) => ({
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://figma-make.app",
    }),
    buildBody: (sys, usr, json, max, stream) => {
      const b: Record<string, unknown> = {
        model: "google/gemini-2.0-flash-001",
        messages: [
          { role: "system", content: sys },
          { role: "user", content: usr },
        ],
        max_tokens: max,
        temperature: 0.3,
        stream,
      };
      if (json && !stream) b.response_format = { type: "json_object" };
      return b;
    },
    extractContent: (d) => d.choices?.[0]?.message?.content || "",
    extractStreamDelta: (c) => c.choices?.[0]?.delta?.content || "",
  },
  {
    name: "OpenAI",
    url: "https://api.openai.com/v1/chat/completions",
    model: "gpt-4o-mini",
    getHeaders: (key) => ({
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    }),
    buildBody: (sys, usr, json, max, stream) => {
      const b: Record<string, unknown> = {
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: sys },
          { role: "user", content: usr },
        ],
        max_tokens: max,
        temperature: 0.3,
        stream,
      };
      if (json && !stream) b.response_format = { type: "json_object" };
      return b;
    },
    extractContent: (d) => d.choices?.[0]?.message?.content || "",
    extractStreamDelta: (c) => c.choices?.[0]?.delta?.content || "",
  },
];

function getAvailableProviders(): { provider: ProviderConfig; apiKey: string }[] {
  const result: { provider: ProviderConfig; apiKey: string }[] = [];
  const openRouterKey = Deno.env.get('OPENROUTER_API_KEY');
  const openAIKey = Deno.env.get('OPENAI_API_KEY');
  if (openRouterKey) result.push({ provider: PROVIDERS[0], apiKey: openRouterKey });
  if (openAIKey) result.push({ provider: PROVIDERS[1], apiKey: openAIKey });
  return result;
}

// ── Non-streaming AI call with multi-model fallback ─────────────────────────

async function callAI(
  systemPrompt: string,
  userPrompt: string,
  jsonMode = true,
  maxTokens = 16000
): Promise<string> {
  const available = getAvailableProviders();
  if (available.length === 0) throw new Error("No AI API keys configured (need OPENROUTER_API_KEY or OPENAI_API_KEY)");

  let lastError: Error | null = null;

  for (const { provider, apiKey } of available) {
    try {
      console.log(`[Factory] Trying ${provider.name} (${provider.model})...`);
      const body = provider.buildBody(systemPrompt, userPrompt, jsonMode, maxTokens, false);
      const response = await fetch(provider.url, {
        method: "POST",
        headers: provider.getHeaders(apiKey),
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error(`[Factory] ${provider.name} error ${response.status}: ${errText.substring(0, 200)}`);
        lastError = new Error(`${provider.name} error: ${response.status}`);
        continue; // Try next provider
      }

      const data = await response.json();
      const content = provider.extractContent(data);
      if (!content) {
        lastError = new Error(`${provider.name} returned empty response`);
        continue;
      }

      console.log(`[Factory] ${provider.name} responded (${content.length} chars)`);
      return content;
    } catch (err: any) {
      console.error(`[Factory] ${provider.name} failed:`, err.message);
      lastError = err;
    }
  }

  throw lastError || new Error("All AI providers failed");
}

// ── Streaming AI call with multi-model fallback ─────────────────────────────
// Returns an async iterable of text chunks + the provider name that succeeded

async function* callAIStream(
  systemPrompt: string,
  userPrompt: string,
  maxTokens = 16000
): AsyncGenerator<{ type: "chunk"; text: string } | { type: "provider"; name: string }> {
  const available = getAvailableProviders();
  if (available.length === 0) throw new Error("No AI API keys configured");

  let lastError: Error | null = null;

  for (const { provider, apiKey } of available) {
    try {
      console.log(`[Factory/Stream] Trying ${provider.name}...`);
      // For streaming, we always request JSON via the prompt, not via response_format
      const body = provider.buildBody(systemPrompt, userPrompt, false, maxTokens, true);
      const response = await fetch(provider.url, {
        method: "POST",
        headers: provider.getHeaders(apiKey),
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error(`[Factory/Stream] ${provider.name} error ${response.status}: ${errText.substring(0, 200)}`);
        lastError = new Error(`${provider.name} error: ${response.status}`);
        continue;
      }

      yield { type: "provider", name: provider.name };

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body reader");
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed === "data: [DONE]" || !trimmed.startsWith("data: ")) continue;
          try {
            const json = JSON.parse(trimmed.slice(6));
            const delta = provider.extractStreamDelta(json);
            if (delta) yield { type: "chunk", text: delta };
          } catch {
            // Skip unparseable chunks
          }
        }
      }

      // Process remaining buffer
      if (buffer.trim() && buffer.trim().startsWith("data: ") && buffer.trim() !== "data: [DONE]") {
        try {
          const json = JSON.parse(buffer.trim().slice(6));
          const delta = provider.extractStreamDelta(json);
          if (delta) yield { type: "chunk", text: delta };
        } catch { /* skip */ }
      }

      return; // Success — don't try next provider
    } catch (err: any) {
      console.error(`[Factory/Stream] ${provider.name} failed:`, err.message);
      lastError = err;
    }
  }

  throw lastError || new Error("All AI providers failed (streaming)");
}

// ── System Prompts ──────────────────────────────────────────────────────────

const ARCHITECTURE_SYSTEM = `You are a senior software architect. Analyze the user's request and produce a complete architecture plan.

Return a JSON object with EXACTLY this schema:
{
  "appName": "kebab-case-name",
  "description": "One-line description of the app",
  "techStack": ["React 18", "TypeScript", "Tailwind CSS", "Vite", "Lucide React"],
  "features": ["Feature 1", "Feature 2", ...],
  "fileTree": [
    "src/App.tsx",
    "src/components/ComponentName.tsx",
    "src/components/AnotherComponent.tsx",
    "src/hooks/useCustomHook.ts",
    "src/types/index.ts",
    "src/utils/helpers.ts",
    "src/data/sampleData.ts"
  ],
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "lucide-react": "^0.400.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@tailwindcss/postcss": "^4.0.0",
    "@vitejs/plugin-react": "^4.3.1",
    "autoprefixer": "^10.4.19",
    "tailwindcss": "^4.0.0",
    "typescript": "^5.5.3",
    "vite": "^5.3.4"
  }
}

RULES:
- fileTree must include src/App.tsx as the root component
- Include separate component files for each major UI section
- Include hook files for reusable logic
- Include a types file if the app needs shared interfaces
- Include a data file for sample/mock data
- Keep the tech stack to React + TypeScript + Tailwind + Vite + Lucide
- Add "recharts" to dependencies ONLY if charts/graphs are needed
- Add "react-router" to dependencies ONLY if multiple pages/routes are needed
- Every feature must map to at least one file in the file tree
- Maximum 20 files in fileTree, aim for 5-15 depending on complexity`;

const GENERATE_SYSTEM = `You are a Level-6 Autonomous AI Software Factory. You generate complete, production-ready React + TypeScript + Tailwind CSS source files.

CRITICAL RULES:
1. Return a JSON object: { "files": [ { "path": "...", "content": "...", "language": "typescript", "description": "..." }, ... ] }
2. EVERY file in the requested file tree MUST be generated with FULL, WORKING source code.
3. ALL imports between files MUST resolve correctly. If File A imports from "./components/Foo", then src/components/Foo.tsx MUST exist with the correct exports.
4. src/App.tsx MUST have a default export and MUST be the root component.
5. Use Tailwind CSS classes for ALL styling. Use modern, beautiful design with gradients, shadows, hover effects, and transitions.
6. Use lucide-react for icons. Import specific icons: import { IconName } from 'lucide-react'.
7. Use recharts for any charts: import { BarChart, Bar, ... } from 'recharts'.
8. Include realistic sample data, not empty placeholders. Make the app look populated and functional.
9. Make components interactive with useState, proper event handlers, and state management.
10. NEVER use placeholder comments like "// TODO" or "// implement later". Every function must be complete.
11. NEVER leave empty component bodies. Every component must render meaningful UI.
12. Use TypeScript interfaces/types for all props and data structures.
13. Export shared types from a central types file and import them where needed.
14. Every string in the source code must use proper escaping for template literals and JSX.
15. Components must be responsive using Tailwind responsive prefixes (sm:, md:, lg:).

STYLE GUIDELINES:
- Use a cohesive color scheme (slate, blue, purple, or whatever fits the app theme)
- Cards should have rounded-xl, shadow-lg, and proper padding
- Buttons should have hover states and transitions
- Use flex and grid layouts for responsive design
- Add proper spacing between elements (space-y-*, gap-*)`;

const REPAIR_SYSTEM = `You are an autonomous code repair engine. You fix broken source files in React + TypeScript + Tailwind projects.

RULES:
1. Return JSON: { "repairedFile": { "path": "...", "content": "...", "language": "typescript", "description": "..." } }
2. Fix ALL errors in the file. Do not leave any issues.
3. Ensure all imports resolve to files that exist in the project.
4. Ensure all exported names match what other files import.
5. The repaired code must be complete — no truncation, no placeholders.
6. Maintain the original intent and design of the component.
7. If an import cannot be resolved, either inline the code or remove the unused import.`;

const SECURITY_SYSTEM = `You are a security and performance auditor for React + TypeScript projects.

Analyze the provided source files and return JSON:
{
  "issues": [
    {
      "severity": "critical" | "warning" | "info",
      "file": "path/to/file.tsx",
      "line": 42,
      "type": "security" | "performance" | "quality",
      "message": "Description of the issue",
      "fix": "Suggested fix"
    }
  ],
  "score": { "security": 0-100, "performance": 0-100, "quality": 0-100 }
}

Check for:
- XSS vulnerabilities (dangerouslySetInnerHTML, unsanitized user input)
- Exposed API keys or secrets
- Missing error boundaries
- Inefficient re-renders (missing memo, keys, useCallback)
- Large bundle imports that could be tree-shaken
- Accessibility issues (missing alt text, ARIA labels)
- Missing error handling in async operations`;

const REFINE_SYSTEM = `You are a code refinement engine for React + TypeScript + Tailwind projects. The user wants to modify an existing generated application.

RULES:
1. Return JSON: { "files": [ { "path": "...", "content": "...", "language": "typescript", "description": "..." } ] }
2. Only return files that need to be CHANGED or ADDED. Don't return files that stay the same.
3. When modifying a file, return its COMPLETE new content — never partial/diff.
4. All imports must still resolve correctly after the change.
5. Maintain the existing code style and architecture.
6. Do not break any existing functionality unless explicitly asked to remove it.
7. If the refinement adds new features, you may add new component files.
8. Keep all existing exports intact unless instructed to remove them.`;

// ── Exported Functions ──────────────────────────────────────────────────────

export async function analyzeArchitecture(prompt: string): Promise<ArchitectureReport> {
  const raw = await callAI(ARCHITECTURE_SYSTEM, `Build this app:\n\n${prompt}`, true, 4000);
  try {
    const parsed = JSON.parse(raw);
    if (!parsed.appName || !parsed.fileTree || !Array.isArray(parsed.fileTree)) {
      throw new Error("Invalid architecture format");
    }
    if (!parsed.fileTree.includes("src/App.tsx")) parsed.fileTree.unshift("src/App.tsx");
    return parsed as ArchitectureReport;
  } catch (e) {
    console.error("[Factory] Failed to parse architecture:", e);
    throw new Error(`Architecture analysis failed: ${e}`);
  }
}

export async function generateAllFiles(
  prompt: string,
  architecture: ArchitectureReport
): Promise<GeneratedFile[]> {
  const userPrompt = `## User Request\n${prompt}\n\n## Architecture Plan\nApp Name: ${architecture.appName}\nDescription: ${architecture.description}\nFeatures: ${architecture.features.join(", ")}\n\n## Files To Generate (generate ALL of these)\n${architecture.fileTree.map((f, i) => `${i + 1}. ${f}`).join("\n")}\n\n## Dependencies Available\n${Object.entries(architecture.dependencies).map(([k, v]) => `- ${k}: ${v}`).join("\n")}\n\nGenerate every file listed above with complete, working source code. Return as JSON: { "files": [...] }`;

  const raw = await callAI(GENERATE_SYSTEM, userPrompt, true, 16000);
  return parseFilesResponse(raw);
}

function parseFilesResponse(raw: string): GeneratedFile[] {
  try {
    const parsed = JSON.parse(raw);
    if (parsed.files && Array.isArray(parsed.files)) {
      return parsed.files.map((f: any) => ({
        path: f.path || "unknown.tsx",
        content: f.content || "// Empty file",
        language: f.language || "typescript",
        description: f.description || "",
      }));
    }
    throw new Error("No files array");
  } catch (e) {
    // Try to extract JSON from markdown wrapper
    const jsonMatch = raw.match(/\{[\s\S]*"files"\s*:\s*\[[\s\S]*\]/);
    if (jsonMatch) {
      try {
        let jsonStr = jsonMatch[0];
        // Ensure it ends with }
        if (!jsonStr.trim().endsWith("}")) jsonStr += "}";
        const parsed = JSON.parse(jsonStr);
        if (parsed.files && Array.isArray(parsed.files)) {
          return parsed.files.map((f: any) => ({
            path: f.path || "unknown.tsx",
            content: f.content || "// Empty file",
            language: f.language || "typescript",
            description: f.description || "",
          }));
        }
      } catch { /* fall through */ }
    }
    throw new Error(`Failed to parse generated files: ${e}`);
  }
}

// ── Streaming generation — SSE helper ───────────────────────────────────────

export function createSSEStream() {
  let controller: ReadableStreamDefaultController | null = null;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(c) { controller = c; },
    cancel() { controller = null; },
  });

  function send(event: string, data: any) {
    if (!controller) return;
    try {
      controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
    } catch { /* stream closed */ }
  }

  function close() {
    if (!controller) return;
    try { controller.close(); } catch { /* already closed */ }
    controller = null;
  }

  return { stream, send, close };
}

export async function streamGenerateFiles(
  prompt: string,
  architecture: ArchitectureReport,
  send: (event: string, data: any) => void,
  close: () => void,
) {
  const userPrompt = `## User Request\n${prompt}\n\n## Architecture Plan\nApp Name: ${architecture.appName}\nDescription: ${architecture.description}\nFeatures: ${architecture.features.join(", ")}\n\n## Files To Generate (generate ALL of these)\n${architecture.fileTree.map((f, i) => `${i + 1}. ${f}`).join("\n")}\n\n## Dependencies Available\n${Object.entries(architecture.dependencies).map(([k, v]) => `- ${k}: ${v}`).join("\n")}\n\nGenerate every file listed above with complete, working source code. Return as JSON: { "files": [...] }`;

  let fullText = "";
  let charsSent = 0;

  try {
    send("phase", { phase: 3, status: "running", detail: "Connecting to AI..." });

    for await (const event of callAIStream(GENERATE_SYSTEM + "\n\nIMPORTANT: Return ONLY valid JSON. No markdown wrapping.", userPrompt, 16000)) {
      if (event.type === "provider") {
        send("provider", { name: event.name });
        send("phase", { phase: 3, status: "running", detail: `Generating via ${event.name}...` });
      } else if (event.type === "chunk") {
        fullText += event.text;
        charsSent += event.text.length;
        // Send progress every ~500 chars
        if (charsSent >= 500) {
          send("progress", { chars: fullText.length, estimatedFiles: architecture.fileTree.length });
          charsSent = 0;
        }
      }
    }

    send("progress", { chars: fullText.length, estimatedFiles: architecture.fileTree.length, done: true });
    send("phase", { phase: 3, status: "running", detail: "Parsing generated files..." });

    // Parse the complete response
    const files = parseFilesResponse(fullText);
    console.log(`[Factory/Stream] Parsed ${files.length} files from ${fullText.length} chars`);

    // Emit each file individually
    for (let i = 0; i < files.length; i++) {
      send("file", { index: i, total: files.length, file: files[i] });
    }

    send("phase", { phase: 3, status: "done", detail: `${files.length} files generated` });
    send("complete", { totalFiles: files.length });
  } catch (err: any) {
    console.error("[Factory/Stream] Error:", err.message);

    // If streaming failed, try non-streaming fallback
    try {
      send("phase", { phase: 3, status: "running", detail: "Stream failed, trying fallback..." });
      const files = await generateAllFiles(prompt, architecture);
      for (let i = 0; i < files.length; i++) {
        send("file", { index: i, total: files.length, file: files[i] });
      }
      send("phase", { phase: 3, status: "done", detail: `${files.length} files (fallback)` });
      send("complete", { totalFiles: files.length });
    } catch (err2: any) {
      send("error", { message: err2.message, phase: 3 });
    }
  } finally {
    close();
  }
}

// ── Iterative Refinement ────────────────────────────────────────────────────

export async function refineFiles(
  instruction: string,
  currentFiles: GeneratedFile[],
  targetFile?: string,
): Promise<GeneratedFile[]> {
  const filesContext = currentFiles
    .filter((f) => f.path.match(/\.(tsx?|jsx?|ts|js)$/))
    .map((f) => `### ${f.path}\n\`\`\`tsx\n${f.content}\n\`\`\``)
    .join("\n\n");

  let userPrompt: string;
  if (targetFile) {
    const target = currentFiles.find((f) => f.path === targetFile);
    userPrompt = `## Refinement Instruction\n${instruction}\n\n## Target File: ${targetFile}\n\`\`\`tsx\n${target?.content || "// File not found"}\n\`\`\`\n\n## All Project Files (for context)\n${currentFiles.map((f) => `- ${f.path}`).join("\n")}\n\n## Full Source (reference only)\n${filesContext}\n\nReturn ONLY the modified/new files as JSON: { "files": [...] }`;
  } else {
    userPrompt = `## Refinement Instruction\n${instruction}\n\n## Current Project Files\n${filesContext}\n\nReturn ONLY the files that need to change as JSON: { "files": [...] }. Do NOT return unchanged files.`;
  }

  const raw = await callAI(REFINE_SYSTEM, userPrompt, true, 12000);
  return parseFilesResponse(raw);
}

export async function streamRefineFiles(
  instruction: string,
  currentFiles: GeneratedFile[],
  targetFile: string | undefined,
  send: (event: string, data: any) => void,
  close: () => void,
) {
  const filesContext = currentFiles
    .filter((f) => f.path.match(/\.(tsx?|jsx?|ts|js)$/))
    .map((f) => `### ${f.path}\n\`\`\`tsx\n${f.content}\n\`\`\``)
    .join("\n\n");

  let userPrompt: string;
  if (targetFile) {
    const target = currentFiles.find((f) => f.path === targetFile);
    userPrompt = `## Refinement Instruction\n${instruction}\n\n## Target File: ${targetFile}\n\`\`\`tsx\n${target?.content || "// File not found"}\n\`\`\`\n\n## All Project Files (for context)\n${currentFiles.map((f) => `- ${f.path}`).join("\n")}\n\n## Full Source (reference only)\n${filesContext}\n\nReturn ONLY the modified/new files as JSON: { "files": [...] }`;
  } else {
    userPrompt = `## Refinement Instruction\n${instruction}\n\n## Current Project Files\n${filesContext}\n\nReturn ONLY the files that need to change as JSON: { "files": [...] }. Do NOT return unchanged files.`;
  }

  let fullText = "";
  let charsSent = 0;

  try {
    send("phase", { id: "refine", status: "running", detail: "Connecting to AI..." });

    for await (const event of callAIStream(
      REFINE_SYSTEM + "\n\nIMPORTANT: Return ONLY valid JSON. No markdown wrapping.",
      userPrompt,
      12000,
    )) {
      if (event.type === "provider") {
        send("provider", { name: event.name });
      } else if (event.type === "chunk") {
        fullText += event.text;
        charsSent += event.text.length;
        if (charsSent >= 300) {
          send("progress", { chars: fullText.length });
          charsSent = 0;
        }
      }
    }

    send("progress", { chars: fullText.length, done: true });

    const changedFiles = parseFilesResponse(fullText);
    console.log(`[Factory/Refine] Parsed ${changedFiles.length} changed files`);

    for (let i = 0; i < changedFiles.length; i++) {
      send("file", { index: i, total: changedFiles.length, file: changedFiles[i] });
    }

    send("refine_complete", { changedCount: changedFiles.length });
  } catch (err: any) {
    console.error("[Factory/Refine] Error:", err.message);

    // Non-streaming fallback
    try {
      send("phase", { id: "refine", status: "running", detail: "Trying non-stream fallback..." });
      const changedFiles = await refineFiles(instruction, currentFiles, targetFile);
      for (let i = 0; i < changedFiles.length; i++) {
        send("file", { index: i, total: changedFiles.length, file: changedFiles[i] });
      }
      send("refine_complete", { changedCount: changedFiles.length });
    } catch (err2: any) {
      send("error", { message: err2.message });
    }
  } finally {
    close();
  }
}

// ── Remaining exports (repair, security, memory) ────────────────────────────

export async function repairFile(
  errorFile: string,
  errorMessage: string,
  fileContent: string,
  allFileNames: string[],
): Promise<GeneratedFile> {
  const userPrompt = `## Error\nFile: ${errorFile}\nError: ${errorMessage}\n\n## Current File Content\n\`\`\`tsx\n${fileContent}\n\`\`\`\n\n## All Files In Project\n${allFileNames.map((f) => `- ${f}`).join("\n")}\n\nRepair this file so it compiles without errors. Return as JSON: { "repairedFile": { ... } }`;

  const raw = await callAI(REPAIR_SYSTEM, userPrompt, true, 8000);
  try {
    const parsed = JSON.parse(raw);
    if (!parsed.repairedFile) throw new Error("No repairedFile in response");
    return {
      path: parsed.repairedFile.path || errorFile,
      content: parsed.repairedFile.content || fileContent,
      language: parsed.repairedFile.language || "typescript",
      description: parsed.repairedFile.description || "Repaired file",
    };
  } catch (e) {
    console.error("[Factory] Repair parse error:", e);
    throw new Error(`Repair failed: ${e}`);
  }
}

export async function securityScan(
  files: GeneratedFile[],
): Promise<{ issues: any[]; score: Record<string, number> }> {
  const filesSummary = files
    .filter((f) => f.path.endsWith(".tsx") || f.path.endsWith(".ts"))
    .map((f) => `### ${f.path}\n\`\`\`tsx\n${f.content.substring(0, 2000)}\n\`\`\``)
    .join("\n\n");
  const raw = await callAI(SECURITY_SYSTEM, `Audit these files:\n\n${filesSummary}`, true, 4000);
  try {
    return JSON.parse(raw);
  } catch {
    return { issues: [], score: { security: 80, performance: 80, quality: 80 } };
  }
}

export async function saveProjectMemory(projectId: string, data: any) {
  await kv.set(`factory-project:${projectId}`, { ...data, updatedAt: Date.now() });
}

export async function getProjectMemory(projectId: string) {
  return await kv.get(`factory-project:${projectId}`);
}

export async function listFactoryProjects() {
  return await kv.getByPrefix("factory-project:");
}

// ── Agent Performance Metrics & Learning System ─────────────────────────────

export interface AgentMetric {
  agentId: number;
  agentName: string;
  department: string;
  totalActivations: number;
  totalDurationMs: number;
  avgDurationMs: number;
  successCount: number;
  errorCount: number;
  lastActiveAt: number;
}

export interface BuildRecord {
  buildId: string;
  appName: string;
  prompt: string;
  fileCount: number;
  issueCount: number;
  criticalCount: number;
  totalDurationMs: number;
  provider: string;
  agentTimings: Record<number, { durationMs: number; status: string }>;
  securityScore?: Record<string, number>;
  createdAt: number;
  features: string[];
  techStack: string[];
}

export interface LearningInsight {
  type: 'pattern' | 'optimization' | 'warning' | 'recommendation';
  title: string;
  description: string;
  confidence: number;
  sourceBuilds: number;
  createdAt: number;
}

/** Save detailed build record with agent timings */
export async function saveBuildRecord(record: BuildRecord) {
  // Save the build record
  await kv.set(`factory-build:${record.buildId}`, record);

  // Update aggregate agent metrics
  const agentTimings = record.agentTimings || {};
  for (const [agentIdStr, timing] of Object.entries(agentTimings)) {
    const agentId = parseInt(agentIdStr);
    const metricKey = `factory-agent-metric:${agentId}`;
    const existing = await kv.get(metricKey) as AgentMetric | null;

    if (existing) {
      const newTotal = existing.totalActivations + 1;
      const newDuration = existing.totalDurationMs + timing.durationMs;
      await kv.set(metricKey, {
        ...existing,
        totalActivations: newTotal,
        totalDurationMs: newDuration,
        avgDurationMs: Math.round(newDuration / newTotal),
        successCount: existing.successCount + (timing.status === 'done' ? 1 : 0),
        errorCount: existing.errorCount + (timing.status === 'error' ? 1 : 0),
        lastActiveAt: Date.now(),
      });
    } else {
      await kv.set(metricKey, {
        agentId,
        agentName: '',
        department: '',
        totalActivations: 1,
        totalDurationMs: timing.durationMs,
        avgDurationMs: timing.durationMs,
        successCount: timing.status === 'done' ? 1 : 0,
        errorCount: timing.status === 'error' ? 1 : 0,
        lastActiveAt: Date.now(),
      } as AgentMetric);
    }
  }

  // Generate learning insights from accumulated builds
  await generateLearningInsights();
}

/** Get all build records */
export async function listBuildRecords(): Promise<BuildRecord[]> {
  const records = await kv.getByPrefix("factory-build:") as any[];
  return (records || [])
    .filter(r => r && r.buildId)
    .sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0));
}

/** Get agent performance metrics */
export async function getAgentMetrics(): Promise<AgentMetric[]> {
  const metrics = await kv.getByPrefix("factory-agent-metric:") as any[];
  return (metrics || []).filter(m => m && m.agentId);
}

/** Get learning insights */
export async function getLearningInsights(): Promise<LearningInsight[]> {
  const insights = await kv.getByPrefix("factory-insight:") as any[];
  return (insights || [])
    .filter(i => i && i.type)
    .sort((a: any, b: any) => (b.confidence || 0) - (a.confidence || 0));
}

/** Auto-generate learning insights from build history */
async function generateLearningInsights() {
  try {
    const builds = await listBuildRecords();
    if (builds.length < 1) return;

    const insights: LearningInsight[] = [];
    const now = Date.now();

    // Pattern: Average build time trend
    const avgDuration = builds.reduce((sum, b) => sum + (b.totalDurationMs || 0), 0) / builds.length;
    insights.push({
      type: 'pattern',
      title: 'Average Build Duration',
      description: `Across ${builds.length} builds, average completion time is ${(avgDuration / 1000).toFixed(1)}s`,
      confidence: Math.min(0.95, 0.5 + builds.length * 0.05),
      sourceBuilds: builds.length,
      createdAt: now,
    });

    // Pattern: Most common tech stack
    const techCounts: Record<string, number> = {};
    for (const b of builds) {
      for (const t of (b.techStack || [])) {
        techCounts[t] = (techCounts[t] || 0) + 1;
      }
    }
    const topTech = Object.entries(techCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
    if (topTech.length > 0) {
      insights.push({
        type: 'pattern',
        title: 'Preferred Tech Stack',
        description: `Most used: ${topTech.map(([t, c]) => `${t} (${c}x)`).join(', ')}`,
        confidence: 0.9,
        sourceBuilds: builds.length,
        createdAt: now,
      });
    }

    // Warning: High error rate
    const totalIssues = builds.reduce((sum, b) => sum + (b.criticalCount || 0), 0);
    const avgIssues = totalIssues / builds.length;
    if (avgIssues > 2) {
      insights.push({
        type: 'warning',
        title: 'High Critical Issue Rate',
        description: `Average ${avgIssues.toFixed(1)} critical issues per build. Consider simpler architectures or more specific prompts.`,
        confidence: 0.85,
        sourceBuilds: builds.length,
        createdAt: now,
      });
    }

    // Optimization: File count vs issues correlation
    const highFileBuilds = builds.filter(b => (b.fileCount || 0) > 15);
    if (highFileBuilds.length > 0) {
      const highFileAvgIssues = highFileBuilds.reduce((s, b) => s + (b.criticalCount || 0), 0) / highFileBuilds.length;
      if (highFileAvgIssues > avgIssues * 1.5) {
        insights.push({
          type: 'optimization',
          title: 'Large Projects Have More Issues',
          description: `Projects with 15+ files average ${highFileAvgIssues.toFixed(1)} critical issues vs ${avgIssues.toFixed(1)} overall. Breaking into smaller modules may help.`,
          confidence: 0.75,
          sourceBuilds: highFileBuilds.length,
          createdAt: now,
        });
      }
    }

    // Recommendation: Provider performance
    const providerBuilds: Record<string, { count: number; avgTime: number }> = {};
    for (const b of builds) {
      if (b.provider) {
        if (!providerBuilds[b.provider]) providerBuilds[b.provider] = { count: 0, avgTime: 0 };
        providerBuilds[b.provider].count++;
        providerBuilds[b.provider].avgTime += b.totalDurationMs || 0;
      }
    }
    for (const [p, d] of Object.entries(providerBuilds)) {
      d.avgTime = d.avgTime / d.count;
    }
    const providerEntries = Object.entries(providerBuilds);
    if (providerEntries.length > 1) {
      const fastest = providerEntries.sort((a, b) => a[1].avgTime - b[1].avgTime)[0];
      insights.push({
        type: 'recommendation',
        title: 'Fastest AI Provider',
        description: `${fastest[0]} averages ${(fastest[1].avgTime / 1000).toFixed(1)}s across ${fastest[1].count} builds`,
        confidence: Math.min(0.9, 0.6 + fastest[1].count * 0.05),
        sourceBuilds: fastest[1].count,
        createdAt: now,
      });
    }

    // Save insights
    for (let i = 0; i < insights.length; i++) {
      await kv.set(`factory-insight:${i}`, insights[i]);
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error("[Factory] Learning insight generation error:", errorMessage);
  }
}

/** Load a specific project's files (if saved) */
export async function loadProjectFiles(buildId: string): Promise<BuildRecord | null> {
  const record = await kv.get(`factory-build:${buildId}`) as BuildRecord | null;
  return record;
}

// ── Favorites / Pinning ─────────────────────────────────────────────────────

const FAVORITES_KEY = "factory-favorites";

export async function getFavorites(): Promise<string[]> {
  const data = await kv.get(FAVORITES_KEY) as { ids: string[] } | null;
  return data?.ids || [];
}

export async function toggleFavorite(buildId: string): Promise<{ favorited: boolean; favorites: string[] }> {
  const current = await getFavorites();
  const idx = current.indexOf(buildId);
  if (idx >= 0) {
    current.splice(idx, 1);
  } else {
    current.push(buildId);
  }
  await kv.set(FAVORITES_KEY, { ids: current });
  return { favorited: idx < 0, favorites: current };
}

// ── Prompt Improvement Suggestions ──────────────────────────────────────────

export interface PromptSuggestion {
  originalPrompt: string;
  improvedPrompt: string;
  reasoning: string;
  sourceBuildId: string;
  sourceAppName: string;
  score: number;
  aiPowered?: boolean;
}

function scoreBuildRecords(builds: BuildRecord[]): (BuildRecord & { score: number })[] {
  const scored = builds.map(b => {
    let score = 50;
    if (b.criticalCount === 0) score += 20;
    else if (b.criticalCount <= 2) score += 10;
    else score -= 10;
    if (b.fileCount >= 10) score += 10;
    if (b.fileCount >= 20) score += 5;
    if (b.totalDurationMs < 30000) score += 10;
    else if (b.totalDurationMs < 60000) score += 5;
    const secScore = (b.securityScore as Record<string, number>)?.security || 0;
    if (secScore >= 80) score += 10;
    else if (secScore >= 60) score += 5;
    return { ...b, score: Math.min(100, Math.max(0, score)) };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored;
}

function generateRuleBasedSuggestions(scoredBuilds: (BuildRecord & { score: number })[]): PromptSuggestion[] {
  const suggestions: PromptSuggestion[] = [];
  for (const build of scoredBuilds.slice(0, 5)) {
    if (!build.prompt || build.prompt.length < 20) continue;
    const improvements: string[] = [];
    let improvedPrompt = build.prompt;
    if (!/react|typescript|tailwind|next|vue|angular/i.test(build.prompt) && build.techStack.length > 0) {
      improvements.push("Add explicit tech stack for more precise generation");
      improvedPrompt += `. Use ${build.techStack.slice(0, 3).join(', ')}`;
    }
    if (build.prompt.split(/[,;]/).length < 3 && build.features.length > 3) {
      improvements.push("Break down into specific features for better results");
      improvedPrompt += `. Include: ${build.features.slice(0, 4).join(', ')}`;
    }
    if (build.criticalCount === 0 && build.fileCount > 10) improvements.push("This prompt produced zero critical issues — a reliable template");
    if (!/responsive|mobile|accessible|a11y/i.test(build.prompt)) improvements.push("Consider adding responsive/accessibility requirements");
    if (!/component|page|layout|dashboard|sidebar/i.test(build.prompt)) improvements.push("Including structural keywords improves architecture");
    if (improvements.length > 0) {
      suggestions.push({ originalPrompt: build.prompt, improvedPrompt, reasoning: improvements.join('. ') + '.', sourceBuildId: build.buildId, sourceAppName: build.appName, score: build.score, aiPowered: false });
    }
  }
  return suggestions;
}

export async function generatePromptSuggestions(): Promise<PromptSuggestion[]> {
  try {
    const builds = await listBuildRecords();
    if (builds.length < 1) return [];
    const scoredBuilds = scoreBuildRecords(builds);

    // Try AI-powered suggestions first
    const available = getAvailableProviders();
    if (available.length > 0 && scoredBuilds.length >= 1) {
      try {
        const topBuilds = scoredBuilds.slice(0, 6);
        const buildSummaries = topBuilds.map(b => ({
          appName: b.appName, buildId: b.buildId, prompt: b.prompt?.substring(0, 300),
          score: b.score, fileCount: b.fileCount, criticalCount: b.criticalCount,
          durationSec: Math.round((b.totalDurationMs || 0) / 1000),
          features: b.features?.slice(0, 6), techStack: b.techStack?.slice(0, 6),
        }));

        const systemPrompt = `You are an expert AI prompt engineer for software development. Analyze past build data and generate improved prompts that produce better applications.

RULES:
- Return a JSON array of suggestion objects
- Each suggestion must SUBSTANTIALLY improve the original prompt — rewrite it entirely
- Make prompts clearer, more specific, with best practices for: structure, tech stack, feature decomposition, UI/UX, error handling, accessibility
- Limit to 3-5 suggestions
- Each must reference a specific past build by buildId

JSON format (return ONLY a JSON array, nothing else):
[{"sourceBuildId":"string","sourceAppName":"string","originalPrompt":"string","improvedPrompt":"string (completely rewritten professional prompt)","reasoning":"string (2-3 sentences)","score":number}]`;

        const userPrompt = `Past builds with metrics:\n${JSON.stringify(buildSummaries, null, 2)}\n\nGenerate improved prompt suggestions. Focus on builds that could benefit most from better prompting. Return JSON array only.`;

        const aiResponse = await callAI(systemPrompt, userPrompt, true, 4000);
        let parsed: any[];
        try {
          const cleaned = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          parsed = JSON.parse(cleaned);
          if (!Array.isArray(parsed)) parsed = (parsed as any).suggestions || [parsed];
        } catch {
          const match = aiResponse.match(/\[[\s\S]*\]/);
          if (match) parsed = JSON.parse(match[0]);
          else throw new Error("Could not parse AI response");
        }

        const aiSuggestions: PromptSuggestion[] = parsed
          .filter((s: any) => s.improvedPrompt && s.sourceBuildId)
          .slice(0, 5)
          .map((s: any) => ({
            originalPrompt: s.originalPrompt || '', improvedPrompt: s.improvedPrompt,
            reasoning: s.reasoning || 'AI-improved prompt for better results.',
            sourceBuildId: s.sourceBuildId, sourceAppName: s.sourceAppName || 'Unknown',
            score: typeof s.score === 'number' ? s.score : 70, aiPowered: true,
          }));

        if (aiSuggestions.length > 0) {
          console.log(`[Factory] Generated ${aiSuggestions.length} AI-powered prompt suggestions`);
          return aiSuggestions;
        }
      } catch (aiErr) {
        console.error("[Factory] AI prompt suggestion failed, falling back to rule-based:", aiErr);
      }
    }

    return generateRuleBasedSuggestions(scoredBuilds);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error("[Factory] Prompt suggestion generation error:", errorMessage);
    return [];
  }
}

// ── AI Template Category Suggestion ─────────────────────────────────────────

const TEMPLATE_CATEGORIES = ['General', 'Dashboard', 'E-commerce', 'SaaS', 'Portfolio', 'Landing Page', 'Admin Panel', 'Mobile App', 'Game', 'Tool'];

export async function suggestTemplateCategory(prompt: string): Promise<{ category: string; tags: string[]; confidence: number }> {
  const available = getAvailableProviders();
  if (available.length === 0) {
    return { category: classifyCategoryRuleBased(prompt), tags: extractTagsRuleBased(prompt), confidence: 0.5 };
  }
  try {
    const systemPrompt = `You classify app prompts into categories and suggest tags. Available categories: ${TEMPLATE_CATEGORIES.join(', ')}.
Return ONLY a JSON object: {"category":"<one of the categories>","tags":["tag1","tag2","tag3"],"confidence":0.0-1.0}
Choose the MOST specific matching category. Generate 3-5 relevant tags (lowercase, single words or short phrases). Confidence reflects how well the prompt matches.`;
    const userPrompt = `Classify this app prompt:\n"${prompt.substring(0, 500)}"`;
    const aiResponse = await callAI(systemPrompt, userPrompt, true, 500);
    const cleaned = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      const category = TEMPLATE_CATEGORIES.includes(parsed.category) ? parsed.category : 'General';
      const tags = Array.isArray(parsed.tags) ? parsed.tags.slice(0, 5).map((t: string) => String(t).toLowerCase().trim()) : [];
      const confidence = typeof parsed.confidence === 'number' ? Math.min(1, Math.max(0, parsed.confidence)) : 0.7;
      return { category, tags, confidence };
    }
    throw new Error("Could not parse AI response");
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error("[Factory] AI category suggestion failed, falling back:", errorMessage);
    return { category: classifyCategoryRuleBased(prompt), tags: extractTagsRuleBased(prompt), confidence: 0.4 };
  }
}

function classifyCategoryRuleBased(prompt: string): string {
  const p = prompt.toLowerCase();
  if (/dashboard|analytics|metrics|chart|monitor/.test(p)) return 'Dashboard';
  if (/e-?commerce|shop|store|cart|checkout|product/.test(p)) return 'E-commerce';
  if (/saas|subscription|tenant|billing|plan/.test(p)) return 'SaaS';
  if (/portfolio|resume|cv|personal\s*site/.test(p)) return 'Portfolio';
  if (/landing\s*page|hero|cta|waitlist|launch/.test(p)) return 'Landing Page';
  if (/admin|panel|cms|manage|crud|backoffice/.test(p)) return 'Admin Panel';
  if (/mobile|app|ios|android|native|responsive\s*app/.test(p)) return 'Mobile App';
  if (/game|play|score|level|arcade|puzzle/.test(p)) return 'Game';
  if (/tool|calculator|converter|generator|util/.test(p)) return 'Tool';
  return 'General';
}

function extractTagsRuleBased(prompt: string): string[] {
  const p = prompt.toLowerCase();
  const tags: string[] = [];
  const keywords: Record<string, string> = {
    'react': 'react', 'auth': 'auth', 'chart': 'charts', 'api': 'api', 'database': 'database',
    'chat': 'chat', 'real-time': 'realtime', 'responsive': 'responsive', 'dark mode': 'dark-mode',
    'payment': 'payments', 'search': 'search', 'notification': 'notifications', 'upload': 'file-upload',
    'map': 'maps', 'social': 'social', 'ai': 'ai', 'machine learning': 'ml',
  };
  for (const [key, tag] of Object.entries(keywords)) {
    if (p.includes(key) && tags.length < 5) tags.push(tag);
  }
  return tags.length > 0 ? tags : ['app'];
}

// ── Build Templates ─────────────────────────────────────────────────────────

export interface BuildTemplate {
  id: string;
  name: string;
  description: string;
  prompt: string;
  category: string;
  tags: string[];
  sourceBuildId?: string;
  sourceAppName?: string;
  createdAt: number;
  usageCount: number;
  version?: number;
  parentTemplateId?: string;
  rating?: number;
  ratingCount?: number;
}

const TEMPLATE_PREFIX = "factory-template:";

export async function saveTemplate(template: Omit<BuildTemplate, 'id' | 'createdAt' | 'usageCount'>): Promise<BuildTemplate> {
  const id = `tmpl-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  const full: BuildTemplate = { ...template, id, createdAt: Date.now(), usageCount: 0, version: template.version ?? 1 };
  await kv.set(`${TEMPLATE_PREFIX}${id}`, full);
  console.log(`[Factory] Saved template: ${full.name} (${id}) v${full.version}${full.parentTemplateId ? ` forked from ${full.parentTemplateId}` : ''}`);
  return full;
}

export async function listTemplates(): Promise<BuildTemplate[]> {
  const raw = await kv.getByPrefix(TEMPLATE_PREFIX) as any[];
  return raw.filter(r => r?.value).map(r => r.value as BuildTemplate).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

export async function deleteTemplate(templateId: string): Promise<void> {
  await kv.del(`${TEMPLATE_PREFIX}${templateId}`);
  console.log(`[Factory] Deleted template: ${templateId}`);
}

export async function incrementTemplateUsage(templateId: string): Promise<void> {
  const tmpl = await kv.get(`${TEMPLATE_PREFIX}${templateId}`) as BuildTemplate | null;
  if (tmpl) { tmpl.usageCount = (tmpl.usageCount || 0) + 1; await kv.set(`${TEMPLATE_PREFIX}${templateId}`, tmpl); }
}

export async function rateTemplate(templateId: string, rating: number): Promise<BuildTemplate | null> {
  const tmpl = await kv.get(`${TEMPLATE_PREFIX}${templateId}`) as BuildTemplate | null;
  if (!tmpl) return null;
  const prevTotal = (tmpl.rating || 0) * (tmpl.ratingCount || 0);
  const newCount = (tmpl.ratingCount || 0) + 1;
  tmpl.rating = Math.round(((prevTotal + rating) / newCount) * 10) / 10;
  tmpl.ratingCount = newCount;
  await kv.set(`${TEMPLATE_PREFIX}${templateId}`, tmpl);
  console.log(`[Factory] Rated template ${templateId}: ${rating} stars (avg: ${tmpl.rating}, count: ${tmpl.ratingCount})`);
  return tmpl;
}

export async function resetAllTemplateRatings(): Promise<number> {
  const all = await listTemplates();
  let count = 0;
  for (const tmpl of all) {
    if ((tmpl.rating && tmpl.rating > 0) || (tmpl.ratingCount && tmpl.ratingCount > 0)) {
      tmpl.rating = 0;
      tmpl.ratingCount = 0;
      await kv.set(`${TEMPLATE_PREFIX}${tmpl.id}`, tmpl);
      count++;
    }
  }
  console.log(`[Factory] Reset ratings for ${count} templates`);
  return count;
}

// ── Comparison Report Export ────────────────────────────────────────────────

function buildRadarChartSVG(a: BuildRecord, b: BuildRecord): string {
  const maxDuration = Math.max(a.totalDurationMs || 1, b.totalDurationMs || 1);
  const maxFiles = Math.max(a.fileCount || 1, b.fileCount || 1);
  const maxFeatures = Math.max(a.features?.length || 1, b.features?.length || 1);
  const maxCritical = Math.max(a.criticalCount || 0, b.criticalCount || 0, 1);
  const maxTech = Math.max(a.techStack?.length || 1, b.techStack?.length || 1);

  const labels = ['Speed', 'Files', 'Features', 'Quality', 'Tech Breadth'];
  const rawA = [`${((a.totalDurationMs || 0) / 1000).toFixed(1)}s`, `${a.fileCount || 0} files`, `${a.features?.length || 0} features`, `${a.criticalCount || 0} issues`, `${a.techStack?.length || 0} techs`];
  const rawB = [`${((b.totalDurationMs || 0) / 1000).toFixed(1)}s`, `${b.fileCount || 0} files`, `${b.features?.length || 0} features`, `${b.criticalCount || 0} issues`, `${b.techStack?.length || 0} techs`];
  const clamp = (v: number) => Math.min(100, Math.max(5, v));
  const valA = [
    clamp(100 - ((a.totalDurationMs || 0) / maxDuration) * 100 + 10), clamp(((a.fileCount || 0) / maxFiles) * 100),
    clamp(((a.features?.length || 0) / maxFeatures) * 100), clamp(100 - ((a.criticalCount || 0) / maxCritical) * 100),
    clamp(((a.techStack?.length || 0) / maxTech) * 100),
  ];
  const valB = [
    clamp(100 - ((b.totalDurationMs || 0) / maxDuration) * 100 + 10), clamp(((b.fileCount || 0) / maxFiles) * 100),
    clamp(((b.features?.length || 0) / maxFeatures) * 100), clamp(100 - ((b.criticalCount || 0) / maxCritical) * 100),
    clamp(((b.techStack?.length || 0) / maxTech) * 100),
  ];

  const cx = 200, cy = 195, maxR = 140, n = labels.length;
  const step = (2 * Math.PI) / n, start = -Math.PI / 2;
  const ptStr = (v: number, i: number) => { const a2 = start + step * i, r = (v / 100) * maxR; return `${(cx + r * Math.cos(a2)).toFixed(1)},${(cy + r * Math.sin(a2)).toFixed(1)}`; };
  const ptXY = (v: number, i: number) => { const a2 = start + step * i, r = (v / 100) * maxR; return { x: +(cx + r * Math.cos(a2)).toFixed(1), y: +(cy + r * Math.sin(a2)).toFixed(1) }; };
  const pts = (vals: number[]) => vals.map((v, i) => ptStr(v, i)).join(' ');

  const grids = [25, 50, 75, 100].map(pct => { const p = Array.from({ length: n }, (_, i) => ptStr(pct, i)).join(' '); return `<polygon points="${p}" fill="none" stroke="#2a2a3d" stroke-width="1" opacity="${pct === 100 ? 0.8 : 0.4}"/>`; }).join('');
  const axes = Array.from({ length: n }, (_, i) => { const a2 = start + step * i; return `<line x1="${cx}" y1="${cy}" x2="${(cx + maxR * Math.cos(a2)).toFixed(1)}" y2="${(cy + maxR * Math.sin(a2)).toFixed(1)}" stroke="#2a2a3d" stroke-width="1" opacity="0.6"/>`; }).join('');
  const lbls = labels.map((l, i) => { const a2 = start + step * i, r2 = maxR + 22, x = cx + r2 * Math.cos(a2), y = cy + r2 * Math.sin(a2); const anc = x < cx - 5 ? 'end' : x > cx + 5 ? 'start' : 'middle'; return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="${anc}" dominant-baseline="middle" fill="#9ca3af" font-size="12" font-weight="600">${l}</text>`; }).join('');

  const dotsA = valA.map((v, i) => { const p = ptXY(v, i); return `<circle cx="${p.x}" cy="${p.y}" r="4" fill="#8b5cf6" stroke="#c4b5fd" stroke-width="1.5"/>`; }).join('');
  const dotsB = valB.map((v, i) => { const p = ptXY(v, i); return `<circle cx="${p.x}" cy="${p.y}" r="4" fill="#22d3ee" stroke="#a5f3fc" stroke-width="1.5"/>`; }).join('');

  // Invisible hover hit targets with tooltip data attributes
  const mkHit = (vals: number[]) => vals.map((v, i) => { const p = ptXY(v, i); return `<circle cx="${p.x}" cy="${p.y}" r="14" fill="transparent" cursor="pointer" data-tl="${labels[i]}" data-ta="A: ${rawA[i]}" data-tb="B: ${rawB[i]}" data-ts="${Math.round(valA[i])} vs ${Math.round(valB[i])}" onmouseover="showTip(evt)" onmouseout="hideTip()"/>`; }).join('');
  const hitsA = mkHit(valA), hitsB = mkHit(valB);

  const tooltip = `<g id="rtip" visibility="hidden" pointer-events="none"><rect x="0" y="0" width="160" height="62" rx="8" fill="#1a1a2e" stroke="#3a3a5e" stroke-width="1" opacity="0.95"/><text id="tl" x="10" y="16" fill="#e2e2e8" font-size="11" font-weight="700"></text><text id="ta" x="10" y="32" fill="#a78bfa" font-size="10" font-weight="600"></text><text id="tb" x="10" y="46" fill="#67e8f9" font-size="10" font-weight="600"></text><text id="ts" x="10" y="58" fill="#6b6b80" font-size="9"></text></g>`;
  const tipJS = `<script>function showTip(e){var t=document.getElementById('rtip'),el=e.target;if(!t)return;document.getElementById('tl').textContent=el.getAttribute('data-tl');document.getElementById('ta').textContent=el.getAttribute('data-ta');document.getElementById('tb').textContent=el.getAttribute('data-tb');document.getElementById('ts').textContent='Score: '+el.getAttribute('data-ts');var x=+el.getAttribute('cx')+16,y=+el.getAttribute('cy')-36;if(x>260)x=+el.getAttribute('cx')-176;if(y<10)y=+el.getAttribute('cy')+16;t.setAttribute('transform','translate('+x+','+y+')');t.setAttribute('visibility','visible');}function hideTip(){var t=document.getElementById('rtip');if(t)t.setAttribute('visibility','hidden');}</script>`;

  return `<svg viewBox="0 0 400 420" width="400" height="420" xmlns="http://www.w3.org/2000/svg" style="display:block;margin:0 auto">
${grids}${axes}
<polygon points="${pts(valA)}" fill="rgba(139,92,246,0.15)" stroke="#8b5cf6" stroke-width="2.5" stroke-linejoin="round"/>
<polygon points="${pts(valB)}" fill="rgba(34,211,238,0.12)" stroke="#22d3ee" stroke-width="2.5" stroke-linejoin="round"/>
${dotsA}${dotsB}${hitsA}${hitsB}${lbls}${tooltip}
<rect x="120" y="390" width="10" height="10" rx="2" fill="#8b5cf6"/><text x="134" y="399" fill="#a78bfa" font-size="11" font-weight="600">Build A</text>
<rect x="220" y="390" width="10" height="10" rx="2" fill="#22d3ee"/><text x="234" y="399" fill="#67e8f9" font-size="11" font-weight="600">Build B</text>
${tipJS}</svg>`;
}

export function generateComparisonHTML(data: BuildComparison): string {
  const a = data.builds[0], b = data.builds[1], c = data.comparison;
  const fd = (ms: number) => `${(ms / 1000).toFixed(1)}s`;
  const esc = (s: string) => s.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const radarSVG = buildRadarChartSVG(a, b);
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Build Comparison — ${esc(a.appName)} vs ${esc(b.appName)}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#0f0f14;color:#e2e2e8;padding:40px}
.rpt{max-width:800px;margin:0 auto}.hdr{text-align:center;margin-bottom:32px;padding-bottom:24px;border-bottom:2px solid #2a2a3d}
.hdr h1{font-size:24px;font-weight:800;background:linear-gradient(135deg,#a78bfa,#22d3ee);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:8px}
.hdr .sub{color:#6b6b80;font-size:13px}.hdr .dt{color:#4a4a5e;font-size:11px;margin-top:4px}
.blds{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:24px}
.bc{border-radius:12px;padding:20px}.ba{background:rgba(139,92,246,0.08);border:1px solid rgba(139,92,246,0.3)}
.bb{background:rgba(34,211,238,0.08);border:1px solid rgba(34,211,238,0.3)}
.lbl{display:inline-block;width:24px;height:24px;border-radius:50%;color:#fff;font-weight:800;font-size:12px;text-align:center;line-height:24px;margin-right:8px}
.la{background:#8b5cf6}.lb{background:#22d3ee}.bc h3{display:inline;font-size:16px;font-weight:700}
.bc .pr{color:#6b6b80;font-size:12px;margin-top:8px;line-height:1.5}
.radar{background:#1a1a25;border:1px solid #2a2a3d;border-radius:10px;padding:20px;margin-bottom:16px;text-align:center}
.radar h4{font-size:13px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:1px;margin-bottom:16px}
.mets{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:24px}
.met{background:#1a1a25;border:1px solid #2a2a3d;border-radius:10px;padding:16px;text-align:center}
.met .ml{font-size:11px;color:#6b6b80;text-transform:uppercase;letter-spacing:1px;font-weight:700}
.met .vs{display:flex;justify-content:space-around;margin-top:10px}
.met .v{font-size:20px;font-weight:800}.met .vl{font-size:10px;color:#4a4a5e;margin-top:2px}
.w{color:#34d399}.lo{color:#9ca3af}
.sec{background:#1a1a25;border:1px solid #2a2a3d;border-radius:10px;padding:20px;margin-bottom:16px}
.sec h4{font-size:13px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:1px;margin-bottom:12px}
.tg{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px}
.tc h5{font-size:11px;font-weight:700;margin-bottom:6px}.tca h5{color:#a78bfa}.tcs h5{color:#9ca3af;text-align:center}.tcb h5{color:#22d3ee;text-align:right}
.tag{display:inline-block;background:#2a2a3d;color:#c4c4d4;padding:3px 8px;border-radius:4px;font-size:11px;margin:2px}
.ft{text-align:center;color:#3a3a4e;font-size:11px;padding-top:24px;border-top:1px solid #2a2a3d;margin-top:32px}
@media print{body{background:#fff;color:#1a1a1a}.bc,.sec,.met,.radar{border-color:#ddd;background:#fafafa}}
</style></head><body><div class="rpt">
<div class="hdr"><h1>Build Comparison Report</h1>
<div class="sub">${esc(a.appName)} vs ${esc(b.appName)}</div>
<div class="dt">Generated by SuperBrainBuilder — ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div></div>
<div class="blds">
<div class="bc ba"><span class="lbl la">A</span><h3>${esc(a.appName || 'Unnamed')}</h3><div class="pr">${esc((a.prompt || '').substring(0, 200))}${(a.prompt?.length || 0) > 200 ? '...' : ''}</div></div>
<div class="bc bb"><span class="lbl lb">B</span><h3>${esc(b.appName || 'Unnamed')}</h3><div class="pr">${esc((b.prompt || '').substring(0, 200))}${(b.prompt?.length || 0) > 200 ? '...' : ''}</div></div></div>
<div class="radar"><h4>Performance Radar</h4>${radarSVG}</div>
<div class="mets">
<div class="met"><div class="ml">Build Speed</div><div class="vs"><div><div class="v ${c.winner.speed === a.buildId ? 'w' : 'lo'}">${fd(a.totalDurationMs || 0)}</div><div class="vl">Build A${c.winner.speed === a.buildId ? ' 🏆' : ''}</div></div><div><div class="v ${c.winner.speed === b.buildId ? 'w' : 'lo'}">${fd(b.totalDurationMs || 0)}</div><div class="vl">Build B${c.winner.speed === b.buildId ? ' 🏆' : ''}</div></div></div></div>
<div class="met"><div class="ml">Code Quality</div><div class="vs"><div><div class="v ${c.winner.quality === a.buildId ? 'w' : 'lo'}">${a.criticalCount ?? '?'}</div><div class="vl">Critical${c.winner.quality === a.buildId ? ' 🏆' : ''}</div></div><div><div class="v ${c.winner.quality === b.buildId ? 'w' : 'lo'}">${b.criticalCount ?? '?'}</div><div class="vl">Critical${c.winner.quality === b.buildId ? ' 🏆' : ''}</div></div></div></div>
<div class="met"><div class="ml">Features</div><div class="vs"><div><div class="v ${c.winner.features === a.buildId ? 'w' : 'lo'}">${a.features?.length || 0}</div><div class="vl">Features${c.winner.features === a.buildId ? ' 🏆' : ''}</div></div><div><div class="v ${c.winner.features === b.buildId ? 'w' : 'lo'}">${b.features?.length || 0}</div><div class="vl">Features${c.winner.features === b.buildId ? ' 🏆' : ''}</div></div></div></div></div>
<div class="sec"><h4>Tech Stack</h4><div class="tg">
<div class="tc tca"><h5>Only in A</h5>${c.uniqueTechA.length > 0 ? c.uniqueTechA.map(t => `<span class="tag">${esc(t)}</span>`).join(' ') : '<span style="color:#4a4a5e;font-size:11px">—</span>'}</div>
<div class="tc tcs"><h5>Shared</h5>${c.commonTech.length > 0 ? c.commonTech.map(t => `<span class="tag">${esc(t)}</span>`).join(' ') : '<span style="color:#4a4a5e;font-size:11px">—</span>'}</div>
<div class="tc tcb" style="text-align:right"><h5>Only in B</h5>${c.uniqueTechB.length > 0 ? c.uniqueTechB.map(t => `<span class="tag">${esc(t)}</span>`).join(' ') : '<span style="color:#4a4a5e;font-size:11px">—</span>'}</div></div></div>
<div class="sec"><h4>Features</h4><div class="tg">
<div class="tc tca"><h5>Only in A</h5>${c.uniqueFeaturesA.length > 0 ? c.uniqueFeaturesA.map(f => `<span class="tag">${esc(f)}</span>`).join(' ') : '<span style="color:#4a4a5e;font-size:11px">—</span>'}</div>
<div class="tc tcs"><h5>Shared</h5>${c.commonFeatures.length > 0 ? c.commonFeatures.map(f => `<span class="tag">${esc(f)}</span>`).join(' ') : '<span style="color:#4a4a5e;font-size:11px">—</span>'}</div>
<div class="tc tcb" style="text-align:right"><h5>Only in B</h5>${c.uniqueFeaturesB.length > 0 ? c.uniqueFeaturesB.map(f => `<span class="tag">${esc(f)}</span>`).join(' ') : '<span style="color:#4a4a5e;font-size:11px">—</span>'}</div></div></div>
<div class="sec"><h4>Summary</h4>
<table style="width:100%;border-collapse:collapse">
<tr style="border-bottom:1px solid #2a2a3d"><td style="padding:8px;font-size:12px;color:#9ca3af">Metric</td><td style="padding:8px;font-size:12px;color:#a78bfa;text-align:center">Build A</td><td style="padding:8px;font-size:12px;color:#22d3ee;text-align:center">Build B</td></tr>
<tr style="border-bottom:1px solid #1f1f30"><td style="padding:8px;font-size:12px">Files</td><td style="padding:8px;text-align:center;font-weight:700">${a.fileCount || '?'}</td><td style="padding:8px;text-align:center;font-weight:700">${b.fileCount || '?'}</td></tr>
<tr style="border-bottom:1px solid #1f1f30"><td style="padding:8px;font-size:12px">Build Time</td><td style="padding:8px;text-align:center;font-weight:700">${fd(a.totalDurationMs || 0)}</td><td style="padding:8px;text-align:center;font-weight:700">${fd(b.totalDurationMs || 0)}</td></tr>
<tr style="border-bottom:1px solid #1f1f30"><td style="padding:8px;font-size:12px">Critical Issues</td><td style="padding:8px;text-align:center;font-weight:700">${a.criticalCount ?? '?'}</td><td style="padding:8px;text-align:center;font-weight:700">${b.criticalCount ?? '?'}</td></tr>
<tr><td style="padding:8px;font-size:12px">AI Provider</td><td style="padding:8px;text-align:center;font-size:11px">${esc(a.provider || '—')}</td><td style="padding:8px;text-align:center;font-size:11px">${esc(b.provider || '—')}</td></tr>
</table></div>
<div class="ft">SuperBrainBuilder — 50-Agent AI Software Factory • ${new Date().toISOString()}</div></div></body></html>`;
}

// ── Build Comparison Helpers ────────────────────────────────────────────────

export interface BuildComparison {
  builds: BuildRecord[];
  comparison: {
    durationDiff: number;
    fileCountDiff: number;
    criticalCountDiff: number;
    commonTech: string[];
    uniqueTechA: string[];
    uniqueTechB: string[];
    commonFeatures: string[];
    uniqueFeaturesA: string[];
    uniqueFeaturesB: string[];
    winner: {
      speed: string;
      quality: string;
      features: string;
    };
  };
}

export function compareTwoBuilds(a: BuildRecord, b: BuildRecord): BuildComparison {
  const techA = new Set(a.techStack || []);
  const techB = new Set(b.techStack || []);
  const commonTech = [...techA].filter(t => techB.has(t));
  const uniqueTechA = [...techA].filter(t => !techB.has(t));
  const uniqueTechB = [...techB].filter(t => !techA.has(t));

  const featA = new Set(a.features || []);
  const featB = new Set(b.features || []);
  const commonFeatures = [...featA].filter(f => featB.has(f));
  const uniqueFeaturesA = [...featA].filter(f => !featB.has(f));
  const uniqueFeaturesB = [...featB].filter(f => !featA.has(f));

  return {
    builds: [a, b],
    comparison: {
      durationDiff: (a.totalDurationMs || 0) - (b.totalDurationMs || 0),
      fileCountDiff: (a.fileCount || 0) - (b.fileCount || 0),
      criticalCountDiff: (a.criticalCount || 0) - (b.criticalCount || 0),
      commonTech,
      uniqueTechA,
      uniqueTechB,
      commonFeatures,
      uniqueFeaturesA,
      uniqueFeaturesB,
      winner: {
        speed: (a.totalDurationMs || Infinity) <= (b.totalDurationMs || Infinity) ? a.buildId : b.buildId,
        quality: (a.criticalCount || 0) <= (b.criticalCount || 0) ? a.buildId : b.buildId,
        features: (a.features?.length || 0) >= (b.features?.length || 0) ? a.buildId : b.buildId,
      },
    },
  };
}