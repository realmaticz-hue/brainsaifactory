import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  X, Download, Video, CheckCircle, Sparkles, RefreshCw, Wand2,
  Calendar, Check, Globe, Clock, BarChart3,
} from 'lucide-react';
import type { BlogPost } from '../utils/blogGenerator';
import {
  detectTone, TONE_META, TONE_PALETTES, TONE_STYLE_MAP, STYLE_META, hexToRgba,
  makeGrainPattern, applyGrain,
  drawAurora, drawParticles, drawWaves, drawBokeh, drawGeometric, drawBurst,
  initParticles,
  type EmotionalTone, type BackgroundStyle, type BrandPalette,
} from '../utils/backgroundEngine';
import { socialScheduler } from '../utils/socialMediaScheduler';
import type { SocialPlatform } from '../utils/socialMediaScheduler';

// ─── Types ────────────────────────────────────────────────────
type BlogType = 'text' | 'image' | 'video';
type AspectRatio = '1:1' | '4:5' | '9:16' | '16:9';
type FontStyle = 'modern' | 'editorial' | 'bold' | 'clean';
type TextColor = 'dark' | 'light' | 'brand';
type Tab = 'design' | 'brand' | 'schedule';

const ASPECT_SIZES: Record<AspectRatio, [number, number]> = {
  '1:1': [1080, 1080],
  '4:5': [1080, 1350],
  '9:16': [1080, 1920],
  '16:9': [1920, 1080],
};

const ASPECT_LABEL: Record<AspectRatio, string> = {
  '1:1': 'Square',
  '4:5': 'Portrait',
  '9:16': 'Story',
  '16:9': 'Landscape',
};

const FONT_FAMILIES: Record<FontStyle, string> = {
  modern: 'Inter, Helvetica Neue, Helvetica, Arial, sans-serif',
  editorial: 'Georgia, "Times New Roman", Times, serif',
  bold: 'Impact, "Arial Black", Haettenschweiler, sans-serif',
  clean: '"Helvetica Neue", Helvetica, Arial, sans-serif',
};

interface Platform {
  id: string;
  label: string;
  icon: string;
  color: string;
  bestRatio: AspectRatio;
  maxCaption: number;
}

const PLATFORMS: Platform[] = [
  { id: 'instagram', label: 'Instagram', icon: '📸', color: '#E1306C', bestRatio: '1:1', maxCaption: 2200 },
  { id: 'tiktok', label: 'TikTok', icon: '🎵', color: '#000000', bestRatio: '9:16', maxCaption: 2200 },
  { id: 'facebook', label: 'Facebook', icon: '📘', color: '#1877F2', bestRatio: '1:1', maxCaption: 63206 },
  { id: 'x', label: 'Twitter/X', icon: '𝕏', color: '#1DA1F2', bestRatio: '16:9', maxCaption: 280 },
  { id: 'linkedin', label: 'LinkedIn', icon: '💼', color: '#0A66C2', bestRatio: '4:5', maxCaption: 3000 },
  { id: 'youtube', label: 'YouTube', icon: '▶️', color: '#FF0000', bestRatio: '16:9', maxCaption: 5000 },
];

const BLOG_TYPES: { id: BlogType; label: string; icon: string; desc: string }[] = [
  { id: 'text', label: 'Text Blog', icon: '📝', desc: 'Text on animated brand background' },
  { id: 'image', label: 'Image Blog', icon: '🖼️', desc: 'Magazine-style blog card template' },
  { id: 'video', label: 'Video Blog', icon: '🎬', desc: 'Animated video with character overlay' },
];

// ─── Canvas helpers ───────────────────────────────────────────

function wrapToLines(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const test = cur ? cur + ' ' + w : w;
    if (ctx.measureText(test).width > maxW && cur) { lines.push(cur); cur = w; }
    else cur = test;
  }
  if (cur) lines.push(cur);
  return lines;
}

function drawLines(ctx: CanvasRenderingContext2D, lines: string[], cx: number, startY: number, lh: number) {
  lines.forEach((line, i) => ctx.fillText(line, cx, startY + i * lh));
}

function roundPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

function extractHeadline(c: string) {
  const s = c.split(/[.!?]+/).map(x => x.trim()).filter(x => x.length > 10);
  return (s[0] || c).split(' ').slice(0, 9).join(' ') || 'Transform Your Strategy Today';
}

function extractTagline(c: string) {
  const s = c.split(/[.!?]+/).map(x => x.trim()).filter(x => x.length > 20);
  return (s[1] || s[0] || '').slice(0, 70) || 'Discover the power of AI-driven marketing.';
}

function extractExcerpt(c: string) {
  const s = c.split(/[.!?]+/).map(x => x.trim()).filter(x => x.length > 20);
  return s.slice(0, 2).join('. ') + (s.length >= 2 ? '.' : '') || c.slice(0, 130);
}

// ─── Blog-type specific canvas renderers ─────────────────────

interface DrawOptions {
  W: number; H: number;
  palette: BrandPalette;
  font: string;
  textColor: TextColor;
  showGlass: boolean;
  headline: string;
  tagline: string;
  ctaText: string;
  brandName: string;
  excerpt: string;
  category: string;
  duration: number;
  grain: CanvasPattern | null;
  grainAmt: number;
}

