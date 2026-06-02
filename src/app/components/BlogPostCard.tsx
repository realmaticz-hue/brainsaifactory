import { useState, useRef, useEffect } from 'react';
import {
  Play, Pause, Download, Copy, Clock, Package, Volume2,
  Video as VideoIcon, Calendar, Pencil, Check, X, CheckSquare, Layers,
  Type, Image as ImageIcon, ChevronDown, ChevronUp, Tag, BarChart2,
  Search, FileText, Zap, AlertTriangle, Lightbulb, HelpCircle, BookOpen,
  Globe,
} from 'lucide-react';
import type { BlogPost } from '../utils/blogGenerator';
import type { EnhancedBlogPost, ViralHeadline } from '../utils/trendingBlogEnhancer';
import { VideoModal } from './VideoModal';
import { SocialMediaScheduler } from './SocialMediaScheduler';
import { AdStudio } from './AdStudio';
import { copyToClipboard } from '../utils/clipboard';
import { trackBlogView, trackBlogClick, trackBlogCopy, trackBlogDownload } from '../utils/analytics/analyticsTracker';
import { useAutoSave } from '../hooks/useAutoSave';
import { useUndoRedo } from '../hooks/useUndoRedo';
import { saveDraft, getDraft, hasDraft } from '../utils/draftManager';
import { toast } from 'sonner';
import { Undo, Redo } from 'lucide-react';

interface BlogPostCardProps {
  post: BlogPost;
  businessData?: any;
  isSelected?: boolean;
  onSelect?: (id: string, selected: boolean) => void;
  onContentChange?: (id: string, newContent: string) => void;
  onPublishToWordPress?: (post: BlogPost) => void;
  key?: any;
}

