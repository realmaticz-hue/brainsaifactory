// ═══════════════════════════════════════════════════════════════════════════════
// SUPER BRAIN BUILDER — 50-Agent System Definitions
// 5 Departments • Phase-to-Agent Mapping • Orchestration Engine
// ═══════════════════════════════════════════════════════════════════════════════

export type AgentStatus = 'idle' | 'queued' | 'active' | 'done' | 'error';

export interface Agent {
  id: number;
  name: string;
  department: Department;
  status: AgentStatus;
  capability: string;
  progress?: number;
  detail?: string;
  startedAt?: number;
  completedAt?: number;
}

export type Department =
  | 'Product Design'
  | 'Engineering'
  | 'Quality & Security'
  | 'Infrastructure & Deployment'
  | 'Self-Healing & Optimization';

export const DEPARTMENT_COLORS: Record<Department, { bg: string; text: string; border: string; glow: string }> = {
  'Product Design':              { bg: 'bg-pink-950/40',   text: 'text-pink-400',    border: 'border-pink-800/50',    glow: 'shadow-pink-500/20' },
  'Engineering':                 { bg: 'bg-blue-950/40',   text: 'text-blue-400',    border: 'border-blue-800/50',    glow: 'shadow-blue-500/20' },
  'Quality & Security':          { bg: 'bg-amber-950/40',  text: 'text-amber-400',   border: 'border-amber-800/50',   glow: 'shadow-amber-500/20' },
  'Infrastructure & Deployment': { bg: 'bg-emerald-950/40', text: 'text-emerald-400', border: 'border-emerald-800/50', glow: 'shadow-emerald-500/20' },
  'Self-Healing & Optimization': { bg: 'bg-violet-950/40', text: 'text-violet-400',  border: 'border-violet-800/50',  glow: 'shadow-violet-500/20' },
};

export const DEPARTMENT_ICONS: Record<Department, string> = {
  'Product Design': '🎨',
  'Engineering': '⚙️',
  'Quality & Security': '🛡️',
  'Infrastructure & Deployment': '🚀',
  'Self-Healing & Optimization': '🧬',
};

