// =============================================================================
// PROJECTION-DRIVEN STATE — Compute On-Demand, Store Minimal
// =============================================================================
//
// Instead of storing ALL state (which explodes token usage when loading context),
// we store MINIMAL canonical state and compute derived views on-demand.
//
// Key Principles:
//   • Store only SOURCE OF TRUTH (events, commands, entities)
//   • Compute PROJECTIONS when needed (views, summaries, aggregates)
//   • Never store what can be computed
//   • Tiny context windows - only load what's needed
//
// Example:
//   ❌ BAD: Store full blog post + metadata + analytics + recommendations
//   ✅ GOOD: Store blog post ID. Compute metadata/analytics when requested.
//
// This is how event-sourced systems work at enterprise scale.
// =============================================================================

export interface ProjectionConfig {
  ttl?: number; // Cache TTL in milliseconds
  maxCacheSize?: number; // Max items in cache
  computeOnDemand?: boolean; // Default: true
}

export interface Projection<TSource, TView> {
  name: string;
  compute: (source: TSource) => TView;
  config?: ProjectionConfig;
}

export interface StateSnapshot {
  entityId: string;
  type: string;
  data: any;
  version: number;
  timestamp: number;
}

// ────────────────────────────────────────────────────────────────────────────
// PROJECTION-DRIVEN STATE MANAGER
// ────────────────────────────────────────────────────────────────────────────

class ProjectionStateManager {
  // Minimal canonical state storage (source of truth)
  private entities: Map<string, StateSnapshot> = new Map();

  // Projection caches (computed views)
  private projectionCaches: Map<string, Map<string, { value: any; timestamp: number }>> = new Map();

  // Registered projections
  private projections: Map<string, Projection<any, any>> = new Map();

  constructor() {
    this.loadFromStorage();
    this.startCacheCleanup();
  }

  // ────────────────────────────────────────────────────────────────────────────
  // ENTITY STORAGE (Minimal State)
  // ────────────────────────────────────────────────────────────────────────────

  /**
   * Store minimal entity state (source of truth only)
   */
  storeEntity(snapshot: Omit<StateSnapshot, 'version' | 'timestamp'>): void {
    const existing = this.entities.get(snapshot.entityId);
    const version = existing ? existing.version + 1 : 1;

    this.entities.set(snapshot.entityId, {
      ...snapshot,
      version,
      timestamp: Date.now(),
    });

    // Invalidate all projection caches for this entity
    this.invalidateProjections(snapshot.entityId);

    this.saveToStorage();
  }

  /**
   * Get minimal entity state (no projections computed)
   */
  getEntity(entityId: string): StateSnapshot | undefined {
    return this.entities.get(entityId);
  }

  /**
   * Get multiple entities efficiently
   */
  getEntities(entityIds: string[]): StateSnapshot[] {
    return entityIds
      .map(id => this.entities.get(id))
      .filter((e): e is StateSnapshot => e !== undefined);
  }

  /**
   * Query entities by type (still minimal - no projections)
   */
  queryEntities(type: string, filter?: (snapshot: StateSnapshot) => boolean): StateSnapshot[] {
    const entities = Array.from(this.entities.values()).filter(e => e.type === type);
    return filter ? entities.filter(filter) : entities;
  }

  deleteEntity(entityId: string): void {
    this.entities.delete(entityId);
    this.invalidateProjections(entityId);
    this.saveToStorage();
  }

  // ────────────────────────────────────────────────────────────────────────────
  // PROJECTION SYSTEM (Computed Views)
  // ────────────────────────────────────────────────────────────────────────────

  /**
   * Register a projection (how to compute a view from source state)
   */
  registerProjection<TSource, TView>(projection: Projection<TSource, TView>): void {
    this.projections.set(projection.name, projection);
    this.projectionCaches.set(projection.name, new Map());
  }

  /**
   * Get a projected view (computed on-demand or from cache)
   */
  project<TView>(projectionName: string, entityId: string): TView | undefined {
    const projection = this.projections.get(projectionName);
    if (!projection) {
      throw new Error(`Projection "${projectionName}" not registered`);
    }

    // Check cache first
    const cache = this.projectionCaches.get(projectionName)!;
    const cached = cache.get(entityId);

    if (cached) {
      const ttl = projection.config?.ttl || 60000; // Default 1 min
      if (Date.now() - cached.timestamp < ttl) {
        return cached.value as TView;
      }
    }

    // Cache miss or expired - compute on-demand
    const entity = this.entities.get(entityId);
    if (!entity) return undefined;

    const view = projection.compute(entity.data);

    // Cache the result
    const maxCacheSize = projection.config?.maxCacheSize || 1000;
    if (cache.size >= maxCacheSize) {
      // Evict oldest entry (simple LRU)
      const oldestKey = cache.keys().next().value;
      cache.delete(oldestKey);
    }

    cache.set(entityId, { value: view, timestamp: Date.now() });

    return view;
  }

  /**
   * Project multiple entities efficiently
   */
  projectMany<TView>(projectionName: string, entityIds: string[]): TView[] {
    return entityIds
      .map(id => this.project<TView>(projectionName, id))
      .filter((v): v is TView => v !== undefined);
  }

  /**
   * Invalidate projection cache for an entity
   */
  invalidateProjections(entityId: string): void {
    this.projectionCaches.forEach(cache => {
      cache.delete(entityId);
    });
  }

  /**
   * Clear all projection caches
   */
  clearProjectionCaches(): void {
    this.projectionCaches.forEach(cache => cache.clear());
  }

