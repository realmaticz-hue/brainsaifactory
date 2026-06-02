// ═══════════════════════════════════════════════════════════════════════════════
// SOCIAL TOKEN CACHE — Instant Reconnect Engine
// Handles: token preload, state caching, background refresh, account pre-loading
// Supports: Facebook, Instagram, LinkedIn, X, TikTok, YouTube, Pinterest
// ═══════════════════════════════════════════════════════════════════════════════

const CACHE_PREFIX = 'stc_'; // social token cache
const ACCOUNTS_CACHE_KEY = `${CACHE_PREFIX}accounts`;
const ACCOUNTS_CACHE_TS_KEY = `${CACHE_PREFIX}accounts_ts`;
const STATE_CACHE_KEY = `${CACHE_PREFIX}oauth_states`;
const TOKEN_STATUS_KEY = `${CACHE_PREFIX}token_status`;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes for account cache
const TOKEN_PREVALIDATE_BUFFER = 10 * 60 * 1000; // Pre-validate 10 min before expiry

// ── Types ──────────────────────────────────────────────────────────────────────

interface CachedTokenStatus {
  accountId: string;
  platform: string;
  valid: boolean;
  expiresAt: number;
  lastChecked: number;
  refreshing: boolean;
}

interface CachedOAuthState {
  platform: string;
  state: string;
  createdAt: number;
  expiresAt: number; // States expire after 10 minutes
}

interface CachedAccount {
  id: string;
  platform: string;
  username: string;
  status: string;
  profileImage?: string;
  accountType: string;
  metadata?: any;
  lastSynced?: number;
  expiresAt?: number;
}

// ── Secure Storage Helpers ─────────────────────────────────────────────────────
// Uses sessionStorage for tokens (cleared on tab close) and localStorage for
// non-sensitive account metadata cache

function setSession(key: string, value: any): void {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn('[TokenCache] sessionStorage write failed:', e);
  }
}

function getSession<T>(key: string): T | null {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setLocal(key: string, value: any): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn('[TokenCache] localStorage write failed:', e);
  }
}

function getLocal<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 1. ACCOUNT PRE-LOADING — Instant dashboard display from cache
// ═══════════════════════════════════════════════════════════════════════════════

export function getCachedAccounts(): CachedAccount[] | null {
  const ts = getLocal<number>(ACCOUNTS_CACHE_TS_KEY);
  if (!ts || Date.now() - ts > CACHE_TTL) return null;
  return getLocal<CachedAccount[]>(ACCOUNTS_CACHE_KEY);
}

export function setCachedAccounts(accounts: CachedAccount[]): void {
  setLocal(ACCOUNTS_CACHE_KEY, accounts);
  setLocal(ACCOUNTS_CACHE_TS_KEY, Date.now());
}

export function clearAccountsCache(): void {
  localStorage.removeItem(ACCOUNTS_CACHE_KEY);
  localStorage.removeItem(ACCOUNTS_CACHE_TS_KEY);
}

// ═══════════════════════════════════════════════════════════════════════════════
// 2. TOKEN STATUS CACHE — Track token validity per account
// ═══════════════════════════════════════════════════════════════════════════════

export function getTokenStatuses(): Record<string, CachedTokenStatus> {
  return getSession<Record<string, CachedTokenStatus>>(TOKEN_STATUS_KEY) || {};
}

export function setTokenStatus(accountId: string, status: Partial<CachedTokenStatus>): void {
  const all = getTokenStatuses();
  all[accountId] = { ...all[accountId], ...status, lastChecked: Date.now() } as CachedTokenStatus;
  setSession(TOKEN_STATUS_KEY, all);
}

export function isTokenValid(accountId: string): boolean {
  const statuses = getTokenStatuses();
  const status = statuses[accountId];
  if (!status) return false;
  // Valid if checked recently AND not expired (with buffer)
  const isRecent = Date.now() - status.lastChecked < CACHE_TTL;
  const notExpired = status.expiresAt > Date.now() + 60000; // 1 min buffer
  return isRecent && status.valid && notExpired;
}

export function isTokenExpiringSoon(accountId: string): boolean {
  const statuses = getTokenStatuses();
  const status = statuses[accountId];
  if (!status) return false;
  return status.expiresAt > 0 && status.expiresAt - Date.now() < TOKEN_PREVALIDATE_BUFFER;
}

export function isTokenRefreshing(accountId: string): boolean {
  const statuses = getTokenStatuses();
  return statuses[accountId]?.refreshing === true;
}

export function markRefreshing(accountId: string, refreshing: boolean): void {
  setTokenStatus(accountId, { refreshing });
}

