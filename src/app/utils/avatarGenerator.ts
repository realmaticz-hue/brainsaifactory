// Custom avatar generation and management

export interface CustomAvatar {
  id: string;
  name: string;
  type: 'generated' | 'photo' | 'preset';
  imageUrl: string;
  thumbnailUrl: string;
  voiceId: string;
  voiceSettings: {
    pitch: number;
    rate: number;
    volume: number;
    language: string;
  };
  motionSettings: {
    blinkRate: number;
    expressiveness: number;
    headMovement: number;
    eyeContact: number;
  };
  createdAt: Date;
  lastModified: Date;
  metadata?: {
    gender?: 'male' | 'female' | 'neutral';
    age?: string;
    style?: string;
    ethnicity?: string;
  };
}

export interface AvatarPrompt {
  description: string;
  style: 'realistic' | 'artistic' | 'cartoon' | 'professional' | 'casual';
  gender?: 'male' | 'female' | 'neutral';
  age?: string;
  ethnicity?: string;
  accessories?: string[];
  expression?: string;
}

// Realistic voice profiles
export const REALISTIC_VOICES = [
  {
    id: 'voice-female-professional',
    name: 'Emma - Professional Female',
    gender: 'female',
    age: 'adult',
    description: 'Clear, confident professional voice',
    settings: { pitch: 1.0, rate: 0.95, volume: 1.0 }
  },
  {
    id: 'voice-male-professional',
    name: 'James - Professional Male',
    gender: 'male',
    age: 'adult',
    description: 'Authoritative, warm male voice',
    settings: { pitch: 0.85, rate: 0.9, volume: 1.0 }
  },
  {
    id: 'voice-female-friendly',
    name: 'Sophia - Friendly Female',
    gender: 'female',
    age: 'young-adult',
    description: 'Warm, approachable voice',
    settings: { pitch: 1.1, rate: 1.0, volume: 1.0 }
  },
  {
    id: 'voice-male-energetic',
    name: 'Lucas - Energetic Male',
    gender: 'male',
    age: 'young-adult',
    description: 'Enthusiastic, dynamic voice',
    settings: { pitch: 0.9, rate: 1.05, volume: 1.0 }
  },
  {
    id: 'voice-female-mature',
    name: 'Victoria - Mature Female',
    gender: 'female',
    age: 'mature',
    description: 'Sophisticated, experienced voice',
    settings: { pitch: 0.95, rate: 0.85, volume: 1.0 }
  },
  {
    id: 'voice-male-deep',
    name: 'Marcus - Deep Male',
    gender: 'male',
    age: 'mature',
    description: 'Deep, commanding voice',
    settings: { pitch: 0.75, rate: 0.85, volume: 1.0 }
  },
  {
    id: 'voice-female-british',
    name: 'Charlotte - British Female',
    gender: 'female',
    age: 'adult',
    description: 'Elegant British accent',
    settings: { pitch: 1.05, rate: 0.9, volume: 1.0 }
  },
  {
    id: 'voice-male-british',
    name: 'Oliver - British Male',
    gender: 'male',
    age: 'adult',
    description: 'Refined British accent',
    settings: { pitch: 0.9, rate: 0.88, volume: 1.0 }
  },
  {
    id: 'voice-female-young',
    name: 'Lily - Young Female',
    gender: 'female',
    age: 'young',
    description: 'Youthful, energetic voice',
    settings: { pitch: 1.2, rate: 1.1, volume: 1.0 }
  },
  {
    id: 'voice-male-narrator',
    name: 'David - Narrator Male',
    gender: 'male',
    age: 'mature',
    description: 'Professional narrator voice',
    settings: { pitch: 0.88, rate: 0.9, volume: 1.0 }
  }
];

