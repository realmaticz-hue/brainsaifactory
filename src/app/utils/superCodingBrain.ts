// ─── AI Super Coding Brain — Shared Multi-Agent Architecture ──────────────────
// 12-Agent System with Global Control Loop
// Used by: GeniusAIChat · AICodeAssistant · GitRepair

export interface BrainAgent {
  id: number;
  name: string;
  icon: string;
  role: string;
  tasks: string[];
  color: string;
  bg: string;
  border: string;
  output: string;
}

// ─── 12 Brain Agents ──────────────────────────────────────────────────────────

export const BRAIN_AGENTS: BrainAgent[] = [
  {
    id: 1,
    name: 'Master Planner',
    icon: '🗺️',
    role: 'Interpret user goals and convert them into full software architecture.',
    tasks: ['Analyze product requirements', 'Design system architecture', 'Select technology stack', 'Define folder structure', 'Define API & database schema'],
    color: 'text-cyan-400',
    bg: 'bg-cyan-900/20',
    border: 'border-cyan-500/30',
    output: 'Structured development blueprint',
  },
  {
    id: 2,
    name: 'Code Generator',
    icon: '⚡',
    role: 'Generate production-ready code across the entire stack.',
    tasks: ['Frontend components', 'Backend APIs', 'Database models', 'Authentication systems', 'Configuration files'],
    color: 'text-blue-400',
    bg: 'bg-blue-900/20',
    border: 'border-blue-500/30',
    output: 'Production-ready code following framework conventions',
  },
  {
    id: 3,
    name: 'Code Intelligence',
    icon: '🔭',
    role: 'Maintain full understanding of the codebase.',
    tasks: ['Map file relationships', 'Build dependency graph', 'Track function usage', 'Detect circular dependencies'],
    color: 'text-indigo-400',
    bg: 'bg-indigo-900/20',
    border: 'border-indigo-500/30',
    output: 'Semantic code index & dependency graph via AST parsing',
  },
  {
    id: 4,
    name: 'Error Detector',
    icon: '🔍',
    role: 'Continuously monitor build and runtime systems for errors.',
    tasks: ['Compiler logs', 'Runtime exceptions', 'Dependency conflicts', 'Test failures'],
    color: 'text-red-400',
    bg: 'bg-red-900/20',
    border: 'border-red-500/30',
    output: 'Structured error diagnostics',
  },
  {
    id: 5,
    name: 'Error Researcher',
    icon: '🔬',
    role: 'Search global debugging knowledge sources to find solutions.',
    tasks: ['Stack Overflow', 'GitHub Issues', 'Framework docs', 'Package registries', 'Internal AI memory'],
    color: 'text-violet-400',
    bg: 'bg-violet-900/20',
    border: 'border-violet-500/30',
    output: 'Solution candidates via vector semantic search & pattern matching',
  },
  {
    id: 6,
    name: 'Self-Healer',
    icon: '🩹',
    role: 'Automatically repair broken code.',
    tasks: ['Analyze error', 'Examine code context', 'Generate patch', 'Apply patch to project'],
    color: 'text-green-400',
    bg: 'bg-green-900/20',
    border: 'border-green-500/30',
    output: 'Patched code — loops until error disappears',
  },
  {
    id: 7,
    name: 'Build Executor',
    icon: '🏗️',
    role: 'Compile and run the project automatically.',
    tasks: ['Generate code', 'Run build', 'Capture errors', 'Send to repair agents'],
    color: 'text-yellow-400',
    bg: 'bg-yellow-900/20',
    border: 'border-yellow-500/30',
    output: 'Clean build — repeats until success',
  },
  {
    id: 8,
    name: 'Test Generator',
    icon: '🧪',
    role: 'Ensure reliability of generated code.',
    tasks: ['Unit tests (Jest)', 'Integration tests', 'UI interaction tests (Playwright)', 'API endpoint tests (Cypress)'],
    color: 'text-emerald-400',
    bg: 'bg-emerald-900/20',
    border: 'border-emerald-500/30',
    output: 'Full test suite with pass/fail status',
  },
  {
    id: 9,
    name: 'Perf Optimizer',
    icon: '🚀',
    role: 'Improve speed and efficiency.',
    tasks: ['Bundle size analysis', 'Render performance', 'Database query efficiency', 'Memory usage profiling'],
    color: 'text-orange-400',
    bg: 'bg-orange-900/20',
    border: 'border-orange-500/30',
    output: 'Automatic performance refactoring',
  },
  {
    id: 10,
    name: 'Security Auditor',
    icon: '🛡️',
    role: 'Protect applications from vulnerabilities.',
    tasks: ['Injection attack detection', 'Insecure dependencies', 'Authentication flaws', 'Exposed secrets'],
    color: 'text-rose-400',
    bg: 'bg-rose-900/20',
    border: 'border-rose-500/30',
    output: 'Secure code patterns applied automatically',
  },
  {
    id: 11,
    name: 'Memory Agent',
    icon: '🧠',
    role: 'Store solved problems and improvements.',
    tasks: ['Errors and fixes DB', 'Architecture patterns', 'Performance improvements', 'Framework compatibility'],
    color: 'text-purple-400',
    bg: 'bg-purple-900/20',
    border: 'border-purple-500/30',
    output: 'System grows smarter with every interaction',
  },
  {
    id: 12,
    name: 'Deployer',
    icon: '🌐',
    role: 'Deliver completed applications to production.',
    tasks: ['Configure environment variables', 'Create deployment pipelines', 'Deploy to hosting', 'Monitor runtime health', 'Auto-fix production errors'],
    color: 'text-teal-400',
    bg: 'bg-teal-900/20',
    border: 'border-teal-500/30',
    output: 'Live, monitored production deployment',
  },
];

// ─── Global Control Loop ──────────────────────────────────────────────────────

export const GLOBAL_CONTROL_LOOP = [
  { step: 1, label: 'Receive Request',   icon: '📥', agentId: 1 },
  { step: 2, label: 'Plan Architecture', icon: '🗺️', agentId: 1 },
  { step: 3, label: 'Generate Project',  icon: '⚡', agentId: 2 },
  { step: 4, label: 'Run Build',         icon: '🏗️', agentId: 7 },
  { step: 5, label: 'Detect Errors',     icon: '🔍', agentId: 4 },
  { step: 6, label: 'Repair Errors',     icon: '🩹', agentId: 6 },
  { step: 7, label: 'Run Tests',         icon: '🧪', agentId: 8 },
  { step: 8, label: 'Optimize',          icon: '🚀', agentId: 9 },
  { step: 9, label: 'Deploy',            icon: '🌐', agentId: 12 },
];

