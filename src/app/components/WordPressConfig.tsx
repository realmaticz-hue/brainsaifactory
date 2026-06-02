import { useState, useEffect } from 'react';
import { Globe, Key, CheckCircle, XCircle, AlertCircle, Upload, Send } from 'lucide-react';
import {
  saveWordPressConfig,
  getWordPressConfig,
  clearWordPressConfig,
  testWordPressConnection,
  isWordPressConfigured,
  type WordPressConfig as WPConfig,
} from '../utils/wordpress/wordpressClient';
import { toast } from 'sonner';

interface WordPressConfigProps {
  onConfigured?: () => void;
}

export function WordPressConfig({ onConfigured }: WordPressConfigProps) {
  const [siteUrl, setSiteUrl] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [configured, setConfigured] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const config = getWordPressConfig();
    if (config) {
      setSiteUrl(config.siteUrl);
      setUsername(config.username);
      setPassword(config.applicationPassword);
      setConfigured(true);
    }
  }, []);

  const handleTest = async () => {
    if (!siteUrl || !username || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setTesting(true);
    setTestResult(null);

    const config: WPConfig = {
      siteUrl,
      username,
      applicationPassword: password,
    };

    const success = await testWordPressConnection(config);

    setTestResult(success ? 'success' : 'error');
    setTesting(false);

    if (success) {
      toast.success('WordPress connection successful!');
    } else {
      toast.error('Failed to connect to WordPress');
    }
  };

  const handleSave = async () => {
    if (!siteUrl || !username || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    const config: WPConfig = {
      siteUrl,
      username,
      applicationPassword: password,
    };

    // Test connection before saving
    setTesting(true);
    const success = await testWordPressConnection(config);
    setTesting(false);

    if (!success) {
      toast.error('Cannot save: Connection test failed');
      setTestResult('error');
      return;
    }

    saveWordPressConfig(config);
    setConfigured(true);
    setTestResult('success');
    toast.success('WordPress configured successfully!');
    onConfigured?.();
  };

  const handleClear = () => {
    clearWordPressConfig();
    setSiteUrl('');
    setUsername('');
    setPassword('');
    setConfigured(false);
    setTestResult(null);
    toast.success('WordPress configuration cleared');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Globe className="w-6 h-6 text-blue-600" />
            WordPress Configuration
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Connect your WordPress site to auto-publish blog posts
          </p>
        </div>
        {configured && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm font-semibold">
            <CheckCircle className="w-4 h-4" />
            Connected
          </div>
        )}
      </div>

      {/* Configuration Form */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        {/* Site URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            WordPress Site URL
          </label>
          <input
            type="url"
            value={siteUrl}
            onChange={(e) => setSiteUrl(e.target.value)}
            placeholder="https://example.com"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            Your WordPress site URL (e.g., https://myblog.com)
          </p>
        </div>

        {/* Username */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Username
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="admin"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            Your WordPress username
          </p>
        </div>

        {/* Application Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Application Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="xxxx xxxx xxxx xxxx xxxx xxxx"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-800 font-semibold mb-1">
              📝 How to get an Application Password:
            </p>
            <ol className="text-xs text-blue-700 space-y-1 ml-4 list-decimal">
              <li>Go to your WordPress admin → Users → Profile</li>
              <li>Scroll to "Application Passwords"</li>
              <li>Enter a name (e.g., "Blog Generator")</li>
              <li>Click "Add New Application Password"</li>
              <li>Copy the generated password (without spaces)</li>
            </ol>
          </div>
        </div>

        {/* Test Result */}
        {testResult && (
          <div
            className={`p-4 rounded-lg border ${testResult === 'success'
                ? 'bg-green-50 border-green-200'
                : 'bg-red-50 border-red-200'
              }`}
          >
            <div className="flex items-center gap-2">
              {testResult === 'success' ? (
                <>
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-sm font-semibold text-green-900">
                      Connection Successful!
                    </p>
                    <p className="text-xs text-green-700 mt-0.5">
                      Your WordPress site is ready to receive posts
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-red-600" />
                  <div>
                    <p className="text-sm font-semibold text-red-900">
                      Connection Failed
                    </p>
                    <p className="text-xs text-red-700 mt-0.5">
                      Please check your credentials and try again
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={handleTest}
            disabled={testing || !siteUrl || !username || !password}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold text-sm flex items-center justify-center gap-2"
          >
            {testing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Test Connection
              </>
            )}
          </button>

          <button
            onClick={handleSave}
            disabled={testing || !siteUrl || !username || !password}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold text-sm flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            Save Configuration
          </button>

          {configured && (
            <button
              onClick={handleClear}
              className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-semibold text-sm"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Requirements */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-yellow-900 mb-1">
              Requirements
            </p>
            <ul className="text-xs text-yellow-800 space-y-1 ml-4 list-disc">
              <li>WordPress 5.6+ with REST API enabled</li>
              <li>Application Passwords plugin (built-in since WP 5.6)</li>
              <li>HTTPS connection (required for Application Passwords)</li>
              <li>User with publishing permissions</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-4">
          <h3 className="font-bold text-blue-900 mb-2 text-sm">✨ Auto-Publish</h3>
          <p className="text-xs text-blue-700">
            Automatically publish blog posts to your WordPress site with one click
          </p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200 p-4">
          <h3 className="font-bold text-green-900 mb-2 text-sm">🖼️ Media Upload</h3>
          <p className="text-xs text-green-700">
            Upload featured images and media directly to your WordPress library
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-200 p-4">
          <h3 className="font-bold text-purple-900 mb-2 text-sm">🏷️ Category & Tags</h3>
          <p className="text-xs text-purple-700">
            Automatically sync categories and tags from your blog posts
          </p>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-lg border border-orange-200 p-4">
          <h3 className="font-bold text-orange-900 mb-2 text-sm">📅 Scheduled Publishing</h3>
          <p className="text-xs text-orange-700">
            Schedule posts to publish at specific dates and times
          </p>
        </div>
      </div>
    </div>
  );
}
