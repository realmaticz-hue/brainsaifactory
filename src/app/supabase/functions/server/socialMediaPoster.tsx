// Real Social Media Posting - Facebook, Instagram, TikTok, Twitter, LinkedIn

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

import { createClient } from '@jsr/supabase__supabase-js';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

interface PostRequest {
  platforms: string[];
  caption: string;
  hashtags: string;
  mediaUrl?: string;
  scheduledTime?: string;
  credentials: any;
}

// ── Auto-refresh a Facebook token using App ID + App Secret ─────────────────
// ⚠️  This ONLY works when the token is still valid but short-lived.
//     It CANNOT revive an already-expired or revoked token (#190/463, 467, 460).
//     For expired sessions the user MUST re-authenticate via Facebook OAuth.
async function refreshFacebookToken(creds: any): Promise<string | null> {
  const { appId, appSecret, accessToken, pageAccessToken, pageId } = creds;
  const currentToken = pageAccessToken || accessToken;

  if (!appId || !appSecret || !currentToken) return null;

  try {
    // Step 1: exchange short-lived → long-lived user token (~60 days)
    const exchangeUrl =
      `https://graph.facebook.com/oauth/access_token` +
      `?grant_type=fb_exchange_token` +
      `&client_id=${encodeURIComponent(appId)}` +
      `&client_secret=${encodeURIComponent(appSecret)}` +
      `&fb_exchange_token=${encodeURIComponent(currentToken)}`;

    const exchangeRes = await fetch(exchangeUrl);
    const exchangeData = await exchangeRes.json();

    if (!exchangeRes.ok || exchangeData.error || !exchangeData.access_token) {
      console.error('Facebook token exchange failed:', exchangeData?.error?.message);
      return null;
    }

    const longLivedUserToken: string = exchangeData.access_token;

    // Step 2 (preferred): get the permanent Page Access Token
    let newToken = longLivedUserToken;
    if (pageId) {
      const pageRes = await fetch(
        `https://graph.facebook.com/v21.0/${encodeURIComponent(pageId)}` +
        `?fields=access_token&access_token=${encodeURIComponent(longLivedUserToken)}`
      );
      const pageData = await pageRes.json();
      if (pageRes.ok && pageData.access_token) {
        newToken = pageData.access_token; // permanent — never expires
      }
    }

    // Persist refreshed token so it survives the next request
    const { set, get } = await import('./kv_store.tsx');
    const saved: any = await get('social-credentials') || {};
    const updatedFb = { ...(saved.facebook || {}), ...creds, accessToken: newToken, pageAccessToken: newToken };
    await set('social-credentials', { ...saved, facebook: updatedFb });
    console.log('✅ Facebook token auto-refreshed and saved to KV store.');

    return newToken;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error('Auto-refresh error:', errorMessage);
    return null;
  }
}

// ── Internal helper: attempt a single Facebook feed post ────────────────────
async function attemptFacebookPost(pageId: string, token: string, message: string, mediaUrl?: string) {
  return fetch(
    `https://graph.facebook.com/v21.0/${pageId}/feed`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        access_token: token,
        ...(mediaUrl && !mediaUrl.startsWith('blob:') && { link: mediaUrl }),
      }),
    }
  );
}

