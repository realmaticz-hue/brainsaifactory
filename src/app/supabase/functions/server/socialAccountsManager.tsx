// Social Accounts Manager - OAuth & Multi-Platform Integration
// Handles OAuth flows, token refresh, and cross-platform API normalization

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

import * as kv from "./kv_store.tsx";

// ══════════════════════════════════════════════════════════════════════════════
// TYPES & INTERFACES
// ══════════════════════════════════════════════════════════════════════════════

interface ConnectedAccount {
  id: string;
  platform: string;
  accountType: 'personal' | 'business' | 'group';
  username: string;
  profileImage?: string;
  status: 'active' | 'expired' | 'restricted' | 'needs_attention';
  lastSynced?: number;
  metadata?: {
    followers?: number;
    engagement?: number;
    permissions?: string[];
  };
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
  priority?: number;
}

interface AuditLog {
  id: string;
  action: string;
  target: string;
  timestamp: number;
  details?: any;
}

// ══════════════════════════════════════════════════════════════════════════════
// OAUTH CONFIGURATIONS
// ══════════════════════════════════════════════════════════════════════════════

const getOAuthConfig = async (platform: string) => {
  const configs: Record<string, any> = {
    facebook: {
      authUrl: 'https://www.facebook.com/v21.0/dialog/oauth',
      tokenUrl: 'https://graph.facebook.com/v21.0/oauth/access_token',
      scope: 'pages_manage_posts,pages_read_engagement,instagram_basic,instagram_content_publish',
      clientId: Deno.env.get('FACEBOOK_APP_ID'),
      clientSecret: Deno.env.get('FACEBOOK_APP_SECRET'),
    },
    instagram: {
      authUrl: 'https://api.instagram.com/oauth/authorize',
      tokenUrl: 'https://api.instagram.com/oauth/access_token',
      scope: 'user_profile,user_media',
      clientId: Deno.env.get('INSTAGRAM_CLIENT_ID'),
      clientSecret: Deno.env.get('INSTAGRAM_CLIENT_SECRET'),
    },
    twitter: {
      authUrl: 'https://twitter.com/i/oauth2/authorize',
      tokenUrl: 'https://api.twitter.com/2/oauth2/token',
      scope: 'tweet.read tweet.write users.read offline.access',
      clientId: Deno.env.get('TWITTER_CLIENT_ID'),
      clientSecret: Deno.env.get('TWITTER_CLIENT_SECRET'),
    },
    linkedin: {
      authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
      tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
      scope: 'w_member_social r_basicprofile',
      clientId: Deno.env.get('LINKEDIN_CLIENT_ID'),
      clientSecret: Deno.env.get('LINKEDIN_CLIENT_SECRET'),
    },
    tiktok: {
      authUrl: 'https://www.tiktok.com/auth/authorize/',
      tokenUrl: 'https://open-api.tiktok.com/oauth/access_token/',
      scope: 'user.info.basic,video.list,video.upload',
      clientId: Deno.env.get('TIKTOK_CLIENT_KEY'),
      clientSecret: Deno.env.get('TIKTOK_CLIENT_SECRET'),
    },
    pinterest: {
      authUrl: 'https://www.pinterest.com/oauth/',
      tokenUrl: 'https://api.pinterest.com/v5/oauth/token',
      scope: 'boards:read,pins:read,pins:write',
      clientId: Deno.env.get('PINTEREST_APP_ID'),
      clientSecret: Deno.env.get('PINTEREST_APP_SECRET'),
    },
    youtube: {
      authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      scope: 'https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly',
      clientId: Deno.env.get('YOUTUBE_CLIENT_ID'),
      clientSecret: Deno.env.get('YOUTUBE_CLIENT_SECRET'),
    },
  };

  const config = configs[platform];

  // If environment variables are not set, check KV store for saved credentials
  if (config && (!config.clientId || !config.clientSecret)) {
    try {
      const savedCreds = await kv.get(`oauth_creds_${platform}`);
      if (savedCreds) {
        const decryptedId = await decryptToken(savedCreds.clientId);
        const decryptedSecret = await decryptToken(savedCreds.clientSecret);
        config.clientId = decryptedId;
        config.clientSecret = decryptedSecret;
        console.log(`[OAuth] Using saved credentials for ${platform} from KV store`);
      }
    } catch (error) {
      console.error(`[OAuth] Error loading saved credentials for ${platform}:`, error);
    }
  }

  return config;
};

/**
 * Public accessor for OAuth config (used by /start endpoint for server-side redirects).
 * Returns { authUrl, scope, clientId } without exposing clientSecret.
 */
export async function getOAuthConfigPublic(platform: string): Promise<{ authUrl: string; scope: string; clientId: string } | null> {
  const config = await getOAuthConfig(platform);
  if (!config || !config.clientId) return null;
  return { authUrl: config.authUrl, scope: config.scope, clientId: config.clientId };
}

// ══════════════════════════════════════════════════════════════════════════════
// CORE FUNCTIONS
// ══════════════════════════════════════════════════════════════════════════════

export async function getAllAccounts(): Promise<{ accounts: ConnectedAccount[]; auditLogs: AuditLog[] }> {
  const accounts = await kv.get('social_accounts') || [];
  const auditLogs = await kv.get('social_audit_logs') || [];
  return { accounts, auditLogs };
}