// Free AI avatars from various sources
export const FREE_AI_AVATARS = [
  {
    id: 'avatar-free-1',
    name: 'Alex Chen',
    imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
    type: 'preset' as const,
    source: 'Unsplash',
    gender: 'male',
    style: 'professional'
  },
  {
    id: 'avatar-free-2',
    name: 'Sarah Johnson',
    imageUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
    type: 'preset' as const,
    source: 'Unsplash',
    gender: 'female',
    style: 'professional'
  },
  {
    id: 'avatar-free-3',
    name: 'Marcus Williams',
    imageUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop',
    type: 'preset' as const,
    source: 'Unsplash',
    gender: 'male',
    style: 'casual'
  },
  {
    id: 'avatar-free-4',
    name: 'Emma Davis',
    imageUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop',
    type: 'preset' as const,
    source: 'Unsplash',
    gender: 'female',
    style: 'casual'
  },
  {
    id: 'avatar-free-5',
    name: 'James Rodriguez',
    imageUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop',
    type: 'preset' as const,
    source: 'Unsplash',
    gender: 'male',
    style: 'business'
  },
  {
    id: 'avatar-free-6',
    name: 'Olivia Martinez',
    imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop',
    type: 'preset' as const,
    source: 'Unsplash',
    gender: 'female',
    style: 'business'
  },
  {
    id: 'avatar-free-7',
    name: 'David Lee',
    imageUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop',
    type: 'preset' as const,
    source: 'Unsplash',
    gender: 'male',
    style: 'creative'
  },
  {
    id: 'avatar-free-8',
    name: 'Sophia Anderson',
    imageUrl: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&h=400&fit=crop',
    type: 'preset' as const,
    source: 'Unsplash',
    gender: 'female',
    style: 'creative'
  }
];

export function generateAvatarFromPrompt(prompt: AvatarPrompt): CustomAvatar {
  // In production, this would call an AI avatar generation API like:
  // - Ready Player Me
  // - DID (D-ID)
  // - Synthesia
  // - HeyGen
  
  // For demo, we'll create a placeholder
  const id = `custom-${Date.now()}`;
  const defaultVoice = REALISTIC_VOICES.find(v => 
    v.gender === prompt.gender || v.gender === 'neutral'
  ) || REALISTIC_VOICES[0];
  
  return {
    id,
    name: `Custom Avatar ${id.slice(-6)}`,
    type: 'generated',
    imageUrl: getPlaceholderAvatarUrl(prompt),
    thumbnailUrl: getPlaceholderAvatarUrl(prompt),
    voiceId: defaultVoice.id,
    voiceSettings: {
      ...defaultVoice.settings,
      language: 'en-US'
    },
    motionSettings: {
      blinkRate: 3,
      expressiveness: 0.7,
      headMovement: 0.5,
      eyeContact: 0.8
    },
    createdAt: new Date(),
    lastModified: new Date(),
    metadata: {
      gender: prompt.gender,
      age: prompt.age,
      style: prompt.style,
      ethnicity: prompt.ethnicity
    }
  };
}

export function createAvatarFromPhoto(photoFile: File): Promise<CustomAvatar> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string;
      const id = `photo-${Date.now()}`;
      
      const avatar: CustomAvatar = {
        id,
        name: `Photo Avatar ${id.slice(-6)}`,
        type: 'photo',
        imageUrl,
        thumbnailUrl: imageUrl,
        voiceId: REALISTIC_VOICES[0].id,
        voiceSettings: {
          ...REALISTIC_VOICES[0].settings,
          language: 'en-US'
        },
        motionSettings: {
          blinkRate: 3,
          expressiveness: 0.6,
          headMovement: 0.4,
          eyeContact: 0.7
        },
        createdAt: new Date(),
        lastModified: new Date()
      };
      
      resolve(avatar);
    };
    
    reader.onerror = reject;
    reader.readAsDataURL(photoFile);
  });
}

function getPlaceholderAvatarUrl(prompt: AvatarPrompt): string {
  // Use Unsplash for realistic placeholder avatars based on the prompt
  const gender = prompt.gender === 'female' ? 'woman' : prompt.gender === 'male' ? 'man' : 'person';
  const style = prompt.style || 'professional';
  const age = prompt.age || 'adult';
  
  // Generate specific Unsplash search query based on prompt
  const searchTerms = `${style} ${gender} portrait headshot`;
  const seed = Math.floor(Math.random() * 1000);
  
  // Use Unsplash with specific search terms for more relevant results
  return `https://source.unsplash.com/400x400/?${encodeURIComponent(searchTerms)}&sig=${seed}`;
}

export function saveAvatar(avatar: CustomAvatar): void {
  const savedAvatars = getSavedAvatars();
  const existingIndex = savedAvatars.findIndex(a => a.id === avatar.id);
  
  if (existingIndex >= 0) {
    savedAvatars[existingIndex] = { ...avatar, lastModified: new Date() };
  } else {
    savedAvatars.push(avatar);
  }
  
  localStorage.setItem('customAvatars', JSON.stringify(savedAvatars));
}

