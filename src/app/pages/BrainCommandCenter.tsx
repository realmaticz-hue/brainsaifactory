// ─── Brain Command Center — Full-screen AI Brain Observatory ──────────────────
// Cross-surface telemetry dashboard, memory explorer, pattern analyzer,
// timeline feed, collaboration matrix, and 12-agent drilldown.

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Brain, X, Activity, Database, Clock, TrendingUp, TrendingDown,
  Minus, RefreshCw, Download, Upload, Trash2, Search, Filter,
  ChevronRight, ChevronDown, Zap, Shield, Check, AlertTriangle,
  BarChart3, Network, Eye, MessageSquare, Code, Wrench, Star,
  ArrowUpRight, Copy,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartTooltip, ResponsiveContainer,
  AreaChart, Area, CartesianGrid, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { BrainNeuralMap } from '../components/BrainNeuralMap';
import {
  BRAIN_AGENTS, NEURAL_LINKS, GLOBAL_CONTROL_LOOP,
  getAgentHealth, getBrainActivity, getBrainTelemetry, getAgentMemory,
  clearBrainActivity, clearBrainTelemetry, clearAgentMemory,
  getAgentCollaborations, getBrainPatterns, getBrainTimeline,
  getSurfaceStats, exportBrainSnapshot, importBrainSnapshot,
  getAgentTimeSeries, simulateAgentTelemetry,
  type AgentCollaboration, type BrainPattern, type TimelineEvent, type SurfaceStats,
} from '../utils/superCodingBrain';
import {
  brainCommandEngine,
  type BrainCommand, type CommandLog,
} from '../utils/brainCommandEngine';
import {
  brainLearningEngine,
  type LearningMetrics, type KnowledgeEntry, type Suggestion, type LearningEvent,
} from '../utils/brainLearningEngine';

// ─── Types ────────────────────────────────────────────────────────────────────

type CCTab = 'overview' | 'commands' | 'learning' | 'telemetry' | 'timeline' | 'memory' | 'patterns' | 'agents';

