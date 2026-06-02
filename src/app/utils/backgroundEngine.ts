// ─── Types ────────────────────────────────────────────────────

export type EmotionalTone =
  | 'energetic' | 'trust' | 'urgency'
  | 'wellness' | 'professional' | 'creative' | 'neutral';

export type BackgroundStyle =
  | 'aurora' | 'particles' | 'geometric'
  | 'waves' | 'bokeh' | 'burst';

export type PostFormat = 'video' | 'image' | 'text';

export interface BrandPalette {
  primary: string;
  secondary: string;
  accent: string;
  light: string;
  dark: string;
}

export interface ToneMeta {
  label: string;
  emoji: string;
  description: string;
}

export interface StyleMeta {
  label: string;
  icon: string;
  description: string;
}

// ─── Metadata ─────────────────────────────────────────────────

export const TONE_META: Record<EmotionalTone, ToneMeta> = {
  energetic:    { label: 'Energetic',    emoji: '⚡', description: 'Bold, high-energy, action-driven' },
  trust:        { label: 'Trust',        emoji: '🛡️', description: 'Calm, reliable, authoritative' },
  urgency:      { label: 'Urgency',      emoji: '🔥', description: 'Time-sensitive, act-now' },
  wellness:     { label: 'Wellness',     emoji: '🌿', description: 'Natural, peaceful, balanced' },
  professional: { label: 'Professional', emoji: '💼', description: 'Polished, strategic, corporate' },
  creative:     { label: 'Creative',     emoji: '✨', description: 'Innovative, artistic, expressive' },
  neutral:      { label: 'Neutral',      emoji: '🎯', description: 'Versatile, clean, balanced' },
};

export const TONE_PALETTES: Record<EmotionalTone, BrandPalette> = {
  energetic:    { primary: '#FF6B35', secondary: '#FFB347', accent: '#FFBE0B', light: '#FFF8F0', dark: '#CC4A10' },
  trust:        { primary: '#2563EB', secondary: '#60A5FA', accent: '#93C5FD', light: '#EFF6FF', dark: '#1D4ED8' },
  urgency:      { primary: '#DC2626', secondary: '#F97316', accent: '#FCA5A5', light: '#FEF2F2', dark: '#B91C1C' },
  wellness:     { primary: '#059669', secondary: '#34D399', accent: '#6EE7B7', light: '#ECFDF5', dark: '#047857' },
  professional: { primary: '#3730A3', secondary: '#4F46E5', accent: '#818CF8', light: '#EEF2FF', dark: '#312E81' },
  creative:     { primary: '#7C3AED', secondary: '#A855F7', accent: '#E879F9', light: '#FAF5FF', dark: '#6D28D9' },
  neutral:      { primary: '#6366F1', secondary: '#818CF8', accent: '#A5B4FC', light: '#EEF2FF', dark: '#4F46E5' },
};

export const TONE_STYLE_MAP: Record<EmotionalTone, BackgroundStyle> = {
  energetic: 'burst',
  trust: 'waves',
  urgency: 'geometric',
  wellness: 'aurora',
  professional: 'particles',
  creative: 'bokeh',
  neutral: 'aurora',
};

export const STYLE_META: Record<BackgroundStyle, StyleMeta> = {
  aurora:     { label: 'Aurora',     icon: '🌌', description: 'Soft animated color blobs' },
  particles:  { label: 'Particles',  icon: '✦',  description: 'Connected particle network' },
  geometric:  { label: 'Geometric',  icon: '◇',  description: 'Animated polygon mesh' },
  waves:      { label: 'Waves',      icon: '〰', description: 'Flowing sine wave layers' },
  bokeh:      { label: 'Bokeh',      icon: '◎',  description: 'Soft blurred light circles' },
  burst:      { label: 'Burst',      icon: '✸',  description: 'Radiant energy rays' },
};

// ─── Tone Detection ───────────────────────────────────────────

