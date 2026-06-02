// ── Error Fingerprinting System ──────────────────────────────────────────────
// Generates stable, deterministic fingerprints for errors to enable pattern matching

interface ErrorFingerprint {
  id: string;                    // Unique fingerprint hash
  category: string;              // Error category (syntax, dependency, framework, etc.)
  pattern: string;               // Normalized error pattern
  framework?: string;            // React, Vue, etc.
  layer: string;                 // Which layer: syntax, language, framework, build, runtime
  timestamp: number;             // When fingerprint was created
}

/**
 * Generate a stable fingerprint for an error
 */
export function generateErrorFingerprint(
  errorMessage: string,
  filePath: string,
  projectContext?: {
    framework?: string;
    language?: string;
    dependencies?: Record<string, string>;
  }
): ErrorFingerprint {
  const lowerError = errorMessage.toLowerCase();
  const lowerFile = filePath.toLowerCase();
  
  // ═══ Categorize Error ═══
  let category = 'unknown';
  let layer = 'unknown';
  
  // Syntax Layer
  if (lowerError.includes('syntax error') || 
      lowerError.includes('unexpected token') ||
      lowerError.includes('expected semicolon') ||
      lowerError.includes('missing bracket')) {
    category = 'syntax';
    layer = 'syntax';
  }
  
  // Language Layer - Import/Export issues
  else if (lowerError.includes('cannot find module') ||
           lowerError.includes('module not found') ||
           lowerError.includes('broken import') ||
           lowerError.includes('missing import')) {
    category = 'import-resolution';
    layer = 'language';
  }
  
  // Framework Layer - React specific
  else if (lowerError.includes('react') || 
           lowerError.includes('hook') ||
           lowerError.includes('jsx') ||
           lowerError.includes('duplicate key') ||
           lowerError.includes('hydration')) {
    category = 'react-framework';
    layer = 'framework';
  }
  
  // Framework Layer - Router
  else if (lowerError.includes('router') ||
           lowerError.includes('react-router')) {
    category = 'routing';
    layer = 'framework';
  }
  
  // Dependency Layer
  else if (lowerError.includes('package') ||
           lowerError.includes('dependency') ||
           lowerError.includes('version conflict') ||
           lowerError.includes('peer dependency')) {
    category = 'dependency';
    layer = 'dependency';
  }
  
  // Build Layer
  else if (lowerError.includes('build') ||
           lowerError.includes('bundler') ||
           lowerError.includes('webpack') ||
           lowerError.includes('vite') ||
           lowerError.includes('config')) {
    category = 'build-config';
    layer = 'build';
  }
  
  // Runtime Layer
  else if (lowerError.includes('undefined') ||
           lowerError.includes('null') ||
           lowerError.includes('cannot read') ||
           lowerError.includes('is not a function')) {
    category = 'runtime';
    layer = 'runtime';
  }
  
  // Code Quality
  else if (lowerError.includes('code smell') ||
           lowerError.includes('todo') ||
           lowerError.includes('fixme')) {
    category = 'code-quality';
    layer = 'syntax';
  }
  
  // ═══ Normalize Error Pattern ═══
  // Remove specific values to create a reusable pattern
  let pattern = errorMessage
    .replace(/['"]([^'"]+)['"]/g, '<STRING>')           // Replace string literals
    .replace(/\b\d+\b/g, '<NUMBER>')                     // Replace numbers
    .replace(/line \d+/gi, 'line <NUMBER>')              // Normalize line numbers
    .replace(/column \d+/gi, 'column <NUMBER>')          // Normalize columns
    .replace(/\s+at\s+.+$/gm, '')                        // Remove stack traces
    .replace(/\s+/g, ' ')                                // Normalize whitespace
    .trim();
  
  // ═══ Extract Framework Context ═══
  let framework = projectContext?.framework;
  if (!framework) {
    // Try to detect from file extension
    if (lowerFile.endsWith('.tsx') || lowerFile.endsWith('.jsx')) {
      framework = 'react';
    } else if (lowerFile.endsWith('.vue')) {
      framework = 'vue';
    } else if (lowerFile.endsWith('.ts') || lowerFile.endsWith('.js')) {
      framework = 'vanilla-js';
    }
  }
  
  // ═══ Generate Fingerprint ID ═══
  // Create a stable hash from category + pattern + framework + layer
  const fingerprintString = `${category}:${pattern}:${framework || 'unknown'}:${layer}`;
  const id = simpleHash(fingerprintString);
  
  return {
    id,
    category,
    pattern,
    framework,
    layer,
    timestamp: Date.now()
  };
}

/**
 * Simple hash function for generating fingerprint IDs
 */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  // Convert to positive hex string
  const hashStr = Math.abs(hash).toString(16).padStart(8, '0');
  return `fp-${hashStr}`;
}

/**
 * Check if two fingerprints match (similar errors)
 */
export function fingerprintsMatch(fp1: ErrorFingerprint, fp2: ErrorFingerprint): boolean {
  // Exact match
  if (fp1.id === fp2.id) return true;
  
  // Similar patterns in same category and layer
  if (fp1.category === fp2.category && 
      fp1.layer === fp2.layer &&
      fp1.framework === fp2.framework) {
    // Calculate pattern similarity (simple string matching)
    const similarity = calculateStringSimilarity(fp1.pattern, fp2.pattern);
    return similarity > 0.8; // 80% similar
  }
  
  return false;
}

/**
 * Calculate string similarity (0-1)
 */
function calculateStringSimilarity(str1: string, str2: string): number {
  if (str1 === str2) return 1.0;
  if (!str1 || !str2) return 0.0;
  
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

/**
 * Levenshtein distance for string similarity
 * Memory-optimized version with size limits
 */
function levenshteinDistance(str1: string, str2: string): number {
  // Limit string length to prevent excessive memory usage
  const MAX_LENGTH = 500;
  const s1 = str1.substring(0, MAX_LENGTH);
  const s2 = str2.substring(0, MAX_LENGTH);
  
  // Use single-row optimization instead of full matrix
  const len1 = s1.length;
  const len2 = s2.length;
  
  if (len1 === 0) return len2;
  if (len2 === 0) return len1;
  
  // Only store current and previous row instead of full matrix
  let prevRow = new Array(len1 + 1);
  let currRow = new Array(len1 + 1);
  
  // Initialize first row
  for (let j = 0; j <= len1; j++) {
    prevRow[j] = j;
  }
  
  // Calculate distances row by row
  for (let i = 1; i <= len2; i++) {
    currRow[0] = i;
    
    for (let j = 1; j <= len1; j++) {
      if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
        currRow[j] = prevRow[j - 1];
      } else {
        currRow[j] = Math.min(
          prevRow[j - 1] + 1,  // substitution
          currRow[j - 1] + 1,   // insertion
          prevRow[j] + 1        // deletion
        );
      }
    }
    
    // Swap rows (reuse array to save memory)
    const temp = prevRow;
    prevRow = currRow;
    currRow = temp;
  }
  
  return prevRow[len1];
}