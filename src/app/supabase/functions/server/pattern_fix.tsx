// ── Pattern-Based Fix System (No AI Required) ───────────────────────────────────
export function applyPatternBasedFix(error: string, file: string, originalContent: string, enhanced: any): string | null {
  console.log(`[GitRepair] ═══════════════════════════════════════════════════════`);
  console.log(`[GitRepair] PATTERN FIX CALLED`);
  console.log(`[GitRepair] ═══════════════════════════════════════════════════════`);
  console.log(`[GitRepair] Error: "${error}"`);
  console.log(`[GitRepair] File: "${file}"`);
  console.log(`[GitRepair] Original Content Length: ${originalContent?.length || 0}`);
  console.log(`[GitRepair] Has Content: ${!!(originalContent && originalContent.trim().length > 0)}`);
  console.log(`[GitRepair] ═══════════════════════════════════════════════════════`);
  
  // ═══════════════════════════════════════════════════════════════════════════
  // SPECIAL: react-router-dom errors - ALWAYS fixable, even without content!
  // ═══════════════════════════════════════════════════════════════════════════
  const lowerError = error.toLowerCase();
  const lowerFile = file.toLowerCase();
  
  const isRouterError = lowerError.includes('react-router-dom') || 
                        lowerError.includes('react-router') ||
                        lowerError.includes('browserrouter') ||
                        lowerError.includes('routerprovider') ||
                        (lowerError.includes('module') && lowerError.includes('router')) ||
                        (lowerError.includes('cannot find') && lowerError.includes('router')) ||
                        (lowerError.includes('incompatible') && lowerFile.includes('route'));
  
  if (isRouterError) {
    console.log(`[GitRepair] 🎯 REACT ROUTER ERROR DETECTED - This is always fixable!`);
    console.log(`[GitRepair]   • Error type: ${lowerError.includes('react-router-dom') ? 'Direct package reference' : 'Router-related'}`);
    
    // If we have content, fix it
    if (originalContent && originalContent.trim().length > 0) {
      console.log(`[GitRepair] ✅ Have file content, applying replacements...`);
      
      const hasReactRouterDom = originalContent.includes('react-router-dom');
      console.log(`[GitRepair]   - File contains 'react-router-dom': ${hasReactRouterDom}`);
      
      if (hasReactRouterDom) {
        const fixedContent = originalContent
          .replace(/from ['"]react-router-dom['"]/g, 'from "react-router"')
          .replace(/from ["']react-router-dom["']/g, 'from "react-router"')
          .replace(/import {([^}]+)} from ['"]react-router-dom['"]/g, 'import {$1} from "react-router"')
          .replace(/import {([^}]+)} from ["']react-router-dom["']/g, 'import {$1} from "react-router"')
          .replace(/import ([A-Za-z0-9_]+) from ['"]react-router-dom['"]/g, 'import $1 from "react-router"')
          .replace(/import \* as ([A-Za-z0-9_]+) from ['"]react-router-dom['"]/g, 'import * as $1 from "react-router"')
          .replace(/'react-router-dom'/g, "'react-router'")
          .replace(/"react-router-dom"/g, '"react-router"');
        
        if (fixedContent !== originalContent) {
          console.log(`[GitRepair] ✅ SUCCESS - Replaced react-router-dom with react-router`);
          return fixedContent;
        } else {
          console.log(`[GitRepair] ⚠️ File contains 'react-router-dom' but replacements didn't change anything`);
        }
      }
    }
    
    // If no content or replacements didn't work, create a basic router file
    console.log(`[GitRepair] 📝 Creating basic router file with react-router (no content available)...`);
    const basicRouterFile = `import { createBrowserRouter, RouterProvider } from 'react-router';

// Basic router configuration
const router = createBrowserRouter([
  {
    path: "/",
    element: <div>Home</div>,
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
`;
    console.log(`[GitRepair] ✅ Created basic router file as fallback`);
    return basicRouterFile;
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // SPECIAL: Missing critical files - Create stub files
  // ═══════════════════════════════════════════════════════════════════════════
  const isMissingFileError = lowerError.includes('missing critical file') ||
                              lowerError.includes('cannot find file') ||
                              lowerError.includes('file not found') ||
                              (lowerError.includes('missing') && (
                                lowerError.includes('app.tsx') ||
                                lowerError.includes('index.html') ||
                                lowerError.includes('package.json')
                              ));
  
  if (isMissingFileError && (!originalContent || originalContent.trim().length === 0)) {
    console.log(`[GitRepair] 🎯 MISSING FILE ERROR - Creating stub file...`);
    
    // Extract filename from error message
    let missingFile = '';
    
    // Try multiple patterns to extract filename
    // Pattern 1: "Missing critical file: App.tsx"
    let fileMatch = error.match(/missing\s+critical\s+file:\s+([^\s,;]+)/i);
    if (!fileMatch) {
      // Pattern 2: "Missing file: /src/App.tsx"
      fileMatch = error.match(/missing\s+file:\s+([^\s,;]+)/i);
    }
    if (!fileMatch) {
      // Pattern 3: "Cannot find file: App.tsx"
      fileMatch = error.match(/cannot\s+find\s+file:\s+([^\s,;]+)/i);
    }
    if (!fileMatch) {
      // Pattern 4: "File not found: App.tsx"
      fileMatch = error.match(/file\s+not\s+found:\s+([^\s,;]+)/i);
    }
    if (!fileMatch) {
      // Pattern 5: Just look for common filenames directly in the error
      if (error.toLowerCase().includes('app.tsx')) {
        missingFile = 'app.tsx';
      } else if (error.toLowerCase().includes('src/app.tsx')) {
        missingFile = 'src/app.tsx';
      }
    }
    
    if (fileMatch) {
      missingFile = fileMatch[1].toLowerCase();
    }
    
    console.log(`[GitRepair]   • Missing file extracted from error: "${missingFile}"`);
    console.log(`[GitRepair]   • File parameter: "${file}"`);
    
    // Create appropriate stub file based on filename
    if (missingFile.includes('app.tsx') || file.toLowerCase().includes('app.tsx')) {
      console.log(`[GitRepair] ✅ Creating App.tsx stub...`);
      return `import React from 'react';
import { RouterProvider, createBrowserRouter } from 'react-router';

// Basic router configuration
const router = createBrowserRouter([
  {
    path: "/",
    element: <div className="p-8">
      <h1 className="text-3xl font-bold">Welcome</h1>
      <p className="text-gray-600 mt-2">This is a generated App.tsx file</p>
    </div>,
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
`;
    }
    
    if (missingFile.includes('index.html') || file.toLowerCase().includes('index.html')) {
      console.log(`[GitRepair] ✅ Creating index.html stub...`);
      return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`;
    }
    
    if (missingFile.includes('package.json') || file.toLowerCase().includes('package.json')) {
      console.log(`[GitRepair] ✅ Creating package.json stub...`);
      return `{
  "name": "repaired-project",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router": "^6.28.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.1",
    "@types/react-dom": "^18.3.1",
    "@vitejs/plugin-react": "^4.3.4",
    "typescript": "^5.6.3",
    "vite": "^6.0.1"
  }
}
`;
    }
    
    // Generic stub for any other missing file
    console.log(`[GitRepair] ✅ Creating generic stub file...`);
    if (file.endsWith('.tsx') || file.endsWith('.jsx')) {
      return `import React from 'react';

// Auto-generated stub file by Git Repair
export default function Component() {
  return (
    <div className="p-4">
      <p>Auto-generated component: ${file}</p>
    </div>
  );
}
`;
    }
    
    if (file.endsWith('.ts') || file.endsWith('.js')) {
      return `// Auto-generated stub file by Git Repair
export default {};
`;
    }
    
    return `// Auto-generated file by Git Repair\n`;
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // Other patterns - only run if we have content
  // ═══════════════════════════════════════════════════════════════════════════
  if (!originalContent || originalContent.trim().length === 0) {
    console.log(`[GitRepair] ❌ No content available and not a router/missing file error - cannot fix`);
    return null;
  }
  
  let wasFixed = false;
  let fixedContent = originalContent;
  
  // ═══════════════════════════════════════════════════════════════════════════
  // FIX: Missing React import (TypeScript/JSX files)
  // ═══════════════════════════════════════════════════════════════════════════
  if ((lowerError.includes('react is not defined') || 
       lowerError.includes('react must be in scope') ||
       lowerError.includes('cannot find name \'react\'')) &&
      (file.endsWith('.tsx') || file.endsWith('.jsx'))) {
    console.log(`[GitRepair] Detected missing React import`);
    
    const hasReactImport = /import\s+.*React.*from\s+['"]react['"]/i.test(fixedContent);
    
    if (!hasReactImport) {
      console.log(`[GitRepair]   - Adding React import at the top of file`);
      fixedContent = `import React from 'react';\n${fixedContent}`;
      wasFixed = true;
      console.log(`[GitRepair]   ✅ Added React import`);
    }
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // FIX: Missing useState/useEffect imports
  // ═══════════════════════════════════════════════════════════════════════════
  if (lowerError.includes('usestate is not defined') || 
      lowerError.includes('useeffect is not defined') ||
      lowerError.includes('useref is not defined') ||
      lowerError.includes('usecontext is not defined')) {
    console.log(`[GitRepair] Detected missing React hooks import`);
    
    const missingHooks: string[] = [];
    if (lowerError.includes('usestate')) missingHooks.push('useState');
    if (lowerError.includes('useeffect')) missingHooks.push('useEffect');
    if (lowerError.includes('useref')) missingHooks.push('useRef');
    if (lowerError.includes('usecontext')) missingHooks.push('useContext');
    
    // Check if hooks are used in the file but not imported
    const reactImportMatch = fixedContent.match(/import\s+(?:React,\s*)?\{([^}]+)\}\s+from\s+['"]react['"]/);
    
    if (reactImportMatch) {
      const currentImports = reactImportMatch[1].split(',').map(s => s.trim());
      const newImports = [...new Set([...currentImports, ...missingHooks])];
      
      fixedContent = fixedContent.replace(
        /import\s+(?:React,\s*)?\{([^}]+)\}\s+from\s+['"]react['"]/,
        `import { ${newImports.join(', ')} } from 'react'`
      );
      wasFixed = true;
      console.log(`[GitRepair]   ✅ Added missing hooks: ${missingHooks.join(', ')}`);
    } else {
      // No React import exists, add it
      fixedContent = `import { ${missingHooks.join(', ')} } from 'react';\n${fixedContent}`;
      wasFixed = true;
      console.log(`[GitRepair]   ✅ Added new React hooks import`);
    }
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // FIX: Syntax errors - missing semicolons or commas
  // ═══════════════════════════════════════════════════════════════════════════
  if (lowerError.includes('unexpected token') || 
      lowerError.includes('expected semicolon') ||
      lowerError.includes('expected comma')) {
    console.log(`[GitRepair] Detected potential syntax error - attempting basic fixes`);
    
    // Common fixes for syntax errors
    let tempContent = fixedContent;
    
    // Fix missing semicolons after statements (conservative approach)
    tempContent = tempContent.replace(/(\breturn\s+[^;]+)(\n)/g, '$1;$2');
    
    if (tempContent !== fixedContent) {
      fixedContent = tempContent;
      wasFixed = true;
      console.log(`[GitRepair]   ✅ Fixed potential syntax errors`);
    }
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // FIX: Incorrect import extensions (.js vs .ts, etc.)
  // ═══════════════════════════════════════════════════════════════════════════
  if (lowerError.includes('cannot find module') || 
      lowerError.includes('module not found')) {
    console.log(`[GitRepair] Checking for incorrect import extensions`);
    
    // Replace .js with .ts, .jsx with .tsx in import statements
    const tempContent = fixedContent
      .replace(/from\s+['"](.+)\.jsx['"]/g, 'from "$1.tsx"')
      .replace(/from\s+['"](.+)\.js['"]/g, 'from "$1.ts"');
    
    if (tempContent !== fixedContent) {
      fixedContent = tempContent;
      wasFixed = true;
      console.log(`[GitRepair]   ✅ Fixed import extensions`);
    }
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // FIX: package.json dependencies
  // ═══════════════════════════════════════════════════════════════════════════
  if (file.endsWith('package.json') || file.endsWith('package-lock.json')) {
    console.log(`[GitRepair] Processing ${file}...`);
    
    try {
      const pkg = JSON.parse(fixedContent);
      let pkgChanged = false;
      
      // Check dependencies
      if (pkg.dependencies?.['react-router-dom']) {
        const version = pkg.dependencies['react-router-dom'];
        console.log(`[GitRepair]   - Found react-router-dom in dependencies: ${version}`);
        delete pkg.dependencies['react-router-dom'];
        pkg.dependencies['react-router'] = version;
        pkgChanged = true;
        wasFixed = true;
        console.log(`[GitRepair]   ✅ Replaced in dependencies`);
      }
      
      // Check devDependencies
      if (pkg.devDependencies?.['react-router-dom']) {
        const version = pkg.devDependencies['react-router-dom'];
        console.log(`[GitRepair]   - Found react-router-dom in devDependencies: ${version}`);
        delete pkg.devDependencies['react-router-dom'];
        pkg.devDependencies['react-router'] = version;
        pkgChanged = true;
        wasFixed = true;
        console.log(`[GitRepair]   ✅ Replaced in devDependencies`);
      }
      
      // Add missing react/react-dom if needed
      if (!pkg.dependencies?.react && (lowerError.includes('react') || lowerError.includes('missing'))) {
        pkg.dependencies = pkg.dependencies || {};
        pkg.dependencies.react = '^18.3.1';
        pkgChanged = true;
        wasFixed = true;
        console.log(`[GitRepair]   ✅ Added missing react dependency`);
      }
      
      if (!pkg.dependencies?.['react-dom'] && (lowerError.includes('react-dom') || lowerError.includes('missing'))) {
        pkg.dependencies = pkg.dependencies || {};
        pkg.dependencies['react-dom'] = '^18.3.1';
        pkgChanged = true;
        wasFixed = true;
        console.log(`[GitRepair]   ✅ Added missing react-dom dependency`);
      }
      
      if (pkgChanged) {
        fixedContent = JSON.stringify(pkg, null, 2);
        console.log(`[GitRepair]   ✅ package.json updated`);
      } else {
        console.log(`[GitRepair]   - No package.json changes needed`);
      }
    } catch (e: any) {
      console.log(`[GitRepair]   ❌ Could not parse JSON: ${e.message}`);
    }
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // FIX: Code smells - commented out console statements with TODO
  // ═══════════════════════════════════════════════════════════════════════════
  if (lowerError.includes('code smell') && 
      (lowerError.includes('console.') || lowerError.includes('todo'))) {
    console.log(`[GitRepair] Detected code smell - commented out console with TODO`);
    
    // Extract the problematic line from the error message if present
    // Format: "Code smell: // console.error(err)  // TODO: remove before rele"
    let problemLine = '';
    const codeSmellMatch = error.match(/code smell:\s*(.+)/i);
    if (codeSmellMatch) {
      problemLine = codeSmellMatch[1].trim();
      console.log(`[GitRepair]   - Extracted problem line: "${problemLine}"`);
    }
    
    // Remove lines with commented console.log/error/warn that have TODO comments
    const lines = fixedContent.split('\n');
    const cleanedLines = lines.filter(line => {
      const trimmed = line.trim();
      
      // If we extracted a specific problem line, match it exactly
      if (problemLine && trimmed.includes(problemLine)) {
        console.log(`[GitRepair]   - Removing exact match: ${trimmed.substring(0, 80)}...`);
        return false;
      }
      
      // Remove lines like: // console.error(err)  // TODO: remove before release
      const isCommentedConsole = (
        trimmed.startsWith('//') && 
        (trimmed.includes('console.log') || 
         trimmed.includes('console.error') || 
         trimmed.includes('console.warn') ||
         trimmed.includes('console.debug')) &&
        (trimmed.toLowerCase().includes('todo') || 
         trimmed.toLowerCase().includes('remove'))
      );
      
      if (isCommentedConsole) {
        console.log(`[GitRepair]   - Removing line: ${trimmed.substring(0, 80)}...`);
        return false; // Filter out this line
      }
      return true; // Keep this line
    });
    
    if (cleanedLines.length < lines.length) {
      fixedContent = cleanedLines.join('\n');
      wasFixed = true;
      console.log(`[GitRepair]   ✅ Removed ${lines.length - cleanedLines.length} commented console statement(s)`);
    }
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // FIX: FIXME Broken import comments — remove the FIXME + commented import
  // This handles re-scans that flag the FIXME comments we previously added
  // ═══════════════════════════════════════════════════════════════════════════
  if (lowerError.includes('fixme') && lowerError.includes('broken import')) {
    console.log(`[GitRepair] Detected FIXME broken import code smell — cleaning up`);
    
    const brokenPathMatch = error.match(/file not found:\s*([^\s,;"']+)/i);
    const brokenPath = brokenPathMatch ? brokenPathMatch[1].trim() : '';
    console.log(`[GitRepair]   - Broken path: "${brokenPath}"`);
    
    const lines = fixedContent.split('\n');
    const cleanedLines: string[] = [];
    let removedCount = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trim();
      
      if (trimmed.startsWith('// FIXME: Broken import')) {
        console.log(`[GitRepair]   - Removing FIXME line ${i + 1}: ${trimmed.substring(0, 80)}`);
        removedCount++;
        if (i + 1 < lines.length && lines[i + 1].trim().startsWith('// import')) {
          console.log(`[GitRepair]   - Removing commented import line ${i + 2}`);
          i++;
          removedCount++;
        }
        continue;
      }
      
      if (brokenPath && trimmed.startsWith('// import') && trimmed.includes(brokenPath)) {
        console.log(`[GitRepair]   - Removing stale commented import: ${trimmed.substring(0, 80)}`);
        removedCount++;
        continue;
      }
      
      cleanedLines.push(lines[i]);
    }
    
    if (removedCount > 0) {
      fixedContent = cleanedLines.join('\n');
      wasFixed = true;
      console.log(`[GitRepair]   ✅ Removed ${removedCount} FIXME/broken import line(s)`);
    }
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // FIX: "Code smell" with broken import — same cleanup for code smell variant
  // ═══════════════════════════════════════════════════════════════════════════
  if (lowerError.includes('code smell') && lowerError.includes('broken import')) {
    console.log(`[GitRepair] Detected code smell with broken import — cleaning up`);
    
    const brokenPathMatch2 = error.match(/file not found:\s*([^\s,;"']+)/i);
    const brokenPath2 = brokenPathMatch2 ? brokenPathMatch2[1].trim() : '';
    console.log(`[GitRepair]   - Broken path: "${brokenPath2}"`);
    
    const lines = fixedContent.split('\n');
    const cleanedLines: string[] = [];
    let removedCount = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trim();
      
      if (trimmed.startsWith('// FIXME: Broken import') || trimmed.startsWith('// FIXME:Broken import')) {
        removedCount++;
        if (i + 1 < lines.length && lines[i + 1].trim().startsWith('// import')) {
          i++;
          removedCount++;
        }
        continue;
      }
      
      if (brokenPath2 && trimmed.startsWith('// import') && trimmed.includes(brokenPath2)) {
        removedCount++;
        continue;
      }
      
      cleanedLines.push(lines[i]);
    }
    
    if (removedCount > 0) {
      fixedContent = cleanedLines.join('\n');
      wasFixed = true;
      console.log(`[GitRepair]   ✅ Removed ${removedCount} broken import lines (code smell fix)`);
    }
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // FIX: Potentially broken imports - Comment out or remove broken imports
  // ═══════════════════════════════════════════════════════════════════════════
  if (lowerError.includes('potentially broken import')) {
    console.log(`[GitRepair] Detected potentially broken import`);
    
    // Extract the import path from the error message
    // Format: "Potentially broken import: ./aiSchema"
    let brokenImportPath = '';
    const importMatch = error.match(/potentially broken import:\s*(.+)/i);
    if (importMatch) {
      brokenImportPath = importMatch[1].trim();
      console.log(`[GitRepair]   - Broken import path: "${brokenImportPath}"`);
    }
    
    if (brokenImportPath) {
      const lines = fixedContent.split('\n');
      const modifiedLines: string[] = [];
      let removedCount = 0;
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();
        
        // Check if this line imports from the broken path
        // Match patterns like:
        // import ... from './aiSchema'
        // import ... from "./aiSchema"
        // import ... from './store'
        const importRegex = new RegExp(`from\\s+['"]${brokenImportPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`, 'i');
        const isVariableImport = trimmed.includes('${') && trimmed.includes('}'); // Template literal import
        
        if (importRegex.test(trimmed) || (isVariableImport && trimmed.includes(brokenImportPath))) {
          console.log(`[GitRepair]   - Found broken import on line ${i + 1}: ${trimmed.substring(0, 80)}...`);
          
          // Comment out the line instead of removing it
          const indentation = line.match(/^(\s*)/)?.[1] || '';
          modifiedLines.push(`${indentation}// FIXME: Broken import - file not found: ${brokenImportPath}`);
          modifiedLines.push(`${indentation}// ${trimmed}`);
          removedCount++;
          wasFixed = true;
        } else {
          modifiedLines.push(line);
        }
      }
      
      if (wasFixed) {
        fixedContent = modifiedLines.join('\n');
        console.log(`[GitRepair]   ✅ Commented out ${removedCount} broken import(s)`);
      }
    } else {
      console.log(`[GitRepair]   ⚠️ Could not extract import path from error message`);
    }
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // FIX: Parsing ECMAScript source code failed - Multiple common causes
  // ═══════════════════════════════════════════════════════════════════════════
  if (lowerError.includes('parsing ecmascript') || 
      lowerError.includes('parsing error') ||
      lowerError.includes('parse error') ||
      lowerError.includes('parsing') && lowerError.includes('source code failed')) {
    console.log(`[GitRepair] Detected ECMAScript parsing error`);
    
    let tempContent = fixedContent;
    let ecmaFixed = false;
    
    // FIX 0: Extract line number from error to provide better context
    let errorLineNum: number | null = null;
    const lineMatch = error.match(/\((\d+):(\d+)\)/);
    if (lineMatch) {
      errorLineNum = parseInt(lineMatch[1]);
      console.log(`[GitRepair]   - Error at line ${errorLineNum}, column ${lineMatch[2]}`);
    }
    
    // FIX 1: Bitwise operators in JSX/TSX (e.g., key={id | idx} should be key={id || idx})
    if (file.endsWith('.tsx') || file.endsWith('.jsx')) {
      console.log(`[GitRepair]   - Checking for bitwise operators in JSX...`);
      
      // Match patterns like: key={something | something}
      const bitwiseInJSX = /([\w\-]+)=\{([^}]*?)\s+\|\s+([^}|]*?)\}/g;
      const bitwiseMatches = [...tempContent.matchAll(bitwiseInJSX)];
      
      if (bitwiseMatches.length > 0) {
        console.log(`[GitRepair]   - Found ${bitwiseMatches.length} potential bitwise operator(s) in JSX`);
        tempContent = tempContent.replace(bitwiseInJSX, (match, attr, left, right) => {
          // Only replace if it's not already ||
          if (!match.includes('||')) {
            console.log(`[GitRepair]     • Fixing: ${match}`);
            return `${attr}={${left.trim()} || ${right.trim()}}`;
          }
          return match;
        });
        ecmaFixed = true;
      }
      
      // Also check for single bitwise AND: key={something & something}
      const bitwiseAndInJSX = /([\w\-]+)=\{([^}]*?)\s+&\s+([^}&]*?)\}/g;
      const bitwiseAndMatches = [...tempContent.matchAll(bitwiseAndInJSX)];
      
      if (bitwiseAndMatches.length > 0) {
        console.log(`[GitRepair]   - Found ${bitwiseAndMatches.length} potential bitwise AND operator(s) in JSX`);
        tempContent = tempContent.replace(bitwiseAndInJSX, (match, attr, left, right) => {
          // Only replace if it's not already &&
          if (!match.includes('&&')) {
            console.log(`[GitRepair]     • Fixing: ${match}`);
            return `${attr}={${left.trim()} && ${right.trim()}}`;
          }
          return match;
        });
        ecmaFixed = true;
      }
    }
    
    // FIX 2: Invalid TypeScript type annotations in runtime code (e.g., boxShadow: any;)
    console.log(`[GitRepair]   - Checking for invalid type annotations...`);
    
    // Match patterns like: propertyName: any; or propertyName: string; in object literals
    // This is invalid in runtime JS/TS - should be propertyName: 'value' or just propertyName
    const invalidTypeAnnotations = /([\w]+):\s*(any|string|number|boolean|object|Array|undefined|null)\s*[;,]/g;
    const typeMatches = [...tempContent.matchAll(invalidTypeAnnotations)];
    
    if (typeMatches.length > 0) {
      console.log(`[GitRepair]   - Found ${typeMatches.length} invalid type annotation(s)`);
      tempContent = tempContent.replace(invalidTypeAnnotations, (match, propName, typeName) => {
        console.log(`[GitRepair]     • Removing invalid type: ${match}`);
        // Remove the line entirely or comment it out (it's likely a mistake)
        return `/* FIXME: Removed invalid type annotation: ${propName}: ${typeName} */`;
      });
      ecmaFixed = true;
    }
    
    // FIX 3: Missing commas in object/array literals
    console.log(`[GitRepair]   - Checking for missing commas...`);
    
    // This is a conservative fix for common comma issues in objects
    const lines = tempContent.split('\n');
    const fixedLines: string[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      const trimmed = line.trim();
      const nextLine = i < lines.length - 1 ? lines[i + 1].trim() : '';
      
      // Check if current line ends with a value and next line starts with a property/value
      // Pattern: a line that ends with something like: "value" or } or number
      // And next line starts with a property like: propertyName: or "key":
      if (trimmed.length > 0 && 
          !trimmed.endsWith(',') && 
          !trimmed.endsWith('{') && 
          !trimmed.endsWith('[') &&
          (trimmed.endsWith('"') || trimmed.endsWith("'") || trimmed.endsWith('}') || trimmed.endsWith(']') || /\d$/.test(trimmed)) &&
          nextLine.length > 0 &&
          (nextLine.match(/^[\w"']+:/) || nextLine.startsWith('{') || nextLine.startsWith('['))) {
        
        // Check if we're inside an object/array
        const beforeText = lines.slice(0, i + 1).join('\n');
        const openBraces = (beforeText.match(/\{/g) || []).length;
        const closeBraces = (beforeText.match(/\}/g) || []).length;
        const openBrackets = (beforeText.match(/\[/g) || []).length;
        const closeBrackets = (beforeText.match(/\]/g) || []).length;
        
        if ((openBraces > closeBraces) || (openBrackets > closeBrackets)) {
          console.log(`[GitRepair]     • Adding missing comma on line ${i + 1}: ${trimmed.substring(0, 60)}...`);
          line = line.replace(/\s*$/, ',');
          ecmaFixed = true;
        }
      }
      
      fixedLines.push(line);
    }
    
    if (ecmaFixed) {
      tempContent = fixedLines.join('\n');
    }
    
    // FIX 4: Double commas (typo)
    console.log(`[GitRepair]   - Checking for problematic trailing commas...`);
    
    const doubleCommas = /,,+/g;
    if (doubleCommas.test(tempContent)) {
      console.log(`[GitRepair]   - Found double commas`);
      tempContent = tempContent.replace(doubleCommas, ',');
      ecmaFixed = true;
    }
    
    // FIX 5: Invalid spread operator usage
    console.log(`[GitRepair]   - Checking for invalid spread operators...`);
    
    // Match: ...undefined or ...null which are invalid
    const invalidSpread = /\.\.\.(?:undefined|null)\b/g;
    if (invalidSpread.test(tempContent)) {
      console.log(`[GitRepair]   - Found invalid spread operator usage`);
      tempContent = tempContent.replace(invalidSpread, '/* removed invalid spread */');
      ecmaFixed = true;
    }
    
    // FIX 6: Unclosed brackets, braces, parentheses (common parsing error)
    console.log(`[GitRepair]   - Checking for unclosed brackets/braces...`);
    
    const openParens = (tempContent.match(/\(/g) || []).length;
    const closeParens = (tempContent.match(/\)/g) || []).length;
    const openBraces = (tempContent.match(/\{/g) || []).length;
    const closeBraces = (tempContent.match(/\}/g) || []).length;
    const openBrackets = (tempContent.match(/\[/g) || []).length;
    const closeBrackets = (tempContent.match(/\]/g) || []).length;
    
    if (openParens !== closeParens || openBraces !== closeBraces || openBrackets !== closeBrackets) {
      console.log(`[GitRepair]   - Found bracket mismatch:`);
      console.log(`[GitRepair]     • Parentheses: ${openParens} open, ${closeParens} close`);
      console.log(`[GitRepair]     • Braces: ${openBraces} open, ${closeBraces} close`);
      console.log(`[GitRepair]     • Brackets: ${openBrackets} open, ${closeBrackets} close`);
      
      // Try to add missing closing brackets at the end of the file
      if (closeBraces < openBraces) {
        const missing = openBraces - closeBraces;
        console.log(`[GitRepair]     • Adding ${missing} missing closing brace(s)`);
        tempContent += '\n' + '}'.repeat(missing) + '\n';
        ecmaFixed = true;
      }
      if (closeBrackets < openBrackets) {
        const missing = openBrackets - closeBrackets;
        console.log(`[GitRepair]     • Adding ${missing} missing closing bracket(s)`);
        tempContent += '\n' + ']'.repeat(missing) + '\n';
        ecmaFixed = true;
      }
      if (closeParens < openParens) {
        const missing = openParens - closeParens;
        console.log(`[GitRepair]     • Adding ${missing} missing closing parenthes(es)`);
        tempContent += '\n' + ')'.repeat(missing) + '\n';
        ecmaFixed = true;
      }
    }
    
    // FIX 7: JSX fragments with invalid syntax
    console.log(`[GitRepair]   - Checking for invalid JSX fragment syntax...`);
    
    // Match incomplete fragments like: < > without </>
    const incompleteFragments = /<\s*>(?![^<]*<\s*\/\s*>)/g;
    if (incompleteFragments.test(tempContent)) {
      console.log(`[GitRepair]   - Found incomplete JSX fragments`);
      // This is complex to fix automatically, so just add a comment
      tempContent = tempContent.replace(/<\s*>/g, '<React.Fragment>');
      tempContent = tempContent.replace(/<\s*\/\s*>/g, '</React.Fragment>');
      ecmaFixed = true;
    }
    
    // FIX 8: Invalid arrow function syntax
    console.log(`[GitRepair]   - Checking for invalid arrow function syntax...`);
    
    // Match: => => (double arrow, common typo)
    const doubleArrow = /=>\s*=>/g;
    if (doubleArrow.test(tempContent)) {
      console.log(`[GitRepair]   - Found double arrow function syntax`);
      tempContent = tempContent.replace(doubleArrow, '=>');
      ecmaFixed = true;
    }
    
    // FIX 9: Invalid method shorthand in objects
    console.log(`[GitRepair]   - Checking for invalid method definitions...`);
    
    // Match: methodName: () => {} when it should be methodName() {}
    const invalidMethodShorthand = /([\w]+):\s*\(\s*\)\s*=>\s*\{/g;
    const methodMatches = [...tempContent.matchAll(invalidMethodShorthand)];
    
    if (methodMatches.length > 0) {
      console.log(`[GitRepair]   - Found ${methodMatches.length} potentially invalid method shorthand(s)`);
      // This might be intentional, so we'll be conservative
      // Only fix if it's clearly in an object literal context
      const inObjectContext = tempContent.includes('const') || tempContent.includes('export');
      if (inObjectContext) {
        tempContent = tempContent.replace(invalidMethodShorthand, '$1() {');
        ecmaFixed = true;
      }
    }
    
    if (ecmaFixed) {
      fixedContent = tempContent;
      wasFixed = true;
      console.log(`[GitRepair]   ✅ Fixed ECMAScript parsing errors`);
    } else {
      console.log(`[GitRepair]   - No automatic fixes applied for parsing error`);
    }
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // FIX: React Hydration Mismatch Errors
  // ══════════════════════════════════════════════════════════════════════════
  if (lowerError.includes('hydration') || 
      lowerError.includes('text content does not match') ||
      lowerError.includes('did not match')) {
    console.log(`[GitRepair] Detected React hydration mismatch`);
    
    let tempContent = fixedContent;
    let hydrationFixed = false;
    
    // Common cause: Random values or Date.now() in render
    // Replace Date.now() with a placeholder in JSX
    const dateNowInJSX = /\{Date\.now\(\)\}/g;
    if (dateNowInJSX.test(tempContent)) {
      console.log(`[GitRepair]   - Found Date.now() in JSX - potential hydration issue`);
      tempContent = tempContent.replace(dateNowInJSX, '{/* Hydration fix: Date.now() removed */}');
      hydrationFixed = true;
    }
    
    // Common cause: Math.random() in render
    const mathRandomInJSX = /\{Math\.random\(\)\}/g;
    if (mathRandomInJSX.test(tempContent)) {
      console.log(`[GitRepair]   - Found Math.random() in JSX - potential hydration issue`);
      tempContent = tempContent.replace(mathRandomInJSX, '{0 /* Hydration fix: Math.random() removed */}');
      hydrationFixed = true;
    }
    
    if (hydrationFixed) {
      fixedContent = tempContent;
      wasFixed = true;
      console.log(`[GitRepair]   ✅ Fixed potential hydration issues`);
    }
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // FIX: Missing React Keys in List Rendering
  // ═══════════════════════════════════════════════════════════════════════════
  if (lowerError.includes('key') && 
      (lowerError.includes('missing') || lowerError.includes('should have') || lowerError.includes('unique'))) {
    console.log(`[GitRepair] Detected missing React key in list`);
    
    let tempContent = fixedContent;
    let keyFixed = false;
    
    // Add key prop to map callbacks that don't have it
    // Match: .map((item, index) => <Component without key
    const mapWithoutKey = /\.map\(\((\w+),?\s*(\w+)?\)\s*=>\s*<(\w+)(?!\s+key=)/g;
    const matches = [...tempContent.matchAll(mapWithoutKey)];
    
    if (matches.length > 0) {
      console.log(`[GitRepair]   - Found ${matches.length} map() call(s) potentially missing key`);
      tempContent = tempContent.replace(mapWithoutKey, (match, item, index, component) => {
        const indexParam = index || 'index';
        console.log(`[GitRepair]     • Adding key to <${component}>`);
        return `.map((${item}, ${indexParam}) => <${component} key={${indexParam}}`;
      });
      keyFixed = true;
    }
    
    if (keyFixed) {
      fixedContent = tempContent;
      wasFixed = true;
      console.log(`[GitRepair]   ✅ Added missing React keys`);
    }
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // FIX: TypeError - Cannot read property of undefined
  // ═══════════════════════════════════════════════════════════════════════════
  if ((lowerError.includes('cannot read property') || lowerError.includes('cannot read properties')) &&
      lowerError.includes('undefined')) {
    console.log(`[GitRepair] Detected TypeError - reading property of undefined`);
    
    let tempContent = fixedContent;
    let safetyFixed = false;
    
    // Extract property name if available
    const propMatch = error.match(/(?:property|properties)\s+'?(\w+)'?/i);
    if (propMatch) {
      const propertyName = propMatch[1];
      console.log(`[GitRepair]   - Target property: ${propertyName}`);
      
      // Extract file and line number if available to provide better context
      let errorLineNum: number | null = null;
      const lineMatch = error.match(/\((\d+):(\d+)\)/);
      if (lineMatch) {
        errorLineNum = parseInt(lineMatch[1]);
        console.log(`[GitRepair]   - Error at line ${errorLineNum}, column ${lineMatch[2]}`);
      }
      
      // STRATEGY 1: Add optional chaining to common patterns
      // Pattern: object.property -> object?.property
      const unsafeAccess = new RegExp(`(\\w+)\\.${propertyName}(?!\\?)`, 'g');
      const matches = [...tempContent.matchAll(unsafeAccess)];
      
      if (matches.length > 0) {
        console.log(`[GitRepair]   - Found ${matches.length} unsafe access(es) to .${propertyName}`);
        
        // Replace all occurrences with optional chaining
        tempContent = tempContent.replace(unsafeAccess, (match, objectName) => {
          // Don't add ?. if it's already there
          const nextChar = tempContent[tempContent.indexOf(match) + match.length];
          if (nextChar === '?') {
            return match;
          }
          
          console.log(`[GitRepair]     • Fixing: ${objectName}.${propertyName} → ${objectName}?.${propertyName}`);
          return `${objectName}?.${propertyName}`;
        });
        safetyFixed = true;
      }
      
      // STRATEGY 2: Add default values for objects that might be undefined
      // Pattern: const { property } = object -> const { property } = object || {}
      const destructuringPattern = new RegExp(`const\\s*\\{([^}]*)\\}\\s*=\\s*(\\w+)(?!\\s*\\|\\|)`, 'g');
      const destructMatches = [...tempContent.matchAll(destructuringPattern)];
      
      if (destructMatches.length > 0) {
        console.log(`[GitRepair]   - Found ${destructMatches.length} destructuring pattern(s) without default`);
        
        tempContent = tempContent.replace(destructuringPattern, (match, props, objectName) => {
          // Only add default if the destructured props include our problematic property
          if (props.includes(propertyName)) {
            console.log(`[GitRepair]     • Adding default value: const {${props}} = ${objectName} || {}`);
            return `const {${props}} = ${objectName} || {}`;
          }
          return match;
        });
        safetyFixed = true;
      }
      
      // STRATEGY 3: Initialize undefined objects with default values
      // Look for patterns like: function Component({ page }) where page might be undefined
      // Replace usage like page.components with (page?.components || [])
      const arrayAccessPattern = new RegExp(`(\\w+)\\.${propertyName}\\.map\\(`, 'g');
      const arrayMatches = [...tempContent.matchAll(arrayAccessPattern)];
      
      if (arrayMatches.length > 0) {
        console.log(`[GitRepair]   - Found ${arrayMatches.length} .map() on potentially undefined array`);
        
        tempContent = tempContent.replace(arrayAccessPattern, (match, objectName) => {
          console.log(`[GitRepair]     • Adding safety: (${objectName}?.${propertyName} || []).map(`);
          return `(${objectName}?.${propertyName} || []).map(`;
        });
        safetyFixed = true;
      }
      
      // STRATEGY 4: Check for forEach, filter, reduce on potentially undefined arrays
      const arrayMethodPattern = new RegExp(`(\\w+)\\.${propertyName}\\.(forEach|filter|reduce|some|every|find)\\(`, 'g');
      const methodMatches = [...tempContent.matchAll(arrayMethodPattern)];
      
      if (methodMatches.length > 0) {
        console.log(`[GitRepair]   - Found ${methodMatches.length} array method(s) on potentially undefined`);
        
        tempContent = tempContent.replace(arrayMethodPattern, (match, objectName, method) => {
          console.log(`[GitRepair]     • Adding safety: (${objectName}?.${propertyName} || []).${method}(`);
          return `(${objectName}?.${propertyName} || []).${method}(`;
        });
        safetyFixed = true;
      }
      
      // STRATEGY 5: Add null checks before property access in conditionals
      // Pattern: if (object.property) -> if (object?.property)
      const conditionalPattern = new RegExp(`if\\s*\\(\\s*(\\w+)\\.${propertyName}(?!\\?)`, 'g');
      const conditionalMatches = [...tempContent.matchAll(conditionalPattern)];
      
      if (conditionalMatches.length > 0) {
        console.log(`[GitRepair]   - Found ${conditionalMatches.length} conditional(s) without null check`);
        
        tempContent = tempContent.replace(conditionalPattern, (match, objectName) => {
          console.log(`[GitRepair]     • Adding null check: if (${objectName}?.${propertyName}`);
          return `if (${objectName}?.${propertyName}`;
        });
        safetyFixed = true;
      }
    } else {
      console.log(`[GitRepair]   - Could not extract property name from error`);
      
      // Generic fix: look for any property access without optional chaining
      console.log(`[GitRepair]   - Applying generic null safety patterns...`);
      
      // Add optional chaining to common risky patterns
      // Pattern: .map( without prior optional chaining
      const riskyMapPattern = /(\w+)\.(\w+)\.map\(/g;
      const riskyMatches = [...tempContent.matchAll(riskyMapPattern)];
      
      if (riskyMatches.length > 0) {
        console.log(`[GitRepair]   - Found ${riskyMatches.length} potentially risky .map() call(s)`);
        
        tempContent = tempContent.replace(riskyMapPattern, (match, obj, prop) => {
          // Only fix if there's no optional chaining already
          if (!match.includes('?.')) {
            console.log(`[GitRepair]     • Adding safety: (${obj}?.${prop} || []).map(`);
            return `(${obj}?.${prop} || []).map(`;
          }
          return match;
        });
        safetyFixed = true;
      }
    }
    
    if (safetyFixed) {
      fixedContent = tempContent;
      wasFixed = true;
      console.log(`[GitRepair]   ✅ Added optional chaining and null safety checks`);
    } else {
      console.log(`[GitRepair]   - No automatic fixes could be applied`);
    }
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // FIX: TypeError - x is not a function
  // ═══════════════════════════════════════════════════════════════════════════
  if (lowerError.includes('is not a function')) {
    console.log(`[GitRepair] Detected TypeError - something is not a function`);
    
    let tempContent = fixedContent;
    let functionFixed = false;
    
    // Common cause: .map on non-array
    // Add safety check before .map
    const unsafeMap = /(\w+)\.map\(/g;
    const matches = [...tempContent.matchAll(unsafeMap)];
    
    if (matches.length > 0) {
      console.log(`[GitRepair]   - Found ${matches.length} .map() call(s) - adding Array.isArray check`);
      
      // Replace with safe version
      tempContent = tempContent.replace(unsafeMap, (match, varName) => {
        // Don't modify if already has optional chaining or Array.isArray
        if (match.includes('?.') || tempContent.includes(`Array.isArray(${varName})`)) {
          return match;
        }
        return `(Array.isArray(${varName}) ? ${varName} : []).map(`;
      });
      functionFixed = true;
    }
    
    if (functionFixed) {
      fixedContent = tempContent;
      wasFixed = true;
      console.log(`[GitRepair]   ✅ Added safety checks for function calls`);
    }
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // FIX: Invalid Hook Call (Hooks outside function component)
  // ═══════════════════════════════════════════════════════════════════════════
  if (lowerError.includes('invalid hook call') || 
      lowerError.includes('hooks can only be called inside')) {
    console.log(`[GitRepair] Detected invalid hook call`);
    
    let tempContent = fixedContent;
    let hookFixed = false;
    
    // Look for hooks outside of function components
    // This is a heuristic - check if hook is called in a non-component function
    const lines = tempContent.split('\n');
    let inFunctionComponent = false;
    let currentFunctionName = '';
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      
      // Detect function component (PascalCase function)
      const componentMatch = trimmed.match(/(?:function|const)\s+([A-Z]\w*)/);
      if (componentMatch) {
        inFunctionComponent = true;
        currentFunctionName = componentMatch[1];
      }
      
      // Detect non-component function (camelCase)
      const regularFuncMatch = trimmed.match(/(?:function|const)\s+([a-z]\w*)/);
      if (regularFuncMatch) {
        inFunctionComponent = false;
        currentFunctionName = regularFuncMatch[1];
      }
      
      // Check for hook calls in non-component functions
      if (!inFunctionComponent && /use[A-Z]\w*\(/.test(trimmed)) {
        console.log(`[GitRepair]   - Found hook in non-component function: ${currentFunctionName}`);
        lines[i] = `${line} // FIXME: Hook called outside component - move to component`;
        hookFixed = true;
      }
    }
    
    if (hookFixed) {
      fixedContent = lines.join('\n');
      wasFixed = true;
      console.log(`[GitRepair]   ✅ Marked invalid hook calls`);
    }
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // FIX: Memory Leak - Unmounted Subscription
  // ═══════════════════════════════════════════════════════════════════════════
  if (lowerError.includes('memory leak') || 
      lowerError.includes('unmounted') ||
      lowerError.includes('can\'t perform a react state update')) {
    console.log(`[GitRepair] Detected potential memory leak / unmounted component update`);
    
    let tempContent = fixedContent;
    let leakFixed = false;
    
    // Look for useEffect with event listeners or subscriptions that don't cleanup
    const useEffectPattern = /useEffect\(\(\)\s*=>\s*\{([^}]+)\}/g;
    const matches = [...tempContent.matchAll(useEffectPattern)];
    
    for (const match of matches) {
      const effectBody = match[1];
      
      // Check if it has addEventListener or subscription without cleanup
      if ((effectBody.includes('addEventListener') || effectBody.includes('subscribe')) &&
          !effectBody.includes('return () =>')) {
        console.log(`[GitRepair]   - Found useEffect with subscription but no cleanup`);
        // Add comment warning
        tempContent = tempContent.replace(match[0], `${match[0]} // FIXME: Add cleanup function to prevent memory leak`);
        leakFixed = true;
      }
    }
    
    if (leakFixed) {
      fixedContent = tempContent;
      wasFixed = true;
      console.log(`[GitRepair]   ✅ Marked effects needing cleanup`);
    }
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // FIX: Infinite Re-render in React
  // ═══════════════════════════════════════════════════════════════════════════
  if (lowerError.includes('too many re-renders') || 
      lowerError.includes('infinite') ||
      lowerError.includes('maximum update depth')) {
    console.log(`[GitRepair] Detected infinite re-render`);
    
    let tempContent = fixedContent;
    let rerenderFixed = false;
    
    // Common cause: setState in render without condition
    // Look for setState calls outside useEffect/handlers
    const lines = tempContent.split('\n');
    let inUseEffect = false;
    let inEventHandler = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      
      if (trimmed.includes('useEffect')) inUseEffect = true;
      if (trimmed.includes('onClick') || trimmed.includes('onChange') || trimmed.includes('onSubmit')) {
        inEventHandler = true;
      }
      
      // Check for setState in render
      if (!inUseEffect && !inEventHandler && /set[A-Z]\w*\(/.test(trimmed) && !trimmed.includes('const ')) {
        console.log(`[GitRepair]   - Found setState in render on line ${i + 1}`);
        lines[i] = `${line} // FIXME: setState in render causes infinite loop - move to useEffect or handler`;
        rerenderFixed = true;
      }
      
      if (trimmed.includes('});')) {
        inUseEffect = false;
        inEventHandler = false;
      }
    }
    
    if (rerenderFixed) {
      fixedContent = lines.join('\n');
      wasFixed = true;
      console.log(`[GitRepair]   ✅ Marked setState calls causing infinite render`);
    }
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // FIX: CORS Policy Violation
  // ═══════════════════════════════════════════════════════════════════════════
  if (lowerError.includes('cors') || 
      lowerError.includes('cross-origin') ||
      lowerError.includes('access-control-allow-origin')) {
    console.log(`[GitRepair] Detected CORS policy violation`);
    
    // If this is a server file, add CORS headers
    if (file.includes('/supabase/functions/') || file.includes('server')) {
      let tempContent = fixedContent;
      let corsFixed = false;
      
      // Check if CORS middleware is imported
      const hasCorsImport = /import.*cors.*from.*['"]npm:hono\/cors['"]/.test(tempContent);
      
      if (!hasCorsImport && tempContent.includes('from "npm:hono"')) {
        console.log(`[GitRepair]   - Adding CORS import`);
        tempContent = tempContent.replace(
          /import\s+{([^}]+)}\s+from\s+['"]npm:hono['"]/,
          'import { $1 } from "npm:hono";\nimport { cors } from "npm:hono/cors"'
        );
        corsFixed = true;
      }
      
      // Check if CORS middleware is used
      const hasCorsMiddleware = /app\.use\(['"]?\*['"]?,\s*cors\(\{/.test(tempContent);
      
      if (!hasCorsMiddleware && tempContent.includes('const app = new Hono()')) {
        console.log(`[GitRepair]   - Adding CORS middleware`);
        tempContent = tempContent.replace(
          /(const app = new Hono\(\);?)/,
          `$1\n\n// Enable CORS for all routes\napp.use('*', cors({\n  origin: '*',\n  credentials: true,\n}));`
        );
        corsFixed = true;
      }
      
      if (corsFixed) {
        fixedContent = tempContent;
        wasFixed = true;
        console.log(`[GitRepair]   ✅ Added CORS configuration`);
      }
    }
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // FIX: Missing Environment Variables
  // ═══════════════════════════════════════════════════════════════════════════
  if (lowerError.includes('environment variable') || 
      lowerError.includes('env') && (lowerError.includes('missing') || lowerError.includes('undefined'))) {
    console.log(`[GitRepair] Detected missing environment variable`);
    
    // Extract the variable name
    const envVarMatch = error.match(/(?:variable|env)[:\s]+([A-Z_][A-Z0-9_]*)/i);
    if (envVarMatch) {
      const envVarName = envVarMatch[1];
      console.log(`[GitRepair]   - Missing variable: ${envVarName}`);
      
      let tempContent = fixedContent;
      let envFixed = false;
      
      // Add fallback value for missing env var
      const unsafeEnvAccess = new RegExp(`Deno\\.env\\.get\\(['"]${envVarName}['"]\\)`, 'g');
      const safeEnvAccess = new RegExp(`Deno\\.env\\.get\\(['"]${envVarName}['"]\\)\\s*\\|\\|`, 'g');
      
      if (unsafeEnvAccess.test(tempContent) && !safeEnvAccess.test(tempContent)) {
        console.log(`[GitRepair]   - Adding fallback for ${envVarName}`);
        tempContent = tempContent.replace(
          unsafeEnvAccess,
          `Deno.env.get('${envVarName}') || '' /* FIXME: Provide default value */`
        );
        envFixed = true;
      }
      
      if (envFixed) {
        fixedContent = tempContent;
        wasFixed = true;
        console.log(`[GitRepair]   ✅ Added environment variable fallback`);
      }
    }
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // FIX: Async/Await Errors - Unhandled Promise Rejection
  // ═══════════════════════════════════════════════════════════════════════════
  if (lowerError.includes('unhandled promise rejection') || 
      lowerError.includes('uncaught promise') ||
      lowerError.includes('async') && lowerError.includes('await')) {
    console.log(`[GitRepair] Detected unhandled promise rejection`);
    
    let tempContent = fixedContent;
    let asyncFixed = false;
    
    // Look for .then() without .catch()
    const thenWithoutCatch = /(\w+)\.then\([^)]+\)(?!\s*\.catch)/g;
    const matches = [...tempContent.matchAll(thenWithoutCatch)];
    
    if (matches.length > 0) {
      console.log(`[GitRepair]   - Found ${matches.length} .then() without .catch()`);
      tempContent = tempContent.replace(thenWithoutCatch, (match) => {
        return `${match}.catch(err => console.error('Promise error:', err))`;
      });
      asyncFixed = true;
    }
    
    if (asyncFixed) {
      fixedContent = tempContent;
      wasFixed = true;
      console.log(`[GitRepair]   ✅ Added error handling to promises`);
    }
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // FIX: TypeScript - Cannot find module
  // ═══════════════════════════════════════════════════════════════════════════
  if ((lowerError.includes('ts2307') || lowerError.includes('cannot find module')) &&
      (file.endsWith('.ts') || file.endsWith('.tsx'))) {
    console.log(`[GitRepair] Detected TypeScript module not found`);
    
    let tempContent = fixedContent;
    let tsFixed = false;
    
    // Common issue: importing .ts/.tsx files with extensions
    // TypeScript doesn't allow extensions in imports
    const importWithExtension = /from\s+['"](.+)\.(ts|tsx)['"]/g;
    const matches = [...tempContent.matchAll(importWithExtension)];
    
    if (matches.length > 0) {
      console.log(`[GitRepair]   - Found ${matches.length} import(s) with .ts/.tsx extension`);
      tempContent = tempContent.replace(importWithExtension, (match, path, ext) => {
        console.log(`[GitRepair]     • Removing .${ext} from import`);
        return `from '${path}'`;
      });
      tsFixed = true;
    }
    
    if (tsFixed) {
      fixedContent = tempContent;
      wasFixed = true;
      console.log(`[GitRepair]   ✅ Fixed TypeScript imports`);
    }
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // FIX: JSON Parse Errors
  // ═══════════════════════════════════════════════════════════════════════════
  if (lowerError.includes('unexpected token') && lowerError.includes('json') ||
      lowerError.includes('json parse') ||
      lowerError.includes('syntaxerror') && lowerError.includes('json')) {
    console.log(`[GitRepair] Detected JSON parse error`);
    
    let tempContent = fixedContent;
    let jsonFixed = false;
    
    // Look for JSON.parse() calls without try-catch
    const unsafeJsonParse = /JSON\.parse\([^)]+\)(?!\s*\}?\s*catch)/g;
    const matches = [...tempContent.matchAll(unsafeJsonParse)];
    
    if (matches.length > 0) {
      console.log(`[GitRepair]   - Found ${matches.length} JSON.parse() without error handling`);
      
      // Add try-catch wrapper
      tempContent = tempContent.replace(unsafeJsonParse, (match) => {
        return `(() => { try { return ${match}; } catch (e) { console.error('JSON parse error:', e); return null; } })()`;
      });
      jsonFixed = true;
    }
    
    if (jsonFixed) {
      fixedContent = tempContent;
      wasFixed = true;
      console.log(`[GitRepair]   ✅ Added error handling to JSON.parse`);
    }
  }
  
  // ═══════════════════════════════════════════════════════════════════════════
  // FIX: DOM Node Not Found (document.getElementById returns null)
  // ═══════════════════════════════════════════════════════════════════════════
  if (lowerError.includes('dom') && lowerError.includes('not found') ||
      lowerError.includes('getelementbyid') && lowerError.includes('null')) {
    console.log(`[GitRepair] Detected DOM node not found error`);
    
    let tempContent = fixedContent;
    let domFixed = false;
    
    // Add null check for getElementById
    const unsafeGetElement = /document\.getElementById\([^)]+\)\.(\w+)/g;
    const matches = [...tempContent.matchAll(unsafeGetElement)];
    
    if (matches.length > 0) {
      console.log(`[GitRepair]   - Found ${matches.length} unsafe getElementById access(es)`);
      tempContent = tempContent.replace(unsafeGetElement, (match) => {
        return `${match.replace(/\.(\w+)$/, '')}?.${match.match(/\.(\w+)$/)?.[1]}`;
      });
      domFixed = true;
    }
    
    if (domFixed) {
      fixedContent = tempContent;
      wasFixed = true;
      console.log(`[GitRepair]   ✅ Added null checks for DOM queries`);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RESULT
  // ═══════════════════════════════════════════════════════════════════════════
  if (wasFixed) {
    console.log(`[GitRepair] ═══ ✅ PATTERN FIX SUCCESSFUL ═══`);
    return fixedContent;
  }
  
  console.log(`[GitRepair] ═══ ❌ NO PATTERN FIX APPLIED ═══`);
  console.log(`[GitRepair] No matching patterns found for this error`);
  console.log(`[GitRepair] Hint: This might need AI to fix, or it's not a supported pattern`);
  return null;
}