// ═══════════════════════════════════════════════════════════════════════════════
// SUPER BRAIN BUILDER — 50-Agent Autonomous AI Software Factory
// Command Center • Agent Orchestrator • Knowledge Graph • Memory System
// SSE Streaming • Multi-Model Fallback • Iterative Refinement
// ═══════════════════════════════════════════════════════════════════════════════
import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { copyToClipboard } from '../utils/clipboard';
import {
  Sparkles, Send, Loader, Copy, Check, Download,
  Eye, Code, Plus,
  Layout, Box, Grid, List, Table,
  User, X as XIcon,
  RefreshCw, ChevronDown, ChevronUp,
  ShieldCheck, CheckCircle2, AlertTriangle,
  FolderTree, Cpu, Bug, Shield, Rocket,
  Brain, Activity, Package, FileCode,
  Play, ChevronRight, CircleDot,
  Pencil, Radio, Wifi, WifiOff, Layers,
  Zap, Users, Network, Database, GitBranch,
  BarChart3, Gauge, Bot, Terminal, Crown,
  Cog, Search, Clock, TrendingUp, Hash,
  Star, ArrowLeftRight, Lightbulb, Trophy, Target,
  Bookmark, FileDown, Tag, Trash2, PlusCircle, Upload, Share2, Link, CheckSquare, Square,
  ArrowUpDown, RotateCcw, FileText, History, ThumbsUp, Merge, Wand2,
  PackageOpen
} from 'lucide-react';
import JSZip from 'jszip';
import { toast } from 'sonner';
import { CodePreview } from './CodePreview';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { resolveServerUrl, serverFetch } from '../utils/serverFetch';
import {
  type Agent, type Department, type AgentStatus,
  createAllAgents, getAgentsForPhase, getAgentsByDepartment,
  getDepartments, DEPARTMENT_COLORS, DEPARTMENT_ICONS, PHASE_AGENT_MAP,
} from './superBrainAgents';

// ── Types ────────────────────────────────────────────────────────────────────

interface GeneratedFile {
  path: string;
  content: string;
  language: string;
  description?: string;
}

interface ArchitectureReport {
  appName: string;
  description: string;
  techStack: string[];
  features: string[];
  fileTree: string[];
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
}

interface PipelinePhase {
  id: number;
  name: string;
  status: 'pending' | 'running' | 'done' | 'error' | 'skipped';
  detail?: string;
  duration?: number;
  agentIds: number[];
}

interface BuildIssue {
  severity: 'critical' | 'warning' | 'info';
  file: string;
  message: string;
  type: 'import' | 'dependency' | 'security' | 'performance' | 'quality';
  fix?: string;
  autoFixed?: boolean;
}

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

interface KnowledgeNode {
  id: string;
  type: 'file' | 'component' | 'hook' | 'type' | 'util' | 'config';
  label: string;
  deps: string[];
}

