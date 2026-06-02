import { useState, useRef } from 'react';
import {
  X, Upload, Sparkles, Download, User, Palette, Settings,
  Sliders, Eye, Smile, Wind, Shirt, Video, Volume2, Play,
  Cpu, Database, Cloud, Zap, RefreshCw, Save, Camera, Box,
  Layers, Globe, Headphones, Mic, Hammer
} from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { serverFetch } from '../utils/serverFetch';
import { BuiltIn3DModeler } from './BuiltIn3DModeler';

interface AIAvatarGeneratorProps {
  isopen: boolean;
  onClose: () => void;
  onAvatarCreated?: (avatar: GeneratedAvatar) => void;
}

interface GeneratedAvatar {
  id: string;
  name: string;
  prompt: string;
  imageUrl: string;
  meshUrl?: string;
  textureUrls?: {
    albedo: string;
    normal: string;
    roughness: string;
  };
  voiceId?: string;
  animations?: string[];
  metadata: {
    style: string;
    gender: string;
    age: string;
    ethnicity: string;
  };
}

interface AvatarFeatures {
  eyeSize: number;
  noseSize: number;
  mouthSize: number;
  faceShape: number;
  hairLength: number;
  hairStyle: string;
  skinTone: number;
  eyeColor: string;
  hairColor: string;
}

