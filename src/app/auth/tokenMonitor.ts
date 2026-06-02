// ═══════════════════════════════════════════════════════════════════════════════
// TOKEN EXPIRATION MONITOR
//
// Checks if OAuth tokens need refreshing and triggers auto-refresh.
// Runs on an interval when the app is active.
// ═══════════════════════════════════════════════════════════════════════════════

import { serverFetch } from '../utils/serverFetch';

export interface StoredToken {
  provider: string;
  access_token: string;
  refresh_token?: string;
  expires_at: number; // Unix timestamp (seconds)
}

/**
 * Returns true if the token expires within `bufferSeconds` from now.
 */
export function tokenNeedsRefresh(expiresAt: number, bufferSeconds = 300): boolean {
  const now = Date.now() / 1000;
  return now > (expiresAt - bufferSeconds);
}

/**
 * Calls the server to refresh an expired token.
 */
export async function refreshToken(
  provider: string,
  refreshToken: string
): Promise<StoredToken | null> {
  try {
    const res = await serverFetch('/social-accounts/oauth/refresh', {
      method: 'POST',
      body: JSON.stringify({ provider, refresh_token: refreshToken }),
    });

    if (!res.ok) {
      console.error(`[TokenMonitor] Refresh failed for ${provider}: HTTP ${res.status}`);
      return null;
    }

    const data = await res.json();
    if (data.error) {
      console.error(`[TokenMonitor] Refresh error for ${provider}:`, data.error);
      return null;
    }

    console.log(`[TokenMonitor] Token refreshed for ${provider}`);
    return data;
  } catch (err) {
    console.error(`[TokenMonitor] Refresh exception for ${provider}:`, err);
    return null;
  }
}

/**
 * Scans all connections and refreshes expired tokens.
 * Returns list of providers that failed to refresh (need reconnect).
 */
export async function monitorTokens(
  connections: Record<string, StoredToken>
): Promise<string[]> {
  const failedProviders: string[] = [];

  for (const provider in connections) {
    const token = connections[provider];
    if (!token.expires_at) continue;

    if (tokenNeedsRefresh(token.expires_at)) {
      if (token.refresh_token) {
        const newToken = await refreshToken(provider, token.refresh_token);
        if (newToken) {
          connections[provider] = newToken;
        } else {
          failedProviders.push(provider);
        }
      } else {
        // No refresh token — needs manual reconnect
        failedProviders.push(provider);
      }
    }
  }

  return failedProviders;
}
