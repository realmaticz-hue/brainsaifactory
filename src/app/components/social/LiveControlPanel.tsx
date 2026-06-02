import React, { useState } from 'react';
import {
  Activity, Zap, Clock, AlertTriangle, CheckCircle2, BarChart3,
  ChevronDown, ChevronUp, Filter, Trash2, Play, Pause,
  ArrowUpRight, RefreshCw, Loader2
} from 'lucide-react';
import type { AutopilotLog, BrainCommandState, PlatformId } from './types';

const platformEmoji: Record<PlatformId, string> = {
  facebook: 'FB',
  instagram: 'IG',
  tiktok: 'TT',
  twitter: 'X',
  linkedin: 'LI',
  youtube: 'YT',
  pinterest: 'PIN',
};

const actionColors: Record<string, string> = {
  generate: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  schedule: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  publish: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  toggle_on: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  toggle_off: 'text-gray-400 bg-gray-500/10 border-gray-500/20',
  reschedule: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  error: 'text-red-400 bg-red-500/10 border-red-500/20',
};

const actionIcons: Record<string, React.ElementType> = {
  generate: Zap,
  schedule: Clock,
  publish: CheckCircle2,
  toggle_on: Play,
  toggle_off: Pause,
  reschedule: RefreshCw,
  error: AlertTriangle,
};

interface LiveControlPanelProps {
  state: BrainCommandState;
  onRunAll: () => void;
  onClearLogs: () => void;
  isRunningAll: boolean;
}

export function LiveControlPanel({
  state,
  onRunAll,
  onClearLogs,
  isRunningAll,
}: LiveControlPanelProps) {
  const [expanded, setExpanded] = useState(true);
  const [filterAction, setFilterAction] = useState<string | null>(null);
  const [showAllLogs, setShowAllLogs] = useState(false);

  const { stats, logs, isRunning, currentTask, progress } = state;

  const filteredLogs = filterAction
    ? logs.filter((l) => l.action === filterAction)
    : logs;

  const displayLogs = showAllLogs ? filteredLogs : filteredLogs.slice(0, 20);

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const formatRelative = (ts: number | null) => {
    if (!ts) return 'Never';
    const diff = ts - Date.now();
    if (diff < 0) {
      const ago = Date.now() - ts;
      if (ago < 60000) return 'Just now';
      if (ago < 3600000) return `${Math.floor(ago / 60000)}m ago`;
      return `${Math.floor(ago / 3600000)}h ago`;
    }
    if (diff < 3600000) return `in ${Math.floor(diff / 60000)}m`;
    return `in ${Math.floor(diff / 3600000)}h`;
  };

  return (
    <div className="bg-[#292946] rounded-2xl border border-white/5 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Activity className="w-5 h-5 text-cyan-400" />
              {(isRunning || isRunningAll) && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-cyan-400 rounded-full animate-ping" />
              )}
            </div>
            <h3 className="text-white font-bold text-sm">Live Control Panel</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onRunAll}
              disabled={isRunningAll}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-500 text-[#1e1e2f] rounded-lg text-[11px] font-bold hover:from-cyan-400 hover:to-blue-400 transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50"
            >
              {isRunningAll ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Play className="w-3 h-3" />
              )}
              {isRunningAll ? 'Running...' : 'Run All Autopilots'}
            </button>
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-gray-500 hover:text-gray-300 p-1"
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Progress bar (when running) */}
        {(isRunning || isRunningAll) && (
          <div className="mb-3">
            <div className="flex items-center justify-between text-[10px] mb-1">
              <span className="text-cyan-400 font-medium">{currentTask || 'Processing...'}</span>
              <span className="text-gray-500">{progress}%</span>
            </div>
            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <StatCard
            label="Generated"
            value={stats.totalPostsGenerated}
            icon={Zap}
            color="text-cyan-400"
          />
          <StatCard
            label="Queued"
            value={stats.totalPostsQueued}
            icon={Clock}
            color="text-blue-400"
          />
          <StatCard
            label="Active"
            value={`${stats.activeProfiles}/${stats.totalProfiles}`}
            icon={Activity}
            color="text-emerald-400"
          />
          <StatCard
            label="Next Run"
            value={formatRelative(stats.nextRunAt)}
            icon={ArrowUpRight}
            color="text-purple-400"
          />
        </div>
      </div>

      {/* Logs Section */}
      {expanded && (
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-xs font-semibold">Activity Log</span>
              <span className="text-gray-600 text-[10px]">({logs.length} entries)</span>
            </div>
            <div className="flex items-center gap-1.5">
              {/* Filter buttons */}
              {['generate', 'schedule', 'error'].map((action) => (
                <button
                  key={action}
                  onClick={() => setFilterAction(filterAction === action ? null : action)}
                  className={`px-2 py-0.5 rounded text-[10px] font-medium border transition-colors ${
                    filterAction === action
                      ? actionColors[action]
                      : 'text-gray-500 bg-white/5 border-white/5 hover:border-white/10'
                  }`}
                >
                  {action}
                </button>
              ))}
              <button
                onClick={onClearLogs}
                className="text-gray-600 hover:text-gray-400 p-1"
                title="Clear logs"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Log entries */}
          <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
            {displayLogs.length === 0 ? (
              <div className="text-center py-6">
                <Activity className="w-8 h-8 text-gray-700 mx-auto mb-2" />
                <p className="text-gray-600 text-xs">No activity yet. Generate some posts!</p>
              </div>
            ) : (
              displayLogs.map((log) => {
                const ActionIcon = actionIcons[log.action] || Activity;
                const color = actionColors[log.action] || 'text-gray-400 bg-gray-500/10 border-gray-500/20';
                return (
                  <div
                    key={log.id}
                    className="flex items-start gap-2 py-1.5 px-2 rounded-lg hover:bg-white/[0.02] transition-colors group"
                  >
                    <div className={`p-1 rounded border ${color} shrink-0 mt-0.5`}>
                      <ActionIcon className="w-3 h-3" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-gray-300 text-[11px] font-medium truncate">
                          {log.message}
                        </span>
                      </div>
                      {log.details && (
                        <p className="text-gray-600 text-[10px] truncate mt-0.5">
                          {log.details}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[9px] font-mono text-gray-600 bg-white/5 px-1.5 py-0.5 rounded">
                        {platformEmoji[log.platform]}
                      </span>
                      <span className="text-gray-600 text-[10px] font-mono">
                        {formatTime(log.timestamp)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {filteredLogs.length > 20 && !showAllLogs && (
            <button
              onClick={() => setShowAllLogs(true)}
              className="w-full mt-2 py-1.5 text-gray-500 hover:text-gray-300 text-[11px] text-center transition-colors"
            >
              Show all {filteredLogs.length} entries
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="bg-white/5 rounded-lg p-2.5 border border-white/5">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className={`w-3.5 h-3.5 ${color}`} />
        <span className="text-gray-500 text-[10px]">{label}</span>
      </div>
      <span className="text-white text-sm font-bold">{value}</span>
    </div>
  );
}
