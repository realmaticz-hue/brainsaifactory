import { useState, useMemo, useRef } from 'react';
import {
  X, Calendar, CheckCircle, ChevronRight, Sparkles, Clock,
  TrendingUp, Zap, BarChart3, Download, Info, Upload, Plus,
  Instagram, Youtube, Play, FileText, Trash2, AlignLeft,
  Globe, ArrowRight, ChevronDown, ChevronUp, Send, Facebook,
  Linkedin, RefreshCw, AlertCircle, CheckCircle2, Loader,
} from 'lucide-react';
import type { BlogPost } from '../utils/blogGenerator';
import type { PostFormat } from '../utils/backgroundEngine';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { serverFetch } from '../utils/serverFetch';

// ─── Types ─────────────────────────────────────────────────────

export interface ScheduledPost {
  post: BlogPost;
  day: number;
  phase: Phase;
  angle: string;
  rationale: string;
  postFormat: PostFormat;
  platforms: Platform[];
}

type Phase = 'awareness' | 'education' | 'consideration' | 'conversion';
type Platform = 'instagram' | 'tiktok' | 'youtube' | 'facebook' | 'linkedin';
type PostNowStatus = 'idle' | 'posting' | 'posted' | 'failed';

interface PostNowResult {
  platform: Platform;
  status: 'ok' | 'error';
  message: string;
}

interface UploadedBlog {
  id: string;
  title: string;
  content: string;
  duration: 7 | 30;
  source: 'uploaded';
}

interface SmartCampaignSchedulerProps {
  posts: BlogPost[];
  isopen: boolean;
  onClose: () => void;
  onCreateCampaign: (schedule: ScheduledPost[]) => void;
}

// ─── Platform Config ────────────────────────────────────────────

const PLATFORM_CONFIG: Record<Platform, {
  label: string;
  icon: React.FC<any>;
  color: string;
  bg: string;
  border: string;
  gradient: string;
  maxChars: number;
  hashtagTip: string;
  bestTime: string;
  contentTypes: string[];
  emoji: string;
  tips: string[];
}> = {
  instagram: {
    label: 'Instagram',
    icon: Instagram,
    color: '#E1306C',
    bg: 'bg-pink-50',
    border: 'border-pink-300',
    gradient: 'from-pink-500 to-purple-600',
    maxChars: 2200,
    hashtagTip: 'Use 5–15 hashtags for max reach',
    bestTime: 'Tue–Fri, 11am–1pm & 7–9pm',
    contentTypes: ['Reels', 'Carousel', 'Story', 'Feed Post'],
    emoji: '📸',
    tips: [
      '🎨 Use bold text overlays on Reels for sound-off viewers',
      '📌 Pin your best post to the profile top',
      '🔄 Repurpose 7s posts as Stories + Reels',
    ],
  },
  tiktok: {
    label: 'TikTok',
    icon: Play,
    color: '#010101',
    bg: 'bg-slate-50',
    border: 'border-slate-300',
    gradient: 'from-slate-800 to-cyan-600',
    maxChars: 2200,
    hashtagTip: '3–5 trending hashtags perform best',
    bestTime: 'Tue/Thu/Fri, 7–9am & 7–9pm',
    contentTypes: ['Short Video', 'Duet', 'Stitch', 'Live'],
    emoji: '🎵',
    tips: [
      '⚡ Hook viewers in the first 0.5s or they scroll',
      '🎵 Use trending audio to boost algorithmic reach',
      '💬 Reply to comments with video replies for extra impressions',
    ],
  },
  youtube: {
    label: 'YouTube',
    icon: Youtube,
    color: '#FF0000',
    bg: 'bg-red-50',
    border: 'border-red-300',
    gradient: 'from-red-500 to-orange-500',
    maxChars: 5000,
    hashtagTip: 'Add 3 hashtags in description for discoverability',
    bestTime: 'Sat–Sun 9–11am & Thu/Fri 12–3pm',
    contentTypes: ['Short (< 60s)', 'Long-form', 'Premiere', 'Community Post'],
    emoji: '▶️',
    tips: [
      '🖼️ Custom thumbnails increase CTR by up to 38%',
      '⏱️ Shorts (< 60s) get separate feed placement',
      '📝 Keyword-rich description in first 2 lines',
    ],
  },
  facebook: {
    label: 'Facebook',
    icon: Facebook,
    color: '#1877F2',
    bg: 'bg-blue-50',
    border: 'border-blue-300',
    gradient: 'from-blue-600 to-blue-500',
    maxChars: 63206,
    hashtagTip: '1–3 hashtags — more hurts organic reach on Facebook',
    bestTime: 'Wed–Fri, 9am–1pm',
    contentTypes: ['Feed Video', 'Reels', 'Story', 'Image Post', 'Link Post'],
    emoji: '📘',
    tips: [
      '📅 Schedule posts using Creator Studio for best timing',
      '💬 Respond to comments within 1h — boosts distribution',
      '🎯 Native video gets 3× more reach than link posts',
    ],
  },
  linkedin: {
    label: 'LinkedIn',
    icon: Linkedin,
    color: '#0A66C2',
    bg: 'bg-sky-50',
    border: 'border-sky-300',
    gradient: 'from-sky-700 to-blue-600',
    maxChars: 3000,
    hashtagTip: '3–5 professional hashtags — industry + topic + brand',
    bestTime: 'Tue–Thu, 8–10am & 12pm',
    contentTypes: ['Text Post', 'Document/PDF', 'Video', 'Poll', 'Article'],
    emoji: '💼',
    tips: [
      '📄 Document/carousel posts get 3× more impressions than links',
      '🕗 Post between 8–10am on Tue/Wed for peak B2B traffic',
      '💡 Lead with a bold insight — not a question — in line 1',
    ],
  },
};

