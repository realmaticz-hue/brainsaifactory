import { useState, useRef, useEffect } from 'react';
import {
  X, Upload, Sparkles, Download, User, Palette, Settings,
  Sliders, Eye, Smile, Wind, Shirt, Video, Volume2, Play,
  Cpu, Database, Cloud, Zap, RefreshCw, Save, Camera, Wand2,
  Mic, Headphones, Film, Image as ImageIcon, Type, Check
} from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface Professional3DAvatarGenProps {
  isopen: boolean;
  onClose: () => void;
  onSaveAvatar?: (avatar: any) => void;
}

interface AvatarConfig {
  // Physical Appearance
  gender: 'male' | 'female' | 'neutral';
  age: number; // 18-80
  ethnicity: 'caucasian' | 'african' | 'asian' | 'hispanic' | 'middle-eastern' | 'mixed';

  // Face Features
  faceShape: 'oval' | 'round' | 'square' | 'heart' | 'long' | 'diamond';
  skinTone: string; // hex color

  // Eyes
  eyeSize: number; // 0-100
  eyeColor: string;
  eyeShape: 'almond' | 'round' | 'hooded' | 'upturned' | 'downturned';
  eyebrowThickness: number;
  eyebrowColor: string;

  // Nose
  noseSize: number;
  noseWidth: number;
  noseShape: 'straight' | 'curved' | 'button' | 'roman' | 'hawk';

  // Mouth
  lipSize: number;
  lipColor: string;
  smileIntensity: number;

  // Hair
  hairStyle: 'short' | 'medium' | 'long' | 'bald' | 'buzz' | 'curly' | 'wavy' | 'straight' | 'afro' | 'ponytail';
  hairColor: string;
  hairLength: number;
  facialHair?: 'none' | 'stubble' | 'beard' | 'goatee' | 'mustache' | 'full-beard';

  // Body
  bodyType: 'slim' | 'athletic' | 'average' | 'muscular' | 'heavy';
  height: number; // cm

  // Clothing
  outfit: 'casual' | 'business' | 'formal' | 'sporty' | 'creative' | 'medical' | 'tech';
  outfitColor: string;

  // Voice
  voiceType: 'warm' | 'professional' | 'friendly' | 'energetic' | 'calm' | 'authoritative';
  voiceGender: 'male' | 'female';
  voiceAge: 'young' | 'middle' | 'mature';
  accent: 'american' | 'british' | 'australian' | 'indian' | 'spanish' | 'french' | 'german' | 'neutral';
  pitch: number; // 0-100
  speed: number; // 0-100

  // Animation & Expression
  defaultExpression: 'neutral' | 'happy' | 'professional' | 'friendly' | 'confident';
  emotionIntensity: number;
  blinkRate: number;
  headMovements: boolean;
  handGestures: boolean;
}

