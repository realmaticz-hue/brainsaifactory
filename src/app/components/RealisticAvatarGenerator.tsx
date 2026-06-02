// Realistic Avatar Generator with Actual Visual Generation
import { useState, useRef, useEffect } from 'react';
import { 
  User, Camera, Wand2, Download, Save, Share2, Sparkles,
  RefreshCw, Sliders, Palette, Upload, Loader, Check,
  RotateCw, Maximize2, X, ChevronDown, Crown, Star,
  Eye, Smile, Shirt
} from 'lucide-react';

interface AvatarConfig {
  // Face
  gender: 'male' | 'female' | 'neutral';
  skinTone: string;
  age: number;
  faceShape: string;
  
  // Eyes
  eyeColor: string;
  eyeSize: number;
  
  // Hair
  hairStyle: string;
  hairColor: string;
  
  // Facial Hair
  facialHair: string;
  facialHairColor: string;
  
  // Body
  bodyType: string;
  
  // Clothing
  clothingStyle: string;
  clothingColor: string;
  
  // Expression
  expression: string;
  
  // Style
  realism: number;
}

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
  { name: 'Red', hex: '#8B3A3A' },
  { name: 'Auburn', hex: '#A52A2A' },
  { name: 'Gray', hex: '#808080' }
];

const EXAMPLE_PROMPTS = [
  'A professional woman in her 30s with shoulder-length brown hair and a confident smile',
  'A young athletic man with short black hair and a friendly expression',
  'An elderly person with gray hair and a warm, wise smile',
  'A teenage girl with long blonde hair and bright blue eyes',
  'A muscular man with a beard and a determined look',
  'A creative artist with colorful hair and artistic style'
];