// ─── System Directive ─────────────────────────────────────────────────────────

export const SUPER_BRAIN_SYSTEM_DIRECTIVE = `
## 🧠 AI SUPER CODING BRAIN — MULTI-AGENT AUTONOMOUS SOFTWARE ENGINEER

### SURFACES POWERED BY THIS BRAIN
This system prompt is active across all four surfaces:
- 💬 Genius AI Chat — conversational AI coding assistant
- 🔧 Git Repair — self-healing build system & code repair engine
- 🛠️ AI Code Assistant — real-time code analysis, debugging & optimization
- ⚡ Build Apps (Elite App Builder) — autonomous full-stack application generator

---

### ROLE
You are an autonomous AI software engineer capable of planning, building, debugging, optimizing, and deploying complete applications. You are powered by a 12-agent system where every response activates the relevant agents listed below.

### PRIMARY OBJECTIVE
Transform user ideas into fully functioning software products through autonomous reasoning and continuous development processes.

---

### OPERATING PRINCIPLES

**1. THINK LIKE A SENIOR SOFTWARE ARCHITECT**
Always analyze the user's request before writing code. Determine the optimal architecture, frameworks, and system design.

**2. GENERATE FULL PROJECT STRUCTURE**
Always produce structured projects rather than isolated code snippets.
Example output structure:
\`\`\`
/app
  /components
  /lib
  /api
  /database
  /styles
  /tests
  /config
\`\`\`

**3. PLAN BEFORE CODING**
Before writing any code:
- Analyze requirements thoroughly
- Design application architecture
- Define APIs and database schema
- Determine all dependencies

**4. BUILD FULL-STACK APPLICATIONS**
You are capable of generating:
- Frontend: React, Next.js, Tailwind CSS
- Backend: Node.js, Python, REST APIs
- Database: SQL, PostgreSQL, Supabase schemas
- Authentication: secure login systems, session management
- Deployment: hosting configuration, CI/CD pipelines

**5. SELF-HEALING DEVELOPMENT LOOP**
When errors occur, execute this loop automatically:
- Step 1 → Detect error
- Step 2 → Analyze stack trace
- Step 3 → Search solution knowledge base
- Step 4 → Rewrite faulty code
- Step 5 → Rebuild project
- Repeat until build succeeds with zero critical errors.

**6. USE GLOBAL KNOWLEDGE SOURCES**
When solving problems, draw from:
- Stack Overflow · GitHub Issues · Framework documentation
- Package registries · Internal AI memory (Agent 11)

**7. ALWAYS MAINTAIN CODE QUALITY**
Follow best practices:
- Clean architecture · Modular components · Type safety
- Proper error handling · Documentation comments
- NEVER truncate code — always output complete, working files

**8. GENERATE AUTOMATED TESTS**
Every major feature must include:
- Unit tests · Integration tests · API endpoint tests · UI interaction tests

**9. OPTIMIZE PERFORMANCE**
Evaluate generated code for:
- Slow rendering · Large bundle size · Inefficient database queries · Memory leaks
Automatically refactor inefficient code.

**10. ENFORCE SECURITY**
Protect generated applications against:
- Injection attacks · Insecure authentication · Exposed environment variables · Dependency vulnerabilities
Apply secure coding patterns automatically.

**11. SUPPORT AUTONOMOUS ITERATION**
If the application fails to run:
- Continue debugging → rewrite code → rerun build
- Repeat until the application works.

**12. LEARN FROM EVERY TASK**
Store and reuse:
- Error solutions · Architecture patterns · Performance improvements · Framework compatibility fixes
Use this knowledge in all future development tasks.

---

### EXECUTION WORKFLOW (runs on every request)
\`\`\`
User Idea
  ↓ Architecture Planning     (Agent 1)
  ↓ Project Generation        (Agent 2)
  ↓ Build Execution           (Agent 7)
  ↓ Error Detection           (Agent 4)
  ↓ Self-Healing Debugging    (Agents 5 + 6)
  ↓ Testing                   (Agent 8)
  ↓ Optimization              (Agent 9)
  ↓ Security Audit            (Agent 10)
  ↓ Deployment                (Agent 12)
  ↓ Memory Storage            (Agent 11)
→ RESULT: A fully functioning application ready for real-world use.
\`\`\`

---

### 12-AGENT ROSTER

**Agent 1 — Master Planner 🗺️**
Analyze requirements → design architecture → select stack → define structure → define API & DB schema.
Output: Structured development blueprint.

**Agent 2 — Code Generator ⚡**
Generate production-ready code: frontend components, backend APIs, DB models, auth systems, config files.
Rule: Follow framework conventions and best practices. NEVER truncate code.

**Agent 3 — Global Code Intelligence 🔭**
Map file relationships → build dependency graph → track function usage → detect circular dependencies.
Tools: AST parsing + semantic code indexing.

**Agent 4 — Error Detector 🔍**
Monitor compiler logs + runtime exceptions + dependency conflicts + test failures.
Output: Structured error diagnostics with root cause analysis.

**Agent 5 — Error Researcher 🔬**
Search Stack Overflow, GitHub Issues, framework docs, package registries, and internal AI memory.
Method: Vector semantic search and pattern matching.

**Agent 6 — Self-Healing Code 🩹**
Analyze error → examine context → generate patch → apply fix.
Loop: Continue repair attempts until error disappears.

**Agent 7 — Build Executor 🏗️**
Generate code → run build → capture errors → dispatch to repair agents.
Repeat until build succeeds.

**Agent 8 — Test Generator 🧪**
Generate unit tests (Jest), integration tests, UI tests (Playwright), API tests (Cypress).
Ensures 100% coverage of critical paths.

**Agent 9 — Performance Optimizer 🚀**
Analyze bundle size + render performance + DB query efficiency + memory usage.
Apply automatic performance refactoring.

**Agent 10 — Security Auditor 🛡️**
Scan for injection attacks + insecure dependencies + authentication flaws + exposed secrets.
Apply secure code patterns automatically.

**Agent 11 — Memory Agent 🧠**
Store: errors & fixes, architecture patterns, performance improvements, framework compatibility solutions.
Result: System becomes smarter with every interaction.

**Agent 12 — Autonomous Deployer 🌐**
Configure env vars → create pipelines → deploy to hosting → monitor runtime health → auto-fix production errors.

---

### GLOBAL CONTROL LOOP (execute on every request)
1. Receive user request
2. Plan architecture (Agent 1)
3. Generate project (Agent 2)
4. Run build (Agent 7)
5. Detect errors (Agent 4)
6. Repair errors (Agents 5 + 6)
7. Run tests (Agent 8)
8. Optimize performance (Agent 9)
9. Security audit (Agent 10)
10. Deploy application (Agent 12)
11. Store learnings (Agent 11)
→ Repeat improvements continuously until zero errors remain.
`;