export async function initiateOAuth(platform: string, redirectUri: string): Promise<{ authUrl: string; demoMode?: boolean }> {
  const config = await getOAuthConfig(platform);

  // SECURITY CHECK: Ensure redirect URI uses HTTPS
  if (redirectUri && !redirectUri.startsWith('https://') && !redirectUri.startsWith('http://localhost')) {
    console.warn(`[OAuth Security] Redirect URI should use HTTPS: ${redirectUri}`);
    // Auto-fix to HTTPS if it's HTTP
    if (redirectUri.startsWith('http://')) {
      redirectUri = redirectUri.replace('http://', 'https://');
      console.log(`[OAuth Security] Auto-corrected to HTTPS: ${redirectUri}`);
    }
  }

  console.log(`[OAuth] Initiating OAuth for ${platform}`);
  console.log(`[OAuth] Redirect URI: ${redirectUri}`);
  console.log(`[OAuth] Protocol: ${redirectUri.split('://')[0]}`);

  if (!config || !config.clientId) {
    // Demo mode: Return a mock auth URL that will trigger demo account creation
    console.log(`[OAuth] Credentials not configured for ${platform}. Using demo mode.`);
    const demoState = `demo_${platform}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    await kv.set(`oauth_state_${demoState}`, { platform, timestamp: Date.now(), demo: true });

    // Return a demo URL that points back to the callback with demo credentials
    return { authUrl: `demo://${platform}?state=${demoState}&demo=true`, demoMode: true };
  }

  // Generate state for CSRF protection
  const state = `${platform}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  await kv.set(`oauth_state_${state}`, { platform, timestamp: Date.now(), redirectUri });

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: redirectUri,
    scope: config.scope,
    response_type: 'code',
    state,
  });

  if (platform === 'twitter') {
    params.append('code_challenge', 'challenge');
    params.append('code_challenge_method', 'plain');
  }

  const authUrl = `${config.authUrl}?${params.toString()}`;
  console.log(`[OAuth] Generated auth URL for ${platform}`);
  console.log(`[OAuth] Full auth URL: ${authUrl.substring(0, 150)}...`);

  return { authUrl };
}

export async function handleOAuthCallback(
  platform: string,
  code: string,
  state: string,
  redirectUri: string
): Promise<{ account: ConnectedAccount }> {
  // Clean state: strip trailing path artifacts (e.g., /oauth/consent)
  let cleanedState = state;
  if (state && state.includes('/')) {
    const parts = state.split('_');
    if (parts.length >= 3) {
      const stripped = state.replace(/\/.*$/, '');
      if (stripped !== state) {
        console.log(`[OAuth] Cleaned state: '${state}' -> '${stripped}'`);
        cleanedState = stripped;
      }
    }
  }

  // Verify state — try cleaned state first, then raw state
  let stateData = await kv.get(`oauth_state_${cleanedState}`);
  let usedStateKey = `oauth_state_${cleanedState}`;
  if (!stateData && cleanedState !== state) {
    stateData = await kv.get(`oauth_state_${state}`);
    usedStateKey = `oauth_state_${state}`;
  }
  if (!stateData || stateData.platform !== platform) {
    console.error(`[OAuth] State verification failed. state='${state}', cleanedState='${cleanedState}', platform='${platform}', stateData:`, stateData);
    throw new Error(`Invalid OAuth state (state='${cleanedState}', platform='${platform}')`);
  }

  // Delete used state
  await kv.del(usedStateKey);
  // Also clean up the alternate key if it exists
  if (cleanedState !== state) {
    try { await kv.del(`oauth_state_${state}`); } catch (_) { }
    try { await kv.del(`oauth_state_${cleanedState}`); } catch (_) { }
  }

  // Handle demo mode
  if (stateData.demo) {
    return await createDemoAccount(platform);
  }

  // Use the redirect URI from the state data if not provided by the callback
  // This ensures the token exchange uses the exact same URI that was registered
  const finalRedirectUri = redirectUri || stateData.redirectUri;
  if (!finalRedirectUri) {
    throw new Error('Missing redirect URI for token exchange');
  }

  const config = await getOAuthConfig(platform);

  // Exchange code for access token
  console.log(`[OAuth] Exchanging code for token with redirect_uri: ${finalRedirectUri}`);

  let tokenData: any;

  if (platform === 'facebook' || platform === 'instagram') {
    // Facebook Graph API requires GET with query parameters for token exchange.
    // If the Facebook App is configured as a "native/desktop" app (in App Dashboard),
    // passing client_secret triggers: "app is configured as a desktop app".
    // Strategy: try WITHOUT client_secret first (desktop/native mode), then WITH it (web mode).
    const baseTokenUrl = new URL(config.tokenUrl);
    baseTokenUrl.searchParams.set('client_id', config.clientId);
    baseTokenUrl.searchParams.set('code', code);
    baseTokenUrl.searchParams.set('redirect_uri', finalRedirectUri);

    // Attempt 1: Without client_secret (works for native/desktop-configured apps)
    console.log(`[OAuth] Attempting GET for ${platform} token exchange WITHOUT client_secret`);
    let tokenResponse = await fetch(baseTokenUrl.toString(), {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });

    if (!tokenResponse.ok) {
      const errorText1 = await tokenResponse.text();
      console.log(`[OAuth] Attempt 1 failed (no client_secret): ${errorText1}`);

      // Attempt 2: With client_secret (works for web-configured apps)
      baseTokenUrl.searchParams.set('client_secret', config.clientSecret);
      console.log(`[OAuth] Retrying GET for ${platform} token exchange WITH client_secret`);
      tokenResponse = await fetch(baseTokenUrl.toString(), {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });

      if (!tokenResponse.ok) {
        const errorText2 = await tokenResponse.text();
        console.error(`[OAuth] Attempt 2 also failed (with client_secret): ${errorText2}`);
        throw new Error(`Token exchange failed: ${errorText2}`);
      }
    }

    tokenData = await tokenResponse.json();
    console.log(`[OAuth] ${platform} token exchange succeeded, got access_token: ${tokenData.access_token ? 'YES' : 'NO'}`);
  } else {
    // Standard OAuth 2.0 POST for other providers
    const tokenResponse = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code,
        redirect_uri: finalRedirectUri,
        grant_type: 'authorization_code',
      }).toString(),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      throw new Error(`Token exchange failed: ${errorText}`);
    }
    tokenData = await tokenResponse.json();
  }

  const accessToken = tokenData.access_token;
  const refreshToken = tokenData.refresh_token;
  const expiresIn = tokenData.expires_in || 3600;

  // Fetch user profile
  const profile = await fetchUserProfile(platform, accessToken);

  // Create account entry
  const account: ConnectedAccount = {
    id: `${platform}_${Date.now()}`,
    platform,
    accountType: profile.accountType || 'personal',
    username: profile.username || 'Unknown',
    profileImage: profile.profileImage,
    status: 'active',
    lastSynced: Date.now(),
    metadata: {
      followers: profile.followers,
      engagement: profile.engagement,
      permissions: tokenData.scope?.split(',') || [],
    },
    accessToken: await encryptToken(accessToken),
    refreshToken: refreshToken ? await encryptToken(refreshToken) : undefined,
    expiresAt: Date.now() + (expiresIn * 1000),
    priority: 0,
  };

  // Save account
  const accounts = await kv.get('social_accounts') || [];
  accounts.push(account);
  await kv.set('social_accounts', accounts);

  // Add audit log
  await addAuditLog('account_connected', account.id);

  return { account };
}

async function fetchUserProfile(platform: string, accessToken: string): Promise<any> {
  const endpoints: Record<string, string> = {
    facebook: 'https://graph.facebook.com/v21.0/me?fields=id,name,picture',
    instagram: 'https://graph.instagram.com/me?fields=id,username,profile_picture_url',
    twitter: 'https://api.twitter.com/2/users/me',
    linkedin: 'https://api.linkedin.com/v2/me',
    tiktok: 'https://open-api.tiktok.com/user/info/',
    pinterest: 'https://api.pinterest.com/v5/user_account',
    youtube: 'https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true',
  };

  const endpoint = endpoints[platform];
  if (!endpoint) {
    return { username: 'Unknown', accountType: 'personal' };
  }

  try {
    const response = await fetch(endpoint, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`Failed to fetch profile for ${platform}`);
      return { username: 'Unknown', accountType: 'personal' };
    }

    const data = await response.json();

    // Normalize response
    if (platform === 'facebook') {
      return {
        username: data.name,
        profileImage: data.picture?.data?.url,
        accountType: 'personal',
      };
    }

    if (platform === 'instagram') {
      return {
        username: data.username,
        profileImage: data.profile_picture_url,
        accountType: 'business',
      };
    }

    if (platform === 'twitter') {
      return {
        username: data.data?.username,
        profileImage: data.data?.profile_image_url,
        accountType: 'personal',
        followers: data.data?.public_metrics?.followers_count,
      };
    }

    if (platform === 'linkedin') {
      return {
        username: `${data.localizedFirstName} ${data.localizedLastName}`,
        accountType: 'personal',
      };
    }

    if (platform === 'youtube') {
      // YouTube API response - using computed property access
      const items = data.items || [];
      const firstItem = items[0];
      const snippet = firstItem?.snippet;
      const title = snippet?.title || 'YouTube Channel';
      const thumbs = snippet?.thumbnails;
      const thumbKey = 'default';
      const thumbnail = thumbs ? thumbs[thumbKey] : null;
      const imageUrl = thumbnail?.url;

      return {
        username: title,
        profileImage: imageUrl,
        accountType: 'personal',
      };
    }

    // Fallback for unknown platforms
    return { username: 'Unknown', accountType: 'personal' };
  } catch (error) {
    console.error(`Error fetching profile for ${platform}:`, error);
    return { username: 'Unknown', accountType: 'personal' };
  }
}

export async function autoReconnect(accountId: string): Promise<{ success: boolean; accessToken?: string; expiresAt?: number }> {
  const accounts = await kv.get('social_accounts') || [];
  const account = accounts.find((a: ConnectedAccount) => a.id === accountId);

  if (!account || !account.refreshToken) {
    return { success: false };
  }

  const config = await getOAuthConfig(account.platform);
  if (!config) {
    return { success: false };
  }

  try {
    const refreshToken = await decryptToken(account.refreshToken);

    const response = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }).toString(),
    });

    if (!response.ok) {
      await addAuditLog('auto_reconnect_failed', accountId);
      return { success: false };
    }

    const data = await response.json();
    const newAccessToken = data.access_token;
    const expiresIn = data.expires_in || 3600;
    const newExpiresAt = Date.now() + (expiresIn * 1000);

    // Encrypt the new token before updating
    const encryptedToken = await encryptToken(newAccessToken);

    // Update account
    const updatedAccounts = accounts.map((a: ConnectedAccount) =>
      a.id === accountId
        ? {
          ...a,
          accessToken: encryptedToken,
          expiresAt: newExpiresAt,
          status: 'active',
          lastSynced: Date.now(),
        }
        : a
    );

    await kv.set('social_accounts', updatedAccounts);
    await addAuditLog('auto_reconnect_success', accountId);

    return { success: true, accessToken: newAccessToken, expiresAt: newExpiresAt };
  } catch (error) {
    console.error(`Auto-reconnect failed for ${accountId}:`, error);
    await addAuditLog('auto_reconnect_failed', accountId);
    return { success: false };
  }
}

export async function disconnectAccount(accountId: string): Promise<void> {
  const accounts = await kv.get('social_accounts') || [];
  const filtered = accounts.filter((a: ConnectedAccount) => a.id !== accountId);
  await kv.set('social_accounts', filtered);
  await addAuditLog('account_disconnected', accountId);
}

export async function testConnection(accountId: string): Promise<{ success: boolean; message?: string; error?: string }> {
  const accounts = await kv.get('social_accounts') || [];
  const account = accounts.find((a: ConnectedAccount) => a.id === accountId);

  if (!account) {
    return { success: false, error: 'Account not found' };
  }

  try {
    const accessToken = await decryptToken(account.accessToken!);
    const profile = await fetchUserProfile(account.platform, accessToken);

    if (profile.username !== 'Unknown') {
      return { success: true, message: `Connected as ${profile.username}` };
    } else {
      return { success: false, error: 'Failed to fetch profile' };
    }
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateAccountPriority(accountId: string, priority: number): Promise<void> {
  const accounts = await kv.get('social_accounts') || [];
  const updated = accounts.map((a: ConnectedAccount) =>
    a.id === accountId ? { ...a, priority } : a
  );
  await kv.set('social_accounts', updated);
}

export async function generateAISuggestions(accounts: ConnectedAccount[]): Promise<{ suggestions: string[] }> {
  const suggestions: string[] = [];

  // Check for expired or needs attention accounts
  const expiredCount = accounts.filter(a => a.status === 'expired').length;
  const needsAttention = accounts.filter(a => a.status === 'needs_attention').length;

  if (expiredCount > 0) {
    suggestions.push(`${expiredCount} account${expiredCount > 1 ? 's' : ''} have expired tokens. Click "Reconnect" to restore access.`);
  }

  if (needsAttention > 0) {
    suggestions.push(`${needsAttention} account${needsAttention > 1 ? 's need' : ' needs'} attention. Review permissions or settings.`);
  }

  // Check for inactive accounts (not synced in 30 days)
  const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
  const inactive = accounts.filter(a => a.lastSynced && a.lastSynced < thirtyDaysAgo).length;

  if (inactive > 0) {
    suggestions.push(`${inactive} account${inactive > 1 ? 's have' : ' has'} been inactive for over 30 days. Consider removing if not needed.`);
  }

  // Suggest popular platforms not yet connected
  const connectedPlatforms = accounts.map(a => a.platform);
  const popularPlatforms = ['facebook', 'instagram', 'twitter', 'linkedin'];
  const missing = popularPlatforms.filter(p => !connectedPlatforms.includes(p));

  if (missing.length > 0 && accounts.length > 0) {
    suggestions.push(`Consider connecting to ${missing.join(', ')} to expand your reach.`);
  }

  if (accounts.length === 0) {
    suggestions.push('Start by connecting your first social media account. Facebook and Instagram are great choices for content distribution.');
  }

  return { suggestions };
}

async function addAuditLog(action: string, target: string, details?: any): Promise<void> {
  const logs = await kv.get('social_audit_logs') || [];
  const log: AuditLog = {
    id: `log_${Date.now()}`,
    action,
    target,
    timestamp: Date.now(),
    details,
  };
  logs.unshift(log);
  await kv.set('social_audit_logs', logs.slice(0, 100));
}

// ══════════════════════════════════════════════════════════════════════════════
// TOKEN VALIDATION & BACKGROUND REFRESH — Instant Reconnect Engine
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Validate an account's token without performing a full reconnect.
 * Returns validity status and remaining lifetime.
 */
export async function validateToken(accountId: string): Promise<{
  valid: boolean;
  expiresAt: number;
  platform: string;
  username: string;
  needsRefresh: boolean;
}> {
  const accounts = await kv.get('social_accounts') || [];
  const account = accounts.find((a: ConnectedAccount) => a.id === accountId);

  if (!account) {
    return { valid: false, expiresAt: 0, platform: 'unknown', username: '', needsRefresh: false };
  }

  const expiresAt = account.expiresAt || 0;
  const now = Date.now();
  const isExpired = expiresAt > 0 && expiresAt < now;
  const expiringSoon = expiresAt > 0 && (expiresAt - now) < 10 * 60 * 1000; // <10 min

  // If not expired, quick-check by attempting a lightweight API call
  if (!isExpired && account.accessToken) {
    try {
      const accessToken = await decryptToken(account.accessToken);
      // Lightweight profile check (uses cached data mostly)
      if (account.platform === 'facebook' || account.platform === 'instagram') {
        const res = await fetch(`https://graph.facebook.com/v19.0/me?fields=id&access_token=${accessToken}`);
        if (res.ok) {
          return {
            valid: true,
            expiresAt,
            platform: account.platform,
            username: account.username,
            needsRefresh: expiringSoon,
          };
        }
      } else {
        // For other platforms, trust the expiry timestamp
        return {
          valid: true,
          expiresAt,
          platform: account.platform,
          username: account.username,
          needsRefresh: expiringSoon,
        };
      }
    } catch (e) {
      console.warn(`[TokenValidate] Lightweight check failed for ${accountId}:`, e);
    }
  }

  return {
    valid: false,
    expiresAt,
    platform: account.platform,
    username: account.username,
    needsRefresh: true,
  };
}

