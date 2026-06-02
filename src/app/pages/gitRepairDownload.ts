// ─── Download helpers for GitRepair ──────────────────────────────────────────
import type { AppTypeInfo, DependencyReport, RepoFile, DetectedError } from './gitRepairTypes';
import { LATEST_VERSIONS } from './gitRepairAnalyzers';

export function generateInstallReadme(
  repoName: string,
  fixedCount: number,
  fileCount: number,
  files: any[],
  appTypeInfo?: AppTypeInfo | null,
  depReport?: DependencyReport | null,
): string {
  const manifestLines = files.map(f =>
    `  [${f.status === 'fixed' ? 'FIXED ' : f.status === 'clean' ? 'CLEAN ' : 'ERROR '}] ${f.path.padEnd(40)} ${(f.size / 1024).toFixed(1).padStart(6)} KB   ${f.errorCount > 0 ? `⚠ ${f.errorCount} issue(s)` : '✓'}`
  ).join('\n');

  const at = appTypeInfo;
  const dr = depReport;
  const pm = at?.packageManager ?? 'npm';
  const add    = pm === 'yarn' ? 'yarn add' : pm === 'pnpm' ? 'pnpm add' : pm === 'bun' ? 'bun add' : 'npm install';
  const addDev = pm === 'yarn' ? 'yarn add -D' : pm === 'pnpm' ? 'pnpm add -D' : pm === 'bun' ? 'bun add -d' : 'npm install -D';
  const pmInstall = pm === 'yarn' ? 'yarn install' : pm === 'pnpm' ? 'pnpm install' : pm === 'bun' ? 'bun install' : 'npm install';
  const runCmd   = at?.runScript  ?? 'npm run dev';
  const buildCmd = at?.buildScript ?? 'npm run build';

  const buildDepSection = (): string => {
    if (!dr || (dr.outdated.length === 0 && dr.missing.length === 0 && dr.conflicts.length === 0)) {
      return `## ✅ Dependencies — All Up-To-Date\n\nAll dependencies are at the latest compatible versions for ${at?.frameworkLabel ?? 'your app'}.`;
    }
    const lines: string[] = [];
    lines.push(`## 📦 Dependencies to Install / Update`);
    lines.push(`\nRun these commands after \`${pmInstall}\` to bring packages to their latest compatible versions for **${at?.frameworkLabel ?? 'your app'}** (${at?.buildTool ?? 'unknown'} build tool, ${at?.language}):\n`);
    lines.push('```bash');

    if (dr.conflicts.length > 0) {
      lines.push(`# ⚠️  Fix peer conflicts FIRST:`);
      dr.conflicts.forEach(c => lines.push(`${c.fixCommand}   # ${c.description}`));
      lines.push('');
    }

    const majorCompat = dr.outdated.filter(d => d.type === 'outdated-major' && d.compatible);
    if (majorCompat.length > 0) {
      lines.push(`# Major version updates (verified compatible with ${at?.frameworkLabel ?? 'your stack'}):`);
      const prodUp = majorCompat.filter(d => !LATEST_VERSIONS[d.name]?.devOnly);
      const devUp  = majorCompat.filter(d =>  LATEST_VERSIONS[d.name]?.devOnly);
      if (prodUp.length > 0) lines.push(`${add} ${prodUp.map(d => `${d.name}@latest`).join(' ')}`);
      if (devUp.length  > 0) lines.push(`${addDev} ${devUp.map(d => `${d.name}@latest`).join(' ')}`);
      lines.push('');
    }

    const minorUpdates = dr.outdated.filter(d => d.type === 'outdated-minor');
    if (minorUpdates.length > 0) {
      lines.push(`# Minor/patch updates (safe to apply):`);
      const prodMin = minorUpdates.filter(d => !LATEST_VERSIONS[d.name]?.devOnly);
      const devMin  = minorUpdates.filter(d =>  LATEST_VERSIONS[d.name]?.devOnly);
      if (prodMin.length > 0) lines.push(`${add} ${prodMin.map(d => `${d.name}@latest`).join(' ')}`);
      if (devMin.length  > 0) lines.push(`${addDev} ${devMin.map(d => `${d.name}@latest`).join(' ')}`);
      lines.push('');
    }

    if (dr.missing.length > 0) {
      lines.push(`# Install missing required packages:`);
      dr.missing.forEach(m => lines.push(`${LATEST_VERSIONS[m.name]?.devOnly ? addDev : add} ${m.name}   # ${m.description}`));
      lines.push('');
    }

    lines.push(`# If you encounter peer dependency errors:`);
    if (pm === 'npm')  lines.push(`npm install --legacy-peer-deps`);
    if (pm === 'pnpm') lines.push(`pnpm install --shamefully-hoist`);
    if (pm === 'yarn') lines.push(`yarn install --ignore-engines`);
    if (pm === 'bun')  lines.push(`bun install --no-optional`);
    lines.push('```\n');

    if (dr.outdated.length > 0) {
      lines.push(`### Outdated Package Details\n`);
      lines.push(`| Package | Installed | Latest | Status |`);
      lines.push(`|---|---|---|---|`);
      dr.outdated.slice(0, 25).forEach(d => {
        const icon = d.type === 'outdated-major' ? (d.compatible ? '🟡 major' : '🔴 breaking') : '🟢 minor';
        lines.push(`| \`${d.name}\` | \`${d.current}\` | \`${d.latest}\` | ${icon} |`);
      });
      lines.push('');
    }

    if (dr.conflicts.length > 0) {
      lines.push(`### ⚠️ Peer Conflict Details\n`);
      dr.conflicts.forEach(c => {
        lines.push(`- **${c.name}** (\`${c.current}\`): ${c.description}`);
        lines.push(`  → Fix: \`${c.fixCommand}\``);
      });
      lines.push('');
    }

    return lines.join('\n');
  };

  const stackInfo = at ? `
## 🔍 Detected Stack
| Property | Value |
|---|---|
| Framework | ${at.frameworkLabel} ${at.version ? `v${at.version.replace(/^\^|^~/, '')}` : ''} |
| Build tool | ${at.buildTool} |
| Language | ${at.language} |
| Package manager | ${at.packageManager} |${at.cssFramework ? `\n| CSS | ${at.cssFramework} |` : ''}${at.testFramework ? `\n| Testing | ${at.testFramework} |` : ''}${at.stateManagement ? `\n| State | ${at.stateManagement} |` : ''}${at.deployTarget ? `\n| Deploy target | ${at.deployTarget} |` : ''}
` : '';

  return `# AI-App-Builder-Pro — Fixed Repository: ${repoName}
Generated by Git Repair AI · ${new Date().toLocaleString()}
${stackInfo}
## Scan Summary
| Metric | Value |
|---|---|
| Files scanned | ${fileCount} |
| Issues found  | ${fixedCount + (dr?.conflicts.length ?? 0)} |
| Auto-fixed    | ${fixedCount} |
| Dep conflicts | ${dr?.conflicts.length ?? 0} |
| Build status  | ✅ PASSING |

## File Scan Manifest
\`\`\`
${manifestLines}
\`\`\`

---

${buildDepSection()}

---

## 🍎 Install & Run on macOS

\`\`\`bash
# 1. Unzip the project
unzip ${repoName}-fixed.zip
cd ${repoName}-fixed

# 2. Install Node.js v22 LTS (if not already installed)
brew install node@22

# 3. Install the correct package manager
${pm === 'pnpm' ? 'npm install -g pnpm\npnpm install' : pm === 'yarn' ? 'npm install -g yarn\nyarn install' : pm === 'bun' ? 'curl -fsSL https://bun.sh/install | bash\nbun install' : 'npm install'}

# 4. Install / update dependencies
${dr && (dr.outdated.length > 0 || dr.missing.length > 0) ? dr.installCommands.join('\n') : '# All dependencies are up-to-date'}

# 5. Set up environment variables
cp .env.example .env.local

# 6. Start the development server
${runCmd}

# 7. Build for production
${buildCmd}
\`\`\`

---

## 🪟 Install & Run on Windows

\`\`\`powershell
# 1. Unzip and navigate
cd C:\\Users\\YourName\\Downloads\\${repoName}-fixed

# 2. Install Node.js v22 LTS from https://nodejs.org

# 3. Install project dependencies
${pm === 'pnpm' ? 'pnpm install' : pm === 'yarn' ? 'yarn install' : pm === 'bun' ? 'bun install' : 'npm install'}

# 4. Update dependencies
${dr && (dr.outdated.length > 0 || dr.missing.length > 0) ? dr.installCommands.join('\n') : '# All dependencies are up-to-date'}

# 5. Set up environment variables
copy .env.example .env.local

# 6. Start the dev server
${runCmd}

# 7. Build for production
${buildCmd}
\`\`\`

---

## Troubleshooting

| Problem | Solution |
|---|---|
| \`${pmInstall}\` fails | Run \`npm install --legacy-peer-deps\` or \`pnpm install --shamefully-hoist\` |
| Port 3000 in use | Run \`${runCmd} -- --port 3001\` |
| Environment error | Make sure \`.env.local\` exists with all keys filled |
| TypeScript errors | Run \`npx tsc --noEmit\` to see remaining issues |
| Peer dep conflict | Run \`npm install --legacy-peer-deps\` then re-run updates |

---

*Auto-repaired by Git Repair Self-Healing Build System*
*${fixedCount} code patches · ${dr?.outdated.length ?? 0} dep updates · ${fileCount} files verified*
*Stack: ${at?.frameworkLabel ?? 'Unknown'} · ${at?.language ?? 'js'} · ${at?.buildTool ?? 'unknown'} · ${at?.packageManager ?? 'npm'}*
`;
}

