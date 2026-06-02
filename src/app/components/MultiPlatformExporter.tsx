import { useState } from 'react';
import { Facebook, Instagram, PlayCircle } from 'lucide-react';
import { BlogPost } from '../App';
import { AdCopyVariant } from '../utils/adCopyGenerator';

export interface Platform {
  id: string;
  name: string;
  icon: any;
  specs: {
    videoFormats: string[];
    imageFormats: string[];
    aspectRatios: string[];
    maxDuration: number;
    maxFileSize: string;
    textLimits: {
      headline: number;
      body: number;
      cta: number;
    };
  };
}

export const PLATFORMS: Platform[] = [
  {
    id: 'facebook',
    name: 'Facebook Ads',
    icon: Facebook,
    specs: {
      videoFormats: ['MP4', 'MOV'],
      imageFormats: ['JPG', 'PNG'],
      aspectRatios: ['1:1', '4:5', '16:9'],
      maxDuration: 240,
      maxFileSize: '4GB',
      textLimits: {
        headline: 40,
        body: 125,
        cta: 30
      }
    }
  },
  {
    id: 'instagram',
    name: 'Instagram Ads',
    icon: Instagram,
    specs: {
      videoFormats: ['MP4', 'MOV'],
      imageFormats: ['JPG', 'PNG'],
      aspectRatios: ['1:1', '4:5', '9:16'],
      maxDuration: 60,
      maxFileSize: '4GB',
      textLimits: {
        headline: 40,
        body: 125,
        cta: 30
      }
    }
  },
  {
    id: 'google',
    name: 'Google Ads',
    icon: () => (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
        <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
      </svg>
    ),
    specs: {
      videoFormats: ['MP4', 'MOV', 'AVI'],
      imageFormats: ['JPG', 'PNG', 'GIF'],
      aspectRatios: ['1:1', '4:5', '16:9'],
      maxDuration: 30,
      maxFileSize: '1GB',
      textLimits: {
        headline: 30,
        body: 90,
        cta: 15
      }
    }
  },
  {
    id: 'tiktok',
    name: 'TikTok Ads',
    icon: PlayCircle,
    specs: {
      videoFormats: ['MP4', 'MOV', 'MPEG', 'AVI'],
      imageFormats: ['JPG', 'PNG'],
      aspectRatios: ['9:16', '1:1'],
      maxDuration: 60,
      maxFileSize: '500MB',
      textLimits: {
        headline: 100,
        body: 100,
        cta: 20
      }
    }
  }
];

interface MultiPlatformExporterProps {
  post: BlogPost;
  adCopy: AdCopyVariant;
  videoBlob?: Blob;
  imageBlob?: Blob;
  onExport: (platform: string, data: any) => void;
}

