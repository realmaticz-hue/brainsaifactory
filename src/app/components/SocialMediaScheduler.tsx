import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Calendar, Clock, Send, X, Image as ImageIcon, Video as VideoIcon,
  Type, Upload, Sparkles, Check, AlertCircle, RefreshCw,
  Instagram, Facebook, Twitter, Linkedin, Youtube,
  ExternalLink, Settings,
} from 'lucide-react';
import {
  socialScheduler,
  SocialPlatform,
  PLATFORM_SPECS,
} from '../utils/socialMediaScheduler';
import type { BlogPost } from '../utils/blogGenerator';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { serverFetch, resolveCallbackUrl } from '../utils/serverFetch';

// ─── Types ────────────────────────────────────────────────────────
type PostType = 'text' | 'image' | 'video';
type ScheduleMode = 'now' | 'schedule' | 'auto';

interface SocialMediaSchedulerProps {
  isopen: boolean;
  onClose: () => void;
  post: BlogPost;
  businessData?: any;
  videoBlob?: Blob;
  imageBlob?: Blob;
  defaultPostType?: PostType;
}

// ─── Platform config ──────────────────────────────────────────────
const PLATFORMS_CONFIG = [
  { id: 'instagram' as SocialPlatform, label: 'Instagram', icon: Instagram, color: '#E1306C', bg: '#fdf2f8', supportsText: false, supportsImage: true, supportsVideo: true },
  { id: 'facebook' as SocialPlatform, label: 'Facebook', icon: Facebook, color: '#1877F2', bg: '#eff6ff', supportsText: true, supportsImage: true, supportsVideo: true },
  { id: 'tiktok' as SocialPlatform, label: 'TikTok', icon: VideoIcon, color: '#010101', bg: '#f8fafc', supportsText: false, supportsImage: false, supportsVideo: true },
  { id: 'twitter' as SocialPlatform, label: 'X/Twitter', icon: Twitter, color: '#1DA1F2', bg: '#eff6ff', supportsText: true, supportsImage: true, supportsVideo: true },
  { id: 'linkedin' as SocialPlatform, label: 'LinkedIn', icon: Linkedin, color: '#0A66C2', bg: '#eff6ff', supportsText: true, supportsImage: true, supportsVideo: true },
  { id: 'youtube' as SocialPlatform, label: 'YouTube', icon: Youtube, color: '#FF0000', bg: '#fef2f2', supportsText: false, supportsImage: false, supportsVideo: true },
];

// ─── Tone → gradient map for AI backgrounds ───────────────────────
const TONE_GRADIENTS: Record<string, [string, string]> = {
  excited: ['#f59e0b', '#ef4444'],
  professional: ['#1e40af', '#7c3aed'],
  friendly: ['#10b981', '#3b82f6'],
  urgent: ['#dc2626', '#b45309'],
  calm: ['#0ea5e9', '#6366f1'],
  default: ['#7c3aed', '#ec4899'],
};

function detectTone(text: string): string {
  const t = text.toLowerCase();
  if (/urgent|limited|hurry|now|act fast/i.test(t)) return 'urgent';
  if (/excited|amazing|incredible|wow|best/i.test(t)) return 'excited';
  if (/professional|expert|trusted|proven/i.test(t)) return 'professional';
  if (/friendly|hello|hi |welcome|love/i.test(t)) return 'friendly';
  if (/calm|relax|peace|balance|easy/i.test(t)) return 'calm';
  return 'default';
}

// ─── Canvas image generator ────────────────────────────────────────
function generateCanvasImage(text: string, brandName: string, gradientColors: [string, string]): Promise<Blob> {
  return new Promise(resolve => {
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d')!;

    // Gradient background
    const grad = ctx.createLinearGradient(0, 0, 1080, 1080);
    grad.addColorStop(0, gradientColors[0]);
    grad.addColorStop(1, gradientColors[1]);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1080, 1080);

    // Subtle grain overlay
    const imageData = ctx.getImageData(0, 0, 1080, 1080);
    for (let i = 0; i < imageData.data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 18;
      imageData.data[i] = Math.min(255, Math.max(0, imageData.data[i] + noise));
      imageData.data[i + 1] = Math.min(255, Math.max(0, imageData.data[i + 1] + noise));
      imageData.data[i + 2] = Math.min(255, Math.max(0, imageData.data[i + 2] + noise));
    }
    ctx.putImageData(imageData, 0, 0);

    // Vignette
    const vignette = ctx.createRadialGradient(540, 540, 200, 540, 540, 800);
    vignette.addColorStop(0, 'rgba(0,0,0,0)');
    vignette.addColorStop(1, 'rgba(0,0,0,0.45)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, 1080, 1080);

    // Brand name (top)
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.font = 'bold 42px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(brandName.toUpperCase(), 540, 100);

    // Decorative line
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(200, 120); ctx.lineTo(880, 120); ctx.stroke();

    // Post text (center, word-wrapped)
    const words = text.split(' ');
    const lines: string[] = [];
    let current = '';
    ctx.font = '52px system-ui, sans-serif';
    for (const word of words) {
      const test = current ? `${current} ${word}` : word;
      if (ctx.measureText(test).width > 860) { lines.push(current); current = word; }
      else current = test;
    }
    if (current) lines.push(current);

    const lineH = 68;
    const totalH = lines.length * lineH;
    const startY = 540 - totalH / 2 + lineH / 2;

    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.font = '52px system-ui, sans-serif';
    lines.slice(0, 8).forEach((line, i) => {
      ctx.fillText(line, 540, startY + i * lineH);
    });

    // Bottom bar
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(0, 960, 1080, 120);
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = '32px system-ui, sans-serif';
    ctx.fillText('✨ AI Generated · Share & Engage', 540, 1016);

    canvas.toBlob(blob => resolve(blob!), 'image/png', 0.95);
  });
}

