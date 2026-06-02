// ═══════════════════════════════════════════════════════════════════════════════
// UNIVERSAL PROVIDER CONNECT
//
// Fetch-based popup flow for Figma's sandboxed iframe:
//
//   1. preOpenPopup() — open about:blank popup (user-gesture, named 'oauthPopup')
//   2. fetch('/initiate') — get provider auth URL (with auth header)
//   3. Navigate popup via 4 escalating strategies
//   4. Provider redirects to /oauth-callback.html (static file or SPA)
//   5. Callback page posts code to relay-store
//   6. Parent polls relay → gets code
//   7. fetch('/callback') — exchange code for token
//
// NAVIGATION STRATEGIES (in order):
//   A. window.open(authUrl, 'oauthPopup') — reuses named window (most reliable)
//   B. popup.location.href = authUrl — direct assignment
//   C. popup.location.replace(authUrl) — no history entry
//   D. Manual clickable link in popup document (ultimate fallback)
// ═══════════════════════════════════════════════════════════════════════════════

import { preOpenPopup, waitForOAuthResult, type OAuthResult } from './oauthEngine';
import { serverFetch } from '../utils/serverFetch';

export interface ConnectResult {
  success: boolean;
  account?: {
    id: string;
    platform: string;
    username?: string;
    name?: string;
    accessToken?: string;
    expiresAt?: number;
  };
  error?: string;
  demoMode?: boolean;
}

/**
 * Navigate the popup to the provider's auth URL using 4 escalating strategies.
 *
 * In Figma's iframe sandbox, setting popup.location.href from the parent frame
 * may silently fail, and document.write may not execute scripts. The most
 * reliable method is window.open(url, 'oauthPopup') which tells the browser
 * to navigate the existing named window.
 *
 * As an ultimate fallback, we write a clickable link into the popup document
 * so the user can manually click through even if all auto-navigation fails.
 */
function navigatePopup(popup: Window, url: string): void {
  let navigated = false;

  // Strategy A: window.open() with same window name — tells the browser
  // to navigate the existing named popup. This is the most reliable method
  // because it uses the browser's native window-name lookup, bypassing
  // any sandbox restrictions on cross-frame document/location access.
  try {
    const ref = window.open(url, 'oauthPopup');
    if (ref) {
      console.log('[ConnectProvider] navigatePopup — Strategy A: window.open(url, name) succeeded');
      navigated = true;
    } else {
      console.log('[ConnectProvider] navigatePopup — Strategy A: window.open returned null');
    }
  } catch (e) {
    console.warn('[ConnectProvider] navigatePopup — Strategy A failed:', e);
  }

  // Strategy B: Direct location.href (classic approach)
  if (!navigated) {
    try {
      popup.location.href = url;
      console.log('[ConnectProvider] navigatePopup — Strategy B: location.href set');
      navigated = true;
    } catch (e) {
      console.warn('[ConnectProvider] navigatePopup — Strategy B failed:', e);
    }
  }

  // Strategy C: location.replace (no history entry)
  if (!navigated) {
    try {
      popup.location.replace(url);
      console.log('[ConnectProvider] navigatePopup — Strategy C: location.replace used');
      navigated = true;
    } catch (e) {
      console.warn('[ConnectProvider] navigatePopup — Strategy C failed:', e);
    }
  }

  // Strategy D (ALWAYS): Write a clickable link into the popup as manual fallback.
  // Even if auto-navigation worked, the popup may not have actually navigated
  // (sandbox can swallow the navigation silently). The link ensures the user
  // can always proceed.
  //
  // We delay this slightly so it doesn't overwrite a successful navigation.
  // If the popup has navigated to a cross-origin page, document.write will
  // throw (which we catch) — that's actually GOOD because it means nav worked.
  setTimeout(() => {
    try {
      // Test if we can still access the popup's document (same-origin = still on about:blank)
      const href = popup.location.href;
      if (href === 'about:blank' || href === '' || href === 'about:blank#') {
        console.warn('[ConnectProvider] navigatePopup — Popup STILL at about:blank after 2s! Writing manual link.');
        // The popup hasn't navigated. Write a manual fallback page.
        const safeUrl = url.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
        popup.document.open();
        popup.document.write(
          '<!DOCTYPE html><html><head><title>Continue to Login</title>' +
          '<meta http-equiv="refresh" content="1;url=' + safeUrl + '">' +
          '</head><body style="display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:system-ui,sans-serif;background:#f8f9fa">' +
          '<div style="text-align:center;max-width:400px;padding:2rem">' +
          '<div style="width:40px;height:40px;border:4px solid #6366f1;border-top-color:transparent;border-radius:50%;animation:spin 1s linear infinite;margin:0 auto 16px"></div>' +
          '<p style="color:#333;margin-bottom:16px;font-size:16px">Redirecting to login...</p>' +
          '<p style="color:#666;margin-bottom:20px;font-size:14px">If you are not redirected automatically:</p>' +
          '<a href="' + safeUrl + '" style="display:inline-block;padding:12px 32px;background:#6366f1;color:white;text-decoration:none;border-radius:8px;font-size:16px;font-weight:600">Click Here to Continue</a>' +
          '<p style="color:#999;font-size:11px;margin-top:20px;word-break:break-all">Debug: ' + url.substring(0, 80) + '...</p>' +
          '</div>' +
          '<style>@keyframes spin{to{transform:rotate(360deg)}}</style>' +
          '</body></html>'
        );
        popup.document.close();
      } else {
        console.log('[ConnectProvider] navigatePopup — Popup at:', href.substring(0, 60), '(navigation may be in progress)');
      }
    } catch (_) {
      // Cross-origin error — popup HAS navigated away from about:blank (good!)
      console.log('[ConnectProvider] navigatePopup — Popup confirmed navigated (cross-origin)');
    }
  }, 2000);
}