export function BlogPostCard({
  post,
  businessData,
  isSelected = false,
  onSelect,
  onContentChange,
  onPublishToWordPress,
}: BlogPostCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [copied, setCopied] = useState(false);
  const [isVoiceAvailable, setIsVoiceAvailable] = useState(true);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showScheduler, setShowScheduler] = useState(false);
  const [showAdStudio, setShowAdStudio] = useState(false);
  const [schedulePostType, setSchedulePostType] = useState<'text' | 'image' | 'video'>('text');
  const [showMeta, setShowMeta] = useState(false);

  // ── Inline editing with undo/redo
  const [isEditing, setIsEditing] = useState(false);
  const [lastSaveTime, setLastSaveTime] = useState<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Undo/Redo state
  const {
    state: editText,
    setState: setEditText,
    undo,
    redo,
    canUndo,
    canRedo,
    reset: resetHistory,
  } = useUndoRedo(post.content);

  // Load draft on mount
  useEffect(() => {
    const draft = getDraft(post.id);
    if (draft) {
      resetHistory(draft.content);
      setLastSaveTime(draft.savedAt);
    }
  }, [post.id]);

  // Auto-save functionality
  const { saveNow } = useAutoSave(
    editText,
    async (content) => {
      saveDraft(post.id, content, { seoTitle: post.seoTitle, metaDescription: post.metaDescription }, true);
      setLastSaveTime(Date.now());
    },
    {
      delay: 30000, // 30 seconds
      enabled: isEditing,
      onSave: () => {
        console.log('[AutoSave] Draft saved for post:', post.id);
      },
      onError: (error) => {
        console.error('[AutoSave] Failed to save draft:', error);
        toast.error('Failed to auto-save draft');
      },
    }
  );

  const intervalRef = useRef<number | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedAtRef = useRef<number>(0);

  const hasProductInfo =
    post.content.includes('$') ||
    post.content.toLowerCase().includes('product') ||
    post.content.toLowerCase().includes('item') ||
    post.content.toLowerCase().includes('price');

  const qualityScore = post.qualityScore ?? 0;
  const qualityColor = qualityScore >= 85 ? 'text-green-600 bg-green-50 border-green-200'
    : qualityScore >= 70 ? 'text-yellow-600 bg-yellow-50 border-yellow-200'
      : 'text-gray-500 bg-gray-50 border-gray-200';
  const qualityDot = qualityScore >= 85 ? 'bg-green-500' : qualityScore >= 70 ? 'bg-yellow-500' : 'bg-gray-400';

  useEffect(() => {
    if (!('speechSynthesis' in window)) {
      setIsVoiceAvailable(false);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (utteranceRef.current) window.speechSynthesis.cancel();
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Track blog view when component mounts
  useEffect(() => {
    trackBlogView(post.id, {
      duration: post.duration,
      qualityScore: post.qualityScore,
      character: post.character?.name,
    });
  }, [post.id]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(editText.length, editText.length);
    }
  }, [isEditing]);

  // ── Voice helpers ─────────────────────────────────────────

  const getVoiceSettings = (characterName: string) => {
    const settings: Record<string, any> = {
      Sarah: { pitch: 1.1, rate: 0.95, preferFemale: true },
      Marcus: { pitch: 0.8, rate: 0.9, preferMale: true },
      Alex: { pitch: 1.2, rate: 1.1, preferFemale: false },
      Jordan: { pitch: 1.0, rate: 0.95, preferMale: false },
    };
    return settings[characterName] || settings.Sarah;
  };

  const selectVoice = (voiceSettings: any) => {
    const voices = window.speechSynthesis.getVoices();
    if (!voices.length) return null;
    if (voiceSettings.preferFemale)
      return voices.find(v => /female|woman|samantha|victoria/i.test(v.name)) ||
        voices.find(v => v.lang.startsWith('en')) || voices[0];
    if (voiceSettings.preferMale)
      return voices.find(v => /male|man|daniel|fred/i.test(v.name)) ||
        voices.find(v => v.lang.startsWith('en')) || voices[0];
    return voices.find(v => v.lang.startsWith('en')) || voices[0];
  };

  const startProgressTracking = (startProgress: number) => {
    startTimeRef.current = Date.now();
    const duration = post.duration * 1000;
    intervalRef.current = window.setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const newProgress = Math.min(startProgress + elapsed / duration, 1);
      setProgress(newProgress);
      if (newProgress >= 1) {
        clearInterval(intervalRef.current!);
        intervalRef.current = null;
      }
    }, 50);
  };

  const startSpeech = () => {
    window.speechSynthesis.cancel();
    setProgress(0);
    pausedAtRef.current = 0;
    const utterance = new SpeechSynthesisUtterance(editText);
    utteranceRef.current = utterance;
    const voiceSettings = getVoiceSettings(post.character.name);

    const speak = () => {
      const voice = selectVoice(voiceSettings);
      if (voice) utterance.voice = voice;
      utterance.pitch = voiceSettings.pitch;
      utterance.rate = voiceSettings.rate;
      utterance.volume = 1.0;
      utterance.onstart = () => { setIsPlaying(true); startProgressTracking(0); };
      utterance.onend = () => {
        setIsPlaying(false); setProgress(0); pausedAtRef.current = 0;
        if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
      };
      utterance.onerror = () => {
        setIsPlaying(false); setProgress(0);
        if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
      };
      window.speechSynthesis.speak(utterance);
    };

    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) speak();
    else window.speechSynthesis.onvoiceschanged = speak;
  };

  const handlePlayPause = () => {
    if (!isVoiceAvailable) return;
    if (isPlaying) {
      window.speechSynthesis.pause();
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
      pausedAtRef.current = progress;
      setIsPlaying(false);
    } else {
      if (pausedAtRef.current > 0 && utteranceRef.current) {
        window.speechSynthesis.resume();
        setIsPlaying(true);
        startProgressTracking(pausedAtRef.current);
      } else {
        startSpeech();
      }
    }
  };

  const handleCopy = async () => {
    await copyToClipboard(editText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);

    // Track copy event
    trackBlogCopy(post.id, {
      duration: post.duration,
      wordCount: post.wordCount,
    });
  };

  const handleDownload = () => {
    const blob = new Blob([editText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${post.slug || `blog-post-${post.duration}s`}.txt`;

    // Track download event
    trackBlogDownload(post.id, {
      duration: post.duration,
      wordCount: post.wordCount,
      format: 'txt',
    });
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSaveEdit = () => {
    setIsEditing(false);
    onContentChange?.(post.id, editText);
    // Manual save to draft with autoSaved = false
    saveDraft(post.id, editText, { seoTitle: post.seoTitle, metaDescription: post.metaDescription }, false);
    saveNow(); // Trigger immediate save
    toast.success('Changes saved');
  };

  const handleCancelEdit = () => {
    resetHistory(post.content);
    setIsEditing(false);
  };

  // ── Render ────────────────────────────────────────────────

  return (
    <div
      className={`bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all flex flex-col ${isSelected ? 'ring-2 ring-purple-500 ring-offset-2' : ''
        }`}
    >
      {/* Header */}
      <div className={`bg-gradient-to-r p-4 relative ${post.duration === 7
        ? 'from-orange-500 to-rose-500'
        : 'from-purple-600 to-blue-600'
        }`}>
        {/* Selection checkbox */}
        {onSelect && (
          <button
            onClick={() => onSelect(post.id, !isSelected)}
            className={`absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center transition-all ${isSelected
              ? 'bg-white text-purple-600 shadow-md'
              : 'bg-white/25 text-white hover:bg-white/40'
              }`}
            title={isSelected ? 'Deselect post' : 'Select for campaign'}
          >
            {isSelected
              ? <CheckSquare className="w-4 h-4" />
              : <div className="w-4 h-4 border-2 border-white rounded" />}
          </button>
        )}

        <div className="flex items-center gap-3 text-white pr-8">
          <img
            src={post.character.avatar}
            alt={post.character.name}
            className="w-12 h-12 rounded-full object-cover border-2 border-white flex-shrink-0"
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm opacity-90 font-medium truncate">{post.character.name}</p>
            <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
              {(post as any).viralHeadlines && (post as any).viralHeadlines.length > 0 && (
                <span className="text-xs bg-gradient-to-r from-yellow-400 to-orange-400 text-gray-900 px-2 py-0.5 rounded-full font-bold animate-pulse">
                  🔥 TRENDING
                </span>
              )}
              {post.angleLabel && (
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-medium">
                  {post.angleLabel}
                </span>
              )}
              {hasProductInfo && (
                <span className="inline-flex items-center gap-1 text-xs bg-white/20 px-2 py-0.5 rounded-full">
                  <Package className="w-3 h-3" />
                  Products
                </span>
              )}
            </div>
          </div>
          <div className="ml-auto flex flex-col items-end gap-1 flex-shrink-0">
            <div className="flex items-center gap-1.5 bg-white/20 px-3 py-1 rounded-full">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-semibold">{post.duration}s</span>
            </div>
            <div className="flex items-center gap-1.5">
              {qualityScore > 0 && (
                <div className="flex items-center gap-1 bg-white/15 px-2 py-0.5 rounded-full">
                  <div className={`w-1.5 h-1.5 rounded-full ${qualityDot}`} />
                  <span className="text-xs text-white/90 font-semibold">Q{qualityScore}</span>
                </div>
              )}
              {(post as any).conversionScore && (
                <div className="flex items-center gap-1 bg-green-500/90 px-2 py-0.5 rounded-full" title="Conversion Score">
                  <span className="text-xs text-white font-bold">💰{(post as any).conversionScore}</span>
                </div>
              )}
              {(post as any).viralityScore && (
                <div className="flex items-center gap-1 bg-orange-500/90 px-2 py-0.5 rounded-full" title="Virality Score">
                  <span className="text-xs text-white font-bold">🔥{Math.round((post as any).viralityScore)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* SEO Title strip — shown when available */}
      {post.seoTitle && (
        <div className="bg-gray-50 border-b border-gray-100 px-4 py-2">
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-0.5">SEO Title</p>
          <p className="text-xs text-gray-700 font-medium leading-snug line-clamp-2">{post.seoTitle}</p>
        </div>
      )}

      {/* Content area */}
      <div className="p-4 flex flex-col flex-1">

        {/* Keyword badge */}
        {post.primaryKeyword && (
          <div className="flex items-center gap-1.5 mb-3 flex-wrap">
            <Tag className="w-3 h-3 text-purple-500 flex-shrink-0" />
            <span className="text-xs bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-full font-semibold">
              {post.primaryKeyword}
            </span>
            {post.secondaryKeywords?.slice(0, 2).map(kw => (
              <span key={kw} className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                {kw}
              </span>
            ))}
          </div>
        )}

        {/* Editable text */}
        <div className="relative mb-4">
          {isEditing ? (
            <>
              {/* Undo/Redo Buttons */}
              <div className="flex items-center gap-1 mb-2">
                <button
                  onClick={undo}
                  disabled={!canUndo}
                  className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Undo (⌘Z)"
                >
                  <Undo className="w-4 h-4" />
                </button>
                <button
                  onClick={redo}
                  disabled={!canRedo}
                  className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  title="Redo (⌘⇧Z)"
                >
                  <Redo className="w-4 h-4" />
                </button>
                <div className="h-4 w-px bg-gray-300 mx-1" />
                <span className="text-xs text-gray-500">
                  {canUndo ? `${Math.min(50, editText.length - post.content.length)} changes` : 'No changes'}
                </span>
              </div>

              <textarea
                ref={textareaRef}
                value={editText}
                onChange={e => setEditText(e.target.value)}
                className="w-full text-gray-700 leading-relaxed text-sm p-3 pr-10 rounded-lg border-2 border-purple-400 focus:outline-none focus:border-purple-600 resize-none bg-purple-50 min-h-[120px]"
                rows={post.duration === 30 ? 9 : 5}
              />
              <div className="flex items-center justify-between mt-2">
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveEdit}
                    className="flex-1 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1 hover:bg-purple-700 transition-colors"
                  >
                    <Check className="w-3.5 h-3.5" /> Save
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="flex-1 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 hover:bg-gray-200 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" /> Cancel
                  </button>
                </div>
                {lastSaveTime && (
                  <div className="text-xs text-gray-500">
                    Auto-saved {Math.floor((Date.now() - lastSaveTime) / 1000)}s ago
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="group relative">
              <p className="text-gray-700 leading-relaxed text-sm pr-8">{editText}</p>
              <button
                onClick={() => setIsEditing(true)}
                className="absolute top-0 right-0 w-7 h-7 bg-gray-100 hover:bg-purple-100 hover:text-purple-600 text-gray-400 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                title="Edit post content"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Word count + structure */}
        {!isEditing && post.wordCount && (
          <div className="flex items-center gap-2 mb-3 text-xs text-gray-400">
            <FileText className="w-3 h-3" />
            <span>{post.wordCount} words</span>
            {post.duration === 7 && <span className="text-gray-300">· hook → insight → open loop</span>}
            {post.duration === 30 && <span className="text-gray-300">· hook → problem → insight → proof → curiosity</span>}
          </div>
        )}

        {/* ── 30s Structure Breakdown Panel ───────────────── */}
        {!isEditing && post.duration === 30 && (() => {
          // Try to split content into the 5 structure parts by sentence
          const sentences = editText
            .split(/(?<=[.!?])\s+/)
            .map(s => s.trim())
            .filter(Boolean);

          const parts: { label: string; icon: React.ReactNode; color: string; text: string }[] = [];

          if (sentences.length >= 5) {
            parts.push({
              label: 'Hook',
              icon: <Zap className="w-3 h-3" />,
              color: 'bg-orange-50 border-orange-200 text-orange-800',
              text: sentences[0],
            });
            parts.push({
              label: 'Problem',
              icon: <AlertTriangle className="w-3 h-3" />,
              color: 'bg-red-50 border-red-200 text-red-800',
              text: sentences[1],
            });
            parts.push({
              label: 'Insight',
              icon: <Lightbulb className="w-3 h-3" />,
              color: 'bg-yellow-50 border-yellow-200 text-yellow-800',
              text: sentences[2],
            });
            parts.push({
              label: 'Mini Explanation',
              icon: <BookOpen className="w-3 h-3" />,
              color: 'bg-blue-50 border-blue-200 text-blue-800',
              text: sentences.slice(3, sentences.length - 1).join(' ') || sentences[3],
            });
            parts.push({
              label: 'Curiosity Ending',
              icon: <HelpCircle className="w-3 h-3" />,
              color: 'bg-purple-50 border-purple-200 text-purple-800',
              text: sentences[sentences.length - 1],
            });
          }

          if (parts.length === 0) return null;

          return (
            <div className="mb-3 rounded-xl border border-gray-100 overflow-hidden divide-y divide-gray-100">
              {parts.map(part => (
                <div key={part.label} className={`flex items-start gap-2 px-3 py-2 ${part.color}`}>
                  <div className="flex items-center gap-1.5 shrink-0 mt-0.5 w-[108px]">
                    {part.icon}
                    <span className="text-[10px] font-bold uppercase tracking-wide whitespace-nowrap">{part.label}</span>
                  </div>
                  <p className="text-xs leading-relaxed">{part.text}</p>
                </div>
              ))}
            </div>
          );
        })()}

        {/* Audio Controls */}
        {!isEditing && (
          <div className="mb-4">
            <div className="flex items-center gap-3 mb-1.5">
              <button
                onClick={handlePlayPause}
                disabled={!isVoiceAvailable}
                className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center hover:bg-purple-700 transition-colors disabled:opacity-50 flex-shrink-0"
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
              </button>
              <div className="flex-1 min-w-0">
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-600 to-blue-600 transition-all duration-100"
                    style={{ width: `${progress * 100}%` }}
                  />
                </div>
              </div>
              <span className="text-xs text-gray-500 w-8 text-right flex-shrink-0">
                {Math.round(progress * post.duration)}s
              </span>
            </div>
            <div className="flex items-center gap-1.5 ml-12">
              <Volume2 className="w-3 h-3 text-gray-400" />
              <p className="text-xs text-gray-400 truncate">AI Voice: {post.character.voiceType}</p>
            </div>
          </div>
        )}

        {/* Action buttons */}
        {!isEditing && (
          <div className="grid grid-cols-2 gap-2 mt-auto">
            <button
              onClick={handleCopy}
              className="px-3 py-2 border-2 border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-all flex items-center justify-center gap-1.5 text-gray-700 text-sm font-medium"
            >
              <Copy className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{copied ? 'Copied!' : 'Copy'}</span>
            </button>
            <button
              onClick={handleDownload}
              className="px-3 py-2 border-2 border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-all flex items-center justify-center gap-1.5 text-gray-700 text-sm font-medium"
            >
              <Download className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">Download</span>
            </button>

            {/* WordPress Publish Button */}
            {onPublishToWordPress && (
              <button
                onClick={() => onPublishToWordPress(post)}
                className="col-span-2 px-3 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all flex items-center justify-center gap-1.5 text-sm font-semibold shadow-md"
              >
                <Globe className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">Publish to WordPress</span>
              </button>
            )}
            <button
              onClick={() => setShowVideoModal(true)}
              className="px-3 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg hover:from-red-600 hover:to-pink-600 transition-all flex items-center justify-center gap-1.5 text-sm font-semibold shadow-md"
            >
              <VideoIcon className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">UGC Video</span>
            </button>

            {/* Schedule — split button with post type picker */}
            <div className="flex rounded-lg overflow-hidden border-2 border-green-500 shadow-md">
              {([
                { type: 'text' as const, Icon: Type, title: 'Text post' },
                { type: 'image' as const, Icon: ImageIcon, title: 'Image post' },
                { type: 'video' as const, Icon: VideoIcon, title: 'Video post' },
              ]).map(({ type, Icon, title }) => (
                <button
                  key={type}
                  onClick={() => setSchedulePostType(type)}
                  title={title}
                  className={`flex-1 flex items-center justify-center py-2 transition-all ${schedulePostType === type
                    ? 'bg-green-500 text-white'
                    : 'bg-white text-green-600 hover:bg-green-50'
                    }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </button>
              ))}
              <button
                onClick={() => setShowScheduler(true)}
                className="flex-[2] bg-gradient-to-r from-green-500 to-blue-500 text-white flex items-center justify-center gap-1.5 text-sm font-semibold hover:from-green-600 hover:to-blue-600 transition-all px-2"
              >
                <Calendar className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">Schedule</span>
              </button>
            </div>

            {/* Full-width Ad Studio button */}
            <button
              onClick={() => setShowAdStudio(true)}
              className="col-span-2 px-3 py-2.5 bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 text-white rounded-xl hover:from-violet-700 hover:via-purple-700 hover:to-pink-700 transition-all flex items-center justify-center gap-2 text-sm font-bold shadow-lg"
            >
              <Layers className="w-4 h-4 flex-shrink-0" />
              <span>Open Ad Studio</span>
              <span className="ml-auto text-xs bg-white/20 px-2 py-0.5 rounded-full">Text · Image · Video</span>
            </button>

            {/* SEO Metadata toggle */}
            {post.metaDescription && (
              <button
                onClick={() => setShowMeta(p => !p)}
                className="col-span-2 flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-xs text-gray-500 font-medium transition-all"
              >
                <div className="flex items-center gap-1.5">
                  <Search className="w-3.5 h-3.5 text-gray-400" />
                  SEO Metadata
                </div>
                <div className="flex items-center gap-2">
                  {qualityScore > 0 && (
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${qualityColor}`}>
                      Score {qualityScore}
                    </span>
                  )}
                  {showMeta ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </div>
              </button>
            )}
          </div>
        )}

        {/* Expanded SEO metadata panel */}
        {!isEditing && showMeta && post.metaDescription && (
          <div className="mt-3 bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Meta Description</p>
              <p className="text-xs text-gray-700 leading-relaxed">{post.metaDescription}</p>
            </div>
            {post.slug && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">URL Slug</p>
                <p className="text-xs text-blue-600 font-mono bg-blue-50 px-2 py-1 rounded">/{post.slug}</p>
              </div>
            )}
            {post.secondaryKeywords && post.secondaryKeywords.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Secondary Keywords</p>
                <div className="flex flex-wrap gap-1">
                  {post.secondaryKeywords.map(kw => (
                    <span key={kw} className="text-xs bg-white border border-gray-200 text-gray-600 px-2 py-0.5 rounded-full">{kw}</span>
                  ))}
                </div>
              </div>
            )}

            {/* ═══ TRENDING ENHANCEMENTS ═══ */}
            {(post as any).viralHeadlines && (post as any).viralHeadlines.length > 0 && (
              <>
                <div className="pt-3 border-t-2 border-purple-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-4 h-4 text-purple-600" />
                    <p className="text-xs font-bold text-purple-700 uppercase tracking-wide">🔥 Viral Headlines (A/B Test Ready)</p>
                  </div>
                  <div className="space-y-2">
                    {(post as any).viralHeadlines.slice(0, 3).map((vh: ViralHeadline, idx: number) => (
                      <div key={idx} className="bg-white border border-purple-200 rounded-lg p-2">
                        <p className="text-xs text-gray-800 font-medium leading-snug mb-1">{vh.headline}</p>
                        <div className="flex items-center gap-2 flex-wrap text-[10px]">
                          <span className="bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-semibold">
                            CTR {vh.predictedCTR.toFixed(1)}%
                          </span>
                          <span className="bg-pink-100 text-pink-700 px-1.5 py-0.5 rounded">
                            {vh.emotionalTrigger}
                          </span>
                          <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded capitalize">
                            {vh.platform}
                          </span>
                          <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded capitalize">
                            {vh.buyerIntent}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Trending Scores */}
                {((post as any).conversionScore || (post as any).viralityScore) && (
                  <div className="pt-3 border-t border-purple-200">
                    <div className="flex items-center gap-2 mb-2">
                      <BarChart2 className="w-4 h-4 text-green-600" />
                      <p className="text-xs font-bold text-green-700 uppercase tracking-wide">📈 Performance Scores</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {(post as any).conversionScore && (
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-2 text-center">
                          <p className="text-[10px] text-green-600 font-medium mb-0.5">Conversion</p>
                          <p className="text-lg font-black text-green-700">{(post as any).conversionScore}</p>
                          <div className="h-1 bg-green-200 rounded-full mt-1 overflow-hidden">
                            <div className="h-full bg-green-600 rounded-full" style={{ width: `${(post as any).conversionScore}%` }} />
                          </div>
                        </div>
                      )}
                      {(post as any).viralityScore && (
                        <div className="bg-gradient-to-br from-orange-50 to-red-50 border border-orange-200 rounded-lg p-2 text-center">
                          <p className="text-[10px] text-orange-600 font-medium mb-0.5">Virality</p>
                          <p className="text-lg font-black text-orange-700">{Math.round((post as any).viralityScore)}</p>
                          <div className="h-1 bg-orange-200 rounded-full mt-1 overflow-hidden">
                            <div className="h-full bg-orange-600 rounded-full" style={{ width: `${(post as any).viralityScore}%` }} />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Platform Fit */}
                {(post as any).platformFit && (
                  <div className="pt-3 border-t border-purple-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Layers className="w-4 h-4 text-blue-600" />
                      <p className="text-xs font-bold text-blue-700 uppercase tracking-wide">📱 Platform Optimization</p>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5">
                      {Object.entries((post as any).platformFit).map(([platform, score]: [string, any]) => (
                        <div key={platform} className="bg-white border border-gray-200 rounded p-1.5 text-center">
                          <p className="text-[9px] text-gray-500 font-medium capitalize mb-0.5">{platform}</p>
                          <p className={`text-xs font-bold ${score >= 80 ? 'text-green-600' : score >= 60 ? 'text-yellow-600' : 'text-gray-500'
                            }`}>{score}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Buyer Triggers */}
                {(post as any).buyerTriggers && (post as any).buyerTriggers.length > 0 && (
                  <div className="pt-3 border-t border-purple-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Lightbulb className="w-4 h-4 text-yellow-600" />
                      <p className="text-xs font-bold text-yellow-700 uppercase tracking-wide">🧠 Buyer Psychology</p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {(post as any).buyerTriggers.map((trigger: string, idx: number) => (
                        <span key={idx} className="text-[10px] bg-yellow-50 text-yellow-700 border border-yellow-200 px-2 py-1 rounded-full font-semibold">
                          ✓ {trigger}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Trending Keywords */}
                {(post as any).trendingKeywords && (post as any).trendingKeywords.length > 0 && (
                  <div className="pt-3 border-t border-purple-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-4 h-4 text-red-600" />
                      <p className="text-xs font-bold text-red-700 uppercase tracking-wide">🔥 Trending 2026</p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {(post as any).trendingKeywords.map((kw: string, idx: number) => (
                        <span key={idx} className="text-[10px] bg-gradient-to-r from-red-50 to-orange-50 text-red-700 border border-red-200 px-2 py-1 rounded-full font-bold">
                          🚀 {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            <div className="flex items-center justify-between text-xs text-gray-400 pt-1 border-t border-gray-200">
              <span>{post.duration === 30 ? 'Hook · Problem · Insight · Proof · Curiosity' : '7-second AI micro-blog'}</span>
              <span className="flex items-center gap-1"><BarChart2 className="w-3 h-3" />Quality Score: <strong className="text-gray-600">{qualityScore}/100</strong></span>
            </div>
          </div>
        )}
      </div>

      {/* Video Modal */}
      <VideoModal
        post={{ ...post, content: editText }}
        isopen={showVideoModal}
        onClose={() => setShowVideoModal(false)}
        businessData={businessData}
      />

      {/* Social Media Scheduler */}
      <SocialMediaScheduler
        post={{ ...post, content: editText }}
        isopen={showScheduler}
        onClose={() => setShowScheduler(false)}
        businessData={businessData}
        defaultPostType={schedulePostType}
        imageBlob={schedulePostType === 'image' ? undefined : undefined}
        videoBlob={schedulePostType === 'video' ? undefined : undefined}
      />

      {/* Ad Studio */}
      <AdStudio
        post={{ ...post, content: editText }}
        businessData={businessData}
        isopen={showAdStudio}
        onClose={() => setShowAdStudio(false)}
      />
    </div>
  );
}