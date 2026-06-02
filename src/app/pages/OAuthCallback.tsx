import React, { useEffect, useRef } from 'react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { resolveServerUrl } from '../utils/serverFetch';

// ═══════════════════════════════════════════════════════════════════════════════
// OAUTH CALLBACK — REACT ROUTE FALLBACK
//
// Mirrors /public/oauth-callback.html but runs inside the SPA.
// Sends the OAuth result via 4 strategies:
//  1. postMessage to window.opener  (fast — needs opener reference)
//  2. BroadcastChannel              (works without opener, same-origin)
//  3. localStorage                  (parent polls this)
//  4. Server relay POST with RETRY  (MOST RELIABLE — bypasses iframe partitioning)
//
// The parent's oauthEngine closes the popup after it reads the code.
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Clean state parameter — strip any trailing path artifacts.
 * Facebook should return state as-is, but some intermediaries (Supabase, CDN)
 * may append path fragments like /oauth/consent.
 * Expected format: platform_timestamp_random (e.g., facebook_1773421737080_2ckqb3)
 */
function cleanState(raw: string | null): string | null {
  if (!raw) return raw;
  // If state contains a slash and matches our format, strip the trailing path
  if (raw.includes('/')) {
    const parts = raw.split('_');
    if (parts.length >= 3) {
      // The slash is likely appended after the random part
      const cleaned = raw.replace(/\/.*$/, '');
      if (cleaned !== raw) {
        console.log(`[OAuthCallback] Cleaned state: '${raw}' -> '${cleaned}'`);
        return cleaned;
      }
    }
  }
  return raw;
}

/**
 * POST to relay-store with retry (up to 5 attempts with backoff).
 * This is the CRITICAL delivery path in Figma's iframe sandbox.
 */
async function postRelayWithRetry(
  code: string | null,
  state: string | null,
  error: string | null,
  errorDesc: string | null,
  maxAttempts = 5
): Promise<boolean> {
  const relayUrl = resolveServerUrl('/social-accounts/oauth/relay-store');

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`[OAuthCallback] Relay POST attempt ${attempt}/${maxAttempts}`);
      const res = await fetch(relayUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({ code, state, error, errorDescription: errorDesc }),
      });

      if (res.ok) {
        console.log(`[OAuthCallback] Relay POST succeeded (attempt ${attempt})`);
        return true;
      }

      const errText = await res.text().catch(() => '');
      console.log(`[OAuthCallback] Relay POST returned ${res.status} (attempt ${attempt}): ${errText}`);
    } catch (e) {
      console.log(`[OAuthCallback] Relay POST network error (attempt ${attempt}):`, e);
    }

    // Backoff before retry
    if (attempt < maxAttempts) {
      await new Promise(r => setTimeout(r, attempt * 1000));
    }
  }

  console.error(`[OAuthCallback] Relay POST FAILED after ${maxAttempts} attempts`);
  return false;
}

export default function OAuthCallback() {
  const hasRun = useRef(false);
  const [status, setStatus] = React.useState<'sending' | 'success' | 'error'>('sending');
  const [statusMsg, setStatusMsg] = React.useState('Sending authorization to your app…');

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    console.log('[OAuthCallback] OAuth callback started');

    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = cleanState(params.get('state'));
    const error = params.get('error');
    const errorDesc = params.get('error_description');

    const payload = {
      type: 'oauth_success',
      code,
      state,
      error,
      errorDescription: errorDesc,
    };

    console.log('[OAuthCallback] code:', code ? `present (${code.substring(0, 10)}...)` : 'MISSING');
    console.log('[OAuthCallback] state:', state || 'MISSING');
    console.log('[OAuthCallback] error:', error || 'none');
    console.log('[OAuthCallback] opener:', !!window.opener);
    console.log('[OAuthCallback] origin:', window.location.origin);

    // Strategy 1: postMessage to opener (fast path)
    if (window.opener) {
      try {
        window.opener.postMessage(payload, '*');
        console.log('[OAuthCallback] Strategy 1: postMessage sent to opener');
      } catch (e) {
        console.log('[OAuthCallback] Strategy 1: postMessage to opener failed:', e);
      }
    } else {
      console.log('[OAuthCallback] Strategy 1: No opener (iframe sandbox strips it)');
    }

    // Strategy 2: BroadcastChannel (works without opener, same-origin)
    try {
      const bc = new BroadcastChannel('oauth_result_channel');
      bc.postMessage(payload);
      console.log('[OAuthCallback] Strategy 2: BroadcastChannel sent');
      setTimeout(() => { try { bc.close(); } catch (_) { } }, 1000);
    } catch (e) {
      console.log('[OAuthCallback] Strategy 2: BroadcastChannel not available:', e);
    }

    // Strategy 3: localStorage (parent polls this)
    try {
      localStorage.setItem('oauth_result', JSON.stringify(payload));
      console.log('[OAuthCallback] Strategy 3: localStorage set');
    } catch (e) {
      console.log('[OAuthCallback] Strategy 3: localStorage not available:', e);
    }

    // Strategy 4: Server relay with RETRY (MOST RELIABLE for iframe sandboxes)
    // Store under BOTH cleaned state AND raw state for maximum compatibility
    if (code || error) {
      setStatusMsg('Sending to server…');
      const rawState = params.get('state');

      // Primary: cleaned state
      postRelayWithRetry(code, state, error, errorDesc).then(ok => {
        if (ok) {
          setStatus(error ? 'error' : 'success');
          setStatusMsg(error ? (errorDesc || error) : 'Connected! You can close this window.');

          // Auto-close popup after relay success
          if (!error) {
            setTimeout(() => { try { window.close(); } catch (_) { } }, 3000);
          }
        } else {
          setStatusMsg('Server relay failed — your app may still detect the result.');
        }
      });

      // Also store under raw state if different (best-effort)
      if (rawState && rawState !== state) {
        postRelayWithRetry(code, rawState, error, errorDesc, 2);
      }
    } else {
      setStatus('error');
      setStatusMsg('No authorization code received.');
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 to-purple-100">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full text-center">
        {status === 'sending' && (
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        )}
        {status === 'success' && (
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
        {status === 'error' && (
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        )}
        <h2 className="text-lg font-bold text-gray-900 mb-2">
          {status === 'sending' ? 'Completing connection…' : status === 'success' ? 'Connected!' : 'Connection Issue'}
        </h2>
        <p className="text-sm text-gray-500">{statusMsg}</p>
      </div>
    </div>
  );
}