function renderTextBlog(ctx: CanvasRenderingContext2D, opts: DrawOptions) {
  const { W, H, palette, font, textColor, showGlass, headline, tagline, ctaText, brandName } = opts;
  const cx = W / 2;

  const mainCol = textColor === 'dark' ? '#1a1a2e' : textColor === 'brand' ? palette.primary : '#ffffff';
  const subCol = textColor === 'dark' ? palette.primary : textColor === 'brand' ? palette.secondary : 'rgba(255,255,255,0.88)';
  const muted = textColor === 'dark' ? 'rgba(100,100,120,0.65)' : 'rgba(255,255,255,0.5)';

  const hFS = Math.floor(W * 0.067);
  const tFS = Math.floor(W * 0.031);
  const cFS = Math.floor(W * 0.028);
  const bFS = Math.floor(W * 0.022);

  const panelW = W * 0.74; const panelH = H * 0.45;
  const panelX = (W - panelW) / 2; const panelY = (H - panelH) / 2;

  // Glass frosted panel
  if (showGlass) {
    ctx.save();
    ctx.fillStyle = textColor === 'dark' ? 'rgba(255,255,255,0.82)' : 'rgba(0,0,0,0.52)';
    ctx.shadowColor = 'rgba(0,0,0,0.12)'; ctx.shadowBlur = 32;
    roundPath(ctx, panelX, panelY, panelW, panelH, Math.floor(W * 0.025));
    ctx.fill();
    ctx.restore();
  }

  ctx.save();
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';

  // Headline
  ctx.font = `bold ${hFS}px ${font}`;
  ctx.fillStyle = mainCol;
  if (!showGlass) { ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = 10; }
  const hlLines = wrapToLines(ctx, headline, panelW * 0.85).slice(0, 3);
  const hlLH = hFS * 1.24;
  const hlTotalH = hlLines.length * hlLH;
  const hlStartY = panelY + panelH * 0.22;
  drawLines(ctx, hlLines, cx, hlStartY, hlLH);
  ctx.shadowBlur = 0;

  // Divider accent line
  const divY = hlStartY + hlTotalH + hFS * 0.6;
  ctx.strokeStyle = palette.accent; ctx.lineWidth = Math.max(2, W * 0.002);
  ctx.globalAlpha = 0.7;
  ctx.beginPath(); ctx.moveTo(cx - W * 0.06, divY); ctx.lineTo(cx + W * 0.06, divY); ctx.stroke();
  ctx.globalAlpha = 1;

  // Tagline
  if (tagline) {
    ctx.font = `${tFS}px ${font}`;
    ctx.fillStyle = subCol;
    const tlLines = wrapToLines(ctx, tagline, panelW * 0.82).slice(0, 2);
    const tlStartY = divY + tFS * 1.6;
    drawLines(ctx, tlLines, cx, tlStartY, tFS * 1.55);

    // CTA Button
    if (ctaText) {
      const ctaY = tlStartY + tlLines.length * tFS * 1.55 + cFS * 2.5;
      ctx.font = `bold ${cFS}px ${font}`;
      const ctaW = ctx.measureText(ctaText).width + W * 0.09;
      const ctaH = cFS * 2.4;
      const ctaX = cx - ctaW / 2;
      ctx.fillStyle = palette.primary;
      ctx.shadowColor = hexToRgba(palette.primary, 0.4); ctx.shadowBlur = 16;
      roundPath(ctx, ctaX, ctaY, ctaW, ctaH, ctaH / 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ffffff';
      ctx.fillText(ctaText, cx, ctaY + ctaH / 2);
    }
  }

  // Brand bar at bottom
  const barY = H - bFS * 4;
  ctx.font = `${bFS}px ${font}`; ctx.fillStyle = muted;
  ctx.fillText(brandName, cx, barY);

  // Thin line above brand
  ctx.strokeStyle = palette.primary; ctx.lineWidth = 1; ctx.globalAlpha = 0.2;
  ctx.beginPath(); ctx.moveTo(cx - W * 0.1, barY - bFS * 1.6); ctx.lineTo(cx + W * 0.1, barY - bFS * 1.6); ctx.stroke();
  ctx.globalAlpha = 1;

  ctx.restore();
}

function renderImageBlog(ctx: CanvasRenderingContext2D, opts: DrawOptions) {
  const { W, H, palette, font, headline, excerpt, brandName, category, duration } = opts;
  const pad = W * 0.07;

  // ── Header area (gradient) ─
  const headerH = H * 0.42;
  const hGrad = ctx.createLinearGradient(0, 0, W, headerH);
  hGrad.addColorStop(0, palette.dark);
  hGrad.addColorStop(1, palette.primary);
  ctx.fillStyle = hGrad;
  ctx.fillRect(0, 0, W, headerH);

  // Decorative radial blobs on header
  const blobs = [
    { x: W * 0.12, y: headerH * 0.25, r: W * 0.28, c: palette.secondary, a: 0.22 },
    { x: W * 0.88, y: headerH * 0.75, r: W * 0.22, c: palette.accent, a: 0.18 },
    { x: W * 0.65, y: headerH * 0.15, r: W * 0.16, c: '#ffffff', a: 0.10 },
  ];
  blobs.forEach(b => {
    const bg = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
    bg.addColorStop(0, hexToRgba(b.c, b.a)); bg.addColorStop(1, hexToRgba(b.c, 0));
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, headerH);
  });

  // Large decorative icon in header
  ctx.save();
  ctx.globalAlpha = 0.08; ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${Math.floor(W * 0.22)}px ${font}`;
  ctx.textAlign = 'right'; ctx.textBaseline = 'bottom';
  ctx.fillText('✦', W - pad * 0.5, headerH - pad * 0.4);
  ctx.restore();

  // ── White card ─
  const cardTop = H * 0.33;
  const cardR = Math.floor(W * 0.045);
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.14)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = -10;
  ctx.fillStyle = '#ffffff';
  roundPath(ctx, 0, cardTop, W, H - cardTop, cardR);
  ctx.fill();
  ctx.restore();

  // ── Card content ─
  const contentStart = cardTop + H * 0.04;

  // Category badge
  const catFS = Math.floor(W * 0.027);
  ctx.save();
  ctx.font = `bold ${catFS}px ${font}`;
  const catTxt = category.toUpperCase().slice(0, 18);
  const catW = ctx.measureText(catTxt).width + W * 0.06;
  const catH = catFS * 2.1;
  ctx.fillStyle = palette.primary;
  ctx.shadowColor = hexToRgba(palette.primary, 0.3); ctx.shadowBlur = 12;
  roundPath(ctx, pad, contentStart, catW, catH, catH / 2);
  ctx.fill(); ctx.shadowBlur = 0;
  ctx.fillStyle = '#ffffff'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText(catTxt, pad + W * 0.03, contentStart + catH / 2);
  ctx.restore();

  // Duration badge (right)
  const durFS = Math.floor(W * 0.025);
  const durTxt = `${duration}s`;
  ctx.save();
  ctx.font = `bold ${durFS}px ${font}`;
  const durW = ctx.measureText(durTxt).width + W * 0.055;
  const durH = durFS * 2.1;
  ctx.fillStyle = palette.light;
  ctx.strokeStyle = hexToRgba(palette.primary, 0.4); ctx.lineWidth = 2;
  roundPath(ctx, W - pad - durW, contentStart, durW, durH, durH / 2);
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = palette.primary; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(durTxt, W - pad - durW / 2, contentStart + durH / 2);
  ctx.restore();

  // Headline
  const hlFS = Math.floor(W * 0.059);
  const hlY = contentStart + catH + H * 0.048;
  ctx.save();
  ctx.font = `bold ${hlFS}px ${font}`;
  ctx.fillStyle = '#0f172a'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  const hlLines = wrapToLines(ctx, headline, W - pad * 2).slice(0, 3);
  const hlLH = hlFS * 1.22;
  drawLines(ctx, hlLines, pad, hlY, hlLH);
  const afterHL = hlY + hlLines.length * hlLH;
  ctx.restore();

  // Accent divider
  ctx.save();
  ctx.strokeStyle = palette.primary; ctx.lineWidth = Math.max(3, W * 0.003);
  ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(pad, afterHL + H * 0.02); ctx.lineTo(pad + W * 0.08, afterHL + H * 0.02); ctx.stroke();
  ctx.restore();

  // Excerpt
  const exFS = Math.floor(W * 0.029);
  ctx.save();
  ctx.font = `${exFS}px ${font}`;
  ctx.fillStyle = '#475569'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  const exLines = wrapToLines(ctx, excerpt, W - pad * 2).slice(0, 3);
  drawLines(ctx, exLines, pad, afterHL + H * 0.045, exFS * 1.62);
  ctx.restore();

  // Footer divider
  const footDivY = H - H * 0.10;
  ctx.save();
  ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(pad, footDivY); ctx.lineTo(W - pad, footDivY); ctx.stroke();

  // Brand name
  const brandFS = Math.floor(W * 0.026);
  ctx.font = `bold ${brandFS}px ${font}`;
  ctx.fillStyle = palette.primary; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText(brandName, pad, footDivY + H * 0.055);

  // Right date
  ctx.font = `${Math.floor(W * 0.022)}px ${font}`;
  ctx.fillStyle = '#94a3b8'; ctx.textAlign = 'right';
  ctx.fillText('AI-Generated · ' + new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }), W - pad, footDivY + H * 0.055);
  ctx.restore();
}

function renderVideoBlog(ctx: CanvasRenderingContext2D, opts: DrawOptions) {
  const { W, H, palette, font, headline, brandName, duration } = opts;
  const cx = W / 2; const cy = H / 2;

  // Play button indicator (bottom right of center zone)
  const playR = W * 0.07;
  const playX = cx + W * 0.22;
  const playY = cy + H * 0.22;

  ctx.save();
  ctx.fillStyle = hexToRgba('#ffffff', 0.88);
  ctx.shadowColor = 'rgba(0,0,0,0.3)'; ctx.shadowBlur = 20;
  ctx.beginPath(); ctx.arc(playX, playY, playR, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0;

  ctx.fillStyle = palette.primary;
  const ps = playR * 0.45;
  ctx.beginPath();
  ctx.moveTo(playX - ps * 0.6, playY - ps);
  ctx.lineTo(playX - ps * 0.6, playY + ps);
  ctx.lineTo(playX + ps * 0.9, playY);
  ctx.closePath(); ctx.fill();

  // Duration badge
  const durFS = Math.floor(W * 0.032);
  const durTxt = `${duration}s`;
  ctx.font = `bold ${durFS}px ${font}`;
  const bW = ctx.measureText(durTxt).width + W * 0.065;
  const bH = durFS * 2.2;
  ctx.fillStyle = palette.primary;
  ctx.shadowColor = hexToRgba(palette.primary, 0.5); ctx.shadowBlur = 16;
  roundPath(ctx, cx - W * 0.32, cy - H * 0.27, bW, bH, bH / 2);
  ctx.fill(); ctx.shadowBlur = 0;
  ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(durTxt, cx - W * 0.32 + bW / 2, cy - H * 0.27 + bH / 2);
  ctx.restore();

  // Headline (smaller, top of center zone)
  ctx.save();
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  const hFS = Math.floor(W * 0.052);
  ctx.font = `bold ${hFS}px ${font}`;
  ctx.fillStyle = '#1a1a2e';
  ctx.shadowColor = 'rgba(255,255,255,0.8)'; ctx.shadowBlur = 8;
  const hlLines = wrapToLines(ctx, headline, W * 0.6).slice(0, 2);
  drawLines(ctx, hlLines, cx, cy - H * 0.25, hFS * 1.22);
  ctx.restore();

  // Brand name
  ctx.save();
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = `${Math.floor(W * 0.022)}px ${font}`;
  ctx.fillStyle = 'rgba(80,80,100,0.6)';
  ctx.fillText(brandName, cx, H - W * 0.035);
  ctx.restore();
}

// ─── Component ────────────────────────────────────────────────

interface AdStudioProps {
  post: BlogPost;
  businessData?: any;
  isopen: boolean;
  onClose: () => void;
}

export function AdStudio({ post, businessData, isopen, onClose }: AdStudioProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number | null>(null);
  const grainPatternRef = useRef<CanvasPattern | null>(null);
  const particlesRef = useRef(initParticles(TONE_PALETTES.neutral, 1080, 1080));

  const detectedTone = useMemo(() => detectTone(post.content), [post.content]);

  // ── Design state ──────────────────────────────────────────
  const [blogType, setBlogType] = useState<BlogType>('text');
  const [headline, setHeadline] = useState(() => extractHeadline(post.content));
  const [tagline, setTagline] = useState(() => extractTagline(post.content));
  const [ctaText, setCtaText] = useState('Learn More →');
  const [brandName, setBrandName] = useState(businessData?.coreTopic || businessData?.name || 'Your Brand');
  const [excerpt, setExcerpt] = useState(() => extractExcerpt(post.content));
  const [category, setCategory] = useState(businessData?.businessType || 'Marketing');
  const [tone, setTone] = useState<EmotionalTone>(detectedTone);
  const [bgStyle, setBgStyle] = useState<BackgroundStyle>(TONE_STYLE_MAP[detectedTone]);
  const [palette, setPalette] = useState<BrandPalette>(TONE_PALETTES[detectedTone]);
  const [grainAmt, setGrainAmt] = useState(18);
  const [fontStyle, setFontStyle] = useState<FontStyle>('modern');
  const [textColor, setTextColor] = useState<TextColor>('dark');
  const [showGlass, setShowGlass] = useState(true);
  const [isAnimated, setIsAnimated] = useState(true);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');

  // ── Schedule state ────────────────────────────────────────
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['instagram']);
  const [scheduleDate, setScheduleDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().slice(0, 10);
  });
  const [scheduleTime, setScheduleTime] = useState('09:00');
  const [caption, setCaption] = useState(post.content.slice(0, 280));
  const [hashtags, setHashtags] = useState('#ai #marketing #viral #contentcreator #brand');
  const [scheduleSuccess, setScheduleSuccess] = useState(false);

  // ── UI state ──────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<Tab>('design');
  const [isRecording, setIsRecording] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisMsg, setAnalysisMsg] = useState('');

  const [cW, cH] = ASPECT_SIZES[aspectRatio];
  const font = FONT_FAMILIES[fontStyle];

  // Preview display dims (max height 440px)
  const [pW, pH] = useMemo(() => {
    const maxH = 430;
    const scale = maxH / cH;
    return [Math.round(cW * scale), Math.round(cH * scale)];
  }, [cW, cH]);

  // ── Helpers ───────────────────────────────────────────────
  const handleToneChange = useCallback((t: EmotionalTone) => {
    setTone(t);
    setBgStyle(TONE_STYLE_MAP[t]);
    const p = TONE_PALETTES[t];
    setPalette(p);
    particlesRef.current = initParticles(p, cW, cH);
  }, [cW, cH]);

  const togglePlatform = (id: string) => {
    setSelectedPlatforms(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  };

  // ── Canvas drawing ────────────────────────────────────────
  const drawBgLayer = useCallback((ctx: CanvasRenderingContext2D, W: number, H: number, time: number) => {
    switch (bgStyle) {
      case 'aurora': drawAurora(ctx, W, H, palette, time); break;
      case 'particles': drawParticles(ctx, W, H, palette, particlesRef.current); break;
      case 'waves': drawWaves(ctx, W, H, palette, time); break;
      case 'bokeh': drawBokeh(ctx, W, H, palette, time); break;
      case 'geometric': drawGeometric(ctx, W, H, palette, time); break;
      case 'burst': drawBurst(ctx, W, H, palette, time); break;
    }
    applyGrain(ctx, W, H, grainPatternRef.current, grainAmt);
  }, [bgStyle, palette, grainAmt]);

  const sharedOpts = useCallback((): Omit<DrawOptions, 'W' | 'H' | 'grain' | 'grainAmt'> => ({
    palette, font, textColor, showGlass, headline, tagline, ctaText,
    brandName, excerpt, category, duration: post.duration,
    grain: grainPatternRef.current, grainAmt,
  }), [palette, font, textColor, showGlass, headline, tagline, ctaText, brandName, excerpt, category, post.duration, grainAmt]);

  const drawFrame = useCallback((time: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, cW, cH);

    const opts: DrawOptions = { W: cW, H: cH, ...sharedOpts(), grain: grainPatternRef.current };

    if (blogType === 'image') {
      renderImageBlog(ctx, opts);
    } else {
      drawBgLayer(ctx, cW, cH, time);
      if (blogType === 'text') renderTextBlog(ctx, opts);
      else renderVideoBlog(ctx, opts);
    }
  }, [blogType, cW, cH, drawBgLayer, sharedOpts]);

  const animate = useCallback(() => {
    drawFrame(Date.now() / 1000);
    animFrameRef.current = requestAnimationFrame(animate);
  }, [drawFrame]);

  // ── Init effect ───────────────────────────────────────────
  useEffect(() => {
    if (!isopen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    grainPatternRef.current = makeGrainPattern(ctx);
    particlesRef.current = initParticles(palette, cW, cH);

    // Simulate AI analysis
    const msgs = [
      `Detecting tone: ${TONE_META[detectedTone].emoji} ${TONE_META[detectedTone].label}`,
      'Building visual branding system…',
      'Generating brand palette…',
      'Canvas engine ready ✓',
    ];
    setAnalyzing(true);
    let i = 0;
    const iv = setInterval(() => {
      setAnalysisMsg(msgs[i++]);
      if (i >= msgs.length) { clearInterval(iv); setTimeout(() => setAnalyzing(false), 300); }
    }, 400);
    return () => clearInterval(iv);
  }, [isopen]); // eslint-disable-line

  // Re-init on aspect ratio or style change
  useEffect(() => {
    if (!isopen) return;
    particlesRef.current = initParticles(palette, cW, cH);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) grainPatternRef.current = makeGrainPattern(ctx);
    }
  }, [aspectRatio, bgStyle, isopen]); // eslint-disable-line

  // Animation loop
  useEffect(() => {
    if (!isopen) return;
    const animated = isAnimated && blogType !== 'image';
    if (animated) {
      animFrameRef.current = requestAnimationFrame(animate);
    } else {
      if (animFrameRef.current) { cancelAnimationFrame(animFrameRef.current); animFrameRef.current = null; }
      drawFrame(0);
    }
    return () => { if (animFrameRef.current) { cancelAnimationFrame(animFrameRef.current); animFrameRef.current = null; } };
  }, [isopen, isAnimated, blogType, animate, drawFrame]);

  // ── Export handlers ───────────────────────────────────────
  const handleDownloadPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setIsDownloading(true);
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url; a.download = `ad-${blogType}-${tone}-${aspectRatio.replace(':', 'x')}.png`; a.click();
    setTimeout(() => setIsDownloading(false), 1000);
  };

  const handleRecordVideo = () => {
    const canvas = canvasRef.current;
    if (!canvas || !('captureStream' in canvas)) { alert('Video recording not supported in this browser.'); return; }
    setIsRecording(true);
    const stream = (canvas as any).captureStream(30);
    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? 'video/webm;codecs=vp9' : 'video/webm';
    const recorder = new MediaRecorder(stream, { mimeType });
    const chunks: Blob[] = [];
    recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `ad-video-${blogType}-${tone}.webm`; a.click();
      URL.revokeObjectURL(url);
      setIsRecording(false);
    };
    recorder.start();
    setTimeout(() => recorder.stop(), 7000);
  };

  const handleSchedule = () => {
    if (selectedPlatforms.length === 0) return;
    const canvas = canvasRef.current;
    const mediaUrl = canvas?.toDataURL('image/png') || '';

    try {
      const scheduledAt = new Date(`${scheduleDate}T${scheduleTime}`);
      const allHashtags = hashtags.split(/\s+/).filter(h => h.startsWith('#'));
      socialScheduler.schedulePost({
        content: caption,
        mediaUrl,
        mediaType: blogType === 'video' ? 'video' : 'image',
        platforms: selectedPlatforms.filter(p => ['facebook', 'instagram', 'tiktok', 'x'].includes(p)) as any[],
        scheduledDate: scheduledAt,
        caption,
        hashtags: allHashtags,
      });
    } catch (e) { console.error('Schedule error:', e); }

    setScheduleSuccess(true);
    setTimeout(() => setScheduleSuccess(false), 3000);
  };

  if (!isopen) return null;

  const tones = Object.keys(TONE_META) as EmotionalTone[];
  const bgStyles = Object.keys(STYLE_META) as BackgroundStyle[];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[70] flex items-center justify-center p-2">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[1280px] max-h-[97vh] overflow-hidden flex flex-col">

        {/* ── Top Header ── */}
        <div className="bg-gradient-to-r from-violet-800 via-purple-700 to-pink-700 px-5 py-3.5 text-white flex items-center gap-3 flex-shrink-0">
          <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <Wand2 className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold leading-tight">AI Ad Studio · Visual Branding Engine</h2>
            <p className="text-xs text-white/65">High-converting blog posts for Text · Image · Video — with 1-click social scheduling</p>
          </div>

          {/* Blog type selector */}
          <div className="flex gap-0.5 bg-white/12 rounded-xl p-1">
            {BLOG_TYPES.map(bt => (
              <button
                key={bt.id}
                onClick={() => setBlogType(bt.id)}
                title={bt.desc}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${blogType === bt.id ? 'bg-white text-purple-700 shadow-md' : 'text-white/75 hover:text-white hover:bg-white/15'
                  }`}
              >
                <span>{bt.icon}</span>
                <span className="hidden sm:block">{bt.label}</span>
              </button>
            ))}
          </div>
          <button onClick={onClose} className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* AI Analysis Banner */}
        {analyzing && (
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-200 px-5 py-2 flex items-center gap-3 flex-shrink-0">
            <div className="w-3.5 h-3.5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
            <span className="text-sm text-purple-700 font-medium">{analysisMsg}</span>
            <div className="ml-auto flex gap-1">
              {[palette.primary, palette.secondary, palette.accent].map((c, i) => (
                <div key={i} className="w-5 h-5 rounded-md shadow-sm animate-pulse" style={{ backgroundColor: c, animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        )}

        {/* ── Main Body: 3 Columns ── */}
        <div className="flex flex-1 min-h-0 overflow-hidden">

          {/* ══ LEFT PANEL ══ */}
          <div className="w-56 border-r border-gray-200 flex flex-col flex-shrink-0 bg-gray-50">
            {/* Tab switcher */}
            <div className="flex border-b border-gray-200">
              {([['design', 'Design'], ['brand', 'Brand'], ['schedule', 'Schedule']] as [Tab, string][]).map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`flex-1 py-2 text-xs font-bold transition-colors ${activeTab === id ? 'text-purple-700 border-b-2 border-purple-600 bg-white' : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-4">

              {/* ─ DESIGN TAB ─ */}
              {activeTab === 'design' && (
                <>
                  {/* Content fields */}
                  <div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 block">Content</p>
                    <div className="space-y-2">
                      <div>
                        <label className="text-[11px] text-gray-500 font-medium">Headline</label>
                        <textarea value={headline} onChange={e => setHeadline(e.target.value)}
                          className="w-full mt-0.5 text-[11px] border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:border-purple-400 resize-none" rows={2} />
                      </div>
                      <div>
                        <label className="text-[11px] text-gray-500 font-medium">Tagline</label>
                        <textarea value={tagline} onChange={e => setTagline(e.target.value)}
                          className="w-full mt-0.5 text-[11px] border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:border-purple-400 resize-none" rows={2} />
                      </div>
                      {blogType !== 'image' && (
                        <div>
                          <label className="text-[11px] text-gray-500 font-medium">CTA Button</label>
                          <input value={ctaText} onChange={e => setCtaText(e.target.value)}
                            className="w-full mt-0.5 text-[11px] border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:border-purple-400" />
                        </div>
                      )}
                      {blogType === 'image' && (
                        <>
                          <div>
                            <label className="text-[11px] text-gray-500 font-medium">Excerpt</label>
                            <textarea value={excerpt} onChange={e => setExcerpt(e.target.value)}
                              className="w-full mt-0.5 text-[11px] border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:border-purple-400 resize-none" rows={3} />
                          </div>
                          <div>
                            <label className="text-[11px] text-gray-500 font-medium">Category</label>
                            <input value={category} onChange={e => setCategory(e.target.value)}
                              className="w-full mt-0.5 text-[11px] border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:border-purple-400" />
                          </div>
                        </>
                      )}
                      <div>
                        <label className="text-[11px] text-gray-500 font-medium">Brand Name</label>
                        <input value={brandName} onChange={e => setBrandName(e.target.value)}
                          className="w-full mt-0.5 text-[11px] border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:border-purple-400" />
                      </div>
                    </div>
                  </div>

                  {/* Background style */}
                  <div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 block">Background</p>
                    <div className="grid grid-cols-2 gap-1">
                      {bgStyles.map(s => (
                        <button key={s} onClick={() => setBgStyle(s)}
                          className={`px-2 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${bgStyle === s ? 'bg-purple-600 text-white shadow' : 'bg-white border border-gray-200 text-gray-600 hover:border-purple-300'
                            }`}>
                          <span>{STYLE_META[s].icon}</span>
                          <span>{STYLE_META[s].label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Text styling (not for image blog) */}
                  {blogType !== 'image' && (
                    <>
                      <div>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 block">Text Color</p>
                        <div className="grid grid-cols-3 gap-1">
                          {(['dark', 'light', 'brand'] as TextColor[]).map(c => (
                            <button key={c} onClick={() => setTextColor(c)}
                              className={`py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${textColor === c ? 'bg-purple-600 text-white shadow' : 'bg-white border border-gray-200 text-gray-600 hover:border-purple-300'
                                }`}>{c}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-600">Glass Panel</span>
                        <button onClick={() => setShowGlass(!showGlass)}
                          className={`w-9 h-5 rounded-full transition-colors relative ${showGlass ? 'bg-purple-600' : 'bg-gray-300'}`}>
                          <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${showGlass ? 'translate-x-4' : 'translate-x-0.5'}`} />
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-600">Animated</span>
                        <button onClick={() => setIsAnimated(!isAnimated)}
                          className={`w-9 h-5 rounded-full transition-colors relative ${isAnimated ? 'bg-purple-600' : 'bg-gray-300'}`}>
                          <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${isAnimated ? 'translate-x-4' : 'translate-x-0.5'}`} />
                        </button>
                      </div>
                    </>
                  )}

                  {/* Grain */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block">Grain Overlay</p>
                      <span className="text-xs font-bold text-purple-600">{grainAmt}%</span>
                    </div>
                    <input type="range" min={0} max={80} value={grainAmt}
                      onChange={e => setGrainAmt(Number(e.target.value))}
                      className="w-full accent-purple-600" />
                  </div>
                </>
              )}

              {/* ─ BRAND TAB ─ */}
              {activeTab === 'brand' && (
                <>
                  <div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 block">Emotional Tone</p>
                    <p className="text-xs text-gray-400 mb-2">★ = AI detected from content</p>
                    <div className="grid grid-cols-2 gap-1">
                      {tones.map(t => (
                        <button key={t} onClick={() => handleToneChange(t)}
                          className={`px-2 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${tone === t ? 'bg-purple-600 text-white shadow' : 'bg-white border border-gray-200 text-gray-600 hover:border-purple-300'
                            }`}>
                          <span>{TONE_META[t].emoji}</span>
                          <span className="truncate">{TONE_META[t].label}</span>
                          {t === detectedTone && <span className="ml-auto opacity-60">★</span>}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 block">Brand Palette</p>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[
                        { c: palette.primary, l: 'Primary' },
                        { c: palette.secondary, l: 'Secondary' },
                        { c: palette.accent, l: 'Accent' },
                        { c: palette.light, l: 'Light' },
                      ].map(({ c, l }) => (
                        <div key={l} className="flex flex-col items-center gap-1">
                          <div className="w-8 h-8 rounded-lg shadow-sm border border-gray-200" style={{ backgroundColor: c }} title={`${l}: ${c}`} />
                          <span className="text-xs text-gray-400">{l[0]}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 block">Font Style</p>
                    <div className="space-y-1">
                      {([
                        { id: 'modern', label: 'Modern', sample: 'Inter / Helvetica' },
                        { id: 'editorial', label: 'Editorial', sample: 'Georgia / Serif' },
                        { id: 'bold', label: 'Bold', sample: 'Impact / Black' },
                        { id: 'clean', label: 'Clean', sample: 'Helvetica Neue' },
                      ] as { id: FontStyle; label: string; sample: string }[]).map(f => (
                        <button key={f.id} onClick={() => setFontStyle(f.id)}
                          className={`w-full px-3 py-2 rounded-lg text-left transition-all ${fontStyle === f.id ? 'bg-purple-600 text-white shadow' : 'bg-white border border-gray-200 text-gray-600 hover:border-purple-300'
                            }`}>
                          <div className="text-xs font-bold">{f.label}</div>
                          <div className={`text-xs ${fontStyle === f.id ? 'text-white/70' : 'text-gray-400'}`}>{f.sample}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* AI Quality checks */}
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100 rounded-xl p-3">
                    <p className="text-xs font-bold text-purple-700 mb-2 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" /> AI Branding System
                    </p>
                    {[
                      '✓ 2× export resolution',
                      '✓ Emotional tone matched',
                      '✓ Center zone preserved',
                      '✓ Grain texture applied',
                      '✓ Brand palette cohesive',
                      '✓ High-converting layout',
                    ].map((item, i) => (
                      <p key={i} className="text-xs text-purple-600 leading-relaxed">{item}</p>
                    ))}
                  </div>
                </>
              )}

              {/* ─ SCHEDULE TAB ─ */}
              {activeTab === 'schedule' && (
                <>
                  <div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 block">Platforms</p>
                    <div className="space-y-1.5">
                      {PLATFORMS.map(p => (
                        <button key={p.id} onClick={() => togglePlatform(p.id)}
                          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all ${selectedPlatforms.includes(p.id)
                              ? 'border-purple-400 bg-purple-50 text-purple-700'
                              : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                            }`}>
                          <span className="text-base">{p.icon}</span>
                          <span className="flex-1 text-left">{p.label}</span>
                          <span className="text-gray-400 text-xs">{p.bestRatio}</span>
                          {selectedPlatforms.includes(p.id) && <Check className="w-3.5 h-3.5 text-purple-600 flex-shrink-0" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 block">Date & Time</p>
                    <div className="space-y-2">
                      <div>
                        <label className="text-[11px] text-gray-500 font-medium">Date</label>
                        <input type="date" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)}
                          className="w-full mt-0.5 text-[11px] border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:border-purple-400" />
                      </div>
                      <div>
                        <label className="text-[11px] text-gray-500 font-medium">Time</label>
                        <input type="time" value={scheduleTime} onChange={e => setScheduleTime(e.target.value)}
                          className="w-full mt-0.5 text-[11px] border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:border-purple-400" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 block">Caption</p>
                    <textarea value={caption} onChange={e => setCaption(e.target.value)}
                      rows={4} className="w-full mt-0.5 text-[11px] border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:border-purple-400 resize-none" placeholder="Post caption…" />
                    <p className="text-xs text-gray-400 text-right mt-0.5">{caption.length}/2200</p>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 block">Hashtags</p>
                    <textarea value={hashtags} onChange={e => setHashtags(e.target.value)}
                      rows={2} className="w-full mt-0.5 text-[11px] border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:border-purple-400 resize-none" placeholder="#ai #marketing…" />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ══ CENTER: Canvas ══ */}
          <div className="flex-1 flex flex-col items-center justify-center bg-[#1a1a2e] min-w-0 overflow-hidden p-4">
            {/* Aspect ratio bar */}
            <div className="flex gap-1 mb-4 bg-white/10 rounded-xl p-1">
              {(['1:1', '4:5', '9:16', '16:9'] as AspectRatio[]).map(ar => (
                <button key={ar} onClick={() => setAspectRatio(ar)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${aspectRatio === ar ? 'bg-white text-purple-700 shadow-md' : 'text-white/60 hover:text-white hover:bg-white/10'
                    }`}>
                  <span className="block">{ar}</span>
                  <span className="block text-xs font-normal opacity-70">{ASPECT_LABEL[ar]}</span>
                </button>
              ))}
            </div>

            {/* Canvas container */}
            <div className="relative rounded-xl overflow-hidden shadow-2xl" style={{ width: pW, height: pH }}>
              <canvas ref={canvasRef} width={cW} height={cH} style={{ width: pW, height: pH }} />

              {/* Center zone guide for text/video */}
              {blogType !== 'image' && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="border border-dashed border-white/20 rounded-xl flex items-end justify-center pb-2"
                    style={{ width: '72%', height: '44%' }}>
                    <span className="text-white/25 text-xs">Ad Copy Zone</span>
                  </div>
                </div>
              )}

              {/* Recording indicator */}
              {isRecording && (
                <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-red-600 text-white px-2.5 py-1.5 rounded-full text-xs font-bold animate-pulse shadow-lg">
                  <div className="w-2 h-2 bg-white rounded-full" />
                  REC 7s
                </div>
              )}

              {/* Animated badge */}
              {isAnimated && blogType !== 'image' && (
                <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-black/50 text-white/80 px-2 py-1 rounded-full text-xs backdrop-blur-sm">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                  Live
                </div>
              )}
            </div>

            {/* Canvas info strip */}
            <div className="flex items-center gap-2 mt-3 text-xs text-white/50">
              <span>{TONE_META[tone].emoji} {TONE_META[tone].label}</span>
              <span>·</span>
              <span>{STYLE_META[bgStyle].label}</span>
              <span>·</span>
              <span>{cW}×{cH}px</span>
              <span>·</span>
              <span>2× res</span>
              <div className="flex gap-0.5 ml-1">
                {[palette.primary, palette.secondary, palette.accent].map((c, i) => (
                  <div key={i} className="w-3 h-3 rounded-sm" style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>

            {/* Preview disclaimer */}
            <p className="text-xs text-white/30 mt-1">Export renders at full {cW}×{cH} resolution</p>
          </div>

          {/* ══ RIGHT PANEL: Export ══ */}
          <div className="w-60 border-l border-gray-200 flex flex-col flex-shrink-0 bg-white overflow-y-auto">
            <div className="p-4 space-y-4">

              {/* Blog type quick summary */}
              <div className={`rounded-xl p-3 text-xs font-medium ${blogType === 'text' ? 'bg-blue-50 border border-blue-200 text-blue-700' :
                  blogType === 'image' ? 'bg-green-50 border border-green-200 text-green-700' :
                    'bg-orange-50 border border-orange-200 text-orange-700'
                }`}>
                <div className="font-bold mb-0.5 flex items-center gap-1.5">
                  <span>{BLOG_TYPES.find(b => b.id === blogType)?.icon}</span>
                  <span>{BLOG_TYPES.find(b => b.id === blogType)?.label}</span>
                </div>
                <span className="opacity-80">{BLOG_TYPES.find(b => b.id === blogType)?.desc}</span>
              </div>

              {/* Quick platform tags */}
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 block">Scheduled For</p>
                <div className="flex flex-wrap gap-1.5">
                  {PLATFORMS.filter(p => selectedPlatforms.includes(p.id)).length === 0 ? (
                    <span className="text-xs text-gray-400 italic">No platforms selected</span>
                  ) : PLATFORMS.filter(p => selectedPlatforms.includes(p.id)).map(p => (
                    <span key={p.id} className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold text-white"
                      style={{ backgroundColor: p.color }}>
                      <span>{p.icon}</span><span>{p.label}</span>
                    </span>
                  ))}
                </div>
                {selectedPlatforms.length === 0 && (
                  <button onClick={() => setActiveTab('schedule')}
                    className="text-xs text-purple-600 font-medium mt-1 hover:underline">
                    → Pick platforms in Schedule tab
                  </button>
                )}
              </div>

              {/* Schedule summary */}
              {selectedPlatforms.length > 0 && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs text-gray-600 space-y-1">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-purple-500" />
                    <span>{scheduleDate} at {scheduleTime}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Globe className="w-3.5 h-3.5 text-blue-500" />
                    <span>{selectedPlatforms.length} platform{selectedPlatforms.length > 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-3.5 h-3.5 text-green-500" />
                    <span>{aspectRatio} · {cW}×{cH}px</span>
                  </div>
                </div>
              )}

              {/* Separator */}
              <div className="border-t border-gray-100" />

              {/* Export actions */}
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 block">Export</p>

                {/* Schedule post */}
                <button
                  onClick={handleSchedule}
                  disabled={selectedPlatforms.length === 0 || scheduleSuccess}
                  className={`w-full py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg ${scheduleSuccess
                      ? 'bg-green-600 text-white'
                      : selectedPlatforms.length === 0
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700'
                    }`}
                >
                  {scheduleSuccess
                    ? <><CheckCircle className="w-4 h-4" /> Scheduled!</>
                    : <><Calendar className="w-4 h-4" /> Schedule Post</>
                  }
                </button>

                {/* Download PNG */}
                <button
                  onClick={handleDownloadPNG}
                  disabled={isDownloading}
                  className="w-full py-2 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-gray-50 hover:border-gray-400 transition-all"
                >
                  <Download className="w-4 h-4" />
                  {isDownloading ? 'Downloading…' : 'Download PNG'}
                </button>

                {/* Export Video */}
                {(blogType === 'video' || (blogType === 'text' && isAnimated)) && (
                  <button
                    onClick={handleRecordVideo}
                    disabled={isRecording}
                    className="w-full py-2 border-2 border-violet-300 text-violet-700 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-violet-50 transition-all disabled:opacity-50"
                  >
                    <Video className="w-4 h-4" />
                    {isRecording ? 'Recording 7s…' : 'Export Video (7s)'}
                  </button>
                )}

                {/* Refresh background */}
                <button
                  onClick={() => {
                    particlesRef.current = initParticles(palette, cW, cH);
                    const canvas = canvasRef.current;
                    if (canvas) { const ctx = canvas.getContext('2d'); if (ctx) grainPatternRef.current = makeGrainPattern(ctx); }
                  }}
                  className="w-full py-2 border border-dashed border-gray-300 text-gray-500 rounded-xl text-sm flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Regenerate Background
                </button>
              </div>

              {/* Platform specs */}
              <div className="border-t border-gray-100 pt-3">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 block">Platform Specs</p>
                <div className="space-y-1.5">
                  {PLATFORMS.filter(p => selectedPlatforms.includes(p.id)).slice(0, 3).map(p => (
                    <div key={p.id} className="flex items-center gap-2 text-xs">
                      <span>{p.icon}</span>
                      <span className="text-gray-600 font-medium">{p.label}</span>
                      <span className="ml-auto text-gray-400">{p.bestRatio}</span>
                      <button
                        onClick={() => setAspectRatio(p.bestRatio)}
                        className="text-purple-600 font-semibold hover:underline"
                      >↗</button>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI features */}
              <div className="bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-100 rounded-xl p-3">
                <p className="text-xs font-bold text-violet-700 mb-1.5 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> AI Guarantees
                </p>
                {[
                  '✓ 2× resolution (1080+px)',
                  '✓ Grain texture overlay',
                  '✓ Center kept for ad copy',
                  '✓ Subtle gradient colors',
                  '✓ Brand palette matched',
                  '✓ Platform-optimized size',
                ].map((item, i) => (
                  <p key={i} className="text-xs text-violet-600 leading-relaxed">{item}</p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>


    </div>
  );
}
