#!/usr/bin/env node
/**
 * Clean GitRepair.tsx - removes dead code section
 */

import { readFileSync, writeFileSync } from 'node:fs';

const filePath = '/tmp/pages-GitRepair.tsx';

// Read the GitRepair.tsx file content from stdin or construct manually
const fs = await import('node:fs');
const content = readFileSync('./pages/GitRepair.tsx', 'utf8');

// Markers
const DEAD_SECTION_START =
  '// _HYDRATION_PATTERNS_REMOVED fully removed — patterns live in ./gitRepairAnalyzers';
const DEAD_SECTION_END = 'function makeErrors(): DetectedError[] {';

// Find positions
const startIdx = content.indexOf(DEAD_SECTION_START);
const endIdx = content.indexOf(DEAD_SECTION_END, startIdx);

if (startIdx === -1 || endIdx === -1) {
  console.log('Markers not found - file may already be clean');
  process.exit(0);
}

// Remove the dead section
const before = content.slice(0, startIdx).replace(/\n+$/, '\n\n');
const after = content.slice(endIdx);
const cleaned = before + after;

// Write back
writeFileSync('./pages/GitRepair.tsx', cleaned, 'utf8');
console.log('✅ Dead code removed from GitRepair.tsx');
