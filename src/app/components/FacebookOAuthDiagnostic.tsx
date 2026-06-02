import React, { useState } from 'react';
import { Copy, CheckCircle, AlertTriangle, ExternalLink, ArrowRight, Settings, Globe, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { copyToClipboard } from '../utils/clipboard';

// ═══════════════════════════════════════════════════════════════════════════════
// FACEBOOK OAUTH DIAGNOSTIC
//
// Shows ALL THREE required Facebook Developer Console settings:
//   1. App Domains          (Settings > Basic)
//   2. Site URL             (Settings > Basic > Website)
//   3. Valid OAuth Redirect URIs  (Facebook Login > Settings)
//
// The most common error is "The domain of this URL isn't included in the
// app's domains" — which means App Domains is missing, NOT the redirect URI.
// ═══════════════════════════════════════════════════════════════════════════════

const APP_DOMAIN = 'c627e5cd-d54a-4de0-80b4-44f404b39365-v2-figmaiframepreview.figma.site';
const SUPABASE_PROJECT_ID = 'bepcmibntfsijkqrlfzd';
const FACEBOOK_APP_ID = '2152774215473901';

export function FacebookOAuthDiagnostic() {
  const redirectUri = `${window.location.origin}/oauth-callback.html`;
  const supabaseCallback = `https://${SUPABASE_PROJECT_ID}.supabase.co/auth/v1/callback`;
  const siteUrl = `https://${APP_DOMAIN}/`;
  const [step, setStep] = useState(1);
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  const copyItem = (text: string, label: string) => {
    copyToClipboard(text).then(ok => {
      if (ok) {
        setCopiedItem(label);
        toast.success(`Copied ${label}!`);
        setTimeout(() => setCopiedItem(null), 3000);
      } else {
        toast.error('Failed to copy');
      }
    });
  };

  const CopyButton = ({ text, label, size = 'md' }: { text: string; label: string; size?: 'sm' | 'md' }) => (
    <button
      onClick={() => copyItem(text, label)}
      className={`flex items-center gap-1.5 rounded-lg font-bold transition-all shadow-md flex-shrink-0 ${copiedItem === label
        ? 'bg-green-500 text-white'
        : 'bg-indigo-600 text-white hover:bg-indigo-700'
        } ${size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-5 py-2.5 text-sm'}`}
    >
      {copiedItem === label ? (
        <><CheckCircle className="w-4 h-4" /> Copied!</>
      ) : (
        <><Copy className="w-4 h-4" /> Copy</>
      )}
    </button>
  );

  const CopyableValue = ({ text, label, highlight = 'yellow' }: { text: string; label: string; highlight?: 'yellow' | 'green' | 'blue' }) => {
    const colors = {
      yellow: 'bg-yellow-100 border-yellow-400',
      green: 'bg-green-100 border-green-400',
      blue: 'bg-blue-100 border-blue-400',
    };
    return (
      <div className={`flex items-center gap-2 ${colors[highlight]} border-2 rounded-lg px-4 py-3`}>
        <code className="flex-1 font-mono text-sm text-gray-900 break-all font-bold select-all">
          {text}
        </code>
        <CopyButton text={text} label={label} />
      </div>
    );
  };

  return (
    <div className="bg-white border-4 border-red-500 rounded-2xl p-6 shadow-2xl">
      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
          <AlertTriangle className="w-8 h-8 text-red-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-red-900 mb-1">
            Facebook OAuth Configuration Required
          </h2>
          <p className="text-red-700 text-lg">
            3 settings must be configured in the Facebook Developer Console
          </p>
        </div>
      </div>

      {/* Error Explanation */}
      <div className="bg-red-50 border-2 border-red-300 rounded-xl p-5 mb-6">
        <h3 className="font-bold text-red-900 mb-3 text-lg flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          "The domain of this URL isn't included in the app's domains"
        </h3>
        <p className="text-red-800 mb-3">
          This error means the <strong>App Domains</strong> field in your Facebook app's Basic Settings
          does <strong>NOT</strong> include your site's domain. Adding the redirect URI alone is not enough —
          Facebook requires the domain to be whitelisted first.
        </p>
        <div className="bg-white border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-900 font-bold mb-2">You need ALL THREE of these configured:</p>
          <ol className="list-decimal list-inside space-y-1 text-sm text-red-800">
            <li><strong>App Domains</strong> — Settings &gt; Basic</li>
            <li><strong>Site URL</strong> — Settings &gt; Basic &gt; Website</li>
            <li><strong>Valid OAuth Redirect URIs</strong> — Facebook Login &gt; Settings</li>
          </ol>
        </div>
      </div>

      {/* Quick Reference Card — All Values */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-300 rounded-xl p-5 mb-6">
        <h3 className="font-bold text-indigo-900 text-lg mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5" />
          All Required Values (Quick Reference)
        </h3>

        <div className="space-y-4">
          {/* App ID */}
          <div>
            <p className="text-xs font-bold text-indigo-700 mb-1 uppercase tracking-wide">Facebook App ID</p>
            <CopyableValue text={FACEBOOK_APP_ID} label="App ID" highlight="blue" />
          </div>

          {/* App Domains */}
          <div>
            <p className="text-xs font-bold text-indigo-700 mb-1 uppercase tracking-wide">
              App Domains (Settings &gt; Basic)
            </p>
            <CopyableValue text={APP_DOMAIN} label="App Domain" highlight="yellow" />
          </div>

          {/* Site URL */}
          <div>
            <p className="text-xs font-bold text-indigo-700 mb-1 uppercase tracking-wide">
              Site URL (Settings &gt; Basic &gt; Website)
            </p>
            <CopyableValue text={siteUrl} label="Site URL" highlight="yellow" />
          </div>

          {/* Redirect URI — Custom OAuth (Social Accounts Hub) */}
          <div>
            <p className="text-xs font-bold text-indigo-700 mb-1 uppercase tracking-wide">
              Valid OAuth Redirect URI #1 — Social Accounts Hub
            </p>
            <CopyableValue text={redirectUri} label="Redirect URI #1" highlight="green" />
          </div>

          {/* Redirect URI — Supabase Auth */}
          <div>
            <p className="text-xs font-bold text-indigo-700 mb-1 uppercase tracking-wide">
              Valid OAuth Redirect URI #2 — Supabase Auth
            </p>
            <CopyableValue text={supabaseCallback} label="Redirect URI #2" highlight="green" />
          </div>
        </div>
      </div>

      {/* Step-by-Step Walkthrough */}
      <div className="space-y-4 mb-6">
        <h3 className="font-bold text-gray-900 text-xl flex items-center gap-2">
          <Settings className="w-6 h-6 text-indigo-600" />
          Step-by-Step Configuration
        </h3>

        {/* Step 1 — Open Facebook Developers */}
        <StepCard
          number={1}
          active={step >= 1}
          title="Open Facebook Developer Console"
          onComplete={() => setStep(Math.max(step, 2))}
        >
          <p className="text-gray-700 mb-3">Open the Facebook App Dashboard for App ID <code className="bg-gray-200 px-1.5 py-0.5 rounded font-mono text-sm">{FACEBOOK_APP_ID}</code>:</p>
          <a
            href={`https://developers.facebook.com/apps/${FACEBOOK_APP_ID}/settings/basic/`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setStep(Math.max(step, 2))}
            className="inline-flex items-center gap-3 px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-bold text-lg shadow-lg"
          >
            <ExternalLink className="w-6 h-6" />
            Open App Settings (Basic)
            <ArrowRight className="w-6 h-6" />
          </a>
        </StepCard>

        {/* Step 2 — Add App Domain */}
        <StepCard
          number={2}
          active={step >= 2}
          title="Add App Domain (Settings > Basic)"
          onComplete={() => setStep(Math.max(step, 3))}
          critical
        >
          <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 mb-4">
            <p className="text-red-900 font-bold mb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              THIS IS THE MOST COMMON MISSING STEP!
            </p>
            <p className="text-red-800 text-sm">
              In Settings &gt; Basic, scroll to the <strong>"App Domains"</strong> field and add your domain:
            </p>
          </div>
          <CopyableValue text={APP_DOMAIN} label="App Domain (Step 2)" highlight="yellow" />
          <p className="text-sm text-gray-600 mt-2">
            Type or paste it into the "App Domains" text box, then press Enter or Tab to confirm it.
          </p>
        </StepCard>

        {/* Step 3 — Add Site URL */}
        <StepCard
          number={3}
          active={step >= 3}
          title="Add Site URL (Settings > Basic > Website)"
          onComplete={() => setStep(Math.max(step, 4))}
        >
          <p className="text-gray-700 mb-3">
            Still on the Basic Settings page, scroll down to the <strong>"Website"</strong> section.
            Click <strong>"+ Add Platform"</strong> if you don't see it, then select "Website".
            Set the <strong>Site URL</strong> to:
          </p>
          <CopyableValue text={siteUrl} label="Site URL (Step 3)" highlight="yellow" />
          <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              <strong>Important:</strong> Click <strong>"Save Changes"</strong> at the bottom of the Basic Settings page before continuing.
            </p>
          </div>
        </StepCard>

        {/* Step 4 — Enable OAuth Toggles */}
        <StepCard
          number={4}
          active={step >= 4}
          title="Enable OAuth Toggles (Facebook Login > Settings)"
          onComplete={() => setStep(Math.max(step, 5))}
          critical
        >
          <p className="text-gray-700 mb-3">
            Navigate to <strong>Products &gt; Facebook Login &gt; Settings</strong> in the left sidebar.
            Ensure these toggles are <strong>ON</strong>:
          </p>
          <div className="bg-white border-2 border-red-300 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-5 bg-green-500 rounded-full relative">
                <div className="w-4 h-4 bg-white rounded-full absolute right-0.5 top-0.5 shadow" />
              </div>
              <span className="font-mono text-sm font-bold">Client OAuth Login</span>
              <span className="text-green-700 text-sm font-bold">= ON</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-5 bg-green-500 rounded-full relative">
                <div className="w-4 h-4 bg-white rounded-full absolute right-0.5 top-0.5 shadow" />
              </div>
              <span className="font-mono text-sm font-bold">Web OAuth Login</span>
              <span className="text-green-700 text-sm font-bold">= ON</span>
            </div>
          </div>
          <p className="text-xs text-red-700 mt-2 italic">
            If these are OFF, Facebook rejects ALL OAuth redirects, even if the URI is in the list!
          </p>
        </StepCard>

        {/* Step 5 — Add Redirect URIs */}
        <StepCard
          number={5}
          active={step >= 5}
          title="Add Valid OAuth Redirect URIs (Facebook Login > Settings)"
          onComplete={() => setStep(Math.max(step, 6))}
        >
          <p className="text-gray-700 mb-3">
            Still on the Facebook Login Settings page, scroll to <strong>"Valid OAuth Redirect URIs"</strong>.
            Add <strong>BOTH</strong> of these URIs:
          </p>
          <div className="space-y-3">
            <div>
              <p className="text-xs font-bold text-gray-600 mb-1">URI #1 — Social Accounts Hub (popup flow via /oauth-callback.html):</p>
              <CopyableValue text={redirectUri} label="Redirect URI #1 (Step 5)" highlight="green" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-600 mb-1">URI #2 — Supabase Built-in Auth (/auth/v1/callback):</p>
              <CopyableValue text={supabaseCallback} label="Redirect URI #2 (Step 5)" highlight="green" />
            </div>
          </div>
          <div className="mt-3 bg-yellow-50 border border-yellow-300 rounded-lg p-3">
            <p className="text-sm text-yellow-900">
              <strong>Tip:</strong> Click "Save Changes" at the bottom after adding both URIs.
              Changes can take 1-2 minutes to propagate.
            </p>
          </div>
        </StepCard>

        {/* Step 6 — Remove Stale URIs */}
        <StepCard
          number={6}
          active={step >= 6}
          title="Remove Old/Stale Redirect URIs"
          onComplete={() => setStep(Math.max(step, 7))}
        >
          <p className="text-gray-700 mb-3">
            While you're in the Valid OAuth Redirect URIs section, <strong>remove</strong> any old URIs that no longer apply:
          </p>
          <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 space-y-2">
            <p className="text-xs font-bold text-red-800 mb-2">Delete these if present (outdated):</p>
            <code className="block text-xs text-red-700 bg-red-100 px-2 py-1.5 rounded font-mono break-all line-through">
              https://c627e5cd-d54a-4de0-80b4-44f404b39365-v2-figmaiframepreview.figma.site/oauth-callback
            </code>
            <p className="text-xs text-red-600">
              The old path <code>/oauth-callback</code> (without .html) causes 404 errors because Figma Make's static hosting doesn't support SPA fallback routing.
            </p>
          </div>
        </StepCard>

        {/* Step 7 — Test */}
        {step >= 7 && (
          <StepCard
            number={7}
            active={true}
            title="Test the Connection!"
            onComplete={() => { }}
          >
            <div className="bg-green-50 border-2 border-green-400 rounded-lg p-4">
              <p className="text-green-900 mb-3 font-semibold">
                All settings should now be configured. Close this dialog and click "Connect" on Facebook again.
              </p>
              <p className="text-green-800 text-sm mb-3">
                If it's still not working after 2 minutes:
              </p>
              <ul className="list-disc list-inside text-sm text-green-800 space-y-1">
                <li>Double-check you clicked <strong>"Save Changes"</strong> on both pages</li>
                <li>Verify both OAuth toggles are ON</li>
                <li>Try in an incognito/private window</li>
                <li>Check the browser console for error details</li>
              </ul>
            </div>
          </StepCard>
        )}
      </div>

      {/* Visual Summary Table */}
      <div className="bg-gray-50 border-2 border-gray-300 rounded-xl p-5 mb-6">
        <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
          <Globe className="w-5 h-5 text-indigo-600" />
          Complete Facebook App Configuration Summary
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-200">
                <th className="text-left px-3 py-2 font-bold text-gray-800 rounded-tl-lg">Setting</th>
                <th className="text-left px-3 py-2 font-bold text-gray-800">Location</th>
                <th className="text-left px-3 py-2 font-bold text-gray-800 rounded-tr-lg">Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr className="bg-white">
                <td className="px-3 py-2 font-semibold">App Domains</td>
                <td className="px-3 py-2 text-gray-600">Settings &gt; Basic</td>
                <td className="px-3 py-2">
                  <code className="text-xs bg-yellow-100 px-1.5 py-0.5 rounded font-mono break-all">{APP_DOMAIN}</code>
                </td>
              </tr>
              <tr className="bg-gray-50">
                <td className="px-3 py-2 font-semibold">Site URL</td>
                <td className="px-3 py-2 text-gray-600">Settings &gt; Basic &gt; Website</td>
                <td className="px-3 py-2">
                  <code className="text-xs bg-yellow-100 px-1.5 py-0.5 rounded font-mono break-all">{siteUrl}</code>
                </td>
              </tr>
              <tr className="bg-white">
                <td className="px-3 py-2 font-semibold">Client OAuth Login</td>
                <td className="px-3 py-2 text-gray-600">Facebook Login &gt; Settings</td>
                <td className="px-3 py-2"><span className="bg-green-100 text-green-800 px-2 py-0.5 rounded font-bold text-xs">ON</span></td>
              </tr>
              <tr className="bg-gray-50">
                <td className="px-3 py-2 font-semibold">Web OAuth Login</td>
                <td className="px-3 py-2 text-gray-600">Facebook Login &gt; Settings</td>
                <td className="px-3 py-2"><span className="bg-green-100 text-green-800 px-2 py-0.5 rounded font-bold text-xs">ON</span></td>
              </tr>
              <tr className="bg-white">
                <td className="px-3 py-2 font-semibold">Redirect URI #1</td>
                <td className="px-3 py-2 text-gray-600">Facebook Login &gt; Settings</td>
                <td className="px-3 py-2">
                  <code className="text-xs bg-green-100 px-1.5 py-0.5 rounded font-mono break-all">{redirectUri}</code>
                </td>
              </tr>
              <tr className="bg-gray-50">
                <td className="px-3 py-2 font-semibold">Redirect URI #2</td>
                <td className="px-3 py-2 text-gray-600">Facebook Login &gt; Settings</td>
                <td className="px-3 py-2">
                  <code className="text-xs bg-green-100 px-1.5 py-0.5 rounded font-mono break-all">{supabaseCallback}</code>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Help Link */}
      <div className="bg-indigo-100 border-2 border-indigo-300 rounded-xl p-4">
        <p className="text-indigo-900 text-sm">
          <strong>Need more help?</strong> Check the full setup guide at{' '}
          <a href="/docs/FACEBOOK_OAUTH_SETUP.md" target="_blank" className="underline ml-1 font-semibold">
            /docs/FACEBOOK_OAUTH_SETUP.md
          </a>
          {' '}or the{' '}
          <a href="https://developers.facebook.com/docs/facebook-login/guides/advanced/manual-flow#confirm" target="_blank" rel="noopener noreferrer" className="underline font-semibold">
            Facebook OAuth documentation
          </a>
        </p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STEP CARD COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

function StepCard({
  number,
  active,
  title,
  critical,
  onComplete,
  children,
}: {
  number: number;
  active: boolean;
  title: string;
  critical?: boolean;
  onComplete: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className={`border-4 rounded-xl p-5 transition-all ${active
      ? critical
        ? 'border-red-500 bg-red-50/50'
        : 'border-indigo-500 bg-indigo-50'
      : 'border-gray-200 bg-gray-50 opacity-60'
      }`}>
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-full text-white flex items-center justify-center flex-shrink-0 text-xl font-bold ${critical && active ? 'bg-red-600' : 'bg-indigo-600'
          }`}>
          {number}
        </div>
        <div className="flex-1">
          <h4 className="font-bold text-gray-900 text-lg mb-3 flex items-center gap-2">
            {title}
            {critical && <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded-full font-bold">CRITICAL</span>}
          </h4>
          {children}
          {active && number < 7 && (
            <button
              onClick={onComplete}
              className="mt-4 px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-bold flex items-center gap-2 text-sm"
            >
              <CheckCircle className="w-4 h-4" />
              Done — Next Step
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
