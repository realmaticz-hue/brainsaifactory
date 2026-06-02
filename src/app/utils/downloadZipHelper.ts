// Helper functions for downloading ZIP files in Git Repair

import { generateProjectZip, generateMissingFile } from './zipGeneratorSimple';

interface ErrorItem {
  id: string;
  type: 'error' | 'warning' | 'security' | 'performance';
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  file: string;
  line?: number;
  suggestion?: string;
  timestamp: number;
  fixed: boolean;
  agentId?: number;
}

export function detectMissingFilesFromErrors(
  errors: ErrorItem[],
  existingNewFiles: Map<string, string>,
  existingFixedFiles: Map<string, string>
): Map<string, string> {
  const newFiles = new Map(existingNewFiles);
  
  const missingFileErrors = errors.filter(e => 
    e.message.toLowerCase().includes('cannot find') || 
    e.message.toLowerCase().includes('module not found') ||
    e.message.toLowerCase().includes("can't resolve")
  );

  missingFileErrors.forEach(error => {
    // Extract file path from error message
    const pathMatch = error.message.match(/['"]([^'"]+)['"]/);
    if (pathMatch && pathMatch[1]) {
      const missingPath = pathMatch[1];
      
      // Check if we haven't already created this file
      if (!newFiles.has(missingPath) && !existingFixedFiles.has(missingPath)) {
        const content = generateMissingFile(missingPath, [error.file]);
        newFiles.set(missingPath, content);
      }
    }
  });

  return newFiles;
}

export async function downloadAllFixedFiles(
  fixedFiles: Map<string, string>,
  newFilesCreated: Map<string, string>,
  errors: ErrorItem[],
  projectName: string,
  addLog: (message: string) => void
): Promise<boolean> {
  try {
    console.log(`[downloadAllFixedFiles] === FUNCTION CALLED ===`);
    console.log(`[downloadAllFixedFiles] Received fixedFiles: ${fixedFiles.size}`);;
    console.log(`[downloadAllFixedFiles] Received newFilesCreated: ${newFilesCreated.size}`);
    console.log(`[downloadAllFixedFiles] Received errors: ${errors.length}`);
    console.log(`[downloadAllFixedFiles] Project name: ${projectName}`);
    
    // Log first few files for debugging
    if (fixedFiles.size > 0) {
      const first5 = Array.from(fixedFiles.entries()).slice(0, 5);
      console.log(`[downloadAllFixedFiles] Sample fixed files:`, first5.map(([path, content]) => 
        `${path} (${content.length} bytes)`
      ));
    } else {
      console.warn(`[downloadAllFixedFiles] ⚠️ WARNING: No fixed files!`);
    }
    
    addLog('📦 Generating ZIP file with all fixed and new files...');

    // Detect missing files
    const allNewFiles = detectMissingFilesFromErrors(errors, newFilesCreated, fixedFiles);
    
    console.log(`[downloadAllFixedFiles] After detecting missing files: ${allNewFiles.size}`);
    console.log(`[downloadAllFixedFiles] About to pass to ZIP generator:`);
    console.log(`[downloadAllFixedFiles]   - fixedFiles: ${fixedFiles.size}`);
    console.log(`[downloadAllFixedFiles]   - allNewFiles: ${allNewFiles.size}`);
    console.log(`[downloadAllFixedFiles]   - Total: ${fixedFiles.size + allNewFiles.size}`);
    
    if (fixedFiles.size === 0 && allNewFiles.size === 0) {
      addLog('⚠️ No fixed or new files to download');
      console.warn('[downloadAllFixedFiles] ⚠️ No files to download!');
      alert('❌ Error: No files to download!\n\nThe file maps are empty. Please check the console logs.');
      return false;
    }

    console.log(`[downloadAllFixedFiles] Calling generateProjectZip...`);
    await generateProjectZip(fixedFiles, allNewFiles, projectName);
    console.log(`[downloadAllFixedFiles] ✅ generateProjectZip completed`);
    
    addLog(`✅ ZIP downloaded: ${fixedFiles.size} original/fixed files, ${allNewFiles.size} new files`);
    addLog(`📂 Total files in package: ${fixedFiles.size + allNewFiles.size}`);
    
    return true;
  } catch (error) {
    console.error('ZIP generation error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    addLog(`❌ Failed to generate ZIP: ${error instanceof Error ? error.message : 'Unknown error'}`);
    alert(`❌ ZIP Download Failed!\n\n${error instanceof Error ? error.message : 'Unknown error'}\n\nCheck the console for details.`);
    return false;
  }
}