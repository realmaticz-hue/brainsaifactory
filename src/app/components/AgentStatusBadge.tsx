// ================================================================
// AGENT STATUS BADGE — Always-visible, unobtrusive nav indicator
// The ONLY background agent UI element visible on the main page.
// Clicking opens the full Autonomous Agent cockpit page.
// Designed to be minimal — a pulse dot + label + count only.
// ================================================================

import { useState, useEffect } from 'react';
import {
  getState, subscribe, getActiveTaskCount, getCompletedTaskCount,
  PHASE_META, formatUptime, startUptimeTicker, type AgentState,
} from '../utils/autonomousAgent';

interface AgentStatusBadgeProps {
  onOpen: () => void;
}

export function AgentStatusBadge({ onOpen }: AgentStatusBadgeProps) {
  const [state, setState] = useState<AgentState>(getState());
  const [tooltipVisible, setTooltipVisible] = useState(false);

  // Subscribe to agent state changes
  useEffect(() => {
    startUptimeTicker();
    const unsub = subscribe(s => setState({ ...s }));
    return unsub;
  }, []);

  const activeCount  = getActiveTaskCount(state);
  const doneCount    = getCompletedTaskCount(state);
  const meta         = PHASE_META[state.currentPhase];
  const pending      = state.pendingActions.length;

  // Dot color logic
  const dotColor = !state.isActive
    ? '#6b7280'  // gray — idle
    : activeCount > 0
      ? '#f59e0b'  // amber — working
      : state.metrics.errorsDetected > 0
        ? '#ef4444'  // red — errors
        : '#10b981'; // green — healthy

  const dotPulse = state.isActive && activeCount > 0;

  return (
    <div className="relative flex items-center">
      {/* ── Main badge button ── */}
      <button
        onClick={onOpen}
        onMouseEnter={() => setTooltipVisible(true)}
        onMouseLeave={() => setTooltipVisible(false)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all hover:bg-gray-100 border border-gray-200 bg-white"
        title="Open Autonomous Dev Agent"
        aria-label="Autonomous Dev Agent status"
      >
        {/* Pulse dot */}
        <span className="relative flex h-2 w-2 shrink-0">
          {dotPulse && (
            <span
              className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60"
              style={{ background: dotColor }}
            />
          )}
          <span
            className="relative inline-flex rounded-full h-2 w-2"
            style={{ background: dotColor }}
          />
        </span>

        {/* Label */}
        <span className="text-xs font-semibold text-gray-600 hidden sm:inline">
          Dev Agent
        </span>

        {/* Active task count badge */}
        {activeCount > 0 && (
          <span
            className="text-xs font-bold px-1.5 py-0.5 rounded-full leading-none"
            style={{ background: '#f59e0b22', color: '#d97706', border: '1px solid #f59e0b44' }}
          >
            {activeCount}
          </span>
        )}

        {/* Pending actions badge (needs user attention) */}
        {pending > 0 && (
          <span
            className="text-xs font-bold px-1.5 py-0.5 rounded-full leading-none animate-pulse"
            style={{ background: '#ef444422', color: '#dc2626', border: '1px solid #ef444455' }}
          >
            {pending}!
          </span>
        )}

        {/* Done count (subtle) */}
        {doneCount > 0 && activeCount === 0 && (
          <span
            className="text-xs font-semibold leading-none"
            style={{ color: '#10b981' }}
          >
            ✓{doneCount}
          </span>
        )}
      </button>

      {/* ── Hover tooltip — shows last activity, hidden by default ── */}
      {tooltipVisible && (
        <div
          className="absolute top-full mt-2 right-0 z-50 p-3 rounded-xl shadow-2xl border w-64"
          style={{ background: '#111827', borderColor: '#1f2937', color: '#e2e8f0' }}
        >
          {/* Phase */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-base">{meta.icon}</span>
            <div>
              <div className="text-xs font-bold" style={{ color: '#e2e8f0' }}>
                {state.isActive ? meta.label : 'Idle'}
              </div>
              <div className="text-xs" style={{ color: '#6b7280' }}>{meta.description}</div>
            </div>
          </div>

          {/* Metrics row */}
          <div className="flex items-center justify-between text-xs border-t pt-2" style={{ borderColor: '#1f2937' }}>
            <span style={{ color: '#6b7280' }}>Bugs fixed</span>
            <span style={{ color: '#10b981' }} className="font-bold">{state.metrics.bugsFixed}</span>
          </div>
          <div className="flex items-center justify-between text-xs mt-1">
            <span style={{ color: '#6b7280' }}>Uptime</span>
            <span style={{ color: '#6b7280' }}>{formatUptime(state.metrics.uptimeSeconds)}</span>
          </div>

          {/* Recent activity */}
          {state.recentActivity.length > 0 && (
            <div className="mt-2 border-t pt-2" style={{ borderColor: '#1f2937' }}>
              <div className="text-xs font-semibold mb-1" style={{ color: '#6b7280' }}>Last activity</div>
              <div className="text-xs" style={{ color: '#9ca3af' }}>{state.recentActivity[0]}</div>
            </div>
          )}

          <div className="text-xs mt-2 text-center" style={{ color: '#4b5563' }}>
            Click to open Dev Agent cockpit
          </div>
        </div>
      )}
    </div>
  );
}
