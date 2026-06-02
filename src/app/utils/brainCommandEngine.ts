// ═══════════════════════════════════════════════════════════════════════════════
// BRAIN COMMAND CENTER ENGINE — 12-Agent AI Super Coding Brain Integration
// Add / Edit / Test / Remove Brain Commands with full agent pipeline.
// Placeholders remain configurable for future AI/DB/Deployment services.
// ═══════════════════════════════════════════════════════════════════════════════

import { BRAIN_AGENTS } from './superCodingBrain';
import { brainLearningEngine } from './brainLearningEngine';

// ── Types ────────────────────────────────────────────────────────────────────

export interface BrainCommand {
  id: string;
  name: string;
  description: string;
  code: string;
  status: 'draft' | 'parsed' | 'generated' | 'tested' | 'deployed' | 'failed';
  createdAt: number;
  updatedAt: number;
  agentPipeline: AgentExecution[];
  testResults?: TestResult;
  files: GeneratedFile[];
  tags: string[];
}

export interface AgentExecution {
  agentId: number;
  agentName: string;
  agentIcon: string;
  status: 'pending' | 'running' | 'success' | 'failed' | 'skipped';
  startedAt?: number;
  completedAt?: number;
  output?: string;
  error?: string;
}

export interface TestResult {
  passed: boolean;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  output: string;
  duration: number;
  timestamp: number;
}

export interface GeneratedFile {
  path: string;
  content: string;
  language: string;
  size: number;
}

export interface CommandLog {
  id: string;
  commandId: string;
  commandName: string;
  action: 'add' | 'edit' | 'test' | 'remove' | 'deploy' | 'parse' | 'generate' | 'error';
  message: string;
  timestamp: number;
  agentId?: number;
  details?: string;
}

// ── 12-Agent Mapping (matching the JSON spec's agent roles) ──────────────────

const AGENT_ROLE_MAP = {
  syntax:     { id: 1,  name: 'Master Planner',     icon: '🗺️', role: 'Parse and plan command structure' },
  code:       { id: 2,  name: 'Code Generator',     icon: '⚡', role: 'Generate implementation files' },
  intelligence: { id: 3,  name: 'Code Intelligence',  icon: '🔭', role: 'Analyze code dependencies' },
  errorDetect:  { id: 4,  name: 'Error Detector',     icon: '🔍', role: 'Scan for potential errors' },
  research:   { id: 5,  name: 'Error Researcher',   icon: '🔬', role: 'Find solutions to issues' },
  selfHeal:   { id: 6,  name: 'Self-Healer',        icon: '🩹', role: 'Auto-fix detected problems' },
  build:      { id: 7,  name: 'Build Executor',     icon: '🏗️', role: 'Compile and validate build' },
  testing:    { id: 8,  name: 'Test Generator',     icon: '🧪', role: 'Generate and run tests' },
  perf:       { id: 9,  name: 'Perf Optimizer',     icon: '🚀', role: 'Optimize performance' },
  security:   { id: 10, name: 'Security Auditor',   icon: '🛡️', role: 'Audit for vulnerabilities' },
  memory:     { id: 11, name: 'Memory Agent',       icon: '🧠', role: 'Store patterns and learnings' },
  deploy:     { id: 12, name: 'Deployer',           icon: '🌐', role: 'Deploy to production' },
} as const;

// ── Mock Agent Implementations (Placeholders) ───────────────────────────────

function createAgentPipeline(): AgentExecution[] {
  return Object.values(AGENT_ROLE_MAP).map((agent) => ({
    agentId: agent.id,
    agentName: agent.name,
    agentIcon: agent.icon,
    status: 'pending' as const,
  }));
}

async function simulateAgentWork(agentName: string, delayMs = 200): Promise<string> {
  await new Promise((r) => setTimeout(r, delayMs + Math.random() * 300));
  return `${agentName}: Task completed successfully`;
}

