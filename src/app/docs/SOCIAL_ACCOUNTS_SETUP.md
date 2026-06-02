# Social Accounts Hub - Setup Guide

## Overview

The Social Accounts Hub is a comprehensive, AI-powered system for managing social media accounts with OAuth 2.0 authentication, automatic token refresh, cross-platform API normalization, and intelligent troubleshooting.

## Features

✅ **Multi-Platform Support**
- Facebook (Pages & Groups)
- Instagram (Business Accounts)
- TikTok (Creator & Business)
- Twitter/X (Personal & Professional)
- LinkedIn (Personal & Company Pages)
- Pinterest (Boards & Profiles)
- YouTube (Shorts & Videos)
- Reddit (Communities)
- Mastodon (Decentralized)
- Discord (Servers & Channels)

✅ **OAuth 2.0 Authentication**
- Secure token storage with AES-256 encryption
- Automatic token refresh
- CSRF protection with state validation

✅ **AI-Powered Features**
- Real-time account health monitoring
- Intelligent suggestions for optimization
- Auto-reconnect for expired tokens
- Natural language troubleshooting guidance

✅ **Security & Compliance**
- Encrypted token storage
- Audit logs for all actions
- Permission validation
- Rate limit handling

## Setup Instructions

### 1. Environment Variables

Add the following environment variables to your Supabase secrets:

```bash
# Facebook
FACEBOOK_APP_ID=your_app_id
FACEBOOK_APP_SECRET=your_app_secret

# Instagram (uses Facebook Graph API)
INSTAGRAM_CLIENT_ID=your_client_id
INSTAGRAM_CLIENT_SECRET=your_client_secret

# Twitter/X
TWITTER_CLIENT_ID=your_client_id
TWITTER_CLIENT_SECRET=your_client_secret

# LinkedIn
LINKEDIN_CLIENT_ID=your_client_id
LINKEDIN_CLIENT_SECRET=your_client_secret

# TikTok
TIKTOK_CLIENT_KEY=your_client_key
TIKTOK_CLIENT_SECRET=your_client_secret

# Pinterest
PINTEREST_APP_ID=your_app_id
PINTEREST_APP_SECRET=your_app_secret

# YouTube (Google OAuth)
YOUTUBE_CLIENT_ID=your_client_id
YOUTUBE_CLIENT_SECRET=your_client_secret
```

### 2. Platform-Specific Setup

#### Facebook & Instagram

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app (or use existing)
3. Add "Facebook Login" product
4. Configure OAuth Redirect URIs:
   ```
   https://YOUR_PROJECT_ID.supabase.co/oauth-callback
   ```
5. Request permissions:
   - `pages_manage_posts`
   - `pages_read_engagement`
   - `instagram_basic`
   - `instagram_content_publish`
6. Copy App ID and App Secret to environment variables

#### Twitter/X

1. Go to [Twitter Developer Portal](https://developer.twitter.com/)
2. Create a new project and app
3. Enable OAuth 2.0
4. Set redirect URI:
   ```
   https://YOUR_PROJECT_ID.supabase.co/oauth-callback
   ```
5. Request scopes:
   - `tweet.read`
   - `tweet.write`
   - `users.read`
   - `offline.access`
6. Copy Client ID and Client Secret

#### LinkedIn

1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/)
2. Create a new app
3. Add "Sign In with LinkedIn" product
4. Configure redirect URL:
   ```
   https://YOUR_PROJECT_ID.supabase.co/oauth-callback
   ```
5. Request scopes:
   - `w_member_social`
   - `r_basicprofile`
6. Copy Client ID and Client Secret

#### TikTok

