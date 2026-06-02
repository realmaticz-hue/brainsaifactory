import { useState } from 'react';
import { X, Download, Code, Smartphone, Monitor, CheckCircle } from 'lucide-react';
import { xcodeGenerator, XCodeProjectSpec } from '../utils/xcodeGenerator';

interface XCodeGeneratorModalProps {
  isopen: boolean;
  onClose: () => void;
}

const FEATURE_OPTIONS = [
  { id: 'camera', label: 'Camera & Photos', icon: '📸' },
  { id: 'video', label: 'Video Recording', icon: '🎥' },
  { id: 'audio', label: 'Audio Recording', icon: '🎤' },
  { id: 'social', label: 'Social Sharing', icon: '📱' },
  { id: 'chat', label: 'Chat/Messaging', icon: '💬' },
  { id: 'map', label: 'Maps & Location', icon: '🗺️' },
  { id: 'notifications', label: 'Push Notifications', icon: '🔔' },
  { id: 'calendar', label: 'Calendar Integration', icon: '📅' },
  { id: 'search', label: 'Search Functionality', icon: '🔍' },
  { id: 'settings', label: 'User Settings', icon: '⚙️' },
  { id: 'profile', label: 'User Profiles', icon: '👤' },
  { id: 'photo', label: 'Photo Gallery', icon: '🖼️' }
];

