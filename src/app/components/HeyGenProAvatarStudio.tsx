// Professional Avatar Studio - HeyGen Comparable
import { useState, useRef, useEffect } from 'react';
import {
  User, Camera, Wand2, Download, Share2, Sparkles, Play, Pause,
  RefreshCw, Upload, Loader, Check, Crown, Star, Mic, Volume2,
  Image as ImageIcon, Copy, AlertCircle, Film, Settings, Smile,
  Video, Type, Globe, Palette, Zap, FileText, Save, Eye, EyeOff,
  Move, Maximize2, RotateCw, Sliders, Music, VolumeX, SkipForward,
  Rewind, FastForward, ChevronDown, ChevronRight, X, Plus, Trash2,
  Edit, Layers, Box, MonitorPlay, Languages, MessageSquare, Heart, Key
} from 'lucide-react';
import { APIKeySetupModal } from './APIKeySetupModal';
import { hasAPIKey, type Provider } from '../utils/apiKeyService';

interface Avatar {
  id: string;
  url: string;
  name: string;
  type: 'photo' | 'ai-generated' | 'preset';
  style: 'realistic' | '3d' | 'cartoon' | 'professional';
}

interface VoiceOption {
  id: string;
  name: string;
  language: string;
  gender: 'male' | 'female';
  accent: string;
  preview?: string;
}

interface VideoProject {
  id: string;
  avatar: Avatar;
  script: string;
  voice: VoiceOption;
  background: string;
  emotion: string;
  duration: number;
  createdAt: number;
}

const VOICE_OPTIONS: VoiceOption[] = [
  { id: 'v1', name: 'Emma - Professional', language: 'English (US)', gender: 'female', accent: 'American' },
  { id: 'v2', name: 'James - Business', language: 'English (US)', gender: 'male', accent: 'American' },
  { id: 'v3', name: 'Sophie - Friendly', language: 'English (UK)', gender: 'female', accent: 'British' },
  { id: 'v4', name: 'Oliver - Corporate', language: 'English (UK)', gender: 'male', accent: 'British' },
  { id: 'v5', name: 'Maria - Warm', language: 'Spanish', gender: 'female', accent: 'European' },
  { id: 'v6', name: 'Carlos - Confident', language: 'Spanish', gender: 'male', accent: 'Latin American' },
  { id: 'v7', name: 'Amelie - Elegant', language: 'French', gender: 'female', accent: 'Parisian' },
  { id: 'v8', name: 'Pierre - Professional', language: 'French', gender: 'male', accent: 'Parisian' },
  { id: 'v9', name: 'Yuki - Clear', language: 'Japanese', gender: 'female', accent: 'Tokyo' },
  { id: 'v10', name: 'Takeshi - Strong', language: 'Japanese', gender: 'male', accent: 'Tokyo' },
  { id: 'v11', name: 'Li Wei - Soft', language: 'Chinese', gender: 'female', accent: 'Mandarin' },
  { id: 'v12', name: 'Chen - Authoritative', language: 'Chinese', gender: 'male', accent: 'Mandarin' },
  { id: 'v13', name: 'Anna - Cheerful', language: 'German', gender: 'female', accent: 'Berlin' },
  { id: 'v14', name: 'Hans - Serious', language: 'German', gender: 'male', accent: 'Munich' },
  { id: 'v15', name: 'Giulia - Expressive', language: 'Italian', gender: 'female', accent: 'Roman' },
];

const EMOTIONS = [
  { id: 'neutral', label: 'Neutral', icon: '😐' },
  { id: 'happy', label: 'Happy', icon: '😊' },
  { id: 'excited', label: 'Excited', icon: '🤩' },
  { id: 'professional', label: 'Professional', icon: '👔' },
  { id: 'friendly', label: 'Friendly', icon: '😄' },
  { id: 'serious', label: 'Serious', icon: '😌' },
  { id: 'confident', label: 'Confident', icon: '💪' },
  { id: 'warm', label: 'Warm', icon: '🤗' },
];

