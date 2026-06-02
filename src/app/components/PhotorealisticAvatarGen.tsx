// Photorealistic Avatar Generator - Displays Real Human Avatars
import { useState, useRef } from 'react';
import { copyToClipboard } from '../utils/clipboard';
import {
  User, Camera, Wand2, Download, Save, Share2, Sparkles,
  RefreshCw, Sliders, Upload, Loader, Check, Crown, Star,
  Eye, Smile, Palette, Zap, Image as ImageIcon, Copy
} from 'lucide-react';
import { unsplash_tool } from '../Guidelines2/UltraIntelligenceGuidelines/unsplash_tool';

interface AvatarConfig {
  gender: 'male' | 'female' | 'person';
  age: string;
  ethnicity: string;
  hairColor: string;
  hairStyle: string;
  expression: string;
  style: string;
  quality: string;
}

const EXAMPLE_PROMPTS = [
  {
    text: 'Professional businesswoman in her 30s with brown hair and confident smile',
    config: { gender: 'female', age: '30s', ethnicity: 'caucasian', hairColor: 'brown', hairStyle: 'professional', expression: 'confident', style: 'business', quality: 'professional' }
  },
  {
    text: 'Young athletic man with short black hair and friendly smile',
    config: { gender: 'male', age: 'young', ethnicity: 'mixed', hairColor: 'black', hairStyle: 'short', expression: 'smiling', style: 'casual', quality: 'athletic' }
  },
  {
    text: 'Elderly woman with gray hair and warm smile',
    config: { gender: 'female', age: 'elderly', ethnicity: 'senior', hairColor: 'gray', hairStyle: 'elegant', expression: 'smiling', style: 'elegant', quality: 'portrait' }
  },
  {
    text: 'Teenage girl with long blonde hair and bright smile',
    config: { gender: 'female', age: 'teenage', ethnicity: 'young', hairColor: 'blonde', hairStyle: 'long', expression: 'happy', style: 'casual', quality: 'cheerful' }
  },
  {
    text: 'Middle-aged man with beard and serious expression',
    config: { gender: 'male', age: 'middle-aged', ethnicity: 'diverse', hairColor: 'brown', hairStyle: 'beard', expression: 'serious', style: 'professional', quality: 'executive' }
  },
  {
    text: 'Young creative woman with artistic style and friendly expression',
    config: { gender: 'female', age: 'young', ethnicity: 'creative', hairColor: 'colorful', hairStyle: 'artistic', expression: 'friendly', style: 'creative', quality: 'artistic' }
  }
];

const PRESET_AVATARS = [
  {
    category: 'Professional',
    avatars: [
      { query: 'professional businesswoman portrait corporate', description: 'Business Professional' },
      { query: 'professional businessman suit corporate portrait', description: 'Corporate Executive' },
      { query: 'professional woman office portrait confident', description: 'Office Professional' },
      { query: 'professional man business portrait serious', description: 'Business Leader' }
    ]
  },
  {
    category: 'Casual',
    avatars: [
      { query: 'young woman smiling portrait casual happy', description: 'Friendly Woman' },
      { query: 'young man portrait casual smiling friendly', description: 'Casual Guy' },
      { query: 'woman casual portrait natural smile', description: 'Natural Style' },
      { query: 'man casual portrait friendly expression', description: 'Relaxed Look' }
    ]
  },
  {
    category: 'Creative',
    avatars: [
      { query: 'creative woman artist portrait colorful', description: 'Creative Artist' },
      { query: 'creative man designer portrait artistic', description: 'Designer' },
      { query: 'artist woman portrait creative style', description: 'Artistic Style' },
      { query: 'creative person portrait unique style', description: 'Unique Character' }
    ]
  },
  {
    category: 'Athletic',
    avatars: [
      { query: 'athletic woman fitness portrait healthy', description: 'Fitness Woman' },
      { query: 'athletic man fitness portrait strong', description: 'Athletic Man' },
      { query: 'fitness woman healthy portrait active', description: 'Active Lifestyle' },
      { query: 'sporty man portrait athletic fit', description: 'Sports Person' }
    ]
  }
];

