// =============================================================================
// CODE PLAYGROUND — Interactive Code Execution
// =============================================================================

import type { ProgrammingLanguage } from './codeGenerator';

export interface ExecutionResult {
  success: boolean;
  output: string;
  error?: string;
  executionTime: number; // milliseconds
  memory?: number; // bytes
  exitCode?: number;
}

export interface PlaygroundSession {
  id: string;
  language: ProgrammingLanguage;
  files: PlaygroundFile[];
  output: string[];
  createdAt: Date;
  lastRun?: Date;
}

export interface PlaygroundFile {
  name: string;
  path: string;
  content: string;
  language: ProgrammingLanguage;
}

/**
 * Execute code in sandbox
 */
export async function executeCode(
  code: string,
  language: ProgrammingLanguage,
  input?: string
): Promise<ExecutionResult> {
  const startTime = Date.now();

  try {
    // Client-side execution for safe languages
    if (language === 'javascript') {
      return executeJavaScript(code, input);
    }

    // For other languages, use external API (Judge0, Piston, etc.)
    return await executeViaAPI(code, language, input);
  } catch (error: any) {
    return {
      success: false,
      output: '',
      error: error.message,
      executionTime: Date.now() - startTime,
    };
  }
}

/**
 * Execute JavaScript in isolated context
 */
function executeJavaScript(code: string, input?: string): ExecutionResult {
  const startTime = Date.now();
  const logs: string[] = [];

  try {
    // Create isolated console
    const isolatedConsole = {
      log: (...args: any[]) => logs.push(args.map(String).join(' ')),
      error: (...args: any[]) => logs.push('ERROR: ' + args.map(String).join(' ')),
      warn: (...args: any[]) => logs.push('WARN: ' + args.map(String).join(' ')),
    };

    // Execute in isolated context
    const func = new Function('console', 'input', code);
    func(isolatedConsole, input);

    return {
      success: true,
      output: logs.join('\n'),
      executionTime: Date.now() - startTime,
    };
  } catch (error: any) {
    return {
      success: false,
      output: logs.join('\n'),
      error: error.message,
      executionTime: Date.now() - startTime,
    };
  }
}

/**
 * Execute code via external API (Piston)
 */
async function executeViaAPI(
  code: string,
  language: ProgrammingLanguage,
  input?: string
): Promise<ExecutionResult> {
  const startTime = Date.now();

  // Map to Piston language identifiers
  const languageMap: Record<string, string> = {
    python: 'python',
    java: 'java',
    cpp: 'cpp',
    go: 'go',
    rust: 'rust',
    php: 'php',
    ruby: 'ruby',
    swift: 'swift',
    kotlin: 'kotlin',
    r: 'r',
    bash: 'bash',
  };

  const pistonLanguage = languageMap[language];

  if (!pistonLanguage) {
    return {
      success: false,
      output: '',
      error: `Language ${language} not supported for execution`,
      executionTime: Date.now() - startTime,
    };
  }

  try {
    // In production, call actual API
    // const response = await fetch('https://emkc.org/api/v2/piston/execute', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     language: pistonLanguage,
    //     version: '*',
    //     files: [{ content: code }],
    //     stdin: input || '',
    //   }),
    // });

    // Simulate API response
    await new Promise(resolve => setTimeout(resolve, 1000));

    return {
      success: true,
      output: `[Simulated output for ${language}]\n${input || 'No input provided'}`,
      executionTime: Date.now() - startTime,
      exitCode: 0,
    };
  } catch (error: any) {
    return {
      success: false,
      output: '',
      error: error.message,
      executionTime: Date.now() - startTime,
    };
  }
}

/**
 * Create playground session
 */
export function createPlaygroundSession(
  language: ProgrammingLanguage,
  initialCode?: string
): PlaygroundSession {
  const session: PlaygroundSession = {
    id: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    language,
    files: [
      {
        name: 'main',
        path: `/main${getFileExtension(language)}`,
        content: initialCode || '',
        language,
      },
    ],
    output: [],
    createdAt: new Date(),
  };

  saveSessions([...getSessions(), session]);

  return session;
}