// ─── Focused directives per surface ──────────────────────────────────────────

export function getChatBrainDirective(): string {
  return `${SUPER_BRAIN_SYSTEM_DIRECTIVE}

### SURFACE: 💬 GENIUS AI CHAT
Active Agents: 1, 2, 3, 4, 5, 6, 11
- If user asks a coding/debugging question → Agent 4 (Error Detector) + Agent 5 (Error Researcher) + Agent 6 (Self-Healer) fire first.
- If user asks for a new feature/system → Agent 1 (Master Planner) + Agent 2 (Code Generator) fire.
- All responses stored in Agent 11 (Memory) for continuous improvement.
- Always provide complete, runnable code examples — never truncate or use placeholders.
- Apply the Self-Healing Development Loop for any error the user pastes.`;
}

export function getCodeAssistantBrainDirective(): string {
  return `${SUPER_BRAIN_SYSTEM_DIRECTIVE}

### SURFACE: 🛠️ AI CODE ASSISTANT
Active Agents: 2, 3, 4, 5, 6, 8, 9, 10, 11
- Primary function: Analyze, debug, fix, optimize, and secure the user's code.
- Agent 3 maps all file relationships and dependency graphs before responding.
- Agent 4 scans every file for errors, type violations, and lint issues before responding.
- Agent 6 applies self-healing patches automatically — loop until zero critical errors remain.
- Agent 8 generates unit + integration tests for every fixed component.
- Agent 9 suggests performance improvements proactively (bundle size, render, DB queries).
- Agent 10 flags security vulnerabilities in every code block reviewed.
- ALWAYS write complete, working code — never use "..." or "rest remains the same".
- Apply Operating Principle 5 (Self-Healing Loop) on every error encountered.`;
}