// ── Fetch all pages the token has access to ──────────────────────────────────
async function fetchAccessiblePages(token: string): Promise<Array<{ id: string; name: string; category: string }>> {
  try {
    // ── Attempt 1: me/accounts (works with User Access Tokens) ───────────────
    const res = await fetch(
      `https://graph.facebook.com/v21.0/me/accounts?fields=id,name,category,access_token&access_token=${encodeURIComponent(token)}`
    );
    const data = await res.json();
    if (!res.ok || data.error) {
      console.warn(`[fetchAccessiblePages] me/accounts failed — code=${data?.error?.code} msg="${data?.error?.message || res.statusText}". Trying /me fallback (Page token path)…`);
    } else {
      const pages = (data.data || []).map((p: any) => ({ id: p.id, name: p.name, category: p.category || '' }));
      if (pages.length > 0) {
        console.log(`[fetchAccessiblePages] Found ${pages.length} page(s) via me/accounts.`);
        return pages;
      }
      console.warn(`[fetchAccessiblePages] me/accounts returned 0 pages. Token may be a Page Access Token. Trying /me fallback…`);
    }

    // ── Attempt 2: /me (works with Page Access Tokens — me = the page itself) ─
    // When a Page Access Token is used, /me returns the page's own profile.
    const meRes = await fetch(
      `https://graph.facebook.com/v21.0/me?fields=id,name,category&access_token=${encodeURIComponent(token)}`
    );
    const meData = await meRes.json();
    if (meRes.ok && meData?.id && meData?.name && !meData?.error) {
      console.log(`[fetchAccessiblePages] /me returned: id=${meData.id} name="${meData.name}". Using as discovered page.`);
      return [{ id: meData.id, name: meData.name, category: meData.category || 'Facebook Page' }];
    }
    console.warn(`[fetchAccessiblePages] /me also failed — id=${meData?.id} error="${meData?.error?.message}".`);
    return [];
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.warn(`[fetchAccessiblePages] Network error: ${errorMessage}`);
    return [];
  }
}

// ── Pre-validate that the page ID exists and is accessible ───────────────────
async function validatePageId(pageId: string, token: string): Promise<{ valid: boolean; error?: string }> {
  try {
    const res = await fetch(
      `https://graph.facebook.com/v21.0/${encodeURIComponent(pageId)}?fields=id,name&access_token=${encodeURIComponent(token)}`
    );
    if (res.ok) {
      const data = await res.json();
      if (data.id) return { valid: true };
    }
    const errData = await res.json().catch(() => ({}));
    return { valid: false, error: errData?.error?.message || 'Page not found' };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return { valid: false, error: errorMessage };
  }
}