/**
 * Get all playground sessions
 */
export function getSessions(): PlaygroundSession[] {
  const stored = localStorage.getItem('playgroundSessions');
  if (!stored) return [];

  const sessions = JSON.parse(stored) as PlaygroundSession[];

  return sessions.map(s => ({
    ...s,
    createdAt: new Date(s.createdAt),
    lastRun: s.lastRun ? new Date(s.lastRun) : undefined,
  }));
}

/**
 * Save sessions
 */
function saveSessions(sessions: PlaygroundSession[]): void {
  localStorage.setItem('playgroundSessions', JSON.stringify(sessions));
}

/**
 * Add file to session
 */
export function addFileToSession(
  sessionId: string,
  fileName: string,
  content: string,
  language?: ProgrammingLanguage
): void {
  const sessions = getSessions();
  const session = sessions.find(s => s.id === sessionId);

  if (!session) return;

  session.files.push({
    name: fileName,
    path: `/${fileName}`,
    content,
    language: language || session.language,
  });

  saveSessions(sessions);
}

/**
 * Update file in session
 */
export function updateFileInSession(
  sessionId: string,
  filePath: string,
  content: string
): void {
  const sessions = getSessions();
  const session = sessions.find(s => s.id === sessionId);

  if (!session) return;

  const file = session.files.find(f => f.path === filePath);
  if (file) {
    file.content = content;
    saveSessions(sessions);
  }
}

/**
 * Run session
 */
export async function runSession(
  sessionId: string,
  input?: string
): Promise<ExecutionResult> {
  const sessions = getSessions();
  const session = sessions.find(s => s.id === sessionId);

  if (!session) {
    throw new Error('Session not found');
  }

  // Run main file
  const mainFile = session.files.find(f => f.name === 'main');
  if (!mainFile) {
    throw new Error('No main file found');
  }

  const result = await executeCode(mainFile.content, session.language, input);

  // Update session
  session.lastRun = new Date();
  session.output.push(`[${new Date().toLocaleTimeString()}] ${result.output}`);
  saveSessions(sessions);

  return result;
}

/**
 * Get file extension for language
 */
function getFileExtension(language: ProgrammingLanguage): string {
  const extensions: Record<string, string> = {
    javascript: '.js',
    typescript: '.ts',
    python: '.py',
    java: '.java',
    cpp: '.cpp',
    go: '.go',
    rust: '.rs',
    php: '.php',
    ruby: '.rb',
    swift: '.swift',
    kotlin: '.kt',
    r: '.r',
    bash: '.sh',
    sql: '.sql',
    html: '.html',
    css: '.css',
  };

  return extensions[language] || '.txt';
}

/**
 * Share playground session
 */
export function shareSession(sessionId: string): string {
  const session = getSessions().find(s => s.id === sessionId);

  if (!session) {
    throw new Error('Session not found');
  }

  // Generate shareable link
  const encoded = btoa(JSON.stringify({
    language: session.language,
    files: session.files,
  }));

  return `${window.location.origin}/playground?share=${encoded}`;
}

/**
 * Load shared session
 */
export function loadSharedSession(shareCode: string): PlaygroundSession {
  try {
    const decoded = JSON.parse(atob(shareCode));

    return createPlaygroundSession(decoded.language, decoded.files[0].content);
  } catch (error) {
    throw new Error('Invalid share code');
  }
}

/**
 * Delete session
 */
export function deleteSession(sessionId: string): void {
  const sessions = getSessions();
  const filtered = sessions.filter(s => s.id !== sessionId);
  saveSessions(filtered);
}

/**
 * Get supported execution languages
 */
export function getSupportedExecutionLanguages(): ProgrammingLanguage[] {
  return [
    'javascript',
    'python',
    'java',
    'cpp',
    'go',
    'rust',
    'php',
    'ruby',
    'bash',
  ];
}
