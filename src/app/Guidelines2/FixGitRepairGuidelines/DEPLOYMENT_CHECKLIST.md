# 🚀 Deployment Checklist - Step by Step

## Quick Overview

**Current Status:** ✅ App works in demo mode (no setup needed)  
**To Go Live:** Need to deploy backend + add API keys  
**Time to Deploy:** 30 minutes to 2 hours  
**Cost to Start:** $0 (completely free tier)

---

## 🎯 **Choose Your Path**

### **Path A: Stay in Demo Mode (0 minutes, $0)**
✅ App Builder works fully  
✅ Avatar Generator works fully  
✅ UI/UX fully functional  
❌ No real social posting  
❌ No real voice synthesis  
❌ No real video rendering  

**Good for:** Learning, prototyping, showing to investors

### **Path B: Deploy Backend Only (30 mins, $0)**
✅ Everything in Path A  
✅ Real website scraping  
✅ Data persistence  
✅ User authentication  
❌ Still need API keys for voice/video  

**Good for:** Testing, small projects, MVP

### **Path C: Full Production (2 hours, $25-77/mo)**
✅ Everything working  
✅ Real AI voices  
✅ Real video rendering  
✅ Real social posting  
✅ Professional quality  

**Good for:** Real business, clients, revenue

---

## 📋 **Path B: Backend Deployment (Recommended Start)**

### **What You'll Need:**
- Email address
- GitHub account (optional)
- 30 minutes of time

### **Step-by-Step:**

## ✅ **Step 1: Create Supabase Account (5 mins)**

1. Go to https://supabase.com
2. Click "Start your project"
3. Sign up with:
   - GitHub (recommended)
   - OR Email + Password
4. Verify your email

**✓ Checkpoint:** You should see Supabase dashboard

---

## ✅ **Step 2: Create New Project (3 mins)**

1. Click "New Project" button
2. Fill in:
   - **Name:** `ai-ad-platform`
   - **Database Password:** [Create strong password - SAVE THIS!]
   - **Region:** Choose closest to you:
     - US East: Virginia
     - US West: Oregon
     - Europe: Frankfurt
     - Asia: Singapore
   - **Pricing Plan:** Free
3. Click "Create new project"
4. Wait 2-3 minutes for setup

**✓ Checkpoint:** Project shows "Active" status

---

## ✅ **Step 3: Get Your API Keys (2 mins)**

1. In your Supabase project, click "Settings" (⚙️ icon, bottom left)
2. Click "API" in settings menu
3. You'll see:

```
Project URL: https://xxxxxxxxxxxxx.supabase.co
```

Copy this, you'll need it!

**anon public key:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ey...
```
Copy this too!

**service_role key:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ey...
```
Copy this as well!

**✓ Checkpoint:** You have 3 things copied:
- [ ] Project URL
- [ ] anon public key  
- [ ] service_role key

---

## ✅ **Step 4: Update Your App (3 mins)**

Open your project in code editor

**File: `/utils/supabase/info.tsx`**

Replace these lines:

```typescript
// BEFORE (example values):
export const projectId = 'xzkqzukofphjwmwqzztz';
export const publicAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

// AFTER (your actual values):
export const projectId = 'xxxxxxxxxxxxx'; // From your Project URL
export const publicAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ey...'; // Your anon key
```

**How to get projectId from URL:**
If your Project URL is: `https://abcdefghijk.supabase.co`
Your projectId is: `abcdefghijk` (the part before .supabase.co)

**✓ Checkpoint:** File updated with your credentials

---

## ✅ **Step 5: Install Supabase CLI (5 mins)**

### **On Mac:**
```bash
brew install supabase/tap/supabase
```

