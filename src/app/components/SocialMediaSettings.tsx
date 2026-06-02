import React, { useState, useEffect } from 'react';
import { X, Facebook, Instagram, Save, AlertCircle, CheckCircle, Settings as SettingsIcon, Link as LinkIcon, RefreshCw, Key, Clock, ExternalLink, Code2, Terminal, Download, ChevronDown, ChevronRight } from 'lucide-react';
import { socialAccountManager } from '../utils/socialMediaAccounts';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { copyToClipboard } from '../utils/clipboard';
import { serverFetch, resolveCallbackUrl } from '../utils/serverFetch';
import { OAuthCallbackDiagnostic } from './OAuthCallbackDiagnostic';

interface SocialMediaSettingsProps {
  isopen: boolean;
  onClose: () => void;
}

interface AccountCredentials {
  facebook?: {
    pageId: string;
    appId?: string;
    appSecret?: string;
    accessToken: string;       // The active token used for posting
    pageAccessToken?: string;  // Legacy field kept for compatibility
  };
  instagram?: {
    accountId: string;
    accessToken: string;
  };
  tiktok?: {
    username: string;
    accessToken: string;
  };
  twitter?: {
    apiKey: string;
    apiSecret: string;
    accessToken: string;
    accessTokenSecret: string;
  };
  linkedin?: {
    accessToken: string;
    organizationId?: string;
  };
  youtube?: {
    apiKey: string;
    channelId: string;
  };
}

