// ─── BrainNeuralMap — Animated SVG Neural Network Visualization ───────────────
// Shared across GeniusAIChat · AICodeAssistant · GitRepair · BrainCommandCenter
// Shows all 12 agents as nodes in a ring, with animated data-packet flows
// along active neural links. Supports interactive node-click tooltips.

import React, { useEffect, useRef, useState } from 'react';
import {
  BRAIN_AGENTS,
  NEURAL_LINKS,
  getAgentHealth,
} from '../utils/superCodingBrain';

// ─── Layout helpers ────────────────────────────────────────────────────────────

const SVG_SIZE = 320;
const CENTER   = SVG_SIZE / 2; // 160
const RADIUS   = 118;

/** Polar → Cartesian, agents 1-12 evenly spaced clockwise, starting top */
function agentPos(id: number): { x: number; y: number } {
  const angleDeg = (id - 1) * 30 - 90;
  const rad = angleDeg * (Math.PI / 180);
  return {
    x: Math.round(CENTER + RADIUS * Math.cos(rad)),
    y: Math.round(CENTER + RADIUS * Math.sin(rad)),
  };
}

const POSITIONS: Record<number, { x: number; y: number }> = {};
for (let i = 1; i <= 12; i++) POSITIONS[i] = agentPos(i);

// ─── Props ─────────────────────────────────────────────────────────────────────

export interface BrainNeuralMapProps {
  /** Agent IDs that are considered "active" for the current query */
  activeAgentIds?: Set<number>;
  /** True while AI is processing — triggers animations */
  isThinking?: boolean;
  /** Rendered pixel size (square) — defaults to 300 */
  size?: number;
  /** Hide text labels under nodes to save space */
  compact?: boolean;
  className?: string;
  /** Show agent health bars below each node */
  showHealth?: boolean;
  /** Called when user clicks an agent node */
  onNodeClick?: (agentId: number) => void;
}

// ─── Tooltip overlay ───────────────────────────────────────────────────────────

interface NodeTooltipProps {
  agentId: number;
  svgSize: number;
  renderedSize: number;
  onClose: () => void;
}

