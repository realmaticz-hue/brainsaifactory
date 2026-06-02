// ── Universal Error Knowledge Graph ──────────────────────────────────────────
// Stores error patterns, repairs, and success metrics for continuous learning

import * as kv from './kv_store.tsx';

interface RepairPattern {
  fingerprintId: string;         // Links to error fingerprint
  category: string;              // Error category
  layer: string;                 // Which layer (syntax, framework, etc.)
  repairType: string;            // Type of fix applied
  confidence: number;            // 0-1 confidence score
  successCount: number;          // Times this repair succeeded
  failureCount: number;          // Times this repair failed
  lastUsed: number;              // Timestamp
  created: number;               // When pattern was first learned
  transformationRule?: string;   // Description of the fix
  example?: {                    // Example of the fix
    before: string;
    after: string;
  };
}

interface KnowledgeGraphNode {
  fingerprintId: string;
  errorPattern: string;
  category: string;
  layer: string;
  framework?: string;
  repairs: RepairPattern[];      // Possible repair strategies
  totalOccurrences: number;      // How often this error appears
  lastSeen: number;
}

const KG_PREFIX = 'kg:';
const REPAIR_PREFIX = 'repair:';
const STATS_KEY = 'kg:stats';

/**
 * Store or update a knowledge graph node
 */
export async function storeKnowledgeNode(node: KnowledgeGraphNode): Promise<void> {
  const key = `${KG_PREFIX}${node.fingerprintId}`;
  await kv.set(key, JSON.stringify(node));
  
  // Update global stats
  await incrementGlobalStats();
}

/**
 * Retrieve a knowledge graph node by fingerprint ID
 */
export async function getKnowledgeNode(fingerprintId: string): Promise<KnowledgeGraphNode | null> {
  const key = `${KG_PREFIX}${fingerprintId}`;
  const data = await kv.get(key);
  
  if (!data) return null;
  
  try {
    return JSON.parse(data);
  } catch (e) {
    console.error('[KnowledgeGraph] Failed to parse node:', e);
    return null;
  }
}

/**
 * Store a repair pattern
 */
export async function storeRepairPattern(pattern: RepairPattern): Promise<void> {
  const key = `${REPAIR_PREFIX}${pattern.fingerprintId}:${Date.now()}`;
  await kv.set(key, JSON.stringify(pattern));
}

/**
 * Get all repair patterns for a fingerprint ID
 */
