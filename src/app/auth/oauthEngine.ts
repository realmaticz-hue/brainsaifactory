// ═══════════════════════════════════════════════════════════════════════════════
// UNIVERSAL OAUTH POPUP ENGINE
//
// Two-phase design to survive popup blockers:
//
//   Phase 1: preOpenPopup() — call SYNCHRONOUSLY in the click handler
//            Opens a blank popup while the user-gesture context is still alive.
//
//   Phase 2: waitForOAuthResult(popup) — call after getting the auth URL
//            Navigates the popup to the auth URL and waits for the code via:
//
//            Layer 1: postMessage        (fast — requires window.opener)
//            Layer 2: URL polling        (reliable — requires same-origin popup)
//            Layer 3: BroadcastChannel   (no opener needed, same-origin instant)
//            Layer 4: localStorage poll  (ultimate fallback, same-origin polling)
//            Layer 5: storage event      (fired by other tab writing localStorage)
//            Layer 6: SERVER RELAY POLL  (bypasses iframe storage partitioning!)
//            Layer 7: SMART POPUP CLOSE  (delayed detection — avoids cross-origin
//                     false positives by waiting 15s before checking popup.closed)
// ═══════════════════════════════════════════════════════════════════════════════

import { projectId, publicAnonKey } from '../utils/supabase/info';
import { resolveServerUrl } from '../utils/serverFetch';

const OAUTH_BC_CHANNEL = 'oauth_result_channel';
const OAUTH_LS_KEY = 'oauth_result';
const SERVER_BASE = resolveServerUrl('/social-accounts/oauth');
const RELAY_POLL_URL = `${SERVER_BASE}/relay-poll`;
const RELAY_CONSUME_URL = `${SERVER_BASE}/relay-consume`;

export function openOAuth(provider: string, authUrl: string) {

  const width = 600
  const height = 700
  const left = window.innerWidth / 2 - width / 2
  const top = window.innerHeight / 2 - height / 2

  const popup = window.open(
    authUrl,
    "oauthPopup",
    `width=${width},height=${height},left=${left},top=${top}`
  )

  return new Promise((resolve, reject) => {

    const timeout = setTimeout(() => {
      reject("OAuth timeout")
    }, 60000)

    window.addEventListener("message", function handler(event) {

      if (event.data?.type === "oauth_success") {

        clearTimeout(timeout)
        window.removeEventListener("message", handler)

        resolve(event.data)
      }

    })

  })
}

export async function connectProvider(provider: string) {

  const authUrl = `/api/oauth/start?provider=${provider}`

  const result: any = await openOAuth(provider, authUrl)

  const tokenRes = await fetch("/api/oauth/exchange", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(result)
  })

  return await tokenRes.json()
}

export interface OAuthResult {
  type: 'oauth_success';
  code: string;
  state: string;
}

/**
 * Clean state parameter — strip trailing path artifacts (e.g., /oauth/consent).
 */
function cleanState(raw: string | null | undefined): string {
  if (!raw) return '';
  if (raw.includes('/')) {
    const parts = raw.split('_');
    if (parts.length >= 3) {
      const cleaned = raw.replace(/\/.*$/, '');
      if (cleaned !== raw) {
        console.log(`[OAuthEngine] Cleaned state: '${raw}' -> '${cleaned}'`);
        return cleaned;
      }
    }
  }
  return raw;
}

/**
 * Phase 1: Open a blank popup SYNCHRONOUSLY inside a click handler.
 * Must be called before any `await` to preserve the user-gesture context.
 */
