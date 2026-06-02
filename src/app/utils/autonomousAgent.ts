// ================================================================
// AUTONOMOUS DEV AGENT — Background State Engine
// Runs silently. Users see only the badge unless they open the page.
// Persists across sessions via localStorage.
// ================================================================

export type AgentPhase =
  | 'idle' | 'architect' | 'codegen' | 'build'
  | 'runtime' | 'testing' | 'security' | 'deploy'
  | 'monitor' | 'improve';

export type TaskStatus = 'idle' | 'queued' | 'running' | 'complete' | 'error' | 'warning' | 'skipped';

export interface LogEntry {
  id: string;
  ts: number;
  level: 'info' | 'warn' | 'error' | 'success' | 'debug' | 'system';
  message: string;
  phase: AgentPhase;
}

export interface AgentTask {
  id: string;
  phase: AgentPhase;
  label: string;
  description: string;
  status: TaskStatus;
  progress: number;       // 0–100
  startedAt?: number;     // Date.now()
  completedAt?: number;
  log: string[];
  errorsFixed: number;
  filesProcessed: number;
  result?: string;
}

export interface AgentMetrics {
  totalTasksRun: number;
  tasksComplete: number;
  bugsFixed: number;
  buildAttempts: number;
  buildSuccesses: number;
  deploymentsSucceeded: number;
  uptimeSeconds: number;
  errorsDetected: number;
  securityIssuesFixed: number;
  testsPassed: number;
  testsFailed: number;
  patchesApplied: number;
  filesGenerated: number;
  loopsRun: number;
}

export interface ProjectContext {
  name: string;
  stack: string;
  repoUrl: string;
  lastActivity: number;
  phase: AgentPhase;
}

export interface AgentState {
  schemaVersion: number;
  isActive: boolean;
  isAutonomous: boolean;    // fully autonomous or manual confirmation required
  currentPhase: AgentPhase;
  sessionStart: number;
  lastUpdated: number;
  tasks: AgentTask[];
  metrics: AgentMetrics;
  globalLog: LogEntry[];    // rolling 200-entry log
  projectContext: ProjectContext | null;
  recentActivity: string[]; // last 5 human-readable summaries (for badge tooltip)
  pendingActions: string[]; // actions waiting for user confirmation (if not autonomous)
}

// ─── Defaults ─────────────────────────────────────────────────

const DEFAULT_METRICS: AgentMetrics = {
  totalTasksRun: 0, tasksComplete: 0, bugsFixed: 0,
  buildAttempts: 0, buildSuccesses: 0, deploymentsSucceeded: 0,
  uptimeSeconds: 0, errorsDetected: 0, securityIssuesFixed: 0,
  testsPassed: 0, testsFailed: 0, patchesApplied: 0,
  filesGenerated: 0, loopsRun: 0,
};

const DEFAULT_STATE: AgentState = {
  schemaVersion: 3,
  isActive: false,
  isAutonomous: true,
  currentPhase: 'idle',
  sessionStart: Date.now(),
  lastUpdated: Date.now(),
  tasks: [],
  metrics: { ...DEFAULT_METRICS },
  globalLog: [],
  projectContext: null,
  recentActivity: [],
  pendingActions: [],
};

const STORAGE_KEY = 'autonomous_dev_agent_state_v3';
const MAX_LOG_ENTRIES = 200;
const MAX_RECENT = 5;

// ─── Subscribers ───────────────────────────────────────────────

type Listener = (state: AgentState) => void;
const listeners: Set<Listener> = new Set();

function notify(state: AgentState) {
  listeners.forEach(l => { try { l(state); } catch {} });
}

// ─── State management ─────────────────────────────────────────

function load(): AgentState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STATE };
    const parsed = JSON.parse(raw) as AgentState;
    // Version guard — reset if schema changed
    if (parsed.schemaVersion !== DEFAULT_STATE.schemaVersion) return { ...DEFAULT_STATE };
    return { ...DEFAULT_STATE, ...parsed, metrics: { ...DEFAULT_METRICS, ...parsed.metrics } };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