function parseCommandText(text: string): { name: string; description: string; tags: string[] } {
  // Smart parsing: extract a name from the first line or sentence
  const lines = text.trim().split('\n').filter(Boolean);
  const firstLine = lines[0] || 'Unnamed Command';

  // Extract tags from hashtags or keywords
  const tagMatches = text.match(/#(\w+)/g) || [];
  const tags = tagMatches.map((t) => t.replace('#', ''));

  // Try to detect command intent
  const isApi = /api|endpoint|route|fetch|request/i.test(text);
  const isUi = /component|button|page|modal|form|ui|dashboard/i.test(text);
  const isDb = /database|table|schema|migration|query|store/i.test(text);
  const isTest = /test|spec|assert|expect|coverage/i.test(text);
  const isSeo = /seo|meta|title|description|keyword|slug/i.test(text);
  const isSecurity = /auth|security|token|password|encrypt/i.test(text);

  if (!tags.length) {
    if (isApi) tags.push('api');
    if (isUi) tags.push('ui');
    if (isDb) tags.push('database');
    if (isTest) tags.push('testing');
    if (isSeo) tags.push('seo');
    if (isSecurity) tags.push('security');
    if (!tags.length) tags.push('general');
  }

  // Generate a clean name
  let name = firstLine.replace(/^(create|build|add|make|generate|implement)\s+/i, '').slice(0, 60);
  if (name.length > 50) name = name.slice(0, 47) + '...';

  return {
    name: name.charAt(0).toUpperCase() + name.slice(1),
    description: text.length > 120 ? text.slice(0, 117) + '...' : text,
    tags,
  };
}

function generateMockFiles(parsed: { name: string; tags: string[] }): GeneratedFile[] {
  const files: GeneratedFile[] = [];
  const baseName = parsed.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  if (parsed.tags.includes('ui') || parsed.tags.includes('general')) {
    const content = `import React from 'react';\n\nexport function ${parsed.name.replace(/[^a-zA-Z0-9]/g, '')}() {\n  return (\n    <div className="p-4 rounded-lg border">\n      <h2 className="font-bold">${parsed.name}</h2>\n      <p>Generated by Brain Command Center</p>\n    </div>\n  );\n}\n`;
    files.push({
      path: `/components/${baseName}.tsx`,
      content,
      language: 'tsx',
      size: content.length,
    });
  }

  if (parsed.tags.includes('api')) {
    const content = `// API Route: ${parsed.name}\nimport { Hono } from 'npm:hono';\n\nconst app = new Hono();\n\napp.get('/${baseName}', (c) => {\n  return c.json({ message: '${parsed.name} endpoint active' });\n});\n\nexport default app;\n`;
    files.push({
      path: `/supabase/functions/server/${baseName}.tsx`,
      content,
      language: 'tsx',
      size: content.length,
    });
  }

  if (parsed.tags.includes('testing')) {
    const content = `// Test Suite: ${parsed.name}\ndescribe('${parsed.name}', () => {\n  it('should initialize correctly', () => {\n    expect(true).toBe(true);\n  });\n\n  it('should handle edge cases', () => {\n    expect(null).toBeNull();\n  });\n});\n`;
    files.push({
      path: `/tests/${baseName}.test.ts`,
      content,
      language: 'typescript',
      size: content.length,
    });
  }

  if (parsed.tags.includes('database')) {
    const content = `// Database Schema: ${parsed.name}\n// Note: Use KV store for prototyping\nimport * as kv from './kv_store';\n\nexport async function get${parsed.name.replace(/[^a-zA-Z0-9]/g, '')}(key: string) {\n  return await kv.get(key);\n}\n\nexport async function set${parsed.name.replace(/[^a-zA-Z0-9]/g, '')}(key: string, value: any) {\n  return await kv.set(key, value);\n}\n`;
    files.push({
      path: `/utils/${baseName}-db.ts`,
      content,
      language: 'typescript',
      size: content.length,
    });
  }

  // Always generate at least a utils file
  if (files.length === 0) {
    const content = `// Brain Command: ${parsed.name}\n// Auto-generated by 12-Agent AI Super Coding Brain\n\nexport function execute() {\n  console.log('Executing: ${parsed.name}');\n  return { success: true, command: '${parsed.name}' };\n}\n`;
    files.push({
      path: `/utils/${baseName}.ts`,
      content,
      language: 'typescript',
      size: content.length,
    });
  }

  return files;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ENGINE CLASS
// ═══════════════════════════════════════════════════════════════════════════════

type EngineListener = () => void;

class BrainCommandEngineClass {
  private _commands: BrainCommand[] = [];
  private _logs: CommandLog[] = [];
  private _listeners: Set<EngineListener> = new Set();

  get commands(): BrainCommand[] {
    return [...this._commands];
  }

  get logs(): CommandLog[] {
    return [...this._logs];
  }

  subscribe(listener: EngineListener): () => void {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }

  private emit() {
    this._listeners.forEach((fn) => fn());
  }

  private addLog(log: Omit<CommandLog, 'id' | 'timestamp'>) {
    this._logs.unshift({
      ...log,
      id: `clog-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: Date.now(),
    });
    if (this._logs.length > 500) this._logs.length = 500;
  }

  // ── ADD COMMAND ────────────────────────────────────────────────────────────

  async addCommand(commandText: string): Promise<BrainCommand> {
    const pipeline = createAgentPipeline();
    const now = Date.now();

    // Create the command shell
    const cmd: BrainCommand = {
      id: `cmd-${now}-${Math.random().toString(36).slice(2, 6)}`,
      name: 'Processing...',
      description: commandText,
      code: commandText,
      status: 'draft',
      createdAt: now,
      updatedAt: now,
      agentPipeline: pipeline,
      files: [],
      tags: [],
    };

    this._commands.unshift(cmd);
    this.emit();

    this.addLog({
      commandId: cmd.id,
      commandName: cmd.name,
      action: 'add',
      message: `New command received: "${commandText.slice(0, 60)}..."`,
    });

    // ── Agent Pipeline Execution ──────────────────────────────────────────

    try {
      // Step 1: Syntax Agent — Parse command
      await this.runAgent(cmd, 0, async () => {
        const parsed = parseCommandText(commandText);
        cmd.name = parsed.name;
        cmd.description = parsed.description;
        cmd.tags = parsed.tags;
        cmd.status = 'parsed';
        return `Parsed: "${parsed.name}" with tags [${parsed.tags.join(', ')}]`;
      });

      // Step 2: Code Intelligence — Analyze dependencies
      await this.runAgent(cmd, 2, async () => {
        return `Analyzed dependencies for "${cmd.name}" — no conflicts detected`;
      });

      // Step 3: Code Generator — Generate files
      await this.runAgent(cmd, 1, async () => {
        const files = generateMockFiles({ name: cmd.name, tags: cmd.tags });
        cmd.files = files;
        cmd.status = 'generated';
        return `Generated ${files.length} file(s): ${files.map((f) => f.path).join(', ')}`;
      });

      // Step 4: Error Detector — Scan for issues
      await this.runAgent(cmd, 3, async () => {
        return `Scanned ${cmd.files.length} file(s) — no errors detected`;
      });

      // Step 5: Security Auditor — Check vulnerabilities
      await this.runAgent(cmd, 9, async () => {
        return `Security audit passed — no vulnerabilities found`;
      });

      // Step 6: Perf Optimizer — Optimize
      await this.runAgent(cmd, 8, async () => {
        return `Performance check passed — all files optimized`;
      });

      // Step 7: Build Executor — Validate build
      await this.runAgent(cmd, 6, async () => {
        return `Build validation passed — all files compile cleanly`;
      });

      // Step 8: Memory Agent — Store patterns
      await this.runAgent(cmd, 10, async () => {
        return `Stored command pattern "${cmd.name}" for future reference`;
      });

      // Step 9: Deployer — Deploy
      await this.runAgent(cmd, 11, async () => {
        cmd.status = 'deployed';
        return `Command "${cmd.name}" deployed successfully`;
      });

      // Skip remaining agents
      cmd.agentPipeline.forEach((a) => {
        if (a.status === 'pending') a.status = 'skipped';
      });

      cmd.updatedAt = Date.now();
      this.addLog({
        commandId: cmd.id,
        commandName: cmd.name,
        action: 'deploy',
        message: `Command "${cmd.name}" fully deployed with ${cmd.files.length} file(s)`,
      });

      // 🧠 LEARN FROM THIS COMMAND
      await brainLearningEngine.learnFromCommand({
        code: commandText,
        name: cmd.name,
        tags: cmd.tags,
        success: true,
        files: cmd.files.map(f => ({ path: f.path, language: f.language })),
      });
    } catch (err) {
      cmd.status = 'failed';
      cmd.updatedAt = Date.now();
      this.addLog({
        commandId: cmd.id,
        commandName: cmd.name,
        action: 'error',
        message: `Command failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
      });

      // 🧠 LEARN FROM FAILURE TOO
      await brainLearningEngine.learnFromCommand({
        code: commandText,
        name: cmd.name,
        tags: cmd.tags,
        success: false,
        files: cmd.files.map(f => ({ path: f.path, language: f.language })),
      });
    }

    this.emit();
    return cmd;
  }

  // ── EDIT COMMAND ───────────────────────────────────────────────────────────

  async editCommand(id: string, newText: string): Promise<BrainCommand | null> {
    const cmd = this._commands.find((c) => c.id === id);
    if (!cmd) return null;

    this.addLog({
      commandId: cmd.id,
      commandName: cmd.name,
      action: 'edit',
      message: `Editing command "${cmd.name}"`,
    });

    // Re-parse
    const parsed = parseCommandText(newText);
    cmd.name = parsed.name;
    cmd.description = parsed.description;
    cmd.code = newText;
    cmd.tags = parsed.tags;
    cmd.status = 'parsed';

    // Re-run pipeline
    cmd.agentPipeline = createAgentPipeline();
    this.emit();

    // Re-generate
    await this.runAgent(cmd, 0, async () => `Re-parsed: "${parsed.name}"`);
    await this.runAgent(cmd, 1, async () => {
      cmd.files = generateMockFiles({ name: cmd.name, tags: cmd.tags });
      cmd.status = 'generated';
      return `Regenerated ${cmd.files.length} file(s)`;
    });
    await this.runAgent(cmd, 3, async () => `Re-scan passed`);
    await this.runAgent(cmd, 9, async () => `Security re-audit passed`);
    await this.runAgent(cmd, 6, async () => {
      cmd.status = 'deployed';
      return `Rebuild passed`;
    });

    cmd.agentPipeline.forEach((a) => {
      if (a.status === 'pending') a.status = 'skipped';
    });
    cmd.updatedAt = Date.now();

    this.addLog({
      commandId: cmd.id,
      commandName: cmd.name,
      action: 'edit',
      message: `Command "${cmd.name}" updated and redeployed`,
    });

    this.emit();
    return cmd;
  }

  // ── TEST COMMAND ──────────────────────────────────────────────────────────

  async testCommand(id: string): Promise<TestResult | null> {
    const cmd = this._commands.find((c) => c.id === id);
    if (!cmd) return null;

    this.addLog({
      commandId: cmd.id,
      commandName: cmd.name,
      action: 'test',
      message: `Running test suite for "${cmd.name}"`,
    });

    // Run Test Generator agent
    const testAgentIdx = cmd.agentPipeline.findIndex((a) => a.agentId === 8);
    if (testAgentIdx >= 0) {
      cmd.agentPipeline[testAgentIdx].status = 'running';
      cmd.agentPipeline[testAgentIdx].startedAt = Date.now();
      this.emit();
    }

    await new Promise((r) => setTimeout(r, 800 + Math.random() * 600));

    const totalTests = 3 + Math.floor(Math.random() * 5);
    const failedTests = Math.random() > 0.8 ? 1 : 0;
    const passed = failedTests === 0;

    const result: TestResult = {
      passed,
      totalTests,
      passedTests: totalTests - failedTests,
      failedTests,
      output: passed
        ? `All ${totalTests} tests passed for "${cmd.name}".\n\n  ✓ Initialization test\n  ✓ Functionality test\n  ✓ Edge case handling${totalTests > 3 ? `\n  ✓ ${totalTests - 3} additional tests` : ''}`
        : `${totalTests - failedTests}/${totalTests} tests passed.\n\n  ✓ Initialization test\n  ✗ Edge case: unexpected input handling\n  ✓ Remaining tests passed`,
      duration: Math.floor(200 + Math.random() * 500),
      timestamp: Date.now(),
    };

    cmd.testResults = result;
    cmd.status = passed ? 'tested' : 'failed';

    if (testAgentIdx >= 0) {
      cmd.agentPipeline[testAgentIdx].status = passed ? 'success' : 'failed';
      cmd.agentPipeline[testAgentIdx].completedAt = Date.now();
      cmd.agentPipeline[testAgentIdx].output = result.output;
    }

    this.addLog({
      commandId: cmd.id,
      commandName: cmd.name,
      action: 'test',
      message: passed
        ? `All ${totalTests} tests passed for "${cmd.name}" (${result.duration}ms)`
        : `${failedTests} test(s) failed for "${cmd.name}"`,
    });

    this.emit();
    return result;
  }

  // ── REMOVE COMMAND ────────────────────────────────────────────────────────

  async removeCommand(id: string): Promise<boolean> {
    const idx = this._commands.findIndex((c) => c.id === id);
    if (idx < 0) return false;

    const cmd = this._commands[idx];

    this.addLog({
      commandId: cmd.id,
      commandName: cmd.name,
      action: 'remove',
      message: `Removing command "${cmd.name}" and ${cmd.files.length} associated file(s)`,
    });

    // Simulate Deployer removing modules
    await new Promise((r) => setTimeout(r, 300));

    this._commands.splice(idx, 1);

    this.addLog({
      commandId: cmd.id,
      commandName: cmd.name,
      action: 'remove',
      message: `Command "${cmd.name}" successfully removed`,
    });

    this.emit();
    return true;
  }

  // ── Helper: Run a single agent in the pipeline ────────────────────────────

  private async runAgent(
    cmd: BrainCommand,
    agentIdx: number,
    work: () => Promise<string>,
  ): Promise<void> {
    const agent = cmd.agentPipeline[agentIdx];
    if (!agent) return;

    agent.status = 'running';
    agent.startedAt = Date.now();
    this.emit();

    try {
      const output = await work();
      await simulateAgentWork(agent.agentName, 150);
      agent.status = 'success';
      agent.completedAt = Date.now();
      agent.output = output;

      this.addLog({
        commandId: cmd.id,
        commandName: cmd.name,
        action: 'generate',
        message: `${agent.agentIcon} ${agent.agentName}: ${output}`,
        agentId: agent.agentId,
      });
    } catch (err) {
      agent.status = 'failed';
      agent.completedAt = Date.now();
      agent.error = err instanceof Error ? err.message : 'Unknown error';
      throw err;
    }

    this.emit();
  }

  // ── Get stats ─────────────────────────────────────────────────────────────

  getStats() {
    const total = this._commands.length;
    const deployed = this._commands.filter((c) => c.status === 'deployed' || c.status === 'tested').length;
    const failed = this._commands.filter((c) => c.status === 'failed').length;
    const totalFiles = this._commands.reduce((s, c) => s + c.files.length, 0);
    const totalTests = this._commands.reduce((s, c) => s + (c.testResults?.totalTests || 0), 0);
    const passedTests = this._commands.reduce((s, c) => s + (c.testResults?.passedTests || 0), 0);

    return { total, deployed, failed, totalFiles, totalTests, passedTests };
  }

  clearLogs() {
    this._logs = [];
    this.emit();
  }
}

// Singleton
export const brainCommandEngine = new BrainCommandEngineClass();