export async function getRepairPatterns(fingerprintId: string): Promise<RepairPattern[]> {
  const prefix = `${REPAIR_PREFIX}${fingerprintId}`;
  const results = await kv.getByPrefix(prefix);
  
  const patterns: RepairPattern[] = [];
  for (const result of results) {
    try {
      const pattern = JSON.parse(result.value);
      patterns.push(pattern);
    } catch (e) {
      console.error('[KnowledgeGraph] Failed to parse repair pattern:', e);
    }
  }
  
  // Sort by confidence descending
  return patterns.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Learn from a successful repair
 */
export async function learnFromRepair(
  fingerprintId: string,
  errorPattern: string,
  category: string,
  layer: string,
  repairType: string,
  beforeCode?: string,
  afterCode?: string
): Promise<void> {
  console.log(`[KnowledgeGraph] 📚 Learning from repair: ${fingerprintId}`);
  
  // Get or create knowledge node
  let node = await getKnowledgeNode(fingerprintId);
  
  if (!node) {
    // Create new node
    node = {
      fingerprintId,
      errorPattern,
      category,
      layer,
      repairs: [],
      totalOccurrences: 1,
      lastSeen: Date.now()
    };
  } else {
    // Update existing node
    node.totalOccurrences++;
    node.lastSeen = Date.now();
  }
  
  // Find existing repair pattern or create new one
  let repair = node.repairs.find(r => r.repairType === repairType);
  
  if (repair) {
    // Update existing repair pattern
    repair.successCount++;
    repair.lastUsed = Date.now();
    // Recalculate confidence
    repair.confidence = repair.successCount / (repair.successCount + repair.failureCount);
  } else {
    // Create new repair pattern
    repair = {
      fingerprintId,
      category,
      layer,
      repairType,
      confidence: 1.0, // 100% confidence on first success
      successCount: 1,
      failureCount: 0,
      lastUsed: Date.now(),
      created: Date.now()
    };
    
    // Add example if provided
    if (beforeCode && afterCode) {
      repair.example = {
        before: beforeCode.substring(0, 500), // Limit size
        after: afterCode.substring(0, 500)
      };
    }
    
    node.repairs.push(repair);
  }
  
  // Sort repairs by confidence
  node.repairs.sort((a, b) => b.confidence - a.confidence);
  
  // Store updated node
  await storeKnowledgeNode(node);
  
  // Store individual repair pattern
  await storeRepairPattern(repair);
  
  console.log(`[KnowledgeGraph] ✅ Learned repair pattern: ${repairType} (confidence: ${repair.confidence.toFixed(2)})`);
}

/**
 * Record a failed repair attempt
 */
export async function recordRepairFailure(
  fingerprintId: string,
  repairType: string
): Promise<void> {
  console.log(`[KnowledgeGraph] ⚠️ Recording repair failure: ${repairType}`);
  
  const node = await getKnowledgeNode(fingerprintId);
  if (!node) return;
  
  const repair = node.repairs.find(r => r.repairType === repairType);
  if (repair) {
    repair.failureCount++;
    repair.confidence = repair.successCount / (repair.successCount + repair.failureCount);
    
    // Re-sort by confidence
    node.repairs.sort((a, b) => b.confidence - a.confidence);
    
    await storeKnowledgeNode(node);
  }
}

/**
 * Get best repair strategy for a fingerprint
 */
export async function getBestRepairStrategy(fingerprintId: string): Promise<RepairPattern | null> {
  const patterns = await getRepairPatterns(fingerprintId);
  
  if (patterns.length === 0) return null;
  
  // Return highest confidence pattern
  return patterns[0];
}

/**
 * Get global knowledge graph statistics
 */
export async function getKnowledgeGraphStats(): Promise<{
  totalErrors: number;
  totalRepairs: number;
  avgConfidence: number;
  topCategories: Array<{ category: string; count: number }>;
}> {
  const statsData = await kv.get(STATS_KEY);
  
  if (statsData) {
    try {
      return JSON.parse(statsData);
    } catch (e) {
      console.error('[KnowledgeGraph] Failed to parse stats:', e);
    }
  }
  
  // Return default stats
  return {
    totalErrors: 0,
    totalRepairs: 0,
    avgConfidence: 0,
    topCategories: []
  };
}

/**
 * Increment global statistics
 */
async function incrementGlobalStats(): Promise<void> {
  const stats = await getKnowledgeGraphStats();
  stats.totalErrors++;
  
  await kv.set(STATS_KEY, JSON.stringify(stats));
}

/**
 * Search knowledge graph by category and layer
 * Memory-optimized with pagination
 */
export async function searchKnowledgeGraph(
  category?: string,
  layer?: string,
  limit: number = 50
): Promise<KnowledgeGraphNode[]> {
  // Limit the number of results to prevent memory overflow
  const HARD_LIMIT = 100;
  const effectiveLimit = Math.min(limit, HARD_LIMIT);
  
  const allNodes = await kv.getByPrefix(KG_PREFIX);
  
  const nodes: KnowledgeGraphNode[] = [];
  let processedCount = 0;
  const MAX_PROCESS = 1000; // Stop processing after 1000 items
  
  for (const result of allNodes) {
    // Prevent infinite loops on large datasets
    if (processedCount++ > MAX_PROCESS) {
      console.warn(`[KnowledgeGraph] Hit processing limit (${MAX_PROCESS} items), stopping search`);
      break;
    }
    
    // Stop early if we have enough results
    if (nodes.length >= effectiveLimit) {
      break;
    }
    
    try {
      const node = JSON.parse(result.value);
      
      // Filter by category and layer if specified
      if (category && node.category !== category) continue;
      if (layer && node.layer !== layer) continue;
      
      nodes.push(node);
    } catch (e) {
      console.error('[KnowledgeGraph] Failed to parse node:', e);
    }
  }
  
  // Sort by total occurrences (most common errors first)
  return nodes
    .sort((a, b) => b.totalOccurrences - a.totalOccurrences)
    .slice(0, effectiveLimit);
}

/**
 * Export knowledge graph for backup or sharing
 * Memory-optimized with chunking
 */
export async function exportKnowledgeGraph(): Promise<{
  nodes: KnowledgeGraphNode[];
  stats: any;
  exportedAt: number;
  truncated?: boolean;
}> {
  const MAX_NODES = 500; // Limit export size
  const allNodes = await kv.getByPrefix(KG_PREFIX);
  const nodes: KnowledgeGraphNode[] = [];
  
  let count = 0;
  for (const result of allNodes) {
    if (count++ >= MAX_NODES) {
      console.warn(`[KnowledgeGraph] Export truncated at ${MAX_NODES} nodes`);
      break;
    }
    
    try {
      nodes.push(JSON.parse(result.value));
    } catch (e) {
      console.error('[KnowledgeGraph] Failed to parse node during export:', e);
    }
  }
  
  const stats = await getKnowledgeGraphStats();
  
  return {
    nodes,
    stats,
    exportedAt: Date.now(),
    truncated: count >= MAX_NODES
  };
}