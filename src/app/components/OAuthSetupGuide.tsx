import React, { useState } from 'react';
import {
  X, Copy, CheckCircle, ExternalLink, ChevronDown, ChevronRight,
  AlertTriangle, Info, Shield, Zap, Globe, Key, ArrowRight
} from 'lucide-react';
import { copyToClipboard } from '../utils/clipboard';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface OAuthSetupGuideProps {
  isopen: boolean;
  onClose: () => void;
  /** Jump directly to a platform tab on open */
  initialPlatform?: PlatformId;
}

type PlatformId = 'facebook' | 'instagram' | 'tiktok' | 'twitter' | 'linkedin' | 'youtube';

interface Platform {
  id: PlatformId;
  name: string;
  icon: string;
  color: string;
  bg: string;
  border: string;
  docsUrl: string;
  devConsoleUrl: string;
  devConsoleLabel: string;
}

const PLATFORMS: Platform[] = [
  {
    id: 'facebook',
    name: 'Facebook',
    icon: '📘',
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    docsUrl: 'https://developers.facebook.com/docs/facebook-login/',
    devConsoleUrl: 'https://developers.facebook.com/apps/',
    devConsoleLabel: 'Facebook Developer Console',
  },
  {
    id: 'instagram',
    name: 'Instagram',
    icon: '📷',
    color: 'text-pink-700',
    bg: 'bg-pink-50',
    border: 'border-pink-200',
    docsUrl: 'https://developers.facebook.com/docs/instagram-api/',
    devConsoleUrl: 'https://developers.facebook.com/apps/',
    devConsoleLabel: 'Meta Developer Console',
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    icon: '🎵',
    color: 'text-gray-900',
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    docsUrl: 'https://developers.tiktok.com/doc/login-kit-web',
    devConsoleUrl: 'https://developers.tiktok.com/',
    devConsoleLabel: 'TikTok Developer Portal',
  },
  {
    id: 'twitter',
    name: 'Twitter / X',
    icon: '🐦',
    color: 'text-sky-700',
    bg: 'bg-sky-50',
    border: 'border-sky-200',
    docsUrl: 'https://developer.x.com/en/docs/authentication/oauth-2-0',
    devConsoleUrl: 'https://developer.x.com/en/portal/projects-and-apps',
    devConsoleLabel: 'X Developer Portal',
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: '💼',
    color: 'text-blue-800',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    docsUrl: 'https://learn.microsoft.com/en-us/linkedin/shared/authentication/authorization-code-flow',
    devConsoleUrl: 'https://www.linkedin.com/developers/apps',
    devConsoleLabel: 'LinkedIn Developer Apps',
  },
  {
    id: 'youtube',
    name: 'YouTube',
    icon: '📺',
    color: 'text-red-700',
    bg: 'bg-red-50',
    border: 'border-red-200',
    docsUrl: 'https://developers.google.com/youtube/v3/guides/auth/server-side-web-apps',
    devConsoleUrl: 'https://console.cloud.google.com/apis/credentials',
    devConsoleLabel: 'Google Cloud Console',
  },
];

// ── Shared helpers ─────────────────────────────────────────────────────────────

function CopyBox({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    copyToClipboard(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="mt-2">
      <p className="text-xs font-semibold text-gray-600 mb-1">{label}</p>
      <div className="flex items-stretch gap-2">
        <div className="flex-1 bg-gray-900 text-green-400 font-mono text-xs rounded-lg px-3 py-2 overflow-x-auto whitespace-nowrap select-all">
          {value}
        </div>
        <button
          onClick={handleCopy}
          title="Copy to clipboard"
          className="flex items-center gap-1.5 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-xs font-semibold shrink-0"
        >
          {copied ? <CheckCircle className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
    </div>
  );
}

function ScopeTag({ scope }: { scope: string }) {
  return (
    <span className="inline-block bg-indigo-100 text-indigo-800 font-mono text-xs px-2 py-0.5 rounded mr-1 mb-1">
      {scope}
    </span>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <div className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
        {n}
      </div>
      <div className="text-sm text-gray-700 leading-relaxed flex-1">{children}</div>
    </div>
  );
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
      <span>{children}</span>
    </div>
  );
}

function InfoBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2 bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
      <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-600" />
      <span>{children}</span>
    </div>
  );
}

