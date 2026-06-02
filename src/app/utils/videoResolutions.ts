// Video resolution configurations

export interface VideoResolution {
  id: string;
  name: string;
  width: number;
  height: number;
  aspectRatio: string;
  description: string;
  bestFor: string[];
}

export const VIDEO_RESOLUTIONS: VideoResolution[] = [
  {
    id: 'square',
    name: 'Square (1:1)',
    width: 1080,
    height: 1080,
    aspectRatio: '1:1',
    description: 'Perfect for Instagram feed and Facebook',
    bestFor: ['instagram', 'facebook']
  },
  {
    id: 'vertical',
    name: 'Vertical (9:16)',
    width: 1080,
    height: 1920,
    aspectRatio: '9:16',
    description: 'Optimized for Stories, Reels, and TikTok',
    bestFor: ['instagram-stories', 'instagram-reels', 'tiktok', 'youtube-shorts']
  },
  {
    id: 'landscape',
    name: 'Landscape (16:9)',
    width: 1920,
    height: 1080,
    aspectRatio: '16:9',
    description: 'Standard widescreen for YouTube and desktop',
    bestFor: ['youtube', 'facebook', 'linkedin', 'twitter']
  },
  {
    id: 'portrait',
    name: 'Portrait (4:5)',
    width: 1080,
    height: 1350,
    aspectRatio: '4:5',
    description: 'Tall format for mobile feed viewing',
    bestFor: ['instagram', 'facebook']
  },
  {
    id: 'widescreen-hd',
    name: 'Widescreen HD (16:9)',
    width: 1280,
    height: 720,
    aspectRatio: '16:9',
    description: 'HD quality for general use',
    bestFor: ['youtube', 'website', 'presentations']
  },
  {
    id: 'widescreen-fhd',
    name: 'Widescreen Full HD (16:9)',
    width: 1920,
    height: 1080,
    aspectRatio: '16:9',
    description: 'Full HD widescreen quality',
    bestFor: ['youtube', 'vimeo', 'professional']
  },
  {
    id: 'ultra-wide',
    name: 'Ultra Wide (21:9)',
    width: 2560,
    height: 1080,
    aspectRatio: '21:9',
    description: 'Cinematic ultra-wide format',
    bestFor: ['cinematic', 'advertising', 'creative']
  },
  {
    id: 'custom',
    name: 'Custom Resolution',
    width: 1920,
    height: 1080,
    aspectRatio: 'custom',
    description: 'Set your own dimensions',
    bestFor: ['custom']
  }
];

export interface ScriptPrompt {
  type: 'script' | 'prompt';
  content: string;
  duration: number; // in seconds
  voice?: string;
  style?: string;
  mood?: string;
}

export function generateVideoScript(prompt: ScriptPrompt): string {
  if (prompt.type === 'script') {
    return prompt.content;
  }
  
  // AI-powered script generation from prompt
  const { content, duration, style = 'professional', mood = 'engaging' } = prompt;
  
  // Calculate word count based on duration
  // Average speaking rate: 150 words per minute
  const wordsPerSecond = 150 / 60;
  const targetWordCount = Math.floor(duration * wordsPerSecond);
  
  // Generate script based on prompt
  let script = `[${style.toUpperCase()} ${mood.toUpperCase()} SCRIPT]\n\n`;
  
  // Parse prompt for key elements
  const sentences = content.split('.').filter(s => s.trim());
  
  if (duration <= 10) {
    // Short format: Hook + Value + CTA
    script += `HOOK: ${sentences[0] || content}\n\n`;
    script += `VALUE: Quick, impactful message\n\n`;
    script += `CTA: Take action now!`;
  } else if (duration <= 30) {
    // Medium format: Hook + Problem + Solution + CTA
    script += `HOOK: ${sentences[0] || 'Attention-grabbing opening'}\n\n`;
    script += `PROBLEM: ${sentences[1] || 'What challenge are we solving?'}\n\n`;
    script += `SOLUTION: ${content}\n\n`;
    script += `CTA: Ready to get started?`;
  } else {
    // Long format: Full storytelling
    script += `INTRO: ${sentences[0] || 'Welcome message'}\n\n`;
    script += `CONTEXT: ${sentences[1] || 'Background information'}\n\n`;
    script += `MAIN CONTENT: ${content}\n\n`;
    script += `BENEFITS: Why this matters to you\n\n`;
    script += `CTA: Join us today!`;
  }
  
  return script;
}

export function getResolutionById(id: string): VideoResolution | undefined {
  return VIDEO_RESOLUTIONS.find(r => r.id === id);
}

export function getRecommendedResolution(platform: string): VideoResolution {
  switch (platform.toLowerCase()) {
    case 'youtube':
    case 'vimeo':
      return VIDEO_RESOLUTIONS.find(r => r.id === 'widescreen-fhd')!;
    case 'tiktok':
    case 'instagram-reels':
    case 'youtube-shorts':
      return VIDEO_RESOLUTIONS.find(r => r.id === 'vertical')!;
    case 'instagram':
      return VIDEO_RESOLUTIONS.find(r => r.id === 'square')!;
    case 'facebook':
    case 'linkedin':
      return VIDEO_RESOLUTIONS.find(r => r.id === 'landscape')!;
    default:
      return VIDEO_RESOLUTIONS.find(r => r.id === 'landscape')!;
  }
}

export interface CanvasSettings {
  width: number;
  height: number;
  backgroundColor: string;
  textColor: string;
  fontFamily: string;
}

export function getCanvasSettings(resolution: VideoResolution): CanvasSettings {
  return {
    width: resolution.width,
    height: resolution.height,
    backgroundColor: '#000000',
    textColor: '#ffffff',
    fontFamily: 'Inter, sans-serif'
  };
}