export function preOpenPopup(): Window | null {
  const width = 600;
  const height = 700;
  const left = Math.round(window.innerWidth / 2 - width / 2 + (window.screenX || window.screenLeft || 0));
  const top = Math.round(window.innerHeight / 2 - height / 2 + (window.screenY || window.screenTop || 0));

  const popup = window.open(
    'about:blank',
    'oauthPopup',
    `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`
  );

  if (popup) {
    try {
      popup.document.title = 'Connecting…';
      popup.document.body.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:system-ui,sans-serif;background:#f8f9fa">
          <div style="text-align:center">
            <div style="width:40px;height:40px;border:4px solid #6366f1;border-top-color:transparent;border-radius:50%;animation:spin 1s linear infinite;margin:0 auto 16px"></div>
            <p style="color:#666;margin:0">Connecting to your account…</p>
          </div>
        </div>
        <style>@keyframes spin{to{transform:rotate(360deg)}}</style>
      `;
    } catch (_) {
      // Cross-origin write might fail — OK
    }
  }

  return popup;
}

function clearStaleResult() {
  try { localStorage.removeItem(OAUTH_LS_KEY); } catch (_) { /* ignore */ }
}

function processPayload(
  data: any,
  onSuccess: (code: string, state: string) => void,
  onError: (err: Error) => void
): boolean {
  if (!data || data.type !== 'oauth_success') return false;
  if (data.error) {
    onError(new Error(data.errorDescription || data.error));
    return true;
  }
  if (data.code) {
    onSuccess(data.code, cleanState(data.state) || '');
    return true;
  }
  return false;
}

/**
 * Confirm receipt of a relay result so the server can clean up the KV entry.
 */
async function confirmRelayConsume(state: string): Promise<void> {
  try {
    await fetch(RELAY_CONSUME_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`,
      },
      body: JSON.stringify({ state }),
    });
    console.log('[OAuthEngine] Relay entry consumed/cleaned up');
  } catch (_) {
    // Best-effort cleanup — not critical
  }
}

/**
 * Phase 2: Wait for the OAuth authorization code via 7 layers of communication.
 * The popup should ALREADY be navigating to the auth URL (set by connectProvider
 * via popup.location.href). Do NOT try to navigate the popup here.
 * The authUrl is used to extract the state parameter for relay polling.
 */