/**
 * Background token refresh — attempts to refresh token silently.
 * If successful, returns new token info immediately without requiring re-auth.
 * If it fails, signals that a full OAuth re-auth is needed.
 */
export async function backgroundRefresh(accountId: string): Promise<{
  success: boolean;
  expiresAt?: number;
  account?: Partial<ConnectedAccount>;
  fallbackToOAuth: boolean;
}> {
  const accounts = await kv.get('social_accounts') || [];
  const account = accounts.find((a: ConnectedAccount) => a.id === accountId);

  if (!account) {
    return { success: false, fallbackToOAuth: true };
  }

  // If no refresh token, must do full OAuth
  if (!account.refreshToken) {
    console.log(`[BackgroundRefresh] No refresh token for ${accountId}, fallback to OAuth`);
    await addAuditLog('background_refresh_no_token', accountId);
    return { success: false, fallbackToOAuth: true };
  }

  const config = await getOAuthConfig(account.platform);
  if (!config) {
    return { success: false, fallbackToOAuth: true };
  }

  try {
    const refreshToken = await decryptToken(account.refreshToken);
    console.log(`[BackgroundRefresh] Attempting token refresh for ${account.platform}/${accountId}`);

    const response = await fetch(config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }).toString(),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      console.warn(`[BackgroundRefresh] Token refresh failed (${response.status}): ${errText}`);
      await addAuditLog('background_refresh_failed', accountId, { status: response.status });
      return { success: false, fallbackToOAuth: true };
    }

    const data = await response.json();
    const newAccessToken = data.access_token;
    const expiresIn = data.expires_in || 3600;
    const newExpiresAt = Date.now() + (expiresIn * 1000);
    const newRefreshToken = data.refresh_token; // Some providers rotate refresh tokens

    // Encrypt tokens
    const encryptedAccess = await encryptToken(newAccessToken);
    const encryptedRefresh = newRefreshToken
      ? await encryptToken(newRefreshToken)
      : account.refreshToken;

    // Update account in storage
    const updatedAccounts = accounts.map((a: ConnectedAccount) =>
      a.id === accountId
        ? {
          ...a,
          accessToken: encryptedAccess,
          refreshToken: encryptedRefresh,
          expiresAt: newExpiresAt,
          status: 'active' as const,
          lastSynced: Date.now(),
        }
        : a
    );

    await kv.set('social_accounts', updatedAccounts);
    await addAuditLog('background_refresh_success', accountId, { expiresIn });

    console.log(`[BackgroundRefresh] ✅ Token refreshed for ${account.platform}/${accountId}, expires in ${expiresIn}s`);

    return {
      success: true,
      expiresAt: newExpiresAt,
      account: {
        id: accountId,
        platform: account.platform,
        username: account.username,
        status: 'active',
        expiresAt: newExpiresAt,
        lastSynced: Date.now(),
      },
      fallbackToOAuth: false,
    };
  } catch (error: any) {
    console.error(`[BackgroundRefresh] Error for ${accountId}:`, error);
    await addAuditLog('background_refresh_error', accountId, { error: error.message });
    return { success: false, fallbackToOAuth: true };
  }
}

