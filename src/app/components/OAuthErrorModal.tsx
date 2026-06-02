import React from 'react';
import { X, Copy, CheckCircle, AlertTriangle, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { copyToClipboard } from '../utils/clipboard';

interface OAuthErrorModalProps {
  isopen: boolean;
  onClose: () => void;
  platform: string;
  errorType: 'invalid_redirect_uri' | 'https_required' | 'generic';
  errorMessage: string;
}

export function OAuthErrorModal({ isopen, onClose, platform, errorType, errorMessage }: OAuthErrorModalProps) {
  if (!isopen) return null;

  const redirectUri = `${window.location.origin}/oauth-callback.html`;
  const platformName = platform.charAt(0).toUpperCase() + platform.slice(1);

  const copyToClipboardHandler = (text: string) => {
    copyToClipboard(text).then(ok => {
      if (ok) toast.success('Copied to clipboard!');
      else toast.error('Failed to copy');
    });
  };

  const renderInvalidRedirectUriError = () => (
    <>
      <div className="flex items-start gap-3 mb-6">
        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
          <AlertTriangle className="w-6 h-6 text-red-600" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Invalid OAuth Redirect URI
          </h3>
          <p className="text-gray-600">
            The redirect URI is not configured in your {platformName} app settings.
          </p>
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 mb-6 border-2 border-indigo-200">
        <h4 className="font-bold text-indigo-900 mb-3 flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          Quick Fix - Follow These Steps:
        </h4>

        <div className="space-y-4">
          <div className="bg-white rounded-lg p-4 border border-indigo-200">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 text-sm font-bold">
                1
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900 mb-2">
                  Copy your exact redirect URI:
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-gray-100 px-3 py-2 rounded font-mono text-sm text-gray-800 border border-gray-300 break-all">
                    {redirectUri}
                  </code>
                  <button
                    onClick={() => copyToClipboardHandler(redirectUri)}
                    className="px-3 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors flex items-center gap-2 flex-shrink-0"
                    title="Copy to clipboard"
                  >
                    <Copy className="w-4 h-4" />
                    Copy
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  ⚠️ This URL must be copied exactly as shown (including https://)
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-indigo-200">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 text-sm font-bold">
                2
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900 mb-2">
                  Go to Facebook Developers Console:
                </p>
                <a
                  href="https://developers.facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors font-semibold"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open Facebook Developers
                </a>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-indigo-200">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 text-sm font-bold">
                3
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900 mb-2">
                  Configure OAuth Settings:
                </p>
                <ol className="list-disc list-inside space-y-1 text-sm text-gray-700">
                  <li>Select your app from the dashboard</li>
                  <li>Click <strong>Facebook Login</strong> → <strong>Settings</strong> (left sidebar)</li>
                  <li>Scroll to <strong>"Valid OAuth Redirect URIs"</strong></li>
                  <li>Click <strong>"+ Add URI"</strong></li>
                  <li>Paste the copied redirect URI</li>
                  <li>Click <strong>"Save Changes"</strong></li>
                </ol>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-indigo-200">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center flex-shrink-0 text-sm font-bold">
                4
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900 mb-2">
                  Try connecting again:
                </p>
                <p className="text-sm text-gray-700">
                  Once you've added the redirect URI, close this modal and click the "Connect" button again.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200 mb-4">
        <p className="text-sm text-yellow-800">
          <strong>💡 Pro Tip:</strong> Make sure you also enable <strong>"Use Strict Mode for Redirect URIs"</strong> in your Facebook Login settings for better security.
        </p>
      </div>
    </>
  );

  const renderHttpsRequiredError = () => (
    <>
      <div className="flex items-start gap-3 mb-6">
        <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
          <AlertTriangle className="w-6 h-6 text-orange-600" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            HTTPS Required for OAuth
          </h3>
          <p className="text-gray-600">
            {platformName} requires all OAuth connections to use HTTPS (secure connection).
          </p>
        </div>
      </div>

      <div className="bg-red-50 rounded-xl p-5 mb-6 border-2 border-red-200">
        <h4 className="font-bold text-red-900 mb-3">
          ⚠️ Current Issue:
        </h4>
        <p className="text-sm text-red-800 mb-4">
          Your app is currently accessed via HTTP: <code className="bg-red-100 px-2 py-1 rounded">{window.location.origin}</code>
        </p>
        <h4 className="font-bold text-red-900 mb-3">
          ✅ Solution:
        </h4>
        <p className="text-sm text-red-800 mb-3">
          Access your app using HTTPS instead:
        </p>
        <div className="flex items-center gap-2">
          <code className="flex-1 bg-white px-3 py-2 rounded font-mono text-sm text-red-800 border border-red-300">
            https://{window.location.host}
          </code>
          <button
            onClick={() => window.location.href = `https://${window.location.host}`}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors font-semibold flex-shrink-0"
          >
            Switch to HTTPS
          </button>
        </div>
      </div>
    </>
  );

  const renderGenericError = () => (
    <>
      <div className="flex items-start gap-3 mb-6">
        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
          <AlertTriangle className="w-6 h-6 text-red-600" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            OAuth Connection Error
          </h3>
          <p className="text-gray-600">
            There was an error connecting to {platformName}.
          </p>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 mb-6">
        <h4 className="font-semibold text-gray-900 mb-2">Error Details:</h4>
        <pre className="text-sm text-gray-700 whitespace-pre-wrap break-words">
          {errorMessage}
        </pre>
      </div>
    </>
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">OAuth Connection Error</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {errorType === 'invalid_redirect_uri' && renderInvalidRedirectUriError()}
          {errorType === 'https_required' && renderHttpsRequiredError()}
          {errorType === 'generic' && renderGenericError()}

          {/* Additional Help */}
          <div className="border-t pt-4 mt-4">
            <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <ExternalLink className="w-4 h-4" />
              Need More Help?
            </h4>
            <div className="flex flex-wrap gap-3">
              <a
                href="/docs/FACEBOOK_OAUTH_SETUP.md"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors text-sm font-semibold"
              >
                <ExternalLink className="w-4 h-4" />
                Facebook OAuth Setup Guide
              </a>
              <a
                href="https://developers.facebook.com/docs/facebook-login"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-semibold"
              >
                <ExternalLink className="w-4 h-4" />
                Facebook Official Docs
              </a>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t p-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}