export async function postToSocialMedia(request: PostRequest) {
  const results: any = {};

  for (const platform of request.platforms) {
    try {
      let result;

      switch (platform) {
        case 'facebook':
          result = await postToFacebook(request);
          break;
        case 'instagram':
          result = await postToInstagram(request);
          break;
        case 'tiktok':
          result = await postToTikTok(request);
          break;
        case 'twitter':
          result = await postToTwitter(request);
          break;
        case 'linkedin':
          result = await postToLinkedIn(request);
          break;
        default:
          result = { success: false, error: 'Unsupported platform' };
      }

      results[platform] = result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Error posting to ${platform}:`, errorMessage);
      results[platform] = {
        success: false,
        error: errorMessage
      };
    }
  }

  // Save post record
  await savePostRecord({
    platforms: request.platforms,
    caption: request.caption,
    hashtags: request.hashtags,
    mediaUrl: request.mediaUrl,
    scheduledTime: request.scheduledTime,
    results,
    postedAt: new Date().toISOString()
  });

  return results;
}

async function postToFacebook(request: PostRequest): Promise<any> {
  const creds = request.credentials?.facebook || {};
  let pageId = creds.pageId?.toString().trim();
  let pageAccessToken = (creds.pageAccessToken || creds.accessToken || '').trim();

  if (!pageAccessToken) {
    throw new Error(
      'Facebook Page Access Token not configured. ' +
      'Go to Social Accounts settings and enter your Facebook Page ID and Page Access Token.'
    );
  }

  if (!pageId) {
    throw new Error(
      'Facebook Page ID not configured. ' +
      'Go to Social Accounts settings and enter your Facebook Page ID.'
    );
  }

  // ── Guard: Page ID must not equal App ID ────────────────────────────────────
  // This is the most common misconfiguration — the App ID and Page ID are
  // different numbers even though they look similar.
  const appId = creds.appId?.toString().trim();
  if (appId && pageId === appId) {
    console.warn(`[postToFacebook] Page ID "${pageId}" matches App ID — running auto-discovery to find real Page ID…`);
    const pages = await fetchAccessiblePages(pageAccessToken);
    if (pages.length === 1) {
      const correctedPage = pages[0];
      console.log(`[postToFacebook] App-ID-as-Page-ID corrected: "${pageId}" → "${correctedPage.id}" (${correctedPage.name})`);
      pageId = correctedPage.id;
      // Persist fix immediately
      try {
        const { get, set } = await import('./kv_store.tsx');
        const saved: any = await get('social-credentials') || {};
        await set('social-credentials', { ...saved, facebook: { ...(saved.facebook || {}), ...creds, pageId: correctedPage.id } });
        console.log(`[postToFacebook] Saved corrected Page ID "${correctedPage.id}" to KV.`);
      } catch (_) { /* non-fatal */ }
    } else if (pages.length > 1) {
      const pageList = pages.map(p => `• ${p.name} (ID: ${p.id})`).join('\n');
      return {
        success: false,
        needsPageSelection: true,
        platform: 'facebook',
        availablePages: pages,
        error:
          `Your Page ID field contains your App ID (${pageId}), not a Page ID. ` +
          `Your token has access to ${pages.length} pages — open Social Accounts settings and enter the correct Page ID:\n${pageList}`,
      };
    } else {
      return {
        success: false,
        platform: 'facebook',
        wrongIdType: true,
        error:
          `Your Page ID field contains "${pageId}" which appears to be your App ID, not a Page ID. ` +
          `Auto-discovery found no pages for this token. ` +
          `Go to your Facebook Page → About → scroll to "Page ID" and enter that number instead. ` +
          `Also make sure your token has the pages_show_list and pages_manage_posts permissions.`,
      };
    }
  }

  // ── Pre-flight: validate page ID before attempting to post ─────────────────
  const preCheck = await validatePageId(pageId, pageAccessToken);
  if (!preCheck.valid) {
    console.warn(`Facebook pre-flight failed for Page ID "${pageId}": ${preCheck.error}. Attempting auto-discovery…`);

    // Try to auto-discover correct pages for this token
    const pages = await fetchAccessiblePages(pageAccessToken);

    if (pages.length === 1) {
      // Only one page — auto-correct silently
      const correctedPage = pages[0];
      console.log(`Auto-corrected Facebook Page ID from "${pageId}" → "${correctedPage.id}" (${correctedPage.name})`);
      pageId = correctedPage.id;

      // Persist the corrected page ID to KV so future requests use it
      try {
        const { get, set } = await import('./kv_store.tsx');
        const saved: any = await get('social-credentials') || {};
        await set('social-credentials', {
          ...saved,
          facebook: { ...(saved.facebook || {}), ...creds, pageId: correctedPage.id },
        });
      } catch (kvErr) {
        console.error('Failed to persist corrected Facebook Page ID:', kvErr);
      }
    } else if (pages.length > 1) {
      // Multiple pages — surface them to the user
      const pageList = pages.map(p => `• ${p.name} (ID: ${p.id}${p.category ? `, ${p.category}` : ''})`).join('\n');
      return {
        success: false,
        needsPageSelection: true,
        platform: 'facebook',
        availablePages: pages,
        error:
          `Facebook Page ID "${pageId}" is invalid or inaccessible. ` +
          `Your token has access to ${pages.length} pages — go to Social Accounts settings and enter the correct Page ID:\n${pageList}`,
      };
    } else {
      // No pages found — token may lack pages_manage_posts permission
      return {
        success: false,
        platform: 'facebook',
        error:
          `Facebook Page ID "${pageId}" does not exist or your token cannot access it. ` +
          `No pages were found for this access token. ` +
          `Ensure your Page Access Token has the "pages_manage_posts" and "pages_read_engagement" permissions, ` +
          `and that you are an admin of the page. ` +
          `Find your Page ID at facebook.com/your-page-name → About → "Page ID". ` +
          `Raw validation error: ${preCheck.error}`,
      };
    }
  }

  const message = request.caption.trim();

  // ── First attempt ────────────────────────────────────────────────────────
  let response = await attemptFacebookPost(pageId, pageAccessToken, message, request.mediaUrl);

  // ── Handle errors ─────────────────────────────────────────────────────────
  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    const fbError = errBody?.error || {};
    const code = fbError.code;
    const subcode = fbError.error_subcode;
    const msg = fbError.message || response.statusText;

    // ── #190: invalid / expired token ────────────────────────────────────
    if (code === 190) {
      // Subcodes 460/463/467 = session expired or revoked.
      // fb_exchange_token CANNOT revive an expired session — skip the
      // exchange attempt entirely and tell the user to re-authenticate.
      const isDeadSession = subcode === 463 || subcode === 467 || subcode === 460;

      if (!isDeadSession) {
        // Token format might be wrong or near-expiry — try silent exchange
        console.log(`Facebook token issue (#190/${subcode}). Attempting auto-refresh…`);
        const newToken = await refreshFacebookToken(creds);

        if (newToken) {
          console.log('Retrying Facebook post with refreshed token…');
          const retry = await attemptFacebookPost(pageId, newToken, message, request.mediaUrl);

          if (retry.ok) {
            const retryData = await retry.json();
            return {
              success: true,
              postId: retryData.id,
              platform: 'facebook',
              url: `https://facebook.com/${retryData.id}`,
              note: 'Token was auto-refreshed. New token saved — future posts will work without manual renewal.',
            };
          }

          const retryErr = await retry.json().catch(() => ({}));
          const retryMsg = retryErr?.error?.message || retry.statusText;
          throw new Error(
            `Facebook post failed even after token auto-refresh: ${retryMsg}. ` +
            `Please re-authenticate: Social Accounts settings → Facebook → Connect via Facebook OAuth.`
          );
        }
      }

      // Dead/expired session — wipe the bad token from KV so it doesn't
      // block future requests, then return a structured error the frontend
      // can detect and offer a one-click reconnect button.
      try {
        const { get, set } = await import('./kv_store.tsx');
        const saved: any = await get('social-credentials') || {};
        if (saved?.facebook) {
          const { accessToken: _a, pageAccessToken: _p, ...restFb } = saved.facebook;
          await set('social-credentials', { ...saved, facebook: restFb });
          console.log('⚠️ Cleared expired Facebook token from KV store.');
        }
      } catch (kvErr) {
        console.error('Failed to clear expired FB token from KV:', kvErr);
      }

      const reason =
        subcode === 463 ? 'Session has expired' :
          subcode === 467 ? 'Token was invalidated (app deauthorized or permissions revoked)' :
            subcode === 460 ? 'Token revoked because the account password changed' :
              'Token is invalid or revoked';

      // Return structured error (not throw) so frontend gets tokenExpired flag
      return {
        success: false,
        tokenExpired: true,
        fbCode: code,
        fbSubcode: subcode,
        platform: 'facebook',
        error:
          `Facebook token expired (#190/${subcode ?? '?'}): ${reason}. ` +
          `Click "Reconnect Facebook" to log in again and get a permanent token. ` +
          `Raw error: ${msg}`,
      };
    }

    // ── #200 / #10: insufficient permissions ─────────────────────────────
    if (code === 200 || code === 10) {
      throw new Error(
        `Facebook permission error (#${code}${subcode ? `/${subcode}` : ''}): ` +
        `Your Page Access Token is missing required permissions. ` +
        `You need BOTH "pages_manage_posts" AND "pages_read_engagement" granted to an admin token. ` +
        `Fix: Graph API Explorer → Page Access Token → tick both permissions → Generate Token → paste in Social Accounts settings. ` +
        `Raw: ${msg}`
      );
    }

    // ── #100: bad parameter — attempt page auto-discovery ─────────────────
    if (code === 100) {
      console.warn(`Facebook #100 on post attempt for Page ID "${pageId}". Trying me/accounts auto-discovery…`);
      const pages = await fetchAccessiblePages(pageAccessToken);

      if (pages.length === 1) {
        // Auto-correct and retry
        const correctedPage = pages[0];
        console.log(`Auto-correcting Page ID "${pageId}" → "${correctedPage.id}" (${correctedPage.name}) and retrying…`);
        const retryResp = await attemptFacebookPost(correctedPage.id, pageAccessToken, message, request.mediaUrl);

        // Persist corrected ID
        try {
          const { get, set } = await import('./kv_store.tsx');
          const saved: any = await get('social-credentials') || {};
          await set('social-credentials', {
            ...saved,
            facebook: { ...(saved.facebook || {}), ...creds, pageId: correctedPage.id },
          });
        } catch (_) { /* non-fatal */ }

        if (retryResp.ok) {
          const retryData = await retryResp.json();
          return {
            success: true,
            postId: retryData.id,
            platform: 'facebook',
            url: `https://facebook.com/${retryData.id}`,
            note: `Page ID was auto-corrected from "${pageId}" to "${correctedPage.id}" (${correctedPage.name}). The correct ID has been saved — future posts will use it automatically.`,
          };
        }
        const retryErr = await retryResp.json().catch(() => ({}));
        throw new Error(`Facebook post failed with auto-corrected Page ID "${correctedPage.id}": ${retryErr?.error?.message || retryResp.statusText}`);
      }

      if (pages.length > 1) {
        const pageList = pages.map(p => `• ${p.name} (ID: ${p.id}${p.category ? `, ${p.category}` : ''})`).join('\n');
        return {
          success: false,
          needsPageSelection: true,
          platform: 'facebook',
          availablePages: pages,
          error:
            `Facebook Page ID "${pageId}" is invalid (#100). ` +
            `Your token has access to ${pages.length} pages. Go to Social Accounts settings and enter the correct Page ID:\n${pageList}`,
        };
      }

      throw new Error(
        `Facebook invalid parameter (#100): Your Page ID "${pageId}" does not exist or is inaccessible. ` +
        `Find the correct Page ID at facebook.com/your-page-name → About → "Page ID", ` +
        `then update it in Social Accounts settings. ` +
        `Raw: ${msg}`
      );
    }

    throw new Error(`Facebook API error (#${code ?? 'unknown'}): ${msg}`);
  }

  const data = await response.json();

  return {
    success: true,
    postId: data.id,
    platform: 'facebook',
    url: `https://facebook.com/${data.id}`,
  };
}