export function waitForOAuthResult(
  popup: Window | null,
  authUrl: string,
  timeoutMs = 60_000
): Promise<OAuthResult> {
  // Popup was blocked — fall back to full-page redirect
  if (!popup) {
    console.warn('[OAuthEngine] Popup is null (was blocked) — falling back to full-page redirect');
    window.location.href = authUrl;
    return new Promise(() => { }); // navigating away
  }

  // NOTE: We do NOT check popup.closed here because in Figma's iframe sandbox,
  // Chromium reports popup.closed=true for cross-origin popups even when they're
  // still open. The popup is navigating to the provider's domain.
  // Layer 7 will handle genuine popup closure with verification (non-iframe only).
  try {
    console.log(`[OAuthEngine] Popup.closed=${popup.closed} (may be false positive in iframe)`);
  } catch (_) {
    console.log('[OAuthEngine] Popup.closed check threw (cross-origin — popup is navigating)');
  }

  clearStaleResult();

  // The popup was navigated to the provider's auth URL by connectProvider
  // (via popup.location.href from about:blank). Do NOT try to navigate it here —
  // it's already at or navigating to the provider's auth page.
  // The authUrl parameter is only used to extract the state for relay polling.
  console.log('[OAuthEngine] Popup already navigating to provider auth URL');

  return new Promise<OAuthResult>((resolve, reject) => {
    let settled = false;
    const startTime = Date.now();
    let relayPollCount = 0;
    let relayPollErrors = 0;
    let relayFoundOnce = false;

    function settle(fn: () => void) {
      if (settled) return;
      settled = true;
      cleanup();
      fn();
    }

    function handleSuccess(code: string, state: string) {
      settle(() => {
        tryClosePopup();
        // Confirm relay consumption (best-effort, don't block)
        confirmRelayConsume(state);
        resolve({ type: 'oauth_success', code, state });
      });
    }

    function handleError(err: Error) {
      settle(() => {
        tryClosePopup();
        reject(err);
      });
    }

    // ─── Layer 1: postMessage listener (fast path) ───────────────────────
    function messageHandler(event: MessageEvent) {
      if (settled) return;
      if (processPayload(event.data, handleSuccess, handleError)) {
        console.log('[OAuthEngine] Layer 1 — postMessage received');
      }
    }
    window.addEventListener('message', messageHandler);

    // ─── Layer 2: URL polling (reliable if same-origin) ──────────────────
    const callbackPath = '/oauth-callback';
    const urlPollTimer = setInterval(() => {
      if (settled) return;
      try {
        const href = popup.location.href;
        if (href && typeof href === 'string' && href !== 'about:blank') {
          const url = new URL(href);
          if (url.pathname === callbackPath ||
            url.pathname === callbackPath + '.html' ||
            url.pathname.startsWith(callbackPath)) {
            const code = url.searchParams.get('code');
            const state = cleanState(url.searchParams.get('state'));
            const error = url.searchParams.get('error');

            if (error) {
              console.log('[OAuthEngine] Layer 2 — URL poll detected error');
              handleError(new Error(url.searchParams.get('error_description') || error));
              return;
            }
            if (code) {
              console.log('[OAuthEngine] Layer 2 — URL poll detected code');
              handleSuccess(code, state || '');
              return;
            }
          }
        }
      } catch (_) {
        // Cross-origin — normal during Facebook navigation
      }
    }, 500);

    // ─── Layer 3: BroadcastChannel (no opener needed) ────────────────────
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel(OAUTH_BC_CHANNEL);
      bc.onmessage = (event) => {
        if (settled) return;
        if (processPayload(event.data, handleSuccess, handleError)) {
          console.log('[OAuthEngine] Layer 3 — BroadcastChannel received');
        }
      };
    } catch (_) {
      console.log('[OAuthEngine] BroadcastChannel not available');
    }

    // ─── Layer 4: localStorage polling ───────────────────────────────────
    const lsPollTimer = setInterval(() => {
      if (settled) return;
      try {
        const raw = localStorage.getItem(OAUTH_LS_KEY);
        if (!raw) return;
        localStorage.removeItem(OAUTH_LS_KEY);
        const data = JSON.parse(raw);
        if (processPayload(data, handleSuccess, handleError)) {
          console.log('[OAuthEngine] Layer 4 — localStorage poll received');
        }
      } catch (_) { /* ignore */ }
    }, 500);

    // ─── Layer 5: storage event ──────────────────────────────────────────
    function storageHandler(event: StorageEvent) {
      if (settled) return;
      if (event.key !== OAUTH_LS_KEY || !event.newValue) return;
      try {
        localStorage.removeItem(OAUTH_LS_KEY);
        const data = JSON.parse(event.newValue);
        if (processPayload(data, handleSuccess, handleError)) {
          console.log('[OAuthEngine] Layer 5 — storage event received');
        }
      } catch (_) { /* ignore */ }
    }
    window.addEventListener('storage', storageHandler);

    // ─── Layer 6: Server relay polling (MOST RELIABLE for iframe) ────────
    let oauthState: string | null = null;
    try {
      const authUrlObj = new URL(authUrl);
      oauthState = authUrlObj.searchParams.get('state');
    } catch (_) { /* ignore */ }

    const oauthStateCleaned = oauthState ? cleanState(oauthState) : null;

    if (oauthState) {
      console.log(`[OAuthEngine] Layer 6 — relay polling STARTED for state=${oauthState.substring(0, 30)}…`);
    } else {
      console.warn('[OAuthEngine] Layer 6 — DISABLED (no state in auth URL)');
    }

    // Guard against concurrent polls (async interval can overlap)
    let relayPollInFlight = false;

    const relayPollTimer = oauthState ? setInterval(async () => {
      if (settled || relayPollInFlight) return;
      relayPollInFlight = true;
      relayPollCount++;

      try {
        const elapsed = Math.round((Date.now() - startTime) / 1000);

        // Poll with the state the parent knows
        const res = await fetch(
          `${RELAY_POLL_URL}?state=${encodeURIComponent(oauthState!)}`,
          { headers: { 'Authorization': `Bearer ${publicAnonKey}` } }
        );

        if (res.ok) {
          const data = await res.json();
          if (data.found) {
            relayFoundOnce = true;
            console.log(`[OAuthEngine] Layer 6 — relay poll SUCCESS (${elapsed}s, poll #${relayPollCount})`);
            if (data.error) {
              handleError(new Error(data.errorDescription || data.error));
            } else if (data.code) {
              handleSuccess(data.code, data.state || '');
            }
            relayPollInFlight = false;
            return;
          }
        } else {
          relayPollErrors++;
          console.log(`[OAuthEngine] Layer 6 — poll HTTP ${res.status} (${elapsed}s, poll #${relayPollCount})`);
        }

        // If cleaned state differs, also try that
        if (oauthStateCleaned && oauthStateCleaned !== oauthState && !settled) {
          const res2 = await fetch(
            `${RELAY_POLL_URL}?state=${encodeURIComponent(oauthStateCleaned)}`,
            { headers: { 'Authorization': `Bearer ${publicAnonKey}` } }
          );
          if (res2.ok) {
            const data2 = await res2.json();
            if (data2.found) {
              relayFoundOnce = true;
              console.log(`[OAuthEngine] Layer 6 — relay poll SUCCESS via cleaned state (${elapsed}s)`);
              if (data2.error) {
                handleError(new Error(data2.errorDescription || data2.error));
              } else if (data2.code) {
                handleSuccess(data2.code, data2.state || '');
              }
              relayPollInFlight = false;
              return;
            }
          }
        }

        // Periodic status log every 10 polls
        if (relayPollCount % 10 === 0) {
          console.log(`[OAuthEngine] Layer 6 — still polling (${elapsed}s elapsed, ${relayPollCount} polls, ${relayPollErrors} errors)`);
        }
      } catch (e) {
        relayPollErrors++;
        console.log(`[OAuthEngine] Layer 6 — poll network error (poll #${relayPollCount}):`, e);
      } finally {
        relayPollInFlight = false;
      }
    }, 1000) : null;  // Poll every 1s (was 1.5s)

    // ─── Layer 7: Popup-closed detection ─────────────────────────────────
    //
    // CRITICAL: In Figma's sandboxed iframe, popup.closed is NEVER reliable.
    // Chromium reports popup.closed=true as soon as the popup navigates to a
    // cross-origin domain (Facebook, Supabase server, etc.), even though the
    // popup is still open. This is a browser security quirk, NOT a real close.
    //
    // In iframe environments, we COMPLETELY DISABLE popup.closed detection
    // and rely solely on:
    //   - Layer 6 (relay polling) for success detection
    //   - The overall timeout for failure detection
    //
    // Outside iframes, popup.closed is reliable so we use it normally.

    const isInIframe = (() => {
      try { return window.self !== window.top; } catch (_) { return true; }
    })();

    const POPUP_CHECK_ENABLED = !isInIframe;
    const CHECK_INTERVAL_MS = 2_000;
    const GRACE_PERIOD_MS = 8_000;
    const CONSECUTIVE_THRESHOLD = 3;

    let consecutiveClosedCount = 0;

    if (isInIframe) {
      console.log(`[OAuthEngine] Layer 7 — DISABLED (iframe environment — popup.closed is unreliable). Relying on relay polling + timeout.`);
    } else {
      console.log(`[OAuthEngine] Layer 7 — ENABLED (top-level window — popup.closed is reliable). grace=${GRACE_PERIOD_MS / 1000}s, threshold=${CONSECUTIVE_THRESHOLD}`);
    }

    const popupCheckTimer = POPUP_CHECK_ENABLED ? setInterval(() => {
      if (settled) return;
      const elapsed = Date.now() - startTime;

      // Don't check during grace period
      if (elapsed < GRACE_PERIOD_MS) return;

      try {
        if (popup.closed) {
          consecutiveClosedCount++;
          if (consecutiveClosedCount >= CONSECUTIVE_THRESHOLD) {
            console.log(`[OAuthEngine] Layer 7 — popup genuinely closed (${consecutiveClosedCount}x consecutive)`);
            handleError(new Error(
              'The authentication popup was closed before completing. ' +
              'Please tap the button to try again and complete sign-in in the popup window.'
            ));
          }
        } else {
          if (consecutiveClosedCount > 0) {
            console.log(`[OAuthEngine] Layer 7 — popup.closed was transient (reset from ${consecutiveClosedCount})`);
          }
          consecutiveClosedCount = 0;
        }
      } catch (_) {
        // Cross-origin access exception — popup is still navigating
        consecutiveClosedCount = 0;
      }
    }, CHECK_INTERVAL_MS) : null;

    // ─── Timeout ─────────────────────────────────────────────────────────
    const timeoutTimer = setTimeout(() => {
      const elapsed = Math.round((Date.now() - startTime) / 1000);

      // Try to read popup location for diagnostics
      let popupLocation = 'unknown';
      try {
        popupLocation = popup.location.href || 'empty';
      } catch (_) {
        popupLocation = 'cross-origin (navigated away from about:blank)';
      }

      let popupClosed = 'unknown';
      try { popupClosed = String(popup.closed); } catch (_) { }

      const diagnostics = [
        `elapsed=${elapsed}s`,
        `relayPolls=${relayPollCount}`,
        `relayErrors=${relayPollErrors}`,
        `relayFound=${relayFoundOnce}`,
        `popupClosed=${popupClosed}`,
        `popupLocation=${popupLocation}`,
        `state=${oauthState?.substring(0, 30) || 'none'}`,
      ].join(', ');
      console.error(`[OAuthEngine] TIMEOUT — ${diagnostics}`);

      // Determine likely cause based on diagnostics
      let likelyCause = '';
      if (popupLocation === 'about:blank' || popupLocation === '' || popupLocation === 'empty') {
        likelyCause = ' LIKELY CAUSE: Popup never navigated away from about:blank — all navigation strategies failed in this sandbox. ';
      } else if (popupClosed === 'true' && !relayFoundOnce) {
        likelyCause = ' LIKELY CAUSE: Popup closed without completing OAuth — check if redirect_uri is registered in your app settings. ';
      }

      settle(() => {
        tryClosePopup();
        reject(new Error(
          `OAuth timed out (${elapsed}s).${likelyCause}` +
          `Diagnostics: ${relayPollCount} relay polls, ${relayPollErrors} errors, popupAt=${popupLocation}. ` +
          `Tap the button to try again.`
        ));
      });
    }, timeoutMs);

    // ─── Cleanup ─────────────────────────────────────────────────────────
    function cleanup() {
      clearInterval(urlPollTimer);
      clearInterval(lsPollTimer);
      if (popupCheckTimer) clearInterval(popupCheckTimer);
      if (relayPollTimer) clearInterval(relayPollTimer);
      clearTimeout(timeoutTimer);
      window.removeEventListener('message', messageHandler);
      window.removeEventListener('storage', storageHandler);
      try { if (bc) bc.close(); } catch (_) { /* ignore */ }
      try { localStorage.removeItem(OAUTH_LS_KEY); } catch (_) { /* ignore */ }
    }

    function tryClosePopup() {
      try { if (popup && !popup.closed) popup.close(); } catch (_) { /* ignore */ }
    }
  });
}

/**
 * Legacy one-shot API (opens popup + waits).
 */
export function openOAuthPopup(
  provider: string,
  authUrl: string,
  timeoutMs = 60_000
): Promise<OAuthResult> {
  const popup = preOpenPopup();
  return waitForOAuthResult(popup, authUrl, timeoutMs);
}