export function SocialMediaSettings({ isopen, onClose }: SocialMediaSettingsProps) {
  const [credentials, setCredentials] = useState<AccountCredentials>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [activeTab, setActiveTab] = useState<'facebook' | 'instagram' | 'tiktok' | 'twitter' | 'linkedin' | 'youtube'>('facebook');
  const [testingConnection, setTestingConnection] = useState(false);
  const [backendAvailable, setBackendAvailable] = useState(true);
  const [exchangingToken, setExchangingToken] = useState(false);
  const [exchangeStatus, setExchangeStatus] = useState<{ type: 'success' | 'error'; msg: string; expired?: boolean } | null>(null);
  const [showOAuthHint, setShowOAuthHint] = useState(false);
  // OAuth flow state
  const [oauthStatus, setOauthStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [exchangingOauth, setExchangingOauth] = useState(false);
  // Stores the generated OAuth URL so we can render it as a clickable <a> link (popup-blocker-proof)
  const [pendingOauthUrl, setPendingOauthUrl] = useState<string | null>(null);
  // Page discovery
  const [discoveringPages, setDiscoveringPages] = useState(false);
  const [discoveredPages, setDiscoveredPages] = useState<Array<{ id: string; name: string; category: string; fanCount: number | null }> | null>(null);
  const [discoverError, setDiscoverError] = useState<string | null>(null);
  const [snippetCopied, setSnippetCopied] = useState(false);
  const [snippetLang, setSnippetLang] = useState<'nodejs' | 'python' | 'curl'>('nodejs');
  const [snippetExpanded, setSnippetExpanded] = useState(true);
  // Test connection result
  const [testResult, setTestResult] = useState<{ type: 'success' | 'error'; msg: string; details?: any } | null>(null);
  // Manual code paste state (for when OAuth popup relay fails)
  const [manualCode, setManualCode] = useState('');
  const [manualRedirectUri, setManualRedirectUri] = useState(`${window.location.origin}/oauth-callback.html`);
  const [exchangingManualCode, setExchangingManualCode] = useState(false);
  const [manualCodeStatus, setManualCodeStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  useEffect(() => {
    // Load saved credentials
    loadCredentials();
    // Check for OAuth callback result in URL params
    handleOAuthCallback();
  }, []);

  // Detect Facebook OAuth redirect-back result from URL params.
  // The Supabase edge function callback handler redirects back here with
  // ?fbAuthSuccess=1 or ?fbAuthError=... after completing the token exchange.
  const handleOAuthCallback = () => {
    const params = new URLSearchParams(window.location.search);

    if (params.get('fbAuthSuccess')) {
      const tokenType = params.get('fbTokenType') || 'long-lived token';
      setOauthStatus({ type: 'success', msg: `✅ Facebook connected! Got a ${tokenType}. Token saved automatically — reloading credentials…` });
      setActiveTab('facebook');
      window.history.replaceState({}, '', window.location.pathname);
      // Reload credentials from KV to pick up what the server saved
      setTimeout(() => loadCredentials(), 800);

    } else if (params.get('fbAuthError')) {
      const msg = decodeURIComponent(params.get('fbAuthError') || 'Unknown error');
      setOauthStatus({ type: 'error', msg: `❌ Facebook OAuth failed: ${msg}` });
      setActiveTab('facebook');
      window.history.replaceState({}, '', window.location.pathname);
    }
    // Note: we no longer handle raw ?code= here — the Supabase callback does that server-side.
  };

  // Manual code exchange — user copies the authorization code from the popup and pastes it here
  const handleManualCodeExchange = async () => {
    const code = manualCode.trim();
    if (!code) {
      setManualCodeStatus({ type: 'error', msg: 'Please paste the authorization code from the popup.' });
      return;
    }
    const fb = credentials.facebook || {} as any;
    if (!fb.appId) {
      setManualCodeStatus({ type: 'error', msg: 'App ID is required. Enter it in the Manual Token Entry section below.' });
      return;
    }

    setExchangingManualCode(true);
    setManualCodeStatus(null);

    try {
      // Use the redirect_uri that was used when the OAuth flow was initiated
      // This MUST match exactly, or Facebook will reject the token exchange
      const redirectUri = manualRedirectUri.trim() || `${window.location.origin}/oauth-callback.html`;
      const res = await serverFetch('/facebook-code-exchange', {
        method: 'POST',
        body: JSON.stringify({ code, redirectUri, appId: fb.appId }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setManualCodeStatus({ type: 'error', msg: `Exchange failed: ${data.error || 'Unknown error'}. The code may have expired — they're single-use and valid for ~10 minutes.` });
        return;
      }
      if (data.credentials) {
        setCredentials(data.credentials);
        localStorage.setItem('socialCredentials', JSON.stringify(data.credentials));
      }
      setManualCodeStatus({ type: 'success', msg: data.message || 'Facebook connected successfully! Token saved.' });
      setManualCode('');
    } catch (err: any) {
      setManualCodeStatus({ type: 'error', msg: `Network error: ${err.message}` });
    } finally {
      setExchangingManualCode(false);
    }
  };

  // Exchange ?code= returned by Facebook for tokens (called after redirect back to app)
  const exchangeFacebookCode = async (code: string, appId: string, redirectUri: string) => {
    setExchangingOauth(true);
    setOauthStatus(null);
    try {
      const res = await serverFetch('/facebook-code-exchange', {
        method: 'POST',
        body: JSON.stringify({ code, redirectUri, appId }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setOauthStatus({ type: 'error', msg: `❌ Facebook OAuth failed: ${data.error || 'Unknown error'}` });
        return;
      }
      if (data.credentials) {
        setCredentials(data.credentials);
        localStorage.setItem('socialCredentials', JSON.stringify(data.credentials));
      }
      setOauthStatus({ type: 'success', msg: data.message || '✅ Facebook connected! Token saved.' });
    } catch (err: any) {
      setOauthStatus({ type: 'error', msg: `❌ Network error during OAuth: ${err.message}` });
    } finally {
      setExchangingOauth(false);
    }
  };

  // Kick off Facebook OAuth — builds the dialog URL client-side (no server redirect,
  // so no Supabase auth-header problem). Facebook will redirect back to this page with ?code=.
  const handleFacebookOAuth = async () => {
    const fb = credentials.facebook || {} as any;
    if (!fb.appId) {
      setOauthStatus({ type: 'error', msg: 'Enter your App ID first (developers.facebook.com → Your App → Settings → Basic).' });
      return;
    }
    if (!fb.appSecret) {
      setOauthStatus({ type: 'error', msg: 'Enter your App Secret first. The server needs it stored before the OAuth callback.' });
      return;
    }

    setExchangingOauth(true);
    setOauthStatus(null);
    setPendingOauthUrl(null);

    try {
      // Save current credentials (including App Secret) to KV so the callback can use it
      await saveCredentials();

      // ── Use the Supabase Edge Function as the stable OAuth callback URL ───
      // The ?apikey= (public anon key) is required because Facebook's browser redirect
      // carries no Authorization header, so Supabase would return 401 without it.
      const callbackUri = resolveCallbackUrl('/facebook-oauth-callback', {
        apikey: publicAnonKey,
      });

      // Pass the current app URL so the server can redirect back here after auth
      const returnUrl = window.location.href.split('?')[0];
      const state = btoa(JSON.stringify({ appId: fb.appId, returnUrl }));

      const fbDialog =
        `https://www.facebook.com/v21.0/dialog/oauth` +
        `?client_id=${encodeURIComponent(fb.appId)}` +
        `&redirect_uri=${encodeURIComponent(callbackUri)}` +
        `&scope=pages_manage_posts,pages_read_engagement,pages_show_list` +
        `&state=${encodeURIComponent(state)}` +
        `&response_type=code`;

      // Always render as a clickable <a> — never use window.open() or location.assign()
      // after an await, as popup blockers will intercept those.
      // A real <a href> click is NEVER blocked by popup blockers.
      setPendingOauthUrl(fbDialog);
      setExchangingOauth(false);

    } catch (err: any) {
      setOauthStatus({ type: 'error', msg: `❌ OAuth setup failed: ${err?.message || String(err)}` });
      setExchangingOauth(false);
    }
  };

  // ── Discover pages accessible by the current token ───────────────────────
  const handleDiscoverPages = async () => {
    const fb = credentials.facebook || {} as any;
    setDiscoveringPages(true);
    setDiscoveredPages(null);
    setDiscoverError(null);
    try {
      const res = await serverFetch('/facebook-list-pages', {
        method: 'POST',
        body: JSON.stringify({ accessToken: fb.accessToken || '' }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setDiscoverError(data.error || 'Failed to list pages');
        return;
      }
      setDiscoveredPages(data.pages || []);
    } catch (err: any) {
      setDiscoverError(`Network error: ${err.message}`);
    } finally {
      setDiscoveringPages(false);
    }
  };

  const loadCredentials = async () => {
    try {
      // First try to load from localStorage (instant, no backend needed)
      const saved = localStorage.getItem('socialCredentials');
      if (saved) {
        setCredentials(JSON.parse(saved));
      }

      // Then try to load from backend (if available)
      const response = await serverFetch('/social-credentials');

      if (response.ok) {
        const data = await response.json();
        if (data.credentials && Object.keys(data.credentials).length > 0) {
          setCredentials(data.credentials);
          // Sync to localStorage
          localStorage.setItem('socialCredentials', JSON.stringify(data.credentials));
        }
      } else {
        // Backend error, but we already loaded from localStorage
        console.log('Backend unavailable, using local credentials');
        setBackendAvailable(false);
      }
    } catch (error) {
      // Network error or backend down - fall back to localStorage
      console.log('Backend not available, using localStorage fallback');
      const saved = localStorage.getItem('socialCredentials');
      if (saved) {
        setCredentials(JSON.parse(saved));
      }
      setBackendAvailable(false);
    }
  };

  const saveCredentials = async () => {
    setIsSaving(true);
    setSaveStatus('idle');

    try {
      // Save to Supabase backend
      const response = await serverFetch('/social-credentials', {
        method: 'POST',
        body: JSON.stringify({ credentials }),
      });

      if (response.ok) {
        setSaveStatus('success');
        // Also save to localStorage as backup
        localStorage.setItem('socialCredentials', JSON.stringify(credentials));

        setTimeout(() => {
          setSaveStatus('idle');
        }, 3000);
      } else {
        throw new Error('Failed to save credentials');
      }
    } catch (error) {
      console.error('Error saving credentials:', error);
      // Fallback to localStorage only
      localStorage.setItem('socialCredentials', JSON.stringify(credentials));
      setSaveStatus('error');

      setTimeout(() => {
        setSaveStatus('idle');
      }, 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const testConnection = async (platform: string) => {
    setTestingConnection(true);
    setTestResult(null);

    try {
      const response = await serverFetch('/test-social-connection', {
        method: 'POST',
        body: JSON.stringify({
          platform,
          credentials: credentials[platform as keyof AccountCredentials]
        }),
      });

      const data = await response.json();

      if (data.success) {
        setTestResult({
          type: 'success',
          msg: data.message || `${platform} connection successful!`,
          details: { user: data.user, page: data.page, tokenInfo: data.tokenInfo },
        });
      } else {
        setTestResult({
          type: 'error',
          msg: data.error || `${platform} connection failed. Check your credentials.`,
          details: { expired: data.expired, errorCode: data.errorCode },
        });
      }
    } catch (error: any) {
      setTestResult({
        type: 'error',
        msg: `Network error testing connection: ${error.message}`,
      });
    } finally {
      setTestingConnection(false);
    }
  };

  // ── Auto-Post Code Snippet Generator ─────────────────────────────────────────
  const buildFacebookSnippet = (lang: 'nodejs' | 'python' | 'curl') => {
    const pageId = credentials.facebook?.pageId || 'YOUR_PAGE_ID';
    const pageToken = credentials.facebook?.accessToken || 'YOUR_PAGE_ACCESS_TOKEN';
    const isComplete = !!(credentials.facebook?.pageId && credentials.facebook?.accessToken);

    if (lang === 'nodejs') {
      return `const axios = require('axios');

// ${isComplete ? '✅ Auto-filled from your Social Accounts settings' : '⚠️  Fill in Page ID + Access Token to auto-populate'}
const PAGE_ID = '${pageId}';
const PAGE_ACCESS_TOKEN = '${pageToken}';

// Example generated blog post
const blogPost = {
  title: "Your AI-Generated Blog Post Title",
  url: "https://yourblog.com/post-slug",
  excerpt: "Compelling excerpt from your AI-generated content."
};

// Build the Facebook post message
const message = \`New Blog Post: \${blogPost.title}\\n\\n\${blogPost.excerpt}\\n\\nRead more: \${blogPost.url}\`;

// Post to Facebook Page
async function postToFacebook() {
  try {
    const response = await axios.post(
      \`https://graph.facebook.com/\${PAGE_ID}/feed\`,
      null,
      {
        params: {
          message: message,
          access_token: PAGE_ACCESS_TOKEN
        }
      }
    );
    console.log('✅ Post successful! Post ID:', response.data.id);
  } catch (error) {
    console.error('❌ Error posting:', error.response?.data || error.message);
  }
}

postToFacebook();`;
    }

    if (lang === 'python') {
      return `import requests

# ${isComplete ? '✅ Auto-filled from your Social Accounts settings' : '⚠️  Fill in Page ID + Access Token to auto-populate'}
PAGE_ID = '${pageId}'
PAGE_ACCESS_TOKEN = '${pageToken}'

# Example generated blog post
blog_post = {
    'title': 'Your AI-Generated Blog Post Title',
    'url': 'https://yourblog.com/post-slug',
    'excerpt': 'Compelling excerpt from your AI-generated content.'
}

message = f"New Blog Post: {blog_post['title']}\\n\\n{blog_post['excerpt']}\\n\\nRead more: {blog_post['url']}"

def post_to_facebook():
    url = f'https://graph.facebook.com/{PAGE_ID}/feed'
    params = {
        'message': message,
        'access_token': PAGE_ACCESS_TOKEN
    }
    response = requests.post(url, params=params)
    data = response.json()
    if 'id' in data:
        print(f'✅ Post successful! Post ID: {data["id"]}')
    else:
        print(f'❌ Error: {data}')

post_to_facebook()`;
    }

    // curl
    return `# ${isComplete ? '✅ Auto-filled from your Social Accounts settings' : '⚠️  Fill in Page ID + Access Token to auto-populate'}

PAGE_ID="${pageId}"
PAGE_ACCESS_TOKEN="${pageToken}"

MESSAGE="New Blog Post: Your AI-Generated Title

Compelling excerpt from your AI-generated content.

Read more: https://yourblog.com/post-slug"

curl -X POST \\
  "https://graph.facebook.com/\${PAGE_ID}/feed" \\
  -d "message=\${MESSAGE}" \\
  -d "access_token=\${PAGE_ACCESS_TOKEN}"`;
  };

  const handleCopySnippet = () => {
    const code = buildFacebookSnippet(snippetLang);
    copyToClipboard(code);
    setSnippetCopied(true);
    setTimeout(() => setSnippetCopied(false), 2500);
  };

  const handleDownloadSnippet = () => {
    const code = buildFacebookSnippet(snippetLang);
    const ext = snippetLang === 'nodejs' ? 'js' : snippetLang === 'python' ? 'py' : 'sh';
    const blob = new Blob([code], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `facebook-auto-post.${ext}`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const updateField = (platform: keyof AccountCredentials, field: string, value: string) => {
    setCredentials({
      ...credentials,
      [platform]: {
        ...credentials[platform],
        [field]: value
      }
    });
  };

  // ── Facebook: exchange short-lived token for long-lived / permanent page token ──
  const handleFacebookTokenExchange = async () => {
    const fb = credentials.facebook || {} as any;
    if (!fb.accessToken) {
      setExchangeStatus({ type: 'error', msg: 'Paste a short-lived Page Access Token first, then click this button.' });
      return;
    }
    if (!fb.appId || !fb.appSecret) {
      setExchangeStatus({ type: 'error', msg: 'App ID and App Secret are required. Find them at developers.facebook.com → Your App → Settings → Basic.' });
      return;
    }
    setExchangingToken(true);
    setExchangeStatus(null);
    try {
      const res = await serverFetch('/facebook-token-exchange', {
        method: 'POST',
        body: JSON.stringify({
          shortLivedToken: fb.accessToken,
          appId: fb.appId,
          appSecret: fb.appSecret,
          pageId: fb.pageId || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        const isExpired = data.expired === true || /expir|session has expired/i.test(data.error || '');
        if (isExpired) {
          // Clear the expired token so the user knows they need a fresh one
          const clearedCreds = {
            ...credentials,
            facebook: { ...credentials.facebook!, accessToken: '' }
          };
          setCredentials(clearedCreds);
          localStorage.setItem('socialCredentials', JSON.stringify(clearedCreds));
          setShowOAuthHint(true);
        }
        setExchangeStatus({ type: 'error', msg: data.error || 'Token exchange failed.', expired: isExpired });
        return;
      }
      const newToken: string = data.pageAccessToken || data.longLivedUserToken;
      const updatedCreds = { ...credentials, facebook: { ...credentials.facebook!, accessToken: newToken } };
      setCredentials(updatedCreds);
      localStorage.setItem('socialCredentials', JSON.stringify(updatedCreds));
      setExchangeStatus({ type: 'success', msg: data.message });
    } catch (err: any) {
      setExchangeStatus({ type: 'error', msg: `Network error: ${err.message}` });
    } finally {
      setExchangingToken(false);
    }
  };

  if (!isopen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 flex items-center justify-between text-white">
            <div>
              <h2 className="text-2xl font-bold">Social Media Account Settings</h2>
              <p className="text-sm opacity-90">Connect your accounts for automated posting</p>
              {!backendAvailable && (
                <div className="mt-2 inline-flex items-center gap-2 bg-orange-500/20 px-3 py-1 rounded-full text-xs">
                  <AlertCircle className="w-3 h-3" />
                  <span>Using local storage (backend not deployed)</span>
                </div>
              )}
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 bg-gray-50 overflow-x-auto">
            {[
              { id: 'facebook', icon: '📘', label: 'Facebook' },
              { id: 'instagram', icon: '📷', label: 'Instagram' },
              { id: 'tiktok', icon: '🎵', label: 'TikTok' },
              { id: 'twitter', icon: '🐦', label: 'Twitter/X' },
              { id: 'linkedin', icon: '💼', label: 'LinkedIn' },
              { id: 'youtube', icon: '📺', label: 'YouTube' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id as any); setTestResult(null); }}
                className={`flex items-center gap-2 px-6 py-4 font-semibold transition-all whitespace-nowrap ${activeTab === tab.id
                  ? 'bg-white border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-100'
                  }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Facebook */}
            {activeTab === 'facebook' && (
              <div className="space-y-4">
                {/* Permission error alert */}
                <div className="bg-red-50 border border-red-300 rounded-lg p-4">
                  <h4 className="font-bold text-red-900 mb-1 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" /> Required Permissions (common cause of failures)
                  </h4>
                  <p className="text-sm text-red-800 mb-2">
                    Your Page Access Token <strong>must</strong> have these two permissions or Facebook will reject every post:
                  </p>
                  <ul className="text-sm text-red-800 space-y-0.5 list-disc list-inside font-mono">
                    <li>pages_manage_posts</li>
                    <li>pages_read_engagement</li>
                  </ul>
                </div>

                {/* Step-by-step instructions */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-3">📘 Step-by-step: Get a Page Access Token with the right permissions</h4>
                  <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
                    <li>
                      Go to{' '}
                      <a href="https://developers.facebook.com/tools/explorer" target="_blank" rel="noopener noreferrer" className="underline font-semibold">
                        developers.facebook.com/tools/explorer
                      </a>
                    </li>
                    <li>In the top-right dropdown, select your <strong>App</strong> (create one at developers.facebook.com if you haven't yet)</li>
                    <li>Click the <strong>"User or Page"</strong> dropdown → choose <strong>"Get Page Access Token"</strong> and select your page</li>
                    <li>
                      Click <strong>"Add a Permission"</strong> and add <strong>both</strong>:
                      <ul className="list-disc list-inside ml-4 mt-1 font-mono text-xs">
                        <li>pages_manage_posts</li>
                        <li>pages_read_engagement</li>
                      </ul>
                    </li>
                    <li>Click <strong>"Generate Access Token"</strong> → approve in the popup</li>
                    <li>Copy the token and paste it into <strong>"Page Access Token"</strong> below</li>
                    <li>
                      Find your <strong>Page ID</strong>: go to your Facebook Page → <em>About</em> → scroll down to "Page ID"
                    </li>
                  </ol>
                  <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
                    ⚠️ The token from Graph API Explorer expires in ~1 hour. To get a long-lived token, exchange it via:<br />
                    <code className="font-mono break-all">
                      https://graph.facebook.com/oauth/access_token?grant_type=fb_exchange_token&client_id=APP_ID&client_secret=APP_SECRET&fb_exchange_token=SHORT_TOKEN
                    </code>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-semibold">Page ID <span className="text-red-500">*</span></label>
                    <button
                      onClick={handleDiscoverPages}
                      disabled={discoveringPages || !credentials.facebook?.accessToken}
                      title={!credentials.facebook?.accessToken ? 'Paste a Page Access Token first' : 'List pages accessible by your token'}
                      className="flex items-center gap-1.5 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors disabled:opacity-40 text-xs font-bold"
                    >
                      {discoveringPages
                        ? <><RefreshCw className="w-3 h-3 animate-spin" /> Discovering…</>
                        : <><RefreshCw className="w-3 h-3" /> Discover My Pages</>
                      }
                    </button>
                  </div>
                  <input
                    type="text"
                    value={credentials.facebook?.pageId || ''}
                    onChange={e => {
                      updateField('facebook', 'pageId', e.target.value);
                      setDiscoveredPages(null);
                      setDiscoverError(null);
                    }}
                    placeholder="e.g. 123456789012345"
                    className={`w-full px-4 py-2 border-2 rounded-lg focus:outline-none font-mono text-sm ${credentials.facebook?.appId && credentials.facebook?.pageId === credentials.facebook?.appId
                      ? 'border-red-400 bg-red-50'
                      : 'border-gray-200 focus:border-blue-500'
                      }`}
                  />
                  {/* Warn if Page ID matches App ID — common mistake */}
                  {credentials.facebook?.appId && credentials.facebook?.pageId === credentials.facebook?.appId && (
                    <div className="mt-1 flex items-start gap-1.5 text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                      <p className="text-xs font-semibold">
                        ⚠️ This looks like your <strong>App ID</strong>, not your Page ID. These are different numbers.
                        Your Page ID is on your Facebook Page → About → "Page ID".
                        Click <strong>"Discover My Pages"</strong> to auto-find it.
                      </p>
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-1">Facebook Page → About → scroll to "Page ID" — <em>not</em> your App ID</p>

                  {/* Discovered pages list */}
                  {discoverError && (
                    <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800">
                      <strong>Discovery failed:</strong> {discoverError}
                    </div>
                  )}
                  {discoveredPages !== null && discoveredPages.length === 0 && (
                    <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                      No pages found for this token. Make sure your token has the <strong>pages_show_list</strong> permission.
                    </div>
                  )}
                  {discoveredPages && discoveredPages.length > 0 && (
                    <div className="mt-2 space-y-1.5">
                      <p className="text-xs font-bold text-indigo-800">Found {discoveredPages.length} page(s) — click to auto-fill:</p>
                      {discoveredPages.map(page => (
                        <button
                          key={page.id}
                          onClick={() => {
                            updateField('facebook', 'pageId', page.id);
                            setDiscoveredPages(null);
                          }}
                          className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors text-left"
                        >
                          <div>
                            <p className="text-xs font-bold text-indigo-900">{page.name}</p>
                            <p className="text-xs text-indigo-600 font-mono">ID: {page.id}{page.category ? ` · ${page.category}` : ''}</p>
                          </div>
                          <span className="text-xs text-indigo-500 font-semibold whitespace-nowrap">Use this →</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* ── Paste Authorization Code (OAuth relay fallback) ── */}
                <div className="border-2 border-amber-200 bg-amber-50 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Code2 className="w-4 h-4 text-amber-700" />
                    <h4 className="font-bold text-amber-900 text-sm">Paste Authorization Code</h4>
                    <span className="text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full font-medium">OAuth Fallback</span>
                  </div>
                  <p className="text-xs text-amber-800">
                    If the OAuth popup showed <strong>"Connected!"</strong> but the app didn't detect it automatically,
                    the popup has a <strong>"Copy Code"</strong> button after 6 seconds. Paste that code here to complete the connection.
                    You can also paste the <strong>full callback URL</strong> from the popup's address bar.
                  </p>
                  <div className="space-y-2">
                    <div>
                      <label className="block text-xs font-semibold text-amber-900 mb-1">Authorization Code or Callback URL</label>
                      <input
                        type="text"
                        value={manualCode}
                        onChange={e => {
                          const val = e.target.value;
                          setManualCode(val);
                          // Auto-extract code and redirect_uri from pasted callback URL
                          if (val.includes('?code=') || val.includes('&code=')) {
                            try {
                              const url = new URL(val);
                              const code = url.searchParams.get('code');
                              if (code) {
                                setManualCode(code);
                                // Also extract the redirect_uri (origin + pathname)
                                setManualRedirectUri(`${url.origin}${url.pathname}`);
                              }
                            } catch (_) { /* not a URL, treat as raw code */ }
                          }
                        }}
                        placeholder="Paste code (AQ...) or full URL (https://...?code=AQ...)"
                        className="w-full px-3 py-2 border-2 border-amber-200 rounded-lg focus:border-amber-500 focus:outline-none font-mono text-xs bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-amber-900 mb-1">
                        Redirect URI <span className="font-normal text-amber-600">(must match the one used during OAuth — auto-detected from URL)</span>
                      </label>
                      <input
                        type="text"
                        value={manualRedirectUri}
                        onChange={e => setManualRedirectUri(e.target.value)}
                        placeholder="https://...figma.site/oauth-callback.html"
                        className="w-full px-3 py-2 border-2 border-amber-200 rounded-lg focus:border-amber-500 focus:outline-none font-mono text-xs bg-white"
                      />
                    </div>
                    <button
                      onClick={handleManualCodeExchange}
                      disabled={exchangingManualCode || !manualCode.trim()}
                      className="flex items-center gap-1.5 px-5 py-2.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50 text-sm font-bold"
                    >
                      {exchangingManualCode
                        ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Exchanging Code...</>
                        : <><LinkIcon className="w-3.5 h-3.5" /> Exchange Code for Token</>
                      }
                    </button>
                  </div>
                  {manualCodeStatus && (
                    <div className={`rounded-lg border p-3 text-xs ${manualCodeStatus.type === 'success'
                      ? 'bg-green-50 border-green-300 text-green-800'
                      : 'bg-red-50 border-red-300 text-red-800'
                      }`}>
                      <div className="flex items-start gap-2">
                        {manualCodeStatus.type === 'success'
                          ? <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                          : <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                        }
                        <span>{manualCodeStatus.msg}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* ── Manual Token Entry & Test Connection ── */}
                <div className="border-2 border-purple-200 bg-purple-50 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Key className="w-4 h-4 text-purple-700" />
                    <h4 className="font-bold text-purple-900 text-sm">Manual Token Entry & Test Connection</h4>
                  </div>
                  <p className="text-xs text-purple-800">
                    Enter your Facebook Access Token directly (from Graph API Explorer or any other source), along with your App ID & App Secret. Then click <strong>Test Connection</strong> to verify everything works.
                  </p>
                  <div className="bg-white border border-purple-200 rounded-lg p-3 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-purple-900 mb-1">
                          App ID <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={credentials.facebook?.appId || ''}
                          onChange={e => updateField('facebook', 'appId', e.target.value)}
                          placeholder="e.g. 2152774515473901"
                          className="w-full px-3 py-2 border-2 border-purple-200 rounded-lg focus:border-purple-500 focus:outline-none font-mono text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-purple-900 mb-1">
                          App Secret <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="password"
                          value={credentials.facebook?.appSecret || ''}
                          onChange={e => updateField('facebook', 'appSecret', e.target.value)}
                          placeholder="Your App Secret"
                          className="w-full px-3 py-2 border-2 border-purple-200 rounded-lg focus:border-purple-500 focus:outline-none font-mono text-xs"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-purple-900 mb-1">
                        Access Token <span className="text-red-500">*</span>
                        <span className="ml-2 text-xs font-normal text-purple-600">(User or Page token)</span>
                      </label>
                      <input
                        type="password"
                        value={credentials.facebook?.accessToken || ''}
                        onChange={e => updateField('facebook', 'accessToken', e.target.value)}
                        placeholder="Paste your Facebook Access Token here"
                        className="w-full px-3 py-2 border-2 border-purple-200 rounded-lg focus:border-purple-500 focus:outline-none font-mono text-xs"
                      />
                      <p className="text-xs text-purple-600 mt-0.5">From Graph API Explorer, Graph API output, or any valid Facebook token</p>
                    </div>
                  </div>

                  <div className="flex gap-3 items-center flex-wrap">
                    <button
                      onClick={() => { setTestResult(null); testConnection('facebook'); }}
                      disabled={testingConnection || !credentials.facebook?.accessToken}
                      className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 text-sm font-bold shadow-sm"
                    >
                      {testingConnection
                        ? <><RefreshCw className="w-4 h-4 animate-spin" /> Testing…</>
                        : <><LinkIcon className="w-4 h-4" /> Test Connection</>
                      }
                    </button>
                    <a
                      href="https://developers.facebook.com/tools/explorer"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Open Graph API Explorer
                    </a>
                  </div>

                  {/* Test Result Display */}
                  {testResult && (
                    <div className={`rounded-lg border-2 p-4 space-y-2 ${testResult.type === 'success'
                      ? 'bg-green-50 border-green-300'
                      : 'bg-red-50 border-red-300'
                      }`}>
                      <div className="flex items-start gap-2">
                        {testResult.type === 'success'
                          ? <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                          : <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        }
                        <div className="flex-1">
                          <p className={`font-bold text-sm ${testResult.type === 'success' ? 'text-green-900' : 'text-red-900'}`}>
                            {testResult.type === 'success' ? '✅ Connection Successful!' : '❌ Connection Failed'}
                          </p>
                          <p className={`text-xs mt-1 ${testResult.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
                            {testResult.msg}
                          </p>
                        </div>
                      </div>

                      {/* Detailed results for success */}
                      {testResult.type === 'success' && testResult.details && (
                        <div className="space-y-2 mt-2">
                          {testResult.details.user && (
                            <div className="bg-white rounded-lg p-3 border border-green-200">
                              <p className="text-xs font-bold text-green-900 mb-1">User Info</p>
                              <div className="grid grid-cols-2 gap-2 text-xs text-green-800">
                                <span>Name: <strong>{testResult.details.user.name}</strong></span>
                                <span>ID: <code className="font-mono bg-green-100 px-1 rounded">{testResult.details.user.id}</code></span>
                              </div>
                            </div>
                          )}
                          {testResult.details.page && (
                            <div className="bg-white rounded-lg p-3 border border-green-200">
                              <p className="text-xs font-bold text-green-900 mb-1">Page Info</p>
                              <div className="grid grid-cols-2 gap-2 text-xs text-green-800">
                                <span>Name: <strong>{testResult.details.page.name}</strong></span>
                                <span>ID: <code className="font-mono bg-green-100 px-1 rounded">{testResult.details.page.id}</code></span>
                                {testResult.details.page.category && <span>Category: {testResult.details.page.category}</span>}
                                {testResult.details.page.fans != null && <span>Fans: {testResult.details.page.fans?.toLocaleString()}</span>}
                              </div>
                            </div>
                          )}
                          {testResult.details.tokenInfo && (
                            <div className="bg-white rounded-lg p-3 border border-green-200">
                              <p className="text-xs font-bold text-green-900 mb-1">Token Info</p>
                              <div className="grid grid-cols-2 gap-2 text-xs text-green-800">
                                <span>Type: <strong>{testResult.details.tokenInfo.type}</strong></span>
                                <span>Valid: {testResult.details.tokenInfo.isValid ? '✅ Yes' : '❌ No'}</span>
                                {testResult.details.tokenInfo.expiresAt > 0 && (
                                  <span>Expires: {new Date(testResult.details.tokenInfo.expiresAt * 1000).toLocaleDateString()}</span>
                                )}
                                {testResult.details.tokenInfo.expiresAt === 0 && (
                                  <span className="text-green-700 font-bold">Never Expires ♾️</span>
                                )}
                              </div>
                              {testResult.details.tokenInfo.scopes?.length > 0 && (
                                <div className="mt-2">
                                  <p className="text-xs font-semibold text-green-900 mb-1">Permissions:</p>
                                  <div className="flex flex-wrap gap-1">
                                    {testResult.details.tokenInfo.scopes.map((s: string) => (
                                      <span key={s} className="inline-flex items-center px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-xs font-mono">
                                        {s === 'pages_manage_posts' || s === 'pages_read_engagement'
                                          ? <><CheckCircle className="w-3 h-3 mr-1 text-green-600" />{s}</>
                                          : s
                                        }
                                      </span>
                                    ))}
                                  </div>
                                  {/* Check for missing required permissions */}
                                  {!testResult.details.tokenInfo.scopes.includes('pages_manage_posts') && (
                                    <p className="text-xs text-red-700 font-bold mt-1">⚠️ Missing: pages_manage_posts</p>
                                  )}
                                  {!testResult.details.tokenInfo.scopes.includes('pages_read_engagement') && (
                                    <p className="text-xs text-red-700 font-bold mt-1">⚠️ Missing: pages_read_engagement</p>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Expired token guidance */}
                      {testResult.type === 'error' && testResult.details?.expired && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-2">
                          <p className="text-xs font-bold text-amber-900">Token Expired — Get a fresh one:</p>
                          <ol className="text-xs text-amber-800 list-decimal list-inside mt-1 space-y-1">
                            <li>Open <a href="https://developers.facebook.com/tools/explorer" target="_blank" rel="noopener noreferrer" className="underline font-semibold">Graph API Explorer</a></li>
                            <li>Click "Generate Access Token" → select your page → approve</li>
                            <li>Paste the new token above and click Test Connection again</li>
                          </ol>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* ── Get Long-Lived / Permanent Page Token ── */}
                <div className="border-2 border-green-200 bg-green-50 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2 mb-1">
                    <RefreshCw className="w-4 h-4 text-green-700" />
                    <h4 className="font-bold text-green-900 text-sm">Get 60-Day Token (Never Expire Again)</h4>
                  </div>
                  <p className="text-xs text-green-800">
                    Tokens from Graph API Explorer expire in 1 hour. Enter your App ID + App Secret below and click the button to auto-exchange your short-lived token for a <strong>60-day token</strong> (or a <strong>permanent Page token</strong> if Page ID is filled in).
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-green-900 mb-1">
                        App ID <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={credentials.facebook?.appId || ''}
                        onChange={e => updateField('facebook', 'appId', e.target.value)}
                        placeholder="Your Facebook App ID"
                        className="w-full px-3 py-2 border-2 border-green-200 rounded-lg focus:border-green-500 focus:outline-none font-mono text-xs bg-white"
                      />
                      <p className="text-xs text-green-700 mt-0.5">developers.facebook.com → App → Settings → Basic</p>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-green-900 mb-1">
                        App Secret <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="password"
                        value={credentials.facebook?.appSecret || ''}
                        onChange={e => updateField('facebook', 'appSecret', e.target.value)}
                        placeholder="Your Facebook App Secret"
                        className="w-full px-3 py-2 border-2 border-green-200 rounded-lg focus:border-green-500 focus:outline-none font-mono text-xs bg-white"
                      />
                      <p className="text-xs text-green-700 mt-0.5">Never share this publicly</p>
                    </div>
                  </div>
                  <button
                    onClick={handleFacebookTokenExchange}
                    disabled={exchangingToken}
                    className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 text-sm font-bold shadow-sm"
                  >
                    {exchangingToken
                      ? <><RefreshCw className="w-4 h-4 animate-spin" /> Exchanging…</>
                      : <><Key className="w-4 h-4" /> Get Long-Lived Token</>
                    }
                  </button>
                  {exchangeStatus && (
                    <div className={`px-4 py-3 rounded-lg text-sm font-medium ${exchangeStatus.type === 'success'
                      ? 'bg-green-100 border border-green-300 text-green-900'
                      : 'bg-red-50 border border-red-300 text-red-800'
                      }`}>
                      {/* Expired-token specific UI */}
                      {exchangeStatus.type === 'error' && (exchangeStatus.expired || /expir|session has expired/i.test(exchangeStatus.msg)) ? (
                        <div className="space-y-3">
                          <div className="flex items-start gap-2">
                            <Clock className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="font-bold text-red-900">⏰ Token Expired — The expired token has been cleared</p>
                              <p className="text-xs text-red-700 mt-1">Facebook short-lived tokens from Graph API Explorer last only ~1 hour. You must generate a <strong>new</strong> one and exchange it immediately.</p>
                            </div>
                          </div>
                          <div className="bg-white border border-red-200 rounded-lg p-3 space-y-2">
                            <p className="text-xs font-bold text-red-900">Option A — Generate a fresh token now:</p>
                            <ol className="text-xs text-red-800 space-y-1.5 list-decimal list-inside">
                              <li>Open <a href="https://developers.facebook.com/tools/explorer" target="_blank" rel="noopener noreferrer" className="underline font-semibold inline-flex items-center gap-0.5">Graph API Explorer <ExternalLink className="w-3 h-3" /></a></li>
                              <li>Click <strong>"Generate Access Token"</strong> → select your page → approve</li>
                              <li>Paste the token above and immediately click <strong>"Get Long-Lived Token"</strong></li>
                            </ol>
                          </div>
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <p className="text-xs font-bold text-blue-900 mb-1.5">Option B — Use OAuth (recommended, no 1-hour race):</p>
                            <button
                              onClick={() => {
                                setExchangeStatus(null);
                                setShowOAuthHint(false);
                                // Scroll to OAuth section
                                document.getElementById('fb-oauth-section')?.scrollIntoView({ behavior: 'smooth' });
                              }}
                              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs font-bold"
                            >
                              <RefreshCw className="w-3.5 h-3.5" /> Jump to OAuth Connection ↓
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {exchangeStatus.msg}
                          {exchangeStatus.type === 'success' && (
                            <p className="text-xs mt-1 font-normal opacity-80">Token auto-saved. Click "Save Credentials" to persist it.</p>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* ── OAuth Callback Diagnostic Panel ── */}
                <OAuthCallbackDiagnostic platform="facebook" />

                {/* ── OAuth Flow ── */}
                <div id="fb-oauth-section" className="border-2 border-blue-200 bg-blue-50 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2 mb-1">
                    <RefreshCw className="w-4 h-4 text-blue-700" />
                    <h4 className="font-bold text-blue-900 text-sm">Connect via OAuth (Recommended)</h4>
                  </div>

                  {/* ── One-time Facebook Dashboard Setup ── */}
                  <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-3 space-y-2">
                    <p className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                      ⚠️ One-time setup required in Facebook App Dashboard
                    </p>
                    <p className="text-xs text-amber-800">
                      Before OAuth will work, register this callback URL in your Facebook app. The <code className="bg-amber-100 px-0.5 rounded font-mono">?apikey=</code> suffix is intentional — it tells Supabase to accept the unauthenticated browser redirect from Facebook. Do this once; it never changes:
                    </p>
                    <div className="bg-white border border-amber-300 rounded-lg p-2">
                      <p className="text-xs font-semibold text-amber-700 mb-1">Step 1 — Add to Valid OAuth Redirect URIs:</p>
                      <p className="text-xs text-amber-600 mb-1.5">
                        ⚠️ Copy the <strong>full URL including <code>?apikey=</code></strong> — Supabase needs this to accept unauthenticated browser redirects from Facebook.
                      </p>
                      <div className="flex items-start gap-2">
                        <code className="flex-1 text-xs font-mono text-gray-800 bg-gray-100 px-2 py-1.5 rounded break-all select-all leading-relaxed">
                          {resolveCallbackUrl('/facebook-oauth-callback', { apikey: publicAnonKey })}
                        </code>
                        <button
                          onClick={() => copyToClipboard(resolveCallbackUrl('/facebook-oauth-callback', { apikey: publicAnonKey }))}
                          className="shrink-0 px-2 py-1 bg-amber-100 text-amber-800 rounded text-xs font-bold hover:bg-amber-200 transition-colors mt-0.5"
                        >Copy</button>
                      </div>
                    </div>
                    <div className="bg-white border border-amber-300 rounded-lg p-2">
                      <p className="text-xs font-semibold text-amber-700 mb-1">Step 2 — Add to App Domains:</p>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 text-xs font-mono text-gray-800 bg-gray-100 px-2 py-1 rounded select-all">
                          supabase.co
                        </code>
                        <button
                          onClick={() => copyToClipboard('supabase.co')}
                          className="shrink-0 px-2 py-1 bg-amber-100 text-amber-800 rounded text-xs font-bold hover:bg-amber-200 transition-colors"
                        >Copy</button>
                      </div>
                    </div>
                    <p className="text-xs text-amber-700">
                      <strong>Where to find these settings:</strong>{' '}
                      <a href="https://developers.facebook.com/apps" target="_blank" rel="noopener noreferrer" className="underline font-semibold">developers.facebook.com/apps</a>
                      {' → Your App → Facebook Login → Settings → Valid OAuth Redirect URIs'}
                    </p>
                  </div>

                  <p className="text-xs text-blue-800">
                    Once registered above, enter your App ID + App Secret and click Connect. The token is exchanged on the server — no short-lived token race.
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-blue-900 mb-1">
                        App ID <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={credentials.facebook?.appId || ''}
                        onChange={e => updateField('facebook', 'appId', e.target.value)}
                        placeholder="Your Facebook App ID"
                        className="w-full px-3 py-2 border-2 border-blue-200 rounded-lg focus:border-blue-500 focus:outline-none font-mono text-xs bg-white"
                      />
                      <p className="text-xs text-blue-700 mt-0.5">developers.facebook.com → App → Settings → Basic</p>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-blue-900 mb-1">
                        App Secret <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="password"
                        value={credentials.facebook?.appSecret || ''}
                        onChange={e => updateField('facebook', 'appSecret', e.target.value)}
                        placeholder="Your Facebook App Secret"
                        className="w-full px-3 py-2 border-2 border-blue-200 rounded-lg focus:border-blue-500 focus:outline-none font-mono text-xs bg-white"
                      />
                      <p className="text-xs text-blue-700 mt-0.5">Never share this publicly</p>
                    </div>
                  </div>
                  <button
                    onClick={handleFacebookOAuth}
                    disabled={exchangingOauth}
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm font-bold shadow-sm"
                  >
                    {exchangingOauth
                      ? <><RefreshCw className="w-4 h-4 animate-spin" /> Saving &amp; Redirecting…</>
                      : <><Key className="w-4 h-4" /> Connect via OAuth</>
                    }
                  </button>

                  {/* ── Popup-blocker-proof link — shown instead of window.open() ── */}
                  {pendingOauthUrl && (
                    <div className="rounded-xl border-2 border-green-400 bg-green-700 p-4 space-y-2 text-white shadow-lg">
                      <p className="text-sm font-bold flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 shrink-0" />
                        Credentials saved! Click to open Facebook Login:
                      </p>
                      <a
                        href={pendingOauthUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setTimeout(() => setPendingOauthUrl(null), 1500)}
                        className="flex items-center justify-center gap-2 w-full px-5 py-3 bg-white text-green-800 rounded-lg hover:bg-green-50 transition-colors text-sm font-extrabold shadow-sm"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Open Facebook Login in New Tab →
                      </a>
                      <div className="text-xs text-green-200 space-y-1">
                        <p>✅ After approving on Facebook, it redirects to the Supabase server, which exchanges the code and saves your token automatically.</p>
                        <p>✅ The server then sends you back to this app with the connection complete.</p>
                        <p className="text-yellow-200 font-semibold">⚠️ Make sure you completed the one-time setup above first, or Facebook will show a domain error.</p>
                      </div>
                    </div>
                  )}

                  {oauthStatus && (
                    <div className={`px-4 py-3 rounded-lg text-sm font-medium ${oauthStatus.type === 'success'
                      ? 'bg-green-100 border border-green-300 text-green-900'
                      : 'bg-red-50 border border-red-300 text-red-800'
                      }`}>
                      {oauthStatus.msg}
                      {oauthStatus.type === 'success' && (
                        <p className="text-xs mt-1 font-normal opacity-80">Token auto-saved. Click "Save Credentials" to persist it.</p>
                      )}
                    </div>
                  )}
                </div>

                {/* ── Auto-Post Code Snippet ── */}
                {(() => {
                  const fb = credentials.facebook || {} as any;
                  const hasPageId = !!fb.pageId;
                  const hasToken = !!fb.accessToken;
                  const isComplete = hasPageId && hasToken;
                  const hasAny = hasPageId || hasToken || !!fb.appId;
                  if (!hasAny) return null;
                  const snippet = buildFacebookSnippet(snippetLang);

                  return (
                    <div className="border-2 border-indigo-200 bg-indigo-50 rounded-xl overflow-hidden">
                      {/* Panel header — always visible, click to collapse */}
                      <button
                        onClick={() => setSnippetExpanded(o => !o)}
                        className="w-full flex items-center justify-between px-4 py-3 bg-indigo-700 text-white hover:bg-indigo-800 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Terminal className="w-4 h-4" />
                          <span className="font-bold text-sm">Auto-Post Script</span>
                          {isComplete
                            ? <span className="ml-1 bg-green-400 text-green-900 text-xs font-bold px-2 py-0.5 rounded-full">✅ Ready — credentials filled in</span>
                            : <span className="ml-1 bg-yellow-300 text-yellow-900 text-xs font-bold px-2 py-0.5 rounded-full">⚠️ Fill in Page ID + Token to complete</span>
                          }
                        </div>
                        {snippetExpanded
                          ? <ChevronDown className="w-4 h-4 opacity-70" />
                          : <ChevronRight className="w-4 h-4 opacity-70" />
                        }
                      </button>

                      {snippetExpanded && (
                        <div className="p-4 space-y-3">
                          <p className="text-xs text-indigo-800">
                            This script is <strong>auto-populated</strong> with your credentials as you type. Copy or download it to post to your Facebook Page programmatically.
                          </p>

                          {/* Field status pills */}
                          <div className="flex flex-wrap gap-2">
                            {[
                              { label: 'App ID', filled: !!fb.appId },
                              { label: 'App Secret', filled: !!fb.appSecret },
                              { label: 'Page ID', filled: !!fb.pageId },
                              { label: 'Access Token', filled: !!fb.accessToken },
                            ].map(f => (
                              <span
                                key={f.label}
                                className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${f.filled
                                  ? 'bg-green-100 border-green-300 text-green-800'
                                  : 'bg-gray-100 border-gray-300 text-gray-500'
                                  }`}
                              >
                                {f.filled ? '✅' : '○'} {f.label}
                              </span>
                            ))}
                          </div>

                          {/* Language switcher */}
                          <div className="flex items-center gap-1 bg-white border border-indigo-200 rounded-lg p-1 w-fit">
                            {(['nodejs', 'python', 'curl'] as const).map(lang => (
                              <button
                                key={lang}
                                onClick={() => setSnippetLang(lang)}
                                className={`px-3 py-1 rounded-md text-xs font-bold transition-colors ${snippetLang === lang
                                  ? 'bg-indigo-600 text-white'
                                  : 'text-indigo-600 hover:bg-indigo-50'
                                  }`}
                              >
                                {lang === 'nodejs' ? '⬡ Node.js' : lang === 'python' ? '🐍 Python' : '$ cURL'}
                              </button>
                            ))}
                          </div>

                          {/* Code block */}
                          <div className="relative">
                            <div className="bg-gray-950 rounded-xl overflow-hidden border border-gray-800">
                              {/* Fake terminal bar */}
                              <div className="flex items-center gap-1.5 px-3 py-2 bg-gray-900 border-b border-gray-800">
                                <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                                <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                                <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                                <span className="ml-2 text-xs text-gray-500 font-mono">
                                  {snippetLang === 'nodejs' ? 'facebook-auto-post.js' : snippetLang === 'python' ? 'facebook-auto-post.py' : 'facebook-auto-post.sh'}
                                </span>
                              </div>
                              <pre className="text-xs font-mono text-gray-100 p-4 overflow-x-auto leading-relaxed whitespace-pre max-h-72 overflow-y-auto">
                                {/* Syntax-colored regions via spans */}
                                {snippet.split('\n').map((line, i) => {
                                  // Highlight the auto-filled value lines
                                  const isFilledLine =
                                    (line.includes("PAGE_ID =") || line.includes("PAGE_ID='") || line.includes('PAGE_ID = ')) ||
                                    (line.includes("PAGE_ACCESS_TOKEN =") || line.includes("PAGE_ACCESS_TOKEN='") || line.includes('PAGE_ACCESS_TOKEN = '));
                                  const isComment = line.trim().startsWith('#') || line.trim().startsWith('//');
                                  const isReady = isComplete && isFilledLine;

                                  return (
                                    <span
                                      key={i}
                                      className={`block ${isReady ? 'text-green-300 font-bold' :
                                        isComment ? 'text-gray-500 italic' :
                                          isFilledLine ? 'text-yellow-300' :
                                            'text-gray-100'
                                        }`}
                                    >
                                      {line || '\u00a0'}
                                    </span>
                                  );
                                })}
                              </pre>
                            </div>

                            {/* Copy / Download buttons */}
                            <div className="flex gap-2 mt-2">
                              <button
                                onClick={handleCopySnippet}
                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${snippetCopied
                                  ? 'bg-green-600 text-white'
                                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                  }`}
                              >
                                {snippetCopied
                                  ? <><CheckCircle className="w-4 h-4" /> Copied!</>
                                  : <><Code2 className="w-4 h-4" /> Copy Code</>
                                }
                              </button>
                              <button
                                onClick={handleDownloadSnippet}
                                className="flex items-center gap-2 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm font-bold transition-colors"
                              >
                                <Download className="w-4 h-4" />
                                Download
                              </button>
                            </div>
                          </div>

                          {/* Usage note */}
                          {snippetLang === 'nodejs' && (
                            <div className="bg-white border border-indigo-200 rounded-lg p-3 text-xs text-indigo-800">
                              <p className="font-bold mb-1">📦 Install dependency first:</p>
                              <code className="bg-gray-100 px-2 py-1 rounded font-mono text-gray-800">npm install axios</code>
                              <p className="mt-2">Then run: <code className="bg-gray-100 px-1 rounded font-mono text-gray-800">node facebook-auto-post.js</code></p>
                            </div>
                          )}
                          {snippetLang === 'python' && (
                            <div className="bg-white border border-indigo-200 rounded-lg p-3 text-xs text-indigo-800">
                              <p className="font-bold mb-1">📦 Install dependency first:</p>
                              <code className="bg-gray-100 px-2 py-1 rounded font-mono text-gray-800">pip install requests</code>
                              <p className="mt-2">Then run: <code className="bg-gray-100 px-1 rounded font-mono text-gray-800">python facebook-auto-post.py</code></p>
                            </div>
                          )}
                          {snippetLang === 'curl' && (
                            <div className="bg-white border border-indigo-200 rounded-lg p-3 text-xs text-indigo-800">
                              <p className="font-bold mb-1">🖥️ Run in your terminal:</p>
                              <code className="bg-gray-100 px-2 py-1 rounded font-mono text-gray-800">chmod +x facebook-auto-post.sh && ./facebook-auto-post.sh</code>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Instagram */}
            {activeTab === 'instagram' && (
              <div className="space-y-4">
                <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
                  <h4 className="font-semibold text-pink-900 mb-2">📷 How to get Instagram credentials:</h4>
                  <ol className="text-sm text-pink-800 space-y-1 list-decimal list-inside">
                    <li>Convert your account to a Business or Creator account</li>
                    <li>Link it to a Facebook Page</li>
                    <li>Use Facebook Graph API to get Instagram Business Account ID</li>
                    <li>Generate an Access Token with instagram_basic and instagram_content_publish permissions</li>
                  </ol>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Instagram Business Account ID</label>
                  <input
                    type="text"
                    value={credentials.instagram?.accountId || ''}
                    onChange={e => updateField('instagram', 'accountId', e.target.value)}
                    placeholder="Your Instagram Business Account ID"
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Access Token</label>
                  <input
                    type="password"
                    value={credentials.instagram?.accessToken || ''}
                    onChange={e => updateField('instagram', 'accessToken', e.target.value)}
                    placeholder="Your Instagram Access Token"
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-pink-500 focus:outline-none"
                  />
                </div>

                <button
                  onClick={() => testConnection('instagram')}
                  disabled={testingConnection}
                  className="px-4 py-2 bg-pink-100 text-pink-700 rounded-lg hover:bg-pink-200 transition-colors disabled:opacity-50"
                >
                  {testingConnection ? 'Testing...' : 'Test Connection'}
                </button>
              </div>
            )}

            {/* TikTok */}
            {activeTab === 'tiktok' && (
              <div className="space-y-4">
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h4 className="font-semibold text-purple-900 mb-2">🎵 How to get TikTok credentials:</h4>
                  <ol className="text-sm text-purple-800 space-y-1 list-decimal list-inside">
                    <li>Go to <a href="https://developers.tiktok.com" target="_blank" className="underline">developers.tiktok.com</a></li>
                    <li>Create an app and register for Content Posting API</li>
                    <li>Get your Client Key and Client Secret</li>
                    <li>Complete OAuth flow to get Access Token</li>
                  </ol>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Username</label>
                  <input
                    type="text"
                    value={credentials.tiktok?.username || ''}
                    onChange={e => updateField('tiktok', 'username', e.target.value)}
                    placeholder="Your TikTok Username"
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Access Token</label>
                  <input
                    type="password"
                    value={credentials.tiktok?.accessToken || ''}
                    onChange={e => updateField('tiktok', 'accessToken', e.target.value)}
                    placeholder="Your TikTok Access Token"
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <button
                  onClick={() => testConnection('tiktok')}
                  disabled={testingConnection}
                  className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors disabled:opacity-50"
                >
                  {testingConnection ? 'Testing...' : 'Test Connection'}
                </button>
              </div>
            )}

            {/* Twitter/X */}
            {activeTab === 'twitter' && (
              <div className="space-y-4">
                <div className="bg-sky-50 border border-sky-200 rounded-lg p-4">
                  <h4 className="font-semibold text-sky-900 mb-2">🐦 How to get Twitter/X credentials:</h4>
                  <ol className="text-sm text-sky-800 space-y-1 list-decimal list-inside">
                    <li>Go to <a href="https://developer.twitter.com" target="_blank" rel="noopener noreferrer" className="underline">developer.twitter.com</a> and create an App</li>
                    <li>Under "Keys and Tokens", generate Consumer Keys (API Key + Secret)</li>
                    <li>Generate Access Token and Secret (with Read and Write permissions)</li>
                    <li>Paste all four values below</li>
                  </ol>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1">API Key <span className="text-red-500">*</span></label>
                    <input type="password" value={credentials.twitter?.apiKey || ''} onChange={e => updateField('twitter', 'apiKey', e.target.value)} placeholder="Your Twitter API Key" className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-sky-500 focus:outline-none font-mono text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1">API Secret <span className="text-red-500">*</span></label>
                    <input type="password" value={credentials.twitter?.apiSecret || ''} onChange={e => updateField('twitter', 'apiSecret', e.target.value)} placeholder="Your Twitter API Secret" className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-sky-500 focus:outline-none font-mono text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1">Access Token <span className="text-red-500">*</span></label>
                    <input type="password" value={credentials.twitter?.accessToken || ''} onChange={e => updateField('twitter', 'accessToken', e.target.value)} placeholder="Your Twitter Access Token" className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-sky-500 focus:outline-none font-mono text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1">Access Token Secret <span className="text-red-500">*</span></label>
                    <input type="password" value={credentials.twitter?.accessTokenSecret || ''} onChange={e => updateField('twitter', 'accessTokenSecret', e.target.value)} placeholder="Your Twitter Access Token Secret" className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-sky-500 focus:outline-none font-mono text-sm" />
                  </div>
                </div>
                <button onClick={() => testConnection('twitter')} disabled={testingConnection} className="px-4 py-2 bg-sky-100 text-sky-700 rounded-lg hover:bg-sky-200 transition-colors disabled:opacity-50 text-sm font-semibold">
                  {testingConnection ? 'Testing…' : '🔗 Test Connection'}
                </button>
              </div>
            )}

            {/* LinkedIn */}
            {activeTab === 'linkedin' && (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">💼 How to get LinkedIn credentials:</h4>
                  <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                    <li>Go to <a href="https://www.linkedin.com/developers/apps" target="_blank" rel="noopener noreferrer" className="underline">linkedin.com/developers/apps</a> and create an app</li>
                    <li>Request the "Share on LinkedIn" and "Sign In with LinkedIn" products</li>
                    <li>Generate an OAuth 2.0 access token with w_member_social permission</li>
                    <li>For company pages, also add your Organization ID</li>
                  </ol>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Access Token <span className="text-red-500">*</span></label>
                  <input type="password" value={credentials.linkedin?.accessToken || ''} onChange={e => updateField('linkedin', 'accessToken', e.target.value)} placeholder="Your LinkedIn Access Token" className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none font-mono text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Organization ID <span className="text-gray-400 font-normal">(optional — for company page posts)</span></label>
                  <input type="text" value={credentials.linkedin?.organizationId || ''} onChange={e => updateField('linkedin', 'organizationId', e.target.value)} placeholder="e.g. 12345678" className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none font-mono text-sm" />
                  <p className="text-xs text-gray-500 mt-1">Leave blank to post as yourself (personal profile)</p>
                </div>
                <button onClick={() => testConnection('linkedin')} disabled={testingConnection} className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50 text-sm font-semibold">
                  {testingConnection ? 'Testing…' : '🔗 Test Connection'}
                </button>
              </div>
            )}

            {/* YouTube */}
            {activeTab === 'youtube' && (
              <div className="space-y-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-semibold text-red-900 mb-2">📺 How to get YouTube credentials:</h4>
                  <ol className="text-sm text-red-800 space-y-1 list-decimal list-inside">
                    <li>Go to <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer" className="underline">console.cloud.google.com</a></li>
                    <li>Create a project and enable the YouTube Data API v3</li>
                    <li>Create an API Key under "Credentials"</li>
                    <li>Find your Channel ID: YouTube Studio → Settings → Channel → Advanced settings</li>
                  </ol>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">API Key <span className="text-red-500">*</span></label>
                  <input type="password" value={credentials.youtube?.apiKey || ''} onChange={e => updateField('youtube', 'apiKey', e.target.value)} placeholder="Your YouTube Data API v3 Key" className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:outline-none font-mono text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Channel ID <span className="text-red-500">*</span></label>
                  <input type="text" value={credentials.youtube?.channelId || ''} onChange={e => updateField('youtube', 'channelId', e.target.value)} placeholder="e.g. UCxxxxxxxxxxxxxxxxxxxxxxxx" className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:outline-none font-mono text-sm" />
                  <p className="text-xs text-gray-500 mt-1">YouTube Studio → Settings → Channel → Advanced settings → Channel ID</p>
                </div>
                <button onClick={() => testConnection('youtube')} disabled={testingConnection} className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50 text-sm font-semibold">
                  {testingConnection ? 'Testing…' : '🔗 Test Connection'}
                </button>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 border-t border-gray-200 p-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {saveStatus === 'success' && (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-5 h-5" />
                  <span className="text-sm font-semibold">Saved successfully!</span>
                </div>
              )}
              {saveStatus === 'error' && (
                <div className="flex items-center gap-2 text-orange-600">
                  <AlertCircle className="w-5 h-5" />
                  <span className="text-sm font-semibold">Saved locally (backup mode)</span>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={saveCredentials}
                disabled={isSaving}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-semibold disabled:opacity-50 flex items-center gap-2"
              >
                <Save className="w-5 h-5" />
                {isSaving ? 'Saving...' : 'Save Credentials'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}