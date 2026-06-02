import React, { useState, useEffect } from 'react';
import {
  Facebook, Instagram, Linkedin, Twitter, Youtube, PlayCircle,
  TrendingUp, Zap, ZapOff, Send, Clock, RotateCcw, X as XIcon,
  ChevronDown, ChevronUp, Sparkles, Loader2, CheckCircle, AlertCircle,
  Users, BarChart3, Flame
} from 'lucide-react';
import type { SocialProfile, QueuedPost, TrendingTopic, PlatformId } from './types';
import { autopilotEngine } from './AutopilotEngine';
import { ImageWithFallback } from '../figma/ImageWithFallback';

const platformIcons: Record<PlatformId, React.ElementType> = {
  facebook: Facebook,
  instagram: Instagram,
  tiktok: PlayCircle,
  twitter: Twitter,
  linkedin: Linkedin,
  youtube: Youtube,
  pinterest: TrendingUp,
};

const platformColors: Record<PlatformId, string> = {
  facebook: 'from-blue-500 to-blue-600',
  instagram: 'from-purple-500 to-pink-500',
  tiktok: 'from-gray-900 to-gray-800',
  twitter: 'from-sky-400 to-sky-500',
  linkedin: 'from-blue-600 to-blue-700',
  youtube: 'from-red-500 to-red-600',
  pinterest: 'from-red-500 to-rose-600',
};

const platformBgColors: Record<PlatformId, string> = {
  facebook: 'bg-blue-500/10 border-blue-500/20',
  instagram: 'bg-purple-500/10 border-purple-500/20',
  tiktok: 'bg-gray-500/10 border-gray-500/20',
  twitter: 'bg-sky-500/10 border-sky-500/20',
  linkedin: 'bg-blue-600/10 border-blue-600/20',
  youtube: 'bg-red-500/10 border-red-500/20',
  pinterest: 'bg-rose-500/10 border-rose-500/20',
};

interface ProfileCardProps {
  profile: SocialProfile;
  onToggleAutopilot: (profileId: string) => void;
  onGeneratePost: (profileId: string) => void;
  onReschedulePost: (postId: string) => void;
  onCancelPost: (postId: string) => void;
  isGenerating: boolean;
  queuedPosts: QueuedPost[];
}