async function postToInstagram(request: PostRequest): Promise<any> {
  const { accountId, accessToken } = request.credentials.instagram || {};

  if (!accessToken || !accountId) {
    throw new Error('Instagram credentials not provided');
  }

  // Instagram Graph API does not support text-only posts — media is always required.
  // Return a graceful skip so the caller can surface a clear message rather than a hard failure.
  if (!request.mediaUrl || request.mediaUrl.startsWith('blob:')) {
    return {
      success: false,
      skipped: true,
      platform: 'instagram',
      error:
        'Instagram does not support text-only posts. ' +
        'Please use an Image or Video post type to publish on Instagram.',
    };
  }

  const caption = `${request.caption}\n\n${request.hashtags}`;

  // Step 1: Create media container
  const containerResponse = await fetch(
    `https://graph.facebook.com/v21.0/${accountId}/media`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        image_url: request.mediaUrl,
        caption,
        access_token: accessToken
      })
    }
  );

  if (!containerResponse.ok) {
    const error = await containerResponse.json();
    throw new Error(`Instagram container creation error: ${error.error?.message || containerResponse.statusText}`);
  }

  const containerData = await containerResponse.json();
  const creationId = containerData.id;

  // Step 2: Publish the container
  const publishResponse = await fetch(
    `https://graph.facebook.com/v21.0/${accountId}/media_publish`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        creation_id: creationId,
        access_token: accessToken
      })
    }
  );

  if (!publishResponse.ok) {
    const error = await publishResponse.json();
    throw new Error(`Instagram publish error: ${error.error?.message || publishResponse.statusText}`);
  }

  const publishData = await publishResponse.json();

  return {
    success: true,
    postId: publishData.id,
    platform: 'instagram',
    url: `https://instagram.com/p/${publishData.id}`
  };
}

