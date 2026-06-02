// Social Accounts – Full Visual + Autopilot Types
// Based on the merged JSON specification

export type PlatformId = 'facebook' | 'instagram' | 'twitter' | 'tiktok' | 'linkedin' | 'youtube' | 'pinterest';

export interface SocialProfile {
  id: string;
  userId: string;
  name: string;
  username: string;
  provider: PlatformId;
  avatarUrl: string;
  autopilotEnabled: boolean;
  status: 'active' | 'expired' | 'paused' | 'error';
  followers: number;
  engagement: number;
  lastPostAt: number | null;
  connectedAt: number;
  metadata?: Record<string, any>;
}

export interface TrendingTopic {
  id: string;
  topic: string;
  score: number;
  platform: PlatformId;
  category: string;
}

export interface QueuedPost {
  id: string;
  profileId: string;
  content: string;
  scheduledAt: number;
  status: 'scheduled' | 'publishing' | 'published' | 'failed' | 'cancelled';
  topic: string;
  platform: PlatformId;
  createdAt: number;
  aiScore?: number;
  variations?: string[];
}

export interface AutopilotLog {
  id: string;
  profileId: string;
  profileName: string;
  platform: PlatformId;
  action: 'generate' | 'schedule' | 'publish' | 'toggle_on' | 'toggle_off' | 'reschedule' | 'error';
  message: string;
  timestamp: number;
  details?: string;
}

export interface AutopilotStats {
  totalPostsGenerated: number;
  totalPostsPublished: number;
  totalPostsQueued: number;
  activeProfiles: number;
  totalProfiles: number;
  lastRunAt: number | null;
  nextRunAt: number | null;
  errorsToday: number;
}

export interface BrainCommandState {
  isRunning: boolean;
  currentTask: string | null;
  progress: number;
  logs: AutopilotLog[];
  stats: AutopilotStats;
}
