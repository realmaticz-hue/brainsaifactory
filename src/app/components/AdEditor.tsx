import { useState, useRef, useEffect } from 'react';
import { X, Save, Download, Wand2, Type, Palette, Image as ImageIcon, Layers } from 'lucide-react';
import { BlogPost } from '../App';
import { AdCopyVariant } from '../utils/adCopyGenerator';
import { BackgroundStyle, getBackgroundForBusiness, renderBackground } from '../utils/backgroundGenerator';
import { FontConfig, PROFESSIONAL_FONTS, getFontForBusiness, TEXT_PRESETS, drawMultilineText, loadGoogleFonts } from '../utils/fontManager';
import { Language, SUPPORTED_LANGUAGES, getPopularLanguages } from '../utils/languageSupport';

interface AdEditorProps {
  isopen: boolean;
  onClose: () => void;
  post: BlogPost;
  adCopy: AdCopyVariant;
  businessData: any;
}

export function AdEditor({ isopen, onClose, post, adCopy, businessData }: AdEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [headline, setHeadline] = useState(adCopy.headline);
  const [body, setBody] = useState(adCopy.body);
  const [cta, setCta] = useState(adCopy.cta);
  const [selectedFont, setSelectedFont] = useState<FontConfig>(getFontForBusiness(businessData.businessType));
  const [selectedBackground, setSelectedBackground] = useState<BackgroundStyle>(
    getBackgroundForBusiness(businessData.businessType)[0]
  );
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(SUPPORTED_LANGUAGES[0]);
  const [textColor, setTextColor] = useState('#ffffff');
  const [activeTab, setActiveTab] = useState<'copy' | 'design' | 'language'>('copy');

  const backgrounds = getBackgroundForBusiness(businessData.businessType);

  // Load Google Fonts
  useEffect(() => {
    loadGoogleFonts();
  }, []);

  // Render canvas whenever settings change
  useEffect(() => {
    if (isopen && canvasRef.current) {
      renderAdPreview();
    }
  }, [isopen, headline, body, cta, selectedFont, selectedBackground, textColor, selectedLanguage]);

  const renderAdPreview = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Render background
    renderBackground(canvas, selectedBackground, false);

    // Draw character avatar
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = post.character.avatar;

    img.onload = () => {
      // Draw avatar circle
      const avatarX = canvas.width / 2;
      const avatarY = 150;
      const avatarRadius = 60;

      ctx.save();
      ctx.beginPath();
      ctx.arc(avatarX, avatarY, avatarRadius, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(img, avatarX - avatarRadius, avatarY - avatarRadius, avatarRadius * 2, avatarRadius * 2);
      ctx.restore();

      // Avatar border
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(avatarX, avatarY, avatarRadius, 0, Math.PI * 2);
      ctx.stroke();

      // Draw text elements
      const centerX = canvas.width / 2;

      // Headline
      const headlineStyle = {
        ...TEXT_PRESETS.headline,
        color: textColor,
        fontSize: 36
      };
      drawMultilineText(ctx, headline, centerX, 270, selectedFont, headlineStyle, canvas.width - 80, 45);

      // Body
      const bodyStyle = {
        ...TEXT_PRESETS.body,
        color: textColor,
        fontSize: 20
      };
      drawMultilineText(ctx, body, centerX, 370, selectedFont, bodyStyle, canvas.width - 100, 28);

      // CTA Button
      const ctaY = 480;
      const ctaWidth = 200;
      const ctaHeight = 50;
      const ctaX = centerX - (ctaWidth / 2);

      // Button background
      ctx.fillStyle = '#FFD700';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetY = 4;
      ctx.fillRect(ctaX, ctaY, ctaWidth, ctaHeight);
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;

      // Button text
      const ctaStyle = {
        ...TEXT_PRESETS.cta,
        color: '#000000',
        fontSize: 22
      };
      ctx.font = `${ctaStyle.fontWeight} ${ctaStyle.fontSize}px ${selectedFont.family}`;
      ctx.fillStyle = ctaStyle.color;
      ctx.textAlign = 'center';
      ctx.fillText(cta.toUpperCase(), centerX, ctaY + (ctaHeight / 2) + 2);

      // Duration badge
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(10, 10, 80, 30);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`${post.duration}s Video`, 20, 30);

      // Language indicator
      if (selectedLanguage.code !== 'en') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(canvas.width - 90, 10, 80, 30);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(`${selectedLanguage.flag} ${selectedLanguage.code.toUpperCase()}`, canvas.width - 20, 30);
      }
    };
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob(blob => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ad-${post.duration}s-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  };

  if (!isopen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 flex items-center justify-between text-white">
            <div>
              <h2 className="text-2xl font-bold">Ad Editor</h2>
              <p className="text-sm opacity-90">Customize your {post.duration}s ad content</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex flex-col lg:flex-row">
            {/* Editor Panel */}
            <div className="lg:w-1/2 p-6 space-y-6">
              {/* Tabs */}
              <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => setActiveTab('copy')}
                  className={`flex-1 px-4 py-2 rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'copy' ? 'bg-white shadow-md' : 'hover:bg-white/50'
                    }`}
                >
                  <Type className="w-4 h-4" />
                  <span>Copy</span>
                </button>
                <button
                  onClick={() => setActiveTab('design')}
                  className={`flex-1 px-4 py-2 rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'design' ? 'bg-white shadow-md' : 'hover:bg-white/50'
                    }`}
                >
                  <Palette className="w-4 h-4" />
                  <span>Design</span>
                </button>
                <button
                  onClick={() => setActiveTab('language')}
                  className={`flex-1 px-4 py-2 rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'language' ? 'bg-white shadow-md' : 'hover:bg-white/50'
                    }`}
                >
                  <Layers className="w-4 h-4" />
                  <span>Language</span>
                </button>
              </div>

              {/* Copy Tab */}
              {activeTab === 'copy' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Headline</label>
                    <input
                      type="text"
                      value={headline}
                      onChange={e => setHeadline(e.target.value)}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                      maxLength={50}
                    />
                    <p className="text-xs text-gray-500 mt-1">{headline.length}/50 characters</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">Body Text</label>
                    <textarea
                      value={body}
                      onChange={e => setBody(e.target.value)}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none resize-none"
                      rows={4}
                      maxLength={200}
                    />
                    <p className="text-xs text-gray-500 mt-1">{body.length}/200 characters</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">Call-to-Action</label>
                    <input
                      type="text"
                      value={cta}
                      onChange={e => setCta(e.target.value)}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                      maxLength={20}
                    />
                    <p className="text-xs text-gray-500 mt-1">{cta.length}/20 characters</p>
                  </div>

                  <button className="w-full px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all flex items-center justify-center gap-2">
                    <Wand2 className="w-4 h-4" />
                    AI Optimize Copy
                  </button>
                </div>
              )}

              {/* Design Tab */}
              {activeTab === 'design' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold mb-3">Font Style</label>
                    <div className="grid grid-cols-2 gap-2">
                      {PROFESSIONAL_FONTS.slice(0, 6).map(font => (
                        <button
                          key={font.id}
                          onClick={() => setSelectedFont(font)}
                          className={`p-3 border-2 rounded-lg transition-all ${selectedFont.id === font.id
                              ? 'border-purple-500 bg-purple-50'
                              : 'border-gray-200 hover:border-purple-300'
                            }`}
                        >
                          <p className="font-semibold text-sm">{font.name}</p>
                          <p className="text-xs text-gray-500">{font.style}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-3">Background</label>
                    <div className="grid grid-cols-3 gap-2">
                      {backgrounds.slice(0, 6).map(bg => (
                        <button
                          key={bg.id}
                          onClick={() => setSelectedBackground(bg)}
                          className={`aspect-square rounded-lg border-2 transition-all ${selectedBackground.id === bg.id
                              ? 'border-purple-500 scale-105'
                              : 'border-gray-200 hover:border-purple-300'
                            }`}
                          style={{
                            background: bg.type === 'gradient' ? bg.config.gradient : '#f0f0f0'
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">Text Color</label>
                    <div className="flex gap-2">
                      {['#ffffff', '#000000', '#FFD700', '#FF6B6B', '#4ECDC4'].map(color => (
                        <button
                          key={color}
                          onClick={() => setTextColor(color)}
                          className={`w-12 h-12 rounded-lg border-2 transition-all ${textColor === color ? 'border-purple-500 scale-110' : 'border-gray-300'
                            }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Language Tab */}
              {activeTab === 'language' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold mb-3">Select Language</label>
                    <div className="grid grid-cols-2 gap-2 max-h-96 overflow-y-auto">
                      {getPopularLanguages().map(lang => (
                        <button
                          key={lang.code}
                          onClick={() => setSelectedLanguage(lang)}
                          className={`p-3 border-2 rounded-lg transition-all text-left ${selectedLanguage.code === lang.code
                              ? 'border-purple-500 bg-purple-50'
                              : 'border-gray-200 hover:border-purple-300'
                            }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{lang.flag}</span>
                            <div>
                              <p className="font-semibold text-sm">{lang.name}</p>
                              <p className="text-xs text-gray-500">{lang.nativeName}</p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      💡 <strong>Auto-Translation:</strong> Content will be automatically translated to {selectedLanguage.name}.
                      Voice synthesis will use {selectedLanguage.name} pronunciation.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Preview Panel */}
            <div className="lg:w-1/2 bg-gray-50 p-6">
              <h3 className="text-lg font-bold mb-4">Live Preview</h3>
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <canvas
                  ref={canvasRef}
                  width={600}
                  height={600}
                  className="w-full"
                />
              </div>

              <div className="mt-6 space-y-3">
                <button
                  onClick={handleDownload}
                  className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all flex items-center justify-center gap-2 font-semibold"
                >
                  <Download className="w-5 h-5" />
                  Download Ad
                </button>

                <button
                  onClick={() => {/* Save to campaign */ }}
                  className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all flex items-center justify-center gap-2 font-semibold"
                >
                  <Save className="w-5 h-5" />
                  Save to Campaign
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
