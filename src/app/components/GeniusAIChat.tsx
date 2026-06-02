import React, { useState, useEffect, useRef, useCallback } from 'react';
import { copyToClipboard } from '../utils/clipboard';
import {
  Brain, Lightbulb, History, Zap, CheckCircle,
  ChevronDown, ChevronUp, GitBranch, Code,
  MessageSquare, Globe, Package,
  RefreshCw, Copy, Check, Search, Database,
  Settings, ExternalLink, ThumbsUp, ThumbsDown, Send, Cpu,
  Wifi, WifiOff, X, Mic, MicOff, Image as ImageIcon,
  BookOpen, Smile, Layers, AlertTriangle, Target, FlaskConical,
  Youtube, ArrowRight, Star, Shield, Network
} from 'lucide-react';
import { BRAIN_AGENTS, NEURAL_LINKS, GLOBAL_CONTROL_LOOP, getActiveAgentsForQuery, logBrainActivity, getBrainActivity, clearBrainActivity, simulateAgentTelemetry, getBrainTelemetry, clearBrainTelemetry, getAgentHealth, type BrainActivityEvent } from '../utils/superCodingBrain';
import { BrainNeuralMap } from './BrainNeuralMap';
import { generateComprehensiveAnswer } from './AIKnowledgeBase';
import {
  detectDomain, detectTone, extractProjectContext,
  generateEliteResponse, type ConversationContext
} from './AdvancedAIEngine';
import {
  bridgeHasFiles, bridgeFindRelevantFiles, applyAutoFixes,
  generateFileRewriteBlock, bridgeGetCurrentCode,
  bridgeGetAndClearCopilotQuery,
  type CurrentCodeContext
} from '../utils/fileContextBridge';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { resolveServerUrl, serverFetch } from '../utils/serverFetch';
import { detectAndSolveError } from './GeniusAIChat.ErrorDB';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ModelInfo {
  model: string;
  name: string;
  provider: string;
  color: string;
  icon: string;
  reason: string;
  specialty: string;
}

interface ResearchSource {
  agent: string;
  agentIcon: string;
  title: string;
  url?: string;
  snippet: string;
  source: string;
  relevance?: number;
}

interface AgentResult {
  name: string;
  icon: string;
  status: 'success' | 'empty' | 'error' | 'running' | 'idle';
  sources: ResearchSource[];
  duration?: number;
}

interface CriticResult {
  passed: boolean;
  issues: string[];
  improvedAnswer?: string;
  confidence: number;
}

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  model?: ModelInfo;
  sources?: ResearchSource[];
  agents?: AgentResult[];
  reasoning?: ReasoningProcess;
  confidence?: number;
  isLocal?: boolean;
  emotion?: 'neutral' | 'helpful' | 'excited' | 'careful' | 'warning';
  feedback?: 'up' | 'down' | null;
  subQuestions?: string[];
  criticResult?: CriticResult;
  pipelineSteps?: string[];
  imageAttachment?: string; // base64
}

interface ReasoningProcess {
  steps: ReasoningStep[];
  conclusion: string;
  alternatives: string[];
  confidence: number;
}

interface ReasoningStep {
  thought: string;
  analysis: string;
}

interface UserProfile {
  interests: string[];
  projects: string[];
  goals: string[];
  preferredStyle: string;
  pastQuestions: string[];
  updatedAt: number;
}

type ChatTab = 'chat' | 'pipeline' | 'agents' | 'sources' | 'memory' | 'models' | 'brain' | 'megabrain';
type TeachingMode = 'auto' | 'simple' | 'storytelling' | 'technical' | 'humor';

// ─── Constants ────────────────────────────────────────────────────────────────

// SERVER_BASE is provided by serverFetch utility (kept for any legacy references)
const SESSION_ID = `session-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const AGENT_DEFINITIONS = [
  { name: 'Academic Research', icon: '🎓', color: 'text-blue-400', bg: 'bg-blue-900/20', desc: 'arXiv · PubMed · Google Scholar · Semantic Scholar' },
  { name: 'Web Knowledge', icon: '🌐', color: 'text-green-400', bg: 'bg-green-900/20', desc: 'Wikipedia · DuckDuckGo · Web' },
  { name: 'YouTube', icon: '▶️', color: 'text-red-400', bg: 'bg-red-900/20', desc: 'YouTube videos · Tutorials · Talks' },
  { name: 'Technical Docs', icon: '⚙️', color: 'text-yellow-400', bg: 'bg-yellow-900/20', desc: 'GitHub · npm · Documentation' },
  { name: 'Historical Data', icon: '📚', color: 'text-orange-400', bg: 'bg-orange-900/20', desc: 'Internet Archive · History' },
  { name: 'Scientific', icon: '🔬', color: 'text-purple-400', bg: 'bg-purple-900/20', desc: 'CrossRef · DOI · Journals' },
  { name: 'Social & Community', icon: '👥', color: 'text-pink-400', bg: 'bg-pink-900/20', desc: 'Reddit · Hacker News · Community' },
];

const TEACHING_MODES: { id: TeachingMode; label: string; icon: React.ReactNode; desc: string }[] = [
  { id: 'auto', label: 'Auto', icon: <Brain className="w-3 h-3" />, desc: 'Adapts to your style' },
  { id: 'simple', label: 'Simple', icon: <Smile className="w-3 h-3" />, desc: 'Plain language, short sentences' },
  { id: 'storytelling', label: 'Story', icon: <BookOpen className="w-3 h-3" />, desc: 'Hooks, analogies, narrative' },
  { id: 'technical', label: 'Technical', icon: <Code className="w-3 h-3" />, desc: 'Deep, precise, detailed' },
  { id: 'humor', label: 'Humor', icon: <Smile className="w-3 h-3" />, desc: 'Entertaining + educational' },
];

const PIPELINE_NODES = [
  { id: 'intent', label: 'Intent Analyzer', icon: '🎯', color: 'from-cyan-600 to-cyan-800' },
  { id: 'decompose', label: 'Question Decomposer', icon: '🔍', color: 'from-blue-600 to-blue-800' },
  { id: 'router', label: 'AI Router', icon: '🔀', color: 'from-violet-600 to-violet-800' },
  { id: 'research', label: 'Research Engine', icon: '🔬', color: 'from-emerald-600 to-emerald-800' },
  { id: 'vector', label: 'Vector Database', icon: '📊', color: 'from-indigo-600 to-indigo-800' },
  { id: 'models', label: 'AI Models', icon: '🤖', color: 'from-purple-600 to-purple-800' },
  { id: 'critic', label: 'Critic AI', icon: '⚖️', color: 'from-orange-600 to-orange-800' },
  { id: 'response', label: 'Final Response', icon: '✨', color: 'from-green-600 to-green-800' },
  { id: 'memory', label: 'Memory Storage', icon: '🧠', color: 'from-rose-600 to-rose-800' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isErrorQuery(text: string): boolean {
  const lower = text.toLowerCase();
  return ['error', 'exception', 'fix', 'broken', 'crash', 'fail', 'undefined', 'null', 'cannot read',
    'not found', 'unexpected', 'cors', 'module not found', 'type error', 'syntax error',
    'uncaught', 'traceback', 'stack trace', 'at line', 'build failed', 'compilation failed',
    'validatedomnesting', 'dom nesting', 'each child in a list', 'missing key',
    'exhaustive-deps', 'npm err', 'enoent', 'permission denied'].some(s => lower.includes(s));
}

function detectEmotion(content: string): Message['emotion'] {
  const lower = content.toLowerCase();
  if (lower.includes('⚠️') || lower.includes('warning') || lower.includes('caution')) return 'warning';
  if (lower.includes('error') || lower.includes('bug') || lower.includes('fix')) return 'careful';
  if (lower.includes('🎉') || lower.includes('excellent') || lower.includes('amazing')) return 'excited';
  if (lower.includes('here') || lower.includes('help') || lower.includes('sure')) return 'helpful';
  return 'neutral';
}

async function silentFileScan(enrichedQuery: string): Promise<string> {
  try {
    if (!bridgeHasFiles()) return '';
    const relevant = bridgeFindRelevantFiles(enrichedQuery, 3);
    if (!relevant.length) return '';
    const blocks: string[] = [];
    for (const file of relevant) {
      const content = typeof file.content === 'string' ? file.content : '';
      if (!content) continue;
      const { fixedContent, changes } = applyAutoFixes(content, enrichedQuery);
      blocks.push(generateFileRewriteBlock(file, changes, fixedContent, enrichedQuery));
    }
    return blocks.join('\n\n');
  } catch (e) {
    console.error('silentFileScan:', e);
    return '';
  }
}

// ─── Copy Button ──────────────────────────────────────────────────────────────

function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    copyToClipboard(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy} className="text-xs flex items-center gap-1 text-gray-500 hover:text-purple-300 transition-colors">
      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
      {copied ? 'Copied!' : label}
    </button>
  );
}

// ─── Markdown Renderer ────────────────────────────────────────────────────────

function FileRewriteBlock({ raw }: { raw: string }) {
  const [expanded, setExpanded] = useState(true);
  const [copied, setCopied] = useState(false);
  const titleMatch = raw.match(/##\s+📄\s+CORRECTED FILE:\s+(.+)/);
  const filename = titleMatch ? titleMatch[1].trim() : 'File';
  const pathMatch = raw.match(/\*\*Full Path:\*\*\s+`([^`]+)`/);
  const fullPath = pathMatch ? pathMatch[1] : '';
  const codeMatch = raw.match(/```[\w]*\n([\s\S]*?)```/);
  const codeContent = codeMatch ? codeMatch[1] : '';
  const fixesMatch = raw.match(/\*\*Fixes Applied:\*\*\n([\s\S]*?)\n---/);
  const fixesText = fixesMatch ? fixesMatch[1].trim() : '';

  return (
    <div className="my-3 rounded-xl border border-green-500/40 bg-gray-900/80 overflow-hidden shadow-lg">
      <div className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-green-900/60 to-emerald-900/40 border-b border-green-500/30">
        <div className="flex items-center gap-2">
          <span className="text-green-400 text-base">📄</span>
          <div>
            <span className="text-green-300 font-bold text-sm">{filename}</span>
            {fullPath && <span className="ml-2 text-gray-400 text-[10px] font-mono">{fullPath}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { copyToClipboard(codeContent); setCopied(true); setTimeout(() => setCopied(false), 2500); }}
            className="flex items-center gap-1 text-xs px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors font-semibold">
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {copied ? 'Copied!' : 'Copy File'}
          </button>
          <button onClick={() => setExpanded(e => !e)}
            className="text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-md transition-colors">
            {expanded ? 'Collapse' : 'Expand'}
          </button>
        </div>
      </div>
      {fixesText && (
        <div className="px-4 py-2 bg-green-900/20 border-b border-green-500/20">
          <p className="text-green-400 text-xs font-semibold mb-1">✅ Fixes Applied:</p>
          {fixesText.split('\n').map((line, i) => (
            <p key={i} className="text-gray-300 text-xs leading-relaxed">{line}</p>
          ))}
        </div>
      )}
      {expanded && codeContent && (
        <pre className="p-4 overflow-x-auto text-xs text-gray-300 leading-relaxed max-h-96">
          <code>{codeContent}</code>
        </pre>
      )}
    </div>
  );
}