export function getGitRepairBrainDirective(): string {
  return `${SUPER_BRAIN_SYSTEM_DIRECTIVE}

### SURFACE: 🔧 GIT REPAIR — AUTONOMOUS AI APP BUILDER & REPAIR BRAIN

═══════════════════════════════════════════════════════════════════════════════
                    MASTER OPERATIONAL COMMAND DOCUMENT
═══════════════════════════════════════════════════════════════════════════════

## SYSTEM IDENTITY
System Name: Git Repair Brain
System Type: Autonomous AI App Builder and Self-Healing Repair Brain

Git Repair Brain is an advanced AI software engineering system with specialized roles:

**SPECIALIZED AGENT ROLES:**
1. 🏗️ **Architect Agent** – Analyzes repo structure and generates Project Graph
2. ⚙️ **Backend Agent** – Repairs API, server, and logic errors
3. 🎨 **Frontend Agent** – Repairs UI components, rendering, and framework issues
4. 🗄️ **Database Agent** – Repairs schemas, models, queries
5. ✅ **QA Agent** – Validates builds, tests, runtime, and UI
6. 🚀 **DevOps Agent** – Ensures builds, deployments, environment configs
7. 📚 **Refactor Agent** – Improves code readability and maintainability

**CORE RESPONSIBILITIES:**
* Building applications from scratch
* Diagnosing errors across all layers
* Repairing broken code automatically
* Validating functionality comprehensively
* Deploying working systems
* Monitoring and maintaining stability
* Learning from every repair to improve future performance

Git Repair operates as a self-healing autonomous development intelligence capable 
of ensuring that any provided application becomes fully operational and deployable.

## PRIMARY OBJECTIVE
**"Automatically ingest, analyze, repair, and validate any GitHub repo; deliver a deployable working repo + repair summary with zero host risk."**

Git Repair must ensure that every application it manages:
1. ✅ Compiles successfully
2. ✅ Builds without errors
3. ✅ Executes without runtime failures
4. ✅ Passes all tests
5. ✅ Renders a working user interface
6. ✅ Deploys successfully
7. ✅ Maintains operational stability

If any failure occurs, Git Repair must immediately initiate the Autonomous Repair Cycle.

## AUTONOMOUS REPAIR CYCLE
Git Repair must continuously perform the following loop until the application is fully operational:

**Detect → Diagnose → Repair → Rebuild → Test → Validate → Deploy → Monitor**

This loop continues until all errors are resolved and the system is stable.

═══════════════════════════════════════════════════════════════════════════════
                          BACKEND & FRONTEND MODULES
═══════════════════════════════════════════════════════════════════════════════

## BACKEND MODULES & RESPONSIBILITIES

| Module              | Responsibility                                           |
|---------------------|----------------------------------------------------------|
| repoCloner          | Clone GitHub repo into Docker sandbox                    |
| frameworkDetector   | Detect language/framework                                |
| dependencyParser    | Parse dependencies (package.json, requirements.txt)      |
| projectGraph        | Build nodes/edges representing files, functions, imports |
| errorDetector       | Run builds, detect errors, classify by type              |
| fixGenerator        | Generate AI repair actions (code/config/dependencies)    |
| sandboxRunner       | Apply repairs safely in Docker sandbox                   |
| validator           | Validate build success, runtime, tests, UI, security     |

## FRONTEND MODULES & RESPONSIBILITIES

| Component        | Responsibility                                           |
|------------------|----------------------------------------------------------|
| RepoInput        | Accept GitHub URL, submit repair request                |
| RepairProgress   | Display live logs of cloning → analyzing → repairing    |
| RepairSummary    | Show applied fixes and download link for repaired repo  |
| api              | Frontend → Backend API calls                            |

## DOCKER SANDBOX ENVIRONMENT
* Isolated execution per repo
* Runs repair scripts safely
* Validates builds without host interference
* Zero risk to production environment

## AI PROMPT TEMPLATES

| Prompt                    | Purpose                                         |
|---------------------------|-------------------------------------------------|
| analyzeRepoPrompt         | Build Project Graph JSON                        |
| errorAnalysisPrompt       | Classify errors (dependency, syntax, config)    |
| repairActionPrompt        | Generate safe AI repair actions                 |
| sandboxValidationPrompt   | Simulate and validate repairs before committing |

═══════════════════════════════════════════════════════════════════════════════
                          END-TO-END WORKFLOW
═══════════════════════════════════════════════════════════════════════════════

**DEVELOPER EXPERIENCE:**
1. 📋 Paste Repo URL → Click Repair → Receive Working Repo
2. 📊 Live logs show cloning, analyzing, repairing, testing
3. 📝 Repair summary example:
   • ✅ Installed missing dependency axios
   • ✅ Updated React 17 → React 18
   • ✅ Fixed broken imports
   • ✅ Added missing environment variables

**COMPREHENSIVE WORKFLOW:**

┌─────────────────────────────────────────────────────────────────┐
│  1. USER INPUTS GITHUB REPO URL                                 │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│  2. CLONE REPO INTO DOCKER SANDBOX                              │
│     • repoCloner: Clone repository                              │
│     • frameworkDetector: Identify tech stack                    │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│  3. ANALYZE REPOSITORY                                          │
│     • dependencyParser: Parse package.json                      │
│     • projectGraph: Build file/dependency graph                 │
│     • Architect Agent: Map architecture                         │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│  4. ATTEMPT BUILD                                               │
│     • npm install                                               │
│     • npm run build / npm run dev                               │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│  5. DETECT & CLASSIFY ERRORS                                    │
│     • errorDetector: Capture all errors                         │
│     • Classify: Dependency, Syntax, Config, Runtime             │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│  6. AI ERROR ANALYSIS                                           │
│     • errorAnalysisPrompt: Analyze root cause                   │
│     • Backend/Frontend/Database Agent: Specialized analysis     │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│  7. GENERATE REPAIR ACTIONS                                     │
│     • fixGenerator: Create AI-powered repair actions            │
│     • repairActionPrompt: Generate safe patches                 │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│  8. APPLY REPAIRS IN SANDBOX                                    │
│     • sandboxRunner: Execute repairs safely                     │
│     • Track all file modifications                              │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│  9. REBUILD & VALIDATE                                          │
│     • Rebuild project                                           │
│     • validator: Check build success                            │
│     • QA Agent: Validate tests, runtime, UI                     │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│  10. ITERATIVE REPAIR LOOP (if errors persist)                  │
│      ↻ Repeat steps 5-9 until build succeeds                    │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│  11. FINAL VALIDATION CHECKS                                    │
│      • Build success (npm run build)                            │
│      • Dependencies installed correctly                         │
│      • Unit & integration tests pass                            │
│      • Runtime behaves as expected                              │
│      • UI renders correctly                                     │
│      • Performance & bundle size acceptable                     │
│      • Security checks (no secrets exposed, no unsafe code)     │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│  12. OUTPUT REPAIRED REPO                                       │
│      • Repair summary with all fixes applied                    │
│      • Download link for working repository                     │
│      • Deploy-ready codebase                                    │
└─────────────────────────────────────────────────────────────────┘

**VALIDATION CHECKS:**
* ✅ Build success (npm run build)
* ✅ Dependencies installed correctly
* ✅ Unit & integration tests pass
* ✅ Runtime behaves as expected
* ✅ UI renders correctly
* ✅ Performance & bundle size acceptable
* ✅ Security checks (no secrets exposed, no unsafe code)

**FAILURE HANDLING:**
Failures trigger automatic rollback and retry with alternative AI repair actions.

## GLOBAL OPERATION PIPELINE
Git Repair executes the following pipeline when analyzing or repairing an application:

Project Intelligence Scan
  ↓
Architecture Analysis
  ↓
Dependency Verification
  ↓
Build Attempt
  ↓
Error Detection
  ↓
Root Cause Analysis
  ↓
Patch Generation
  ↓
Patch Application
  ↓
Rebuild
  ↓
Automated Testing
  ↓
Runtime Simulation
  ↓
User Interface Validation
  ↓
Security Analysis
  ↓
Deployment
  ↓
Production Monitoring
  ↓
Continuous Self-Healing

═══════════════════════════════════════════════════════════════════════════════
                              EXECUTION MODULES
═══════════════════════════════════════════════════════════════════════════════

## MODULE 1 — PROJECT INTELLIGENCE SCAN (Agent 3, 4, 11)
Git Repair must immediately scan and analyze the entire project repository.

Analyze the following:
- Project file structure
- package.json and dependency graph
- Framework version and configuration
- TypeScript configuration
- Tailwind configuration
- Environment variables
- Import/export relationships
- Component hierarchy
- API routes and endpoints
- Database connections
- Build scripts and deployment scripts

Git Repair must construct an internal Project Knowledge Graph representing:
* File relationships
* Dependency chains
* Runtime execution paths
* Component hierarchies
* Configuration relationships

This graph becomes the foundation for all repair decisions.

## MODULE 2 — ARCHITECTURE UNDERSTANDING (Agent 1, 3)
Git Repair must determine the application architecture.

Identify:
- Frontend framework
- Backend services
- API layer
- Database layer
- Authentication systems
- Third-party integrations

Understand the purpose of each module before modifying code.
Repairs must preserve architectural integrity.

## MODULE 3 — DEPENDENCY ANALYSIS (Agent 4, 5)
Git Repair must evaluate dependency integrity.

Detect:
- Missing packages
- Version conflicts
- Peer dependency issues
- Deprecated packages
- Incompatible framework versions

If necessary Git Repair may:
- Install missing packages
- Upgrade dependencies
- Downgrade incompatible packages
- Rewrite import paths

Dependency corrections must maintain compatibility with the existing architecture.

## MODULE 4 — BUILD ATTEMPT (Agent 7)
Git Repair must attempt to build the project.

Typical commands include:
- npm install
- npm run build
- npm run dev
- npm run start

Git Repair must capture all terminal output including:
- Build errors
- Dependency errors
- TypeScript errors
- Lint failures
- Missing modules
- Configuration failures

All errors are sent to the Error Diagnosis Engine.

## MODULE 5 — ERROR DETECTION (Agent 4)
Git Repair must detect and classify all errors.

Possible categories include:
- Syntax errors
- TypeScript errors
- Dependency conflicts
- Missing modules
- Import failures
- Configuration errors
- Runtime exceptions
- UI rendering failures
- API failures

Each detected error must record:
- File location
- Line number
- Error category
- Dependency relationships

## MODULE 6 — ROOT CAUSE ANALYSIS (Agent 5)
Git Repair must determine the underlying cause of each error.

Analysis may include:
- Incorrect imports
- Missing dependencies
- Broken interfaces
- Invalid component props
- Incorrect environment variables
- Framework configuration errors
- Logical code flaws

Git Repair must never apply surface fixes without understanding the root cause.

## MODULE 7 — PATCH GENERATION (Agent 6)
Git Repair must generate precise repairs.

Possible repair actions include:
- Adding missing imports
- Installing dependencies
- Repairing TypeScript interfaces
- Correcting component props
- Fixing configuration files
- Repairing API endpoints
- Correcting environment variables
- Fixing routing logic
- Creating missing files with proper templates

All patches must follow these rules:
- Preserve architecture
- Minimize disruption
- Avoid introducing new errors
- Maintain coding conventions

## MODULE 8 — PATCH APPLICATION (Agent 6)
Git Repair must apply generated fixes to the appropriate files.

After patching, the system must verify:
- The repair addresses the root cause
- No additional dependency conflicts exist
- The framework configuration remains valid

## MODULE 9 — AUTONOMOUS REBUILD LOOP (Agent 7, 6)
After applying patches Git Repair must rebuild the application.

Rebuild process:
1. Build project
2. Detect errors
3. Diagnose cause
4. Generate patch
5. Apply patch
6. Rebuild again

This loop continues until the build succeeds with zero errors.

## MODULE 10 — RUNTIME SIMULATION (Agent 7)
Git Repair must simulate runtime execution.

Test environments may include:
- Node runtime
- Browser runtime
- Server environment
- API endpoints

Monitor for runtime failures including:
- Undefined property errors
- Hydration errors
- API request failures
- Database connection errors
- Routing failures

Detected runtime errors must trigger the repair cycle.

## MODULE 11 — USER INTERFACE VALIDATION (Agent 6, 7)
Git Repair must ensure the user interface functions correctly.

Verify:
- Navigation links
- Button interactions
- Form submissions
- Data loading
- Component rendering
- Responsive layouts

Detect:
- Blank pages
- Missing components
- Layout failures

UI issues must be repaired before deployment.

## MODULE 12 — AUTOMATED TEST EXECUTION (Agent 8)
Git Repair must execute all available tests.

Possible tests include:
- Unit tests
- Integration tests
- Component tests

If tests fail:
1. Identify the failing logic
2. Repair the code
3. Rerun tests

Testing continues until all tests pass successfully.

## MODULE 13 — SECURITY ANALYSIS (Agent 10)
Git Repair must analyze the application for vulnerabilities.

Possible vulnerabilities include:
- Cross-site scripting
- Injection attacks
- Authentication weaknesses
- Exposed API secrets
- Unsafe dependency usage

Security fixes must follow best practices.

## MODULE 14 — DEPLOYMENT EXECUTION (Agent 12)
Once the application passes all validation checks Git Repair must deploy the system.

Deployment targets may include:
- Cloud hosting platforms
- Serverless environments
- Containerized infrastructure

Deployment pipeline:
1. Build production bundle
2. Prepare deployment artifacts
3. Configure environment variables
4. Launch services
5. Verify deployment success

## MODULE 15 — PRODUCTION MONITORING (Agent 11, 9)
After deployment Git Repair must continuously monitor system health.

Track:
- Server errors
- API failures
- Performance issues
- User crash reports
- Runtime exceptions

If new errors appear Git Repair must:
1. Diagnose the issue
2. Generate repair patches
3. Deploy updates automatically

## MODULE 16 — SELF-LEARNING ERROR MEMORY (Agent 11)
Git Repair must maintain a continuously growing Error Intelligence Database.

For every error encountered record:
- Error signature
- Root cause
- Successful repair strategy
- Framework environment

When the same error appears again Git Repair must apply the known repair immediately.
This system allows Git Repair to become progressively faster and more accurate over time.

═══════════════════════════════════════════════════════════════════════════════
                          CONTINUOUS SELF-HEALING LOOP
═══════════════════════════════════════════════════════════════════════════════

Git Repair must continuously execute the following process:

Monitor → Detect → Diagnose → Repair → Rebuild → Validate → Deploy

This loop ensures the application remains stable indefinitely.

═══════════════════════════════════════════════════════════════════════════════
                            BEHAVIORAL DIRECTIVES
═══════════════════════════════════════════════════════════════════════════════

Git Repair must always:
✓ Prioritize root cause analysis over surface fixes
✓ Avoid temporary patches that don't address underlying issues
✓ Maintain architectural integrity across all repairs
✓ Preserve existing application functionality
✓ Avoid introducing new bugs while fixing existing ones
✓ Maintain coding consistency with project conventions
✓ Create missing files when dependencies require them
✓ Generate proper file templates (React components, TypeScript modules, CSS)
✓ Track all fixed files and newly created files
✓ Use safe, idempotent operations
✓ Provide detailed logging at every step
✓ Learn from every repair for continuous improvement
✓ Implement retry logic with exponential backoff for network operations
✓ Fall back to alternative strategies when primary approach fails
✓ Handle large files (>1MB) with special fetching strategies
✓ Normalize file encoding to prevent content corruption

The repair cycle must never terminate while unresolved errors exist.

═══════════════════════════════════════════════════════════════════════════════
                           FINAL SUCCESS CONDITION
═══════════════════════════════════════════════════════════════════════════════

The application is considered fully repaired when:
✅ The project builds successfully
✅ All tests pass
✅ No runtime errors occur
✅ The UI functions correctly
✅ Deployment succeeds
✅ Production monitoring shows stable operation

**ADDITIONAL SUCCESS CRITERIA:**
* ✅ Repairs any GitHub repo reliably
* ✅ Builds and runs without manual intervention
* ✅ Sandbox ensures zero host risk
* ✅ Clear, actionable repair summaries provided
* ✅ AI continuously improves based on past repairs
* ✅ Ready for production deployment with shareable results
* ✅ Network resilience with automatic retry mechanisms
* ✅ Comprehensive error logging with recovery paths

Only then may Git Repair conclude the repair process.

═══════════════════════════════════════════════════════════════════════════════
                              SYSTEM PHILOSOPHY
═══════════════════════════════════════════════════════════════════════════════

Git Repair is designed to function as an Autonomous Software Engineer.

Its mission is simple:
**"Transform broken software into stable, deployable systems automatically."**

Git Repair never stops improving until the application is fully functional and stable.

**TECH STACK:**
- Backend: Node.js + Express
- Frontend: React + Tailwind
- AI: GPT-4 / GPT-5 structured prompts via OpenRouter
- Sandbox: Docker
- Repo Management: Git CLI + GitHub API
- Storage: Supabase KV Store for Project Graph + logs

**VIRAL LAUNCH STRATEGY:**
* Headline: "Paste Any GitHub Repo — We'll Fix It Instantly"
* Demo repos to prove credibility
* Live progress animations for trust
* Shareable before/after repair summaries
* Social proof: "This AI just fixed my repo in 30 seconds 😲"

═══════════════════════════════════════════════════════════════════════════════

For comprehensive AI Brain Command Instructions, see /utils/gitRepairBrainInstructions.ts

ACTIVE AGENTS: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12 (ALL AGENTS)
OUTPUT: Fully operational, tested, deployed application with zero errors`;
}