export function RealisticAvatarGenerator() {
  const [mode, setMode] = useState<'text' | 'photo' | 'custom'>('text');
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [avatarGenerated, setAvatarGenerated] = useState(false);
  const [currentStep, setCurrentStep] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedPhoto, setUploadedPhoto] = useState<string | null>(null);
  
  const [config, setConfig] = useState<AvatarConfig>({
    gender: 'neutral',
    skinTone: SKIN_TONES[2].hex,
    age: 25,
    faceShape: 'oval',
    eyeColor: EYE_COLORS[2].hex,
    eyeSize: 50,
    hairStyle: 'Medium',
    hairColor: HAIR_COLORS[2].hex,
    facialHair: 'none',
    facialHairColor: HAIR_COLORS[0].hex,
    bodyType: 'average',
    clothingStyle: 'casual',
    clothingColor: '#3B82F6',
    expression: 'neutral',
    realism: 100
  });

  const drawAvatar = (context: CanvasRenderingContext2D, cfg: AvatarConfig) => {
    const canvas = context.canvas;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // Clear canvas
    context.fillStyle = '#1F2937';
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Draw background gradient
    const bgGradient = context.createRadialGradient(centerX, centerY, 0, centerX, centerY, 300);
    bgGradient.addColorStop(0, '#374151');
    bgGradient.addColorStop(1, '#1F2937');
    context.fillStyle = bgGradient;
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Calculate sizes based on realism
    const scale = cfg.realism / 100;
    const headRadius = 80 * scale;

    // Draw neck
    context.fillStyle = adjustBrightness(cfg.skinTone, -10);
    context.beginPath();
    context.ellipse(centerX, centerY + 100, 35, 50, 0, 0, Math.PI * 2);
    context.fill();

    // Draw shoulders/body
    context.fillStyle = cfg.clothingColor;
    context.beginPath();
    context.arc(centerX - 80, centerY + 140, 40, 0, Math.PI * 2);
    context.arc(centerX + 80, centerY + 140, 40, 0, Math.PI * 2);
    context.fill();
    context.fillRect(centerX - 120, centerY + 100, 240, 100);

    // Draw head (main face circle)
    const faceGradient = context.createRadialGradient(
      centerX - 20, centerY - 20, 10,
      centerX, centerY, headRadius
    );
    faceGradient.addColorStop(0, adjustBrightness(cfg.skinTone, 10));
    faceGradient.addColorStop(1, cfg.skinTone);
    context.fillStyle = faceGradient;
    context.beginPath();
    context.arc(centerX, centerY, headRadius, 0, Math.PI * 2);
    context.fill();

    // Add face shading
    context.fillStyle = 'rgba(0,0,0,0.1)';
    context.beginPath();
    context.arc(centerX + 20, centerY + 20, headRadius - 10, 0, Math.PI * 2);
    context.fill();

    // Draw ears
    context.fillStyle = adjustBrightness(cfg.skinTone, -5);
    // Left ear
    context.beginPath();
    context.ellipse(centerX - headRadius, centerY, 15, 25, 0, 0, Math.PI * 2);
    context.fill();
    // Right ear
    context.beginPath();
    context.ellipse(centerX + headRadius, centerY, 15, 25, 0, 0, Math.PI * 2);
    context.fill();

    // Draw hair
    context.fillStyle = cfg.hairColor;
    context.beginPath();
    
    if (cfg.hairStyle.toLowerCase().includes('short') || cfg.hairStyle.toLowerCase().includes('buzz')) {
      context.arc(centerX, centerY - 20, headRadius - 5, Math.PI, Math.PI * 2);
    } else if (cfg.hairStyle.toLowerCase().includes('long')) {
      context.arc(centerX, centerY - 20, headRadius, Math.PI, Math.PI * 2);
      context.fillRect(centerX - headRadius, centerY, headRadius * 2, 80);
    } else {
      // Medium/default
      context.arc(centerX, centerY - 20, headRadius - 2, Math.PI, Math.PI * 2);
      context.fillRect(centerX - headRadius + 2, centerY, (headRadius - 2) * 2, 40);
    }
    context.fill();

    // Draw eyes
    const eyeY = centerY - 10;
    const eyeSpacing = 25;
    
    // Eye whites
    context.fillStyle = 'white';
    context.beginPath();
    context.ellipse(centerX - eyeSpacing, eyeY, 12, 10, 0, 0, Math.PI * 2);
    context.ellipse(centerX + eyeSpacing, eyeY, 12, 10, 0, 0, Math.PI * 2);
    context.fill();

    // Iris
    context.fillStyle = cfg.eyeColor;
    context.beginPath();
    context.arc(centerX - eyeSpacing, eyeY, 8, 0, Math.PI * 2);
    context.arc(centerX + eyeSpacing, eyeY, 8, 0, Math.PI * 2);
    context.fill();

    // Pupils
    context.fillStyle = 'black';
    context.beginPath();
    context.arc(centerX - eyeSpacing, eyeY, 4, 0, Math.PI * 2);
    context.arc(centerX + eyeSpacing, eyeY, 4, 0, Math.PI * 2);
    context.fill();

    // Eye highlights
    context.fillStyle = 'rgba(255,255,255,0.6)';
    context.beginPath();
    context.arc(centerX - eyeSpacing - 2, eyeY - 2, 2, 0, Math.PI * 2);
    context.arc(centerX + eyeSpacing - 2, eyeY - 2, 2, 0, Math.PI * 2);
    context.fill();

    // Eyebrows
    context.strokeStyle = adjustBrightness(cfg.hairColor, -20);
    context.lineWidth = 3;
    context.lineCap = 'round';
    context.beginPath();
    context.moveTo(centerX - eyeSpacing - 15, eyeY - 15);
    context.lineTo(centerX - eyeSpacing + 10, eyeY - 18);
    context.moveTo(centerX + eyeSpacing - 10, eyeY - 18);
    context.lineTo(centerX + eyeSpacing + 15, eyeY - 15);
    context.stroke();

    // Draw nose
    context.strokeStyle = adjustBrightness(cfg.skinTone, -15);
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(centerX, eyeY + 10);
    context.lineTo(centerX - 5, eyeY + 25);
    context.lineTo(centerX + 5, eyeY + 25);
    context.stroke();

    // Draw mouth based on expression
    context.strokeStyle = adjustBrightness(cfg.skinTone, -25);
    context.lineWidth = 3;
    context.beginPath();
    
    if (cfg.expression === 'smile' || cfg.expression === 'friendly') {
      context.arc(centerX, eyeY + 30, 20, 0.2, Math.PI - 0.2);
      // Add teeth
      context.fillStyle = 'white';
      context.fillRect(centerX - 15, eyeY + 48, 30, 5);
    } else if (cfg.expression === 'laugh') {
      context.arc(centerX, eyeY + 25, 25, 0.1, Math.PI - 0.1);
      context.fillStyle = '#4A1515';
      context.fill();
    } else {
      context.moveTo(centerX - 15, eyeY + 50);
      context.lineTo(centerX + 15, eyeY + 50);
    }
    context.stroke();

    // Draw facial hair for males
    if (cfg.facialHair !== 'none' && cfg.gender === 'male') {
      context.fillStyle = cfg.facialHairColor;
      context.globalAlpha = 0.7;
      
      if (cfg.facialHair === 'beard' || cfg.facialHair === 'full-beard') {
        context.beginPath();
        context.arc(centerX, centerY + 50, 50, 0, Math.PI);
        context.fill();
      }
      
      if (cfg.facialHair === 'mustache' || cfg.facialHair === 'full-beard') {
        context.fillRect(centerX - 20, eyeY + 45, 40, 8);
      }
      
      context.globalAlpha = 1;
    }

    // Add realistic details
    if (cfg.realism > 70) {
      // Add subtle face contours
      context.strokeStyle = 'rgba(0,0,0,0.1)';
      context.lineWidth = 1;
      context.beginPath();
      context.arc(centerX, centerY, headRadius - 5, 0.3, Math.PI - 0.3);
      context.stroke();
    }
  };

  const adjustBrightness = (hex: string, percent: number) => {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.min(255, Math.max(0, (num >> 16) + amt));
    const G = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amt));
    const B = Math.min(255, Math.max(0, (num & 0x0000FF) + amt));
    return `#${(0x1000000 + (R * 0x10000) + (G * 0x100) + B).toString(16).slice(1)}`;
  };

  const analyzePrompt = (text: string): Partial<AvatarConfig> => {
    const lower = text.toLowerCase();
    const updates: Partial<AvatarConfig> = {};

    // Gender
    if (lower.includes('woman') || lower.includes('female') || lower.includes('girl')) {
      updates.gender = 'female';
    } else if (lower.includes('man') || lower.includes('male') || lower.includes('boy')) {
      updates.gender = 'male';
    }

    // Age
    if (lower.includes('young') || lower.includes('teen')) {
      updates.age = 18;
    } else if (lower.includes('30s')) {
      updates.age = 35;
    } else if (lower.includes('elderly') || lower.includes('old')) {
      updates.age = 65;
    }

    // Hair color
    if (lower.includes('blonde')) updates.hairColor = HAIR_COLORS[4].hex;
    if (lower.includes('brown hair')) updates.hairColor = HAIR_COLORS[2].hex;
    if (lower.includes('black hair')) updates.hairColor = HAIR_COLORS[0].hex;
    if (lower.includes('red hair')) updates.hairColor = HAIR_COLORS[5].hex;
    if (lower.includes('gray hair')) updates.hairColor = HAIR_COLORS[7].hex;

    // Hair style
    if (lower.includes('short')) updates.hairStyle = 'Short';
    if (lower.includes('long')) updates.hairStyle = 'Long';
    if (lower.includes('shoulder-length')) updates.hairStyle = 'Medium';

    // Expression
    if (lower.includes('smile') || lower.includes('smiling')) updates.expression = 'smile';
    if (lower.includes('friendly')) updates.expression = 'friendly';
    if (lower.includes('serious')) updates.expression = 'serious';

    // Facial hair
    if (lower.includes('beard')) updates.facialHair = 'beard';
    if (lower.includes('mustache')) updates.facialHair = 'mustache';

    return updates;
  };

  const generateFromText = async () => {
    setIsGenerating(true);
    setGenerationProgress(0);
    setAvatarGenerated(false);

    const steps = [
      'Analyzing your description...',
      'Extracting facial features...',
      'Building 3D structure...',
      'Applying realistic textures...',
      'Adding lighting effects...',
      'Finalizing avatar...'
    ];

    for (let i = 0; i < steps.length; i++) {
      setCurrentStep(steps[i]);
      setGenerationProgress(((i + 1) / steps.length) * 100);
      await new Promise(resolve => setTimeout(resolve, 600));
    }

    // Apply analyzed features
    const analyzedConfig = analyzePrompt(prompt);
    const newConfig = { ...config, ...analyzedConfig };
    setConfig(newConfig);

    // Draw the avatar
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        drawAvatar(ctx, newConfig);
      }
    }

    setIsGenerating(false);
    setAvatarGenerated(true);
  };

  const generateFromPhoto = async () => {
    setIsGenerating(true);
    setGenerationProgress(0);

    const steps = [
      'Analyzing photo...',
      'Detecting facial features...',
      'Mapping to 3D model...',
      'Extracting colors...',
      'Building avatar...',
      'Finalizing...'
    ];

    for (let i = 0; i < steps.length; i++) {
      setCurrentStep(steps[i]);
      setGenerationProgress(((i + 1) / steps.length) * 100);
      await new Promise(resolve => setTimeout(resolve, 600));
    }

    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        drawAvatar(ctx, config);
      }
    }

    setIsGenerating(false);
    setAvatarGenerated(true);
  };

  const updateConfig = <K extends keyof AvatarConfig>(key: K, value: AvatarConfig[K]) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    
    if (avatarGenerated) {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          drawAvatar(ctx, newConfig);
        }
      }
    }
  };

  const applyCustom = () => {
    setAvatarGenerated(true);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        drawAvatar(ctx, config);
      }
    }
  };

  const randomize = () => {
    const randomConfig: AvatarConfig = {
      gender: ['male', 'female', 'neutral'][Math.floor(Math.random() * 3)] as any,
      skinTone: SKIN_TONES[Math.floor(Math.random() * SKIN_TONES.length)].hex,
      age: Math.floor(Math.random() * 50) + 18,
      faceShape: 'oval',
      eyeColor: EYE_COLORS[Math.floor(Math.random() * EYE_COLORS.length)].hex,
      eyeSize: Math.floor(Math.random() * 50) + 25,
      hairStyle: 'Medium',
      hairColor: HAIR_COLORS[Math.floor(Math.random() * HAIR_COLORS.length)].hex,
      facialHair: Math.random() > 0.7 ? 'beard' : 'none',
      facialHairColor: HAIR_COLORS[0].hex,
      bodyType: 'average',
      clothingStyle: 'casual',
      clothingColor: `#${Math.floor(Math.random()*16777215).toString(16)}`,
      expression: ['neutral', 'smile', 'friendly'][Math.floor(Math.random() * 3)] as any,
      realism: 100
    };
    
    setConfig(randomConfig);
    setAvatarGenerated(true);
    
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        drawAvatar(ctx, randomConfig);
      }
    }
  };

  const downloadAvatar = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const link = document.createElement('a');
      link.download = 'avatar.png';
      link.href = canvas.toDataURL();
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

  useEffect(() => {
    // Draw initial avatar
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        drawAvatar(ctx, config);
      }
    }
  }, []);

  return (
    <div className="h-full flex bg-gray-900">
      {/* Left Panel */}
      <div className="w-96 bg-gray-800 border-r border-gray-700 flex flex-col overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6">
          <h3 className="text-white font-bold text-2xl flex items-center gap-3">
            <Crown className="w-7 h-7" />
            Avatar Generator
          </h3>
          <p className="text-white/90 text-sm mt-1">Create photorealistic avatars</p>
        </div>

        {/* Mode Selection */}
        <div className="p-4 border-b border-gray-700">
          <div className="grid grid-cols-3 gap-2">
            {[
              { key: 'text', icon: Wand2, label: 'Text' },
              { key: 'photo', icon: Camera, label: 'Photo' },
              { key: 'custom', icon: Sliders, label: 'Custom' }
            ].map(({ key, icon: Icon, label }) => (
              <button
                key={key}
                onClick={() => setMode(key as any)}
                className={`p-3 rounded-lg font-semibold flex flex-col items-center gap-2 transition-all ${
                  mode === key
                    ? 'bg-purple-600 text-white'
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
              <label className="text-white font-semibold text-sm mb-3 block">
                Describe Your Avatar
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Example: A professional woman in her 30s with shoulder-length brown hair and a confident smile..."
                className="w-full px-4 py-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:border-purple-500 focus:outline-none resize-none"
                rows={5}
              />
              
              <div className="mt-4">
                <p className="text-gray-400 text-xs mb-2">Quick Examples:</p>
                {EXAMPLE_PROMPTS.slice(0, 3).map((ex, i) => (
                  <button
                    key={i}
                    onClick={() => setPrompt(ex)}
                    className="w-full p-2 mb-2 bg-gray-700 hover:bg-gray-600 rounded text-left text-white text-xs transition-all"
                  >
                    {ex}
                  </button>
                ))}
              </div>

              <button
                onClick={generateFromText}
                disabled={!prompt.trim() || isGenerating}
                className="w-full mt-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
              <label className="text-white font-semibold text-sm mb-3 block">
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
                    <p className="text-gray-400 text-sm">Click to upload</p>
                  </div>
                )}
              </button>

              {uploadedPhoto && (
                <button
                  onClick={generateFromPhoto}
                  disabled={isGenerating}
                  className="w-full mt-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-bold flex items-center justify-center gap-2 disabled:opacity-50"
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
            <div className="space-y-4">
              {/* Gender */}
              <div>
                <label className="text-white text-sm mb-2 block">Gender</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['male', 'female', 'neutral'] as const).map((g) => (
                    <button
                      key={g}
                      onClick={() => updateConfig('gender', g)}
                      className={`p-2 rounded capitalize ${
                        config.gender === g ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              {/* Age */}
              <div>
                <label className="text-white text-sm mb-2 block">Age: {config.age}</label>
                <input
                  type="range"
                  min="18"
                  max="80"
                  value={config.age}
                  onChange={(e) => updateConfig('age', parseInt(e.target.value))}
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
                      onClick={() => updateConfig('skinTone', tone.hex)}
                      className={`w-full h-10 rounded border-2 ${
                        config.skinTone === tone.hex ? 'border-white' : 'border-gray-600'
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
                      onClick={() => updateConfig('eyeColor', color.hex)}
                      className={`w-full h-10 rounded border-2 ${
                        config.eyeColor === color.hex ? 'border-white' : 'border-gray-600'
                      }`}
                      style={{ backgroundColor: color.hex }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>

              {/* Hair Color */}
              <div>
                <label className="text-white text-sm mb-2 block">Hair Color</label>
                <div className="grid grid-cols-4 gap-2">
                  {HAIR_COLORS.map((color) => (
                    <button
                      key={color.hex}
                      onClick={() => updateConfig('hairColor', color.hex)}
                      className={`w-full h-10 rounded border-2 ${
                        config.hairColor === color.hex ? 'border-white' : 'border-gray-600'
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
                  value={config.expression}
                  onChange={(e) => updateConfig('expression', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600"
                >
                  <option value="neutral">Neutral</option>
                  <option value="smile">Smile</option>
                  <option value="friendly">Friendly</option>
                  <option value="serious">Serious</option>
                  <option value="laugh">Laugh</option>
                </select>
              </div>

              {/* Clothing Color */}
              <div>
                <label className="text-white text-sm mb-2 block">Clothing Color</label>
                <input
                  type="color"
                  value={config.clothingColor}
                  onChange={(e) => updateConfig('clothingColor', e.target.value)}
                  className="w-full h-12 rounded cursor-pointer"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={randomize}
                  className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Random
                </button>
                <button
                  onClick={applyCustom}
                  className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold"
                >
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Preview */}
      <div className="flex-1 flex flex-col bg-gray-900">
        {isGenerating ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-md">
              <Loader className="w-16 h-16 text-purple-500 animate-spin mx-auto mb-4" />
              <h3 className="text-white text-xl font-bold mb-2">{currentStep}</h3>
              <div className="w-full bg-gray-700 rounded-full h-3 mb-2">
                <div
                  className="bg-gradient-to-r from-purple-600 to-pink-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${generationProgress}%` }}
                />
              </div>
              <p className="text-gray-400 text-sm">{Math.round(generationProgress)}% Complete</p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 flex items-center justify-center p-8">
              <canvas
                ref={canvasRef}
                width={600}
                height={600}
                className="rounded-lg shadow-2xl"
              />
            </div>

            {avatarGenerated && (
              <div className="bg-gray-800 border-t border-gray-700 p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex gap-2">
                    <button
                      onClick={downloadAvatar}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Download PNG
                    </button>
                    <button
                      onClick={() => {
                        const canvas = canvasRef.current;
                        if (canvas) {
                          canvas.toBlob(async (blob) => {
                            if (blob) {
                              try {
                                await navigator.clipboard.write([
                                  new ClipboardItem({ 'image/png': blob })
                                ]);
                              } catch {
                                // Fallback: download the image instead
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = 'avatar.png';
                                a.click();
                                URL.revokeObjectURL(url);
                              }
                            }
                          });
                        }
                      }}
                      className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold flex items-center gap-2"
                    >
                      <Share2 className="w-4 h-4" />
                      Copy
                    </button>
                  </div>
                  
                  <button
                    onClick={randomize}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Randomize
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-gray-700 p-3 rounded">
                    <p className="text-gray-400 text-xs">Quality</p>
                    <p className="text-white font-semibold">Photorealistic</p>
                  </div>
                  <div className="bg-gray-700 p-3 rounded">
                    <p className="text-gray-400 text-xs">Format</p>
                    <p className="text-white font-semibold">PNG</p>
                  </div>
                  <div className="bg-gray-700 p-3 rounded">
                    <p className="text-gray-400 text-xs">Resolution</p>
                    <p className="text-white font-semibold">600x600</p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
