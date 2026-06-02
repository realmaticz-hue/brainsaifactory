// Memory diagnostics utilities for monitoring and debugging

export interface MemorySnapshot {
  timestamp: number;
  component: string;
  operation: string;
  dataSize: number;
  itemCount: number;
  message?: string;
}

const snapshots: MemorySnapshot[] = [];
const MAX_SNAPSHOTS = 50; // Keep last 50 snapshots

/**
 * Log a memory snapshot for diagnostics
 */
export function logMemorySnapshot(
  component: string,
  operation: string,
  dataSize: number,
  itemCount: number,
  message?: string
): void {
  const snapshot: MemorySnapshot = {
    timestamp: Date.now(),
    component,
    operation,
    dataSize,
    itemCount,
    message
  };
  
  snapshots.push(snapshot);
  
  // Keep only last MAX_SNAPSHOTS
  if (snapshots.length > MAX_SNAPSHOTS) {
    snapshots.shift();
  }
  
  // Log to console with formatting
  const sizeMB = (dataSize / 1024 / 1024).toFixed(2);
  console.log(
    `[Memory] ${component}.${operation}: ${sizeMB}MB, ${itemCount} items${message ? ' - ' + message : ''}`
  );
}

/**
 * Get all memory snapshots
 */
export function getMemorySnapshots(): MemorySnapshot[] {
  return [...snapshots];
}

/**
 * Get memory snapshots for a specific component
 */
export function getSnapshotsForComponent(component: string): MemorySnapshot[] {
  return snapshots.filter(s => s.component === component);
}

/**
 * Calculate total memory usage from snapshots
 */
export function getTotalMemoryUsage(): number {
  return snapshots.reduce((sum, s) => sum + s.dataSize, 0);
}

/**
 * Get memory usage summary
 */
export function getMemorySummary(): {
  totalSize: number;
  totalSizeMB: string;
  snapshotCount: number;
  components: Record<string, number>;
  largestSnapshot: MemorySnapshot | null;
} {
  const totalSize = getTotalMemoryUsage();
  const components: Record<string, number> = {};
  
  snapshots.forEach(s => {
    components[s.component] = (components[s.component] || 0) + s.dataSize;
  });
  
  const largestSnapshot = snapshots.length > 0
    ? snapshots.reduce((max, s) => s.dataSize > max.dataSize ? s : max, snapshots[0])
    : null;
  
  return {
    totalSize,
    totalSizeMB: (totalSize / 1024 / 1024).toFixed(2),
    snapshotCount: snapshots.length,
    components,
    largestSnapshot
  };
}

/**
 * Clear all memory snapshots
 */
export function clearMemorySnapshots(): void {
  snapshots.length = 0;
  console.log('[Memory] Snapshots cleared');
}

/**
 * Check if memory usage is approaching limits
 */
export function checkMemoryThresholds(currentSize: number, maxSize: number): {
  isWarning: boolean;
  isCritical: boolean;
  percentage: number;
  message: string;
} {
  const percentage = (currentSize / maxSize) * 100;
  
  let isWarning = false;
  let isCritical = false;
  let message = '';
  
  if (percentage >= 90) {
    isCritical = true;
    message = `🔴 CRITICAL: ${percentage.toFixed(0)}% of memory limit used`;
  } else if (percentage >= 75) {
    isWarning = true;
    message = `⚠️ WARNING: ${percentage.toFixed(0)}% of memory limit used`;
  } else if (percentage >= 50) {
    message = `⚡ INFO: ${percentage.toFixed(0)}% of memory limit used`;
  } else {
    message = `✅ OK: ${percentage.toFixed(0)}% of memory limit used`;
  }
  
  return {
    isWarning,
    isCritical,
    percentage,
    message
  };
}

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Export memory diagnostics as JSON
 */
export function exportMemoryDiagnostics(): string {
  const summary = getMemorySummary();
  const diagnostics = {
    timestamp: new Date().toISOString(),
    summary,
    snapshots: getMemorySnapshots()
  };
  
  return JSON.stringify(diagnostics, null, 2);
}

/**
 * Log memory diagnostics summary to console
 */
export function logMemorySummary(): void {
  const summary = getMemorySummary();
  
  console.log('\n═══ MEMORY DIAGNOSTICS SUMMARY ═══');
  console.log(`Total Memory Usage: ${summary.totalSizeMB} MB`);
  console.log(`Snapshot Count: ${summary.snapshotCount}`);
  console.log('\nMemory by Component:');
  
  Object.entries(summary.components)
    .sort(([, a], [, b]) => b - a)
    .forEach(([component, size]) => {
      const sizeMB = (size / 1024 / 1024).toFixed(2);
      console.log(`  ${component}: ${sizeMB} MB`);
    });
  
  if (summary.largestSnapshot) {
    const s = summary.largestSnapshot;
    const sizeMB = (s.dataSize / 1024 / 1024).toFixed(2);
    console.log('\nLargest Snapshot:');
    console.log(`  Component: ${s.component}`);
    console.log(`  Operation: ${s.operation}`);
    console.log(`  Size: ${sizeMB} MB`);
    console.log(`  Items: ${s.itemCount}`);
    if (s.message) {
      console.log(`  Message: ${s.message}`);
    }
  }
  
  console.log('═══════════════════════════════════\n');
}

// Auto-log summary every 5 minutes in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  setInterval(() => {
    if (snapshots.length > 0) {
      logMemorySummary();
    }
  }, 5 * 60 * 1000);
}