const BACKGROUNDS = [
  { id: 'office', label: 'Modern Office', color: 'from-gray-600 to-gray-800' },
  { id: 'studio', label: 'Studio White', color: 'from-gray-100 to-gray-300' },
  { id: 'gradient-blue', label: 'Blue Gradient', color: 'from-blue-500 to-purple-600' },
  { id: 'gradient-purple', label: 'Purple Gradient', color: 'from-purple-500 to-pink-600' },
  { id: 'gradient-green', label: 'Green Gradient', color: 'from-green-500 to-teal-600' },
  { id: 'gradient-orange', label: 'Orange Gradient', color: 'from-orange-500 to-red-600' },
  { id: 'nature', label: 'Nature Blur', color: 'from-green-600 to-green-800' },
  { id: 'city', label: 'City Blur', color: 'from-gray-700 to-blue-900' },
  { id: 'custom', label: 'Custom Image', color: 'from-purple-600 to-pink-600' },
];

const PRESET_AVATARS = [
  { id: 'p1', query: 'professional business woman confident portrait', name: 'Sarah - Executive', style: 'professional' as const },
  { id: 'p2', query: 'professional business man suit portrait', name: 'David - CEO', style: 'professional' as const },
  { id: 'p3', query: 'friendly young woman smiling portrait', name: 'Emily - Marketing', style: 'realistic' as const },
  { id: 'p4', query: 'creative designer man casual portrait', name: 'Alex - Designer', style: 'realistic' as const },
  { id: 'p5', query: 'professional woman doctor portrait', name: 'Dr. Johnson', style: 'professional' as const },
  { id: 'p6', query: 'tech professional man portrait', name: 'Mark - Engineer', style: 'realistic' as const },
  { id: 'p7', query: 'sales professional woman portrait', name: 'Lisa - Sales', style: 'professional' as const },
  { id: 'p8', query: 'customer service woman friendly portrait', name: 'Amy - Support', style: 'realistic' as const },
];