export const ProfileCard: React.FC<ProfileCardProps> = ({
  profile,
  onToggleAutopilot,
  onGeneratePost,
  onReschedulePost,
  onCancelPost,
  isGenerating,
  queuedPosts,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [topics, setTopics] = useState<TrendingTopic[]>([]);
  const [loadingTopics, setLoadingTopics] = useState(false);

  const Icon = platformIcons[profile.provider] || Sparkles;
  const colorGradient = platformColors[profile.provider] || 'from-gray-500 to-gray-600';
  const bgColor = platformBgColors[profile.provider] || 'bg-gray-500/10 border-gray-500/20';

  const scheduledPosts = queuedPosts.filter(
    (p) => p.status === 'scheduled' || p.status === 'publishing'
  );

  useEffect(() => {
    if (expanded && topics.length === 0) {
      loadTopics();
    }
  }, [expanded]);

  const loadTopics = async () => {
    setLoadingTopics(true);
    try {
      const t = await autopilotEngine.getTrendingTopics(profile.provider);
      setTopics(t);
    } catch {
      // ignore
    }
    setLoadingTopics(false);
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    const now = Date.now();
    const diff = ts - now;
    if (diff < 0) return 'Overdue';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    return d.toLocaleDateString();
  };

  return (
    <div className="bg-[#292946] rounded-2xl border border-white/5 overflow-hidden transition-all duration-300 hover:border-white/10 hover:shadow-lg hover:shadow-cyan-500/5">
      {/* Top accent bar */}
      <div className={`h-1 bg-gradient-to-r ${colorGradient}`} />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          <div className="relative">
            <ImageWithFallback
              src={profile.avatarUrl}
              alt={profile.name}
              className="w-12 h-12 rounded-full object-cover ring-2 ring-white/10"
            />
            <div
              className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-[#292946] ${profile.status === 'active' ? 'bg-emerald-400' : profile.status === 'paused' ? 'bg-yellow-400' : 'bg-red-400'
                }`}
            />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-semibold text-base truncate">{profile.name}</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${bgColor}`}>
                <Icon className="w-3 h-3" />
                {profile.provider.charAt(0).toUpperCase() + profile.provider.slice(1)}
              </span>
              <span className="text-gray-500 text-[10px]">@{profile.username}</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            {profile.autopilotEnabled ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-cyan-500/10 text-cyan-400 rounded-full text-[10px] font-bold border border-cyan-500/20">
                <Zap className="w-3 h-3" /> AUTO
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-500/10 text-gray-500 rounded-full text-[10px] font-medium border border-gray-500/20">
                <ZapOff className="w-3 h-3" /> OFF
              </span>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-white/5 rounded-lg p-2 text-center">
            <Users className="w-3.5 h-3.5 text-gray-400 mx-auto mb-1" />
            <span className="text-white text-xs font-bold">{(profile.followers / 1000).toFixed(1)}K</span>
            <span className="text-gray-500 text-[9px] block">Followers</span>
          </div>
          <div className="bg-white/5 rounded-lg p-2 text-center">
            <BarChart3 className="w-3.5 h-3.5 text-gray-400 mx-auto mb-1" />
            <span className="text-white text-xs font-bold">{profile.engagement}%</span>
            <span className="text-gray-500 text-[9px] block">Engage</span>
          </div>
          <div className="bg-white/5 rounded-lg p-2 text-center">
            <Clock className="w-3.5 h-3.5 text-gray-400 mx-auto mb-1" />
            <span className="text-white text-xs font-bold">{scheduledPosts.length}</span>
            <span className="text-gray-500 text-[9px] block">Queued</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => onToggleAutopilot(profile.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${profile.autopilotEnabled
              ? 'bg-cyan-500 text-[#1e1e2f] hover:bg-cyan-400 shadow-lg shadow-cyan-500/20'
              : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
          >
            {profile.autopilotEnabled ? <Zap className="w-3.5 h-3.5" /> : <ZapOff className="w-3.5 h-3.5" />}
            {profile.autopilotEnabled ? 'Autopilot ON' : 'Enable Autopilot'}
          </button>
          <button
            onClick={() => onGeneratePost(profile.id)}
            disabled={isGenerating}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-[#1e1e2f] hover:from-amber-400 hover:to-orange-400 transition-all shadow-lg shadow-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            {isGenerating ? 'Generating...' : 'Generate Post'}
          </button>
        </div>

        {/* Expand toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-center gap-1 text-gray-500 hover:text-gray-300 text-[11px] py-1 transition-colors"
        >
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          {expanded ? 'Less details' : 'Trending topics & queue'}
        </button>

        {/* Expanded section */}
        {expanded && (
          <div className="mt-3 space-y-3 animate-in slide-in-from-top-2 duration-200">
            {/* Trending Topics */}
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Flame className="w-3.5 h-3.5 text-orange-400" />
                <span className="text-gray-300 text-xs font-semibold">Trending Topics</span>
                <button onClick={loadTopics} className="ml-auto text-gray-500 hover:text-gray-300">
                  <RotateCcw className={`w-3 h-3 ${loadingTopics ? 'animate-spin' : ''}`} />
                </button>
              </div>
              {loadingTopics ? (
                <div className="flex items-center gap-2 text-gray-500 text-xs py-2">
                  <Loader2 className="w-3 h-3 animate-spin" /> Loading topics...
                </div>
              ) : topics.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {topics.map((t) => (
                    <span
                      key={t.id}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-white/5 rounded-lg text-[10px] text-gray-300 border border-white/5 hover:border-white/10 transition-colors"
                    >
                      <span className="text-orange-400 font-bold">{t.score}</span>
                      {t.topic}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 text-xs">Click refresh to load topics</p>
              )}
            </div>

            {/* Queued Posts */}
            {scheduledPosts.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Clock className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-gray-300 text-xs font-semibold">
                    Queued Posts ({scheduledPosts.length})
                  </span>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {scheduledPosts.map((post) => (
                    <div
                      key={post.id}
                      className="bg-white/5 rounded-lg p-3 border border-white/5"
                    >
                      <p className="text-gray-300 text-[11px] line-clamp-2 mb-2">
                        {post.content}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500 text-[10px] flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatTime(post.scheduledAt)}
                          </span>
                          {post.aiScore && (
                            <span className="text-cyan-400 text-[10px] font-bold">
                              AI: {post.aiScore}
                            </span>
                          )}
                          {post.status === 'publishing' && (
                            <span className="text-amber-400 text-[10px] flex items-center gap-1">
                              <Loader2 className="w-3 h-3 animate-spin" /> Publishing
                            </span>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => onReschedulePost(post.id)}
                            className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded text-[10px] font-medium hover:bg-blue-500/30 transition-colors"
                          >
                            Reschedule
                          </button>
                          <button
                            onClick={() => onCancelPost(post.id)}
                            className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded text-[10px] font-medium hover:bg-red-500/30 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