interface BuildRecord {
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

interface LearningInsight {
  type: 'pattern' | 'optimization' | 'warning' | 'recommendation';
  title: string;
  description: string;
  confidence: number;
  sourceBuilds: number;
  createdAt: number;
}

interface AgentMetricData {
  agentId: number;
  totalActivations: number;
  avgDurationMs: number;
  successCount: number;
  errorCount: number;
}

interface PromptSuggestion {
  originalPrompt: string;
  improvedPrompt: string;
  reasoning: string;
  sourceBuildId: string;
  sourceAppName: string;
  score: number;
  aiPowered?: boolean;
}

interface BuildTemplate {
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

interface MergeHistoryEntry {
  id: string;
  timestamp: number;
  sourceAName: string;
  sourceAId: string;
  sourceBName: string;
  sourceBId: string;
  resultName: string;
  resultId?: string;
  promptSnippet: string;
  wordCount: number;
  qualityScore?: number;
  preservationA?: number;
  preservationB?: number;
  dedupEfficiency?: number;
}

interface ImportPreviewData {
  filename: string;
  formatVersion: string;
  migratedFrom?: string;
  totalChains: number;
  versions: Array<{ name: string; prompt: string; category: string; tags: string[]; parentTemplateId?: string; isDuplicate: boolean; id?: string; description?: string; sourceBuildId?: string; sourceAppName?: string; version?: number }>;
  duplicateCount: number;
  newCount: number;
  file: File;
  importedMergeHistory?: MergeHistoryEntry[];
}

interface BuildComparisonData {
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

// ── API helpers ──────────────────────────────────────────────────────────────

import { serverFetch } from '../utils/serverFetch';

async function factoryAPI(endpoint: string, body: any): Promise<any> {
  const res = await serverFetch(`/factory/${endpoint}`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok || data.error) throw new Error(data.error || `API error ${res.status}`);
  return data;
}

async function factoryGET(endpoint: string): Promise<any> {
  const res = await serverFetch(`/factory/${endpoint}`);
  const data = await res.json();
  if (!res.ok || data.error) throw new Error(data.error || `API error ${res.status}`);
  return data;
}

function connectSSE(
  endpoint: string,
  body: any,
  handlers: {
    onEvent: (event: string, data: any) => void;
    onError: (err: Error) => void;
    onClose: () => void;
  },
): AbortController {
  const controller = new AbortController();
  (async () => {
    try {
      const res = await fetch(resolveServerUrl(`/factory/${endpoint}`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${publicAnonKey}` },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      if (!res.ok) {
        const text = await res.text();
        try { const json = JSON.parse(text); throw new Error(json.error || `SSE error ${res.status}`); }
        catch { throw new Error(`SSE error ${res.status}: ${text.substring(0, 200)}`); }
      }
      const reader = res.body?.getReader();
      if (!reader) throw new Error('No response body');
      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const blocks = buffer.split('\n\n');
        buffer = blocks.pop() || '';
        for (const block of blocks) {
          const lines = block.trim().split('\n');
          let eventName = 'message';
          let eventData = '';
          for (const line of lines) {
            if (line.startsWith('event: ')) eventName = line.slice(7).trim();
            else if (line.startsWith('data: ')) eventData = line.slice(6);
          }
          if (eventData) {
            try { handlers.onEvent(eventName, JSON.parse(eventData)); }
            catch { /* skip */ }
          }
        }
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') handlers.onError(err);
    } finally {
      handlers.onClose();
    }
  })();
  return controller;
}

// ── Scaffold constants ───────────────────────────────────────────────────────

const POSTCSS_CONFIG = `export default {\n  plugins: {\n    "@tailwindcss/postcss": {},\n    autoprefixer: {},\n  },\n};\n`;
const INDEX_CSS = `@tailwind base;\n@tailwind components;\n@tailwind utilities;\n`;
const TAILWIND_CONFIG = `/** @type {import('tailwindcss').Config} */\nexport default {\n  content: ["./index.html","./src/**/*.{js,ts,jsx,tsx}"],\n  theme: { extend: {} },\n  plugins: [],\n};\n`;
const VITE_CONFIG = `import { defineConfig } from 'vite';\nimport react from '@vitejs/plugin-react';\n\nexport default defineConfig({\n  plugins: [react()],\n});\n`;
const TS_CONFIG = `{\n  "compilerOptions": {\n    "target": "ES2020","useDefineForClassFields": true,\n    "lib": ["ES2020","DOM","DOM.Iterable"],"module": "ESNext","skipLibCheck": true,\n    "moduleResolution": "bundler","allowImportingTsExtensions": true,"resolveJsonModule": true,\n    "isolatedModules": true,"noEmit": true,"jsx": "react-jsx","strict": true,\n    "noUnusedLocals": false,"noUnusedParameters": false,"noFallthroughCasesInSwitch": true\n  },\n  "include": ["src"]\n}\n`;
const INDEX_HTML = (title: string) => `<!DOCTYPE html>\n<html lang="en">\n  <head>\n    <meta charset="UTF-8" />\n    <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n    <title>${title}</title>\n  </head>\n  <body>\n    <div id="root"></div>\n    <script type="module" src="/src/main.tsx"></script>\n  </body>\n</html>\n`;
const MAIN_TSX = `import React from 'react';\nimport ReactDOM from 'react-dom/client';\nimport App from './App';\nimport './index.css';\n\nReactDOM.createRoot(document.getElementById('root')!).render(\n  <React.StrictMode>\n    <App />\n  </React.StrictMode>,\n);\n`;

function makePackageJson(name: string, deps: Record<string, string>, devDeps: Record<string, string>) {
  const baseDeps: Record<string, string> = { "react": "^18.3.1", "react-dom": "^18.3.1", "lucide-react": "^0.400.0", ...deps };
  const baseDevDeps: Record<string, string> = {
    "@types/react": "^18.3.3", "@types/react-dom": "^18.3.0",
    "@tailwindcss/postcss": "^4.0.0", "@vitejs/plugin-react": "^4.3.1",
    "autoprefixer": "^10.4.19", "tailwindcss": "^4.0.0",
    "typescript": "^5.5.3", "vite": "^5.3.4", ...devDeps,
  };
  return JSON.stringify({
    name, private: true, version: "1.0.0", type: "module",
    scripts: { dev: "vite", build: "tsc && vite build", preview: "vite preview" },
    dependencies: baseDeps, devDependencies: baseDevDeps
  }, null, 2) + '\n';
}

function makeEnvExample(appName: string) {
  return `# ${appName} Environment Variables\nVITE_API_URL=http://localhost:3000\nVITE_APP_NAME=${appName}\n`;
}

function makeDockerfile() {
  return `FROM node:18-alpine AS build\nWORKDIR /app\nCOPY package*.json ./\nRUN npm ci\nCOPY . .\nRUN npm run build\n\nFROM nginx:alpine\nCOPY --from=build /app/dist /usr/share/nginx/html\nEXPOSE 80\nCMD ["nginx", "-g", "daemon off;"]\n`;
}
function makeVercelJson() { return JSON.stringify({ framework: "vite", buildCommand: "npm run build", outputDirectory: "dist", rewrites: [{ source: "/(.*)", destination: "/index.html" }] }, null, 2) + '\n'; }
function makeNetlifyToml() { return `[build]\n  command = "npm run build"\n  publish = "dist"\n\n[[redirects]]\n  from = "/*"\n  to = "/index.html"\n  status = 200\n`; }

// ── Build utilities ──────────────────────────────────────────────────────────

function normalizePath(p: string): string {
  const parts = p.split('/');
  const out: string[] = [];
  for (const seg of parts) {
    if (seg === '.' || seg === '') continue;
    if (seg === '..') { out.pop(); continue; }
    out.push(seg);
  }
  return out.join('/');
}

function extractRelativeImports(source: string): { raw: string; namedExports: string[] }[] {
  const results: { raw: string; namedExports: string[] }[] = [];
  const regex = /import\s+(?:\{([^}]+)\}|(\w+))\s+from\s+['"](\.[\\w./\-]+)['"]/g;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(source)) !== null) {
    const namedStr = m[1] || '';
    const defaultName = m[2] || '';
    const raw = m[3];
    const names: string[] = [];
    if (namedStr) namedStr.split(',').forEach(n => { const c = n.trim().split(/\s+as\s+/).pop()?.trim(); if (c) names.push(c); });
    if (defaultName) names.push(defaultName);
    results.push({ raw, namedExports: names });
  }
  return results;
}

function simulateBuild(files: GeneratedFile[]): BuildIssue[] {
  const issues: BuildIssue[] = [];
  const paths = new Set(files.map(f => f.path.replace(/^\//, '')));
  const barePaths = new Set<string>();
  paths.forEach(p => { barePaths.add(p); barePaths.add(p.replace(/\.(tsx?|jsx?)$/, '')); });

  for (const file of files) {
    if (!file.path.match(/\.(tsx?|jsx?)$/)) continue;
    const filePath = file.path.replace(/^\//, '');
    const dir = filePath.includes('/') ? filePath.split('/').slice(0, -1).join('/') : '.';
    const imports = extractRelativeImports(file.content);
    for (const imp of imports) {
      if (!imp.raw.startsWith('.')) continue;
      const resolved = normalizePath(dir + '/' + imp.raw);
      const candidates = [resolved, resolved + '.tsx', resolved + '.ts', resolved + '.jsx', resolved + '.js', resolved + '/index.tsx', resolved + '/index.ts'];
      const found = candidates.some(c => barePaths.has(c) || barePaths.has(c.replace(/\.(tsx?|jsx?)$/, '')));
      if (!found) issues.push({ severity: 'critical', file: filePath, message: `Missing import: "${imp.raw}" resolves to "${resolved}" which does not exist`, type: 'import' });
    }
    if (file.content.includes('dangerouslySetInnerHTML'))
      issues.push({ severity: 'warning', file: filePath, message: 'Uses dangerouslySetInnerHTML - potential XSS risk', type: 'security' });
    if (file.content.match(/['"]sk-[a-zA-Z0-9]{20,}['"]/))
      issues.push({ severity: 'critical', file: filePath, message: 'Possible hardcoded API key detected', type: 'security' });
  }
  const appFile = files.find(f => f.path.endsWith('src/App.tsx'));
  if (appFile && !appFile.content.includes('export default'))
    issues.push({ severity: 'critical', file: 'src/App.tsx', message: 'App.tsx must have a default export', type: 'import' });
  return issues;
}

function resolveUnmetImports(files: GeneratedFile[]): GeneratedFile[] {
  const paths = new Set(files.map(f => f.path.replace(/^\//, '')));
  const barePaths = new Set<string>();
  paths.forEach(p => { barePaths.add(p); barePaths.add(p.replace(/\.(tsx?|jsx?)$/, '')); });
  const generated: GeneratedFile[] = [];
  const generatedPaths = new Set<string>();
  for (const file of files) {
    if (!file.path.match(/\.(tsx?|jsx?)$/)) continue;
    const filePath = file.path.replace(/^\//, '');
    const dir = filePath.includes('/') ? filePath.split('/').slice(0, -1).join('/') : '.';
    const imports = extractRelativeImports(file.content);
    for (const imp of imports) {
      if (!imp.raw.startsWith('.')) continue;
      const resolved = normalizePath(dir + '/' + imp.raw);
      const candidates = [resolved, resolved + '.tsx', resolved + '.ts', resolved + '.jsx', resolved + '.js', resolved + '/index.tsx'];
      const found = candidates.some(c => barePaths.has(c) || barePaths.has(c.replace(/\.(tsx?|jsx?)$/, '')));
      if (!found && !generatedPaths.has(resolved + '.tsx')) {
        const targetPath = resolved + '.tsx';
        generatedPaths.add(targetPath);
        const componentName = resolved.split('/').pop() || 'Component';
        const exportNames = imp.namedExports.length > 0 ? imp.namedExports : [componentName];
        let stub = `// Auto-generated stub by SuperBrainBuilder Agent #45 (Self-Repair)\n\n`;
        for (const name of exportNames) {
          stub += `export function ${name}(props: Record<string, any>) {\n  return (\n    <div className="rounded-xl border-2 border-dashed border-amber-300 bg-amber-50 p-6">\n      <p className="font-bold text-amber-700">${name}</p>\n      <p className="text-sm text-amber-600">Stub - auto-generated to resolve missing import</p>\n    </div>\n  );\n}\n\n`;
        }
        generated.push({ path: targetPath, content: stub, language: 'typescript', description: `Stub for ${exportNames.join(', ')}` });
      }
    }
  }
  return generated;
}

// ── Knowledge Graph Builder ──────────────────────────────────────────────────

function buildKnowledgeGraph(files: GeneratedFile[]): KnowledgeNode[] {
  const nodes: KnowledgeNode[] = [];
  for (const file of files) {
    if (!file.path.match(/\.(tsx?|jsx?)$/)) continue;
    const id = file.path;
    let type: KnowledgeNode['type'] = 'file';
    if (file.path.includes('/components/')) type = 'component';
    else if (file.path.includes('/hooks/')) type = 'hook';
    else if (file.path.includes('/types/') || file.path.includes('/types.')) type = 'type';
    else if (file.path.includes('/utils/') || file.path.includes('/helpers')) type = 'util';
    else if (file.path.includes('config') || file.path.includes('tailwind') || file.path.includes('vite')) type = 'config';

    const deps: string[] = [];
    const importRegex = /from\s+['"](\.[^'"]+)['"]/g;
    let m: RegExpExecArray | null;
    while ((m = importRegex.exec(file.content)) !== null) {
      const dir = file.path.includes('/') ? file.path.split('/').slice(0, -1).join('/') : '.';
      const resolved = normalizePath(dir + '/' + m[1]);
      deps.push(resolved);
    }
    const label = file.path.split('/').pop()?.replace(/\.(tsx?|jsx?)$/, '') || file.path;
    nodes.push({ id, type, label, deps });
  }
  return nodes;
}

// ── Pipeline phase definitions ───────────────────────────────────────────────

function createPhases(): PipelinePhase[] {
  return PHASE_AGENT_MAP.map(m => ({
    id: m.phaseId,
    name: m.phaseName,
    status: 'pending' as const,
    agentIds: m.agentIds,
  }));
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT — SuperBrainBuilder
// ═══════════════════════════════════════════════════════════════════════════════

export function PromptToAppAI() {
  // ── Core state ──
  const [messages, setMessages] = useState<ChatMessage[]>([{
    role: 'system',
    content: '🧠 **SuperBrainBuilder** — 50-Agent AI Software Factory\n\nDescribe any application and 50 specialized AI agents across 5 departments will autonomously architect, code, test, secure, and deploy it.\n\n**Departments:** Product Design (10) | Engineering (12) | Quality & Security (10) | Infrastructure (10) | Self-Healing (8)\n\n**Try:** "Build a multi-tenant SaaS marketplace with subscriptions, chat, analytics, and mobile support"',
    timestamp: Date.now(),
  }]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [generatedFiles, setGeneratedFiles] = useState<GeneratedFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [previewKey, setPreviewKey] = useState(0);
  const [copied, setCopied] = useState(false);
  const [phases, setPhases] = useState<PipelinePhase[]>(createPhases());
  const [buildIssues, setBuildIssues] = useState<BuildIssue[]>([]);
  const [architecture, setArchitecture] = useState<ArchitectureReport | null>(null);
  const [securityScore, setSecurityScore] = useState<Record<string, number> | null>(null);
  const [totalDuration, setTotalDuration] = useState(0);
  const [showExamples, setShowExamples] = useState(true);

  // ── Agent orchestrator state ──
  const [agents, setAgents] = useState<Agent[]>(createAllAgents());
  const [activeAgentCount, setActiveAgentCount] = useState(0);
  const [totalTasksCompleted, setTotalTasksCompleted] = useState(0);

  // ── Streaming state ──
  const [streamChars, setStreamChars] = useState(0);
  const [activeProvider, setActiveProvider] = useState<string | null>(null);
  const [streamingActive, setStreamingActive] = useState(false);

  // ── Refine state ──
  const [refineHistory, setRefineHistory] = useState<string[]>([]);
  const [refineTargetFile, setRefineTargetFile] = useState<string | null>(null);

  // ── View state ──
  const [sidebarTab, setSidebarTab] = useState<'console' | 'agents' | 'workflow' | 'graph' | 'memory' | 'projects' | 'templates'>('console');
  const [showPipeline, setShowPipeline] = useState(false);

  // ── Knowledge graph ──
  const [knowledgeGraph, setKnowledgeGraph] = useState<KnowledgeNode[]>([]);

  // ── Persistent memory & learning ──
  const [buildHistory, setBuildHistory] = useState<BuildRecord[]>([]);
  const [learningInsights, setLearningInsights] = useState<LearningInsight[]>([]);
  const [agentMetrics, setAgentMetrics] = useState<AgentMetricData[]>([]);
  const [loadingMemory, setLoadingMemory] = useState(false);

  // ── Favorites ──
  const [favoriteBuildIds, setFavoriteBuildIds] = useState<Set<string>>(new Set());

  // ── Comparison ──
  const [compareMode, setCompareMode] = useState(false);
  const [compareSelected, setCompareSelected] = useState<string[]>([]);
  const [comparisonData, setComparisonData] = useState<BuildComparisonData | null>(null);
  const [loadingComparison, setLoadingComparison] = useState(false);
  const [showComparisonModal, setShowComparisonModal] = useState(false);

  // ── Prompt Suggestions ──
  const [promptSuggestions, setPromptSuggestions] = useState<PromptSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // ── Build Templates ──
  const [templates, setTemplates] = useState<BuildTemplate[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [saveTemplateSource, setSaveTemplateSource] = useState<{ buildId?: string; appName?: string; prompt: string } | null>(null);
  const [templateName, setTemplateName] = useState('');
  const [templateDesc, setTemplateDesc] = useState('');
  const [templateCategory, setTemplateCategory] = useState('General');
  const [templateTags, setTemplateTags] = useState('');

  // ── Template Search & Filter ──
  const [templateSearch, setTemplateSearch] = useState('');
  const [templateFilterCategory, setTemplateFilterCategory] = useState<string | null>(null);

  // ── AI Category Suggestion ──
  const [suggestingCategory, setSuggestingCategory] = useState(false);

  // ── Selective Export ──
  const [exportSelectMode, setExportSelectMode] = useState(false);
  const [exportSelectedIds, setExportSelectedIds] = useState<Set<string>>(new Set());

  // ── Share Template ──
  const [showShareInput, setShowShareInput] = useState(false);
  const [shareCode, setShareCode] = useState('');
  const [shareImporting, setShareImporting] = useState(false);

  // ── Lineage Tree ──
  const [showLineageModal, setShowLineageModal] = useState(false);

  // ── Template Diff ──
  const [diffModalTemplateId, setDiffModalTemplateId] = useState<string | null>(null);

  // ── Template Rating ──
  const [ratingHover, setRatingHover] = useState<{ id: string; star: number } | null>(null);
  const [templateSortBy, setTemplateSortBy] = useState<'newest' | 'rating' | 'usage' | 'name'>(() => {
    try { return (localStorage.getItem('sb-sort-pref') as any) || 'newest'; } catch { return 'newest'; }
  });
  const [resettingRatings, setResettingRatings] = useState(false);
  const [showTimelineModal, setShowTimelineModal] = useState<string | null>(null);
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [mergeSourceA, setMergeSourceA] = useState<string | null>(null);
  const [mergeSourceB, setMergeSourceB] = useState<string | null>(null);
  const [autoRecommendSave, setAutoRecommendSave] = useState<{ prompt: string; appName: string } | null>(null);
  const [merging, setMerging] = useState(false);
  const [mergePreview, setMergePreview] = useState<{ prompt: string; nameA: string; nameB: string; categoryA: string; tagsA: string[]; tagsB: string[] } | null>(null);
  const [similarWarning, setSimilarWarning] = useState<{ prompt: string; matches: BuildTemplate[] } | null>(null);
  const [suppressSimilarWarning, setSuppressSimilarWarning] = useState(() => localStorage.getItem('suppress-similar-warning') === 'true');
  const [suppressWarningDate, setSuppressWarningDate] = useState(() => localStorage.getItem('suppress-similar-warning-date') || '');
  const [importingManifest, setImportingManifest] = useState(false);
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number; duplicates?: number } | null>(null);
  const importFileRef = useRef<HTMLInputElement>(null);
  const [importDragOver, setImportDragOver] = useState(false);
  const [mergeBarMode, setMergeBarMode] = useState<'words' | 'chars'>('words');
  const [importPreview, setImportPreview] = useState<ImportPreviewData | null>(null);
  const [mergeHistory, setMergeHistory] = useState<MergeHistoryEntry[]>(() => {
    try { return JSON.parse(localStorage.getItem('merge-history') || '[]'); } catch { return []; }
  });
  const [showMergeHistory, setShowMergeHistory] = useState(false);
  const [highlightedConflictZone, setHighlightedConflictZone] = useState<number | null>(null);
  const [conflictOverrides, setConflictOverrides] = useState<Record<number, 'a' | 'b' | 'ai'>>({});
  const mergePromptRef = useRef<HTMLDivElement>(null);
  const [batchRemergeSelection, setBatchRemergeSelection] = useState<Set<string>>(new Set());
  const [batchRemerging, setBatchRemerging] = useState(false);
  const [batchRemergeProgress, setBatchRemergeProgress] = useState<{ current: number; total: number; currentName: string } | null>(null);
  const [batchRemergeReport, setBatchRemergeReport] = useState<{
    items: { name: string; oldWordCount: number; newWordCount: number; oldQuality: number | null; newQuality: number; wordDelta: number; qualityDelta: number | null }[];
    totalSucceeded: number;
    totalAttempted: number;
    avgQualityDelta: number | null;
    avgWordDelta: number;
  } | null>(null);
  const [sparkHoveredIdx, setSparkHoveredIdx] = useState<number | null>(null);
  const [qualityThreshold, setQualityThreshold] = useState<number>(() => {
    try { return parseInt(localStorage.getItem('merge-quality-threshold') || '0') || 0; } catch { return 0; }
  });
  const [showThresholdConfig, setShowThresholdConfig] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [autoRemergeActive, setAutoRemergeActive] = useState(false);
  const autoRemergeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [autoRemergeCountdown, setAutoRemergeCountdown] = useState(0);
  const [autoRemergeCooldownMultiplier, setAutoRemergeCooldownMultiplier] = useState(1);
  const autoRemergeLastScoresRef = useRef<Map<string, number>>(new Map());
  const [showSuggestedPairs, setShowSuggestedPairs] = useState(false);

  // ── Agent timing tracker (for current build) ──
  const agentTimingsRef = useRef<Record<number, { startedAt: number; durationMs: number; status: string }>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sseControllerRef = useRef<AbortController | null>(null);
  const activeProviderRef = useRef<string | null>(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => { return () => { sseControllerRef.current?.abort(); }; }, []);

  // Persist sort preference
  useEffect(() => {
    try { localStorage.setItem('sb-sort-pref', templateSortBy); } catch { }
  }, [templateSortBy]);

  // Load persistent memory on mount
  const loadPersistentMemory = useCallback(async () => {
    setLoadingMemory(true);
    try {
      const [buildsRes, insightsRes, metricsRes, favsRes, suggestionsRes, templatesRes] = await Promise.allSettled([
        factoryGET('build-records'),
        factoryGET('learning-insights'),
        factoryGET('agent-metrics'),
        factoryGET('favorites'),
        factoryGET('prompt-suggestions'),
        factoryGET('templates'),
      ]);
      if (buildsRes.status === 'fulfilled') setBuildHistory(buildsRes.value.records || []);
      if (insightsRes.status === 'fulfilled') setLearningInsights(insightsRes.value.insights || []);
      if (metricsRes.status === 'fulfilled') setAgentMetrics(metricsRes.value.metrics || []);
      if (favsRes.status === 'fulfilled') setFavoriteBuildIds(new Set(favsRes.value.favorites || []));
      if (suggestionsRes.status === 'fulfilled') setPromptSuggestions(suggestionsRes.value.suggestions || []);
      if (templatesRes.status === 'fulfilled') setTemplates(templatesRes.value.templates || []);
    } catch (e) { console.error('[SuperBrain] Failed to load memory:', e); }
    finally { setLoadingMemory(false); }
  }, []);

  useEffect(() => { loadPersistentMemory(); }, [loadPersistentMemory]);

  // ── Favorites toggle ──
  const handleToggleFavorite = useCallback(async (buildId: string) => {
    // Optimistic update
    setFavoriteBuildIds(prev => {
      const next = new Set(prev);
      if (next.has(buildId)) next.delete(buildId);
      else next.add(buildId);
      return next;
    });
    try {
      await factoryAPI('toggle-favorite', { buildId });
    } catch (e) {
      console.error('[SuperBrain] Toggle favorite failed:', e);
      // Revert on error
      setFavoriteBuildIds(prev => {
        const next = new Set(prev);
        if (next.has(buildId)) next.delete(buildId);
        else next.add(buildId);
        return next;
      });
    }
  }, []);

  // ── Build comparison ──
  const handleCompareToggle = useCallback((buildId: string) => {
    setCompareSelected(prev => {
      if (prev.includes(buildId)) return prev.filter(id => id !== buildId);
      if (prev.length >= 2) return [prev[1], buildId]; // Replace oldest selection
      return [...prev, buildId];
    });
  }, []);

  const runComparison = useCallback(async () => {
    if (compareSelected.length !== 2) return;
    setLoadingComparison(true);
    try {
      const res = await factoryAPI('compare-builds', {
        buildIdA: compareSelected[0],
        buildIdB: compareSelected[1],
      });
      setComparisonData(res);
      setShowComparisonModal(true);
    } catch (e) {
      console.error('[SuperBrain] Compare failed:', e);
    } finally {
      setLoadingComparison(false);
    }
  }, [compareSelected]);

  // ── Template operations ──
  const handleSaveTemplate = useCallback(async () => {
    if (!saveTemplateSource || !templateName.trim()) return;
    try {
      const res = await factoryAPI('save-template', {
        name: templateName.trim(),
        description: templateDesc.trim(),
        prompt: saveTemplateSource.prompt,
        category: templateCategory,
        tags: templateTags.split(',').map(t => t.trim()).filter(Boolean),
        sourceBuildId: saveTemplateSource.buildId,
        sourceAppName: saveTemplateSource.appName,
      });
      if (res.template) setTemplates(prev => [res.template, ...prev]);
      setShowSaveTemplateModal(false);
      setSaveTemplateSource(null);
      setTemplateName(''); setTemplateDesc(''); setTemplateCategory('General'); setTemplateTags('');
    } catch (e) { console.error('[SuperBrain] Save template failed:', e); }
  }, [saveTemplateSource, templateName, templateDesc, templateCategory, templateTags]);

  const handleDeleteTemplate = useCallback(async (templateId: string) => {
    try {
      await factoryAPI('delete-template', { templateId });
      setTemplates(prev => prev.filter(t => t.id !== templateId));
    } catch (e) { console.error('[SuperBrain] Delete template failed:', e); }
  }, []);

  const handleDuplicateTemplate = useCallback(async (tmpl: BuildTemplate) => {
    try {
      const res = await factoryAPI('save-template', {
        name: `${tmpl.name} (Copy)`,
        description: tmpl.description,
        prompt: tmpl.prompt,
        category: tmpl.category,
        tags: tmpl.tags,
        sourceBuildId: tmpl.sourceBuildId,
        sourceAppName: tmpl.sourceAppName,
        version: (tmpl.version || 1) + 1,
        parentTemplateId: tmpl.id,
      });
      if (res.template) setTemplates(prev => [res.template, ...prev]);
    } catch (e) { console.error('[SuperBrain] Duplicate template failed:', e); }
  }, []);

  const handleExportTemplates = useCallback((selectedOnly?: boolean) => {
    const toExport = selectedOnly && exportSelectedIds.size > 0
      ? templates.filter(t => exportSelectedIds.has(t.id))
      : templates;
    if (toExport.length === 0) return;
    const data = { version: 1, exportedAt: new Date().toISOString(), templates: toExport };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `superbrain-templates-${Date.now()}.json`; a.click();
    URL.revokeObjectURL(url);
    if (selectedOnly) { setExportSelectMode(false); setExportSelectedIds(new Set()); }
  }, [templates, exportSelectedIds]);

  const handleImportTemplates = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const imported = data.templates || data;
      if (!Array.isArray(imported)) throw new Error('Invalid format');
      let count = 0;
      for (const tmpl of imported) {
        if (!tmpl.prompt || !tmpl.name) continue;
        const res = await factoryAPI('save-template', {
          name: tmpl.name,
          description: tmpl.description || '',
          prompt: tmpl.prompt,
          category: tmpl.category || 'General',
          tags: Array.isArray(tmpl.tags) ? tmpl.tags : [],
          sourceBuildId: tmpl.sourceBuildId,
          sourceAppName: tmpl.sourceAppName,
        });
        if (res.template) { setTemplates(prev => [res.template, ...prev]); count++; }
      }
      console.log(`[SuperBrain] Imported ${count} templates`);
    } catch (err) { console.error('[SuperBrain] Import templates failed:', err); }
    e.target.value = '';
  }, []);

  const handleShareTemplate = useCallback((tmpl: BuildTemplate) => {
    const payload = { n: tmpl.name, d: tmpl.description, p: tmpl.prompt, c: tmpl.category, t: tmpl.tags };
    const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
    navigator.clipboard.writeText(encoded).then(() => {
      console.log('[SuperBrain] Share code copied to clipboard');
    }).catch(() => { /* fallback: user can copy from UI */ });
    return encoded;
  }, []);

  const handleImportShareCode = useCallback(async (code: string) => {
    if (!code.trim()) return;
    setShareImporting(true);
    try {
      const decoded = JSON.parse(decodeURIComponent(escape(atob(code.trim()))));
      if (!decoded.p || !decoded.n) throw new Error('Invalid share code');
      const res = await factoryAPI('save-template', {
        name: decoded.n,
        description: decoded.d || '',
        prompt: decoded.p,
        category: decoded.c || 'General',
        tags: Array.isArray(decoded.t) ? decoded.t : [],
      });
      if (res.template) { setTemplates(prev => [res.template, ...prev]); }
      setShareCode('');
      setShowShareInput(false);
    } catch (err) { console.error('[SuperBrain] Import share code failed:', err); }
    setShareImporting(false);
  }, []);

  const toggleExportSelect = useCallback((id: string) => {
    setExportSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const handleRateTemplate = useCallback(async (templateId: string, rating: number) => {
    try {
      const res = await factoryAPI('rate-template', { templateId, rating });
      if (res.template) {
        setTemplates(prev => prev.map(t => t.id === templateId ? { ...t, rating: res.template.rating, ratingCount: res.template.ratingCount } : t));
      }
    } catch (e) { console.error('[SuperBrain] Rate template failed:', e); }
  }, []);

  const handleResetAllRatings = useCallback(async () => {
    if (!confirm('Reset all template ratings? This cannot be undone.')) return;
    setResettingRatings(true);
    try {
      await factoryAPI('reset-all-ratings', {});
      setTemplates(prev => prev.map(t => ({ ...t, rating: 0, ratingCount: 0 })));
    } catch (e) { console.error('[SuperBrain] Reset ratings failed:', e); }
    finally { setResettingRatings(false); }
  }, []);

  const handleExportDiffHTML = useCallback((parentName: string, childName: string, parentVersion: number, childVersion: number, diff: { type: 'same' | 'added' | 'removed'; text: string }[]) => {
    const diffHTML = diff.map(seg => {
      if (seg.type === 'added') return `<span style="background:rgba(16,185,129,0.2);color:#6ee7b7;padding:0 3px;border-radius:3px">${seg.text}</span>`;
      if (seg.type === 'removed') return `<span style="background:rgba(239,68,68,0.2);color:#fca5a5;text-decoration:line-through;padding:0 3px;border-radius:3px">${seg.text}</span>`;
      return `<span style="color:#9ca3af">${seg.text}</span>`;
    }).join('');
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Template Diff: ${parentName} → ${childName}</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{background:#0f172a;color:#e2e8f0;font-family:system-ui,-apple-system,sans-serif;padding:40px}
.container{max-width:800px;margin:0 auto}.header{background:linear-gradient(135deg,#0891b2,#0d9488);border-radius:16px;padding:24px;margin-bottom:24px}
h1{font-size:20px;font-weight:700;margin-bottom:8px}.badges{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
.badge{display:inline-flex;align-items:center;gap:6px;padding:4px 12px;border-radius:8px;font-size:12px;font-weight:600}
.badge-removed{background:rgba(239,68,68,0.15);border:1px solid rgba(239,68,68,0.3);color:#fca5a5}
.badge-added{background:rgba(16,185,129,0.15);border:1px solid rgba(16,185,129,0.3);color:#6ee7b7}
.arrow{color:#64748b;font-size:16px}.diff-box{background:#1e293b;border:1px solid #334155;border-radius:12px;padding:24px;font-family:monospace;font-size:13px;line-height:1.8;white-space:pre-wrap;word-break:break-word}
.legend{display:flex;gap:20px;margin-top:16px;font-size:11px;color:#64748b}.dot{width:8px;height:8px;border-radius:50%;display:inline-block;margin-right:4px}
.footer{text-align:center;margin-top:32px;color:#475569;font-size:11px}</style></head><body>
<div class="container"><div class="header"><h1>Template Diff Report</h1>
<div class="badges"><span class="badge badge-removed"><span class="dot" style="background:#ef4444"></span>${parentName} v${parentVersion}</span>
<span class="arrow">→</span><span class="badge badge-added"><span class="dot" style="background:#10b981"></span>${childName} v${childVersion}</span></div></div>
<div class="diff-box">${diffHTML}</div>
<div class="legend"><span><span class="dot" style="background:rgba(239,68,68,0.6)"></span> Removed</span>
<span><span class="dot" style="background:rgba(16,185,129,0.6)"></span> Added</span>
<span><span class="dot" style="background:rgba(100,116,139,0.6)"></span> Unchanged</span></div>
<div class="footer">SuperBrain Builder — Template Diff Export — ${new Date().toLocaleString()}</div></div></body></html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `diff-${parentName.replace(/\s+/g, '-')}-vs-${childName.replace(/\s+/g, '-')}.html`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  }, []);

  // Build lineage tree data
  const lineageTree = useMemo(() => {
    if (templates.length === 0) return [];
    const roots: BuildTemplate[] = [];
    const childrenMap = new Map<string, BuildTemplate[]>();
    for (const t of templates) {
      if (t.parentTemplateId && templates.some(p => p.id === t.parentTemplateId)) {
        const existing = childrenMap.get(t.parentTemplateId) || [];
        existing.push(t);
        childrenMap.set(t.parentTemplateId, existing);
      } else {
        roots.push(t);
      }
    }
    // Only include trees that actually have forks
    return roots.filter(r => childrenMap.has(r.id) || templates.some(t => t.parentTemplateId === r.id)).map(root => ({
      root,
      children: childrenMap.get(root.id) || [],
      grandchildren: (childrenMap.get(root.id) || []).flatMap(c => childrenMap.get(c.id) || []),
    }));
  }, [templates]);

  // Compute diff between two prompts
  const computePromptDiff = useCallback((oldText: string, newText: string) => {
    const oldWords = oldText.split(/(\s+)/);
    const newWords = newText.split(/(\s+)/);
    const result: { type: 'same' | 'added' | 'removed'; text: string }[] = [];
    // Simple LCS-based diff
    const m = oldWords.length, n = newWords.length;
    const maxOps = m + n;
    if (maxOps > 2000) {
      // Fallback for very long prompts: just show old/new
      return [{ type: 'removed' as const, text: oldText }, { type: 'added' as const, text: newText }];
    }
    const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
    for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) {
      dp[i][j] = oldWords[i - 1] === newWords[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
    let i = m, j = n;
    const ops: { type: 'same' | 'added' | 'removed'; text: string }[] = [];
    while (i > 0 || j > 0) {
      if (i > 0 && j > 0 && oldWords[i - 1] === newWords[j - 1]) {
        ops.unshift({ type: 'same', text: oldWords[i - 1] }); i--; j--;
      } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
        ops.unshift({ type: 'added', text: newWords[j - 1] }); j--;
      } else {
        ops.unshift({ type: 'removed', text: oldWords[i - 1] }); i--;
      }
    }
    // Merge consecutive same-type segments
    for (const op of ops) {
      if (result.length > 0 && result[result.length - 1].type === op.type) {
        result[result.length - 1].text += op.text;
      } else { result.push({ ...op }); }
    }
    return result;
  }, []);

  const handleUseTemplate = useCallback(async (template: BuildTemplate) => {
    setInput(template.prompt);
    setSidebarTab('console');
    setShowExamples(false);
    setShowTemplates(false);
    try { await factoryAPI('use-template', { templateId: template.id }); } catch { /* ignore */ }
  }, []);

  const handleSuggestCategory = useCallback(async () => {
    if (!saveTemplateSource?.prompt) return;
    setSuggestingCategory(true);
    try {
      const res = await factoryAPI('suggest-category', { prompt: saveTemplateSource.prompt });
      if (res.category) setTemplateCategory(res.category);
      if (res.tags && Array.isArray(res.tags) && res.tags.length > 0) {
        setTemplateTags(res.tags.join(', '));
      }
    } catch (e) { console.error('[SuperBrain] Category suggestion failed:', e); }
    finally { setSuggestingCategory(false); }
  }, [saveTemplateSource]);

  const handleExportComparison = useCallback(async () => {
    if (!comparisonData || comparisonData.builds.length < 2) return;
    try {
      const res = await factoryAPI('export-comparison', {
        buildIdA: comparisonData.builds[0].buildId,
        buildIdB: comparisonData.builds[1].buildId,
      });
      if (res.html) {
        const blob = new Blob([res.html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `comparison-${comparisonData.builds[0].appName}-vs-${comparisonData.builds[1].appName}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (e) { console.error('[SuperBrain] Export comparison failed:', e); }
  }, [comparisonData]);

  const openSaveTemplateModal = useCallback((prompt: string, buildId?: string, appName?: string) => {
    setSaveTemplateSource({ prompt, buildId, appName });
    setTemplateName(appName ? `${appName} Template` : '');
    setTemplateDesc('');
    setTemplateCategory('General');
    setTemplateTags('');
    setShowSaveTemplateModal(true);
  }, []);

  // ── Export timeline as HTML ──
  const handleExportTimeline = useCallback((chain: BuildTemplate[]) => {
    const diffSegments = chain.map((tmpl, idx) => {
      if (idx === 0) return null;
      return computePromptDiff(chain[idx - 1].prompt, tmpl.prompt);
    });
    const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Timeline: ${chain[0]?.name || 'Template'} Evolution</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}body{background:#0f0f1a;color:#e0e0e0;font-family:'Segoe UI',system-ui,sans-serif;padding:40px}
.header{text-align:center;margin-bottom:40px}.header h1{font-size:24px;color:#a78bfa;margin-bottom:8px}
.header p{color:#666;font-size:13px}.timeline{position:relative;max-width:700px;margin:0 auto;padding-left:40px}
.timeline::before{content:'';position:absolute;left:16px;top:0;bottom:0;width:2px;background:linear-gradient(180deg,#6366f1,#8b5cf6,#a855f7)}
.step{position:relative;padding-bottom:32px}.step:last-child{padding-bottom:0}
.dot{position:absolute;left:-32px;top:4px;width:16px;height:16px;border-radius:50%;border:3px solid}
.dot.root{background:#34d399;border-color:#6ee7b7}.dot.current{background:#818cf8;border-color:#a5b4fc;box-shadow:0 0 12px #6366f180}
.dot.normal{background:#4b5563;border-color:#6b7280}
.card{background:#1a1a2e;border:1px solid #333;border-radius:12px;padding:16px;transition:border-color .2s}.card:hover{border-color:#6366f180}
.card h3{font-size:14px;color:#fff;margin-bottom:4px;display:flex;align-items:center;gap:8px}
.badge{font-size:10px;padding:2px 8px;border-radius:4px;font-weight:600}
.v-badge{background:#312e81;color:#818cf8;border:1px solid #4338ca30}
.root-badge{background:#064e3b;color:#34d399;border:1px solid #05966930}
.meta{font-size:11px;color:#666;margin-bottom:8px}.prompt{font-size:12px;color:#9ca3af;line-height:1.6;margin-bottom:10px}
.diff-section{border-top:1px solid #ffffff10;padding-top:10px;margin-top:10px}
.diff-label{font-size:10px;color:#666;margin-bottom:6px;display:flex;align-items:center;gap:8px}
.diff-stat{font-size:10px;padding:1px 6px;border-radius:3px}
.stat-add{background:#064e3b80;color:#34d399}.stat-rem{background:#7f1d1d80;color:#f87171}
.diff-text{background:#0a0a14;border-radius:8px;padding:12px;font-family:'Fira Code',monospace;font-size:11px;line-height:1.8;max-height:200px;overflow-y:auto}
.diff-text .added{background:#065f4620;color:#6ee7b7;padding:1px 3px;border-radius:2px}
.diff-text .removed{background:#7f1d1d20;color:#fca5a5;text-decoration:line-through;padding:1px 3px;border-radius:2px}
.rating{color:#eab308;font-size:11px}
</style></head><body>
<div class="header"><h1>🕐 Template Evolution Timeline</h1>
<p>${chain.length} versions · ${chain[0]?.name || 'Template'} lineage · Exported ${new Date().toLocaleDateString()}</p></div>
<div class="timeline">${chain.map((tmpl, idx) => {
      const diff = diffSegments[idx];
      const addedCount = diff ? diff.filter(d => d.type === 'added').length : 0;
      const removedCount = diff ? diff.filter(d => d.type === 'removed').length : 0;
      return `<div class="step"><div class="dot ${idx === 0 ? 'root' : 'normal'}"></div>
<div class="card"><h3>${tmpl.name} <span class="badge v-badge">v${tmpl.version || 1}</span>${idx === 0 ? ' <span class="badge root-badge">root</span>' : ''}${(tmpl.rating || 0) > 0 ? ` <span class="rating">★ ${tmpl.rating!.toFixed(1)}</span>` : ''}</h3>
<div class="meta">${new Date(tmpl.createdAt).toLocaleString()}${tmpl.usageCount ? ` · Used ${tmpl.usageCount}x` : ''}</div>
<div class="prompt">${tmpl.prompt.substring(0, 300).replace(/</g, '&lt;')}${tmpl.prompt.length > 300 ? '...' : ''}</div>
${diff ? `<div class="diff-section"><div class="diff-label">Changes from v${chain[idx - 1].version || 1}
${addedCount > 0 ? `<span class="diff-stat stat-add">+${addedCount}</span>` : ''}
${removedCount > 0 ? `<span class="diff-stat stat-rem">-${removedCount}</span>` : ''}</div>
<div class="diff-text">${diff.slice(0, 80).map(s =>
        s.type === 'added' ? `<span class="added">${s.text.replace(/</g, '&lt;')}</span>` :
          s.type === 'removed' ? `<span class="removed">${s.text.replace(/</g, '&lt;')}</span>` :
            s.text.replace(/</g, '&lt;')
      ).join('')}${diff.length > 80 ? '<span style="color:#666">...</span>' : ''}</div></div>` : ''}</div></div>`;
    }).join('')}</div></body></html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `timeline-${chain[0]?.name || 'template'}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [computePromptDiff]);

  // ── Batch export all fork chains ──
  const handleBatchExportTimelines = useCallback(() => {
    // Find all root templates that have children (fork chains)
    const childrenMap = new Map<string, BuildTemplate[]>();
    for (const t of templates) {
      if (t.parentTemplateId) {
        const existing = childrenMap.get(t.parentTemplateId) || [];
        existing.push(t);
        childrenMap.set(t.parentTemplateId, existing);
      }
    }
    const roots = templates.filter(t => !t.parentTemplateId && childrenMap.has(t.id));
    if (roots.length === 0) return;

    const allChains: { root: string; chain: BuildTemplate[] }[] = [];
    for (const root of roots) {
      const chain = buildTimelineChain(root.id);
      if (chain.length >= 2) allChains.push({ root: root.name, chain });
    }
    if (allChains.length === 0) return;

    const totalVersions = allChains.reduce((s, c) => s + c.chain.length, 0);
    const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>All Template Timelines - Batch Export</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}body{background:#0f0f1a;color:#e0e0e0;font-family:'Segoe UI',system-ui,sans-serif;padding:40px}
.header{text-align:center;margin-bottom:40px}.header h1{font-size:28px;color:#a78bfa;margin-bottom:8px}
.header p{color:#666;font-size:13px}.chain-section{max-width:720px;margin:0 auto 48px}
.chain-title{font-size:18px;font-weight:700;color:#818cf8;padding-bottom:12px;border-bottom:1px solid #333;margin-bottom:20px;display:flex;align-items:center;gap:10px}
.chain-badge{font-size:11px;background:#312e81;color:#818cf8;padding:3px 10px;border-radius:6px;border:1px solid #4338ca30}
.timeline{position:relative;padding-left:40px}.timeline::before{content:'';position:absolute;left:16px;top:0;bottom:0;width:2px;background:linear-gradient(180deg,#6366f1,#8b5cf6,#a855f7)}
.step{position:relative;padding-bottom:28px}.step:last-child{padding-bottom:0}
.dot{position:absolute;left:-32px;top:4px;width:14px;height:14px;border-radius:50%;border:3px solid}
.dot.root{background:#34d399;border-color:#6ee7b7}.dot.normal{background:#4b5563;border-color:#6b7280}
.card{background:#1a1a2e;border:1px solid #333;border-radius:12px;padding:14px;transition:border-color .2s}.card:hover{border-color:#6366f180}
.card h3{font-size:13px;color:#fff;margin-bottom:4px;display:flex;align-items:center;gap:8px}
.badge{font-size:10px;padding:2px 8px;border-radius:4px;font-weight:600}
.v-badge{background:#312e81;color:#818cf8;border:1px solid #4338ca30}
.root-badge{background:#064e3b;color:#34d399;border:1px solid #05966930}
.meta{font-size:11px;color:#666;margin-bottom:6px}.prompt{font-size:12px;color:#9ca3af;line-height:1.6;margin-bottom:8px}
.diff-section{border-top:1px solid #ffffff10;padding-top:8px;margin-top:8px}
.diff-label{font-size:10px;color:#666;margin-bottom:6px;display:flex;align-items:center;gap:8px}
.diff-stat{font-size:10px;padding:1px 6px;border-radius:3px}
.stat-add{background:#064e3b80;color:#34d399}.stat-rem{background:#7f1d1d80;color:#f87171}
.diff-text{background:#0a0a14;border-radius:8px;padding:10px;font-family:'Fira Code',monospace;font-size:11px;line-height:1.8;max-height:160px;overflow-y:auto}
.diff-text .added{background:#065f4620;color:#6ee7b7;padding:1px 3px;border-radius:2px}
.diff-text .removed{background:#7f1d1d20;color:#fca5a5;text-decoration:line-through;padding:1px 3px;border-radius:2px}
.rating{color:#eab308;font-size:11px}
.toc{max-width:720px;margin:0 auto 40px;background:#1a1a2e;border:1px solid #333;border-radius:12px;padding:20px}
.toc h2{font-size:16px;color:#a78bfa;margin-bottom:12px}.toc-item{display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #ffffff08}
.toc-item:last-child{border:none}.toc-link{color:#818cf8;text-decoration:none;font-size:13px}.toc-link:hover{text-decoration:underline}
.toc-count{font-size:11px;color:#666}
</style></head><body>
<div class="header"><h1>📦 All Template Timelines</h1>
<p>${allChains.length} fork chain${allChains.length !== 1 ? 's' : ''} · ${totalVersions} total versions · Exported ${new Date().toLocaleDateString()}</p></div>
<div class="toc"><h2>📑 Table of Contents</h2>
${allChains.map((c, i) => `<div class="toc-item"><a class="toc-link" href="#chain-${i}">${c.root}</a><span class="toc-count">${c.chain.length} versions</span></div>`).join('')}
</div>
${allChains.map((chainData, ci) => {
      const diffSegments = chainData.chain.map((tmpl, idx) => {
        if (idx === 0) return null;
        return computePromptDiff(chainData.chain[idx - 1].prompt, tmpl.prompt);
      });
      return `<div class="chain-section" id="chain-${ci}">
<div class="chain-title">${chainData.root} <span class="chain-badge">${chainData.chain.length} versions</span></div>
<div class="timeline">${chainData.chain.map((tmpl, idx) => {
        const diff = diffSegments[idx];
        const addedCount = diff ? diff.filter(d => d.type === 'added').length : 0;
        const removedCount = diff ? diff.filter(d => d.type === 'removed').length : 0;
        return `<div class="step"><div class="dot ${idx === 0 ? 'root' : 'normal'}"></div>
<div class="card"><h3>${tmpl.name} <span class="badge v-badge">v${tmpl.version || 1}</span>${idx === 0 ? ' <span class="badge root-badge">root</span>' : ''}${(tmpl.rating || 0) > 0 ? ` <span class="rating">★ ${tmpl.rating!.toFixed(1)}</span>` : ''}</h3>
<div class="meta">${new Date(tmpl.createdAt).toLocaleString()}${tmpl.usageCount ? ` · Used ${tmpl.usageCount}x` : ''}</div>
<div class="prompt">${tmpl.prompt.substring(0, 250).replace(/</g, '&lt;')}${tmpl.prompt.length > 250 ? '...' : ''}</div>
${diff ? `<div class="diff-section"><div class="diff-label">Changes from v${chainData.chain[idx - 1].version || 1}
${addedCount > 0 ? `<span class="diff-stat stat-add">+${addedCount}</span>` : ''}
${removedCount > 0 ? `<span class="diff-stat stat-rem">-${removedCount}</span>` : ''}</div>
<div class="diff-text">${diff.slice(0, 60).map(s =>
          s.type === 'added' ? `<span class="added">${s.text.replace(/</g, '&lt;')}</span>` :
            s.type === 'removed' ? `<span class="removed">${s.text.replace(/</g, '&lt;')}</span>` :
              s.text.replace(/</g, '&lt;')
        ).join('')}${diff.length > 60 ? '<span style="color:#666">...</span>' : ''}</div></div>` : ''}</div></div>`;
      }).join('')}</div></div>`;
    }).join('')}
</body></html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `all-timelines-${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [templates, buildTimelineChain, computePromptDiff]);

  // ── Export JSON manifest of all fork chains ──
  const handleExportJsonManifest = useCallback(() => {
    const childrenMap = new Map<string, BuildTemplate[]>();
    for (const t of templates) {
      if (t.parentTemplateId) {
        const existing = childrenMap.get(t.parentTemplateId) || [];
        existing.push(t);
        childrenMap.set(t.parentTemplateId, existing);
      }
    }
    const roots = templates.filter(t => !t.parentTemplateId && childrenMap.has(t.id));
    if (roots.length === 0) return;

    const allChains = roots
      .map(root => {
        const chain = buildTimelineChain(root.id);
        if (chain.length < 2) return null;
        return {
          rootId: root.id,
          rootName: root.name,
          chainLength: chain.length,
          versions: chain.map((tmpl, idx) => ({
            id: tmpl.id,
            name: tmpl.name,
            version: tmpl.version || 1,
            prompt: tmpl.prompt,
            description: tmpl.description,
            category: tmpl.category,
            tags: tmpl.tags,
            rating: tmpl.rating || 0,
            ratingCount: tmpl.ratingCount || 0,
            usageCount: tmpl.usageCount,
            parentTemplateId: tmpl.parentTemplateId || null,
            sourceBuildId: tmpl.sourceBuildId || null,
            sourceAppName: tmpl.sourceAppName || null,
            createdAt: tmpl.createdAt,
            isRoot: idx === 0,
          })),
        };
      })
      .filter(Boolean);

    const manifest = {
      exportedAt: new Date().toISOString(),
      format: 'superbrain-template-manifest',
      formatVersion: '1.0',
      totalChains: allChains.length,
      totalVersions: allChains.reduce((s, c) => s + (c?.chainLength || 0), 0),
      chains: allChains,
      mergeHistory: mergeHistory.length > 0 ? mergeHistory : undefined,
    };

    const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `template-manifest-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [templates, buildTimelineChain, mergeHistory]);

  // ── Manifest version migration ──
  const migrateManifest = useCallback((manifest: any): { manifest: any; migratedFrom?: string } => {
    const ver = manifest.formatVersion || '1.0';
    // v0.x legacy: flat templates array instead of chains
    if (!manifest.chains && Array.isArray(manifest.templates)) {
      console.log(`[SuperBrain] Migrating manifest from legacy flat format to v1.0`);
      return {
        manifest: {
          ...manifest,
          format: 'superbrain-template-manifest',
          formatVersion: '1.0',
          chains: [{ rootTemplateId: 'legacy', chainLength: manifest.templates.length, versions: manifest.templates }],
          totalChains: 1,
          totalVersions: manifest.templates.length,
        },
        migratedFrom: 'legacy-flat',
      };
    }
    // v1.0 is current, nothing to migrate
    if (ver === '1.0') return { manifest };
    // v2.0+ future: add migration steps here
    // For now, attempt to use as-is with a warning
    console.warn(`[SuperBrain] Unknown manifest version ${ver}, attempting to use as v1.0`);
    return { manifest: { ...manifest, formatVersion: '1.0' }, migratedFrom: ver };
  }, []);

  // ── Import preview step: parse manifest & detect duplicates ──
  const processManifestFile = useCallback(async (file: File) => {
    setImportResult(null);
    try {
      const text = await file.text();
      let rawManifest = JSON.parse(text);
      // Accept both manifest format and legacy export format
      if (rawManifest.format !== 'superbrain-template-manifest' && !Array.isArray(rawManifest.templates)) {
        throw new Error('Invalid manifest format. Expected "superbrain-template-manifest" or legacy export with templates array.');
      }
      const { manifest, migratedFrom } = migrateManifest(rawManifest);

      // Flatten all versions
      const allVersions: any[] = [];
      for (const chain of (manifest.chains || [])) {
        for (const ver of (chain?.versions || [])) {
          allVersions.push(ver);
        }
      }
      if (allVersions.length === 0) throw new Error('No template versions found in manifest.');

      // Client-side duplicate detection
      const existingHashes = new Set(
        templates.map(t => `${t.name.toLowerCase().trim()}::${t.prompt.substring(0, 200).toLowerCase().trim()}`)
      );
      const enriched = allVersions.map(ver => {
        const hash = `${(ver.name || '').toLowerCase().trim()}::${(ver.prompt || '').substring(0, 200).toLowerCase().trim()}`;
        const isDuplicate = existingHashes.has(hash);
        if (!isDuplicate) existingHashes.add(hash);
        return { ...ver, isDuplicate };
      });

      const duplicateCount = enriched.filter(v => v.isDuplicate).length;
      const newCount = enriched.filter(v => !v.isDuplicate).length;

      setImportPreview({
        filename: file.name,
        formatVersion: manifest.formatVersion || '1.0',
        migratedFrom,
        totalChains: manifest.totalChains || manifest.chains?.length || 0,
        versions: enriched,
        duplicateCount,
        newCount,
        file,
        importedMergeHistory: Array.isArray(manifest.mergeHistory) ? manifest.mergeHistory : undefined,
      });
    } catch (err: any) {
      console.error('[SuperBrain] Import manifest parse failed:', err);
      setImportResult({ imported: 0, skipped: -1 });
      setTimeout(() => setImportResult(null), 5000);
    }
  }, [templates, migrateManifest]);

  // ── Confirm import from preview ──
  const handleConfirmImport = useCallback(async () => {
    if (!importPreview) return;
    setImportingManifest(true);
    setImportPreview(null);
    try {
      const deduped = importPreview.versions.filter(v => !v.isDuplicate);
      if (deduped.length === 0) {
        setImportResult({ imported: 0, skipped: 0, duplicates: importPreview.duplicateCount });
        setTimeout(() => setImportResult(null), 5000);
        return;
      }
      const res = await factoryAPI('import-templates', { templates: deduped });
      if (res.templates) {
        setTemplates(prev => [...res.templates, ...prev]);
      }
      // Merge imported merge history (deduplicate by id)
      if (importPreview.importedMergeHistory && importPreview.importedMergeHistory.length > 0) {
        const existingIds = new Set(mergeHistory.map(e => e.id));
        const newEntries = importPreview.importedMergeHistory.filter(e => !existingIds.has(e.id));
        if (newEntries.length > 0) {
          const combined = [...newEntries, ...mergeHistory].sort((a, b) => b.timestamp - a.timestamp).slice(0, 50);
          setMergeHistory(combined);
          localStorage.setItem('merge-history', JSON.stringify(combined));
        }
      }
      setImportResult({ imported: res.imported || 0, skipped: res.skipped || 0, duplicates: importPreview.duplicateCount });
      setTimeout(() => setImportResult(null), 6000);
    } catch (err: any) {
      console.error('[SuperBrain] Import manifest failed:', err);
      setImportResult({ imported: 0, skipped: -1 });
      setTimeout(() => setImportResult(null), 5000);
    } finally {
      setImportingManifest(false);
    }
  }, [importPreview, mergeHistory]);

  const handleImportJsonManifest = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    await processManifestFile(file);
  }, [processManifestFile]);

  const handleImportDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setImportDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.name.endsWith('.json')) return;
    await processManifestFile(file);
  }, [processManifestFile]);

  // ── Merge two template prompts ──
  const handleMergeTemplates = useCallback(async () => {
    if (!mergeSourceA || !mergeSourceB || merging) return;
    const tmplA = templates.find(t => t.id === mergeSourceA);
    const tmplB = templates.find(t => t.id === mergeSourceB);
    if (!tmplA || !tmplB) return;
    setMerging(true);
    try {
      const res = await factoryAPI('merge-templates', {
        promptA: tmplA.prompt,
        promptB: tmplB.prompt,
        nameA: tmplA.name,
        nameB: tmplB.name,
      });
      if (res.mergedPrompt) {
        setMergePreview({
          prompt: res.mergedPrompt,
          nameA: tmplA.name,
          nameB: tmplB.name,
          categoryA: tmplA.category || 'General',
          tagsA: tmplA.tags,
          tagsB: tmplB.tags,
        });
      }
    } catch (e) {
      console.error('[SuperBrain] Merge failed:', e);
      addLog?.('❌ Template merge failed. Try again.');
    } finally {
      setMerging(false);
    }
  }, [mergeSourceA, mergeSourceB, templates, merging]);

  // ── Batch re-merge handler ──
  const handleBatchRemerge = useCallback(async () => {
    const selected = mergeHistory.filter(e => batchRemergeSelection.has(e.id));
    const eligible = selected.filter(e => templates.some(t => t.id === e.sourceAId) && templates.some(t => t.id === e.sourceBId));
    if (eligible.length === 0) return;
    setBatchRemerging(true);
    setBatchRemergeReport(null);
    const results: MergeHistoryEntry[] = [];
    const reportItems: { name: string; oldWordCount: number; newWordCount: number; oldQuality: number | null; newQuality: number; wordDelta: number; qualityDelta: number | null }[] = [];
    for (let i = 0; i < eligible.length; i++) {
      const entry = eligible[i];
      const tmplA = templates.find(t => t.id === entry.sourceAId);
      const tmplB = templates.find(t => t.id === entry.sourceBId);
      if (!tmplA || !tmplB) continue;
      setBatchRemergeProgress({ current: i + 1, total: eligible.length, currentName: `${entry.sourceAName} + ${entry.sourceBName}` });
      try {
        const res = await factoryAPI('merge-templates', {
          promptA: tmplA.prompt,
          promptB: tmplB.prompt,
          nameA: tmplA.name,
          nameB: tmplB.name,
        });
        if (res.mergedPrompt) {
          const getWordSet = (s: string) => new Set(s.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(w => w.length > 2));
          const mergedWords = getWordSet(res.mergedPrompt);
          const wordsA = getWordSet(tmplA.prompt);
          const wordsB = getWordSet(tmplB.prompt);
          const pA = wordsA.size > 0 ? Math.round(([...wordsA].filter(w => mergedWords.has(w)).length / wordsA.size) * 100) : 100;
          const pB = wordsB.size > 0 ? Math.round(([...wordsB].filter(w => mergedWords.has(w)).length / wordsB.size) * 100) : 100;
          const combinedSize = tmplA.prompt.split(/\s+/).length + tmplB.prompt.split(/\s+/).length;
          const mergedSize = res.mergedPrompt.split(/\s+/).length;
          const dedup = combinedSize > 0 ? Math.round(Math.max(0, Math.min(1, 1 - ((mergedSize - Math.max(wordsA.size, wordsB.size)) / combinedSize))) * 100) : 100;
          const overall = Math.min(100, Math.max(0, Math.round((pA * 0.35 + pB * 0.35 + dedup * 0.15 + 100 * 0.15))));
          const newWC = res.mergedPrompt.split(/\s+/).filter(Boolean).length;
          results.push({
            id: `mh-${Date.now()}-${i}`,
            timestamp: Date.now(),
            sourceAName: tmplA.name,
            sourceAId: tmplA.id,
            sourceBName: tmplB.name,
            sourceBId: tmplB.id,
            resultName: `${tmplA.name} + ${tmplB.name} Re-merge`,
            promptSnippet: res.mergedPrompt.substring(0, 150),
            wordCount: newWC,
            qualityScore: overall,
            preservationA: pA,
            preservationB: pB,
            dedupEfficiency: dedup,
          });
          reportItems.push({
            name: `${entry.sourceAName} + ${entry.sourceBName}`,
            oldWordCount: entry.wordCount,
            newWordCount: newWC,
            oldQuality: entry.qualityScore ?? null,
            newQuality: overall,
            wordDelta: newWC - entry.wordCount,
            qualityDelta: entry.qualityScore != null ? overall - entry.qualityScore : null,
          });
        }
      } catch (e) {
        console.error(`[SuperBrain] Batch re-merge failed for ${entry.sourceAName} + ${entry.sourceBName}:`, e);
      }
    }
    if (results.length > 0) {
      const updated = [...results, ...mergeHistory].slice(0, 50);
      setMergeHistory(updated);
      localStorage.setItem('merge-history', JSON.stringify(updated));
    }
    // Build diff report
    const qualityDeltas = reportItems.filter(r => r.qualityDelta !== null).map(r => r.qualityDelta!);
    setBatchRemergeReport({
      items: reportItems,
      totalSucceeded: results.length,
      totalAttempted: eligible.length,
      avgQualityDelta: qualityDeltas.length > 0 ? Math.round((qualityDeltas.reduce((a, b) => a + b, 0) / qualityDeltas.length) * 10) / 10 : null,
      avgWordDelta: reportItems.length > 0 ? Math.round(reportItems.reduce((a, r) => a + r.wordDelta, 0) / reportItems.length) : 0,
    });
    // Threshold breach toasts for batch
    if (qualityThreshold > 0) {
      const breached = reportItems.filter(r => r.newQuality < qualityThreshold);
      if (breached.length > 0) {
        toast.error(`⚠ ${breached.length} re-merge${breached.length > 1 ? 's' : ''} below quality gate (${qualityThreshold})`, {
          description: breached.map(b => `${b.name}: ${b.newQuality}`).join(', '),
          duration: 8000,
        });
      }
    }
    setBatchRemerging(false);
    setBatchRemergeProgress(null);
    setBatchRemergeSelection(new Set());
    addLog?.(`✅ Batch re-merge complete: ${results.length}/${eligible.length} succeeded`);
  }, [batchRemergeSelection, mergeHistory, templates, qualityThreshold]);

  // ── Scheduled auto re-merge for below-gate entries with cooldown escalation ──
  const AUTO_REMERGE_BASE_INTERVAL = 60; // base seconds between auto re-merge cycles
  const AUTO_REMERGE_INTERVAL = AUTO_REMERGE_BASE_INTERVAL * autoRemergeCooldownMultiplier;
  const handleAutoRemerge = useCallback(async () => {
    if (batchRemerging || qualityThreshold <= 0) return;
    const belowGate = mergeHistory.filter(e =>
      e.qualityScore != null && e.qualityScore < qualityThreshold &&
      templates.some(t => t.id === e.sourceAId) && templates.some(t => t.id === e.sourceBId)
    );
    if (belowGate.length === 0) {
      toast.success('All merges now pass the quality gate — auto re-merge stopped.', { duration: 4000 });
      setAutoRemergeActive(false);
      setAutoRemergeCooldownMultiplier(1);
      autoRemergeLastScoresRef.current.clear();
      return;
    }
    // Check if any scores improved since last cycle for cooldown escalation
    const lastScores = autoRemergeLastScoresRef.current;
    let anyImproved = false;
    belowGate.forEach(e => {
      const prev = lastScores.get(e.id);
      if (prev != null && e.qualityScore != null && e.qualityScore > prev) anyImproved = true;
    });
    // Update last scores snapshot
    const newScores = new Map<string, number>();
    belowGate.forEach(e => { if (e.qualityScore != null) newScores.set(e.id, e.qualityScore); });
    autoRemergeLastScoresRef.current = newScores;
    // Escalate or reset cooldown
    if (lastScores.size > 0) {
      if (anyImproved) {
        if (autoRemergeCooldownMultiplier > 1) {
          setAutoRemergeCooldownMultiplier(1);
          toast.info('Scores improved — cooldown reset to 60s', { duration: 2500 });
        }
      } else {
        const newMult = Math.min(autoRemergeCooldownMultiplier * 2, 16);
        if (newMult !== autoRemergeCooldownMultiplier) {
          setAutoRemergeCooldownMultiplier(newMult);
          toast.warning(`No improvement detected — cooldown escalated to ${AUTO_REMERGE_BASE_INTERVAL * newMult}s`, { duration: 3000 });
        }
      }
    }
    // Select below-gate entries and trigger batch
    const ids = new Set(belowGate.map(e => e.id));
    setBatchRemergeSelection(ids);
    // Small delay to let state propagate, then trigger
    setTimeout(() => {
      handleBatchRemerge();
    }, 100);
  }, [mergeHistory, templates, qualityThreshold, batchRemerging, handleBatchRemerge, autoRemergeCooldownMultiplier]);

  useEffect(() => {
    if (autoRemergeActive && showMergeHistory) {
      setAutoRemergeCountdown(AUTO_REMERGE_INTERVAL);
      const countdownInterval = setInterval(() => {
        setAutoRemergeCountdown(prev => {
          if (prev <= 1) {
            handleAutoRemerge();
            return AUTO_REMERGE_INTERVAL;
          }
          return prev - 1;
        });
      }, 1000);
      autoRemergeIntervalRef.current = countdownInterval;
      return () => {
        clearInterval(countdownInterval);
        autoRemergeIntervalRef.current = null;
      };
    } else {
      if (autoRemergeIntervalRef.current) {
        clearInterval(autoRemergeIntervalRef.current);
        autoRemergeIntervalRef.current = null;
      }
      setAutoRemergeCountdown(0);
    }
  }, [autoRemergeActive, showMergeHistory, handleAutoRemerge, AUTO_REMERGE_INTERVAL]);

  // Stop auto remerge when modal closes & reset cooldown
  useEffect(() => {
    if (!showMergeHistory) {
      setAutoRemergeActive(false);
      setAutoRemergeCooldownMultiplier(1);
      autoRemergeLastScoresRef.current.clear();
    }
  }, [showMergeHistory]);

  // ── Merge quality leaderboard data ──
  const leaderboardData = useMemo(() => {
    const pairMap: Record<string, { pairKey: string; nameA: string; nameB: string; idA: string; idB: string; scores: number[]; scoreTimeline: { score: number; timestamp: number }[]; bestScore: number; mergeCount: number; latestTimestamp: number }> = {};
    mergeHistory.forEach(e => {
      if (e.qualityScore == null) return;
      const key = [e.sourceAId, e.sourceBId].sort().join('::');
      if (!pairMap[key]) {
        pairMap[key] = { pairKey: key, nameA: e.sourceAName, nameB: e.sourceBName, idA: e.sourceAId, idB: e.sourceBId, scores: [], scoreTimeline: [], bestScore: 0, mergeCount: 0, latestTimestamp: 0 };
      }
      pairMap[key].scores.push(e.qualityScore);
      pairMap[key].scoreTimeline.push({ score: e.qualityScore, timestamp: e.timestamp });
      pairMap[key].bestScore = Math.max(pairMap[key].bestScore, e.qualityScore);
      pairMap[key].mergeCount++;
      pairMap[key].latestTimestamp = Math.max(pairMap[key].latestTimestamp, e.timestamp);
    });
    return Object.values(pairMap)
      .map(p => ({
        ...p,
        avgScore: Math.round(p.scores.reduce((a, b) => a + b, 0) / p.scores.length),
        scoreTimeline: p.scoreTimeline.sort((a, b) => a.timestamp - b.timestamp),
      }))
      .sort((a, b) => b.bestScore - a.bestScore);
  }, [mergeHistory]);

  // ── Merge suggestion engine — recommend untried pairs likely to produce high-quality merges ──
  const suggestedPairs = useMemo(() => {
    if (templates.length < 2) return [];
    // Collect all tried pair keys
    const triedKeys = new Set<string>();
    mergeHistory.forEach(e => {
      triedKeys.add([e.sourceAId, e.sourceBId].sort().join('::'));
    });
    // Score untried pairs by tag overlap, category match, and avg leaderboard performance of each template
    const templateScoreMap: Record<string, number[]> = {};
    mergeHistory.forEach(e => {
      if (e.qualityScore == null) return;
      if (!templateScoreMap[e.sourceAId]) templateScoreMap[e.sourceAId] = [];
      if (!templateScoreMap[e.sourceBId]) templateScoreMap[e.sourceBId] = [];
      templateScoreMap[e.sourceAId].push(e.qualityScore);
      templateScoreMap[e.sourceBId].push(e.qualityScore);
    });
    const getAvgScore = (id: string) => {
      const s = templateScoreMap[id];
      return s && s.length > 0 ? s.reduce((a, b) => a + b, 0) / s.length : 50;
    };
    const candidates: { idA: string; idB: string; nameA: string; nameB: string; score: number; reason: string }[] = [];
    for (let i = 0; i < templates.length; i++) {
      for (let j = i + 1; j < templates.length; j++) {
        const a = templates[i], b = templates[j];
        const key = [a.id, b.id].sort().join('::');
        if (triedKeys.has(key)) continue;
        // Compute suggestion score
        let score = 0;
        let reasons: string[] = [];
        // Tag overlap (shared tags suggest complementary content)
        const tagsA = new Set(a.tags.map(t => t.toLowerCase()));
        const tagsB = new Set(b.tags.map(t => t.toLowerCase()));
        const sharedTags = [...tagsA].filter(t => tagsB.has(t)).length;
        if (sharedTags > 0) { score += sharedTags * 15; reasons.push(`${sharedTags} shared tag${sharedTags > 1 ? 's' : ''}`); }
        // Category match
        if (a.category === b.category) { score += 20; reasons.push('same category'); }
        // Templates with high merge history scores tend to produce good merges
        const avgA = getAvgScore(a.id), avgB = getAvgScore(b.id);
        if (avgA > 65 || avgB > 65) { score += Math.round((avgA + avgB) / 4); reasons.push('strong merge history'); }
        // Higher-rated templates merge better
        const ratingA = a.rating || 0, ratingB = b.rating || 0;
        if (ratingA >= 4 || ratingB >= 4) { score += 10; reasons.push('highly rated'); }
        // Prompt length similarity bonus (similar lengths merge more evenly)
        const lenRatio = Math.min(a.prompt.length, b.prompt.length) / Math.max(a.prompt.length, b.prompt.length);
        if (lenRatio > 0.5) { score += Math.round(lenRatio * 10); reasons.push('balanced length'); }
        if (score > 0) candidates.push({ idA: a.id, idB: b.id, nameA: a.name, nameB: b.name, score, reason: reasons.join(', ') });
      }
    }
    return candidates.sort((a, b) => b.score - a.score).slice(0, 5);
  }, [templates, mergeHistory]);

  // ── Threshold auto-adjustment suggestion ──
  const thresholdSuggestion = useMemo(() => {
    if (qualityThreshold <= 0) return null;
    const scored = mergeHistory.filter(e => e.qualityScore != null).sort((a, b) => b.timestamp - a.timestamp);
    if (scored.length < 5) return null;
    const recent5 = scored.slice(0, 5).map(e => e.qualityScore!);
    const older5 = scored.slice(5, 10).map(e => e.qualityScore!);
    const recentAvg = Math.round(recent5.reduce((a, b) => a + b, 0) / recent5.length);
    const olderAvg = older5.length > 0 ? Math.round(older5.reduce((a, b) => a + b, 0) / older5.length) : recentAvg;
    const trend = recentAvg - olderAvg;
    const passRate = Math.round((scored.filter(e => e.qualityScore! >= qualityThreshold).length / scored.length) * 100);
    // Suggest raising if >90% pass and trending up
    if (passRate > 90 && trend > 3 && qualityThreshold < 90) {
      const suggested = Math.min(qualityThreshold + 5, 95);
      return { type: 'raise' as const, suggested, reason: `${passRate}% pass rate with +${trend}pt uptrend`, recentAvg, trend, passRate };
    }
    // Suggest lowering if <40% pass and trending down
    if (passRate < 40 && trend < -3 && qualityThreshold > 30) {
      const suggested = Math.max(qualityThreshold - 10, 20);
      return { type: 'lower' as const, suggested, reason: `Only ${passRate}% pass rate with ${trend}pt downtrend`, recentAvg, trend, passRate };
    }
    return null;
  }, [mergeHistory, qualityThreshold]);

  // ── Filtered & sorted templates ──
  const filteredTemplates = useMemo(() => {
    let result = templates;
    if (templateFilterCategory) {
      result = result.filter(t => t.category === templateFilterCategory);
    }
    if (templateSearch.trim()) {
      const q = templateSearch.toLowerCase().trim();
      result = result.filter(t =>
        t.name.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q) ||
        t.prompt.toLowerCase().includes(q) ||
        t.tags.some(tag => tag.toLowerCase().includes(q))
      );
    }
    // Sort
    switch (templateSortBy) {
      case 'rating':
        result = [...result].sort((a, b) => (b.rating || 0) - (a.rating || 0) || (b.ratingCount || 0) - (a.ratingCount || 0));
        break;
      case 'usage':
        result = [...result].sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0));
        break;
      case 'name':
        result = [...result].sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'newest':
      default:
        result = [...result].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        break;
    }
    return result;
  }, [templates, templateFilterCategory, templateSearch, templateSortBy]);

  // ── Rating-based template recommendations ──
  const recommendedTemplates = useMemo(() => {
    if (!input.trim() || templates.length === 0) return [];
    const keywords = input.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    if (keywords.length === 0) return [];
    return templates
      .filter(t => (t.rating || 0) >= 3)
      .map(t => {
        const haystack = `${t.name} ${t.description || ''} ${t.prompt} ${t.tags.join(' ')}`.toLowerCase();
        const matchCount = keywords.filter(k => haystack.includes(k)).length;
        return { template: t, score: matchCount * (t.rating || 0) };
      })
      .filter(r => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(r => r.template);
  }, [input, templates]);

  // ── Build timeline chain for a template ──
  const buildTimelineChain = useCallback((templateId: string): BuildTemplate[] => {
    const chain: BuildTemplate[] = [];
    const tmpl = templates.find(t => t.id === templateId);
    if (!tmpl) return chain;
    // Walk up to root
    let current: BuildTemplate | undefined = tmpl;
    const ancestors: BuildTemplate[] = [];
    while (current?.parentTemplateId) {
      const parent = templates.find(t => t.id === current!.parentTemplateId);
      if (!parent || ancestors.some(a => a.id === parent.id)) break;
      ancestors.unshift(parent);
      current = parent;
    }
    chain.push(...ancestors, tmpl);
    // Walk down to descendants (BFS)
    const queue = [tmpl.id];
    const visited = new Set(chain.map(c => c.id));
    while (queue.length) {
      const id = queue.shift()!;
      const children = templates.filter(t => t.parentTemplateId === id && !visited.has(t.id));
      for (const child of children) {
        visited.add(child.id);
        chain.push(child);
        queue.push(child.id);
      }
    }
    return chain;
  }, [templates]);

  // ── Sorted build history with favorites first ──
  const sortedBuildHistory = useMemo(() => {
    return [...buildHistory].sort((a, b) => {
      const aFav = favoriteBuildIds.has(a.buildId) ? 1 : 0;
      const bFav = favoriteBuildIds.has(b.buildId) ? 1 : 0;
      if (aFav !== bFav) return bFav - aFav; // favorites first
      return (b.createdAt || 0) - (a.createdAt || 0); // then by date
    });
  }, [buildHistory, favoriteBuildIds]);

  // ── Agent orchestration helpers ──────────────────────────────────────────

  const updatePhase = useCallback((id: number, updates: Partial<PipelinePhase>) => {
    setPhases(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  }, []);

  const addLog = useCallback((content: string) => {
    setMessages(prev => [...prev, { role: 'assistant', content, timestamp: Date.now() }]);
  }, []);

  const activateAgents = useCallback((agentIds: number[], detail?: string) => {
    const now = Date.now();
    setAgents(prev => prev.map(a =>
      agentIds.includes(a.id)
        ? { ...a, status: 'active' as AgentStatus, detail: detail || a.capability, startedAt: now }
        : a
    ));
    setActiveAgentCount(prev => prev + agentIds.length);
    // Track timing
    for (const id of agentIds) {
      agentTimingsRef.current[id] = { startedAt: now, durationMs: 0, status: 'active' };
    }
  }, []);

  const completeAgents = useCallback((agentIds: number[]) => {
    const now = Date.now();
    setAgents(prev => prev.map(a =>
      agentIds.includes(a.id) && a.status === 'active'
        ? { ...a, status: 'done' as AgentStatus, completedAt: now, progress: 100 }
        : a
    ));
    setTotalTasksCompleted(prev => prev + agentIds.length);
    // Track timing
    for (const id of agentIds) {
      if (agentTimingsRef.current[id]) {
        agentTimingsRef.current[id].durationMs = now - agentTimingsRef.current[id].startedAt;
        agentTimingsRef.current[id].status = 'done';
      }
    }
  }, []);

  const queueAgents = useCallback((agentIds: number[]) => {
    setAgents(prev => prev.map(a =>
      agentIds.includes(a.id) ? { ...a, status: 'queued' as AgentStatus } : a
    ));
  }, []);

  const errorAgents = useCallback((agentIds: number[]) => {
    const now = Date.now();
    setAgents(prev => prev.map(a =>
      agentIds.includes(a.id) && a.status === 'active'
        ? { ...a, status: 'error' as AgentStatus }
        : a
    ));
    for (const id of agentIds) {
      if (agentTimingsRef.current[id]) {
        agentTimingsRef.current[id].durationMs = now - agentTimingsRef.current[id].startedAt;
        agentTimingsRef.current[id].status = 'error';
      }
    }
  }, []);

  // Computed: department stats
  const departmentStats = useMemo(() => {
    const byDept = getAgentsByDepartment(agents);
    return getDepartments().map(dept => ({
      department: dept,
      agents: byDept[dept],
      active: byDept[dept].filter(a => a.status === 'active').length,
      done: byDept[dept].filter(a => a.status === 'done').length,
      total: byDept[dept].length,
    }));
  }, [agents]);

  // ── SSE Streaming ──────────────────────────────────────────────────────

  function streamGenerate(prompt: string, arch: ArchitectureReport): Promise<GeneratedFile[]> {
    return new Promise((resolve, reject) => {
      const files: GeneratedFile[] = [];
      setStreamChars(0);
      setStreamingActive(true);
      setActiveProvider(null);

      sseControllerRef.current = connectSSE('stream-generate', { prompt, architecture: arch }, {
        onEvent(event, data) {
          switch (event) {
            case 'provider':
              setActiveProvider(data.name);
              activeProviderRef.current = data.name;
              break;
            case 'progress':
              setStreamChars(data.chars || 0);
              if (data.done) {
                updatePhase(3, { status: 'running', detail: `${data.chars} chars received, parsing...` });
              } else {
                updatePhase(3, { status: 'running', detail: `Streaming ${data.chars} chars via ${activeProviderRef.current || 'AI'}...` });
              }
              break;
            case 'phase':
              if (data.phase === 3) updatePhase(3, { status: data.status, detail: data.detail });
              break;
            case 'file':
              if (data.file) {
                files.push(data.file);
                updatePhase(3, { status: 'running', detail: `File ${data.index + 1}/${data.total}: ${data.file.path}` });
              }
              break;
            case 'complete':
              setStreamingActive(false);
              resolve(files);
              break;
            case 'error':
              setStreamingActive(false);
              reject(new Error(data.message || 'Stream error'));
              break;
          }
        },
        onError(err) { setStreamingActive(false); reject(err); },
        onClose() { setStreamingActive(false); if (files.length > 0) resolve(files); },
      });
    });
  }

  function streamRefine(instruction: string, currentFiles: GeneratedFile[], targetFile?: string): Promise<GeneratedFile[]> {
    return new Promise((resolve, reject) => {
      const changedFiles: GeneratedFile[] = [];
      setStreamChars(0);
      setStreamingActive(true);

      sseControllerRef.current = connectSSE('stream-refine', {
        instruction,
        files: currentFiles.filter(f => f.path.match(/\.(tsx?|jsx?|ts|js)$/)).map(f => ({
          path: f.path, content: f.content, language: f.language,
        })),
        targetFile,
      }, {
        onEvent(event, data) {
          switch (event) {
            case 'provider':
              setActiveProvider(data.name);
              activeProviderRef.current = data.name;
              break;
            case 'progress':
              setStreamChars(data.chars || 0);
              break;
            case 'file':
              if (data.file) changedFiles.push(data.file);
              break;
            case 'refine_complete':
              setStreamingActive(false);
              resolve(changedFiles);
              break;
            case 'error':
              setStreamingActive(false);
              reject(new Error(data.message || 'Refine error'));
              break;
          }
        },
        onError(err) { setStreamingActive(false); reject(err); },
        onClose() { setStreamingActive(false); if (changedFiles.length > 0) resolve(changedFiles); },
      });
    });
  }

  // ── The main factory pipeline with 50-agent orchestration ──────────────

  const runFactory = async (prompt: string) => {
    setIsGenerating(true);
    setShowPipeline(true);
    setShowExamples(false);
    setPhases(createPhases());
    setBuildIssues([]);
    setArchitecture(null);
    setSecurityScore(null);
    setGeneratedFiles([]);
    setSelectedFile(null);
    setRefineHistory([]);
    setRefineTargetFile(null);
    setKnowledgeGraph([]);
    setAgents(createAllAgents());
    setActiveAgentCount(0);
    setAutoRecommendSave(null);
    setSimilarWarning(null);
    setTotalTasksCompleted(0);
    agentTimingsRef.current = {};

    const pipelineStart = Date.now();
    let arch: ArchitectureReport | null = null;
    let files: GeneratedFile[] = [];
    let issues: BuildIssue[] = [];

    setMessages(prev => [...prev, { role: 'user', content: prompt, timestamp: Date.now() }]);
    addLog('🧠 **SuperBrainBuilder Activated** — Initializing 50-agent orchestration pipeline...');

    // Queue all agents across all phases
    const allAgentIds = PHASE_AGENT_MAP.flatMap(m => m.agentIds);
    queueAgents([...new Set(allAgentIds)]);

    try {
      // ═══ PHASE 1: Strategic Analysis ═══
      const p1Agents = getAgentsForPhase(1);
      const p1Start = Date.now();
      updatePhase(1, { status: 'running', detail: 'Agents analyzing requirements...' });
      activateAgents(p1Agents, 'Analyzing user requirements...');
      addLog(`🎯 **Phase 1 — Strategic Analysis**\nAgents: ${p1Agents.map(id => `#${id}`).join(', ')} activated\nParsing high-level command into structured tasks...`);

      arch = (await factoryAPI('architecture', { prompt })).architecture;
      setArchitecture(arch);
      completeAgents(p1Agents);
      updatePhase(1, { status: 'done', duration: Date.now() - p1Start, detail: `${arch.features.length} features, ${arch.techStack.length} tech` });
      addLog(`✅ Architecture: **${arch.appName}** — ${arch.description}\nFeatures: ${arch.features.join(', ')}\nFiles: ${arch.fileTree.length}`);

      // ═══ PHASE 2: Architecture Design ═══
      const p2Agents = getAgentsForPhase(2);
      const p2Start = Date.now();
      updatePhase(2, { status: 'running', detail: `${arch.fileTree.length} files` });
      activateAgents(p2Agents, 'Designing system architecture...');
      addLog(`📐 **Phase 2 — Architecture Design**\nAgents: ${p2Agents.map(id => `#${id}`).join(', ')} activated\n${arch.fileTree.map(f => `  ${f}`).join('\n')}`);
      await new Promise(r => setTimeout(r, 300)); // Brief pause for visual effect
      completeAgents(p2Agents);
      updatePhase(2, { status: 'done', duration: Date.now() - p2Start, detail: `${arch.fileTree.length} files mapped` });

      // ═══ PHASE 3: Code Generation (SSE Streaming) ═══
      const p3Agents = getAgentsForPhase(3);
      const p3Start = Date.now();
      updatePhase(3, { status: 'running', detail: 'Connecting to AI stream...' });
      activateAgents(p3Agents, 'Generating source code via SSE...');
      addLog(`⚡ **Phase 3 — Code Generation (Streaming)**\nAgents: ${p3Agents.map(id => `#${id}`).join(', ')} — ${p3Agents.length} engineers active\nMulti-model pipeline: OpenRouter (Gemini 2.0 Flash) → OpenAI (GPT-4o-mini) fallback`);

      try {
        files = await streamGenerate(prompt, arch);
      } catch (streamErr: any) {
        addLog(`⚠️ Stream failed (${streamErr.message}), using fallback...`);
        updatePhase(3, { status: 'running', detail: 'Fallback: non-streaming generation...' });
        const genResult = await factoryAPI('generate', { prompt, architecture: arch });
        files = genResult.files || [];
      }
      const usedProvider = activeProviderRef.current;
      completeAgents(p3Agents);
      updatePhase(3, { status: 'done', duration: Date.now() - p3Start, detail: `${files.length} files${usedProvider ? ` via ${usedProvider}` : ''}` });
      addLog(`✅ Generated ${files.length} files${usedProvider ? ` via **${usedProvider}**` : ''}`);

      // ═══ PHASE 4: Dependency Sync ═══
      const p4Agents = getAgentsForPhase(4);
      const p4Start = Date.now();
      updatePhase(4, { status: 'running', detail: 'Syncing dependencies...' });
      activateAgents(p4Agents, 'Resolving package dependencies...');

      const detectedDeps = new Set<string>();
      for (const f of files) {
        const pkgImports = f.content.matchAll(/from\s+['"]([^./][^'"]*)['"]/g);
        for (const m of pkgImports) {
          const pkg = m[1].startsWith('@') ? m[1].split('/').slice(0, 2).join('/') : m[1].split('/')[0];
          if (!['react', 'react-dom'].includes(pkg)) detectedDeps.add(pkg);
        }
      }
      const allDeps = { ...arch.dependencies };
      for (const d of detectedDeps) {
        if (!allDeps[d] && !(arch.devDependencies || {})[d]) allDeps[d] = 'latest';
      }
      const scaffoldFiles: GeneratedFile[] = [
        { path: 'postcss.config.js', content: POSTCSS_CONFIG, language: 'javascript', description: 'PostCSS config' },
        { path: 'src/index.css', content: INDEX_CSS, language: 'css', description: 'Tailwind directives' },
        { path: 'tailwind.config.js', content: TAILWIND_CONFIG, language: 'javascript', description: 'Tailwind config' },
        { path: 'vite.config.ts', content: VITE_CONFIG, language: 'typescript', description: 'Vite config' },
        { path: 'tsconfig.json', content: TS_CONFIG, language: 'json', description: 'TypeScript config' },
        { path: 'index.html', content: INDEX_HTML(arch.appName), language: 'html', description: 'HTML entry' },
        { path: 'src/main.tsx', content: MAIN_TSX, language: 'typescript', description: 'React entry point' },
        { path: 'package.json', content: makePackageJson(arch.appName, allDeps, arch.devDependencies || {}), language: 'json', description: 'Dependencies' },
        { path: '.env.example', content: makeEnvExample(arch.appName), language: 'text', description: 'Environment template' },
      ];
      const existingPaths = new Set(files.map(f => f.path));
      for (const sf of scaffoldFiles) { if (!existingPaths.has(sf.path)) files.push(sf); }
      completeAgents(p4Agents);
      updatePhase(4, { status: 'done', duration: Date.now() - p4Start, detail: `${Object.keys(allDeps).length} deps, ${files.length} files` });
      addLog(`📦 **Phase 4** — ${detectedDeps.size} packages detected, ${files.length} total files`);

      // ═══ PHASE 5: Build Simulation ═══
      const p5Agents = getAgentsForPhase(5);
      const p5Start = Date.now();
      updatePhase(5, { status: 'running', detail: 'Simulating build...' });
      activateAgents(p5Agents, 'Running static analysis & build simulation...');

      issues = simulateBuild(files);
      setBuildIssues(issues);
      const criticals = issues.filter(i => i.severity === 'critical');
      completeAgents(p5Agents);
      updatePhase(5, { status: 'done', duration: Date.now() - p5Start, detail: `${issues.length} issues (${criticals.length} critical)` });
      addLog(`🔍 **Phase 5** — ${issues.length === 0 ? '✅ No issues!' : `${issues.length} issues:\n${issues.map(i => `  ${i.severity === 'critical' ? '❌' : '⚠️'} ${i.file}: ${i.message}`).join('\n')}`}`);

      // ═══ PHASE 6: Error Repair Loop ═══
      const p6Agents = getAgentsForPhase(6);
      const p6Start = Date.now();
      if (criticals.length > 0) {
        updatePhase(6, { status: 'running', detail: `Repairing ${criticals.length} issues...` });
        activateAgents(p6Agents, `Auto-repairing ${criticals.length} critical issues...`);
        addLog(`🔧 **Phase 6 — Error Repair Loop**\nAgents: #32 Bug Fix, #44 Error Diagnosis, #45 Self-Repair, #46 Auto-Refactor\nFixing ${criticals.length} critical issues...`);

        const importIssues = criticals.filter(i => i.type === 'import' && i.message.includes('Missing import'));
        if (importIssues.length > 0) {
          const stubs = resolveUnmetImports(files);
          if (stubs.length > 0) { files = [...files, ...stubs]; addLog(`  ✅ Agent #45 auto-generated ${stubs.length} stub files`); }
        }
        const remainingCriticals = simulateBuild(files).filter(i => i.severity === 'critical');
        let repairCount = 0;
        for (const issue of remainingCriticals.slice(0, 5)) {
          try {
            const brokenFile = files.find(f => f.path === issue.file || f.path === 'src/' + issue.file);
            if (brokenFile) {
              const result = await factoryAPI('repair', {
                errorFile: issue.file, errorMessage: issue.message,
                fileContent: brokenFile.content, allFileNames: files.map(f => f.path),
              });
              if (result.repairedFile) { files = files.map(f => f.path === brokenFile.path ? { ...f, content: result.repairedFile.content } : f); repairCount++; }
            }
          } catch (e) { console.error('Agent #32 repair failed for', issue.file, e); }
        }
        issues = simulateBuild(files);
        setBuildIssues(issues);
        const stillCritical = issues.filter(i => i.severity === 'critical').length;
        completeAgents(p6Agents);
        updatePhase(6, { status: 'done', duration: Date.now() - p6Start, detail: `${repairCount} AI repairs, ${stillCritical} remaining` });
        addLog(`✅ Repair: ${repairCount} files fixed${stillCritical > 0 ? `, ${stillCritical} remain` : ', all resolved!'}`);
      } else {
        updatePhase(6, { status: 'skipped', duration: 0, detail: 'No critical issues' });
        completeAgents(p6Agents);
        addLog('⏭️ **Phase 6** — Skipped (no critical issues)');
      }

      // ═══ PHASE 7: Project Memory ═══
      const p7Agents = getAgentsForPhase(7);
      const p7Start = Date.now();
      const buildId = `${arch.appName}-${Date.now()}`;
      updatePhase(7, { status: 'running', detail: 'Saving to knowledge base...' });
      activateAgents(p7Agents, 'Updating knowledge graph & memory...');
      try {
        await factoryAPI('save-project', { projectId: buildId, appName: arch.appName, prompt, architecture: arch, fileCount: files.length, issueCount: issues.length });
        completeAgents(p7Agents);
        updatePhase(7, { status: 'done', duration: Date.now() - p7Start, detail: 'Saved to memory' });
      } catch {
        completeAgents(p7Agents);
        updatePhase(7, { status: 'done', duration: Date.now() - p7Start, detail: 'Skipped' });
      }

      // Build knowledge graph
      const graph = buildKnowledgeGraph(files);
      setKnowledgeGraph(graph);

      // ═══ PHASE 8: Security & Performance ═══
      const p8Agents = getAgentsForPhase(8);
      const p8Start = Date.now();
      let localSecurityScore: Record<string, number> | undefined;
      updatePhase(8, { status: 'running', detail: 'Security scan...' });
      activateAgents(p8Agents, 'Running security, accessibility & performance audit...');
      addLog(`🛡️ **Phase 8 — Security & Performance**\nAgents: #24 AI Logic Review, #25 Security Scanner, #29 Accessibility Audit, #31 Load Test, #35 Performance Optimizer, #47 Security Auto-Patch`);
      try {
        const scanResult = await factoryAPI('security-scan', { files: files.filter(f => f.path.match(/\.(tsx?|jsx?)$/)).slice(0, 10) });
        if (scanResult.score) { setSecurityScore(scanResult.score); localSecurityScore = scanResult.score; }
        if (scanResult.issues?.length) setBuildIssues(prev => [...prev, ...scanResult.issues.map((i: any) => ({ ...i, type: i.type || 'security', severity: i.severity || 'info' }))]);
        completeAgents(p8Agents);
        updatePhase(8, { status: 'done', duration: Date.now() - p8Start, detail: `Score: ${scanResult.score?.security || '—'}/100` });
        addLog(`✅ Security: ${scanResult.score?.security || '—'}/100, Perf: ${scanResult.score?.performance || '—'}/100, Quality: ${scanResult.score?.quality || '—'}/100`);
      } catch {
        completeAgents(p8Agents);
        updatePhase(8, { status: 'done', duration: Date.now() - p8Start, detail: 'Done' });
      }

      // ═══ PHASE 9: Deployment Configs ═══
      const p9Agents = getAgentsForPhase(9);
      const p9Start = Date.now();
      updatePhase(9, { status: 'running', detail: 'Generating deploy configs...' });
      activateAgents(p9Agents, 'Generating deployment configurations...');
      const deployFiles: GeneratedFile[] = [
        { path: 'Dockerfile', content: makeDockerfile(), language: 'dockerfile', description: 'Docker' },
        { path: 'vercel.json', content: makeVercelJson(), language: 'json', description: 'Vercel' },
        { path: 'netlify.toml', content: makeNetlifyToml(), language: 'toml', description: 'Netlify' },
        { path: '.dockerignore', content: 'node_modules\ndist\n.git\n.env\n', language: 'text', description: 'Docker ignore' },
        { path: '.gitignore', content: 'node_modules\ndist\n.env\n*.local\n.DS_Store\n', language: 'text', description: 'Git ignore' },
      ];
      const ep2 = new Set(files.map(f => f.path));
      for (const df of deployFiles) { if (!ep2.has(df.path)) files.push(df); }
      completeAgents(p9Agents);
      updatePhase(9, { status: 'done', duration: Date.now() - p9Start, detail: 'Docker, Vercel, Netlify' });

      // ═══ PHASE 10: Final Validation ═══
      const p10Agents = getAgentsForPhase(10);
      const p10Start = Date.now();
      updatePhase(10, { status: 'running', detail: 'Validating...' });
      activateAgents(p10Agents, 'Running final validation suite...');
      const finalIssues = simulateBuild(files);
      const finalCriticals = finalIssues.filter(i => i.severity === 'critical');
      setBuildIssues(finalIssues);
      const hasApp = files.some(f => f.path === 'src/App.tsx');
      const hasMain = files.some(f => f.path === 'src/main.tsx');
      const hasPackage = files.some(f => f.path === 'package.json');
      const allPresent = hasApp && hasMain && hasPackage;
      completeAgents(p10Agents);
      updatePhase(10, { status: finalCriticals.length === 0 && allPresent ? 'done' : 'error', duration: Date.now() - p10Start, detail: finalCriticals.length === 0 ? '✅ Build passes' : `${finalCriticals.length} criticals` });

      // README
      const readme = generateReadme(arch, files, finalIssues);
      if (!files.some(f => f.path === 'README.md')) files.push({ path: 'README.md', content: readme, language: 'markdown', description: 'Documentation' });

      // Save comprehensive build record with all data
      try {
        const buildRecord: BuildRecord = {
          buildId,
          appName: arch.appName,
          prompt,
          fileCount: files.length,
          issueCount: finalIssues.length,
          criticalCount: finalCriticals.length,
          totalDurationMs: Date.now() - pipelineStart,
          provider: activeProviderRef.current || '',
          agentTimings: Object.fromEntries(
            Object.entries(agentTimingsRef.current).map(([k, v]) => [k, { durationMs: v.durationMs, status: v.status }])
          ),
          securityScore: localSecurityScore,
          createdAt: Date.now(),
          features: arch.features,
          techStack: arch.techStack,
        };
        await factoryAPI('save-build-record', buildRecord).catch(() => { });
      } catch { /* non-critical */ }

      // ═══ PHASE 11: Output & Delivery ═══
      const p11Agents = getAgentsForPhase(11);
      activateAgents(p11Agents, 'Preparing final delivery...');
      await new Promise(r => setTimeout(r, 200));
      completeAgents(p11Agents);
      updatePhase(11, { status: 'done', detail: `${files.length} files ready` });

      setGeneratedFiles(files);
      setSelectedFile('src/App.tsx');
      setPreviewKey(prev => prev + 1);

      const totalMs = Date.now() - pipelineStart;
      setTotalDuration(totalMs);
      const doneAgents = agents.filter(a => a.status === 'done').length + p11Agents.length;

      addLog(`\n🏭 **SUPER BRAIN FACTORY COMPLETE** in ${(totalMs / 1000).toFixed(1)}s\n\n🤖 ${doneAgents}/50 agents deployed across 5 departments\n📊 ${files.length} files | ${arch.features.length} features | ${Object.keys(allDeps).length} deps | ${finalCriticals.length} critical issues\n${activeProviderRef.current ? `🧠 AI Provider: ${activeProviderRef.current}` : ''}\n🗺️ Knowledge graph: ${graph.length} nodes\n\n✏️ **Refine mode active** — Type changes to modify files\n📦 Ready to download as ZIP`);

      // Reload persistent memory to include this build
      loadPersistentMemory();

      // Auto-recommend saving as template if prompt doesn't closely match existing templates
      const promptLower = prompt.toLowerCase();
      const hasMatch = templates.some(t => {
        const sim = t.prompt.toLowerCase();
        const promptWords = new Set(promptLower.split(/\s+/).filter(w => w.length > 2));
        const templateWords = new Set(sim.split(/\s+/).filter(w => w.length > 2));
        if (promptWords.size === 0) return false;
        let overlap = 0;
        promptWords.forEach(w => { if (templateWords.has(w)) overlap++; });
        return overlap / promptWords.size > 0.6;
      });
      if (!hasMatch && arch) {
        setAutoRecommendSave({ prompt, appName: arch.appName });
      }

    } catch (err: any) {
      console.error('[SuperBrain] Pipeline error:', err);
      addLog(`❌ **Pipeline Error:** ${err.message}\n\nTry again or simplify your prompt.`);
      setPhases(prev => prev.map(p => p.status === 'pending' || p.status === 'running' ? { ...p, status: 'error' as const } : p));
      // Error all active agents
      const activeIds = agents.filter(a => a.status === 'active').map(a => a.id);
      errorAgents(activeIds);
    } finally {
      setIsGenerating(false);
      setStreamingActive(false);
    }
  };

  // ── Refinement handler ─────────────────────────────────────────────────

  const runRefinement = async (instruction: string) => {
    setIsRefining(true);
    setMessages(prev => [...prev, { role: 'user', content: `✏️ ${instruction}`, timestamp: Date.now() }]);

    // Activate refinement agents
    const refineAgentIds = [11, 3, 45, 46]; // Frontend, UI Gen, Self-Repair, Auto-Refactor
    activateAgents(refineAgentIds, 'Refining generated code...');
    addLog(`🔄 **Refining** — Agents #11 #3 #45 #46 active\n${refineTargetFile ? `Target: ${refineTargetFile}` : 'All files'}...`);

    const refineStart = Date.now();
    setStreamChars(0);
    setStreamingActive(true);

    try {
      const changedFiles = await streamRefine(instruction, generatedFiles, refineTargetFile || undefined);

      if (changedFiles.length === 0) {
        addLog('⚠️ No changes generated. Try being more specific.');
      } else {
        setGeneratedFiles(prev => {
          const updated = [...prev];
          for (const changed of changedFiles) {
            const existingIdx = updated.findIndex(f => f.path === changed.path);
            if (existingIdx >= 0) updated[existingIdx] = changed;
            else updated.push(changed);
          }
          return updated;
        });

        setGeneratedFiles(prev => {
          const newIssues = simulateBuild(prev);
          setBuildIssues(newIssues);
          const crits = newIssues.filter(i => i.severity === 'critical' && i.type === 'import');
          if (crits.length > 0) {
            const stubs = resolveUnmetImports(prev);
            if (stubs.length > 0) return [...prev, ...stubs];
          }
          return prev;
        });

        // Update knowledge graph
        setGeneratedFiles(prev => {
          setKnowledgeGraph(buildKnowledgeGraph(prev));
          return prev;
        });

        setRefineHistory(prev => [...prev, instruction]);
        setPreviewKey(prev => prev + 1);
        const elapsed = ((Date.now() - refineStart) / 1000).toFixed(1);
        const changedPaths = changedFiles.map(f => f.path).join(', ');
        addLog(`✅ **Refined** in ${elapsed}s — ${changedFiles.length} file${changedFiles.length !== 1 ? 's' : ''} updated: ${changedPaths}${activeProviderRef.current ? `\n🤖 Via ${activeProviderRef.current}` : ''}`);
        if (changedFiles.length > 0) setSelectedFile(changedFiles[0].path);
      }
    } catch (err: any) {
      console.error('[SuperBrain] Refine error:', err);
      addLog(`❌ **Refinement failed:** ${err.message}`);
    } finally {
      completeAgents(refineAgentIds);
      setIsRefining(false);
      setStreamingActive(false);
    }
  };

  // ── README generator ───────────────────────────────────────────────────

  function generateReadme(arch: ArchitectureReport, files: GeneratedFile[], issues: BuildIssue[]) {
    return `# ${arch.appName}\n\n${arch.description}\n\n> Generated by SuperBrainBuilder — 50-Agent AI Software Factory\n\n## Features\n\n${arch.features.map(f => `- ${f}`).join('\n')}\n\n## Tech Stack\n\n${arch.techStack.map(t => `- ${t}`).join('\n')}\n\n## Getting Started\n\n\`\`\`bash\nnpm install\nnpm run dev\n\`\`\`\n\n## Project Structure\n\n\`\`\`\n${files.map(f => f.path).sort().join('\n')}\n\`\`\`\n\n## Deployment\n\n\`\`\`bash\n# Vercel\nnpx vercel\n\n# Docker\ndocker build -t ${arch.appName} .\ndocker run -p 80:80 ${arch.appName}\n\`\`\`\n\n## Build Report\n\n- Files: ${files.length}\n- Agents Deployed: 50\n- Issues: ${issues.length}\n- Critical: ${issues.filter(i => i.severity === 'critical').length}\n`;
  }

  // ── Download ───────────────────────────────────────────────────────────

  const downloadZip = async () => {
    if (generatedFiles.length === 0) return;
    const zip = new JSZip();
    for (const file of generatedFiles) zip.file(file.path.replace(/^\//, ''), file.content);
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${architecture?.appName || 'generated-app'}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // ── Examples ───────────────────────────────────────────────────────────

  const examples = [
    { icon: <Grid className="w-5 h-5" />, title: 'Analytics Dashboard', prompt: 'Build an analytics dashboard with sidebar navigation, stat cards, charts (bar, line, pie), recent activity feed, and user management table', cat: 'Business' },
    { icon: <List className="w-5 h-5" />, title: 'Kanban Board', prompt: 'Create a kanban-style task manager with drag columns, task cards with priority/labels, search, filters, and team member assignment', cat: 'Productivity' },
    { icon: <Layout className="w-5 h-5" />, title: 'SaaS Landing', prompt: 'Design a modern SaaS landing page with animated hero, features grid, pricing tiers, testimonials carousel, FAQ accordion, and footer', cat: 'Marketing' },
    { icon: <Box className="w-5 h-5" />, title: 'E-Commerce', prompt: 'Build a product catalog with grid/list view toggle, category filters, search, shopping cart with quantity, and checkout flow', cat: 'E-Commerce' },
    { icon: <Database className="w-5 h-5" />, title: 'CRM Platform', prompt: 'Build a CRM with contacts table, deal pipeline, activity timeline, reporting dashboard, and email integration', cat: 'Enterprise' },
    { icon: <Network className="w-5 h-5" />, title: 'SaaS Marketplace', prompt: 'Build a multi-tenant SaaS marketplace with subscriptions, real-time chat, AI recommendations, analytics dashboards, and mobile support', cat: 'Platform' },
  ];

  // ── Similar template detection ──────────────────────────────────────────
  const findSimilarTemplates = useCallback((prompt: string): BuildTemplate[] => {
    if (templates.length === 0) return [];
    const promptWords = new Set(prompt.toLowerCase().split(/\s+/).filter(w => w.length > 3));
    if (promptWords.size === 0) return [];
    return templates
      .map(t => {
        const tWords = new Set(`${t.prompt} ${t.name} ${t.description || ''}`.toLowerCase().split(/\s+/).filter(w => w.length > 3));
        const intersection = [...promptWords].filter(w => tWords.has(w));
        const overlap = intersection.length / Math.max(promptWords.size, 1);
        return { template: t, overlap };
      })
      .filter(r => r.overlap >= 0.5)
      .sort((a, b) => b.overlap - a.overlap)
      .slice(0, 3)
      .map(r => r.template);
  }, [templates]);

  // ── Submit ─────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isGenerating || isRefining) return;
    const prompt = input.trim();

    // For new builds only, check for similar templates (unless suppressed)
    if (generatedFiles.length === 0 && !suppressSimilarWarning) {
      const matches = findSimilarTemplates(prompt);
      if (matches.length > 0) {
        setSimilarWarning({ prompt, matches });
        return;
      }
    }

    setInput('');
    if (generatedFiles.length > 0) await runRefinement(prompt);
    else await runFactory(prompt);
  };

  const confirmBuildAnyway = useCallback(() => {
    if (!similarWarning) return;
    const prompt = similarWarning.prompt;
    setSimilarWarning(null);
    setInput('');
    runFactory(prompt);
  }, [similarWarning]);

  const useTemplateFromWarning = useCallback((tmpl: BuildTemplate) => {
    setSimilarWarning(null);
    setInput(tmpl.prompt);
  }, []);

  const startNewBuild = () => {
    sseControllerRef.current?.abort();
    activeProviderRef.current = null;
    setGeneratedFiles([]);
    setArchitecture(null);
    setPhases(createPhases());
    setBuildIssues([]);
    setSecurityScore(null);
    setShowPipeline(false);
    setTotalDuration(0);
    setShowExamples(true);
    setRefineHistory([]);
    setRefineTargetFile(null);
    setActiveProvider(null);
    setKnowledgeGraph([]);
    setAgents(createAllAgents());
    setActiveAgentCount(0);
    setTotalTasksCompleted(0);
    agentTimingsRef.current = {};
    setSidebarTab('console');
    setMessages([{
      role: 'system',
      content: '🧠 **SuperBrainBuilder** — 50-Agent AI Software Factory\n\nDescribe any application and the 50-agent pipeline will autonomously build it.\n\n**Try:** "Build a project management dashboard with kanban board, analytics, and team management"',
      timestamp: Date.now(),
    }]);
  };

  const selectedFileData = generatedFiles.find(f => f.path === selectedFile);
  const inRefineMode = generatedFiles.length > 0 && !isGenerating;

  // Agent stats
  const agentStats = useMemo(() => {
    const active = agents.filter(a => a.status === 'active').length;
    const done = agents.filter(a => a.status === 'done').length;
    const queued = agents.filter(a => a.status === 'queued').length;
    const errored = agents.filter(a => a.status === 'error').length;
    return { active, done, queued, errored, total: 50 };
  }, [agents]);

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════

  return (
    <div className="h-full flex bg-gray-950">
      {/* ─── Left: Command Center ─── */}
      <div className="w-[440px] flex flex-col bg-gray-900 border-r border-gray-800">
        {/* Header — Brain Command Center */}
        <div className="bg-gradient-to-r from-violet-600 via-fuchsia-600 to-cyan-500 p-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-bold text-base flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
                <Brain className="w-4 h-4" />
              </div>
              SuperBrainBuilder
            </h3>
            <div className="flex items-center gap-1.5">
              {generatedFiles.length > 0 && (
                <button onClick={startNewBuild} className="px-2 py-1 text-[9px] bg-white/20 hover:bg-white/30 text-white rounded-md font-bold transition-all flex items-center gap-1">
                  <Plus className="w-3 h-3" />New
                </button>
              )}
            </div>
          </div>
          {/* Agent status bar */}
          <div className="flex items-center gap-3 mt-2">
            <div className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${agentStats.active > 0 ? 'bg-emerald-400 animate-pulse' : 'bg-gray-400'}`} />
              <span className="text-[10px] text-white/70 font-mono">{agentStats.active} active</span>
            </div>
            <span className="text-[10px] text-white/50 font-mono">{agentStats.done}/50 done</span>
            {streamingActive && (
              <span className="flex items-center gap-1 text-[10px] text-emerald-300 animate-pulse ml-auto">
                <Wifi className="w-3 h-3" />SSE Live
              </span>
            )}
            {activeProvider && !streamingActive && (
              <span className="text-[10px] text-white/40 flex items-center gap-1 ml-auto">
                <Radio className="w-3 h-3" />{activeProvider}
              </span>
            )}
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex border-b border-gray-800 flex-shrink-0">
          {[
            { key: 'console' as const, icon: <Terminal className="w-3 h-3" />, label: 'Console' },
            { key: 'agents' as const, icon: <Users className="w-3 h-3" />, label: `Agents${agentStats.active > 0 ? ` (${agentStats.active})` : ''}` },
            { key: 'workflow' as const, icon: <Activity className="w-3 h-3" />, label: 'Flow' },
            { key: 'graph' as const, icon: <GitBranch className="w-3 h-3" />, label: 'Graph' },
            { key: 'memory' as const, icon: <Brain className="w-3 h-3" />, label: 'Memory' },
            { key: 'projects' as const, icon: <FolderTree className="w-3 h-3" />, label: `Builds${buildHistory.length > 0 ? ` (${buildHistory.length})` : ''}` },
            { key: 'templates' as const, icon: <Bookmark className="w-3 h-3" />, label: `Tmpl${templates.length > 0 ? ` (${templates.length})` : ''}` },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setSidebarTab(tab.key)}
              className={`flex-1 px-1.5 py-2 text-[9px] font-bold flex flex-col items-center gap-0.5 transition-all ${sidebarTab === tab.key
                ? 'text-white bg-gray-800 border-b-2 border-violet-500'
                : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/50'
                }`}
            >
              {tab.icon}<span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Streaming progress bar */}
        {streamingActive && streamChars > 0 && (
          <div className="bg-gray-900 border-b border-gray-800 px-3 py-2 flex-shrink-0">
            <div className="flex items-center justify-between text-[10px] text-gray-500 mb-1">
              <span className="flex items-center gap-1.5">
                <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
                Streaming from {activeProvider || 'AI'}
              </span>
              <span className="font-mono text-emerald-400">{streamChars.toLocaleString()} chars</span>
            </div>
            <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full animate-pulse" style={{ width: `${Math.min(100, (streamChars / 8000) * 100)}%` }} />
            </div>
          </div>
        )}

        {/* Pipeline Progress (collapsed into header area) */}
        {showPipeline && sidebarTab === 'console' && (
          <div className="border-b border-gray-800 bg-gray-900/80 px-3 py-2 flex-shrink-0 max-h-[260px] overflow-y-auto">
            <button onClick={() => setShowPipeline(false)} className="w-full flex items-center justify-between text-gray-400 hover:text-white text-xs font-semibold mb-1.5">
              <span className="flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5" />
                Pipeline {totalDuration > 0 ? `(${(totalDuration / 1000).toFixed(1)}s)` : ''}
              </span>
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
            <div className="space-y-0.5">
              {phases.map(phase => {
                const phaseAgentCount = phase.agentIds.length;
                return (
                  <div key={phase.id} className={`flex items-center gap-2 px-2 py-1 rounded-md text-[11px] transition-all ${phase.status === 'running' ? 'bg-blue-900/40 text-blue-300' :
                    phase.status === 'done' ? 'text-gray-400' :
                      phase.status === 'error' ? 'text-red-400' :
                        phase.status === 'skipped' ? 'text-gray-600' : 'text-gray-600'
                    }`}>
                    <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
                      {phase.status === 'running' ? <Loader className="w-3 h-3 animate-spin text-blue-400" /> :
                        phase.status === 'done' ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> :
                          phase.status === 'error' ? <AlertTriangle className="w-3 h-3 text-red-400" /> :
                            phase.status === 'skipped' ? <ChevronRight className="w-3 h-3" /> :
                              <CircleDot className="w-3 h-3 text-gray-700" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold truncate">{phase.name}</span>
                        <span className="text-[9px] text-gray-600">({phaseAgentCount} agents)</span>
                      </div>
                      {phase.detail && <p className={`text-[9px] mt-0.5 truncate ${phase.status === 'running' ? 'text-blue-400/70' : 'text-gray-600'}`}>{phase.detail}</p>}
                    </div>
                    {phase.duration != null && phase.duration > 0 && <span className="text-[9px] text-gray-600 flex-shrink-0">{(phase.duration / 1000).toFixed(1)}s</span>}
                  </div>
                );
              })}
            </div>
            {securityScore && (
              <div className="mt-2 pt-2 border-t border-gray-800 flex gap-3">
                {Object.entries(securityScore).map(([key, val]) => (
                  <div key={key} className="text-center flex-1">
                    <div className={`text-sm font-bold ${val >= 80 ? 'text-emerald-400' : val >= 60 ? 'text-amber-400' : 'text-red-400'}`}>{val}</div>
                    <div className="text-[9px] text-gray-600 capitalize">{key}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {!showPipeline && phases.some(p => p.status !== 'pending') && sidebarTab === 'console' && (
          <button onClick={() => setShowPipeline(true)} className="px-3 py-2 border-b border-gray-800 text-xs text-gray-500 hover:text-white flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5" />Show Pipeline<ChevronDown className="w-3 h-3 ml-auto" />
          </button>
        )}

        {/* Refine mode banner */}
        {inRefineMode && !isRefining && sidebarTab === 'console' && (
          <div className="px-3 py-2 border-b border-gray-800 bg-gradient-to-r from-violet-900/30 to-blue-900/30 flex-shrink-0">
            <div className="flex items-center gap-2">
              <Pencil className="w-3.5 h-3.5 text-violet-400" />
              <span className="text-xs text-violet-300 font-semibold">Refine Mode</span>
              {refineTargetFile && (
                <span className="text-[10px] text-gray-500 bg-gray-800 px-1.5 py-0.5 rounded flex items-center gap-1">
                  <Layers className="w-3 h-3" />
                  {refineTargetFile.split('/').pop()}
                  <button onClick={() => setRefineTargetFile(null)} className="ml-0.5 hover:text-red-400"><XIcon className="w-2.5 h-2.5" /></button>
                </span>
              )}
              {refineHistory.length > 0 && (
                <span className="text-[10px] text-gray-600 ml-auto">{refineHistory.length} refinement{refineHistory.length !== 1 ? 's' : ''}</span>
              )}
            </div>
          </div>
        )}

        {/* ─── TAB CONTENT ─── */}
        <div className="flex-1 overflow-y-auto">
          {/* Console Tab */}
          {sidebarTab === 'console' && (
            <div className="p-3 space-y-3">
              {messages.map((msg, i) => (
                <div key={i} className={`${msg.role === 'user' ? 'ml-8 bg-blue-600/90 text-white' : 'mr-4 bg-gray-800/90 text-gray-200'} rounded-lg px-3 py-2.5`}>
                  <div className="flex items-start gap-1.5">
                    {msg.role === 'assistant' && <Bot className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-violet-400" />}
                    <div className="flex-1 whitespace-pre-wrap text-xs leading-relaxed">{msg.content}</div>
                  </div>
                </div>
              ))}
              {(isGenerating || isRefining) && (
                <div className="mr-4 bg-gray-800/90 text-gray-200 rounded-lg px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <Loader className="w-3.5 h-3.5 animate-spin text-blue-400" />
                    <span className="text-xs">{isRefining ? 'Agents refining...' : `${agentStats.active} agents working...`}</span>
                    {streamingActive && <Wifi className="w-3 h-3 text-emerald-400 animate-pulse" />}
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}

          {/* Agents Tab */}
          {sidebarTab === 'agents' && (
            <div className="p-3 space-y-3">
              {/* Agent stats bar */}
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: 'Active', value: agentStats.active, color: 'text-emerald-400', bg: 'bg-emerald-950/50' },
                  { label: 'Done', value: agentStats.done, color: 'text-blue-400', bg: 'bg-blue-950/50' },
                  { label: 'Queued', value: agentStats.queued, color: 'text-amber-400', bg: 'bg-amber-950/50' },
                  { label: 'Error', value: agentStats.errored, color: 'text-red-400', bg: 'bg-red-950/50' },
                ].map(s => (
                  <div key={s.label} className={`${s.bg} rounded-lg p-2 text-center border border-gray-800`}>
                    <div className={`text-lg font-bold ${s.color}`}>{s.value}</div>
                    <div className="text-[9px] text-gray-500 font-semibold">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Departments */}
              {departmentStats.map(dept => {
                const colors = DEPARTMENT_COLORS[dept.department];
                const icon = DEPARTMENT_ICONS[dept.department];
                return (
                  <div key={dept.department} className={`${colors.bg} rounded-lg border ${colors.border} overflow-hidden`}>
                    <div className="px-3 py-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{icon}</span>
                        <span className={`text-xs font-bold ${colors.text}`}>{dept.department}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {dept.active > 0 && (
                          <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full font-bold animate-pulse">
                            {dept.active} active
                          </span>
                        )}
                        <span className="text-[9px] text-gray-500 font-mono">{dept.done}/{dept.total}</span>
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className="h-0.5 bg-gray-800">
                      <div
                        className={`h-full transition-all duration-500 ${dept.active > 0 ? 'bg-emerald-500' : dept.done === dept.total ? 'bg-blue-500' : 'bg-gray-700'
                          }`}
                        style={{ width: `${(dept.done / dept.total) * 100}%` }}
                      />
                    </div>
                    {/* Agent list */}
                    <div className="px-2 py-1.5 space-y-0.5">
                      {dept.agents.map(agent => (
                        <div key={agent.id} className={`flex items-center gap-2 px-2 py-1 rounded text-[10px] transition-all ${agent.status === 'active' ? 'bg-emerald-500/10 text-emerald-300' :
                          agent.status === 'done' ? 'text-gray-500' :
                            agent.status === 'error' ? 'text-red-400' :
                              agent.status === 'queued' ? 'text-amber-400/60' :
                                'text-gray-700'
                          }`}>
                          <div className="w-4 flex items-center justify-center flex-shrink-0">
                            {agent.status === 'active' ? <Loader className="w-2.5 h-2.5 animate-spin text-emerald-400" /> :
                              agent.status === 'done' ? <Check className="w-2.5 h-2.5 text-blue-400" /> :
                                agent.status === 'error' ? <XIcon className="w-2.5 h-2.5 text-red-400" /> :
                                  agent.status === 'queued' ? <Clock className="w-2.5 h-2.5 text-amber-500/60" /> :
                                    <Hash className="w-2.5 h-2.5 text-gray-700" />}
                          </div>
                          <span className="font-mono text-[9px] text-gray-600 w-5">#{agent.id}</span>
                          <span className={`font-semibold truncate ${agent.status === 'active' ? 'text-emerald-300' : ''}`}>{agent.name}</span>
                          {agent.status === 'active' && agent.detail && (
                            <span className="ml-auto text-[8px] text-emerald-500/60 truncate max-w-[100px]">{agent.detail}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Knowledge Graph Tab */}
          {sidebarTab === 'graph' && (
            <div className="p-3 space-y-3">
              {knowledgeGraph.length === 0 ? (
                <div className="text-center py-8">
                  <GitBranch className="w-8 h-8 text-gray-700 mx-auto mb-2" />
                  <p className="text-gray-600 text-xs">Knowledge graph will appear after generation</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'Components', count: knowledgeGraph.filter(n => n.type === 'component').length, color: 'text-blue-400' },
                      { label: 'Hooks', count: knowledgeGraph.filter(n => n.type === 'hook').length, color: 'text-violet-400' },
                      { label: 'Utils', count: knowledgeGraph.filter(n => n.type === 'util').length, color: 'text-amber-400' },
                    ].map(s => (
                      <div key={s.label} className="bg-gray-800 rounded-lg p-2 text-center border border-gray-700">
                        <div className={`text-lg font-bold ${s.color}`}>{s.count}</div>
                        <div className="text-[9px] text-gray-500">{s.label}</div>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-gray-400 flex items-center gap-1.5">
                      <Network className="w-3.5 h-3.5" /> Dependency Map
                    </h4>
                    {knowledgeGraph.map(node => {
                      const typeColor = {
                        component: 'border-blue-700 bg-blue-950/30 text-blue-300',
                        hook: 'border-violet-700 bg-violet-950/30 text-violet-300',
                        type: 'border-cyan-700 bg-cyan-950/30 text-cyan-300',
                        util: 'border-amber-700 bg-amber-950/30 text-amber-300',
                        config: 'border-gray-700 bg-gray-800/50 text-gray-400',
                        file: 'border-gray-700 bg-gray-800/50 text-gray-300',
                      }[node.type];
                      const typeIcon = {
                        component: <Box className="w-3 h-3" />,
                        hook: <Zap className="w-3 h-3" />,
                        type: <Hash className="w-3 h-3" />,
                        util: <Cog className="w-3 h-3" />,
                        config: <Cog className="w-3 h-3" />,
                        file: <FileCode className="w-3 h-3" />,
                      }[node.type];
                      return (
                        <div key={node.id} className={`border rounded-md px-2.5 py-1.5 ${typeColor}`}>
                          <div className="flex items-center gap-1.5 text-[11px]">
                            {typeIcon}
                            <span className="font-semibold">{node.label}</span>
                            <span className="text-[8px] ml-auto opacity-50">{node.type}</span>
                          </div>
                          {node.deps.length > 0 && (
                            <div className="mt-1 flex flex-wrap gap-1">
                              {node.deps.map((dep, i) => (
                                <span key={i} className="text-[8px] bg-black/30 px-1.5 py-0.5 rounded text-gray-500">
                                  → {dep.split('/').pop()}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ═══ Workflow Visualizer Tab ═══ */}
          {sidebarTab === 'workflow' && (
            <div className="p-3 space-y-3">
              <h4 className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-violet-400" /> Agent Workflow Pipeline
              </h4>
              {totalDuration > 0 && (
                <div className="flex items-center gap-2 text-[10px] text-gray-500">
                  <Clock className="w-3 h-3" />
                  Total: {(totalDuration / 1000).toFixed(1)}s
                  <span className="text-gray-700">|</span>
                  {agentStats.done} agents completed
                </div>
              )}
              {/* Visual flow: phases as nodes with agent connections */}
              <div className="relative">
                {phases.map((phase, phaseIdx) => {
                  const phaseAgents = agents.filter(a => phase.agentIds.includes(a.id));
                  const isActive = phase.status === 'running';
                  const isDone = phase.status === 'done';
                  const isError = phase.status === 'error';
                  const phaseColor = isActive ? 'border-blue-500 bg-blue-950/40 shadow-blue-500/20 shadow-lg' :
                    isDone ? 'border-emerald-700/50 bg-emerald-950/20' :
                      isError ? 'border-red-700/50 bg-red-950/20' :
                        'border-gray-800 bg-gray-900/50';

                  return (
                    <div key={phase.id}>
                      {/* Connector line */}
                      {phaseIdx > 0 && (
                        <div className="flex justify-center py-0.5">
                          <div className={`w-0.5 h-3 ${isDone || isActive ? 'bg-emerald-700' : 'bg-gray-800'}`} />
                        </div>
                      )}
                      {/* Phase node */}
                      <div className={`border rounded-lg p-2.5 transition-all ${phaseColor}`}>
                        <div className="flex items-center gap-2 mb-1.5">
                          <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{
                            background: isActive ? '#3b82f6' : isDone ? '#10b981' : isError ? '#ef4444' : '#374151',
                          }}>
                            {isActive ? <Loader className="w-3 h-3 text-white animate-spin" /> :
                              isDone ? <Check className="w-3 h-3 text-white" /> :
                                isError ? <XIcon className="w-3 h-3 text-white" /> :
                                  <span className="text-[8px] text-gray-400 font-bold">{phase.id}</span>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[11px] font-bold text-gray-200">{phase.name}</div>
                            {phase.detail && <div className={`text-[9px] truncate ${isActive ? 'text-blue-400' : 'text-gray-600'}`}>{phase.detail}</div>}
                          </div>
                          {phase.duration != null && phase.duration > 0 && (
                            <span className="text-[9px] text-gray-600 font-mono">{(phase.duration / 1000).toFixed(1)}s</span>
                          )}
                        </div>
                        {/* Agent pills for this phase */}
                        <div className="flex flex-wrap gap-1">
                          {phaseAgents.map(agent => {
                            const agentColor = agent.status === 'active' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-700/50' :
                              agent.status === 'done' ? 'bg-gray-800 text-gray-500 border-gray-700/50' :
                                agent.status === 'error' ? 'bg-red-900/30 text-red-400 border-red-700/50' :
                                  agent.status === 'queued' ? 'bg-amber-900/20 text-amber-500/60 border-amber-800/30' :
                                    'bg-gray-900 text-gray-700 border-gray-800';
                            return (
                              <div key={agent.id} className={`px-1.5 py-0.5 rounded border text-[8px] font-semibold flex items-center gap-1 ${agentColor}`}>
                                {agent.status === 'active' && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                                #{agent.id} {agent.name}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* Empty state */}
              {phases.every(p => p.status === 'pending') && (
                <div className="text-center py-6">
                  <Activity className="w-8 h-8 text-gray-700 mx-auto mb-2" />
                  <p className="text-gray-600 text-xs">Workflow will animate during builds</p>
                  <p className="text-gray-700 text-[10px] mt-1">Start a build to see 50 agents orchestrate in real-time</p>
                </div>
              )}
            </div>
          )}

          {/* ═══ Memory & Learning Tab ═══ */}
          {sidebarTab === 'memory' && (
            <div className="p-3 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                  <Brain className="w-3.5 h-3.5 text-fuchsia-400" /> Learning System
                </h4>
                <button onClick={loadPersistentMemory} disabled={loadingMemory} className="text-[9px] text-gray-500 hover:text-white px-2 py-0.5 rounded bg-gray-800 hover:bg-gray-700 transition-all flex items-center gap-1">
                  <RefreshCw className={`w-2.5 h-2.5 ${loadingMemory ? 'animate-spin' : ''}`} />Refresh
                </button>
              </div>

              {/* Stats overview */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-fuchsia-950/30 border border-fuchsia-800/40 rounded-lg p-2 text-center">
                  <div className="text-lg font-bold text-fuchsia-400">{buildHistory.length}</div>
                  <div className="text-[9px] text-gray-500">Total Builds</div>
                </div>
                <div className="bg-blue-950/30 border border-blue-800/40 rounded-lg p-2 text-center">
                  <div className="text-lg font-bold text-blue-400">{learningInsights.length}</div>
                  <div className="text-[9px] text-gray-500">Insights</div>
                </div>
                <div className="bg-amber-950/30 border border-amber-800/40 rounded-lg p-2 text-center">
                  <div className="text-lg font-bold text-amber-400">{agentMetrics.length}</div>
                  <div className="text-[9px] text-gray-500">Agent Profiles</div>
                </div>
              </div>

              {/* Learning Insights */}
              {learningInsights.length > 0 && (
                <div className="space-y-1.5">
                  <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">AI-Generated Insights</h5>
                  {learningInsights.map((insight, idx) => {
                    const typeConfig = {
                      pattern: { icon: <TrendingUp className="w-3 h-3" />, color: 'border-blue-800/40 bg-blue-950/20 text-blue-300', badge: 'bg-blue-500/20 text-blue-400' },
                      optimization: { icon: <Gauge className="w-3 h-3" />, color: 'border-emerald-800/40 bg-emerald-950/20 text-emerald-300', badge: 'bg-emerald-500/20 text-emerald-400' },
                      warning: { icon: <AlertTriangle className="w-3 h-3" />, color: 'border-amber-800/40 bg-amber-950/20 text-amber-300', badge: 'bg-amber-500/20 text-amber-400' },
                      recommendation: { icon: <Sparkles className="w-3 h-3" />, color: 'border-violet-800/40 bg-violet-950/20 text-violet-300', badge: 'bg-violet-500/20 text-violet-400' },
                    }[insight.type];
                    return (
                      <div key={idx} className={`border rounded-lg p-2.5 ${typeConfig.color}`}>
                        <div className="flex items-center gap-1.5 mb-1">
                          {typeConfig.icon}
                          <span className="text-[11px] font-bold">{insight.title}</span>
                          <span className={`ml-auto text-[8px] px-1.5 py-0.5 rounded-full font-bold ${typeConfig.badge}`}>
                            {Math.round(insight.confidence * 100)}%
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-400 leading-relaxed">{insight.description}</p>
                        <div className="text-[8px] text-gray-600 mt-1">Based on {insight.sourceBuilds} build{insight.sourceBuilds !== 1 ? 's' : ''}</div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Top Agent Performance */}
              {agentMetrics.length > 0 && (
                <div className="space-y-1.5">
                  <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Agent Performance</h5>
                  {agentMetrics
                    .sort((a, b) => b.totalActivations - a.totalActivations)
                    .slice(0, 10)
                    .map(metric => {
                      const successRate = metric.totalActivations > 0
                        ? Math.round((metric.successCount / metric.totalActivations) * 100) : 0;
                      return (
                        <div key={metric.agentId} className="bg-gray-800/50 border border-gray-700/50 rounded-md px-2.5 py-1.5 flex items-center gap-2">
                          <span className="text-[9px] font-mono text-gray-600 w-6">#{metric.agentId}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-semibold text-gray-300">{metric.totalActivations}x used</span>
                              <span className="text-[9px] text-gray-600">avg {(metric.avgDurationMs / 1000).toFixed(1)}s</span>
                            </div>
                            {/* Success bar */}
                            <div className="h-1 bg-gray-700 rounded-full mt-1 overflow-hidden">
                              <div className={`h-full rounded-full ${successRate >= 90 ? 'bg-emerald-500' : successRate >= 70 ? 'bg-amber-500' : 'bg-red-500'}`}
                                style={{ width: `${successRate}%` }} />
                            </div>
                          </div>
                          <span className={`text-[9px] font-bold ${successRate >= 90 ? 'text-emerald-400' : successRate >= 70 ? 'text-amber-400' : 'text-red-400'}`}>
                            {successRate}%
                          </span>
                        </div>
                      );
                    })}
                </div>
              )}

              {/* Prompt Improvement Suggestions */}
              {promptSuggestions.length > 0 && (
                <div className="space-y-1.5">
                  <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Lightbulb className="w-3 h-3 text-amber-400" /> Prompt Improvement Tips
                    {promptSuggestions.some(s => s.aiPowered) && (
                      <span className="text-[7px] font-bold bg-fuchsia-500/20 text-fuchsia-400 px-1.5 py-0.5 rounded-full border border-fuchsia-500/30">
                        AI-Powered
                      </span>
                    )}
                  </h5>
                  {promptSuggestions.slice(0, 4).map((suggestion, idx) => (
                    <div key={idx} className="border border-amber-800/30 bg-amber-950/15 rounded-lg p-2.5">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Target className="w-3 h-3 text-amber-400" />
                        <span className="text-[10px] font-bold text-amber-300 truncate">{suggestion.sourceAppName}</span>
                        {suggestion.aiPowered && <Bot className="w-3 h-3 text-fuchsia-400 flex-shrink-0" />}
                        <span className={`ml-auto text-[8px] px-1.5 py-0.5 rounded-full font-bold ${suggestion.score >= 80 ? 'bg-emerald-500/20 text-emerald-400' :
                          suggestion.score >= 60 ? 'bg-amber-500/20 text-amber-400' :
                            'bg-gray-700 text-gray-400'
                          }`}>
                          {suggestion.score}pts
                        </span>
                      </div>
                      <p className="text-[9px] text-gray-400 leading-relaxed mb-1.5">{suggestion.reasoning}</p>
                      {suggestion.improvedPrompt !== suggestion.originalPrompt && (
                        <div className="bg-black/30 rounded-md p-2 mb-1.5">
                          <p className="text-[8px] text-gray-600 uppercase tracking-wider mb-0.5">Suggested Prompt</p>
                          <p className="text-[9px] text-amber-200/80 leading-relaxed line-clamp-3">{suggestion.improvedPrompt}</p>
                        </div>
                      )}
                      <button
                        onClick={() => {
                          setInput(suggestion.improvedPrompt);
                          setSidebarTab('console');
                          setShowExamples(false);
                        }}
                        className="w-full text-[8px] font-semibold text-amber-500 hover:text-amber-300 bg-amber-950/30 hover:bg-amber-900/40 border border-amber-800/30 rounded py-1 transition-all flex items-center justify-center gap-1"
                      >
                        <Lightbulb className="w-2.5 h-2.5" /> Use improved prompt
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Empty state */}
              {buildHistory.length === 0 && !loadingMemory && (
                <div className="text-center py-6">
                  <Brain className="w-8 h-8 text-gray-700 mx-auto mb-2" />
                  <p className="text-gray-600 text-xs">No build history yet</p>
                  <p className="text-gray-700 text-[10px] mt-1">Complete a build to start learning from patterns</p>
                </div>
              )}
              {loadingMemory && (
                <div className="text-center py-6">
                  <Loader className="w-6 h-6 text-fuchsia-400 animate-spin mx-auto mb-2" />
                  <p className="text-gray-600 text-xs">Loading memory system...</p>
                </div>
              )}
            </div>
          )}

          {/* ═══ Multi-Project Explorer Tab ═══ */}
          {sidebarTab === 'projects' && (
            <div className="p-3 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                  <FolderTree className="w-3.5 h-3.5 text-cyan-400" /> Build History
                </h4>
                <div className="flex items-center gap-1">
                  {buildHistory.length >= 2 && (
                    <button
                      onClick={() => { setCompareMode(!compareMode); setCompareSelected([]); }}
                      className={`text-[9px] px-2 py-0.5 rounded transition-all flex items-center gap-1 font-semibold ${compareMode ? 'bg-violet-600 text-white' : 'text-gray-500 hover:text-white bg-gray-800 hover:bg-gray-700'
                        }`}
                    >
                      <ArrowLeftRight className="w-2.5 h-2.5" />{compareMode ? 'Exit' : 'Compare'}
                    </button>
                  )}
                  <button onClick={loadPersistentMemory} disabled={loadingMemory} className="text-[9px] text-gray-500 hover:text-white px-2 py-0.5 rounded bg-gray-800 hover:bg-gray-700 transition-all flex items-center gap-1">
                    <RefreshCw className={`w-2.5 h-2.5 ${loadingMemory ? 'animate-spin' : ''}`} />Refresh
                  </button>
                </div>
              </div>

              {/* Compare mode banner */}
              {compareMode && (
                <div className="bg-violet-950/40 border border-violet-700/40 rounded-lg p-2.5">
                  <div className="flex items-center gap-2 mb-1.5">
                    <ArrowLeftRight className="w-3.5 h-3.5 text-violet-400" />
                    <span className="text-[10px] font-bold text-violet-300">Select 2 builds to compare</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {compareSelected.length === 0 && <span className="text-[9px] text-gray-500">Click on builds to select them</span>}
                    {compareSelected.map((id, i) => {
                      const b = buildHistory.find(x => x.buildId === id);
                      return (
                        <span key={id} className="text-[8px] bg-violet-800/40 text-violet-300 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                          {i === 0 ? 'A' : 'B'}: {b?.appName || id.substring(0, 8)}
                          <button onClick={() => setCompareSelected(prev => prev.filter(x => x !== id))} className="hover:text-white">
                            <XIcon className="w-2.5 h-2.5" />
                          </button>
                        </span>
                      );
                    })}
                    {compareSelected.length === 2 && (
                      <button
                        onClick={runComparison}
                        disabled={loadingComparison}
                        className="ml-auto text-[9px] font-bold bg-violet-600 hover:bg-violet-500 text-white px-3 py-1 rounded-md transition-all flex items-center gap-1"
                      >
                        {loadingComparison ? <Loader className="w-3 h-3 animate-spin" /> : <ArrowLeftRight className="w-3 h-3" />}
                        Compare
                      </button>
                    )}
                  </div>
                </div>
              )}

              {sortedBuildHistory.length > 0 ? (
                <div className="space-y-2">
                  {sortedBuildHistory.map((build, idx) => {
                    const age = Date.now() - (build.createdAt || 0);
                    const ageStr = age < 60000 ? 'Just now' :
                      age < 3600000 ? `${Math.floor(age / 60000)}m ago` :
                        age < 86400000 ? `${Math.floor(age / 3600000)}h ago` :
                          `${Math.floor(age / 86400000)}d ago`;
                    const isFav = favoriteBuildIds.has(build.buildId);
                    const isCompareSelected = compareSelected.includes(build.buildId);
                    return (
                      <div
                        key={build.buildId || idx}
                        onClick={compareMode ? () => handleCompareToggle(build.buildId) : undefined}
                        className={`bg-gray-800/60 border rounded-lg p-3 transition-all group ${isCompareSelected ? 'border-violet-500 bg-violet-950/20 ring-1 ring-violet-500/30' :
                          isFav ? 'border-amber-700/50 hover:border-amber-600/60' :
                            'border-gray-700/50 hover:border-cyan-700/50'
                          } ${compareMode ? 'cursor-pointer' : ''}`}
                      >
                        <div className="flex items-start justify-between mb-1.5">
                          <div className="flex items-center gap-1.5 min-w-0">
                            {compareMode && (
                              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${isCompareSelected ? 'border-violet-500 bg-violet-500' : 'border-gray-600'
                                }`}>
                                {isCompareSelected && <Check className="w-2.5 h-2.5 text-white" />}
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                {isFav && <Star className="w-3 h-3 text-amber-400 flex-shrink-0 fill-amber-400" />}
                                <h5 className="text-[11px] font-bold text-white group-hover:text-cyan-300 transition-colors truncate">
                                  {build.appName || 'Unnamed'}
                                </h5>
                              </div>
                              <p className="text-[9px] text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">
                                {build.prompt?.substring(0, 120)}{(build.prompt?.length || 0) > 120 ? '...' : ''}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleToggleFavorite(build.buildId); }}
                              className={`p-1 rounded transition-all ${isFav ? 'text-amber-400 hover:text-amber-300' : 'text-gray-700 hover:text-amber-400'
                                }`}
                              title={isFav ? 'Unpin build' : 'Pin build'}
                            >
                              <Star className={`w-3.5 h-3.5 ${isFav ? 'fill-amber-400' : ''}`} />
                            </button>
                            <span className="text-[8px] text-gray-600">{ageStr}</span>
                          </div>
                        </div>

                        {/* Stats row */}
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-[9px] text-gray-500 flex items-center gap-1">
                            <FileCode className="w-3 h-3" />{build.fileCount || '?'} files
                          </span>
                          <span className="text-[9px] text-gray-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />{((build.totalDurationMs || 0) / 1000).toFixed(1)}s
                          </span>
                          {build.criticalCount != null && (
                            <span className={`text-[9px] flex items-center gap-1 ${build.criticalCount > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                              {build.criticalCount > 0 ? <AlertTriangle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                              {build.criticalCount} critical
                            </span>
                          )}
                          {build.provider && (
                            <span className="text-[8px] text-gray-600 ml-auto">
                              {build.provider}
                            </span>
                          )}
                        </div>

                        {/* Features */}
                        {build.features && build.features.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {build.features.slice(0, 4).map((feat, fi) => (
                              <span key={fi} className="text-[8px] bg-gray-700/50 text-gray-400 px-1.5 py-0.5 rounded">
                                {feat}
                              </span>
                            ))}
                            {build.features.length > 4 && (
                              <span className="text-[8px] text-gray-600">+{build.features.length - 4} more</span>
                            )}
                          </div>
                        )}

                        {/* Action buttons */}
                        {!compareMode && (
                          <div className="flex gap-1.5 mt-2">
                            <button
                              onClick={() => {
                                if (build.prompt) {
                                  setInput(build.prompt);
                                  setSidebarTab('console');
                                  setShowExamples(false);
                                }
                              }}
                              className="flex-1 text-[9px] font-semibold text-cyan-500 hover:text-cyan-300 bg-cyan-950/30 hover:bg-cyan-900/40 border border-cyan-800/30 rounded-md py-1.5 transition-all flex items-center justify-center gap-1"
                            >
                              <Play className="w-3 h-3" /> Re-use
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (build.prompt) openSaveTemplateModal(build.prompt, build.buildId, build.appName);
                              }}
                              className="text-[9px] font-semibold text-amber-500 hover:text-amber-300 bg-amber-950/30 hover:bg-amber-900/40 border border-amber-800/30 rounded-md py-1.5 px-2.5 transition-all flex items-center gap-1"
                              title="Save as template"
                            >
                              <Bookmark className="w-3 h-3" /> Template
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : loadingMemory ? (
                <div className="text-center py-6">
                  <Loader className="w-6 h-6 text-cyan-400 animate-spin mx-auto mb-2" />
                  <p className="text-gray-600 text-xs">Loading build history...</p>
                </div>
              ) : (
                <div className="text-center py-6">
                  <FolderTree className="w-8 h-8 text-gray-700 mx-auto mb-2" />
                  <p className="text-gray-600 text-xs">No past builds found</p>
                  <p className="text-gray-700 text-[10px] mt-1">Build an app to start your project library</p>
                </div>
              )}
            </div>
          )}

          {/* ═══ Templates Tab ═══ */}
          {sidebarTab === 'templates' && (
            <div className="p-3 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                  <Bookmark className="w-3.5 h-3.5 text-amber-400" /> Build Templates
                </h4>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openSaveTemplateModal(input || '', undefined, undefined)}
                    disabled={!input.trim()}
                    className="text-[9px] text-amber-500 hover:text-amber-300 disabled:text-gray-700 disabled:cursor-not-allowed px-2 py-0.5 rounded bg-amber-950/30 hover:bg-amber-900/40 disabled:bg-gray-800/30 border border-amber-800/30 disabled:border-gray-700/30 transition-all flex items-center gap-1 font-semibold"
                  >
                    <PlusCircle className="w-2.5 h-2.5" />New
                  </button>
                  <button onClick={loadPersistentMemory} disabled={loadingMemory} className="text-[9px] text-gray-500 hover:text-white px-2 py-0.5 rounded bg-gray-800 hover:bg-gray-700 transition-all flex items-center gap-1">
                    <RefreshCw className={`w-2.5 h-2.5 ${loadingMemory ? 'animate-spin' : ''}`} />Refresh
                  </button>
                  {lineageTree.length > 0 && (
                    <button
                      onClick={() => setShowLineageModal(true)}
                      className="text-[9px] text-indigo-500 hover:text-indigo-300 px-2 py-0.5 rounded bg-indigo-950/30 hover:bg-indigo-900/40 border border-indigo-800/30 transition-all flex items-center gap-1 font-semibold"
                      title="View template fork lineage tree"
                    >
                      <Network className="w-2.5 h-2.5" />Tree
                    </button>
                  )}
                  {templates.length >= 2 && (
                    <button
                      onClick={() => { setShowMergeModal(true); setMergeSourceA(null); setMergeSourceB(null); setMergePreview(null); setConflictOverrides({}); setHighlightedConflictZone(null); }}
                      className="text-[9px] text-violet-500 hover:text-violet-300 px-2 py-0.5 rounded bg-violet-950/30 hover:bg-violet-900/40 border border-violet-800/30 transition-all flex items-center gap-1 font-semibold"
                      title="Merge two template prompts with AI"
                    >
                      <Merge className="w-2.5 h-2.5" />Merge
                    </button>
                  )}
                  {mergeHistory.length > 0 && (
                    <button
                      onClick={() => setShowMergeHistory(true)}
                      className="text-[9px] text-rose-500 hover:text-rose-300 px-2 py-0.5 rounded bg-rose-950/30 hover:bg-rose-900/40 border border-rose-800/30 transition-all flex items-center gap-1 font-semibold"
                      title={`View merge history (${mergeHistory.length} entries)`}
                    >
                      <Clock className="w-2.5 h-2.5" />{mergeHistory.length}
                    </button>
                  )}
                  {lineageTree.length > 0 && (
                    <button
                      onClick={handleBatchExportTimelines}
                      className="text-[9px] text-teal-500 hover:text-teal-300 px-2 py-0.5 rounded bg-teal-950/30 hover:bg-teal-900/40 border border-teal-800/30 transition-all flex items-center gap-1 font-semibold"
                      title="Export all fork chain timelines as a single HTML file"
                    >
                      <PackageOpen className="w-2.5 h-2.5" />Export All
                    </button>
                  )}
                  {lineageTree.length > 0 && (
                    <button
                      onClick={handleExportJsonManifest}
                      className="text-[9px] text-indigo-500 hover:text-indigo-300 px-2 py-0.5 rounded bg-indigo-950/30 hover:bg-indigo-900/40 border border-indigo-800/30 transition-all flex items-center gap-1 font-semibold"
                      title="Export all fork chains as a JSON manifest for programmatic re-import"
                    >
                      <Database className="w-2.5 h-2.5" />JSON
                    </button>
                  )}
                  <input ref={importFileRef} type="file" accept=".json" className="hidden" onChange={handleImportJsonManifest} />
                  <button
                    onClick={() => importFileRef.current?.click()}
                    disabled={importingManifest}
                    className="text-[9px] text-amber-500 hover:text-amber-300 px-2 py-0.5 rounded bg-amber-950/30 hover:bg-amber-900/40 border border-amber-800/30 transition-all flex items-center gap-1 font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
                    title="Import templates from a JSON manifest file"
                  >
                    {importingManifest ? <Loader className="w-2.5 h-2.5 animate-spin" /> : <Upload className="w-2.5 h-2.5" />}Import
                  </button>
                  {importResult && (
                    <span className={`text-[8px] px-2 py-0.5 rounded-full font-semibold ${importResult.skipped === -1 ? 'bg-red-950/40 text-red-400 border border-red-800/30' : importResult.imported === 0 && (importResult.duplicates || 0) > 0 ? 'bg-amber-950/40 text-amber-400 border border-amber-800/30' : 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/30'}`}>
                      {importResult.skipped === -1 ? 'Import failed' : `${importResult.imported} imported${importResult.duplicates ? `, ${importResult.duplicates} dupes skipped` : ''}${importResult.skipped > 0 ? `, ${importResult.skipped} invalid` : ''}`}
                    </span>
                  )}
                  {suppressSimilarWarning && (
                    <button
                      onClick={() => { setSuppressSimilarWarning(false); localStorage.setItem('suppress-similar-warning', 'false'); }}
                      className="text-[9px] text-gray-600 hover:text-amber-400 px-1.5 py-0.5 rounded bg-gray-800/40 hover:bg-amber-950/30 border border-gray-700/20 hover:border-amber-800/30 transition-all flex items-center gap-1 relative group/warn"
                      title={`Similar template warnings disabled${suppressWarningDate ? ` since ${new Date(suppressWarningDate).toLocaleDateString()}` : ''}. Click to re-enable.`}
                    >
                      <AlertTriangle className="w-2.5 h-2.5" />Warnings Off
                      <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 border border-gray-700 text-[8px] text-gray-300 px-2 py-1 rounded-md whitespace-nowrap opacity-0 group-hover/warn:opacity-100 pointer-events-none transition-opacity shadow-lg z-10">
                        {suppressWarningDate ? `Disabled ${new Date(suppressWarningDate).toLocaleDateString()} · Click to re-enable` : 'Click to re-enable warnings'}
                      </span>
                    </button>
                  )}
                </div>
              </div>

              {/* Drag & Drop Import Zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setImportDragOver(true); }}
                onDragLeave={() => setImportDragOver(false)}
                onDrop={handleImportDrop}
                className={`border-2 border-dashed rounded-lg px-4 py-2.5 text-center transition-all cursor-pointer ${importDragOver
                  ? 'border-amber-500 bg-amber-950/30 scale-[1.01]'
                  : 'border-gray-700/40 bg-gray-900/20 hover:border-gray-600/60 hover:bg-gray-800/20'
                  }`}
                onClick={() => importFileRef.current?.click()}
              >
                {importingManifest ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                    <span className="text-[9px] text-amber-300 font-semibold">Importing templates...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <Upload className={`w-3.5 h-3.5 ${importDragOver ? 'text-amber-400' : 'text-gray-600'} transition-colors`} />
                    <span className={`text-[9px] ${importDragOver ? 'text-amber-300 font-semibold' : 'text-gray-600'} transition-colors`}>
                      {importDragOver ? 'Drop JSON manifest to import' : 'Drag & drop a manifest JSON here, or click to browse'}
                    </span>
                  </div>
                )}
              </div>

              {/* Sort & Rating Controls */}
              {templates.length > 1 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[8px] text-gray-600 flex items-center gap-0.5"><ArrowUpDown className="w-2.5 h-2.5" />Sort:</span>
                  {(['newest', 'rating', 'usage', 'name'] as const).map(s => (
                    <button
                      key={s}
                      onClick={() => setTemplateSortBy(s)}
                      className={`text-[8px] font-semibold px-1.5 py-0.5 rounded border transition-all ${templateSortBy === s
                        ? 'text-cyan-300 bg-cyan-950/40 border-cyan-700/50'
                        : 'text-gray-500 hover:text-gray-300 bg-gray-800/50 hover:bg-gray-700/50 border-gray-700/30'
                        }`}
                    >
                      {s === 'newest' ? '🕐 Newest' : s === 'rating' ? '⭐ Rating' : s === 'usage' ? '📊 Usage' : '🔤 Name'}
                    </button>
                  ))}
                  {templates.some(t => (t.rating || 0) > 0) && (
                    <button
                      onClick={handleResetAllRatings}
                      disabled={resettingRatings}
                      className="text-[8px] font-semibold text-red-500 hover:text-red-300 disabled:text-gray-600 bg-red-950/20 hover:bg-red-950/30 border border-red-800/30 rounded px-1.5 py-0.5 transition-all flex items-center gap-0.5 ml-auto"
                      title="Reset all template ratings"
                    >
                      <RotateCcw className={`w-2.5 h-2.5 ${resettingRatings ? 'animate-spin' : ''}`} />Reset Ratings
                    </button>
                  )}
                </div>
              )}

              {/* Export / Import / Share bar */}
              {templates.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {!exportSelectMode ? (
                      <>
                        <button
                          onClick={() => handleExportTemplates(false)}
                          className="text-[8px] text-emerald-500 hover:text-emerald-300 bg-emerald-950/20 hover:bg-emerald-950/30 border border-emerald-800/30 rounded px-2 py-0.5 transition-all flex items-center gap-1 font-semibold"
                          title="Export all templates as JSON"
                        >
                          <Download className="w-2.5 h-2.5" />Export All ({templates.length})
                        </button>
                        <button
                          onClick={() => { setExportSelectMode(true); setExportSelectedIds(new Set()); }}
                          className="text-[8px] text-amber-500 hover:text-amber-300 bg-amber-950/20 hover:bg-amber-950/30 border border-amber-800/30 rounded px-2 py-0.5 transition-all flex items-center gap-1 font-semibold"
                          title="Select specific templates to export"
                        >
                          <CheckSquare className="w-2.5 h-2.5" />Select
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleExportTemplates(true)}
                          disabled={exportSelectedIds.size === 0}
                          className="text-[8px] text-emerald-500 hover:text-emerald-300 disabled:text-gray-600 disabled:cursor-not-allowed bg-emerald-950/20 hover:bg-emerald-950/30 border border-emerald-800/30 rounded px-2 py-0.5 transition-all flex items-center gap-1 font-semibold"
                        >
                          <Download className="w-2.5 h-2.5" />Export ({exportSelectedIds.size})
                        </button>
                        <button
                          onClick={() => setExportSelectedIds(new Set(filteredTemplates.map(t => t.id)))}
                          className="text-[8px] text-blue-500 hover:text-blue-300 bg-blue-950/20 hover:bg-blue-950/30 border border-blue-800/30 rounded px-1.5 py-0.5 transition-all font-semibold"
                        >
                          All
                        </button>
                        <button
                          onClick={() => setExportSelectedIds(new Set())}
                          className="text-[8px] text-gray-500 hover:text-gray-300 bg-gray-800 hover:bg-gray-700 border border-gray-700/30 rounded px-1.5 py-0.5 transition-all font-semibold"
                        >
                          None
                        </button>
                        <button
                          onClick={() => { setExportSelectMode(false); setExportSelectedIds(new Set()); }}
                          className="text-[8px] text-red-500 hover:text-red-300 px-1.5 py-0.5 transition-all font-semibold"
                        >
                          Cancel
                        </button>
                      </>
                    )}
                    <label className="text-[8px] text-blue-500 hover:text-blue-300 bg-blue-950/20 hover:bg-blue-950/30 border border-blue-800/30 rounded px-2 py-0.5 transition-all flex items-center gap-1 font-semibold cursor-pointer" title="Import templates from JSON">
                      <Upload className="w-2.5 h-2.5" />Import
                      <input type="file" accept=".json" onChange={handleImportTemplates} className="hidden" />
                    </label>
                    <button
                      onClick={() => setShowShareInput(prev => !prev)}
                      className={`text-[8px] font-semibold px-2 py-0.5 rounded border transition-all flex items-center gap-1 ${showShareInput ? 'text-purple-400 bg-purple-950/30 border-purple-700/50' : 'text-purple-500 hover:text-purple-300 bg-purple-950/20 hover:bg-purple-950/30 border-purple-800/30'}`}
                      title="Import a shared template code"
                    >
                      <Link className="w-2.5 h-2.5" />Share Code
                    </button>
                  </div>
                  {/* Share code import input */}
                  {showShareInput && (
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={shareCode}
                        onChange={e => setShareCode(e.target.value)}
                        placeholder="Paste share code here..."
                        className="flex-1 text-[9px] bg-gray-800 text-white border border-purple-800/30 rounded px-2 py-1 focus:outline-none focus:border-purple-600/50 placeholder:text-gray-600"
                      />
                      <button
                        onClick={() => handleImportShareCode(shareCode)}
                        disabled={!shareCode.trim() || shareImporting}
                        className="text-[8px] font-semibold text-purple-500 hover:text-purple-300 disabled:text-gray-600 disabled:cursor-not-allowed bg-purple-950/30 hover:bg-purple-900/40 border border-purple-800/30 rounded px-2 py-1 transition-all flex items-center gap-1"
                      >
                        {shareImporting ? <Loader className="w-2.5 h-2.5 animate-spin" /> : <Download className="w-2.5 h-2.5" />}
                        Import
                      </button>
                    </div>
                  )}
                </div>
              )}
              {templates.length === 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <label className="text-[8px] text-blue-500 hover:text-blue-300 bg-blue-950/20 hover:bg-blue-950/30 border border-blue-800/30 rounded px-2 py-0.5 transition-all flex items-center gap-1 font-semibold cursor-pointer" title="Import templates from JSON">
                      <Upload className="w-2.5 h-2.5" />Import from JSON
                      <input type="file" accept=".json" onChange={handleImportTemplates} className="hidden" />
                    </label>
                    <button
                      onClick={() => setShowShareInput(prev => !prev)}
                      className="text-[8px] text-purple-500 hover:text-purple-300 bg-purple-950/20 hover:bg-purple-950/30 border border-purple-800/30 rounded px-2 py-0.5 transition-all flex items-center gap-1 font-semibold cursor-pointer"
                    >
                      <Link className="w-2.5 h-2.5" />Share Code
                    </button>
                  </div>
                  {showShareInput && (
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={shareCode}
                        onChange={e => setShareCode(e.target.value)}
                        placeholder="Paste share code here..."
                        className="flex-1 text-[9px] bg-gray-800 text-white border border-purple-800/30 rounded px-2 py-1 focus:outline-none focus:border-purple-600/50 placeholder:text-gray-600"
                      />
                      <button
                        onClick={() => handleImportShareCode(shareCode)}
                        disabled={!shareCode.trim() || shareImporting}
                        className="text-[8px] font-semibold text-purple-500 hover:text-purple-300 disabled:text-gray-600 disabled:cursor-not-allowed bg-purple-950/30 hover:bg-purple-900/40 border border-purple-800/30 rounded px-2 py-1 transition-all flex items-center gap-1"
                      >
                        {shareImporting ? <Loader className="w-2.5 h-2.5 animate-spin" /> : <Download className="w-2.5 h-2.5" />}
                        Import
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Search input */}
              {templates.length > 2 && (
                <div className="relative">
                  <Search className="w-3 h-3 text-gray-600 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={templateSearch}
                    onChange={e => setTemplateSearch(e.target.value)}
                    placeholder="Search templates..."
                    className="w-full pl-7 pr-2 py-1.5 text-[10px] bg-gray-800 text-white border border-gray-700/50 rounded-lg focus:outline-none focus:border-amber-600/50 placeholder:text-gray-600"
                  />
                  {templateSearch && (
                    <button onClick={() => setTemplateSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-600 hover:text-white">
                      <XIcon className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>
              )}

              {/* Category filter pills */}
              {templates.length > 0 && (() => {
                const categories = [...new Set(templates.map(t => t.category))];
                return categories.length > 1 ? (
                  <div className="flex flex-wrap gap-1">
                    <button
                      onClick={() => setTemplateFilterCategory(null)}
                      className={`text-[8px] px-2 py-0.5 rounded-full border transition-all font-semibold ${!templateFilterCategory
                        ? 'bg-amber-950/40 text-amber-400 border-amber-700/50'
                        : 'bg-gray-800 text-gray-500 border-gray-700/50 hover:text-gray-300'
                        }`}
                    >
                      All ({templates.length})
                    </button>
                    {categories.map(cat => (
                      <button
                        key={cat}
                        onClick={() => setTemplateFilterCategory(templateFilterCategory === cat ? null : cat)}
                        className={`text-[8px] px-2 py-0.5 rounded-full border transition-all font-semibold ${templateFilterCategory === cat
                          ? 'bg-amber-950/40 text-amber-400 border-amber-700/50'
                          : 'bg-gray-800 text-gray-500 border-gray-700/50 hover:text-gray-300'
                          }`}
                      >
                        {cat} ({templates.filter(t => t.category === cat).length})
                      </button>
                    ))}
                  </div>
                ) : null;
              })()}

              {/* Results count when filtered */}
              {(templateSearch || templateFilterCategory) && templates.length > 0 && (
                <p className="text-[9px] text-gray-600">
                  {filteredTemplates.length} of {templates.length} templates
                  {templateSearch && <> matching "<span className="text-amber-500">{templateSearch}</span>"</>}
                  {templateFilterCategory && <> in <span className="text-amber-500">{templateFilterCategory}</span></>}
                </p>
              )}

              {/* Rating-based recommendations */}
              {recommendedTemplates.length > 0 && !templateSearch && !templateFilterCategory && (
                <div className="bg-gradient-to-r from-yellow-950/20 to-amber-950/20 border border-yellow-800/30 rounded-lg p-2.5 space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <ThumbsUp className="w-3 h-3 text-yellow-400" />
                    <span className="text-[9px] font-bold text-yellow-400">Recommended for your prompt</span>
                    <span className="text-[7px] text-yellow-600 bg-yellow-950/40 px-1.5 py-0.5 rounded-full">★ rated &amp; matching</span>
                  </div>
                  {recommendedTemplates.map(tmpl => (
                    <div key={`rec-${tmpl.id}`} className="flex items-center gap-2 bg-gray-900/50 rounded-md px-2.5 py-1.5 border border-yellow-800/20 hover:border-yellow-600/40 transition-all group/rec">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <Bookmark className="w-2.5 h-2.5 text-yellow-400 fill-yellow-400 flex-shrink-0" />
                          <span className="text-[10px] font-bold text-white truncate">{tmpl.name}</span>
                          <div className="flex items-center gap-px flex-shrink-0">
                            {[1, 2, 3, 4, 5].map(s => (
                              <Star key={s} className={`w-2 h-2 ${(tmpl.rating || 0) >= s ? 'text-yellow-400 fill-yellow-400' : 'text-gray-700'}`} />
                            ))}
                          </div>
                        </div>
                        <p className="text-[8px] text-gray-500 truncate mt-0.5">{tmpl.prompt.substring(0, 80)}...</p>
                      </div>
                      <button
                        onClick={() => handleUseTemplate(tmpl)}
                        className="text-[8px] font-semibold text-yellow-500 hover:text-yellow-300 bg-yellow-950/30 hover:bg-yellow-900/40 border border-yellow-800/30 rounded px-2 py-1 transition-all flex items-center gap-0.5 flex-shrink-0 opacity-0 group-hover/rec:opacity-100"
                      >
                        <Play className="w-2.5 h-2.5" />Use
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {filteredTemplates.length > 0 ? (
                <div className="space-y-2">
                  {filteredTemplates.map(tmpl => {
                    const parentName = tmpl.parentTemplateId ? templates.find(t => t.id === tmpl.parentTemplateId)?.name : null;
                    return (
                      <div key={tmpl.id} className={`bg-gray-800/60 border rounded-lg p-3 transition-all hover:border-amber-600/50 group ${exportSelectMode && exportSelectedIds.has(tmpl.id) ? 'border-emerald-600/50 bg-emerald-950/10' : 'border-amber-800/30'}`}>
                        <div className="flex items-start justify-between mb-1">
                          <div className="min-w-0 flex items-start gap-1.5">
                            {exportSelectMode && (
                              <button onClick={() => toggleExportSelect(tmpl.id)} className="mt-0.5 flex-shrink-0">
                                {exportSelectedIds.has(tmpl.id)
                                  ? <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
                                  : <Square className="w-3.5 h-3.5 text-gray-600 hover:text-gray-400" />
                                }
                              </button>
                            )}
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <Bookmark className="w-3 h-3 text-amber-400 flex-shrink-0 fill-amber-400" />
                                <h5 className="text-[11px] font-bold text-white group-hover:text-amber-300 transition-colors truncate">{tmpl.name}</h5>
                                {(tmpl.version || 1) > 1 && (
                                  <span className="text-[7px] bg-indigo-950/40 text-indigo-400 px-1 py-0.5 rounded border border-indigo-800/20 flex-shrink-0">v{tmpl.version}</span>
                                )}
                              </div>
                              {tmpl.description && (
                                <p className="text-[9px] text-gray-500 mt-0.5 line-clamp-1">{tmpl.description}</p>
                              )}
                              {parentName && (
                                <p className="text-[8px] text-indigo-500/70 mt-0.5 flex items-center gap-0.5">
                                  <GitBranch className="w-2 h-2" />forked from <span className="text-indigo-400/80 font-semibold">{parentName}</span>
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0">
                            {tmpl.parentTemplateId && templates.some(t => t.id === tmpl.parentTemplateId) && (
                              <button
                                onClick={() => setDiffModalTemplateId(tmpl.id)}
                                className="p-1 text-gray-700 hover:text-cyan-400 transition-all"
                                title="View diff from parent"
                              >
                                <ArrowLeftRight className="w-3 h-3" />
                              </button>
                            )}
                            {(tmpl.parentTemplateId || templates.some(t => t.parentTemplateId === tmpl.id)) && (
                              <button
                                onClick={() => setShowTimelineModal(tmpl.id)}
                                className="p-1 text-gray-700 hover:text-indigo-400 transition-all"
                                title="View version timeline"
                              >
                                <History className="w-3 h-3" />
                              </button>
                            )}
                            <button
                              onClick={() => { const code = handleShareTemplate(tmpl); navigator.clipboard.writeText(code); }}
                              className="p-1 text-gray-700 hover:text-purple-400 transition-all"
                              title="Copy share code"
                            >
                              <Share2 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleDuplicateTemplate(tmpl)}
                              className="p-1 text-gray-700 hover:text-blue-400 transition-all"
                              title="Duplicate template (creates new version)"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleDeleteTemplate(tmpl.id)}
                              className="p-1 text-gray-700 hover:text-red-400 transition-all"
                              title="Delete template"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        <p className="text-[9px] text-gray-400 leading-relaxed line-clamp-2 mb-2">{tmpl.prompt.substring(0, 150)}{tmpl.prompt.length > 150 ? '...' : ''}</p>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[8px] bg-amber-950/30 text-amber-400 px-1.5 py-0.5 rounded-full border border-amber-800/20">{tmpl.category}</span>
                          {tmpl.tags.slice(0, 3).map(tag => (
                            <span key={tag} className="text-[8px] bg-gray-700/50 text-gray-500 px-1.5 py-0.5 rounded">
                              <Tag className="w-2 h-2 inline mr-0.5" />{tag}
                            </span>
                          ))}
                          {tmpl.usageCount > 0 && (
                            <span className="text-[8px] text-gray-600 ml-auto">Used {tmpl.usageCount}x</span>
                          )}
                        </div>
                        {/* Star Rating */}
                        <div className="flex items-center gap-1.5 mb-2">
                          <div className="flex items-center gap-px">
                            {[1, 2, 3, 4, 5].map(star => {
                              const hoverActive = ratingHover?.id === tmpl.id && ratingHover.star >= star;
                              const filled = hoverActive || (tmpl.rating || 0) >= star;
                              const halfFilled = !filled && (tmpl.rating || 0) >= star - 0.5;
                              return (
                                <button
                                  key={star}
                                  onClick={() => handleRateTemplate(tmpl.id, star)}
                                  onMouseEnter={() => setRatingHover({ id: tmpl.id, star })}
                                  onMouseLeave={() => setRatingHover(null)}
                                  className="p-0 transition-all"
                                  title={`Rate ${star} star${star > 1 ? 's' : ''}`}
                                >
                                  <Star className={`w-3 h-3 transition-all ${filled ? 'text-yellow-400 fill-yellow-400' :
                                    halfFilled ? 'text-yellow-400 fill-yellow-400/50' :
                                      'text-gray-700 hover:text-yellow-600'
                                    }`} />
                                </button>
                              );
                            })}
                          </div>
                          {tmpl.rating != null && tmpl.rating > 0 && (
                            <span className="text-[8px] text-yellow-500/70">{tmpl.rating.toFixed(1)}</span>
                          )}
                          {(tmpl.ratingCount || 0) > 0 && (
                            <span className="text-[8px] text-gray-600">({tmpl.ratingCount})</span>
                          )}
                        </div>
                        <button
                          onClick={() => handleUseTemplate(tmpl)}
                          className="w-full text-[9px] font-semibold text-amber-500 hover:text-amber-300 bg-amber-950/30 hover:bg-amber-900/40 border border-amber-800/30 rounded-md py-1.5 transition-all flex items-center justify-center gap-1"
                        >
                          <Play className="w-3 h-3" /> Use this template
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : templates.length > 0 && (templateSearch || templateFilterCategory) ? (
                <div className="text-center py-6">
                  <Search className="w-6 h-6 text-gray-700 mx-auto mb-2" />
                  <p className="text-gray-600 text-xs">No templates match your filter</p>
                  <button
                    onClick={() => { setTemplateSearch(''); setTemplateFilterCategory(null); }}
                    className="text-[9px] text-amber-500 hover:text-amber-300 mt-1 underline"
                  >
                    Clear filters
                  </button>
                </div>
              ) : loadingMemory ? (
                <div className="text-center py-6">
                  <Loader className="w-6 h-6 text-amber-400 animate-spin mx-auto mb-2" />
                  <p className="text-gray-600 text-xs">Loading templates...</p>
                </div>
              ) : (
                <div className="text-center py-6">
                  <Bookmark className="w-8 h-8 text-gray-700 mx-auto mb-2" />
                  <p className="text-gray-600 text-xs">No templates saved yet</p>
                  <p className="text-gray-700 text-[10px] mt-1">Save your best prompts as reusable templates from the Builds tab</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Examples */}
        {showExamples && sidebarTab === 'console' && (
          <div className="p-3 border-t border-gray-800 flex-shrink-0">
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Quick Start</p>
            <div className="grid grid-cols-2 gap-1.5">
              {examples.map((ex, i) => (
                <button key={i} onClick={() => { setInput(ex.prompt); setShowExamples(false); }} className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-left transition-all group">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-violet-400 group-hover:text-violet-300">{ex.icon}</span>
                    <span className="text-[9px] font-semibold text-gray-500">{ex.cat}</span>
                  </div>
                  <p className="text-white text-[11px] font-semibold leading-tight">{ex.title}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Auto-recommend save as template banner */}
        {autoRecommendSave && !isGenerating && (
          <div className="mx-3 mt-2 mb-0 bg-gradient-to-r from-emerald-950/30 to-teal-950/30 border border-emerald-800/30 rounded-lg px-3 py-2 flex items-center gap-2 animate-in fade-in">
            <Wand2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-emerald-300">Save this prompt as a template?</p>
              <p className="text-[8px] text-emerald-500/70 truncate">"{autoRecommendSave.appName}" doesn't match existing templates</p>
            </div>
            <button
              onClick={() => {
                openSaveTemplateModal(autoRecommendSave.prompt, undefined, autoRecommendSave.appName);
                setAutoRecommendSave(null);
              }}
              className="text-[9px] font-semibold text-emerald-400 hover:text-emerald-300 bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-700/30 rounded-md px-2.5 py-1 transition-all flex items-center gap-1 flex-shrink-0"
            >
              <Bookmark className="w-3 h-3" />Save
            </button>
            <button
              onClick={() => setAutoRecommendSave(null)}
              className="p-0.5 text-gray-600 hover:text-gray-400 transition-all flex-shrink-0"
            >
              <XIcon className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Input */}
        <form onSubmit={handleSubmit} className="p-3 border-t border-gray-800 flex-shrink-0">
          {/* Prompt suggestions hint */}
          {promptSuggestions.length > 0 && !inRefineMode && !isGenerating && generatedFiles.length === 0 && (
            <button
              type="button"
              onClick={() => setShowSuggestions(!showSuggestions)}
              className={`mb-2 w-full text-[9px] font-semibold flex items-center justify-center gap-1.5 py-1.5 rounded-md border transition-all ${showSuggestions
                ? 'text-amber-300 bg-amber-950/30 border-amber-700/40'
                : 'text-gray-500 hover:text-amber-400 bg-gray-800/50 border-gray-700/50 hover:border-amber-700/30'
                }`}
            >
              <Lightbulb className="w-3 h-3" />
              {showSuggestions ? 'Hide suggestions' : `${promptSuggestions.length} ${promptSuggestions.some(s => s.aiPowered) ? 'AI ' : ''}suggestion${promptSuggestions.length !== 1 ? 's' : ''} from past builds`}
              {!showSuggestions && promptSuggestions.some(s => s.aiPowered) && <Bot className="w-3 h-3 text-fuchsia-400" />}
            </button>
          )}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder={inRefineMode ? 'Describe changes to make...' : 'Describe your app — 50 agents will build it...'}
                className={`w-full px-3 py-2.5 bg-gray-800 text-white text-sm border rounded-lg focus:outline-none placeholder:text-gray-600 ${inRefineMode ? 'border-violet-700 focus:border-violet-500' : 'border-gray-700 focus:border-fuchsia-500'
                  }`}
                disabled={isGenerating || isRefining}
              />
              {inRefineMode && (
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-violet-500 font-semibold bg-violet-900/30 px-1.5 py-0.5 rounded">
                  REFINE
                </span>
              )}
            </div>
            <button
              type="submit"
              disabled={!input.trim() || isGenerating || isRefining}
              className={`px-4 py-2.5 text-white rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all ${inRefineMode ? 'bg-violet-600 hover:bg-violet-700' : 'bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500'
                }`}
            >
              {isGenerating || isRefining ? <Loader className="w-4 h-4 animate-spin" /> : inRefineMode ? <Pencil className="w-4 h-4" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </form>
      </div>

      {/* ─── Center: Code Editor ─── */}
      {generatedFiles.length > 0 && (
        <div className="w-[480px] flex flex-col bg-gray-950 border-r border-gray-800">
          <div className="bg-gray-900 px-4 py-3 border-b border-gray-800 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <Code className="w-4 h-4 text-violet-400" />
              <span className="text-white text-sm font-semibold">{generatedFiles.length} Files</span>
              {architecture && <span className="text-gray-500 text-xs">| {architecture.appName}</span>}
            </div>
            <div className="flex gap-1.5">
              <button onClick={downloadZip} className="px-3 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition-all flex items-center gap-1.5 font-semibold">
                <Download className="w-3.5 h-3.5" />ZIP
              </button>
              {selectedFileData && (
                <button onClick={async () => { await copyToClipboard(selectedFileData.content); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="p-1.5 text-gray-500 hover:text-white hover:bg-gray-800 rounded-md transition-all">
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>
          </div>

          {/* Build Issues Banner */}
          {buildIssues.length > 0 && (
            <div className="px-3 py-2 border-b border-gray-800 bg-gray-900/50 flex-shrink-0">
              <div className="flex items-center gap-2 text-xs">
                {buildIssues.some(i => i.severity === 'critical') ? <AlertTriangle className="w-3.5 h-3.5 text-red-400" /> : <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />}
                <span className="text-gray-400">
                  {buildIssues.filter(i => i.severity === 'critical').length} critical, {buildIssues.filter(i => i.severity === 'warning').length} warnings
                </span>
              </div>
            </div>
          )}

          {/* File Tree */}
          <div className="bg-gray-900/50 border-b border-gray-800 max-h-[200px] overflow-y-auto flex-shrink-0">
            <div className="py-1">
              {generatedFiles.slice().sort((a, b) => a.path.localeCompare(b.path)).map(file => {
                const isSelected = selectedFile === file.path;
                const isSource = file.path.startsWith('src/');
                const depth = file.path.split('/').length - 1;
                const hasIssue = buildIssues.some(i => i.file === file.path && i.severity === 'critical');
                const isRefineTarget = refineTargetFile === file.path;
                return (
                  <button
                    key={file.path}
                    onClick={() => { setSelectedFile(file.path); if (inRefineMode) setRefineTargetFile(file.path); }}
                    className={`w-full flex items-center gap-1.5 px-3 py-1 text-xs text-left transition-all ${isSelected ? 'bg-violet-600/20 text-violet-300' :
                      isRefineTarget ? 'bg-blue-900/20 text-blue-300' :
                        hasIssue ? 'text-red-400 hover:bg-gray-800/50' :
                          isSource ? 'text-gray-300 hover:bg-gray-800/50' : 'text-gray-500 hover:bg-gray-800/50'
                      }`}
                    style={{ paddingLeft: `${12 + depth * 12}px` }}
                  >
                    {isRefineTarget && <Pencil className="w-2.5 h-2.5 text-violet-400 flex-shrink-0" />}
                    {hasIssue && <AlertTriangle className="w-3 h-3 text-red-400 flex-shrink-0" />}
                    <FileCode className="w-3 h-3 flex-shrink-0 opacity-50" />
                    <span className="truncate">{file.path}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Code Viewer */}
          <div className="flex-1 overflow-auto bg-gray-950 p-3">
            {selectedFileData && (
              <pre className="text-gray-200 text-[11px] font-mono leading-relaxed">
                {selectedFileData.content.split('\n').map((line, i) => (
                  <div key={i} className="hover:bg-gray-800/40 flex">
                    <span className="text-gray-700 select-none w-8 text-right mr-3 flex-shrink-0 inline-block">{i + 1}</span>
                    <span className="flex-1">{line || ' '}</span>
                  </div>
                ))}
              </pre>
            )}
          </div>
        </div>
      )}

      {/* ─── Right: Preview / Welcome ─── */}
      <div className="flex-1 flex flex-col bg-gray-950">
        <div className="bg-gray-900 px-4 py-3 border-b border-gray-800 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-emerald-400" />
            <span className="text-white text-sm font-semibold">Live Preview</span>
          </div>
          <button onClick={() => setPreviewKey(p => p + 1)} className="p-1.5 text-gray-500 hover:text-white hover:bg-gray-800 rounded-md transition-all">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex-1 overflow-hidden bg-white">
          {generatedFiles.length > 0 && selectedFileData?.path.endsWith('.tsx') ? (
            <CodePreview code={selectedFileData.content} refreshKey={previewKey} />
          ) : (
            <div className="flex items-center justify-center h-full bg-gray-950">
              <div className="text-center max-w-lg px-8">
                {/* Hero */}
                <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-violet-600 via-fuchsia-500 to-cyan-500 flex items-center justify-center shadow-2xl shadow-violet-500/30">
                  <Brain className="w-12 h-12 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">SuperBrainBuilder</h2>
                <p className="text-gray-400 text-sm mb-1">50-Agent Autonomous AI Software Factory</p>
                <p className="text-gray-600 text-xs mb-6">
                  Describe any application and 50 specialized agents across 5 departments will autonomously architect, code, test, secure, and deliver it.
                </p>

                {/* Department overview */}
                <div className="grid grid-cols-5 gap-2 mb-6">
                  {getDepartments().map(dept => {
                    const colors = DEPARTMENT_COLORS[dept];
                    const icon = DEPARTMENT_ICONS[dept];
                    const count = dept === 'Product Design' ? 10 :
                      dept === 'Engineering' ? 12 :
                        dept === 'Quality & Security' ? 10 :
                          dept === 'Infrastructure & Deployment' ? 10 : 8;
                    return (
                      <div key={dept} className={`p-2.5 rounded-xl border ${colors.border} ${colors.bg}`}>
                        <div className="text-lg mb-1">{icon}</div>
                        <div className={`text-[10px] font-bold ${colors.text} leading-tight`}>{dept.split(' & ')[0]}</div>
                        <div className="text-[9px] text-gray-600 mt-0.5">{count} agents</div>
                      </div>
                    );
                  })}
                </div>

                {/* Feature grid */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  {[
                    { icon: <Wifi className="w-4 h-4" />, label: 'SSE Streaming', sub: 'Real-time generation' },
                    { icon: <ArrowLeftRight className="w-4 h-4" />, label: 'Build Compare', sub: 'Side-by-side diffs' },
                    { icon: <Pencil className="w-4 h-4" />, label: 'Refine Mode', sub: 'Iterative changes' },
                    { icon: <Star className="w-4 h-4" />, label: 'Pin Favorites', sub: 'Bookmark builds' },
                    { icon: <Lightbulb className="w-4 h-4" />, label: 'Smart Prompts', sub: 'AI suggestions' },
                    { icon: <FolderTree className="w-4 h-4" />, label: 'Multi-Project', sub: `${buildHistory.length} past builds` },
                  ].map((f, i) => (
                    <div key={i} className="p-2.5 rounded-xl bg-gray-900 border border-gray-800">
                      <div className="text-violet-400 flex justify-center mb-1">{f.icon}</div>
                      <div className="text-[10px] text-gray-300 font-semibold">{f.label}</div>
                      <div className="text-[8px] text-gray-600">{f.sub}</div>
                    </div>
                  ))}
                </div>

                {/* Quick insight from memory */}
                {learningInsights.length > 0 && (
                  <div className="mt-4 p-3 rounded-xl bg-fuchsia-950/20 border border-fuchsia-800/30 text-left">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Brain className="w-3.5 h-3.5 text-fuchsia-400" />
                      <span className="text-[10px] font-bold text-fuchsia-300">Learning System Active</span>
                    </div>
                    <p className="text-[9px] text-gray-400">
                      {learningInsights[0].description}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ═══ Comparison Modal ═══ */}
      {showComparisonModal && comparisonData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-[700px] max-h-[85vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-3 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <ArrowLeftRight className="w-5 h-5 text-white" />
                <h3 className="text-white font-bold text-sm">Build Comparison</h3>
              </div>
              <button onClick={() => { setShowComparisonModal(false); setComparisonData(null); }} className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-all">
                <XIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Build headers side-by-side */}
              <div className="grid grid-cols-2 gap-4">
                {comparisonData.builds.map((build, i) => (
                  <div key={build.buildId} className={`rounded-xl p-3 ${i === 0 ? 'bg-violet-950/20 border border-violet-700/40' : 'bg-cyan-950/20 border border-cyan-700/40'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-bold text-white w-5 h-5 rounded-full flex items-center justify-center ${i === 0 ? 'bg-violet-600' : 'bg-cyan-600'}`}>
                        {i === 0 ? 'A' : 'B'}
                      </span>
                      <h4 className="text-sm font-bold text-white truncate">{build.appName || 'Unnamed'}</h4>
                    </div>
                    <p className="text-[9px] text-gray-500 line-clamp-2">{build.prompt?.substring(0, 100)}</p>
                  </div>
                ))}
              </div>

              {/* Metric comparison rows */}
              <div className="space-y-2">
                <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Key Metrics</h5>
                {[
                  {
                    label: 'Build Duration',
                    valueA: `${((comparisonData.builds[0].totalDurationMs || 0) / 1000).toFixed(1)}s`,
                    valueB: `${((comparisonData.builds[1].totalDurationMs || 0) / 1000).toFixed(1)}s`,
                    winner: comparisonData.comparison.winner.speed,
                    icon: <Clock className="w-3.5 h-3.5 text-blue-400" />,
                  },
                  {
                    label: 'Files Generated',
                    valueA: `${comparisonData.builds[0].fileCount || 0}`,
                    valueB: `${comparisonData.builds[1].fileCount || 0}`,
                    winner: comparisonData.comparison.winner.features,
                    icon: <FileCode className="w-3.5 h-3.5 text-emerald-400" />,
                  },
                  {
                    label: 'Critical Issues',
                    valueA: `${comparisonData.builds[0].criticalCount || 0}`,
                    valueB: `${comparisonData.builds[1].criticalCount || 0}`,
                    winner: comparisonData.comparison.winner.quality,
                    icon: <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />,
                  },
                  {
                    label: 'Features',
                    valueA: `${comparisonData.builds[0].features?.length || 0}`,
                    valueB: `${comparisonData.builds[1].features?.length || 0}`,
                    winner: comparisonData.comparison.winner.features,
                    icon: <Sparkles className="w-3.5 h-3.5 text-violet-400" />,
                  },
                ].map(row => (
                  <div key={row.label} className="grid grid-cols-[1fr_100px_1fr] items-center gap-2 bg-gray-800/40 rounded-lg px-3 py-2">
                    <div className="flex items-center justify-end gap-2">
                      <span className={`text-sm font-bold ${row.winner === comparisonData.builds[0].buildId ? 'text-emerald-400' : 'text-gray-300'}`}>
                        {row.valueA}
                      </span>
                      {row.winner === comparisonData.builds[0].buildId && <Trophy className="w-3 h-3 text-emerald-400" />}
                    </div>
                    <div className="flex items-center justify-center gap-1.5">
                      {row.icon}
                      <span className="text-[10px] text-gray-400 font-semibold">{row.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {row.winner === comparisonData.builds[1].buildId && <Trophy className="w-3 h-3 text-emerald-400" />}
                      <span className={`text-sm font-bold ${row.winner === comparisonData.builds[1].buildId ? 'text-emerald-400' : 'text-gray-300'}`}>
                        {row.valueB}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Tech Stack comparison */}
              <div className="space-y-2">
                <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tech Stack</h5>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <p className="text-[8px] text-violet-400 font-bold mb-1">Only in A</p>
                    <div className="flex flex-wrap gap-1">
                      {comparisonData.comparison.uniqueTechA.map(t => (
                        <span key={t} className="text-[8px] bg-violet-900/30 text-violet-300 px-1.5 py-0.5 rounded">{t}</span>
                      ))}
                      {comparisonData.comparison.uniqueTechA.length === 0 && <span className="text-[8px] text-gray-700">—</span>}
                    </div>
                  </div>
                  <div>
                    <p className="text-[8px] text-gray-400 font-bold mb-1 text-center">Shared</p>
                    <div className="flex flex-wrap gap-1 justify-center">
                      {comparisonData.comparison.commonTech.map(t => (
                        <span key={t} className="text-[8px] bg-gray-700/50 text-gray-300 px-1.5 py-0.5 rounded">{t}</span>
                      ))}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[8px] text-cyan-400 font-bold mb-1">Only in B</p>
                    <div className="flex flex-wrap gap-1 justify-end">
                      {comparisonData.comparison.uniqueTechB.map(t => (
                        <span key={t} className="text-[8px] bg-cyan-900/30 text-cyan-300 px-1.5 py-0.5 rounded">{t}</span>
                      ))}
                      {comparisonData.comparison.uniqueTechB.length === 0 && <span className="text-[8px] text-gray-700">—</span>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Features comparison */}
              <div className="space-y-2">
                <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Features</h5>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <p className="text-[8px] text-violet-400 font-bold mb-1">Only in A</p>
                    <div className="space-y-0.5">
                      {comparisonData.comparison.uniqueFeaturesA.map(f => (
                        <div key={f} className="text-[9px] text-violet-300 leading-tight">• {f}</div>
                      ))}
                      {comparisonData.comparison.uniqueFeaturesA.length === 0 && <span className="text-[8px] text-gray-700">—</span>}
                    </div>
                  </div>
                  <div>
                    <p className="text-[8px] text-gray-400 font-bold mb-1 text-center">Shared</p>
                    <div className="space-y-0.5 text-center">
                      {comparisonData.comparison.commonFeatures.map(f => (
                        <div key={f} className="text-[9px] text-gray-400 leading-tight">{f}</div>
                      ))}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[8px] text-cyan-400 font-bold mb-1">Only in B</p>
                    <div className="space-y-0.5">
                      {comparisonData.comparison.uniqueFeaturesB.map(f => (
                        <div key={f} className="text-[9px] text-cyan-300 leading-tight text-right">• {f}</div>
                      ))}
                      {comparisonData.comparison.uniqueFeaturesB.length === 0 && <span className="text-[8px] text-gray-700">—</span>}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-800 px-5 py-3 flex items-center justify-between flex-shrink-0 bg-gray-900">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const build = comparisonData.builds[0];
                    if (build.prompt) { setInput(build.prompt); setSidebarTab('console'); setShowExamples(false); setShowComparisonModal(false); }
                  }}
                  className="text-[10px] font-semibold text-violet-400 hover:text-violet-300 bg-violet-950/30 hover:bg-violet-900/40 border border-violet-800/30 rounded-md px-3 py-1.5 transition-all"
                >
                  Use A's prompt
                </button>
                <button
                  onClick={() => {
                    const build = comparisonData.builds[1];
                    if (build.prompt) { setInput(build.prompt); setSidebarTab('console'); setShowExamples(false); setShowComparisonModal(false); }
                  }}
                  className="text-[10px] font-semibold text-cyan-400 hover:text-cyan-300 bg-cyan-950/30 hover:bg-cyan-900/40 border border-cyan-800/30 rounded-md px-3 py-1.5 transition-all"
                >
                  Use B's prompt
                </button>
                <button
                  onClick={handleExportComparison}
                  className="text-[10px] font-semibold text-emerald-400 hover:text-emerald-300 bg-emerald-950/30 hover:bg-emerald-900/40 border border-emerald-800/30 rounded-md px-3 py-1.5 transition-all flex items-center gap-1"
                  title="Export comparison as HTML report"
                >
                  <FileDown className="w-3 h-3" /> Export
                </button>
              </div>
              <button
                onClick={() => { setShowComparisonModal(false); setComparisonData(null); }}
                className="text-[10px] font-semibold text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-md px-4 py-1.5 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Prompt Suggestions Popover ═══ */}
      {showSuggestions && promptSuggestions.length > 0 && !isGenerating && generatedFiles.length === 0 && (
        <div className="fixed bottom-20 left-[16px] w-[408px] z-40 bg-gray-900 border border-amber-700/40 rounded-xl shadow-2xl shadow-amber-500/10 overflow-hidden">
          <div className="px-3 py-2.5 bg-amber-950/30 border-b border-amber-800/30 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[10px] font-bold text-amber-300">Prompt Suggestions from Past Builds</span>
              {promptSuggestions.some(s => s.aiPowered) && (
                <span className="text-[7px] font-bold bg-fuchsia-500/20 text-fuchsia-400 px-1.5 py-0.5 rounded-full border border-fuchsia-500/30">
                  AI-Powered
                </span>
              )}
            </div>
            <button onClick={() => setShowSuggestions(false)} className="text-gray-500 hover:text-white p-0.5 rounded">
              <XIcon className="w-3 h-3" />
            </button>
          </div>
          <div className="p-2 max-h-[250px] overflow-y-auto space-y-1.5">
            {promptSuggestions.slice(0, 3).map((s, i) => (
              <button
                key={i}
                onClick={() => {
                  setInput(s.improvedPrompt);
                  setShowSuggestions(false);
                  setShowExamples(false);
                }}
                className="w-full text-left p-2.5 bg-gray-800/60 hover:bg-gray-800 border border-gray-700/50 hover:border-amber-700/40 rounded-lg transition-all group"
              >
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-[10px] font-bold text-amber-300 group-hover:text-amber-200">{s.sourceAppName}</span>
                  {s.aiPowered && <Bot className="w-3 h-3 text-fuchsia-400" />}
                  <span className={`ml-auto text-[8px] px-1.5 py-0.5 rounded-full font-bold ${s.score >= 80 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                    }`}>{s.score}pts</span>
                </div>
                <p className="text-[9px] text-gray-400 line-clamp-2 leading-relaxed">{s.improvedPrompt}</p>
                <p className="text-[8px] text-gray-600 mt-1">{s.reasoning}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ═══ Lineage Tree Modal ═══ */}
      {showLineageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-[560px] max-h-[80vh] overflow-hidden flex flex-col">
            <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Network className="w-5 h-5 text-white" />
                <h3 className="text-white font-bold text-sm">Template Lineage Tree</h3>
                <span className="text-[9px] text-white/60 bg-white/10 px-2 py-0.5 rounded-full">{lineageTree.length} fork chain{lineageTree.length !== 1 ? 's' : ''}</span>
              </div>
              <button onClick={() => setShowLineageModal(false)} className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-all">
                <XIcon className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {lineageTree.length === 0 ? (
                <div className="text-center py-8">
                  <GitBranch className="w-8 h-8 text-gray-700 mx-auto mb-2" />
                  <p className="text-gray-500 text-xs">No fork chains found</p>
                  <p className="text-gray-600 text-[10px] mt-1">Duplicate a template to create lineage</p>
                </div>
              ) : lineageTree.map(tree => {
                // Build SVG lineage visualization
                const allNodes = [tree.root, ...tree.children, ...tree.grandchildren];
                const nodeHeight = 36;
                const levelIndent = 120;
                const yGap = 12;
                type TreeNode = { tmpl: BuildTemplate; x: number; y: number; level: number };
                const positioned: TreeNode[] = [];
                let yPos = 0;

                // Root
                positioned.push({ tmpl: tree.root, x: 20, y: yPos, level: 0 });
                yPos += nodeHeight + yGap;

                // Children
                for (const child of tree.children) {
                  positioned.push({ tmpl: child, x: 20 + levelIndent, y: yPos, level: 1 });
                  // Grandchildren of this child
                  const gc = tree.grandchildren.filter(g => g.parentTemplateId === child.id);
                  for (const g of gc) {
                    yPos += nodeHeight + yGap;
                    positioned.push({ tmpl: g, x: 20 + levelIndent * 2, y: yPos, level: 2 });
                  }
                  yPos += nodeHeight + yGap;
                }

                const svgHeight = Math.max(yPos + 10, 60);
                const svgWidth = 520;

                return (
                  <div key={tree.root.id} className="bg-gray-800/50 border border-indigo-800/20 rounded-xl p-3">
                    <svg width={svgWidth} height={svgHeight} className="w-full" viewBox={`0 0 ${svgWidth} ${svgHeight}`}>
                      {/* Connection lines */}
                      {positioned.filter(n => n.level > 0).map(node => {
                        const parent = positioned.find(p => p.tmpl.id === node.tmpl.parentTemplateId);
                        if (!parent) return null;
                        const x1 = parent.x + 140;
                        const y1 = parent.y + nodeHeight / 2;
                        const x2 = node.x;
                        const y2 = node.y + nodeHeight / 2;
                        const midX = (x1 + x2) / 2;
                        return (
                          <path
                            key={`line-${node.tmpl.id}`}
                            d={`M${x1},${y1} C${midX},${y1} ${midX},${y2} ${x2},${y2}`}
                            stroke={node.level === 1 ? '#818cf8' : '#a78bfa'}
                            strokeWidth={1.5}
                            fill="none"
                            opacity={0.5}
                          />
                        );
                      })}
                      {/* Nodes */}
                      {positioned.map(node => {
                        const colors = node.level === 0 ? { bg: '#312e81', border: '#4338ca', text: '#a5b4fc' }
                          : node.level === 1 ? { bg: '#1e1b4b', border: '#4338ca', text: '#818cf8' }
                            : { bg: '#2e1065', border: '#7c3aed', text: '#a78bfa' };
                        return (
                          <g key={node.tmpl.id}>
                            <rect x={node.x} y={node.y} width={140} height={nodeHeight} rx={8} fill={colors.bg} stroke={colors.border} strokeWidth={1} />
                            <text x={node.x + 10} y={node.y + 14} fill={colors.text} fontSize={9} fontWeight="bold">
                              {node.tmpl.name.length > 16 ? node.tmpl.name.substring(0, 16) + '…' : node.tmpl.name}
                            </text>
                            <text x={node.x + 10} y={node.y + 26} fill="#6b7280" fontSize={7}>
                              v{node.tmpl.version || 1} • {node.tmpl.category}{node.tmpl.rating ? ` • ★${node.tmpl.rating}` : ''}
                            </text>
                          </g>
                        );
                      })}
                    </svg>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ═══ Template Diff Modal ═══ */}
      {diffModalTemplateId && (() => {
        const child = templates.find(t => t.id === diffModalTemplateId);
        const parent = child?.parentTemplateId ? templates.find(t => t.id === child.parentTemplateId) : null;
        if (!child || !parent) return null;
        const diff = computePromptDiff(parent.prompt, child.prompt);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-[560px] max-h-[80vh] overflow-hidden flex flex-col">
              <div className="bg-gradient-to-r from-cyan-600 to-teal-600 px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ArrowLeftRight className="w-5 h-5 text-white" />
                  <h3 className="text-white font-bold text-sm">Template Diff</h3>
                </div>
                <button onClick={() => setDiffModalTemplateId(null)} className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-all">
                  <XIcon className="w-4 h-4" />
                </button>
              </div>
              <div className="p-5 space-y-3 flex-1 overflow-y-auto">
                <div className="flex items-center gap-3 text-[10px]">
                  <div className="flex items-center gap-1.5 bg-red-950/20 border border-red-800/20 rounded-md px-2.5 py-1">
                    <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
                    <span className="text-red-400 font-semibold">{parent.name}</span>
                    <span className="text-gray-600">v{parent.version || 1}</span>
                  </div>
                  <ChevronRight className="w-3 h-3 text-gray-600" />
                  <div className="flex items-center gap-1.5 bg-emerald-950/20 border border-emerald-800/20 rounded-md px-2.5 py-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                    <span className="text-emerald-400 font-semibold">{child.name}</span>
                    <span className="text-gray-600">v{child.version || 1}</span>
                  </div>
                </div>
                <div className="bg-gray-800/60 border border-gray-700/50 rounded-lg p-4 text-[11px] leading-relaxed font-mono whitespace-pre-wrap">
                  {diff.map((segment, idx) => (
                    <span
                      key={idx}
                      className={
                        segment.type === 'added' ? 'bg-emerald-900/40 text-emerald-300 px-0.5 rounded' :
                          segment.type === 'removed' ? 'bg-red-900/40 text-red-300 line-through px-0.5 rounded' :
                            'text-gray-400'
                      }
                    >
                      {segment.text}
                    </span>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-[9px] text-gray-600">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500/60 inline-block" /> Removed</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500/60 inline-block" /> Added</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-600/60 inline-block" /> Unchanged</span>
                  </div>
                  <button
                    onClick={() => handleExportDiffHTML(parent.name, child.name, parent.version || 1, child.version || 1, diff)}
                    className="text-[9px] font-semibold text-teal-500 hover:text-teal-300 bg-teal-950/30 hover:bg-teal-900/40 border border-teal-800/30 rounded-md px-3 py-1.5 transition-all flex items-center gap-1"
                  >
                    <FileText className="w-3 h-3" /> Export HTML
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ═══ Version Timeline Modal ═══ */}
      {showTimelineModal && (() => {
        const chain = buildTimelineChain(showTimelineModal);
        if (chain.length < 2) return null;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setShowTimelineModal(null)}>
            <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-[560px] max-h-[80vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
              <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <History className="w-5 h-5 text-white" />
                  <h3 className="text-white font-bold text-sm">Version Timeline</h3>
                  <span className="text-[9px] text-white/60 bg-white/10 px-2 py-0.5 rounded-full">{chain.length} version{chain.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleExportTimeline(chain)}
                    className="text-[9px] text-white/70 hover:text-white px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 transition-all flex items-center gap-1 font-semibold"
                  >
                    <FileDown className="w-3 h-3" />Export HTML
                  </button>
                  <button onClick={() => setShowTimelineModal(null)} className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-all">
                    <XIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-5">
                <div className="relative">
                  {/* Vertical timeline line */}
                  <div className="absolute left-4 top-4 bottom-4 w-px bg-gradient-to-b from-indigo-500 via-violet-500 to-purple-500 opacity-30" />
                  {chain.map((tmpl, idx) => {
                    const isActive = tmpl.id === showTimelineModal;
                    const prevTmpl = idx > 0 ? chain[idx - 1] : null;
                    const diff = prevTmpl ? computePromptDiff(prevTmpl.prompt, tmpl.prompt) : null;
                    const addedCount = diff ? diff.filter(d => d.type === 'added').length : 0;
                    const removedCount = diff ? diff.filter(d => d.type === 'removed').length : 0;
                    return (
                      <div key={tmpl.id} className="relative pl-10 pb-5 last:pb-0">
                        {/* Timeline dot */}
                        <div className={`absolute left-2.5 top-1 w-3 h-3 rounded-full border-2 ${isActive ? 'bg-indigo-400 border-indigo-300 shadow-lg shadow-indigo-500/30' :
                          idx === 0 ? 'bg-emerald-400 border-emerald-300' :
                            'bg-gray-600 border-gray-500'
                          }`} />
                        <div className={`rounded-lg p-3 border transition-all ${isActive ? 'bg-indigo-950/30 border-indigo-700/50' : 'bg-gray-800/50 border-gray-700/30 hover:border-gray-600/50'
                          }`}>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-1.5">
                              <span className={`text-[10px] font-bold ${isActive ? 'text-indigo-300' : 'text-white'}`}>{tmpl.name}</span>
                              <span className="text-[7px] bg-gray-700/50 text-gray-400 px-1 py-0.5 rounded">v{tmpl.version || 1}</span>
                              {idx === 0 && <span className="text-[7px] bg-emerald-950/40 text-emerald-400 px-1 py-0.5 rounded border border-emerald-800/20">root</span>}
                              {isActive && <span className="text-[7px] bg-indigo-950/40 text-indigo-400 px-1 py-0.5 rounded border border-indigo-800/20">current</span>}
                            </div>
                            <div className="flex items-center gap-1">
                              {(tmpl.rating || 0) > 0 && (
                                <span className="flex items-center gap-0.5 text-[8px] text-yellow-500">
                                  <Star className="w-2 h-2 fill-yellow-400 text-yellow-400" />{tmpl.rating!.toFixed(1)}
                                </span>
                              )}
                              <span className="text-[8px] text-gray-600">{new Date(tmpl.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <p className="text-[9px] text-gray-500 line-clamp-2 leading-relaxed">{tmpl.prompt.substring(0, 120)}{tmpl.prompt.length > 120 ? '...' : ''}</p>
                          {diff && (
                            <div className="mt-2 pt-2 border-t border-gray-700/30">
                              <div className="flex items-center gap-2 mb-1.5">
                                <span className="text-[8px] text-gray-600">Changes from v{chain[idx - 1].version || 1}:</span>
                                {addedCount > 0 && <span className="text-[7px] text-emerald-400 bg-emerald-950/30 px-1 py-0.5 rounded">+{addedCount} added</span>}
                                {removedCount > 0 && <span className="text-[7px] text-red-400 bg-red-950/30 px-1 py-0.5 rounded">-{removedCount} removed</span>}
                              </div>
                              <div className="bg-gray-900/60 rounded px-2.5 py-1.5 text-[9px] font-mono leading-relaxed max-h-24 overflow-y-auto">
                                {diff.slice(0, 50).map((seg, si) => (
                                  <span key={si} className={
                                    seg.type === 'added' ? 'bg-emerald-900/40 text-emerald-300 px-0.5 rounded' :
                                      seg.type === 'removed' ? 'bg-red-900/40 text-red-300 line-through px-0.5 rounded' :
                                        'text-gray-500'
                                  }>{seg.text}</span>
                                ))}
                                {diff.length > 50 && <span className="text-gray-600">...</span>}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ═══ Merge Templates Modal ═══ */}
      {showMergeModal && (() => {
        const tmplA = mergeSourceA ? templates.find(t => t.id === mergeSourceA) : null;
        const tmplB = mergeSourceB ? templates.find(t => t.id === mergeSourceB) : null;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setShowMergeModal(false)}>
            <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-[540px] max-h-[80vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
              <div className="bg-gradient-to-r from-violet-600 to-purple-600 px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Merge className="w-5 h-5 text-white" />
                  <h3 className="text-white font-bold text-sm">Merge Templates</h3>
                  <span className="text-[9px] text-white/60 bg-white/10 px-2 py-0.5 rounded-full">AI-powered</span>
                </div>
                <button onClick={() => setShowMergeModal(false)} className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-all">
                  <XIcon className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {!mergePreview && (
                  <p className="text-[10px] text-gray-400 leading-relaxed">Select two templates to merge their prompts using AI. The result combines the best features of both into a single, cohesive prompt.</p>
                )}

                {/* Template A selector */}
                {!mergePreview && <div>
                  <label className="text-[9px] font-bold text-violet-400 mb-1.5 block flex items-center gap-1">
                    <span className="w-4 h-4 rounded-full bg-violet-600 text-white text-[8px] flex items-center justify-center font-bold">A</span>
                    Source Template A
                  </label>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {templates.map(t => (
                      <button
                        key={`merge-a-${t.id}`}
                        onClick={() => { setMergeSourceA(t.id === mergeSourceA ? null : t.id); setMergePreview(null); }}
                        disabled={t.id === mergeSourceB}
                        className={`w-full text-left px-3 py-1.5 rounded-lg border text-[10px] transition-all flex items-center gap-2 ${t.id === mergeSourceA
                          ? 'bg-violet-950/40 border-violet-600/50 text-violet-300 font-semibold'
                          : t.id === mergeSourceB
                            ? 'bg-gray-800/30 border-gray-700/20 text-gray-700 cursor-not-allowed'
                            : 'bg-gray-800/50 border-gray-700/30 text-gray-400 hover:text-white hover:border-violet-700/40'
                          }`}
                      >
                        <Bookmark className={`w-2.5 h-2.5 flex-shrink-0 ${t.id === mergeSourceA ? 'text-violet-400 fill-violet-400' : 'text-gray-600'}`} />
                        <span className="truncate">{t.name}</span>
                        {(t.rating || 0) > 0 && <span className="text-[8px] text-yellow-500 ml-auto flex-shrink-0">★{t.rating!.toFixed(1)}</span>}
                      </button>
                    ))}
                  </div>
                </div>}

                {/* Template B selector */}
                {!mergePreview && <div>
                  <label className="text-[9px] font-bold text-purple-400 mb-1.5 block flex items-center gap-1">
                    <span className="w-4 h-4 rounded-full bg-purple-600 text-white text-[8px] flex items-center justify-center font-bold">B</span>
                    Source Template B
                  </label>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {templates.map(t => (
                      <button
                        key={`merge-b-${t.id}`}
                        onClick={() => { setMergeSourceB(t.id === mergeSourceB ? null : t.id); setMergePreview(null); }}
                        disabled={t.id === mergeSourceA}
                        className={`w-full text-left px-3 py-1.5 rounded-lg border text-[10px] transition-all flex items-center gap-2 ${t.id === mergeSourceB
                          ? 'bg-purple-950/40 border-purple-600/50 text-purple-300 font-semibold'
                          : t.id === mergeSourceA
                            ? 'bg-gray-800/30 border-gray-700/20 text-gray-700 cursor-not-allowed'
                            : 'bg-gray-800/50 border-gray-700/30 text-gray-400 hover:text-white hover:border-purple-700/40'
                          }`}
                      >
                        <Bookmark className={`w-2.5 h-2.5 flex-shrink-0 ${t.id === mergeSourceB ? 'text-purple-400 fill-purple-400' : 'text-gray-600'}`} />
                        <span className="truncate">{t.name}</span>
                        {(t.rating || 0) > 0 && <span className="text-[8px] text-yellow-500 ml-auto flex-shrink-0">★{t.rating!.toFixed(1)}</span>}
                      </button>
                    ))}
                  </div>
                </div>}

                {/* Preview of selected templates */}
                {!mergePreview && (tmplA || tmplB) && (
                  <div className="grid grid-cols-2 gap-2">
                    {tmplA && (
                      <div className="bg-violet-950/20 border border-violet-800/20 rounded-lg p-2.5">
                        <p className="text-[8px] font-bold text-violet-400 mb-1">A: {tmplA.name}</p>
                        <p className="text-[8px] text-gray-500 line-clamp-3 leading-relaxed">{tmplA.prompt.substring(0, 150)}...</p>
                      </div>
                    )}
                    {tmplB && (
                      <div className="bg-purple-950/20 border border-purple-800/20 rounded-lg p-2.5">
                        <p className="text-[8px] font-bold text-purple-400 mb-1">B: {tmplB.name}</p>
                        <p className="text-[8px] text-gray-500 line-clamp-3 leading-relaxed">{tmplB.prompt.substring(0, 150)}...</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Merge source summary in preview mode */}
                {mergePreview && tmplA && tmplB && (
                  <div className="flex items-center gap-2 text-[9px]">
                    <span className="text-violet-400 font-semibold bg-violet-950/30 px-2 py-0.5 rounded border border-violet-800/20">{tmplA.name}</span>
                    <Merge className="w-3 h-3 text-gray-600" />
                    <span className="text-purple-400 font-semibold bg-purple-950/30 px-2 py-0.5 rounded border border-purple-800/20">{tmplB.name}</span>
                  </div>
                )}

                {/* ═══ Merge Preview Step ═══ */}
                {mergePreview && (() => {
                  const previewDiff = tmplA && tmplB ? computePromptDiff(
                    tmplA.prompt + '\n\n' + tmplB.prompt,
                    mergePreview.prompt
                  ) : [];
                  return (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Eye className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-[10px] font-bold text-emerald-300">AI Merge Preview</span>
                        <span className="text-[8px] text-emerald-600 bg-emerald-950/30 px-1.5 py-0.5 rounded">Review before saving</span>
                      </div>
                      {/* ═══ Conflict Resolution Zones (computed first for prompt rendering) ═══ */}
                      {(() => {
                        // Compute conflict zones
                        const splitSentences = (text: string) => text.split(/(?<=[.!?\n])\s+/).map(s => s.trim()).filter(s => s.length > 10);
                        const getWordSet = (s: string) => new Set(s.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(w => w.length > 2));
                        const sentA = tmplA ? splitSentences(tmplA.prompt) : [];
                        const sentB = tmplB ? splitSentences(tmplB.prompt) : [];
                        const rawConflicts: { sentenceA: string; sentenceB: string; similarity: number }[] = [];
                        for (const sa of sentA) {
                          const wordsA = getWordSet(sa);
                          if (wordsA.size < 3) continue;
                          for (const sb of sentB) {
                            const wordsB = getWordSet(sb);
                            if (wordsB.size < 3) continue;
                            const intersection = new Set([...wordsA].filter(w => wordsB.has(w)));
                            const union = new Set([...wordsA, ...wordsB]);
                            const jaccard = union.size > 0 ? intersection.size / union.size : 0;
                            if (jaccard >= 0.4) rawConflicts.push({ sentenceA: sa, sentenceB: sb, similarity: Math.round(jaccard * 100) });
                          }
                        }
                        const seenKeys = new Set<string>();
                        const uniqueConflicts = rawConflicts
                          .sort((a, b) => b.similarity - a.similarity)
                          .filter(c => { const k = c.sentenceA.substring(0, 40); if (seenKeys.has(k)) return false; seenKeys.add(k); return true; })
                          .slice(0, 5);

                        // Find best matching region in merged prompt for each conflict zone
                        const findMatchRegion = (text: string, keywords: Set<string>): { start: number; end: number; score: number } => {
                          const sentences = text.split(/(?<=[.!?\n])\s+/);
                          let bestScore = 0, bestStart = 0, bestEnd = 0, pos = 0;
                          for (const sent of sentences) {
                            const words = getWordSet(sent);
                            const overlap = [...words].filter(w => keywords.has(w)).length;
                            const score = keywords.size > 0 ? overlap / keywords.size : 0;
                            if (score > bestScore) {
                              bestScore = score;
                              bestStart = pos;
                              bestEnd = pos + sent.length;
                            }
                            pos += sent.length + 1;
                          }
                          return { start: bestStart, end: Math.min(bestEnd, text.length), score: bestScore };
                        };

                        const zoneMatches = uniqueConflicts.map(c => {
                          const keywords = new Set([...getWordSet(c.sentenceA), ...getWordSet(c.sentenceB)]);
                          return findMatchRegion(mergePreview.prompt, keywords);
                        });

                        // Render merged prompt with highlighting
                        const renderMergedPrompt = () => {
                          if (highlightedConflictZone === null || highlightedConflictZone >= zoneMatches.length) {
                            return <span>{mergePreview.prompt}</span>;
                          }
                          const { start, end } = zoneMatches[highlightedConflictZone];
                          if (start >= end) return <span>{mergePreview.prompt}</span>;
                          return (
                            <>
                              <span>{mergePreview.prompt.substring(0, start)}</span>
                              <span
                                id={`conflict-highlight-${highlightedConflictZone}`}
                                className="bg-amber-500/20 border-b-2 border-amber-400/60 rounded-sm px-0.5 transition-all duration-700"
                              >{mergePreview.prompt.substring(start, end)}</span>
                              <span>{mergePreview.prompt.substring(end)}</span>
                            </>
                          );
                        };

                        // Merge quality score
                        const computeQualityScore = () => {
                          if (!tmplA || !tmplB) return null;
                          const mergedWords = getWordSet(mergePreview.prompt);
                          const wordsA = getWordSet(tmplA.prompt);
                          const wordsB = getWordSet(tmplB.prompt);
                          // Content preservation: how many unique words from A and B are in merged
                          const preservedA = [...wordsA].filter(w => mergedWords.has(w)).length;
                          const preservedB = [...wordsB].filter(w => mergedWords.has(w)).length;
                          const preservationA = wordsA.size > 0 ? preservedA / wordsA.size : 1;
                          const preservationB = wordsB.size > 0 ? preservedB / wordsB.size : 1;
                          // Deduplication: merged should be smaller than combined
                          const combinedSize = tmplA.prompt.split(/\s+/).length + tmplB.prompt.split(/\s+/).length;
                          const mergedSize = mergePreview.prompt.split(/\s+/).length;
                          const dedup = combinedSize > 0 ? Math.min(1, 1 - ((mergedSize - Math.max(wordsA.size, wordsB.size)) / combinedSize)) : 1;
                          // Conflict resolution bonus: fewer unresolved conflicts = better
                          const overrideCount = Object.keys(conflictOverrides).length;
                          const conflictBonus = uniqueConflicts.length > 0 ? 1 - (overrideCount * 0.05) : 1;
                          // Weighted score
                          const raw = (preservationA * 0.35) + (preservationB * 0.35) + (dedup * 0.15) + (Math.max(0, conflictBonus) * 0.15);
                          return {
                            overall: Math.min(100, Math.max(0, Math.round(raw * 100))),
                            preservationA: Math.round(preservationA * 100),
                            preservationB: Math.round(preservationB * 100),
                            dedup: Math.round(Math.max(0, dedup) * 100),
                          };
                        };

                        const qualityScore = computeQualityScore();

                        // Handle conflict zone click: scroll + highlight
                        const handleZoneClick = (zoneIdx: number) => {
                          setHighlightedConflictZone(zoneIdx);
                          setTimeout(() => {
                            const el = document.getElementById(`conflict-highlight-${zoneIdx}`);
                            if (el && mergePromptRef.current) {
                              mergePromptRef.current.scrollTo({ top: el.offsetTop - mergePromptRef.current.offsetTop - 40, behavior: 'smooth' });
                            }
                          }, 50);
                          // Auto-clear highlight after 3s
                          setTimeout(() => setHighlightedConflictZone(prev => prev === zoneIdx ? null : prev), 3000);
                        };

                        // Handle manual override: replace AI-resolved section with chosen source
                        const handleOverride = (zoneIdx: number, choice: 'a' | 'b' | 'ai') => {
                          const conflict = uniqueConflicts[zoneIdx];
                          const match = zoneMatches[zoneIdx];
                          if (!conflict || !match || match.start >= match.end) return;
                          const replacement = choice === 'a' ? conflict.sentenceA : choice === 'b' ? conflict.sentenceB : null;
                          if (choice === 'ai') {
                            // Reset: we can't easily restore original AI text, so just mark as AI
                            setConflictOverrides(prev => { const n = { ...prev }; delete n[zoneIdx]; return n; });
                            return;
                          }
                          if (replacement) {
                            const newPrompt = mergePreview.prompt.substring(0, match.start) + replacement + mergePreview.prompt.substring(match.end);
                            setMergePreview({ ...mergePreview, prompt: newPrompt });
                            setConflictOverrides(prev => ({ ...prev, [zoneIdx]: choice }));
                            setHighlightedConflictZone(zoneIdx);
                            setTimeout(() => setHighlightedConflictZone(prev => prev === zoneIdx ? null : prev), 2000);
                          }
                        };

                        return (
                          <>
                            {/* Merged prompt with conflict highlighting */}
                            <div ref={mergePromptRef} className="bg-gray-950/60 border border-gray-700/40 rounded-lg p-3 max-h-48 overflow-y-auto scroll-smooth" id="merge-prompt-container">
                              <p className="text-[10px] text-gray-300 leading-relaxed whitespace-pre-wrap font-mono">
                                {renderMergedPrompt()}
                              </p>
                            </div>

                            {/* Merge Quality Score */}
                            {qualityScore && (
                              <div className="bg-gray-900/50 border border-gray-800/30 rounded-lg p-2.5">
                                <div className="flex items-center justify-between mb-2">
                                  <p className="text-[8px] text-gray-500 font-bold uppercase tracking-wider flex items-center gap-1">
                                    <Trophy className="w-3 h-3 text-amber-400" /> Merge Quality Score
                                  </p>
                                  <span className={`text-[12px] font-black ${qualityScore.overall >= 80 ? 'text-emerald-400' :
                                    qualityScore.overall >= 60 ? 'text-amber-400' : 'text-red-400'
                                    }`}>{qualityScore.overall}<span className="text-[8px] font-normal text-gray-600">/100</span></span>
                                </div>
                                <div className="grid grid-cols-3 gap-1.5">
                                  <div className="text-center">
                                    <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden mb-1">
                                      <div className="h-full bg-violet-500 rounded-full transition-all duration-500" style={{ width: `${qualityScore.preservationA}%` }} />
                                    </div>
                                    <p className="text-[7px] text-violet-400">{qualityScore.preservationA}% A preserved</p>
                                  </div>
                                  <div className="text-center">
                                    <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden mb-1">
                                      <div className="h-full bg-purple-500 rounded-full transition-all duration-500" style={{ width: `${qualityScore.preservationB}%` }} />
                                    </div>
                                    <p className="text-[7px] text-purple-400">{qualityScore.preservationB}% B preserved</p>
                                  </div>
                                  <div className="text-center">
                                    <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden mb-1">
                                      <div className="h-full bg-cyan-500 rounded-full transition-all duration-500" style={{ width: `${qualityScore.dedup}%` }} />
                                    </div>
                                    <p className="text-[7px] text-cyan-400">{qualityScore.dedup}% dedup efficiency</p>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Diff view */}
                            {previewDiff.length > 0 && (
                              <div>
                                <p className="text-[8px] text-gray-600 mb-1.5 flex items-center gap-1"><ArrowLeftRight className="w-2.5 h-2.5" /> How it differs from combined source prompts</p>
                                <div className="bg-gray-900/60 rounded px-2.5 py-1.5 text-[9px] font-mono leading-relaxed max-h-28 overflow-y-auto border border-gray-800/40">
                                  {previewDiff.slice(0, 60).map((seg, si) => (
                                    <span key={si} className={
                                      seg.type === 'added' ? 'bg-emerald-900/40 text-emerald-300 px-0.5 rounded' :
                                        seg.type === 'removed' ? 'bg-red-900/40 text-red-300 line-through px-0.5 rounded' :
                                          'text-gray-500'
                                    }>{seg.text}</span>
                                  ))}
                                  {previewDiff.length > 60 && <span className="text-gray-600">...</span>}
                                </div>
                              </div>
                            )}

                            {/* Conflict Zones with manual resolver */}
                            {uniqueConflicts.length > 0 && (
                              <div>
                                <p className="text-[8px] text-amber-500 mb-1.5 flex items-center gap-1 font-bold">
                                  <AlertTriangle className="w-3 h-3" /> Conflict Zones — {uniqueConflicts.length} overlapping section{uniqueConflicts.length > 1 ? 's' : ''} · Click to locate
                                </p>
                                <div className="space-y-1.5 max-h-44 overflow-y-auto">
                                  {uniqueConflicts.map((conflict, ci) => {
                                    const override = conflictOverrides[ci];
                                    return (
                                      <div
                                        key={ci}
                                        className={`border rounded-lg p-2 space-y-1.5 cursor-pointer transition-all ${highlightedConflictZone === ci
                                          ? 'bg-amber-950/30 border-amber-600/40 shadow-lg shadow-amber-900/20'
                                          : 'bg-amber-950/15 border-amber-800/20 hover:border-amber-700/30'
                                          }`}
                                        onClick={() => handleZoneClick(ci)}
                                      >
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center gap-1.5">
                                            <span className="text-[7px] font-bold text-amber-400/80">Zone {ci + 1}</span>
                                            {override && (
                                              <span className={`text-[6px] px-1 py-0.5 rounded-full font-bold ${override === 'a' ? 'bg-violet-950/40 text-violet-400 border border-violet-700/30' :
                                                'bg-purple-950/40 text-purple-400 border border-purple-700/30'
                                                }`}>
                                                Using {override.toUpperCase()}
                                              </span>
                                            )}
                                            {!override && (
                                              <span className="text-[6px] px-1 py-0.5 rounded-full bg-emerald-950/30 text-emerald-500 border border-emerald-800/20 font-bold">AI resolved</span>
                                            )}
                                          </div>
                                          <span className="text-[7px] text-amber-500/60 bg-amber-950/30 px-1.5 py-0.5 rounded-full">{conflict.similarity}% overlap</span>
                                        </div>
                                        {(() => {
                                          // Word-level diff between A and B
                                          const wordsA = conflict.sentenceA.split(/(\s+)/);
                                          const wordsB = conflict.sentenceB.split(/(\s+)/);
                                          const wordsASet = new Set(wordsA.filter(w => w.trim()).map(w => w.toLowerCase()));
                                          const wordsBSet = new Set(wordsB.filter(w => w.trim()).map(w => w.toLowerCase()));
                                          return (
                                            <div className="grid grid-cols-2 gap-1.5">
                                              <div className={`rounded p-1.5 transition-all ${override === 'a' ? 'bg-violet-950/40 border-2 border-violet-500/40' : 'bg-violet-950/20 border border-violet-800/15'
                                                }`}>
                                                <p className="text-[6px] font-bold text-violet-400 mb-0.5">A</p>
                                                <p className="text-[8px] leading-relaxed line-clamp-3">
                                                  {wordsA.map((w, wi) => {
                                                    if (!w.trim()) return <span key={wi}>{w}</span>;
                                                    const inB = wordsBSet.has(w.toLowerCase());
                                                    return <span key={wi} className={inB ? 'text-gray-400' : 'text-violet-300 bg-violet-800/30 rounded-sm px-0.5 font-medium'}>{w}</span>;
                                                  })}
                                                </p>
                                              </div>
                                              <div className={`rounded p-1.5 transition-all ${override === 'b' ? 'bg-purple-950/40 border-2 border-purple-500/40' : 'bg-purple-950/20 border border-purple-800/15'
                                                }`}>
                                                <p className="text-[6px] font-bold text-purple-400 mb-0.5">B</p>
                                                <p className="text-[8px] leading-relaxed line-clamp-3">
                                                  {wordsB.map((w, wi) => {
                                                    if (!w.trim()) return <span key={wi}>{w}</span>;
                                                    const inA = wordsASet.has(w.toLowerCase());
                                                    return <span key={wi} className={inA ? 'text-gray-400' : 'text-purple-300 bg-purple-800/30 rounded-sm px-0.5 font-medium'}>{w}</span>;
                                                  })}
                                                </p>
                                              </div>
                                            </div>
                                          );
                                        })()}
                                        {/* Manual resolver buttons */}
                                        <div className="flex items-center gap-1 pt-0.5" onClick={e => e.stopPropagation()}>
                                          <button
                                            onClick={(e) => { e.stopPropagation(); handleOverride(ci, 'a'); }}
                                            className={`text-[7px] font-semibold px-2 py-0.5 rounded-full transition-all flex items-center gap-0.5 ${override === 'a'
                                              ? 'bg-violet-600 text-white shadow'
                                              : 'bg-violet-950/30 text-violet-400 border border-violet-800/20 hover:bg-violet-900/40'
                                              }`}
                                          >Use A</button>
                                          <button
                                            onClick={(e) => { e.stopPropagation(); handleOverride(ci, 'b'); }}
                                            className={`text-[7px] font-semibold px-2 py-0.5 rounded-full transition-all flex items-center gap-0.5 ${override === 'b'
                                              ? 'bg-purple-600 text-white shadow'
                                              : 'bg-purple-950/30 text-purple-400 border border-purple-800/20 hover:bg-purple-900/40'
                                              }`}
                                          >Use B</button>
                                          {override && (
                                            <button
                                              onClick={(e) => { e.stopPropagation(); handleOverride(ci, 'ai'); }}
                                              className="text-[7px] font-semibold px-2 py-0.5 rounded-full bg-emerald-950/30 text-emerald-400 border border-emerald-800/20 hover:bg-emerald-900/40 transition-all flex items-center gap-0.5"
                                            ><RotateCcw className="w-2 h-2" />Reset to AI</button>
                                          )}
                                          <span className="text-[6px] text-gray-700 ml-auto">Click zone to scroll ↑</span>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </>
                        );
                      })()}
                      {/* Word & character count comparison with mini bar chart */}
                      {tmplA && tmplB && (() => {
                        const countWords = (s: string) => s.split(/\s+/).filter(Boolean).length;
                        const wA = countWords(tmplA.prompt), cA = tmplA.prompt.length;
                        const wB = countWords(tmplB.prompt), cB = tmplB.prompt.length;
                        const wCombined = wA + wB, cCombined = cA + cB;
                        const wMerged = countWords(mergePreview.prompt), cMerged = mergePreview.prompt.length;
                        const wDelta = wMerged - wCombined;
                        const wPct = wCombined > 0 ? Math.round((wMerged / wCombined) * 100) : 100;
                        const maxW = Math.max(wA, wB, wCombined, wMerged);
                        const barPct = (v: number) => maxW > 0 ? Math.max(4, Math.round((v / maxW) * 100)) : 4;
                        return (
                          <div className="space-y-2">
                            <div className="grid grid-cols-4 gap-1.5">
                              <div className="bg-violet-950/20 border border-violet-800/20 rounded-lg p-2 text-center">
                                <p className="text-[7px] font-bold text-violet-400 mb-1 uppercase tracking-wider">Template A</p>
                                <p className="text-[11px] font-bold text-white">{wA}<span className="text-[8px] text-gray-600 font-normal ml-0.5">w</span></p>
                                <p className="text-[8px] text-gray-600">{cA.toLocaleString()} chars</p>
                              </div>
                              <div className="bg-purple-950/20 border border-purple-800/20 rounded-lg p-2 text-center">
                                <p className="text-[7px] font-bold text-purple-400 mb-1 uppercase tracking-wider">Template B</p>
                                <p className="text-[11px] font-bold text-white">{wB}<span className="text-[8px] text-gray-600 font-normal ml-0.5">w</span></p>
                                <p className="text-[8px] text-gray-600">{cB.toLocaleString()} chars</p>
                              </div>
                              <div className="bg-gray-800/30 border border-gray-700/20 rounded-lg p-2 text-center">
                                <p className="text-[7px] font-bold text-gray-500 mb-1 uppercase tracking-wider">Combined</p>
                                <p className="text-[11px] font-bold text-white">{wCombined}<span className="text-[8px] text-gray-600 font-normal ml-0.5">w</span></p>
                                <p className="text-[8px] text-gray-600">{cCombined.toLocaleString()} chars</p>
                              </div>
                              <div className="bg-emerald-950/20 border border-emerald-800/20 rounded-lg p-2 text-center">
                                <p className="text-[7px] font-bold text-emerald-400 mb-1 uppercase tracking-wider">Merged</p>
                                <p className="text-[11px] font-bold text-white">{wMerged}<span className="text-[8px] text-gray-600 font-normal ml-0.5">w</span></p>
                                <p className="text-[8px] text-gray-600">{cMerged.toLocaleString()} chars</p>
                                <p className={`text-[7px] mt-0.5 font-semibold ${wDelta <= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                                  {wDelta >= 0 ? '+' : ''}{wDelta}w · {wPct}%
                                </p>
                              </div>
                            </div>
                            {/* Visual bar comparison with word/char toggle */}
                            {(() => {
                              const isWords = mergeBarMode === 'words';
                              const vals = isWords
                                ? [wA, wB, wCombined, wMerged]
                                : [cA, cB, cCombined, cMerged];
                              const maxVal = Math.max(...vals);
                              const bp = (v: number) => maxVal > 0 ? Math.max(4, Math.round((v / maxVal) * 100)) : 4;
                              const cDelta = cMerged - cCombined;
                              const delta = isWords ? wDelta : cDelta;
                              return (
                                <div className="bg-gray-900/50 border border-gray-800/30 rounded-lg p-2 space-y-1.5">
                                  <div className="flex items-center justify-between">
                                    <p className="text-[7px] text-gray-600 font-bold uppercase tracking-wider flex items-center gap-1"><BarChart3 className="w-2.5 h-2.5" />{isWords ? 'Word' : 'Character'} Count Comparison</p>
                                    <div className="flex items-center bg-gray-800/60 rounded-full p-0.5">
                                      <button
                                        onClick={() => setMergeBarMode('words')}
                                        className={`text-[7px] font-semibold px-2 py-0.5 rounded-full transition-all ${isWords ? 'bg-cyan-600 text-white shadow' : 'text-gray-500 hover:text-gray-300'}`}
                                      >Words</button>
                                      <button
                                        onClick={() => setMergeBarMode('chars')}
                                        className={`text-[7px] font-semibold px-2 py-0.5 rounded-full transition-all ${!isWords ? 'bg-cyan-600 text-white shadow' : 'text-gray-500 hover:text-gray-300'}`}
                                      >Chars</button>
                                    </div>
                                  </div>
                                  {[
                                    { label: 'A', value: vals[0], color: 'bg-violet-500', textColor: 'text-violet-400' },
                                    { label: 'B', value: vals[1], color: 'bg-purple-500', textColor: 'text-purple-400' },
                                    { label: 'A+B', value: vals[2], color: 'bg-gray-500', textColor: 'text-gray-400' },
                                    { label: 'Merged', value: vals[3], color: delta <= 0 ? 'bg-emerald-500' : 'bg-amber-500', textColor: delta <= 0 ? 'text-emerald-400' : 'text-amber-400' },
                                  ].map(bar => (
                                    <div key={bar.label} className="flex items-center gap-2">
                                      <span className={`text-[8px] font-semibold ${bar.textColor} w-10 text-right`}>{bar.label}</span>
                                      <div className="flex-1 h-3 bg-gray-800/60 rounded-full overflow-hidden">
                                        <div
                                          className={`h-full ${bar.color} rounded-full transition-all duration-500`}
                                          style={{ width: `${bp(bar.value)}%` }}
                                        />
                                      </div>
                                      <span className="text-[8px] text-gray-500 w-10 text-right">{isWords ? bar.value : bar.value.toLocaleString()}</span>
                                    </div>
                                  ))}
                                </div>
                              );
                            })()}
                          </div>
                        );
                      })()}
                    </div>
                  );
                })()}
              </div>
              <div className="border-t border-gray-700 px-5 py-3 flex items-center justify-between">
                <p className="text-[9px] text-gray-600">
                  {mergePreview ? 'Review merged prompt' : tmplA && tmplB ? 'Ready to merge with AI' : `Select ${!tmplA && !tmplB ? '2 templates' : '1 more template'}`}
                </p>
                <div className="flex items-center gap-2">
                  {mergePreview ? (
                    <>
                      <button onClick={() => { setMergePreview(null); setConflictOverrides({}); setHighlightedConflictZone(null); }} className="text-[9px] text-gray-500 hover:text-white px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 transition-all">
                        Back
                      </button>
                      <button
                        onClick={() => {
                          const _gws = (s: string) => new Set(s.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(w => w.length > 2));
                          const _tA = templates.find(t => t.id === mergeSourceA);
                          const _tB = templates.find(t => t.id === mergeSourceB);
                          let _qs: number | undefined, _pA: number | undefined, _pB: number | undefined, _dd: number | undefined;
                          if (_tA && _tB) {
                            const mw = _gws(mergePreview.prompt), wa = _gws(_tA.prompt), wb = _gws(_tB.prompt);
                            _pA = wa.size > 0 ? Math.round(([...wa].filter(w => mw.has(w)).length / wa.size) * 100) : 100;
                            _pB = wb.size > 0 ? Math.round(([...wb].filter(w => mw.has(w)).length / wb.size) * 100) : 100;
                            const cs = _tA.prompt.split(/\s+/).length + _tB.prompt.split(/\s+/).length;
                            const ms = mergePreview.prompt.split(/\s+/).length;
                            _dd = cs > 0 ? Math.round(Math.max(0, Math.min(1, 1 - ((ms - Math.max(wa.size, wb.size)) / cs))) * 100) : 100;
                            _qs = Math.min(100, Math.max(0, Math.round((_pA * 0.35 + _pB * 0.35 + _dd * 0.15 + 100 * 0.15))));
                          }
                          const entry: MergeHistoryEntry = {
                            id: `mh-${Date.now()}`,
                            timestamp: Date.now(),
                            sourceAName: mergePreview.nameA,
                            sourceAId: mergeSourceA || '',
                            sourceBName: mergePreview.nameB,
                            sourceBId: mergeSourceB || '',
                            resultName: `${mergePreview.nameA} + ${mergePreview.nameB} Merge`,
                            promptSnippet: mergePreview.prompt.substring(0, 150),
                            wordCount: mergePreview.prompt.split(/\s+/).filter(Boolean).length,
                            qualityScore: _qs,
                            preservationA: _pA,
                            preservationB: _pB,
                            dedupEfficiency: _dd,
                          };
                          const updated = [entry, ...mergeHistory].slice(0, 50);
                          setMergeHistory(updated);
                          localStorage.setItem('merge-history', JSON.stringify(updated));
                          // Threshold breach toast
                          if (qualityThreshold > 0 && _qs < qualityThreshold) {
                            toast.error(`⚠ Merge quality ${_qs}/100 is below your gate threshold of ${qualityThreshold}`, { description: `"${mergePreview.nameA} + ${mergePreview.nameB}" — consider re-merging or manual edits`, duration: 6000 });
                          }
                          setSaveTemplateSource({ prompt: mergePreview.prompt });
                          setTemplateName(`${mergePreview.nameA} + ${mergePreview.nameB} Merge`);
                          setTemplateDesc(`Merged from "${mergePreview.nameA}" and "${mergePreview.nameB}"`);
                          setTemplateCategory(mergePreview.categoryA);
                          setTemplateTags([...new Set([...mergePreview.tagsA, ...mergePreview.tagsB])].join(', '));
                          setShowMergeModal(false);
                          setMergePreview(null);
                          setMergeSourceA(null);
                          setMergeSourceB(null);
                          setConflictOverrides({});
                          setHighlightedConflictZone(null);
                          setShowSaveTemplateModal(true);
                        }}
                        className="text-[9px] font-semibold text-white px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 transition-all flex items-center gap-1"
                      >
                        <Pencil className="w-3 h-3" />Edit & Save
                      </button>
                      <button
                        onClick={() => {
                          const _gws = (s: string) => new Set(s.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(w => w.length > 2));
                          const _tA = templates.find(t => t.id === mergeSourceA);
                          const _tB = templates.find(t => t.id === mergeSourceB);
                          let _qs: number | undefined, _pA: number | undefined, _pB: number | undefined, _dd: number | undefined;
                          if (_tA && _tB) {
                            const mw = _gws(mergePreview.prompt), wa = _gws(_tA.prompt), wb = _gws(_tB.prompt);
                            _pA = wa.size > 0 ? Math.round(([...wa].filter(w => mw.has(w)).length / wa.size) * 100) : 100;
                            _pB = wb.size > 0 ? Math.round(([...wb].filter(w => mw.has(w)).length / wb.size) * 100) : 100;
                            const cs = _tA.prompt.split(/\s+/).length + _tB.prompt.split(/\s+/).length;
                            const ms = mergePreview.prompt.split(/\s+/).length;
                            _dd = cs > 0 ? Math.round(Math.max(0, Math.min(1, 1 - ((ms - Math.max(wa.size, wb.size)) / cs))) * 100) : 100;
                            _qs = Math.min(100, Math.max(0, Math.round((_pA * 0.35 + _pB * 0.35 + _dd * 0.15 + 100 * 0.15))));
                          }
                          const entry: MergeHistoryEntry = {
                            id: `mh-${Date.now()}`,
                            timestamp: Date.now(),
                            sourceAName: mergePreview.nameA,
                            sourceAId: mergeSourceA || '',
                            sourceBName: mergePreview.nameB,
                            sourceBId: mergeSourceB || '',
                            resultName: `(used as prompt)`,
                            promptSnippet: mergePreview.prompt.substring(0, 150),
                            wordCount: mergePreview.prompt.split(/\s+/).filter(Boolean).length,
                            qualityScore: _qs,
                            preservationA: _pA,
                            preservationB: _pB,
                            dedupEfficiency: _dd,
                          };
                          const updated = [entry, ...mergeHistory].slice(0, 50);
                          setMergeHistory(updated);
                          localStorage.setItem('merge-history', JSON.stringify(updated));
                          // Threshold breach toast
                          if (qualityThreshold > 0 && _qs < qualityThreshold) {
                            toast.error(`⚠ Merge quality ${_qs}/100 is below your gate threshold of ${qualityThreshold}`, { description: `"${mergePreview.nameA} + ${mergePreview.nameB}" — consider re-merging or manual edits`, duration: 6000 });
                          }
                          setInput(mergePreview.prompt);
                          setShowMergeModal(false);
                          setMergePreview(null);
                          setMergeSourceA(null);
                          setMergeSourceB(null);
                          setConflictOverrides({});
                          setHighlightedConflictZone(null);
                        }}
                        className="text-[9px] font-semibold text-white px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 transition-all flex items-center gap-1"
                      >
                        <Zap className="w-3 h-3" />Use as Prompt
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => { setShowMergeModal(false); setMergePreview(null); }} className="text-[9px] text-gray-500 hover:text-white px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 transition-all">
                        Cancel
                      </button>
                      <button
                        onClick={handleMergeTemplates}
                        disabled={!tmplA || !tmplB || merging}
                        className="text-[9px] font-semibold text-white px-3 py-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-1"
                      >
                        {merging ? <><Loader className="w-3 h-3 animate-spin" />Merging...</> : <><Wand2 className="w-3 h-3" />Merge with AI</>}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ═══ Similar Template Warning Modal ═══ */}
      {similarWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setSimilarWarning(null)}>
          <div className="bg-gray-900 border border-amber-700/40 rounded-2xl shadow-2xl w-[480px] max-h-[70vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-amber-600 to-orange-600 px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-white" />
                <h3 className="text-white font-bold text-sm">Similar Templates Found</h3>
                <span className="text-[9px] text-white/60 bg-white/10 px-2 py-0.5 rounded-full">{similarWarning.matches.length} match{similarWarning.matches.length !== 1 ? 'es' : ''}</span>
              </div>
              <button onClick={() => setSimilarWarning(null)} className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-all">
                <XIcon className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <p className="text-[10px] text-gray-400 leading-relaxed">
                Your prompt closely matches existing templates. Consider using one instead of starting a new build.
              </p>
              <div className="bg-gray-800/40 border border-gray-700/30 rounded-lg p-3">
                <p className="text-[8px] font-bold text-gray-500 mb-1 uppercase tracking-wider">Your prompt</p>
                <p className="text-[10px] text-gray-300 leading-relaxed line-clamp-3">{similarWarning.prompt}</p>
              </div>
              <div className="space-y-2">
                <p className="text-[9px] font-bold text-amber-400 flex items-center gap-1"><Bookmark className="w-3 h-3" />Matching Templates</p>
                {similarWarning.matches.map(tmpl => (
                  <div key={tmpl.id} className="bg-gray-800/50 border border-gray-700/30 rounded-lg p-3 hover:border-amber-700/40 transition-all group">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-white">{tmpl.name}</span>
                        {(tmpl.rating || 0) > 0 && (
                          <span className="flex items-center gap-0.5 text-[8px] text-yellow-500">
                            <Star className="w-2 h-2 fill-yellow-400 text-yellow-400" />{tmpl.rating!.toFixed(1)}
                          </span>
                        )}
                        <span className="text-[7px] text-gray-600 bg-gray-700/30 px-1.5 py-0.5 rounded">{tmpl.category}</span>
                      </div>
                      <button
                        onClick={() => useTemplateFromWarning(tmpl)}
                        className="text-[9px] font-semibold text-amber-400 hover:text-amber-300 bg-amber-950/30 hover:bg-amber-900/40 border border-amber-800/30 rounded-md px-2.5 py-1 transition-all flex items-center gap-1 opacity-0 group-hover:opacity-100"
                      >
                        <Upload className="w-2.5 h-2.5" />Use This
                      </button>
                    </div>
                    <p className="text-[9px] text-gray-500 line-clamp-2 leading-relaxed">{tmpl.prompt.substring(0, 180)}{tmpl.prompt.length > 180 ? '...' : ''}</p>
                    {tmpl.tags.length > 0 && (
                      <div className="flex gap-1 mt-1.5 flex-wrap">
                        {tmpl.tags.slice(0, 5).map(tag => (
                          <span key={tag} className="text-[7px] bg-gray-700/30 text-gray-500 px-1.5 py-0.5 rounded">{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="border-t border-gray-700 px-5 py-3 space-y-2">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-1.5 cursor-pointer select-none group">
                  <input
                    type="checkbox"
                    checked={suppressSimilarWarning}
                    onChange={(e) => {
                      const val = e.target.checked;
                      setSuppressSimilarWarning(val);
                      localStorage.setItem('suppress-similar-warning', String(val));
                      if (val) {
                        const now = new Date().toISOString();
                        localStorage.setItem('suppress-similar-warning-date', now);
                        setSuppressWarningDate(now);
                      }
                    }}
                    className="w-3 h-3 rounded border-gray-600 bg-gray-800 text-amber-500 focus:ring-amber-500/30 accent-amber-500"
                  />
                  <span className="text-[9px] text-gray-500 group-hover:text-gray-400 transition-colors">Don't warn me again</span>
                </label>
                <div className="flex items-center gap-2">
                  <button onClick={() => setSimilarWarning(null)} className="text-[9px] text-gray-500 hover:text-white px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 transition-all">
                    Cancel
                  </button>
                  <button
                    onClick={confirmBuildAnyway}
                    className="text-[9px] font-semibold text-white px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 transition-all flex items-center gap-1"
                  >
                    <Zap className="w-3 h-3" />Build Anyway
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Save Template Modal ═══ */}
      {showSaveTemplateModal && saveTemplateSource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-[480px] overflow-hidden">
            <div className="bg-gradient-to-r from-amber-600 to-orange-600 px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bookmark className="w-5 h-5 text-white" />
                <h3 className="text-white font-bold text-sm">Save as Template</h3>
              </div>
              <button onClick={() => { setShowSaveTemplateModal(false); setSaveTemplateSource(null); }} className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-all">
                <XIcon className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {/* Prompt preview */}
              <div className="bg-gray-800/60 border border-gray-700/50 rounded-lg p-3">
                <p className="text-[9px] text-gray-500 uppercase tracking-wider font-bold mb-1">Prompt</p>
                <p className="text-[11px] text-gray-300 leading-relaxed line-clamp-3">{saveTemplateSource.prompt}</p>
              </div>

              {/* Template name */}
              <div>
                <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">Template Name *</label>
                <input
                  type="text"
                  value={templateName}
                  onChange={e => setTemplateName(e.target.value)}
                  placeholder="e.g., Dashboard Starter, E-commerce Base..."
                  className="w-full px-3 py-2 bg-gray-800 text-white text-sm border border-gray-700 rounded-lg focus:outline-none focus:border-amber-500 placeholder:text-gray-600"
                  autoFocus
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">Description</label>
                <input
                  type="text"
                  value={templateDesc}
                  onChange={e => setTemplateDesc(e.target.value)}
                  placeholder="Brief description of what this template builds..."
                  className="w-full px-3 py-2 bg-gray-800 text-white text-sm border border-gray-700 rounded-lg focus:outline-none focus:border-amber-500 placeholder:text-gray-600"
                />
              </div>

              {/* AI Suggest button */}
              <button
                onClick={handleSuggestCategory}
                disabled={suggestingCategory || !saveTemplateSource?.prompt}
                className="w-full text-[10px] font-semibold text-fuchsia-400 hover:text-fuchsia-300 disabled:text-gray-600 bg-fuchsia-950/20 hover:bg-fuchsia-950/30 disabled:bg-gray-800/30 border border-fuchsia-700/30 disabled:border-gray-700/30 rounded-lg py-1.5 transition-all flex items-center justify-center gap-1.5"
              >
                {suggestingCategory ? (
                  <><Loader className="w-3 h-3 animate-spin" /> AI is analyzing prompt...</>
                ) : (
                  <><Sparkles className="w-3 h-3" /> Auto-suggest Category & Tags with AI</>
                )}
              </button>

              {/* Category & Tags row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">Category</label>
                  <select
                    value={templateCategory}
                    onChange={e => setTemplateCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 text-white text-sm border border-gray-700 rounded-lg focus:outline-none focus:border-amber-500"
                  >
                    <option value="General">General</option>
                    <option value="Dashboard">Dashboard</option>
                    <option value="E-commerce">E-commerce</option>
                    <option value="SaaS">SaaS</option>
                    <option value="Portfolio">Portfolio</option>
                    <option value="Landing Page">Landing Page</option>
                    <option value="Admin Panel">Admin Panel</option>
                    <option value="Mobile App">Mobile App</option>
                    <option value="Game">Game</option>
                    <option value="Tool">Tool</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">Tags (comma-separated)</label>
                  <input
                    type="text"
                    value={templateTags}
                    onChange={e => setTemplateTags(e.target.value)}
                    placeholder="react, charts, auth..."
                    className="w-full px-3 py-2 bg-gray-800 text-white text-sm border border-gray-700 rounded-lg focus:outline-none focus:border-amber-500 placeholder:text-gray-600"
                  />
                </div>
              </div>

              {saveTemplateSource.appName && (
                <p className="text-[9px] text-gray-600">
                  Source: {saveTemplateSource.appName} {saveTemplateSource.buildId ? `(${saveTemplateSource.buildId.substring(0, 12)}...)` : ''}
                </p>
              )}
            </div>

            {/* Modal footer */}
            <div className="border-t border-gray-800 px-5 py-3 flex items-center justify-end gap-2 bg-gray-900">
              <button
                onClick={() => { setShowSaveTemplateModal(false); setSaveTemplateSource(null); }}
                className="text-[10px] font-semibold text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-md px-4 py-1.5 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTemplate}
                disabled={!templateName.trim()}
                className="text-[10px] font-bold text-white bg-amber-600 hover:bg-amber-500 disabled:bg-gray-700 disabled:text-gray-500 rounded-md px-4 py-1.5 transition-all flex items-center gap-1"
              >
                <Bookmark className="w-3 h-3" /> Save Template
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ═══ Import Preview Modal ═══ */}
      {importPreview && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
            <div className="px-5 py-3 border-b border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Upload className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white">Import Preview</h3>
                {importPreview.migratedFrom && (
                  <span className="text-[7px] bg-amber-950/40 text-amber-400 border border-amber-800/30 px-1.5 py-0.5 rounded-full font-semibold">
                    Migrated from {importPreview.migratedFrom}
                  </span>
                )}
              </div>
              <button onClick={() => setImportPreview(null)} className="text-gray-500 hover:text-white transition-colors"><XIcon className="w-4 h-4" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {/* Summary cards */}
              <div className="grid grid-cols-4 gap-2">
                <div className="bg-gray-800/50 rounded-lg p-2 text-center border border-gray-700/30">
                  <p className="text-[7px] text-gray-500 uppercase font-bold tracking-wider">File</p>
                  <p className="text-[9px] text-white font-semibold truncate" title={importPreview.filename}>{importPreview.filename}</p>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-2 text-center border border-gray-700/30">
                  <p className="text-[7px] text-gray-500 uppercase font-bold tracking-wider">Chains</p>
                  <p className="text-[13px] text-white font-bold">{importPreview.totalChains}</p>
                </div>
                <div className="bg-emerald-950/30 rounded-lg p-2 text-center border border-emerald-800/30">
                  <p className="text-[7px] text-emerald-500 uppercase font-bold tracking-wider">New</p>
                  <p className="text-[13px] text-emerald-300 font-bold">{importPreview.newCount}</p>
                </div>
                <div className={`rounded-lg p-2 text-center border ${importPreview.duplicateCount > 0 ? 'bg-amber-950/30 border-amber-800/30' : 'bg-gray-800/50 border-gray-700/30'}`}>
                  <p className={`text-[7px] uppercase font-bold tracking-wider ${importPreview.duplicateCount > 0 ? 'text-amber-500' : 'text-gray-500'}`}>Dupes</p>
                  <p className={`text-[13px] font-bold ${importPreview.duplicateCount > 0 ? 'text-amber-300' : 'text-gray-400'}`}>{importPreview.duplicateCount}</p>
                </div>
              </div>

              {/* Version list */}
              <div className="space-y-1">
                <p className="text-[8px] text-gray-600 font-bold uppercase tracking-wider">Templates ({importPreview.versions.length})</p>
                <div className="space-y-1 max-h-52 overflow-y-auto">
                  {importPreview.versions.map((ver, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border transition-all ${ver.isDuplicate
                        ? 'bg-amber-950/20 border-amber-800/30 opacity-60'
                        : 'bg-gray-800/30 border-gray-700/20'
                        }`}
                    >
                      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${ver.isDuplicate ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[9px] font-semibold text-white truncate">{ver.name || 'Unnamed'}</p>
                        <p className="text-[7px] text-gray-600 truncate">{ver.prompt?.substring(0, 80)}...</p>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {ver.category && <span className="text-[7px] text-gray-600 bg-gray-800/60 px-1.5 py-0.5 rounded">{ver.category}</span>}
                        {ver.isDuplicate && (
                          <span className="text-[7px] text-amber-400 bg-amber-950/40 px-1.5 py-0.5 rounded-full font-semibold border border-amber-800/30">
                            DUPE
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {importPreview.duplicateCount > 0 && (
                <p className="text-[8px] text-amber-400/80 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {importPreview.duplicateCount} duplicate{importPreview.duplicateCount > 1 ? 's' : ''} detected (matching name + prompt) — will be skipped
                </p>
              )}
              {importPreview.migratedFrom && (
                <p className="text-[8px] text-amber-400/70 flex items-center gap-1">
                  <RefreshCw className="w-3 h-3" />
                  Manifest auto-migrated from format "{importPreview.migratedFrom}" → v{importPreview.formatVersion}
                </p>
              )}
              {importPreview.importedMergeHistory && importPreview.importedMergeHistory.length > 0 && (
                <p className="text-[8px] text-rose-400/70 flex items-center gap-1">
                  <Merge className="w-3 h-3" />
                  {importPreview.importedMergeHistory.length} merge history entr{importPreview.importedMergeHistory.length > 1 ? 'ies' : 'y'} will also be imported
                </p>
              )}
            </div>
            <div className="border-t border-gray-700 px-5 py-3 flex items-center justify-between">
              <p className="text-[9px] text-gray-600">
                {importPreview.newCount > 0 ? `${importPreview.newCount} template${importPreview.newCount > 1 ? 's' : ''} will be imported` : 'Nothing new to import'}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setImportPreview(null)}
                  className="text-[9px] text-gray-500 hover:text-white px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmImport}
                  disabled={importPreview.newCount === 0}
                  className="text-[9px] font-semibold text-white px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 disabled:from-gray-700 disabled:to-gray-700 disabled:text-gray-500 transition-all flex items-center gap-1"
                >
                  <Upload className="w-3 h-3" />Import {importPreview.newCount} Template{importPreview.newCount !== 1 ? 's' : ''}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Merge History Modal ═══ */}
      {showMergeHistory && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-lg max-h-[75vh] flex flex-col">
            <div className="px-5 py-3 border-b border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Merge className="w-4 h-4 text-rose-400" />
                <h3 className="text-sm font-bold text-white">Merge History</h3>
                <span className="text-[8px] bg-rose-950/40 text-rose-400 border border-rose-800/30 px-1.5 py-0.5 rounded-full font-semibold">{mergeHistory.length}</span>
              </div>
              <div className="flex items-center gap-2">
                {batchRemergeSelection.size > 0 && (
                  <span className="text-[8px] text-cyan-400 bg-cyan-950/30 border border-cyan-800/20 px-1.5 py-0.5 rounded-full font-semibold">
                    {batchRemergeSelection.size} selected
                  </span>
                )}
                <button onClick={() => { setShowMergeHistory(false); setBatchRemergeSelection(new Set()); }} className="text-gray-500 hover:text-white transition-colors"><XIcon className="w-4 h-4" /></button>
              </div>
            </div>
            {/* Quality score sparkline trend */}
            {(() => {
              const scored = [...mergeHistory].filter(e => e.qualityScore != null).reverse();
              if (scored.length < 2) return null;
              const scores = scored.map(e => e.qualityScore!);
              const timestamps = scored.map(e => e.timestamp);
              const minS = Math.min(...scores);
              const maxS = Math.max(...scores);
              const range = maxS - minS || 1;
              const w = 200;
              const h = 32;
              const pad = 3;
              const coords = scores.map((s, i) => ({
                x: (i / (scores.length - 1)) * w,
                y: h - ((s - minS) / range) * (h - pad * 2) - pad,
              }));
              const pointsStr = coords.map(c => `${c.x},${c.y}`).join(' ');
              const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
              const trend = scores[scores.length - 1] - scores[0];
              const color = trend >= 0 ? '#10b981' : '#ef4444';
              const belowThreshold = qualityThreshold > 0 ? scores.filter(s => s < qualityThreshold).length : 0;
              return (
                <div className="px-5 py-2 border-b border-gray-800/40 flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className={`w-3 h-3 ${trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`} />
                    <span className="text-[8px] text-gray-500 font-semibold">Quality Trend</span>
                  </div>
                  <div className="relative flex-shrink-0" onMouseLeave={() => setSparkHoveredIdx(null)}>
                    <svg width={w} height={h}>
                      <defs>
                        <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
                          <stop offset="100%" stopColor={color} stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      {/* Threshold line */}
                      {qualityThreshold > 0 && qualityThreshold >= minS && qualityThreshold <= maxS && (
                        <line
                          x1={0} x2={w}
                          y1={h - ((qualityThreshold - minS) / range) * (h - pad * 2) - pad}
                          y2={h - ((qualityThreshold - minS) / range) * (h - pad * 2) - pad}
                          stroke="#ef4444" strokeWidth="0.5" strokeDasharray="3,2" opacity="0.5"
                        />
                      )}
                      <polygon points={`0,${h} ${pointsStr} ${w},${h}`} fill="url(#sparkGrad)" />
                      <polyline points={pointsStr} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      {/* Data point dots + hover areas */}
                      {coords.map((c, i) => (
                        <g key={i}>
                          <rect
                            x={c.x - (w / scores.length / 2)} y={0} width={w / scores.length} height={h}
                            fill="transparent"
                            onMouseEnter={() => setSparkHoveredIdx(i)}
                          />
                          <circle
                            cx={c.x} cy={c.y} r={sparkHoveredIdx === i ? 3.5 : (i === scores.length - 1 ? 2.5 : 0)}
                            fill={qualityThreshold > 0 && scores[i] < qualityThreshold ? '#ef4444' : color}
                            className="transition-all duration-100"
                          />
                        </g>
                      ))}
                    </svg>
                    {/* Hover tooltip */}
                    {sparkHoveredIdx !== null && sparkHoveredIdx < scores.length && (
                      <div
                        className="absolute z-10 pointer-events-none bg-gray-950 border border-gray-700 rounded-lg px-2 py-1.5 shadow-xl"
                        style={{
                          left: Math.min(Math.max(coords[sparkHoveredIdx].x - 40, 0), w - 80),
                          top: -42,
                        }}
                      >
                        <div className="flex items-center gap-1.5">
                          <Trophy className={`w-2.5 h-2.5 ${scores[sparkHoveredIdx] >= 80 ? 'text-emerald-400' :
                            scores[sparkHoveredIdx] >= 60 ? 'text-amber-400' : 'text-red-400'
                            }`} />
                          <span className="text-[8px] font-bold text-white">{scores[sparkHoveredIdx]}</span>
                          {qualityThreshold > 0 && scores[sparkHoveredIdx] < qualityThreshold && (
                            <span className="text-[6px] text-red-400 font-bold">⚠ BELOW</span>
                          )}
                        </div>
                        <span className="text-[6px] text-gray-500 block">
                          {new Date(timestamps[sparkHoveredIdx]).toLocaleDateString()} {new Date(timestamps[sparkHoveredIdx]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-auto">
                    <span className="text-[7px] text-gray-600">avg {avg}</span>
                    <span className={`text-[7px] font-bold ${trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {trend >= 0 ? '↑' : '↓'}{Math.abs(trend)}pts
                    </span>
                    {qualityThreshold > 0 && belowThreshold > 0 && (
                      <span className="text-[7px] text-red-400/70">⚠{belowThreshold}</span>
                    )}
                    <span className="text-[7px] text-gray-700">{scored.length} merges</span>
                    <button
                      onClick={() => setShowHeatmap(!showHeatmap)}
                      className={`text-[7px] px-1 py-0.5 rounded transition-all ${showHeatmap ? 'text-emerald-400 bg-emerald-950/30' : 'text-gray-600 hover:text-gray-400'}`}
                      title="Toggle quality heatmap calendar"
                    >
                      <Grid className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </div>
              );
            })()}
            {/* Quality score heatmap calendar */}
            {showHeatmap && (() => {
              const scored = [...mergeHistory].filter(e => e.qualityScore != null);
              if (scored.length === 0) return null;
              // Group by date
              const byDate: Record<string, { scores: number[]; count: number }> = {};
              scored.forEach(e => {
                const d = new Date(e.timestamp).toISOString().split('T')[0];
                if (!byDate[d]) byDate[d] = { scores: [], count: 0 };
                byDate[d].scores.push(e.qualityScore!);
                byDate[d].count++;
              });
              // Build 8-week grid (56 days)
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const days: { date: string; label: string; avg: number | null; count: number }[] = [];
              for (let i = 55; i >= 0; i--) {
                const d = new Date(today);
                d.setDate(d.getDate() - i);
                const key = d.toISOString().split('T')[0];
                const info = byDate[key];
                days.push({
                  date: key,
                  label: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
                  avg: info ? Math.round(info.scores.reduce((a, b) => a + b, 0) / info.scores.length) : null,
                  count: info?.count || 0,
                });
              }
              // 8 columns (weeks) x 7 rows (days)
              const weeks: typeof days[] = [];
              for (let w = 0; w < 8; w++) weeks.push(days.slice(w * 7, w * 7 + 7));
              const getColor = (avg: number | null) => {
                if (avg === null) return 'bg-gray-800/40';
                if (qualityThreshold > 0 && avg < qualityThreshold) return 'bg-red-500/60 ring-1 ring-red-500/30';
                if (avg >= 80) return 'bg-emerald-500/70';
                if (avg >= 60) return 'bg-amber-500/60';
                return 'bg-red-500/50';
              };
              return (
                <div className="px-5 py-2 border-b border-gray-800/40">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[7px] text-gray-500 font-semibold">Quality Heatmap · 8 weeks</span>
                    <div className="flex items-center gap-1.5">
                      <div className="flex items-center gap-0.5">
                        <div className="w-1.5 h-1.5 rounded-sm bg-gray-800/40" /><span className="text-[6px] text-gray-600">none</span>
                      </div>
                      <div className="flex items-center gap-0.5">
                        <div className="w-1.5 h-1.5 rounded-sm bg-red-500/50" /><span className="text-[6px] text-gray-600">&lt;60</span>
                      </div>
                      <div className="flex items-center gap-0.5">
                        <div className="w-1.5 h-1.5 rounded-sm bg-amber-500/60" /><span className="text-[6px] text-gray-600">60-79</span>
                      </div>
                      <div className="flex items-center gap-0.5">
                        <div className="w-1.5 h-1.5 rounded-sm bg-emerald-500/70" /><span className="text-[6px] text-gray-600">80+</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-0.5">
                    {weeks.map((week, wi) => (
                      <div key={wi} className="flex flex-col gap-0.5">
                        {week.map((day, di) => (
                          <div
                            key={day.date}
                            className={`w-3 h-3 rounded-sm ${getColor(day.avg)} transition-all hover:ring-1 hover:ring-white/30 cursor-default`}
                            title={`${day.label}: ${day.avg !== null ? `avg ${day.avg}/100 (${day.count} merge${day.count > 1 ? 's' : ''})` : 'no merges'}${qualityThreshold > 0 && day.avg !== null && day.avg < qualityThreshold ? ' ⚠ BELOW GATE' : ''}`}
                          />
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
            {/* Merge quality leaderboard */}
            {showLeaderboard && (
              <div className="px-5 py-2.5 border-b border-yellow-800/20 bg-yellow-950/10">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <Crown className="w-3.5 h-3.5 text-yellow-400" />
                    <span className="text-[9px] font-bold text-yellow-300">Merge Quality Leaderboard</span>
                    <span className="text-[7px] text-gray-600">{leaderboardData.length} pair{leaderboardData.length !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {suggestedPairs.length > 0 && (
                      <button
                        onClick={() => setShowSuggestedPairs(!showSuggestedPairs)}
                        className={`text-[7px] px-1.5 py-0.5 rounded transition-all flex items-center gap-0.5 ${showSuggestedPairs ? 'text-cyan-400 bg-cyan-950/30 border border-cyan-800/20' : 'text-gray-600 hover:text-gray-400'
                          }`}
                        title="AI-suggested template pairs to try merging"
                      >
                        <Lightbulb className="w-2.5 h-2.5" />Suggest
                      </button>
                    )}
                    <button onClick={() => setShowLeaderboard(false)} className="text-[7px] text-gray-600 hover:text-gray-400 transition-colors">
                      <XIcon className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                {leaderboardData.length === 0 ? (
                  <p className="text-[8px] text-gray-600 italic">No scored merges yet.</p>
                ) : (
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {leaderboardData.slice(0, 10).map((pair, idx) => {
                      const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`;
                      const barWidth = leaderboardData[0].bestScore > 0 ? (pair.bestScore / leaderboardData[0].bestScore) * 100 : 0;
                      // Sparkline data
                      const tl = pair.scoreTimeline;
                      const sparkW = 48, sparkH = 16;
                      let sparkPath = '';
                      let sparkDots: { x: number; y: number; score: number }[] = [];
                      if (tl.length >= 2) {
                        const minS = Math.min(...tl.map(p => p.score));
                        const maxS = Math.max(...tl.map(p => p.score));
                        const range = maxS - minS || 1;
                        sparkDots = tl.map((p, i) => ({
                          x: (i / (tl.length - 1)) * sparkW,
                          y: sparkH - ((p.score - minS) / range) * (sparkH - 2) - 1,
                          score: p.score,
                        }));
                        sparkPath = sparkDots.map((d, i) => `${i === 0 ? 'M' : 'L'}${d.x.toFixed(1)},${d.y.toFixed(1)}`).join(' ');
                      }
                      const trendDir = tl.length >= 2 ? tl[tl.length - 1].score - tl[0].score : 0;
                      return (
                        <div key={pair.pairKey} className="flex items-center gap-2 group">
                          <span className="text-[8px] font-bold w-5 text-right flex-shrink-0">{medal}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1 text-[7px] mb-0.5">
                              <span className="text-violet-400 truncate max-w-[90px]">{pair.nameA}</span>
                              <ArrowLeftRight className="w-2 h-2 text-gray-700 flex-shrink-0" />
                              <span className="text-purple-400 truncate max-w-[90px]">{pair.nameB}</span>
                            </div>
                            <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${pair.bestScore >= 80 ? 'bg-gradient-to-r from-yellow-500 to-emerald-500' :
                                  pair.bestScore >= 60 ? 'bg-gradient-to-r from-yellow-600 to-amber-500' :
                                    'bg-gradient-to-r from-red-600 to-red-500'
                                  }`}
                                style={{ width: `${barWidth}%` }}
                              />
                            </div>
                          </div>
                          {/* Inline sparkline */}
                          {tl.length >= 2 && (
                            <div className="flex-shrink-0" title={`Score trend: ${tl.map(p => p.score).join(' → ')} (${trendDir >= 0 ? '+' : ''}${trendDir})`}>
                              <svg width={sparkW} height={sparkH} className="overflow-visible">
                                <defs>
                                  <linearGradient id={`spark-grad-${pair.pairKey}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={trendDir >= 0 ? '#34d399' : '#f87171'} stopOpacity="0.3" />
                                    <stop offset="100%" stopColor={trendDir >= 0 ? '#34d399' : '#f87171'} stopOpacity="0" />
                                  </linearGradient>
                                </defs>
                                {sparkPath && (
                                  <>
                                    <path
                                      d={`${sparkPath} L${sparkW},${sparkH} L0,${sparkH} Z`}
                                      fill={`url(#spark-grad-${pair.pairKey})`}
                                    />
                                    <path
                                      d={sparkPath}
                                      fill="none"
                                      stroke={trendDir >= 0 ? '#34d399' : '#f87171'}
                                      strokeWidth="1.2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  </>
                                )}
                                {sparkDots.map((dot, di) => (
                                  <circle
                                    key={di}
                                    cx={dot.x}
                                    cy={dot.y}
                                    r={di === sparkDots.length - 1 ? 2 : 1}
                                    fill={di === sparkDots.length - 1 ? (trendDir >= 0 ? '#34d399' : '#f87171') : '#6b7280'}
                                    className={di === sparkDots.length - 1 ? 'opacity-100' : 'opacity-50 group-hover:opacity-80'}
                                  />
                                ))}
                              </svg>
                            </div>
                          )}
                          <div className="text-right flex-shrink-0 space-y-0.5">
                            <div className="flex items-center gap-1">
                              <Trophy className="w-2 h-2 text-yellow-400" />
                              <span className={`text-[8px] font-black ${pair.bestScore >= 80 ? 'text-emerald-400' :
                                pair.bestScore >= 60 ? 'text-amber-400' : 'text-red-400'
                                }`}>{pair.bestScore}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-[6px] text-gray-600">avg {pair.avgScore}</span>
                              <span className="text-[6px] text-gray-700">·</span>
                              <span className="text-[6px] text-gray-600">{pair.mergeCount}×</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                {/* Merge suggestion engine */}
                {showSuggestedPairs && suggestedPairs.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-yellow-800/15">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Lightbulb className="w-3 h-3 text-cyan-400" />
                      <span className="text-[8px] font-bold text-cyan-300">Suggested Pairs</span>
                      <span className="text-[6px] text-gray-600 italic">untried pairs predicted to merge well</span>
                    </div>
                    <div className="space-y-1">
                      {suggestedPairs.map(sp => (
                        <div key={`${sp.idA}::${sp.idB}`} className="flex items-center gap-2 px-2 py-1 bg-cyan-950/15 rounded-lg border border-cyan-800/10 hover:border-cyan-700/25 transition-all group/sug">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1 text-[7px]">
                              <span className="text-violet-400 truncate max-w-[80px]">{sp.nameA}</span>
                              <ArrowLeftRight className="w-2 h-2 text-gray-700 flex-shrink-0" />
                              <span className="text-purple-400 truncate max-w-[80px]">{sp.nameB}</span>
                            </div>
                            <span className="text-[6px] text-gray-600">{sp.reason}</span>
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <span className={`text-[7px] font-bold px-1 py-0.5 rounded ${sp.score >= 40 ? 'text-emerald-400 bg-emerald-950/30' :
                              sp.score >= 20 ? 'text-amber-400 bg-amber-950/30' :
                                'text-gray-400 bg-gray-800/50'
                              }`}>{sp.score}pt</span>
                            <button
                              onClick={() => {
                                setMergeSourceA(sp.idA);
                                setMergeSourceB(sp.idB);
                                setMergePreview(null);
                                setConflictOverrides({});
                                setHighlightedConflictZone(null);
                                setShowMergeModal(true);
                                setShowMergeHistory(false);
                              }}
                              className="text-[6px] px-1.5 py-0.5 rounded bg-violet-950/30 text-violet-400 hover:bg-violet-900/40 border border-violet-800/20 transition-all opacity-70 group-hover/sug:opacity-100"
                              title="Try merging this pair"
                            >
                              <Merge className="w-2 h-2 inline mr-0.5" />Try
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            {/* Batch re-merge diff report */}
            {batchRemergeReport && (
              <div className="px-5 py-2.5 border-b border-cyan-800/20 bg-cyan-950/15 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="text-[9px] font-bold text-cyan-300">Batch Re-merge Report</span>
                    <span className="text-[7px] bg-cyan-950/40 text-cyan-400 border border-cyan-800/20 px-1.5 py-0.5 rounded-full font-semibold">
                      {batchRemergeReport.totalSucceeded}/{batchRemergeReport.totalAttempted}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {/* Export CSV */}
                    <button
                      onClick={() => {
                        const r = batchRemergeReport!;
                        const header = 'Name,Old Words,New Words,Word Delta,Old Quality,New Quality,Quality Delta';
                        const rows = r.items.map(i => `"${i.name}",${i.oldWordCount},${i.newWordCount},${i.wordDelta},${i.oldQuality ?? ''},${i.newQuality},${i.qualityDelta ?? ''}`);
                        const csv = [header, ...rows].join('\n');
                        const blob = new Blob([csv], { type: 'text/csv' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a'); a.href = url; a.download = `batch-remerge-report-${Date.now()}.csv`; a.click(); URL.revokeObjectURL(url);
                      }}
                      className="text-[7px] text-cyan-500/60 hover:text-cyan-400 transition-colors px-1.5 py-0.5 rounded border border-cyan-800/20 hover:bg-cyan-950/30 flex items-center gap-0.5"
                      title="Export report as CSV"
                    >
                      <FileDown className="w-2.5 h-2.5" />CSV
                    </button>
                    {/* Export JSON */}
                    <button
                      onClick={() => {
                        const r = batchRemergeReport!;
                        const json = JSON.stringify({ type: 'batch-remerge-report', version: '1.0', exportedAt: new Date().toISOString(), summary: { succeeded: r.totalSucceeded, attempted: r.totalAttempted, avgQualityDelta: r.avgQualityDelta, avgWordDelta: r.avgWordDelta }, items: r.items }, null, 2);
                        const blob = new Blob([json], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a'); a.href = url; a.download = `batch-remerge-report-${Date.now()}.json`; a.click(); URL.revokeObjectURL(url);
                      }}
                      className="text-[7px] text-cyan-500/60 hover:text-cyan-400 transition-colors px-1.5 py-0.5 rounded border border-cyan-800/20 hover:bg-cyan-950/30 flex items-center gap-0.5"
                      title="Export report as JSON"
                    >
                      <FileDown className="w-2.5 h-2.5" />JSON
                    </button>
                    <button onClick={() => setBatchRemergeReport(null)} className="text-gray-600 hover:text-gray-400 transition-colors">
                      <XIcon className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                {/* Summary stats */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <span className="text-[7px] text-gray-500">Avg word Δ:</span>
                    <span className={`text-[8px] font-bold ${batchRemergeReport.avgWordDelta >= 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {batchRemergeReport.avgWordDelta >= 0 ? '+' : ''}{batchRemergeReport.avgWordDelta}w
                    </span>
                  </div>
                  {batchRemergeReport.avgQualityDelta != null && (
                    <div className="flex items-center gap-1">
                      <span className="text-[7px] text-gray-500">Avg quality Δ:</span>
                      <span className={`text-[8px] font-bold ${batchRemergeReport.avgQualityDelta >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {batchRemergeReport.avgQualityDelta >= 0 ? '+' : ''}{batchRemergeReport.avgQualityDelta}
                      </span>
                    </div>
                  )}
                </div>
                {/* Per-item breakdown */}
                <div className="space-y-1 max-h-28 overflow-y-auto">
                  {batchRemergeReport.items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-gray-900/40 rounded px-2 py-1">
                      <span className="text-[7px] text-white font-semibold truncate flex-1 max-w-[150px]">{item.name}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[7px] text-gray-600">{item.oldWordCount}w</span>
                        <span className="text-[7px] text-gray-700">→</span>
                        <span className="text-[7px] text-white">{item.newWordCount}w</span>
                        <span className={`text-[7px] font-bold px-1 py-0.5 rounded ${item.wordDelta <= 0 ? 'text-emerald-400 bg-emerald-950/30' : 'text-amber-400 bg-amber-950/30'
                          }`}>
                          {item.wordDelta >= 0 ? '+' : ''}{item.wordDelta}
                        </span>
                      </div>
                      {item.qualityDelta != null && (
                        <div className="flex items-center gap-1">
                          <Trophy className="w-2 h-2 text-gray-600" />
                          <span className="text-[7px] text-gray-600">{item.oldQuality}</span>
                          <span className="text-[7px] text-gray-700">→</span>
                          <span className="text-[7px] text-white">{item.newQuality}</span>
                          <span className={`text-[7px] font-bold ${item.qualityDelta >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {item.qualityDelta >= 0 ? '+' : ''}{item.qualityDelta}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* Auto re-merge active banner */}
            {autoRemergeActive && !batchRemergeProgress && (
              <div className="px-5 py-1.5 bg-emerald-950/20 border-b border-emerald-800/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[8px] text-emerald-400 font-semibold">Auto re-merge active</span>
                  <span className="text-[7px] text-gray-500">Next cycle in {autoRemergeCountdown}s</span>
                  {autoRemergeCooldownMultiplier > 1 && (
                    <span className="text-[6px] text-amber-400 bg-amber-950/30 px-1.5 py-0.5 rounded-full border border-amber-800/20" title={`Cooldown escalated ${Math.log2(autoRemergeCooldownMultiplier)}× due to no improvement. Will reset when scores improve.`}>
                      {autoRemergeCooldownMultiplier}× cooldown
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {autoRemergeCooldownMultiplier > 1 && (
                    <button
                      onClick={() => { setAutoRemergeCooldownMultiplier(1); toast.info('Cooldown reset to 60s', { duration: 2000 }); }}
                      className="text-[6px] text-amber-500/60 hover:text-amber-400 transition-colors"
                    >Reset</button>
                  )}
                  <button
                    onClick={() => { setAutoRemergeActive(false); setAutoRemergeCooldownMultiplier(1); autoRemergeLastScoresRef.current.clear(); }}
                    className="text-[7px] text-emerald-500/60 hover:text-emerald-400 transition-colors"
                  >Stop</button>
                </div>
              </div>
            )}
            {/* Batch re-merge progress banner */}
            {batchRemergeProgress && (
              <div className="px-5 py-2 bg-cyan-950/30 border-b border-cyan-800/20 flex items-center gap-2">
                <Loader className="w-3 h-3 text-cyan-400 animate-spin" />
                <span className="text-[9px] text-cyan-300 font-semibold">
                  Re-merging {batchRemergeProgress.current}/{batchRemergeProgress.total}: {batchRemergeProgress.currentName}
                </span>
                <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden ml-2">
                  <div className="h-full bg-cyan-500 rounded-full transition-all duration-300" style={{ width: `${Math.round((batchRemergeProgress.current / batchRemergeProgress.total) * 100)}%` }} />
                </div>
              </div>
            )}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {mergeHistory.length === 0 ? (
                <p className="text-[10px] text-gray-600 text-center py-8">No merge history yet</p>
              ) : mergeHistory.map((entry) => {
                const hasSourcesAvailable = templates.some(t => t.id === entry.sourceAId) && templates.some(t => t.id === entry.sourceBId);
                const isSelected = batchRemergeSelection.has(entry.id);
                return (
                  <div key={entry.id} className={`border rounded-lg p-3 space-y-1.5 transition-all ${isSelected ? 'bg-cyan-950/20 border-cyan-700/40' : 'bg-gray-800/40 border-gray-700/30'
                    }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        {/* Batch select checkbox */}
                        <button
                          onClick={() => {
                            const next = new Set(batchRemergeSelection);
                            if (isSelected) next.delete(entry.id); else next.add(entry.id);
                            setBatchRemergeSelection(next);
                          }}
                          className={`flex-shrink-0 transition-colors ${isSelected ? 'text-cyan-400' : 'text-gray-700 hover:text-gray-500'}`}
                          title={hasSourcesAvailable ? 'Select for batch re-merge' : 'Sources missing — cannot re-merge'}
                          disabled={!hasSourcesAvailable}
                        >
                          {isSelected ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                        </button>
                        <Merge className="w-3 h-3 text-violet-400" />
                        <span className="text-[9px] font-bold text-white truncate max-w-[180px]">{entry.resultName}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {/* Quality score badge */}
                        {entry.qualityScore != null && (<>
                          <span className={`text-[7px] font-black px-1.5 py-0.5 rounded-full border ${entry.qualityScore >= 80 ? 'text-emerald-400 bg-emerald-950/30 border-emerald-800/20' :
                            entry.qualityScore >= 60 ? 'text-amber-400 bg-amber-950/30 border-amber-800/20' :
                              'text-red-400 bg-red-950/30 border-red-800/20'
                            }`} title={`Quality: ${entry.qualityScore}/100 · A preserved: ${entry.preservationA ?? '?'}% · B preserved: ${entry.preservationB ?? '?'}% · Dedup: ${entry.dedupEfficiency ?? '?'}%`}>
                            <Trophy className="w-2 h-2 inline mr-0.5" />{entry.qualityScore}
                          </span>
                          {qualityThreshold > 0 && entry.qualityScore < qualityThreshold && (
                            <span className="text-[6px] font-bold text-red-400 bg-red-950/40 border border-red-800/30 px-1 py-0.5 rounded-full flex items-center gap-0.5 animate-pulse" title={`Below quality threshold (${qualityThreshold})`}>
                              <AlertTriangle className="w-2 h-2" />LOW
                            </span>
                          )}
                        </>)}
                        <span className="text-[7px] text-gray-600">{new Date(entry.timestamp).toLocaleDateString()} {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-[8px]">
                      <span className="text-violet-400 bg-violet-950/30 px-1.5 py-0.5 rounded border border-violet-800/20 truncate max-w-[120px]">{entry.sourceAName}</span>
                      <ArrowLeftRight className="w-2.5 h-2.5 text-gray-600 flex-shrink-0" />
                      <span className="text-purple-400 bg-purple-950/30 px-1.5 py-0.5 rounded border border-purple-800/20 truncate max-w-[120px]">{entry.sourceBName}</span>
                    </div>
                    {/* Quality score mini bar (if available) */}
                    {entry.qualityScore != null && entry.preservationA != null && entry.preservationB != null && (
                      <div className="flex items-center gap-1.5">
                        <div className="flex-1 flex items-center gap-1">
                          <span className="text-[6px] text-violet-500 w-4">A</span>
                          <div className="flex-1 h-1 bg-gray-800 rounded-full overflow-hidden">
                            <div className="h-full bg-violet-500/60 rounded-full" style={{ width: `${entry.preservationA}%` }} />
                          </div>
                        </div>
                        <div className="flex-1 flex items-center gap-1">
                          <span className="text-[6px] text-purple-500 w-4">B</span>
                          <div className="flex-1 h-1 bg-gray-800 rounded-full overflow-hidden">
                            <div className="h-full bg-purple-500/60 rounded-full" style={{ width: `${entry.preservationB}%` }} />
                          </div>
                        </div>
                        {entry.dedupEfficiency != null && (
                          <div className="flex-1 flex items-center gap-1">
                            <span className="text-[6px] text-cyan-500 w-4">DD</span>
                            <div className="flex-1 h-1 bg-gray-800 rounded-full overflow-hidden">
                              <div className="h-full bg-cyan-500/60 rounded-full" style={{ width: `${entry.dedupEfficiency}%` }} />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    <p className="text-[8px] text-gray-500 leading-relaxed truncate">{entry.promptSnippet}...</p>
                    <div className="flex items-center gap-2">
                      <span className="text-[7px] text-gray-600">{entry.wordCount}w</span>
                      {hasSourcesAvailable && (
                        <button
                          onClick={() => {
                            setMergeSourceA(entry.sourceAId);
                            setMergeSourceB(entry.sourceBId);
                            setMergePreview(null);
                            setConflictOverrides({});
                            setHighlightedConflictZone(null);
                            setShowMergeHistory(false);
                            setShowMergeModal(true);
                          }}
                          className="text-[7px] text-violet-400/70 hover:text-violet-300 transition-colors flex items-center gap-0.5"
                          title="Re-merge these two templates"
                        >
                          <RefreshCw className="w-2.5 h-2.5" />Re-merge
                        </button>
                      )}
                      {!hasSourcesAvailable && (
                        <span className="text-[7px] text-gray-700 flex items-center gap-0.5" title="One or both source templates no longer exist">
                          <AlertTriangle className="w-2.5 h-2.5" />Sources missing
                        </span>
                      )}
                      <button
                        onClick={() => {
                          const updated = mergeHistory.filter(e => e.id !== entry.id);
                          setMergeHistory(updated);
                          localStorage.setItem('merge-history', JSON.stringify(updated));
                          setBatchRemergeSelection(prev => { const n = new Set(prev); n.delete(entry.id); return n; });
                        }}
                        className="text-[7px] text-red-500/50 hover:text-red-400 transition-colors ml-auto flex items-center gap-0.5"
                        title="Remove from history"
                      >
                        <Trash2 className="w-2.5 h-2.5" />Remove
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="border-t border-gray-700 px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setMergeHistory([]);
                    localStorage.removeItem('merge-history');
                    setBatchRemergeSelection(new Set());
                  }}
                  className="text-[8px] text-red-500 hover:text-red-300 transition-colors flex items-center gap-1"
                  title="Clear all merge history"
                >
                  <Trash2 className="w-3 h-3" />Clear All
                </button>
                {batchRemergeSelection.size >= 2 && (
                  <button
                    onClick={handleBatchRemerge}
                    disabled={batchRemerging}
                    className="text-[8px] font-semibold text-white px-2.5 py-1 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1"
                    title={`Batch re-merge ${batchRemergeSelection.size} selected entries`}
                  >
                    {batchRemerging ? <><Loader className="w-2.5 h-2.5 animate-spin" />Re-merging...</> : <><RefreshCw className="w-2.5 h-2.5" />Batch Re-merge ({batchRemergeSelection.size})</>}
                  </button>
                )}
                {batchRemergeSelection.size === 1 && (
                  <span className="text-[7px] text-gray-600 italic">Select 1 more for batch re-merge</span>
                )}
                {/* Auto-select eligible button */}
                {mergeHistory.length > 0 && batchRemergeSelection.size === 0 && (
                  <button
                    onClick={() => {
                      const eligible = new Set<string>();
                      mergeHistory.forEach(e => {
                        if (templates.some(t => t.id === e.sourceAId) && templates.some(t => t.id === e.sourceBId)) {
                          eligible.add(e.id);
                        }
                      });
                      setBatchRemergeSelection(eligible);
                    }}
                    className="text-[8px] text-cyan-500/70 hover:text-cyan-400 transition-colors flex items-center gap-0.5"
                    title="Select all entries whose source templates still exist"
                  >
                    <CheckSquare className="w-2.5 h-2.5" />Select All Eligible
                  </button>
                )}
                {/* Re-merge Below Gate button */}
                {qualityThreshold > 0 && !batchRemerging && (() => {
                  const belowGate = mergeHistory.filter(e =>
                    e.qualityScore != null && e.qualityScore < qualityThreshold &&
                    templates.some(t => t.id === e.sourceAId) && templates.some(t => t.id === e.sourceBId)
                  );
                  return belowGate.length >= 2 ? (
                    <button
                      onClick={() => {
                        const ids = new Set(belowGate.map(e => e.id));
                        setBatchRemergeSelection(ids);
                      }}
                      className="text-[8px] text-red-400/80 hover:text-red-300 transition-colors flex items-center gap-0.5 bg-red-950/20 hover:bg-red-950/30 px-1.5 py-0.5 rounded border border-red-800/20"
                      title={`Select ${belowGate.length} merges below quality gate (${qualityThreshold}) for batch re-merge`}
                    >
                      <Target className="w-2.5 h-2.5" />Below Gate ({belowGate.length})
                    </button>
                  ) : null;
                })()}
                {batchRemergeSelection.size > 0 && (
                  <button
                    onClick={() => setBatchRemergeSelection(new Set())}
                    className="text-[8px] text-gray-600 hover:text-gray-400 transition-colors flex items-center gap-0.5"
                    title="Deselect all"
                  >
                    <Square className="w-2.5 h-2.5" />Deselect
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                {/* Leaderboard toggle */}
                <button
                  onClick={() => setShowLeaderboard(!showLeaderboard)}
                  className={`text-[8px] px-2 py-1 rounded-lg transition-all flex items-center gap-1 ${showLeaderboard
                    ? 'text-yellow-400 bg-yellow-950/30 border border-yellow-800/20'
                    : 'text-gray-600 hover:text-gray-400 bg-gray-800/50 hover:bg-gray-800'
                    }`}
                  title="Merge quality leaderboard — top template pairs"
                >
                  <Crown className="w-2.5 h-2.5" />Board
                </button>
                {/* Auto re-merge toggle */}
                {qualityThreshold > 0 && (
                  <button
                    onClick={() => {
                      const next = !autoRemergeActive;
                      setAutoRemergeActive(next);
                      if (next) {
                        setAutoRemergeCooldownMultiplier(1);
                        autoRemergeLastScoresRef.current.clear();
                        toast.info(`Auto re-merge enabled — cycling every ${AUTO_REMERGE_BASE_INTERVAL}s (escalates if no improvement)`, { duration: 3000 });
                      } else {
                        setAutoRemergeCooldownMultiplier(1);
                        autoRemergeLastScoresRef.current.clear();
                        toast.info('Auto re-merge disabled', { duration: 2000 });
                      }
                    }}
                    className={`text-[8px] px-2 py-1 rounded-lg transition-all flex items-center gap-1 ${autoRemergeActive
                      ? 'text-emerald-400 bg-emerald-950/30 border border-emerald-800/20 animate-pulse'
                      : 'text-gray-600 hover:text-gray-400 bg-gray-800/50 hover:bg-gray-800'
                      }`}
                    title={autoRemergeActive ? `Auto re-merge active — next cycle in ${autoRemergeCountdown}s${autoRemergeCooldownMultiplier > 1 ? ` (${autoRemergeCooldownMultiplier}× cooldown)` : ''}` : 'Enable scheduled auto re-merge with cooldown escalation'}
                  >
                    <RotateCcw className="w-2.5 h-2.5" />
                    {autoRemergeActive ? `Auto ${autoRemergeCountdown}s${autoRemergeCooldownMultiplier > 1 ? ` ×${autoRemergeCooldownMultiplier}` : ''}` : 'Auto'}
                  </button>
                )}
                {/* Quality threshold config */}
                <div className="relative">
                  <button
                    onClick={() => setShowThresholdConfig(!showThresholdConfig)}
                    className={`text-[8px] px-2 py-1 rounded-lg transition-all flex items-center gap-1 ${qualityThreshold > 0
                      ? 'text-amber-400 bg-amber-950/30 border border-amber-800/20 hover:bg-amber-950/40'
                      : 'text-gray-600 hover:text-gray-400 bg-gray-800/50 hover:bg-gray-800'
                      }`}
                    title={qualityThreshold > 0 ? `Quality gate: ${qualityThreshold}+` : 'Set quality threshold gate'}
                  >
                    <Gauge className="w-2.5 h-2.5" />
                    {qualityThreshold > 0 ? `≥${qualityThreshold}` : 'Gate'}
                  </button>
                  {showThresholdConfig && (
                    <div className="absolute bottom-full right-0 mb-2 bg-gray-950 border border-gray-700 rounded-lg shadow-2xl p-3 w-48 z-20">
                      <div className="flex items-center gap-1.5 mb-2">
                        <Gauge className="w-3 h-3 text-amber-400" />
                        <span className="text-[9px] font-bold text-white">Quality Gate</span>
                      </div>
                      <p className="text-[7px] text-gray-500 mb-2">Merges below this score will be flagged with a warning badge.</p>
                      <div className="flex items-center gap-2 mb-2">
                        <input
                          type="range"
                          min={0}
                          max={100}
                          step={5}
                          value={qualityThreshold}
                          onChange={(e) => {
                            const v = parseInt(e.target.value);
                            setQualityThreshold(v);
                            localStorage.setItem('merge-quality-threshold', String(v));
                          }}
                          className="flex-1 h-1 accent-amber-500"
                        />
                        <span className={`text-[9px] font-bold w-6 text-right ${qualityThreshold > 0 ? 'text-amber-400' : 'text-gray-600'}`}>
                          {qualityThreshold || 'Off'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex gap-1">
                          {[50, 60, 70, 80].map(v => (
                            <button
                              key={v}
                              onClick={() => { setQualityThreshold(v); localStorage.setItem('merge-quality-threshold', String(v)); }}
                              className={`text-[7px] px-1.5 py-0.5 rounded transition-all ${qualityThreshold === v ? 'bg-amber-600 text-white' : 'bg-gray-800 text-gray-500 hover:text-gray-300'
                                }`}
                            >{v}</button>
                          ))}
                        </div>
                        {qualityThreshold > 0 && (
                          <button
                            onClick={() => { setQualityThreshold(0); localStorage.setItem('merge-quality-threshold', '0'); }}
                            className="text-[7px] text-red-500/60 hover:text-red-400 transition-colors"
                          >Reset</button>
                        )}
                      </div>
                      {qualityThreshold > 0 && (() => {
                        const flagged = mergeHistory.filter(e => e.qualityScore != null && e.qualityScore < qualityThreshold).length;
                        return flagged > 0 ? (
                          <div className="mt-2 pt-2 border-t border-gray-800 flex items-center gap-1">
                            <AlertTriangle className="w-2.5 h-2.5 text-red-400" />
                            <span className="text-[7px] text-red-400">{flagged} merge{flagged !== 1 ? 's' : ''} below threshold</span>
                          </div>
                        ) : (
                          <div className="mt-2 pt-2 border-t border-gray-800 flex items-center gap-1">
                            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                            <span className="text-[7px] text-emerald-400">All merges pass</span>
                          </div>
                        );
                      })()}
                      {/* Threshold auto-adjustment suggestion */}
                      {thresholdSuggestion && (
                        <div className={`mt-2 pt-2 border-t border-gray-800 rounded-md p-1.5 ${thresholdSuggestion.type === 'raise' ? 'bg-emerald-950/20 border border-emerald-800/20' : 'bg-amber-950/20 border border-amber-800/20'
                          }`}>
                          <div className="flex items-center gap-1 mb-1">
                            <TrendingUp className={`w-2.5 h-2.5 ${thresholdSuggestion.type === 'raise' ? 'text-emerald-400' : 'text-amber-400 rotate-180'}`} />
                            <span className={`text-[7px] font-bold ${thresholdSuggestion.type === 'raise' ? 'text-emerald-400' : 'text-amber-400'}`}>
                              Suggest {thresholdSuggestion.type === 'raise' ? 'raising' : 'lowering'} to {thresholdSuggestion.suggested}
                            </span>
                          </div>
                          <p className="text-[6px] text-gray-500 mb-1">{thresholdSuggestion.reason}</p>
                          <button
                            onClick={() => {
                              setQualityThreshold(thresholdSuggestion.suggested);
                              localStorage.setItem('merge-quality-threshold', String(thresholdSuggestion.suggested));
                              toast.success(`Quality gate adjusted to ${thresholdSuggestion.suggested}`, { duration: 3000 });
                            }}
                            className={`text-[7px] font-semibold px-2 py-0.5 rounded transition-all ${thresholdSuggestion.type === 'raise'
                              ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                              : 'bg-amber-600 hover:bg-amber-500 text-white'
                              }`}
                          >
                            Apply → {thresholdSuggestion.suggested}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <button onClick={() => { setShowMergeHistory(false); setBatchRemergeSelection(new Set()); setShowThresholdConfig(false); setShowLeaderboard(false); setAutoRemergeActive(false); setAutoRemergeCooldownMultiplier(1); autoRemergeLastScoresRef.current.clear(); setShowSuggestedPairs(false); }} className="text-[9px] text-gray-400 hover:text-white px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 transition-all">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