export function createAllAgents(): Agent[] {
  return [
    // ── Product Design Department (1-10) ──
    { id: 1,  name: 'Product Architect',       department: 'Product Design', status: 'idle', capability: 'System architecture & feature planning' },
    { id: 2,  name: 'UX Designer',             department: 'Product Design', status: 'idle', capability: 'User experience & flow design' },
    { id: 3,  name: 'UI Component Generator',  department: 'Product Design', status: 'idle', capability: 'React component generation' },
    { id: 4,  name: 'Design System',           department: 'Product Design', status: 'idle', capability: 'Tailwind theme & token management' },
    { id: 5,  name: 'Accessibility',           department: 'Product Design', status: 'idle', capability: 'WCAG compliance & ARIA attributes' },
    { id: 6,  name: 'Branding & Marketing',    department: 'Product Design', status: 'idle', capability: 'Brand consistency & copy writing' },
    { id: 7,  name: 'Feature Prioritization',  department: 'Product Design', status: 'idle', capability: 'Feature ranking & scope analysis' },
    { id: 8,  name: 'Prototype Validator',      department: 'Product Design', status: 'idle', capability: 'Design validation & user testing' },
    { id: 9,  name: 'Storyboarding',           department: 'Product Design', status: 'idle', capability: 'User journey mapping' },
    { id: 10, name: 'User Research',            department: 'Product Design', status: 'idle', capability: 'Target audience analysis' },

    // ── Engineering Department (11-22) ──
    { id: 11, name: 'Frontend Engineer',        department: 'Engineering', status: 'idle', capability: 'React + TypeScript implementation' },
    { id: 12, name: 'Backend Engineer',         department: 'Engineering', status: 'idle', capability: 'API & server logic' },
    { id: 13, name: 'Database Architect',       department: 'Engineering', status: 'idle', capability: 'Schema design & data modeling' },
    { id: 14, name: 'API Integration',          department: 'Engineering', status: 'idle', capability: 'Third-party API connections' },
    { id: 15, name: 'Workflow Automation',       department: 'Engineering', status: 'idle', capability: 'Task pipelines & automation' },
    { id: 16, name: 'Realtime Systems',          department: 'Engineering', status: 'idle', capability: 'WebSocket & SSE streaming' },
    { id: 17, name: 'AI Feature Builder',        department: 'Engineering', status: 'idle', capability: 'AI/ML feature integration' },
    { id: 18, name: 'Mobile App',                department: 'Engineering', status: 'idle', capability: 'Responsive & PWA support' },
    { id: 19, name: 'SDK Builder',               department: 'Engineering', status: 'idle', capability: 'Package & dependency management' },
    { id: 20, name: 'CLI Tool Builder',           department: 'Engineering', status: 'idle', capability: 'CLI scaffolding & scripts' },
    { id: 21, name: 'Cloud Functions',            department: 'Engineering', status: 'idle', capability: 'Serverless function generation' },
    { id: 22, name: 'Testing',                    department: 'Engineering', status: 'idle', capability: 'Test suite generation' },

    // ── Quality & Security Department (23-32) ──
    { id: 23, name: 'Static Analysis',           department: 'Quality & Security', status: 'idle', capability: 'Code linting & type checking' },
    { id: 24, name: 'AI Logic Review',            department: 'Quality & Security', status: 'idle', capability: 'AI-powered code review' },
    { id: 25, name: 'Security Scanner',           department: 'Quality & Security', status: 'idle', capability: 'Vulnerability detection' },
    { id: 26, name: 'Unit Test Generator',        department: 'Quality & Security', status: 'idle', capability: 'Unit test creation' },
    { id: 27, name: 'Integration Test Generator', department: 'Quality & Security', status: 'idle', capability: 'Integration test creation' },
    { id: 28, name: 'E2E Test Runner',            department: 'Quality & Security', status: 'idle', capability: 'End-to-end validation' },
    { id: 29, name: 'Accessibility Audit',        department: 'Quality & Security', status: 'idle', capability: 'WCAG compliance scanning' },
    { id: 30, name: 'Code Coverage',              department: 'Quality & Security', status: 'idle', capability: 'Coverage analysis' },
    { id: 31, name: 'Load & Stress Test',         department: 'Quality & Security', status: 'idle', capability: 'Performance benchmarking' },
    { id: 32, name: 'Bug Fix',                    department: 'Quality & Security', status: 'idle', capability: 'Automated bug resolution' },

    // ── Infrastructure & Deployment Department (33-42) ──
    { id: 33, name: 'DevOps Architect',           department: 'Infrastructure & Deployment', status: 'idle', capability: 'CI/CD pipeline design' },
    { id: 34, name: 'Environment Manager',        department: 'Infrastructure & Deployment', status: 'idle', capability: 'Env config & secrets' },
    { id: 35, name: 'Performance Optimizer',      department: 'Infrastructure & Deployment', status: 'idle', capability: 'Bundle & runtime optimization' },
    { id: 36, name: 'Scaling',                    department: 'Infrastructure & Deployment', status: 'idle', capability: 'Auto-scaling configuration' },
    { id: 37, name: 'Container Manager',          department: 'Infrastructure & Deployment', status: 'idle', capability: 'Docker & container orchestration' },
    { id: 38, name: 'CI/CD Pipeline',             department: 'Infrastructure & Deployment', status: 'idle', capability: 'Build pipeline automation' },
    { id: 39, name: 'Cloud Provisioning',         department: 'Infrastructure & Deployment', status: 'idle', capability: 'Cloud resource management' },
    { id: 40, name: 'Rollback & Recovery',        department: 'Infrastructure & Deployment', status: 'idle', capability: 'Deployment rollback systems' },
    { id: 41, name: 'Logging & Telemetry',        department: 'Infrastructure & Deployment', status: 'idle', capability: 'Monitoring & observability' },
    { id: 42, name: 'Resource Optimizer',          department: 'Infrastructure & Deployment', status: 'idle', capability: 'Cost & resource optimization' },

    // ── Self-Healing & Optimization Department (43-50) ──
    { id: 43, name: 'Runtime Monitoring',         department: 'Self-Healing & Optimization', status: 'idle', capability: 'Live error detection' },
    { id: 44, name: 'Error Diagnosis',            department: 'Self-Healing & Optimization', status: 'idle', capability: 'Root cause analysis' },
    { id: 45, name: 'Self-Repair',                department: 'Self-Healing & Optimization', status: 'idle', capability: 'Autonomous code patching' },
    { id: 46, name: 'Auto-Refactor',              department: 'Self-Healing & Optimization', status: 'idle', capability: 'Code quality improvement' },
    { id: 47, name: 'Security Auto-Patch',        department: 'Self-Healing & Optimization', status: 'idle', capability: 'Security vulnerability patching' },
    { id: 48, name: 'AI Optimization',            department: 'Self-Healing & Optimization', status: 'idle', capability: 'AI model performance tuning' },
    { id: 49, name: 'Performance Auto-Tuning',    department: 'Self-Healing & Optimization', status: 'idle', capability: 'Runtime performance optimization' },
    { id: 50, name: 'Knowledge Graph Maintenance', department: 'Self-Healing & Optimization', status: 'idle', capability: 'Dependency graph updates' },
  ];
}

