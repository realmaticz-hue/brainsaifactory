// ── Repository Genome Scanner ────────────────────────────────────────────────
// Scans uploaded project to detect framework, dependencies, and context

export interface ProjectGenome {
  framework: string;             // react, vue, angular, vanilla
  language: string;              // typescript, javascript
  runtime?: string;              // node, deno, bun
  packageManager?: string;       // npm, yarn, pnpm
  buildSystem?: string;          // vite, webpack, rollup, esbuild
  testFramework?: string;        // jest, vitest, playwright
  styling?: string[];            // tailwind, styled-components, sass
  stateManagement?: string;      // redux, zustand, mobx
  routing?: string;              // react-router, next, remix
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  hasTypeScript: boolean;
  hasTailwind: boolean;
  folderStructure: {
    hasSrc: boolean;
    hasPages: boolean;
    hasComponents: boolean;
    hasPublic: boolean;
  };
  scannedAt: number;
}

/**
 * Scan uploaded files to generate project genome
 * Memory-optimized version with chunking and limits
 */
export function scanProjectGenome(files: Map<string, string>): ProjectGenome {
  console.log(`[ProjectGenome] 🧬 Scanning ${files.size} files...`);
  
  // Memory limit: Only scan essential files
  const MAX_FILE_SIZE = 500000; // 500KB per file
  const MAX_TOTAL_FILES = 1000; // Limit number of files to scan
  
  const genome: ProjectGenome = {
    framework: 'unknown',
    language: 'javascript',
    dependencies: {},
    devDependencies: {},
    hasTypeScript: false,
    hasTailwind: false,
    folderStructure: {
      hasSrc: false,
      hasPages: false,
      hasComponents: false,
      hasPublic: false
    },
    scannedAt: Date.now()
  };
  
  // ═══ Scan package.json ═══
  const packageJsonContent = files.get('package.json');
  if (packageJsonContent) {
    try {
      // Limit package.json size
      if (packageJsonContent.length > MAX_FILE_SIZE) {
        console.warn(`[ProjectGenome] package.json too large (${packageJsonContent.length} bytes), truncating...`);
      }
      
      const pkg = JSON.parse(packageJsonContent.substring(0, MAX_FILE_SIZE));
      
      genome.dependencies = pkg.dependencies || {};
      genome.devDependencies = pkg.devDependencies || {};
      
      // Detect framework
      if (genome.dependencies.react || genome.devDependencies.react) {
        genome.framework = 'react';
      } else if (genome.dependencies.vue || genome.devDependencies.vue) {
        genome.framework = 'vue';
      } else if (genome.dependencies['@angular/core']) {
        genome.framework = 'angular';
      } else if (genome.dependencies.svelte || genome.devDependencies.svelte) {
        genome.framework = 'svelte';
      } else {
        genome.framework = 'vanilla';
      }
      
      // Detect package manager from lock files
      if (files.has('package-lock.json')) {
        genome.packageManager = 'npm';
      } else if (files.has('yarn.lock')) {
        genome.packageManager = 'yarn';
      } else if (files.has('pnpm-lock.yaml')) {
        genome.packageManager = 'pnpm';
      } else if (files.has('bun.lockb')) {
        genome.packageManager = 'bun';
      }
      
      // Detect build system
      if (genome.devDependencies.vite || pkg.scripts?.dev?.includes('vite')) {
        genome.buildSystem = 'vite';
      } else if (genome.devDependencies.webpack) {
        genome.buildSystem = 'webpack';
      } else if (genome.devDependencies.rollup) {
        genome.buildSystem = 'rollup';
      } else if (genome.devDependencies.esbuild) {
        genome.buildSystem = 'esbuild';
      }
      
      // Detect test framework
      if (genome.devDependencies.jest) {
        genome.testFramework = 'jest';
      } else if (genome.devDependencies.vitest) {
        genome.testFramework = 'vitest';
      } else if (genome.devDependencies['@playwright/test']) {
        genome.testFramework = 'playwright';
      } else if (genome.devDependencies.cypress) {
        genome.testFramework = 'cypress';
      }
      
      // Detect styling
      const styling: string[] = [];
      if (genome.dependencies.tailwindcss || genome.devDependencies.tailwindcss) {
        styling.push('tailwind');
        genome.hasTailwind = true;
      }
      if (genome.dependencies['styled-components']) {
        styling.push('styled-components');
      }
      if (genome.dependencies.sass || genome.devDependencies.sass) {
        styling.push('sass');
      }
      if (styling.length > 0) {
        genome.styling = styling;
      }
      
      // Detect state management
      if (genome.dependencies.redux || genome.dependencies['@reduxjs/toolkit']) {
        genome.stateManagement = 'redux';
      } else if (genome.dependencies.zustand) {
        genome.stateManagement = 'zustand';
      } else if (genome.dependencies.mobx) {
        genome.stateManagement = 'mobx';
      } else if (genome.dependencies.jotai) {
        genome.stateManagement = 'jotai';
      }
      
      // Detect routing
      if (genome.dependencies['react-router'] || genome.dependencies['react-router-dom']) {
        genome.routing = 'react-router';
      } else if (genome.dependencies.next) {
        genome.routing = 'next';
      } else if (genome.dependencies['@remix-run/react']) {
        genome.routing = 'remix';
      } else if (genome.dependencies['vue-router']) {
        genome.routing = 'vue-router';
      }
      
    } catch (e) {
      console.error('[ProjectGenome] Failed to parse package.json:', e);
    }
  }
  
  // ═══ Detect TypeScript ═══
  genome.hasTypeScript = files.has('tsconfig.json');
  
  // Only scan file extensions if we haven't found TypeScript config (lightweight check)
  if (!genome.hasTypeScript) {
    let tsFileCount = 0;
    const keys = Array.from(files.keys());
    // Limit iteration to prevent memory issues
    const keysToCheck = keys.slice(0, Math.min(MAX_TOTAL_FILES, keys.length));
    
    for (const key of keysToCheck) {
      if (key.endsWith('.ts') || key.endsWith('.tsx')) {
        genome.hasTypeScript = true;
        break; // Early exit once found
      }
    }
  }
  
  if (genome.hasTypeScript) {
    genome.language = 'typescript';
  }
  
  // ═══ Detect folder structure (lightweight - just check paths) ═══
  const paths = Array.from(files.keys()).slice(0, Math.min(MAX_TOTAL_FILES, files.size));
  genome.folderStructure.hasSrc = paths.some(p => p.startsWith('src/'));
  genome.folderStructure.hasPages = paths.some(p => p.includes('/pages/'));
  genome.folderStructure.hasComponents = paths.some(p => p.includes('/components/'));
  genome.folderStructure.hasPublic = paths.some(p => p.startsWith('public/'));
  
  // ═══ Detect runtime ═══
  if (files.has('deno.json') || files.has('deno.jsonc')) {
    genome.runtime = 'deno';
  } else if (files.has('bun.lockb')) {
    genome.runtime = 'bun';
  } else {
    genome.runtime = 'node';
  }
  
  console.log(`[ProjectGenome] ✅ Detected: ${genome.framework} + ${genome.language} + ${genome.buildSystem || 'unknown build'}`);
  console.log(`[ProjectGenome]   - Dependencies: ${Object.keys(genome.dependencies).length}`);
  console.log(`[ProjectGenome]   - Has TypeScript: ${genome.hasTypeScript}`);
  console.log(`[ProjectGenome]   - Has Tailwind: ${genome.hasTailwind}`);
  
  return genome;
}

