import { readFileSync, writeFileSync } from 'fs';

// Read the file
const filePath = './pages/GitRepair.tsx';
let content = readFileSync(filePath, 'utf8');

// Replace the problematic line 128
// The line contains: // ─── ESM / CommonJS Mixing Detector imported from ./gitRepairAnalyzers ───────](\\.[^'\"]+)['\"]/);\n
// We want to remove the malformed part at the end: ](\\.[^'\"]+)['\"]/);\n

content = content.replace(
  /\/\/ ─── ESM \/ CommonJS Mixing Detector imported from \.\/gitRepairAnalyzers ───────\]\(\\\\\.\[\^'"]\+\)\['"\]\/\);/g,
  '// ─── ESM / CommonJS Mixing Detector imported from ./gitRepairAnalyzers ───────'
);

// Also remove the duplicate line 129 if it exists
const lines = content.split('\n');
const fixedLines = [];
let skipNext = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // Check if this is line with the malformed code
  if (line.includes('](\\\\.') && line.includes('[\'\"]/)')) {
    // Skip this line entirely
    continue;
  }
  
  // Check for duplicate ESM comment lines
  if (line.trim() === '// ─── ESM / CommonJS Mixing Detector imported from ./gitRepairAnalyzers ───────') {
    // Only keep first occurrence
    if (!fixedLines.some(l => l.trim() === '// ─── ESM / CommonJS Mixing Detector imported from ./gitRepairAnalyzers ───────' && 
                                l.indexOf('_unused') === -1)) {
      fixedLines.push(line);
    }
  } else {
    fixedLines.push(line);
  }
}

// Write back
writeFileSync(filePath, fixedLines.join('\n'), 'utf8');
console.log('Fixed GitRepair.tsx line 128');
