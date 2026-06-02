import { useEffect, useRef, useState } from 'react';
import { X, Play, Pause, Edit2, Share2, Calendar } from 'lucide-react';
import { BlogPost } from '../App';
import { VideoCharacter } from './VideoCharacter';
import { VideoRecorder } from './VideoRecorder';
import { AdEditor } from './AdEditor';
import { MultiPlatformExporter } from './MultiPlatformExporter';
import { SocialMediaScheduler } from './SocialMediaScheduler';
import { generateAdCopy, AdCopyVariant } from '../utils/adCopyGenerator';

interface VideoModalProps {
  post: BlogPost;
  isopen: boolean;
  onClose: () => void;
  businessData?: any;
}

export function VideoModal({ post, isopen, onClose, businessData = {} }: VideoModalProps) {
  const videoCanvasRef = useRef<HTMLCanvasElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [showAdEditor, setShowAdEditor] = useState(false);
  const [showExporter, setShowExporter] = useState(false);
  const [showScheduler, setShowScheduler] = useState(false);
  const [adCopyVariants, setAdCopyVariants] = useState<AdCopyVariant[]>([]);
  const [selectedAdCopy, setSelectedAdCopy] = useState<AdCopyVariant | null>(null);

  // Generate ad copy variants
  useEffect(() => {
    if (isopen && businessData) {
      const variants = generateAdCopy(businessData, post.duration, 'all');
      setAdCopyVariants(variants);
      setSelectedAdCopy(variants[0] || null);
    }
  }, [isopen, businessData, post.duration]);

  // Handle Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isopen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';

      // Cleanup speech synthesis
      if (utteranceRef.current) {
        window.speechSynthesis.cancel();
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isopen, onClose]);

  const getVoiceSettings = (characterName: string) => {
    const settings = {
      Sarah: { pitch: 1.1, rate: 0.95, preferFemale: true },
      Marcus: { pitch: 0.8, rate: 0.9, preferMale: true },
      Alex: { pitch: 1.2, rate: 1.1, preferFemale: false },
      Jordan: { pitch: 1.0, rate: 0.95, preferMale: false }
    };
    return settings[characterName as keyof typeof settings] || settings.Sarah;
  };

  const selectVoice = (voiceSettings: any) => {
    const voices = window.speechSynthesis.getVoices();
    if (voices.length === 0) return null;

    let selectedVoice = null;
    if (voiceSettings.preferFemale) {
      selectedVoice = voices.find(voice =>
        voice.name.toLowerCase().includes('female') ||
        voice.name.toLowerCase().includes('samantha')
      );
    } else if (voiceSettings.preferMale) {
      selectedVoice = voices.find(voice =>
        voice.name.toLowerCase().includes('male') ||
        voice.name.toLowerCase().includes('daniel')
      );
    }

    if (!selectedVoice) {
      selectedVoice = voices.find(voice => voice.lang.startsWith('en'));
    }

    return selectedVoice || voices[0];
  };

  const handlePlayPause = () => {
    if (isPlaying) {
      window.speechSynthesis.pause();
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setIsPlaying(false);
    } else {
      if (progress > 0 && utteranceRef.current) {
        window.speechSynthesis.resume();
        setIsPlaying(true);
        startProgressTracking(progress);
      } else {
        startSpeech();
      }
    }
  };

  const startSpeech = () => {
    window.speechSynthesis.cancel();
    setProgress(0);

    const utterance = new SpeechSynthesisUtterance(post.content);
    utteranceRef.current = utterance;

    const voiceSettings = getVoiceSettings(post.character.name);

    const setVoiceAndSpeak = () => {
      const voice = selectVoice(voiceSettings);
      if (voice) {
        utterance.voice = voice;
      }

      utterance.pitch = voiceSettings.pitch;
      utterance.rate = voiceSettings.rate;
      utterance.volume = 1.0;

      utterance.onstart = () => {
        setIsPlaying(true);
        startProgressTracking(0);
      };

      utterance.onend = () => {
        setIsPlaying(false);
        setProgress(0);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };

      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        setIsPlaying(false);
        setProgress(0);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };

      window.speechSynthesis.speak(utterance);
    };

    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      setVoiceAndSpeak();
    } else {
      window.speechSynthesis.onvoiceschanged = () => {
        setVoiceAndSpeak();
      };
    }
  };

  const startProgressTracking = (startProgress: number) => {
    startTimeRef.current = Date.now();
    const duration = post.duration * 1000;

    intervalRef.current = window.setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const additionalProgress = elapsed / duration;
      const newProgress = Math.min(startProgress + additionalProgress, 1);
      setProgress(newProgress);

      if (newProgress >= 1) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    }, 50);
  };

  if (!isopen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
        <div
          ref={modalRef}
          className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full my-8"
        >
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-blue-600 p-6 flex items-center justify-between text-white z-10">
            <div className="flex items-center gap-3">
              <img
                src={post.character.avatar}
                alt={post.character.name}
                className="w-12 h-12 rounded-full object-cover border-2 border-white"
              />
              <div>
                <h3 className="text-xl font-bold">{post.character.name}'s UGC Ad Campaign</h3>
                <p className="text-sm opacity-90">{post.duration}s • High-Engagement Content</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex flex-col lg:flex-row">
            {/* Left Panel - Video & Recording */}
            <div className="lg:w-1/2 p-6 space-y-6">
              {/* Video Character Display */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-gray-900 font-semibold flex items-center gap-2">
                    🎬 Video Character
                  </h3>
                  <button
                    onClick={handlePlayPause}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 font-semibold shadow-lg"
                  >
                    {isPlaying ? (
                      <>
                        <Pause className="w-4 h-4" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
                        Play
                      </>
                    )}
                  </button>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-4">
                  <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                    <VideoCharacter
                      character={post.character}
                      isPlaying={isPlaying}
                      progress={progress}
                      duration={post.duration}
                    />
                  </div>
                </div>
              </div>

              {/* Recording Controls */}
              <div className="space-y-3">
                <h3 className="text-gray-900 font-semibold flex items-center gap-2">
                  🎥 Record Video
                </h3>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-xs text-yellow-800">
                    <strong>Steps:</strong> 1) Click "Record Video" 2) Click "Play" 3) Stop recording when done
                  </p>
                </div>
                <VideoRecorder
                  canvasRef={videoCanvasRef}
                  onRecordingComplete={(blob) => {
                    setRecordedBlob(blob);
                    console.log('Video recorded:', blob.size, 'bytes');
                  }}
                />
              </div>
            </div>

            {/* Right Panel - Ad Copy & Export */}
            <div className="lg:w-1/2 bg-gray-50 p-6 space-y-6">
              {/* Ad Copy Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-gray-900 font-semibold flex items-center gap-2">
                    ✨ AI-Generated Ad Copy
                  </h3>
                  <button
                    onClick={() => setShowAdEditor(true)}
                    className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors flex items-center gap-2 text-sm font-semibold"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </button>
                </div>

                {selectedAdCopy && (
                  <div className="bg-white rounded-xl shadow-md p-4 space-y-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Headline</p>
                      <p className="text-lg font-bold text-gray-900">{selectedAdCopy.headline}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Body</p>
                      <p className="text-sm text-gray-700">{selectedAdCopy.body}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Call-to-Action</p>
                        <p className="text-sm font-bold text-purple-600">{selectedAdCopy.cta}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-xs text-gray-500">Engagement Score:</div>
                        <div className="px-2 py-1 bg-green-100 text-green-800 rounded-lg font-bold text-sm">
                          {selectedAdCopy.score}/100
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Ad Copy Variants */}
                {adCopyVariants.length > 1 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-gray-600">Try other variants:</p>
                    <div className="grid grid-cols-2 gap-2">
                      {adCopyVariants.slice(1, 5).map((variant, i) => (
                        <button
                          key={i}
                          onClick={() => setSelectedAdCopy(variant)}
                          className="p-2 bg-white rounded-lg border-2 border-gray-200 hover:border-purple-400 transition-all text-left"
                        >
                          <p className="text-xs font-semibold text-gray-900 truncate">{variant.headline}</p>
                          <p className="text-xs text-gray-500">Score: {variant.score}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Export Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-gray-900 font-semibold flex items-center gap-2">
                    🚀 Export to Platforms
                  </h3>
                  <button
                    onClick={() => setShowExporter(!showExporter)}
                    className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors flex items-center gap-2 text-sm font-semibold"
                  >
                    <Share2 className="w-4 h-4" />
                    {showExporter ? 'Hide' : 'Show'}
                  </button>
                </div>

                {showExporter && selectedAdCopy && (
                  <MultiPlatformExporter
                    post={post}
                    adCopy={selectedAdCopy}
                    videoBlob={recordedBlob || undefined}
                    onExport={(platform, data) => {
                      console.log(`Exporting to ${platform}:`, data);
                    }}
                  />
                )}
              </div>

              {/* Tips */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-4">
                <h4 className="text-blue-900 font-semibold mb-2 text-sm">💡 Pro Tips</h4>
                <ul className="text-xs text-blue-800 space-y-1.5">
                  <li>✓ Test multiple ad copy variants for best results</li>
                  <li>✓ Use 7s videos for quick hooks, 30s for storytelling</li>
                  <li>✓ Export to all platforms and compare performance</li>
                  <li>✓ Add product links in platform descriptions</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Ad Editor Modal */}
      {showAdEditor && selectedAdCopy && (
        <AdEditor
          isopen={showAdEditor}
          onClose={() => setShowAdEditor(false)}
          post={post}
          adCopy={selectedAdCopy}
          businessData={businessData}
        />
      )}
    </>
  );
}