// ── Phase-to-Agent Mapping ──────────────────────────────────────────────────

export interface PhaseAgentMap {
  phaseId: number;
  phaseName: string;
  agentIds: number[];
  parallel: boolean;
}

export const PHASE_AGENT_MAP: PhaseAgentMap[] = [
  { phaseId: 1,  phaseName: 'Strategic Analysis',     agentIds: [1, 7, 9, 10],              parallel: true },
  { phaseId: 2,  phaseName: 'Architecture Design',    agentIds: [1, 2, 4, 11, 12, 13],      parallel: true },
  { phaseId: 3,  phaseName: 'Code Generation',        agentIds: [3, 11, 12, 14, 16, 17, 18, 21], parallel: true },
  { phaseId: 4,  phaseName: 'Dependency Sync',        agentIds: [19, 15, 20],                parallel: true },
  { phaseId: 5,  phaseName: 'Build Simulation',       agentIds: [22, 23, 26],                parallel: true },
  { phaseId: 6,  phaseName: 'Error Repair Loop',      agentIds: [32, 44, 45, 46],            parallel: false },
  { phaseId: 7,  phaseName: 'Project Memory',         agentIds: [50, 43],                    parallel: true },
  { phaseId: 8,  phaseName: 'Security & Performance', agentIds: [24, 25, 29, 31, 35, 47],    parallel: true },
  { phaseId: 9,  phaseName: 'Deployment Configs',     agentIds: [33, 34, 37, 38, 39],        parallel: true },
  { phaseId: 10, phaseName: 'Final Validation',       agentIds: [28, 30, 8],                 parallel: true },
  { phaseId: 11, phaseName: 'Output & Delivery',      agentIds: [36, 40, 41, 42, 6],         parallel: true },
];

export function getAgentsForPhase(phaseId: number): number[] {
  return PHASE_AGENT_MAP.find(m => m.phaseId === phaseId)?.agentIds || [];
}

export function getDepartments(): Department[] {
  return [
    'Product Design',
    'Engineering',
    'Quality & Security',
    'Infrastructure & Deployment',
    'Self-Healing & Optimization',
  ];
}

export function getAgentsByDepartment(agents: Agent[]): Record<Department, Agent[]> {
  const result: Record<Department, Agent[]> = {
    'Product Design': [],
    'Engineering': [],
    'Quality & Security': [],
    'Infrastructure & Deployment': [],
    'Self-Healing & Optimization': [],
  };
  for (const agent of agents) {
    result[agent.department].push(agent);
  }
  return result;
}