export function getSavedAvatars(): CustomAvatar[] {
  try {
    const saved = localStorage.getItem('customAvatars');
    if (saved) {
      const avatars = JSON.parse(saved);
      // Convert date strings back to Date objects
      return avatars.map((a: any) => ({
        ...a,
        createdAt: new Date(a.createdAt),
        lastModified: new Date(a.lastModified)
      }));
    }
  } catch (error) {
    console.error('Error loading saved avatars:', error);
  }
  return [];
}

export function deleteAvatar(avatarId: string): void {
  const savedAvatars = getSavedAvatars();
  const filtered = savedAvatars.filter(a => a.id !== avatarId);
  localStorage.setItem('customAvatars', JSON.stringify(filtered));
}

export function updateAvatar(avatarId: string, updates: Partial<CustomAvatar>): void {
  const savedAvatars = getSavedAvatars();
  const index = savedAvatars.findIndex(a => a.id === avatarId);
  
  if (index >= 0) {
    savedAvatars[index] = {
      ...savedAvatars[index],
      ...updates,
      lastModified: new Date()
    };
    localStorage.setItem('customAvatars', JSON.stringify(savedAvatars));
  }
}

// AI Learning for facial expressions
export interface FacialExpressionData {
  expression: string;
  landmarks: number[][];
  intensity: number;
  context: string;
}

export class FacialExpressionLearner {
  private expressions: Map<string, FacialExpressionData[]> = new Map();
  
  constructor() {
    this.loadFromStorage();
  }
  
  async learnFromInternet(): Promise<void> {
    // In production, this would:
    // 1. Search for facial expression datasets
    // 2. Download and process images
    // 3. Extract facial landmarks using ML models
    // 4. Store patterns for lip sync and expressions
    
    console.log('🤖 AI Learning: Analyzing facial expressions from online sources...');
    
    // Simulate learning process
    const expressionTypes = [
      'smile', 'laugh', 'surprise', 'thinking', 'speaking',
      'neutral', 'happy', 'sad', 'angry', 'confused'
    ];
    
    for (const expr of expressionTypes) {
      if (!this.expressions.has(expr)) {
        this.expressions.set(expr, []);
      }
      
      // Simulate learning data
      const data: FacialExpressionData = {
        expression: expr,
        landmarks: this.generateMockLandmarks(),
        intensity: Math.random(),
        context: 'learned_from_web'
      };
      
      this.expressions.get(expr)?.push(data);
    }
    
    this.saveToStorage();
    console.log('✅ AI Learning: Updated facial expression database');
  }
  
  private generateMockLandmarks(): number[][] {
    // Mock 68 facial landmarks
    return Array.from({ length: 68 }, () => [
      Math.random() * 200,
      Math.random() * 200
    ]);
  }
  
  getExpression(type: string): FacialExpressionData[] {
    return this.expressions.get(type) || [];
  }
  
  private saveToStorage(): void {
    try {
      const data = Array.from(this.expressions.entries());
      localStorage.setItem('facialExpressions', JSON.stringify(data));
    } catch (error) {
      console.error('Error saving facial expressions:', error);
    }
  }
  
  private loadFromStorage(): void {
    try {
      const saved = localStorage.getItem('facialExpressions');
      if (saved) {
        const data = JSON.parse(saved);
        this.expressions = new Map(data);
      }
    } catch (error) {
      console.error('Error loading facial expressions:', error);
    }
  }
  
  getStats(): { totalExpressions: number; typesLearned: number } {
    let total = 0;
    this.expressions.forEach(arr => total += arr.length);
    return {
      totalExpressions: total,
      typesLearned: this.expressions.size
    };
  }
}

// Singleton instance
export const facialLearner = new FacialExpressionLearner();

// Auto-learn on app start and daily
if (typeof window !== 'undefined') {
  // Learn immediately if no data exists
  const stats = facialLearner.getStats();
  if (stats.totalExpressions === 0) {
    facialLearner.learnFromInternet();
  }
  
  // Learn daily
  setInterval(() => {
    facialLearner.learnFromInternet();
  }, 24 * 60 * 60 * 1000); // 24 hours
}