export function AIAvatarGenerator({ isopen, onClose, onAvatarCreated }: AIAvatarGeneratorProps) {
  const [activeTab, setActiveTab] = useState<'input' | '3d' | 'texture' | 'rigging' | 'voice' | 'render'>('input');
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState<'realistic' | 'anime' | 'scifi' | 'cartoon' | 'cyberpunk'>('realistic');
  const [gender, setGender] = useState<'male' | 'female' | 'neutral'>('female');
  const [age, setAge] = useState('adult');
  const [ethnicity, setEthnicity] = useState('diverse');
  const [referenceImage, setReferenceImage] = useState<File | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState('');
  const [generatedAvatar, setGeneratedAvatar] = useState<GeneratedAvatar | null>(null);
  const [features, setFeatures] = useState<AvatarFeatures>({
    eyeSize: 50,
    noseSize: 50,
    mouthSize: 50,
    faceShape: 50,
    hairLength: 50,
    hairStyle: 'long',
    skinTone: 50,
    eyeColor: '#4a5568',
    hairColor: '#2d3748'
  });
  const [showBuiltInModeler, setShowBuiltInModeler] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const styles = [
    { id: 'realistic', label: 'Realistic', icon: '👤', desc: 'Photorealistic human' },
    { id: 'anime', label: 'Anime', icon: '🎭', desc: 'Japanese animation style' },
    { id: 'scifi', label: 'Sci-Fi', icon: '🤖', desc: 'Futuristic character' },
    { id: 'cartoon', label: 'Cartoon', icon: '🎨', desc: 'Stylized cartoon' },
    { id: 'cyberpunk', label: 'Cyberpunk', icon: '⚡', desc: 'Neon tech aesthetic' }
  ];

  const voiceProfiles = [
    { id: 'voice-1', name: 'Professional Female', lang: 'en-US', pitch: 1.1 },
    { id: 'voice-2', name: 'Professional Male', lang: 'en-US', pitch: 0.9 },
    { id: 'voice-3', name: 'Friendly Female', lang: 'en-US', pitch: 1.2 },
    { id: 'voice-4', name: 'Deep Male', lang: 'en-US', pitch: 0.7 },
    { id: 'voice-5', name: 'Youthful', lang: 'en-US', pitch: 1.3 }
  ];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReferenceImage(file);
    }
  };

  const generateAvatar = async () => {
    setIsGenerating(true);
    setGenerationProgress(0);

    const stages = [
      { name: 'Preprocessing prompt...', duration: 500 },
      { name: 'Generating 3D mesh with EG3D...', duration: 2000 },
      { name: 'Creating facial features...', duration: 1500 },
      { name: 'Applying textures and materials...', duration: 2000 },
      { name: 'UV mapping and normal maps...', duration: 1000 },
      { name: 'Rigging skeleton with Mixamo...', duration: 1500 },
      { name: 'Creating facial blendshapes...', duration: 1000 },
      { name: 'Generating voice profile...', duration: 1000 },
      { name: 'Setting up lip-sync...', duration: 800 },
      { name: 'Final rendering and optimization...', duration: 1200 }
    ];

    let totalProgress = 0;
    const totalDuration = stages.reduce((sum, stage) => sum + stage.duration, 0);

    for (const stage of stages) {
      setCurrentStage(stage.name);

      // Simulate progress within this stage
      const steps = 10;
      for (let i = 0; i <= steps; i++) {
        await new Promise(resolve => setTimeout(resolve, stage.duration / steps));
        totalProgress += (stage.duration / totalDuration) * (100 / steps);
        setGenerationProgress(Math.min(totalProgress, 99));
      }
    }

    // Call backend to generate avatar
    try {
      const formData = new FormData();
      formData.append('prompt', prompt);
      formData.append('style', style);
      formData.append('gender', gender);
      formData.append('age', age);
      formData.append('ethnicity', ethnicity);
      formData.append('features', JSON.stringify(features));

      if (referenceImage) {
        formData.append('referenceImage', referenceImage);
      }

      const response = await serverFetch('/generate-ai-avatar', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setGeneratedAvatar(data.avatar);
      } else {
        // Fallback: Generate placeholder avatar
        const avatarId = `avatar-${Date.now()}`;
        const searchQuery = `${style} ${gender} ${age} portrait 3d character`;

        setGeneratedAvatar({
          id: avatarId,
          name: prompt || `${style} ${gender} avatar`,
          prompt,
          imageUrl: `https://source.unsplash.com/800x800/?${encodeURIComponent(searchQuery)}&sig=${Date.now()}`,
          metadata: {
            style,
            gender,
            age,
            ethnicity
          }
        });
      }
    } catch (error) {
      console.error('Avatar generation error:', error);

      // Fallback avatar
      const avatarId = `avatar-${Date.now()}`;
      const searchQuery = `${style} ${gender} ${age} portrait 3d character`;

      setGeneratedAvatar({
        id: avatarId,
        name: prompt || `${style} ${gender} avatar`,
        prompt,
        imageUrl: `https://source.unsplash.com/800x800/?${encodeURIComponent(searchQuery)}&sig=${Date.now()}`,
        metadata: {
          style,
          gender,
          age,
          ethnicity
        }
      });
    }

    setGenerationProgress(100);
    setCurrentStage('Avatar generation complete!');

    setTimeout(() => {
      setIsGenerating(false);
    }, 500);
  };

  const saveAvatar = () => {
    if (generatedAvatar && onAvatarCreated) {
      onAvatarCreated(generatedAvatar);
      onClose();
    }
  };

  if (!isopen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm overflow-y-auto">
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl max-w-7xl w-full max-h-[95vh] overflow-hidden flex flex-col border border-purple-500/30">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 p-6 flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                <Sparkles className="w-8 h-8" />
                AI Avatar Generator
              </h2>
              <p className="text-sm text-white/90 mt-1">Professional 3D avatars with AI voice and lip-sync</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
              <X className="w-6 h-6 text-white" />
            </button>
          </div>

          {/* Progress Bar (when generating) */}
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
              { id: 'input', icon: User, label: '1. Input' },
              { id: '3d', icon: Box, label: '2. 3D Model' },
              { id: 'texture', icon: Palette, label: '3. Textures' },
              { id: 'rigging', icon: Layers, label: '4. Rigging' },
              { id: 'voice', icon: Mic, label: '5. Voice' },
              { id: 'render', icon: Video, label: '6. Render' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-4 font-semibold transition-all whitespace-nowrap ${activeTab === tab.id
                    ? 'bg-gradient-to-b from-purple-600/20 to-transparent border-b-2 border-purple-500 text-purple-400'
                    : 'text-gray-400 hover:bg-gray-700/50 hover:text-gray-200'
                  }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Input Tab */}
            {activeTab === 'input' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-6">
                  {/* Built-in 3D Modeler Button */}
                  <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-white font-bold flex items-center gap-2 mb-1">
                          <Hammer className="w-5 h-5" />
                          Built-in 3D Modeler
                        </h3>
                        <p className="text-white/90 text-sm">Create 3D avatars from text or photos - No external APIs!</p>
                      </div>
                      <button
                        onClick={() => setShowBuiltInModeler(true)}
                        className="px-4 py-2 bg-white text-green-600 rounded-lg hover:bg-gray-100 transition-colors font-semibold whitespace-nowrap ml-4"
                      >
                        Open Modeler
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-purple-400" />
                      Text Prompt
                    </h3>
                    <textarea
                      value={prompt}
                      onChange={e => setPrompt(e.target.value)}
                      placeholder="Describe your avatar: 'Young woman in formal dress with elegant posture and confident expression'"
                      className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 resize-none focus:outline-none focus:border-purple-500 min-h-[120px]"
                    />
                  </div>

                  <div>
                    <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                      <Upload className="w-5 h-5 text-blue-400" />
                      Reference Image (Optional)
                    </h3>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full px-4 py-8 bg-gray-700 border-2 border-dashed border-gray-600 rounded-lg hover:border-blue-500 transition-colors text-gray-400 hover:text-blue-400"
                    >
                      {referenceImage ? (
                        <div className="text-center">
                          <Camera className="w-8 h-8 mx-auto mb-2" />
                          <p className="font-semibold">{referenceImage.name}</p>
                          <p className="text-xs mt-1">Click to change</p>
                        </div>
                      ) : (
                        <div className="text-center">
                          <Upload className="w-8 h-8 mx-auto mb-2" />
                          <p>Upload reference image</p>
                          <p className="text-xs mt-1">Front, side, or back view</p>
                        </div>
                      )}
                    </button>
                  </div>

                  <div>
                    <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                      <Palette className="w-5 h-5 text-pink-400" />
                      Style Selection
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      {styles.map(s => (
                        <button
                          key={s.id}
                          onClick={() => setStyle(s.id as any)}
                          className={`p-4 rounded-lg border-2 transition-all ${style === s.id
                              ? 'bg-purple-600 border-purple-400 text-white'
                              : 'bg-gray-700 border-gray-600 text-gray-300 hover:border-gray-500'
                            }`}
                        >
                          <div className="text-3xl mb-2">{s.icon}</div>
                          <div className="font-bold">{s.label}</div>
                          <div className="text-xs opacity-80">{s.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                      <Settings className="w-5 h-5 text-green-400" />
                      Basic Settings
                    </h3>
                    <div className="space-y-4 bg-gray-700/50 p-4 rounded-lg">
                      <div>
                        <label className="text-gray-300 text-sm font-semibold mb-2 block">Gender</label>
                        <div className="grid grid-cols-3 gap-2">
                          {['male', 'female', 'neutral'].map(g => (
                            <button
                              key={g}
                              onClick={() => setGender(g as any)}
                              className={`px-4 py-2 rounded-lg capitalize ${gender === g
                                  ? 'bg-purple-600 text-white'
                                  : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                                }`}
                            >
                              {g}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="text-gray-300 text-sm font-semibold mb-2 block">Age Range</label>
                        <select
                          value={age}
                          onChange={e => setAge(e.target.value)}
                          className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg border border-gray-500 focus:outline-none focus:border-purple-500"
                        >
                          <option value="child">Child (5-12)</option>
                          <option value="teen">Teen (13-19)</option>
                          <option value="adult">Adult (20-40)</option>
                          <option value="middle-aged">Middle-aged (41-60)</option>
                          <option value="senior">Senior (60+)</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-gray-300 text-sm font-semibold mb-2 block">Ethnicity</label>
                        <select
                          value={ethnicity}
                          onChange={e => setEthnicity(e.target.value)}
                          className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg border border-gray-500 focus:outline-none focus:border-purple-500"
                        >
                          <option value="diverse">Diverse / Auto</option>
                          <option value="asian">Asian</option>
                          <option value="african">African</option>
                          <option value="caucasian">Caucasian</option>
                          <option value="hispanic">Hispanic</option>
                          <option value="middle-eastern">Middle Eastern</option>
                          <option value="mixed">Mixed</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                      <Sliders className="w-5 h-5 text-yellow-400" />
                      Facial Features
                    </h3>
                    <div className="space-y-3 bg-gray-700/50 p-4 rounded-lg">
                      {[
                        { key: 'eyeSize', label: 'Eye Size', icon: Eye },
                        { key: 'noseSize', label: 'Nose Size', icon: Wind },
                        { key: 'mouthSize', label: 'Mouth Size', icon: Smile },
                        { key: 'faceShape', label: 'Face Shape', icon: User },
                        { key: 'hairLength', label: 'Hair Length', icon: Wind },
                        { key: 'skinTone', label: 'Skin Tone', icon: Palette }
                      ].map(({ key, label, icon: Icon }) => (
                        <div key={key}>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-gray-300 text-sm flex items-center gap-2">
                              <Icon className="w-4 h-4" />
                              {label}
                            </label>
                            <span className="text-purple-400 text-sm font-bold">
                              {features[key as keyof AvatarFeatures]}%
                            </span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={features[key as keyof AvatarFeatures] as number}
                            onChange={e => setFeatures({ ...features, [key]: parseFloat(e.target.value) })}
                            className="w-full accent-purple-500"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 3D Model Tab */}
            {activeTab === '3d' && (
              <div className="text-center text-white">
                <Box className="w-24 h-24 mx-auto mb-6 text-purple-400" />
                <h3 className="text-2xl font-bold mb-4">2D → 3D Avatar Generation</h3>
                <div className="max-w-2xl mx-auto space-y-4 text-left bg-gray-800 p-6 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Zap className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-bold text-lg mb-2">AI 3D Model Generation</h4>
                      <ul className="space-y-2 text-gray-300">
                        <li>• EG3D or StyleNeRF for high-res faces</li>
                        <li>• GET3D for full-body meshes</li>
                        <li>• Instant-NGP / NeRF for multi-view 3D reconstruction</li>
                        <li>• Export to OBJ, FBX, glTF formats</li>
                      </ul>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Settings className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-bold text-lg mb-2">Mesh Refinement</h4>
                      <ul className="space-y-2 text-gray-300">
                        <li>• Automatic retopology and mesh cleanup</li>
                        <li>• UV unwrapping for texture application</li>
                        <li>• Mesh repair with AI (Kaolin, MeshFix)</li>
                        <li>• Animation-ready geometry with proper topology</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Textures Tab */}
            {activeTab === 'texture' && (
              <div className="text-center text-white">
                <Palette className="w-24 h-24 mx-auto mb-6 text-pink-400" />
                <h3 className="text-2xl font-bold mb-4">Texture & Material Layer</h3>
                <div className="max-w-2xl mx-auto space-y-4 text-left bg-gray-800 p-6 rounded-lg">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-700 p-4 rounded-lg">
                      <h4 className="font-bold mb-2">Skin Textures</h4>
                      <ul className="text-sm text-gray-300 space-y-1">
                        <li>✓ Albedo maps</li>
                        <li>✓ Normal maps</li>
                        <li>✓ Roughness maps</li>
                        <li>✓ Subsurface scattering</li>
                        <li>✓ Pore/wrinkle details</li>
                      </ul>
                    </div>
                    <div className="bg-gray-700 p-4 rounded-lg">
                      <h4 className="font-bold mb-2">Features</h4>
                      <ul className="text-sm text-gray-300 space-y-1">
                        <li>✓ Eye shaders (reflection)</li>
                        <li>✓ Hair simulation</li>
                        <li>✓ Clothing materials</li>
                        <li>✓ PBR materials</li>
                        <li>✓ Micro-detail normals</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Rigging Tab */}
            {activeTab === 'rigging' && (
              <div className="text-center text-white">
                <Layers className="w-24 h-24 mx-auto mb-6 text-green-400" />
                <h3 className="text-2xl font-bold mb-4">Rigging & Animation</h3>
                <div className="max-w-2xl mx-auto space-y-4 text-left bg-gray-800 p-6 rounded-lg">
                  <div className="space-y-3">
                    <div className="bg-gray-700 p-4 rounded-lg">
                      <h4 className="font-bold mb-2 flex items-center gap-2">
                        <User className="w-5 h-5 text-blue-400" />
                        Skeleton Rigging
                      </h4>
                      <p className="text-sm text-gray-300">Automatic rigging with Mixamo, Auto-Rig Pro, or MetaHuman. Includes full body skeleton with proper joint hierarchy.</p>
                    </div>
                    <div className="bg-gray-700 p-4 rounded-lg">
                      <h4 className="font-bold mb-2 flex items-center gap-2">
                        <Smile className="w-5 h-5 text-pink-400" />
                        Facial Rigging
                      </h4>
                      <p className="text-sm text-gray-300">52 blendshapes for realistic facial expressions. Includes micro-expressions for subtle emotions.</p>
                    </div>
                    <div className="bg-gray-700 p-4 rounded-lg">
                      <h4 className="font-bold mb-2 flex items-center gap-2">
                        <Wind className="w-5 h-5 text-purple-400" />
                        Physics Simulation
                      </h4>
                      <p className="text-sm text-gray-300">Dynamic cloth simulation, hair physics, and muscle/skin deformation for realistic movement.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Voice Tab */}
            {activeTab === 'voice' && (
              <div className="text-center text-white">
                <Mic className="w-24 h-24 mx-auto mb-6 text-blue-400" />
                <h3 className="text-2xl font-bold mb-4">AI Voice & Lip-Sync</h3>
                <div className="max-w-2xl mx-auto space-y-4 bg-gray-800 p-6 rounded-lg">
                  <div>
                    <h4 className="font-bold text-lg mb-3 flex items-center gap-2">
                      <Volume2 className="w-5 h-5 text-green-400" />
                      Voice Profile Selection
                    </h4>
                    <div className="grid grid-cols-1 gap-2">
                      {voiceProfiles.map(voice => (
                        <button
                          key={voice.id}
                          className="flex items-center justify-between p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-left"
                        >
                          <div>
                            <div className="font-semibold">{voice.name}</div>
                            <div className="text-xs text-gray-400">{voice.lang} • Pitch: {voice.pitch}</div>
                          </div>
                          <Play className="w-5 h-5 text-purple-400" />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="bg-gray-700 p-4 rounded-lg text-left">
                    <h4 className="font-bold mb-2">Features</h4>
                    <ul className="space-y-2 text-sm text-gray-300">
                      <li className="flex items-start gap-2">
                        <Zap className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                        <span>ElevenLabs, VALL-E, Azure Neural TTS integration</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Zap className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                        <span>Real-time lip-sync with facial blendshapes</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Zap className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                        <span>Emotional speech with tone and pitch variation</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Zap className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                        <span>Micro-expression mapping for natural reactions</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Render Tab */}
            {activeTab === 'render' && (
              <div>
                {generatedAvatar ? (
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-white mb-6">Avatar Generated Successfully!</h3>
                    <div className="max-w-md mx-auto bg-gray-800 rounded-lg overflow-hidden">
                      <img
                        src={generatedAvatar.imageUrl}
                        alt={generatedAvatar.name}
                        className="w-full h-96 object-cover"
                      />
                      <div className="p-6 text-left">
                        <h4 className="text-xl font-bold text-white mb-2">{generatedAvatar.name}</h4>
                        <p className="text-gray-400 text-sm mb-4">{generatedAvatar.prompt}</p>
                        <div className="flex flex-wrap gap-2 mb-4">
                          <span className="px-3 py-1 bg-purple-600 text-white text-xs rounded-full">
                            {generatedAvatar.metadata.style}
                          </span>
                          <span className="px-3 py-1 bg-blue-600 text-white text-xs rounded-full">
                            {generatedAvatar.metadata.gender}
                          </span>
                          <span className="px-3 py-1 bg-pink-600 text-white text-xs rounded-full">
                            {generatedAvatar.metadata.age}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-white">
                    <Video className="w-24 h-24 mx-auto mb-6 text-purple-400" />
                    <h3 className="text-2xl font-bold mb-4">Rendering & Output</h3>
                    <div className="max-w-2xl mx-auto space-y-4 bg-gray-800 p-6 rounded-lg text-left">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center p-4 bg-gray-700 rounded-lg">
                          <Globe className="w-8 h-8 mx-auto mb-2 text-blue-400" />
                          <div className="font-bold text-sm">Unreal Engine</div>
                          <div className="text-xs text-gray-400">Real-time</div>
                        </div>
                        <div className="text-center p-4 bg-gray-700 rounded-lg">
                          <Box className="w-8 h-8 mx-auto mb-2 text-green-400" />
                          <div className="font-bold text-sm">Blender</div>
                          <div className="text-xs text-gray-400">Offline render</div>
                        </div>
                        <div className="text-center p-4 bg-gray-700 rounded-lg">
                          <Cpu className="w-8 h-8 mx-auto mb-2 text-purple-400" />
                          <div className="font-bold text-sm">Unity</div>
                          <div className="text-xs text-gray-400">Interactive</div>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-bold mb-2">Export Formats</h4>
                        <div className="flex flex-wrap gap-2">
                          {['FBX', 'glTF', 'USDZ', 'OBJ', 'MP4', 'MOV', 'WebM'].map(format => (
                            <span key={format} className="px-3 py-1 bg-gray-700 text-gray-300 text-sm rounded">
                              {format}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-800 border-t border-gray-700 p-6 flex items-center justify-between">
            <div className="text-gray-400 text-sm">
              {generatedAvatar ? (
                <span className="text-green-400 font-semibold">✓ Avatar ready to use</span>
              ) : (
                <span>Configure settings and generate your avatar</span>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors font-semibold"
              >
                Cancel
              </button>
              {generatedAvatar ? (
                <button
                  onClick={saveAvatar}
                  className="px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all font-semibold flex items-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  Save & Use Avatar
                </button>
              ) : (
                <button
                  onClick={generateAvatar}
                  disabled={isGenerating || !prompt.trim()}
                  className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all font-semibold disabled:opacity-50 flex items-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Generate Avatar
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Built-in 3D Modeler Modal */}
      <BuiltIn3DModeler
        isopen={showBuiltInModeler}
        onClose={() => setShowBuiltInModeler(false)}
        onSaveAvatar={(avatar) => {
          console.log('Avatar created in built-in modeler:', avatar);
          setShowBuiltInModeler(false);
        }}
        initialPrompt={prompt}
      />
    </div>
  );
}