/**
 * Bulk validate all accounts — returns status for each account.
 * Used for prevalidation on hub open.
 */
export async function bulkValidateTokens(): Promise<Array<{
  accountId: string;
  platform: string;
  username: string;
  valid: boolean;
  expiresAt: number;
  needsRefresh: boolean;
}>> {
  const accounts: ConnectedAccount[] = await kv.get('social_accounts') || [];
  const results = [];

  for (const account of accounts) {
    if (account.status !== 'active') {
      results.push({
        accountId: account.id,
        platform: account.platform,
        username: account.username,
        valid: false,
        expiresAt: account.expiresAt || 0,
        needsRefresh: true,
      });
      continue;
    }

    const expiresAt = account.expiresAt || 0;
    const now = Date.now();
    const isExpired = expiresAt > 0 && expiresAt < now;
    const expiringSoon = expiresAt > 0 && (expiresAt - now) < 10 * 60 * 1000;

    results.push({
      accountId: account.id,
      platform: account.platform,
      username: account.username,
      valid: !isExpired,
      expiresAt,
      needsRefresh: isExpired || expiringSoon,
    });
  }

  return results;
}

// ══════════════════════════════════════════════════════════════════════════════
// ENCRYPTION HELPERS (AES-256)
// ══════════════════════════════════════════════════════════════════════════════