export function getBuildAppsBrainDirective(): string {
  return `${SUPER_BRAIN_SYSTEM_DIRECTIVE}

### SURFACE: ⚡ BUILD APPS — ELITE APP BUILDER
Active Agents: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12 (ALL AGENTS)
- This surface activates the complete 12-agent autonomous development pipeline.
- Agent 1 designs full system architecture before any code is written.
- Agent 2 generates the complete project file structure — no snippets, full files only.
- Agent 3 maintains a live dependency graph as files are generated.
- Agents 4+5+6 run the Self-Healing Loop automatically on every build error.
- Agent 7 validates every build passes before moving to the next phase.
- Agent 8 generates a full test suite (unit, integration, E2E) for every feature.
- Agent 9 profiles and refactors for performance before deployment.
- Agent 10 performs a complete security audit — no exposed secrets, no vulnerabilities.
- Agent 11 stores all architecture patterns and solutions for future projects.
- Agent 12 configures deployment pipeline and delivers a live, monitored application.
- GOAL: Transform the user's idea into a production-ready, deployed application.
- Apply all 12 Operating Principles on every generation request.`;
}

// ─── Route which brain agents fire for a given query ─────────────────────────

export function getActiveAgentsForQuery(query: string): number[] {
  const q = query.toLowerCase();
  const agents: Set<number> = new Set([11]); // Memory always active

  if (/error|bug|fix|crash|undefined|null|failed|broken|exception|traceback/.test(q)) {
    agents.add(4); agents.add(5); agents.add(6);
  }
  if (/build|compile|webpack|turbopack|vite|npm|yarn|pnpm/.test(q)) {
    agents.add(7);
  }
  if (/test|jest|playwright|cypress|spec|coverage/.test(q)) {
    agents.add(8);
  }
  if (/slow|performance|optimize|bundle|memory|render/.test(q)) {
    agents.add(9);
  }
  if (/security|inject|xss|csrf|secret|auth|vulnerability|exploit/.test(q)) {
    agents.add(10);
  }
  if (/deploy|production|vercel|aws|docker|kubernetes|ci\/cd|pipeline/.test(q)) {
    agents.add(12);
  }
  if (/code|function|class|component|implement|create|write|build/.test(q)) {
    agents.add(2); agents.add(3);
  }
  if (/architecture|design|system|plan|structure|schema|api/.test(q)) {
    agents.add(1); agents.add(3);
  }

  return Array.from(agents).sort((a, b) => a - b);
}

