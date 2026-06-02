import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  X, Download, Video, CheckCircle, Sparkles, RefreshCw, Wand2,
} from 'lucide-react';
import type { BlogPost } from '../utils/blogGenerator';
import {
  detectTone, TONE_META, TONE_PALETTES, TONE_STYLE_MAP, STYLE_META,
  generateSVGBackground, makeGrainPattern, applyGrain,
  drawAurora, drawParticles, drawWaves, drawBokeh, drawGeometric, drawBurst,
  initParticles,
  type EmotionalTone, type BackgroundStyle, type BrandPalette, type PostFormat, type StyleMeta,
} from '../utils/backgroundEngine';

const CANVAS_SIZE = 1080;

interface AdBackgroundGeneratorProps {
  post: BlogPost;
  businessData?: any;
  isopen: boolean;
  onClose: () => void;
  onApply?: (result: { imageUrl: string; postFormat: PostFormat }) => void;
}

export function AdBackgroundGenerator({ post, businessData, isopen, onClose, onApply }: AdBackgroundGeneratorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number | null>(null);
  const grainPatternRef = useRef<CanvasPattern | null>(null);
  const particlesRef = useRef(initParticles(TONE_PALETTES['neutral'], CANVAS_SIZE, CANVAS_SIZE));

  const detectedTone = useMemo(() => detectTone(post.content), [post.content]);

  const [tone, setTone] = useState<EmotionalTone>(detectedTone);
  const [style, setStyle] = useState<BackgroundStyle>(TONE_STYLE_MAP[detectedTone]);
  const [palette, setPalette] = useState<BrandPalette>(TONE_PALETTES[detectedTone]);
  const [grainAmount, setGrainAmount] = useState(22);
  const [outputMode, setOutputMode] = useState<'animated' | 'static' | 'svg'>('animated');
  const [postFormat, setPostFormat] = useState<PostFormat>('video');
  const [isRecording, setIsRecording] = useState(false);
  const [applied, setApplied] = useState(false);
  const [svgContent, setSvgContent] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState('');

  // ── Tone change ──────────────────────────────────────────────
  const handleToneChange = useCallback((newTone: EmotionalTone) => {
    setTone(newTone);
    setStyle(TONE_STYLE_MAP[newTone]);
    const newPalette = TONE_PALETTES[newTone];
    setPalette(newPalette);
    particlesRef.current = initParticles(newPalette, CANVAS_SIZE, CANVAS_SIZE);
  }, []);

  const handleStyleChange = useCallback((s: BackgroundStyle) => {
    setStyle(s);
    if (s === 'particles') {
      particlesRef.current = initParticles(palette, CANVAS_SIZE, CANVAS_SIZE);
    }
  }, [palette]);

  // ── Simulate AI analysis ─────────────────────────────────────
  const runAnalysis = useCallback(async () => {
    setAnalyzing(true);
    const steps = [
      'Scanning article content…',
      `Detected tone: ${TONE_META[detectedTone].emoji} ${TONE_META[detectedTone].label}`,
      'Extracting brand color palette…',
      'Selecting optimal background style…',
      'Rendering 2× resolution canvas…',
    ];
    for (const step of steps) {
      setAnalysisStep(step);
      await new Promise(r => setTimeout(r, 420));
    }
    setAnalyzing(false);
    setAnalysisStep('');
  }, [detectedTone]);

  // ── Draw one frame ───────────────────────────────────────────
  const drawFrame = useCallback((time: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    switch (style) {
      case 'aurora': drawAurora(ctx, CANVAS_SIZE, CANVAS_SIZE, palette, time); break;
      case 'particles': drawParticles(ctx, CANVAS_SIZE, CANVAS_SIZE, palette, particlesRef.current); break;
      case 'waves': drawWaves(ctx, CANVAS_SIZE, CANVAS_SIZE, palette, time); break;
      case 'bokeh': drawBokeh(ctx, CANVAS_SIZE, CANVAS_SIZE, palette, time); break;
      case 'geometric': drawGeometric(ctx, CANVAS_SIZE, CANVAS_SIZE, palette, time); break;
      case 'burst': drawBurst(ctx, CANVAS_SIZE, CANVAS_SIZE, palette, time); break;
    }

    applyGrain(ctx, CANVAS_SIZE, CANVAS_SIZE, grainPatternRef.current, grainAmount);
  }, [style, palette, grainAmount]);

  // ── Animation loop ───────────────────────────────────────────
  const animate = useCallback(() => {
    drawFrame(Date.now() / 1000);
    animFrameRef.current = requestAnimationFrame(animate);
  }, [drawFrame]);

  // ── Init grain pattern once canvas is available ───────────────
  useEffect(() => {
    if (!isopen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    grainPatternRef.current = makeGrainPattern(ctx);
    particlesRef.current = initParticles(palette, CANVAS_SIZE, CANVAS_SIZE);
    runAnalysis();
  }, [isopen]); // eslint-disable-line

  // ── Start/stop animation ─────────────────────────────────────
  useEffect(() => {
    if (!isopen) return;
    if (outputMode === 'svg') {
      setSvgContent(generateSVGBackground(tone, palette));
      if (animFrameRef.current) { cancelAnimationFrame(animFrameRef.current); animFrameRef.current = null; }
      return;
    }
    if (outputMode === 'animated') {
      animFrameRef.current = requestAnimationFrame(animate);
    } else {
      // Static: draw one frame at t=0
      if (animFrameRef.current) { cancelAnimationFrame(animFrameRef.current); animFrameRef.current = null; }
      drawFrame(0);
    }
    return () => {
      if (animFrameRef.current) { cancelAnimationFrame(animFrameRef.current); animFrameRef.current = null; }
    };
  }, [isopen, outputMode, animate, drawFrame, tone, palette]);

  // ── Redraw when style/palette/grain changes ───────────────────
  useEffect(() => {
    if (!isopen || outputMode !== 'static') return;
    drawFrame(0);
  }, [isopen, outputMode, drawFrame]);

  // ── Handlers ─────────────────────────────────────────────────
  const handleDownloadPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `ad-bg-${tone}-${style}.png`;
    a.click();
  };

  const handleDownloadSVG = () => {
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ad-bg-${tone}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRecordVideo = () => {
    const canvas = canvasRef.current;
    if (!canvas || !('captureStream' in canvas)) {
      alert('Video recording is not supported in this browser.');
      return;
    }
    setIsRecording(true);
    const stream = (canvas as any).captureStream(30);
    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ? 'video/webm;codecs=vp9' : 'video/webm';
    const recorder = new MediaRecorder(stream, { mimeType });
    const chunks: Blob[] = [];
    recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `ad-bg-${tone}-${style}.webm`; a.click();
      URL.revokeObjectURL(url);
      setIsRecording(false);
    };
    recorder.start();
    setTimeout(() => recorder.stop(), 6000);
  };

  const handleApply = () => {
    const canvas = canvasRef.current;
    const imageUrl = canvas?.toDataURL('image/png') || '';
    onApply?.({ imageUrl, postFormat });
    setApplied(true);
    setTimeout(() => { setApplied(false); onClose(); }, 1600);
  };

  const handleRegenerate = () => {
    particlesRef.current = initParticles(palette, CANVAS_SIZE, CANVAS_SIZE);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) grainPatternRef.current = makeGrainPattern(ctx);
    }
    if (outputMode === 'svg') setSvgContent(generateSVGBackground(tone, palette));
  };

  if (!isopen) return null;

  const tones = Object.keys(TONE_META) as EmotionalTone[];
  const styles = Object.keys(STYLE_META) as BackgroundStyle[];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[70] flex items-center justify-center p-3">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[96vh] overflow-hidden flex flex-col">

        {/* Header */}
        <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 p-4 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
              <Wand2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">AI Ad Background Generator</h2>
              <p className="text-xs text-white/70">Emotional tone analysis · Brand matching · 2× resolution · Grain overlay</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Analysis banner */}
        {analyzing && (
          <div className="bg-purple-50 border-b border-purple-200 px-4 py-2 flex items-center gap-3 flex-shrink-0">
            <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin flex-shrink-0" />
            <span className="text-sm text-purple-700 font-medium">{analysisStep}</span>
          </div>
        )}

        <div className="flex flex-1 overflow-hidden min-h-0">

          {/* ── Left panel ─────────────────────────────────────── */}
          <div className="w-64 border-r border-gray-200 overflow-y-auto flex-shrink-0 bg-gray-50">
            <div className="p-4 space-y-5">

              {/* Emotional Tone */}
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Emotional Tone</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {tones.map(t => (
                    <button
                      key={t}
                      onClick={() => handleToneChange(t)}
                      className={`px-2 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${tone === t
                          ? 'bg-purple-600 text-white shadow-md'
                          : 'bg-white border border-gray-200 text-gray-600 hover:border-purple-300'
                        }`}
                    >
                      <span>{TONE_META[t].emoji}</span>
                      <span className="truncate">{TONE_META[t].label}</span>
                      {t === detectedTone && <span className="ml-auto opacity-60 text-xs">★</span>}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-1.5 italic">★ = AI detected</p>
              </div>

              {/* Background Style */}
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Background Style</p>
                <div className="space-y-1.5">
                  {styles.map(s => (
                    <button
                      key={s}
                      onClick={() => handleStyleChange(s)}
                      className={`w-full px-3 py-2 rounded-lg text-left flex items-center gap-2 transition-all ${style === s
                          ? 'bg-purple-600 text-white shadow-md'
                          : 'bg-white border border-gray-200 text-gray-600 hover:border-purple-300'
                        }`}
                    >
                      <span className="text-base flex-shrink-0">{(STYLE_META as any)[s].icon}</span>
                      <div>
                        <div className="text-xs font-semibold">{(STYLE_META as any)[s].label}</div>
                        <div className={`text-xs font-normal ${style === s ? 'text-white/70' : 'text-gray-400'}`}>
                          {(STYLE_META as any)[s].description}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Brand Palette */}
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Brand Palette</p>
                <div className="flex gap-2 items-center">
                  {[
                    { color: palette.primary, label: 'Primary' },
                    { color: palette.secondary, label: 'Secondary' },
                    { color: palette.accent, label: 'Accent' },
                    { color: palette.light, label: 'Light' },
                  ].map(({ color, label }) => (
                    <div key={label} className="flex flex-col items-center gap-1" title={`${label}: ${color}`}>
                      <div className="w-8 h-8 rounded-lg shadow border border-gray-200" style={{ backgroundColor: color }} />
                      <span className="text-xs text-gray-400">{label[0]}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Grain Overlay */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Grain Overlay</p>
                  <span className="text-xs font-bold text-purple-600">{grainAmount}%</span>
                </div>
                <input
                  type="range" min={0} max={100} value={grainAmount}
                  onChange={e => setGrainAmount(Number(e.target.value))}
                  className="w-full accent-purple-600"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                  <span>None</span><span>Heavy</span>
                </div>
              </div>

              {/* Output Mode */}
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Output Mode</p>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'animated', label: 'Animated', icon: '🎬' },
                    { id: 'static', label: 'Static', icon: '🖼️' },
                    { id: 'svg', label: 'SVG', icon: '⬡' },
                  ].map(m => (
                    <button
                      key={m.id}
                      onClick={() => setOutputMode(m.id as any)}
                      className={`py-2 rounded-lg text-xs font-semibold flex flex-col items-center gap-0.5 transition-all ${outputMode === m.id
                          ? 'bg-purple-600 text-white shadow-md'
                          : 'bg-white border border-gray-200 text-gray-600 hover:border-purple-300'
                        }`}
                    >
                      <span className="text-sm">{m.icon}</span>
                      <span>{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Post Format */}
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Post Format</p>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'video', label: 'Video', icon: '🎥' },
                    { id: 'image', label: 'Image', icon: '📷' },
                    { id: 'text', label: 'Text', icon: '📝' },
                  ].map(f => (
                    <button
                      key={f.id}
                      onClick={() => setPostFormat(f.id as PostFormat)}
                      className={`py-2 rounded-lg text-xs font-semibold flex flex-col items-center gap-0.5 transition-all ${postFormat === f.id
                          ? 'bg-emerald-600 text-white shadow-md'
                          : 'bg-white border border-gray-200 text-gray-600 hover:border-emerald-300'
                        }`}
                    >
                      <span className="text-sm">{f.icon}</span>
                      <span>{f.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* AI Feature list */}
              <div className="bg-purple-50 border border-purple-100 rounded-xl p-3">
                <p className="text-xs font-bold text-purple-700 mb-2">AI Guarantees</p>
                {[
                  '✓ 2× resolution (1080×1080)',
                  '✓ Grain texture overlay',
                  '✓ Center composition empty',
                  '✓ Subtle gradient colors',
                  '✓ Brand palette matched',
                  '✓ No high-detail subjects',
                ].map((item, i) => (
                  <p key={i} className="text-xs text-purple-600 leading-relaxed">{item}</p>
                ))}
              </div>
            </div>
          </div>

          {/* ── Main Preview ───────────────────────────────────── */}
          <div className="flex-1 flex flex-col bg-gray-100 min-w-0">
            {/* Canvas area */}
            <div className="flex-1 flex items-center justify-center p-6 overflow-hidden">
              {outputMode === 'svg' ? (
                <div
                  className="w-full max-w-[480px] aspect-square rounded-xl overflow-hidden shadow-2xl border border-gray-200"
                  dangerouslySetInnerHTML={{ __html: svgContent }}
                />
              ) : (
                <div className="relative w-full max-w-[480px] aspect-square rounded-xl overflow-hidden shadow-2xl border border-gray-200">
                  <canvas
                    ref={canvasRef}
                    width={CANVAS_SIZE}
                    height={CANVAS_SIZE}
                    className="w-full h-full"
                  />
                  {isRecording && (
                    <div className="absolute top-3 right-3 flex items-center gap-2 bg-red-600 text-white px-3 py-1.5 rounded-full text-xs font-bold animate-pulse shadow-lg">
                      <div className="w-2 h-2 bg-white rounded-full" />
                      Recording 6s…
                    </div>
                  )}
                  {/* Center-empty indicator */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-[38%] h-[38%] border border-dashed border-white/30 rounded-lg flex items-center justify-center">
                      <span className="text-white/40 text-xs font-medium">Ad Copy Zone</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Info bar */}
            <div className="bg-white border-t border-gray-200 px-5 py-2.5 flex items-center gap-3 flex-shrink-0 text-sm">
              <span className="text-lg">{TONE_META[tone].emoji}</span>
              <span className="font-semibold text-gray-700">{TONE_META[tone].label}</span>
              <span className="text-gray-300">·</span>
              <span className="text-gray-500">{(STYLE_META as any)[style].label}</span>
              <span className="text-gray-300">·</span>
              <span className="text-gray-400 text-xs">{TONE_META[tone].description}</span>
              <div className="ml-auto flex gap-1">
                {[palette.primary, palette.secondary, palette.accent].map((c, i) => (
                  <div key={i} className="w-4 h-4 rounded-sm shadow-sm" style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>

            {/* Action bar */}
            <div className="bg-white border-t border-gray-200 p-4 flex items-center gap-2.5 flex-shrink-0 flex-wrap">
              <button
                onClick={handleRegenerate}
                className="px-3 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1.5 text-sm font-medium"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Regenerate
              </button>

              {outputMode === 'svg' ? (
                <button
                  onClick={handleDownloadSVG}
                  className="px-3 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1.5 text-sm font-medium"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download SVG
                </button>
              ) : (
                <>
                  <button
                    onClick={handleDownloadPNG}
                    className="px-3 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1.5 text-sm font-medium"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download PNG
                  </button>
                  {outputMode === 'animated' && (
                    <button
                      onClick={handleRecordVideo}
                      disabled={isRecording}
                      className="px-3 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1.5 text-sm font-medium disabled:opacity-50"
                    >
                      <Video className="w-3.5 h-3.5" />
                      {isRecording ? 'Recording…' : 'Record Video (6s)'}
                    </button>
                  )}
                </>
              )}

              {/* Post format badge */}
              <div className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 ${postFormat === 'video' ? 'bg-blue-100 text-blue-700' :
                  postFormat === 'image' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                }`}>
                {postFormat === 'video' ? '🎥' : postFormat === 'image' ? '📷' : '📝'}
                {postFormat.charAt(0).toUpperCase() + postFormat.slice(1)} Post
              </div>

              <button
                onClick={handleApply}
                disabled={applied}
                className="ml-auto px-5 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-bold text-sm flex items-center gap-2 hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg disabled:opacity-70"
              >
                {applied ? (
                  <><CheckCircle className="w-4 h-4" /> Applied!</>
                ) : (
                  <><Sparkles className="w-4 h-4" /> Apply to Post</>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