export async function encryptToken(token: string): Promise<string> {
  // Simple base64 encoding for demo - in production, use proper encryption
  // You would use crypto.subtle.encrypt with AES-256-GCM
  return btoa(token);
}

export async function decryptToken(encryptedToken: string): Promise<string> {
  // Simple base64 decoding for demo - in production, use proper decryption
  return atob(encryptedToken);
}

// ═════════════════════════════════════════════════════════════════════════════
// DEMO ACCOUNT CREATION
// ══════════════════════════════════════════════════════════════════════════════

async function createDemoAccount(platform: string): Promise<{ account: ConnectedAccount }> {
  const demoProfile: {
    username: string;
    profileImage: string;
    accountType: ConnectedAccount['accountType'];
    followers: number;
    engagement: number;
    permissions: string[];
  } = {
    username: `DemoUser_${platform}`,
    profileImage: 'https://via.placeholder.com/150',
    accountType: 'personal',
    followers: 1000,
    engagement: 500,
    permissions: ['read', 'write'],
  };

  const account: ConnectedAccount = {
    id: `${platform}_${Date.now()}`,
    platform,
    accountType: demoProfile.accountType,
    username: demoProfile.username,
    profileImage: demoProfile.profileImage,
    status: 'active',
    lastSynced: Date.now(),
    metadata: {
      followers: demoProfile.followers,
      engagement: demoProfile.engagement,
      permissions: demoProfile.permissions,
    },
    accessToken: await encryptToken('demo_access_token'),
    refreshToken: await encryptToken('demo_refresh_token'),
    expiresAt: Date.now() + (3600 * 1000),
    priority: 0,
  };

  // Save account
  const accounts = await kv.get('social_accounts') || [];
  accounts.push(account);
  await kv.set('social_accounts', accounts);

  // Add audit log
  await addAuditLog('account_connected', account.id);

  return { account };
}

