// ═══════════════════════════════════════════════════════════════════════════════
// BRAIN LEARNING ENGINE — Continuously Learning AI System
// Learns from every command, gets smarter over time, builds knowledge base
// ═══════════════════════════════════════════════════════════════════════════════

// ── Types ────────────────────────────────────────────────────────────────────

export interface LearningMetrics {
  intelligenceScore: number; // 0-200 IQ-style score
  totalLearnings: number;
  commandPatterns: number;
  successRate: number;
  averageConfidence: number;
  knowledgeBaseSize: number;
  improvementRate: number; // How fast the system is learning
  lastImprovement: number; // Timestamp of last IQ increase
}

export interface KnowledgeEntry {
  id: string;
  type: 'command-pattern' | 'user-preference' | 'best-practice' | 'error-solution' | 'optimization';
  topic: string;
  learning: string;
  confidence: number; // 0-100
  frequency: number; // How often this pattern appears
  successRate: number; // 0-1
  relatedTags: string[];
  examples: string[];
  createdAt: number;
  lastUsed: number;
  timesApplied: number;
}

export interface CommandPattern {
  id: string;
  pattern: string;
  commonWords: string[];
  typicalTags: string[];
  avgSuccessRate: number;
  frequency: number;
  suggestedFileStructure: string[];
  learningNotes: string[];
}

export interface Suggestion {
  id: string;
  text: string;
  reason: string;
  confidence: number;
  basedOn: string[]; // IDs of knowledge entries
  type: 'improvement' | 'alternative' | 'best-practice' | 'warning';
}

export interface LearningEvent {
  id: string;
  timestamp: number;
  type: 'pattern-discovered' | 'improvement-made' | 'knowledge-added' | 'error-learned' | 'iq-increased';
  description: string;
  iqChange: number;
  newKnowledge?: KnowledgeEntry;
}

// ── Storage Keys ──────────────────────────────────────────────────────────────

const STORAGE_KEYS = {
  METRICS: 'brain_learning_metrics',
  KNOWLEDGE: 'brain_knowledge_base',
  PATTERNS: 'brain_command_patterns',
  EVENTS: 'brain_learning_events',
  PREFERENCES: 'brain_user_preferences',
};

// ── Learning Engine Class ────────────────────────────────────────────────────

class BrainLearningEngineClass {
  private _metrics: LearningMetrics;
  private _knowledge: KnowledgeEntry[] = [];
  private _patterns: CommandPattern[] = [];
  private _events: LearningEvent[] = [];
  private _listeners: Set<() => void> = new Set();

  constructor() {
    this._metrics = this.loadMetrics();
    this._knowledge = this.loadKnowledge();
    this._patterns = this.loadPatterns();
    this._events = this.loadEvents();
  }

  // ── Persistence ────────────────────────────────────────────────────────────