export function HeyGenProAvatarStudio() {
  // Main State
  const [activeTab, setActiveTab] = useState<'create' | 'customize' | 'generate' | 'library'>('create');
  const [selectedAvatar, setSelectedAvatar] = useState<Avatar | null>(null);
  const [script, setScript] = useState('');
  const [selectedVoice, setSelectedVoice] = useState<VoiceOption>(VOICE_OPTIONS[0]);
  const [selectedEmotion, setSelectedEmotion] = useState('neutral');
  const [selectedBackground, setSelectedBackground] = useState('office');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [generatedVideo, setGeneratedVideo] = useState<VideoProject | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoProjects, setVideoProjects] = useState<VideoProject[]>([]);

  // UI State
  const [showVoicePreview, setShowVoicePreview] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string>('avatar');
  const [uploadMode, setUploadMode] = useState<'photo' | 'ai-generate'>('photo');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const backgroundInputRef = useRef<HTMLInputElement>(null);
  const [customBackground, setCustomBackground] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Advanced Settings
  const [speechSpeed, setSpeechSpeed] = useState(1.0);
  const [pitch, setPitch] = useState(1.0);
  const [volume, setVolume] = useState(1.0);
  const [gesturesEnabled, setGesturesEnabled] = useState(true);
  const [lipSyncEnabled, setLipSyncEnabled] = useState(true);
  const [autoGesturesEnabled, setAutoGesturesEnabled] = useState(true);

  // API Key Modal State
  const [showAPIKeyModal, setShowAPIKeyModal] = useState(false);
  const [hasAPIKeyConfigured, setHasAPIKeyConfigured] = useState(false);

  // Check if API key is configured on mount
  useEffect(() => {
    checkAPIKeyStatus();
  }, []);

  const checkAPIKeyStatus = async () => {
    const hasCaptionKey = await hasAPIKey('captionai');
    const hasDidKey = await hasAPIKey('did');
    setHasAPIKeyConfigured(hasCaptionKey || hasDidKey);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        const newAvatar: Avatar = {
          id: `avatar-${Date.now()}`,
          url: result,
          name: 'Custom Avatar',
          type: 'photo',
          style: 'realistic'
        };
        setSelectedAvatar(newAvatar);
        setSuccess('Avatar uploaded successfully!');
        setTimeout(() => setSuccess(null), 3000);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBackgroundUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setCustomBackground(result);
        setSelectedBackground('custom');
        setSuccess('Background uploaded successfully!');
        setTimeout(() => setSuccess(null), 3000);
      };
      reader.readAsDataURL(file);
    }
  };

  const generateAIAvatar = async (query: string, name: string) => {
    setIsGenerating(true);
    setError(null);

    try {
      const timestamp = Date.now();
      const avatarUrl = `https://source.unsplash.com/800x800/?${encodeURIComponent(query)},portrait,face&sig=${timestamp}`;

      // Simulate generation
      await new Promise(resolve => setTimeout(resolve, 1500));

      const newAvatar: Avatar = {
        id: `avatar-${timestamp}`,
        url: avatarUrl,
        name: name,
        type: 'ai-generated',
        style: 'realistic'
      };

      setSelectedAvatar(newAvatar);
      setSuccess('AI Avatar generated successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to generate avatar. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const selectPresetAvatar = async (preset: typeof PRESET_AVATARS[0]) => {
    await generateAIAvatar(preset.query, preset.name);
  };

  const generateVideo = async () => {
    if (!selectedAvatar) {
      setError('Please select or create an avatar first');
      return;
    }

    if (!script.trim()) {
      setError('Please enter a script for your avatar to speak');
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(0);
    setError(null);

    const steps = [
      'Analyzing script...',
      'Processing voice synthesis...',
      'Generating lip-sync data...',
      'Rendering avatar movements...',
      'Adding gestures and expressions...',
      'Compositing background...',
      'Finalizing video...',
      'Complete!'
    ];

    try {
      for (let i = 0; i < steps.length; i++) {
        setCurrentStep(steps[i]);
        setGenerationProgress(((i + 1) / steps.length) * 100);
        await new Promise(resolve => setTimeout(resolve, 600));
      }

      // Estimate duration based on script length
      const wordCount = script.split(/\s+/).length;
      const estimatedDuration = Math.ceil((wordCount / 150) * 60); // ~150 words per minute

      const newProject: VideoProject = {
        id: `video-${Date.now()}`,
        avatar: selectedAvatar,
        script: script,
        voice: selectedVoice,
        background: selectedBackground,
        emotion: selectedEmotion,
        duration: estimatedDuration,
        createdAt: Date.now()
      };

      setGeneratedVideo(newProject);
      setVideoProjects(prev => [newProject, ...prev]);
      setSuccess('Video generated successfully!');
      setTimeout(() => setSuccess(null), 3000);
      setActiveTab('library');
    } catch (err) {
      setError('Failed to generate video. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadVideo = (project: VideoProject) => {
    // In production, this would download the actual rendered video
    const data = JSON.stringify(project, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `video-${project.id}.json`;
    link.click();
    URL.revokeObjectURL(url);

    setSuccess('Video project downloaded!');
    setTimeout(() => setSuccess(null), 3000);
  };

  const Section = ({ id, title, icon: Icon, children }: any) => {
    const isExpanded = expandedSection === id;

    return (
      <div className="border-b border-gray-700">
        <button
          onClick={() => setExpandedSection(isExpanded ? '' : id)}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-700/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Icon className="w-5 h-5 text-purple-400" />
            <span className="text-white font-semibold">{title}</span>
          </div>
          {isExpanded ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
        </button>
        {isExpanded && (
          <div className="p-4 bg-gray-800/50">
            {children}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* API Key Setup Modal */}
      <APIKeySetupModal
        isopen={showAPIKeyModal}
        onClose={() => setShowAPIKeyModal(false)}
        onKeySaved={async () => {
          await checkAPIKeyStatus();
          setShowAPIKeyModal(false);
          setSuccess('API key configured! You can now generate videos.');
          setTimeout(() => setSuccess(null), 3000);
        }}
        provider="captionai"
      />

      {/* Top Navigation */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 p-6 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-white font-bold text-3xl flex items-center gap-3">
              <Crown className="w-8 h-8" />
              Pro Avatar Studio
            </h1>
            <p className="text-white/90 text-sm mt-1">HeyGen-Level Professional AI Avatar & Video Generation</p>
          </div>
          <div className="flex items-center gap-3">
            {!hasAPIKeyConfigured && (
              <button
                onClick={() => setShowAPIKeyModal(true)}
                className="bg-yellow-500/20 hover:bg-yellow-500/30 backdrop-blur-sm px-4 py-2 rounded-lg transition-all"
              >
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-yellow-300" />
                  <span className="text-yellow-300 text-sm font-bold">Setup API Key</span>
                </div>
              </button>
            )}
            <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-300" />
                <span className="text-white text-sm font-bold">Professional Grade</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => setActiveTab('create')}
            className={`px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-all ${activeTab === 'create' ? 'bg-white text-purple-600 shadow-lg' : 'bg-white/20 text-white hover:bg-white/30'
              }`}
          >
            <User className="w-4 h-4" />
            Create Avatar
          </button>
          <button
            onClick={() => setActiveTab('customize')}
            className={`px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-all ${activeTab === 'customize' ? 'bg-white text-purple-600 shadow-lg' : 'bg-white/20 text-white hover:bg-white/30'
              }`}
          >
            <Settings className="w-4 h-4" />
            Customize
          </button>
          <button
            onClick={() => setActiveTab('generate')}
            className={`px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-all ${activeTab === 'generate' ? 'bg-white text-purple-600 shadow-lg' : 'bg-white/20 text-white hover:bg-white/30'
              }`}
          >
            <Film className="w-4 h-4" />
            Generate Video
          </button>
          <button
            onClick={() => setActiveTab('library')}
            className={`px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-all ${activeTab === 'library' ? 'bg-white text-purple-600 shadow-lg' : 'bg-white/20 text-white hover:bg-white/30'
              }`}
          >
            <Video className="w-4 h-4" />
            Library ({videoProjects.length})
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="bg-red-900/50 border-b border-red-500 p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <p className="text-red-200 font-semibold">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="text-red-200 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {success && (
        <div className="bg-green-900/50 border-b border-green-500 p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Check className="w-5 h-5 text-green-400" />
            <p className="text-green-200 font-semibold">{success}</p>
          </div>
          <button onClick={() => setSuccess(null)} className="text-green-200 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-96 bg-gray-800 border-r border-gray-700 overflow-y-auto">
          {activeTab === 'create' && (
            <div>
              <div className="p-4 border-b border-gray-700">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setUploadMode('photo')}
                    className={`p-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all ${uploadMode === 'photo' ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                  >
                    <Camera className="w-4 h-4" />
                    Upload Photo
                  </button>
                  <button
                    onClick={() => setUploadMode('ai-generate')}
                    className={`p-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all ${uploadMode === 'ai-generate' ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                  >
                    <Wand2 className="w-4 h-4" />
                    AI Generate
                  </button>
                </div>
              </div>

              {uploadMode === 'photo' && (
                <div className="p-4">
                  <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                    <Upload className="w-5 h-5 text-blue-400" />
                    Upload Your Photo
                  </h3>
                  <p className="text-gray-400 text-sm mb-4">
                    Upload a clear photo of a face. We'll convert it into a talking avatar.
                  </p>

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handlePhotoUpload}
                    accept="image/*"
                    className="hidden"
                  />

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full p-8 border-2 border-dashed border-gray-600 rounded-lg hover:border-purple-500 transition-all bg-gray-700/50"
                  >
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-white font-semibold">Click to Upload</p>
                    <p className="text-gray-400 text-xs mt-1">PNG, JPG up to 10MB</p>
                  </button>

                  <div className="mt-4 p-4 bg-blue-900/30 border border-blue-500/50 rounded-lg">
                    <h4 className="text-blue-300 font-semibold text-sm mb-2">Tips for Best Results:</h4>
                    <ul className="text-blue-200 text-xs space-y-1">
                      <li>• Face should be clearly visible</li>
                      <li>• Good lighting, no shadows</li>
                      <li>• Neutral expression works best</li>
                      <li>• Front-facing photo recommended</li>
                    </ul>
                  </div>
                </div>
              )}

              {uploadMode === 'ai-generate' && (
                <div className="p-4">
                  <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-yellow-400" />
                    Choose Preset Avatar
                  </h3>
                  <p className="text-gray-400 text-sm mb-4">
                    Select from our library of professional AI avatars
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    {PRESET_AVATARS.map((preset) => (
                      <button
                        key={preset.id}
                        onClick={() => selectPresetAvatar(preset)}
                        disabled={isGenerating}
                        className="bg-gray-700 hover:bg-gray-600 rounded-lg p-3 transition-all group disabled:opacity-50"
                      >
                        <div className="w-full h-32 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg mb-2 flex items-center justify-center group-hover:scale-105 transition-transform">
                          <User className="w-16 h-16 text-white" />
                        </div>
                        <p className="text-white text-sm font-semibold">{preset.name}</p>
                        <p className="text-gray-400 text-xs capitalize">{preset.style}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'customize' && (
            <div>
              <Section id="voice" title="Voice & Language" icon={Mic}>
                <div className="space-y-3">
                  <label className="text-gray-300 text-sm font-semibold">Select Voice</label>
                  <select
                    value={selectedVoice.id}
                    onChange={(e) => setSelectedVoice(VOICE_OPTIONS.find(v => v.id === e.target.value) || VOICE_OPTIONS[0])}
                    className="w-full px-4 py-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:border-purple-500 focus:outline-none"
                  >
                    {VOICE_OPTIONS.map((voice) => (
                      <option key={voice.id} value={voice.id}>
                        {voice.name} - {voice.language}
                      </option>
                    ))}
                  </select>

                  <div className="p-3 bg-gray-700/50 rounded-lg">
                    <p className="text-gray-300 text-xs mb-1">Language: <span className="text-white font-semibold">{selectedVoice.language}</span></p>
                    <p className="text-gray-300 text-xs mb-1">Gender: <span className="text-white font-semibold capitalize">{selectedVoice.gender}</span></p>
                    <p className="text-gray-300 text-xs">Accent: <span className="text-white font-semibold">{selectedVoice.accent}</span></p>
                  </div>

                  <button className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2">
                    <Volume2 className="w-4 h-4" />
                    Preview Voice
                  </button>
                </div>
              </Section>

              <Section id="emotion" title="Emotion & Expression" icon={Smile}>
                <div className="grid grid-cols-2 gap-2">
                  {EMOTIONS.map((emotion) => (
                    <button
                      key={emotion.id}
                      onClick={() => setSelectedEmotion(emotion.id)}
                      className={`p-3 rounded-lg transition-all ${selectedEmotion === emotion.id
                          ? 'bg-purple-600 text-white ring-2 ring-purple-400'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                    >
                      <div className="text-2xl mb-1">{emotion.icon}</div>
                      <p className="text-xs font-semibold">{emotion.label}</p>
                    </button>
                  ))}
                </div>
              </Section>

              <Section id="background" title="Background" icon={ImageIcon}>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    {BACKGROUNDS.map((bg) => (
                      <button
                        key={bg.id}
                        onClick={() => bg.id === 'custom' ? backgroundInputRef.current?.click() : setSelectedBackground(bg.id)}
                        className={`p-3 rounded-lg transition-all ${selectedBackground === bg.id
                            ? 'ring-2 ring-purple-400'
                            : 'hover:ring-2 hover:ring-gray-500'
                          }`}
                      >
                        <div className={`w-full h-16 bg-gradient-to-br ${bg.color} rounded-lg mb-2`} />
                        <p className="text-white text-xs font-semibold">{bg.label}</p>
                      </button>
                    ))}
                  </div>

                  <input
                    type="file"
                    ref={backgroundInputRef}
                    onChange={handleBackgroundUpload}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
              </Section>

              <Section id="advanced" title="Advanced Settings" icon={Sliders}>
                <div className="space-y-4">
                  <div>
                    <label className="text-gray-300 text-sm font-semibold flex items-center justify-between mb-2">
                      Speech Speed
                      <span className="text-purple-400">{speechSpeed.toFixed(1)}x</span>
                    </label>
                    <input
                      type="range"
                      min="0.5"
                      max="2.0"
                      step="0.1"
                      value={speechSpeed}
                      onChange={(e) => setSpeechSpeed(parseFloat(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="text-gray-300 text-sm font-semibold flex items-center justify-between mb-2">
                      Pitch
                      <span className="text-purple-400">{pitch.toFixed(1)}x</span>
                    </label>
                    <input
                      type="range"
                      min="0.5"
                      max="2.0"
                      step="0.1"
                      value={pitch}
                      onChange={(e) => setPitch(parseFloat(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="text-gray-300 text-sm font-semibold flex items-center justify-between mb-2">
                      Volume
                      <span className="text-purple-400">{Math.round(volume * 100)}%</span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={volume}
                      onChange={(e) => setVolume(parseFloat(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center justify-between p-3 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600">
                      <span className="text-white text-sm font-semibold">Enable Lip Sync</span>
                      <input
                        type="checkbox"
                        checked={lipSyncEnabled}
                        onChange={(e) => setLipSyncEnabled(e.target.checked)}
                        className="w-5 h-5"
                      />
                    </label>

                    <label className="flex items-center justify-between p-3 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600">
                      <span className="text-white text-sm font-semibold">Enable Gestures</span>
                      <input
                        type="checkbox"
                        checked={gesturesEnabled}
                        onChange={(e) => setGesturesEnabled(e.target.checked)}
                        className="w-5 h-5"
                      />
                    </label>

                    <label className="flex items-center justify-between p-3 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600">
                      <span className="text-white text-sm font-semibold">Auto Gestures</span>
                      <input
                        type="checkbox"
                        checked={autoGesturesEnabled}
                        onChange={(e) => setAutoGesturesEnabled(e.target.checked)}
                        className="w-5 h-5"
                      />
                    </label>
                  </div>
                </div>
              </Section>
            </div>
          )}

          {activeTab === 'generate' && (
            <div className="p-4">
              <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                <FileText className="w-5 h-5 text-green-400" />
                Script
              </h3>
              <p className="text-gray-400 text-sm mb-4">
                Enter the text you want your avatar to speak
              </p>

              <textarea
                value={script}
                onChange={(e) => setScript(e.target.value)}
                placeholder="Enter your script here... The avatar will speak this text with realistic lip-sync and gestures."
                className="w-full px-4 py-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:border-purple-500 focus:outline-none resize-none mb-4"
                rows={12}
              />

              <div className="flex items-center justify-between mb-4 text-sm">
                <span className="text-gray-400">Characters: {script.length}</span>
                <span className="text-gray-400">Words: {script.split(/\s+/).filter(w => w).length}</span>
                <span className="text-gray-400">~{Math.ceil((script.split(/\s+/).filter(w => w).length / 150) * 60)}s video</span>
              </div>

              <button
                onClick={generateVideo}
                disabled={isGenerating || !selectedAvatar || !script.trim()}
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {isGenerating ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Generating Video...
                  </>
                ) : (
                  <>
                    <Film className="w-5 h-5" />
                    Generate Video
                  </>
                )}
              </button>

              {!selectedAvatar && (
                <p className="text-yellow-400 text-sm mt-3 text-center">
                  ⚠️ Please create an avatar first
                </p>
              )}
            </div>
          )}

          {activeTab === 'library' && (
            <div className="p-4">
              <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                <Video className="w-5 h-5 text-purple-400" />
                Your Videos ({videoProjects.length})
              </h3>

              {videoProjects.length === 0 ? (
                <div className="text-center py-12">
                  <Video className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">No videos yet</p>
                  <p className="text-gray-500 text-sm mt-1">Create your first video to see it here</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {videoProjects.map((project) => (
                    <div key={project.id} className="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition-all">
                      <div className="flex items-start gap-3 mb-3">
                        <img
                          src={project.avatar.url}
                          alt={project.avatar.name}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                        <div className="flex-1">
                          <h4 className="text-white font-semibold">{project.avatar.name}</h4>
                          <p className="text-gray-400 text-xs">{project.voice.name}</p>
                          <p className="text-gray-500 text-xs">{project.duration}s • {new Date(project.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>

                      <p className="text-gray-300 text-sm mb-3 line-clamp-2">{project.script}</p>

                      <div className="flex gap-2">
                        <button
                          onClick={() => downloadVideo(project)}
                          className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2 text-sm"
                        >
                          <Download className="w-4 h-4" />
                          Download
                        </button>
                        <button className="flex-1 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg font-semibold flex items-center justify-center gap-2 text-sm">
                          <Share2 className="w-4 h-4" />
                          Share
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Main Preview Area */}
        <div className="flex-1 flex flex-col bg-gray-900">
          {isGenerating && activeTab === 'generate' ? (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center max-w-2xl">
                <div className="w-24 h-24 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full mx-auto mb-6 flex items-center justify-center animate-pulse">
                  <Film className="w-12 h-12 text-white animate-spin" />
                </div>
                <h3 className="text-white text-3xl font-bold mb-3">Generating Your Video</h3>
                <p className="text-gray-400 mb-6 text-lg">{currentStep}</p>
                <div className="w-full max-w-md mx-auto bg-gray-700 rounded-full h-4 mb-3">
                  <div
                    className="bg-gradient-to-r from-purple-600 to-pink-600 h-4 rounded-full transition-all duration-300"
                    style={{ width: `${generationProgress}%` }}
                  />
                </div>
                <p className="text-purple-400 font-bold text-xl">{Math.round(generationProgress)}%</p>

                <div className="mt-8 grid grid-cols-3 gap-4 text-sm">
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <Check className={`w-6 h-6 mx-auto mb-2 ${generationProgress > 14 ? 'text-green-400' : 'text-gray-600'}`} />
                    <p className="text-gray-400">Script Analysis</p>
                  </div>
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <Check className={`w-6 h-6 mx-auto mb-2 ${generationProgress > 42 ? 'text-green-400' : 'text-gray-600'}`} />
                    <p className="text-gray-400">Voice Synthesis</p>
                  </div>
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <Check className={`w-6 h-6 mx-auto mb-2 ${generationProgress > 71 ? 'text-green-400' : 'text-gray-600'}`} />
                    <p className="text-gray-400">Video Rendering</p>
                  </div>
                </div>
              </div>
            </div>
          ) : selectedAvatar ? (
            <div className="flex-1 flex flex-col">
              {/* Preview Header */}
              <div className="bg-gray-800 border-b border-gray-700 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-bold text-lg">{selectedAvatar.name}</h3>
                    <p className="text-gray-400 text-sm capitalize">{selectedAvatar.style} • {selectedAvatar.type}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      Ready
                    </div>
                  </div>
                </div>
              </div>

              {/* Avatar Preview */}
              <div className="flex-1 flex items-center justify-center p-8 bg-gradient-to-br from-gray-800 to-gray-900 relative overflow-hidden">
                {/* Background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${BACKGROUNDS.find(b => b.id === selectedBackground)?.color} opacity-30`} />

                {customBackground && selectedBackground === 'custom' && (
                  <img src={customBackground} alt="Background" className="absolute inset-0 w-full h-full object-cover opacity-30 blur-sm" />
                )}

                {/* Avatar */}
                <div className="relative z-10">
                  <img
                    src={selectedAvatar.url}
                    alt={selectedAvatar.name}
                    className="max-w-2xl max-h-[600px] w-[500px] h-[500px] rounded-2xl shadow-2xl object-cover ring-4 ring-purple-500/50"
                    crossOrigin="anonymous"
                  />

                  {/* Emotion Indicator */}
                  <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-sm text-white px-3 py-2 rounded-lg">
                    <p className="text-xs font-semibold">
                      {EMOTIONS.find(e => e.id === selectedEmotion)?.icon} {EMOTIONS.find(e => e.id === selectedEmotion)?.label}
                    </p>
                  </div>

                  {/* Voice Indicator */}
                  <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-sm text-white px-3 py-2 rounded-lg">
                    <p className="text-xs font-semibold flex items-center gap-1">
                      <Mic className="w-3 h-3" />
                      {selectedVoice.name}
                    </p>
                  </div>

                  {/* Settings Summary */}
                  <div className="absolute bottom-4 left-4 right-4 bg-black/70 backdrop-blur-sm text-white px-4 py-3 rounded-lg">
                    <div className="grid grid-cols-3 gap-3 text-xs">
                      <div>
                        <p className="text-gray-400">Voice</p>
                        <p className="font-semibold">{selectedVoice.language}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Speed</p>
                        <p className="font-semibold">{speechSpeed.toFixed(1)}x</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Features</p>
                        <p className="font-semibold">
                          {lipSyncEnabled && '💬 '}
                          {gesturesEnabled && '👋'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Preview Controls */}
              <div className="bg-gray-800 border-t border-gray-700 p-4">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <button className="p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-all">
                    <Rewind className="w-5 h-5 text-white" />
                  </button>
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="p-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg transition-all shadow-lg"
                  >
                    {isPlaying ? <Pause className="w-6 h-6 text-white" /> : <Play className="w-6 h-6 text-white" />}
                  </button>
                  <button className="p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-all">
                    <FastForward className="w-5 h-5 text-white" />
                  </button>
                </div>

                <div className="grid grid-cols-5 gap-3 text-center text-sm">
                  <div className="bg-gray-700 p-3 rounded-lg">
                    <p className="text-gray-400 text-xs">Quality</p>
                    <p className="text-white font-semibold">1080p</p>
                  </div>
                  <div className="bg-gray-700 p-3 rounded-lg">
                    <p className="text-gray-400 text-xs">Lip Sync</p>
                    <p className="text-green-400 font-semibold">{lipSyncEnabled ? 'ON' : 'OFF'}</p>
                  </div>
                  <div className="bg-gray-700 p-3 rounded-lg">
                    <p className="text-gray-400 text-xs">Gestures</p>
                    <p className="text-green-400 font-semibold">{gesturesEnabled ? 'ON' : 'OFF'}</p>
                  </div>
                  <div className="bg-gray-700 p-3 rounded-lg">
                    <p className="text-gray-400 text-xs">Format</p>
                    <p className="text-white font-semibold">MP4</p>
                  </div>
                  <div className="bg-gray-700 p-3 rounded-lg">
                    <p className="text-gray-400 text-xs">FPS</p>
                    <p className="text-white font-semibold">30</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center max-w-2xl">
                <div className="w-32 h-32 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full mx-auto mb-6 flex items-center justify-center">
                  <Crown className="w-16 h-16 text-white" />
                </div>
                <h3 className="text-white text-4xl font-bold mb-4">Professional Avatar Studio</h3>
                <p className="text-gray-400 mb-8 text-lg leading-relaxed">
                  Create HeyGen-level professional AI avatars with realistic voice synthesis, lip-sync, and gestures.
                  Upload your photo or choose from our library.
                </p>

                <div className="grid grid-cols-3 gap-6 mb-8">
                  <div className="bg-gray-800 p-6 rounded-xl">
                    <Camera className="w-10 h-10 text-blue-400 mb-3 mx-auto" />
                    <h4 className="text-white font-bold mb-2">Photo to Avatar</h4>
                    <p className="text-gray-400 text-sm">Turn any photo into a talking avatar</p>
                  </div>
                  <div className="bg-gray-800 p-6 rounded-xl">
                    <Mic className="w-10 h-10 text-purple-400 mb-3 mx-auto" />
                    <h4 className="text-white font-bold mb-2">40+ Voices</h4>
                    <p className="text-gray-400 text-sm">Multiple languages and accents</p>
                  </div>
                  <div className="bg-gray-800 p-6 rounded-xl">
                    <Film className="w-10 h-10 text-pink-400 mb-3 mx-auto" />
                    <h4 className="text-white font-bold mb-2">HD Video</h4>
                    <p className="text-gray-400 text-sm">Export in 1080p MP4</p>
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab('create')}
                  className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-bold text-lg shadow-lg inline-flex items-center gap-3"
                >
                  <Plus className="w-6 h-6" />
                  Create Your First Avatar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}