### **On Windows:**
```powershell
# Using Scoop
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

### **On Linux:**
```bash
# Using npm (works on all platforms)
npm install -g supabase
```

**Verify installation:**
```bash
supabase --version
```

Should show: `1.x.x` or higher

**✓ Checkpoint:** `supabase --version` works

---

## ✅ **Step 6: Login to Supabase CLI (2 mins)**

```bash
supabase login
```

This will:
1. Open browser
2. Ask you to authorize
3. Click "Authorize"
4. Return to terminal

**✓ Checkpoint:** Terminal shows "Logged in successfully"

---

## ✅ **Step 7: Link Your Project (2 mins)**

```bash
# Navigate to your project folder first
cd /path/to/your/project

# Link to your Supabase project
supabase link --project-ref xxxxxxxxxxxxx
```

Replace `xxxxxxxxxxxxx` with your projectId from Step 3

**Enter your database password** when prompted (from Step 2)

**✓ Checkpoint:** Terminal shows "Linked to project"

---

## ✅ **Step 8: Set Environment Variables (3 mins)**

```bash
# Set your Supabase URL
supabase secrets set SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co

# Set your anon key
supabase secrets set SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ey...

# Set your service role key
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ey...
```

**Replace with YOUR actual values from Step 3!**

After each command, you should see:
```
✓ Successfully set secret
```

**✓ Checkpoint:** All 3 secrets set successfully

---

## ✅ **Step 9: Deploy Edge Function (5 mins)**

```bash
# Deploy the server function
supabase functions deploy server
```

This will:
1. Upload your function code
2. Install dependencies
3. Build the function
4. Deploy to Supabase edge network

**You should see:**
```
Deploying function: server
✓ Function deployed successfully
URL: https://xxxxxxxxxxxxx.supabase.co/functions/v1/server
```

**✓ Checkpoint:** Function deployed, URL shown

---

## ✅ **Step 10: Test Backend (2 mins)**

Test your backend is working:

```bash
# Test the scrape endpoint
curl -X POST \
  https://xxxxxxxxxxxxx.supabase.co/functions/v1/make-server-7d87310d/scrape \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'
```

Replace:
- `xxxxxxxxxxxxx` with your projectId
- `YOUR_ANON_KEY` with your anon key

**You should see JSON response with:**
```json
{
  "success": true,
  "data": {
    "title": "...",
    "description": "...",
    ...
  }
}
```

**✓ Checkpoint:** Backend returns real data!

---

## ✅ **Step 11: Deploy Frontend (Optional - 5 mins)**

### **Option A: Deploy to Vercel (Recommended)**

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? Your account
# - Link to existing project? No
# - What's your project name? ai-ad-platform
# - In which directory? ./
# - Override settings? No

# Production deployment
vercel --prod
```

**You'll get a URL like:** `https://ai-ad-platform.vercel.app`

### **Option B: Deploy to Netlify**

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy

# Follow prompts
# Then production:
netlify deploy --prod
```

**You'll get a URL like:** `https://ai-ad-platform.netlify.app`

### **Option C: Keep Running Locally**

```bash
# Just run locally
npm run dev
```

**Access at:** `http://localhost:5173`

**✓ Checkpoint:** App accessible via URL

---

## ✅ **Step 12: Test Everything (3 mins)**

1. **Open your app** (Vercel URL or localhost)
2. **Select a character**
3. **Enter a website URL** (try `https://amazon.com`)
4. **Click "Generate Blog Posts"**

**You should see:**
- ✅ Real content extracted from website
- ✅ 24 blog posts generated
- ✅ No "demo mode" message
- ✅ Actual product information

**✓ Checkpoint:** Real scraping works!

---

## 🎉 **Backend Deployment Complete!**

**What's Now Working:**
✅ Real website scraping  
✅ Content extraction  
✅ Data storage in Supabase  
✅ Blog post generation  
✅ App Builder (full)  
✅ Avatar Generator (full)  

**What Still Needs Setup:**
⚠️ AI voice synthesis (needs API key)  
⚠️ Video rendering (needs service)  
⚠️ Social media posting (needs tokens)  