function NodeTooltip({ agentId, svgSize, renderedSize, onClose }: NodeTooltipProps) {
  const agent = BRAIN_AGENTS.find(a => a.id === agentId);
  const health = getAgentHealth(agentId);
  if (!agent) return null;

  const scale = renderedSize / svgSize;
  const pos = POSITIONS[agentId];
  // pixel position within the rendered SVG
  const px = pos.x * scale;
  const py = pos.y * scale;

  // place tooltip: above/below based on quadrant
  const tooltipTop = py < renderedSize / 2;
  const tooltipLeft = px < renderedSize / 2;

  return (
    <div
      className="absolute z-50 pointer-events-none"
      style={{
        left: px,
        top: py,
        transform: `translate(${tooltipLeft ? '4px' : 'calc(-100% - 4px)'}, ${tooltipTop ? '4px' : 'calc(-100% - 4px)'})`,
      }}
    >
      <div className="bg-gray-900 border border-purple-500/60 rounded-xl p-3 shadow-2xl shadow-purple-900/40 min-w-[180px] max-w-[220px] pointer-events-auto">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-1.5 right-1.5 text-gray-600 hover:text-gray-400 text-[10px] leading-none px-1"
        >✕</button>

        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xl">{agent.icon}</span>
          <div>
            <div className="text-[9px] font-bold text-purple-400 uppercase tracking-wider">Agent {agent.id}</div>
            <div className="text-xs font-bold text-white">{agent.name}</div>
          </div>
        </div>

        {/* Role */}
        <p className="text-[10px] text-gray-400 leading-snug mb-2">{agent.role}</p>

        {/* Tasks */}
        <div className="space-y-0.5 mb-2">
          {agent.tasks.slice(0, 3).map((t, i) => (
            <div key={i} className={`text-[9px] px-1.5 py-0.5 rounded ${agent.bg} ${agent.color} border ${agent.border}`}>
              • {t}
            </div>
          ))}
        </div>

        {/* Health */}
        {health.totalRuns > 0 ? (
          <div className="border-t border-gray-800 pt-2 space-y-1">
            <div className="flex items-center justify-between text-[8px] text-gray-500">
              <span>Success rate</span>
              <span className={health.successRate > 0.8 ? 'text-green-400' : health.successRate > 0.5 ? 'text-yellow-400' : 'text-red-400'}>
                {Math.round(health.successRate * 100)}%
              </span>
            </div>
            <div className="h-1 rounded-full bg-gray-800 overflow-hidden">
              <div
                className={`h-full rounded-full ${health.successRate > 0.8 ? 'bg-green-500' : health.successRate > 0.5 ? 'bg-yellow-500' : 'bg-red-500'}`}
                style={{ width: `${Math.round(health.successRate * 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-[8px] text-gray-600">
              <span>{health.totalRuns} runs</span>
              <span>{health.avgDuration}ms avg</span>
              {health.recentRuns > 0 && <span className="text-purple-400">{health.recentRuns} recent</span>}
            </div>
          </div>
        ) : (
          <div className="text-[9px] text-gray-600 text-center py-1">No telemetry yet — fire a query!</div>
        )}

        {/* Output */}
        <div className="border-t border-gray-800 mt-2 pt-1.5">
          <p className={`text-[9px] font-medium ${agent.color}`}>↳ {agent.output}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function BrainNeuralMap({
  activeAgentIds = new Set(),
  isThinking     = false,
  size           = 300,
  compact        = false,
  className      = '',
  showHealth     = false,
  onNodeClick,
}: BrainNeuralMapProps) {
  const [tick, setTick] = useState(0);
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef<number>(0);
  const [hoveredAgent, setHoveredAgent] = useState<number | null>(null);
  const [clickedAgent, setClickedAgent] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Run animation tick ~30 fps only while thinking
  useEffect(() => {
    if (!isThinking) { setTick(0); return; }
    const step = (ts: number) => {
      if (ts - lastRef.current > 33) {
        setTick(t => (t + 1) % 400);
        lastRef.current = ts;
      }
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [isThinking]);

  const activeLinks = NEURAL_LINKS.filter(
    l => activeAgentIds.has(l.from) && activeAgentIds.has(l.to)
  );

  const NODE_R = compact ? 13 : 17;

  const handleNodeClick = (agentId: number) => {
    if (onNodeClick) {
      onNodeClick(agentId);
      return;
    }
    // Built-in tooltip mode
    setClickedAgent(prev => prev === agentId ? null : agentId);
  };

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`} style={{ width: size, height: size }}>
      <svg
        viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
        width={size}
        height={size}
        style={{ overflow: 'visible' }}
        aria-label="AI Brain Neural Network"
      >
        <defs>
          {/* Ambient background glow */}
          <radialGradient id="bnm-ambient" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#7c3aed" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
          </radialGradient>

          {/* Node glow */}
          <filter id="bnm-glow-sm" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>

          {/* Strong glow for center hub */}
          <filter id="bnm-glow-lg" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>

          {/* Hover glow */}
          <filter id="bnm-glow-hover" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>

          {/* Packet gradient */}
          <radialGradient id="bnm-packet" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#e879f9" stopOpacity="1" />
            <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.4" />
          </radialGradient>
        </defs>

        {/* ── Ambient background ── */}
        <circle cx={CENTER} cy={CENTER} r={CENTER - 4} fill="url(#bnm-ambient)" />

        {/* ── Outer ring guide ── */}
        <circle
          cx={CENTER} cy={CENTER} r={RADIUS}
          fill="none"
          stroke="#1f2937"
          strokeWidth="0.5"
          strokeDasharray="3 6"
          opacity="0.6"
        />

        {/* ── All idle links ── */}
        {NEURAL_LINKS.map((link, i) => {
          const f = POSITIONS[link.from];
          const t = POSITIONS[link.to];
          const isActive = activeLinks.some(l => l.from === link.from && l.to === link.to);
          const isHovered = hoveredAgent !== null && (link.from === hoveredAgent || link.to === hoveredAgent);
          const dashOffset = isActive && isThinking ? -(tick * 0.65) : 0;

          return (
            <line
              key={`lnk-${i}`}
              x1={f.x} y1={f.y}
              x2={t.x} y2={t.y}
              stroke={isHovered ? '#a855f7' : isActive ? '#7c3aed' : '#1a2033'}
              strokeWidth={isHovered ? 2.0 : isActive ? 1.6 : 0.7}
              strokeOpacity={isHovered ? 1 : isActive ? 0.88 : 0.45}
              strokeDasharray={isActive && isThinking ? '5 4' : undefined}
              style={isActive && isThinking ? { strokeDashoffset: dashOffset } : undefined}
            />
          );
        })}

        {/* ── Data packets on active links ── */}
        {isThinking && activeLinks.map((link, i) => {
          const f = POSITIONS[link.from];
          const t = POSITIONS[link.to];
          const pct1 = ((tick * 1.3  + i * 40) % 400) / 400;
          const pct2 = ((tick * 1.3  + i * 40 + 200) % 400) / 400;
          const pts = [pct1, pct2].map(p => ({
            x: f.x + (t.x - f.x) * p,
            y: f.y + (t.y - f.y) * p,
            opacity: Math.sin(p * Math.PI) * 0.9 + 0.1,
          }));
          return pts.map((pt, j) => (
            <circle
              key={`pkt-${i}-${j}`}
              cx={pt.x} cy={pt.y} r={2.5}
              fill="url(#bnm-packet)"
              opacity={pt.opacity}
              filter="url(#bnm-glow-sm)"
            />
          ));
        })}

        {/* ── Agent nodes ── */}
        {BRAIN_AGENTS.map(agent => {
          const pos    = POSITIONS[agent.id];
          const active = activeAgentIds.has(agent.id);
          const hovered = hoveredAgent === agent.id;
          const clicked = clickedAgent === agent.id;
          const breathe = active && isThinking
            ? 1 + 0.08 * Math.sin((tick / 400) * Math.PI * 4 + agent.id * 0.7)
            : 1;
          const pulseR = NODE_R * 1.9 * breathe;
          const pulseOpacity = active && isThinking
            ? 0.25 * (1 - ((tick + agent.id * 12) % 60) / 60)
            : 0;

          return (
            <g
              key={agent.id}
              transform={`translate(${pos.x},${pos.y})`}
              style={{ cursor: 'pointer' }}
              onClick={() => handleNodeClick(agent.id)}
              onMouseEnter={() => setHoveredAgent(agent.id)}
              onMouseLeave={() => setHoveredAgent(null)}
            >
              {/* Outer pulse ring */}
              {active && (
                <circle
                  r={pulseR}
                  fill="none"
                  stroke="#7c3aed"
                  strokeWidth="1"
                  strokeOpacity={pulseOpacity}
                />
              )}

              {/* Hover / click ring */}
              {(hovered || clicked) && (
                <circle
                  r={NODE_R + 5}
                  fill="none"
                  stroke={clicked ? '#e879f9' : '#a855f7'}
                  strokeWidth="1.5"
                  strokeOpacity="0.7"
                  filter="url(#bnm-glow-hover)"
                />
              )}

              {/* Node background */}
              <circle
                r={NODE_R}
                fill={clicked ? '#1e0a40' : active ? '#130a2e' : '#0d1117'}
                stroke={clicked ? '#e879f9' : active ? '#7c3aed' : hovered ? '#4b2d8c' : '#1f2937'}
                strokeWidth={clicked || active ? 1.8 : 0.9}
                filter={active && isThinking ? 'url(#bnm-glow-sm)' : undefined}
              />

              {/* Emoji icon */}
              <text
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={compact ? 8 : 10}
                style={{ userSelect: 'none' }}
              >
                {agent.icon}
              </text>

              {/* Agent ID badge */}
              <text
                x={NODE_R - 2}
                y={-NODE_R + 3}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize="5.5"
                fill={active ? '#a855f7' : '#374151'}
                fontWeight="800"
              >
                {agent.id}
              </text>

              {/* Label below node */}
              {!compact && (
                <text
                  y={NODE_R + 8}
                  textAnchor="middle"
                  dominantBaseline="hanging"
                  fontSize="6.5"
                  fill={active ? '#c4b5fd' : '#374151'}
                  fontWeight={active ? '600' : '400'}
                >
                  {agent.name.split(' ')[0]}
                </text>
              )}

              {/* Health bar (optional) */}
              {showHealth && (() => {
                const h = getAgentHealth(agent.id);
                const barW = 28;
                const fillW = barW * h.successRate;
                return (
                  <g transform={`translate(${-barW / 2},${NODE_R + (compact ? 6 : 17)})`}>
                    <rect width={barW} height={2.5} rx="1.25" fill="#1f2937" />
                    <rect
                      width={fillW} height={2.5} rx="1.25"
                      fill={h.successRate > 0.8 ? '#10b981' : h.successRate > 0.5 ? '#f59e0b' : '#ef4444'}
                      opacity="0.9"
                    />
                  </g>
                );
              })()}
            </g>
          );
        })}

        {/* ── Center hub ── */}
        <g transform={`translate(${CENTER},${CENTER})`}>
          {/* Outer pulse for hub */}
          {isThinking && (
            <circle
              r={36 + 5 * Math.sin((tick / 400) * Math.PI * 3)}
              fill="none"
              stroke="#7c3aed"
              strokeWidth="0.8"
              strokeOpacity={0.18 + 0.12 * Math.sin((tick / 400) * Math.PI * 3)}
            />
          )}
          {/* Hub body */}
          <circle
            r={compact ? 18 : 24}
            fill={isThinking ? '#160d3a' : '#0f172a'}
            stroke={isThinking ? '#7c3aed88' : '#1f293788'}
            strokeWidth="1.5"
            filter={isThinking ? 'url(#bnm-glow-lg)' : undefined}
          />
          {/* Hub icon */}
          <text
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={compact ? 13 : 16}
            style={{ userSelect: 'none' }}
          >
            {isThinking ? '⚡' : '🧠'}
          </text>
          {/* "BRAIN" label */}
          {!compact && (
            <text
              y={compact ? 20 : 27}
              textAnchor="middle"
              dominantBaseline="hanging"
              fontSize="5.5"
              fill={isThinking ? '#a855f7' : '#374151'}
              fontWeight="700"
              letterSpacing="1"
            >
              {isThinking ? 'FIRING' : 'BRAIN'}
            </text>
          )}
        </g>
      </svg>

      {/* ── Built-in node tooltip overlay ── */}
      {clickedAgent !== null && !onNodeClick && (
        <NodeTooltip
          agentId={clickedAgent}
          svgSize={SVG_SIZE}
          renderedSize={size}
          onClose={() => setClickedAgent(null)}
        />
      )}
    </div>
  );
}