// ─── Platform Preview ─────────────────────────────────────────────
function PlatformPreview({ platform, postType, caption, imageUrl }: {
  platform: typeof PLATFORMS_CONFIG[number];
  postType: PostType;
  caption: string;
  imageUrl: string | null;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Platform header */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-gray-100" style={{ background: platform.bg }}>
        <platform.icon className="w-4 h-4" style={{ color: platform.color }} />
        <span className="text-xs font-bold" style={{ color: platform.color }}>{platform.label} Preview</span>
        <span className="ml-auto text-xs px-1.5 py-0.5 rounded-full font-medium" style={{ background: platform.color + '22', color: platform.color }}>
          {postType}
        </span>
      </div>
      {/* Mock post */}
      <div className="p-3">
        {/* Fake user bar */}
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-400 to-pink-400" />
          <div>
            <div className="text-xs font-bold text-gray-800">YourBrand</div>
            <div className="text-xs text-gray-400">Just now</div>
          </div>
        </div>
        {/* Image preview */}
        {(postType === 'image' || postType === 'video') && imageUrl && (
          <div className="relative w-full aspect-square rounded-lg overflow-hidden mb-2 bg-gray-100">
            <img src={imageUrl} alt="Post preview" className="w-full h-full object-cover" />
            {postType === 'video' && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
                  <VideoIcon className="w-6 h-6 text-gray-800" />
                </div>
              </div>
            )}
          </div>
        )}
        {/* Caption */}
        <p className="text-xs text-gray-700 leading-relaxed line-clamp-3">{caption}</p>
        {/* Engagement mock */}
        <div className="flex items-center gap-3 mt-2 pt-2 border-t border-gray-100 text-xs text-gray-400">
          <span>❤️ 0</span><span>💬 0</span><span>🔗 Share</span>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────
export function SocialMediaScheduler({
  isopen, onClose, post, businessData, videoBlob, imageBlob, defaultPostType,
}: SocialMediaSchedulerProps) {
  const [postType, setPostType] = useState<PostType>(defaultPostType ?? 'text');
  const [scheduleMode, setScheduleMode] = useState<ScheduleMode>('schedule');
  const [selectedPlats, setSelectedPlats] = useState<SocialPlatform[]>(['instagram', 'facebook']);
  const [scheduledDate, setScheduledDate] = useState('');
  const [postsPerDay, setPostsPerDay] = useState(2);
  const [durationDays, setDurationDays] = useState(30);
  const [caption, setCaption] = useState(post.content);
  const [hashtags, setHashtags] = useState(
    businessData?.businessType
      ? `#${businessData.businessType.replace(/\s/g, '')} #ai #marketing #viral`
      : '#marketing #ai #viral'
  );
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generatingImg, setGeneratingImg] = useState(false);
  const [status, setStatus] = useState<'idle' | 'posting' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [previewPlatform, setPreviewPlatform] = useState(0);
  const [fbTokenExpired, setFbTokenExpired] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const stats = socialScheduler.getStats();

  // Set default scheduled date after mount to avoid hydration mismatch
  useEffect(() => {
    if (!scheduledDate) {
      setScheduledDate(new Date(Date.now() + 3_600_000).toISOString().slice(0, 16));
    }
  }, []);

  // Auto-detect: if video blob provided, default to video
  useEffect(() => {
    if (defaultPostType) { setPostType(defaultPostType); return; }
    if (videoBlob) setPostType('video');
    else if (imageBlob) setPostType('image');
  }, [videoBlob, imageBlob, defaultPostType]);

  // Active image to show in preview
  const activeImageUrl = postType === 'video'
    ? (generatedImage || uploadedImage)
    : (uploadedImage || generatedImage);

  // Platforms that support the current post type
  const eligiblePlatforms = PLATFORMS_CONFIG.filter(p =>
    (postType === 'text' && p.supportsText) ||
    (postType === 'image' && p.supportsImage) ||
    (postType === 'video' && p.supportsVideo)
  );

  // Auto-deselect ineligible platforms when postType changes
  useEffect(() => {
    const eligibleIds = eligiblePlatforms.map(p => p.id);
    setSelectedPlats(prev => prev.filter(id => eligibleIds.includes(id)));
  }, [postType]);

  const togglePlatform = (id: SocialPlatform) =>
    setSelectedPlats(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );

  // ── Image upload ─────────────────────────────────────────────────
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setUploadedImage(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  // ── AI image generation ──────────────────────────────────────────
  const handleGenerateImage = useCallback(async () => {
    setGeneratingImg(true);
    const tone = detectTone(caption);
    const [c1, c2] = TONE_GRADIENTS[tone];
    const brand = businessData?.businessType || post.character.name || 'AI Post';
    try {
      const blob = await generateCanvasImage(caption.slice(0, 140), brand, [c1, c2]);
      const url = URL.createObjectURL(blob);
      setGeneratedImage(url);
    } finally {
      setGeneratingImg(false);
    }
  }, [caption, businessData, post.character.name]);

  // Auto-generate on switching to image mode
  useEffect(() => {
    if (postType === 'image' && !uploadedImage && !generatedImage) {
      handleGenerateImage();
    }
  }, [postType]);

  // ── Schedule / Post ───────────────────────────────────────────────
  const handleSubmit = async () => {
    if (selectedPlats.length === 0) {
      setStatus('error'); setStatusMessage('Please select at least one platform.'); return;
    }
    setStatus('posting'); setStatusMessage('');

    try {
      let mediaUrl: string | undefined;
      let mediaType: 'text' | 'image' | 'video' = postType;

      if (postType === 'video' && videoBlob) {
        mediaUrl = URL.createObjectURL(videoBlob);
      } else if (postType === 'image') {
        mediaUrl = uploadedImage || generatedImage || undefined;
      }
      // text-only: mediaUrl stays undefined — that's correct for Facebook text posts

      const fullCaption = `${caption}\n\n${hashtags}`.trim();

      if (scheduleMode === 'auto') {
        const totalPosts = postsPerDay * durationDays;
        socialScheduler.scheduleMultiplePosts(
          fullCaption, mediaUrl || '', mediaType,
          selectedPlats, new Date(scheduledDate), totalPosts
        );
        setStatus('success');
        setStatusMessage(`✅ ${totalPosts} posts auto-scheduled across ${selectedPlats.length} platform${selectedPlats.length > 1 ? 's' : ''} over ${durationDays} days!`);
        setTimeout(() => { setStatus('idle'); onClose(); }, 3000);

      } else if (scheduleMode === 'schedule') {
        // Schedule for later (no live API call needed yet)
        socialScheduler.schedulePost({
          content: fullCaption, mediaUrl, mediaType,
          platforms: selectedPlats,
          scheduledDate: new Date(scheduledDate),
          caption: fullCaption,
          hashtags: hashtags.split(' ').filter(h => h.startsWith('#')),
        });
        setStatus('success');
        setStatusMessage(
          `✅ Scheduled for ${new Date(scheduledDate).toLocaleString()} on ` +
          `${selectedPlats.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(', ')}.`
        );
        setTimeout(() => { setStatus('idle'); onClose(); }, 4000);

      } else {
        // ── POST NOW ──────────────────────────────────────────────
        // Strategy: Try connected accounts first (tokens stored server-side),
        // then fall back to localStorage credentials (legacy flow).

        setStatusMessage(`📤 Sending${postType === 'text' ? ' text post' : ''} to ${selectedPlats.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(', ')}…`);

        // Register the post in our local scheduler
        const newPost = socialScheduler.schedulePost({
          content: fullCaption, mediaUrl, mediaType,
          platforms: selectedPlats,
          scheduledDate: new Date(),
          caption: fullCaption,
          hashtags: hashtags.split(' ').filter(h => h.startsWith('#')),
        });

        // ── Step 1: Check for connected accounts (Social Accounts Hub) ────
        let connectedAccountIds: string[] = [];
        let coveredPlatforms = new Set<string>();
        let uncoveredPlatforms: string[] = [...selectedPlats];

        try {
          const acctRes = await serverFetch('/social-accounts');
          if (acctRes.ok) {
            const acctData = await acctRes.json();
            const accounts = acctData.accounts || [];
            const activeAccounts = accounts.filter((a: any) => a.status === 'active');

            for (const plat of selectedPlats) {
              const match = activeAccounts.find((a: any) => a.platform === plat);
              if (match) {
                connectedAccountIds.push(match.id);
                coveredPlatforms.add(plat);
              }
            }
            uncoveredPlatforms = selectedPlats.filter(p => !coveredPlatforms.has(p));
          }
        } catch (e) {
          console.warn('[Scheduler] Could not fetch connected accounts, falling back to legacy:', e);
        }

        let allResults: { platform: string; label: string; success: boolean; error?: string; postId?: string; url?: string; tokenExpired?: boolean }[] = [];

        // ── Step 2: Publish via connected accounts (server-side tokens) ────
        if (connectedAccountIds.length > 0) {
          try {
            const pubRes = await serverFetch('/social-accounts/publish-multi', {
              method: 'POST',
              body: JSON.stringify({
                accountIds: connectedAccountIds,
                content: fullCaption,
                mediaUrl,
              }),
            });
            const pubData = await pubRes.json();
            if (pubData.results) {
              for (const [id, r] of Object.entries(pubData.results) as any) {
                allResults.push({
                  platform: r.platform,
                  label: (r.platform || '').charAt(0).toUpperCase() + (r.platform || '').slice(1),
                  success: r.success,
                  error: r.error,
                  postId: r.postId,
                  url: r.url,
                  tokenExpired: r.tokenExpired,
                });
              }
            }
          } catch (e) {
            console.error('[Scheduler] Connected accounts publish error:', e);
          }
        }

        // ── Step 3: Fallback — publish uncovered platforms via legacy creds ──
        if (uncoveredPlatforms.length > 0) {
          const savedCreds = localStorage.getItem('socialCredentials');
          const credentials = savedCreds ? JSON.parse(savedCreds) : {};

          const missingCreds = uncoveredPlatforms.filter(p => {
            if (p === 'facebook') return !credentials.facebook?.accessToken && !credentials.facebook?.pageAccessToken;
            if (p === 'instagram') return !credentials.instagram?.accessToken || !credentials.instagram?.accountId;
            if (p === 'twitter') return !credentials.twitter?.accessToken;
            if (p === 'linkedin') return !credentials.linkedin?.accessToken;
            return false;
          });

          const postablePlatforms = uncoveredPlatforms.filter(p => !missingCreds.includes(p));

          if (postablePlatforms.length > 0) {
            try {
              const response = await serverFetch('/social-media/post', {
                method: 'POST',
                body: JSON.stringify({
                  platforms: postablePlatforms,
                  caption: fullCaption,
                  hashtags: '',
                  mediaUrl: mediaUrl,
                  mediaType: postType,
                  credentials,
                }),
              });

              const data = await response.json();

              if (response.ok && data.results) {
                for (const p of postablePlatforms) {
                  const r = data.results[p] || {};
                  allResults.push({
                    platform: p,
                    label: p.charAt(0).toUpperCase() + p.slice(1),
                    success: r.success ?? false,
                    error: r.error,
                    postId: r.postId,
                    url: r.url,
                    tokenExpired: r.tokenExpired ?? false,
                  });
                }
              } else {
                for (const p of postablePlatforms) {
                  allResults.push({
                    platform: p,
                    label: p.charAt(0).toUpperCase() + p.slice(1),
                    success: false,
                    error: data.error || 'Server error',
                  });
                }
              }
            } catch (e: any) {
              for (const p of postablePlatforms) {
                allResults.push({ platform: p, label: p.charAt(0).toUpperCase() + p.slice(1), success: false, error: e.message });
              }
            }
          }

          if (missingCreds.length > 0 && allResults.length === 0) {
            setStatus('error');
            setStatusMessage(
              `⚙️ No credentials found for: ${missingCreds.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(', ')}. ` +
              `Connect accounts via Social Accounts Hub or add credentials in Social Media Settings.`
            );
            socialScheduler.updatePost(newPost.id, { status: 'failed' });
            return;
          }
        }

        // ── Step 4: Process combined results ────────────────────────────
        const succeeded = allResults.filter(r => r.success);
        const failed = allResults.filter(r => !r.success);

        const fbExpired = allResults.some(r => r.platform === 'facebook' && r.tokenExpired);
        if (fbExpired) {
          const saved = localStorage.getItem('socialCredentials');
          if (saved) {
            try {
              const creds = JSON.parse(saved);
              if (creds.facebook) {
                delete creds.facebook.accessToken;
                delete creds.facebook.pageAccessToken;
                localStorage.setItem('socialCredentials', JSON.stringify(creds));
              }
            } catch { /* ignore */ }
          }
          setFbTokenExpired(true);
        }

        if (succeeded.length > 0 && failed.length === 0) {
          socialScheduler.updatePost(newPost.id, { status: 'posted' });
          setStatus('success');
          setStatusMessage(
            `✅ Published to ${succeeded.map(r => r.label).join(', ')}!` +
            (succeeded[0]?.postId ? ` (ID: ${succeeded[0].postId.slice(-10)})` : '') +
            (connectedAccountIds.length > 0 ? ' (via Connected Accounts)' : '')
          );
        } else if (succeeded.length > 0) {
          socialScheduler.updatePost(newPost.id, { status: 'posted' });
          setStatus('success');
          setStatusMessage(
            `⚠️ Posted to ${succeeded.map(r => r.label).join(', ')}. ` +
            `Failed: ${failed.map(r => `${r.label} — ${r.error || 'unknown error'}`).join('; ')}`
          );
        } else {
          socialScheduler.updatePost(newPost.id, { status: 'failed' });
          setStatus('error');
          const errDetail = failed.map(r => `${r.label}: ${r.error || 'unknown error'}`).join(' · ');
          setStatusMessage(`❌ Post failed on all platforms. ${errDetail}`);
          return;
        }

        setTimeout(() => { setStatus('idle'); onClose(); }, 5000);
      }
    } catch (err) {
      console.error('Scheduling error:', err);
      setStatus('error');
      setStatusMessage(`❌ ${err instanceof Error ? err.message : 'Failed to post. Please try again.'}`);
    }
  };

  // ── Facebook reconnect via OAuth (client-side dialog, no server redirect) ──
  const handleFbReconnect = async () => {
    const saved = localStorage.getItem('socialCredentials');
    let appId = '';
    try {
      const creds = JSON.parse(saved || '{}');
      appId = creds?.facebook?.appId || '';
    } catch (e) {
      console.error('Failed to parse social credentials', e);
    }

    if (!appId) {
      setStatusMessage('❌ No Facebook App ID found. Please configure in Social Media Settings first.');
      setStatus('error');
      return;
    }

    // ── Use the Supabase Edge Function as the stable OAuth callback URL ───
    // The ?apikey= (public anon key) is required because Facebook's browser redirect
    // carries no Authorization header, so Supabase would return 401 without it.
    const callbackUri = resolveCallbackUrl('/facebook-oauth-callback', {
      apikey: publicAnonKey,
    });

    // Pass the current app URL so the server can redirect back here after auth
    const returnUrl = window.location.href.split('?')[0];
    const state = btoa(JSON.stringify({ appId, returnUrl }));

    const fbDialog =
      `https://www.facebook.com/v21.0/dialog/oauth` +
      `?client_id=${encodeURIComponent(appId)}` +
      `&redirect_uri=${encodeURIComponent(callbackUri)}` +
      `&scope=pages_manage_posts,pages_read_engagement,pages_show_list` +
      `&state=${encodeURIComponent(state)}` +
      `&response_type=code`;

    window.location.href = fbDialog;
  };

  if (!isopen) return null;

  const previewConfig = eligiblePlatforms[previewPlatform % eligiblePlatforms.length] ?? PLATFORMS_CONFIG[0];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="min-h-screen flex items-start justify-center p-4 pt-8">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden">

          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 flex items-center justify-between text-white">
            <div>
              <h2 className="text-xl font-bold">📅 Social Media Scheduler</h2>
              <p className="text-sm opacity-80 mt-0.5">Schedule text, image, and video posts across all platforms</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex flex-col lg:flex-row min-h-0">

            {/* ── LEFT: Config ── */}
            <div className="flex-1 p-6 space-y-6 overflow-y-auto">

              {/* Stats bar */}
              <div className="grid grid-cols-4 gap-3">
                {[
                  { val: stats.scheduled, label: 'Queued', color: 'blue' },
                  { val: stats.posted, label: 'Posted', color: 'green' },
                  { val: stats.pending, label: 'Pending', color: 'yellow' },
                  { val: postsPerDay * durationDays, label: 'Planned', color: 'purple' },
                ].map(s => (
                  <div key={s.label} className={`bg-${s.color}-50 rounded-xl p-3 text-center border border-${s.color}-100`}>
                    <p className={`text-xl font-bold text-${s.color}-600`}>{s.val}</p>
                    <p className={`text-xs text-${s.color}-700`}>{s.label}</p>
                  </div>
                ))}
              </div>

              {/* ── Facebook Expired Token Banner ── */}
              {fbTokenExpired && (
                <div className="rounded-xl border-2 border-orange-300 bg-orange-50 p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                      <Facebook className="w-5 h-5 text-orange-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-orange-900 text-sm">Facebook session expired</p>
                      <p className="text-xs text-orange-700 mt-0.5 leading-relaxed">
                        Your Facebook access token has expired. The expired token has been cleared automatically.
                        Click below to reconnect with a <strong>permanent Page token</strong> that never expires.
                      </p>
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={handleFbReconnect}
                          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs font-bold shadow-sm"
                        >
                          <RefreshCw className="w-3.5 h-3.5" /> Reconnect Facebook
                        </button>
                        <button
                          onClick={() => { window.dispatchEvent(new CustomEvent('openSocialSettings')); onClose(); }}
                          className="flex items-center gap-1.5 px-4 py-2 bg-white border border-orange-300 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors text-xs font-semibold"
                        >
                          <Settings className="w-3.5 h-3.5" /> Open Social Settings
                        </button>
                      </div>
                    </div>
                    <button onClick={() => setFbTokenExpired(false)} className="text-orange-400 hover:text-orange-600 flex-shrink-0">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* ── Post Type ── */}
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-3">Post Format</label>
                <div className="grid grid-cols-3 gap-3">
                  {([
                    { id: 'text' as PostType, icon: Type, label: 'Text Only', desc: 'Caption + hashtags', color: 'from-blue-500 to-indigo-500' },
                    { id: 'image' as PostType, icon: ImageIcon, label: 'Image Post', desc: 'Upload or AI-gen', color: 'from-green-500 to-teal-500' },
                    { id: 'video' as PostType, icon: VideoIcon, label: 'Video Post', desc: 'UGC or clip', color: 'from-red-500 to-pink-500' },
                  ] as const).map(t => (
                    <button key={t.id} onClick={() => setPostType(t.id)}
                      className={`relative p-4 rounded-xl border-2 transition-all text-center ${postType === t.id ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-purple-200 hover:bg-purple-50/30'
                        }`}>
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${t.color} flex items-center justify-center mx-auto mb-2`}>
                        <t.icon className="w-5 h-5 text-white" />
                      </div>
                      <p className="text-sm font-bold text-gray-800">{t.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{t.desc}</p>
                      {postType === t.id && (
                        <div className="absolute top-2 right-2 w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Image controls ── */}
              {postType === 'image' && (
                <div className="space-y-3">
                  <label className="block text-sm font-bold text-gray-800">Image Source</label>
                  <div className="flex gap-3">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl hover:border-purple-400 hover:bg-purple-50 transition-all text-sm text-gray-600"
                    >
                      <Upload className="w-4 h-4" /> Upload Image
                    </button>
                    <button
                      onClick={handleGenerateImage}
                      disabled={generatingImg}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl hover:from-violet-700 hover:to-purple-700 transition-all text-sm font-semibold disabled:opacity-60"
                    >
                      {generatingImg
                        ? <><RefreshCw className="w-4 h-4 animate-spin" /> Generating…</>
                        : <><Sparkles className="w-4 h-4" /> AI Background</>
                      }
                    </button>
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  </div>
                  {activeImageUrl && (
                    <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
                      <img src={activeImageUrl} alt="Post image" className="w-full h-full object-cover" />
                      <div className="absolute top-2 right-2 px-2 py-1 bg-black/50 text-white text-xs rounded-full">
                        {uploadedImage ? '📁 Uploaded' : '✨ AI Generated'}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── Video info ── */}
              {postType === 'video' && (
                <div className={`rounded-xl p-4 border ${videoBlob ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    {videoBlob
                      ? <Check className="w-4 h-4 text-green-600" />
                      : <AlertCircle className="w-4 h-4 text-amber-600" />
                    }
                    <span className={`text-sm font-semibold ${videoBlob ? 'text-green-800' : 'text-amber-800'}`}>
                      {videoBlob ? 'Video ready to post' : 'No video attached'}
                    </span>
                  </div>
                  <p className={`text-xs ${videoBlob ? 'text-green-700' : 'text-amber-700'}`}>
                    {videoBlob
                      ? `${post.duration}s UGC video will be uploaded to all selected platforms.`
                      : 'Generate a UGC Video from the post card first, then open the scheduler. You can still schedule text + caption for video platforms.'
                    }
                  </p>
                </div>
              )}

              {/* ── Platforms ── */}
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-3">
                  Platforms <span className="text-gray-400 font-normal">({selectedPlats.length} selected)</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {PLATFORMS_CONFIG.map(p => {
                    const supported = eligiblePlatforms.some(e => e.id === p.id);
                    const selected = selectedPlats.includes(p.id);
                    return (
                      <button
                        key={p.id}
                        onClick={() => supported && togglePlatform(p.id)}
                        disabled={!supported}
                        className={`relative flex items-center gap-2.5 px-3 py-2.5 rounded-xl border-2 transition-all text-left ${!supported ? 'opacity-30 cursor-not-allowed border-gray-100 bg-gray-50' :
                          selected ? 'border-current bg-opacity-10'
                            : 'border-gray-200 hover:border-gray-300'
                          }`}
                        style={selected ? { borderColor: p.color, background: p.color + '18', color: p.color } : {}}
                        onMouseEnter={() => setPreviewPlatform(PLATFORMS_CONFIG.indexOf(p))}
                      >
                        <p.icon className="w-4 h-4 flex-shrink-0" style={selected ? { color: p.color } : { color: '#6b7280' }} />
                        <div className="min-w-0">
                          <p className="text-xs font-bold truncate" style={selected ? { color: p.color } : { color: '#374151' }}>{p.label}</p>
                          {!supported && <p className="text-xs text-gray-400">No {postType}</p>}
                        </div>
                        {selected && (
                          <div className="absolute top-1 right-1 w-4 h-4 rounded-full flex items-center justify-center" style={{ background: p.color }}>
                            <Check className="w-2.5 h-2.5 text-white" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ── Schedule Mode ── */}
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-3">Schedule</label>
                <div className="grid grid-cols-3 gap-3">
                  {([
                    { id: 'now' as ScheduleMode, icon: Send, label: 'Post Now', desc: 'Immediate', color: 'green' },
                    { id: 'schedule' as ScheduleMode, icon: Clock, label: 'Schedule Once', desc: 'Pick date/time', color: 'blue' },
                    { id: 'auto' as ScheduleMode, icon: Calendar, label: 'Auto Campaign', desc: 'Multiple posts', color: 'purple' },
                  ] as const).map(m => (
                    <button key={m.id} onClick={() => setScheduleMode(m.id)}
                      className={`p-3 border-2 rounded-xl transition-all text-center ${scheduleMode === m.id
                        ? `border-${m.color}-500 bg-${m.color}-50`
                        : `border-gray-200 hover:border-${m.color}-200`
                        }`}>
                      <m.icon className={`w-5 h-5 mx-auto mb-1.5 text-${m.color}-600`} />
                      <p className="text-sm font-bold text-gray-800">{m.label}</p>
                      <p className="text-xs text-gray-500">{m.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Date picker */}
              {(scheduleMode === 'schedule' || scheduleMode === 'auto') && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {scheduleMode === 'auto' ? 'Campaign Start Date' : 'Post Date & Time'}
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduledDate}
                    onChange={e => setScheduledDate(e.target.value)}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none text-sm"
                  />
                </div>
              )}

              {/* Auto-campaign settings */}
              {scheduleMode === 'auto' && (
                <div className="bg-purple-50 rounded-xl p-4 space-y-3">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-purple-800 mb-1">Posts / Day</label>
                      <input type="number" min="1" max="12" value={postsPerDay}
                        onChange={e => setPostsPerDay(+e.target.value)}
                        className="w-full px-3 py-2 border-2 border-purple-200 rounded-lg focus:border-purple-500 focus:outline-none text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-purple-800 mb-1">Duration (Days)</label>
                      <input type="number" min="1" max="365" value={durationDays}
                        onChange={e => setDurationDays(+e.target.value)}
                        className="w-full px-3 py-2 border-2 border-purple-200 rounded-lg focus:border-purple-500 focus:outline-none text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-purple-800 mb-1">Total Posts</label>
                      <div className="flex items-center justify-center h-10 bg-white border-2 border-purple-300 rounded-lg">
                        <span className="text-xl font-bold text-purple-700">{postsPerDay * durationDays}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Caption */}
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2">
                  Caption <span className="text-gray-400 font-normal text-xs">({caption.length}/2200)</span>
                </label>
                <textarea value={caption} onChange={e => setCaption(e.target.value)} rows={4}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none text-sm resize-none"
                  maxLength={2200} />
              </div>

              {/* Hashtags */}
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2">Hashtags</label>
                <input type="text" value={hashtags} onChange={e => setHashtags(e.target.value)}
                  placeholder="#ai #marketing #viral"
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none text-sm" />
              </div>

              {/* Best times */}
              {selectedPlats.length > 0 && (
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-4">
                  <h4 className="font-semibold text-blue-900 mb-2 text-sm">📊 Best Posting Times</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedPlats.map(plat => {
                      const spec = PLATFORM_SPECS[plat];
                      if (!spec) return null;
                      return (
                        <div key={plat} className="text-xs">
                          <span className="font-semibold text-blue-800">{spec.icon} {spec.name}: </span>
                          <span className="text-blue-700">{spec.bestPostTimes?.join(', ')}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Status */}
              {status !== 'idle' && (
                <div className={`rounded-xl p-4 text-sm font-medium flex items-center gap-2 ${status === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
                  status === 'error' ? 'bg-red-50 text-red-800 border border-red-200' :
                    'bg-blue-50 text-blue-800 border border-blue-200'
                  }`}>
                  {status === 'posting' && <RefreshCw className="w-4 h-4 animate-spin" />}
                  {status === 'success' && <Check className="w-4 h-4" />}
                  {status === 'error' && <AlertCircle className="w-4 h-4" />}
                  {statusMessage || 'Processing…'}
                </div>
              )}

              {/* Submit */}
              <div className="flex gap-3 pb-4">
                <button
                  onClick={handleSubmit}
                  disabled={selectedPlats.length === 0 || status === 'posting' || status === 'success'}
                  className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {status === 'posting' ? (
                    <><RefreshCw className="w-4 h-4 animate-spin" /> Posting…</>
                  ) : scheduleMode === 'now' ? (
                    <><Send className="w-4 h-4" /> Post Now to {selectedPlats.length} Platform{selectedPlats.length !== 1 ? 's' : ''}</>
                  ) : scheduleMode === 'auto' ? (
                    <><Calendar className="w-4 h-4" /> Auto-Schedule {postsPerDay * durationDays} Posts</>
                  ) : (
                    <><Clock className="w-4 h-4" /> Schedule Post</>
                  )}
                </button>
                <button onClick={onClose}
                  className="px-5 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors">
                  Cancel
                </button>
              </div>
            </div>

            {/* ── RIGHT: Live Preview ── */}
            <div className="lg:w-80 bg-gray-50 border-t lg:border-t-0 lg:border-l border-gray-200 p-5 flex flex-col gap-4">
              <div>
                <h3 className="text-sm font-bold text-gray-800 mb-1">Live Preview</h3>
                <p className="text-xs text-gray-500">Hover a platform to preview</p>
              </div>

              {/* Platform preview */}
              <PlatformPreview
                platform={previewConfig}
                postType={postType}
                caption={`${caption}\n${hashtags}`}
                imageUrl={activeImageUrl}
              />

              {/* Post type summary */}
              <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-2.5">
                <p className="text-xs font-bold text-gray-700 uppercase tracking-wide">Post Summary</p>
                {[
                  { label: 'Format', val: postType === 'text' ? '📝 Text Only' : postType === 'image' ? '🖼️ Image Post' : '🎬 Video Post' },
                  { label: 'Platforms', val: selectedPlats.length > 0 ? selectedPlats.join(', ') : 'None selected' },
                  { label: 'Schedule', val: scheduleMode === 'now' ? 'Immediately' : scheduleMode === 'auto' ? `${postsPerDay * durationDays} posts / ${durationDays} days` : new Date(scheduledDate).toLocaleString() },
                  { label: 'Caption', val: `${caption.length} chars` },
                  { label: 'Tags', val: hashtags.split(' ').filter(h => h.startsWith('#')).length + ' hashtags' },
                ].map(row => (
                  <div key={row.label} className="flex justify-between text-xs">
                    <span className="text-gray-500">{row.label}</span>
                    <span className="font-medium text-gray-800 text-right max-w-[56%] truncate">{row.val}</span>
                  </div>
                ))}
              </div>

              {/* Tips per post type */}
              <div className="bg-gradient-to-br from-violet-50 to-pink-50 border border-violet-200 rounded-xl p-4">
                <p className="text-xs font-bold text-violet-800 mb-2">
                  {postType === 'text' ? '📝 Text Post Tips' : postType === 'image' ? '🖼️ Image Tips' : '🎬 Video Tips'}
                </p>
                <ul className="text-xs text-violet-700 space-y-1">
                  {postType === 'text' && <>
                    <li>• Keep under 280 chars for X/Twitter</li>
                    <li>• LinkedIn text posts get 3× reach</li>
                    <li>• Use emojis to boost engagement</li>
                    <li>• End with a question to drive comments</li>
                  </>}
                  {postType === 'image' && <>
                    <li>• 1080×1080 square works on all platforms</li>
                    <li>• AI backgrounds match your brand tone</li>
                    <li>• Keep center empty for text overlay</li>
                    <li>• 4:5 vertical boosts Instagram reach</li>
                  </>}
                  {postType === 'video' && <>
                    <li>• 7s videos have highest completion rate</li>
                    <li>• First 2s determine if viewer stays</li>
                    <li>• Add captions — 80% watch muted</li>
                    <li>• 9:16 vertical is best for TikTok/Reels</li>
                  </>}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}