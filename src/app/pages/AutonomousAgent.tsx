// ================================================================
// AUTONOMOUS DEV AGENT — Full Cockpit Page
// Only opened when user explicitly clicks the badge.
// Contains ALL developer tools hidden from the main UI.
// 9-phase lifecycle: Architect → Codegen → Build → Runtime →
//   Testing → Security → Deploy → Monitor → Improve
// ================================================================

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowLeft, Play, Pause, RotateCcw, Settings, Activity, ChevronRight,
  CheckCircle, AlertCircle, AlertTriangle, RefreshCw, Terminal, Shield,
  Zap, Globe, Bug, Wrench, Rocket, Brain, BarChart2, Eye, Copy, Check,
  GitBranch, Package, FileCode, Clock, Layers, Code2, Database,
  Network, Cpu, Lock, TrendingUp, Flame, Hash, BookOpen,
} from 'lucide-react';
import { copyToClipboard } from '../utils/clipboard';

import {
  getState, subscribe, setActive, setPhase, setAutonomous, upsertTask,
  completeTask, failTask, incrementMetric, addLog, addRecentActivity,
  resetAgent, formatUptime, getActiveTaskCount, getCompletedTaskCount,
  PHASE_META, PHASE_ORDER,
  type AgentState, type AgentPhase, type AgentTask, type TaskStatus,
} from '../utils/autonomousAgent';

// ─── Theme ────────────────────────────────────────────────────
const C = {
  bg: '#090c14', panel: '#0f1623', border: '#1a2332',
  text: '#dde6f0', muted: '#5a7080', accent: '#7c3aed',
  green: '#10b981', yellow: '#f59e0b', red: '#ef4444',
  blue: '#3b82f6', cyan: '#06b6d4', orange: '#f97316',
  indigo: '#6366f1', pink: '#ec4899',
};

// ─── Tab definitions ──────────────────────────────────────────
type AgentTab = 'pipeline' | 'architect' | 'build' | 'runtime' | 'security'
              | 'deploy' | 'monitor' | 'improve' | 'tools' | 'log' | 'settings';

const TABS: { id: AgentTab; label: string; icon: string }[] = [
  { id: 'pipeline',  label: 'Pipeline',    icon: '⚡' },
  { id: 'architect', label: 'Architect',   icon: '🏗️' },
  { id: 'build',     label: 'Build',       icon: '🔨' },
  { id: 'runtime',   label: 'Runtime',     icon: '🌐' },
  { id: 'security',  label: 'Security',    icon: '🔒' },
  { id: 'deploy',    label: 'Deploy',      icon: '🚀' },
  { id: 'monitor',   label: 'Monitor',     icon: '📡' },
  { id: 'improve',   label: 'Improve',     icon: '🧠' },
  { id: 'tools',     label: 'All Tools',   icon: '🧰' },
  { id: 'log',       label: 'Log',         icon: '📋' },
  { id: 'settings',  label: 'Settings',    icon: '⚙️' },
];

// ─── Helpers ──────────────────────────────────────────────────
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
const ts = () => new Date().toLocaleTimeString();