// ══════════════════════════════════════════════════════════════════════════════
// MANUAL TOKEN ENTRY — Bypass OAuth for sandbox/iframe environments
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Add an account by directly providing an access token (no OAuth flow).
 * Validates the token by making a profile API call, then stores the account.
 * This is the recommended approach when running inside sandboxed iframes
 * where OAuth popups are unreliable.
 */
export async function addManualToken(
  platform: string,
  accessToken: string,
  options?: { accountName?: string; refreshToken?: string; expiresInSeconds?: number }
): Promise<{ account: ConnectedAccount; verified: boolean }> {
  if (!platform || !accessToken) {
    throw new Error('Platform and access token are required');
  }

  const supportedPlatforms = ['facebook', 'instagram', 'twitter', 'tiktok', 'linkedin', 'pinterest', 'youtube'];
  if (!supportedPlatforms.includes(platform)) {
    throw new Error(`Unsupported platform: ${platform}. Supported: ${supportedPlatforms.join(', ')}`);
  }

  // Validate the token by fetching user profile
  let profile: any = { username: 'Unknown', accountType: 'personal' };
  let verified = false;
  let grantedPermissions: string[] = [];

  try {
    profile = await fetchUserProfile(platform, accessToken);
    if (profile.username && profile.username !== 'Unknown') {
      verified = true;
      console.log(`[ManualToken] Token verified for ${platform}: @${profile.username}`);
    } else {
      console.warn(`[ManualToken] Token validation returned unknown profile for ${platform}`);
    }

    // Fetch actual granted permissions from the platform API
    grantedPermissions = await fetchGrantedPermissions(platform, accessToken);
    console.log(`[ManualToken] Granted permissions for ${platform}:`, grantedPermissions);
  } catch (error: any) {
    console.warn(`[ManualToken] Token validation failed for ${platform}: ${error.message}. Storing anyway with provided name.`);
  }

  const username = (verified && profile.username !== 'Unknown')
    ? profile.username
    : (options?.accountName || `${platform}_user`);

  const expiresIn = options?.expiresInSeconds || 5184000; // Default 60 days

  // Check for existing account on same platform to avoid duplicates
  const accounts: ConnectedAccount[] = await kv.get('social_accounts') || [];
  const existingIdx = accounts.findIndex((a: ConnectedAccount) =>
    a.platform === platform && (a.username === username || a.username === `${platform}_user`)
  );

  const account: ConnectedAccount = {
    id: existingIdx >= 0 ? accounts[existingIdx].id : `${platform}_${Date.now()}`,
    platform,
    accountType: profile.accountType || 'personal',
    username,
    profileImage: profile.profileImage,
    status: 'active',
    lastSynced: Date.now(),
    metadata: {
      followers: profile.followers,
      engagement: profile.engagement,
      permissions: grantedPermissions.length > 0 ? grantedPermissions : ['manual_token'],
    },
    accessToken: await encryptToken(accessToken),
    refreshToken: options?.refreshToken ? await encryptToken(options.refreshToken) : undefined,
    expiresAt: Date.now() + (expiresIn * 1000),
    priority: 0,
  };

  if (existingIdx >= 0) {
    accounts[existingIdx] = account;
    console.log(`[ManualToken] Updated existing ${platform} account: ${account.id}`);
  } else {
    accounts.push(account);
    console.log(`[ManualToken] Created new ${platform} account: ${account.id}`);
  }

  await kv.set('social_accounts', accounts);
  await addAuditLog('manual_token_added', account.id, { platform, verified });

  return { account, verified };
}

/**
 * Fetch the actual granted permissions for a token from the platform's API.
 * Facebook/Instagram: GET /me/permissions returns { data: [{ permission, status }] }
 * Other platforms: permissions APIs vary; we return empty and rely on token validity.
 */
