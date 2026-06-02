// Professional Realistic Avatar Generator - AI-Powered 3D Avatar Creation
import { useState, useRef, useEffect } from 'react';
import { 
  User, Camera, Wand2, Download, Save, Share2, Sparkles,
  RefreshCw, Sliders, Palette, Users, Upload, Image as ImageIcon,
  Smile, Eye, Shirt, Ruler, Zap, Crown, Star, Loader,
  ChevronDown, ChevronUp, Copy, Check, Play, RotateCw,
  Moon, Sun, Grid, Layers, Box, Move, Maximize2
} from 'lucide-react';

interface AvatarFeatures {
  // Face
  faceShape: 'oval' | 'round' | 'square' | 'heart' | 'diamond' | 'oblong';
  skinTone: string;
  age: number;
  gender: 'male' | 'female' | 'neutral';
  
  // Eyes
  eyeShape: 'almond' | 'round' | 'hooded' | 'upturned' | 'downturned';
  eyeColor: string;
  eyeSize: number;
  eyeDistance: number;
  
  // Nose
  noseShape: 'straight' | 'button' | 'roman' | 'hawk' | 'snub';
  noseSize: number;
  noseWidth: number;
  
  // Mouth
  lipShape: 'full' | 'thin' | 'bow' | 'wide' | 'heart';
  lipColor: string;
  mouthWidth: number;
  
  // Hair
  hairStyle: string;
  hairColor: string;
  hairLength: 'bald' | 'short' | 'medium' | 'long' | 'very-long';
  
  // Facial Hair
  facialHair: 'none' | 'stubble' | 'beard' | 'goatee' | 'mustache' | 'full-beard';
  facialHairColor: string;
  
  // Body
  bodyType: 'slim' | 'athletic' | 'average' | 'muscular' | 'plus-size';
  height: number;
  shoulderWidth: number;
  
  // Clothing
  outfit: string;
  outfitColor: string;
  style: 'casual' | 'business' | 'formal' | 'sporty' | 'streetwear';
  
  // Expression
  expression: 'neutral' | 'smile' | 'laugh' | 'serious' | 'confident' | 'friendly';
  
  // Pose
  pose: 'standing' | 'sitting' | 'confident' | 'casual' | 'professional';
}

interface AvatarStyle {
  name: string;
  description: string;
  realism: number; // 0-100
  examples: string[];
}

interface GenerationStep {
  step: number;
  title: string;
  description: string;
  progress: number;
  complete: boolean;
}

const REALISTIC_STYLES: AvatarStyle[] = [
  {
    name: 'Photorealistic',
    description: 'Ultra-realistic human avatar with detailed textures',
    realism: 100,
    examples: ['MetaHuman', 'Ready Player Me Pro', 'Unreal Engine']
  },
  {
    name: 'Semi-Realistic',
    description: 'Stylized but realistic features',
    realism: 80,
    examples: ['Apple Memoji Pro', 'Snapchat Bitmoji 3D']
  },
  {
    name: 'Game Character',
    description: 'Video game style realistic character',
    realism: 70,
    examples: ['GTA', 'The Sims', 'Cyberpunk 2077']
  },
  {
    name: 'Anime Realistic',
    description: 'Anime style with realistic proportions',
    realism: 60,
    examples: ['Final Fantasy', 'Genshin Impact']
  }
];

const EXAMPLE_PROMPTS = [
  {
    text: 'A professional businesswoman in her 30s with short brown hair, confident smile, wearing a navy blue suit',
    tags: ['Professional', 'Female', 'Business']
  },
  {
    text: 'A young athletic man with black hair, strong jawline, friendly expression, wearing casual streetwear',
    tags: ['Athletic', 'Male', 'Casual']
  },
  {
    text: 'An elderly wise woman with gray hair in a bun, warm smile, wearing traditional clothing',
    tags: ['Elderly', 'Female', 'Traditional']
  },
  {
    text: 'A teenage gamer with colorful dyed hair, expressive eyes, wearing a gaming headset and hoodie',
    tags: ['Young', 'Neutral', 'Gaming']
  },
  {
    text: 'A muscular fitness instructor with buzzcut, determined expression, wearing athletic gear',
    tags: ['Athletic', 'Male', 'Sports']
  },
  {
    text: 'A creative artist with long flowing hair, artistic makeup, bohemian style clothing',
    tags: ['Creative', 'Female', 'Artistic']
  }
];