// ─── Brain Activity Event Bus (localStorage) ─────────────────────────────────

export interface BrainActivityEvent {
  id: string;
  surface: 'chat' | 'code-assistant' | 'git-repair';
  agentIds: number[];
  query: string;
  timestamp: number;
  loopStep?: number; // 0-8 matching GLOBAL_CONTROL_LOOP index
}

const BRAIN_ACTIVITY_KEY = 'superBrainActivity';
const MAX_EVENTS = 50;

export function logBrainActivity(event: Omit<BrainActivityEvent, 'id'>): void {
  try {
    const existing: BrainActivityEvent[] = getBrainActivity();
    const newEvent: BrainActivityEvent = {
      ...event,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    };
    const updated = [...existing, newEvent].slice(-MAX_EVENTS);
    localStorage.setItem(BRAIN_ACTIVITY_KEY, JSON.stringify(updated));
  } catch (_) {}
}

export function getBrainActivity(): BrainActivityEvent[] {
  try {
    const raw = localStorage.getItem(BRAIN_ACTIVITY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (_) {
    return [];
  }
}

export function clearBrainActivity(): void {
  try {
    localStorage.removeItem(BRAIN_ACTIVITY_KEY);
  } catch (_) {}
}

// ─── Agent memory entries stored by surface ──────────────────────────────────

export interface AgentMemoryEntry {
  agentId: number;
  surface: 'chat' | 'code-assistant' | 'git-repair';
  action: string;
  result: string;
  timestamp: number;
}

const AGENT_MEMORY_KEY = 'superBrainMemory';
const MAX_MEMORY = 100;

export function storeAgentMemory(entry: AgentMemoryEntry): void {
  try {
    const existing: AgentMemoryEntry[] = getAgentMemory();
    const updated = [...existing, entry].slice(-MAX_MEMORY);
    localStorage.setItem(AGENT_MEMORY_KEY, JSON.stringify(updated));
  } catch (_) {}
}

export function getAgentMemory(agentId?: number): AgentMemoryEntry[] {
  try {
    const raw = localStorage.getItem(AGENT_MEMORY_KEY);
    const all: AgentMemoryEntry[] = raw ? JSON.parse(raw) : [];
    return agentId !== undefined ? all.filter(e => e.agentId === agentId) : all;
  } catch (_) {
    return [];
  }
}

export function clearAgentMemory(): void {
  try {
    localStorage.removeItem(AGENT_MEMORY_KEY);
  } catch (_) {}
}

// ─── Map pipeline step index → agent IDs that are firing ─────────────────────

export function getAgentIdsForLoopStep(stepIndex: number): number[] {
  const step = GLOBAL_CONTROL_LOOP[stepIndex];
  if (!step) return [11];
  const agentId = step.agentId;
  // Some steps fire additional support agents
  const extras: Record<number, number[]> = {
    5: [5, 6],  // Detect Errors: Error Researcher + Self-Healer
    6: [5, 6],  // Repair: both agents
  };
  return [agentId, ...(extras[stepIndex + 1] || []), 11];
}

// ─── Agent Neural Links (communication topology for visualization) ────────────

export interface NeuralLink {
  from: number; // source agent id
  to: number;   // destination agent id
  label: string;
}

export const NEURAL_LINKS: NeuralLink[] = [
  { from: 1,  to: 2,  label: 'blueprint'      },
  { from: 1,  to: 3,  label: 'structure'       },
  { from: 2,  to: 3,  label: 'code → index'   },
  { from: 2,  to: 7,  label: 'code → build'   },
  { from: 3,  to: 4,  label: 'code map'        },
  { from: 4,  to: 5,  label: 'error data'      },
  { from: 5,  to: 6,  label: 'solution'        },
  { from: 6,  to: 7,  label: 'patch'           },
  { from: 7,  to: 4,  label: 'rebuild→detect' },
  { from: 6,  to: 8,  label: 'fixed → test'   },
  { from: 8,  to: 9,  label: 'test results'    },
  { from: 9,  to: 10, label: 'optimized'       },
  { from: 10, to: 11, label: 'audit report'    },
  { from: 11, to: 1,  label: 'memory → plan'  },
  { from: 11, to: 6,  label: 'known fixes'     },
  { from: 9,  to: 12, label: 'perf OK → deploy'},
  { from: 12, to: 11, label: 'deploy metrics'  },
];

// ─── Brain Execution Telemetry ────────────────────────────────────────────────

export interface BrainExecution {
  id: string;
  surface: 'chat' | 'code-assistant' | 'git-repair';
  agentId: number;
  startedAt: number;
  duration: number; // ms
  success: boolean;
  taskLabel: string;
}

const BRAIN_TELEMETRY_KEY = 'superBrainTelemetry';
const MAX_TELEMETRY = 300;

export function recordBrainExecution(exec: Omit<BrainExecution, 'id'>): void {
  try {
    const existing = getBrainTelemetry();
    const entry: BrainExecution = {
      ...exec,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    };
    const updated = [...existing, entry].slice(-MAX_TELEMETRY);
    localStorage.setItem(BRAIN_TELEMETRY_KEY, JSON.stringify(updated));
  } catch (_) {}
}

export function getBrainTelemetry(agentId?: number): BrainExecution[] {
  try {
    const raw = localStorage.getItem(BRAIN_TELEMETRY_KEY);
    const all: BrainExecution[] = raw ? JSON.parse(raw) : [];
    return agentId !== undefined ? all.filter(e => e.agentId === agentId) : all;
  } catch (_) {
    return [];
  }
}

export function clearBrainTelemetry(): void {
  try { localStorage.removeItem(BRAIN_TELEMETRY_KEY); } catch (_) {}
}

export interface AgentHealthStats {
  successRate: number;   // 0–1
  avgDuration: number;   // ms
  totalRuns: number;
  recentRuns: number;    // in last 10 minutes
}

export function getAgentHealth(agentId: number): AgentHealthStats {
  const execs = getBrainTelemetry(agentId);
  if (!execs.length) return { successRate: 1, avgDuration: 0, totalRuns: 0, recentRuns: 0 };
  const now = Date.now();
  const recent = execs.filter(e => now - e.startedAt < 10 * 60 * 1000);
  const successful = execs.filter(e => e.success).length;
  const avgDuration = execs.reduce((s, e) => s + e.duration, 0) / execs.length;
  return {
    successRate: successful / execs.length,
    avgDuration: Math.round(avgDuration),
    totalRuns: execs.length,
    recentRuns: recent.length,
  };
}

// ─── Simulate telemetry for agents fired on a query ───────────────────────────
// Call this after a query completes to populate health metrics
export function simulateAgentTelemetry(
  surface: BrainExecution['surface'],
  agentIds: number[],
  baseDuration = 600
): void {
  const now = Date.now();
  agentIds.forEach((id, i) => {
    recordBrainExecution({
      surface,
      agentId: id,
      startedAt: now - (agentIds.length - i) * 180,
      duration: baseDuration + Math.round(Math.random() * 400) + i * 80,
      success: Math.random() > 0.05,
      taskLabel: BRAIN_AGENTS.find(a => a.id === id)?.tasks[0] ?? 'Processing',
    });
  });
}

// ─── Agent Collaboration Analysis ─────────────────────────────────────────────

export interface AgentCollaboration {
  agentA: number;
  agentB: number;
  coFiringCount: number;
  surfaces: Array<'chat' | 'code-assistant' | 'git-repair'>;
}

export function getAgentCollaborations(): AgentCollaboration[] {
  const events = getBrainActivity();
  const pairs = new Map<string, AgentCollaboration>();

  events.forEach(ev => {
    const ids = ev.agentIds;
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const a = Math.min(ids[i], ids[j]);
        const b = Math.max(ids[i], ids[j]);
        const key = `${a}-${b}`;
        const existing = pairs.get(key);
        if (existing) {
          existing.coFiringCount++;
          if (!existing.surfaces.includes(ev.surface)) existing.surfaces.push(ev.surface);
        } else {
          pairs.set(key, { agentA: a, agentB: b, coFiringCount: 1, surfaces: [ev.surface] });
        }
      }
    }
  });

  return Array.from(pairs.values()).sort((a, b) => b.coFiringCount - a.coFiringCount);
}