1. Go to [TikTok Developers](https://developers.tiktok.com/)
2. Create a new app
3. Enable "Login Kit"
4. Set redirect URI:
   ```
   https://YOUR_PROJECT_ID.supabase.co/oauth-callback
   ```
5. Request scopes:
   - `user.info.basic`
   - `video.list`
   - `video.upload`
6. Copy Client Key and Client Secret

#### Pinterest

1. Go to [Pinterest Developers](https://developers.pinterest.com/)
2. Create a new app
3. Add redirect URI:
   ```
   https://YOUR_PROJECT_ID.supabase.co/oauth-callback
   ```
4. Request scopes:
   - `boards:read`
   - `pins:read`
   - `pins:write`
5. Copy App ID and App Secret

#### YouTube

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or use existing)
3. Enable YouTube Data API v3
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI:
   ```
   https://YOUR_PROJECT_ID.supabase.co/oauth-callback
   ```
6. Request scopes:
   - `https://www.googleapis.com/auth/youtube.upload`
   - `https://www.googleapis.com/auth/youtube.readonly`
7. Copy Client ID and Client Secret

### 3. Setting Environment Variables in Supabase

To add environment variables to your Supabase project:

1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **Edge Functions**
3. Under **Environment Variables**, click **Add Variable**
4. Add each variable one by one
5. Redeploy your edge functions for changes to take effect

Alternatively, use the Supabase CLI:

```bash
# Set a single variable
supabase secrets set FACEBOOK_APP_ID=your_app_id

# Set multiple variables from a file
supabase secrets set --env-file .env.production
```

## Usage

### Connecting an Account

1. Click the **Settings** icon in the top navigation
2. Select **Social Accounts Hub**
3. Choose a platform from the "Add Account" section
4. Click the platform card to initiate OAuth flow
5. Authenticate in the popup window
6. Account will be automatically added and synced

### Managing Accounts

- **Test Connection**: Click the ⚡ icon to verify the account is active
- **Reconnect**: Click the 🔄 icon to refresh expired tokens
- **View Details**: Click the ▶ icon to see permissions, followers, and expiration
- **Disconnect**: Click the 🗑️ icon to remove the account
- **Reorder**: Drag and drop accounts to change priority for posting

### AI Suggestions

The AI Assistant monitors your accounts and provides:
- Alerts for expired or inactive accounts
- Suggestions for which platforms to connect
- Recommendations for account cleanup
- One-click fixes for common issues

### Audit Logs

View security audit logs to track:
- Account connections and disconnections
- Token refresh events
- Failed connection attempts
- Configuration changes

## API Reference

### Get All Accounts

```bash
GET /make-server-7d87310d/social-accounts
```

Returns all connected accounts and audit logs.

### Initiate OAuth

```bash
POST /make-server-7d87310d/social-accounts/oauth/initiate
Content-Type: application/json

{
  "platform": "facebook"
}
```

Returns OAuth authorization URL.

### Auto-Reconnect

```bash
POST /make-server-7d87310d/social-accounts/auto-reconnect
Content-Type: application/json

{
  "accountId": "facebook_1234567890"
}
```

Attempts to refresh expired token using refresh token.

### Test Connection

```bash
POST /make-server-7d87310d/social-accounts/test
Content-Type: application/json

{
  "accountId": "facebook_1234567890"
}
```

Tests if the account connection is still valid.

## Troubleshooting

### OAuth Popup Blocked

If the OAuth popup is blocked by your browser:
1. Allow popups for your domain
2. Or use the "Authorize" link that appears
3. The system will detect when you return from OAuth

### Token Expired

The system automatically detects expired tokens and:
1. Updates the account status to "Expired"
2. Attempts auto-reconnect using refresh token
3. Shows a "Reconnect" button if auto-reconnect fails

### Missing Permissions

If posting fails due to missing permissions:
1. Disconnect the account
2. Reconnect and ensure all permissions are granted
3. The system will show required permissions in the expanded view

### Rate Limits

The system handles rate limits automatically:
- Queues requests when rate limit is reached
- Implements exponential backoff
- Retries failed requests

## Security Best Practices

1. **Never commit credentials**: Store all API keys in Supabase secrets
2. **Use environment-specific secrets**: Separate dev/staging/production credentials
3. **Monitor audit logs**: Regularly review for suspicious activity
4. **Rotate tokens**: Disconnect and reconnect accounts periodically
5. **Review permissions**: Only grant minimum required permissions

## Future Enhancements

- [ ] Team collaboration (share accounts across team)
- [ ] Account analytics dashboard
- [ ] Bulk operations (connect/disconnect multiple accounts)
- [ ] Custom OAuth callback handling
- [ ] Webhook support for real-time updates
- [ ] Advanced permission management
- [ ] Account health scoring

## Support

For issues or questions:
1. Check the audit logs for error details
2. Test connection to verify account status
3. Review platform-specific documentation
4. Ensure OAuth credentials are correctly configured

## Credits

Built with ❤️ using:
- React + TypeScript
- Hono (Edge Functions)
- Supabase (Backend & Storage)
- OAuth 2.0 (Authentication)
- AI-powered suggestions