const SKIN_TONES = [
  { name: 'Very Fair', hex: '#FFE0BD' },
  { name: 'Fair', hex: '#FFCD94' },
  { name: 'Light', hex: '#EAC086' },
  { name: 'Medium', hex: '#D9A066' },
  { name: 'Olive', hex: '#C68642' },
  { name: 'Tan', hex: '#A87C4F' },
  { name: 'Brown', hex: '#8D5524' },
  { name: 'Dark Brown', hex: '#6B3410' },
  { name: 'Deep', hex: '#4A2511' }
];

const EYE_COLORS = [
  { name: 'Blue', hex: '#5D9CEC' },
  { name: 'Green', hex: '#48C9B0' },
  { name: 'Brown', hex: '#8B4513' },
  { name: 'Hazel', hex: '#B8860B' },
  { name: 'Gray', hex: '#708090' },
  { name: 'Amber', hex: '#FFBF00' }
];

const HAIR_COLORS = [
  { name: 'Black', hex: '#1C1C1C' },
  { name: 'Dark Brown', hex: '#3B2414' },
  { name: 'Brown', hex: '#5C4033' },
  { name: 'Light Brown', hex: '#9A7B4F' },
  { name: 'Blonde', hex: '#F4E4C1' },
  { name: 'Platinum', hex: '#E0DED8' },
  { name: 'Red', hex: '#8B3A3A' },
  { name: 'Auburn', hex: '#A52A2A' },
  { name: 'Gray', hex: '#808080' },
  { name: 'White', hex: '#F5F5F5' }
];

const HAIR_STYLES = {
  male: [
    'Buzz Cut', 'Crew Cut', 'Undercut', 'Pompadour', 'Quiff', 
    'Side Part', 'Slick Back', 'Messy', 'Curly', 'Dreadlocks',
    'Man Bun', 'Long Flowing', 'Mohawk', 'Faux Hawk'
  ],
  female: [
    'Long Straight', 'Long Wavy', 'Long Curly', 'Bob', 'Pixie Cut',
    'Shoulder Length', 'Braids', 'Ponytail', 'Bun', 'Half Up',
    'Beach Waves', 'Afro', 'Dreadlocks', 'Space Buns'
  ],
  neutral: [
    'Short', 'Medium', 'Long', 'Curly', 'Wavy', 'Straight',
    'Undercut', 'Shaved Sides', 'Natural', 'Textured'
  ]
};