function renderContent(content: string): React.ReactNode {
  if (!content) return null;
  const fileBlocks = content.split(/(---FILE-REWRITE-START[\s\S]*?FILE-REWRITE-END---)/);

  return fileBlocks.map((block, i) => {
    if (block.startsWith('---FILE-REWRITE-START') || block.includes('## 📄 CORRECTED FILE:')) {
      return <FileRewriteBlock key={i} raw={block} />;
    }

    const lines = block.split('\n');
    const elements: React.ReactNode[] = [];
    let codeBuffer: string[] = [];
    let codeLang = '';
    let inCode = false;

    const flushCode = (key: string) => {
      if (codeBuffer.length > 0) {
        elements.push(
          <div key={key} className="relative my-3 rounded-xl overflow-hidden border border-gray-700">
            <div className="flex items-center justify-between bg-gray-800 px-3 py-1.5 border-b border-gray-700">
              <span className="text-[10px] font-mono text-purple-300">{codeLang || 'code'}</span>
              <CopyButton text={codeBuffer.join('\n')} />
            </div>
            <pre className="bg-gray-900 p-4 overflow-x-auto text-xs leading-relaxed text-gray-200">
              <code>{codeBuffer.join('\n')}</code>
            </pre>
          </div>
        );
        codeBuffer = [];
        codeLang = '';
      }
    };

    lines.forEach((line, li) => {
      if (line.startsWith('```')) {
        if (inCode) { flushCode(`code-${i}-${li}`); inCode = false; }
        else { inCode = true; codeLang = line.slice(3).trim(); }
        return;
      }
      if (inCode) { codeBuffer.push(line); return; }

      const key = `line-${i}-${li}`;
      if (/^#{1,3}\s/.test(line)) {
        const level = line.match(/^(#{1,3})/)?.[1].length || 1;
        const text = line.replace(/^#{1,3}\s/, '');
        elements.push(<div key={key} className={`font-bold text-white ${level === 1 ? 'text-base mt-4 mb-2' : level === 2 ? 'text-sm mt-3 mb-1.5 text-purple-200' : 'text-xs mt-2 mb-1 text-blue-300'}`}>{text}</div>);
      } else if (/^\s*[-*•]\s/.test(line)) {
        elements.push(<div key={key} className="flex items-start gap-2 py-0.5"><span className="text-purple-400 mt-1 flex-shrink-0 text-xs">•</span><span className="text-sm text-gray-200 leading-relaxed">{renderInline(line.replace(/^\s*[-*•]\s/, ''))}</span></div>);
      } else if (/^\d+\.\s/.test(line)) {
        const num = line.match(/^(\d+)\./)?.[1];
        elements.push(<div key={key} className="flex items-start gap-2 py-0.5"><span className="text-purple-400 font-bold text-xs flex-shrink-0 mt-1 w-4">{num}.</span><span className="text-sm text-gray-200 leading-relaxed">{renderInline(line.replace(/^\d+\.\s/, ''))}</span></div>);
      } else if (line.startsWith('> ')) {
        elements.push(<blockquote key={key} className="border-l-2 border-purple-500 pl-3 py-1 my-1 text-sm text-gray-300 italic">{line.slice(2)}</blockquote>);
      } else if (line.trim() === '---' || line.trim() === '***') {
        elements.push(<hr key={key} className="border-gray-700 my-3" />);
      } else if (line.trim()) {
        elements.push(<p key={key} className="text-sm text-gray-200 leading-relaxed py-0.5">{renderInline(line)}</p>);
      } else {
        elements.push(<div key={key} className="h-1" />);
      }
    });

    if (inCode) flushCode(`code-${i}-end`);
    return <div key={i}>{elements}</div>;
  });
}

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('`') && part.endsWith('`')) return <code key={i} className="bg-gray-800 text-purple-300 px-1.5 py-0.5 rounded text-xs font-mono">{part.slice(1, -1)}</code>;
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={i} className="text-white font-semibold">{part.slice(2, -2)}</strong>;
    if (part.startsWith('*') && part.endsWith('*')) return <em key={i} className="text-gray-300 italic">{part.slice(1, -1)}</em>;
    return part;
  });
}

// ─── Model Badge ──────────────────────────────────────────────────────────────

