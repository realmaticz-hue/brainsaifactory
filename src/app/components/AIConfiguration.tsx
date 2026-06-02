import { useState, useEffect } from 'react';
import { Key, Sparkles, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { aiProvider, isAIConfigured, type AIProvider } from '../utils/ai/aiProvider';

interface APIKeyStatus {
  provider: AIProvider;
  configured: boolean;
  tested: boolean;
  working: boolean;
  error?: string;
}

export function AIConfiguration() {
  const [openaiKey, setOpenaiKey] = useState('');
  const [claudeKey, setClaudeKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [statuses, setStatuses] = useState<APIKeyStatus[]>([
    { provider: 'openai', configured: false, tested: false, working: false },
    { provider: 'anthropic', configured: false, tested: false, working: false },
    { provider: 'google', configured: false, tested: false, working: false },
  ]);
  const [testing, setTesting] = useState(false);
  const [showKeys, setShowKeys] = useState(false);

  useEffect(() => {
    // Load saved keys from localStorage
    const savedOpenAI = localStorage.getItem('ai_openai_key');
    const savedClaude = localStorage.getItem('ai_claude_key');
    const savedGemini = localStorage.getItem('ai_gemini_key');

    if (savedOpenAI) {
      setOpenaiKey(savedOpenAI);
      aiProvider.configure('openai', savedOpenAI);
    }
    if (savedClaude) {
      setClaudeKey(savedClaude);
      aiProvider.configure('anthropic', savedClaude);
    }
    if (savedGemini) {
      setGeminiKey(savedGemini);
      aiProvider.configure('google', savedGemini);
    }

    updateStatuses();
  }, []);

  const updateStatuses = () => {
    setStatuses([
      {
        provider: 'openai',
        configured: isAIConfigured('openai'),
        tested: false,
        working: false,
      },
      {
        provider: 'anthropic',
        configured: isAIConfigured('anthropic'),
        tested: false,
        working: false,
      },
      {
        provider: 'google',
        configured: isAIConfigured('google'),
        tested: false,
        working: false,
      },
    ]);
  };

  const saveKey = (provider: AIProvider, key: string) => {
    if (key.trim()) {
      localStorage.setItem(`ai_${provider}_key`, key.trim());
      aiProvider.configure(provider, key.trim());
    } else {
      localStorage.removeItem(`ai_${provider}_key`);
    }
    updateStatuses();
  };

  const testConnection = async (provider: AIProvider) => {
    setTesting(true);

    try {
      // Simple test prompt
      const result = await aiProvider.generate({
        prompt: 'Say "OK" if you can read this.',
        provider,
        maxTokens: 10,
      });

      setStatuses(prev => prev.map(s =>
        s.provider === provider
          ? { ...s, tested: true, working: true, error: undefined }
          : s
      ));
    } catch (error) {
      setStatuses(prev => prev.map(s =>
        s.provider === provider
          ? { ...s, tested: true, working: false, error: String(error) }
          : s
      ));
    } finally {
      setTesting(false);
    }
  };

  const testAllConnections = async () => {
    setTesting(true);

    const providers: AIProvider[] = ['openai', 'anthropic', 'google'];
    for (const provider of providers) {
      if (isAIConfigured(provider)) {
        await testConnection(provider);
      }
    }

    setTesting(false);
  };

  const configuredCount = statuses.filter(s => s.configured).length;
  const workingCount = statuses.filter(s => s.working).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-600" />
            AI Configuration
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Configure API keys for real AI-powered blog generation
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500">Providers Configured</div>
          <div className="text-2xl font-bold text-purple-600">{configuredCount}/3</div>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* OpenAI */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                <Key className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <div className="font-semibold text-gray-900">OpenAI</div>
                <div className="text-xs text-gray-500">GPT-3.5/4</div>
              </div>
            </div>
            {statuses[0].configured && (
              statuses[0].working ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : statuses[0].tested ? (
                <XCircle className="w-5 h-5 text-red-500" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
              )
            )}
          </div>
          <div className="text-xs text-gray-600 mb-2">
            {statuses[0].configured ? '✓ Configured' : '○ Not configured'}
          </div>
        </div>

        {/* Anthropic */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                <Key className="w-4 h-4 text-orange-600" />
              </div>
              <div>
                <div className="font-semibold text-gray-900">Anthropic</div>
                <div className="text-xs text-gray-500">Claude</div>
              </div>
            </div>
            {statuses[1].configured && (
              statuses[1].working ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : statuses[1].tested ? (
                <XCircle className="w-5 h-5 text-red-500" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
              )
            )}
          </div>
          <div className="text-xs text-gray-600 mb-2">
            {statuses[1].configured ? '✓ Configured' : '○ Not configured'}
          </div>
        </div>

        {/* Google */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <Key className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <div className="font-semibold text-gray-900">Google</div>
                <div className="text-xs text-gray-500">Gemini</div>
              </div>
            </div>
            {statuses[2].configured && (
              statuses[2].working ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : statuses[2].tested ? (
                <XCircle className="w-5 h-5 text-red-500" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
              )
            )}
          </div>
          <div className="text-xs text-gray-600 mb-2">
            {statuses[2].configured ? '✓ Configured' : '○ Not configured'}
          </div>
        </div>
      </div>

      {/* API Key Inputs */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">API Keys</h3>
          <button
            onClick={() => setShowKeys(!showKeys)}
            className="text-sm text-purple-600 hover:text-purple-700"
          >
            {showKeys ? 'Hide' : 'Show'} Keys
          </button>
        </div>

        {/* OpenAI Key */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            OpenAI API Key
          </label>
          <div className="flex gap-2">
            <input
              type={showKeys ? 'text' : 'password'}
              value={openaiKey}
              onChange={(e) => setOpenaiKey(e.target.value)}
              onBlur={() => saveKey('openai', openaiKey)}
              placeholder="sk-..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            {isAIConfigured('openai') && (
              <button
                onClick={() => testConnection('openai')}
                disabled={testing}
                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50"
              >
                Test
              </button>
            )}
          </div>
          <a
            href="https://platform.openai.com/api-keys"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-purple-600 hover:underline mt-1 inline-block"
          >
            Get OpenAI API key →
          </a>
        </div>

        {/* Claude Key */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Anthropic API Key (Claude)
          </label>
          <div className="flex gap-2">
            <input
              type={showKeys ? 'text' : 'password'}
              value={claudeKey}
              onChange={(e) => setClaudeKey(e.target.value)}
              onBlur={() => saveKey('anthropic', claudeKey)}
              placeholder="sk-ant-..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            {isAIConfigured('anthropic') && (
              <button
                onClick={() => testConnection('anthropic')}
                disabled={testing}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm hover:bg-orange-700 disabled:opacity-50"
              >
                Test
              </button>
            )}
          </div>
          <a
            href="https://console.anthropic.com/settings/keys"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-purple-600 hover:underline mt-1 inline-block"
          >
            Get Anthropic API key →
          </a>
        </div>

        {/* Gemini Key */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Google API Key (Gemini)
          </label>
          <div className="flex gap-2">
            <input
              type={showKeys ? 'text' : 'password'}
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              onBlur={() => saveKey('google', geminiKey)}
              placeholder="AIza..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            {isAIConfigured('google') && (
              <button
                onClick={() => testConnection('google')}
                disabled={testing}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
              >
                Test
              </button>
            )}
          </div>
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-purple-600 hover:underline mt-1 inline-block"
          >
            Get Google API key →
          </a>
        </div>

        {/* Test All Button */}
        {configuredCount > 0 && (
          <div className="pt-4 border-t border-gray-200">
            <button
              onClick={testAllConnections}
              disabled={testing}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              {testing ? 'Testing...' : `Test All Configured Providers (${configuredCount})`}
            </button>
          </div>
        )}
      </div>

      {/* Error Messages */}
      {statuses.some(s => s.error) && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-2">
          <div className="font-semibold text-red-900 flex items-center gap-2">
            <XCircle className="w-4 h-4" />
            Connection Errors
          </div>
          {statuses.map(s => s.error && (
            <div key={s.provider} className="text-sm text-red-700">
              <strong className="capitalize">{s.provider}:</strong> {s.error}
            </div>
          ))}
        </div>
      )}

      {/* Success Message */}
      {workingCount > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="font-semibold text-green-900 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            {workingCount === configuredCount
              ? `All ${workingCount} providers working!`
              : `${workingCount}/${configuredCount} providers working`}
          </div>
          <p className="text-sm text-green-700 mt-1">
            AI-powered blog generation is ready to use.
          </p>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="text-sm text-blue-900">
          <strong>Note:</strong> You need at least one API key configured to use real AI generation.
          The system will automatically select the best provider based on your budget and task complexity.
          Configure multiple providers for automatic fallback if one fails.
        </div>
      </div>
    </div>
  );
}