export function MultiPlatformExporter({ post, adCopy, videoBlob, imageBlob, onExport }: MultiPlatformExporterProps) {
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [exportStatus, setExportStatus] = useState<Record<string, 'pending' | 'success' | 'error'>>({});

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(platformId)
        ? prev.filter(id => id !== platformId)
        : [...prev, platformId]
    );
  };

  const handleExportAll = async () => {
    for (const platformId of selectedPlatforms) {
      await handleExport(platformId);
    }
  };

  const handleExport = async (platformId: string) => {
    setExportStatus(prev => ({ ...prev, [platformId]: 'pending' }));
    
    try {
      const platform = PLATFORMS.find(p => p.id === platformId);
      if (!platform) throw new Error('Platform not found');

      // Validate and optimize content for platform
      const optimizedCopy = optimizeForPlatform(adCopy, platform);
      
      // Prepare export data
      const exportData = {
        platform: platformId,
        duration: post.duration,
        copy: optimizedCopy,
        character: post.character.name,
        videoBlob,
        imageBlob,
        timestamp: new Date().toISOString()
      };

      // Call export handler
      await onExport(platformId, exportData);
      
      setExportStatus(prev => ({ ...prev, [platformId]: 'success' }));
      
      // Download for demo purposes
      if (videoBlob) {
        downloadForPlatform(platformId, videoBlob, 'video');
      } else if (imageBlob) {
        downloadForPlatform(platformId, imageBlob, 'image');
      }
      
    } catch (error) {
      console.error(`Export failed for ${platformId}:`, error);
      setExportStatus(prev => ({ ...prev, [platformId]: 'error' }));
    }
  };

  const optimizeForPlatform = (copy: AdCopyVariant, platform: Platform): AdCopyVariant => {
    return {
      ...copy,
      headline: copy.headline.substring(0, platform.specs.textLimits.headline),
      body: copy.body.substring(0, platform.specs.textLimits.body),
      cta: copy.cta.substring(0, platform.specs.textLimits.cta)
    };
  };

  const downloadForPlatform = (platformId: string, blob: Blob, type: 'video' | 'image') => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const ext = type === 'video' ? 'mp4' : 'png';
    a.download = `${platformId}-ad-${post.duration}s-${Date.now()}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'success': return 'bg-green-500';
      case 'error': return 'bg-red-500';
      case 'pending': return 'bg-yellow-500 animate-pulse';
      default: return 'bg-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold mb-4">Export to Platforms</h3>
        <div className="grid grid-cols-2 gap-4">
          {PLATFORMS.map(platform => {
            const Icon = platform.icon;
            const isSelected = selectedPlatforms.includes(platform.id);
            const status = exportStatus[platform.id];

            return (
              <button
                key={platform.id}
                onClick={() => togglePlatform(platform.id)}
                className={`relative p-4 border-2 rounded-xl transition-all ${
                  isSelected
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-purple-300'
                }`}
              >
                {/* Status indicator */}
                {status && (
                  <div className={`absolute top-2 right-2 w-3 h-3 rounded-full ${getStatusColor(status)}`} />
                )}

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 flex items-center justify-center text-purple-600">
                    <Icon className="w-8 h-8" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-sm">{platform.name}</p>
                    <p className="text-xs text-gray-500">
                      Max {platform.specs.maxDuration}s
                    </p>
                  </div>
                </div>

                {/* Platform specs */}
                <div className="mt-3 text-xs text-gray-600 text-left">
                  <p>Formats: {platform.specs.videoFormats.slice(0, 2).join(', ')}</p>
                  <p>Ratios: {platform.specs.aspectRatios.slice(0, 2).join(', ')}</p>
                </div>

                {isSelected && (
                  <div className="absolute top-2 left-2 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {selectedPlatforms.length > 0 && (
        <div className="space-y-3">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              📤 <strong>Ready to export:</strong> {selectedPlatforms.length} platform{selectedPlatforms.length > 1 ? 's' : ''} selected
            </p>
            <ul className="mt-2 text-xs text-blue-700 space-y-1">
              {selectedPlatforms.map(id => {
                const platform = PLATFORMS.find(p => p.id === id);
                return <li key={id}>✓ {platform?.name}</li>;
              })}
            </ul>
          </div>

          <button
            onClick={handleExportAll}
            disabled={Object.values(exportStatus).some(s => s === 'pending')}
            className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-700 hover:to-blue-700 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {Object.values(exportStatus).some(s => s === 'pending')
              ? 'Exporting...'
              : `Export to ${selectedPlatforms.length} Platform${selectedPlatforms.length > 1 ? 's' : ''}`
            }
          </button>

          {Object.keys(exportStatus).length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-sm mb-2">Export Status:</h4>
              <div className="space-y-2">
                {Object.entries(exportStatus).map(([platformId, status]) => {
                  const platform = PLATFORMS.find(p => p.id === platformId);
                  return (
                    <div key={platformId} className="flex items-center justify-between text-sm">
                      <span>{platform?.name}</span>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        status === 'success' ? 'bg-green-100 text-green-800' :
                        status === 'error' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {status === 'success' ? '✓ Exported' : status === 'error' ? '✗ Failed' : '⏳ Processing'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Platform-specific tips */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <h4 className="font-semibold text-sm text-purple-900 mb-2">💡 Platform Tips</h4>
        <ul className="text-xs text-purple-800 space-y-1">
          <li><strong>Facebook:</strong> 1:1 square ads perform best in feed</li>
          <li><strong>Instagram:</strong> 4:5 vertical for Stories, 1:1 for feed</li>
          <li><strong>Google:</strong> Keep it under 30s for max engagement</li>
          <li><strong>TikTok:</strong> 9:16 vertical only, authentic content wins</li>
        </ul>
      </div>
    </div>
  );
}