function Collapsible({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
      >
        <span className="font-semibold text-sm text-gray-800">{title}</span>
        {open ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
      </button>
      {open && <div className="p-4 space-y-3 bg-white">{children}</div>}
    </div>
  );
}

// ── Callback URL builder ────────────────────────────────────────────────────
// The popup-based OAuth flow uses /oauth-callback.html as the redirect URI.
// This is a standalone HTML file that handles the code exchange and sends
// a postMessage back to the parent window.
function getCallbackUrl(_platform: PlatformId) {
  return `${window.location.origin}/oauth-callback.html`;
}

// ── Platform-specific guide panels ────────────────────────────────────────

function FacebookGuide() {
  const appDomain = 'c627e5cd-d54a-4de0-80b4-44f404b39365-v2-figmaiframepreview.figma.site';
  const siteUrl = `https://${appDomain}/`;
  const supabaseCallback = 'https://bepcmibntfsijkqrlfzd.supabase.co/auth/v1/callback';

  return (
    <div className="space-y-4">
      <InfoBox>
        Facebook and Instagram both use the <strong>Meta for Developers</strong> console. One app can
        handle both platforms.
      </InfoBox>

      <Collapsible title="1 · Create a Meta App" defaultOpen>
        <div className="space-y-3">
          <Step n={1}>
            Go to{' '}
            <a href="https://developers.facebook.com/apps/" target="_blank" rel="noopener noreferrer"
              className="underline text-blue-600 font-semibold">
              developers.facebook.com/apps
            </a>{' '}
            → click <strong>Create App</strong>.
          </Step>
          <Step n={2}>
            Choose <strong>"Business"</strong> as the app type, then fill in your app name and contact email.
          </Step>
          <Step n={3}>
            On the next screen enable the <strong>Facebook Login</strong> product by clicking <strong>Set Up</strong>.
          </Step>
        </div>
      </Collapsible>

      <Collapsible title="2 · Configure App Domains & Site URL (CRITICAL)" defaultOpen>
        <div className="space-y-3">
          <Tip>
            <strong>This is the #1 cause of "The domain of this URL isn't included in the app's domains" errors.</strong>{' '}
            You MUST add the domain in Basic Settings before the redirect URIs will work.
          </Tip>
          <Step n={1}>
            In the left sidebar go to <strong>Settings → Basic</strong>.
          </Step>
          <Step n={2}>
            In the <strong>App Domains</strong> field, add your domain:
          </Step>
          <CopyBox label="App Domain" value={appDomain} />
          <Step n={3}>
            Scroll down to the <strong>Website</strong> section (click "+ Add Platform" → "Website" if not visible).
            Set the <strong>Site URL</strong> to:
          </Step>
          <CopyBox label="Site URL" value={siteUrl} />
          <Step n={4}>
            Click <strong>Save Changes</strong> at the bottom of the page.
          </Step>
        </div>
      </Collapsible>

      <Collapsible title="3 · Add OAuth Redirect URIs (Facebook Login Settings)">
        <div className="space-y-3">
          <Step n={1}>
            In the left sidebar go to <strong>Facebook Login → Settings</strong>.
          </Step>
          <Step n={2}>
            Ensure <strong>Client OAuth Login</strong> and <strong>Web OAuth Login</strong> toggles are <strong>ON</strong>.
          </Step>
          <Step n={3}>
            In <strong>Valid OAuth Redirect URIs</strong>, add BOTH of these URIs:
          </Step>
          <CopyBox label="Redirect URI #1 — Social Accounts Hub (popup flow)" value={getCallbackUrl('facebook')} />
          <CopyBox label="Redirect URI #2 — Supabase Built-in Auth" value={supabaseCallback} />
          <Step n={4}>
            Remove any old URIs ending in <code className="bg-gray-100 px-1 rounded">/oauth-callback</code> (without .html) — those cause 404 errors.
          </Step>
          <Step n={5}>Click <strong>Save Changes</strong>.</Step>
        </div>
      </Collapsible>

      <Collapsible title="4 · Required Permissions / Scopes">
        <p className="text-xs text-gray-600 mb-2">
          Add these in <strong>App Review → Permissions and Features</strong> (or request them in Graph API Explorer):
        </p>
        <div>
          {['pages_manage_posts', 'pages_read_engagement', 'pages_show_list', 'publish_video'].map(s => (
            <ScopeTag key={s} scope={s} />
          ))}
        </div>
        <Tip>
          For development you can use any of these without App Review approval. For production (posting
          to other people's pages) you must submit your app for Meta App Review.
        </Tip>
      </Collapsible>

      <Collapsible title="5 · Get App ID + App Secret">
        <Step n={1}>In the left sidebar go to <strong>Settings → Basic</strong>.</Step>
        <Step n={2}>Copy your <strong>App ID</strong> and <strong>App Secret</strong> (click "Show").</Step>
        <Step n={3}>
          Paste both into the <em>Social Accounts → Facebook</em> settings panel. The server stores the
          App Secret securely in Supabase KV (never exposed to the browser).
        </Step>
      </Collapsible>

      <Collapsible title="6 · Get a Page Access Token">
        <Step n={1}>
          Go to{' '}
          <a href="https://developers.facebook.com/tools/explorer" target="_blank" rel="noopener noreferrer"
            className="underline text-blue-600 font-semibold">
            Graph API Explorer
          </a>.
        </Step>
        <Step n={2}>Top-right dropdown → select your app.</Step>
        <Step n={3}><strong>User or Page</strong> dropdown → <strong>Get Page Access Token</strong> → pick your page.</Step>
        <Step n={4}>Add permissions: <code className="bg-gray-100 px-1 rounded">pages_manage_posts</code> + <code className="bg-gray-100 px-1 rounded">pages_read_engagement</code>.</Step>
        <Step n={5}>Click <strong>Generate Access Token</strong> → approve in the popup.</Step>
        <Step n={6}>Copy the token and paste it into the <em>Social Accounts → Page Access Token</em> field.</Step>
        <Tip>
          Graph API Explorer tokens expire in ~1 hour. Use the <strong>"Get Long-Lived Token"</strong> button
          in Social Accounts settings to exchange it for a 60-day (or permanent Page) token.
        </Tip>
      </Collapsible>

      <Collapsible title="7 · One-Click OAuth Flow (recommended)">
        <p className="text-sm text-gray-700 mb-3">
          Instead of manually copying tokens, use the built-in OAuth button which handles the full
          redirect flow automatically:
        </p>
        <Step n={1}>Enter your <strong>App ID</strong> and <strong>App Secret</strong> in Social Accounts → Facebook.</Step>
        <Step n={2}>Click <strong>Save Credentials</strong> (so the server stores the secret for the callback).</Step>
        <Step n={3}>Click <strong>Connect with Facebook OAuth</strong> — a link will appear.</Step>
        <Step n={4}>Click the link — Facebook login dialog opens.</Step>
        <Step n={5}>After approval Facebook redirects to the Supabase callback URL, which exchanges the code for a long-lived token and saves it automatically.</Step>
        <InfoBox>
          The callback URL must be registered in your Meta App's <strong>Valid OAuth Redirect URIs</strong> (Step 1 above) or the redirect will be blocked by Facebook.
        </InfoBox>
      </Collapsible>
    </div>
  );
}

function InstagramGuide() {
  return (
    <div className="space-y-4">
      <InfoBox>
        Instagram posting requires a <strong>Facebook Page linked to an Instagram Business/Creator
          account</strong> and uses the same Meta Developer App as Facebook.
      </InfoBox>

      <Collapsible title="1 · Link Instagram to a Facebook Page" defaultOpen>
        <Step n={1}>Go to your <strong>Facebook Page</strong> → <strong>Settings → Linked Accounts</strong>.</Step>
        <Step n={2}>Select <strong>Instagram</strong> and follow the prompts to link your Instagram Business account.</Step>
        <Step n={3}>
          If your Instagram account is personal, convert it first: Instagram App → Settings → Account → Switch to Professional Account.
        </Step>
      </Collapsible>

      <Collapsible title="2 · Enable Instagram Graph API in your Meta App">
        <Step n={1}>Open your app at <a href="https://developers.facebook.com/apps/" target="_blank" rel="noopener noreferrer" className="underline text-blue-600">developers.facebook.com/apps</a>.</Step>
        <Step n={2}>Click <strong>Add Product</strong> → find <strong>Instagram Graph API</strong> → Set Up.</Step>
        <Step n={3}>Add the callback URL in <strong>Instagram Basic Display → Valid OAuth Redirect URIs</strong>:</Step>
        <CopyBox label="Instagram OAuth Callback URL" value={getCallbackUrl('instagram')} />
      </Collapsible>

      <Collapsible title="3 · Required Permissions">
        <div>
          {['instagram_basic', 'instagram_content_publish', 'instagram_manage_comments', 'pages_read_engagement'].map(s => (
            <ScopeTag key={s} scope={s} />
          ))}
        </div>
        <Tip>
          <code>instagram_content_publish</code> is required for posting. It requires your app to be in <strong>Live</strong> mode and may need App Review for broad access.
        </Tip>
      </Collapsible>

      <Collapsible title="4 · Get your Instagram Account ID">
        <Step n={1}>Use Graph API Explorer with your page token.</Step>
        <Step n={2}>Query: <code className="bg-gray-100 px-1 rounded text-xs">GET /me/accounts</code> — find your page.</Step>
        <Step n={3}>Then: <code className="bg-gray-100 px-1 rounded text-xs">GET /&#123;page-id&#125;?fields=instagram_business_account</code></Step>
        <Step n={4}>The <code>id</code> in the response is your Instagram Business Account ID — paste it into Social Accounts → Instagram → Account ID.</Step>
      </Collapsible>
    </div>
  );
}

function TikTokGuide() {
  return (
    <div className="space-y-4">
      <Tip>
        TikTok requires a <strong>Business / Creator account</strong> and a registered TikTok for Business
        developer app. Personal accounts cannot use the posting API.
      </Tip>

      <Collapsible title="1 · Create a TikTok Developer App" defaultOpen>
        <Step n={1}>
          Go to{' '}
          <a href="https://developers.tiktok.com/" target="_blank" rel="noopener noreferrer"
            className="underline text-pink-600 font-semibold">
            developers.tiktok.com
          </a>{' '}
          → sign in with your TikTok Business account.
        </Step>
        <Step n={2}>Click <strong>Manage Apps → Create App</strong>.</Step>
        <Step n={3}>Choose <strong>Web</strong> as the platform.</Step>
        <Step n={4}>Under <strong>Login Kit</strong> → paste the redirect URI:</Step>
        <CopyBox label="TikTok OAuth Redirect URI" value={getCallbackUrl('tiktok')} />
      </Collapsible>

      <Collapsible title="2 · Required Scopes">
        <div>
          {['user.info.basic', 'video.publish', 'video.upload'].map(s => (
            <ScopeTag key={s} scope={s} />
          ))}
        </div>
        <InfoBox>
          TikTok's Content Posting API (<code>video.publish</code>) requires a separate
          application to TikTok's Content Posting API program at{' '}
          <a href="https://developers.tiktok.com/products/content-posting-api/" target="_blank" rel="noopener noreferrer" className="underline">
            developers.tiktok.com/products/content-posting-api
          </a>.
        </InfoBox>
      </Collapsible>

      <Collapsible title="3 · Get Client Key + Secret">
        <Step n={1}>In the TikTok Developer Portal, navigate to your app.</Step>
        <Step n={2}>Under <strong>App Info</strong>, copy the <strong>Client Key</strong> (App ID) and <strong>Client Secret</strong>.</Step>
        <Step n={3}>Paste them into <em>Social Accounts → TikTok</em> fields.</Step>
      </Collapsible>

      <Collapsible title="4 · OAuth Token Flow">
        <Step n={1}>Trigger the OAuth dialog — TikTok will redirect the user to log in.</Step>
        <Step n={2}>After approval, TikTok redirects to the callback URL with a <code>code</code>.</Step>
        <Step n={3}>The server exchanges the code for an <strong>access token</strong> (valid 24h) and a <strong>refresh token</strong> (valid 365 days).</Step>
        <Tip>Store the refresh token securely. Use it to obtain a new access token before it expires. The server handles this automatically via the KV store.</Tip>
      </Collapsible>
    </div>
  );
}

function TwitterGuide() {
  return (
    <div className="space-y-4">
      <InfoBox>
        Twitter/X supports both <strong>OAuth 1.0a</strong> (API Key + Secret) and <strong>OAuth 2.0</strong>
        (Bearer Token / PKCE). This platform uses OAuth 1.0a for posting (v1.1 API) or OAuth 2.0 for v2 endpoints.
      </InfoBox>

      <Collapsible title="1 · Create an X Developer App" defaultOpen>
        <Step n={1}>
          Go to{' '}
          <a href="https://developer.x.com/en/portal/projects-and-apps" target="_blank" rel="noopener noreferrer"
            className="underline text-sky-600 font-semibold">
            developer.x.com
          </a>{' '}
          → sign in → create a new project + app.
        </Step>
        <Step n={2}>Select <strong>Read and Write</strong> permissions (required for posting).</Step>
        <Step n={3}>Under <strong>App Settings → Authentication Settings</strong> enable <strong>OAuth 2.0</strong>.</Step>
        <Step n={4}>Set the Callback URL / Redirect URI:</Step>
        <CopyBox label="Twitter OAuth 2.0 Redirect URI" value={getCallbackUrl('twitter')} />
        <Step n={5}>Set the Website URL to your app's domain (or the Supabase base URL for testing).</Step>
      </Collapsible>

      <Collapsible title="2 · Required OAuth 2.0 Scopes">
        <div>
          {['tweet.read', 'tweet.write', 'users.read', 'offline.access'].map(s => (
            <ScopeTag key={s} scope={s} />
          ))}
        </div>
        <p className="text-xs text-gray-600">
          <code>offline.access</code> enables refresh tokens so the user stays connected.
        </p>
      </Collapsible>

      <Collapsible title="3 · API Keys (OAuth 1.0a — for v1.1 media uploads)">
        <Step n={1}>In your X app, go to <strong>Keys and Tokens</strong>.</Step>
        <Step n={2}>Copy the <strong>API Key</strong> and <strong>API Secret Key</strong>.</Step>
        <Step n={3}>Generate an <strong>Access Token</strong> and <strong>Access Token Secret</strong> (your account).</Step>
        <Step n={4}>Paste all four values into <em>Social Accounts → Twitter/X</em>.</Step>
        <Tip>
          OAuth 1.0a keys give you immediate posting access to your own account without the OAuth redirect flow.
          For posting on behalf of other users, use the OAuth 2.0 flow above.
        </Tip>
      </Collapsible>

      <Collapsible title="4 · Essential Rate Limits (Free tier)">
        <div className="text-sm text-gray-700 space-y-1">
          <p>• <strong>1,500 tweets/month</strong> on the Free tier.</p>
          <p>• <strong>Basic tier ($100/mo):</strong> 3,000 tweets/month write, 10,000 read.</p>
          <p>• Media uploads (images/video) require v1.1 API — still free for media upload endpoint.</p>
        </div>
      </Collapsible>
    </div>
  );
}

function LinkedInGuide() {
  return (
    <div className="space-y-4">
      <InfoBox>
        LinkedIn uses <strong>OAuth 2.0</strong> and the <strong>Community Management API</strong>. Posting to
        company pages requires the <em>Organization Access</em> product.
      </InfoBox>

      <Collapsible title="1 · Create a LinkedIn App" defaultOpen>
        <Step n={1}>
          Go to{' '}
          <a href="https://www.linkedin.com/developers/apps" target="_blank" rel="noopener noreferrer"
            className="underline text-blue-700 font-semibold">
            linkedin.com/developers/apps
          </a>{' '}
          → <strong>Create App</strong>.
        </Step>
        <Step n={2}>Associate the app with your <strong>LinkedIn Company Page</strong>.</Step>
        <Step n={3}>Under <strong>Auth → OAuth 2.0 Settings</strong>, add the Redirect URL:</Step>
        <CopyBox label="LinkedIn OAuth Redirect URL" value={getCallbackUrl('linkedin')} />
      </Collapsible>

      <Collapsible title="2 · Required OAuth 2.0 Scopes">
        <div>
          {['openid', 'profile', 'email', 'w_member_social', 'r_organization_social', 'w_organization_social', 'rw_organization_admin'].map(s => (
            <ScopeTag key={s} scope={s} />
          ))}
        </div>
        <Tip>
          <code>w_organization_social</code> requires you to request the <strong>Community Management API</strong>
          product inside your LinkedIn App → Products tab. Approval can take 1–5 business days.
        </Tip>
      </Collapsible>

      <Collapsible title="3 · Get Client ID + Client Secret">
        <Step n={1}>In your LinkedIn App → <strong>Auth</strong> tab.</Step>
        <Step n={2}>Copy the <strong>Client ID</strong> and <strong>Client Secret</strong>.</Step>
        <Step n={3}>Paste them into <em>Social Accounts → LinkedIn</em>.</Step>
      </Collapsible>

      <Collapsible title="4 · Get your Organization (Company) ID">
        <Step n={1}>Go to your Company Page on LinkedIn.</Step>
        <Step n={2}>Look at the URL: <code className="text-xs bg-gray-100 px-1 rounded">linkedin.com/company/<strong>&#123;org-id&#125;</strong>/admin/</code>.</Step>
        <Step n={3}>Copy the numeric ID and paste it into <em>Social Accounts → LinkedIn → Organization ID</em>.</Step>
      </Collapsible>

      <Collapsible title="5 · Access Token Lifetime">
        <div className="text-sm text-gray-700 space-y-1">
          <p>• <strong>Access tokens</strong> expire after <strong>60 days</strong>.</p>
          <p>• <strong>Refresh tokens</strong> expire after <strong>365 days</strong>.</p>
          <p>• The server will auto-refresh using the stored refresh token before expiry.</p>
        </div>
      </Collapsible>
    </div>
  );
}

function YouTubeGuide() {
  return (
    <div className="space-y-4">
      <InfoBox>
        YouTube uses <strong>Google OAuth 2.0</strong>. All credentials are managed in <strong>Google Cloud Console</strong>.
        Video uploads use the YouTube Data API v3.
      </InfoBox>

      <Collapsible title="1 · Enable YouTube Data API v3" defaultOpen>
        <Step n={1}>
          Go to{' '}
          <a href="https://console.cloud.google.com/apis/library/youtube.googleapis.com" target="_blank" rel="noopener noreferrer"
            className="underline text-red-600 font-semibold">
            Google Cloud Console → APIs & Services → Library
          </a>.
        </Step>
        <Step n={2}>Search for <strong>YouTube Data API v3</strong> → click <strong>Enable</strong>.</Step>
      </Collapsible>

      <Collapsible title="2 · Create OAuth 2.0 Credentials">
        <Step n={1}>Go to <strong>APIs & Services → Credentials → Create Credentials → OAuth client ID</strong>.</Step>
        <Step n={2}>Select application type: <strong>Web application</strong>.</Step>
        <Step n={3}>Under <strong>Authorized redirect URIs</strong>, add:</Step>
        <CopyBox label="Google / YouTube OAuth Redirect URI" value={getCallbackUrl('youtube')} />
        <Step n={4}>Click <strong>Create</strong> — download the JSON or copy the <strong>Client ID</strong> and <strong>Client Secret</strong>.</Step>
      </Collapsible>

      <Collapsible title="3 · Required OAuth 2.0 Scopes">
        <div>
          {['https://www.googleapis.com/auth/youtube.upload', 'https://www.googleapis.com/auth/youtube.readonly', 'https://www.googleapis.com/auth/youtube.force-ssl'].map(s => (
            <ScopeTag key={s} scope={s} />
          ))}
        </div>
      </Collapsible>

      <Collapsible title="4 · Get your Channel ID">
        <Step n={1}>Sign into YouTube → click your avatar → <strong>Your channel</strong>.</Step>
        <Step n={2}>In the URL bar: <code className="text-xs bg-gray-100 px-1 rounded">youtube.com/channel/<strong>UC…</strong></code> — that is your Channel ID.</Step>
        <Step n={3}>Alternatively, go to <a href="https://studio.youtube.com/channel/UC" target="_blank" rel="noopener noreferrer" className="underline text-red-600">YouTube Studio → Settings → Channel → Advanced settings</a>.</Step>
        <Step n={4}>Paste the Channel ID into <em>Social Accounts → YouTube</em>.</Step>
      </Collapsible>

      <Collapsible title="5 · API Key (for read-only operations)">
        <Step n={1}>In Google Cloud Console → <strong>Credentials → Create Credentials → API Key</strong>.</Step>
        <Step n={2}>Restrict the key to <strong>YouTube Data API v3</strong> only (recommended).</Step>
        <Step n={3}>Paste the API Key into <em>Social Accounts → YouTube → API Key</em>. This is used for fetching channel data without OAuth.</Step>
        <Tip>Never expose your API Key in public client-side code. The platform stores it server-side in Supabase KV.</Tip>
      </Collapsible>
    </div>
  );
}

const GUIDE_COMPONENTS: Record<PlatformId, React.FC> = {
  facebook: FacebookGuide,
  instagram: InstagramGuide,
  tiktok: TikTokGuide,
  twitter: TwitterGuide,
  linkedin: LinkedInGuide,
  youtube: YouTubeGuide,
};

// ── Main Component ─────────────────────────────────────────────────────────────

export function OAuthSetupGuide({ isopen, onClose, initialPlatform = 'facebook' }: OAuthSetupGuideProps) {
  const [active, setActive] = useState<PlatformId>(initialPlatform);

  if (!isopen) return null;

  const ActiveGuide = GUIDE_COMPONENTS[active];
  const platform = PLATFORMS.find(p => p.id === active)!;

  return (
    <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl flex flex-col max-h-[92vh] overflow-hidden">

          {/* ── Header ── */}
          <div className="bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-600 p-5 flex items-start justify-between text-white shrink-0">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Shield className="w-5 h-5" />
                <h2 className="text-xl font-bold">OAuth Setup Guide</h2>
              </div>
              <p className="text-sm text-white/80">
                Step-by-step instructions for connecting all social platforms via OAuth
              </p>
              <div className="mt-2 flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 bg-white/15 px-2.5 py-1 rounded-full text-xs">
                  <Zap className="w-3 h-3" /> Supabase Edge Function callback pre-configured
                </div>
                <div className="flex items-center gap-1.5 bg-white/15 px-2.5 py-1 rounded-full text-xs">
                  <Globe className="w-3 h-3" /> 6 platforms supported
                </div>
                <div className="flex items-center gap-1.5 bg-white/15 px-2.5 py-1 rounded-full text-xs">
                  <Key className="w-3 h-3" /> Tokens stored in Supabase KV
                </div>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors shrink-0 mt-1">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* ── Platform tabs ── */}
          <div className="flex border-b border-gray-200 bg-gray-50 overflow-x-auto shrink-0">
            {PLATFORMS.map(p => (
              <button
                key={p.id}
                onClick={() => setActive(p.id)}
                className={`flex items-center gap-2 px-5 py-3.5 font-semibold text-sm transition-all whitespace-nowrap border-b-2 ${active === p.id
                  ? 'border-indigo-600 text-indigo-700 bg-white'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
              >
                <span className="text-base">{p.icon}</span>
                {p.name}
              </button>
            ))}
          </div>

          {/* ── Body ── */}
          <div className="flex flex-1 overflow-hidden">

            {/* Guide content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Platform header strip */}
              <div className={`flex items-center justify-between mb-5 p-4 rounded-xl ${platform.bg} border ${platform.border}`}>
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{platform.icon}</span>
                  <div>
                    <h3 className={`font-bold text-lg ${platform.color}`}>{platform.name} OAuth Setup</h3>
                    <a
                      href={platform.docsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`text-xs underline flex items-center gap-1 ${platform.color} opacity-80 hover:opacity-100`}
                    >
                      Official Docs <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
                <a
                  href={platform.devConsoleUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold border transition-colors ${platform.border} ${platform.color} ${platform.bg} hover:opacity-80`}
                >
                  {platform.devConsoleLabel} <ArrowRight className="w-3 h-3" />
                </a>
              </div>

              <ActiveGuide />
            </div>

            {/* Right sidebar — quick ref */}
            <div className="w-64 border-l border-gray-100 bg-gray-50 p-4 shrink-0 overflow-y-auto hidden lg:block">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Quick Reference</p>

              <div className="space-y-3">
                <div className="bg-white border border-gray-200 rounded-xl p-3">
                  <p className="text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1">
                    <Key className="w-3.5 h-3.5 text-indigo-500" /> Supabase Project ID
                  </p>
                  <code className="text-xs font-mono text-indigo-700 break-all">{projectId}</code>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-3">
                  <p className="text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5 text-green-500" /> Callback Base URL
                  </p>
                  <code className="text-xs font-mono text-green-700 break-all">{window.location.origin}/</code>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                  <p className="text-xs font-bold text-amber-800 mb-1">⚠️ Token Security</p>
                  <p className="text-xs text-amber-700">
                    App Secrets and access tokens are stored only in Supabase KV (server-side). They are never
                    sent to the browser except during the OAuth redirect flow.
                  </p>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                  <p className="text-xs font-bold text-green-800 mb-2">✅ Platforms Ready</p>
                  {PLATFORMS.map(p => (
                    <button
                      key={p.id}
                      onClick={() => setActive(p.id)}
                      className={`w-full flex items-center gap-2 px-2 py-1 rounded-lg text-xs mb-1 transition-colors text-left ${active === p.id ? 'bg-green-200 text-green-900 font-bold' : 'hover:bg-green-100 text-green-700'
                        }`}
                    >
                      <span>{p.icon}</span> {p.name}
                    </button>
                  ))}
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                  <p className="text-xs font-bold text-blue-800 mb-1">💡 After Setup</p>
                  <p className="text-xs text-blue-700">
                    Once OAuth is configured, use <strong>Social Accounts</strong> in the main nav to connect
                    accounts and <strong>Scheduler</strong> to automate posts.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-100 bg-gray-50 px-6 py-3 flex items-center justify-between shrink-0">
            <p className="text-xs text-gray-400">
              Callback URLs are automatically generated for <strong>{projectId}.supabase.co</strong>
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}