const ALL_PLATFORMS: Platform[] = ['instagram', 'tiktok', 'youtube', 'facebook', 'linkedin'];

// ─── Angle / Phase Tables ───────────────────────────────────────

const ANGLE_LABELS_7 = [
  'Problem Hook', 'Contrarian', 'Data-Driven', 'Question Hook',
  'Bold Claim', 'Insider Tip', 'Comparison', 'How-To',
  'Before/After', 'Myth Bust', 'Trend', 'Social Proof',
];
const ANGLE_LABELS_30 = [
  'Problem→Solution', 'Expert Guide', 'Contrarian Deep Dive', 'Data Insights',
  'Case Study', 'Framework', 'Myth Busting', 'Trend Analysis',
  'Step-by-Step', 'Comparison Analysis', 'Insider Secrets', 'Transformation Story',
];
const PHASE_MAP_7: Phase[] = [
  'awareness', 'consideration', 'education', 'awareness',
  'awareness', 'education', 'consideration', 'education',
  'conversion', 'consideration', 'awareness', 'conversion',
];
const PHASE_MAP_30: Phase[] = [
  'awareness', 'education', 'consideration', 'education',
  'conversion', 'education', 'consideration', 'awareness',
  'education', 'consideration', 'conversion', 'conversion',
];
const PHASE_RATIONALE: Record<Phase, string> = {
  awareness: 'Week 1 — grabs attention and introduces the brand.',
  education: 'Week 2 — builds trust with expertise and how-to value.',
  consideration: 'Week 3 — addresses objections and compares alternatives.',
  conversion: 'Week 4 — drives action with proof and transformation.',
};
const PHASE_COLORS: Record<Phase, string> = {
  awareness: 'bg-blue-100 text-blue-800 border-blue-200',
  education: 'bg-green-100 text-green-800 border-green-200',
  consideration: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  conversion: 'bg-purple-100 text-purple-800 border-purple-200',
};
const PHASE_HEADER: Record<Phase, string> = {
  awareness: 'from-blue-500 to-cyan-500',
  education: 'from-green-500 to-emerald-500',
  consideration: 'from-yellow-500 to-orange-500',
  conversion: 'from-purple-500 to-pink-500',
};
const PHASE_ICON: Record<Phase, string> = {
  awareness: '🎯', education: '📚', consideration: '⚖️', conversion: '🚀',
};

// ─── Helpers ────────────────────────────────────────────────────

function classifyPost(post: BlogPost): { phase: Phase; angle: string } {
  const parts = post.id.split('-');
  const idx = parseInt(parts[parts.length - 1], 10);
  const is7 = post.duration === 7;
  if (isNaN(idx)) {
    const c = post.content.toLowerCase();
    if (c.includes('problem') || c.includes('trend')) return { phase: 'awareness', angle: 'Problem Hook' };
    if (c.includes('step') || c.includes('guide')) return { phase: 'education', angle: 'Expert Guide' };
    if (c.includes('myth') || c.includes('compare')) return { phase: 'consideration', angle: 'Comparison' };
    return { phase: 'conversion', angle: 'Social Proof' };
  }
  const safeIdx = Math.min(idx, 11);
  return {
    phase: (is7 ? PHASE_MAP_7 : PHASE_MAP_30)[safeIdx] || 'awareness',
    angle: (is7 ? ANGLE_LABELS_7 : ANGLE_LABELS_30)[safeIdx] || 'Hook',
  };
}

