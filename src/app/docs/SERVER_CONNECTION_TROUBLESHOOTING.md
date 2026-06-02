# 🔧 Server Connection Troubleshooting Guide

## Error: "Failed to fetch"

This error means the Supabase Edge Function isn't responding. Here's what's been done and what to check:

---

## ✅ What Was Just Fixed

### 1. **CORS Configuration Added**
The server now has proper CORS headers configured:
```typescript
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));
```

### 2. **Health Check Endpoint Created**
You can now check if the server is running:
- **URL:** `https://bepcmibntfsijkqrlfzd.supabase.co/functions/v1/make-server-7d87310d/health`
- **Returns:** `{ status: "ok", timestamp: ..., routes: [...] }`

### 3. **Auto-Retry Logic**
The app will automatically retry connecting to the server:
- **Attempt 1:** After 5 seconds
- **Attempt 2:** After 10 seconds
- **Attempt 3:** After 20 seconds

### 4. **Better Logging**
Server startup now logs:
```
🚀 [Server] Starting Edge Function...
✅ [Server] CORS configured
✅ [Server] Logger configured
✅ [Server] All routes registered
🎯 [Server] Health check available at /make-server-7d87310d/health
```

---

## 🔍 Troubleshooting Steps

### Step 1: Wait for Deployment
**What to do:** Wait 30-60 seconds after making code changes.

**Why:** Figma Make needs time to:
1. Detect the code change
2. Bundle the Edge Function
3. Deploy to Supabase
4. Start the function

**Check:** Look for startup logs in Supabase Edge Function logs.

---

### Step 2: Check Browser Console
**What to do:**
1. Press **F12** to open DevTools
2. Go to **Console** tab
3. Look for these messages:

**✅ Good Signs:**
```
[serverFetch] → GET https://...supabase.co/functions/v1/make-server-7d87310d/health
[serverFetch] ✓ 200 OK for https://...
[HealthCheck] ✅ Server is healthy: { status: "ok", ... }
```

**❌ Bad Signs:**
```
[serverFetch] ✗ Fetch failed for https://...
[HealthCheck] ❌ Health check failed: TypeError: Failed to fetch
```

---

### Step 3: Manual Health Check
**What to do:** Test the health endpoint directly.

**Option A - Browser:**
Open this URL in a new tab:
```
https://bepcmibntfsijkqrlfzd.supabase.co/functions/v1/make-server-7d87310d/health?apikey=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRhamh2d3N6eXdvZWp2cWV4bmxiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU1ODY5NzUsImV4cCI6MjA1MTE2Mjk3NX0.e1c-5o8eC0kBSH2kVKJmv9rDrA9pEsA-gTJBg1N5C4A
```

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": 1234567890,
  "message": "Edge Function is running",
  "routes": ["/health", "/social-accounts", ...]
}
```

**Option B - curl:**
```bash
curl -H "Authorization: Bearer eyJhbGc..." \
  https://bepcmibntfsijkqrlfzd.supabase.co/functions/v1/make-server-7d87310d/health
```

---

### Step 4: Check Supabase Dashboard
**What to do:**
1. Go to: https://supabase.com/dashboard/project/bepcmibntfsijkqrlfzd
2. Click **Edge Functions** in the left sidebar
3. Look for the **"server"** function
4. Check its status:
   - ✅ **Deployed** = Good!
   - ⏳ **Deploying** = Wait a bit
   - ❌ **Failed** = Check logs for errors
5. Click on the function to see logs
6. Look for startup messages or error stack traces

---

### Step 5: Common Error Patterns

#### Error: "CORS policy"
**Solution:** Already fixed! Just wait for redeployment.

#### Error: "Syntax error" or "Unexpected token"
**Problem:** Code syntax error preventing server from starting.
**Solution:** Check the server file for TypeScript/JavaScript errors.

#### Error: "Module not found"
**Problem:** Missing import or file.
**Solution:** Verify all imports exist in `/supabase/functions/server/`.

#### Error: "Function timeout"
**Problem:** Server is taking too long to start.
**Solution:** Reduce imports or split into smaller functions.

---

## 🎯 Current Status Checklist

- [x] **CORS configured** - Done! Server has proper headers
- [x] **Health endpoint created** - `/health` route added
- [x] **Logging added** - Server logs startup messages
- [x] **Auto-retry implemented** - App retries 3 times automatically
- [ ] **Server deployed** - Waiting for Figma Make to deploy changes
- [ ] **Server healthy** - Will be confirmed once deployed

---

## 🚀 What Happens Next

### Automatic Process:
1. **Figma Make detects changes** (within 10-30 seconds)
2. **Builds Edge Function** with new CORS config
3. **Deploys to Supabase** (takes 30-60 seconds)
4. **Server starts** and logs startup messages
5. **Health check succeeds** ✅
6. **Error banner disappears** from your app

### Timeline:
- **0-30s:** Detection
- **30-90s:** Build & Deploy
- **90-120s:** Server ready
- **120s+:** Fully operational

---

## 💡 While You Wait

### The app will work in Demo Mode:
- Social Accounts will create demo accounts
- OAuth won't work with real platforms yet
- But you can test the UI and flow

### Once Server is Healthy:
1. The error banner will disappear
2. You can configure Facebook App ID & Secret
3. Real OAuth will work
4. All features will be fully functional

---

## 🆘 If Still Not Working After 5 Minutes

### Try This:
1. **Hard refresh** the page (Ctrl+Shift+R or Cmd+Shift+R)
2. **Clear cache** and reload
3. **Check Supabase logs** for specific error messages
4. **Look at the code** in `/supabase/functions/server/index.tsx` for syntax errors

### Last Resort:
Create a minimal test endpoint to verify deployment is working:
```typescript
app.get('/make-server-7d87310d/ping', (c) => c.text('pong'));
```

If even this doesn't work, there may be a deeper Supabase configuration issue.

---

## 📊 Monitoring Server Health

Once the server is running, you can monitor it:

### In Your App:
- Watch for the health check banner
- Check browser console for `[HealthCheck]` logs

### In Supabase:
- Edge Functions → server → Logs
- Look for request logs and startup messages

### Manual Tests:
- Hit the `/health` endpoint periodically
- Check response time and status

---

**Next Step:** Wait 2-3 minutes for the Edge Function to redeploy with the CORS fix, then refresh your page! 🎉
