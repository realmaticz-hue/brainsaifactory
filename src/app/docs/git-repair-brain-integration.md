# Git Repair Brain - System Integration Guide

## Overview

The Git Repair system now operates with comprehensive AI Brain Command Instructions that guide its autonomous behavior. These instructions define specialized agent roles, workflow protocols, and execution strategies.

## Key Files

### 1. `/utils/gitRepairBrainInstructions.ts`
**NEW FILE** - Contains the complete AI Brain Command Instructions extracted from the git-repair-brain-commands.md document.

**Key Components:**
- ✅ Step-by-step execution protocol (10 steps)
- ✅ Specialized agent roles (Architect, Backend, Frontend, Database, QA, DevOps, Refactor)
- ✅ Backend and frontend module responsibilities
- ✅ Docker sandbox environment specifications
- ✅ AI prompt templates
- ✅ End-to-end workflow diagram
- ✅ Validation checks
- ✅ Enhanced behavioral directives
- ✅ Success criteria
- ✅ Tech stack specifications
- ✅ Viral launch strategy

### 2. `/utils/superCodingBrain.ts`
**UPDATED** - Enhanced the `getGitRepairBrainDirective()` function with:
- ✅ Specialized agent roles prominently featured
- ✅ Enhanced behavioral directives including network resilience
- ✅ Extended success criteria with network and error handling metrics
- ✅ Tech stack and viral launch strategy
- ✅ Reference to comprehensive instructions in gitRepairBrainInstructions.ts

### 3. `/pages/GitRepair.tsx`
**UPDATED** - Integrated the new brain instructions:
- ✅ Imports `getGitRepairInstructions()` for access to comprehensive guidance
- ✅ Continues to use `getGitRepairBrainDirective()` for directive passing to server

### 4. `/supabase/functions/server/index.tsx`
**UPDATED** - Added documentation comments to Git Repair endpoints:
- ✅ `/git-repair/scan` - References MODULE 1 & 5
- ✅ `/git-repair/fix` - References MODULE 6, 7, & 8 with specialized agents
- ✅ `/git-repair/clone` - References repoCloner & frameworkDetector modules

## Specialized Agent Roles

The Git Repair Brain now operates with 7 specialized agent roles:

| Agent | Symbol | Role |
|-------|--------|------|
| Architect Agent | 🏗️ | Analyzes repo structure and generates Project Graph |
| Backend Agent | ⚙️ | Repairs API, server, and logic errors |
| Frontend Agent | 🎨 | Repairs UI components, rendering, and framework issues |
| Database Agent | 🗄️ | Repairs schemas, models, queries |
| QA Agent | ✅ | Validates builds, tests, runtime, and UI |
| DevOps Agent | 🚀 | Ensures builds, deployments, environment configs |
| Refactor Agent | 📚 | Improves code readability and maintainability |

## Backend Modules

| Module | Responsibility |
|--------|----------------|
| repoCloner | Clone GitHub repo into Docker sandbox |
| frameworkDetector | Detect language/framework |
| dependencyParser | Parse dependencies (package.json, requirements.txt) |
| projectGraph | Build nodes/edges representing files, functions, imports |
| errorDetector | Run builds, detect errors, classify by type |
| fixGenerator | Generate AI repair actions (code/config/dependencies) |
| sandboxRunner | Apply repairs safely in Docker sandbox |
| validator | Validate build success, runtime, tests, UI, security |

## Frontend Components

| Component | Responsibility |
|-----------|----------------|
| RepoInput | Accept GitHub URL, submit repair request |
| RepairProgress | Display live logs of cloning → analyzing → repairing |
| RepairSummary | Show applied fixes and download link for repaired repo |
| api | Frontend → Backend API calls |

## Enhanced Behavioral Directives

The system now includes enhanced behavioral directives:

✅ **Network Resilience:**
- Implement retry logic with exponential backoff for network operations
- Fall back to alternative strategies when primary approach fails
- Handle large files (>1MB) with special fetching strategies
- Normalize file encoding to prevent content corruption

✅ **Code Quality:**
- Prioritize root cause analysis over surface fixes
- Avoid temporary patches that don't address underlying issues
- Maintain architectural integrity across all repairs
- Preserve existing application functionality

✅ **Operational Excellence:**
- Use safe, idempotent operations
- Provide detailed logging at every step
- Learn from every repair for continuous improvement
- Track all fixed files and newly created files

## 12-Step End-to-End Workflow

