// ═══════════════════════════════════════════════════════════════════════════════
// AUTOPILOT ENGINE — Brain Command Logic
// Full Brain Command logic embedded: AI topic generation, content creation,
// scheduling, and queue management. Placeholders for AI/DB/Queue services.
// ═══════════════════════════════════════════════════════════════════════════════

import type {
  SocialProfile,
  TrendingTopic,
  QueuedPost,
  AutopilotLog,
  AutopilotStats,
  BrainCommandState,
  PlatformId,
} from './types';

// ── Placeholder Services (configurable for future real services) ─────────────

interface AIService {
  generate: (prompt: string) => Promise<string[]>;
}

interface DBService {
  socialProfiles: {
    findOne: (query: { id: string }) => Promise<SocialProfile | null>;
    find: (query: Record<string, any>) => Promise<SocialProfile[]>;
    update: (query: { id: string } & Partial<SocialProfile>) => Promise<void>;
  };
  socialPosts: {
    insert: (post: Omit<QueuedPost, 'id'>) => Promise<string>;
    find: (query: Record<string, any>) => Promise<QueuedPost[]>;
    update: (query: { id: string } & Partial<QueuedPost>) => Promise<void>;
    delete: (query: { id: string }) => Promise<void>;
  };
}

interface QueueService {
  add: (task: string, postId: string) => Promise<void>;
  reschedule: (postId: string, newTime: number) => Promise<void>;
}

// ── Mock AI Service ──────────────────────────────────────────────────────────

const platformTopics: Record<PlatformId, string[]> = {
  facebook: [
    'Community engagement strategies',
    'Behind-the-scenes content',
    'User-generated content campaigns',
    'Interactive polls & quizzes',
    'Seasonal promotions',
  ],
  instagram: [
    'Reels trending audio',
    'Carousel best practices',
    'Story engagement hooks',
    'Aesthetic feed planning',
    'Influencer collaboration tips',
  ],
  twitter: [
    'Thread storytelling',
    'Hot take engagement',
    'Live event commentary',
    'Meme marketing',
    'Industry news reactions',
  ],
  tiktok: [
    'Duet challenge trends',
    'Hook-first content',
    'Educational micro-content',
    'Product demos with trending sounds',
    'Day-in-the-life series',
  ],
  linkedin: [
    'Thought leadership articles',
    'Industry insights & data',
    'Career growth stories',
    'Company culture showcases',
    'Professional development tips',
  ],
  youtube: [
    'Shorts optimization',
    'Thumbnail A/B testing',
    'Community post engagement',
    'Collaboration ideas',
    'Series format planning',
  ],
  pinterest: [
    'Pin design trends',
    'Seasonal boards planning',
    'Idea pin strategies',
    'SEO-optimized descriptions',
    'Rich pin optimization',
  ],
};

const mockPostTemplates: Record<PlatformId, string[]> = {
  facebook: [
    "What's the one thing you wish more people knew about {topic}? Drop your thoughts below!",
    "We just discovered something incredible about {topic}. Here's what we learned...",
    "POLL: When it comes to {topic}, what matters most to you? A) Quality B) Speed C) Price",
  ],
  instagram: [
    "The secret to {topic} that nobody talks about. Swipe to learn more.",
    "3 things we changed about {topic} that doubled our results. Save this for later!",
    "POV: You finally mastered {topic} and everything clicks.",
  ],
  twitter: [
    "Hot take: {topic} is about to change everything in 2026. Here's why (thread)",
    "Most people get {topic} wrong. The key insight? It's simpler than you think.",
    "Just spent 3 hours diving into {topic}. The results are mind-blowing.",
  ],
  tiktok: [
    "Wait for it... the {topic} hack that changed everything",
    "POV: When your {topic} strategy actually works",
    "3 {topic} tips that took me from 0 to 100K. Which one surprised you?",
  ],
  linkedin: [
    "After 10 years in the industry, here's what I've learned about {topic}. The data might surprise you.",
    "We analyzed 1,000+ campaigns around {topic}. The #1 finding? Consistency beats perfection.",
    "{topic} isn't just a trend — it's the future of how we work. Here's my framework.",
  ],
  youtube: [
    "I tried {topic} for 30 days. Here's what happened...",
    "The COMPLETE guide to {topic} in 2026 (everything you need to know)",
    "{topic}: 5 mistakes beginners make and how to avoid them",
  ],
  pinterest: [
    "The ultimate {topic} guide: 10 ideas to inspire your next project",
    "{topic} aesthetic | Board inspiration for 2026",
    "Step-by-step {topic} tutorial — save this pin!",
  ],
};

