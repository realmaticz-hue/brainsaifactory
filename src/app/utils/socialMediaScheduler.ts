// Social media automation and scheduling

export interface SocialMediaPost {
  id: string;
  content: string;
  mediaUrl?: string;
  mediaType?: 'text' | 'image' | 'video';
  platforms: SocialPlatform[];
  scheduledDate: Date;
  status: 'scheduled' | 'posted' | 'failed' | 'draft';
  caption: string;
  hashtags: string[];
  createdAt: Date;
}

export type SocialPlatform = 'facebook' | 'instagram' | 'tiktok' | 'x' | 'twitter' | 'linkedin' | 'youtube';

export interface ScheduleConfig {
  postsPerDay: number;
  postsPerWeek: number;
  postsPerMonth: number;
  preferredTimes: string[]; // e.g., ['09:00', '12:00', '18:00']
  timezone: string;
  autoPost: boolean;
}

export interface PlatformCredentials {
  platform: SocialPlatform;
  connected: boolean;
  username?: string;
  accessToken?: string;
  expiresAt?: Date;
}

// Platform-specific post formats
export const PLATFORM_SPECS: Record<SocialPlatform, {
  name: string; icon: string; maxCaptionLength: number; maxHashtags: number;
  videoFormats: string[]; imageFormats: string[]; aspectRatios: string[]; bestPostTimes: string[];
}> = {
  facebook: {
    name: 'Facebook',   icon: '📘', maxCaptionLength: 63206, maxHashtags: 30,
    videoFormats: ['MP4', 'MOV'], imageFormats: ['JPG', 'PNG'],
    aspectRatios: ['1:1', '4:5', '16:9'], bestPostTimes: ['09:00', '13:00', '15:00', '19:00'],
  },
  instagram: {
    name: 'Instagram',  icon: '📷', maxCaptionLength: 2200, maxHashtags: 30,
    videoFormats: ['MP4', 'MOV'], imageFormats: ['JPG', 'PNG'],
    aspectRatios: ['1:1', '4:5', '9:16'], bestPostTimes: ['11:00', '13:00', '17:00', '20:00'],
  },
  tiktok: {
    name: 'TikTok',     icon: '🎵', maxCaptionLength: 2200, maxHashtags: 20,
    videoFormats: ['MP4', 'MOV'], imageFormats: ['JPG', 'PNG'],
    aspectRatios: ['9:16'], bestPostTimes: ['06:00', '10:00', '16:00', '19:00'],
  },
  x: {
    name: 'X (Twitter)', icon: '🐦', maxCaptionLength: 280, maxHashtags: 10,
    videoFormats: ['MP4', 'MOV'], imageFormats: ['JPG', 'PNG', 'GIF'],
    aspectRatios: ['16:9', '1:1'], bestPostTimes: ['08:00', '12:00', '17:00', '21:00'],
  },
  twitter: {
    name: 'X / Twitter', icon: '🐦', maxCaptionLength: 280, maxHashtags: 10,
    videoFormats: ['MP4', 'MOV'], imageFormats: ['JPG', 'PNG', 'GIF'],
    aspectRatios: ['16:9', '1:1'], bestPostTimes: ['08:00', '12:00', '17:00', '21:00'],
  },
  linkedin: {
    name: 'LinkedIn',   icon: '💼', maxCaptionLength: 3000, maxHashtags: 5,
    videoFormats: ['MP4'], imageFormats: ['JPG', 'PNG'],
    aspectRatios: ['1:1', '1.91:1'], bestPostTimes: ['08:00', '10:00', '12:00', '17:00'],
  },
  youtube: {
    name: 'YouTube',    icon: '▶️',  maxCaptionLength: 5000, maxHashtags: 15,
    videoFormats: ['MP4', 'MOV', 'AVI'], imageFormats: ['JPG', 'PNG'],
    aspectRatios: ['16:9'], bestPostTimes: ['14:00', '15:00', '20:00', '21:00'],
  },
};

export class SocialMediaScheduler {
  private posts: SocialMediaPost[] = [];
  private config: ScheduleConfig = {
    postsPerDay: 3,
    postsPerWeek: 21,
    postsPerMonth: 90,
    preferredTimes: ['09:00', '14:00', '19:00'],
    timezone: 'America/New_York',
    autoPost: false
  };
  
  constructor() {
    this.loadFromStorage();
  }
  
  schedulePost(post: Omit<SocialMediaPost, 'id' | 'status' | 'createdAt'>): SocialMediaPost {
    const newPost: SocialMediaPost = {
      ...post,
      id: `post-${Date.now()}`,
      status: 'scheduled',
      createdAt: new Date()
    };
    
    this.posts.push(newPost);
    this.saveToStorage();
    
    return newPost;
  }
  
