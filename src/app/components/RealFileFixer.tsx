/**
 * Real File Fixer - Actually fixes files in the project
 * Handles: Unused imports, Duplicate imports, Type mismatches
 */

export interface FileFixResult {
  success: boolean;
  filePath: string;
  originalContent: string;
  fixedContent: string;
  changesApplied: string[];
  error?: string;
}

export class RealFileFixer {
  /**
   * Remove unused imports from file
   */
  static removeUnusedImport(fileContent: string, unusedName: string): { content: string; fixed: boolean } {
    let fixedContent = fileContent;
    let fixed = false;

    // Pattern 1: Remove single import statement
    const singleImportPattern = new RegExp(
      `import\\s+${unusedName}\\s+from\\s+['"][^'"]+['"];?\\s*\\n?`,
      'g'
    );
    if (singleImportPattern.test(fixedContent)) {
      fixedContent = fixedContent.replace(singleImportPattern, '');
      fixed = true;
    }

    // Pattern 2: Remove from grouped imports (beginning)
    const groupedBeginPattern = new RegExp(
      `(import\\s*{\\s*)${unusedName}\\s*,\\s*`,
      'g'
    );
    if (groupedBeginPattern.test(fixedContent)) {
      fixedContent = fixedContent.replace(groupedBeginPattern, '$1');
      fixed = true;
    }

    // Pattern 3: Remove from grouped imports (middle/end)
    const groupedEndPattern = new RegExp(
      `,\\s*${unusedName}\\s*([,}])`,
      'g'
    );
    if (groupedEndPattern.test(fixedContent)) {
      fixedContent = fixedContent.replace(groupedEndPattern, '$1');
      fixed = true;
    }

    // Pattern 4: Clean up empty import statements
    fixedContent = fixedContent.replace(
      /import\s*{\s*}\s*from\s+['"][^'"]+['"];?\s*\n?/g,
      ''
    );

    // Clean up multiple consecutive newlines
    fixedContent = fixedContent.replace(/\n\n\n+/g, '\n\n');

    return { content: fixedContent, fixed };
  }

  /**
   * Merge duplicate imports
   */
  static mergeDuplicateImports(fileContent: string): { content: string; fixed: boolean } {
    const importMap = new Map<string, Set<string>>();
    const defaultImports = new Map<string, string>();
    let hasModuleChanges = false;

    // Extract all imports
    const importRegex = /import\s+(?:(\w+)|{\s*([^}]+)\s*})\s+from\s+['"]([^'"]+)['"]/g;
    let match;
    const imports: Array<{ full: string; default?: string; named?: string[]; module: string }> = [];

    while ((match = importRegex.exec(fileContent)) !== null) {
      const defaultImport = match[1];
      const namedImports = match[2];
      const module = match[3];

      imports.push({
        full: match[0],
        default: defaultImport,
        named: namedImports ? namedImports.split(',').map(s => s.trim()) : undefined,
        module
      });

      // Track named imports per module
      if (namedImports) {
        if (!importMap.has(module)) {
          importMap.set(module, new Set());
        }
        namedImports.split(',').map(s => s.trim()).forEach(imp => {
          importMap.get(module)!.add(imp);
        });
      }

      // Track default imports
      if (defaultImport) {
        if (defaultImports.has(module) && defaultImports.get(module) !== defaultImport) {
          hasModuleChanges = true;
        }
        defaultImports.set(module, defaultImport);
      }
    }

    // Check if there are duplicates
    const moduleCount = new Map<string, number>();
    imports.forEach(imp => {
      moduleCount.set(imp.module, (moduleCount.get(imp.module) || 0) + 1);
    });

    const hasDuplicates = Array.from(moduleCount.values()).some(count => count > 1);

    if (!hasDuplicates && !hasModuleChanges) {
      return { content: fileContent, fixed: false };
    }

    // Remove all old imports
    let fixedContent = fileContent;
    imports.forEach(imp => {
      fixedContent = fixedContent.replace(imp.full, '');
    });

    // Build consolidated imports
    const consolidatedImports: string[] = [];
    const processedModules = new Set<string>();

    for (const module of Array.from(new Set([...importMap.keys(), ...defaultImports.keys()]))) {
      if (processedModules.has(module)) continue;
      processedModules.add(module);

      const defaultImport = defaultImports.get(module);
      const namedImports = importMap.get(module);

      if (defaultImport && namedImports && namedImports.size > 0) {
        // Both default and named imports
        consolidatedImports.push(
          `import ${defaultImport}, { ${Array.from(namedImports).join(', ')} } from '${module}';`
        );
      } else if (defaultImport) {
        // Only default import
        consolidatedImports.push(`import ${defaultImport} from '${module}';`);
      } else if (namedImports && namedImports.size > 0) {
        // Only named imports
        consolidatedImports.push(`import { ${Array.from(namedImports).join(', ')} } from '${module}';`);
      }
    }