function smartSort(posts: BlogPost[]): Omit<ScheduledPost, 'platforms'>[] {
  const classified = posts.map(p => ({ post: p, ...classifyPost(p) }));
  const groups: Record<Phase, typeof classified> = {
    awareness: [], education: [], consideration: [], conversion: [],
  };
  classified.forEach(c => groups[c.phase].push(c));

  const interleave = (arr: typeof classified) => {
    const s = arr.filter(p => p.post.duration === 7);
    const l = arr.filter(p => p.post.duration === 30);
    const out: typeof classified = [];
    for (let i = 0; i < Math.max(s.length, l.length); i++) {
      if (s[i]) out.push(s[i]);
      if (l[i]) out.push(l[i]);
    }
    return out;
  };

  const sorted: typeof classified = [];
  (['awareness', 'education', 'consideration', 'conversion'] as Phase[]).forEach(p =>
    sorted.push(...interleave(groups[p]))
  );

  if (sorted.length === 0) return [];
  const spacing = sorted.length === 1 ? 0 : Math.floor(29 / (sorted.length - 1));

  return sorted.map((item, idx) => ({
    post: item.post,
    day: Math.min(1 + idx * spacing, 30),
    phase: item.phase,
    angle: item.angle,
    rationale: PHASE_RATIONALE[item.phase],
    postFormat: 'video' as PostFormat,
  }));
}

function uploadedToBlogPost(u: UploadedBlog): BlogPost {
  return {
    id: u.id,
    duration: u.duration,
    content: u.content,
    character: { name: 'Custom Upload', avatar: '📄', voiceType: 'neutral' },
    timestamp: new Date(),
    seoTitle: u.title,
    angleLabel: 'Custom',
  };
}

// ─── Main Component ─────────────────────────────────────────────