export function ProfessionalAvatarGenerator() {
  const [mode, setMode] = useState<'text' | 'photo' | 'custom'>('text');
  const [prompt, setPrompt] = useState('');
  const [uploadedPhoto, setUploadedPhoto] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<AvatarStyle>(REALISTIC_STYLES[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationSteps, setGenerationSteps] = useState<GenerationStep[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [avatarGenerated, setAvatarGenerated] = useState(false);
  const [showCustomization, setShowCustomization] = useState(false);
  const [avatarFeatures, setAvatarFeatures] = useState<AvatarFeatures>({
    faceShape: 'oval',
    skinTone: SKIN_TONES[2].hex,
    age: 25,
    gender: 'neutral',
    eyeShape: 'almond',
    eyeColor: EYE_COLORS[2].hex,
    eyeSize: 50,
    eyeDistance: 50,
    noseShape: 'straight',
    noseSize: 50,
    noseWidth: 50,
    lipShape: 'full',
    lipColor: '#D9766C',
    mouthWidth: 50,
    hairStyle: 'Medium',
    hairColor: HAIR_COLORS[2].hex,
    hairLength: 'medium',
    facialHair: 'none',
    facialHairColor: HAIR_COLORS[0].hex,
    bodyType: 'average',
    height: 170,
    shoulderWidth: 50,
    outfit: 'Casual Shirt',
    outfitColor: '#3B82F6',
    style: 'casual',
    expression: 'neutral',
    pose: 'standing'
  });
  const [activeTab, setActiveTab] = useState<'face' | 'hair' | 'body' | 'clothing'>('face');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const analyzePrompt = (text: string): Partial<AvatarFeatures> => {
    const lower = text.toLowerCase();
    const features: Partial<AvatarFeatures> = {};

    // Gender detection
    if (lower.includes('woman') || lower.includes('female') || lower.includes('girl')) {
      features.gender = 'female';
    } else if (lower.includes('man') || lower.includes('male') || lower.includes('boy')) {
      features.gender = 'male';
    }

    // Age detection
    if (lower.includes('young') || lower.includes('teen')) {
      features.age = 18;
    } else if (lower.includes('middle-aged') || lower.includes('30s') || lower.includes('40s')) {
      features.age = 35;
    } else if (lower.includes('elderly') || lower.includes('senior') || lower.includes('old')) {
      features.age = 65;
    }

    // Hair color
    if (lower.includes('blonde')) features.hairColor = HAIR_COLORS[4].hex;
    if (lower.includes('brown hair')) features.hairColor = HAIR_COLORS[2].hex;
    if (lower.includes('black hair')) features.hairColor = HAIR_COLORS[0].hex;
    if (lower.includes('red hair') || lower.includes('ginger')) features.hairColor = HAIR_COLORS[6].hex;
    if (lower.includes('gray hair') || lower.includes('grey')) features.hairColor = HAIR_COLORS[8].hex;

    // Hair length
    if (lower.includes('short hair')) features.hairLength = 'short';
    if (lower.includes('long hair')) features.hairLength = 'long';
    if (lower.includes('bald')) features.hairLength = 'bald';

    // Body type
    if (lower.includes('athletic') || lower.includes('fit') || lower.includes('muscular')) {
      features.bodyType = 'athletic';
    }
    if (lower.includes('slim') || lower.includes('thin')) {
      features.bodyType = 'slim';
    }

    // Expression
    if (lower.includes('smile') || lower.includes('smiling')) features.expression = 'smile';
    if (lower.includes('serious')) features.expression = 'serious';
    if (lower.includes('confident')) features.expression = 'confident';
    if (lower.includes('friendly')) features.expression = 'friendly';

    // Clothing style
    if (lower.includes('business') || lower.includes('suit')) features.style = 'business';
    if (lower.includes('casual')) features.style = 'casual';
    if (lower.includes('formal')) features.style = 'formal';
    if (lower.includes('sport')) features.style = 'sporty';

    // Facial hair
    if (lower.includes('beard')) features.facialHair = 'beard';
    if (lower.includes('mustache')) features.facialHair = 'mustache';
    if (lower.includes('goatee')) features.facialHair = 'goatee';
    if (lower.includes('clean shaven')) features.facialHair = 'none';

    return features;
  };

  const generateFromText = async () => {
    setIsGenerating(true);
    setAvatarGenerated(false);
    
    // Initialize generation steps
    const steps: GenerationStep[] = [
      { step: 1, title: 'Analyzing Prompt', description: 'Understanding your description...', progress: 0, complete: false },
      { step: 2, title: 'AI Feature Extraction', description: 'Extracting facial features and characteristics...', progress: 0, complete: false },
      { step: 3, title: 'Building 3D Model', description: 'Creating base 3D mesh and structure...', progress: 0, complete: false },
      { step: 4, title: 'Applying Textures', description: 'Adding realistic skin, hair, and material textures...', progress: 0, complete: false },
      { step: 5, title: 'Lighting & Rendering', description: 'Setting up realistic lighting and shadows...', progress: 0, complete: false },
      { step: 6, title: 'Final Touches', description: 'Applying post-processing and refinements...', progress: 0, complete: false }
    ];
    
    setGenerationSteps(steps);
    setCurrentStep(0);

    // Analyze prompt
    const analyzedFeatures = analyzePrompt(prompt);
    
    // Step 1: Analyzing
    await updateStep(0, 100, 1000);
    
    // Step 2: Feature Extraction
    await updateStep(1, 100, 1500);
    setAvatarFeatures(prev => ({ ...prev, ...analyzedFeatures }));
    
    // Step 3: Building 3D Model
    await updateStep(2, 100, 2000);
    
    // Step 4: Textures
    await updateStep(3, 100, 1800);
    
    // Step 5: Lighting
    await updateStep(4, 100, 1200);
    
    // Step 6: Final
    await updateStep(5, 100, 1000);
    
    setAvatarGenerated(true);
    setIsGenerating(false);
  };

  const generateFromPhoto = async () => {
    setIsGenerating(true);
    setAvatarGenerated(false);
    
    const steps: GenerationStep[] = [
      { step: 1, title: 'Analyzing Photo', description: 'Detecting facial landmarks and features...', progress: 0, complete: false },
      { step: 2, title: 'Face Reconstruction', description: 'Building 3D face model from 2D image...', progress: 0, complete: false },
      { step: 3, title: 'Feature Matching', description: 'Matching facial features to 3D parameters...', progress: 0, complete: false },
      { step: 4, title: 'Texture Mapping', description: 'Creating realistic skin textures...', progress: 0, complete: false },
      { step: 5, title: 'Hair & Details', description: 'Reconstructing hair and fine details...', progress: 0, complete: false },
      { step: 6, title: 'Optimization', description: 'Optimizing model for best quality...', progress: 0, complete: false }
    ];
    
    setGenerationSteps(steps);
    setCurrentStep(0);

    // Simulate AI analysis
    for (let i = 0; i < steps.length; i++) {
      await updateStep(i, 100, 1500);
    }
    
    setAvatarGenerated(true);
    setIsGenerating(false);
  };

  const updateStep = async (stepIndex: number, progress: number, duration: number) => {
    setCurrentStep(stepIndex);
    
    // Animate progress
    const steps = 20;
    const increment = progress / steps;
    const delay = duration / steps;
    
    for (let i = 0; i <= steps; i++) {
      await new Promise(resolve => setTimeout(resolve, delay));
      setGenerationSteps(prev => prev.map((s, idx) => 
        idx === stepIndex 
          ? { ...s, progress: Math.min(increment * i, 100) }
          : s
      ));
    }
    
    // Mark as complete
    setGenerationSteps(prev => prev.map((s, idx) => 
      idx === stepIndex 
        ? { ...s, complete: true, progress: 100 }
        : s
    ));
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

  const updateFeature = <K extends keyof AvatarFeatures>(key: K, value: AvatarFeatures[K]) => {
    setAvatarFeatures(prev => ({ ...prev, [key]: value }));
  };

  const randomizeAvatar = () => {
    const randomGender = ['male', 'female', 'neutral'][Math.floor(Math.random() * 3)] as 'male' | 'female' | 'neutral';
    const randomSkinTone = SKIN_TONES[Math.floor(Math.random() * SKIN_TONES.length)];
    const randomEyeColor = EYE_COLORS[Math.floor(Math.random() * EYE_COLORS.length)];
    const randomHairColor = HAIR_COLORS[Math.floor(Math.random() * HAIR_COLORS.length)];
    
    setAvatarFeatures({
      ...avatarFeatures,
      gender: randomGender,
      skinTone: randomSkinTone.hex,
      eyeColor: randomEyeColor.hex,
      hairColor: randomHairColor.hex,
      age: Math.floor(Math.random() * 50) + 18,
      eyeSize: Math.floor(Math.random() * 50) + 25,
      noseSize: Math.floor(Math.random() * 50) + 25,
      mouthWidth: Math.floor(Math.random() * 50) + 25
    });
  };

  const exportAvatar = (format: string) => {
    console.log(`Exporting avatar as ${format}...`);
    // In real implementation, this would export the 3D model
  };

  return (
    <div className="h-full flex bg-gray-900">
      {/* Left Panel - Controls */}
      <div className="w-96 bg-gray-800 border-r border-gray-700 flex flex-col overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6">
          <h3 className="text-white font-bold text-2xl flex items-center gap-3">
            <Crown className="w-7 h-7" />
            Pro Avatar Generator
          </h3>
          <p className="text-white/90 text-sm mt-1">Photorealistic AI-Powered 3D Avatars</p>
        </div>

        {/* Mode Selection */}
        <div className="p-4 border-b border-gray-700">
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setMode('text')}
              className={`p-3 rounded-lg text-sm font-semibold flex flex-col items-center gap-2 transition-all ${
                mode === 'text'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <Wand2 className="w-5 h-5" />
              Text
            </button>
            <button
              onClick={() => setMode('photo')}
              className={`p-3 rounded-lg text-sm font-semibold flex flex-col items-center gap-2 transition-all ${
                mode === 'photo'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <Camera className="w-5 h-5" />
              Photo
            </button>
            <button
              onClick={() => setMode('custom')}
              className={`p-3 rounded-lg text-sm font-semibold flex flex-col items-center gap-2 transition-all ${
                mode === 'custom'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <Sliders className="w-5 h-5" />
              Custom
            </button>
          </div>
        </div>

        {/* Style Selection */}
        <div className="p-4 border-b border-gray-700">
          <label className="text-white font-semibold text-sm mb-3 block flex items-center gap-2">
            <Star className="w-4 h-4 text-yellow-400" />
            Realism Style
          </label>
          <div className="space-y-2">
            {REALISTIC_STYLES.map((style) => (
              <button
                key={style.name}
                onClick={() => setSelectedStyle(style)}
                className={`w-full p-3 rounded-lg text-left transition-all ${
                  selectedStyle.name === style.name
                    ? 'bg-purple-600 border-2 border-purple-400'
                    : 'bg-gray-700 border-2 border-transparent hover:border-gray-600'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-white font-semibold text-sm">{style.name}</span>
                  <span className="text-xs text-purple-300">{style.realism}% Real</span>
                </div>
                <p className="text-gray-300 text-xs mb-2">{style.description}</p>
                <div className="flex flex-wrap gap-1">
                  {style.examples.map((ex, i) => (
                    <span key={i} className="px-2 py-0.5 bg-gray-800 text-gray-400 rounded text-xs">
                      {ex}
                    </span>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Input Section */}
        <div className="flex-1 p-4">
          {mode === 'text' && (
            <div>
              <label className="text-white font-semibold text-sm mb-3 block flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-yellow-400" />
                Describe Your Avatar
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Example: A professional woman in her 30s with shoulder-length brown hair, confident smile, wearing a navy blue business suit..."
                className="w-full px-4 py-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:border-purple-500 focus:outline-none resize-none"
                rows={6}
              />
              
              {/* Example Prompts */}
              <div className="mt-4">
                <p className="text-gray-400 text-xs mb-2">Quick Examples:</p>
                <div className="space-y-2">
                  {EXAMPLE_PROMPTS.slice(0, 3).map((example, i) => (
                    <button
                      key={i}
                      onClick={() => setPrompt(example.text)}
                      className="w-full p-2 bg-gray-700 hover:bg-gray-600 rounded text-left transition-all"
                    >
                      <p className="text-white text-xs line-clamp-2">{example.text}</p>
                      <div className="flex gap-1 mt-1">
                        {example.tags.map((tag, j) => (
                          <span key={j} className="px-1.5 py-0.5 bg-purple-900/50 text-purple-300 rounded text-xs">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={generateFromText}
                disabled={!prompt.trim() || isGenerating}
                className="w-full mt-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isGenerating ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-5 h-5" />
                    Generate Avatar
                  </>
                )}
              </button>
            </div>
          )}

          {mode === 'photo' && (
            <div>
              <label className="text-white font-semibold text-sm mb-3 block flex items-center gap-2">
                <Camera className="w-4 h-4 text-blue-400" />
                Upload Photo
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
                  <img src={uploadedPhoto} alt="Uploaded" className="w-full h-48 object-cover rounded" />
                ) : (
                  <div className="text-center">
                    <Upload className="w-12 h-12 text-gray-500 mx-auto mb-2" />
                    <p className="text-gray-400 text-sm">Click to upload photo</p>
                    <p className="text-gray-500 text-xs mt-1">Front-facing, good lighting recommended</p>
                  </div>
                )}
              </button>

              {uploadedPhoto && (
                <button
                  onClick={generateFromPhoto}
                  disabled={isGenerating}
                  className="w-full mt-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isGenerating ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Camera className="w-5 h-5" />
                      Generate from Photo
                    </>
                  )}
                </button>
              )}
            </div>
          )}

          {mode === 'custom' && (
            <div>
              {/* Customization Tabs */}
              <div className="grid grid-cols-4 gap-1 mb-4">
                {(['face', 'hair', 'body', 'clothing'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`p-2 rounded text-xs font-semibold capitalize ${
                      activeTab === tab
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="space-y-4">
                {activeTab === 'face' && (
                  <>
                    {/* Gender */}
                    <div>
                      <label className="text-white text-sm mb-2 block">Gender</label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['male', 'female', 'neutral'] as const).map((g) => (
                          <button
                            key={g}
                            onClick={() => updateFeature('gender', g)}
                            className={`p-2 rounded text-xs font-semibold capitalize ${
                              avatarFeatures.gender === g
                                ? 'bg-purple-600 text-white'
                                : 'bg-gray-700 text-gray-300'
                            }`}
                          >
                            {g}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Age */}
                    <div>
                      <label className="text-white text-sm mb-2 block">Age: {avatarFeatures.age}</label>
                      <input
                        type="range"
                        min="18"
                        max="80"
                        value={avatarFeatures.age}
                        onChange={(e) => updateFeature('age', parseInt(e.target.value))}
                        className="w-full"
                      />
                    </div>

                    {/* Skin Tone */}
                    <div>
                      <label className="text-white text-sm mb-2 block">Skin Tone</label>
                      <div className="grid grid-cols-5 gap-2">
                        {SKIN_TONES.map((tone) => (
                          <button
                            key={tone.hex}
                            onClick={() => updateFeature('skinTone', tone.hex)}
                            className={`w-full h-10 rounded border-2 ${
                              avatarFeatures.skinTone === tone.hex
                                ? 'border-white'
                                : 'border-gray-600'
                            }`}
                            style={{ backgroundColor: tone.hex }}
                            title={tone.name}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Eye Color */}
                    <div>
                      <label className="text-white text-sm mb-2 block">Eye Color</label>
                      <div className="grid grid-cols-6 gap-2">
                        {EYE_COLORS.map((color) => (
                          <button
                            key={color.hex}
                            onClick={() => updateFeature('eyeColor', color.hex)}
                            className={`w-full h-10 rounded border-2 ${
                              avatarFeatures.eyeColor === color.hex
                                ? 'border-white'
                                : 'border-gray-600'
                            }`}
                            style={{ backgroundColor: color.hex }}
                            title={color.name}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Expression */}
                    <div>
                      <label className="text-white text-sm mb-2 block">Expression</label>
                      <select
                        value={avatarFeatures.expression}
                        onChange={(e) => updateFeature('expression', e.target.value as any)}
                        className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600"
                      >
                        <option value="neutral">Neutral</option>
                        <option value="smile">Smile</option>
                        <option value="laugh">Laugh</option>
                        <option value="serious">Serious</option>
                        <option value="confident">Confident</option>
                        <option value="friendly">Friendly</option>
                      </select>
                    </div>
                  </>
                )}

                {activeTab === 'hair' && (
                  <>
                    {/* Hair Color */}
                    <div>
                      <label className="text-white text-sm mb-2 block">Hair Color</label>
                      <div className="grid grid-cols-5 gap-2">
                        {HAIR_COLORS.map((color) => (
                          <button
                            key={color.hex}
                            onClick={() => updateFeature('hairColor', color.hex)}
                            className={`w-full h-10 rounded border-2 ${
                              avatarFeatures.hairColor === color.hex
                                ? 'border-white'
                                : 'border-gray-600'
                            }`}
                            style={{ backgroundColor: color.hex }}
                            title={color.name}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Hair Style */}
                    <div>
                      <label className="text-white text-sm mb-2 block">Hair Style</label>
                      <select
                        value={avatarFeatures.hairStyle}
                        onChange={(e) => updateFeature('hairStyle', e.target.value)}
                        className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600"
                      >
                        {HAIR_STYLES[avatarFeatures.gender].map((style) => (
                          <option key={style} value={style}>{style}</option>
                        ))}
                      </select>
                    </div>

                    {/* Facial Hair */}
                    {avatarFeatures.gender === 'male' && (
                      <div>
                        <label className="text-white text-sm mb-2 block">Facial Hair</label>
                        <select
                          value={avatarFeatures.facialHair}
                          onChange={(e) => updateFeature('facialHair', e.target.value as any)}
                          className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600"
                        >
                          <option value="none">None</option>
                          <option value="stubble">Stubble</option>
                          <option value="beard">Beard</option>
                          <option value="goatee">Goatee</option>
                          <option value="mustache">Mustache</option>
                          <option value="full-beard">Full Beard</option>
                        </select>
                      </div>
                    )}
                  </>
                )}

                {activeTab === 'body' && (
                  <>
                    {/* Body Type */}
                    <div>
                      <label className="text-white text-sm mb-2 block">Body Type</label>
                      <select
                        value={avatarFeatures.bodyType}
                        onChange={(e) => updateFeature('bodyType', e.target.value as any)}
                        className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600"
                      >
                        <option value="slim">Slim</option>
                        <option value="athletic">Athletic</option>
                        <option value="average">Average</option>
                        <option value="muscular">Muscular</option>
                        <option value="plus-size">Plus Size</option>
                      </select>
                    </div>

                    {/* Height */}
                    <div>
                      <label className="text-white text-sm mb-2 block">Height: {avatarFeatures.height}cm</label>
                      <input
                        type="range"
                        min="150"
                        max="200"
                        value={avatarFeatures.height}
                        onChange={(e) => updateFeature('height', parseInt(e.target.value))}
                        className="w-full"
                      />
                    </div>

                    {/* Pose */}
                    <div>
                      <label className="text-white text-sm mb-2 block">Pose</label>
                      <select
                        value={avatarFeatures.pose}
                        onChange={(e) => updateFeature('pose', e.target.value as any)}
                        className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600"
                      >
                        <option value="standing">Standing</option>
                        <option value="sitting">Sitting</option>
                        <option value="confident">Confident</option>
                        <option value="casual">Casual</option>
                        <option value="professional">Professional</option>
                      </select>
                    </div>
                  </>
                )}

                {activeTab === 'clothing' && (
                  <>
                    {/* Style */}
                    <div>
                      <label className="text-white text-sm mb-2 block">Style</label>
                      <select
                        value={avatarFeatures.style}
                        onChange={(e) => updateFeature('style', e.target.value as any)}
                        className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600"
                      >
                        <option value="casual">Casual</option>
                        <option value="business">Business</option>
                        <option value="formal">Formal</option>
                        <option value="sporty">Sporty</option>
                        <option value="streetwear">Streetwear</option>
                      </select>
                    </div>

                    {/* Outfit Color */}
                    <div>
                      <label className="text-white text-sm mb-2 block">Outfit Color</label>
                      <input
                        type="color"
                        value={avatarFeatures.outfitColor}
                        onChange={(e) => updateFeature('outfitColor', e.target.value)}
                        className="w-full h-12 rounded cursor-pointer"
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="flex gap-2 mt-4">
                <button
                  onClick={randomizeAvatar}
                  className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Random
                </button>
                <button
                  onClick={() => setAvatarGenerated(true)}
                  className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold"
                >
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Preview & Generation */}
      <div className="flex-1 flex flex-col bg-gray-900">
        {!isGenerating && !avatarGenerated && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-md">
              <div className="w-24 h-24 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full mx-auto mb-6 flex items-center justify-center">
                <User className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-white text-2xl font-bold mb-3">Create Your Avatar</h3>
              <p className="text-gray-400 mb-6">
                Describe your avatar, upload a photo, or customize manually to create a photorealistic 3D avatar
              </p>
              <div className="grid grid-cols-2 gap-4 text-left">
                <div className="p-4 bg-gray-800 rounded-lg">
                  <Sparkles className="w-6 h-6 text-yellow-400 mb-2" />
                  <h4 className="text-white font-semibold text-sm mb-1">AI-Powered</h4>
                  <p className="text-gray-400 text-xs">Advanced AI learns from millions of faces</p>
                </div>
                <div className="p-4 bg-gray-800 rounded-lg">
                  <Crown className="w-6 h-6 text-purple-400 mb-2" />
                  <h4 className="text-white font-semibold text-sm mb-1">Photorealistic</h4>
                  <p className="text-gray-400 text-xs">Industry-leading quality</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {isGenerating && (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="max-w-2xl w-full">
              <div className="text-center mb-8">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full mx-auto mb-4 flex items-center justify-center animate-pulse">
                  <Wand2 className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-white text-2xl font-bold mb-2">Generating Your Avatar</h3>
                <p className="text-gray-400">Using advanced AI to create photorealistic 3D model...</p>
              </div>

              <div className="space-y-4">
                {generationSteps.map((step, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      step.complete
                        ? 'bg-green-900/20 border-green-500'
                        : index === currentStep
                        ? 'bg-purple-900/20 border-purple-500'
                        : 'bg-gray-800 border-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        {step.complete ? (
                          <Check className="w-5 h-5 text-green-400" />
                        ) : index === currentStep ? (
                          <Loader className="w-5 h-5 text-purple-400 animate-spin" />
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-gray-700" />
                        )}
                        <div>
                          <h4 className="text-white font-semibold">{step.title}</h4>
                          <p className="text-gray-400 text-sm">{step.description}</p>
                        </div>
                      </div>
                      <span className="text-sm text-gray-400">{Math.round(step.progress)}%</span>
                    </div>
                    {index === currentStep && (
                      <div className="mt-2 w-full bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${step.progress}%` }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {avatarGenerated && (
          <div className="flex-1 flex flex-col">
            {/* Preview Area */}
            <div className="flex-1 relative bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
              {/* 3D Avatar Preview Placeholder */}
              <div className="relative">
                <div className="w-96 h-96 bg-gradient-to-br from-purple-900/30 to-pink-900/30 rounded-full flex items-center justify-center border-4 border-purple-500/30">
                  <div className="text-center">
                    <User className="w-32 h-32 text-purple-400 mx-auto mb-4" />
                    <p className="text-white font-semibold text-lg">Avatar Preview</p>
                    <p className="text-gray-400 text-sm mt-2">3D Model Generated</p>
                    <div className="mt-4 flex gap-2 justify-center">
                      <span className="px-3 py-1 bg-green-600 text-white rounded-full text-xs font-semibold">
                        Photorealistic
                      </span>
                      <span className="px-3 py-1 bg-blue-600 text-white rounded-full text-xs font-semibold">
                        {selectedStyle.name}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Feature Tags */}
                <div className="absolute -right-32 top-1/4 space-y-2">
                  <div className="bg-gray-800 px-3 py-2 rounded-lg border border-gray-700">
                    <p className="text-gray-400 text-xs">Age</p>
                    <p className="text-white font-semibold">{avatarFeatures.age}</p>
                  </div>
                  <div className="bg-gray-800 px-3 py-2 rounded-lg border border-gray-700">
                    <p className="text-gray-400 text-xs">Gender</p>
                    <p className="text-white font-semibold capitalize">{avatarFeatures.gender}</p>
                  </div>
                  <div className="bg-gray-800 px-3 py-2 rounded-lg border border-gray-700">
                    <p className="text-gray-400 text-xs">Style</p>
                    <p className="text-white font-semibold capitalize">{avatarFeatures.style}</p>
                  </div>
                </div>
              </div>

              {/* Controls Overlay */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-800/90 backdrop-blur rounded-lg p-3 flex gap-2">
                <button className="p-2 bg-gray-700 hover:bg-gray-600 rounded text-white" title="Rotate">
                  <RotateCw className="w-4 h-4" />
                </button>
                <button className="p-2 bg-gray-700 hover:bg-gray-600 rounded text-white" title="Zoom">
                  <Maximize2 className="w-4 h-4" />
                </button>
                <button className="p-2 bg-gray-700 hover:bg-gray-600 rounded text-white" title="Reset View">
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Action Bar */}
            <div className="bg-gray-800 border-t border-gray-700 p-4">
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <button
                    onClick={() => exportAvatar('GLB')}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Export GLB
                  </button>
                  <button
                    onClick={() => exportAvatar('FBX')}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold"
                  >
                    FBX
                  </button>
                  <button
                    onClick={() => exportAvatar('OBJ')}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold"
                  >
                    OBJ
                  </button>
                  <button
                    onClick={() => exportAvatar('USDZ')}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold"
                  >
                    USDZ
                  </button>
                </div>
                
                <div className="flex gap-2">
                  <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    Save
                  </button>
                  <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold flex items-center gap-2">
                    <Share2 className="w-4 h-4" />
                    Share
                  </button>
                </div>
              </div>

              {/* Format Info */}
              <div className="mt-3 grid grid-cols-4 gap-3">
                <div className="text-center">
                  <p className="text-gray-400 text-xs">Polygons</p>
                  <p className="text-white font-semibold">~50K</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-400 text-xs">Textures</p>
                  <p className="text-white font-semibold">4K PBR</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-400 text-xs">Rigged</p>
                  <p className="text-white font-semibold">Yes</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-400 text-xs">Quality</p>
                  <p className="text-white font-semibold">{selectedStyle.realism}%</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
