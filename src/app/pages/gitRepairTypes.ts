// ─── Shared Types for GitRepair ───────────────────────────────────────────────

export type Phase = 'connect' | 'upload' | 'scan' | 'repair' | 'test' | 'push' | 'localhost' | 'commit' | 'done';
export type ErrorSeverity = 'critical' | 'error' | 'warning' | 'info';
export type ErrorSource = 'typescript' | 'eslint' | 'runtime' | 'build' | 'dependency' | 'hydration' | 'api' | 'lint' | 'turbopack' | 'client-boundary' | 'server-only';
export type FixStatus = 'pending' | 'analyzing' | 'fixing' | 'testing' | 'fixed' | 'failed';

export interface RepoFile {
  path: string;
  type: 'component' | 'page' | 'api' | 'config' | 'test' | 'style' | 'util';
  size: number;
  hasErrors: boolean;
  errorCount: number;
  status: 'clean' | 'error' | 'fixed' | 'scanning';
  content?: string;
  sha?: string;
}

export interface DetectedError {
  id: string;
  source: ErrorSource;
  severity: ErrorSeverity;
  file: string;
  line: number;
  col?: number;
  message: string;
  code?: string;
  rootCause: string;
  suggestion: string;
  autoFixable: boolean;
  fixStatus: FixStatus;
  patch?: string;
  originalCode?: string;
  fixedCode?: string;
  fixTime?: number;
}

export interface CommitRecord {
  id: string;
  sha: string;
  message: string;
  filesChanged: number;
  timestamp: Date;
  status: 'success' | 'pending';
}

export interface TestResult {
  name: string;
  type: 'unit' | 'integration' | 'component' | 'e2e';
  status: 'pass' | 'fail' | 'skip' | 'running';
  duration: number;
  error?: string;
}

export interface FixMemoryEntry {
  errorPattern: string;
  fix: string;
  appliedCount: number;
  lastSeen: Date;
}

export interface LiveTestResult {
  route: string;
  label: string;
  status: 'pass' | 'fail' | 'running' | 'pending';
  duration: number;
  checks: { name: string; status: 'pass' | 'fail' | 'running'; detail?: string }[];
  iteration: number;
}

export interface BuildLogError {
  id: string;
  file: string;
  line: number;
  col: number;
  errorType: 'missing-export' | 'module-not-found' | 'syntax-error' | 'type-error' | 'unknown';
  message: string;
  importLine?: string;
  badExport?: string;
  suggestedExport?: string;
  modulePath?: string;
  fixedImportLine?: string;
  severity: ErrorSeverity;
  autoFixable: boolean;
  fixStatus: FixStatus;
}

export interface TurbopackInfo {
  enabled: boolean;
  mode: 'stable' | 'experimental' | 'cli-flag' | 'disabled' | 'unknown';
  version: string;
  incompatibilities: string[];
}

export interface AppTypeInfo {
  framework: 'nextjs' | 'react-vite' | 'react-cra' | 'vue' | 'nuxt' | 'svelte' | 'sveltekit' | 'remix' | 'astro' | 'expo' | 'angular' | 'unknown';
  frameworkLabel: string;
  buildTool: 'webpack' | 'vite' | 'turbopack' | 'rspack' | 'parcel' | 'unknown';
  language: 'typescript' | 'javascript' | 'mixed';
  packageManager: 'npm' | 'yarn' | 'pnpm' | 'bun' | 'unknown';
  version: string;
  cssFramework?: string;
  testFramework?: string;
  stateManagement?: string;
  runScript: string;
  buildScript: string;
  deployTarget?: string;
}

export interface DependencyIssue {
  name: string;
  current: string;
  latest: string;
  type: 'outdated-major' | 'outdated-minor' | 'peer-conflict' | 'missing-required' | 'deprecated';
  severity: 'critical' | 'warning' | 'info';
  description: string;
  autoFixable: boolean;
  fixCommand: string;
  compatible: boolean;
}

export interface DependencyReport {
  totalDeps: number;
  outdated: DependencyIssue[];
  missing: DependencyIssue[];
  conflicts: DependencyIssue[];
  allDeps: Record<string, string>;
  devDeps: Record<string, string>;
  installCommands: string[];
}

export interface TailwindMigrationFile {
  path: string;
  original: string;
  updated: string;
  description: string;
}

export interface TailwindMigration {
  detected: boolean;
  fromVersion: string;
  toVersion: string;
  isV3: boolean;
  buildIntegration: 'vite' | 'postcss' | 'nextjs' | 'unknown';
  cssFiles: TailwindMigrationFile[];
  configFiles: TailwindMigrationFile[];
  removedPackages: string[];
  addedPackages: Record<string, string>;
  updatedPackages: Record<string, { from: string; to: string }>;
  installCommands: string[];
  breakingChanges: string[];
  summary: string[];
}