  scheduleMultiplePosts(
    content: string,
    mediaUrl: string,
    mediaType: 'text' | 'image' | 'video',
    platforms: SocialPlatform[],
    startDate: Date,
    count: number
  ): SocialMediaPost[] {
    const scheduled: SocialMediaPost[] = [];
    const interval = this.calculatePostInterval(count);
    
    for (let i = 0; i < count; i++) {
      const scheduledDate = new Date(startDate);
      scheduledDate.setMinutes(scheduledDate.getMinutes() + (interval * i));
      
      // Adjust to preferred times if enabled
      const preferredTime = this.getNextPreferredTime(scheduledDate);
      
      const post = this.schedulePost({
        content,
        mediaUrl,
        mediaType,
        platforms,
        scheduledDate: preferredTime,
        caption: this.optimizeCaptionForPlatforms(content, platforms),
        hashtags: this.generateHashtags(content)
      });
      
      scheduled.push(post);
    }
    
    return scheduled;
  }
  
  autoScheduleMonth(
    posts: Array<{ content: string; mediaUrl: string; mediaType: 'image' | 'video' }>,
    platforms: SocialPlatform[]
  ): SocialMediaPost[] {
    const scheduled: SocialMediaPost[] = [];
    const startDate = new Date();
    const daysInMonth = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0).getDate();
    
    let postIndex = 0;
    
