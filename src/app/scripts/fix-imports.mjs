#!/usr/bin/env node

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * FIX-IMPORTS — Figma Make → Standard Node/Vite Import Migration
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Figma Make uses a custom import syntax:
 *   import { toast } from 'sonner'
 *   import * as X from '@radix-ui/react-dialog@1.1.6'
 *
 * Standard bundlers (Vite, Webpack) expect:
 *   import { toast } from 'sonner'
 *   import * as X from '@radix-ui/react-dialog'
 *
 * This script scans all .ts/.tsx files (excluding node_modules, supabase/functions)
 * and rewrites the versioned imports to standard imports.
 *
 * Usage:
 *   node scripts/fix-imports.mjs          # dry-run (shows what would change)
 *   node scripts/fix-imports.mjs --apply  # actually write changes
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

const DRY_RUN = !process.argv.includes('--apply');

if (DRY_RUN) {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║  DRY RUN — no files will be changed.                       ║');
  console.log('║  Run with --apply to write changes:                        ║');
  console.log('║    node scripts/fix-imports.mjs --apply                    ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log();
}

// ── Pattern: match versioned package imports ──────────────────────────────────
// Handles:
//   from "sonner"       → from "sonner"
//   from '@radix-ui/react-dialog@1.1.6'  → from '@radix-ui/react-dialog'
//   from "class-variance-authority@0.7.1" → from "class-variance-authority"
//   from "next-themes@0.4.6"  → from "next-themes"
//
// Does NOT touch:
//   from './components/foo'   (relative paths)
//   from 'react'              (no version)
//   Deno imports like jsr: or npm: (supabase dir is excluded anyway)

// Regex: captures `from "package@version"` or `from 'package@version'`
// Package names can be scoped (@org/name) or unscoped (name)
// Version is semver-like: digits, dots, hyphens, alpha
const VERSIONED_IMPORT_RE =
  /(from\s+['"])(@?[a-zA-Z0-9][\w./-]*)@(\d+[\w.\-]*)(['"])/g;

// ── Find all source files ────────────────────────────────────────────────────

const rootDir = path.resolve(process.cwd());

const files = await glob('**/*.{ts,tsx}', {
  cwd: rootDir,
  ignore: [
    'node_modules/**',
    'dist/**',
    'supabase/functions/**',
    'scripts/**',
    '.git/**',
  ],
  absolute: true,
});

console.log(`Scanning ${files.length} source files...\n`);

let totalFiles = 0;
let totalReplacements = 0;

for (const filePath of files) {
  const original = fs.readFileSync(filePath, 'utf8');
  let modified = original;
  let fileReplacements = 0;

  modified = modified.replace(VERSIONED_IMPORT_RE, (match, prefix, pkg, version, suffix) => {
    fileReplacements++;
    totalReplacements++;
    const before = `${prefix}${pkg}@${version}${suffix}`;
    const after = `${prefix}${pkg}${suffix}`;
    const rel = path.relative(rootDir, filePath);
    console.log(`  ${rel}`);
    console.log(`    - ${before}`);
    console.log(`    + ${after}`);
    return after;
  });

  if (fileReplacements > 0) {
    totalFiles++;
    if (!DRY_RUN) {
      fs.writeFileSync(filePath, modified, 'utf8');
    }
  }
}

console.log();
console.log('════════════════════════════════════════════════════════════════');
console.log(`  ${totalReplacements} import(s) in ${totalFiles} file(s) ${DRY_RUN ? 'would be fixed' : 'FIXED'}.`);
console.log('════════════════════════════════════════════════════════════════');

if (DRY_RUN && totalReplacements > 0) {
  console.log();
  console.log('  Run with --apply to write changes:');
  console.log('    node scripts/fix-imports.mjs --apply');
}

if (!DRY_RUN && totalReplacements > 0) {
  console.log();
  console.log('  All imports fixed! You can now run:');
  console.log('    npm run dev');
}