// ═══════════════════════════════════════════════════════════════════════════════
// 3. STATE CACHE — Reuse OAuth state for fast reconnect
// ═══════════════════════════════════════════════════════════════════════════════

export function getCachedState(platform: string): string | null {
  const states = getSession<CachedOAuthState[]>(STATE_CACHE_KEY) || [];
  const cached = states.find(
    s => s.platform === platform && s.expiresAt > Date.now()
  );
  return cached?.state || null;
}

export function setCachedState(platform: string, state: string): void {
  const states = getSession<CachedOAuthState[]>(STATE_CACHE_KEY) || [];
  // Remove old states for this platform
  const filtered = states.filter(s => s.platform !== platform);
  filtered.push({
    platform,
    state,
    createdAt: Date.now(),
    expiresAt: Date.now() + 10 * 60 * 1000, // 10 min TTL
  });
  setSession(STATE_CACHE_KEY, filtered);
}

export function clearCachedState(platform: string): void {
  const states = getSession<CachedOAuthState[]>(STATE_CACHE_KEY) || [];
  setSession(STATE_CACHE_KEY, states.filter(s => s.platform !== platform));
}

export function clearAllStates(): void {
  sessionStorage.removeItem(STATE_CACHE_KEY);
}

// ═══════════════════════════════════════════════════════════════════════════════
// 4. RECONNECT TRACKER — Track reconnect attempts for UI feedback
// ═══════════════════════════════════════════════════════════════════════════════

interface ReconnectAttempt {
  platform: string;
  accountId: string;
  startedAt: number;
  status: 'refreshing' | 'success' | 'failed' | 'fallback_oauth';
  elapsed?: number;
  error?: string;
}

const reconnectAttempts: Map<string, ReconnectAttempt> = new Map();

export function startReconnectAttempt(accountId: string, platform: string): void {
  reconnectAttempts.set(accountId, {
    platform,
    accountId,
    startedAt: Date.now(),
    status: 'refreshing',
  });
}

export function updateReconnectAttempt(
  accountId: string,
  status: ReconnectAttempt['status'],
  error?: string
): void {
  const attempt = reconnectAttempts.get(accountId);
  if (attempt) {
    attempt.status = status;
    attempt.elapsed = Date.now() - attempt.startedAt;
    if (error) attempt.error = error;
  }
}

export function getReconnectAttempt(accountId: string): ReconnectAttempt | undefined {
  return reconnectAttempts.get(accountId);
}

export function clearReconnectAttempt(accountId: string): void {
  reconnectAttempts.delete(accountId);
}

export function getActiveReconnects(): ReconnectAttempt[] {
  return Array.from(reconnectAttempts.values()).filter(
    a => a.status === 'refreshing'
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 5. BACKGROUND PRE-VALIDATION — Check tokens before user triggers reconnect
// ═══════════════════════════════════════════════════════════════════════════════

let prevalidationTimer: ReturnType<typeof setInterval> | null = null;

export function startPrevalidation(
  accounts: CachedAccount[],
  validateFn: (accountId: string) => Promise<{ valid: boolean; expiresAt?: number }>
): void {
  stopPrevalidation();

  // Immediately pre-validate all accounts
  accounts.forEach(async (acc) => {
    if (acc.status !== 'active') return;
    try {
      const result = await validateFn(acc.id);
      setTokenStatus(acc.id, {
        accountId: acc.id,
        platform: acc.platform,
        valid: result.valid,
        expiresAt: result.expiresAt || (acc.expiresAt || 0),
        refreshing: false,
      });
    } catch {
      // Silent fail — will validate on demand
    }
  });

  // Re-validate every 3 minutes
  prevalidationTimer = setInterval(() => {
    accounts.forEach(async (acc) => {
      if (acc.status !== 'active') return;
      // Only re-validate if expiring soon
      if (isTokenExpiringSoon(acc.id)) {
        try {
          const result = await validateFn(acc.id);
          setTokenStatus(acc.id, {
            accountId: acc.id,
            platform: acc.platform,
            valid: result.valid,
            expiresAt: result.expiresAt || (acc.expiresAt || 0),
            refreshing: false,
          });
        } catch { /* silent */ }
      }
    });
  }, 3 * 60 * 1000);
}

export function stopPrevalidation(): void {
  if (prevalidationTimer) {
    clearInterval(prevalidationTimer);
    prevalidationTimer = null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 6. CACHE CLEANUP
// ═══════════════════════════════════════════════════════════════════════════════

export function clearAllCaches(): void {
  clearAccountsCache();
  clearAllStates();
  sessionStorage.removeItem(TOKEN_STATUS_KEY);
  reconnectAttempts.clear();
  stopPrevalidation();
}