  // ────────────────────────────────────────────────────────────────────────────
  // AGGREGATE PROJECTIONS (Compute summaries without loading everything)
  // ────────────────────────────────────────────────────────────────────────────

  /**
   * Compute aggregate projection (summary stats) without loading full entities
   */
  aggregate<TAgg>(
    type: string,
    aggregator: (snapshots: StateSnapshot[]) => TAgg,
    filter?: (snapshot: StateSnapshot) => boolean
  ): TAgg {
    // Only load minimal snapshots (not full projections)
    const entities = this.queryEntities(type, filter);
    return aggregator(entities);
  }

  // ────────────────────────────────────────────────────────────────────────────
  // TOKEN EFFICIENCY HELPERS
  // ────────────────────────────────────────────────────────────────────────────

  /**
   * Get entity count without loading any data
   */
  getEntityCount(type?: string): number {
    if (type) {
      return Array.from(this.entities.values()).filter(e => e.type === type).length;
    }
    return this.entities.size;
  }

  /**
   * Get entity IDs only (minimal token footprint)
   */
  getEntityIds(type?: string): string[] {
    if (type) {
      return Array.from(this.entities.values())
        .filter(e => e.type === type)
        .map(e => e.entityId);
    }
    return Array.from(this.entities.keys());
  }

  /**
   * Check if entity exists without loading it
   */
  entityExists(entityId: string): boolean {
    return this.entities.has(entityId);
  }

  /**
   * Get memory footprint stats
   */
  getMemoryStats(): {
    entityCount: number;
    projectionCacheSize: number;
    estimatedBytes: number;
  } {
    const entityCount = this.entities.size;
    let projectionCacheSize = 0;
    this.projectionCaches.forEach(cache => {
      projectionCacheSize += cache.size;
    });

    // Rough estimate: ~1KB per entity, ~500B per cached projection
    const estimatedBytes = entityCount * 1024 + projectionCacheSize * 512;

    return {
      entityCount,
      projectionCacheSize,
      estimatedBytes,
    };
  }

  // ────────────────────────────────────────────────────────────────────────────
  // PERSISTENCE
  // ────────────────────────────────────────────────────────────────────────────

  private saveToStorage(): void {
    try {
      // Only store entities (minimal state)
      const data = Array.from(this.entities.entries());
      localStorage.setItem('projectionStateEntities', JSON.stringify(data));
    } catch (err) {
      console.warn('[ProjectionState] Failed to save to localStorage:', err);
    }
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('projectionStateEntities');
      if (stored) {
        const data = JSON.parse(stored);
        this.entities = new Map(data);
      }
    } catch (err) {
      console.warn('[ProjectionState] Failed to load from localStorage:', err);
    }
  }

  private startCacheCleanup(): void {
    // Clean up expired cache entries every 5 minutes
    setInterval(() => {
      this.projectionCaches.forEach((cache, projectionName) => {
        const projection = this.projections.get(projectionName);
        const ttl = projection?.config?.ttl || 60000;
        const now = Date.now();

        cache.forEach((entry, entityId) => {
          if (now - entry.timestamp > ttl) {
            cache.delete(entityId);
          }
        });
      });
    }, 5 * 60 * 1000);
  }

  // ────────────────────────────────────────────────────────────────────────────
  // UTILITY: Export minimal state for AI context
  // ────────────────────────────────────────────────────────────────────────────

  /**
   * Export MINIMAL state summary for AI context (token-efficient)
   */
  exportMinimalContext(type?: string): string {
    const entities = type
      ? this.queryEntities(type)
      : Array.from(this.entities.values());

    const summary = {
      count: entities.length,
      types: [...new Set(entities.map(e => e.type))],
      ids: entities.map(e => e.entityId).slice(0, 20), // Max 20 IDs
      sample: entities[0] ? { id: entities[0].entityId, type: entities[0].type } : null,
    };

    return JSON.stringify(summary);
  }
}

// ────────────────────────────────────────────────────────────────────────────
// SINGLETON INSTANCE
// ────────────────────────────────────────────────────────────────────────────

export const projectionState = new ProjectionStateManager();

// ────────────────────────────────────────────────────────────────────────────
// EXAMPLE PROJECTIONS
// ────────────────────────────────────────────────────────────────────────────

// Example: Blog post metadata projection
export interface BlogPostEntity {
  id: string;
  content: string;
  title: string;
  createdAt: number;
}

export interface BlogPostMetadataView {
  wordCount: number;
  readingTime: number; // minutes
  excerpt: string;
  keywords: string[];
}

projectionState.registerProjection<BlogPostEntity, BlogPostMetadataView>({
  name: 'blog-metadata',
  compute: (post) => {
    const words = post.content.split(/\s+/).length;
    return {
      wordCount: words,
      readingTime: Math.ceil(words / 200), // 200 WPM avg
      excerpt: post.content.slice(0, 200) + '...',
      keywords: extractKeywords(post.content),
    };
  },
  config: {
    ttl: 5 * 60 * 1000, // Cache for 5 minutes
    maxCacheSize: 500,
  },
});

// Helper function for keyword extraction
function extractKeywords(text: string): string[] {
  // Simple keyword extraction (in production, use NLP)
  const words = text
    .toLowerCase()
    .split(/\s+/)
    .filter(w => w.length > 4);

  const frequency = new Map<string, number>();
  words.forEach(w => {
    frequency.set(w, (frequency.get(w) || 0) + 1);
  });

  return Array.from(frequency.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word);
}