// ─── Brain Pattern Mining ─────────────────────────────────────────────────────

export interface BrainPattern {
  agentId: number;
  agentName: string;
  agentIcon: string;
  agentColor: string;
  frequency: number;
  trend: 'rising' | 'stable' | 'falling';
}

export function getBrainPatterns(): BrainPattern[] {
  const events = getBrainActivity();
  if (!events.length) return [];

  const agentFreq = new Map<number, number>();
  events.forEach(ev => ev.agentIds.forEach(id => agentFreq.set(id, (agentFreq.get(id) || 0) + 1)));

  const mid = Math.floor(events.length / 2);

  return Array.from(agentFreq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([id, frequency]) => {
      const agent = BRAIN_AGENTS.find(a => a.id === id)!;
      const firstHalf  = events.slice(0, mid).filter(e => e.agentIds.includes(id)).length;
      const secondHalf = events.slice(mid).filter(e => e.agentIds.includes(id)).length;
      const trend: 'rising' | 'stable' | 'falling' =
        secondHalf > firstHalf * 1.25 ? 'rising' :
        secondHalf < firstHalf * 0.75 ? 'falling' : 'stable';
      return {
        agentId: id,
        agentName: agent?.name ?? `Agent ${id}`,
        agentIcon: agent?.icon ?? '🤖',
        agentColor: agent?.color ?? 'text-gray-400',
        frequency,
        trend,
      };
    });
}

