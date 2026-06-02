import { useState } from 'react';
import { X, Wand2, FileText, Video } from 'lucide-react';
import {
  VIDEO_RESOLUTIONS,
  VideoResolution,
  ScriptPrompt,
  generateVideoScript
} from '../utils/videoResolutions';
import { CustomAvatar } from '../utils/avatarGenerator';

interface VideoScriptCreatorProps {
  isopen: boolean;
  onClose: () => void;
  onCreateVideo: (script: string, resolution: VideoResolution, avatar: CustomAvatar | null) => void;
  avatar?: CustomAvatar | null;
}

export function VideoScriptCreator({ isopen, onClose, onCreateVideo, avatar = null }: VideoScriptCreatorProps) {
  const [inputType, setInputType] = useState<'script' | 'prompt'>('prompt');
  const [content, setContent] = useState('');
  const [duration, setDuration] = useState(30);
  const [selectedResolution, setSelectedResolution] = useState<VideoResolution>(
    VIDEO_RESOLUTIONS.find(r => r.id === 'widescreen-fhd')!
  );
  const [style, setStyle] = useState('professional');
  const [mood, setMood] = useState('engaging');
  const [generatedScript, setGeneratedScript] = useState('');

  const handleGenerate = () => {
    const prompt: ScriptPrompt = {
      type: inputType,
      content,
      duration,
      style,
      mood
    };

    const script = generateVideoScript(prompt);
    setGeneratedScript(script);
  };

  const handleCreate = () => {
    const finalScript = inputType === 'script' ? content : generatedScript;
    onCreateVideo(finalScript, selectedResolution, avatar);
    onClose();
  };

  if (!isopen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 flex items-center justify-between text-white">
            <div>
              <h2 className="text-2xl font-bold">Video Script Creator</h2>
              <p className="text-sm opacity-90">Create videos from scripts or AI prompts</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex flex-col lg:flex-row">
            {/* Left Panel - Input */}
            <div className="lg:w-1/2 p-6 space-y-6 border-r border-gray-200">
              {/* Input Type Toggle */}
              <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => setInputType('prompt')}
                  className={`flex-1 px-4 py-2 rounded-lg transition-all flex items-center justify-center gap-2 ${inputType === 'prompt' ? 'bg-white shadow-md' : 'hover:bg-white/50'
                    }`}
                >
                  <Wand2 className="w-4 h-4" />
                  <span>AI Prompt</span>
                </button>
                <button
                  onClick={() => setInputType('script')}
                  className={`flex-1 px-4 py-2 rounded-lg transition-all flex items-center justify-center gap-2 ${inputType === 'script' ? 'bg-white shadow-md' : 'hover:bg-white/50'
                    }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>Full Script</span>
                </button>
              </div>

              {/* Content Input */}
              <div>
                <label className="block text-sm font-semibold mb-2">
                  {inputType === 'prompt' ? 'Describe Your Video' : 'Enter Your Script'}
                </label>
                <textarea
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder={
                    inputType === 'prompt'
                      ? 'E.g., A video about our new product launch, highlighting the innovative features and customer benefits...'
                      : 'Write your complete video script here...'
                  }
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none resize-none"
                  rows={8}
                />
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Video Duration: {duration} seconds
                </label>
                <input
                  type="range"
                  min="7"
                  max="120"
                  step="1"
                  value={duration}
                  onChange={e => setDuration(parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>7s</span>
                  <span>30s</span>
                  <span>60s</span>
                  <span>120s</span>
                </div>
              </div>

              {/* AI Prompt Settings */}
              {inputType === 'prompt' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Style</label>
                    <select
                      value={style}
                      onChange={e => setStyle(e.target.value)}
                      className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none"
                    >
                      <option value="professional">Professional</option>
                      <option value="casual">Casual</option>
                      <option value="energetic">Energetic</option>
                      <option value="educational">Educational</option>
                      <option value="storytelling">Storytelling</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">Mood</label>
                    <select
                      value={mood}
                      onChange={e => setMood(e.target.value)}
                      className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none"
                    >
                      <option value="engaging">Engaging</option>
                      <option value="inspiring">Inspiring</option>
                      <option value="informative">Informative</option>
                      <option value="exciting">Exciting</option>
                      <option value="calm">Calm</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Generate Button */}
              {inputType === 'prompt' && (
                <button
                  onClick={handleGenerate}
                  disabled={!content.trim()}
                  className="w-full px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Wand2 className="w-5 h-5" />
                  Generate Script
                </button>
              )}
            </div>

            {/* Right Panel - Resolution & Preview */}
            <div className="lg:w-1/2 p-6 space-y-6">
              {/* Resolution Selector */}
              <div>
                <label className="block text-sm font-semibold mb-3">Video Resolution</label>
                <div className="space-y-2">
                  {VIDEO_RESOLUTIONS.filter(r => r.id !== 'custom').map(resolution => (
                    <button
                      key={resolution.id}
                      onClick={() => setSelectedResolution(resolution)}
                      className={`w-full p-4 border-2 rounded-lg text-left transition-all ${selectedResolution.id === resolution.id
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 hover:border-indigo-300'
                        }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-semibold">{resolution.name}</p>
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {resolution.width}x{resolution.height}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mb-1">{resolution.description}</p>
                      <div className="flex gap-1 flex-wrap">
                        {resolution.bestFor.slice(0, 3).map(platform => (
                          <span key={platform} className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">
                            {platform}
                          </span>
                        ))}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Generated Script Preview */}
              {generatedScript && (
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-4">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-indigo-600" />
                    Generated Script
                  </h4>
                  <div className="bg-white rounded-lg p-4 max-h-64 overflow-y-auto">
                    <pre className="text-sm whitespace-pre-wrap">{generatedScript}</pre>
                  </div>
                </div>
              )}

              {/* Avatar Info */}
              {avatar && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm font-semibold text-green-900 mb-2">
                    ✓ Avatar Selected
                  </p>
                  <div className="flex items-center gap-3">
                    <img
                      src={avatar.imageUrl}
                      alt={avatar.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-semibold text-sm">{avatar.name}</p>
                      <p className="text-xs text-gray-600">{avatar.type} avatar</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">💡 Tips</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>✓ Widescreen (16:9) perfect for YouTube, desktop</li>
                  <li>✓ Vertical (9:16) ideal for TikTok, Stories</li>
                  <li>✓ Square (1:1) works well on all platforms</li>
                  <li>✓ Longer scripts need more duration</li>
                </ul>
              </div>

              {/* Create Button */}
              <button
                onClick={handleCreate}
                disabled={!content.trim() && !generatedScript}
                className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-700 hover:to-blue-700 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Video className="w-5 h-5" />
                Create Video
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