**Total Time:** ~30 minutes  
**Total Cost:** $0 (using free tier)

---

## 📋 **Path C: Add Voice Synthesis (Optional)**

### **Free Option: Google Cloud TTS**

## ✅ **Step 1: Create Google Cloud Account (3 mins)**

1. Go to https://console.cloud.google.com
2. Sign in with Google account
3. Accept terms
4. Set up billing (free tier, no charges)

## ✅ **Step 2: Create Project (2 mins)**

1. Click "Select a project" → "New Project"
2. Name: `ai-ad-platform`
3. Click "Create"
4. Wait for project creation

## ✅ **Step 3: Enable Text-to-Speech API (2 mins)**

1. Search for "Text-to-Speech API"
2. Click on it
3. Click "Enable"
4. Wait for activation

## ✅ **Step 4: Create Service Account (3 mins)**

1. Go to "IAM & Admin" → "Service Accounts"
2. Click "Create Service Account"
3. Name: `tts-service`
4. Role: "Cloud Text-to-Speech User"
5. Click "Done"

## ✅ **Step 5: Create Key (2 mins)**

1. Click on service account you just created
2. Go to "Keys" tab
3. Click "Add Key" → "Create new key"
4. Choose "JSON"
5. Click "Create"
6. **JSON file downloads - SAVE THIS!**

## ✅ **Step 6: Add to Supabase (3 mins)**

```bash
# Read the JSON file content
cat ~/Downloads/ai-ad-platform-xxxxx.json

# Copy entire content, then:
supabase secrets set GOOGLE_TTS_CREDENTIALS='{"type":"service_account","project_id":"..."...}'
```

**Paste the entire JSON as the value!**

## ✅ **Step 7: Update Server Code (5 mins)**

Add to `/supabase/functions/server/index.tsx`:

```typescript
import { TextToSpeechClient } from '@google-cloud/text-to-speech';

// Initialize TTS client
const ttsClient = new TextToSpeechClient({
  credentials: JSON.parse(Deno.env.get('GOOGLE_TTS_CREDENTIALS') || '{}')
});

// Add TTS endpoint
app.post('/make-server-7d87310d/synthesize-voice', async (c) => {
  const { text, voice } = await c.req.json();
  
  const [response] = await ttsClient.synthesizeSpeech({
    input: { text },
    voice: {
      languageCode: 'en-US',
      name: voice || 'en-US-Neural2-F'
    },
    audioConfig: {
      audioEncoding: 'MP3'
    }
  });
  
  return c.json({
    success: true,
    audio: response.audioContent.toString('base64')
  });
});
```

## ✅ **Step 8: Redeploy (2 mins)**

```bash
supabase functions deploy server
```

**✓ Voice synthesis now works!**

**Cost:** FREE (1 million characters/month)

---

## 📋 **Common Issues & Solutions**

### **Issue: "Failed to deploy function"**

**Solution:**
```bash
# Check your function code for errors
supabase functions serve server

# Test locally first
curl http://localhost:54321/functions/v1/make-server-7d87310d/scrape
```

### **Issue: "Permission denied"**

**Solution:**
```bash
# Re-login to Supabase
supabase logout
supabase login

# Re-link project
supabase link --project-ref xxxxxxxxxxxxx
```

### **Issue: "Module not found"**

**Solution:**
```bash
# Make sure all dependencies are in server code
# Check /supabase/functions/server/index.tsx imports
```

### **Issue: "CORS error in browser"**

**Solution:**
Already handled! Server has CORS enabled:
```typescript
app.use('*', cors({
  origin: '*',
  credentials: true
}));
```

### **Issue: "Backend still using demo mode"**

**Solution:**
1. Check `/utils/supabase/info.tsx` has correct keys
2. Clear browser cache
3. Hard refresh (Ctrl+Shift+R)
4. Check browser console for errors

---