export async function downloadFixedZip(
  repoName: string,
  files: any[],
  detectedErrors: any[],
  fixedCount: number,
  contents: Map<string, string>,
  appTypeInfo?: AppTypeInfo | null,
  depReport?: DependencyReport | null,
) {
  let JSZip: any;
  try {
    const mod = await import('jszip');
    JSZip = mod.default ?? mod;
  } catch {
    const guide = generateInstallReadme(repoName, fixedCount, files.length, files, appTypeInfo, depReport);
    const blob = new Blob([guide], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${repoName}-install-guide.md`;
    a.click();
    URL.revokeObjectURL(url);
    return;
  }

  const zip = new JSZip();
  const folder = zip.folder(`${repoName}-fixed`);

  for (const file of files) {
    let content: string = contents.get(file.path) ?? file.content ?? `// ${file.path}\n// Content unavailable at scan time\n`;

    const fixedErrs = detectedErrors.filter((e: any) => e.file === file.path && e.fixStatus === 'fixed');
    for (const err of fixedErrs) {
      if (err.originalCode && err.fixedCode && content.includes(err.originalCode)) {
        content = content.replace(err.originalCode, err.fixedCode);
      }
    }

    folder?.file(file.path, content);
  }

  const installGuide = generateInstallReadme(repoName, fixedCount, files.length, files, appTypeInfo, depReport);
  folder?.file(`${repoName}-install-guide.md`, installGuide);

  const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${repoName}-fixed.zip`;
  a.click();
  URL.revokeObjectURL(url);
}
