#!/usr/bin/env node
/**
 * fixLine127.mjs
 * Fixes the broken regex fragment on line 127 of GitRepair.tsx
 * 
 * Usage: node pages/fixLine127.mjs
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const filePath = resolve(__dirname, 'GitRepair.tsx');

console.log(`Reading ${filePath} …`);
const content = readFileSync(filePath, 'utf8');
const lines = content.split('\n');

console.log(`Total lines: ${lines.length}`);

// Line 127 (0-indexed as 126) has broken regex at the end
const lineIndex = 126;
const originalLine = lines[lineIndex];

console.log(`Original line 127: "${originalLine}"`);

// Check if it contains the broken regex fragment
if (originalLine && originalLine.includes('](\\.[^')) {
  // Find the position where the broken part starts (after the proper comment)
  const brokenPartStart = originalLine.indexOf('](\\.[^');
  if (brokenPartStart !== -1) {
    // Keep only the clean comment part
    lines[lineIndex] = originalLine.substring(0, brokenPartStart);
    
    writeFileSync(filePath, lines.join('\n'), 'utf8');
    console.log(`✅ Fixed line 127`);
    console.log(`New line 127: "${lines[lineIndex]}"`);
  } else {
    console.log('⚠️  Broken fragment not found at expected position');
  }
} else {
  console.log('✅  Line 127 appears to be already fixed or doesn\'t match expected pattern');
}