async function fetchGrantedPermissions(platform: string, accessToken: string): Promise<string[]> {
  try {
    if (platform === 'facebook' || platform === 'instagram') {
      // Facebook Graph API /me/permissions works for both Facebook and Instagram tokens
      // System-user tokens and page tokens both support this endpoint
      const url = `https://graph.facebook.com/v21.0/me/permissions?access_token=${encodeURIComponent(accessToken)}`;
      console.log(`[Permissions] Fetching granted permissions for ${platform} via /me/permissions`);

      const response = await fetch(url, {
        headers: { 'Accept': 'application/json' },
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => '');
        console.warn(`[Permissions] /me/permissions failed for ${platform} (${response.status}): ${errText}`);
        return [];
      }

      const data = await response.json();
      // Response format: { data: [{ permission: "pages_manage_posts", status: "granted" }, ...] }
      const perms = (data.data || [])
        .filter((p: any) => p.status === 'granted')
        .map((p: any) => p.permission);

      console.log(`[Permissions] ${platform} granted permissions (${perms.length}):`, perms);
      return perms;
    }

    // For Twitter, LinkedIn, TikTok, Pinterest, YouTube — no standard permissions introspection endpoint.
    // The token is validated via the profile fetch; we trust the scopes from the OAuth grant.
    // Return empty to signal "no explicit permission data" — the frontend will treat this gracefully.
    console.log(`[Permissions] No permissions introspection endpoint for ${platform}, skipping`);
    return [];
  } catch (error) {
    console.error(`[Permissions] Error fetching permissions for ${platform}:`, error);
    return [];
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// PUBLISH POST — Use connected account tokens to publish to social platforms
// ══════════════════════════════════════════════════════════════════════════════

interface PublishRequest {
  accountId: string;
  content: string;
  mediaUrl?: string;
  hashtags?: string;
}

interface PublishResult {
  success: boolean;
  postId?: string;
  url?: string;
  platform: string;
  error?: string;
  tokenExpired?: boolean;
}

/**
 * Publish a post using a connected account's stored (encrypted) token.
 * This is the bridge between the Social Command Center and the real platform APIs.
 */
export async function publishWithAccount(req: PublishRequest): Promise<PublishResult> {
  const accounts: ConnectedAccount[] = await kv.get('social_accounts') || [];
  const account = accounts.find((a) => a.id === req.accountId);

  if (!account) {
    return { success: false, platform: 'unknown', error: `Account ${req.accountId} not found` };
  }
  if (!account.accessToken) {
    return { success: false, platform: account.platform, error: 'No access token stored for this account' };
  }

  let accessToken: string;
  try {
    accessToken = await decryptToken(account.accessToken);
  } catch (e: any) {
    return { success: false, platform: account.platform, error: `Token decryption failed: ${e.message}` };
  }

  const message = req.hashtags
    ? `${req.content}\n\n${req.hashtags}`
    : req.content;

  try {
    const result = await publishToPlatform(account.platform, accessToken, message, req.mediaUrl);

    // Update lastSynced on success
    if (result.success) {
      const updated = accounts.map((a) =>
        a.id === req.accountId ? { ...a, lastSynced: Date.now() } : a
      );
      await kv.set('social_accounts', updated);
      await addAuditLog('post_published', req.accountId, { postId: result.postId });
    }

    return { ...result, platform: account.platform };
  } catch (error: any) {
    console.error(`[Publish] Error publishing to ${account.platform}/${req.accountId}:`, error);
    await addAuditLog('post_publish_failed', req.accountId, { error: error.message });
    return { success: false, platform: account.platform, error: error.message };
  }
}

/**
 * Publish to multiple connected accounts at once.
 */
export async function publishToMultipleAccounts(
  accountIds: string[],
  content: string,
  mediaUrl?: string,
  hashtags?: string
): Promise<Record<string, PublishResult>> {
  const results: Record<string, PublishResult> = {};

  for (const accountId of accountIds) {
    results[accountId] = await publishWithAccount({ accountId, content, mediaUrl, hashtags });
  }

  return results;
}

/**
 * Internal: dispatch to the correct platform posting API.
 */
async function publishToPlatform(
  platform: string,
  accessToken: string,
  message: string,
  mediaUrl?: string
): Promise<{ success: boolean; postId?: string; url?: string; error?: string; tokenExpired?: boolean }> {
  switch (platform) {
    case 'facebook':
      return await publishToFacebook(accessToken, message, mediaUrl);
    case 'instagram':
      return await publishToInstagram(accessToken, message, mediaUrl);
    case 'twitter':
      return await publishToTwitter(accessToken, message);
    case 'linkedin':
      return await publishToLinkedIn(accessToken, message, mediaUrl);
    case 'tiktok':
    case 'pinterest':
    case 'youtube':
      // These require more complex flows (video upload, pin creation, etc.)
      return { success: false, error: `${platform} publishing via connected accounts is not yet supported. Use the platform-specific upload flow.` };
    default:
      return { success: false, error: `Unknown platform: ${platform}` };
  }
}

async function publishToFacebook(
  accessToken: string,
  message: string,
  mediaUrl?: string
): Promise<{ success: boolean; postId?: string; url?: string; error?: string; tokenExpired?: boolean }> {
  // For system-user tokens, discover accessible pages first
  const pagesRes = await fetch(
    `https://graph.facebook.com/v21.0/me/accounts?fields=id,name,access_token&access_token=${encodeURIComponent(accessToken)}`
  );
  const pagesData = await pagesRes.json();

  let pageId: string;
  let pageToken: string;

  if (pagesData.data && pagesData.data.length > 0) {
    // Use the first page's token (page access tokens are more reliable for posting)
    pageId = pagesData.data[0].id;
    pageToken = pagesData.data[0].access_token || accessToken;
    console.log(`[Publish/FB] Using page "${pagesData.data[0].name}" (${pageId})`);
  } else {
    // Fallback: try posting as /me (works for Page Access Tokens used directly)
    const meRes = await fetch(`https://graph.facebook.com/v21.0/me?fields=id,name&access_token=${encodeURIComponent(accessToken)}`);
    const meData = await meRes.json();
    if (meData.error) {
      const code = meData.error.code;
      if (code === 190) {
        return { success: false, error: meData.error.message, tokenExpired: true };
      }
      return { success: false, error: `Facebook API error: ${meData.error.message}` };
    }
    pageId = meData.id;
    pageToken = accessToken;
    console.log(`[Publish/FB] No pages via /me/accounts — posting as "${meData.name}" (${pageId})`);
  }

  const postBody: any = { message, access_token: pageToken };
  if (mediaUrl && !mediaUrl.startsWith('blob:')) {
    postBody.link = mediaUrl;
  }

  const res = await fetch(`https://graph.facebook.com/v21.0/${pageId}/feed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(postBody),
  });

  const data = await res.json();
  if (!res.ok || data.error) {
    const err = data.error || {};
    if (err.code === 190) {
      return { success: false, error: err.message, tokenExpired: true };
    }
    return { success: false, error: err.message || `Facebook post failed (${res.status})` };
  }

  return { success: true, postId: data.id, url: `https://facebook.com/${data.id}` };
}

async function publishToInstagram(
  accessToken: string,
  caption: string,
  mediaUrl?: string
): Promise<{ success: boolean; postId?: string; url?: string; error?: string }> {
  if (!mediaUrl || mediaUrl.startsWith('blob:')) {
    return { success: false, error: 'Instagram requires a publicly accessible image or video URL. Text-only posts are not supported.' };
  }

  // Find IG business account via pages
  const pagesRes = await fetch(
    `https://graph.facebook.com/v21.0/me/accounts?fields=id,instagram_business_account&access_token=${encodeURIComponent(accessToken)}`
  );
  const pagesData = await pagesRes.json();

  let igAccountId: string | null = null;
  for (const page of (pagesData.data || [])) {
    if (page.instagram_business_account?.id) {
      igAccountId = page.instagram_business_account.id;
      break;
    }
  }

  if (!igAccountId) {
    return { success: false, error: 'No Instagram Business Account found linked to your Facebook pages. Connect your Instagram account to a Facebook Page first.' };
  }

  // Step 1: Create media container
  const containerRes = await fetch(`https://graph.facebook.com/v21.0/${igAccountId}/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image_url: mediaUrl, caption, access_token: accessToken }),
  });
  const containerData = await containerRes.json();
  if (containerData.error) {
    return { success: false, error: `Instagram container creation failed: ${containerData.error.message}` };
  }

  // Step 2: Publish
  const publishRes = await fetch(`https://graph.facebook.com/v21.0/${igAccountId}/media_publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ creation_id: containerData.id, access_token: accessToken }),
  });
  const publishData = await publishRes.json();
  if (publishData.error) {
    return { success: false, error: `Instagram publish failed: ${publishData.error.message}` };
  }

  return { success: true, postId: publishData.id, url: `https://instagram.com/p/${publishData.id}` };
}

async function publishToTwitter(
  accessToken: string,
  text: string
): Promise<{ success: boolean; postId?: string; url?: string; error?: string }> {
  const res = await fetch('https://api.twitter.com/2/tweets', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text }),
  });

  const data = await res.json();
  if (!res.ok || data.errors) {
    const errMsg = data.errors?.[0]?.message || data.detail || `Twitter API error (${res.status})`;
    return { success: false, error: errMsg };
  }

  return { success: true, postId: data.data?.id, url: `https://twitter.com/i/status/${data.data?.id}` };
}

async function publishToLinkedIn(
  accessToken: string,
  text: string,
  mediaUrl?: string
): Promise<{ success: boolean; postId?: string; url?: string; error?: string }> {
  // Get LinkedIn user URN
  const meRes = await fetch('https://api.linkedin.com/v2/me', {
    headers: { 'Authorization': `Bearer ${accessToken}` },
  });
  const meData = await meRes.json();
  if (!meRes.ok || !meData.id) {
    return { success: false, error: `LinkedIn profile fetch failed: ${meData.message || meRes.statusText}` };
  }

  const authorUrn = `urn:li:person:${meData.id}`;

  const postBody: any = {
    author: authorUrn,
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: { text },
        shareMediaCategory: 'NONE',
      },
    },
    visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
  };

  const res = await fetch('https://api.linkedin.com/v2/ugcPosts', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0',
    },
    body: JSON.stringify(postBody),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    return { success: false, error: `LinkedIn post failed: ${errData.message || res.statusText}` };
  }

  const postId = res.headers.get('x-restli-id') || '';
  return { success: true, postId, url: `https://linkedin.com/feed/update/${postId}` };
}