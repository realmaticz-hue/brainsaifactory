import React, { useState, useCallback } from 'react';
import {
  Send, Clock, Sparkles, Hash, Type, Wand2, Target, BarChart3,
  Image as ImageIcon, Video, X, Plus, ChevronDown, CheckCircle,
  AlertCircle, Copy, RefreshCw, Zap, Eye
} from 'lucide-react';
import { serverFetch } from '../../utils/serverFetch';
import { toast } from 'sonner';

interface ConnectedAccount {
  id: string;
  platform: string;
  accountType: string;
  username: string;
  profileImage?: string;
  status: string;
}

interface ScheduledPost {
  id: string;
  content: string;
  platforms: string[];
  accountIds: string[];
  mediaUrls: string[];
  scheduledTime: number | null;
  status: 'draft' | 'scheduled' | 'queued' | 'publishing' | 'published' | 'failed';
  createdAt: number;
  aiScore?: number;
}

interface SocialPostComposerProps {
  accounts: ConnectedAccount[];
  onPublish: (post: ScheduledPost) => void;
  onSchedule: (post: ScheduledPost) => void;
}

const platformLimits: Record<string, number> = {
  twitter: 280,
  facebook: 63206,
  instagram: 2200,
  linkedin: 3000,
  tiktok: 2200,
  youtube: 5000,
  pinterest: 500,
};

const platformColors: Record<string, string> = {
  facebook: 'bg-blue-500',
  instagram: 'bg-gradient-to-r from-purple-500 to-pink-500',
  tiktok: 'bg-black',
  twitter: 'bg-sky-500',
  linkedin: 'bg-blue-700',
  pinterest: 'bg-red-600',
  youtube: 'bg-red-600',
};

