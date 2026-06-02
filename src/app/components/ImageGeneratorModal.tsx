// =============================================================================
// IMAGE GENERATOR MODAL — AI-Powered Featured Image Creation
// =============================================================================

import React, { useState } from 'react';
import { X, Image as ImageIcon, Sparkles, Download, RefreshCw, Wand2 } from 'lucide-react';
import { generateFeaturedImage, generateImagePromptFromContent, type ImageGenerationOptions, type GeneratedImage } from '../utils/imageGenerator';
import { serverFetch } from '../utils/serverFetch';
import { toast } from 'sonner';
import type { BlogPost } from '../utils/blogGenerator';

interface ImageGeneratorModalProps {
  isopen: boolean;
  onClose: () => void;
  post?: BlogPost;
  onImageGenerated?: (image: GeneratedImage) => void;
}

export function ImageGeneratorModal({ isopen, onClose, post, onImageGenerated }: ImageGeneratorModalProps) {
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState<ImageGenerationOptions['style']>('vivid');
  const [size, setSize] = useState<ImageGenerationOptions['size']>('1024x1024');
  const [quality, setQuality] = useState<ImageGenerationOptions['quality']>('hd');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);

  React.useEffect(() => {
    if (isopen && post && !prompt) {
      // Auto-generate prompt from blog post
      const autoPrompt = generateImagePromptFromContent(
        post.content,
        post.seoTitle || 'Blog Post',
        [post.primaryKeyword || '', ...(post.secondaryKeywords || [])].filter(Boolean)
      );
      setPrompt(autoPrompt);
    }
  }, [isopen, post]);

  if (!isopen) return null;

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }

    setIsGenerating(true);

    try {
      const image = await generateFeaturedImage(
        { prompt, style, size, quality },
        serverFetch
      );

      setGeneratedImages(prev => [image, ...prev]);
      setSelectedImage(image);
      toast.success('Image generated successfully!');
    } catch (error: any) {
      console.error('Image generation error:', error);
      toast.error(error.message || 'Failed to generate image');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = (image: GeneratedImage) => {
    const link = document.createElement('a');
    link.href = image.url;
    link.download = `featured-image-${image.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Image downloaded!');
  };

  const handleUseImage = (image: GeneratedImage) => {
    onImageGenerated?.(image);
    toast.success('Image applied to post!');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <Wand2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">AI Image Generator</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Powered by DALL-E 3 • HD Quality
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Left: Controls */}
            <div className="space-y-6">
              {/* Prompt */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Image Description
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe the image you want to generate..."
                  className="w-full h-32 px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Be specific! Include style, mood, colors, and key elements.
                </p>
              </div>

              {/* Style */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Style
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { value: 'vivid', label: 'Vivid', desc: 'Bold & Vibrant' },
                    { value: 'natural', label: 'Natural', desc: 'Realistic & Authentic' },
                    { value: 'artistic', label: 'Artistic', desc: 'Creative & Expressive' },
                    { value: 'photographic', label: 'Photo', desc: 'Professional Studio' },
                    { value: 'digital-art', label: 'Digital', desc: 'Modern Illustration' },
                  ] as const).map((s) => (
                    <button
                      key={s.value}
                      onClick={() => setStyle(s.value)}
                      className={`p-3 rounded-lg border transition-all text-left ${style === s.value
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600'
                        }`}
                    >
                      <div className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                        {s.label}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {s.desc}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Size */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Size
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: '1024x1024', label: 'Square', icon: '⬜' },
                    { value: '1792x1024', label: 'Landscape', icon: '▭' },
                    { value: '1024x1792', label: 'Portrait', icon: '▯' },
                  ].map((s) => (
                    <button
                      key={s.value}
                      onClick={() => setSize(s.value as any)}
                      className={`p-3 rounded-lg border transition-all ${size === s.value
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600'
                        }`}
                    >
                      <div className="text-2xl mb-1">{s.icon}</div>
                      <div className="text-xs font-medium text-gray-900 dark:text-gray-100">{s.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quality */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Quality
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'standard', label: 'Standard', desc: 'Faster generation' },
                    { value: 'hd', label: 'HD', desc: 'Maximum quality' },
                  ].map((q) => (
                    <button
                      key={q.value}
                      onClick={() => setQuality(q.value as any)}
                      className={`p-3 rounded-lg border transition-all text-left ${quality === q.value
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600'
                        }`}
                    >
                      <div className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                        {q.label}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {q.desc}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Generate Button */}
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
                className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Generate Image
                  </>
                )}
              </button>

              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-900 dark:text-blue-300">
                  <strong>💡 Pro Tip:</strong> The more specific your description, the better the result!
                  Include details about style, mood, colors, and composition.
                </p>
              </div>
            </div>

            {/* Right: Preview */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Generated Images
              </label>

              {selectedImage ? (
                <div className="space-y-4">
                  <div className="relative rounded-lg overflow-hidden border-2 border-purple-300 dark:border-purple-600">
                    <img
                      src={selectedImage.url}
                      alt={selectedImage.altText}
                      className="w-full h-auto"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUseImage(selectedImage)}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
                    >
                      Use This Image
                    </button>
                    <button
                      onClick={() => handleDownload(selectedImage)}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <Download className="w-5 h-5" />
                    </button>
                  </div>

                  {selectedImage.revisedPrompt && (
                    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                        Revised Prompt:
                      </p>
                      <p className="text-xs text-gray-700 dark:text-gray-300">
                        {selectedImage.revisedPrompt}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-96 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                  <div className="text-center text-gray-500 dark:text-gray-400">
                    <ImageIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-sm">
                      {isGenerating ? 'Generating your image...' : 'Your generated image will appear here'}
                    </p>
                  </div>
                </div>
              )}

              {/* Image History */}
              {generatedImages.length > 1 && (
                <div className="mt-6">
                  <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                    Recent Generations
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {generatedImages.slice(1, 7).map((img) => (
                      <button
                        key={img.id}
                        onClick={() => setSelectedImage(img)}
                        className="relative rounded-lg overflow-hidden border-2 border-transparent hover:border-purple-300 dark:hover:border-purple-600 transition-all"
                      >
                        <img
                          src={img.url}
                          alt={img.altText}
                          className="w-full h-auto"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