function ModelBadge({ model }: { model: ModelInfo }) {
  const badges: Record<string, { bg: string; border: string }> = {
    'GPT-4o': { bg: 'bg-emerald-900/40', border: 'border-emerald-500/40' },
    'GPT-4o Mini': { bg: 'bg-indigo-900/40', border: 'border-indigo-500/40' },
    'Claude 3.5 Sonnet': { bg: 'bg-orange-900/40', border: 'border-orange-500/40' },
    'Gemini 2.0 Flash': { bg: 'bg-blue-900/40', border: 'border-blue-500/40' },
    'DeepSeek R1': { bg: 'bg-purple-900/40', border: 'border-purple-500/40' },
    'Llama 3.3 70B': { bg: 'bg-amber-900/40', border: 'border-amber-500/40' },
  };
  const style = badges[model.name] || { bg: 'bg-gray-800', border: 'border-gray-600' };
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border font-medium text-white ${style.bg} ${style.border}`}>
      <span>{model.icon}</span>
      <span>{model.name}</span>
    </span>
  );
}

// ─── Pipeline Visualization ───────────────────────────────────────────────────

function PipelineViz({ activeStep, pipelineSteps, isRunning }: {
  activeStep: number;
  pipelineSteps: string[];
  isRunning: boolean;
}) {
  return (
    <div className="p-4 space-y-2">
      <div className="flex items-center gap-2 mb-3">
        <Layers className="w-4 h-4 text-purple-400" />
        <h3 className="text-white font-bold text-sm">AI Pipeline</h3>
        {isRunning && <span className="text-xs text-purple-300 animate-pulse">● Running</span>}
      </div>

      {/* Flow Diagram */}
      <div className="space-y-1.5">
        {PIPELINE_NODES.map((node, i) => {
          const isActive = isRunning && i === activeStep;
          const isDone = i < activeStep || (!isRunning && activeStep >= PIPELINE_NODES.length);
          const stepLog = pipelineSteps[i];

          return (
            <div key={node.id}>
              <div className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all duration-500 ${isActive
                  ? `bg-gradient-to-r ${node.color} border-white/20 shadow-lg scale-[1.02]`
                  : isDone
                    ? 'bg-gray-800/60 border-green-700/30'
                    : 'bg-gray-900/30 border-gray-800'
                }`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-base ${isActive ? 'bg-white/20 animate-pulse' : isDone ? 'bg-green-900/40' : 'bg-gray-800'
                  }`}>
                  {isDone && !isActive ? '✓' : node.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-bold ${isActive ? 'text-white' : isDone ? 'text-green-400' : 'text-gray-600'}`}>
                    {node.label}
                  </p>
                  {stepLog && (
                    <p className="text-[10px] text-gray-400 truncate">{stepLog.replace(/^[^\s]+\s/, '')}</p>
                  )}
                </div>
                {isActive && (
                  <div className="flex gap-0.5">
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                )}
              </div>
              {i < PIPELINE_NODES.length - 1 && (
                <div className={`ml-6 w-0.5 h-2 ${isDone ? 'bg-green-700/50' : 'bg-gray-800'} transition-colors`} />
              )}
            </div>
          );
        })}
      </div>

      {/* ReAct Loop */}
      <div className="mt-4 p-3 bg-gray-900/50 rounded-xl border border-purple-500/20">
        <p className="text-[10px] font-bold text-purple-400 mb-2">⚡ ReAct Reasoning Loop</p>
        <div className="flex items-center gap-1 flex-wrap">
          {['Question', 'Plan', 'Research', 'Reason', 'Write', 'Check', 'Improve'].map((step, i, arr) => (
            <span key={step} className="inline-flex items-center gap-1">
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${isRunning && i <= activeStep ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-500'
                } transition-all`}>{step}</span>
              {i < arr.length - 1 && <ArrowRight className="w-2.5 h-2.5 text-gray-600" />}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Sources Panel ────────────────────────────────────────────────────────────

function SourcesPanel({ sources }: { sources: ResearchSource[] }) {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? sources : sources.slice(0, 2);
  const grouped = shown.reduce((acc, s) => {
    acc[s.agent] = acc[s.agent] || [];
    acc[s.agent].push(s);
    return acc;
  }, {} as Record<string, ResearchSource[]>);

  return (
    <div className="mt-3 pt-2 border-t border-gray-700">
      <button onClick={() => setExpanded(e => !e)}
        className="flex items-center gap-1.5 text-[10px] text-blue-400 hover:text-blue-300 mb-2 transition-colors">
        <Search className="w-3 h-3" />
        <span>{sources.length} source{sources.length !== 1 ? 's' : ''} retrieved</span>
        {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>
      {expanded && Object.entries(grouped).map(([agent, agentSources]) => (
        <div key={agent} className="mb-2">
          <p className="text-[9px] text-gray-500 font-semibold uppercase tracking-wide mb-1">
            {agentSources[0].agentIcon} {agent}
          </p>
          {agentSources.map((s, i) => (
            <div key={i} className="mb-1.5 pl-3 border-l-2 border-gray-700">
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-semibold text-gray-200 leading-tight">{s.title}</p>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {s.relevance !== undefined && (
                    <span className={`text-[9px] px-1 py-0.5 rounded font-bold ${s.relevance >= 60 ? 'bg-green-900/40 text-green-400' :
                        s.relevance >= 30 ? 'bg-yellow-900/40 text-yellow-400' :
                          'bg-gray-800 text-gray-500'
                      }`}>{s.relevance}%</span>
                  )}
                  {s.url && (
                    <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
              <p className="text-[10px] text-gray-500 mt-0.5 line-clamp-2">{s.snippet}</p>
              <span className="text-[9px] text-purple-500 font-medium">{s.source}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ─── Agent Activity Panel ─────────────────────────────────────────────────────

function AgentActivityPanel({ agents, isRunning }: { agents: AgentResult[]; isRunning: boolean }) {
  return (
    <div className="grid grid-cols-4 gap-1 mt-3">
      {AGENT_DEFINITIONS.map((def, i) => {
        const result = agents.find(a => a.name === def.name);
        const status = isRunning && !result ? 'running' : (result?.status || 'idle');
        return (
          <div key={i} className={`flex flex-col items-center gap-0.5 px-1.5 py-1.5 rounded-lg border text-[9px] transition-all ${status === 'running' ? `${def.bg} border-current ${def.color} animate-pulse` :
              status === 'success' ? `${def.bg} border-green-500/30` :
                status === 'empty' ? 'bg-gray-800/30 border-gray-700/30' :
                  status === 'error' ? 'bg-red-900/20 border-red-700/30' :
                    'bg-gray-800/20 border-gray-700/20'
            }`}>
            <span>{def.icon}</span>
            <span className={`font-medium ${status === 'running' ? def.color :
                status === 'success' ? 'text-green-400' :
                  status === 'empty' ? 'text-gray-600' :
                    status === 'error' ? 'text-red-400' : 'text-gray-600'
              }`}>{def.name.split(' ')[0]}</span>
            {status === 'success' && result && (
              <span className="text-green-400">{result.sources.length}✓</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Thinking Indicator ───────────────────────────────────────────────────────

function ThinkingIndicator({ currentReasoning, agentStatuses, selectedModel, pipelineStep, startTime }: {
  currentReasoning: ReasoningStep[];
  agentStatuses: AgentResult[];
  selectedModel?: string;
  pipelineStep: number;
  startTime: number;
}) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  const node = PIPELINE_NODES[Math.min(pipelineStep, PIPELINE_NODES.length - 1)];
  const isSlowQuery = elapsed > 15;

  return (
    <div className="flex justify-start">
      <div className="max-w-[90%] bg-gray-800/80 border border-purple-500/20 rounded-xl p-4 shadow-lg">
        <div className="flex items-center gap-2 mb-3">
          <Brain className="w-4 h-4 text-purple-400 animate-pulse" />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-purple-300">
                {node ? `${node.icon} ${node.label}…` : selectedModel ? `${selectedModel} is thinking…` : 'Routing to best model…'}
              </span>
              <span className="text-[10px] text-gray-500">({elapsed}s)</span>
            </div>
            {isSlowQuery && (
              <p className="text-[10px] text-yellow-400 mt-0.5">
                🔬 Deep research in progress… Complex queries with research agents can take 30-90s
              </p>
            )}
          </div>
        </div>

        {currentReasoning.length > 0 && (
          <div className="space-y-1.5 mb-3">
            {currentReasoning.slice(-3).map((step, i) => (
              <div key={i} className="flex items-start gap-2">
                <Zap className="w-3 h-3 text-blue-400 mt-0.5 flex-shrink-0 animate-pulse" />
                <div>
                  <p className="text-xs font-semibold text-blue-300">{step.thought}</p>
                  <p className="text-xs text-gray-400">{step.analysis}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <AgentActivityPanel agents={agentStatuses} isRunning={true} />

        <div className="flex gap-1 mt-3">
          <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}

// ─── Critic AI Badge ──────────────────────────────────────────────────────────

function CriticBadge({ result }: { result: CriticResult }) {
  return (
    <div className={`flex items-center gap-1.5 text-[10px] px-2 py-1 rounded-full border ${result.passed
        ? 'bg-green-900/20 border-green-700/30 text-green-400'
        : 'bg-orange-900/20 border-orange-700/30 text-orange-400'
      }`}>
      {result.passed ? <Shield className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
      <span>Critic AI: {result.passed ? `Verified (${(result.confidence * 100).toFixed(0)}%)` : `${result.issues.length} issue(s) found`}</span>
    </div>
  );
}

// ─── Sub-questions Display ────────────────────────────────────────────────────

function SubQuestionsPanel({ questions }: { questions: string[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mb-2">
      <button onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 text-[10px] text-cyan-400 hover:text-cyan-300 transition-colors">
        <FlaskConical className="w-3 h-3" />
        Decomposed into {questions.length} sub-questions
        {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>
      {open && (
        <div className="mt-1.5 space-y-1">
          {questions.map((q, i) => (
            <div key={i} className="flex items-start gap-1.5 text-[10px] text-gray-400">
              <span className="text-cyan-500 font-bold">{i + 1}.</span>
              <span>{q}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Follow-up suggestions ────────────────────────────────────────────────────

function getFollowUps(content: string): string[] {
  const c = content.toLowerCase();
  // Code / debugging
  if (c.includes('react') && c.includes('version')) return ['How do I prevent version mismatches?', 'How do I use npm overrides?'];
  if (c.includes('cannot read') || c.includes('undefined')) return ['How do I use optional chaining?', 'How do I initialize state safely?'];
  if (c.includes('cors')) return ['How do I add CORS to my server?', 'How do I use a Vite proxy?'];
  if (c.includes('corrected file') || c.includes('corrected')) return ['Can you fix another file?', 'What caused this error?'];
  if (c.includes('error') || c.includes('fix') || c.includes('debug')) return ['How do I prevent this in future?', 'How do I write error boundaries?'];
  if (c.includes('typescript') || c.includes('type')) return ['Can you add stricter types?', 'How do I use generics here?'];
  if (c.includes('code') || c.includes('function') || c.includes('class')) return ['Can you add TypeScript types?', 'How do I test this?', 'Can you optimize this?'];
  if (c.includes('react') || c.includes('component') || c.includes('hook')) return ['How do I optimize React performance?', 'What are React best practices?'];
  // Research / science
  if (c.includes('research') || c.includes('paper') || c.includes('study')) return ['Show me more related papers', 'How does this apply in practice?', 'What are the limitations?'];
  if (c.includes('transformer') || c.includes('neural') || c.includes('llm') || c.includes('model')) return ['How do I fine-tune this model?', 'What are the limitations?', 'How does this compare to GPT-4?'];
  // Math
  if (c.includes('proof') || c.includes('theorem') || c.includes('calculus')) return ['Walk me through this step-by-step', 'Can you give a concrete example?', 'What are the edge cases?'];
  // Writing / business
  if (c.includes('email') || c.includes('subject line') || c.includes('campaign')) return ['Write a follow-up version', 'Make it more concise', 'Add a stronger call-to-action'];
  if (c.includes('essay') || c.includes('article') || c.includes('blog')) return ['Make it shorter', 'Add more examples', 'Improve the conclusion'];
  if (c.includes('strategy') || c.includes('business') || c.includes('market')) return ['What are the risks?', 'Show me a competitor analysis', 'How do I measure success?'];
  // Security
  if (c.includes('security') || c.includes('vulnerabilit') || c.includes('exploit')) return ['How do I fix this vulnerability?', 'What security audit tools should I use?'];
  // General
  return ['Can you show a full example?', 'What are best practices here?', 'Explain this more simply'];
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function GeniusAIChat() {
  const [activeTab, setActiveTab] = useState<ChatTab>('chat');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [currentReasoning, setCurrentReasoning] = useState<ReasoningStep[]>([]);
  const [agentStatuses, setAgentStatuses] = useState<AgentResult[]>([]);
  const [activeModel, setActiveModel] = useState<string | undefined>();
  const [showReasoningId, setShowReasoningId] = useState<string | null>(null);
  const [filesAvailable, setFilesAvailable] = useState(false);
  const [currentCodeCtx, setCurrentCodeCtx] = useState<CurrentCodeContext | null>(null);
  const [copilotActionsOpen, setCopilotActionsOpen] = useState(false);
  const [pendingAutoSend, setPendingAutoSend] = useState<string | null>(null);
  const [runResearch, setRunResearch] = useState(true);
  const [runCritic, setRunCritic] = useState(true);
  const [forcedModel, setForcedModel] = useState<string | undefined>();
  const [teachingMode, setTeachingMode] = useState<TeachingMode>('auto');
  const [serverOnline, setServerOnline] = useState<boolean | null>(null);
  const [allSources, setAllSources] = useState<ResearchSource[]>([]);
  const [pipelineStep, setPipelineStep] = useState(0);
  const [pipelineStepsLog, setPipelineStepsLog] = useState<string[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [imageAttachment, setImageAttachment] = useState<string | null>(null);
  const [brainActivity, setBrainActivity] = useState<BrainActivityEvent[]>([]);
  const [lastQueryAgents, setLastQueryAgents] = useState<number[]>([]);
  const [context, setContext] = useState<ConversationContext>({
    domain: 'general', tone: 'casual', user_preferences: {}, conversation_history: []
  });
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesScrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const historyRef = useRef<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  // Whether the viewport was near the bottom before the latest state update
  const wasAtBottomRef = useRef(true);
  // Previous message count — used to detect a freshly submitted user message
  const lastMsgCountRef = useRef(0);
  const thinkingStartTime = useRef<number>(0);

  /** Programmatically scroll the messages pane to the bottom. */
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    const el = messagesScrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior });
  };

  // ── Effects ──────────────────────────────────────────────────────────────────

  // Smart auto-scroll: never hijack the user's scroll position while they are
  // reading an answer.  Only scroll automatically when the user was already near
  // the bottom, OR when they just sent their own message.
  useEffect(() => {
    const el = messagesScrollRef.current;
    if (!el) return;

    const chatMsgs = messages.filter(m => m.role !== 'system');
    const msgCount = chatMsgs.length;
    const latestIsUser = chatMsgs[chatMsgs.length - 1]?.role === 'user';

    // The user just submitted a message — always snap to bottom so it's visible
    if (latestIsUser && msgCount > lastMsgCountRef.current) {
      lastMsgCountRef.current = msgCount;
      wasAtBottomRef.current = true;
      scrollToBottom('auto');
      setShowScrollBtn(false);
      return;
    }
    lastMsgCountRef.current = msgCount;

    if (wasAtBottomRef.current) {
      // Keep the user at the bottom as the answer streams in
      scrollToBottom('smooth');
      setShowScrollBtn(false);
    } else {
      // User has scrolled up to read — reveal the floating button, don't hijack
      setShowScrollBtn(true);
    }
  }, [messages, currentReasoning, isThinking]);

  useEffect(() => {
    initSystem();
    setFilesAvailable(bridgeHasFiles());
    const ctx = bridgeGetCurrentCode();
    if (ctx) setCurrentCodeCtx(ctx);
    checkServer();
    // Load cross-surface brain activity
    setBrainActivity(getBrainActivity());
    const pending = bridgeGetAndClearCopilotQuery();
    if (pending) {
      setTimeout(() => {
        setInput(pending);
        setActiveTab('chat');
        setTimeout(() => setPendingAutoSend(pending), 200);
      }, 300);
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const has = bridgeHasFiles();
      if (has !== filesAvailable) setFilesAvailable(has);
      const ctx = bridgeGetCurrentCode();
      if (ctx?.timestamp !== currentCodeCtx?.timestamp) setCurrentCodeCtx(ctx);
    }, 3000);
    return () => clearInterval(interval);
  }, [filesAvailable, currentCodeCtx]);

  useEffect(() => {
    if (!pendingAutoSend || isThinking) return;
    const query = pendingAutoSend;
    setPendingAutoSend(null);
    setInput('');
    sendQuery(query);
  }, [pendingAutoSend, isThinking]);

  // ── Server Check ──────────────────────────────────────────────────────────────

  const checkServer = async () => {
    try {
      console.log('[GeniusAI] Checking server health...');
      const res = await serverFetch('/health');
      setServerOnline(res.ok);
      console.log(`[GeniusAI] Server health check: ${res.ok ? 'ONLINE ✓' : 'OFFLINE ✗'}`);
      if (res.ok) loadUserProfile();
    } catch (err: any) {
      console.error('[GeniusAI] Server health check failed:', err);
      console.error('[GeniusAI] Troubleshooting info:', {
        serverUrl: resolveServerUrl('/health'),
        errorType: err.name,
        errorMessage: err.message,
        possibleCauses: [
          '1. Supabase Edge Function not deployed',
          '2. Network/CORS issue',
          '3. Invalid project credentials'
        ]
      });
      // Network-level failure = truly offline. Other errors may be transient.
      if (err instanceof TypeError) {
        setServerOnline(false);
      } else {
        setServerOnline(null); // unknown — will retry on next send
      }
    }
  };

  const loadUserProfile = async () => {
    try {
      const res = await serverFetch(`/genius-profile/${SESSION_ID}`);
      if (res.ok) {
        const data = await res.json();
        if (data.profile) setUserProfile(data.profile);
      }
    } catch (_) { }
  };

  // ── Voice Input ──────────────────────────────────────────────────────────────

  const toggleVoice = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Voice input not supported in this browser.');
      return;
    }
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognition.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      setInput(prev => prev ? `${prev} ${transcript}` : transcript);
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
    recognitionRef.current = recognition;
    setIsListening(true);
  };

  // ── Image Upload ─────────────────────────────────────────────────────────────

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const b64 = ev.target?.result as string;
      setImageAttachment(b64);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // ── Init ──────────────────────────────────────────────────────────────────────

  const initSystem = () => {
    // No system message — keep conversation area clean for user-AI chat only
    setMessages([]);
  };

  // ── Simulate Pipeline Steps During Thinking ───────────────────────────────────

  const simulatePipeline = async (totalDuration: number) => {
    const stepTime = totalDuration / PIPELINE_NODES.length;
    for (let i = 0; i < PIPELINE_NODES.length; i++) {
      setPipelineStep(i);
      await new Promise(r => setTimeout(r, stepTime));
    }
  };

  // ── Deep Reasoning — Server Path ──────────────────────────────────────────────

  const performDeepReasoning = async (query: string): Promise<{
    content: string;
    model?: ModelInfo;
    sources?: ResearchSource[];
    agents?: AgentResult[];
    reasoning?: ReasoningProcess;
    subQuestions?: string[];
    criticResult?: CriticResult;
    pipelineSteps?: string[];
    isLocal?: boolean;
  }> => {
    const ctx = currentCodeCtx;
    const enrichedQuery = ctx && !query.includes(ctx.filename)
      ? `${query}\n\n[Active code context — ${ctx.filename}]\n\`\`\`${ctx.language}\n${ctx.code.slice(0, 2500)}${ctx.code.length > 2500 ? '\n// … (truncated)' : ''}\n\`\`\``
      : query;

    // Step 1: Intent analysis
    setCurrentReasoning([{ thought: '🎯 Intent Analyzer', analysis: 'Classifying query domain and intent…' }]);
    await new Promise(r => setTimeout(r, 150));

    // LOCAL FAST PATH: known error patterns
    if (isErrorQuery(query)) {
      const knownFix = detectAndSolveError(enrichedQuery);
      if (knownFix) {
        setCurrentReasoning([
          { thought: '🐛 Error Pattern Matched', analysis: 'Found in local error database' },
          ...(ctx ? [{ thought: '📂 Code Context Active', analysis: `Analysing ${ctx.filename}` }] : [])
        ]);
        let fileRewriteBlock = '';
        if (bridgeHasFiles()) {
          setCurrentReasoning(prev => [...prev, { thought: '🧩 Cross-referencing files…', analysis: 'Scanning repository' }]);
          fileRewriteBlock = await silentFileScan(enrichedQuery);
        }
        return {
          content: knownFix + fileRewriteBlock,
          reasoning: {
            steps: [
              { thought: '🐛 Error Pattern Matched', analysis: 'Found in error knowledge base' },
              ...(ctx ? [{ thought: '📂 Code Context Active', analysis: ctx.filename }] : []),
              ...(fileRewriteBlock ? [{ thought: '📁 File Rewrite Prepared', analysis: 'Corrected version included' }] : [])
            ],
            conclusion: knownFix + fileRewriteBlock, alternatives: [], confidence: 0.99
          },
          isLocal: true
        };
      }
    }

    // SERVER PATH
    if (serverOnline !== false) {
      setCurrentReasoning(prev => [...prev,
      { thought: '🔍 Question Decomposer', analysis: 'Breaking into focused sub-questions…' },
      ]);
      setAgentStatuses([]);

      if (runResearch) {
        setCurrentReasoning(prev => [...prev,
        { thought: '🔬 Research Engine', analysis: 'Launching 7 agents in parallel: arXiv · Web · YouTube · GitHub · CrossRef · Reddit · Archive' }
        ]);
      }

      try {
        const queryWithStyle = teachingMode !== 'auto'
          ? `${enrichedQuery}\n\n[Preferred response style: ${teachingMode}]`
          : enrichedQuery;

        const reqBody = {
          query: queryWithStyle,
          history: historyRef.current.slice(-16),
          sessionId: SESSION_ID,
          runResearch,
          runCritic,
          codeContext: ctx?.code?.slice(0, 3000),
          forcedModel,
          teachingMode,
        };

        console.log('[GeniusAI] Sending request to /genius-chat');

        // Add timeout to prevent hanging - 90 seconds for complex queries with research
        const controller = new AbortController();
        const timeoutMs = runResearch ? 90000 : 60000; // 90s with research, 60s without
        const timeoutId = setTimeout(() => {
          console.warn('[GeniusAI] Request timeout after', timeoutMs, 'ms - aborting');
          controller.abort();
        }, timeoutMs);

        let res;
        try {
          res = await serverFetch('/genius-chat', {
            method: 'POST',
            body: JSON.stringify(reqBody),
            signal: controller.signal
          });
          clearTimeout(timeoutId);
          console.log('[GeniusAI] Request completed successfully');
        } catch (fetchError: any) {
          clearTimeout(timeoutId);

          // Check if it was a timeout
          if (fetchError.name === 'AbortError') {
            console.error('[GeniusAI] Request timeout - server took too long to respond');
            throw new Error(`Request timeout after ${timeoutMs / 1000} seconds`);
          }

          console.error('[GeniusAI] Fetch error:', fetchError.message);
          throw new Error(`Network error: ${fetchError.message}`);
        }

        if (!res.ok) {
          const errText = await res.text();
          console.error('[GeniusAI] Server error response:', res.status, errText);
          throw new Error(`Server returned ${res.status}: ${errText}`);
        }

        const data = await res.json();
        console.log('[GeniusAI] Received response:', {
          hasResponse: !!data.response,
          responseLength: data.response?.length
        });

        if (data.forbidden) {
          return {
            content: data.forbiddenMessage || '⚠️ I cannot assist with that request.',
            reasoning: {
              steps: [{ thought: '🚫 Content Policy', analysis: 'Request blocked by safety filter' }],
              conclusion: '', alternatives: [], confidence: 1
            }
          };
        }

        setServerOnline(true);
        setActiveModel(data.model?.name);
        if (data.agents) setAgentStatuses(data.agents);
        if (data.sources) setAllSources(prev => [...prev, ...data.sources]);
        if (data.pipelineSteps) setPipelineStepsLog(data.pipelineSteps);

        const reasoning: ReasoningProcess = {
          steps: [
            { thought: `🤖 Model: ${data.model?.name || 'AI'}`, analysis: data.model?.reason || '' },
            ...(data.subQuestions?.length > 1 ? [{ thought: `🔍 Decomposed into ${data.subQuestions.length} sub-questions`, analysis: data.subQuestions.join(' | ') }] : []),
            ...(data.agents?.filter((a: AgentResult) => a.status === 'success').map((a: AgentResult) => ({
              thought: `${a.icon} ${a.name}`, analysis: `${a.sources.length} source${a.sources.length !== 1 ? 's' : ''} found`
            })) || []),
            ...(data.criticResult ? [{ thought: `⚖️ Critic AI: ${data.criticResult.passed ? 'Verified' : 'Improved'}`, analysis: data.criticResult.passed ? `Confidence: ${(data.criticResult.confidence * 100).toFixed(0)}%` : data.criticResult.issues.join(', ') }] : [])
          ],
          conclusion: data.response,
          alternatives: [],
          confidence: data.criticResult?.confidence || 0.97
        };

        let fileRewriteBlock = '';
        if (isErrorQuery(query) && bridgeHasFiles()) {
          fileRewriteBlock = await silentFileScan(enrichedQuery);
        }

        return {
          content: data.response + fileRewriteBlock,
          model: data.model,
          sources: data.sources || [],
          agents: data.agents || [],
          reasoning,
          subQuestions: data.subQuestions,
          criticResult: data.criticResult,
          pipelineSteps: data.pipelineSteps,
        };

      } catch (serverErr: any) {
        console.error('Server path failed:', serverErr);
        console.error('[GeniusAI] Full error details:', {
          name: serverErr.name,
          message: serverErr.message,
          stack: serverErr.stack?.substring(0, 500)
        });

        // Timeout errors should not permanently mark server as offline
        // They indicate the server is reachable but the query is taking too long
        if (serverErr.message?.toLowerCase().includes('timeout')) {
          setServerOnline(null); // Will retry next time
          console.warn('[GeniusAI] Request timeout - query took too long. Will retry next message.');
        }
        // True network failures (connection refused, DNS errors, etc.) mark as offline
        else if (serverErr instanceof TypeError ||
          serverErr.message?.toLowerCase().includes('fetch') ||
          serverErr.message?.toLowerCase().includes('network error') ||
          serverErr.message?.toLowerCase().includes('failed to fetch')) {
          setServerOnline(false);
          console.warn('[GeniusAI] Marked server as offline - using local fallback');
        }
        // Other errors (5xx, parsing errors) should retry
        else {
          setServerOnline(null);
          console.warn('[GeniusAI] Transient error - will retry next message');
        }
      }
    }

    // LOCAL FALLBACK
    setCurrentReasoning([{ thought: '⚡ Using local engine…', analysis: 'Server unavailable — using built-in intelligence' }]);
    await new Promise(r => setTimeout(r, 400));

    const domain = detectDomain(enrichedQuery);
    const tone = detectTone(enrichedQuery, domain);
    const project = extractProjectContext(enrichedQuery, context.conversation_history);

    const updatedCtx: ConversationContext = {
      ...context, domain, tone,
      ...(project ? { project } : context.project ? { project: context.project } : {}),
      conversation_history: [...context.conversation_history, { question: query, context: domain, timestamp: new Date() }].slice(-10)
    };
    setContext(updatedCtx);

    let solution: string;
    try { solution = generateEliteResponse(enrichedQuery, updatedCtx); }
    catch (e) { solution = generateComprehensiveAnswer(enrichedQuery); }

    let fileRewriteBlock = '';
    if (isErrorQuery(query) && bridgeHasFiles()) fileRewriteBlock = await silentFileScan(enrichedQuery);

    return {
      content: solution + fileRewriteBlock,
      reasoning: {
        steps: [
          { thought: `Domain: ${domain.toUpperCase()}`, analysis: `Local engine • ${tone} tone` },
          ...(fileRewriteBlock ? [{ thought: '📁 File Rewrite', analysis: 'Corrected version attached' }] : [])
        ],
        conclusion: solution + fileRewriteBlock, alternatives: [], confidence: 0.92
      },
      isLocal: true
    };
  };

  // ── Send ──────────────────────────────────────────────────────────────────────

  const sendQuery = async (queryText: string) => {
    const attachment = imageAttachment;
    setImageAttachment(null);

    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: queryText,
      timestamp: new Date(),
      imageAttachment: attachment || undefined,
    };

    setMessages(prev => [...prev, userMsg]);
    historyRef.current.push({ role: 'user', content: queryText });

    // Track which brain agents fire for this query
    const activeIds = getActiveAgentsForQuery(queryText);
    setLastQueryAgents(activeIds);
    logBrainActivity({ surface: 'chat', agentIds: activeIds, query: queryText.slice(0, 120), timestamp: Date.now() });
    setBrainActivity(getBrainActivity());
    // Record telemetry after a slight delay (simulates execution)
    setTimeout(() => simulateAgentTelemetry('chat', activeIds, 700), 1200);

    setIsThinking(true);
    thinkingStartTime.current = Date.now();
    setCurrentReasoning([]);
    setAgentStatuses([]);
    setActiveModel(undefined);
    setPipelineStep(0);
    setPipelineStepsLog([]);

    // Run pipeline simulation in parallel with actual request
    simulatePipeline(8000);

    try {
      const result = await performDeepReasoning(queryText);

      if (result.pipelineSteps) setPipelineStepsLog(result.pipelineSteps);

      const assistantMsg: Message = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: result.content,
        timestamp: new Date(),
        model: result.model,
        sources: result.sources,
        agents: result.agents,
        reasoning: result.reasoning,
        confidence: result.reasoning?.confidence || 0.97,
        emotion: detectEmotion(result.content),
        feedback: null,
        isLocal: result.isLocal,
        subQuestions: result.subQuestions,
        criticResult: result.criticResult,
        pipelineSteps: result.pipelineSteps,
      };

      setMessages(prev => [...prev, assistantMsg]);
      historyRef.current.push({ role: 'assistant', content: result.content });
      if (historyRef.current.length > 20) historyRef.current = historyRef.current.slice(-20);

      // Refresh user profile after response
      setTimeout(loadUserProfile, 2000);

    } catch (err) {
      console.error('Error generating response:', err);
      setMessages(prev => [...prev, {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: `⚠️ Error generating response: ${err}\n\n${generateComprehensiveAnswer(queryText)}`,
        timestamp: new Date(),
        isLocal: true
      }]);
    } finally {
      setIsThinking(false);
      setCurrentReasoning([]);
      setAgentStatuses([]);
      setActiveModel(undefined);
      setPipelineStep(PIPELINE_NODES.length);
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isThinking) return;
    const saved = input;
    setInput('');
    await sendQuery(saved);
  };

  const askQuestion = (q: string) => { setActiveTab('chat'); setInput(q); setTimeout(() => inputRef.current?.focus(), 100); };
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleFeedback = (msgId: string, fb: 'up' | 'down') => {
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, feedback: fb } : m));
  };

  const handleCorrection = async (msgId: string) => {
    const msg = messages.find(m => m.id === msgId);
    if (!msg) return;
    const correction = prompt('What was wrong with this answer?');
    if (!correction) return;
    try {
      await serverFetch('/genius-correction', {
        method: 'POST',
        body: JSON.stringify({ sessionId: SESSION_ID, originalAnswer: msg.content, correction })
      });
    } catch (e) { console.error('Correction submit failed:', e); }
  };

  // ─── Render ───────────────────────────────────────────────────────────────────

  const chatMessages = messages.filter(m => m.role !== 'system');
  const totalSources = messages.reduce((acc, m) => acc + (m.sources?.length || 0), 0);

  return (
    <div className="flex h-full max-h-full bg-gradient-to-br from-gray-900 via-purple-900/10 to-gray-900 overflow-hidden">

      {/* ── LEFT SIDEBAR: Controls & Features ──────────────────────────────── */}
      <div className="w-80 flex flex-col border-r border-purple-500/30 bg-gray-900/50 overflow-hidden">

        {/* Header */}
        <div className="flex-shrink-0 bg-gradient-to-r from-purple-900/60 to-blue-900/40 border-b border-purple-500/30 p-2">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <Brain className="w-6 h-6 text-purple-400" />
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            </div>
            <div>
              <h2 className="text-white font-bold text-base leading-tight">Genius AI</h2>
              <p className="text-purple-300 text-[10px]">🌟 Ultra-Builder Mode · 12-Agent Brain</p>
            </div>
          </div>

          {/* Stats */}
          <div className="flex flex-col gap-1.5 mt-2 text-[10px]">
            <div className="flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-400/30 rounded-full">
              <span className="text-purple-300">🌟</span>
              <span className="text-purple-200 font-semibold">Ultra-Builder Active</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1 text-purple-300">
                <History className="w-3 h-3" />
                <span>{chatMessages.length} messages</span>
              </div>
              <div className="flex items-center gap-1 text-blue-300">
                <Search className="w-3 h-3" />
                <span>{totalSources} sources</span>
              </div>
            </div>
            <div className={`flex items-center gap-1 ${filesAvailable ? 'text-green-400' : 'text-gray-600'}`}>
              <Package className="w-3 h-3" />
              <span>{filesAvailable ? 'Repo files active' : 'No repo files'}</span>
            </div>
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full border ${serverOnline === true ? 'bg-green-900/30 border-green-700/40 text-green-400' :
                serverOnline === false ? 'bg-red-900/30 border-red-700/40 text-red-400' :
                  'bg-gray-800 border-gray-700 text-gray-500'
              }`}>
              {serverOnline === true ? <Wifi className="w-3 h-3" /> :
                serverOnline === false ? <WifiOff className="w-3 h-3" /> :
                  <RefreshCw className="w-3 h-3 animate-spin" />}
              <span>{serverOnline === true ? 'Live AI' : serverOnline === false ? 'Offline' : 'Connecting'}</span>
            </div>
            {activeModel && (
              <div className="flex items-center gap-1 text-yellow-300 animate-pulse">
                <Cpu className="w-3 h-3" />
                <span>{activeModel}</span>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 mt-2">
            {messages.filter(m => m.role !== 'system').length > 0 && (
              <button
                onClick={() => { setMessages([]); historyRef.current = []; setAllSources([]); setPipelineStepsLog([]); initSystem(); }}
                className="flex-1 text-xs bg-gray-700 hover:bg-gray-600 text-white px-2.5 py-1 rounded-lg transition-colors flex items-center justify-center gap-1"
              >
                <RefreshCw className="w-3 h-3" /> New Chat
              </button>
            )}
            {serverOnline === false && (
              <button
                onClick={() => { setServerOnline(null); checkServer(); }}
                className="flex-1 text-xs px-2 py-1 bg-blue-700 hover:bg-blue-600 text-white rounded-lg border border-blue-500/40 transition-colors flex items-center justify-center gap-1"
              >
                <RefreshCw className="w-3 h-3" /> Retry
              </button>
            )}
          </div>
        </div>

        {/* Teaching Mode Selector */}
        <div className="flex-shrink-0 p-2 border-b border-purple-500/20">
          <span className="text-[10px] text-gray-500 block mb-1.5">Response Style:</span>
          <div className="flex flex-col gap-1">
            {TEACHING_MODES.map(mode => (
              <button key={mode.id} onClick={() => setTeachingMode(mode.id)}
                title={mode.desc}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${teachingMode === mode.id
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}>
                <span className="text-base">{mode.icon}</span>
                <span>{mode.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Code context panel */}
        {currentCodeCtx && (
          <div className="flex-shrink-0 p-2 border-b border-purple-500/20">
            <button onClick={() => setCopilotActionsOpen(o => !o)}
              className="flex items-center gap-1 text-blue-300 hover:text-blue-200 text-xs transition-colors mb-1.5">
              <Code className="w-3 h-3" />
              <span>{currentCodeCtx.filename}</span>
              {copilotActionsOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
            {copilotActionsOpen && (
              <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-2">
                <div className="flex flex-col gap-1.5">
                  {[
                    { label: '🐛 Find Bugs', q: 'Find all bugs and errors in my code and show me the corrected version.' },
                    { label: '✨ Explain', q: 'Explain this code step-by-step. What does it do?' },
                    { label: '⚡ Optimize', q: 'Optimize this code for performance and readability.' },
                    { label: '🔷 Types', q: 'Add complete TypeScript types and interfaces to this code.' },
                  ].map(({ label, q }, i) => (
                    <button key={i} onClick={() => { setInput(q); setActiveTab('chat'); setCopilotActionsOpen(false); }}
                      className="text-xs px-2 py-1.5 bg-blue-900/40 hover:bg-blue-800/60 text-blue-200 rounded-md border border-blue-500/30 transition-all text-left">
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tabs - Only show useful tabs, hide brain tabs */}
        <div className="flex-shrink-0 p-2 border-b border-purple-500/20">
          <span className="text-[10px] text-gray-500 block mb-1.5">View:</span>
          <div className="flex flex-col gap-1">
            {([
              { id: 'chat', label: 'Chat', Icon: MessageSquare },
              { id: 'pipeline', label: 'Pipeline', Icon: Layers, badge: isThinking ? 1 : 0 },
              { id: 'agents', label: 'Agents', Icon: Cpu },
              { id: 'sources', label: 'Sources', Icon: Search, badge: totalSources },
              { id: 'memory', label: 'Memory', Icon: Database, badge: userProfile?.interests.length || 0 },
              { id: 'models', label: 'Models', Icon: Settings },
            ] as const).map(({ id, label, Icon, badge }) => (
              <button key={id} onClick={() => setActiveTab(id as ChatTab)}
                className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${activeTab === id ? 'bg-purple-600 text-white shadow-lg' : 'bg-gray-800/60 text-gray-300 hover:bg-gray-800'
                  }`}>
                <div className="flex items-center gap-2">
                  <Icon className="w-3.5 h-3.5" />
                  <span>{label}</span>
                </div>
                {badge !== undefined && badge > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-purple-500 text-white text-[9px] font-bold leading-none">{badge}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content for non-chat tabs */}
        <div className="flex-1 overflow-y-auto">
          {/* ── Pipeline Tab ──────────────────────────────────────────────────── */}
          {activeTab === 'pipeline' && (
            <div className="p-4">
              <PipelineViz
                activeStep={pipelineStep}
                pipelineSteps={pipelineStepsLog}
                isRunning={isThinking}
              />
            </div>
          )}

          {/* ── Agents Tab ────────────────────────────────────────────────────── */}
          {activeTab === 'agents' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <Cpu className="w-5 h-5 text-purple-400" />
                <h3 className="text-white font-bold">7 Research Agents</h3>
              </div>
              <p className="text-gray-500 text-xs mb-3">All agents run in parallel for every query. Sources are ranked by vector similarity.</p>

              {AGENT_DEFINITIONS.map((def, i) => {
                const lastResult = [...messages].reverse().flatMap(m => m.agents || []).find(a => a.name === def.name);
                return (
                  <div key={i} className={`rounded-xl border p-4 ${def.bg} border-gray-700/50`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{def.icon}</span>
                        <div>
                          <p className={`font-bold text-sm ${def.color}`}>{def.name}</p>
                          <p className="text-gray-500 text-[10px]">{def.desc}</p>
                        </div>
                      </div>
                      {lastResult && (
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${lastResult.status === 'success' ? 'bg-green-900/30 border-green-700/40 text-green-400' :
                            lastResult.status === 'empty' ? 'bg-gray-800 border-gray-600 text-gray-500' :
                              'bg-red-900/30 border-red-700/40 text-red-400'
                          }`}>
                          {lastResult.status === 'success' ? `✓ ${lastResult.sources.length} sources` :
                            lastResult.status === 'empty' ? '— No results' : '✗ Error'}
                        </span>
                      )}
                    </div>

                    {lastResult?.sources && lastResult.sources.length > 0 && (
                      <div className="mt-2 space-y-1.5">
                        {lastResult.sources.map((s, j) => (
                          <div key={j} className="bg-gray-900/40 rounded-lg p-2 flex items-start gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-gray-200 font-medium truncate">{s.title}</p>
                              <p className="text-[10px] text-gray-500 line-clamp-2">{s.snippet}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[9px] text-purple-500">{s.source}</span>
                                {s.relevance !== undefined && (
                                  <span className={`text-[9px] px-1 rounded font-bold ${s.relevance >= 60 ? 'text-green-400' : s.relevance >= 30 ? 'text-yellow-400' : 'text-gray-600'
                                    }`}>{s.relevance}% match</span>
                                )}
                              </div>
                            </div>
                            {s.url && (
                              <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 flex-shrink-0">
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Sources Tab ───────────────────────────────────────────────────── */}
          {activeTab === 'sources' && (
            <div className="flex-1 overflow-y-auto p-4">
              <div className="flex items-center gap-2 mb-4">
                <Search className="w-5 h-5 text-purple-400" />
                <h3 className="text-white font-bold">All Research Sources</h3>
                <span className="text-gray-500 text-xs">({totalSources} total)</span>
              </div>

              {totalSources === 0 ? (
                <div className="text-center py-12">
                  <Globe className="w-12 h-12 text-gray-700 mx-auto mb-3" />
                  <p className="text-gray-500">No sources yet — ask a question with research agents enabled</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {allSources
                    .sort((a, b) => (b.relevance || 0) - (a.relevance || 0))
                    .map((s, i) => (
                      <div key={i} className="bg-gray-800/40 rounded-xl border border-gray-700/50 p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className="text-xs">{s.agentIcon}</span>
                              <span className="text-[10px] text-gray-500">{s.source}</span>
                              {s.relevance !== undefined && (
                                <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${s.relevance >= 60 ? 'bg-green-900/40 text-green-400' :
                                    s.relevance >= 30 ? 'bg-yellow-900/40 text-yellow-400' :
                                      'bg-gray-800 text-gray-500'
                                  }`}>{s.relevance}% relevance</span>
                              )}
                            </div>
                            <p className="text-sm text-gray-200 font-medium leading-tight">{s.title}</p>
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{s.snippet}</p>
                          </div>
                          {s.url && (
                            <a href={s.url} target="_blank" rel="noopener noreferrer"
                              className="flex-shrink-0 flex items-center gap-1 text-blue-400 hover:text-blue-300 text-xs px-2 py-1 bg-blue-900/20 rounded-lg border border-blue-700/30 hover:bg-blue-900/40 transition-colors">
                              <ExternalLink className="w-3 h-3" />
                              Open
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* ── Memory Tab ────────────────────────────────────────────────────── */}
          {activeTab === 'memory' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <Database className="w-5 h-5 text-purple-400" />
                <h3 className="text-white font-bold">Memory & User Profile</h3>
              </div>

              {userProfile ? (
                <>
                  {/* Interests */}
                  {userProfile.interests.length > 0 && (
                    <div className="bg-blue-900/20 rounded-xl border border-blue-700/30 p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Star className="w-4 h-4 text-blue-400" />
                        <p className="text-blue-300 font-bold text-sm">Detected Interests</p>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {userProfile.interests.map((interest, i) => (
                          <span key={i} className="text-xs px-2.5 py-1 bg-blue-900/40 text-blue-200 rounded-full border border-blue-700/40">
                            {interest}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Projects */}
                  {userProfile.projects.length > 0 && (
                    <div className="bg-emerald-900/20 rounded-xl border border-emerald-700/30 p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Code className="w-4 h-4 text-emerald-400" />
                        <p className="text-emerald-300 font-bold text-sm">Detected Projects</p>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {userProfile.projects.map((proj, i) => (
                          <span key={i} className="text-xs px-2.5 py-1 bg-emerald-900/40 text-emerald-200 rounded-full border border-emerald-700/40">
                            {proj}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Goals */}
                  {userProfile.goals.length > 0 && (
                    <div className="bg-orange-900/20 rounded-xl border border-orange-700/30 p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Target className="w-4 h-4 text-orange-400" />
                        <p className="text-orange-300 font-bold text-sm">Detected Goals</p>
                      </div>
                      <div className="space-y-1.5">
                        {userProfile.goals.map((goal, i) => (
                          <div key={i} className="flex items-start gap-2 text-xs text-orange-200">
                            <ArrowRight className="w-3 h-3 mt-0.5 flex-shrink-0 text-orange-400" />
                            {goal}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Preferred style */}
                  <div className="bg-purple-900/20 rounded-xl border border-purple-700/30 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <BookOpen className="w-4 h-4 text-purple-400" />
                      <p className="text-purple-300 font-bold text-sm">Preferred Style</p>
                    </div>
                    <span className="text-sm text-white capitalize">{userProfile.preferredStyle}</span>
                    <p className="text-xs text-gray-500 mt-1">Detected from your conversation patterns</p>
                  </div>

                  {/* Past questions */}
                  {userProfile.pastQuestions.length > 0 && (
                    <div className="bg-gray-800/40 rounded-xl border border-gray-700/50 p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <History className="w-4 h-4 text-gray-400" />
                        <p className="text-gray-300 font-bold text-sm">Past Questions ({userProfile.pastQuestions.length})</p>
                      </div>
                      <div className="space-y-1.5">
                        {userProfile.pastQuestions.slice(-8).reverse().map((q, i) => (
                          <button key={i} onClick={() => askQuestion(q)}
                            className="w-full text-left text-xs text-gray-400 hover:text-purple-300 py-1 border-b border-gray-700/50 last:border-0 transition-colors truncate">
                            {q}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <Brain className="w-12 h-12 text-gray-700 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">Ask questions to build your profile</p>
                  <p className="text-gray-600 text-xs mt-1">I'll learn your interests, projects, and goals automatically</p>
                </div>
              )}
            </div>
          )}

          {/* ── Brain Tab ─────────────────────────────────────────────────────── */}
          {activeTab === 'brain' && (() => {
            const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
            const activeAgentIds = new Set(lastUserMsg ? getActiveAgentsForQuery(lastUserMsg.content) : lastQueryAgents);
            const recentActivity = brainActivity.slice(-12).reverse();
            const telemetry = getBrainTelemetry();
            const sessionRuns = telemetry.filter(e => e.surface === 'chat').length;
            const sessionAvgMs = sessionRuns
              ? Math.round(telemetry.filter(e => e.surface === 'chat').reduce((s, e) => s + e.duration, 0) / sessionRuns)
              : 0;

            return (
              <div className="flex-1 overflow-y-auto p-3 space-y-3">

                {/* ── Header row ── */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Brain className={`w-5 h-5 text-purple-400 ${isThinking ? 'animate-pulse' : ''}`} />
                  <h3 className="text-white font-bold text-sm">AI Super Coding Brain</h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-900/40 border border-purple-500/40 text-purple-300">12 Agents</span>
                  {isThinking && (
                    <span className="text-[9px] text-purple-300 animate-pulse flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping inline-block" />
                      Live
                    </span>
                  )}
                  <div className="ml-auto flex items-center gap-2">
                    {sessionRuns > 0 && (
                      <span className="text-[9px] text-gray-500">
                        {sessionRuns} runs · avg {sessionAvgMs}ms
                      </span>
                    )}
                    <button
                      onClick={() => { clearBrainActivity(); setBrainActivity([]); clearBrainTelemetry(); }}
                      className="text-[9px] text-gray-600 hover:text-red-400 transition-colors"
                      title="Clear log + telemetry"
                    >Clear</button>
                  </div>
                </div>

                {/* ── Neural Network Map ── */}
                <div className="bg-gradient-to-br from-gray-900/80 to-purple-950/30 rounded-xl border border-purple-500/20 p-3 flex flex-col items-center gap-2">
                  <div className="flex items-center justify-between w-full mb-1">
                    <p className="text-[10px] font-bold text-purple-300 uppercase tracking-wider">
                      🕸️ Neural Link Map
                      {isThinking && <span className="ml-1 text-purple-400 animate-pulse">— transmitting</span>}
                    </p>
                    <span className="text-[9px] text-gray-600">
                      {activeAgentIds.size} / 12 active · {NEURAL_LINKS.filter(l => activeAgentIds.has(l.from) && activeAgentIds.has(l.to)).length} links live
                    </span>
                  </div>
                  <BrainNeuralMap
                    activeAgentIds={activeAgentIds}
                    isThinking={isThinking}
                    size={260}
                    compact={false}
                    showHealth={true}
                  />
                  <p className="text-[9px] text-gray-600 text-center">
                    Animated packets = live data flowing between agents · health bars = success rate
                  </p>
                </div>

                {/* ── Animated Global Control Loop ── */}
                <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 rounded-xl border border-purple-500/30 p-3">
                  <p className="text-[10px] font-bold text-purple-300 mb-2 uppercase tracking-wider">
                    ⚡ Global Control Loop {isThinking && <span className="text-purple-400 animate-pulse">— Executing…</span>}
                  </p>
                  <div className="grid grid-cols-3 gap-1.5">
                    {GLOBAL_CONTROL_LOOP.map((step, i) => {
                      const isActive = isThinking && Math.round(pipelineStep * (GLOBAL_CONTROL_LOOP.length / PIPELINE_NODES.length)) === i;
                      const isDone = !isThinking
                        ? (messages.some(m => m.role === 'assistant'))
                        : Math.round(pipelineStep * (GLOBAL_CONTROL_LOOP.length / PIPELINE_NODES.length)) > i;
                      return (
                        <div key={step.step} className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border text-[9px] transition-all duration-300 ${isActive ? 'bg-purple-600/40 border-purple-400/60 scale-105 shadow-lg shadow-purple-900/40' :
                            isDone ? 'bg-green-900/20 border-green-700/30' :
                              'bg-gray-800/40 border-gray-700/30 opacity-50'
                          }`}>
                          <span className={isActive ? 'animate-bounce' : ''}>{step.icon}</span>
                          <span className={`font-medium truncate ${isActive ? 'text-purple-200' : isDone ? 'text-green-400' : 'text-gray-500'}`}>
                            {step.label}
                          </span>
                          {isDone && !isActive && <span className="text-green-400 ml-auto flex-shrink-0">✓</span>}
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-2 text-[9px] text-purple-400 text-center">↻ Continuously improving — every response feeds Agent 11 (Memory)</div>
                </div>

                {/* ── Agent Health Grid ── */}
                <div className="bg-gray-900/40 rounded-xl border border-gray-700/40 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] font-bold text-gray-300 uppercase tracking-wider">
                      ❤️ Agent Health Metrics
                    </p>
                    <span className="text-[9px] text-gray-600">last 10 min session</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {BRAIN_AGENTS.map(agent => {
                      const isActive = activeAgentIds.has(agent.id);
                      const health = getAgentHealth(agent.id);
                      const barPct = health.totalRuns ? Math.round(health.successRate * 100) : 100;
                      const barColor = barPct > 80 ? 'bg-green-500' : barPct > 50 ? 'bg-yellow-500' : 'bg-red-500';
                      return (
                        <div key={agent.id} className={`rounded-lg p-2 border text-[9px] transition-all ${isActive ? `${agent.bg} ${agent.border}` : 'bg-gray-900/30 border-gray-800/40 opacity-55'
                          }`}>
                          <div className="flex items-center gap-1 mb-1">
                            <span>{agent.icon}</span>
                            <span className={`font-semibold truncate ${isActive ? agent.color : 'text-gray-600'}`}>
                              {agent.name.split(' ')[0]}
                            </span>
                          </div>
                          {/* Success bar */}
                          <div className="h-1 rounded-full bg-gray-800 mb-1 overflow-hidden">
                            <div className={`h-full rounded-full ${barColor} transition-all`} style={{ width: `${barPct}%` }} />
                          </div>
                          <div className="flex items-center justify-between text-[8px] text-gray-600">
                            <span>{barPct}%</span>
                            {health.totalRuns > 0 && <span>{health.avgDuration}ms avg</span>}
                            {health.recentRuns > 0 && <span className="text-purple-500">{health.recentRuns} now</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* ── Cross-surface Activity Log ── */}
                {recentActivity.length > 0 && (
                  <div className="bg-gray-900/50 rounded-xl border border-gray-700/40 p-3">
                    <p className="text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-wider">📡 Cross-Surface Activity Log</p>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto">
                      {recentActivity.map((ev) => {
                        const surfaceIcon = ev.surface === 'chat' ? '💬' : ev.surface === 'code-assistant' ? '🛠️' : '🔧';
                        const surfaceLabel = ev.surface === 'chat' ? 'Chat' : ev.surface === 'code-assistant' ? 'Code AI' : 'Git Repair';
                        return (
                          <div key={ev.id} className="flex items-start gap-2 text-[9px]">
                            <span className="flex-shrink-0 mt-0.5">{surfaceIcon}</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1 mb-0.5">
                                <span className="text-purple-300 font-medium">{surfaceLabel}</span>
                                <span className="text-gray-600">{new Date(ev.timestamp).toLocaleTimeString()}</span>
                              </div>
                              <p className="text-gray-500 truncate">{ev.query}</p>
                              <div className="flex gap-0.5 mt-0.5 flex-wrap">
                                {ev.agentIds.slice(0, 6).map(id => {
                                  const a = BRAIN_AGENTS.find(x => x.id === id);
                                  return a ? (
                                    <span key={id} className={`px-1 py-0.5 rounded text-[8px] ${a.bg} ${a.color}`}>{a.icon}</span>
                                  ) : null;
                                })}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ── 12 Agent Detail Cards ── */}
                <div className="grid grid-cols-1 gap-2">
                  {BRAIN_AGENTS.map((agent) => {
                    const isActive = activeAgentIds.has(agent.id);
                    const health = getAgentHealth(agent.id);
                    return (
                      <div key={agent.id} className={`rounded-xl border p-3 transition-all ${isActive ? `${agent.bg} ${agent.border} ring-1 ring-current/20` : 'bg-gray-900/30 border-gray-800/50 opacity-60'
                        }`}>
                        <div className="flex items-start gap-2">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-base ${agent.bg} border ${agent.border} ${isActive && isThinking ? 'animate-pulse' : ''}`}>
                            {agent.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                              <span className={`text-[10px] font-bold ${isActive ? agent.color : 'text-gray-600'}`}>Agent {agent.id}</span>
                              <span className={`text-xs font-semibold ${isActive ? 'text-white' : 'text-gray-500'}`}>{agent.name}</span>
                              {isActive && isThinking && (
                                <span className={`text-[8px] ml-auto px-1.5 py-0.5 rounded-full ${agent.bg} ${agent.color} font-bold border ${agent.border} animate-pulse`}>● FIRING</span>
                              )}
                              {isActive && !isThinking && (
                                <span className={`text-[8px] ml-auto px-1.5 py-0.5 rounded-full ${agent.bg} ${agent.color} font-bold border ${agent.border}`}>ACTIVE</span>
                              )}
                            </div>
                            <p className={`text-[10px] leading-relaxed mb-1.5 ${isActive ? 'text-gray-400' : 'text-gray-600'}`}>{agent.role}</p>
                            {isActive && (
                              <div className="flex flex-wrap gap-1 mb-1.5">
                                {agent.tasks.slice(0, 3).map((task, ti) => (
                                  <span key={ti} className={`text-[9px] px-1.5 py-0.5 rounded border ${agent.bg} ${agent.border} ${agent.color}`}>
                                    {task}
                                  </span>
                                ))}
                              </div>
                            )}
                            {isActive && <p className={`text-[9px] font-medium ${agent.color}`}>↳ {agent.output}</p>}
                            {/* Telemetry row */}
                            {health.totalRuns > 0 && (
                              <div className="flex items-center gap-2 mt-1.5">
                                <div className="flex-1 h-1 rounded-full bg-gray-800 overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${health.successRate > 0.8 ? 'bg-green-500' : health.successRate > 0.5 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                    style={{ width: `${Math.round(health.successRate * 100)}%` }}
                                  />
                                </div>
                                <span className="text-[8px] text-gray-600 whitespace-nowrap">
                                  {Math.round(health.successRate * 100)}% · {health.avgDuration}ms · {health.totalRuns}×
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* ── Mega Brain Protocol Tab ───────────────────────────────────────── */}
          {activeTab === 'megabrain' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="w-6 h-6 text-purple-400" />
                <div>
                  <h3 className="text-white font-bold text-lg">Mega Brain Any Question Protocol</h3>
                  <p className="text-purple-300 text-xs">Automatic 7-Phase Reasoning Framework</p>
                </div>
              </div>

              {/* Overview */}
              <div className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 rounded-xl border border-purple-500/40 p-4">
                <p className="text-sm text-gray-200 leading-relaxed">
                  <strong className="text-purple-300">Mega Brain Protocol</strong> automatically handles ANY question through systematic breakdown, generation, verification, and multi-modal output. No commands needed — just ask naturally!
                </p>
              </div>

              {/* The 7 Phases */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-purple-300 uppercase tracking-wider">The 7 Automatic Phases</p>

                {[
                  {
                    phase: '1. ANALYZE',
                    icon: '🔍',
                    color: 'from-blue-600/20 to-blue-800/20 border-blue-500/40',
                    desc: 'Identify domain, complexity, output types needed, break into sub-tasks, detect intent'
                  },
                  {
                    phase: '2. GENERATE',
                    icon: '⚡',
                    color: 'from-emerald-600/20 to-emerald-800/20 border-emerald-500/40',
                    desc: 'Create solutions, code, diagrams, visualizations, scripts — multi-modal outputs'
                  },
                  {
                    phase: '3. VERIFY',
                    icon: '✓',
                    color: 'from-green-600/20 to-green-800/20 border-green-500/40',
                    desc: 'Self-check correctness, virtual testing, fact-checking, confidence scoring'
                  },
                  {
                    phase: '4. SIMULATE',
                    icon: '🔄',
                    color: 'from-yellow-600/20 to-yellow-800/20 border-yellow-500/40',
                    desc: 'Trace code execution, predict outcomes, test edge cases, generate examples'
                  },
                  {
                    phase: '5. BUILD_MODULE',
                    icon: '🛠️',
                    color: 'from-orange-600/20 to-orange-800/20 border-orange-500/40',
                    desc: 'Auto-generate helper tools/modules when needed, store for future reuse'
                  },
                  {
                    phase: '6. SUMMARIZE',
                    icon: '📝',
                    color: 'from-purple-600/20 to-purple-800/20 border-purple-500/40',
                    desc: 'Provide verified answer, diagrams, confidence level, key takeaways, assumptions'
                  },
                  {
                    phase: '7. REFINE',
                    icon: '🔧',
                    color: 'from-pink-600/20 to-pink-800/20 border-pink-500/40',
                    desc: 'Clarify on follow-ups, expand topics, correct misunderstandings, iterate'
                  },
                ].map(({ phase, icon, color, desc }) => (
                  <div key={phase} className={`bg-gradient-to-r ${color} rounded-lg border p-3`}>
                    <div className="flex items-start gap-2">
                      <span className="text-xl flex-shrink-0">{icon}</span>
                      <div>
                        <p className="text-sm font-bold text-white">{phase}</p>
                        <p className="text-xs text-gray-300 mt-0.5">{desc}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Confidence Levels */}
              <div className="bg-gray-800/40 rounded-xl border border-gray-700/50 p-4">
                <p className="text-xs font-bold text-gray-300 mb-3 uppercase tracking-wider">Confidence Scoring</p>
                <div className="space-y-2">
                  {[
                    { level: 'HIGH (95-100%)', color: 'text-green-400', desc: 'Verified facts, tested code, established knowledge' },
                    { level: 'MEDIUM (70-94%)', color: 'text-yellow-400', desc: 'Likely accurate, not independently verified' },
                    { level: 'LOW (<70%)', color: 'text-red-400', desc: 'Uncertain, requires user validation' },
                  ].map(({ level, color, desc }) => (
                    <div key={level} className="flex items-start gap-2">
                      <CheckCircle className={`w-4 h-4 ${color} flex-shrink-0 mt-0.5`} />
                      <div>
                        <p className={`text-xs font-bold ${color}`}>{level}</p>
                        <p className="text-[10px] text-gray-400">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Auto Triggers */}
              <div className="bg-gray-800/40 rounded-xl border border-gray-700/50 p-4">
                <p className="text-xs font-bold text-gray-300 mb-3 uppercase tracking-wider">Auto-Triggers</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { trigger: 'Code Generation', when: '"How do I..." questions', icon: '💻' },
                    { trigger: 'Diagram Creation', when: 'System architecture', icon: '📊' },
                    { trigger: 'Simulation', when: 'Algorithm demos', icon: '🔄' },
                    { trigger: 'Module Building', when: 'Specialized tools', icon: '🛠️' },
                  ].map(({ trigger, when, icon }) => (
                    <div key={trigger} className="bg-gray-900/40 rounded-lg p-2">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-sm">{icon}</span>
                        <p className="text-xs font-bold text-white">{trigger}</p>
                      </div>
                      <p className="text-[10px] text-gray-400">{when}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Examples */}
              <div className="bg-gray-800/40 rounded-xl border border-gray-700/50 p-4">
                <p className="text-xs font-bold text-gray-300 mb-3 uppercase tracking-wider">Try These Examples</p>
                <div className="space-y-1.5">
                  {[
                    'How does async/await work in JavaScript?',
                    'Build a REST API for a blog platform',
                    'Why is my React component re-rendering?',
                    'Parse CSV and create charts',
                    'Explain quantum entanglement with diagrams',
                    'Design a microservices architecture',
                  ].map((example, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setInput(example);
                        setActiveTab('chat');
                      }}
                      className="w-full text-left text-xs text-gray-300 hover:text-purple-300 bg-gray-900/40 hover:bg-gray-900/60 rounded-lg p-2 transition-all border border-gray-700/40 hover:border-purple-500/40"
                    >
                      💬 {example}
                    </button>
                  ))}
                </div>
              </div>

              {/* Full Documentation */}
              <div className="bg-gradient-to-br from-indigo-900/30 to-purple-900/30 rounded-xl border border-indigo-500/40 p-4">
                <div className="flex items-start gap-2">
                  <BookOpen className="w-5 h-5 text-indigo-300 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-white mb-1">Full Documentation</p>
                    <p className="text-xs text-gray-300 mb-2">
                      Learn about output formats, self-extension, multi-modal intelligence, and advanced features.
                    </p>
                    <p className="text-[10px] text-indigo-300 font-mono">
                      📄 /MEGA_BRAIN_PROTOCOL.md
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Models Tab ────────────────────────────────────────────────────── */}
          {activeTab === 'models' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <Settings className="w-5 h-5 text-purple-400" />
                <h3 className="text-white font-bold">AI Model Router</h3>
              </div>
              <p className="text-gray-500 text-xs mb-3">The AI router selects the best model for each query automatically. Or force a specific model below.</p>

              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: undefined, label: '🎯 Auto Router', desc: 'Routes to best model per query type', color: 'border-purple-500/40 bg-purple-900/20' },
                  { key: 'gpt4o', label: '🤖 GPT-4o', desc: 'Code, debugging & complex reasoning', color: 'border-emerald-500/40 bg-emerald-900/20' },
                  { key: 'gpt4mini', label: '⚡ GPT-4o Mini', desc: 'Fast, accurate conversational queries', color: 'border-indigo-500/40 bg-indigo-900/20' },
                  { key: 'claude', label: '🔮 Claude 3.5', desc: 'Writing, long docs & nuanced analysis', color: 'border-orange-500/40 bg-orange-900/20' },
                  { key: 'gemini', label: '💎 Gemini 2.0', desc: 'Multimodal, images & visual reasoning', color: 'border-blue-500/40 bg-blue-900/20' },
                  { key: 'deepseek', label: '🧠 DeepSeek R1', desc: 'Deep math, logic & multi-step proofs', color: 'border-violet-500/40 bg-violet-900/20' },
                  { key: 'llama', label: '🦙 Llama 3.3 70B', desc: 'Open-source powerhouse, free tier', color: 'border-amber-500/40 bg-amber-900/20' },
                ].map(({ key, label, desc, color }) => (
                  <button key={label}
                    onClick={() => setForcedModel(key)}
                    className={`p-3 rounded-xl border text-left transition-all ${color} ${forcedModel === key ? 'ring-2 ring-white/30 scale-[1.02]' : 'opacity-70 hover:opacity-100'
                      }`}>
                    <p className="text-sm font-bold text-white">{label}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{desc}</p>
                    {forcedModel === key && <p className="text-[9px] text-white mt-1">✓ Active</p>}
                  </button>
                ))}
              </div>

              <div className="mt-2 p-3 bg-gray-800/30 rounded-xl border border-gray-700/40">
                <p className="text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-wider">Auto Router Rules</p>
                <div className="space-y-1.5 text-[10px] text-gray-500">
                  {[
                    { trigger: 'Math/proofs/algorithms', model: '🧠 DeepSeek R1', color: 'text-violet-400' },
                    { trigger: 'Code/debug/TypeScript/React', model: '🤖 GPT-4o', color: 'text-emerald-400' },
                    { trigger: 'Writing/email/essays', model: '🔮 Claude 3.5', color: 'text-orange-400' },
                    { trigger: 'Science/academic papers', model: '🤖 GPT-4o', color: 'text-emerald-400' },
                    { trigger: 'Images/visual/UI/UX', model: '💎 Gemini 2.0', color: 'text-blue-400' },
                    { trigger: 'Long docs (>4000 chars)', model: '🔮 Claude 3.5', color: 'text-orange-400' },
                    { trigger: 'Short / conversational', model: '⚡ GPT-4o Mini', color: 'text-indigo-400' },
                  ].map(({ trigger, model, color }, i) => (
                    <div key={i} className="flex items-center justify-between gap-2">
                      <span className="truncate">{trigger}</span>
                      <span className={`font-medium whitespace-nowrap ${color}`}>{model}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-2 p-3 bg-gray-800/40 rounded-xl border border-gray-700/50">
                <p className="text-xs font-bold text-gray-300 mb-2">Current Settings</p>
                <div className="space-y-1 text-[10px] text-gray-400">
                  <div className="flex justify-between"><span>Research Agents</span><span className={runResearch ? 'text-green-400' : 'text-gray-600'}>{runResearch ? '✓ 7 agents active' : '✗ disabled'}</span></div>
                  <div className="flex justify-between"><span>Critic AI Review</span><span className={runCritic ? 'text-orange-400' : 'text-gray-600'}>{runCritic ? '✓ active' : '✗ disabled'}</span></div>
                  <div className="flex justify-between"><span>Teaching Mode</span><span className="text-purple-300 capitalize">{teachingMode}</span></div>
                  <div className="flex justify-between"><span>Model</span><span className="text-blue-300">{forcedModel || 'Auto Router'}</span></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── RIGHT SIDE: Chat Area ──────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden min-h-0 max-h-full relative">
        {activeTab === 'chat' && (
          <div className="flex flex-col flex-1 min-h-0 max-h-full overflow-hidden">
            <div
              ref={messagesScrollRef}
              className="flex-1 overflow-y-auto min-h-0 max-h-full p-4 pb-4 space-y-3 scroll-smooth"
              style={{ overscrollBehavior: 'contain' }}
              onScroll={(e) => {
                const el = e.currentTarget;
                const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
                wasAtBottomRef.current = atBottom;
                setShowScrollBtn(!atBottom);
              }}
            >
              {/* Welcome Message */}
              {chatMessages.length === 0 && !isThinking && (
                <div className="text-center py-12">
                  <Brain className="w-16 h-16 mx-auto mb-4 text-purple-500 animate-pulse" />
                  <h3 className="text-xl font-bold text-white mb-2">Welcome to Genius AI</h3>
                  <p className="text-gray-400 mb-6">Ultra-Builder Mode · 12-Agent Brain · Research Engine</p>
                  <div className="grid grid-cols-1 gap-2 max-w-md mx-auto">
                    {[
                      'How does async/await work in JavaScript?',
                      'Fix my React component that won\'t render',
                      'Explain quantum computing with examples',
                      'Build a REST API for a blog platform'
                    ].map((example, i) => (
                      <button
                        key={i}
                        onClick={() => { setInput(example); setTimeout(() => inputRef.current?.focus(), 100); }}
                        className="text-left text-sm text-gray-300 hover:text-purple-300 bg-gray-800/40 hover:bg-gray-800/60 rounded-lg p-3 transition-all border border-gray-700/40 hover:border-purple-500/40"
                      >
                        💬 {example}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Chat Messages */}
              {chatMessages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-xl p-4 shadow-lg ${msg.role === 'user'
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                      : 'bg-gray-800/80 border border-purple-500/20'
                    }`}>
                    {/* User Message */}
                    {msg.role === 'user' && (
                      <div>
                        {msg.imageAttachment && (
                          <img src={msg.imageAttachment} alt="Uploaded" className="rounded-lg mb-2 max-w-xs" />
                        )}
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    )}

                    {/* Assistant Message */}
                    {msg.role === 'assistant' && (
                      <div className="relative">
                        {/* Copy Button - Sticky Top Right Corner */}
                        <div className="sticky top-2 float-right -mr-2 -mt-2 z-20 ml-2">
                          <button
                            onClick={() => {
                              copyToClipboard(msg.content);
                              const btn = document.activeElement as HTMLButtonElement;
                              if (btn) {
                                const originalHTML = btn.innerHTML;
                                btn.innerHTML = '<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>';
                                setTimeout(() => { btn.innerHTML = originalHTML; }, 2000);
                              }
                            }}
                            className="bg-purple-600 hover:bg-purple-700 text-white p-2 rounded-full shadow-lg transition-all hover:scale-110"
                            title="Copy response"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Model Badge & Confidence */}
                        <div className="flex items-center gap-2 mb-3 flex-wrap">
                          {msg.model && <ModelBadge model={msg.model} />}
                          {msg.confidence !== undefined && (
                            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${msg.confidence >= 0.95 ? 'bg-green-900/40 border-green-700/40 text-green-400' :
                                msg.confidence >= 0.7 ? 'bg-yellow-900/40 border-yellow-700/40 text-yellow-400' :
                                  'bg-red-900/40 border-red-700/40 text-red-400'
                              }`}>
                              {(msg.confidence * 100).toFixed(0)}% confidence
                            </span>
                          )}
                          {msg.criticResult && <CriticBadge result={msg.criticResult} />}
                          {msg.isLocal && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-900/40 border border-blue-700/40 text-blue-400 font-medium">
                              ⚡ Local Pattern Match
                            </span>
                          )}
                        </div>

                        {/* Sub-questions */}
                        {msg.subQuestions && msg.subQuestions.length > 0 && (
                          <SubQuestionsPanel questions={msg.subQuestions} />
                        )}

                        {/* Main Content */}
                        <div className="prose prose-invert prose-sm max-w-none">
                          {renderContent(msg.content)}
                        </div>

                        {/* Sources */}
                        {msg.sources && msg.sources.length > 0 && (
                          <SourcesPanel sources={msg.sources} />
                        )}

                        {/* Reasoning Toggle */}
                        {msg.reasoning && (
                          <div className="mt-3">
                            <button
                              onClick={() => setShowReasoningId(showReasoningId === msg.id ? null : msg.id)}
                              className="flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 transition-colors"
                            >
                              <Brain className="w-3 h-3" />
                              {msg.reasoning.steps.length} reasoning steps
                              {showReasoningId === msg.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </button>
                            {showReasoningId === msg.id && (
                              <div className="mt-2 space-y-2 pl-3 border-l-2 border-purple-500/30">
                                {msg.reasoning.steps.map((step, i) => (
                                  <div key={i} className="text-xs">
                                    <p className="font-semibold text-purple-300">{step.thought}</p>
                                    <p className="text-gray-400">{step.analysis}</p>
                                  </div>
                                ))}
                                <div className="mt-2 pt-2 border-t border-gray-700">
                                  <p className="text-xs font-semibold text-green-400">Conclusion</p>
                                  <p className="text-xs text-gray-300">{msg.reasoning.conclusion}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Feedback Buttons */}
                        <div className="flex items-center gap-2 mt-3 pt-2 border-t border-gray-700/50">
                          <button
                            onClick={() => handleFeedback(msg.id, 'up')}
                            className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-colors ${msg.feedback === 'up'
                                ? 'bg-green-900/40 text-green-400'
                                : 'bg-gray-700/40 text-gray-400 hover:bg-gray-700 hover:text-green-400'
                              }`}
                          >
                            <ThumbsUp className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleFeedback(msg.id, 'down')}
                            className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-colors ${msg.feedback === 'down'
                                ? 'bg-red-900/40 text-red-400'
                                : 'bg-gray-700/40 text-gray-400 hover:bg-gray-700 hover:text-red-400'
                              }`}
                          >
                            <ThumbsDown className="w-3 h-3" />
                          </button>
                          {msg.feedback === 'down' && (
                            <button
                              onClick={() => handleCorrection(msg.id)}
                              className="text-xs text-orange-400 hover:text-orange-300 ml-2"
                            >
                              What was wrong?
                            </button>
                          )}
                          <div className="flex-1" />
                          <CopyButton text={msg.content} />
                        </div>

                        {/* Agent Activity */}
                        {msg.agents && msg.agents.length > 0 && (
                          <AgentActivityPanel agents={msg.agents} isRunning={false} />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Thinking Indicator */}
              {isThinking && (
                <ThinkingIndicator
                  currentReasoning={currentReasoning}
                  agentStatuses={agentStatuses}
                  selectedModel={activeModel}
                  pipelineStep={pipelineStep}
                  startTime={thinkingStartTime.current}
                />
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Scroll to Bottom Button */}
            {showScrollBtn && (
              <button
                onClick={() => scrollToBottom('smooth')}
                className="absolute bottom-24 right-8 bg-purple-600 hover:bg-purple-700 text-white p-2 rounded-full shadow-lg transition-all z-10"
              >
                <ChevronDown className="w-5 h-5" />
              </button>
            )}

            {/* Input Area */}
            <div className="flex-shrink-0 border-t border-purple-500/30 bg-gray-900/80 p-4">
              {/* Image Attachment Preview */}
              {imageAttachment && (
                <div className="mb-2 relative inline-block">
                  <img src={imageAttachment} alt="Attachment" className="max-w-xs rounded-lg border border-purple-500/30" />
                  <button
                    onClick={() => setImageAttachment(null)}
                    className="absolute -top-2 -right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-1"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}

              {/* Input Controls */}
              <div className="flex items-end gap-2">
                <div className="flex-1 relative">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={isThinking ? "AI is thinking..." : "Ask anything... (Shift+Enter for new line)"}
                    disabled={isThinking}
                    rows={3}
                    className="w-full bg-gray-800 text-white border border-purple-500/30 rounded-xl px-4 py-3 pr-20 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/50 placeholder-gray-500 text-sm"
                  />
                  <div className="absolute bottom-3 right-3 flex items-center gap-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isThinking}
                      className="text-gray-400 hover:text-purple-400 transition-colors disabled:opacity-50"
                      title="Attach image"
                    >
                      <ImageIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={toggleVoice}
                      disabled={isThinking}
                      className={`transition-colors disabled:opacity-50 ${isListening ? 'text-red-400 animate-pulse' : 'text-gray-400 hover:text-purple-400'
                        }`}
                      title="Voice input"
                    >
                      {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isThinking}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-700 disabled:to-gray-700 text-white px-6 py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-semibold"
                >
                  <Send className="w-4 h-4" />
                  Send
                </button>
              </div>

              {/* Quick Settings */}
              <div className="flex items-center gap-4 mt-3 text-xs">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={runResearch}
                    onChange={(e) => setRunResearch(e.target.checked)}
                    className="rounded border-gray-600 bg-gray-700 text-purple-600 focus:ring-purple-500/50"
                  />
                  <Search className="w-3 h-3 text-gray-400" />
                  <span className="text-gray-400">Research Agents</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={runCritic}
                    onChange={(e) => setRunCritic(e.target.checked)}
                    className="rounded border-gray-600 bg-gray-700 text-orange-600 focus:ring-orange-500/50"
                  />
                  <Shield className="w-3 h-3 text-gray-400" />
                  <span className="text-gray-400">Critic AI</span>
                </label>
                <div className="flex-1" />
                <button
                  onClick={() => setActiveTab('models')}
                  className="text-gray-400 hover:text-purple-400 transition-colors flex items-center gap-1"
                >
                  <Settings className="w-3 h-3" />
                  <span>{forcedModel ? 'Model: ' + forcedModel : 'Auto Router'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