## 🎯 **Verification Checklist**

After deployment, verify everything works:

### **Backend:**
- [ ] Supabase project is active
- [ ] Edge function is deployed
- [ ] Secrets are set (3 secrets)
- [ ] Function returns 200 OK

### **Frontend:**
- [ ] App loads without errors
- [ ] Character selection works
- [ ] URL input accepts text
- [ ] Generate button is clickable

### **Integration:**
- [ ] Website scraping returns real data
- [ ] Blog posts are generated
- [ ] No "demo mode" message
- [ ] Products are extracted
- [ ] Content looks correct

### **Optional Features:**
- [ ] Voice synthesis works (if set up)
- [ ] Video rendering works (if set up)
- [ ] Social posting works (if set up)

---

## 📊 **What You Have Now**

### **Free Tier Deployment:**

**Infrastructure:**
- ✅ Supabase (500MB database, 1GB storage)
- ✅ Vercel/Netlify hosting (unlimited bandwidth)
- ✅ Edge functions (2 CPU hours/day)

**Features:**
- ✅ Website scraping (real-time)
- ✅ Content extraction
- ✅ Blog post generation (24 variants)
- ✅ App Builder (full functionality)
- ✅ Avatar Generator (full customization)
- ✅ Export capabilities
- ✅ Settings persistence

**Limitations:**
- ⚠️ No AI voice (needs API key)
- ⚠️ No video rendering (needs service)
- ⚠️ No social posting (needs tokens)

**Usage Limits:**
- Database: 500MB
- Storage: 1GB
- API calls: Unlimited
- Bandwidth: Unlimited
- Functions: 2 hours CPU/day (renews daily)

**Cost:** $0/month

---

## 🚀 **Next Steps**

### **To Add More Features:**

1. **Add Voice Synthesis** (see Path C above)
   - Free: Google TTS (1M chars/month)
   - Paid: ElevenLabs ($22/mo for quality)

2. **Add Video Rendering**
   - Free: FFmpeg on server
   - Paid: Remotion Lambda (~$0.05/video)

3. **Add Social Posting**
   - Free: Facebook/Instagram/TikTok APIs
   - Setup: Get API tokens (see /PRODUCTION_REQUIREMENTS.md)

4. **Upgrade Hosting**
   - When you hit free tier limits
   - Supabase Pro: $25/mo (8GB database)
   - Vercel Pro: $20/mo (advanced features)

### **To Scale:**

1. **Monitor Usage**
   - Check Supabase dashboard for limits
   - Watch function execution time
   - Track storage usage

2. **Optimize**
   - Cache frequent requests
   - Compress images
   - Batch operations

3. **Upgrade When Needed**
   - Database full? Upgrade Supabase
   - Too many API calls? Add caching
   - Need faster functions? Upgrade plan

---

## 📞 **Need Help?**

### **Supabase Issues:**
- Docs: https://supabase.com/docs
- Discord: https://discord.supabase.com
- GitHub: https://github.com/supabase/supabase

### **Deployment Issues:**
- Check logs: `supabase functions logs server`
- Test locally: `supabase functions serve server`
- Check status: `supabase status`

### **App Issues:**
- Check browser console (F12)
- Check network tab for failed requests
- Verify API keys in `/utils/supabase/info.tsx`

---

## ✅ **Summary**

**Time Investment:**
- Backend deployment: 30 minutes
- Voice setup: 15 minutes
- Social setup: 30 minutes
- Total: ~75 minutes for full setup

**Cost:**
- Free tier: $0/month (perfect for testing)
- With voice: $0/month (Google TTS free)
- Professional: $47/month (ElevenLabs + Supabase Pro)
- Enterprise: $176/month (all premium services)

**What You Get:**
- Real website scraping
- AI-powered content generation
- Professional app builder
- Advanced avatar creator
- Multi-platform export
- Production-ready platform

**Start free, add features as you need them!** 🎉