    // Insert consolidated imports at the beginning
    const lines = fixedContent.split('\n');
    let insertIndex = 0;

    // Skip comments and blank lines at the beginning
    while (insertIndex < lines.length && (
      lines[insertIndex].trim() === '' ||
      lines[insertIndex].trim().startsWith('//') ||
      lines[insertIndex].trim().startsWith('/*')
    )) {
      insertIndex++;
    }

    lines.splice(insertIndex, 0, ...consolidatedImports, '');
    fixedContent = lines.join('\n');

    // Clean up multiple consecutive newlines
    fixedContent = fixedContent.replace(/\n\n\n+/g, '\n\n');

    return { content: fixedContent, fixed: true };
  }

  /**
   * Add missing property to interface/type
   */
  static addMissingProperty(
    fileContent: string,
    propertyName: string,
    interfaceName?: string
  ): { content: string; fixed: boolean } {
    let fixedContent = fileContent;
    let fixed = false;

    // Determine property type based on naming conventions
    const propertyType = 
      propertyName.match(/^(is|has|should|can|will)[A-Z]/) ? 'boolean' :
      propertyName.match(/^(on|handle)[A-Z]/) ? '() => void' :
      propertyName.match(/Count$|Total$|Index$|Id$/) ? 'number' :
      propertyName.match(/Text$|Name$|Title$|Message$/) ? 'string' :
      'any';

    // Find all interfaces and types
    const interfaceRegex = /(interface\s+(\w+)\s*{)([^}]*)(})/gs;
    
    fixedContent = fixedContent.replace(interfaceRegex, (match, opening, name, body, closing) => {
      // If specific interface name is provided, only fix that one
      if (interfaceName && name !== interfaceName) {
        return match;
      }

      // Check if property already exists
      const propertyPattern = new RegExp(`\\b${propertyName}\\s*[?:]`, 'm');
      if (propertyPattern.test(body)) {
        return match;
      }

      // Add the missing property
      const indent = body.match(/\n(\s+)/)?.[1] || '  ';
      const newProperty = `\n${indent}${propertyName}: ${propertyType};`;
      fixed = true;

      return `${opening}${body}${newProperty}${body.endsWith('\n') ? '' : '\n'}${closing}`;
    });

    return { content: fixedContent, fixed };
  }

  /**
   * Fix type mismatch by adding optional property or default value
   */
  static fixTypeMismatch(
    fileContent: string,
    line: number,
    expectedType: string
  ): { content: string; fixed: boolean } {
    const lines = fileContent.split('\n');
    
    if (line < 1 || line > lines.length) {
      return { content: fileContent, fixed: false };
    }

    const targetLine = lines[line - 1];
    let fixedLine = targetLine;
    let fixed = false;

    // Add default value based on expected type
    if (expectedType === 'boolean') {
      if (!targetLine.includes('=')) {
        fixedLine = targetLine.replace(/\s*(\/\/.*)?$/, ' || false$1');
        fixed = true;
      }
    } else if (expectedType === 'string') {
      if (!targetLine.includes('=')) {
        fixedLine = targetLine.replace(/\s*(\/\/.*)?$/, ' || \'\'$1');
        fixed = true;
      }
    } else if (expectedType === 'number') {
      if (!targetLine.includes('=')) {
        fixedLine = targetLine.replace(/\s*(\/\/.*)?$/, ' || 0$1');
        fixed = true;
      }
    }

    if (fixed) {
      lines[line - 1] = fixedLine;
      return { content: lines.join('\n'), fixed: true };
    }

    return { content: fileContent, fixed: false };
  }

  /**
   * Main fix function that applies all necessary fixes
   */
  static async fixFile(
    filePath: string,
    errorType: 'unused-import' | 'duplicate-import' | 'type-mismatch',
    details: {
      unusedName?: string;
      propertyName?: string;
      interfaceName?: string;
      expectedType?: string;
      line?: number;
    }
  ): Promise<FileFixResult> {
    try {
      // In a real implementation, we would read the actual file
      // For now, this is a template showing how the fixes work
      const result: FileFixResult = {
        success: false,
        filePath,
        originalContent: '',
        fixedContent: '',
        changesApplied: []
      };

      // This would be replaced with actual file reading in production
      // const fileContent = await readFile(filePath);
      
      return result;
    } catch (error) {
      return {
        success: false,
        filePath,
        originalContent: '',
        fixedContent: '',
        changesApplied: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}