async function postToTikTok(request: PostRequest): Promise<any> {
  const { accessToken, username } = request.credentials.tiktok || {};

  if (!accessToken) {
    throw new Error('TikTok access token not provided');
  }

  if (!request.mediaUrl) {
    throw new Error('TikTok requires video URL');
  }

  // TikTok Content Posting API
  const response = await fetch(
    'https://open.tiktokapis.com/v2/post/publish/video/init/',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        post_info: {
          title: request.caption,
          privacy_level: 'SELF_ONLY', // Change to PUBLIC_TO_EVERYONE when ready
          disable_duet: false,
          disable_comment: false,
          disable_stitch: false,
          video_cover_timestamp_ms: 1000
        },
        source_info: {
          source: 'PULL_FROM_URL',
          video_url: request.mediaUrl
        }
      })
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`TikTok API error: ${error.error?.message || response.statusText}`);
  }

  const data = await response.json();

  return {
    success: true,
    postId: data.data.publish_id,
    platform: 'tiktok',
    status: data.data.status
  };
}

async function postToTwitter(request: PostRequest): Promise<any> {
  const { apiKey, apiSecret, accessToken, accessTokenSecret } = request.credentials.twitter || {};

  if (!accessToken || !apiKey) {
    throw new Error('Twitter credentials not provided');
  }

  const tweet = `${request.caption}\n\n${request.hashtags}`;

  // Twitter API v2
  const response = await fetch(
    'https://api.twitter.com/2/tweets',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: tweet
      })
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Twitter API error: ${error.detail || response.statusText}`);
  }

  const data = await response.json();

  return {
    success: true,
    postId: data.data.id,
    platform: 'twitter',
    url: `https://twitter.com/i/web/status/${data.data.id}`
  };
}