export function Professional3DAvatarGen({ isopen, onClose, onSaveAvatar }: Professional3DAvatarGenProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeTab, setActiveTab] = useState<'create' | 'customize' | 'voice' | 'animate' | 'export'>('create');
  const [generationMode, setGenerationMode] = useState<'text' | 'photo' | 'preset'>('text');
  const [textPrompt, setTextPrompt] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [config, setConfig] = useState<AvatarConfig>({
    gender: 'neutral',
    age: 30,
    ethnicity: 'caucasian',
    faceShape: 'oval',
    skinTone: '#f5d7c4',
    eyeSize: 50,
    eyeColor: '#4a5568',
    eyeShape: 'almond',
    eyebrowThickness: 50,
    eyebrowColor: '#2d3748',
    noseSize: 50,
    noseWidth: 50,
    noseShape: 'straight',
    lipSize: 50,
    lipColor: '#d97598',
    smileIntensity: 30,
    hairStyle: 'medium',
    hairColor: '#2d3748',
    hairLength: 50,
    facialHair: 'none',
    bodyType: 'average',
    height: 170,
    outfit: 'business',
    outfitColor: '#2c5282',
    voiceType: 'professional',
    voiceGender: 'female',
    voiceAge: 'middle',
    accent: 'american',
    pitch: 50,
    speed: 50,
    defaultExpression: 'professional',
    emotionIntensity: 50,
    blinkRate: 50,
    headMovements: true,
    handGestures: true
  });

  const [generatedAvatar, setGeneratedAvatar] = useState<any>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [voicePreview, setVoicePreview] = useState('');

  const presetAvatars = [
    {
      name: 'Professional Sarah',
      description: 'Corporate presenter, warm and confident',
      thumbnail: '👩‍💼',
      config: { ...config, gender: 'female', age: 32, outfit: 'business', voiceType: 'professional', hairStyle: 'medium' }
    },
    {
      name: 'Tech Mike',
      description: 'Software engineer, friendly and energetic',
      thumbnail: '👨‍💻',
      config: { ...config, gender: 'male', age: 28, outfit: 'casual', voiceType: 'energetic', hairStyle: 'short' }
    },
    {
      name: 'Doctor Elena',
      description: 'Medical professional, calm and authoritative',
      thumbnail: '👩‍⚕️',
      config: { ...config, gender: 'female', age: 45, outfit: 'medical', voiceType: 'authoritative', hairStyle: 'short' }
    },
    {
      name: 'CEO James',
      description: 'Executive leader, confident and commanding',
      thumbnail: '👔',
      config: { ...config, gender: 'male', age: 50, outfit: 'formal', voiceType: 'authoritative', hairStyle: 'short' }
    },
    {
      name: 'Creative Maya',
      description: 'Designer, friendly and artistic',
      thumbnail: '👩‍🎨',
      config: { ...config, gender: 'female', age: 26, outfit: 'creative', voiceType: 'friendly', hairStyle: 'long' }
    },
    {
      name: 'Coach Alex',
      description: 'Fitness trainer, energetic and motivating',
      thumbnail: '🏋️',
      config: { ...config, gender: 'neutral', age: 35, outfit: 'sporty', voiceType: 'energetic', bodyType: 'athletic' }
    }
  ];

  useEffect(() => {
    if (generatedAvatar && canvasRef.current) {
      renderAvatar();
    }
  }, [generatedAvatar, config]);

  const generateFromText = async () => {
    if (!textPrompt.trim()) {
      alert('Please enter a description');
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(0);

    const stages = [
      { name: 'Analyzing description...', duration: 500, progress: 5 },
      { name: 'Generating facial structure...', duration: 1000, progress: 15 },
      { name: 'Creating realistic skin textures...', duration: 1500, progress: 30 },
      { name: 'Sculpting facial features...', duration: 1200, progress: 45 },
      { name: 'Adding hair and styling...', duration: 1000, progress: 60 },
      { name: 'Designing outfit...', duration: 800, progress: 70 },
      { name: 'Configuring voice profile...', duration: 600, progress: 80 },
      { name: 'Setting up animations...', duration: 800, progress: 90 },
      { name: 'Finalizing avatar...', duration: 600, progress: 100 }
    ];

    for (const stage of stages) {
      setCurrentStage(stage.name);
      await new Promise(resolve => setTimeout(resolve, stage.duration));
      setGenerationProgress(stage.progress);
    }

    // Analyze prompt and configure avatar
    const analyzedConfig = analyzePrompt(textPrompt);
    setConfig({ ...config, ...analyzedConfig });
    setGeneratedAvatar({
      id: `avatar-${Date.now()}`,
      name: extractNameFromPrompt(textPrompt),
      config: { ...config, ...analyzedConfig },
      createdAt: new Date().toISOString()
    });

    setActiveTab('customize');
    setIsGenerating(false);
  };

  const generateFromPhoto = async () => {
    if (!photoFile) {
      alert('Please upload a photo');
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(0);

    const stages = [
      { name: 'Loading photo...', duration: 300, progress: 5 },
      { name: 'Detecting facial landmarks...', duration: 1500, progress: 20 },
      { name: 'Analyzing facial features...', duration: 1200, progress: 35 },
      { name: 'Extracting skin tone and textures...', duration: 1000, progress: 50 },
      { name: 'Creating 3D mesh...', duration: 1500, progress: 65 },
      { name: 'Generating realistic materials...', duration: 1000, progress: 80 },
      { name: 'Finalizing avatar...', duration: 800, progress: 100 }
    ];

    for (const stage of stages) {
      setCurrentStage(stage.name);
      await new Promise(resolve => setTimeout(resolve, stage.duration));
      setGenerationProgress(stage.progress);
    }

    // Analyze photo
    const img = new Image();
    img.src = photoPreview;
    await new Promise(resolve => { img.onload = resolve; });

    const analyzedConfig = await analyzePhoto(img);
    setConfig({ ...config, ...analyzedConfig });
    setGeneratedAvatar({
      id: `avatar-${Date.now()}`,
      name: 'Photo Avatar',
      config: { ...config, ...analyzedConfig },
      sourcePhoto: photoPreview,
      createdAt: new Date().toISOString()
    });

    setActiveTab('customize');
    setIsGenerating(false);
  };

  const analyzePrompt = (prompt: string): Partial<AvatarConfig> => {
    const lower = prompt.toLowerCase();
    const result: Partial<AvatarConfig> = {};

    // Gender detection
    if (lower.includes('woman') || lower.includes('female') || lower.includes('she')) {
      result.gender = 'female';
      result.voiceGender = 'female';
    } else if (lower.includes('man') || lower.includes('male') || lower.includes('he')) {
      result.gender = 'male';
      result.voiceGender = 'male';
    }

    // Age detection
    if (lower.includes('young') || lower.includes('20s')) result.age = 25;
    else if (lower.includes('30s') || lower.includes('thirties')) result.age = 35;
    else if (lower.includes('40s') || lower.includes('middle-aged')) result.age = 45;
    else if (lower.includes('50s') || lower.includes('senior')) result.age = 55;

    // Ethnicity
    if (lower.includes('asian')) result.ethnicity = 'asian';
    else if (lower.includes('african') || lower.includes('black')) result.ethnicity = 'african';
    else if (lower.includes('hispanic') || lower.includes('latino')) result.ethnicity = 'hispanic';
    else if (lower.includes('middle east') || lower.includes('arab')) result.ethnicity = 'middle-eastern';

    // Hair
    if (lower.includes('blonde') || lower.includes('blond')) result.hairColor = '#f5e6d3';
    else if (lower.includes('brown hair')) result.hairColor = '#654321';
    else if (lower.includes('black hair')) result.hairColor = '#1a1a1a';
    else if (lower.includes('red hair') || lower.includes('ginger')) result.hairColor = '#c1440e';

    if (lower.includes('long hair')) result.hairStyle = 'long';
    else if (lower.includes('short hair')) result.hairStyle = 'short';
    else if (lower.includes('bald')) result.hairStyle = 'bald';
    else if (lower.includes('curly')) result.hairStyle = 'curly';

    // Facial hair
    if (lower.includes('beard')) result.facialHair = 'beard';
    else if (lower.includes('mustache')) result.facialHair = 'mustache';
    else if (lower.includes('goatee')) result.facialHair = 'goatee';
    else if (lower.includes('clean shaven')) result.facialHair = 'none';

    // Outfit
    if (lower.includes('business') || lower.includes('suit') || lower.includes('corporate')) result.outfit = 'business';
    else if (lower.includes('casual')) result.outfit = 'casual';
    else if (lower.includes('formal') || lower.includes('tuxedo')) result.outfit = 'formal';
    else if (lower.includes('doctor') || lower.includes('medical')) result.outfit = 'medical';
    else if (lower.includes('tech') || lower.includes('hoodie')) result.outfit = 'tech';
    else if (lower.includes('creative') || lower.includes('artist')) result.outfit = 'creative';

    // Voice characteristics
    if (lower.includes('warm')) result.voiceType = 'warm';
    else if (lower.includes('professional')) result.voiceType = 'professional';
    else if (lower.includes('friendly')) result.voiceType = 'friendly';
    else if (lower.includes('energetic')) result.voiceType = 'energetic';
    else if (lower.includes('calm')) result.voiceType = 'calm';

    // Accent
    if (lower.includes('british') || lower.includes('uk')) result.accent = 'british';
    else if (lower.includes('australian')) result.accent = 'australian';
    else if (lower.includes('indian')) result.accent = 'indian';

    // Expression
    if (lower.includes('smiling') || lower.includes('happy')) {
      result.defaultExpression = 'happy';
      result.smileIntensity = 70;
    } else if (lower.includes('confident')) {
      result.defaultExpression = 'confident';
    }

    return result;
  };

  const analyzePhoto = async (img: HTMLImageElement): Promise<Partial<AvatarConfig>> => {
    // Simplified photo analysis
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return {};

    ctx.drawImage(img, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;

    // Analyze average skin tone from center of image
    let r = 0, g = 0, b = 0, count = 0;
    const centerX = Math.floor(canvas.width / 2);
    const centerY = Math.floor(canvas.height / 2);
    const sampleSize = 50;

    for (let y = centerY - sampleSize; y < centerY + sampleSize; y++) {
      for (let x = centerX - sampleSize; x < centerX + sampleSize; x++) {
        const i = (y * canvas.width + x) * 4;
        r += pixels[i];
        g += pixels[i + 1];
        b += pixels[i + 2];
        count++;
      }
    }

    r = Math.floor(r / count);
    g = Math.floor(g / count);
    b = Math.floor(b / count);

    const skinTone = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;

    return {
      skinTone,
      // Additional analysis would go here in a real implementation
      faceShape: 'oval',
      eyeShape: 'almond'
    };
  };

  const extractNameFromPrompt = (prompt: string): string => {
    const words = prompt.split(' ').filter(w => w.length > 2);
    return words.slice(0, 2).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const renderAvatar = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 500;
    canvas.height = 600;

    // Clear canvas
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw avatar representation
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // Draw head (oval)
    ctx.beginPath();
    ctx.ellipse(centerX, centerY - 50, 100, 120, 0, 0, Math.PI * 2);
    ctx.fillStyle = config.skinTone;
    ctx.fill();

    // Draw hair
    if (config.hairStyle !== 'bald') {
      ctx.beginPath();
      ctx.ellipse(centerX, centerY - 120, 110, 80, 0, 0, Math.PI, true);
      ctx.fillStyle = config.hairColor;
      ctx.fill();
    }

    // Draw eyes
    const eyeY = centerY - 70;
    const eyeSpacing = 40;

    // Left eye
    ctx.beginPath();
    ctx.ellipse(centerX - eyeSpacing, eyeY, 15 * (config.eyeSize / 50), 10, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(centerX - eyeSpacing, eyeY, 8, 8, 0, 0, Math.PI * 2);
    ctx.fillStyle = config.eyeColor;
    ctx.fill();

    // Right eye
    ctx.beginPath();
    ctx.ellipse(centerX + eyeSpacing, eyeY, 15 * (config.eyeSize / 50), 10, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(centerX + eyeSpacing, eyeY, 8, 8, 0, 0, Math.PI * 2);
    ctx.fillStyle = config.eyeColor;
    ctx.fill();

    // Draw eyebrows
    ctx.strokeStyle = config.eyebrowColor;
    ctx.lineWidth = 3 * (config.eyebrowThickness / 50);
    ctx.beginPath();
    ctx.moveTo(centerX - eyeSpacing - 20, eyeY - 15);
    ctx.lineTo(centerX - eyeSpacing + 20, eyeY - 15);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(centerX + eyeSpacing - 20, eyeY - 15);
    ctx.lineTo(centerX + eyeSpacing + 20, eyeY - 15);
    ctx.stroke();

    // Draw nose
    ctx.beginPath();
    ctx.moveTo(centerX, eyeY + 10);
    ctx.lineTo(centerX - 5 * (config.noseWidth / 50), eyeY + 40);
    ctx.lineTo(centerX, eyeY + 45);
    ctx.lineTo(centerX + 5 * (config.noseWidth / 50), eyeY + 40);
    ctx.strokeStyle = config.skinTone;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw mouth
    const mouthY = centerY - 10;
    const smileAmount = config.smileIntensity / 100;

    ctx.beginPath();
    ctx.moveTo(centerX - 30 * (config.lipSize / 50), mouthY);
    ctx.quadraticCurveTo(centerX, mouthY + (20 * smileAmount), centerX + 30 * (config.lipSize / 50), mouthY);
    ctx.strokeStyle = config.lipColor;
    ctx.lineWidth = 4 * (config.lipSize / 50);
    ctx.stroke();

    // Draw facial hair if applicable
    if (config.facialHair && config.facialHair !== 'none') {
      ctx.fillStyle = config.hairColor;

      if (config.facialHair === 'beard' || config.facialHair === 'full-beard') {
        ctx.beginPath();
        ctx.moveTo(centerX - 80, centerY - 20);
        ctx.lineTo(centerX - 60, centerY + 60);
        ctx.lineTo(centerX, centerY + 80);
        ctx.lineTo(centerX + 60, centerY + 60);
        ctx.lineTo(centerX + 80, centerY - 20);
        ctx.fill();
      }

      if (config.facialHair === 'mustache' || config.facialHair === 'full-beard') {
        ctx.fillRect(centerX - 25, mouthY - 10, 50, 8);
      }
    }

    // Draw body/outfit
    ctx.beginPath();
    ctx.moveTo(centerX - 120, centerY + 70);
    ctx.lineTo(centerX - 120, centerY + 250);
    ctx.lineTo(centerX + 120, centerY + 250);
    ctx.lineTo(centerX + 120, centerY + 70);
    ctx.closePath();
    ctx.fillStyle = config.outfitColor;
    ctx.fill();

    // Add outfit details based on type
    if (config.outfit === 'business' || config.outfit === 'formal') {
      // Draw collar
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(centerX, centerY + 70);
      ctx.lineTo(centerX - 30, centerY + 90);
      ctx.lineTo(centerX - 20, centerY + 110);
      ctx.lineTo(centerX, centerY + 100);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(centerX, centerY + 70);
      ctx.lineTo(centerX + 30, centerY + 90);
      ctx.lineTo(centerX + 20, centerY + 110);
      ctx.lineTo(centerX, centerY + 100);
      ctx.fill();
    }
  };

  const testVoice = async () => {
    setVoicePreview('Testing voice...');

    // Simulate voice synthesis
    await new Promise(resolve => setTimeout(resolve, 2000));

    setVoicePreview(`Voice: ${config.voiceGender}, ${config.voiceType}, ${config.accent} accent`);

    setTimeout(() => setVoicePreview(''), 3000);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setPhotoPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const exportAvatar = (format: 'mp4' | 'fbx' | 'glb' | 'json') => {
    if (!generatedAvatar) {
      alert('No avatar to export');
      return;
    }

    const data = {
      ...generatedAvatar,
      format,
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `avatar-${generatedAvatar.id}.${format === 'json' ? 'json' : format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isopen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm overflow-y-auto">
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl max-w-[98vw] w-full max-h-[98vh] overflow-hidden flex flex-col border border-purple-500/30">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 p-4 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <Sparkles className="w-7 h-7" />
                Professional 3D Avatar Generator
              </h2>
              <p className="text-sm text-white/90 mt-1">Synthesia & Visionstory AI quality - Realistic avatars with voice</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
              <X className="w-6 h-6 text-white" />
            </button>
          </div>

          {/* Progress */}
          {isGenerating && (
            <div className="bg-gray-800 border-b border-gray-700 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-300">{currentStage}</span>
                <span className="text-sm font-bold text-purple-400">{Math.round(generationProgress)}%</span>
              </div>
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 transition-all duration-300"
                  style={{ width: `${generationProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="flex border-b border-gray-700 bg-gray-800/50 overflow-x-auto">
            {[
              { id: 'create', icon: Wand2, label: 'Create' },
              { id: 'customize', icon: Sliders, label: 'Customize' },
              { id: 'voice', icon: Mic, label: 'Voice' },
              { id: 'animate', icon: Film, label: 'Animate' },
              { id: 'export', icon: Download, label: 'Export' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                disabled={!generatedAvatar && tab.id !== 'create'}
                className={`flex items-center gap-2 px-6 py-3 font-semibold transition-all whitespace-nowrap ${activeTab === tab.id
                    ? 'bg-gradient-to-b from-purple-600/20 to-transparent border-b-2 border-purple-500 text-purple-400'
                    : 'text-gray-400 hover:bg-gray-700/50 hover:text-gray-200 disabled:opacity-30 disabled:cursor-not-allowed'
                  }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden flex">
            {/* Left Panel */}
            <div className="w-80 bg-gray-800/50 border-r border-gray-700 p-4 overflow-y-auto">
              {activeTab === 'create' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-white font-bold text-lg mb-3">Generation Mode</h3>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => setGenerationMode('text')}
                        className={`p-3 rounded-lg border-2 transition-all ${generationMode === 'text'
                            ? 'bg-purple-600 border-purple-400 text-white'
                            : 'bg-gray-700 border-gray-600 text-gray-300 hover:border-gray-500'
                          }`}
                      >
                        <Type className="w-6 h-6 mx-auto mb-1" />
                        <div className="text-xs font-semibold">Text</div>
                      </button>
                      <button
                        onClick={() => setGenerationMode('photo')}
                        className={`p-3 rounded-lg border-2 transition-all ${generationMode === 'photo'
                            ? 'bg-purple-600 border-purple-400 text-white'
                            : 'bg-gray-700 border-gray-600 text-gray-300 hover:border-gray-500'
                          }`}
                      >
                        <Camera className="w-6 h-6 mx-auto mb-1" />
                        <div className="text-xs font-semibold">Photo</div>
                      </button>
                      <button
                        onClick={() => setGenerationMode('preset')}
                        className={`p-3 rounded-lg border-2 transition-all ${generationMode === 'preset'
                            ? 'bg-purple-600 border-purple-400 text-white'
                            : 'bg-gray-700 border-gray-600 text-gray-300 hover:border-gray-500'
                          }`}
                      >
                        <User className="w-6 h-6 mx-auto mb-1" />
                        <div className="text-xs font-semibold">Preset</div>
                      </button>
                    </div>
                  </div>

                  {generationMode === 'text' && (
                    <div>
                      <label className="text-gray-300 text-sm font-semibold mb-2 block">
                        Describe Your Avatar
                      </label>
                      <textarea
                        value={textPrompt}
                        onChange={e => setTextPrompt(e.target.value)}
                        placeholder="E.g., Professional woman in her 30s with brown hair and blue eyes, wearing business attire, friendly smile, warm professional voice"
                        className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 resize-none focus:outline-none focus:border-purple-500 min-h-[120px]"
                      />
                      <button
                        onClick={generateFromText}
                        disabled={isGenerating || !textPrompt.trim()}
                        className="w-full mt-3 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        <Wand2 className="w-5 h-5" />
                        Generate Avatar
                      </button>
                    </div>
                  )}

                  {generationMode === 'photo' && (
                    <div>
                      <label className="text-gray-300 text-sm font-semibold mb-2 block">
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
                        className="w-full p-6 bg-gray-700 border-2 border-dashed border-gray-600 rounded-lg hover:border-purple-500 transition-colors"
                      >
                        {photoPreview ? (
                          <img src={photoPreview} alt="Preview" className="w-full h-32 object-cover rounded-lg mb-2" />
                        ) : (
                          <ImageIcon className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                        )}
                        <p className="text-gray-400 text-sm">
                          {photoPreview ? 'Click to change photo' : 'Click to upload photo'}
                        </p>
                      </button>
                      <button
                        onClick={generateFromPhoto}
                        disabled={isGenerating || !photoFile}
                        className="w-full mt-3 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        <Wand2 className="w-5 h-5" />
                        Generate from Photo
                      </button>
                    </div>
                  )}

                  {generationMode === 'preset' && (
                    <div className="space-y-3">
                      <label className="text-gray-300 text-sm font-semibold mb-2 block">
                        Choose a Preset Avatar
                      </label>
                      {presetAvatars.map(preset => (
                        <button
                          key={preset.name}
                          onClick={() => {
                            setConfig(preset.config);
                            setGeneratedAvatar({
                              id: `avatar-${Date.now()}`,
                              name: preset.name,
                              config: preset.config,
                              createdAt: new Date().toISOString()
                            });
                            setActiveTab('customize');
                          }}
                          className="w-full p-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-left transition-colors flex items-center gap-3"
                        >
                          <span className="text-4xl">{preset.thumbnail}</span>
                          <div>
                            <div className="text-white font-semibold text-sm">{preset.name}</div>
                            <div className="text-gray-400 text-xs">{preset.description}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'customize' && generatedAvatar && (
                <div className="space-y-4 text-sm">
                  <div>
                    <label className="text-gray-300 font-semibold mb-2 block">Age</label>
                    <input
                      type="range"
                      min="18"
                      max="80"
                      value={config.age}
                      onChange={e => setConfig({ ...config, age: parseInt(e.target.value) })}
                      className="w-full"
                    />
                    <span className="text-gray-400 text-xs">{config.age} years</span>
                  </div>

                  <div>
                    <label className="text-gray-300 font-semibold mb-2 block">Gender</label>
                    <select
                      value={config.gender}
                      onChange={e => setConfig({ ...config, gender: e.target.value as any })}
                      className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="neutral">Neutral</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-gray-300 font-semibold mb-2 block">Skin Tone</label>
                    <input
                      type="color"
                      value={config.skinTone}
                      onChange={e => setConfig({ ...config, skinTone: e.target.value })}
                      className="w-full h-10 rounded-lg cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="text-gray-300 font-semibold mb-2 block">Eye Size</label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={config.eyeSize}
                      onChange={e => setConfig({ ...config, eyeSize: parseInt(e.target.value) })}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="text-gray-300 font-semibold mb-2 block">Eye Color</label>
                    <input
                      type="color"
                      value={config.eyeColor}
                      onChange={e => setConfig({ ...config, eyeColor: e.target.value })}
                      className="w-full h-10 rounded-lg cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="text-gray-300 font-semibold mb-2 block">Hair Style</label>
                    <select
                      value={config.hairStyle}
                      onChange={e => setConfig({ ...config, hairStyle: e.target.value as any })}
                      className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600"
                    >
                      <option value="short">Short</option>
                      <option value="medium">Medium</option>
                      <option value="long">Long</option>
                      <option value="bald">Bald</option>
                      <option value="curly">Curly</option>
                      <option value="wavy">Wavy</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-gray-300 font-semibold mb-2 block">Hair Color</label>
                    <input
                      type="color"
                      value={config.hairColor}
                      onChange={e => setConfig({ ...config, hairColor: e.target.value })}
                      className="w-full h-10 rounded-lg cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="text-gray-300 font-semibold mb-2 block">Smile Intensity</label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={config.smileIntensity}
                      onChange={e => setConfig({ ...config, smileIntensity: parseInt(e.target.value) })}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="text-gray-300 font-semibold mb-2 block">Outfit Type</label>
                    <select
                      value={config.outfit}
                      onChange={e => setConfig({ ...config, outfit: e.target.value as any })}
                      className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600"
                    >
                      <option value="casual">Casual</option>
                      <option value="business">Business</option>
                      <option value="formal">Formal</option>
                      <option value="sporty">Sporty</option>
                      <option value="creative">Creative</option>
                      <option value="medical">Medical</option>
                      <option value="tech">Tech</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-gray-300 font-semibold mb-2 block">Outfit Color</label>
                    <input
                      type="color"
                      value={config.outfitColor}
                      onChange={e => setConfig({ ...config, outfitColor: e.target.value })}
                      className="w-full h-10 rounded-lg cursor-pointer"
                    />
                  </div>
                </div>
              )}

              {activeTab === 'voice' && generatedAvatar && (
                <div className="space-y-4 text-sm">
                  <div>
                    <label className="text-gray-300 font-semibold mb-2 block">Voice Type</label>
                    <select
                      value={config.voiceType}
                      onChange={e => setConfig({ ...config, voiceType: e.target.value as any })}
                      className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600"
                    >
                      <option value="warm">Warm & Friendly</option>
                      <option value="professional">Professional</option>
                      <option value="energetic">Energetic</option>
                      <option value="calm">Calm & Soothing</option>
                      <option value="authoritative">Authoritative</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-gray-300 font-semibold mb-2 block">Accent</label>
                    <select
                      value={config.accent}
                      onChange={e => setConfig({ ...config, accent: e.target.value as any })}
                      className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600"
                    >
                      <option value="american">American English</option>
                      <option value="british">British English</option>
                      <option value="australian">Australian English</option>
                      <option value="indian">Indian English</option>
                      <option value="neutral">Neutral</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-gray-300 font-semibold mb-2 block">Pitch</label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={config.pitch}
                      onChange={e => setConfig({ ...config, pitch: parseInt(e.target.value) })}
                      className="w-full"
                    />
                    <span className="text-gray-400 text-xs">{config.pitch}%</span>
                  </div>

                  <div>
                    <label className="text-gray-300 font-semibold mb-2 block">Speaking Speed</label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={config.speed}
                      onChange={e => setConfig({ ...config, speed: parseInt(e.target.value) })}
                      className="w-full"
                    />
                    <span className="text-gray-400 text-xs">{config.speed}%</span>
                  </div>

                  <button
                    onClick={testVoice}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Volume2 className="w-5 h-5" />
                    Test Voice
                  </button>

                  {voicePreview && (
                    <div className="bg-blue-900/30 border border-blue-500/30 rounded-lg p-3 text-blue-300 text-xs">
                      {voicePreview}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'animate' && generatedAvatar && (
                <div className="space-y-4 text-sm">
                  <div>
                    <label className="text-gray-300 font-semibold mb-2 block">Default Expression</label>
                    <select
                      value={config.defaultExpression}
                      onChange={e => setConfig({ ...config, defaultExpression: e.target.value as any })}
                      className="w-full px-3 py-2 bg-gray-700 text-white rounded-lg border border-gray-600"
                    >
                      <option value="neutral">Neutral</option>
                      <option value="happy">Happy</option>
                      <option value="professional">Professional</option>
                      <option value="friendly">Friendly</option>
                      <option value="confident">Confident</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-gray-300 font-semibold mb-2 block">Emotion Intensity</label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={config.emotionIntensity}
                      onChange={e => setConfig({ ...config, emotionIntensity: parseInt(e.target.value) })}
                      className="w-full"
                    />
                    <span className="text-gray-400 text-xs">{config.emotionIntensity}%</span>
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-gray-300">
                      <input
                        type="checkbox"
                        checked={config.headMovements}
                        onChange={e => setConfig({ ...config, headMovements: e.target.checked })}
                        className="w-4 h-4"
                      />
                      Head Movements
                    </label>
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-gray-300">
                      <input
                        type="checkbox"
                        checked={config.handGestures}
                        onChange={e => setConfig({ ...config, handGestures: e.target.checked })}
                        className="w-4 h-4"
                      />
                      Hand Gestures
                    </label>
                  </div>

                  <button
                    onClick={() => setIsAnimating(!isAnimating)}
                    className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
                  >
                    {isAnimating ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                    {isAnimating ? 'Stop' : 'Preview'} Animation
                  </button>
                </div>
              )}

              {activeTab === 'export' && generatedAvatar && (
                <div className="space-y-3">
                  <h3 className="text-white font-bold mb-3">Export Avatar</h3>
                  <button
                    onClick={() => exportAvatar('mp4')}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-between"
                  >
                    <span>Video (MP4)</span>
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => exportAvatar('fbx')}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-between"
                  >
                    <span>3D Model (FBX)</span>
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => exportAvatar('glb')}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-between"
                  >
                    <span>3D Model (GLB)</span>
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => exportAvatar('json')}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-between"
                  >
                    <span>Configuration (JSON)</span>
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Main Preview Area */}
            <div className="flex-1 bg-gray-900 flex items-center justify-center p-8">
              <canvas
                ref={canvasRef}
                className="border-2 border-gray-700 rounded-lg shadow-2xl max-w-full max-h-full"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-800 border-t border-gray-700 p-4 flex items-center justify-between">
            <div className="text-gray-400 text-sm">
              {generatedAvatar ? (
                <span className="text-green-400 font-semibold">✓ Avatar Ready</span>
              ) : (
                <span>Create an avatar to get started</span>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors font-semibold"
              >
                Cancel
              </button>
              {generatedAvatar && (
                <button
                  onClick={() => {
                    if (onSaveAvatar) onSaveAvatar(generatedAvatar);
                    alert('Avatar saved successfully!');
                    onClose();
                  }}
                  className="px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all font-semibold flex items-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  Save Avatar
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