export function XCodeGeneratorModal({ isopen, onClose }: XCodeGeneratorModalProps) {
  const [spec, setSpec] = useState<XCodeProjectSpec>({
    appName: '',
    bundleId: '',
    organizationName: '',
    description: '',
    features: [],
    platform: 'iOS',
    minIOSVersion: '17.0',
    minMacOSVersion: '14.0'
  });
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);

  const toggleFeature = (featureId: string) => {
    setSpec(prev => ({
      ...prev,
      features: prev.features.includes(featureId)
        ? prev.features.filter(f => f !== featureId)
        : [...prev.features, featureId]
    }));
  };

  const handleGenerate = () => {
    if (!spec.appName || !spec.bundleId) {
      alert('Please fill in app name and bundle ID');
      return;
    }

    setGenerating(true);

    // Simulate generation process
    setTimeout(() => {
      const project = xcodeGenerator.generateProject(spec);

      // Download all files
      project.files.forEach(file => {
        const blob = new Blob([file.content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.path.replace(/\//g, '_');
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      });

      // Download instructions
      const instructionsBlob = new Blob([project.instructions], { type: 'text/markdown' });
      const instructionsUrl = URL.createObjectURL(instructionsBlob);
      const instructionsLink = document.createElement('a');
      instructionsLink.href = instructionsUrl;
      instructionsLink.download = 'README.md';
      document.body.appendChild(instructionsLink);
      instructionsLink.click();
      document.body.removeChild(instructionsLink);
      URL.revokeObjectURL(instructionsUrl);

      setGenerating(false);
      setGenerated(true);

      setTimeout(() => {
        alert('✅ XCode project files downloaded!\n\nCheck your Downloads folder for:\n- Swift source files\n- Project configuration\n- README with setup instructions\n\nOpen the files in XCode to start building your app!');
      }, 500);
    }, 2000);
  };

  const generateBundleId = () => {
    const appNameSlug = spec.appName.toLowerCase().replace(/\s+/g, '');
    const orgSlug = spec.organizationName.toLowerCase().replace(/\s+/g, '') || 'com.company';
    setSpec(prev => ({
      ...prev,
      bundleId: `${orgSlug}.${appNameSlug}`
    }));
  };

  if (!isopen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-600 to-red-600 p-6 flex items-center justify-between text-white">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Code className="w-7 h-7" />
                XCode Project Generator
              </h2>
              <p className="text-sm opacity-90">AI-powered iOS/macOS app code generation</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* App Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold">App Information</h3>

              <div>
                <label className="block text-sm font-semibold mb-2">App Name *</label>
                <input
                  type="text"
                  value={spec.appName}
                  onChange={e => setSpec({ ...spec, appName: e.target.value })}
                  placeholder="My Awesome App"
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Organization Name</label>
                <input
                  type="text"
                  value={spec.organizationName}
                  onChange={e => setSpec({ ...spec, organizationName: e.target.value })}
                  placeholder="My Company LLC"
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-semibold">Bundle Identifier *</label>
                  <button
                    onClick={generateBundleId}
                    className="px-3 py-1 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors text-xs font-semibold"
                  >
                    Auto-Generate
                  </button>
                </div>
                <input
                  type="text"
                  value={spec.bundleId}
                  onChange={e => setSpec({ ...spec, bundleId: e.target.value })}
                  placeholder="com.company.myapp"
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">App Description</label>
                <textarea
                  value={spec.description}
                  onChange={e => setSpec({ ...spec, description: e.target.value })}
                  placeholder="A brief description of your app..."
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none resize-none"
                  rows={3}
                />
              </div>
            </div>

            {/* Platform Selection */}
            <div>
              <h3 className="text-lg font-bold mb-3">Target Platform</h3>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setSpec({ ...spec, platform: 'iOS' })}
                  className={`p-4 border-2 rounded-xl transition-all ${spec.platform === 'iOS'
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-200 hover:border-orange-300'
                    }`}
                >
                  <Smartphone className="w-8 h-8 mx-auto mb-2 text-orange-600" />
                  <p className="font-semibold">iOS</p>
                  <p className="text-xs text-gray-600">iPhone & iPad</p>
                </button>

                <button
                  onClick={() => setSpec({ ...spec, platform: 'macOS' })}
                  className={`p-4 border-2 rounded-xl transition-all ${spec.platform === 'macOS'
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-200 hover:border-orange-300'
                    }`}
                >
                  <Monitor className="w-8 h-8 mx-auto mb-2 text-orange-600" />
                  <p className="font-semibold">macOS</p>
                  <p className="text-xs text-gray-600">Mac Desktop</p>
                </button>

                <button
                  onClick={() => setSpec({ ...spec, platform: 'both' })}
                  className={`p-4 border-2 rounded-xl transition-all ${spec.platform === 'both'
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-200 hover:border-orange-300'
                    }`}
                >
                  <div className="flex justify-center gap-2 mb-2">
                    <Smartphone className="w-6 h-6 text-orange-600" />
                    <Monitor className="w-6 h-6 text-orange-600" />
                  </div>
                  <p className="font-semibold">Both</p>
                  <p className="text-xs text-gray-600">Universal</p>
                </button>
              </div>

              {/* Version Settings */}
              <div className="grid grid-cols-2 gap-4 mt-4">
                {(spec.platform === 'iOS' || spec.platform === 'both') && (
                  <div>
                    <label className="block text-sm font-semibold mb-2">Min iOS Version</label>
                    <select
                      value={spec.minIOSVersion}
                      onChange={e => setSpec({ ...spec, minIOSVersion: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none"
                    >
                      <option value="17.0">iOS 17.0</option>
                      <option value="16.0">iOS 16.0</option>
                      <option value="15.0">iOS 15.0</option>
                      <option value="14.0">iOS 14.0</option>
                    </select>
                  </div>
                )}

                {(spec.platform === 'macOS' || spec.platform === 'both') && (
                  <div>
                    <label className="block text-sm font-semibold mb-2">Min macOS Version</label>
                    <select
                      value={spec.minMacOSVersion}
                      onChange={e => setSpec({ ...spec, minMacOSVersion: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none"
                    >
                      <option value="14.0">macOS 14.0 (Sonoma)</option>
                      <option value="13.0">macOS 13.0 (Ventura)</option>
                      <option value="12.0">macOS 12.0 (Monterey)</option>
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Features Selection */}
            <div>
              <h3 className="text-lg font-bold mb-3">
                App Features ({spec.features.length} selected)
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {FEATURE_OPTIONS.map(feature => (
                  <button
                    key={feature.id}
                    onClick={() => toggleFeature(feature.id)}
                    className={`p-3 border-2 rounded-lg transition-all text-left ${spec.features.includes(feature.id)
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-orange-300'
                      }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-2xl">{feature.icon}</span>
                      {spec.features.includes(feature.id) && (
                        <CheckCircle className="w-5 h-5 text-orange-600 ml-auto" />
                      )}
                    </div>
                    <p className="text-sm font-semibold">{feature.label}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <h4 className="font-semibold text-blue-900 mb-2">ℹ️ How It Works</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>✓ AI generates complete SwiftUI project structure</li>
                <li>✓ Includes all selected features with working code</li>
                <li>✓ Downloads as separate files (not a ZIP)</li>
                <li>✓ Includes setup instructions in README.md</li>
                <li>✓ Ready to open in XCode on your Mac</li>
              </ul>
            </div>

            {/* Security Notice */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <h4 className="font-semibold text-yellow-900 mb-2">🔒 Security Notice</h4>
              <p className="text-sm text-yellow-800">
                This generator creates XCode project <strong>files only</strong>. It does not control or access XCode on your computer. You manually import the generated files into XCode. This is the safe and recommended approach.
              </p>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={generating || !spec.appName || !spec.bundleId}
              className="w-full px-6 py-4 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl hover:from-orange-700 hover:to-red-700 transition-all font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {generating ? (
                <>
                  <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin" />
                  Generating Project...
                </>
              ) : generated ? (
                <>
                  <CheckCircle className="w-6 h-6" />
                  Project Generated! Generate Another?
                </>
              ) : (
                <>
                  <Download className="w-6 h-6" />
                  Generate XCode Project
                </>
              )}
            </button>

            {generated && (
              <div className="bg-green-50 border-2 border-green-500 rounded-xl p-4 text-center">
                <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-2" />
                <p className="font-bold text-green-900 mb-1">Project Generated Successfully!</p>
                <p className="text-sm text-green-800">
                  Check your Downloads folder for the project files and README.md with setup instructions.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