function createMockAI(): AIService {
  return {
    generate: async (prompt: string): Promise<string[]> => {
      // Simulate AI delay
      await new Promise((r) => setTimeout(r, 300 + Math.random() * 700));

      if (prompt.includes('trending topics')) {
        const platformMatch = prompt.match(/platform:\s*(\w+)/i);
        const platform = (platformMatch?.[1]?.toLowerCase() || 'facebook') as PlatformId;
        const topics = platformTopics[platform] || platformTopics.facebook;
        // Shuffle and return
        return [...topics].sort(() => Math.random() - 0.5);
      }

      if (prompt.includes('Write a') || prompt.includes('post on:')) {
        const platformMatch = prompt.match(/(\w+)\s+post/i);
        const platform = (platformMatch?.[1]?.toLowerCase() || 'facebook') as PlatformId;
        const topicMatch = prompt.match(/on:\s*(.+)/i);
        const topic = topicMatch?.[1] || 'engagement';
        const templates = mockPostTemplates[platform] || mockPostTemplates.facebook;
        const template = templates[Math.floor(Math.random() * templates.length)];
        return [template.replace('{topic}', topic)];
      }

      if (prompt.includes('variations')) {
        const baseContent = prompt.replace('Generate 5 variations: ', '');
        return Array.from({ length: 5 }, (_, i) =>
          `${baseContent} [Variation ${i + 1}]`
        );
      }

      return ['Generated content placeholder'];
    },
  };
}

// ── In-Memory Mock DB ────────────────────────────────────────────────────────

let _profiles: SocialProfile[] = [];
let _posts: QueuedPost[] = [];
let _idCounter = 1000;

function createMockDB(): DBService {
  return {
    socialProfiles: {
      findOne: async ({ id }) => _profiles.find((p) => p.id === id) || null,
      find: async (query) => {
        return _profiles.filter((p) => {
          for (const [key, val] of Object.entries(query)) {
            if ((p as any)[key] !== val) return false;
          }
          return true;
        });
      },
      update: async ({ id, ...updates }) => {
        const idx = _profiles.findIndex((p) => p.id === id);
        if (idx >= 0) _profiles[idx] = { ..._profiles[idx], ...updates };
      },
    },
    socialPosts: {
      insert: async (post) => {
        const id = `post-${++_idCounter}`;
        _posts.push({ ...post, id } as QueuedPost);
        return id;
      },
      find: async (query) => {
        return _posts.filter((p) => {
          for (const [key, val] of Object.entries(query)) {
            if ((p as any)[key] !== val) return false;
          }
          return true;
        });
      },
      update: async ({ id, ...updates }) => {
        const idx = _posts.findIndex((p) => p.id === id);
        if (idx >= 0) _posts[idx] = { ..._posts[idx], ...updates };
      },
      delete: async ({ id }) => {
        _posts = _posts.filter((p) => p.id !== id);
      },
    },
  };
}

