// Git Repair ZIP Generator - Simple Implementation
// Uses JSZip for proper ZIP file generation

import JSZip from 'jszip';

export async function generateProjectZip(
  fixedFiles: Map<string, string>,
  newFiles: Map<string, string>,
  projectName: string
): Promise<void> {
  console.log(`[ZIP Generator] Starting ZIP generation...`);
  console.log(`[ZIP Generator] Fixed/Original files: ${fixedFiles.size}`);
  console.log(`[ZIP Generator] New files: ${newFiles.size}`);
  console.log(`[ZIP Generator] Total files: ${fixedFiles.size + newFiles.size}`);
  
  try {
    console.log(`[ZIP Generator] Using JSZip library...`);
    
    const zip = new JSZip();
    let filesAdded = 0;
    
    // Add fixed/original files
    console.log(`[ZIP Generator] Adding ${fixedFiles.size} fixed/original files...`);
    fixedFiles.forEach((content, filePath) => {
      const cleanPath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
      if (content && content.trim().length > 0) {
        zip.file(cleanPath, content);
        filesAdded++;
        if (filesAdded <= 5) {
          console.log(`[ZIP Generator] ✓ Added: ${cleanPath} (${content.length} bytes)`);
        }
      } else {
        console.warn(`[ZIP Generator] ⚠️ Skipping empty file: ${cleanPath}`);
      }
    });
    
    // Add new files
    console.log(`[ZIP Generator] Adding ${newFiles.size} new files...`);
    newFiles.forEach((content, filePath) => {
      const cleanPath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
      if (content && content.trim().length > 0) {
        zip.file(cleanPath, content);
        filesAdded++;
        console.log(`[ZIP Generator] ✓ Added new: ${cleanPath} (${content.length} bytes)`);
      } else {
        console.warn(`[ZIP Generator] ⚠️ Skipping empty new file: ${cleanPath}`);
      }
    });
    
    // Add README with repair summary
    const readme = generateReadme(fixedFiles, newFiles);
    zip.file('GIT_REPAIR_SUMMARY.md', readme);
    filesAdded++;
    
    console.log(`[ZIP Generator] ✅ Total files added to ZIP: ${filesAdded}`);
    console.log(`[ZIP Generator] Generating ZIP blob...`);
    
    // Generate ZIP blob
    const blob = await zip.generateAsync({ 
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    });
    
    console.log(`[ZIP Generator] ✅ ZIP blob generated: ${(blob.size / 1024 / 1024).toFixed(2)} MB`);
    
    // Create download link
    const filename = `${projectName}-repaired-${Date.now()}.zip`;
    downloadBlob(blob, filename);
    console.log(`[ZIP Generator] ✅ ZIP download initiated: ${filename}`);
  } catch (error) {
    console.error('ZIP generation error:', error);
    throw new Error(`Failed to generate ZIP: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  
  // Cleanup
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}

function generateReadme(fixedFiles: Map<string, string>, newFiles: Map<string, string>): string {
  const fixedList = Array.from(fixedFiles.keys()).length > 0
    ? Array.from(fixedFiles.keys()).map((file, i) => `${i + 1}. \`${file}\``).join('\n')
    : 'None';
    
  const newList = Array.from(newFiles.keys()).length > 0
    ? Array.from(newFiles.keys()).map((file, i) => `${i + 1}. \`${file}\``).join('\n')
    : 'None';

  return `# Git Repair - Repaired Project

**Generated:** ${new Date().toLocaleString()}
**Total Files:** ${fixedFiles.size + newFiles.size}

---

## 📦 Package Contents

This ZIP archive contains your complete repaired project with all files.

### 📁 All Project Files (${fixedFiles.size})

This includes:
- ✅ **Fixed files** - Files that had errors and were repaired
- 📄 **Original files** - Files that had no errors (unchanged)

${fixedList}

### ✨ New Files Created (${newFiles.size})

These files were automatically generated to fix missing dependencies:

${newList}

---

## 🚀 How to Use This Package

1. **Extract the ZIP** to your desired location
2. **Navigate to the folder**: \`cd ${fixedFiles.size > 0 ? Array.from(fixedFiles.keys())[0].split('/')[0] : 'project'}\`
3. **Install dependencies**: \`npm install\`
4. **Run the project**: \`npm run dev\`
5. **Test thoroughly** before deploying to production

---

## 🧠 Repair Information

- **System:** Git Repair - Self-Healing Build System
- **AI Agents:** 12-Agent Autonomous Brain
- **Original Files:** ${fixedFiles.size} (includes both fixed and unchanged)
- **New Files:** ${newFiles.size}
- **Total Package:** ${fixedFiles.size + newFiles.size} files
- **Repair Date:** ${new Date().toLocaleDateString()}

---

## 📋 What's Included

✅ **ALL original repository files** (whether fixed or not)  
✅ **All AI-repaired files** with fixes applied  
✅ **All auto-generated files** to resolve missing dependencies  
✅ **This summary file** explaining the contents  

---

## ⚠️ Important Notes

- **Review changes before deploying** - Check fixed files match your expectations
- **Test the build** - Run \`npm run build\` to verify everything works
- **Keep backups** - Always maintain a backup of your original code
- **Check dependencies** - Run \`npm install\` to ensure all packages are installed

---

_Generated by Git Repair AI - Autonomous Code Repair System_
_No AI credits required for pattern-based fixes!_
`;
}

// Generate individual file with missing dependencies
export function generateMissingFile(fileName: string, dependencies: string[]): string {
  const ext = fileName.split('.').pop()?.toLowerCase();
  
  if (ext === 'tsx' || ext === 'jsx') {
    const componentName = fileName.split('/').pop()?.replace(/\.(tsx|jsx)$/, '') || 'Component';
    return `import React from 'react';

// Auto-generated by Git Repair
// This file was missing and has been created to resolve dependencies

${dependencies.map(dep => `// Required by: ${dep}`).join('\n')}

export default function ${componentName}() {
  return (
    <div className="p-4">
      <h1 className="text-xl font-bold">Auto-Generated Component</h1>
      <p className="text-gray-600">This component was created by Git Repair to resolve missing dependencies.</p>
      <p className="text-sm text-gray-500 mt-2">File: {fileName}</p>
    </div>
  );
}
`;
  } else if (ext === 'ts' || ext === 'js') {
    return `// Auto-generated by Git Repair
// This file was missing and has been created to resolve dependencies

${dependencies.map(dep => `// Required by: ${dep}`).join('\n')}

export function placeholder() {
  return 'This is an auto-generated placeholder function';
}

export default {};
`;
  } else if (ext === 'css') {
    return `/* Auto-generated by Git Repair */
/* This file was missing and has been created to resolve dependencies */

${dependencies.map(dep => `/* Required by: ${dep} */`).join('\n')}

.container {
  /* Add your styles here */
}
`;
  }
  
  return `// Auto-generated by Git Repair
// This file was missing and has been created to resolve dependencies

${dependencies.map(dep => `// Required by: ${dep}`).join('\n')}
`;
}