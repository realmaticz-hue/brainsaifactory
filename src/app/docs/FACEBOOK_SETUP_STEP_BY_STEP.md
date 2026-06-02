# 🚨 CRITICAL: You Need Facebook App ID & App Secret (Not Access Token!)

## The Problem

You're in **DEMO MODE** because the system needs your **Facebook App ID** and **Facebook App Secret**, NOT an access token.

The token you provided (`EAAel785lGu0...`) is a User/App Access Token, which is different from what we need for OAuth.

---

## What You Need to Get from Facebook

### 1. **App ID** (looks like: `123456789012345`)
### 2. **App Secret** (looks like: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`)

---

## HOW TO GET THESE (Step-by-Step)

### Step 1: Go to Facebook Developers

1. Open: **https://developers.facebook.com/apps**
2. Log in with your Facebook account
3. You should see your app in the list

### Step 2: Find Your App ID

1. Click on your app
2. Look at the top of the page - you'll see **"App ID"** displayed prominently
3. It's a long number like: `123456789012345`
4. **COPY THIS** - you'll need it in a moment

### Step 3: Find Your App Secret

1. On the same page, look at the left sidebar
2. Click **"Settings"** → **"Basic"**
3. You'll see **"App Secret"**
4. Click **"Show"** button next to it
5. Facebook will ask you to re-enter your password
6. After you enter your password, the App Secret will be revealed
7. It looks like: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`
8. **COPY THIS** - you'll need it in a moment

---

## HOW TO CONFIGURE IN YOUR APP

### Step 1: Open Social Accounts Hub

1. In your app, click **"Social Accounts"** button (top navigation)
2. The Social Accounts Hub modal will open

### Step 2: Open OAuth Setup

1. Look for the **"OAuth Setup"** button in the top-right of the modal
2. Click it
3. You'll see a list of platforms

### Step 3: Configure Facebook

1. Find the **Facebook** card
2. You'll see two input fields:
   - **Client ID** (this is your App ID)
   - **Client Secret** (this is your App Secret)
3. Paste your **App ID** into the **Client ID** field
4. Paste your **App Secret** into the **Client Secret** field
5. Click **"Save Credentials"** button

### Step 4: Test Connection

1. Click **"Back to Accounts"** button
2. Now find Facebook in the platforms list
3. Click **"Connect"** button
4. It should now open the REAL Facebook OAuth dialog (not demo mode!)

---

## Visual Reference

### What You're Looking For in Facebook Developers:

```
┌─────────────────────────────────────────────────────┐
│ My App                                              │
│                                                     │
│ App ID: 123456789012345  ← COPY THIS               │
│                                                     │
└─────────────────────────────────────────────────────┘

Then go to Settings → Basic:

┌─────────────────────────────────────────────────────┐
│ Basic Settings                                      │
│                                                     │
│ App ID: 123456789012345                            │
│                                                     │
│ App Secret: ****************  [Show] ← CLICK THIS  │
│                                                     │
└─────────────────────────────────────────────────────┘

After clicking Show and entering password:

┌─────────────────────────────────────────────────────┐
│ App Secret: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6       │
│             ← COPY THIS                             │
└─────────────────────────────────────────────────────┘
```

---

## Complete Checklist

### In Facebook Developers Console:

- [ ] Found my App ID (Settings → Basic or top of dashboard)
- [ ] Copied App ID
- [ ] Found my App Secret (Settings → Basic, clicked "Show")
- [ ] Entered my Facebook password to reveal secret
- [ ] Copied App Secret
- [ ] Confirmed redirect URI is in Facebook Login → Settings → Valid OAuth Redirect URIs:
  ```
  https://cdcf1c11-d678-4b57-858d-a87db6cb11f7-v2-figmaiframepreview.figma.site/oauth-callback
  ```
- [ ] Clicked "Save Changes" in Facebook

### In Your App:

- [ ] Opened Social Accounts Hub
- [ ] Clicked "OAuth Setup" button
- [ ] Found Facebook card
- [ ] Pasted App ID into "Client ID" field
- [ ] Pasted App Secret into "Client Secret" field
- [ ] Clicked "Save Credentials"
- [ ] Clicked "Back to Accounts"
- [ ] Clicked "Connect" on Facebook
- [ ] Real OAuth dialog opened (not demo!)
- [ ] Authorized the app
- [ ] Account appeared in Social Accounts Hub

---

## Important Notes

### ❌ **What Won't Work:**
- Using an Access Token (like `EAAel785lGu0...`)
- Using a User Token
- Using a Page Access Token
- These are all different from App ID/Secret!

### ✅ **What You Need:**
- **App ID** - from Settings → Basic
- **App Secret** - from Settings → Basic (click "Show")

### 🔒 **Security:**
- Your App Secret is like a password - keep it secure!
- Never share it publicly
- The system encrypts it before storing
- It's stored securely in Supabase KV with AES-256 encryption

---

## After You Configure

Once you save the App ID and Secret:

1. **Demo mode will be disabled** for Facebook
2. Clicking "Connect" will open the **real Facebook OAuth dialog**
3. You'll be able to connect your actual Facebook account/pages
4. The system will store the OAuth tokens securely
5. You can post to Facebook, manage pages, etc.

---

## Troubleshooting

### Still showing demo mode?
- Make sure you clicked "Save Credentials"
- Try refreshing the Social Accounts Hub (close and reopen)
- Check browser console for any errors

### OAuth popup closes immediately?
- Check that redirect URI is configured in Facebook
- Make sure App Secret is correct (not a token)

### "Invalid client ID"?
- Double-check you copied the App ID correctly
- Make sure there are no extra spaces

### "Invalid client secret"?
- Click "Show" again in Facebook and copy carefully
- Make sure you're copying the App Secret, not a token

---

## Quick Test

To verify your credentials are saved:

1. Open browser console (F12)
2. In Social Accounts Hub, click "Connect" on Facebook
3. Look for this log message:
   ```
   [OAuth] Using saved credentials for facebook from KV store
   ```
4. If you see "demo mode" instead, credentials weren't saved correctly

---

## Need More Help?

1. **Facebook Developer Docs:** https://developers.facebook.com/docs/development/create-an-app
2. **OAuth Guide:** `/docs/OAUTH_SETUP_COMPLETE.md`
3. **Facebook OAuth Setup:** `/docs/FACEBOOK_OAUTH_SETUP.md`

---

**NEXT STEP: Get your App ID and App Secret from Facebook, then paste them into the OAuth Setup panel in your app!**
