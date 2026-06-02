// API Key Setup Modal - Prompt users to configure their D-ID API key
import { useState } from 'react';
import { X, Key, ExternalLink, CheckCircle, AlertCircle, Loader, Eye, EyeOff, Copy, HelpCircle } from 'lucide-react';
import {
  testAPIKey as testAPIKeyService,
  saveAPIKey as saveAPIKeyService,
  type Provider,
} from '../utils/apiKeyService';

interface APIKeySetupModalProps {
  isopen: boolean;
  onClose: () => void;
  onKeySaved: () => void;
  provider?: 'captionai' | 'did' | 'azure' | 'elevenlabs' | 'heygen';
}

export function APIKeySetupModal({ isopen, onClose, onKeySaved, provider = 'captionai' }: APIKeySetupModalProps) {
  const [apiKey, setApiKey] = useState('');
  const [azureRegion, setAzureRegion] = useState('eastus');
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);

  if (!isopen) return null;

  const providerConfig = {
    captionai: {
      name: 'Caption AI',
      url: 'https://captions.ai/',
      docs: 'https://docs.captions.ai/',
      apiDocsUrl: 'https://captions.ai/api',
      signupUrl: 'https://captions.ai/signup',
      steps: [
        'Go to https://captions.ai/signup',
        'Sign up for a free account',
        'Navigate to Settings → API Keys',
        'Click "Generate New API Key"',
        'Copy the key and paste below'
      ],
      keyFormat: 'Bearer token (starts with "cap_" or similar)',
      pricing: 'Free tier available, Pro from $20/month',
      testable: true,
      features: [
        '✅ AI Avatar Generation',
        '✅ Voice Cloning & Synthesis',
        '✅ Automatic Lip-Sync',
        '✅ Multi-Language Support',
        '✅ HD Video Export',
        '✅ Fast Processing'
      ]
    },
    did: {
      name: 'D-ID',
      url: 'https://studio.d-id.com/',
      docs: 'https://docs.d-id.com/',
      apiDocsUrl: 'https://docs.d-id.com/reference/create-talk',
      signupUrl: 'https://studio.d-id.com/',
      steps: [
        'Go to https://studio.d-id.com/',
        'Sign up for free trial (20 credits)',
        'Navigate to Settings → API Keys',
        'Click "Create API Key"',
        'Copy the key and paste below'
      ],
      keyFormat: 'Basic authentication token',
      pricing: '$5.90-49/month after trial',
      testable: true,
      features: [
        '✅ Photo to Video',
        '✅ Expressive Avatars (V4)',
        '✅ Multiple Emotions',
        '✅ Professional Quality',
        '✅ Fast Generation'
      ]
    },
    azure: {
      name: 'Azure Speech',
      url: 'https://portal.azure.com/',
      docs: 'https://learn.microsoft.com/en-us/azure/ai-services/speech-service/',
      apiDocsUrl: 'https://learn.microsoft.com/en-us/azure/ai-services/speech-service/rest-text-to-speech',
      signupUrl: 'https://portal.azure.com/',
      steps: [
        'Go to https://portal.azure.com/',
        'Create a "Speech Services" resource',
        'Choose your region (e.g., eastus)',
        'Go to "Keys and Endpoint"',
        'Copy Key 1 and paste below'
      ],
      keyFormat: '32-character hexadecimal key',
      pricing: '$1-4/month (5M chars free)',
      testable: true,
      features: [
        '✅ Neural Voices',
        '✅ 140+ Languages',
        '✅ SSML Support',
        '✅ Custom Voice',
        '✅ Microsoft Quality'
      ]
    },
    elevenlabs: {
      name: 'ElevenLabs',
      url: 'https://elevenlabs.io/',
      docs: 'https://docs.elevenlabs.io/',
      apiDocsUrl: 'https://docs.elevenlabs.io/api-reference/text-to-speech',
      signupUrl: 'https://elevenlabs.io/sign-up',
      steps: [
        'Go to https://elevenlabs.io/',
        'Sign up for free account',
        'Navigate to Profile → API Keys',
        'Click "Generate API Key"',
        'Copy the key and paste below'
      ],
      keyFormat: 'xi_ prefixed key',
      pricing: '$5-99/month after free tier',
      testable: true,
      features: [
        '✅ Ultra-Realistic Voices',
        '✅ Voice Cloning',
        '✅ 29+ Languages',
        '✅ Emotion Control',
        '✅ Premium Quality'
      ]
    },
    heygen: {
      name: 'HeyGen',
      url: 'https://heygen.com/',
      docs: 'https://docs.heygen.com/',
      apiDocsUrl: 'https://docs.heygen.com/reference/api-overview',
      signupUrl: 'https://app.heygen.com/signup',
      steps: [
        'Go to https://heygen.com/',
        'Contact sales for API access',
        'Requires business/enterprise plan',
        'Get API key from dashboard',
        'Copy the key and paste below'
      ],
      keyFormat: 'Enterprise API key',
      pricing: 'Contact sales',
      testable: false,
      features: [
        '✅ Professional Avatars',
        '✅ Custom Avatar Training',
        '✅ Multi-Scene Videos',
        '✅ Enterprise Features',
        '✅ High Volume'
      ]
    }
  };

  const config = providerConfig[provider];

  const validateKey = (key: string): boolean => {
    if (!key.trim()) return false;

    switch (provider) {
      case 'did':
        return key.length > 20; // Basic validation
      case 'azure':
        return key.length === 32; // Azure keys are 32 chars
      case 'elevenlabs':
        return key.startsWith('xi_') || key.length > 20;
      case 'heygen':
        return key.length > 10;
      default:
        return true;
    }
  };

  const testAPIKey = async () => {
    if (!validateKey(apiKey)) {
      setError('Invalid API key format');
      return false;
    }

    setIsTesting(true);
    setError(null);

    try {
      const result = await testAPIKeyService({
        provider,
        apiKey,
        region: provider === 'azure' ? azureRegion : undefined,
      });

      if (result.valid) {
        setSuccess('API key is valid!');
        return true;
      } else {
        setError(result.error || 'Invalid API key');
        return false;
      }
    } catch (err) {
      console.error('Test error:', err);
      setError('Could not test API key. It will be saved anyway.');
      return true; // Allow saving even if test fails
    } finally {
      setIsTesting(false);
    }
  };

  const saveAPIKey = async () => {
    if (!validateKey(apiKey)) {
      setError('Please enter a valid API key');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await saveAPIKeyService({
        provider,
        apiKey,
        region: provider === 'azure' ? azureRegion : undefined,
      });

      setSuccess('API key saved successfully!');

      // Wait a moment to show success message
      setTimeout(() => {
        onKeySaved();
        onClose();
      }, 1000);

    } catch (err) {
      console.error('Save error:', err);
      setError('Failed to save API key. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const testAndSave = async () => {
    if (config.testable) {
      const isValid = await testAPIKey();
      if (isValid) {
        await saveAPIKey();
      }
    } else {
      await saveAPIKey();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-gray-700">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-pink-600 p-6 border-b border-gray-700">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
                <Key className="w-7 h-7" />
                Setup {config.name} API Key
              </h2>
              <p className="text-white/90 text-sm">Configure your API key to enable avatar video generation</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Alert Banner */}
          <div className="mb-6 p-4 bg-blue-900/30 border border-blue-500/50 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-blue-300 font-semibold mb-1">Why do I need this?</h4>
                <p className="text-blue-200 text-sm">
                  To generate REAL talking avatar videos with voice synthesis and lip-sync, we need to connect to {config.name}'s AI service.
                  Your API key allows the system to create professional videos from your photos and text.
                </p>
              </div>
            </div>
          </div>

          {/* Instructions Toggle */}
          <button
            onClick={() => setShowInstructions(!showInstructions)}
            className="w-full mb-4 p-4 bg-gray-800 hover:bg-gray-750 rounded-lg transition-all flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <HelpCircle className="w-5 h-5 text-purple-400" />
              <span className="text-white font-semibold">How to Get Your API Key</span>
            </div>
            <span className="text-gray-400">{showInstructions ? '▼' : '▶'}</span>
          </button>

          {/* Instructions */}
          {showInstructions && (
            <div className="mb-6 p-5 bg-gray-800 rounded-lg border border-gray-700">
              <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                📋 Step-by-Step Instructions
              </h3>

              <ol className="space-y-3 mb-4">
                {config.steps.map((step, index) => (
                  <li key={index} className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </span>
                    <span className="text-gray-300 text-sm">{step}</span>
                  </li>
                ))}
              </ol>

              <div className="grid grid-cols-2 gap-3">
                <a
                  href={config.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2 text-sm"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open {config.name}
                </a>
                <a
                  href={config.docs}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold flex items-center justify-center gap-2 text-sm"
                >
                  <ExternalLink className="w-4 h-4" />
                  View Docs
                </a>
              </div>
            </div>
          )}

          {/* API Key Input */}
          <div className="mb-6">
            <label className="block text-white font-semibold mb-2">
              {config.name} API Key
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value);
                  setError(null);
                  setSuccess(null);
                }}
                placeholder={`Enter your ${config.name} API key...`}
                className="w-full px-4 py-3 pr-24 bg-gray-800 text-white border border-gray-600 rounded-lg focus:border-purple-500 focus:outline-none font-mono text-sm"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-2">
                <button
                  onClick={() => setShowKey(!showKey)}
                  className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                  title={showKey ? 'Hide key' : 'Show key'}
                >
                  {showKey ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />}
                </button>
              </div>
            </div>
            <p className="text-gray-400 text-xs mt-1">Format: {config.keyFormat}</p>
          </div>

          {/* Azure Region (if provider is Azure) */}
          {provider === 'azure' && (
            <div className="mb-6">
              <label className="block text-white font-semibold mb-2">
                Azure Region
              </label>
              <select
                value={azureRegion}
                onChange={(e) => setAzureRegion(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 text-white border border-gray-600 rounded-lg focus:border-purple-500 focus:outline-none"
              >
                <option value="eastus">East US</option>
                <option value="westus">West US</option>
                <option value="westus2">West US 2</option>
                <option value="eastus2">East US 2</option>
                <option value="centralus">Central US</option>
                <option value="northeurope">North Europe</option>
                <option value="westeurope">West Europe</option>
                <option value="southeastasia">Southeast Asia</option>
                <option value="eastasia">East Asia</option>
                <option value="japaneast">Japan East</option>
              </select>
              <p className="text-gray-400 text-xs mt-1">Must match the region where you created your Speech resource</p>
            </div>
          )}

          {/* Pricing Info */}
          <div className="mb-6 p-4 bg-gray-800 rounded-lg border border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">💰</span>
              <h4 className="text-white font-semibold">Pricing</h4>
            </div>
            <p className="text-gray-300 text-sm">{config.pricing}</p>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="mb-4 p-3 bg-red-900/50 border border-red-500 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-900/50 border border-green-500 rounded-lg flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <p className="text-green-200 text-sm">{success}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            {config.testable && (
              <button
                onClick={testAPIKey}
                disabled={!apiKey.trim() || isTesting}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition-all"
              >
                {isTesting ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Test Connection
                  </>
                )}
              </button>
            )}

            <button
              onClick={testAndSave}
              disabled={!apiKey.trim() || isSaving || isTesting}
              className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed text-white rounded-lg font-bold flex items-center justify-center gap-2 transition-all shadow-lg"
            >
              {isSaving ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Key className="w-5 h-5" />
                  {config.testable ? 'Test & Save' : 'Save API Key'}
                </>
              )}
            </button>
          </div>

          {/* Security Notice */}
          <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
            <p className="text-yellow-200 text-xs flex items-start gap-2">
              <span className="text-yellow-400">🔒</span>
              <span>
                Your API key is encrypted and stored securely. We never share your credentials with third parties.
                The key is only used to generate videos on your behalf.
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}