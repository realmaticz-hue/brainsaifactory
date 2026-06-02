// Memory optimization utilities for Git Repair file processing

export const MEMORY_LIMITS = {
  MAX_FILE_SIZE: 1000000, // 1MB per file
  MAX_TOTAL_SIZE: 50000000, // 50MB total
  MAX_FILES_TO_PROCESS: 500,
};

export interface FileProcessingResult {
  uploadedFiles: Map<string, string>;
  totalSize: number;
  skippedCount: number;
  skippedLargeFiles: number;
}

/**
 * Process files with memory limits to prevent overflow
 */
export async function processFilesWithMemoryLimits(
  files: FileList,
  readFileAsText: (file: File) => Promise<string>,
  addLog: (message: string) => void
): Promise<FileProcessingResult> {
  const uploadedFiles = new Map<string, string>();
  const fileArray = Array.from(files);
  let skippedCount = 0;
  let skippedLargeFiles = 0;
  let totalSize = 0;
  
  for (const file of fileArray) {
    try {
      // Use webkitRelativePath if available (folder upload), otherwise just file name
      const filePath = (file as any).webkitRelativePath || file.name;
      
      // Skip node_modules folder and all its contents
      if (filePath.includes('node_modules/') || filePath.includes('node_modules\\')) {
        skippedCount++;
        continue;
      }
      
      // Skip very large files to prevent memory issues
      if (file.size > MEMORY_LIMITS.MAX_FILE_SIZE) {
        addLog(`⏭️  Skipping large file: ${filePath} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
        skippedLargeFiles++;
        continue;
      }
      
      // Check if we've hit the file count limit
      if (uploadedFiles.size >= MEMORY_LIMITS.MAX_FILES_TO_PROCESS) {
        addLog(`⚠️  File limit reached (${MEMORY_LIMITS.MAX_FILES_TO_PROCESS} files), stopping upload`);
        skippedCount += (fileArray.length - fileArray.indexOf(file));
        break;
      }
      
      // Check total memory usage
      if (totalSize + file.size > MEMORY_LIMITS.MAX_TOTAL_SIZE) {
        addLog(`⚠️  Memory limit reached (${(MEMORY_LIMITS.MAX_TOTAL_SIZE / 1024 / 1024).toFixed(0)} MB), stopping upload`);
        skippedCount += (fileArray.length - fileArray.indexOf(file));
        break;
      }
      
      const content = await readFileAsText(file);
      uploadedFiles.set(filePath, content);
      totalSize += file.size;
      addLog(`✓ Uploaded: ${filePath} (${(file.size / 1024).toFixed(2)} KB)`);
    } catch (err) {
      addLog(`✗ Failed to read: ${file.name}`);
      console.error(`Error reading file ${file.name}:`, err);
    }
  }
  
  return {
    uploadedFiles,
    totalSize,
    skippedCount,
    skippedLargeFiles
  };
}

/**
 * Filter files to only include essential config files for genome scanning
 */
export function filterEssentialFiles(
  files: Map<string, string>
): Record<string, string> {
  const essentialFilePatterns = [
    'package.json',
    'tsconfig.json',
    'jsconfig.json',
    'vite.config',
    'webpack.config',
    'next.config',
    'tailwind.config',
    'deno.json',
    'deno.jsonc',
  ];
  
  const filesObject: Record<string, string> = {};
  
  files.forEach((content, path) => {
    // Only include essential config files
    if (essentialFilePatterns.some(pattern => 
      path === pattern || 
      path.endsWith(`/${pattern}`) || 
      path.includes(`/${pattern}.`) ||
      path === `${pattern}.js` ||
      path === `${pattern}.ts` ||
      path === `${pattern}.mjs` ||
      path === `${pattern}.cjs`
    )) {
      // Limit individual file size in the object
      const MAX_CONTENT_LENGTH = 100000; // 100KB
      filesObject[path] = content.length > MAX_CONTENT_LENGTH 
        ? content.substring(0, MAX_CONTENT_LENGTH) 
        : content;
    }
  });
  
  return filesObject;
}

/**
 * Clear large data structures to free memory
 */
export function clearMemory() {
  if (typeof global !== 'undefined' && global.gc) {
    // Node.js with --expose-gc flag
    global.gc();
  }
  // Browser doesn't have manual GC, but this helps mark objects for collection
}
