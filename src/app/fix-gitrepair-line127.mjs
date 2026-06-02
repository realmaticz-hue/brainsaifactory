// Temporary script to fix the broken line 127 in GitRepair.tsx
import { readFileSync, writeFileSync } from 'fs';

const filePath = './pages/GitRepair.tsx';
const content = readFileSync(filePath, 'utf8');
const lines = content.split('\n');

// Line 127 (0-indexed as 126) has broken regex code at the end
// We just need to remove everything after "───────" on that line
if (lines[126] && lines[126].includes('].(\\.')) {
  // Remove the broken regex fragment
  const fixed = lines[126].split('───────')[0] + '───────';
  lines[126] = fixed;
  
  writeFileSync(filePath, lines.join('\n'), 'utf8');
  console.log('✅ Fixed line 127 in GitRepair.tsx');
} else {
  console.log('⚠️  Line 127 doesn't match expected pattern or was already fixed');
}