    for (let day = 0; day < daysInMonth; day++) {
      for (let i = 0; i < this.config.postsPerDay; i++) {
        if (postIndex >= posts.length) postIndex = 0; // Loop if not enough posts
        
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + day);
        
        const timeSlot = this.config.preferredTimes[i % this.config.preferredTimes.length];
        const [hours, minutes] = timeSlot.split(':').map(Number);
        currentDate.setHours(hours, minutes, 0, 0);
        
        const post = this.schedulePost({
          ...posts[postIndex],
          platforms,
          scheduledDate: currentDate,
          caption: this.optimizeCaptionForPlatforms(posts[postIndex].content, platforms),
          hashtags: this.generateHashtags(posts[postIndex].content)
        });
        
        scheduled.push(post);
        postIndex++;
      }
    }
    
    return scheduled;
  }
  
  private calculatePostInterval(totalPosts: number): number {
    // Calculate minutes between posts to spread evenly
    const hoursInDay = 24;
    const minutesInDay = hoursInDay * 60;
    return Math.floor(minutesInDay / totalPosts);
  }
  
  private getNextPreferredTime(date: Date): Date {
    const result = new Date(date);
    const currentHour = date.getHours();
    
    // Find nearest preferred time
    const preferredHours = this.config.preferredTimes.map(t => parseInt(t.split(':')[0]));
    const nearest = preferredHours.reduce((prev, curr) => {
      return Math.abs(curr - currentHour) < Math.abs(prev - currentHour) ? curr : prev;
    });
    
    const preferredTime = this.config.preferredTimes.find(t => t.startsWith(`${nearest.toString().padStart(2, '0')}:`));
    if (preferredTime) {
      const [hours, minutes] = preferredTime.split(':').map(Number);
      result.setHours(hours, minutes, 0, 0);
    }
    
    return result;
  }
  
  private optimizeCaptionForPlatforms(content: string, platforms: SocialPlatform[]): string {
    // Find the most restrictive platform
    let minLength = Number.MAX_SAFE_INTEGER;
    platforms.forEach(platform => {
      const spec = PLATFORM_SPECS[platform];
      if (spec.maxCaptionLength < minLength) {
        minLength = spec.maxCaptionLength;
      }
    });
    
    if (content.length > minLength) {
      return content.substring(0, minLength - 3) + '...';
    }
    
    return content;
  }
  
  private generateHashtags(content: string): string[] {
    // Simple hashtag generation based on content
    const words = content.toLowerCase().split(' ');
    const hashtags: string[] = [];
    
    // Add relevant hashtags
    const commonTags = ['viral', 'trending', 'fyp', 'explore', 'ai'];
    hashtags.push(...commonTags.map(t => `#${t}`));
    
    // Add content-specific tags (simple extraction)
    words.forEach(word => {
      if (word.length > 4 && hashtags.length < 10) {
        const cleaned = word.replace(/[^a-z]/g, '');
        if (cleaned) {
          hashtags.push(`#${cleaned}`);
        }
      }
    });
    
    return hashtags.slice(0, 10);
  }
  
  getScheduledPosts(platform?: SocialPlatform): SocialMediaPost[] {
    if (platform) {
      return this.posts.filter(p => p.platforms.includes(platform));
    }
    return this.posts;
  }
  
  getPostsByDateRange(startDate: Date, endDate: Date): SocialMediaPost[] {
    return this.posts.filter(p => 
      p.scheduledDate >= startDate && p.scheduledDate <= endDate
    );
  }
  
  updatePost(postId: string, updates: Partial<SocialMediaPost>): void {
    const index = this.posts.findIndex(p => p.id === postId);
    if (index >= 0) {
      this.posts[index] = { ...this.posts[index], ...updates };
      this.saveToStorage();
    }
  }
  
  deletePost(postId: string): void {
    this.posts = this.posts.filter(p => p.id !== postId);
    this.saveToStorage();
  }
  
  updateConfig(config: Partial<ScheduleConfig>): void {
    this.config = { ...this.config, ...config };
    this.saveToStorage();
  }
  
  getConfig(): ScheduleConfig {
    return { ...this.config };
  }
  
  async postNow(postId: string): Promise<boolean> {
    const post = this.posts.find(p => p.id === postId);
    if (!post) return false;
    
    try {
      // In production, this would call actual social media APIs
      console.log('📤 Posting to platforms:', post.platforms);
      
      for (const platform of post.platforms) {
        await this.postToPlatform(platform, post);
      }
      
      this.updatePost(postId, { status: 'posted' });
      return true;
    } catch (error) {
      console.error('Error posting:', error);
      this.updatePost(postId, { status: 'failed' });
      return false;
    }
  }
  
  private async postToPlatform(platform: SocialPlatform, post: SocialMediaPost): Promise<void> {
    // Simulate API call
    console.log(`Posting to ${platform}:`, {
      caption: post.caption,
      media: post.mediaUrl,
      hashtags: post.hashtags
    });
    
    // In production, implement actual API calls:
    // - Facebook Graph API
    // - Instagram Graph API
    // - TikTok API
    // - X (Twitter) API
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  private saveToStorage(): void {
    try {
      localStorage.setItem('scheduledPosts', JSON.stringify(this.posts));
      localStorage.setItem('scheduleConfig', JSON.stringify(this.config));
    } catch (error) {
      console.error('Error saving to storage:', error);
    }
  }
  
  private loadFromStorage(): void {
    try {
      const postsData = localStorage.getItem('scheduledPosts');
      if (postsData) {
        this.posts = JSON.parse(postsData).map((p: any) => ({
          ...p,
          scheduledDate: new Date(p.scheduledDate),
          createdAt: new Date(p.createdAt)
        }));
      }
      
      const configData = localStorage.getItem('scheduleConfig');
      if (configData) {
        this.config = JSON.parse(configData);
      }
    } catch (error) {
      console.error('Error loading from storage:', error);
    }
  }
  
  getUpcomingPosts(limit: number = 10): SocialMediaPost[] {
    const now = new Date();
    return this.posts
      .filter(p => p.status === 'scheduled' && p.scheduledDate > now)
      .sort((a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime())
      .slice(0, limit);
  }
  
  getStats() {
    const now = new Date();
    const scheduled = this.posts.filter(p => p.status === 'scheduled' && p.scheduledDate > now);
    const pending   = this.posts.filter(p => p.status === 'scheduled' && p.scheduledDate <= now);
    const posted    = this.posts.filter(p => p.status === 'posted');
    const failed    = this.posts.filter(p => p.status === 'failed');
    
    return {
      total: this.posts.length,
      scheduled: scheduled.length,
      pending: pending.length,
      posted: posted.length,
      failed: failed.length,
      byPlatform: {
        facebook:  this.posts.filter(p => p.platforms.includes('facebook')).length,
        instagram: this.posts.filter(p => p.platforms.includes('instagram')).length,
        tiktok:    this.posts.filter(p => p.platforms.includes('tiktok')).length,
        x:         this.posts.filter(p => p.platforms.includes('x')).length,
        twitter:   this.posts.filter(p => p.platforms.includes('twitter')).length,
        linkedin:  this.posts.filter(p => p.platforms.includes('linkedin')).length,
        youtube:   this.posts.filter(p => p.platforms.includes('youtube')).length,
      },
    };
  }
}

// Singleton instance
export const socialScheduler = new SocialMediaScheduler();

// Auto-post checker (runs every minute)
if (typeof window !== 'undefined') {
  setInterval(async () => {
    const config = socialScheduler.getConfig();
    if (!config.autoPost) return;
    
    const now = new Date();
    const posts = socialScheduler.getScheduledPosts();
    
    for (const post of posts) {
      if (post.status === 'scheduled' && post.scheduledDate <= now) {
        await socialScheduler.postNow(post.id);
      }
    }
  }, 60 * 1000); // Check every minute
}