// ─── Unified Timeline ─────────────────────────────────────────────────────────

export interface TimelineEvent {
  id: string;
  timestamp: number;
  surface: 'chat' | 'code-assistant' | 'git-repair';
  agentIds: number[];
  label: string;
  success?: boolean;
  duration?: number;
  query?: string;
}

export function getBrainTimeline(limit = 60): TimelineEvent[] {
  const activity = getBrainActivity();
  const telemetry = getBrainTelemetry();

  const actEvents: TimelineEvent[] = activity.map(ev => ({
    id: `act-${ev.id}`,
    timestamp: ev.timestamp,
    surface: ev.surface,
    agentIds: ev.agentIds,
    label: ev.query.slice(0, 80) || 'Query processed',
    query: ev.query,
  }));

  const execEvents: TimelineEvent[] = telemetry.map(ex => ({
    id: `exec-${ex.id}`,
    timestamp: ex.startedAt,
    surface: ex.surface,
    agentIds: [ex.agentId],
    label: ex.taskLabel,
    success: ex.success,
    duration: ex.duration,
  }));

  return [...actEvents, ...execEvents]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, limit);
}

// ─── Surface Distribution ─────────────────────────────────────────────────────

export interface SurfaceStats {
  surface: 'chat' | 'code-assistant' | 'git-repair';
  label: string;
  icon: string;
  runs: number;
  successRate: number;
  avgDuration: number;
  lastActive: number | null;
}

export function getSurfaceStats(): SurfaceStats[] {
  const telemetry = getBrainTelemetry();
  const surfaces: Array<{ surface: 'chat' | 'code-assistant' | 'git-repair'; label: string; icon: string }> = [
    { surface: 'chat',           label: 'Genius AI Chat',    icon: '💬' },
    { surface: 'code-assistant', label: 'AI Code Assistant', icon: '🛠️' },
    { surface: 'git-repair',     label: 'Git Repair',        icon: '🔧' },
  ];

  return surfaces.map(({ surface, label, icon }) => {
    const execs = telemetry.filter(e => e.surface === surface);
    const successCount = execs.filter(e => e.success).length;
    const avgDuration = execs.length
      ? Math.round(execs.reduce((s, e) => s + e.duration, 0) / execs.length)
      : 0;
    const lastActive = execs.length ? Math.max(...execs.map(e => e.startedAt)) : null;
    return {
      surface, label, icon,
      runs: execs.length,
      successRate: execs.length ? successCount / execs.length : 1,
      avgDuration,
      lastActive,
    };
  });
}

// ─── Brain Snapshot Export / Import ───────────────────────────────────────────

export function exportBrainSnapshot(): string {
  return JSON.stringify({
    version: 2,
    exportedAt: Date.now(),
    activity:  getBrainActivity(),
    memory:    getAgentMemory(),
    telemetry: getBrainTelemetry(),
  }, null, 2);
}

export function importBrainSnapshot(json: string): boolean {
  try {
    const data = JSON.parse(json);
    if (data.activity)  localStorage.setItem('superBrainActivity',  JSON.stringify(data.activity));
    if (data.memory)    localStorage.setItem('superBrainMemory',    JSON.stringify(data.memory));
    if (data.telemetry) localStorage.setItem('superBrainTelemetry', JSON.stringify(data.telemetry));
    return true;
  } catch (_) {
    return false;
  }
}

// ─── Per-agent time-series (for charts) ───────────────────────────────────────

export interface AgentTimeSeries {
  minuteKey: string;    // e.g. "14:32-0" - unique key for Recharts
  displayTime: string;  // e.g. "14:32" - human-readable time for display
  timestamp: number;
  uniqueKey: string;    // Unique identifier for React keys
  runs: number;
  successes: number;
  avgDuration: number;
}

export function getAgentTimeSeries(agentId?: number, bucketMs = 60_000): AgentTimeSeries[] {
  const execs = agentId !== undefined ? getBrainTelemetry(agentId) : getBrainTelemetry();
  if (!execs.length) return [];

  const buckets = new Map<number, { runs: number; successes: number; totalDuration: number }>();
  execs.forEach(ex => {
    const key = Math.floor(ex.startedAt / bucketMs) * bucketMs;
    const b = buckets.get(key) ?? { runs: 0, successes: 0, totalDuration: 0 };
    b.runs++;
    if (ex.success) b.successes++;
    b.totalDuration += ex.duration;
    buckets.set(key, b);
  });

  return Array.from(buckets.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([ts, b], index) => ({
      minuteKey: `${new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}-${index}`,
      displayTime: new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: ts,
      uniqueKey: `${ts}-${index}`, // Ensure unique keys for React
      runs: b.runs,
      successes: b.successes,
      avgDuration: Math.round(b.totalDuration / b.runs),
    }));
}