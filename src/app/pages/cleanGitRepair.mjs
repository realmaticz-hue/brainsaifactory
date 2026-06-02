#!/usr/bin/env node
/**
 * cleanGitRepair.mjs
 * One-shot script to remove dead code from GitRepair.tsx that was causing
 * the Babel "deoptimised styling" warning (file exceeds 500KB).
 *
 * Usage:  node pages/cleanGitRepair.mjs
 *
 * What it removes (lines 72-911 in the original file):
 *   - _DEAD_HYDRATION_PATTERNS array
 *   - _unused_detectCircularDependencies function
 *   - SECRET_PATTERNS array
 *   - PERF_PATTERNS array
 *   - _unused_parseBuildErrorLog function
 *   - _unused_detectTurbopackConfig function
 *   - _unused_analyzeDependencies function
 *   - __DELETED_tw_stub__ function
 *
 * All of these were already moved to ./gitRepairAnalyzers.ts and are
 * imported from there; the stubs in this file are pure dead code.
 *
 * The script uses simple indexOf/slice string operations — no regex —
 * so backslash sequences in the dead code cause no ambiguity.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const filePath = resolve(__dirname, 'GitRepair.tsx');

console.log(`Reading ${filePath} …`);
let content = readFileSync(filePath, 'utf8');
const originalSize = Buffer.byteLength(content, 'utf8');
console.log(`  Original size: ${(originalSize / 1024).toFixed(1)} KB`);

// ── Markers ────────────────────────────────────────────────────────────────
// Start of the dead section (first line of _DEAD_HYDRATION_PATTERNS comment)
const DEAD_SECTION_START =
  '// _HYDRATION_PATTERNS_REMOVED fully removed — patterns live in ./gitRepairAnalyzers';

// First line of the live code immediately after the dead section
const DEAD_SECTION_END = 'function makeErrors(): DetectedError[] {';

// ── Locate the bounds ──────────────────────────────────────────────────────
const startIdx = content.indexOf(DEAD_SECTION_START);
if (startIdx === -1) {
  console.log('✅  Dead section start marker not found — file may already be clean.');
  process.exit(0);
}

const endIdx = content.indexOf(DEAD_SECTION_END, startIdx);
if (endIdx === -1) {
  console.error('❌  Dead section end marker not found — aborting to avoid corrupting the file.');
  process.exit(1);
}

// Remove everything from DEAD_SECTION_START up to (but not including) DEAD_SECTION_END.
// We also trim any trailing whitespace/blank lines left at the splice point.
const before = content.slice(0, startIdx).replace(/\n+$/, '\n\n');
const after   = content.slice(endIdx);

content = before + after;

// ── Write back ─────────────────────────────────────────────────────────────
writeFileSync(filePath, content, 'utf8');
const newSize = Buffer.byteLength(content, 'utf8');
console.log(`  Cleaned size : ${(newSize / 1024).toFixed(1)} KB`);
console.log(`  Removed      : ${((originalSize - newSize) / 1024).toFixed(1)} KB of dead code`);

if (newSize < 500 * 1024) {
  console.log('✅  File is now under 500 KB — Babel deoptimised styling warning will be gone.');
} else {
  console.log(`⚠️   File is still ${(newSize / 1024).toFixed(1)} KB (> 500 KB).`);
  console.log('    Consider extracting large tab components into separate files.');
}