  private loadMetrics(): LearningMetrics {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.METRICS);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('[LearningEngine] Failed to load metrics:', e);
    }
    return {
      intelligenceScore: 100,
      totalLearnings: 0,
      commandPatterns: 0,
      successRate: 1.0,
      averageConfidence: 50,
      knowledgeBaseSize: 0,
      improvementRate: 0,
      lastImprovement: Date.now(),
    };
  }

  private saveMetrics() {
    try {
      localStorage.setItem(STORAGE_KEYS.METRICS, JSON.stringify(this._metrics));
    } catch (e) {
      console.warn('[LearningEngine] Failed to save metrics:', e);
    }
  }

  private loadKnowledge(): KnowledgeEntry[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.KNOWLEDGE);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('[LearningEngine] Failed to load knowledge:', e);
    }
    return this.getSeedKnowledge();
  }

  private saveKnowledge() {
    try {
      localStorage.setItem(STORAGE_KEYS.KNOWLEDGE, JSON.stringify(this._knowledge));
    } catch (e) {
      console.warn('[LearningEngine] Failed to save knowledge:', e);
    }
  }

  private loadPatterns(): CommandPattern[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.PATTERNS);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('[LearningEngine] Failed to load patterns:', e);
    }
    return [];
  }

  private savePatterns() {
    try {
      localStorage.setItem(STORAGE_KEYS.PATTERNS, JSON.stringify(this._patterns));
    } catch (e) {
      console.warn('[LearningEngine] Failed to save patterns:', e);
    }
  }

  private loadEvents(): LearningEvent[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.EVENTS);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('[LearningEngine] Failed to load events:', e);
    }
    return [];
  }

  private saveEvents() {
    try {
      localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(this._events));
    } catch (e) {
      console.warn('[LearningEngine] Failed to save events:', e);
    }
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  subscribe(listener: () => void): () => void {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }

  private emit() {
    this._listeners.forEach((fn) => fn());
  }

  getMetrics(): LearningMetrics {
    return { ...this._metrics };
  }

  getKnowledge(): KnowledgeEntry[] {
    return [...this._knowledge];
  }

  getPatterns(): CommandPattern[] {
    return [...this._patterns];
  }

  getEvents(limit = 50): LearningEvent[] {
    return this._events.slice(0, limit);
  }

  // ── Learn from Command ─────────────────────────────────────────────────────

  async learnFromCommand(command: {
    code: string;
    name: string;
    tags: string[];
    success: boolean;
    files: Array<{ path: string; language: string }>;
  }): Promise<void> {
    const startIQ = this._metrics.intelligenceScore;

    // 1. Extract patterns
    await this.extractPatterns(command);

    // 2. Update knowledge base
    await this.updateKnowledge(command);

    // 3. Calculate improvements
    await this.calculateImprovements(command);

    // 4. Check for IQ increase
    const endIQ = this._metrics.intelligenceScore;
    if (endIQ > startIQ) {
      this.addEvent({
        type: 'iq-increased',
        description: `Intelligence increased by ${(endIQ - startIQ).toFixed(1)} points to ${endIQ.toFixed(1)}`,
        iqChange: endIQ - startIQ,
      });
    }

    // 5. Update metrics
    this._metrics.totalLearnings++;
    this._metrics.knowledgeBaseSize = this._knowledge.length;
    this._metrics.commandPatterns = this._patterns.length;
    this._metrics.averageConfidence = this.calculateAverageConfidence();
    this._metrics.successRate = this.calculateSuccessRate();
    this._metrics.improvementRate = this.calculateImprovementRate();

    this.saveAll();
    this.emit();
  }

  // ── Pattern Extraction ─────────────────────────────────────────────────────

  private async extractPatterns(command: {
    code: string;
    name: string;
    tags: string[];
    success: boolean;
    files: Array<{ path: string; language: string }>;
  }): Promise<void> {
    const words = command.code.toLowerCase().split(/\s+/);
    const commonWords = words.filter((w) => w.length > 4).slice(0, 10);

    // Check if pattern exists
    const existingPattern = this._patterns.find((p) =>
      p.commonWords.some((w) => commonWords.includes(w)) &&
      p.typicalTags.some((t) => command.tags.includes(t))
    );

    if (existingPattern) {
      // Update existing pattern
      existingPattern.frequency++;
      existingPattern.avgSuccessRate =
        (existingPattern.avgSuccessRate * (existingPattern.frequency - 1) + (command.success ? 1 : 0)) /
        existingPattern.frequency;

      // Merge new insights
      commonWords.forEach((w) => {
        if (!existingPattern.commonWords.includes(w)) {
          existingPattern.commonWords.push(w);
        }
      });

      command.tags.forEach((t) => {
        if (!existingPattern.typicalTags.includes(t)) {
          existingPattern.typicalTags.push(t);
        }
      });

      // Increase IQ for pattern recognition
      this._metrics.intelligenceScore += 0.5;
    } else {
      // Create new pattern
      const newPattern: CommandPattern = {
        id: `pattern-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        pattern: command.name,
        commonWords,
        typicalTags: command.tags,
        avgSuccessRate: command.success ? 1 : 0,
        frequency: 1,
        suggestedFileStructure: command.files.map((f) => f.path),
        learningNotes: [],
      };

      this._patterns.push(newPattern);

      this.addEvent({
        type: 'pattern-discovered',
        description: `New command pattern discovered: "${command.name}"`,
        iqChange: 1,
      });

      // Increase IQ for discovering new pattern
      this._metrics.intelligenceScore += 1;
    }
  }

  // ── Knowledge Base Update ──────────────────────────────────────────────────

  private async updateKnowledge(command: {
    code: string;
    name: string;
    tags: string[];
    success: boolean;
    files: Array<{ path: string; language: string }>;
  }): Promise<void> {
    // Check for learnings
    if (command.tags.includes('api')) {
      await this.addKnowledge({
        type: 'command-pattern',
        topic: 'API Development',
        learning: `User frequently creates API endpoints. Prefer RESTful structure with clear route naming.`,
        confidence: 70,
        relatedTags: ['api', 'rest', 'endpoint'],
        examples: [command.name],
      });
    }

    if (command.tags.includes('ui')) {
      await this.addKnowledge({
        type: 'command-pattern',
        topic: 'UI Components',
        learning: `User builds React components. Use functional components with TypeScript and Tailwind CSS.`,
        confidence: 75,
        relatedTags: ['ui', 'react', 'component'],
        examples: [command.name],
      });
    }

    if (command.tags.includes('database')) {
      await this.addKnowledge({
        type: 'best-practice',
        topic: 'Database Operations',
        learning: `For prototyping, use KV store. Avoid complex migrations in early stages.`,
        confidence: 80,
        relatedTags: ['database', 'kv', 'storage'],
        examples: [command.name],
      });
    }

    // Success-based learning
    if (command.success) {
      this._metrics.intelligenceScore += 0.2;
      this.addEvent({
        type: 'improvement-made',
        description: `Successfully executed command: "${command.name}"`,
        iqChange: 0.2,
      });
    }
  }

  private async addKnowledge(partial: Omit<KnowledgeEntry, 'id' | 'frequency' | 'successRate' | 'createdAt' | 'lastUsed' | 'timesApplied'>): Promise<void> {
    // Check if similar knowledge exists
    const existing = this._knowledge.find(
      (k) => k.topic === partial.topic && k.type === partial.type
    );

    if (existing) {
      // Update existing knowledge
      existing.frequency++;
      existing.lastUsed = Date.now();
      existing.timesApplied++;
      existing.confidence = Math.min(100, existing.confidence + 2);

      // Merge examples
      partial.examples.forEach((ex) => {
        if (!existing.examples.includes(ex)) {
          existing.examples.push(ex);
          if (existing.examples.length > 10) existing.examples.shift();
        }
      });

      this._metrics.intelligenceScore += 0.1;
    } else {
      // Add new knowledge
      const newKnowledge: KnowledgeEntry = {
        ...partial,
        id: `knowledge-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        frequency: 1,
        successRate: 1.0,
        createdAt: Date.now(),
        lastUsed: Date.now(),
        timesApplied: 1,
      };

      this._knowledge.push(newKnowledge);

      this.addEvent({
        type: 'knowledge-added',
        description: `New knowledge acquired: ${partial.topic} - ${partial.learning}`,
        iqChange: 0.5,
        newKnowledge,
      });

      this._metrics.intelligenceScore += 0.5;
    }
  }

  // ── Improvement Calculation ───────────────────────────────────────────────

  private async calculateImprovements(command: { success: boolean }): Promise<void> {
    if (command.success) {
      const timeSinceLastImprovement = Date.now() - this._metrics.lastImprovement;
      const hoursElapsed = timeSinceLastImprovement / (1000 * 60 * 60);

      // Faster learning in the beginning
      if (this._metrics.totalLearnings < 10) {
        this._metrics.intelligenceScore += 1.5;
      } else if (this._metrics.totalLearnings < 50) {
        this._metrics.intelligenceScore += 1.0;
      } else {
        this._metrics.intelligenceScore += 0.5;
      }

      // Calculate improvement rate (learnings per hour)
      this._metrics.improvementRate = this._metrics.totalLearnings / Math.max(hoursElapsed, 0.1);
      this._metrics.lastImprovement = Date.now();
    }
  }

  // ── Suggestions ────────────────────────────────────────────────────────────

  getSuggestionsForCommand(commandText: string): Suggestion[] {
    const suggestions: Suggestion[] = [];
    const lowerText = commandText.toLowerCase();

    // Pattern-based suggestions
    for (const pattern of this._patterns) {
      const matchScore = pattern.commonWords.filter((w) => lowerText.includes(w)).length;
      if (matchScore > 0 && pattern.avgSuccessRate > 0.7) {
        suggestions.push({
          id: `sug-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          text: `Consider using pattern: "${pattern.pattern}"`,
          reason: `This pattern has ${(pattern.avgSuccessRate * 100).toFixed(0)}% success rate (used ${pattern.frequency}× before)`,
          confidence: Math.min(95, pattern.avgSuccessRate * 100),
          basedOn: [pattern.id],
          type: 'best-practice',
        });
      }
    }

    // Knowledge-based suggestions
    for (const knowledge of this._knowledge) {
      if (knowledge.relatedTags.some((tag) => lowerText.includes(tag))) {
        if (knowledge.confidence > 60) {
          suggestions.push({
            id: `sug-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            text: knowledge.learning,
            reason: `Based on ${knowledge.frequency} previous learnings in ${knowledge.topic}`,
            confidence: knowledge.confidence,
            basedOn: [knowledge.id],
            type: knowledge.type === 'best-practice' ? 'best-practice' : 'improvement',
          });
        }
      }
    }

    // Sort by confidence
    return suggestions.sort((a, b) => b.confidence - a.confidence).slice(0, 5);
  }

  // ── Analytics ──────────────────────────────────────────────────────────────

  private calculateAverageConfidence(): number {
    if (this._knowledge.length === 0) return 50;
    const sum = this._knowledge.reduce((s, k) => s + k.confidence, 0);
    return Math.round(sum / this._knowledge.length);
  }

  private calculateSuccessRate(): number {
    if (this._patterns.length === 0) return 1.0;
    const sum = this._patterns.reduce((s, p) => s + p.avgSuccessRate, 0);
    return sum / this._patterns.length;
  }

  private calculateImprovementRate(): number {
    const recentEvents = this._events.slice(0, 20);
    if (recentEvents.length < 2) return 0;

    const timeDiff = recentEvents[0].timestamp - recentEvents[recentEvents.length - 1].timestamp;
    const hoursDiff = timeDiff / (1000 * 60 * 60);

    return hoursDiff > 0 ? recentEvents.length / hoursDiff : 0;
  }

  private addEvent(partial: Omit<LearningEvent, 'id' | 'timestamp'>): void {
    const event: LearningEvent = {
      ...partial,
      id: `event-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: Date.now(),
    };

    this._events.unshift(event);
    if (this._events.length > 500) this._events.length = 500;
  }

  private saveAll(): void {
    this.saveMetrics();
    this.saveKnowledge();
    this.savePatterns();
    this.saveEvents();
  }

  // ── Seed Knowledge ─────────────────────────────────────────────────────────

  private getSeedKnowledge(): KnowledgeEntry[] {
    const now = Date.now();
    return [
      {
        id: 'seed-1',
        type: 'best-practice',
        topic: 'React Components',
        learning: 'Use functional components with TypeScript for better type safety and modern React patterns',
        confidence: 85,
        frequency: 1,
        successRate: 1.0,
        relatedTags: ['react', 'ui', 'component', 'typescript'],
        examples: ['UserProfile Component', 'Dashboard Widget'],
        createdAt: now,
        lastUsed: now,
        timesApplied: 1,
      },
      {
        id: 'seed-2',
        type: 'best-practice',
        topic: 'API Design',
        learning: 'Follow RESTful conventions: GET for retrieval, POST for creation, PUT/PATCH for updates, DELETE for removal',
        confidence: 90,
        frequency: 1,
        successRate: 1.0,
        relatedTags: ['api', 'rest', 'http', 'backend'],
        examples: ['/api/users endpoint', '/api/posts endpoint'],
        createdAt: now,
        lastUsed: now,
        timesApplied: 1,
      },
      {
        id: 'seed-3',
        type: 'best-practice',
        topic: 'Testing',
        learning: 'Write tests that verify behavior, not implementation. Focus on user-facing functionality',
        confidence: 80,
        frequency: 1,
        successRate: 1.0,
        relatedTags: ['testing', 'test', 'spec', 'quality'],
        examples: ['User authentication tests', 'Form validation tests'],
        createdAt: now,
        lastUsed: now,
        timesApplied: 1,
      },
    ];
  }

  // ── Reset & Clear ──────────────────────────────────────────────────────────

  reset(): void {
    this._metrics = {
      intelligenceScore: 100,
      totalLearnings: 0,
      commandPatterns: 0,
      successRate: 1.0,
      averageConfidence: 50,
      knowledgeBaseSize: 0,
      improvementRate: 0,
      lastImprovement: Date.now(),
    };
    this._knowledge = this.getSeedKnowledge();
    this._patterns = [];
    this._events = [];
    this.saveAll();
    this.emit();
  }

  clearKnowledge(): void {
    this._knowledge = [];
    this._metrics.knowledgeBaseSize = 0;
    this.saveKnowledge();
    this.saveMetrics();
    this.emit();
  }
}

// Singleton
export const brainLearningEngine = new BrainLearningEngineClass();