export function detectTone(content: string): EmotionalTone {
  const text = content.toLowerCase();
  const kw: Partial<Record<EmotionalTone, string[]>> = {
    energetic:    ['amazing','incredible','power','boost','energy','fast','strong','transform','explosive','dynamic'],
    trust:        ['proven','expert','data','research','certified','trusted','reliable','guarantee','science','secure'],
    urgency:      ['limited','now','today','hurry','last','exclusive','immediately','urgent','deadline','sale','only'],
    wellness:     ['natural','wellness','health','balance','calm','peaceful','organic','gentle','mindful','pure'],
    professional: ['business','solution','enterprise','strategy','efficiency','optimize','roi','professional','corporate'],
    creative:     ['creative','unique','innovative','fresh','original','artistic','design','imagination','visionary'],
  };
  let best: EmotionalTone = 'neutral';
  let bestScore = 0;
  for (const [tone, words] of Object.entries(kw)) {
    const score = (words as string[]).filter(w => text.includes(w)).length;
    if (score > bestScore) { bestScore = score; best = tone as EmotionalTone; }
  }
  return best;
}

// ─── Color Helpers ────────────────────────────────────────────

export function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// ─── SVG Background Generator ─────────────────────────────────

export function generateSVGBackground(tone: EmotionalTone, palette: BrandPalette): string {
  const { primary, secondary, accent, light } = palette;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1080" width="1080" height="1080">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${light}"/>
        <stop offset="100%" stop-color="#ffffff"/>
      </linearGradient>
      <radialGradient id="g1" cx="12%" cy="12%" r="55%">
        <stop offset="0%" stop-color="${primary}" stop-opacity="0.45"/>
        <stop offset="100%" stop-color="${primary}" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="g2" cx="90%" cy="10%" r="48%">
        <stop offset="0%" stop-color="${secondary}" stop-opacity="0.38"/>
        <stop offset="100%" stop-color="${secondary}" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="g3" cx="8%" cy="92%" r="52%">
        <stop offset="0%" stop-color="${accent}" stop-opacity="0.35"/>
        <stop offset="100%" stop-color="${accent}" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="g4" cx="92%" cy="92%" r="50%">
        <stop offset="0%" stop-color="${secondary}" stop-opacity="0.4"/>
        <stop offset="100%" stop-color="${secondary}" stop-opacity="0"/>
      </radialGradient>
      <filter id="blur" x="-60%" y="-60%" width="220%" height="220%">
        <feGaussianBlur stdDeviation="90"/>
      </filter>
      <filter id="grain">
        <feTurbulence type="fractalNoise" baseFrequency="0.72" numOctaves="4" stitchTiles="stitch"/>
        <feColorMatrix type="saturate" values="0"/>
        <feComposite operator="in" in2="SourceGraphic"/>
      </filter>
    </defs>
    <rect width="1080" height="1080" fill="url(#bg)"/>
    <rect width="1080" height="1080" fill="url(#g1)" filter="url(#blur)"/>
    <rect width="1080" height="1080" fill="url(#g2)" filter="url(#blur)"/>
    <rect width="1080" height="1080" fill="url(#g3)" filter="url(#blur)"/>
    <rect width="1080" height="1080" fill="url(#g4)" filter="url(#blur)"/>
    <rect width="1080" height="1080" fill="black" opacity="0.04" filter="url(#grain)"/>
  </svg>`;
}

// ─── Canvas Drawing Functions (pure, outside component) ───────

type Particle = { x: number; y: number; vx: number; vy: number; r: number; color: string; alpha: number };

export function initParticles(palette: BrandPalette, W: number, H: number): Particle[] {
  const colors = [palette.primary, palette.secondary, palette.accent];
  return Array.from({ length: 50 }, () => {
    // Bias particles to corner zones
    const zx = Math.random() < 0.5 ? Math.random() * W * 0.32 : W * 0.68 + Math.random() * W * 0.32;
    const zy = Math.random() < 0.5 ? Math.random() * H * 0.32 : H * 0.68 + Math.random() * H * 0.32;
    return {
      x: zx, y: zy,
      vx: (Math.random() - 0.5) * 0.7,
      vy: (Math.random() - 0.5) * 0.7,
      r: 2 + Math.random() * 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: 0.4 + Math.random() * 0.5,
    };
  });
}

export function drawAurora(ctx: CanvasRenderingContext2D, W: number, H: number, p: BrandPalette, t: number) {
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, p.light);
  bg.addColorStop(1, '#ffffff');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  const blobs = [
    { bx: 0.1 + Math.sin(t * 0.3) * 0.06,  by: 0.1 + Math.cos(t * 0.2) * 0.06,  r: 0.48, col: p.primary,   a: 0.38 },
    { bx: 0.9 + Math.sin(t * 0.4) * 0.05,  by: 0.1 + Math.cos(t * 0.3) * 0.05,  r: 0.42, col: p.secondary, a: 0.32 },
    { bx: 0.1 + Math.sin(t * 0.25) * 0.05, by: 0.9 + Math.cos(t * 0.35) * 0.05, r: 0.40, col: p.accent,    a: 0.30 },
    { bx: 0.9 + Math.sin(t * 0.35) * 0.06, by: 0.9 + Math.cos(t * 0.28) * 0.06, r: 0.44, col: p.secondary, a: 0.32 },
    { bx: 0.5 + Math.sin(t * 0.2) * 0.08,  by: 0.05 + Math.cos(t * 0.15) * 0.03, r: 0.30, col: p.accent,   a: 0.20 },
  ];

  blobs.forEach(b => {
    const x = b.bx * W, y = b.by * H, r = b.r * Math.max(W, H);
    const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, hexToRgba(b.col, b.a));
    grad.addColorStop(1, hexToRgba(b.col, 0));
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  });
}

export function drawParticles(ctx: CanvasRenderingContext2D, W: number, H: number, p: BrandPalette, particles: Particle[]) {
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);
  const bg = ctx.createRadialGradient(W * 0.5, H * 0.5, 0, W * 0.5, H * 0.5, W * 0.65);
  bg.addColorStop(0, hexToRgba(p.light, 0.7));
  bg.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Update positions + push away from center
  particles.forEach(pt => {
    pt.x += pt.vx; pt.y += pt.vy;
    if (pt.x < 0 || pt.x > W) pt.vx *= -1;
    if (pt.y < 0 || pt.y > H) pt.vy *= -1;
    const cx = pt.x - W / 2, cy = pt.y - H / 2;
    const dist = Math.sqrt(cx * cx + cy * cy);
    if (dist < W * 0.28) {
      const push = 0.08;
      pt.vx += (cx / dist) * push; pt.vy += (cy / dist) * push;
      const spd = Math.sqrt(pt.vx * pt.vx + pt.vy * pt.vy);
      if (spd > 1.2) { pt.vx = (pt.vx / spd) * 1.2; pt.vy = (pt.vy / spd) * 1.2; }
    }
  });

  // Edges
  const maxD = 180;
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const a = particles[i], b = particles[j];
      const dx = a.x - b.x, dy = a.y - b.y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < maxD) {
        ctx.save();
        ctx.globalAlpha = (1 - d / maxD) * 0.18;
        ctx.strokeStyle = p.primary;
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        ctx.restore();
      }
    }
  }

  // Dots
  particles.forEach(pt => {
    ctx.save();
    ctx.globalAlpha = pt.alpha;
    ctx.fillStyle = pt.color;
    ctx.beginPath(); ctx.arc(pt.x, pt.y, pt.r, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  });
}

export function drawWaves(ctx: CanvasRenderingContext2D, W: number, H: number, p: BrandPalette, t: number) {
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, p.light); bg.addColorStop(1, '#ffffff');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

  const topWaves = [
    { amp: 70, freq: 0.0035, ph: t * 0.5,       yOff: -40, col: p.primary,   a: 0.22 },
    { amp: 90, freq: 0.003,  ph: t * 0.4 + 1,   yOff: -10, col: p.secondary, a: 0.16 },
    { amp: 55, freq: 0.005,  ph: t * 0.6 + 2,   yOff:  40, col: p.accent,    a: 0.13 },
  ];
  const botWaves = [
    { amp: 70, freq: 0.0035, ph: t * 0.5  + Math.PI, yOff: H + 40, col: p.primary,   a: 0.22 },
    { amp: 90, freq: 0.003,  ph: t * 0.4 + 1 + Math.PI, yOff: H + 10, col: p.secondary, a: 0.16 },
    { amp: 55, freq: 0.005,  ph: t * 0.6 + 2 + Math.PI, yOff: H - 40, col: p.accent,    a: 0.13 },
  ];

  [...topWaves, ...botWaves].forEach((w, i) => {
    const isTop = i < 3;
    ctx.save(); ctx.globalAlpha = w.a; ctx.fillStyle = w.col;
    ctx.beginPath();
    ctx.moveTo(0, isTop ? 0 : H);
    for (let x = 0; x <= W; x += 4) {
      ctx.lineTo(x, w.yOff + w.amp * Math.sin(x * w.freq + w.ph));
    }
    ctx.lineTo(W, isTop ? 0 : H);
    ctx.closePath(); ctx.fill(); ctx.restore();
  });
}

export function drawBokeh(ctx: CanvasRenderingContext2D, W: number, H: number, p: BrandPalette, t: number) {
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, W, H);
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, p.light); bg.addColorStop(1, '#f8f9ff');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

  const circles = [
    { fx: 0.08, fy: 0.08, r: 130, col: p.primary,   pulse: t * 0.5 },
    { fx: 0.88, fy: 0.07, r: 100, col: p.secondary, pulse: t * 0.4 + 1 },
    { fx: 0.05, fy: 0.90, r: 115, col: p.accent,    pulse: t * 0.6 + 2 },
    { fx: 0.92, fy: 0.92, r: 108, col: p.secondary, pulse: t * 0.35 + 1.5 },
    { fx: 0.12, fy: 0.50, r: 75,  col: p.primary,   pulse: t * 0.45 + 0.5 },
    { fx: 0.90, fy: 0.50, r: 80,  col: p.accent,    pulse: t * 0.55 + 2.5 },
    { fx: 0.50, fy: 0.04, r: 70,  col: p.secondary, pulse: t * 0.5 + 3 },
    { fx: 0.50, fy: 0.96, r: 85,  col: p.primary,   pulse: t * 0.4 + 1.2 },
  ];

  circles.forEach(c => {
    const x = c.fx * W, y = c.fy * H;
    const r = c.r * (1 + Math.sin(c.pulse) * 0.08);
    ctx.save();
    ctx.shadowBlur = r * 1.4;
    ctx.shadowColor = c.col;
    ctx.globalAlpha = 0.14 + Math.sin(c.pulse) * 0.04;
    const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, c.col);
    grad.addColorStop(1, hexToRgba(c.col, 0));
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  });
}

export function drawGeometric(ctx: CanvasRenderingContext2D, W: number, H: number, p: BrandPalette, t: number) {
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, p.light); bg.addColorStop(1, '#ffffff');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

  const cols = 9, rows = 9;
  const pts: { x: number; y: number }[][] = [];
  for (let r = 0; r < rows; r++) {
    pts[r] = [];
    for (let c = 0; c < cols; c++) {
      const bx = (c / (cols - 1)) * W;
      const by = (r / (rows - 1)) * H;
      pts[r][c] = {
        x: bx + Math.sin(t * 0.5 + c * 0.8 + r * 0.6) * 22,
        y: by + Math.cos(t * 0.4 + c * 0.7 + r * 0.9) * 22,
      };
    }
  }

  const colors = [p.primary, p.secondary, p.accent];
  for (let r = 0; r < rows - 1; r++) {
    for (let c = 0; c < cols - 1; c++) {
      const cr = (r + 0.5) / rows, cc = (c + 0.5) / cols;
      const isCenter = cr > 0.28 && cr < 0.72 && cc > 0.28 && cc < 0.72;
      const a = pts[r][c], b = pts[r][c + 1], d = pts[r + 1][c], e = pts[r + 1][c + 1];
      const alpha = isCenter ? 0.025 : 0.09;

      ctx.save(); ctx.globalAlpha = alpha;
      ctx.fillStyle = colors[(r + c) % 3];
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.lineTo(d.x, d.y); ctx.closePath(); ctx.fill();
      ctx.fillStyle = colors[(r + c + 1) % 3];
      ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(e.x, e.y); ctx.lineTo(d.x, d.y); ctx.closePath(); ctx.fill();

      if (!isCenter) {
        ctx.globalAlpha = 0.12; ctx.strokeStyle = p.primary; ctx.lineWidth = 0.5;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.lineTo(e.x, e.y); ctx.lineTo(d.x, d.y); ctx.closePath(); ctx.stroke();
      }
      ctx.restore();
    }
  }
}

export function drawBurst(ctx: CanvasRenderingContext2D, W: number, H: number, p: BrandPalette, t: number) {
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, p.light); bg.addColorStop(1, '#ffffff');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

  const corners = [
    { cx: 0, cy: 0,       rot: t * 0.09,           col: p.primary,   n: 14 },
    { cx: W, cy: H,       rot: t * 0.09 + Math.PI, col: p.secondary, n: 14 },
    { cx: W, cy: 0,       rot: t * 0.07 + Math.PI / 2, col: p.accent, n: 10 },
    { cx: 0, cy: H,       rot: t * 0.07 - Math.PI / 2, col: p.secondary, n: 10 },
  ];

  corners.forEach(corner => {
    const spread = Math.PI * 0.55;
    for (let i = 0; i < corner.n; i++) {
      const angle = corner.rot + (i / corner.n) * spread - spread / 2;
      const len = W * 0.75;
      const halfA = Math.PI / (corner.n * 2);
      const grad = ctx.createLinearGradient(
        corner.cx, corner.cy,
        corner.cx + Math.cos(angle) * len,
        corner.cy + Math.sin(angle) * len
      );
      grad.addColorStop(0, hexToRgba(corner.col, 0.14));
      grad.addColorStop(0.55, hexToRgba(corner.col, 0.05));
      grad.addColorStop(1, hexToRgba(corner.col, 0));
      ctx.save(); ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(corner.cx, corner.cy);
      ctx.lineTo(corner.cx + Math.cos(angle - halfA) * len, corner.cy + Math.sin(angle - halfA) * len);
      ctx.lineTo(corner.cx + Math.cos(angle + halfA) * len, corner.cy + Math.sin(angle + halfA) * len);
      ctx.closePath(); ctx.fill(); ctx.restore();
    }
  });
}

export function applyGrain(ctx: CanvasRenderingContext2D, W: number, H: number, grainPattern: CanvasPattern | null, intensity: number) {
  if (!grainPattern || intensity === 0) return;
  ctx.save();
  ctx.globalAlpha = (intensity / 100) * 0.13;
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = grainPattern;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

export function makeGrainPattern(ctx: CanvasRenderingContext2D): CanvasPattern | null {
  const gc = document.createElement('canvas');
  gc.width = 256; gc.height = 256;
  const gx = gc.getContext('2d');
  if (!gx) return null;
  const id = gx.createImageData(256, 256);
  for (let i = 0; i < id.data.length; i += 4) {
    const v = Math.floor(Math.random() * 255);
    id.data[i] = v; id.data[i + 1] = v; id.data[i + 2] = v; id.data[i + 3] = 255;
  }
  gx.putImageData(id, 0, 0);
  return ctx.createPattern(gc, 'repeat');
}