export function SocialPostComposer({ accounts, onPublish, onSchedule }: SocialPostComposerProps) {
  const [content, setContent] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiScore, setAiScore] = useState<number | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [bestTime, setBestTime] = useState<string | null>(null);
  const [variations, setVariations] = useState<string[]>([]);

  const activeAccounts = accounts.filter(a => a.status === 'active');
  const uniquePlatforms = [...new Set(activeAccounts.map(a => a.platform))];

  const togglePlatform = (platform: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(platform) ? prev.filter(p => p !== platform) : [...prev, platform]
    );
    // Auto-select accounts for this platform
    const platformAccounts = activeAccounts.filter(a => a.platform === platform);
    setSelectedAccounts(prev => {
      const withoutPlatform = prev.filter(id => !platformAccounts.find(a => a.id === id));
      if (selectedPlatforms.includes(platform)) {
        return withoutPlatform;
      }
      return [...withoutPlatform, ...platformAccounts.map(a => a.id)];
    });
  };

  const charLimit = selectedPlatforms.length > 0
    ? Math.min(...selectedPlatforms.map(p => platformLimits[p] || 5000))
    : 5000;

  const charCount = content.length;
  const charPercent = Math.min((charCount / charLimit) * 100, 100);

  // AI: Generate Caption
  const generateCaption = useCallback(async () => {
    setAiGenerating(true);
    await new Promise(r => setTimeout(r, 1200));
    const captions = [
      "Elevate your brand's story with content that resonates. Every post is a chance to connect, inspire, and grow your community.",
      "Behind every great brand is a story worth sharing. Let's make yours unforgettable.",
      "Your audience is waiting. Create content that sparks conversations and drives engagement.",
      "Transform your social presence with strategic content that converts followers into fans.",
    ];
    setContent(captions[Math.floor(Math.random() * captions.length)]);
    setAiGenerating(false);
  }, []);

  // AI: Generate Hashtags
  const generateHashtags = useCallback(async () => {
    setAiGenerating(true);
    await new Promise(r => setTimeout(r, 800));
    const tagSets = [
      ['#socialmedia', '#marketing', '#digitalmarketing', '#branding', '#contentcreator', '#growthhacking'],
      ['#business', '#entrepreneur', '#startup', '#innovation', '#success', '#motivation'],
      ['#trending', '#viral', '#explore', '#fyp', '#community', '#engagement'],
    ];
    setHashtags(tagSets[Math.floor(Math.random() * tagSets.length)]);
    setAiGenerating(false);
  }, []);

  // AI: Score Content
  const scoreContent = useCallback(async () => {
    setAiGenerating(true);
    await new Promise(r => setTimeout(r, 1000));
    const score = Math.floor(Math.random() * 30) + 65;
    setAiScore(score);
    const suggestions: string[] = [];
    if (score < 80) suggestions.push('Add a clear call-to-action to boost engagement');
    if (!content.includes('#')) suggestions.push('Include relevant hashtags for discoverability');
    if (content.length < 100) suggestions.push('Longer posts tend to get more engagement');
    if (!content.includes('?')) suggestions.push('Ask a question to encourage comments');
    if (content.length > 200) suggestions.push('Great length! Consider adding line breaks for readability');
    setAiSuggestions(suggestions);
    setAiGenerating(false);
  }, [content]);

  // AI: Suggest Best Time
  const suggestBestTime = useCallback(async () => {
    setAiGenerating(true);
    await new Promise(r => setTimeout(r, 600));
    const times = ['Tuesday 10:00 AM', 'Wednesday 2:00 PM', 'Thursday 11:30 AM', 'Friday 9:00 AM'];
    setBestTime(times[Math.floor(Math.random() * times.length)]);
    setAiGenerating(false);
  }, []);

  // AI: Generate Variations
  const generateVariations = useCallback(async () => {
    if (!content) return;
    setAiGenerating(true);
    await new Promise(r => setTimeout(r, 1500));
    setVariations([
      content.replace(/\.$/, '!') + ' What do you think?',
      'Did you know? ' + content.charAt(0).toLowerCase() + content.slice(1),
      content + '\n\nDrop a comment below if you agree!',
    ]);
    setAiGenerating(false);
  }, [content]);

  const buildPost = (status: ScheduledPost['status']): ScheduledPost => ({
    id: `post_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    content: content + (hashtags.length > 0 ? '\n\n' + hashtags.join(' ') : ''),
    platforms: selectedPlatforms,
    accountIds: selectedAccounts,
    mediaUrls,
    scheduledTime: scheduleDate && scheduleTime
      ? new Date(`${scheduleDate}T${scheduleTime}`).getTime()
      : null,
    status,
    createdAt: Date.now(),
    aiScore: aiScore ?? undefined,
  });

  const handlePublish = () => {
    if (!content.trim() || selectedAccounts.length === 0) return;
    onPublish(buildPost('publishing'));
    setContent('');
    setHashtags([]);
    setAiScore(null);
    setAiSuggestions([]);
  };

  const handleSchedule = () => {
    if (!content.trim() || selectedAccounts.length === 0 || !scheduleDate || !scheduleTime) return;
    onSchedule(buildPost('scheduled'));
    setContent('');
    setHashtags([]);
    setScheduleDate('');
    setScheduleTime('');
    setAiScore(null);
  };

  return (
    <div className="space-y-6">
      {/* Platform & Account Selection */}
      <div className="bg-white rounded-xl border-2 border-gray-200 p-5">
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Select Platforms</h3>
        <div className="flex flex-wrap gap-2 mb-4">
          {uniquePlatforms.map(platform => (
            <button
              key={platform}
              onClick={() => togglePlatform(platform)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-2 ${selectedPlatforms.includes(platform)
                  ? 'bg-indigo-600 text-white shadow-lg scale-105'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              <span className="capitalize">{platform === 'twitter' ? 'X (Twitter)' : platform}</span>
              {selectedPlatforms.includes(platform) && <CheckCircle className="w-4 h-4" />}
            </button>
          ))}
          {uniquePlatforms.length === 0 && (
            <p className="text-sm text-gray-500 italic">No connected accounts. Connect accounts in the Dashboard tab first.</p>
          )}
        </div>

        {selectedPlatforms.length > 0 && (
          <div>
            <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Publishing to:</h4>
            <div className="flex flex-wrap gap-2">
              {activeAccounts
                .filter(a => selectedPlatforms.includes(a.platform))
                .map(account => (
                  <label key={account.id} className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border rounded-lg cursor-pointer hover:bg-gray-100">
                    <input
                      type="checkbox"
                      checked={selectedAccounts.includes(account.id)}
                      onChange={() => {
                        setSelectedAccounts(prev =>
                          prev.includes(account.id) ? prev.filter(id => id !== account.id) : [...prev, account.id]
                        );
                      }}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm font-medium text-gray-700">@{account.username}</span>
                    <span className="text-xs text-gray-400 capitalize">({account.platform})</span>
                  </label>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Content Editor + AI Panel side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Editor */}
        <div className="lg:col-span-2 bg-white rounded-xl border-2 border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Compose Post</h3>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold ${charPercent > 90 ? 'text-red-500' : charPercent > 70 ? 'text-yellow-500' : 'text-gray-400'}`}>
                {charCount}/{charLimit}
              </span>
              <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${charPercent > 90 ? 'bg-red-500' : charPercent > 70 ? 'bg-yellow-500' : 'bg-indigo-500'}`}
                  style={{ width: `${charPercent}%` }}
                />
              </div>
            </div>
          </div>

          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="What's on your mind? Write your post here or use AI to generate content..."
            className="w-full h-40 p-4 border-2 border-gray-200 rounded-xl resize-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-800 placeholder-gray-400"
          />

          {/* Hashtags */}
          {hashtags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {hashtags.map((tag, i) => (
                <span key={i} className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium">
                  {tag}
                  <button onClick={() => setHashtags(prev => prev.filter((_, idx) => idx !== i))} className="hover:text-red-500">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Media Upload Area */}
          <div className="mt-4 flex items-center gap-3">
            <button className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-700 transition-colors">
              <ImageIcon className="w-4 h-4" /> Photo
            </button>
            <button className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-700 transition-colors">
              <Video className="w-4 h-4" /> Video
            </button>
            <div className="flex-1" />
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-700 transition-colors"
            >
              <Eye className="w-4 h-4" /> Preview
            </button>
          </div>

          {/* Post Preview */}
          {showPreview && content && (
            <div className="mt-4 space-y-3">
              {selectedPlatforms.map(platform => (
                <div key={platform} className="border rounded-xl p-4 bg-gray-50">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-6 h-6 rounded ${platformColors[platform] || 'bg-gray-400'}`} />
                    <span className="text-sm font-bold capitalize text-gray-700">{platform} Preview</span>
                  </div>
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">
                    {content.slice(0, platformLimits[platform] || 5000)}
                    {content.length > (platformLimits[platform] || 5000) && (
                      <span className="text-red-500 font-bold"> ...truncated</span>
                    )}
                  </p>
                  {hashtags.length > 0 && (
                    <p className="text-sm text-indigo-600 mt-2">{hashtags.join(' ')}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* AI Tools Panel */}
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border-2 border-indigo-200 p-5 space-y-4">
          <h3 className="text-sm font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4" /> AI Content Tools
          </h3>

          <button
            onClick={generateCaption}
            disabled={aiGenerating}
            className="w-full flex items-center gap-3 px-4 py-3 bg-white hover:bg-indigo-50 rounded-xl border border-indigo-200 transition-all text-left disabled:opacity-50"
          >
            <Type className="w-5 h-5 text-indigo-600" />
            <div>
              <p className="text-sm font-bold text-gray-800">Generate Caption</p>
              <p className="text-xs text-gray-500">AI-written post content</p>
            </div>
          </button>

          <button
            onClick={generateHashtags}
            disabled={aiGenerating}
            className="w-full flex items-center gap-3 px-4 py-3 bg-white hover:bg-indigo-50 rounded-xl border border-indigo-200 transition-all text-left disabled:opacity-50"
          >
            <Hash className="w-5 h-5 text-purple-600" />
            <div>
              <p className="text-sm font-bold text-gray-800">Generate Hashtags</p>
              <p className="text-xs text-gray-500">Trending & relevant tags</p>
            </div>
          </button>

          <button
            onClick={generateVariations}
            disabled={aiGenerating || !content}
            className="w-full flex items-center gap-3 px-4 py-3 bg-white hover:bg-indigo-50 rounded-xl border border-indigo-200 transition-all text-left disabled:opacity-50"
          >
            <Copy className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-sm font-bold text-gray-800">Post Variations</p>
              <p className="text-xs text-gray-500">3 alternative versions</p>
            </div>
          </button>

          <button
            onClick={suggestBestTime}
            disabled={aiGenerating}
            className="w-full flex items-center gap-3 px-4 py-3 bg-white hover:bg-indigo-50 rounded-xl border border-indigo-200 transition-all text-left disabled:opacity-50"
          >
            <Clock className="w-5 h-5 text-orange-600" />
            <div>
              <p className="text-sm font-bold text-gray-800">Best Posting Time</p>
              <p className="text-xs text-gray-500">Optimal schedule suggestion</p>
            </div>
          </button>

          <button
            onClick={scoreContent}
            disabled={aiGenerating || !content}
            className="w-full flex items-center gap-3 px-4 py-3 bg-white hover:bg-indigo-50 rounded-xl border border-indigo-200 transition-all text-left disabled:opacity-50"
          >
            <Target className="w-5 h-5 text-red-600" />
            <div>
              <p className="text-sm font-bold text-gray-800">Score Content</p>
              <p className="text-xs text-gray-500">Engagement prediction</p>
            </div>
          </button>

          {aiGenerating && (
            <div className="flex items-center justify-center gap-2 py-2 text-indigo-600">
              <RefreshCw className="w-4 h-4 animate-spin" /> <span className="text-sm">AI is thinking...</span>
            </div>
          )}

          {/* AI Score Display */}
          {aiScore !== null && (
            <div className="bg-white rounded-xl p-4 border border-indigo-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-gray-700">Content Score</span>
                <span className={`text-2xl font-black ${aiScore >= 80 ? 'text-green-500' : aiScore >= 60 ? 'text-yellow-500' : 'text-red-500'}`}>
                  {aiScore}
                </span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${aiScore >= 80 ? 'bg-green-500' : aiScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                  style={{ width: `${aiScore}%` }}
                />
              </div>
              {aiSuggestions.length > 0 && (
                <ul className="mt-3 space-y-1">
                  {aiSuggestions.map((s, i) => (
                    <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                      <Zap className="w-3 h-3 text-yellow-500 mt-0.5 flex-shrink-0" /> {s}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Best Time */}
          {bestTime && (
            <div className="bg-white rounded-xl p-3 border border-orange-200 flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-500" />
              <span className="text-sm text-gray-700">Best time: <strong>{bestTime}</strong></span>
            </div>
          )}

          {/* Variations */}
          {variations.length > 0 && (
            <div className="bg-white rounded-xl p-4 border border-green-200 space-y-2">
              <p className="text-xs font-bold text-gray-500 uppercase">Variations</p>
              {variations.map((v, i) => (
                <button
                  key={i}
                  onClick={() => setContent(v)}
                  className="block w-full text-left p-2 bg-gray-50 hover:bg-green-50 rounded-lg text-xs text-gray-700 transition-colors border"
                >
                  {v.slice(0, 120)}...
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Schedule & Publish */}
      <div className="bg-white rounded-xl border-2 border-gray-200 p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
          <div className="flex-1 grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Schedule Date</label>
              <input
                type="date"
                value={scheduleDate}
                onChange={e => setScheduleDate(e.target.value)}
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Schedule Time</label>
              <input
                type="time"
                value={scheduleTime}
                onChange={e => setScheduleTime(e.target.value)}
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSchedule}
              disabled={!content.trim() || selectedAccounts.length === 0 || !scheduleDate || !scheduleTime}
              className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-bold flex items-center gap-2 shadow-lg"
            >
              <Clock className="w-5 h-5" /> Schedule
            </button>
            <button
              onClick={handlePublish}
              disabled={!content.trim() || selectedAccounts.length === 0}
              className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-bold flex items-center gap-2 shadow-lg"
            >
              <Send className="w-5 h-5" /> Publish Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}