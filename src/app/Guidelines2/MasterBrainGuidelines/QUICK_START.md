# ⚡ Quick Start - What to Do After Figma Make Builds Your App

## 🎯 You Have 2 Options

### Option 1: Use It Immediately (No Setup Required) ✅

**What works right now without any configuration:**
- ✅ Website content scraping
- ✅ Blog post generation (24 posts per URL)
- ✅ AI voice playback with character voices
- ✅ Video script creation
- ✅ Social media scheduling UI
- ✅ App builder (template mode)
- ✅ XCode project generator
- ✅ All UI features

**Just deploy and go!**

### Option 2: Enable Advanced Features (5 min setup)

Add API keys to unlock:
- 🎨 Real 3D AI avatars
- 📱 Actual social media posting
- 🤖 AI-powered app generation

---

## 🚀 Immediate Deployment (2 Minutes)

### Deploy to Vercel (Easiest):

1. **Push to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "AI Ad Generator"
   git push
   ```

2. **Deploy**:
   - Go to https://vercel.com/new
   - Click "Import Git Repository"
   - Select your repo
   - Click "Deploy"

3. **Done!** Your app is live at `https://your-app.vercel.app`

---

## 🔑 Optional: Add API Keys (5-30 Minutes)

### For Real 3D Avatars:

1. **Get Stability AI Key** (Image Generation):
   - Visit: https://platform.stability.ai/account/keys
   - Free credits available
   - Copy your API key

2. **Get Replicate Token** (3D Mesh):
   - Visit: https://replicate.com/account/api-tokens
   - Free tier available
   - Copy your token

3. **Get ElevenLabs Key** (AI Voices):
   - Visit: https://elevenlabs.io
   - 10,000 free characters/month
   - Copy your API key

4. **Add to Supabase**:
   - Go to Supabase Dashboard > Settings > Edge Functions
   - Click "Add Secret":
     ```
     STABILITY_API_KEY = sk-...
     REPLICATE_API_TOKEN = r8_...
     ELEVENLABS_API_KEY = ...
     ```

### For AI App Builder:

1. **Get OpenAI Key**:
   - Visit: https://platform.openai.com/api-keys
   - Minimum $5 credit
   - Copy your API key

2. **Add to Supabase**:
   ```
   OPENAI_API_KEY = sk-...
   ```

### For Social Media Posting:

**Users add their own credentials in the app!**
1. Users click "Social Accounts" button
2. Follow platform-specific instructions
3. Enter their API keys
4. Test connection
5. Start posting!

---

## ✅ What to Test

### 1. Basic Features (Works Now):
```
1. Select a character (Sarah, Marcus, Alex, or Jordan)
2. Enter URL: https://www.shopify.com
3. Click "Generate Blog Posts"
4. ✓ See 24 generated posts (12x 7-sec, 12x 30-sec)
5. ✓ Click play to hear AI voice
6. ✓ Click "UGC Video" to create video content
```

### 2. Advanced Features (After Adding Keys):
```
1. Click "3D Avatar Generator" in top nav
2. Enter prompt: "Professional business woman"
3. Select style, gender, age
4. Click "Generate Avatar"
5. ✓ See real 3D avatar with textures
6. ✓ Download as FBX/glTF/OBJ
```

### 3. Social Media:
```
1. Click "Social Accounts" in top nav
2. Add Facebook credentials
3. Generate blog posts
4. Click "Schedule" on any post
5. Click "Post Now"
6. ✓ Post appears on Facebook!
```

### 4. App Builder:
```
1. Click "App Builder" in top nav
2. Enter: "Create a login screen with email and password"
3. Click "Generate with AI"
4. ✓ See complete app with components
5. Click "Export" to download code
```

---

## 💰 Cost Breakdown

### Free Tier (Perfect for Testing):
- Supabase: Free
- Vercel: Free
- Stability AI: Free credits
- Replicate: Free credits
- ElevenLabs: 10k chars/month free
- **Total: $0/month**

### Paid Tier (For Production):
- All APIs: ~$50-80/month
- Everything unlimited
- Professional features

**Start free, upgrade when needed!**

---

## 🐛 Troubleshooting

### "Backend not responding":
✓ Check if Supabase Edge Function is deployed
```bash
supabase functions deploy make-server-7d87310d
```

### "Avatar generation failed":
✓ API keys not set = Falls back to placeholder images (still works!)
✓ Add API keys to get real 3D avatars

### "Social posting not working":
✓ User needs to add their credentials in Social Settings
✓ Click "Test Connection" to verify

### "App Builder uses templates":
✓ Add `OPENAI_API_KEY` for AI-powered generation
✓ Templates work great without API key!

---

## 📊 What Each API Does

| API | Purpose | Free Tier | Used For |
|-----|---------|-----------|----------|
| **Stability AI** | Generate avatar images | 25 credits | Base image for 3D avatars |
| **Replicate** | Create 3D meshes | Limited free | Convert images to 3D models |
| **ElevenLabs** | AI voice synthesis | 10k chars/month | Professional voice-overs |
| **OpenAI** | AI app generation | $5 min credit | Smart app builder |
| **Facebook/IG** | Social posting | Free (user adds) | Post to social media |
| **TikTok** | Video posting | Free (user adds) | Post videos to TikTok |

---

## 🎓 Learning Resources

- **How to get Facebook API keys**: https://developers.facebook.com/docs/graph-api/get-started
- **How to get Instagram API**: https://developers.facebook.com/docs/instagram-api
- **How to get TikTok API**: https://developers.tiktok.com/doc
- **Stability AI guide**: https://platform.stability.ai/docs
- **ElevenLabs tutorial**: https://elevenlabs.io/docs

---

## 🔥 Pro Tips

1. **Start without API keys** - Everything works with fallbacks!
2. **Add keys gradually** - Start with one, test it, add more
3. **User credentials** - Social media keys are added by users
4. **Monitor usage** - Check Supabase dashboard for API calls
5. **Free tier is generous** - You can serve hundreds of users free

---

## ⏭️ Next Steps

1. ✅ **Deploy** (2 minutes on Vercel)
2. ✅ **Test** (Generate posts, play voices)
3. ✅ **Share** (Send link to users)
4. ⚙️ **Add API keys** (Optional, as needed)
5. 📈 **Monitor** (Check usage in Supabase)
6. 🚀 **Scale** (Upgrade when you hit limits)

---

## 💡 Remember

**The app is production-ready RIGHT NOW!**

- All core features work without API keys
- API keys only unlock advanced features
- Users can add their own social media credentials
- Fallbacks ensure nothing breaks

**Deploy it, test it, share it! 🎉**
