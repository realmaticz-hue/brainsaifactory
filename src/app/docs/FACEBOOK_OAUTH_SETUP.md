# Facebook OAuth Setup Guide - HTTPS Security Requirements

## ⚠️ Critical: HTTPS is Required

Facebook **requires** HTTPS for all OAuth redirect URIs. If you see the error:

> "Facebook has detected The Restoration Shop isn't using a secure connection to transfer information"

This means your OAuth redirect URI is using HTTP instead of HTTPS, which Facebook blocks for security reasons.

---

## 🚨 IMPORTANT: Add Your Redirect URI to Facebook App Settings

If you see this error:

> "This is an invalid redirect URI for this application"

**You MUST add your exact redirect URI to Facebook's "Valid OAuth Redirect URIs" list.**

### Quick Fix:
1. **Get Your Redirect URI**: Your app uses: `https://YOUR-DOMAIN-HERE/oauth-callback`
   - Example: `https://72b42755-3744-48aa-83b1-a615bc674b52-v2-figmaiframepreview.figma.site/oauth-callback`
2. **Add to Facebook**:
   - Go to [Facebook Developers](https://developers.facebook.com)
   - Select your app → **Facebook Login** → **Settings**
   - Scroll to **"Valid OAuth Redirect URIs"**
   - Click **"+ Add URI"**
   - Paste your exact redirect URI (must be HTTPS!)
   - Click **"Save Changes"**

**⚠️ The URI must match EXACTLY - including protocol (https://), domain, and path (/oauth-callback)**

---

## Quick Fix Checklist

✅ **1. Access your app via HTTPS**
- Correct: `https://your-domain.com`
- Wrong: `http://your-domain.com`

✅ **2. Configure Facebook App Settings**
- Go to [Facebook Developers](https://developers.facebook.com)
- Select your app → Facebook Login → Settings
- In **"Valid OAuth Redirect URIs"**, add:
  ```
  https://your-domain.com/oauth-callback
  ```
- **DO NOT** use `http://` - it will be rejected
- **MUST match exactly** - copy from your browser's address bar

✅ **3. Enable Strict Mode**
- In Facebook Login settings, enable **"Use Strict Mode for Redirect URIs"**
- This ensures only exact HTTPS matches are allowed

✅ **4. Enter Credentials in Social Accounts Hub**
- Open the Social Accounts Hub
- Click "OAuth Setup" button
- Expand the Facebook section
- Enter your App ID and App Secret
- Click "Save Credentials"

---

## Detailed Setup Instructions

### Step 1: Create Facebook App

1. Go to [Facebook Developers](https://developers.facebook.com)
2. Click **"My Apps"** → **"Create App"**
3. Choose app type: **"Consumer"** or **"Business"**
4. Fill in app details:
   - **App Name**: Your app name
   - **App Contact Email**: Your email
   - **Business Account**: (optional)

### Step 2: Add Facebook Login Product

1. In your app dashboard, click **"Add Product"**
2. Find **"Facebook Login"** and click **"Set Up"**
3. Choose **"Web"** platform
4. Enter your site URL: `https://your-domain.com`

### Step 3: Configure OAuth Settings

1. Go to **Facebook Login** → **Settings** (left sidebar)
2. Scroll to **"Valid OAuth Redirect URIs"**
3. Add your HTTPS redirect URI:
   ```
   https://your-domain.com/oauth-callback
   ```
4. Click **"Save Changes"**

**Important Security Settings:**
- ✅ Enable **"Use Strict Mode for Redirect URIs"**
- ✅ Enable **"Enforce HTTPS"**
- ✅ Disable **"Allow HTTP Origins"** (if present)

### Step 4: Get App Credentials

1. Go to **Settings** → **Basic** (left sidebar)
2. Copy your **App ID**
3. Click **"Show"** next to **App Secret** and copy it
4. **Keep these credentials secure!**

### Step 5: Configure Scopes/Permissions

1. Go to **Facebook Login** → **Settings**
2. Configure **"Permissions"**:
   - `public_profile` (default)
   - `pages_manage_posts` (for posting to pages)
   - `pages_read_engagement` (for analytics)
   - `instagram_basic` (for Instagram integration)
   - `instagram_content_publish` (for Instagram posting)

### Step 6: Enter Credentials in Your App

**Option A: Via Social Accounts Hub (Recommended)**
1. Open your app and navigate to Social Accounts Hub
2. Click **"OAuth Setup"** button
3. Expand **Facebook** section
4. Enter:
   - **Client ID / App ID**: Your Facebook App ID
   - **Client Secret / App Secret**: Your Facebook App Secret
5. Click **"Save Credentials"**

**Option B: Via Supabase Environment Variables**
1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **Edge Functions**
3. Add environment variables:
   ```
   FACEBOOK_APP_ID=your-app-id-here
   FACEBOOK_APP_SECRET=your-app-secret-here
   ```
4. Save and redeploy your edge functions

---

## Testing Your Configuration

### 1. Test Connection
1. Open Social Accounts Hub
2. Click **"Connect"** on Facebook
3. You should see the Facebook OAuth popup
4. Authorize the app
5. You should be redirected back successfully

### 2. Common Issues

**Issue: "Invalid OAuth redirect URI"**
- **Cause**: Redirect URI in Facebook app doesn't match the one used by your app
- **Fix**: Ensure the URI in Facebook settings exactly matches: `https://your-domain.com/oauth-callback`

**Issue: "App Not Setup: This app is still in development mode"**
- **Cause**: Facebook app is in development mode
- **Fix**: Either add test users in Facebook app settings, or make your app public (requires verification)

**Issue: "Not using secure connection"**
- **Cause**: Your app is accessed via HTTP instead of HTTPS
- **Fix**: Always access your app via `https://` URL

**Issue: "Permissions not granted"**
- **Cause**: Required permissions not configured in Facebook app
- **Fix**: Go to Facebook Login → Settings → Permissions and enable required scopes

---

## Production Deployment

Before going live with real users:

### 1. App Review (for advanced permissions)
- Most basic permissions work in development mode
- Advanced permissions require Facebook App Review
- Submit for review: [Facebook App Review](https://developers.facebook.com/docs/app-review)

### 2. Make App Public
1. Go to **Settings** → **Basic**
2. Scroll to **"App Mode"**
3. Toggle from **"Development"** to **"Live"**
4. Complete privacy policy URL requirement
5. Save changes

### 3. Security Best Practices
- ✅ Never commit credentials to Git
- ✅ Use environment variables only
- ✅ Rotate secrets regularly
- ✅ Monitor API usage in Facebook dashboard
- ✅ Enable rate limiting
- ✅ Use HTTPS everywhere

---

## Troubleshooting

### Enable Detailed Error Logging

In your browser console, check for detailed error messages:
```javascript
// Check redirect URI being used
console.log('OAuth Redirect URI:', window.location.origin + '/oauth-callback');
```

### Verify HTTPS
```bash
# Your app URL should start with https://
curl -I https://your-domain.com

# Should return:
# HTTP/2 200
# (not HTTP/1.1 301 redirect to HTTPS)
```

### Check Facebook App Status
1. Go to [Facebook Developers](https://developers.facebook.com)
2. Select your app
3. Check **"App Review"** → **"Permissions and Features"**
4. Ensure required permissions are approved or available in development mode

---

## Additional Resources

- [Facebook Login Documentation](https://developers.facebook.com/docs/facebook-login)
- [OAuth 2.0 Best Practices](https://developers.facebook.com/docs/facebook-login/security)
- [Instagram Basic Display API](https://developers.facebook.com/docs/instagram-basic-display-api)
- [Facebook Graph API](https://developers.facebook.com/docs/graph-api)

---

## Support

If you continue to experience issues:

1. **Check server logs**: Look for `[OAuth]` prefixed messages
2. **Verify credentials**: Ensure App ID and Secret are correct
3. **Test in development**: Add test users in Facebook app settings
4. **Contact support**: [Facebook Developer Support](https://developers.facebook.com/support)

---

**Remember: Always use HTTPS for production OAuth flows!** 🔒