function save(state: AgentState) {
  try {
    // Keep log trimmed
    const trimmed = { ...state, globalLog: state.globalLog.slice(-MAX_LOG_ENTRIES) };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {}
}

let _state: AgentState = load();

export function getState(): AgentState {
  return _state;
}

function setState(updater: (prev: AgentState) => AgentState) {
  _state = updater(_state);
  _state.lastUpdated = Date.now();
  save(_state);
  notify(_state);
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// ─── Log helpers ───────────────────────────────────────────────

let _logSeq = 0;
function makeLog(level: LogEntry['level'], message: string, phase: AgentPhase): LogEntry {
  return { id: `log-${Date.now()}-${_logSeq++}`, ts: Date.now(), level, message, phase };
}

export function addLog(level: LogEntry['level'], message: string, phase?: AgentPhase) {
  setState(prev => ({
    ...prev,
    globalLog: [...prev.globalLog, makeLog(level, message, phase ?? prev.currentPhase)],
  }));
}

// ─── Phase & Task API ─────────────────────────────────────────

export function setActive(active: boolean) {
  setState(prev => ({
    ...prev,
    isActive: active,
    currentPhase: active ? prev.currentPhase : 'idle',
  }));
}

export function setPhase(phase: AgentPhase) {
  setState(prev => ({ ...prev, currentPhase: phase }));
  addLog('system', `Phase → ${phase.toUpperCase()}`, phase);
}

export function setAutonomous(autonomous: boolean) {
  setState(prev => ({ ...prev, isAutonomous: autonomous }));
}

export function setProjectContext(ctx: ProjectContext) {
  setState(prev => ({ ...prev, projectContext: ctx }));
}

export function upsertTask(task: Partial<AgentTask> & { id: string }) {
  setState(prev => {
    const existing = prev.tasks.find(t => t.id === task.id);
    if (existing) {
      return { ...prev, tasks: prev.tasks.map(t => t.id === task.id ? { ...t, ...task } : t) };
    }
    const newTask: AgentTask = {
      phase: 'idle', label: task.id, description: '', status: 'idle',
      progress: 0, log: [], errorsFixed: 0, filesProcessed: 0, ...task,
    };
    return { ...prev, tasks: [...prev.tasks, newTask] };
  });
}

export function completeTask(id: string, result?: string) {
  setState(prev => ({
    ...prev,
    tasks: prev.tasks.map(t => t.id === id
      ? { ...t, status: 'complete', progress: 100, completedAt: Date.now(), result }
      : t),
    metrics: { ...prev.metrics, tasksComplete: prev.metrics.tasksComplete + 1, totalTasksRun: prev.metrics.totalTasksRun + 1 },
  }));
}

export function failTask(id: string, error: string) {
  setState(prev => ({
    ...prev,
    tasks: prev.tasks.map(t => t.id === id
      ? { ...t, status: 'error', completedAt: Date.now(), result: error }
      : t),
    metrics: { ...prev.metrics, totalTasksRun: prev.metrics.totalTasksRun + 1 },
  }));
}

export function incrementMetric(key: keyof AgentMetrics, by = 1) {
  setState(prev => ({
    ...prev,
    metrics: { ...prev.metrics, [key]: (prev.metrics[key] as number) + by },
  }));
}

export function addRecentActivity(summary: string) {
  setState(prev => ({
    ...prev,
    recentActivity: [summary, ...prev.recentActivity].slice(0, MAX_RECENT),
  }));
}

export function addPendingAction(action: string) {
  setState(prev => ({
    ...prev,
    pendingActions: [...prev.pendingActions, action],
  }));
}

export function clearPendingAction(action: string) {
  setState(prev => ({
    ...prev,
    pendingActions: prev.pendingActions.filter(a => a !== action),
  }));
}

export function resetAgent() {
  _state = { ...DEFAULT_STATE, sessionStart: Date.now() };
  save(_state);
  notify(_state);
}

// ─── Uptime ticker (background, hidden) ───────────────────────
// Silently increments uptime when agent is active. Users never see this running.

let _uptimeTicker: ReturnType<typeof setInterval> | null = null;

export function startUptimeTicker() {
  if (_uptimeTicker) return;
  _uptimeTicker = setInterval(() => {
    const s = getState();
    if (s.isActive) {
      setState(prev => ({
        ...prev,
        metrics: { ...prev.metrics, uptimeSeconds: prev.metrics.uptimeSeconds + 1 },
      }));
    }
  }, 1000);
}

export function stopUptimeTicker() {
  if (_uptimeTicker) { clearInterval(_uptimeTicker); _uptimeTicker = null; }
}

// ─── Phase metadata (used by UI) ──────────────────────────────

export const PHASE_META: Record<AgentPhase, { label: string; icon: string; description: string; color: string }> = {
  idle:      { label: 'Idle',           icon: '😴', description: 'Agent is standing by',                                              color: '#6b7280' },
  architect: { label: 'Architect',      icon: '🏗️', description: 'Designing system architecture, file structure, tech stack',         color: '#7c3aed' },
  codegen:   { label: 'Code Gen',       icon: '✍️', description: 'Generating pages, components, API routes, hooks, utilities',        color: '#0ea5e9' },
  build:     { label: 'Build Engine',   icon: '🔨', description: 'Running npm install + build, looping until success',                color: '#f59e0b' },
  runtime:   { label: 'Runtime Sim',    icon: '🌐', description: 'Headless browser checks — routes, hydration, broken components',   color: '#06b6d4' },
  testing:   { label: 'Testing',        icon: '🧪', description: 'Unit, integration, component, E2E tests with auto-fix on fail',    color: '#10b981' },
  security:  { label: 'Security',       icon: '🔒', description: 'XSS, SQL injection, auth gaps, API exposure — auto-patched',       color: '#ef4444' },
  deploy:    { label: 'Deploy',         icon: '🚀', description: 'Build, bundle, upload, configure environment, launch',             color: '#8b5cf6' },
  monitor:   { label: 'Monitor',        icon: '📡', description: 'Live production monitoring — errors, crashes, slow queries',        color: '#3b82f6' },
  improve:   { label: 'Improve',        icon: '🧠', description: 'UX analysis, performance optimization, feature suggestions',       color: '#f97316' },
};

export const PHASE_ORDER: AgentPhase[] = [
  'architect', 'codegen', 'build', 'runtime', 'testing', 'security', 'deploy', 'monitor', 'improve',
];

// ─── Format helpers ────────────────────────────────────────────

export function formatUptime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

export function getActiveTaskCount(state: AgentState): number {
  return state.tasks.filter(t => t.status === 'running' || t.status === 'queued').length;
}

export function getCompletedTaskCount(state: AgentState): number {
  return state.tasks.filter(t => t.status === 'complete').length;
}