export function SmartCampaignScheduler({ posts, isopen, onClose, onCreateCampaign }: SmartCampaignSchedulerProps) {
  const [tab, setTab] = useState<'schedule' | 'upload' | 'platforms'>('schedule');
  const [view, setView] = useState<'timeline' | 'calendar'>('timeline');
  const [campaignName, setCampaignName] = useState(
    `Campaign — ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
  );
  const [created, setCreated] = useState(false);
  const [postFormats, setPostFormats] = useState<Record<string, PostFormat>>({});
  const [postPlatforms, setPostPlatforms] = useState<Record<string, Platform[]>>({});
  const [globalPlatforms, setGlobalPlatforms] = useState<Platform[]>(['instagram', 'facebook', 'linkedin', 'tiktok', 'youtube']);

  // Post Now state — keyed by post ID
  const [postNowStatus, setPostNowStatus] = useState<Record<string, PostNowStatus>>({});
  const [postNowResults, setPostNowResults] = useState<Record<string, PostNowResult[]>>({});
  const [postNowExpanded, setPostNowExpanded] = useState<string | null>(null);

  // Blog upload state
  const [uploadedBlogs, setUploadedBlogs] = useState<UploadedBlog[]>([]);
  const [pasteTitle, setPasteTitle] = useState('');
  const [pasteContent, setPasteContent] = useState('');
  const [pasteDuration, setPasteDuration] = useState<7 | 30>(7);
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allPosts = useMemo(() => [
    ...posts,
    ...uploadedBlogs.map(uploadedToBlogPost),
  ], [posts, uploadedBlogs]);

  const schedule = useMemo(() => smartSort(allPosts), [allPosts]);

  const getFormat = (id: string): PostFormat => postFormats[id] ?? 'video';
  const setFormat = (id: string, fmt: PostFormat) => setPostFormats(p => ({ ...p, [id]: fmt }));

  const getPlatforms = (id: string): Platform[] => postPlatforms[id] ?? globalPlatforms;
  const togglePlatform = (postId: string, p: Platform) => {
    const current = getPlatforms(postId);
    setPostPlatforms(prev => ({
      ...prev,
      [postId]: current.includes(p) ? current.filter(x => x !== p) : [...current, p],
    }));
  };

  const toggleGlobal = (p: Platform) => {
    setGlobalPlatforms(prev =>
      prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]
    );
  };

  const phaseCounts = useMemo(() => {
    const c: Record<Phase, number> = { awareness: 0, education: 0, consideration: 0, conversion: 0 };
    schedule.forEach(s => c[s.phase]++);
    return c;
  }, [schedule]);

  const calendarGrid = useMemo(() => {
    const grid: Array<typeof schedule[0] | null> = Array(30).fill(null);
    schedule.forEach(s => { grid[s.day - 1] = s; });
    return grid;
  }, [schedule]);

  // ── Post Now ──────────────────────────────────────────────────

  const handlePostNow = async (item: typeof schedule[0]) => {
    const postId = item.post.id;
    const platforms = getPlatforms(postId);

    if (platforms.length === 0) {
      alert('Select at least one platform before posting.');
      return;
    }

    setPostNowStatus(p => ({ ...p, [postId]: 'posting' }));
    setPostNowResults(p => ({ ...p, [postId]: [] }));
    setPostNowExpanded(postId);

    // Load credentials from localStorage
    let credentials: any = {};
    try {
      const saved = localStorage.getItem('socialCredentials');
      if (saved) credentials = JSON.parse(saved);
    } catch { }

    const results: PostNowResult[] = [];

    // Post to each platform sequentially so we get individual results
    for (const platform of platforms) {
      try {
        const resp = await serverFetch('/social-post', {
          method: 'POST',
          body: JSON.stringify({
            platforms: [platform],
            content: item.post.content,
            caption: item.post.content,
            mediaType: getFormat(postId),
            credentials: { [platform]: credentials[platform] || {} },
          }),
        });

        const data = await resp.json().catch(() => ({}));

        if (resp.ok && data.success !== false) {
          results.push({ platform, status: 'ok', message: data.results?.[platform]?.message || `Posted to ${PLATFORM_CONFIG[platform].label}` });
        } else {
          results.push({ platform, status: 'error', message: data.error || data.results?.[platform]?.error || `${PLATFORM_CONFIG[platform].label}: Credentials not configured` });
        }
      } catch (err: any) {
        results.push({ platform, status: 'error', message: `Network error: ${err.message}` });
      }
    }

    const allOk = results.every(r => r.status === 'ok');
    const anyOk = results.some(r => r.status === 'ok');

    setPostNowStatus(p => ({ ...p, [postId]: allOk ? 'posted' : anyOk ? 'posted' : 'failed' }));
    setPostNowResults(p => ({ ...p, [postId]: results }));
  };

  const handleCreate = () => {
    const final: ScheduledPost[] = schedule.map(s => ({
      ...s,
      postFormat: getFormat(s.post.id),
      platforms: getPlatforms(s.post.id),
    }));
    onCreateCampaign(final);
    setCreated(true);
    setTimeout(() => { setCreated(false); onClose(); }, 1800);
  };

  const handleExport = () => {
    const rows = ['Day,Duration,Phase,Angle,Format,Platforms,Content Preview'];
    schedule.forEach(s => {
      rows.push(
        `${s.day},${s.post.duration}s,${s.phase},${s.angle},${getFormat(s.post.id)},` +
        `"${getPlatforms(s.post.id).join('|')}","${s.post.content.slice(0, 80).replace(/"/g, "'")}"`
      );
    });
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${campaignName.replace(/\s+/g, '-')}-schedule.csv`;
    a.click();
  };

  // ── Blog Upload Handlers ──────────────────────────────────────

  const handleAddPaste = () => {
    if (!pasteContent.trim()) return;
    const id = `upload-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setUploadedBlogs(prev => [...prev, {
      id,
      title: pasteTitle.trim() || `Uploaded Blog ${prev.length + 1}`,
      content: pasteContent.trim(),
      duration: pasteDuration,
      source: 'uploaded',
    }]);
    setPasteTitle('');
    setPasteContent('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    Array.from(e.target.files || []).forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => {
        const id = `upload-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        setUploadedBlogs(prev => [...prev, {
          id,
          title: file.name.replace(/\.[^.]+$/, ''),
          content: ((ev.target?.result as string) || '').trim(),
          duration: 30,
          source: 'uploaded',
        }]);
      };
      reader.readAsText(file);
    });
    e.target.value = '';
  };

  if (!isopen) return null;

  // ── Render ────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-3">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col">

        {/* ── Header ─────────────────────────────────────────── */}
        <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 p-5 text-white flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold leading-tight">Smart 30-Day Scheduler</h2>
                <p className="text-xs text-white/70">
                  Instagram · TikTok · YouTube · Facebook · LinkedIn — AI-optimized release order
                </p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <input
            value={campaignName}
            onChange={e => setCampaignName(e.target.value)}
            className="w-full bg-white/15 border border-white/30 rounded-lg px-3 py-2 text-white placeholder-white/60 text-sm font-medium focus:outline-none focus:bg-white/25 mb-3"
            placeholder="Campaign name…"
          />

          {/* Global platform toggles */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-white/60 text-xs font-medium shrink-0">Post to:</span>
            {ALL_PLATFORMS.map(p => {
              const cfg = PLATFORM_CONFIG[p];
              const active = globalPlatforms.includes(p);
              return (
                <button
                  key={p}
                  onClick={() => toggleGlobal(p)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${active
                      ? 'bg-white text-gray-800 border-white shadow-md'
                      : 'bg-white/10 text-white/60 border-white/20 hover:bg-white/20'
                    }`}
                >
                  <cfg.icon className="w-3 h-3" />
                  {cfg.label}
                </button>
              );
            })}
          </div>

          {/* Phase summary */}
          <div className="grid grid-cols-4 gap-2 mt-3">
            {(['awareness', 'education', 'consideration', 'conversion'] as Phase[]).map(phase => (
              <div key={phase} className="bg-white/15 rounded-lg p-2 text-center">
                <div>{PHASE_ICON[phase]}</div>
                <div className="text-lg font-bold">{phaseCounts[phase]}</div>
                <div className="text-xs text-white/70 capitalize">{phase}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Tab Bar ────────────────────────────────────────── */}
        <div className="flex border-b border-gray-200 bg-gray-50 flex-shrink-0">
          {[
            { id: 'schedule', icon: Calendar, label: `Schedule (${allPosts.length} posts)` },
            { id: 'upload', icon: Upload, label: `Upload Blogs${uploadedBlogs.length > 0 ? ` (${uploadedBlogs.length})` : ''}` },
            { id: 'platforms', icon: Globe, label: 'Platform Tips' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id as any)}
              className={`flex-1 py-3 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${tab === t.id
                  ? 'text-purple-700 border-b-2 border-purple-600 bg-white'
                  : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Content ────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto">

          {/* ══════════════════════════════════════════════════
              SCHEDULE TAB
          ══════════════════════════════════════════════════ */}
          {tab === 'schedule' && (
            <>
              <div className="flex border-b border-gray-100 bg-white px-4 pt-2 gap-4 flex-shrink-0">
                {[
                  { id: 'timeline', icon: TrendingUp, label: 'Timeline' },
                  { id: 'calendar', icon: Calendar, label: '30-Day Grid' },
                ].map(v => (
                  <button
                    key={v.id}
                    onClick={() => setView(v.id as any)}
                    className={`flex items-center gap-1.5 pb-2 text-xs font-semibold border-b-2 transition-colors ${view === v.id
                        ? 'border-purple-500 text-purple-700'
                        : 'border-transparent text-gray-400 hover:text-gray-600'
                      }`}
                  >
                    <v.icon className="w-3.5 h-3.5" />
                    {v.label}
                  </button>
                ))}
              </div>

              {schedule.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                  <Calendar className="w-12 h-12 mb-3 opacity-30" />
                  <p className="font-semibold">No posts yet</p>
                  <p className="text-sm mt-1">Generate blog posts or upload your own blogs above</p>
                </div>
              ) : view === 'timeline' ? (

                /* ── Timeline View ──────────────────────────── */
                <div className="p-4 space-y-3">
                  {schedule.map((item, idx) => {
                    const postId = item.post.id;
                    const platforms = getPlatforms(postId);
                    const isExpanded = expandedPost === postId;
                    const isUploaded = postId.startsWith('upload-');
                    const nowStatus = postNowStatus[postId] || 'idle';
                    const nowResults = postNowResults[postId] || [];
                    const resultsExpanded = postNowExpanded === postId;
                    const fmts: { id: PostFormat; icon: string; label: string }[] = [
                      { id: 'video', icon: '🎥', label: 'Video' },
                      { id: 'image', icon: '📷', label: 'Image' },
                      { id: 'text', icon: '📝', label: 'Text' },
                    ];

                    return (
                      <div key={postId} className="flex gap-3">
                        {/* Day bubble */}
                        <div className="flex-shrink-0 w-12 flex flex-col items-center">
                          <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${PHASE_HEADER[item.phase]} text-white flex items-center justify-center text-xs font-bold shadow`}>
                            D{item.day}
                          </div>
                          {idx < schedule.length - 1 && <div className="w-0.5 h-4 bg-gray-200 mt-1" />}
                        </div>

                        {/* Card */}
                        <div className="flex-1 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow mb-1 overflow-hidden">
                          <div className="p-3">

                            {/* Top row — badges + expand */}
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${PHASE_COLORS[item.phase]}`}>
                                  {PHASE_ICON[item.phase]} {item.phase}
                                </span>
                                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                                  {item.angle}
                                </span>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${item.post.duration === 7 ? 'bg-orange-100 text-orange-700' : 'bg-indigo-100 text-indigo-700'}`}>
                                  <Clock className="w-3 h-3 inline mr-0.5" />{item.post.duration}s
                                </span>
                                {isUploaded && (
                                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold">
                                    📄 Uploaded
                                  </span>
                                )}
                              </div>
                              <button
                                onClick={() => setExpandedPost(isExpanded ? null : postId)}
                                className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                              >
                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>
                            </div>

                            {/* Content */}
                            <p className={`text-sm text-gray-700 leading-relaxed mb-3 ${isExpanded ? '' : 'line-clamp-2'}`}>
                              {item.post.content}
                            </p>

                            {/* Platform toggles */}
                            <div className="flex items-center gap-1.5 mb-2.5 flex-wrap">
                              <span className="text-xs text-gray-500 font-medium">Platforms:</span>
                              {ALL_PLATFORMS.map(p => {
                                const cfg = PLATFORM_CONFIG[p];
                                const active = platforms.includes(p);
                                return (
                                  <button
                                    key={p}
                                    onClick={() => togglePlatform(postId, p)}
                                    title={cfg.label}
                                    className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition-all ${active ? 'text-white shadow-sm' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                                      }`}
                                    style={active ? { background: cfg.color } : {}}
                                  >
                                    <cfg.icon className="w-3 h-3" />
                                    <span className="hidden sm:inline">{cfg.label}</span>
                                  </button>
                                );
                              })}
                            </div>

                            {/* Format + rationale */}
                            <div className="flex items-center justify-between gap-2 flex-wrap mb-3">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs text-gray-500 font-medium">Format:</span>
                                {fmts.map(f => (
                                  <button
                                    key={f.id}
                                    onClick={() => setFormat(postId, f.id)}
                                    className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition-all ${getFormat(postId) === f.id
                                        ? 'bg-purple-600 text-white shadow-sm'
                                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                      }`}
                                  >
                                    <span>{f.icon}</span>
                                    {f.label}
                                  </button>
                                ))}
                              </div>
                              <div className="flex items-center gap-1 text-xs text-gray-400">
                                <Info className="w-3 h-3 flex-shrink-0" />
                                {item.rationale}
                              </div>
                            </div>

                            {/* ── Post Now button row ───────────── */}
                            <div className="border-t border-gray-100 pt-3">
                              <div className="flex items-center gap-2 flex-wrap">
                                {/* Post Now button */}
                                <button
                                  onClick={() => handlePostNow(item)}
                                  disabled={nowStatus === 'posting' || platforms.length === 0}
                                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm ${nowStatus === 'posted'
                                      ? 'bg-green-500 text-white cursor-default'
                                      : nowStatus === 'failed'
                                        ? 'bg-red-500 text-white hover:bg-red-600'
                                        : nowStatus === 'posting'
                                          ? 'bg-blue-400 text-white cursor-wait'
                                          : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700'
                                    }`}
                                >
                                  {nowStatus === 'posting' && <Loader className="w-3.5 h-3.5 animate-spin" />}
                                  {nowStatus === 'posted' && <CheckCircle2 className="w-3.5 h-3.5" />}
                                  {nowStatus === 'failed' && <RefreshCw className="w-3.5 h-3.5" />}
                                  {nowStatus === 'idle' && <Send className="w-3.5 h-3.5" />}
                                  {nowStatus === 'posting' ? 'Posting…'
                                    : nowStatus === 'posted' ? 'Posted!'
                                      : nowStatus === 'failed' ? 'Retry'
                                        : 'Post Now'}
                                </button>

                                {/* Platform count hint */}
                                {platforms.length > 0 && nowStatus === 'idle' && (
                                  <span className="text-xs text-gray-400">
                                    → {platforms.map(p => PLATFORM_CONFIG[p].emoji).join(' ')} now
                                  </span>
                                )}
                                {platforms.length === 0 && (
                                  <span className="text-xs text-amber-500 flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" /> Select a platform first
                                  </span>
                                )}

                                {/* Toggle results */}
                                {nowResults.length > 0 && (
                                  <button
                                    onClick={() => setPostNowExpanded(resultsExpanded ? null : postId)}
                                    className="text-xs text-gray-500 hover:text-gray-700 underline"
                                  >
                                    {resultsExpanded ? 'Hide results' : 'View results'}
                                  </button>
                                )}
                              </div>

                              {/* Per-platform results */}
                              {resultsExpanded && nowResults.length > 0 && (
                                <div className="mt-2 space-y-1.5">
                                  {nowResults.map(r => (
                                    <div
                                      key={r.platform}
                                      className={`flex items-start gap-2 px-3 py-2 rounded-lg text-xs ${r.status === 'ok'
                                          ? 'bg-green-50 border border-green-200'
                                          : 'bg-red-50 border border-red-200'
                                        }`}
                                    >
                                      <span className="text-base leading-none">{PLATFORM_CONFIG[r.platform].emoji}</span>
                                      <div className="flex-1 min-w-0">
                                        <span className="font-semibold">{PLATFORM_CONFIG[r.platform].label}</span>
                                        {r.status === 'ok'
                                          ? <span className="text-green-700 ml-1">✓ {r.message}</span>
                                          : <span className="text-red-600 ml-1 break-words">✗ {r.message}</span>}
                                      </div>
                                    </div>
                                  ))}
                                  {nowResults.some(r => r.status === 'error') && (
                                    <p className="text-xs text-gray-500 mt-1">
                                      💡 Connect your accounts in{' '}
                                      <button
                                        onClick={() => window.dispatchEvent(new Event('openSocialSettings'))}
                                        className="text-blue-600 underline font-medium"
                                      >
                                        Social Accounts
                                      </button>{' '}
                                      to enable live posting.
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

              ) : (
                /* ── Calendar Grid View ─────────────────────── */
                <div className="p-4">
                  <div className="grid grid-cols-7 gap-1.5">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                      <div key={d} className="text-center text-xs font-semibold text-gray-400 pb-1">{d}</div>
                    ))}
                    {calendarGrid.map((item, idx) => {
                      const nowSt = item ? (postNowStatus[item.post.id] || 'idle') : 'idle';
                      return (
                        <div
                          key={idx + 1}
                          className={`min-h-[72px] rounded-lg border p-1.5 text-xs transition-all ${item
                              ? `border-2 ${item.phase === 'awareness' ? 'border-blue-300 bg-blue-50' :
                                item.phase === 'education' ? 'border-green-300 bg-green-50' :
                                  item.phase === 'consideration' ? 'border-yellow-300 bg-yellow-50' :
                                    'border-purple-300 bg-purple-50'
                              }`
                              : 'border-gray-200 bg-gray-50'
                            }`}
                        >
                          <div className="font-bold text-gray-400 mb-0.5">D{idx + 1}</div>
                          {item ? (
                            <>
                              <div className="flex items-center gap-0.5 mb-0.5 flex-wrap">
                                <span>{PHASE_ICON[item.phase]}</span>
                                <span className={`font-semibold ${item.post.duration === 7 ? 'text-orange-600' : 'text-indigo-600'}`}>
                                  {item.post.duration}s
                                </span>
                                {nowSt === 'posted' && <CheckCircle2 className="w-3 h-3 text-green-500 ml-auto" />}
                                {nowSt === 'failed' && <AlertCircle className="w-3 h-3 text-red-400 ml-auto" />}
                              </div>
                              <div className="flex gap-0.5 flex-wrap mb-0.5">
                                {getPlatforms(item.post.id).map(p => (
                                  <span key={p}>{PLATFORM_CONFIG[p].emoji}</span>
                                ))}
                              </div>
                              <p className="text-gray-500 leading-tight line-clamp-2">
                                {item.post.content.slice(0, 38)}…
                              </p>
                              {/* Mini post-now in calendar */}
                              <button
                                onClick={() => handlePostNow(item)}
                                disabled={nowSt === 'posting'}
                                className={`mt-1 w-full flex items-center justify-center gap-1 px-1 py-0.5 rounded text-[10px] font-bold transition-all ${nowSt === 'posted' ? 'bg-green-100 text-green-700' :
                                    nowSt === 'failed' ? 'bg-red-100 text-red-700' :
                                      nowSt === 'posting' ? 'bg-blue-100 text-blue-600' :
                                        'bg-purple-100 text-purple-700 hover:bg-purple-200'
                                  }`}
                              >
                                {nowSt === 'posting' ? <><Loader className="w-2.5 h-2.5 animate-spin" /> Posting</> :
                                  nowSt === 'posted' ? <><CheckCircle2 className="w-2.5 h-2.5" /> Posted</> :
                                    nowSt === 'failed' ? <><RefreshCw className="w-2.5 h-2.5" /> Retry</> :
                                      <><Send className="w-2.5 h-2.5" /> Post Now</>}
                              </button>
                            </>
                          ) : (
                            <div className="text-center text-gray-300 mt-2">—</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100">
                    {(['awareness', 'education', 'consideration', 'conversion'] as Phase[]).map(p => (
                      <div key={p} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${PHASE_COLORS[p]}`}>
                        {PHASE_ICON[p]} {p} ({phaseCounts[p]})
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* ══════════════════════════════════════════════════
              UPLOAD TAB
          ══════════════════════════════════════════════════ */}
          {tab === 'upload' && (
            <div className="p-5 space-y-6">
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <AlignLeft className="w-5 h-5 text-purple-600" />
                  <h3 className="font-bold text-gray-900">Paste or Write Your Blog</h3>
                </div>
                <div className="space-y-3">
                  <input
                    value={pasteTitle}
                    onChange={e => setPasteTitle(e.target.value)}
                    placeholder="Blog title (optional)"
                    className="w-full px-4 py-2.5 border-2 border-purple-200 rounded-xl focus:border-purple-500 focus:outline-none text-sm bg-white"
                  />
                  <textarea
                    value={pasteContent}
                    onChange={e => setPasteContent(e.target.value)}
                    placeholder="Paste your blog content here. It will be slotted intelligently into the 30-day schedule…"
                    rows={6}
                    className="w-full px-4 py-3 border-2 border-purple-200 rounded-xl focus:border-purple-500 focus:outline-none text-sm bg-white resize-none leading-relaxed"
                  />
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-600 font-medium">Ad length:</span>
                      {([7, 30] as const).map(d => (
                        <button
                          key={d}
                          onClick={() => setPasteDuration(d)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${pasteDuration === d
                              ? d === 7 ? 'bg-orange-500 text-white' : 'bg-indigo-500 text-white'
                              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                            }`}
                        >
                          {d}-second
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={handleAddPaste}
                      disabled={!pasteContent.trim()}
                      className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-bold text-sm hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                    >
                      <Plus className="w-4 h-4" />
                      Add to Schedule
                    </button>
                  </div>
                </div>
              </div>

              {/* File upload zone */}
              <div
                className="border-2 border-dashed border-gray-300 rounded-2xl p-6 text-center hover:border-purple-400 hover:bg-purple-50/30 transition-all cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.md,.csv"
                  multiple
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <Upload className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="font-semibold text-gray-700 mb-1">Upload Blog Files</p>
                <p className="text-sm text-gray-500">Click to browse — .txt, .md, .csv supported</p>
              </div>

              {/* Uploaded list */}
              {uploadedBlogs.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-emerald-600" />
                      Uploaded ({uploadedBlogs.length})
                    </h3>
                    <span className="text-xs bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full font-semibold border border-emerald-200">
                      Added to schedule ✓
                    </span>
                  </div>
                  <div className="space-y-2">
                    {uploadedBlogs.map(blog => (
                      <div key={blog.id} className="flex items-start gap-3 bg-white border border-gray-200 rounded-xl p-3 group">
                        <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <FileText className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-gray-800 truncate">{blog.title}</p>
                          <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{blog.content.slice(0, 100)}…</p>
                          <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full mt-1 ${blog.duration === 7 ? 'bg-orange-100 text-orange-700' : 'bg-indigo-100 text-indigo-700'}`}>
                            {blog.duration}s ad
                          </span>
                        </div>
                        <button
                          onClick={() => setUploadedBlogs(p => p.filter(u => u.id !== blog.id))}
                          className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════
              PLATFORM TIPS TAB
          ══════════════════════════════════════════════════ */}
          {tab === 'platforms' && (
            <div className="p-5 space-y-4">
              <p className="text-sm text-gray-500">Platform best practices for maximum reach on each channel.</p>
              {ALL_PLATFORMS.map(p => {
                const cfg = PLATFORM_CONFIG[p];
                const active = globalPlatforms.includes(p);
                return (
                  <div key={p} className={`rounded-2xl border-2 overflow-hidden transition-all ${active ? cfg.border : 'border-gray-200'}`}>
                    <div className={`bg-gradient-to-r ${cfg.gradient} p-4 flex items-center justify-between`}>
                      <div className="flex items-center gap-3 text-white">
                        <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                          <cfg.icon className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold">{cfg.emoji} {cfg.label}</p>
                          <p className="text-xs opacity-75">Best time: {cfg.bestTime}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleGlobal(p)}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${active ? 'bg-white text-gray-800 shadow-md' : 'bg-white/20 text-white hover:bg-white/30'
                          }`}
                      >
                        {active ? '✓ Active' : '+ Enable'}
                      </button>
                    </div>
                    <div className={`p-4 ${cfg.bg}`}>
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                          <p className="text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Content Types</p>
                          <div className="flex flex-wrap gap-1.5">
                            {cfg.contentTypes.map(ct => (
                              <span key={ct} className="text-xs px-2.5 py-1 bg-white border border-gray-200 text-gray-700 rounded-full font-medium shadow-sm">
                                {ct}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Hashtag Strategy</p>
                          <p className="text-xs text-gray-600">{cfg.hashtagTip}</p>
                          <p className="text-xs font-bold text-gray-700 mt-3 mb-1 uppercase tracking-wide">Char Limit</p>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                              <div className={`h-full bg-gradient-to-r ${cfg.gradient} rounded-full`}
                                style={{ width: `${Math.min((cfg.maxChars / 63206) * 100, 100)}%` }} />
                            </div>
                            <span className="text-xs font-bold text-gray-600">{cfg.maxChars.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="border-t border-gray-200 pt-3 space-y-1.5">
                        {cfg.tips.map(tip => (
                          <p key={tip} className="text-xs text-gray-600">{tip}</p>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Footer ─────────────────────────────────────────── */}
        <div className="border-t border-gray-200 p-4 bg-gray-50 flex items-center justify-between gap-3 flex-shrink-0 flex-wrap">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <BarChart3 className="w-4 h-4 text-purple-600" />
            <span>
              <strong>{schedule.length}</strong> posts ·{' '}
              <strong>30 days</strong> ·{' '}
              {globalPlatforms.map(p => PLATFORM_CONFIG[p].emoji).join(' ')}
            </span>
            {Object.values(postNowStatus).filter(s => s === 'posted').length > 0 && (
              <span className="flex items-center gap-1 text-green-600 font-semibold text-xs">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {Object.values(postNowStatus).filter(s => s === 'posted').length} posted live
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleExport}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-2 text-sm font-medium"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
            <button
              onClick={handleCreate}
              disabled={created || schedule.length === 0}
              className="px-5 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all flex items-center gap-2 text-sm font-bold shadow-lg disabled:opacity-50"
            >
              {created
                ? <><CheckCircle className="w-4 h-4" /> Campaign Created!</>
                : <><Zap className="w-4 h-4" /> Launch Campaign <ArrowRight className="w-4 h-4" /></>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