function createMockQueue(): QueueService {
  return {
    add: async (task, postId) => {
      console.log(`[Queue] Added task: ${task} for post: ${postId}`);
    },
    reschedule: async (postId, newTime) => {
      const idx = _posts.findIndex((p) => p.id === postId);
      if (idx >= 0) {
        _posts[idx].scheduledAt = newTime;
        _posts[idx].status = 'scheduled';
      }
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// ENGINE CLASS
// ═══════════════════════════════════════════════════════════════════════════════

type EngineListener = (state: BrainCommandState) => void;

class AutopilotEngineClass {
  private ai: AIService;
  private db: DBService;
  private queue: QueueService;
  private listeners: Set<EngineListener> = new Set();
  private _state: BrainCommandState;
  private intervalId: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.ai = createMockAI();
    this.db = createMockDB();
    this.queue = createMockQueue();
    this._state = {
      isRunning: false,
      currentTask: null,
      progress: 0,
      logs: [],
      stats: {
        totalPostsGenerated: 0,
        totalPostsPublished: 0,
        totalPostsQueued: 0,
        activeProfiles: 0,
        totalProfiles: 0,
        lastRunAt: null,
        nextRunAt: null,
        errorsToday: 0,
      },
    };
    console.log('Autopilot Engine Initialized');
  }

  get state() {
    return this._state;
  }

  subscribe(listener: EngineListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emit() {
    this._state = { ...this._state };
    this.listeners.forEach((fn) => fn(this._state));
  }

  private addLog(log: Omit<AutopilotLog, 'id' | 'timestamp'>) {
    const entry: AutopilotLog = {
      ...log,
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: Date.now(),
    };
    this._state.logs = [entry, ...this._state.logs].slice(0, 200);
    this.emit();
  }

  // ── Initialize with profiles ───────────────────────────────────────────────

  initProfiles(profiles: SocialProfile[]) {
    _profiles = [...profiles];
    this._state.stats.totalProfiles = profiles.length;
    this._state.stats.activeProfiles = profiles.filter((p) => p.autopilotEnabled).length;
    this.emit();
  }

  getProfiles(): SocialProfile[] {
    return [..._profiles];
  }

  getQueuedPosts(profileId?: string): QueuedPost[] {
    if (profileId) return _posts.filter((p) => p.profileId === profileId);
    return [..._posts];
  }

  // ── Toggle autopilot for a profile ─────────────────────────────────────────

  async toggle(profileId: string): Promise<boolean> {
    const profile = _profiles.find((p) => p.id === profileId);
    if (!profile) return false;

    profile.autopilotEnabled = !profile.autopilotEnabled;
    await this.db.socialProfiles.update({
      id: profileId,
      autopilotEnabled: profile.autopilotEnabled,
    });

    this._state.stats.activeProfiles = _profiles.filter((p) => p.autopilotEnabled).length;

    this.addLog({
      profileId,
      profileName: profile.name,
      platform: profile.provider,
      action: profile.autopilotEnabled ? 'toggle_on' : 'toggle_off',
      message: `Autopilot ${profile.autopilotEnabled ? 'enabled' : 'disabled'} for ${profile.name}`,
    });

    return profile.autopilotEnabled;
  }

  // ── Run autopilot for a single profile ─────────────────────────────────────

  async run(profileId: string): Promise<QueuedPost[]> {
    const profile = _profiles.find((p) => p.id === profileId);
    if (!profile) throw new Error(`Profile ${profileId} not found`);

    this._state.isRunning = true;
    this._state.currentTask = `Generating content for ${profile.name}`;
    this._state.progress = 0;
    this.emit();

    const generatedPosts: QueuedPost[] = [];

    try {
      // Step 1: Get trending topics
      this._state.progress = 10;
      this._state.currentTask = `Fetching trending topics for ${profile.provider}`;
      this.emit();

      const topics = await this.ai.generate(
        `Suggest top 5 trending topics for platform: ${profile.provider}`
      );

      this.addLog({
        profileId,
        profileName: profile.name,
        platform: profile.provider,
        action: 'generate',
        message: `Found ${topics.length} trending topics for ${profile.name}`,
        details: topics.join(', '),
      });

      // Step 2: Generate content for top 3 topics
      for (let i = 0; i < Math.min(3, topics.length); i++) {
        const topic = topics[i];
        this._state.progress = 20 + i * 25;
        this._state.currentTask = `Writing ${profile.provider} post: "${topic}"`;
        this.emit();

        const contentArr = await this.ai.generate(
          `Write a ${profile.provider} post on: ${topic}`
        );
        const content = contentArr[0] || topic;

        // Step 3: Generate variations
        const variations = await this.ai.generate(`Generate 5 variations: ${content}`);
        const bestPost = variations[0] || content;

        // Step 4: Schedule the post
        const scheduledTime = Date.now() + 60000 * (i + 1) * 30; // 30 min intervals
        const postId = await this.db.socialPosts.insert({
          profileId: profile.id,
          content: bestPost,
          scheduledAt: scheduledTime,
          status: 'scheduled',
          topic,
          platform: profile.provider,
          createdAt: Date.now(),
          aiScore: Math.floor(70 + Math.random() * 30),
          variations,
        });

        await this.queue.add('publish_post', postId);

        const post = _posts.find((p) => p.id === postId);
        if (post) generatedPosts.push(post);

        this._state.stats.totalPostsGenerated++;
        this._state.stats.totalPostsQueued++;

        this.addLog({
          profileId,
          profileName: profile.name,
          platform: profile.provider,
          action: 'schedule',
          message: `Scheduled post for "${topic}" at ${new Date(scheduledTime).toLocaleTimeString()}`,
          details: bestPost.slice(0, 100),
        });
      }

      // Update profile last post time
      profile.lastPostAt = Date.now();

      this._state.progress = 100;
      this._state.currentTask = null;
      this._state.isRunning = false;
      this._state.stats.lastRunAt = Date.now();
      this.emit();

      return generatedPosts;
    } catch (err) {
      this._state.isRunning = false;
      this._state.currentTask = null;
      this._state.stats.errorsToday++;

      this.addLog({
        profileId,
        profileName: profile.name,
        platform: profile.provider,
        action: 'error',
        message: `Error generating content: ${err instanceof Error ? err.message : 'Unknown error'}`,
      });

      this.emit();
      throw err;
    }
  }

  // ── Run autopilot for ALL enabled profiles ─────────────────────────────────

  async runAll(): Promise<void> {
    const enabledProfiles = _profiles.filter((p) => p.autopilotEnabled && p.status === 'active');

    this.addLog({
      profileId: 'system',
      profileName: 'System',
      platform: 'facebook',
      action: 'generate',
      message: `Starting autopilot run for ${enabledProfiles.length} enabled profiles`,
    });

    for (const profile of enabledProfiles) {
      try {
        await this.run(profile.id);
      } catch (err) {
        console.error(`[Autopilot] Error for profile ${profile.id}:`, err);
      }
    }

    this._state.stats.nextRunAt = Date.now() + 24 * 60 * 60 * 1000;
    this.emit();
  }

  // ── Reschedule a queued post ───────────────────────────────────────────────

  async reschedule(postId: string, newTime?: number): Promise<void> {
    const post = _posts.find((p) => p.id === postId);
    if (!post) return;

    const time = newTime || Date.now() + 3600000; // Default: 1 hour from now
    await this.queue.reschedule(postId, time);

    const profile = _profiles.find((p) => p.id === post.profileId);

    this.addLog({
      profileId: post.profileId,
      profileName: profile?.name || 'Unknown',
      platform: post.platform,
      action: 'reschedule',
      message: `Rescheduled post to ${new Date(time).toLocaleString()}`,
      details: post.content.slice(0, 80),
    });

    this.emit();
  }

  // ── Cancel a queued post ───────────────────────────────────────────────────

  async cancelPost(postId: string): Promise<void> {
    const post = _posts.find((p) => p.id === postId);
    if (!post) return;

    post.status = 'cancelled';
    this._state.stats.totalPostsQueued = Math.max(0, this._state.stats.totalPostsQueued - 1);

    const profile = _profiles.find((p) => p.id === post.profileId);
    this.addLog({
      profileId: post.profileId,
      profileName: profile?.name || 'Unknown',
      platform: post.platform,
      action: 'reschedule',
      message: `Cancelled scheduled post`,
      details: post.content.slice(0, 80),
    });

    this.emit();
  }

  // ── Start the daily autopilot interval ─────────────────────────────────────

  startDailyAutopilot() {
    if (this.intervalId) return;
    // Run every 24 hours (in demo, we could shorten this)
    this.intervalId = setInterval(() => {
      this.runAll();
    }, 24 * 60 * 60 * 1000);

    this._state.stats.nextRunAt = Date.now() + 24 * 60 * 60 * 1000;
    this.emit();

    this.addLog({
      profileId: 'system',
      profileName: 'System',
      platform: 'facebook',
      action: 'generate',
      message: 'Daily autopilot scheduler started',
    });
  }

  stopDailyAutopilot() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this._state.stats.nextRunAt = null;
    this.emit();
  }

  // ── Get trending topics for a platform ─────────────────────────────────────

  async getTrendingTopics(platform: PlatformId): Promise<TrendingTopic[]> {
    const topics = await this.ai.generate(
      `Suggest top 5 trending topics for platform: ${platform}`
    );
    return topics.map((topic, i) => ({
      id: `trend-${Date.now()}-${i}`,
      topic,
      score: Math.floor(60 + Math.random() * 40),
      platform,
      category: 'trending',
    }));
  }

  // ── Configure services (for future real integration) ───────────────────────

  configureAI(service: AIService) {
    this.ai = service;
  }
  configureDB(service: DBService) {
    this.db = service;
  }
  configureQueue(service: QueueService) {
    this.queue = service;
  }
}

// Singleton instance
export const autopilotEngine = new AutopilotEngineClass();
