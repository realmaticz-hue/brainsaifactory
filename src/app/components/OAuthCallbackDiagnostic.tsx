import React, { useState } from 'react';
import { Copy, CheckCircle, AlertCircle, ExternalLink, RefreshCw } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { copyToClipboard } from '../utils/clipboard';

interface OAuthCallbackDiagnosticProps {
  platform?: 'facebook' | 'instagram' | 'tiktok' | 'twitter' | 'linkedin' | 'youtube';
}

export function OAuthCallbackDiagnostic({ platform = 'facebook' }: OAuthCallbackDiagnosticProps) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(true);

  // Construct the exact callback URL that the code uses
  // Using the standalone HTML file for reliable OAuth callback handling in popups
  const callbackUrl = `${window.location.origin}/oauth-callback.html`;

  const handleCopy = async () => {
    try {
      const ok = await copyToClipboard(callbackUrl);
      if (ok) {
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      }
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const platformConfig = {
    facebook: {
      name: 'Facebook',
      color: 'blue',
      settingsUrl: 'https://developers.facebook.com/apps/',
      steps: [
        'Go to Facebook Developer Portal → select your app',
        'Settings → Basic: Add App Domain: c627e5cd-d54a-4de0-80b4-44f404b39365-v2-figmaiframepreview.figma.site',
        'Settings → Basic → Website: Set Site URL to https://c627e5cd-d54a-4de0-80b4-44f404b39365-v2-figmaiframepreview.figma.site/',
        'Click "Save Changes" on Basic Settings page',
        'Products → Facebook Login → Settings',
        'ENABLE "Client OAuth Login" toggle (must be ON)',
        'ENABLE "Web OAuth Login" toggle (must be ON)',
        'Scroll to "Valid OAuth Redirect URIs"',
        'Add URI #1: ' + 'https://c627e5cd-d54a-4de0-80b4-44f404b39365-v2-figmaiframepreview.figma.site/oauth-callback.html',
        'Add URI #2: https://bepcmibntfsijkqrlfzd.supabase.co/auth/v1/callback',
        'Remove any old URIs ending in /oauth-callback (without .html)',
        'Click "Save Changes" — wait 1-2 minutes for propagation',
      ],
      docUrl: 'https://developers.facebook.com/docs/facebook-login/guides/advanced/manual-flow#confirm',
    },
    instagram: {
      name: 'Instagram',
      color: 'pink',
      settingsUrl: 'https://developers.facebook.com/apps/',
      steps: [
        'Go to Facebook Developer Portal',
        'Select your app → Products → Instagram Basic Display',
        'Find "Valid OAuth Redirect URIs"',
        'Click "+ Add URI"',
        'Paste the callback URL below',
        'Click "Save Changes"',
      ],
      docUrl: 'https://developers.facebook.com/docs/instagram-basic-display-api/getting-started',
    },
    tiktok: {
      name: 'TikTok',
      color: 'gray',
      settingsUrl: 'https://developers.tiktok.com/',
      steps: [
        'Go to TikTok for Developers',
        'Select your app → Manage Apps',
        'Find "Redirect URIs"',
        'Add the callback URL below',
        'Save changes',
      ],
      docUrl: 'https://developers.tiktok.com/doc/login-kit-web',
    },
    twitter: {
      name: 'Twitter/X',
      color: 'sky',
      settingsUrl: 'https://developer.twitter.com/en/portal/dashboard',
      steps: [
        'Go to Twitter Developer Portal',
        'Select your app → User authentication settings',
        'Find "Callback URI / Redirect URL"',
        'Add the callback URL below',
        'Save changes',
      ],
      docUrl: 'https://developer.twitter.com/en/docs/authentication/oauth-2-0',
    },
    linkedin: {
      name: 'LinkedIn',
      color: 'blue',
      settingsUrl: 'https://www.linkedin.com/developers/apps',
      steps: [
        'Go to LinkedIn Developer Portal',
        'Select your app → Auth',
        'Find "Authorized redirect URLs for your app"',
        'Add the callback URL below',
        'Update',
      ],
      docUrl: 'https://learn.microsoft.com/en-us/linkedin/shared/authentication/authentication',
    },
    youtube: {
      name: 'YouTube',
      color: 'red',
      settingsUrl: 'https://console.cloud.google.com/apis/credentials',
      steps: [
        'Go to Google Cloud Console',
        'Select your project → Credentials',
        'Find your OAuth 2.0 Client ID',
        'Add the callback URL to "Authorized redirect URIs"',
        'Save',
      ],
      docUrl: 'https://developers.google.com/youtube/v3/guides/auth/server-side-web-apps',
    },
  };

  const config = platformConfig[platform];

  return (
    <div className="border-2 border-yellow-400 bg-yellow-50 rounded-xl overflow-hidden shadow-lg">
      {/* Header */}
      <div
        className="bg-gradient-to-r from-yellow-400 to-orange-400 p-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg">
                🔧 {config.name} OAuth Callback Configuration
              </h3>
              <p className="text-sm text-gray-800">
                {expanded ? 'Click to collapse' : 'Click to expand diagnostic info'}
              </p>
            </div>
          </div>
          <RefreshCw className={`w-5 h-5 text-gray-900 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {/* Content */}
      {expanded && (
        <div className="p-6 space-y-6">
          {/* Critical Info Box */}
          <div className="bg-white border-2 border-orange-300 rounded-lg p-4">
            <h4 className="font-bold text-orange-900 mb-2 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Why is my OAuth URL being blocked?
            </h4>
            <p className="text-sm text-gray-700 mb-3">
              Facebook is blocking the OAuth redirect because the callback URL in your code <strong>does not match</strong> what's registered in your Facebook App settings.
            </p>

            {/* Facebook OAuth Toggles - MOST COMMON ISSUE */}
            {platform === 'facebook' && (
              <div className="bg-red-50 border-2 border-red-400 rounded p-4 mb-3 animate-pulse">
                <p className="text-sm font-bold text-red-900 mb-3 flex items-center gap-2">
                  🚨 MOST COMMON ISSUE - Check These Toggles First!
                </p>
                <div className="bg-white border border-red-300 rounded p-3 space-y-2">
                  <p className="text-xs font-semibold text-red-900 mb-2">
                    Go to: <strong>Facebook Login → Settings</strong> and verify these toggles are <strong>ON</strong>:
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <input type="checkbox" className="w-4 h-4" disabled />
                      <span className="font-mono text-xs bg-red-100 px-2 py-1 rounded">Client OAuth Login</span>
                      <span className="text-red-800">← Must be <strong>ON</strong></span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <input type="checkbox" className="w-4 h-4" disabled />
                      <span className="font-mono text-xs bg-red-100 px-2 py-1 rounded">Web OAuth Login</span>
                      <span className="text-red-800">← Must be <strong>ON</strong></span>
                    </div>
                  </div>
                  <p className="text-xs text-red-700 mt-2 italic">
                    💡 If these are OFF, Facebook will reject ALL OAuth redirects, even if the URL is in the list!
                  </p>
                </div>
              </div>
            )}

            <div className="bg-red-50 border border-red-200 rounded p-3 mb-3">
              <p className="text-xs font-semibold text-red-900 mb-2">❌ REMOVE THESE if present (outdated/invalid):</p>
              <code className="block text-xs text-red-800 bg-red-100 px-2 py-1.5 rounded font-mono break-all mb-1">
                https://cdcf1c11-d678-4b57-858d-a87db6cb11f7-v2-figmaiframepreview.figma.site/oauth-callback
              </code>
              <code className="block text-xs text-red-800 bg-red-100 px-2 py-1.5 rounded font-mono break-all">
                {window.location.origin}/oauth-callback (without .html — causes 404)
              </code>
              <p className="text-xs text-red-800 mt-2">
                ⚠️ These URLs cause 404 errors because Figma Make's static hosting doesn't support SPA fallback routing. Delete them from Facebook's Valid OAuth Redirect URIs.
              </p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded p-3">
              <p className="text-xs font-semibold text-green-900 mb-2">✅ ADD THIS INSTEAD (Correct callback URL):</p>
              <code className="block text-xs text-green-800 bg-green-100 px-2 py-1.5 rounded font-mono break-all">
                {callbackUrl}
              </code>
              <p className="text-xs text-green-800 mt-2">
                ✅ This is your app's frontend OAuth callback URL. Facebook will redirect here, then the frontend calls the backend securely.
              </p>
            </div>
          </div>

          {/* Callback URL Display */}
          <div className="bg-white border-2 border-blue-300 rounded-lg p-4">
            <h4 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
              <Copy className="w-5 h-5" />
              Your Exact Callback URL
            </h4>
            <p className="text-xs text-gray-600 mb-3">
              Copy this URL exactly as shown below. This is where Facebook will redirect after a user approves access.
            </p>

            <div className="bg-gray-50 border border-gray-300 rounded-lg p-3 mb-3">
              <div className="flex items-start gap-2">
                <code className="flex-1 text-xs font-mono text-gray-800 break-all select-all leading-relaxed">
                  {callbackUrl}
                </code>
                <button
                  onClick={handleCopy}
                  className={`shrink-0 px-3 py-2 rounded-lg font-semibold text-sm transition-all ${copied
                      ? 'bg-green-500 text-white'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                >
                  {copied ? (
                    <>
                      <CheckCircle className="w-4 h-4 inline mr-1" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 inline mr-1" />
                      Copy
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-300 rounded p-2">
              <p className="text-xs text-blue-900">
                <strong>💡 Tip:</strong> This URL must match <strong>EXACTLY</strong> — including https:// and the path /oauth-callback.html (with .html extension).
              </p>
            </div>
          </div>

          {/* Step-by-Step Instructions */}
          <div className="bg-white border-2 border-purple-300 rounded-lg p-4">
            <h4 className="font-bold text-purple-900 mb-3 flex items-center gap-2">
              <ExternalLink className="w-5 h-5" />
              Step-by-Step Setup Instructions
            </h4>

            <ol className="space-y-2 mb-4">
              {config.steps.map((step, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                    {idx + 1}
                  </span>
                  <span className="text-sm text-gray-700 pt-0.5">{step}</span>
                </li>
              ))}
            </ol>

            <a
              href={config.settingsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold text-sm"
            >
              Open {config.name} Developer Portal
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>

          {/* Verification */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-lg p-4">
            <h4 className="font-bold text-blue-900 mb-2">✅ How to verify it's working:</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
              <li>After saving the callback URL in Facebook, wait 1-2 minutes</li>
              <li>Clear your browser cache or open an incognito window</li>
              <li>Try the "Connect with Facebook OAuth" button again</li>
              <li>You should be redirected to Facebook's login page</li>
              <li>After approving, Facebook will redirect back to the Supabase callback URL</li>
              <li>The server will exchange the code for a token and redirect you back to this app</li>
            </ol>
          </div>

          {/* Technical Details */}
          <details className="bg-gray-50 border border-gray-300 rounded-lg p-4">
            <summary className="font-bold text-gray-900 cursor-pointer text-sm">
              🔍 Technical Details (for developers)
            </summary>
            <div className="mt-3 space-y-2 text-xs text-gray-700">
              <p><strong>Project ID:</strong> <code className="bg-gray-200 px-1 rounded">{projectId}</code></p>
              <p><strong>Platform:</strong> <code className="bg-gray-200 px-1 rounded">{platform}</code></p>
              <p><strong>OAuth Flow:</strong> Authorization Code Grant (server-side)</p>
              <p><strong>Why Supabase callback?</strong> Token exchange happens on the server for better security. The server receives the authorization code, exchanges it for an access token, stores it securely, then redirects back to your app.</p>
              <p><strong>Why ?apikey=?</strong> Supabase requires authentication for all requests. Since Facebook's redirect is a browser redirect (no Authorization header), we pass the public anon key in the URL as a workaround.</p>
              <a
                href={config.docUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline hover:text-blue-800 inline-flex items-center gap-1 mt-2"
              >
                Read {config.name} OAuth Documentation
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </details>
        </div>
      )}
    </div>
  );
}