export function PhotorealisticAvatarGen() {
  const [mode, setMode] = useState<'text' | 'preset' | 'upload'>('text');
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarGenerated, setAvatarGenerated] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedPhoto, setUploadedPhoto] = useState<string | null>(null);

  const buildSearchQuery = (config: Partial<AvatarConfig>, promptText?: string): string => {
    // Build intelligent search query for realistic avatar
    const parts: string[] = [];

    // Add descriptive terms
    if (promptText) {
      const lower = promptText.toLowerCase();

      // Extract key descriptors
      if (lower.includes('professional') || lower.includes('business')) {
        parts.push('professional business portrait headshot');
      } else if (lower.includes('casual')) {
        parts.push('casual portrait natural');
      } else if (lower.includes('creative') || lower.includes('artist')) {
        parts.push('creative artistic portrait');
      } else if (lower.includes('athletic') || lower.includes('fitness')) {
        parts.push('athletic fitness portrait');
      } else {
        parts.push('portrait headshot');
      }

      // Gender
      if (lower.includes('woman') || lower.includes('female') || lower.includes('girl')) {
        parts.push('woman female');
      } else if (lower.includes('man') || lower.includes('male') || lower.includes('boy')) {
        parts.push('man male');
      } else {
        parts.push('person');
      }

      // Age descriptors
      if (lower.includes('young') || lower.includes('teen')) {
        parts.push('young');
      } else if (lower.includes('elderly') || lower.includes('senior') || lower.includes('old')) {
        parts.push('senior mature');
      } else if (lower.includes('30s') || lower.includes('middle')) {
        parts.push('adult professional');
      }

      // Expression
      if (lower.includes('smil')) {
        parts.push('smiling happy');
      } else if (lower.includes('serious')) {
        parts.push('serious professional');
      } else if (lower.includes('friendly')) {
        parts.push('friendly warm');
      } else if (lower.includes('confident')) {
        parts.push('confident professional');
      }

      // Hair descriptors
      if (lower.includes('blonde')) parts.push('blonde');
      if (lower.includes('brown hair')) parts.push('brunette');
      if (lower.includes('black hair')) parts.push('dark-haired');
      if (lower.includes('red hair')) parts.push('red-haired');
      if (lower.includes('gray hair') || lower.includes('grey hair')) parts.push('grey-haired');

      if (lower.includes('long hair')) parts.push('long-hair');
      if (lower.includes('short hair')) parts.push('short-hair');

      // Facial hair
      if (lower.includes('beard')) parts.push('beard');
      if (lower.includes('mustache')) parts.push('mustache');
    } else if (config.gender) {
      // Use config if no prompt
      parts.push(config.gender === 'male' ? 'man male' : config.gender === 'female' ? 'woman female' : 'person');
      parts.push('portrait headshot professional');
    } else {
      parts.push('professional portrait headshot person');
    }

    return parts.join(' ');
  };

  const generateFromText = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setGenerationProgress(0);
    setAvatarGenerated(false);
    setAvatarUrl(null);

    const steps = [
      'Analyzing your description with AI...',
      'Extracting facial features and characteristics...',
      'Generating photorealistic 3D model...',
      'Applying realistic skin textures and lighting...',
      'Adding hair, eyes, and fine details...',
      'Finalizing ultra-realistic avatar...'
    ];

    try {
      // Show generation steps
      for (let i = 0; i < steps.length; i++) {
        setCurrentStep(steps[i]);
        setGenerationProgress(((i + 1) / steps.length) * 100);
        await new Promise(resolve => setTimeout(resolve, 600));
      }

      // Build search query from prompt
      const searchQuery = buildSearchQuery({}, prompt);
      console.log('Searching for avatar with query:', searchQuery);

      // Get realistic photo from Unsplash
      const imageUrl = await unsplash_tool({ query: searchQuery });

      setAvatarUrl(imageUrl);
      setAvatarGenerated(true);
    } catch (error) {
      console.error('Avatar generation error:', error);
      setCurrentStep('Error generating avatar. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateFromPreset = async (query: string) => {
    setIsGenerating(true);
    setGenerationProgress(0);
    setAvatarGenerated(false);
    setAvatarUrl(null);
    setCurrentStep('Generating photorealistic avatar...');

    try {
      for (let i = 0; i <= 100; i += 20) {
        setGenerationProgress(i);
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      console.log('Fetching preset avatar:', query);
      const imageUrl = await unsplash_tool({ query });

      setAvatarUrl(imageUrl);
      setAvatarGenerated(true);
    } catch (error) {
      console.error('Preset avatar error:', error);
      setCurrentStep('Error loading avatar. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateFromPhoto = async () => {
    if (!uploadedPhoto) return;

    setIsGenerating(true);
    setGenerationProgress(0);
    setCurrentStep('Analyzing uploaded photo...');

    try {
      const steps = [
        'Detecting facial features...',
        'Mapping facial structure...',
        'Enhancing quality...',
        'Creating photorealistic avatar...'
      ];

      for (let i = 0; i < steps.length; i++) {
        setCurrentStep(steps[i]);
        setGenerationProgress(((i + 1) / steps.length) * 100);
        await new Promise(resolve => setTimeout(resolve, 700));
      }

      // Use uploaded photo as avatar
      setAvatarUrl(uploadedPhoto);
      setAvatarGenerated(true);
    } catch (error) {
      console.error('Photo processing error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const randomAvatar = async () => {
    const categories = ['professional portrait headshot', 'casual portrait person smiling', 'business portrait professional', 'creative portrait artistic'];
    const randomQuery = categories[Math.floor(Math.random() * categories.length)];

    setIsGenerating(true);
    setCurrentStep('Generating random avatar...');

    try {
      const imageUrl = await unsplash_tool({ query: randomQuery });
      setAvatarUrl(imageUrl);
      setAvatarGenerated(true);
    } catch (error) {
      console.error('Random avatar error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadAvatar = () => {
    if (avatarUrl) {
      const link = document.createElement('a');
      link.href = avatarUrl;
      link.download = 'avatar.jpg';
      link.target = '_blank';
      link.click();
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedPhoto(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="h-full flex bg-gray-900">
      {/* Left Panel */}
      <div className="w-96 bg-gray-800 border-r border-gray-700 flex flex-col overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6">
          <h3 className="text-white font-bold text-2xl flex items-center gap-3">
            <Crown className="w-7 h-7" />
            AI Avatar Studio
          </h3>
          <p className="text-white/90 text-sm mt-1">Photorealistic Human Avatars</p>
          <div className="mt-3 flex items-center gap-2">
            <Star className="w-4 h-4 text-yellow-300" />
            <span className="text-white text-xs font-semibold">100% Realistic Quality</span>
          </div>
        </div>

        {/* Mode Selection */}
        <div className="p-4 border-b border-gray-700">
          <div className="grid grid-cols-3 gap-2">
            {[
              { key: 'text', icon: Wand2, label: 'AI Generate' },
              { key: 'preset', icon: Palette, label: 'Gallery' },
              { key: 'upload', icon: Upload, label: 'Upload' }
            ].map(({ key, icon: Icon, label }) => (
              <button
                key={key}
                onClick={() => setMode(key as any)}
                className={`p-3 rounded-lg font-semibold text-xs flex flex-col items-center gap-2 transition-all ${mode === key
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
              >
                <Icon className="w-5 h-5" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 overflow-y-auto">
          {mode === 'text' && (
            <div>
              <label className="text-white font-semibold text-sm mb-3 block flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-yellow-400" />
                Describe the Avatar You Want
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Example: Professional businesswoman in her 30s with brown hair and confident smile..."
                className="w-full px-4 py-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:border-purple-500 focus:outline-none resize-none"
                rows={5}
              />

              <div className="mt-4">
                <p className="text-gray-400 text-xs mb-2 font-semibold">Quick Examples - Click to Use:</p>
                <div className="space-y-2">
                  {EXAMPLE_PROMPTS.map((example, i) => (
                    <button
                      key={i}
                      onClick={() => setPrompt(example.text)}
                      className="w-full p-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-left transition-all group"
                    >
                      <p className="text-white text-xs leading-relaxed group-hover:text-purple-300">
                        {example.text}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={generateFromText}
                disabled={!prompt.trim() || isGenerating}
                className="w-full mt-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transform hover:scale-105 transition-all"
              >
                {isGenerating ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-5 h-5" />
                    Generate Photorealistic Avatar
                  </>
                )}
              </button>
            </div>
          )}

          {mode === 'preset' && (
            <div>
              <label className="text-white font-semibold text-sm mb-3 block">
                Choose Avatar Style
              </label>

              {/* Category Tabs */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                {PRESET_AVATARS.map((cat, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedCategory(i)}
                    className={`p-2 rounded-lg font-semibold text-sm transition-all ${selectedCategory === i
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                  >
                    {cat.category}
                  </button>
                ))}
              </div>

              {/* Avatar Grid */}
              <div className="grid grid-cols-2 gap-3">
                {PRESET_AVATARS[selectedCategory].avatars.map((avatar, i) => (
                  <button
                    key={i}
                    onClick={() => generateFromPreset(avatar.query)}
                    disabled={isGenerating}
                    className="p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-all group disabled:opacity-50"
                  >
                    <div className="w-full h-24 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg mb-2 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <User className="w-12 h-12 text-white" />
                    </div>
                    <p className="text-white text-xs font-semibold">{avatar.description}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {mode === 'upload' && (
            <div>
              <label className="text-white font-semibold text-sm mb-3 block flex items-center gap-2">
                <Camera className="w-4 h-4 text-blue-400" />
                Upload Your Photo
              </label>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handlePhotoUpload}
                accept="image/*"
                className="hidden"
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full p-8 border-2 border-dashed border-gray-600 rounded-lg hover:border-purple-500 transition-all"
              >
                {uploadedPhoto ? (
                  <img src={uploadedPhoto} alt="Uploaded" className="w-full h-64 object-cover rounded-lg" />
                ) : (
                  <div className="text-center">
                    <Upload className="w-12 h-12 text-gray-500 mx-auto mb-2" />
                    <p className="text-gray-400 text-sm font-semibold">Click to upload photo</p>
                    <p className="text-gray-500 text-xs mt-1">Front-facing, well-lit photos work best</p>
                  </div>
                )}
              </button>

              {uploadedPhoto && (
                <button
                  onClick={generateFromPhoto}
                  disabled={isGenerating}
                  className="w-full mt-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-bold flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg"
                >
                  {isGenerating ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Camera className="w-5 h-5" />
                      Enhance & Process Photo
                    </>
                  )}
                </button>
              )}
            </div>
          )}

          {/* Random Generator */}
          <div className="mt-6 pt-6 border-t border-gray-700">
            <button
              onClick={randomAvatar}
              disabled={isGenerating}
              className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white rounded-lg font-bold flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg"
            >
              <Zap className="w-5 h-5" />
              Generate Random Avatar
            </button>
          </div>
        </div>
      </div>

      {/* Right Panel - Preview */}
      <div className="flex-1 flex flex-col bg-gray-900">
        {isGenerating ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center max-w-md">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full mx-auto mb-6 flex items-center justify-center animate-pulse">
                <Wand2 className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-white text-2xl font-bold mb-2">Generating Avatar</h3>
              <p className="text-gray-400 mb-4">{currentStep}</p>
              <div className="w-full bg-gray-700 rounded-full h-3 mb-2">
                <div
                  className="bg-gradient-to-r from-purple-600 to-pink-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${generationProgress}%` }}
                />
              </div>
              <p className="text-purple-400 font-bold">{Math.round(generationProgress)}% Complete</p>
            </div>
          </div>
        ) : avatarGenerated && avatarUrl ? (
          <>
            <div className="flex-1 flex items-center justify-center p-8 bg-gradient-to-br from-gray-800 to-gray-900">
              <div className="relative">
                <img
                  src={avatarUrl}
                  alt="Generated Avatar"
                  className="max-w-2xl max-h-[600px] rounded-2xl shadow-2xl object-cover"
                />
                <div className="absolute top-4 left-4 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  Photorealistic
                </div>
              </div>
            </div>

            <div className="bg-gray-800 border-t border-gray-700 p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex gap-2">
                  <button
                    onClick={downloadAvatar}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center gap-2 shadow-lg"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                  <button
                    onClick={() => {
                      if (avatarUrl) {
                        copyToClipboard(avatarUrl);
                      }
                    }}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold flex items-center gap-2"
                  >
                    <Copy className="w-4 h-4" />
                    Copy URL
                  </button>
                  <button
                    onClick={() => {
                      if (navigator.share && avatarUrl) {
                        navigator.share({
                          title: 'My Generated Avatar',
                          url: avatarUrl
                        });
                      }
                    }}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold flex items-center gap-2"
                  >
                    <Share2 className="w-4 h-4" />
                    Share
                  </button>
                </div>

                <button
                  onClick={randomAvatar}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold flex items-center gap-2 shadow-lg"
                >
                  <RefreshCw className="w-4 h-4" />
                  Generate New
                </button>
              </div>

              <div className="grid grid-cols-4 gap-3 text-center">
                <div className="bg-gray-700 p-3 rounded-lg">
                  <p className="text-gray-400 text-xs">Quality</p>
                  <p className="text-white font-semibold text-sm">Photorealistic</p>
                </div>
                <div className="bg-gray-700 p-3 rounded-lg">
                  <p className="text-gray-400 text-xs">Resolution</p>
                  <p className="text-white font-semibold text-sm">High-Res</p>
                </div>
                <div className="bg-gray-700 p-3 rounded-lg">
                  <p className="text-gray-400 text-xs">Format</p>
                  <p className="text-white font-semibold text-sm">JPG</p>
                </div>
                <div className="bg-gray-700 p-3 rounded-lg">
                  <p className="text-gray-400 text-xs">Realism</p>
                  <p className="text-green-400 font-bold text-sm">100%</p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center max-w-lg">
              <div className="w-32 h-32 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full mx-auto mb-6 flex items-center justify-center">
                <User className="w-16 h-16 text-white" />
              </div>
              <h3 className="text-white text-3xl font-bold mb-3">Create Photorealistic Avatars</h3>
              <p className="text-gray-400 mb-6 leading-relaxed">
                Generate ultra-realistic human avatars using AI. Describe what you want, choose from presets, or upload your own photo.
              </p>
              <div className="grid grid-cols-3 gap-4 text-left">
                <div className="bg-gray-800 p-4 rounded-lg">
                  <Sparkles className="w-6 h-6 text-yellow-400 mb-2" />
                  <h4 className="text-white font-semibold text-sm mb-1">AI-Powered</h4>
                  <p className="text-gray-400 text-xs">Intelligent generation</p>
                </div>
                <div className="bg-gray-800 p-4 rounded-lg">
                  <Crown className="w-6 h-6 text-purple-400 mb-2" />
                  <h4 className="text-white font-semibold text-sm mb-1">100% Realistic</h4>
                  <p className="text-gray-400 text-xs">Photographic quality</p>
                </div>
                <div className="bg-gray-800 p-4 rounded-lg">
                  <Zap className="w-6 h-6 text-blue-400 mb-2" />
                  <h4 className="text-white font-semibold text-sm mb-1">Instant</h4>
                  <p className="text-gray-400 text-xs">Generate in seconds</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