async function postToLinkedIn(request: PostRequest): Promise<any> {
  const { accessToken, organizationId } = request.credentials.linkedin || {};

  if (!accessToken) {
    throw new Error('LinkedIn access token not provided');
  }

  const text = `${request.caption}\n\n${request.hashtags}`;

  const response = await fetch(
    'https://api.linkedin.com/v2/ugcPosts',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0'
      },
      body: JSON.stringify({
        author: organizationId ? `urn:li:organization:${organizationId}` : 'urn:li:person:CURRENT',
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text
            },
            shareMediaCategory: request.mediaUrl ? 'IMAGE' : 'NONE'
          }
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
        }
      })
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`LinkedIn API error: ${error.message || response.statusText}`);
  }

  const data = await response.json();

  return {
    success: true,
    postId: data.id,
    platform: 'linkedin'
  };
}

async function savePostRecord(record: any): Promise<void> {
  const { set } = await import('./kv_store.tsx');
  const postId = crypto.randomUUID();
  await set(`post:${postId}`, record);
}

export async function schedulePost(request: PostRequest): Promise<any> {
  // Save scheduled post to database
  const { set } = await import('./kv_store.tsx');
  const scheduleId = crypto.randomUUID();

  const scheduledPost = {
    id: scheduleId,
    ...request,
    status: 'scheduled',
    createdAt: new Date().toISOString()
  };

  await set(`scheduled:${scheduleId}`, scheduledPost);

  return {
    success: true,
    scheduleId,
    scheduledTime: request.scheduledTime
  };
}

export async function getScheduledPosts(): Promise<any[]> {
  const { getByPrefix } = await import('./kv_store.tsx');
  return await getByPrefix('scheduled:');
}

export async function processScheduledPosts(): Promise<void> {
  // This would be called by a cron job
  const posts = await getScheduledPosts();
  const now = new Date();

  for (const post of posts) {
    const scheduledTime = new Date(post.scheduledTime);

    if (scheduledTime <= now && post.status === 'scheduled') {
      try {
        await postToSocialMedia(post);

        // Update status
        const { set } = await import('./kv_store.tsx');
        await set(`scheduled:${post.id}`, {
          ...post,
          status: 'posted',
          postedAt: new Date().toISOString()
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`Failed to post scheduled content ${post.id}:`, errorMessage);

        // Mark as failed
        const { set } = await import('./kv_store.tsx');
        await set(`scheduled:${post.id}`, {
          ...post,
          status: 'failed',
          error: errorMessage
        });
      }
    }
  }
}