/**
 * Get a human-readable summary of the project genome
 */
export function getGenomeSummary(genome: ProjectGenome): string {
  const parts: string[] = [];
  
  parts.push(`Framework: ${genome.framework}`);
  parts.push(`Language: ${genome.language}`);
  
  if (genome.buildSystem) {
    parts.push(`Build: ${genome.buildSystem}`);
  }
  
  if (genome.routing) {
    parts.push(`Routing: ${genome.routing}`);
  }
  
  if (genome.stateManagement) {
    parts.push(`State: ${genome.stateManagement}`);
  }
  
  if (genome.styling && genome.styling.length > 0) {
    parts.push(`Styling: ${genome.styling.join(', ')}`);
  }
  
  return parts.join(' | ');
}

/**
 * Check if a repair pattern is compatible with this project
 */
export function isRepairCompatible(
  genome: ProjectGenome,
  repairFramework?: string,
  repairLanguage?: string
): boolean {
  // If repair has no framework requirement, it's universal
  if (!repairFramework) return true;
  
  // Check framework match
  if (repairFramework && repairFramework !== genome.framework) {
    return false;
  }
  
  // Check language compatibility (TS can use JS patterns, but not vice versa)
  if (repairLanguage === 'typescript' && genome.language === 'javascript') {
    return false;
  }
  
  return true;
}