/**
 * Full OAuth flow for any provider.
 * IMPORTANT: Must be called from a synchronous click handler (no awaits before this call).
 */
export async function connectProvider(platform: string): Promise<ConnectResult> {
  console.log(`[ConnectProvider] ════════════════════════════════════════`);
  console.log(`[ConnectProvider] Starting OAuth for: ${platform}`);
  console.log(`[ConnectProvider] Origin: ${window.location.origin}`);

  // ── Phase 1: Open popup SYNCHRONOUSLY (preserves user-gesture context) ───
  const popup = preOpenPopup();
  console.log(`[ConnectProvider] Phase 1 — Popup: ${popup ? 'OPENED' : 'BLOCKED'}`);

  try {
    /** // ── Phase 2: Get auth URL from server ──────────────────────────────────
    // Use /oauth-callback.html as redirect_uri — this matches the static file
    // in /public/ which is lightweight and boots instantly (no SPA needed).
    // The SPA's OAuthRouteGuard also handles this path as a fallback. */
    const callbackUrl = `${window.location.origin}/oauth-callback.html`;

    console.log(`[ConnectProvider] Phase 2 — Fetching auth URL…`);
    console.log(`[ConnectProvider] Phase 2 — redirect_uri: ${callbackUrl}`);

    const initiateRes = await serverFetch('/social-accounts/oauth/initiate', {
      method: 'POST',
      body: JSON.stringify({ platform, redirectUri: callbackUrl }),
    });

    if (!initiateRes.ok) {
      const err = await initiateRes.json().catch(() => ({ error: 'Failed to initiate OAuth' }));
      throw new Error(err.error || `Initiate failed: ${initiateRes.status}`);
    }

    const { authUrl, demoMode } = await initiateRes.json();

    if (demoMode) {
      console.log(`[ConnectProvider] Demo mode for ${platform}`);
      try { if (popup && !popup.closed) popup.close(); } catch (_) { }
      return { success: true, demoMode: true };
    }

    console.log(`[ConnectProvider] Phase 2 — Auth URL received (${authUrl.length} chars)`);
    console.log(`[ConnectProvider] Phase 2 — Auth URL: ${authUrl.substring(0, 200)}`);

    // ── Phase 3: Navigate popup to provider ────────────────────────────────
    if (!popup) {
      // In Figma's iframe sandbox, a full-page redirect to the OAuth provider
      // would navigate the entire iframe to Facebook/Google/etc., causing a
      // white screen since the iframe can't load those domains.
      // Instead, throw a descriptive error so the caller can show the user
      // a manual token paste fallback.
      const isInIframe = (() => { try { return window.self !== window.top; } catch (_) { return true; } })();
      if (isInIframe) {
        console.error('[ConnectProvider] Popup blocked in iframe — cannot do full-page redirect (would cause white screen)');
        throw new Error(
          'Popup was blocked by the browser. Since this app runs in an iframe, we cannot redirect the page. ' +
          'Please use the "Paste Access Token" option in the Settings tab instead, or try clicking the Connect button directly (not via Reconnect).'
        );
      }
      console.warn('[ConnectProvider] Popup blocked — full-page redirect');
      window.location.href = authUrl;
      return new Promise(() => { });
    }

    navigatePopup(popup, authUrl);
    console.log(`[ConnectProvider] Phase 3 — Navigation initiated`);

    // ── Phase 4: Wait for OAuth result via relay ───────────────────────────
    console.log(`[ConnectProvider] Phase 4 — Waiting for OAuth result (relay polling)…`);
    const oauthResult: OAuthResult = await waitForOAuthResult(popup, authUrl, 120_000);

    // ── Phase 5: Exchange code for token ───────────────────────────────────
    console.log(`[ConnectProvider] Phase 5 — Exchanging code (${oauthResult.code?.substring(0, 10)}…)`);
    const exchangeRes = await serverFetch('/social-accounts/oauth/callback', {
      method: 'POST',
      body: JSON.stringify({
        platform,
        code: oauthResult.code,
        state: oauthResult.state,
      }),
    });

    if (!exchangeRes.ok) {
      const err = await exchangeRes.json().catch(() => ({ error: 'Token exchange failed' }));
      throw new Error(err.error || `Token exchange failed: ${exchangeRes.status}`);
    }

    const exchangeData = await exchangeRes.json();
    if (exchangeData.error) throw new Error(exchangeData.error);

    console.log(`[ConnectProvider] ✓ ${platform} connected!`);
    return { success: true, account: exchangeData.account };

  } catch (error) {
    try { if (popup && !popup.closed) popup.close(); } catch (_) { }
    console.error(`[ConnectProvider] ✗ ${platform} failed:`, error);
    throw error;
  }
}