function StatusPill({ status }: { status: TaskStatus }) {
  const m: Record<TaskStatus, [string, string]> = {
    idle:     ['#6b728022', '#6b7280'],
    queued:   ['#f59e0b22', '#f59e0b'],
    running:  ['#3b82f622', '#3b82f6'],
    complete: ['#10b98122', '#10b981'],
    error:    ['#ef444422', '#ef4444'],
    warning:  ['#f59e0b22', '#f59e0b'],
    skipped:  ['#6b728022', '#6b7280'],
  };
  const [bg, col] = m[status];
  return (
    <span className="text-xs font-bold px-2 py-0.5 rounded-full capitalize"
      style={{ background: bg, color: col, border: `1px solid ${col}44` }}>
      {status === 'running' ? <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full animate-pulse inline-block" style={{ background: col }} />{status}</span> : status}
    </span>
  );
}

function ProgressBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="h-1.5 rounded-full overflow-hidden w-full" style={{ background: C.border }}>
      <div className="h-full rounded-full transition-all duration-500"
        style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}99, ${color})` }} />
    </div>
  );
}

function LogLine({ level, message }: { level: string; message: string }) {
  const col = level === 'error' ? C.red : level === 'warn' ? C.yellow : level === 'success' ? C.green : level === 'system' ? C.cyan : C.muted;
  const prefix = level === 'error' ? '✗' : level === 'success' ? '✓' : level === 'warn' ? '⚠' : level === 'system' ? '⬡' : '›';
  return (
    <div className="text-xs font-mono" style={{ color: col }}>
      {prefix} {message}
    </div>
  );
}

// ─── Simulation data ──────────────────────────────────────────

const ARCHITECT_LOG = [
  'Parsing project intent and constraints…',
  'Evaluating tech stack options (Next.js / React+Vite / T3)…',
  'Selecting optimal architecture based on vertical…',
  'Designing folder structure and module boundaries…',
  'Planning API surface and data flow graph…',
  'Estimating scale requirements and auth model…',
  'Generating file dependency graph…',
  '✓ Blueprint complete — 6 modules, 14 components, 8 API routes',
];

const CODEGEN_LOG = [
  'Scaffolding project root and config files…',
  'Writing src/App.tsx — root router and providers…',
  'Generating Dashboard page with metric cards…',
  'Building Header, Sidebar, Button component atoms…',
  'Writing /api/auth.ts — JWT middleware + session…',
  'Creating useAuth, useData hooks…',
  'Writing Zod validation schemas…',
  'Running TypeScript strict-mode check…',
  '✓ Code gen complete — 18 files, 2,847 lines',
];

const BUILD_LOG = [
  '$ npm install — resolving dependencies…',
  'Peer dependency check passed',
  '$ npm run build',
  'Compiling TypeScript…',
  'Error: Type string | undefined not assignable to string [TS2322]',
  '→ AI patch: add null guard at src/components/Header.tsx:34',
  'Re-running build…',
  'ESLint: Missing dependency in useEffect [react-hooks/exhaustive-deps]',
  '→ AI patch: added fetchUser to deps array',
  'Re-running build…',
  'Build successful ✓ — 0 errors, 0 warnings',
  'Bundle: 312KB gzipped',
];

const RUNTIME_LOG = [
  'Launching headless Chromium via Playwright…',
  'Loading http://localhost:3000…',
  'Checking console errors… none',
  'Checking React hydration… clean',
  'Navigating to /dashboard…',
  'Verifying metric cards render… ✓',
  'Checking navigation links… ✓',
  'Verifying form submission on /login… ✓',
  'Checking for blank pages… none',
  'Checking for missing images… none',
  '✓ Runtime simulation complete — no UI issues found',
];

const SECURITY_LOG = [
  'Scanning for XSS injection vectors…',
  'Found: unescaped user input in <SearchBar /> — line 44',
  '→ Patched: applied DOMPurify.sanitize() wrapper',
  'Scanning for SQL injection patterns…',
  'Scanning API routes for auth gaps…',
  'Found: /api/admin route missing JWT verification',
  '→ Patched: added requireAuth() middleware',
  'Scanning for exposed secrets in source…',
  'Checking CORS configuration…',
  'Scanning dependency CVEs…',
  '✓ Security scan complete — 2 issues found and patched',
];

const DEPLOY_LOG = [
  'Building production bundle…',
  'Optimizing assets and splitting chunks…',
  'Uploading to Vercel edge network…',
  'Configuring environment variables…',
  'Running database migrations…',
  'Configuring SSL/TLS…',
  'Warming up edge functions…',
  '✓ Deployment complete — https://my-app.vercel.app',
];

const MONITOR_LOG = [
  'Attaching to production error stream…',
  'Monitoring /api/* response times…',
  'Average latency: 42ms ✓',
  'Error rate: 0.02% ✓',
  'Memory usage: 68MB / 512MB ✓',
  'User session events flowing…',
  'No crashes detected in last 24h',
  'Slow query detected: getUserMetrics > 800ms',
  '→ AI patch: added index on users.created_at',
  'Re-deploying patch…',
  '✓ Query latency normalized to 45ms',
];

const IMPROVE_LOG = [
  'Analyzing user behavior telemetry…',
  'Session heatmap: Dashboard is high-engagement ✓',
  'Drop-off at /onboarding step 3 detected — 68% exit rate',
  '→ Suggestion: simplify form — reduce fields from 7 to 3',
  'Analyzing render performance…',
  'Found: Dashboard re-renders 14× per second due to polling',
  '→ Fix: moved polling to background worker, memoized output',
  'Lighthouse score: 72 → analyzing…',
  '→ Preloading hero image, deferring non-critical CSS',
  '→ Lighthouse score improved to 91',
  '✓ Self-improvement cycle complete — 3 UX enhancements applied',
];

// ─── Component ────────────────────────────────────────────────

interface AutonomousAgentProps {
  onBack: () => void;
  onOpenEliteBuilder?: () => void;
  onOpenGitRepair?: () => void;
  onOpenCodeAssistant?: () => void;
  onOpenBlogFactory?: () => void;
  onOpenBlogIntelligence?: () => void;
  onOpenCampaignManager?: () => void;
}

export function AutonomousAgent({
  onBack, onOpenEliteBuilder, onOpenGitRepair,
  onOpenCodeAssistant, onOpenBlogFactory,
  onOpenBlogIntelligence, onOpenCampaignManager,
}: AutonomousAgentProps) {

  const [agentState, setAgentState] = useState<AgentState>(getState());
  const [activeTab, setActiveTab]   = useState<AgentTab>('pipeline');
  const [isRunning, setIsRunning]   = useState(false);
  const [runPhase, setRunPhase]     = useState<AgentPhase>('idle');
  const [phaseLogs, setPhaseLogs]   = useState<Record<string, string[]>>({});
  const [phaseProgress, setPhaseProgress] = useState<Record<string, number>>({});
  const [phaseStatus, setPhaseStatus]     = useState<Record<string, TaskStatus>>({});
  const [projectName, setProjectName]     = useState('');
  const [projectStack, setProjectStack]   = useState('nextjs');
  const [copied, setCopied] = useState('');
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = subscribe(s => setAgentState({ ...s }));
    return unsub;
  }, []);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [agentState.globalLog]);

  // ── Run the full autonomous pipeline ──────────────────────
  const runFullPipeline = useCallback(async () => {
    if (isRunning) return;
    setIsRunning(true);
    setActive(true);
    setPhaseLogs({});
    setPhaseProgress({});
    setPhaseStatus({});

    const addPhaseLog = (phase: string, msg: string) => {
      setPhaseLogs(prev => ({ ...prev, [phase]: [...(prev[phase] ?? []), msg] }));
    };

    const runPhaseSimulation = async (phase: AgentPhase, logs: string[]) => {
      setRunPhase(phase);
      setPhase(phase);
      setPhaseStatus(prev => ({ ...prev, [phase]: 'running' }));
      addLog('system', `▶ Starting ${PHASE_META[phase].label} phase`, phase);

      for (let i = 0; i < logs.length; i++) {
        await sleep(320 + Math.random() * 180);
        addPhaseLog(phase, logs[i]);
        setPhaseProgress(prev => ({ ...prev, [phase]: Math.round(((i + 1) / logs.length) * 100) }));
        addLog(
          logs[i].startsWith('✓') ? 'success' : logs[i].startsWith('Error') || logs[i].startsWith('Found:') ? 'error' : logs[i].startsWith('→') ? 'warn' : 'info',
          logs[i], phase
        );
      }

      setPhaseStatus(prev => ({ ...prev, [phase]: 'complete' }));
      addLog('success', `✓ ${PHASE_META[phase].label} complete`, phase);
      addRecentActivity(`${PHASE_META[phase].icon} ${PHASE_META[phase].label} phase completed`);

      // Update metrics per phase
      if (phase === 'build') incrementMetric('buildAttempts', 2), incrementMetric('buildSuccesses', 1);
      if (phase === 'security') incrementMetric('securityIssuesFixed', 2), incrementMetric('bugsFixed', 2), incrementMetric('patchesApplied', 2);
      if (phase === 'testing') incrementMetric('testsPassed', 8), incrementMetric('testsFailed', 1);
      if (phase === 'codegen') incrementMetric('filesGenerated', 18);
      if (phase === 'deploy') incrementMetric('deploymentsSucceeded', 1);
      if (phase === 'build') incrementMetric('bugsFixed', 2), incrementMetric('patchesApplied', 2);
    };

    const phasePairs: [AgentPhase, string[]][] = [
      ['architect', ARCHITECT_LOG],
      ['codegen',   CODEGEN_LOG],
      ['build',     BUILD_LOG],
      ['runtime',   RUNTIME_LOG],
      ['testing',   ['Running unit tests…', '8 passed, 1 failed', '→ AI fixes failing test', 'Re-running…', '9 passed, 0 failed ✓', 'Running E2E…', '✓ All E2E tests pass']],
      ['security',  SECURITY_LOG],
      ['deploy',    DEPLOY_LOG],
      ['monitor',   MONITOR_LOG],
      ['improve',   IMPROVE_LOG],
    ];

    for (const [phase, logs] of phasePairs) {
      await runPhaseSimulation(phase, logs);
      await sleep(400);
    }

    setPhase('idle');
    setActive(false);
    setIsRunning(false);
    setRunPhase('idle');
    addLog('success', '🏁 Full autonomous pipeline complete — app designed, built, tested, secured, deployed, monitored, and optimized.', 'idle');
    addRecentActivity('🏁 Full pipeline complete — app live');
    incrementMetric('totalTasksRun', 9);
    incrementMetric('tasksComplete', 9);
    incrementMetric('loopsRun', 1);
  }, [isRunning]);

  const handleCopy = (text: string, key: string) => {
    copyToClipboard(text);
    setCopied(key);
    setTimeout(() => setCopied(''), 2000);
  };

  const phaseDone  = (p: AgentPhase) => phaseStatus[p] === 'complete';
  const phaseRunning = (p: AgentPhase) => phaseStatus[p] === 'running';
  const phaseErr   = (p: AgentPhase) => phaseStatus[p] === 'error';

  const metrics = agentState.metrics;

  // ─────────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-[90] flex flex-col overflow-hidden"
      style={{ background: C.bg, color: C.text, fontFamily: '"JetBrains Mono","Fira Code",Consolas,monospace' }}
    >
      {/* ── Top Bar ── */}
      <div className="flex items-center gap-3 px-5 py-2.5 border-b flex-shrink-0"
        style={{ borderColor: C.border, background: C.panel }}>
        <button onClick={onBack}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all hover:bg-white/10"
          style={{ color: C.muted, border: `1px solid ${C.border}` }}>
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>
        <div className="w-px h-5" style={{ background: C.border }} />

        {/* Branding */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-base"
            style={{ background: C.accent + '33', border: `1px solid ${C.accent}55` }}>🤖</div>
          <div>
            <span className="text-sm font-bold" style={{ color: C.text }}>Autonomous Dev Agent</span>
            <span className="ml-2 text-xs px-2 py-0.5 rounded-full"
              style={{ background: C.accent + '22', color: C.accent }}>Ultra System</span>
          </div>
        </div>

        {/* Phase pipeline strip */}
        <div className="flex items-center gap-1 mx-3 flex-1 overflow-x-auto">
          {PHASE_ORDER.map((p, i) => {
            const done = phaseDone(p);
            const running = phaseRunning(p);
            const err = phaseErr(p);
            const meta = PHASE_META[p];
            return (
              <div key={p} className="flex items-center gap-0.5 shrink-0">
                <div
                  className="flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium cursor-pointer transition-all"
                  style={{
                    background: done ? meta.color + '22' : running ? meta.color + '33' : 'transparent',
                    border: `1px solid ${done || running ? meta.color + '66' : C.border}`,
                    color: done ? meta.color : running ? C.text : C.muted,
                  }}
                  onClick={() => setActiveTab(p as AgentTab)}
                >
                  <span className="text-sm">{meta.icon}</span>
                  <span className="hidden xl:inline">{meta.label}</span>
                  {running && <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: meta.color }} />}
                  {done && <CheckCircle className="w-3 h-3" style={{ color: meta.color }} />}
                  {err && <AlertCircle className="w-3 h-3" style={{ color: C.red }} />}
                </div>
                {i < PHASE_ORDER.length - 1 && (
                  <ChevronRight className="w-3 h-3 shrink-0" style={{ color: C.muted }} />
                )}
              </div>
            );
          })}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Run/Stop */}
          <button
            onClick={isRunning ? () => { setIsRunning(false); setActive(false); } : runFullPipeline}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all"
            style={{
              background: isRunning ? C.red + '22' : `linear-gradient(135deg, ${C.accent}, ${C.blue})`,
              color: isRunning ? C.red : 'white',
              border: isRunning ? `1px solid ${C.red}55` : 'none',
            }}
          >
            {isRunning
              ? <><Pause className="w-3.5 h-3.5" /> Stop</>
              : <><Play className="w-3.5 h-3.5" /> Run Pipeline</>}
          </button>
          <button onClick={() => resetAgent()}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            style={{ color: C.muted }} title="Reset agent state">
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Tab Bar ── */}
      <div className="flex items-center border-b flex-shrink-0 overflow-x-auto px-2"
        style={{ borderColor: C.border, background: C.panel }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-all whitespace-nowrap"
            style={{
              borderBottomColor: activeTab === tab.id ? C.accent : 'transparent',
              color: activeTab === tab.id ? C.text : C.muted,
              background: activeTab === tab.id ? C.accent + '11' : 'transparent',
            }}>
            <span>{tab.icon}</span><span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-hidden">

        {/* ══════════════ PIPELINE TAB ══════════════ */}
        {activeTab === 'pipeline' && (
          <div className="h-full overflow-y-auto p-6 space-y-6">

            {/* Metric cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
              {[
                { label: 'Bugs Fixed',     val: metrics.bugsFixed,            col: C.green  },
                { label: 'Files Gen.',     val: metrics.filesGenerated,        col: C.blue   },
                { label: 'Patches',        val: metrics.patchesApplied,        col: C.yellow },
                { label: 'Tests Pass',     val: metrics.testsPassed,           col: C.cyan   },
                { label: 'Security',       val: metrics.securityIssuesFixed,   col: C.red    },
                { label: 'Deployments',    val: metrics.deploymentsSucceeded,  col: C.accent },
                { label: 'Uptime',         val: formatUptime(metrics.uptimeSeconds), col: C.orange },
              ].map(m => (
                <div key={m.label} className="p-3 rounded-xl text-center"
                  style={{ background: C.panel, border: `1px solid ${C.border}` }}>
                  <div className="text-xl font-black" style={{ color: m.col, fontFamily: 'system-ui' }}>{m.val}</div>
                  <div className="text-xs mt-0.5" style={{ color: C.muted }}>{m.label}</div>
                </div>
              ))}
            </div>

            {/* Pipeline flow */}
            <div className="p-5 rounded-2xl" style={{ background: C.panel, border: `1px solid ${C.border}` }}>
              <div className="flex items-center gap-2 mb-5">
                <span className="text-sm font-bold" style={{ color: C.text, fontFamily: 'system-ui' }}>
                  Autonomous Lifecycle — Idea → Working App
                </span>
                {isRunning && (
                  <div className="flex items-center gap-1.5 ml-auto text-xs" style={{ color: C.yellow }}>
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    {PHASE_META[runPhase]?.label ?? 'Running'}…
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-3">
                {PHASE_ORDER.map((phase, i) => {
                  const meta = PHASE_META[phase];
                  const done = phaseDone(phase);
                  const running = phaseRunning(phase);
                  const prog = phaseProgress[phase] ?? 0;
                  return (
                    <div key={phase} className="flex items-center gap-2">
                      <div
                        onClick={() => setActiveTab(phase as AgentTab)}
                        className="cursor-pointer p-4 rounded-xl transition-all hover:scale-105 w-32"
                        style={{
                          background: done ? meta.color + '22' : running ? meta.color + '33' : C.bg,
                          border: `2px solid ${done ? meta.color + '88' : running ? meta.color : C.border}`,
                        }}
                      >
                        <div className="text-2xl mb-2 text-center">{meta.icon}</div>
                        <div className="text-xs font-bold text-center mb-1" style={{ color: done ? meta.color : C.text, fontFamily: 'system-ui' }}>
                          {meta.label}
                        </div>
                        {running ? (
                          <ProgressBar pct={prog} color={meta.color} />
                        ) : done ? (
                          <div className="text-center"><CheckCircle className="w-4 h-4 mx-auto" style={{ color: meta.color }} /></div>
                        ) : (
                          <div className="h-1.5 rounded-full" style={{ background: C.border }} />
                        )}
                      </div>
                      {i < PHASE_ORDER.length - 1 && (
                        <ChevronRight className="w-4 h-4 shrink-0" style={{ color: C.muted }} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Project setup */}
            <div className="p-5 rounded-2xl" style={{ background: C.panel, border: `1px solid ${C.border}` }}>
              <div className="text-sm font-bold mb-4" style={{ color: C.text, fontFamily: 'system-ui' }}>New Project</div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-widest block mb-2" style={{ color: C.muted }}>Project Name</label>
                  <input value={projectName} onChange={e => setProjectName(e.target.value)}
                    placeholder="e.g. SaaS Dashboard"
                    className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                    style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.text }} />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-widest block mb-2" style={{ color: C.muted }}>Stack</label>
                  <select value={projectStack} onChange={e => setProjectStack(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                    style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.text }}>
                    <option value="nextjs">Next.js 14 + Tailwind</option>
                    <option value="vite">React + Vite + TS</option>
                    <option value="t3">T3 Stack (tRPC+Prisma)</option>
                    <option value="remix">Remix + Supabase</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={runFullPipeline}
                    disabled={isRunning || !projectName.trim()}
                    className="w-full py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
                    style={{
                      background: isRunning || !projectName.trim() ? C.border : `linear-gradient(135deg, ${C.accent}, ${C.blue})`,
                      color: isRunning || !projectName.trim() ? C.muted : 'white',
                    }}
                  >
                    <Rocket className="w-4 h-4" />
                    {isRunning ? 'Running…' : 'Build Full App'}
                  </button>
                </div>
              </div>
            </div>

            {/* Self-improvement loop description */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { icon: '🔄', title: 'Self-Healing Loop', desc: 'Detects errors → diagnoses → patches → rebuilds → retests until build succeeds. Runs silently in background.' },
                { icon: '📚', title: 'Fix Memory', desc: 'Remembers every fix applied. Same error reappears → instant patch without re-analysis. Growing knowledge base.' },
                { icon: '🧠', title: 'Self-Improvement', desc: 'Analyzes user behavior, identifies UX friction points, proposes and applies optimizations automatically.' },
              ].map(c => (
                <div key={c.title} className="p-4 rounded-xl" style={{ background: C.panel, border: `1px solid ${C.border}` }}>
                  <div className="text-2xl mb-2">{c.icon}</div>
                  <div className="text-sm font-bold mb-1" style={{ color: C.text, fontFamily: 'system-ui' }}>{c.title}</div>
                  <div className="text-xs leading-relaxed" style={{ color: C.muted }}>{c.desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══════════════ PHASE TABS (shared layout) ══════════════ */}
        {(['architect','build','runtime','security','deploy','monitor','improve'] as AgentPhase[]).includes(activeTab as AgentPhase) && (
          <div className="h-full flex overflow-hidden">
            {/* Log panel */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-3 border-b shrink-0" style={{ borderColor: C.border }}>
                <span className="text-lg">{PHASE_META[activeTab as AgentPhase]?.icon}</span>
                <div>
                  <div className="text-sm font-bold" style={{ color: C.text, fontFamily: 'system-ui' }}>{PHASE_META[activeTab as AgentPhase]?.label}</div>
                  <div className="text-xs" style={{ color: C.muted }}>{PHASE_META[activeTab as AgentPhase]?.description}</div>
                </div>
                {phaseProgress[activeTab] !== undefined && (
                  <div className="ml-auto flex items-center gap-3">
                    <div className="w-32">
                      <ProgressBar pct={phaseProgress[activeTab] ?? 0} color={PHASE_META[activeTab as AgentPhase]?.color} />
                    </div>
                    <span className="text-xs" style={{ color: C.muted }}>{phaseProgress[activeTab]}%</span>
                  </div>
                )}
                <StatusPill status={phaseStatus[activeTab] ?? 'idle'} />
              </div>
              <div className="flex-1 overflow-y-auto p-5 space-y-1 font-mono">
                {(phaseLogs[activeTab] ?? []).length > 0
                  ? (phaseLogs[activeTab] ?? []).map((l, i) => <LogLine key={i} level={l.startsWith('✓') ? 'success' : l.startsWith('Error') || l.startsWith('Found:') ? 'error' : l.startsWith('→') ? 'warn' : 'info'} message={l} />)
                  : <div className="text-xs text-center py-20" style={{ color: C.muted }}>Run the pipeline to see {PHASE_META[activeTab as AgentPhase]?.label} logs</div>
                }
              </div>
            </div>

            {/* Side info */}
            <div className="w-72 shrink-0 border-l overflow-y-auto p-4 space-y-4" style={{ borderColor: C.border }}>
              <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: C.muted }}>What This Phase Does</div>

              {activeTab === 'architect' && (
                <>
                  {[['Frontend', 'Next.js · Tailwind · shadcn/ui'], ['Backend', 'Node API · AI Services · Supabase'], ['Infra', 'Auth · Storage · Vercel · Docker']].map(([k, v]) => (
                    <div key={k} className="p-3 rounded-xl" style={{ background: C.bg, border: `1px solid ${C.border}` }}>
                      <div className="text-xs font-bold" style={{ color: C.accent }}>{k}</div>
                      <div className="text-xs mt-0.5" style={{ color: C.muted }}>{v}</div>
                    </div>
                  ))}
                  <div className="p-3 rounded-xl text-xs" style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.muted }}>
                    Outputs: project blueprint, file structure, dependency list, API surface, DB schema plan
                  </div>
                </>
              )}

              {activeTab === 'build' && (
                <>
                  <div className="p-3 rounded-xl text-xs space-y-2" style={{ background: C.bg, border: `1px solid ${C.border}` }}>
                    <div className="font-bold" style={{ color: C.yellow }}>Self-Healing Loop</div>
                    {['detect error', 'diagnose cause', 'generate patch', 'apply patch', 'rebuild', 'run tests', 'repeat until success'].map((s, i) => (
                      <div key={s} className="flex items-center gap-2" style={{ color: C.muted }}>
                        <span style={{ color: C.accent }}>{i + 1}.</span> {s}
                      </div>
                    ))}
                  </div>
                  <div className="p-3 rounded-xl text-xs" style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.muted }}>
                    Tools: TypeScript compiler, ESLint, AST parser, dependency resolver, Vite/webpack
                  </div>
                </>
              )}

              {activeTab === 'runtime' && (
                <div className="space-y-2">
                  {[['Playwright', 'E2E browser automation'], ['Puppeteer', 'Headless Chrome control'], ['Visual diff', 'Layout regression detection'], ['React DevTools', 'Hydration error detection']].map(([tool, desc]) => (
                    <div key={tool} className="p-3 rounded-xl text-xs" style={{ background: C.bg, border: `1px solid ${C.border}` }}>
                      <div className="font-bold" style={{ color: C.cyan }}>{tool}</div>
                      <div style={{ color: C.muted }}>{desc}</div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'security' && (
                <div className="space-y-2">
                  {[['XSS', 'Unescaped user input detection'], ['SQL Injection', 'Parameterized query enforcement'], ['Auth Gaps', 'Route protection verification'], ['API Exposure', 'Secret + CORS scanning'], ['CVE Scan', 'Dependency vulnerability check']].map(([v, d]) => (
                    <div key={v} className="p-3 rounded-xl text-xs" style={{ background: C.bg, border: `1px solid ${C.border}` }}>
                      <div className="font-bold" style={{ color: C.red }}>{v}</div>
                      <div style={{ color: C.muted }}>{d}</div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'deploy' && (
                <div className="space-y-2">
                  {['Vercel (Edge)', 'AWS Lambda', 'Cloudflare Workers', 'Docker Container', 'Railway'].map(target => (
                    <div key={target} className="p-3 rounded-xl text-xs flex items-center gap-2" style={{ background: C.bg, border: `1px solid ${C.border}` }}>
                      <div className="w-2 h-2 rounded-full" style={{ background: C.green }} />
                      <span style={{ color: C.muted }}>{target}</span>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'monitor' && (
                <div className="space-y-2">
                  {[['Sentry', 'Error tracking'], ['LogRocket', 'Session replay'], ['Datadog', 'APM + metrics'], ['Uptime Robot', 'Availability'], ['Custom', 'AI anomaly detection']].map(([t, d]) => (
                    <div key={t} className="p-3 rounded-xl text-xs" style={{ background: C.bg, border: `1px solid ${C.border}` }}>
                      <div className="font-bold" style={{ color: C.blue }}>{t}</div>
                      <div style={{ color: C.muted }}>{d}</div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'improve' && (
                <div className="space-y-2">
                  {[['UX Analysis', 'Session heatmaps, drop-off detection'], ['Perf', 'Lighthouse, Core Web Vitals'], ['A/B', 'Feature experiment runner'], ['LLM Review', 'AI code quality suggestions']].map(([k, v]) => (
                    <div key={k} className="p-3 rounded-xl text-xs" style={{ background: C.bg, border: `1px solid ${C.border}` }}>
                      <div className="font-bold" style={{ color: C.orange }}>{k}</div>
                      <div style={{ color: C.muted }}>{v}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════════ TOOLS TAB ══════════════ */}
        {activeTab === 'tools' && (
          <div className="h-full overflow-y-auto p-6">
            <div className="mb-4">
              <div className="text-sm font-bold mb-1" style={{ color: C.text, fontFamily: 'system-ui' }}>All Developer Tools</div>
              <div className="text-xs" style={{ color: C.muted }}>All tools are hidden from the main UI. Access them here or via keyboard shortcuts.</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                {
                  icon: '⚡', title: 'Elite App Builder',
                  desc: 'Multi-agent code generator — Architect, UI, Backend, Database, QA, Refactor agents. Builds production-ready apps from a prompt.',
                  tags: ['codegen', 'multi-agent', 'full-stack'],
                  color: C.accent,
                  action: () => { onBack(); setTimeout(() => onOpenEliteBuilder?.(), 100); },
                  shortcut: '⌘B',
                },
                {
                  icon: '🔧', title: 'Git Repair',
                  desc: 'Self-healing build system. Connects to GitHub, scans for errors (TypeScript, ESLint, runtime, hydration, deps), auto-fixes and creates PRs.',
                  tags: ['self-healing', 'github', 'auto-fix'],
                  color: C.red,
                  action: () => { onBack(); setTimeout(() => onOpenGitRepair?.(), 100); },
                  shortcut: '⌘G',
                },
                {
                  icon: '💬', title: 'AI Code Assistant',
                  desc: 'Figma AI Chat and GitHub Copilot-grade assistant. Scans repo files, identifies relevant files, returns fully corrected rewrites.',
                  tags: ['chat', 'code-repair', 'file-bridge'],
                  color: C.indigo,
                  action: () => { onBack(); setTimeout(() => onOpenCodeAssistant?.(), 100); },
                  shortcut: '⌘K',
                },
                {
                  icon: '✍️', title: 'AI Blog Factory',
                  desc: 'Long-form blog engine — topical authority clustering, 1,500–2,500 word articles, 6-tab pipeline (Sources → Topics → Write → Repurpose → SEO → Publish).',
                  tags: ['blog', 'seo', 'publishing'],
                  color: C.pink,
                  action: () => { onBack(); setTimeout(() => onOpenBlogFactory?.(), 100); },
                  shortcut: '⌘F',
                },
                {
                  icon: '📊', title: 'Blog Intelligence',
                  desc: 'Blog analytics dashboard — content gap analysis, keyword opportunity finder, competitor tracking, topical authority scoring.',
                  tags: ['analytics', 'seo', 'content'],
                  color: C.cyan,
                  action: () => { onBack(); setTimeout(() => onOpenBlogIntelligence?.(), 100); },
                  shortcut: '⌘I',
                },
                {
                  icon: '📈', title: 'Campaign Manager',
                  desc: 'Multi-platform ad campaign tracker — ROAS, CTR, CPC, impressions, conversions. AI-powered budget optimization.',
                  tags: ['ads', 'analytics', 'campaigns'],
                  color: C.yellow,
                  action: () => { onBack(); setTimeout(() => onOpenCampaignManager?.(), 100); },
                  shortcut: '⌘M',
                },
              ].map(tool => (
                <div key={tool.title}
                  className="p-5 rounded-2xl cursor-pointer transition-all hover:scale-[1.01]"
                  style={{ background: C.panel, border: `1px solid ${C.border}` }}
                  onClick={tool.action}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="text-2xl">{tool.icon}</div>
                    <span className="text-xs font-mono px-2 py-0.5 rounded"
                      style={{ background: C.bg, color: C.muted, border: `1px solid ${C.border}` }}>
                      {tool.shortcut}
                    </span>
                  </div>
                  <div className="font-bold text-sm mb-1" style={{ color: C.text, fontFamily: 'system-ui' }}>{tool.title}</div>
                  <div className="text-xs leading-relaxed mb-3" style={{ color: C.muted }}>{tool.desc}</div>
                  <div className="flex flex-wrap gap-1">
                    {tool.tags.map(tag => (
                      <span key={tag} className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: tool.color + '22', color: tool.color, border: `1px solid ${tool.color}44` }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="mt-3 flex items-center gap-1 text-xs font-semibold" style={{ color: tool.color }}>
                    Open tool <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              ))}
            </div>

            {/* Hidden by design notice */}
            <div className="mt-6 p-4 rounded-xl flex items-start gap-3"
              style={{ background: C.accent + '11', border: `1px solid ${C.accent}33` }}>
              <Eye className="w-4 h-4 shrink-0 mt-0.5" style={{ color: C.accent }} />
              <div>
                <div className="text-xs font-bold mb-1" style={{ color: C.accent }}>Hidden by Design</div>
                <div className="text-xs leading-relaxed" style={{ color: C.muted }}>
                  All tools above are intentionally removed from the main nav to keep the user interface clean.
                  They run silently in the background — this cockpit is the only way to access them.
                  The badge in the nav bar shows activity status without cluttering the UI.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════ LOG TAB ══════════════ */}
        {activeTab === 'log' && (
          <div className="h-full flex flex-col overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-3 border-b shrink-0" style={{ borderColor: C.border }}>
              <Terminal className="w-4 h-4" style={{ color: C.muted }} />
              <span className="text-sm font-bold" style={{ color: C.text }}>Global Activity Log</span>
              <span className="text-xs ml-2" style={{ color: C.muted }}>{agentState.globalLog.length} entries</span>
              <button onClick={() => handleCopy(agentState.globalLog.map(l => `[${new Date(l.ts).toLocaleTimeString()}] ${l.message}`).join('\n'), 'log')}
                className="ml-auto flex items-center gap-1 text-xs" style={{ color: C.muted }}>
                {copied === 'log' ? <Check className="w-3 h-3" style={{ color: C.green }} /> : <Copy className="w-3 h-3" />}
                Copy All
              </button>
            </div>
            <div ref={logRef} className="flex-1 overflow-y-auto p-4 space-y-0.5 font-mono text-xs">
              {agentState.globalLog.length === 0
                ? <div className="text-center py-20" style={{ color: C.muted }}>Run the pipeline to see activity logs</div>
                : agentState.globalLog.map(entry => (
                  <div key={entry.id} className="flex items-start gap-2">
                    <span className="shrink-0 opacity-50">{new Date(entry.ts).toLocaleTimeString()}</span>
                    <span className="shrink-0 text-xs px-1 rounded" style={{ background: PHASE_META[entry.phase]?.color + '22', color: PHASE_META[entry.phase]?.color }}>
                      {entry.phase}
                    </span>
                    <LogLine level={entry.level} message={entry.message} />
                  </div>
                ))
              }
            </div>
          </div>
        )}

        {/* ══════════════ SETTINGS TAB ══════════════ */}
        {activeTab === 'settings' && (
          <div className="h-full overflow-y-auto p-6 space-y-5">
            <div className="text-sm font-bold mb-4" style={{ color: C.text, fontFamily: 'system-ui' }}>Agent Settings</div>

            {/* Autonomous mode */}
            <div className="p-5 rounded-2xl" style={{ background: C.panel, border: `1px solid ${C.border}` }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="font-bold text-sm" style={{ color: C.text, fontFamily: 'system-ui' }}>Autonomous Mode</div>
                  <div className="text-xs mt-0.5" style={{ color: C.muted }}>Agent fixes all errors automatically without asking for confirmation</div>
                </div>
                <button onClick={() => setAutonomous(!agentState.isAutonomous)}
                  className="w-12 h-6 rounded-full transition-all relative"
                  style={{ background: agentState.isAutonomous ? C.green + '88' : C.border }}>
                  <div className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all"
                    style={{ left: agentState.isAutonomous ? '26px' : '2px' }} />
                </button>
              </div>

              <div className="space-y-3">
                {[
                  ['Auto-fix TypeScript errors', true],
                  ['Auto-fix ESLint warnings', true],
                  ['Auto-resolve dependency conflicts', true],
                  ['Auto-patch security vulnerabilities', true],
                  ['Auto-commit fixes to Git', agentState.isAutonomous],
                  ['Auto-deploy on clean build', agentState.isAutonomous],
                  ['Auto-apply UX improvements', false],
                ].map(([label, enabled]) => (
                  <div key={label as string} className="flex items-center justify-between py-2 border-t" style={{ borderColor: C.border }}>
                    <span className="text-sm" style={{ color: C.muted, fontFamily: 'system-ui' }}>{label as string}</span>
                    <div className="w-2 h-2 rounded-full" style={{ background: enabled ? C.green : C.muted }} />
                  </div>
                ))}
              </div>
            </div>

            {/* Hidden from main UI */}
            <div className="p-5 rounded-2xl" style={{ background: C.panel, border: `1px solid ${C.border}` }}>
              <div className="font-bold text-sm mb-3" style={{ color: C.text, fontFamily: 'system-ui' }}>Visibility Settings</div>
              <div className="space-y-3 text-sm">
                {[
                  ['Elite App Builder', 'Hidden — accessible from Tools tab'],
                  ['Git Repair System', 'Hidden — accessible from Tools tab'],
                  ['AI Code Assistant', 'Hidden — accessible from Tools tab'],
                  ['AI Blog Factory', 'Hidden — accessible from Tools tab'],
                  ['Blog Intelligence', 'Hidden — accessible from Tools tab'],
                  ['Campaign Manager', 'Hidden — accessible from Tools tab'],
                  ['Agent Status Badge', 'Visible — minimal indicator in nav'],
                ].map(([tool, status]) => (
                  <div key={tool} className="flex items-center justify-between py-2 border-t" style={{ borderColor: C.border }}>
                    <span style={{ color: C.text, fontFamily: 'system-ui' }}>{tool}</span>
                    <span className="text-xs" style={{ color: status.startsWith('Visible') ? C.green : C.muted }}>{status}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Reset */}
            <div className="p-5 rounded-2xl" style={{ background: C.panel, border: `1px solid ${C.border}` }}>
              <div className="font-bold text-sm mb-2" style={{ color: C.text, fontFamily: 'system-ui' }}>Danger Zone</div>
              <button onClick={() => { if (window.confirm('Reset all agent state and metrics?')) resetAgent(); }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all"
                style={{ background: C.red + '22', color: C.red, border: `1px solid ${C.red}44` }}>
                <RotateCcw className="w-3.5 h-3.5" /> Reset Agent State
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}