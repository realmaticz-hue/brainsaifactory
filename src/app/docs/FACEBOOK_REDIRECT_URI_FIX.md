# 🚨 FACEBOOK OAUTH ERROR: Invalid Redirect URI - IMMEDIATE FIX

## Your Exact Error:
```
This is an invalid redirect URI for this application
You can make this URI valid by adding it to the list of valid OAuth redirect URIs above
```

## Your Exact Redirect URI:
```
https://72b42755-3744-48aa-83b1-a615bc674b52-v2-figmaiframepreview.figma.site/oauth-callback
```

---

## ⚡ QUICK FIX (5 Minutes)

### Step 1: Copy Your Redirect URI
**Copy this EXACT URL** (click the copy button or triple-click to select all):

```
https://72b42755-3744-48aa-83b1-a615bc674b52-v2-figmaiframepreview.figma.site/oauth-callback
```

⚠️ **CRITICAL**: Must be EXACTLY as shown, including `https://` and `/oauth-callback`

---

### Step 2: Open Facebook Developers

1. Go to: **https://developers.facebook.com/apps**
2. Log in with your Facebook account
3. Click on your app from the list

---

### Step 3: Navigate to Facebook Login Settings

1. Look at the **LEFT SIDEBAR**
2. Find and click **"Facebook Login"**  
3. Click **"Settings"** (under Facebook Login)

You should now see a page titled "Facebook Login Settings"

---

### Step 4: Add Your Redirect URI

1. Scroll down to find **"Valid OAuth Redirect URIs"** section
2. You'll see a text input box
3. **PASTE** your copied redirect URI into the box:
   ```
   https://72b42755-3744-48aa-83b1-a615bc674b52-v2-figmaiframepreview.figma.site/oauth-callback
   ```
4. Click **"Save Changes"** button at the bottom of the page

---

### Step 5: Try Again

1. Go back to your app
2. Close any error messages
3. Click the **"Connect"** button for Facebook again
4. It should work now! ✅

---

## 🎯 Visual Guide - What You're Looking For

In the Facebook Login Settings page, you need to find this section:

```
┌─────────────────────────────────────────────────────────────┐
│ Valid OAuth Redirect URIs                                   │
│                                                              │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ https://72b42755-...figma.site/oauth-callback          │ │ ← PASTE HERE
│ └────────────────────────────────────────────────────────┘ │
│                                                              │
│ [+ Add URI]                                                 │
└─────────────────────────────────────────────────────────────┘

                           ↓

┌─────────────────────────────────────────────────────────────┐
│                                                              │
│                   [Save Changes]                            │ ← CLICK THIS!
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## ❓ Still Not Working?

### Check These Common Issues:

1. **Did you click "Save Changes"?**
   - The URI won't be saved until you click the save button!

2. **Is the URI exactly the same?**
   - No extra spaces
   - Starts with `https://` (not http://)
   - Ends with `/oauth-callback`

3. **Are you in the right section?**
   - Must be in "Facebook Login" → "Settings"
   - NOT in "Basic Settings" or other sections

4. **Did you save in the right app?**
   - Make sure you're editing the correct Facebook app
   - The App ID should match the one you're using

---

## 🔧 Advanced Troubleshooting

If it's still not working after following all steps:

1. **Clear your browser cache**
   - Ctrl+Shift+Delete (Windows) or Cmd+Shift+Delete (Mac)
   - Clear cached images and files

2. **Try in an incognito/private window**
   - This helps rule out cookie/cache issues

3. **Check your App ID matches**
   - In Facebook app settings, note your App ID
   - In your app, make sure you're using the same App ID

4. **Wait 1-2 minutes**
   - Sometimes Facebook takes a moment to propagate changes

5. **Check if your app is in Development Mode**
   - In Facebook app settings, check the app mode
   - If in Development, make sure you're logged into Facebook with the same account

---

## 📚 Related Documentation

- [Complete Facebook OAuth Setup Guide](/docs/FACEBOOK_OAUTH_SETUP.md)
- [HTTPS Security Fix Summary](/docs/OAUTH_HTTPS_FIX_SUMMARY.md)
- [Facebook Official Docs](https://developers.facebook.com/docs/facebook-login)

---

## 💡 Understanding the Error

**What happened?**
- Your app tried to use a redirect URI that Facebook doesn't recognize
- Facebook requires you to whitelist all redirect URIs for security

**Why does Facebook require this?**
- Security: Prevents malicious sites from stealing OAuth tokens
- Control: You explicitly approve where Facebook can send users

**What is a redirect URI?**
- The URL where Facebook sends users after they authorize your app
- Your app's redirect URI: `https://your-domain/oauth-callback`
- This is where OAuth tokens are received

---

## ✅ Success Indicators

You'll know it worked when:
- ✅ Facebook OAuth popup opens without errors
- ✅ You can click "Continue" in the Facebook authorization dialog
- ✅ You're redirected back to your app
- ✅ Your Facebook account appears in the Social Accounts Hub

---

**Need more help?** Check `/pages/FacebookOAuthHelp` in your app for an interactive guide!