interface BrainCommandCenterProps {
  onBack: () => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const C = {
  bg: '#030712',
  panel: '#070d1a',
  card: '#0d1629',
  border: '#1e2d4a',
  text: '#e2e8f0',
  muted: '#64748b',
  purple: '#a855f7',
  indigo: '#6366f1',
  green: '#10b981',
  red: '#ef4444',
  yellow: '#f59e0b',
  blue: '#3b82f6',
  teal: '#14b8a6',
};

const SURFACE_META: Record<string, { label: string; icon: string; color: string }> = {
  'chat': { label: 'Genius AI Chat', icon: '💬', color: '#a855f7' },
  'code-assistant': { label: 'AI Code Assistant', icon: '🛠️', color: '#3b82f6' },
  'git-repair': { label: 'Git Repair', icon: '🔧', color: '#10b981' },
};

const TAB_DEFS: { id: CCTab; label: string; icon: React.ReactNode }[] = [
  { id: 'overview', label: 'Overview', icon: <Brain className="w-3.5 h-3.5" /> },
  { id: 'commands', label: 'Commands', icon: <Code className="w-3.5 h-3.5" /> },
  { id: 'learning', label: 'Learning', icon: <TrendingUp className="w-3.5 h-3.5" /> },
  { id: 'telemetry', label: 'Telemetry', icon: <BarChart3 className="w-3.5 h-3.5" /> },
  { id: 'timeline', label: 'Timeline', icon: <Clock className="w-3.5 h-3.5" /> },
  { id: 'memory', label: 'Memory', icon: <Database className="w-3.5 h-3.5" /> },
  { id: 'patterns', label: 'Patterns', icon: <Activity className="w-3.5 h-3.5" /> },
  { id: 'agents', label: '12 Agents', icon: <Network className="w-3.5 h-3.5" /> },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function relTime(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60_000) return `${Math.round(diff / 1000)}s ago`;
  if (diff < 3_600_000) return `${Math.round(diff / 60_000)}m ago`;
  return `${Math.round(diff / 3_600_000)}h ago`;
}

function TrendBadge({ trend }: { trend: 'rising' | 'stable' | 'falling' }) {
  if (trend === 'rising') return <span className="flex items-center gap-0.5 text-green-400 text-[9px] font-semibold"><TrendingUp className="w-3 h-3" />Rising</span>;
  if (trend === 'falling') return <span className="flex items-center gap-0.5 text-red-400 text-[9px] font-semibold"><TrendingDown className="w-3 h-3" />Falling</span>;
  return <span className="flex items-center gap-0.5 text-gray-500 text-[9px] font-semibold"><Minus className="w-3 h-3" />Stable</span>;
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────

function OverviewTab({ selectedAgent, onSelectAgent }: { selectedAgent: number | null; onSelectAgent: (id: number) => void }) {
  const telemetry = getBrainTelemetry();
  const activity = getBrainActivity();
  const surfStats = getSurfaceStats();

  const totalRuns = telemetry.length;
  const successRate = totalRuns ? Math.round((telemetry.filter(e => e.success).length / totalRuns) * 100) : 100;
  const avgDuration = totalRuns ? Math.round(telemetry.reduce((s, e) => s + e.duration, 0) / totalRuns) : 0;
  const activeAgents = new Set(telemetry.map(e => e.agentId));
  const allActiveIds = new Set(BRAIN_AGENTS.map(a => a.id));

  return (
    <div className="space-y-5">
      {/* ── Top stats row ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Runs', val: totalRuns, icon: <Zap className="w-4 h-4" />, color: C.purple },
          { label: 'Success Rate', val: `${successRate}%`, icon: <Check className="w-4 h-4" />, color: C.green },
          { label: 'Avg Duration', val: `${avgDuration}ms`, icon: <Clock className="w-4 h-4" />, color: C.blue },
          { label: 'Events Logged', val: activity.length, icon: <Activity className="w-4 h-4" />, color: C.teal },
        ].map(({ label, val, icon, color }) => (
          <div key={label} className="rounded-2xl p-4 border flex items-center gap-3" style={{ background: C.card, borderColor: C.border }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}18`, color }}>
              {icon}
            </div>
            <div>
              <div className="text-xl font-black leading-none" style={{ color }}>{val}</div>
              <div className="text-[10px] mt-0.5" style={{ color: C.muted }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Neural Map + Surface Stats ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Neural map */}
        <div className="rounded-2xl border overflow-hidden" style={{ background: '#050b18', borderColor: '#7c3aed33' }}>
          <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: '#7c3aed22' }}>
            <span className="text-sm font-bold" style={{ color: C.purple }}>🕸️ Live Neural Network</span>
            <span className="ml-auto text-xs" style={{ color: C.muted }}>Click nodes to explore</span>
          </div>
          <div className="flex justify-center p-4">
            <BrainNeuralMap
              activeAgentIds={allActiveIds}
              isThinking={false}
              size={320}
              compact={false}
              showHealth={true}
              onNodeClick={onSelectAgent}
            />
          </div>
          <div className="px-4 pb-3 text-center text-[10px]" style={{ color: C.muted }}>
            ↑ Click any agent node to jump to its drilldown in the Agents tab
          </div>
        </div>

        {/* Surface stats + Control loop */}
        <div className="space-y-3">
          {/* Surface cards */}
          {surfStats.map(s => (
            <div key={s.surface} className="rounded-2xl border p-4" style={{ background: C.card, borderColor: C.border }}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">{s.icon}</span>
                <span className="text-sm font-semibold" style={{ color: C.text }}>{s.label}</span>
                {s.lastActive && (
                  <span className="ml-auto text-[10px]" style={{ color: C.muted }}>{relTime(s.lastActive)}</span>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center">
                  <div className="text-lg font-black" style={{ color: SURFACE_META[s.surface]?.color ?? C.purple }}>{s.runs}</div>
                  <div className="text-[9px]" style={{ color: C.muted }}>runs</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-black" style={{ color: s.successRate > 0.8 ? C.green : s.successRate > 0.5 ? C.yellow : C.red }}>
                    {Math.round(s.successRate * 100)}%
                  </div>
                  <div className="text-[9px]" style={{ color: C.muted }}>success</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-black" style={{ color: C.blue }}>{s.avgDuration}ms</div>
                  <div className="text-[9px]" style={{ color: C.muted }}>avg</div>
                </div>
              </div>
              <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: '#1f2937' }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${Math.round(s.successRate * 100)}%`, background: SURFACE_META[s.surface]?.color ?? C.purple }}
                />
              </div>
            </div>
          ))}

          {/* Global Control Loop mini */}
          <div className="rounded-2xl border p-4" style={{ background: C.card, borderColor: C.border }}>
            <div className="text-xs font-bold mb-2.5" style={{ color: C.muted }}>⚡ GLOBAL CONTROL LOOP</div>
            <div className="grid grid-cols-3 gap-1">
              {GLOBAL_CONTROL_LOOP.map((step) => (
                <div key={step.step} className="flex items-center gap-1 text-[9px] px-1.5 py-1 rounded-lg" style={{ background: '#111827', border: `1px solid ${C.border}` }}>
                  <span>{step.icon}</span>
                  <span style={{ color: C.muted }} className="truncate">{step.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Telemetry Tab ────────────────────────────────────────────────────────────

function TelemetryTab() {
  const telemetry = getBrainTelemetry();
  const timeSeries = getAgentTimeSeries(undefined, 30_000); // 30-second buckets

  // Per-agent bar chart data
  const agentBarData = BRAIN_AGENTS.map(a => {
    const h = getAgentHealth(a.id);
    return {
      name: `${a.icon} ${a.id}`,
      fullName: a.name,
      runs: h.totalRuns,
      success: Math.round(h.successRate * 100),
      avgMs: h.avgDuration,
    };
  }).filter(d => d.runs > 0);

  // Surface pie data
  const surfaceData = getSurfaceStats().filter(s => s.runs > 0).map(s => ({
    name: SURFACE_META[s.surface]?.label ?? s.surface,
    value: s.runs,
    color: SURFACE_META[s.surface]?.color ?? C.purple,
  }));

  const customTooltipStyle = {
    backgroundColor: '#0d1629',
    border: '1px solid #1e2d4a',
    borderRadius: '10px',
    fontSize: '11px',
    color: '#e2e8f0',
  };

  if (!telemetry.length) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3" style={{ color: C.muted }}>
        <BarChart3 className="w-10 h-10 opacity-30" />
        <p className="text-sm">No telemetry recorded yet.</p>
        <p className="text-xs">Send a query in Chat, Code Assistant, or Git Repair to populate metrics.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ── Agent run counts ── */}
      <div className="rounded-2xl border p-5" style={{ background: C.card, borderColor: C.border }}>
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-bold" style={{ color: C.text }}>Agent Execution Counts</span>
          <span className="text-[10px]" style={{ color: C.muted }}>{telemetry.length} total executions</span>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={agentBarData} margin={{ top: 0, right: 0, bottom: 0, left: -25 }}>
            <defs>
              <linearGradient id="telemetry-barGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#7c3aed" stopOpacity={0.3} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4a" />
            <XAxis dataKey="name" tick={{ fill: C.muted, fontSize: 9 }} />
            <YAxis tick={{ fill: C.muted, fontSize: 9 }} />
            <RechartTooltip
              contentStyle={customTooltipStyle}
              formatter={(val: number, name: string) => [val, name === 'runs' ? 'Runs' : name]}
              labelFormatter={(label, payload) => payload?.[0]?.payload?.fullName ?? label}
            />
            <Bar dataKey="runs" radius={[4, 4, 0, 0]}
              fill="url(#telemetry-barGradient)"
            >
              {agentBarData.map((d, i) => (
                <Cell key={`bar-cell-${d.name}-${i}`} fill={`hsl(${260 + i * 8}, 70%, 55%)`} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── Success rate per agent ── */}
      <div className="rounded-2xl border p-5" style={{ background: C.card, borderColor: C.border }}>
        <span className="text-sm font-bold block mb-4" style={{ color: C.text }}>Agent Success Rate (%) — last session</span>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={agentBarData} margin={{ top: 0, right: 0, bottom: 0, left: -25 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4a" />
            <XAxis dataKey="name" tick={{ fill: C.muted, fontSize: 9 }} />
            <YAxis domain={[0, 100]} tick={{ fill: C.muted, fontSize: 9 }} />
            <RechartTooltip contentStyle={customTooltipStyle} formatter={(v: number) => [`${v}%`, 'Success']} />
            <Bar dataKey="success" radius={[4, 4, 0, 0]}>
              {agentBarData.map((d, i) => (
                <Cell key={`success-cell-${d.name}-${i}`} fill={d.success > 80 ? C.green : d.success > 50 ? C.yellow : C.red} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── Time series + Surface distribution side by side ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Execution timeline (time-series) */}
        {timeSeries.length > 1 && (
          <div className="rounded-2xl border p-5" style={{ background: C.card, borderColor: C.border }}>
            <span className="text-sm font-bold block mb-3" style={{ color: C.text }}>Execution Activity</span>
            <ResponsiveContainer width="100%" height={140}>
              <AreaChart data={timeSeries} margin={{ top: 0, right: 0, bottom: 0, left: -25 }}>
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4a" />
                <XAxis dataKey="uniqueKey" tick={{ fill: C.muted, fontSize: 9 }} tickFormatter={(val) => {
                  const item = timeSeries.find(d => d.uniqueKey === val);
                  return item?.displayTime || val;
                }} />
                <YAxis tick={{ fill: C.muted, fontSize: 9 }} />
                <RechartTooltip contentStyle={customTooltipStyle} labelFormatter={(label) => {
                  const item = timeSeries.find(d => d.uniqueKey === label);
                  return item?.displayTime || label;
                }} />
                <Area type="monotone" dataKey="runs" stroke="#7c3aed" fill="url(#areaGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Surface distribution pie */}
        {surfaceData.length > 0 && (
          <div className="rounded-2xl border p-5" style={{ background: C.card, borderColor: C.border }}>
            <span className="text-sm font-bold block mb-3" style={{ color: C.text }}>Surface Distribution</span>
            <ResponsiveContainer width="100%" height={140}>
              <PieChart>
                <Pie
                  data={surfaceData}
                  cx="50%" cy="50%"
                  innerRadius={35} outerRadius={60}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {surfaceData.map((entry, i) => (
                    <Cell key={`pie-cell-${entry.name}-${i}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartTooltip contentStyle={customTooltipStyle} />
                <Legend
                  formatter={(val) => <span style={{ color: C.muted, fontSize: 10 }}>{val}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* ── Avg duration table ── */}
      <div className="rounded-2xl border overflow-hidden" style={{ background: C.card, borderColor: C.border }}>
        <div className="px-4 py-3 border-b" style={{ borderColor: C.border }}>
          <span className="text-sm font-bold" style={{ color: C.text }}>Agent Performance Table</span>
        </div>
        <div className="divide-y" style={{ borderColor: C.border }}>
          {agentBarData.map((row) => {
            const agent = BRAIN_AGENTS.find(a => `${a.icon} ${a.id}` === row.name);
            return (
              <div key={row.name} className="flex items-center gap-3 px-4 py-2.5">
                <span className="text-base w-6 flex-shrink-0">{agent?.icon}</span>
                <span className="text-sm flex-1 font-medium" style={{ color: C.text }}>{agent?.name}</span>
                <div className="flex items-center gap-4 text-xs" style={{ color: C.muted }}>
                  <span className="w-12 text-right font-mono">{row.runs}×</span>
                  <span className="w-16 text-right font-mono" style={{ color: row.success > 80 ? C.green : row.success > 50 ? C.yellow : C.red }}>
                    {row.success}%
                  </span>
                  <span className="w-16 text-right font-mono" style={{ color: C.blue }}>{row.avgMs}ms</span>
                </div>
                <div className="w-20 h-1.5 rounded-full overflow-hidden flex-shrink-0" style={{ background: '#1f2937' }}>
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${row.success}%`, background: row.success > 80 ? C.green : row.success > 50 ? C.yellow : C.red }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Timeline Tab ─────────────────────────────────────────────────────────────

function TimelineTab() {
  const [filter, setFilter] = useState<string>('all');
  const events = getBrainTimeline(80);
  const filtered = filter === 'all' ? events : events.filter(e => e.surface === filter);

  if (!events.length) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3" style={{ color: C.muted }}>
        <Clock className="w-10 h-10 opacity-30" />
        <p className="text-sm">No timeline events yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-3.5 h-3.5 flex-shrink-0" style={{ color: C.muted }} />
        {['all', 'chat', 'code-assistant', 'git-repair'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="px-3 py-1 rounded-full text-xs font-semibold border transition-all"
            style={{
              background: filter === f ? '#7c3aed' : C.card,
              borderColor: filter === f ? '#7c3aed' : C.border,
              color: filter === f ? '#fff' : C.muted,
            }}
          >
            {f === 'all' ? 'All' : SURFACE_META[f]?.label ?? f}
          </button>
        ))}
        <span className="ml-auto text-xs" style={{ color: C.muted }}>{filtered.length} events</span>
      </div>

      {/* Timeline feed */}
      <div className="rounded-2xl border overflow-hidden" style={{ background: C.card, borderColor: C.border }}>
        <div className="divide-y max-h-[520px] overflow-y-auto" style={{ borderColor: C.border }}>
          {filtered.map((ev, idx) => {
            const sm = SURFACE_META[ev.surface];
            const agents = ev.agentIds.slice(0, 5).map(id => BRAIN_AGENTS.find(a => a.id === id));
            return (
              <div key={ev.id} className="flex items-start gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors">
                {/* Timeline line */}
                <div className="flex flex-col items-center flex-shrink-0 mt-1">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs border-2 flex-shrink-0"
                    style={{ borderColor: sm?.color ?? C.purple, background: C.bg }}
                  >
                    {sm?.icon ?? '🧠'}
                  </div>
                  {idx < filtered.length - 1 && (
                    <div className="w-px flex-1 mt-1 min-h-[12px]" style={{ background: C.border }} />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pb-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-[10px] font-bold" style={{ color: sm?.color ?? C.purple }}>{sm?.label ?? ev.surface}</span>
                    <span className="text-[9px]" style={{ color: C.muted }}>{relTime(ev.timestamp)}</span>
                    {ev.success !== undefined && (
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded`}
                        style={{ background: ev.success ? '#10b98120' : '#ef444420', color: ev.success ? C.green : C.red }}>
                        {ev.success ? '✓ OK' : '✗ FAIL'}
                      </span>
                    )}
                    {ev.duration && (
                      <span className="text-[9px]" style={{ color: C.blue }}>{ev.duration}ms</span>
                    )}
                  </div>
                  <p className="text-xs truncate" style={{ color: C.text }}>{ev.label}</p>
                  <div className="flex gap-1 mt-1.5 flex-wrap">
                    {agents.map(a => a && (
                      <span key={a.id} className="text-[8px] px-1.5 py-0.5 rounded" style={{ background: '#1e2d4a', color: C.muted }}>
                        {a.icon} {a.name.split(' ')[0]}
                      </span>
                    ))}
                    {ev.agentIds.length > 5 && (
                      <span className="text-[8px] px-1.5 py-0.5 rounded" style={{ background: '#1e2d4a', color: C.muted }}>
                        +{ev.agentIds.length - 5} more
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Memory Tab ───────────────────────────────────────────────────────────────

function MemoryTab() {
  const [search, setSearch] = useState('');
  const [agentFilter, setAgentFilter] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const all = getAgentMemory();
  const filtered = all
    .filter(e => {
      if (agentFilter !== null && e.agentId !== agentFilter) return false;
      if (search && !e.action.toLowerCase().includes(search.toLowerCase()) &&
        !e.result.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    })
    .slice()
    .reverse();

  const agentsWithMemory = Array.from(new Set(all.map(e => e.agentId)));

  if (!all.length) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3" style={{ color: C.muted }}>
        <Database className="w-10 h-10 opacity-30" />
        <p className="text-sm">No memory entries yet.</p>
        <p className="text-xs opacity-70">Agent 11 stores solved problems as they occur.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search + filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[160px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: C.muted }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search memory…"
            className="w-full pl-8 pr-3 py-2 text-sm rounded-xl border outline-none focus:border-purple-500/60"
            style={{ background: C.card, borderColor: C.border, color: C.text }}
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          <button
            onClick={() => setAgentFilter(null)}
            className="px-2.5 py-1.5 rounded-lg text-xs border transition-all"
            style={{ background: agentFilter === null ? '#7c3aed' : C.card, borderColor: agentFilter === null ? '#7c3aed' : C.border, color: agentFilter === null ? '#fff' : C.muted }}
          >All</button>
          {agentsWithMemory.map(id => {
            const a = BRAIN_AGENTS.find(x => x.id === id);
            return (
              <button
                key={id}
                onClick={() => setAgentFilter(agentFilter === id ? null : id)}
                className="px-2.5 py-1.5 rounded-lg text-xs border transition-all"
                style={{ background: agentFilter === id ? '#7c3aed' : C.card, borderColor: agentFilter === id ? '#7c3aed' : C.border, color: agentFilter === id ? '#fff' : C.muted }}
              >{a?.icon} {id}</button>
            );
          })}
        </div>
        <span className="text-xs" style={{ color: C.muted }}>{filtered.length} entries</span>
      </div>

      {/* Memory list */}
      <div className="rounded-2xl border overflow-hidden" style={{ background: C.card, borderColor: C.border }}>
        <div className="divide-y max-h-[500px] overflow-y-auto" style={{ borderColor: C.border }}>
          {filtered.length === 0 && (
            <div className="py-8 text-center text-sm" style={{ color: C.muted }}>No matching entries.</div>
          )}
          {filtered.map((entry, idx) => {
            const agent = BRAIN_AGENTS.find(a => a.id === entry.agentId);
            const id = `${entry.agentId}-${entry.timestamp}-${idx}`;
            const isopen = expandedId === id;
            return (
              <div key={id}>
                <button
                  onClick={() => setExpandedId(isopen ? null : id)}
                  className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-white/[0.02] transition-colors"
                >
                  <span className="text-base flex-shrink-0 mt-0.5">{agent?.icon ?? '🤖'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className="text-[9px] font-bold" style={{ color: agent?.color?.replace('text-', '#') ?? C.purple }}>
                        Agent {entry.agentId} — {agent?.name}
                      </span>
                      <span className="text-[9px]" style={{ color: C.muted }}>{relTime(entry.timestamp)}</span>
                      <span className="text-[9px] ml-1" style={{ color: SURFACE_META[entry.surface]?.color ?? C.muted }}>
                        {SURFACE_META[entry.surface]?.icon} {SURFACE_META[entry.surface]?.label}
                      </span>
                    </div>
                    <p className="text-xs truncate" style={{ color: C.text }}>{entry.action}</p>
                  </div>
                  {isopen ? <ChevronDown className="w-3.5 h-3.5 flex-shrink-0 mt-1" style={{ color: C.muted }} />
                    : <ChevronRight className="w-3.5 h-3.5 flex-shrink-0 mt-1" style={{ color: C.muted }} />}
                </button>
                {isopen && (
                  <div className="px-4 pb-4" style={{ background: '#0a1220' }}>
                    <div className="text-[10px] font-bold mb-1" style={{ color: C.muted }}>Action</div>
                    <p className="text-xs mb-3" style={{ color: C.text }}>{entry.action}</p>
                    <div className="text-[10px] font-bold mb-1" style={{ color: C.muted }}>Result</div>
                    <pre className="text-[10px] whitespace-pre-wrap break-words rounded-xl p-3 overflow-x-auto" style={{ background: C.bg, color: C.text, border: `1px solid ${C.border}`, maxHeight: '160px' }}>
                      {entry.result}
                    </pre>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Patterns Tab ─────────────────────────────────────────────────────────────

function PatternsTab() {
  const patterns = getBrainPatterns();
  const collaborations = getAgentCollaborations().slice(0, 10);
  const activity = getBrainActivity();

  // Surface query breakdown
  const surfaceQueryCount: Record<string, number> = {};
  activity.forEach(ev => {
    surfaceQueryCount[ev.surface] = (surfaceQueryCount[ev.surface] || 0) + 1;
  });

  const maxFreq = patterns[0]?.frequency ?? 1;

  if (!activity.length) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3" style={{ color: C.muted }}>
        <Activity className="w-10 h-10 opacity-30" />
        <p className="text-sm">No patterns detected yet.</p>
        <p className="text-xs opacity-70">Patterns emerge after multiple queries across surfaces.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ── Most Active Agents ── */}
      <div className="rounded-2xl border p-5" style={{ background: C.card, borderColor: C.border }}>
        <div className="flex items-center gap-2 mb-4">
          <Star className="w-4 h-4" style={{ color: C.yellow }} />
          <span className="text-sm font-bold" style={{ color: C.text }}>Most Active Agents</span>
          <span className="text-[10px]" style={{ color: C.muted }}>(by query frequency)</span>
        </div>
        <div className="space-y-3">
          {patterns.map((p, i) => {
            const agent = BRAIN_AGENTS.find(a => a.id === p.agentId);
            const barPct = (p.frequency / maxFreq) * 100;
            return (
              <div key={p.agentId} className="flex items-center gap-3">
                <span className="text-sm w-6 flex-shrink-0">{p.agentIcon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold" style={{ color: C.text }}>{p.agentName}</span>
                    <div className="flex items-center gap-2">
                      <TrendBadge trend={p.trend} />
                      <span className="text-[10px] font-mono" style={{ color: C.muted }}>{p.frequency}×</span>
                    </div>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: '#1f2937' }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${barPct}%`, background: `hsl(${260 + i * 20}, 70%, 55%)` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Agent Collaboration Matrix ── */}
      <div className="rounded-2xl border p-5" style={{ background: C.card, borderColor: C.border }}>
        <div className="flex items-center gap-2 mb-4">
          <Network className="w-4 h-4" style={{ color: C.indigo }} />
          <span className="text-sm font-bold" style={{ color: C.text }}>Top Agent Collaborations</span>
          <span className="text-[10px]" style={{ color: C.muted }}>(co-firing pairs)</span>
        </div>
        {collaborations.length === 0 ? (
          <p className="text-sm text-center py-4" style={{ color: C.muted }}>Need more activity to detect pairings.</p>
        ) : (
          <div className="space-y-2.5">
            {collaborations.map((collab, i) => {
              const aA = BRAIN_AGENTS.find(a => a.id === collab.agentA);
              const aB = BRAIN_AGENTS.find(a => a.id === collab.agentB);
              const maxCollab = collaborations[0].coFiringCount;
              return (
                <div key={`${collab.agentA}-${collab.agentB}`} className="flex items-center gap-3 rounded-xl px-3 py-2.5" style={{ background: '#0d1629', border: `1px solid ${C.border}` }}>
                  <span className="text-sm">{aA?.icon}</span>
                  <span className="text-xs font-semibold truncate flex-shrink-0" style={{ color: C.text }}>{aA?.name.split(' ')[0]}</span>
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: '#1e2d4a' }}>
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${(collab.coFiringCount / maxCollab) * 100}%`, background: `hsl(${240 + i * 12}, 65%, 55%)` }}
                    />
                  </div>
                  <span className="text-xs font-semibold truncate flex-shrink-0" style={{ color: C.text }}>{aB?.name.split(' ')[0]}</span>
                  <span className="text-sm">{aB?.icon}</span>
                  <span className="text-[10px] ml-1 flex-shrink-0 font-mono" style={{ color: C.muted }}>{collab.coFiringCount}×</span>
                  <div className="flex gap-1 ml-1">
                    {collab.surfaces.map(s => (
                      <span key={s} title={SURFACE_META[s]?.label} className="text-xs">{SURFACE_META[s]?.icon}</span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Query volume by surface ── */}
      <div className="rounded-2xl border p-5" style={{ background: C.card, borderColor: C.border }}>
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="w-4 h-4" style={{ color: C.teal }} />
          <span className="text-sm font-bold" style={{ color: C.text }}>Query Volume by Surface</span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {Object.entries(surfaceQueryCount).map(([surface, count]) => {
            const sm = SURFACE_META[surface];
            return (
              <div key={surface} className="rounded-xl p-3 text-center border" style={{ background: C.bg, borderColor: C.border }}>
                <div className="text-2xl mb-1">{sm?.icon ?? '🧠'}</div>
                <div className="text-2xl font-black" style={{ color: sm?.color ?? C.purple }}>{count}</div>
                <div className="text-[9px] mt-0.5" style={{ color: C.muted }}>{sm?.label ?? surface}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Agents Tab ───────────────────────────────────────────────────────────────

function AgentsTab({ selectedAgent, onSelectAgent }: { selectedAgent: number | null; onSelectAgent: (id: number | null) => void }) {
  const [localSelected, setLocalSelected] = useState<number | null>(selectedAgent);

  useEffect(() => {
    if (selectedAgent !== null) {
      setLocalSelected(selectedAgent);
      // Scroll into view
      setTimeout(() => {
        document.getElementById(`agent-card-${selectedAgent}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [selectedAgent]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {BRAIN_AGENTS.map(agent => {
        const health = getAgentHealth(agent.id);
        const pct = health.totalRuns ? Math.round(health.successRate * 100) : 100;
        const barColor = pct > 80 ? C.green : pct > 50 ? C.yellow : C.red;
        const isSelected = localSelected === agent.id;

        return (
          <div
            id={`agent-card-${agent.id}`}
            key={agent.id}
            onClick={() => setLocalSelected(isSelected ? null : agent.id)}
            className="rounded-2xl border cursor-pointer transition-all duration-200"
            style={{
              background: isSelected ? '#0d1830' : C.card,
              borderColor: isSelected ? '#7c3aed88' : C.border,
              boxShadow: isSelected ? '0 0 20px #7c3aed22' : 'none',
            }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 p-4 pb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${agent.bg} border ${agent.border}`}>
                {agent.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <span className="text-[9px] font-bold" style={{ color: C.muted }}>AGENT {agent.id}</span>
                  {health.totalRuns > 0 && (
                    <span className="text-[8px] px-1.5 py-0.5 rounded font-bold" style={{ background: '#10b98120', color: C.green }}>
                      ● ACTIVE
                    </span>
                  )}
                </div>
                <h4 className="text-sm font-bold" style={{ color: C.text }}>{agent.name}</h4>
              </div>
              {isSelected ? <ChevronDown className="w-4 h-4 flex-shrink-0" style={{ color: C.muted }} />
                : <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: C.muted }} />}
            </div>

            {/* Health bar */}
            <div className="px-4 pb-3">
              <div className="flex items-center justify-between text-[9px] mb-1" style={{ color: C.muted }}>
                <span>Health</span>
                <span style={{ color: barColor }}>{pct}%{health.totalRuns > 0 ? ` · ${health.totalRuns} runs · ${health.avgDuration}ms avg` : ' (no data)'}</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#1e2d4a' }}>
                <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: barColor }} />
              </div>
            </div>

            {/* Expanded detail */}
            {isSelected && (
              <div className="border-t px-4 py-4 space-y-3" style={{ borderColor: C.border, background: '#050b18' }}>
                <p className="text-xs" style={{ color: C.muted }}>{agent.role}</p>

                {/* Tasks */}
                <div>
                  <div className="text-[9px] font-bold uppercase tracking-wider mb-1.5" style={{ color: C.muted }}>Tasks</div>
                  <div className="flex flex-wrap gap-1.5">
                    {agent.tasks.map((t, i) => (
                      <span key={i} className={`text-[10px] px-2 py-0.5 rounded-lg border ${agent.bg} ${agent.border} ${agent.color}`}>{t}</span>
                    ))}
                  </div>
                </div>

                {/* Output */}
                <div className="rounded-xl p-2.5 border" style={{ background: C.card, borderColor: C.border }}>
                  <div className="text-[9px] font-bold uppercase tracking-wider mb-1" style={{ color: C.muted }}>Output</div>
                  <p className={`text-[10px] font-medium ${agent.color}`}>↳ {agent.output}</p>
                </div>

                {/* Neural links */}
                <div>
                  <div className="text-[9px] font-bold uppercase tracking-wider mb-1.5" style={{ color: C.muted }}>Neural Connections</div>
                  <div className="space-y-1">
                    {NEURAL_LINKS.filter(l => l.from === agent.id || l.to === agent.id).map((link, i) => {
                      const isFrom = link.from === agent.id;
                      const otherId = isFrom ? link.to : link.from;
                      const other = BRAIN_AGENTS.find(a => a.id === otherId);
                      return (
                        <div key={i} className="flex items-center gap-2 text-[9px]" style={{ color: C.muted }}>
                          <span style={{ color: isFrom ? C.purple : C.blue }}>{isFrom ? '→' : '←'}</span>
                          <span>{other?.icon} Agent {otherId} ({other?.name})</span>
                          <span className="ml-auto opacity-60">"{link.label}"</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Telemetry detail */}
                {health.totalRuns > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'Total Runs', val: health.totalRuns, color: C.purple },
                      { label: 'Success', val: `${Math.round(health.successRate * 100)}%`, color: barColor },
                      { label: 'Avg Time', val: `${health.avgDuration}ms`, color: C.blue },
                    ].map(({ label, val, color }) => (
                      <div key={label} className="rounded-xl p-2 text-center border" style={{ background: C.bg, borderColor: C.border }}>
                        <div className="text-sm font-black" style={{ color }}>{val}</div>
                        <div className="text-[8px] mt-0.5" style={{ color: C.muted }}>{label}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Learning Tab (AI Intelligence & Knowledge Base) ─────────────────────────

function LearningTab() {
  const [metrics, setMetrics] = useState<LearningMetrics>(brainLearningEngine.getMetrics());
  const [knowledge, setKnowledge] = useState<KnowledgeEntry[]>(brainLearningEngine.getKnowledge());
  const [events, setEvents] = useState<LearningEvent[]>(brainLearningEngine.getEvents(50));
  const [expandedKnowledge, setExpandedKnowledge] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'command-pattern' | 'best-practice' | 'user-preference' | 'error-solution'>('all');

  useEffect(() => {
    const unsub = brainLearningEngine.subscribe(() => {
      setMetrics(brainLearningEngine.getMetrics());
      setKnowledge(brainLearningEngine.getKnowledge());
      setEvents(brainLearningEngine.getEvents(50));
    });
    return unsub;
  }, []);

  const filteredKnowledge = filter === 'all' ? knowledge : knowledge.filter(k => k.type === filter);
  const iqGrade = metrics.intelligenceScore >= 150 ? 'Genius' : metrics.intelligenceScore >= 130 ? 'Superior' : metrics.intelligenceScore >= 115 ? 'Above Average' : metrics.intelligenceScore >= 100 ? 'Average' : 'Below Average';
  const iqColor = metrics.intelligenceScore >= 150 ? C.purple : metrics.intelligenceScore >= 130 ? C.blue : metrics.intelligenceScore >= 115 ? C.teal : C.green;

  return (
    <div className="space-y-5">
      {/* ── IQ Score Hero ── */}
      <div className="rounded-2xl border p-6" style={{ background: 'linear-gradient(135deg, #7c3aed22 0%, #3b82f622 100%)', borderColor: '#7c3aed55' }}>
        <div className="flex items-center gap-6">
          <div className="w-28 h-28 rounded-2xl flex flex-col items-center justify-center" style={{ background: '#7c3aed22', border: '2px solid #7c3aed' }}>
            <div className="text-5xl font-black" style={{ color: iqColor }}>{Math.round(metrics.intelligenceScore)}</div>
            <div className="text-xs font-bold mt-1" style={{ color: C.muted }}>IQ SCORE</div>
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-black mb-2" style={{ color: C.text }}>Brain Intelligence: {iqGrade}</h3>
            <p className="text-sm mb-3" style={{ color: C.muted }}>
              The AI brain is continuously learning from every command. Intelligence increases with successful patterns and knowledge acquisition.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Learnings', val: metrics.totalLearnings, color: C.purple },
                { label: 'Knowledge', val: metrics.knowledgeBaseSize, color: C.blue },
                { label: 'Patterns', val: metrics.commandPatterns, color: C.teal },
                { label: 'Success Rate', val: `${Math.round(metrics.successRate * 100)}%`, color: C.green },
              ].map(({ label, val, color }) => (
                <div key={label} className="text-center">
                  <div className="text-2xl font-black" style={{ color }}>{val}</div>
                  <div className="text-[9px] mt-0.5" style={{ color: C.muted }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Learning Metrics Grid ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {[
          { label: 'Avg Confidence', val: `${metrics.averageConfidence}%`, icon: <Star className="w-4 h-4" />, color: C.yellow },
          { label: 'Improvement Rate', val: `${metrics.improvementRate.toFixed(1)}/hr`, icon: <TrendingUp className="w-4 h-4" />, color: C.green },
          { label: 'Last Improvement', val: relTime(metrics.lastImprovement), icon: <Clock className="w-4 h-4" />, color: C.blue },
        ].map(({ label, val, icon, color }) => (
          <div key={label} className="rounded-2xl p-4 border" style={{ background: C.card, borderColor: C.border }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}18`, color }}>{icon}</div>
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: C.muted }}>{label}</span>
            </div>
            <div className="text-xl font-black" style={{ color }}>{val}</div>
          </div>
        ))}
      </div>

      {/* ── Knowledge Base ── */}
      <div className="rounded-2xl border overflow-hidden" style={{ background: C.card, borderColor: C.border }}>
        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: C.border }}>
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4" style={{ color: C.purple }} />
            <span className="text-sm font-bold" style={{ color: C.text }}>Knowledge Base</span>
            <span className="text-[10px]" style={{ color: C.muted }}>({filteredKnowledge.length} entries)</span>
          </div>
          <div className="flex gap-1.5">
            {(['all', 'command-pattern', 'best-practice', 'user-preference', 'error-solution'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-all"
                style={{
                  background: filter === f ? '#7c3aed' : C.card,
                  borderColor: filter === f ? '#7c3aed' : C.border,
                  color: filter === f ? '#fff' : C.muted,
                }}
              >
                {f === 'all' ? 'All' : f.replace('-', ' ')}
              </button>
            ))}
          </div>
        </div>
        <div className="divide-y max-h-[400px] overflow-y-auto" style={{ borderColor: C.border }}>
          {filteredKnowledge.length === 0 ? (
            <div className="py-8 text-center text-sm" style={{ color: C.muted }}>No knowledge entries yet. Add commands to build the knowledge base!</div>
          ) : filteredKnowledge.map(entry => {
            const isExpanded = expandedKnowledge === entry.id;
            const typeColors: Record<typeof entry.type, string> = {
              'command-pattern': C.blue,
              'best-practice': C.green,
              'user-preference': C.purple,
              'error-solution': C.red,
              'optimization': C.yellow,
            };
            const typeColor = typeColors[entry.type];
            return (
              <div key={entry.id}>
                <button
                  onClick={() => setExpandedKnowledge(isExpanded ? null : entry.id)}
                  className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${typeColor}20`, color: typeColor }}>
                        {entry.type.toUpperCase()}
                      </span>
                      <span className="text-xs font-semibold" style={{ color: C.text }}>{entry.topic}</span>
                      <span className="text-[9px] ml-auto" style={{ color: C.muted }}>
                        {entry.confidence}% confidence · {entry.frequency}× used
                      </span>
                    </div>
                    <p className="text-xs truncate" style={{ color: C.muted }}>{entry.learning}</p>
                  </div>
                  {isExpanded ? <ChevronDown className="w-3.5 h-3.5 flex-shrink-0 mt-1" style={{ color: C.muted }} />
                    : <ChevronRight className="w-3.5 h-3.5 flex-shrink-0 mt-1" style={{ color: C.muted }} />}
                </button>
                {isExpanded && (
                  <div className="px-4 pb-4" style={{ background: '#0a1220' }}>
                    <div className="space-y-2">
                      <div>
                        <div className="text-[10px] font-bold mb-1" style={{ color: C.muted }}>Learning</div>
                        <p className="text-xs" style={{ color: C.text }}>{entry.learning}</p>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="text-center p-2 rounded-lg" style={{ background: C.bg, border: `1px solid ${C.border}` }}>
                          <div className="text-sm font-bold" style={{ color: typeColor }}>{entry.confidence}%</div>
                          <div className="text-[8px] mt-0.5" style={{ color: C.muted }}>Confidence</div>
                        </div>
                        <div className="text-center p-2 rounded-lg" style={{ background: C.bg, border: `1px solid ${C.border}` }}>
                          <div className="text-sm font-bold" style={{ color: typeColor }}>{entry.frequency}×</div>
                          <div className="text-[8px] mt-0.5" style={{ color: C.muted }}>Frequency</div>
                        </div>
                        <div className="text-center p-2 rounded-lg" style={{ background: C.bg, border: `1px solid ${C.border}` }}>
                          <div className="text-sm font-bold" style={{ color: typeColor }}>{Math.round(entry.successRate * 100)}%</div>
                          <div className="text-[8px] mt-0.5" style={{ color: C.muted }}>Success</div>
                        </div>
                      </div>
                      {entry.relatedTags.length > 0 && (
                        <div>
                          <div className="text-[10px] font-bold mb-1.5" style={{ color: C.muted }}>Related Tags</div>
                          <div className="flex flex-wrap gap-1">
                            {entry.relatedTags.map((tag, i) => (
                              <span key={i} className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: '#1e2d4a', color: C.muted }}>#{tag}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {entry.examples.length > 0 && (
                        <div>
                          <div className="text-[10px] font-bold mb-1.5" style={{ color: C.muted }}>Examples</div>
                          <div className="space-y-1">
                            {entry.examples.map((ex, i) => (
                              <div key={i} className="text-[10px] px-2 py-1 rounded" style={{ background: C.bg, color: C.text }}>• {ex}</div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Learning Events Timeline ── */}
      <div className="rounded-2xl border overflow-hidden" style={{ background: C.card, borderColor: C.border }}>
        <div className="px-4 py-3 border-b" style={{ borderColor: C.border }}>
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4" style={{ color: C.teal }} />
            <span className="text-sm font-bold" style={{ color: C.text }}>Learning Timeline</span>
            <span className="text-[10px]" style={{ color: C.muted }}>Recent improvements & discoveries</span>
          </div>
        </div>
        <div className="divide-y max-h-[300px] overflow-y-auto" style={{ borderColor: C.border }}>
          {events.length === 0 ? (
            <div className="py-8 text-center text-sm" style={{ color: C.muted }}>No learning events yet</div>
          ) : events.map((event, idx) => {
            const eventColors: Record<typeof event.type, string> = {
              'pattern-discovered': C.purple,
              'improvement-made': C.green,
              'knowledge-added': C.blue,
              'error-learned': C.red,
              'iq-increased': C.yellow,
            };
            const eventColor = eventColors[event.type];
            return (
              <div key={event.id} className="flex items-start gap-3 px-4 py-2.5 hover:bg-white/[0.02]">
                <div className="flex flex-col items-center flex-shrink-0 mt-1">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] border-2"
                    style={{ borderColor: eventColor, background: C.bg }}
                  >
                    {event.type === 'iq-increased' ? '↑' :
                      event.type === 'pattern-discovered' ? '🔍' :
                        event.type === 'knowledge-added' ? '📚' :
                          event.type === 'improvement-made' ? '✓' : '⚠'}
                  </div>
                  {idx < events.length - 1 && (
                    <div className="w-px flex-1 mt-1 min-h-[8px]" style={{ background: C.border }} />
                  )}
                </div>
                <div className="flex-1 min-w-0 pb-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: `${eventColor}20`, color: eventColor }}>
                      {event.type.replace('-', ' ').toUpperCase()}
                    </span>
                    <span className="text-[9px]" style={{ color: C.muted }}>{relTime(event.timestamp)}</span>
                    {event.iqChange > 0 && (
                      <span className="text-[9px] font-bold" style={{ color: C.green }}>+{event.iqChange.toFixed(1)} IQ</span>
                    )}
                  </div>
                  <p className="text-xs" style={{ color: C.text }}>{event.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Commands Tab (Visual Brain Command Center) ──────────────────────────────

function CommandsTab() {
  const [commandText, setCommandText] = useState('');
  const [commands, setCommands] = useState<BrainCommand[]>(brainCommandEngine.commands);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [logs, setLogs] = useState<CommandLog[]>(brainCommandEngine.logs);
  const [processing, setProcessing] = useState(false);
  const [expandedCmd, setExpandedCmd] = useState<string | null>(null);
  const [editingCmd, setEditingCmd] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [testOutput, setTestOutput] = useState<{ cmdId: string; output: string } | null>(null);

  useEffect(() => {
    const unsub = brainCommandEngine.subscribe(() => {
      setCommands([...brainCommandEngine.commands]);
      setLogs([...brainCommandEngine.logs]);
    });
    return unsub;
  }, []);

  const stats = brainCommandEngine.getStats();

  const handleAdd = async () => {
    if (!commandText.trim() || processing) return;
    setProcessing(true);
    try {
      await brainCommandEngine.addCommand(commandText.trim());
      setCommandText('');
    } catch (e) { /* error logged in engine */ }
    setProcessing(false);
  };

  const handleEdit = async (id: string) => {
    if (!editText.trim() || processing) return;
    setProcessing(true);
    try {
      await brainCommandEngine.editCommand(id, editText.trim());
      setEditingCmd(null);
      setEditText('');
    } catch (e) { /* error logged */ }
    setProcessing(false);
  };

  const handleTest = async (id: string) => {
    setProcessing(true);
    try {
      const result = await brainCommandEngine.testCommand(id);
      if (result) setTestOutput({ cmdId: id, output: result.output });
    } catch (e) { /* error logged */ }
    setProcessing(false);
  };

  const handleRemove = async (id: string) => {
    setProcessing(true);
    await brainCommandEngine.removeCommand(id);
    if (expandedCmd === id) setExpandedCmd(null);
    setProcessing(false);
  };

  const statusColors: Record<string, { bg: string; text: string; label: string }> = {
    draft: { bg: '#64748b20', text: C.muted, label: 'DRAFT' },
    parsed: { bg: '#3b82f620', text: C.blue, label: 'PARSED' },
    generated: { bg: '#f59e0b20', text: C.yellow, label: 'GENERATED' },
    tested: { bg: '#10b98120', text: C.green, label: 'TESTED' },
    deployed: { bg: '#a855f720', text: C.purple, label: 'DEPLOYED' },
    failed: { bg: '#ef444420', text: C.red, label: 'FAILED' },
  };

  return (
    <div className="space-y-5">
      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Total Commands', val: stats.total, color: C.purple },
          { label: 'Deployed', val: stats.deployed, color: C.green },
          { label: 'Failed', val: stats.failed, color: C.red },
          { label: 'Files Generated', val: stats.totalFiles, color: C.blue },
          { label: 'Tests Passed', val: `${stats.passedTests}/${stats.totalTests}`, color: C.teal },
        ].map(({ label, val, color }) => (
          <div key={label} className="rounded-2xl p-3.5 border" style={{ background: C.card, borderColor: C.border }}>
            <div className="text-xl font-black" style={{ color }}>{val}</div>
            <div className="text-[9px] mt-0.5" style={{ color: C.muted }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Add Command Input */}
      <div className="rounded-2xl border p-5" style={{ background: C.card, borderColor: '#00f6ff33' }}>
        <div className="flex items-center gap-2 mb-3">
          <Code className="w-4 h-4" style={{ color: '#00f6ff' }} />
          <span className="text-sm font-bold" style={{ color: '#00f6ff' }}>Add Brain Command</span>
          <span className="text-[10px]" style={{ color: C.muted }}>parsed by 12-Agent pipeline</span>
        </div>
        <textarea
          value={commandText}
          onChange={e => setCommandText(e.target.value)}
          placeholder="Paste or write a new Brain Command here... (e.g., 'Create a REST API endpoint for user authentication with JWT tokens #api #security')"
          className="w-full rounded-xl border p-3 text-sm resize-none outline-none focus:border-purple-500/60 placeholder:text-gray-600"
          style={{ background: '#292946', borderColor: C.border, color: C.text, minHeight: '100px' }}
          onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleAdd(); }}
        />
        <div className="flex items-center justify-between mt-3">
          <span className="text-[10px]" style={{ color: C.muted }}>Tip: Use #tags like #api #ui #database #testing #security to guide agent routing</span>
          <button
            onClick={handleAdd}
            disabled={!commandText.trim() || processing}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-40"
            style={{ background: '#00f6ff', color: '#1e1e2f' }}
          >
            {processing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
            {processing ? 'Processing...' : 'Add Command'}
          </button>
        </div>
      </div>

      {/* Command Cards */}
      <div className="space-y-3">
        {commands.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 rounded-2xl border" style={{ background: C.card, borderColor: C.border }}>
            <Code className="w-12 h-12 mb-3 opacity-20" style={{ color: C.muted }} />
            <p className="text-sm font-semibold" style={{ color: C.muted }}>No Brain Commands yet</p>
            <p className="text-xs mt-1" style={{ color: C.muted }}>Write a command above to get started</p>
          </div>
        ) : commands.map(cmd => {
          const sc = statusColors[cmd.status] || statusColors.draft;
          const isExpanded = expandedCmd === cmd.id;
          const isEditing = editingCmd === cmd.id;
          return (
            <div key={cmd.id} className="rounded-2xl border overflow-hidden transition-all" style={{ background: C.card, borderColor: isExpanded ? '#7c3aed55' : C.border, boxShadow: isExpanded ? '0 4px 20px rgba(0,0,0,0.4)' : 'none' }}>
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h4 className="text-sm font-bold" style={{ color: C.text }}>{cmd.name}</h4>
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ background: sc.bg, color: sc.text }}>{sc.label}</span>
                      {cmd.tags.map(t => (
                        <span key={t} className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: '#1e2d4a', color: C.muted }}>#{t}</span>
                      ))}
                    </div>
                    <p className="text-xs truncate" style={{ color: C.muted }}>{cmd.description}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[9px]" style={{ color: C.muted }}>{cmd.files.length} file(s)</span>
                      <span className="text-[9px]" style={{ color: C.muted }}>{relTime(cmd.createdAt)}</span>
                      {cmd.testResults && (
                        <span className="text-[9px] font-bold" style={{ color: cmd.testResults.passed ? C.green : C.red }}>
                          {cmd.testResults.passed ? 'Tests passed' : 'Tests failed'}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button onClick={() => { setEditingCmd(isEditing ? null : cmd.id); setEditText(cmd.code); }} className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all hover:opacity-80" style={{ background: '#ffa500', color: '#1e1e2f' }}>Edit</button>
                    <button onClick={() => handleTest(cmd.id)} disabled={processing} className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all hover:opacity-80 disabled:opacity-40" style={{ background: '#00ff99', color: '#1e1e2f' }}>Test</button>
                    <button onClick={() => handleRemove(cmd.id)} disabled={processing} className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all hover:opacity-80 disabled:opacity-40" style={{ background: '#ff4c4c', color: '#ffffff' }}>Remove</button>
                    <button onClick={() => setExpandedCmd(isExpanded ? null : cmd.id)} className="p-1.5 rounded-lg transition-all" style={{ background: '#ffffff08' }}>
                      {isExpanded ? <ChevronDown className="w-3.5 h-3.5" style={{ color: C.muted }} /> : <ChevronRight className="w-3.5 h-3.5" style={{ color: C.muted }} />}
                    </button>
                  </div>
                </div>
                <div className="flex gap-0.5 mt-3">
                  {cmd.agentPipeline.map(agent => (
                    <div key={agent.agentId} className="flex-1 h-1.5 rounded-full transition-all" title={`${agent.agentIcon} ${agent.agentName}: ${agent.status}`}
                      style={{ background: agent.status === 'success' ? C.green : agent.status === 'running' ? C.blue : agent.status === 'failed' ? C.red : agent.status === 'skipped' ? '#1e2d4a' : '#111827', opacity: agent.status === 'skipped' ? 0.3 : 1 }}
                    />
                  ))}
                </div>
              </div>
              {isEditing && (
                <div className="px-4 pb-4 border-t" style={{ borderColor: C.border, background: '#0a1220' }}>
                  <div className="text-[10px] font-bold mt-3 mb-2" style={{ color: '#ffa500' }}>Edit Command</div>
                  <textarea value={editText} onChange={e => setEditText(e.target.value)} className="w-full rounded-lg border p-3 text-xs resize-none outline-none" style={{ background: '#292946', borderColor: C.border, color: C.text, minHeight: '80px' }} />
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => handleEdit(cmd.id)} disabled={processing || !editText.trim()} className="px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all disabled:opacity-40" style={{ background: '#ffa500', color: '#1e1e2f' }}>{processing ? 'Saving...' : 'Save & Redeploy'}</button>
                    <button onClick={() => setEditingCmd(null)} className="px-3 py-1.5 rounded-lg text-[11px] font-medium" style={{ background: '#ffffff10', color: C.muted }}>Cancel</button>
                  </div>
                </div>
              )}
              {testOutput?.cmdId === cmd.id && (
                <div className="px-4 pb-4 border-t" style={{ borderColor: C.border, background: '#0a1220' }}>
                  <div className="flex items-center justify-between mt-3 mb-2">
                    <span className="text-[10px] font-bold" style={{ color: '#00ff99' }}>Test Results</span>
                    <button onClick={() => setTestOutput(null)} className="text-[10px]" style={{ color: C.muted }}>dismiss</button>
                  </div>
                  <pre className="text-[10px] whitespace-pre-wrap rounded-lg p-3 border" style={{ background: C.bg, borderColor: C.border, color: C.text }}>{testOutput.output}</pre>
                </div>
              )}
              {isExpanded && (
                <div className="border-t" style={{ borderColor: C.border, background: '#050b18' }}>
                  <div className="px-4 py-4">
                    <div className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: C.muted }}>12-Agent Pipeline</div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {cmd.agentPipeline.map(agent => (
                        <div key={agent.agentId} className="flex items-center gap-2 p-2 rounded-lg border" style={{ background: C.card, borderColor: C.border }}>
                          <span className="text-sm">{agent.agentIcon}</span>
                          <div className="flex-1 min-w-0">
                            <span className="text-[10px] font-medium truncate block" style={{ color: C.text }}>{agent.agentName}</span>
                            <span className="text-[8px]" style={{ color: agent.status === 'success' ? C.green : agent.status === 'failed' ? C.red : agent.status === 'running' ? C.blue : C.muted }}>
                              {agent.status === 'success' ? 'Done' : agent.status === 'running' ? 'Running...' : agent.status === 'failed' ? 'Failed' : agent.status === 'skipped' ? 'Skipped' : 'Pending'}
                            </span>
                          </div>
                          {agent.status === 'success' && <Check className="w-3 h-3 flex-shrink-0" style={{ color: C.green }} />}
                          {agent.status === 'failed' && <AlertTriangle className="w-3 h-3 flex-shrink-0" style={{ color: C.red }} />}
                        </div>
                      ))}
                    </div>
                  </div>
                  {cmd.files.length > 0 && (
                    <div className="px-4 pb-4">
                      <div className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: C.muted }}>Generated Files</div>
                      <div className="space-y-2">
                        {cmd.files.map(file => (
                          <div key={file.path} className="rounded-lg border overflow-hidden" style={{ borderColor: C.border }}>
                            <div className="flex items-center gap-2 px-3 py-1.5" style={{ background: '#111827' }}>
                              <Code className="w-3 h-3" style={{ color: C.blue }} />
                              <span className="text-[10px] font-mono font-bold" style={{ color: C.text }}>{file.path}</span>
                              <span className="text-[8px] ml-auto" style={{ color: C.muted }}>{file.size}b</span>
                            </div>
                            <pre className="text-[9px] p-3 overflow-x-auto" style={{ background: C.bg, color: C.muted, maxHeight: '120px' }}>{file.content}</pre>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Activity Log */}
      {logs.length > 0 && (
        <div className="rounded-2xl border" style={{ background: C.card, borderColor: C.border }}>
          <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: C.border }}>
            <div className="flex items-center gap-2">
              <Activity className="w-3.5 h-3.5" style={{ color: C.teal }} />
              <span className="text-xs font-bold" style={{ color: C.text }}>Command Activity Log</span>
              <span className="text-[10px]" style={{ color: C.muted }}>({logs.length})</span>
            </div>
            <button onClick={() => brainCommandEngine.clearLogs()} className="text-[10px]" style={{ color: C.muted }}>Clear</button>
          </div>
          <div className="divide-y max-h-60 overflow-y-auto" style={{ borderColor: C.border }}>
            {logs.slice(0, 30).map(log => {
              const actionColor = log.action === 'error' ? C.red : log.action === 'test' ? C.teal : log.action === 'remove' ? C.red : log.action === 'deploy' ? C.green : C.blue;
              return (
                <div key={log.id} className="flex items-start gap-2 px-4 py-2 hover:bg-white/[0.02]">
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded mt-0.5 flex-shrink-0" style={{ background: `${actionColor}20`, color: actionColor }}>{log.action}</span>
                  <span className="text-[11px] flex-1" style={{ color: C.text }}>{log.message}</span>
                  <span className="text-[9px] flex-shrink-0" style={{ color: C.muted }}>{relTime(log.timestamp)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function BrainCommandCenter({ onBack }: BrainCommandCenterProps) {
  const [tab, setTab] = useState<CCTab>('overview');
  const [selectedAgent, setSelectedAgent] = useState<number | null>(null);
  const [ticker, setTicker] = useState(0);
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Refresh live stats every 5s
  useEffect(() => {
    const t = setInterval(() => setTicker(x => x + 1), 5_000);
    return () => clearInterval(t);
  }, []);

  const handleClearAll = () => {
    clearBrainActivity();
    clearBrainTelemetry();
    clearAgentMemory();
    setTicker(x => x + 1);
  };

  const handleExport = () => {
    const json = exportBrainSnapshot();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `brain-snapshot-${Date.now()}.json`; a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const ok = importBrainSnapshot(ev.target?.result as string);
      setImportMsg(ok ? '✓ Snapshot imported' : '✗ Import failed');
      setTicker(x => x + 1);
      setTimeout(() => setImportMsg(''), 3000);
    };
    reader.readAsText(file);
  };

  // Seed demo telemetry for empty state
  const handleSeedDemo = () => {
    simulateAgentTelemetry('chat', [1, 2, 3, 11], 550);
    simulateAgentTelemetry('code-assistant', [4, 5, 6, 9, 11], 820);
    simulateAgentTelemetry('git-repair', [4, 5, 6, 7, 8], 670);
    setTicker(x => x + 1);
  };

  const telemetryTotal = getBrainTelemetry().length;
  const memoryTotal = getAgentMemory().length;
  const activityTotal = getBrainActivity().length;

  const handleNodeClick = (agentId: number) => {
    setSelectedAgent(agentId);
    setTab('agents');
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden" style={{ background: C.bg, fontFamily: 'system-ui, sans-serif' }}>

      {/* ── Header ── */}
      <div className="flex-shrink-0 border-b px-5 py-3" style={{ borderColor: C.border, background: '#050b18' }}>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Back */}
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-xl border transition-all hover:opacity-80"
            style={{ background: C.card, borderColor: C.border, color: C.muted }}
          >
            <X className="w-3.5 h-3.5" />
            Close
          </button>

          {/* Title */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base" style={{ background: '#7c3aed22', border: '1px solid #7c3aed55' }}>🧠</div>
            <div>
              <h1 className="text-base font-black leading-none" style={{ color: C.text }}>Brain Command Center</h1>
              <p className="text-[10px] mt-0.5" style={{ color: C.muted }}>12-Agent AI Super Coding Brain — Live Observatory</p>
            </div>
          </div>

          {/* Live badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border" style={{ background: '#10b98112', borderColor: '#10b98144' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" />
            <span className="text-[10px] font-bold text-green-400">Live</span>
          </div>

          {/* Quick stats */}
          <div className="flex items-center gap-3 ml-2">
            {[
              { label: 'execs', val: telemetryTotal },
              { label: 'events', val: activityTotal },
              { label: 'memories', val: memoryTotal },
            ].map(({ label, val }) => (
              <div key={label} className="text-center">
                <div className="text-sm font-black leading-none" style={{ color: C.purple }}>{val}</div>
                <div className="text-[8px]" style={{ color: C.muted }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="ml-auto flex items-center gap-2">
            {importMsg && (
              <span className="text-xs font-semibold px-2 py-1 rounded-lg" style={{ background: '#10b98120', color: C.green }}>{importMsg}</span>
            )}
            {telemetryTotal === 0 && (
              <button
                onClick={handleSeedDemo}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all hover:opacity-80"
                style={{ background: '#7c3aed22', borderColor: '#7c3aed55', color: C.purple }}
              >
                <Zap className="w-3.5 h-3.5" />
                Seed Demo Data
              </button>
            )}
            <button
              onClick={handleSeedDemo}
              className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-xl border transition-all hover:opacity-80"
              style={{ background: C.card, borderColor: C.border, color: C.muted }}
              title="Inject simulated agent telemetry"
            >
              <RefreshCw className="w-3 h-3" />
              Inject
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-xl border transition-all hover:opacity-80"
              style={{ background: C.card, borderColor: C.border, color: C.muted }}
              title="Import brain snapshot JSON"
            >
              <Upload className="w-3 h-3" />
              Import
            </button>
            <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-xl border transition-all hover:opacity-80"
              style={{ background: C.card, borderColor: C.border, color: C.muted }}
              title="Export brain snapshot as JSON"
            >
              <Download className="w-3 h-3" />
              Export
            </button>
            <button
              onClick={handleClearAll}
              className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-xl border transition-all hover:text-red-400"
              style={{ background: C.card, borderColor: C.border, color: C.muted }}
              title="Clear all brain data"
            >
              <Trash2 className="w-3 h-3" />
              Clear All
            </button>
          </div>
        </div>

        {/* ── Tab nav ── */}
        <div className="flex gap-1 mt-3">
          {TAB_DEFS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all"
              style={{
                background: tab === t.id ? '#7c3aed' : C.card,
                borderColor: tab === t.id ? '#7c3aed' : C.border,
                color: tab === t.id ? '#fff' : C.muted,
              }}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content area ── */}
      <div className="flex-1 overflow-y-auto p-5">
        {tab === 'overview' && <OverviewTab selectedAgent={selectedAgent} onSelectAgent={handleNodeClick} />}
        {tab === 'commands' && <CommandsTab />}
        {tab === 'learning' && <LearningTab />}
        {tab === 'telemetry' && <TelemetryTab />}
        {tab === 'timeline' && <TimelineTab />}
        {tab === 'memory' && <MemoryTab />}
        {tab === 'patterns' && <PatternsTab />}
        {tab === 'agents' && <AgentsTab selectedAgent={selectedAgent} onSelectAgent={setSelectedAgent} />}
      </div>
    </div>
  );
}