1. **User Inputs GitHub Repo URL**
2. **Clone Repo into Docker Sandbox** (repoCloner, frameworkDetector)
3. **Analyze Repository** (dependencyParser, projectGraph, Architect Agent)
4. **Attempt Build** (npm install, npm run build/dev)
5. **Detect & Classify Errors** (errorDetector)
6. **AI Error Analysis** (errorAnalysisPrompt, specialized agents)
7. **Generate Repair Actions** (fixGenerator, repairActionPrompt)
8. **Apply Repairs in Sandbox** (sandboxRunner)
9. **Rebuild & Validate** (validator, QA Agent)
10. **Iterative Repair Loop** (repeat 5-9 if needed)
11. **Final Validation Checks** (comprehensive validation)
12. **Output Repaired Repo** (summary, download, deploy-ready)

## Success Criteria

### Core Success Metrics
✅ The project builds successfully
✅ All tests pass
✅ No runtime errors occur
✅ The UI functions correctly
✅ Deployment succeeds
✅ Production monitoring shows stable operation

### Additional Success Metrics
✅ Repairs any GitHub repo reliably
✅ Builds and runs without manual intervention
✅ Sandbox ensures zero host risk
✅ Clear, actionable repair summaries provided
✅ AI continuously improves based on past repairs
✅ Ready for production deployment with shareable results
✅ Network resilience with automatic retry mechanisms
✅ Comprehensive error logging with recovery paths

## How It Works Together

1. **Frontend Request:** User pastes GitHub URL in `/pages/GitRepair.tsx`
2. **Brain Directive:** System loads `getGitRepairBrainDirective()` with specialized agents
3. **Server Processing:** `/supabase/functions/server/index.tsx` endpoints execute with brain guidance
4. **AI Analysis:** OpenRouter API receives comprehensive directive for context-aware repairs
5. **Iterative Repair:** System follows 12-step workflow until all success criteria met
6. **Output:** User receives working repo + detailed repair summary

## Recent Enhancements

### Network Reliability
- ✅ Retry logic with exponential backoff for DNS/network failures
- ✅ Smart file content fetcher with automatic fallback to GitHub's blob API for files >1MB
- ✅ Encoding normalization for content integrity
- ✅ Detailed error logging with automatic recovery mechanisms

### All 5 Git Repair Endpoints Updated
1. `/git-repair/clone` - Repo cloning with retry logic
2. `/git-repair/get-file` - Smart file fetching with large file handling
3. `/git-repair/scan` - Comprehensive error detection
4. `/git-repair/fix` - AI-powered repair with specialized agents
5. `/git-repair/upload-github` - GitHub integration for repaired repos

## Developer Experience

**Before:** Paste URL → Manual debugging → Hours of work
**After:** Paste URL → Click Repair → Receive Working Repo (30 seconds)

**Live Progress:** Users see real-time logs of every step
**Repair Summary:** Detailed report of all fixes applied
**Shareable Results:** Before/after comparison for social proof

## Tech Stack

- **Backend:** Node.js + Express
- **Frontend:** React + Tailwind
- **AI:** GPT-4 / GPT-5 via OpenRouter
- **Sandbox:** Docker (planned)
- **Repo Management:** Git CLI + GitHub API
- **Storage:** Supabase KV Store

## Viral Launch Strategy

- 📢 **Headline:** "Paste Any GitHub Repo — We'll Fix It Instantly"
- 🎬 **Demo Repos:** Prove credibility with real examples
- 🎨 **Live Animations:** Build trust through transparent progress
- 📊 **Shareable Summaries:** Before/after repair reports
- 💬 **Social Proof:** "This AI just fixed my repo in 30 seconds 😲"

## Next Steps

1. ✅ **COMPLETED:** Integrate brain commands into system directive
2. ✅ **COMPLETED:** Update behavioral directives with network resilience
3. ✅ **COMPLETED:** Document specialized agent roles
4. 🚀 **NEXT:** Implement Docker sandbox for truly isolated repairs
5. 🚀 **NEXT:** Add bootstrap script (bootstrapGitRepair.js) for one-command setup
6. 🚀 **NEXT:** Enhance AI prompts with specialized agent context
7. 🚀 **NEXT:** Build shareable repair summary visualization
8. 🚀 **NEXT:** Launch viral demo campaign

---

**The Git Repair Brain is now fully programmed with comprehensive operational guidance that will drive its autonomous repair behavior.**
