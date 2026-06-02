# 🏗️ Platform Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     USER INTERFACE                          │
│  (React + TypeScript + Tailwind CSS)                        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   CORE FEATURES                             │
├─────────────────┬──────────────┬────────────┬───────────────┤
│  App Builder    │ Avatar Gen   │ Ad Creator │ Video System  │
│  (Professional) │ (Synthesia)  │ (24 vars)  │ (Multi-res)   │
└─────────────────┴──────────────┴────────────┴───────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                 DATA LAYER                                  │
├──────────────────────┬──────────────────────────────────────┤
│  localStorage        │  Supabase (PostgreSQL)               │
│  (Fallback)          │  (Production)                        │
└──────────────────────┴──────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              EXTERNAL SERVICES (Optional)                   │
├─────────────┬──────────────┬──────────────┬─────────────────┤
│ Voice APIs  │ Video APIs   │ Social APIs  │ 3D APIs         │
│ ElevenLabs  │ Remotion     │ Facebook     │ D-ID            │
│ Google TTS  │ FFmpeg       │ Instagram    │ HeyGen          │
│ OpenAI TTS  │ Shotstack    │ TikTok       │ Ready Player Me │
└─────────────┴──────────────┴──────────────┴─────────────────┘
```

---

## Data Flow

### **1. Ad Generation Flow**

```
User Input (URL)
      │
      ▼
┌──────────────────┐
│  Backend Scraper │  ← Supabase Edge Function
└──────────────────┘
      │
      ▼ (HTML content)
┌──────────────────┐
│ Business Extractor│ ← AI parsing
└──────────────────┘
      │
      ▼ (Structured data)
┌──────────────────┐
│  Blog Generator  │  ← 6 copywriting strategies
└──────────────────┘
      │
      ▼ (24 variations)
┌──────────────────┐
│   Voice Synthesis│  ← Optional AI voice
└──────────────────┘
      │
      ▼ (Audio files)
┌──────────────────┐
│  Video Renderer  │  ← Optional video creation
└──────────────────┘
      │
      ▼ (Video files)
┌──────────────────┐
│  Social Poster   │  ← Multi-platform deployment
└──────────────────┘
      │
      ▼
   Published Ads
```

### **2. App Builder Flow**

```
User Prompt
      │
      ▼
┌──────────────────┐
│ Prompt Analyzer  │  ← Detect app type, features
└──────────────────┘
      │
      ▼
┌──────────────────┐
│ Schema Generator │  ← Create database tables
└──────────────────┘
      │
      ▼
┌──────────────────┐
│  API Generator   │  ← Generate endpoints
└──────────────────┘
      │
      ▼
┌──────────────────┐
│  Code Generator  │  ← React + Swift + Kotlin
└──────────────────┘
      │
      ▼
┌──────────────────┐
│   UI Generator   │  ← Create screens
└──────────────────┘
      │
      ▼
  Complete App Code
```

### **3. Avatar Generation Flow**

```
Input (Text/Photo/Preset)
      │
      ▼
┌──────────────────┐
│  Feature Analyzer│  ← Extract characteristics
└──────────────────┘
      │
      ▼
┌──────────────────┐
│  3D Model Builder│  ← Generate base mesh
└──────────────────┘
      │
      ▼
┌──────────────────┐
│ Texture Generator│  ← Apply skin, hair, clothes
└──────────────────┘
      │
      ▼
┌──────────────────┐
│ Voice Configurator│ ← Set voice parameters
└──────────────────┘
      │
      ▼
┌──────────────────┐
│Animation System  │  ← Add expressions, movements
└──────────────────┘
      │
      ▼
   Ready Avatar
```

---

## Component Architecture

### **Frontend Components**

```
/App.tsx (Main Application)
  │
  ├─ CharacterSelector
  │   └─ Character cards with avatars
  │
  ├─ UrlInput
  │   └─ Website URL input + validation
  │
  ├─ BlogPostCard (x24)
  │   ├─ Content display
  │   ├─ Voice player
  │   ├─ Social sharing
  │   └─ Export options
  │
  ├─ CustomAvatarCreator
  │   ├─ Photo upload
  │   ├─ Feature customization
  │   └─ Voice selection
  │
  ├─ VideoScriptCreator
  │   ├─ Script editor
  │   ├─ Voice preview
  │   └─ Resolution selector
  │
  ├─ SocialMediaSettings
  │   ├─ Account connections
  │   ├─ Post scheduling
  │   └─ Platform selection
  │
  ├─ XCodeGeneratorModal
  │   ├─ iOS/Mac project generation
  │   ├─ Swift code export
  │   └─ Project download
  │
  ├─ ProfessionalAppBuilder ⭐ NEW
  │   ├─ Text prompt input
  │   ├─ Live preview
  │   ├─ Database designer
  │   ├─ API documentation
  │   └─ Multi-platform export
  │
  └─ Professional3DAvatarGen ⭐ NEW
      ├─ Generation modes (Text/Photo/Preset)
      ├─ Appearance customization (40+ options)
      ├─ Voice configuration (50+ voices)
      ├─ Animation controls
      └─ Export options (MP4/FBX/GLB/JSON)
```

### **Backend Services**

```
/supabase/functions/server/index.tsx
  │
  ├─ /make-server-7d87310d/scrape
  │   ├─ Website scraping
  │   ├─ Content extraction
  │   └─ Product detection
  │
  ├─ /make-server-7d87310d/generate-voice (Optional)
  │   ├─ Text-to-speech
  │   └─ Audio file creation
  │
  ├─ /make-server-7d87310d/render-video (Optional)
  │   ├─ Video composition
  │   ├─ Avatar animation
  │   └─ Export rendering
  │
  ├─ /make-server-7d87310d/post-social (Optional)
  │   ├─ Facebook posting
  │   ├─ Instagram posting
  │   ├─ TikTok posting
  │   └─ YouTube uploading
  │
  └─ /make-server-7d87310d/storage
      ├─ File upload
      ├─ Asset management
      └─ CDN serving
```

### **Utility Modules**

```
/utils/
  │
  ├─ businessExtractor.ts
  │   └─ Extract business data from URLs
  │
  ├─ blogGenerator.ts
  │   └─ Generate 24 ad variations
  │
  ├─ avatarGenerator.ts
  │   └─ Custom avatar configuration
  │
  ├─ voiceLibrary.ts
  │   └─ 50+ voice profiles
  │
  ├─ videoResolutions.ts
  │   └─ Resolution presets
  │
  ├─ socialMediaAccounts.ts
  │   └─ Account management
  │
  ├─ socialMediaScheduler.ts
  │   └─ Post scheduling
  │
  └─ supabase/
      ├─ info.tsx (API keys)
      └─ client.ts (Supabase client)
```

---

## Database Schema

### **Supabase PostgreSQL Tables**

```sql
-- Key-Value Store (Default, Already Created)
CREATE TABLE kv_store_7d87310d (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Usage Examples:
-- Store user settings
key: "user_settings_123"
value: { theme: "dark", language: "en", ... }

-- Store generated apps
key: "app_fitness_tracker_456"
value: { name: "Fitness App", screens: [...], ... }

-- Store avatars
key: "avatar_professional_sarah_789"
value: { config: {...}, voice: {...}, ... }

-- Store campaigns
key: "campaign_summer_sale_101"
value: { posts: [...], schedule: {...}, ... }
```

### **Optional Extended Schema**

```sql
-- If you want dedicated tables (optional):

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE generated_apps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  name TEXT NOT NULL,
  prompt TEXT NOT NULL,
  code JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE avatars (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  name TEXT NOT NULL,
  config JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  name TEXT NOT NULL,
  posts JSONB NOT NULL,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## File Structure

```
/
├── public/
│   ├── index.html
│   └── assets/
│
├── src/
│   ├── App.tsx                    # Main application
│   ├── main.tsx                   # Entry point
│   │
│   ├── components/
│   │   ├── CharacterSelector.tsx
│   │   ├── UrlInput.tsx
│   │   ├── BlogPostCard.tsx
│   │   ├── CustomAvatarCreator.tsx
│   │   ├── VideoScriptCreator.tsx
│   │   ├── SocialMediaSettings.tsx
│   │   ├── XCodeGeneratorModal.tsx
│   │   ├── ProfessionalAppBuilder.tsx     ⭐ NEW
│   │   ├── Professional3DAvatarGen.tsx    ⭐ NEW
│   │   └── BuiltIn3DModeler.tsx
│   │
│   ├── utils/
│   │   ├── businessExtractor.ts
│   │   ├── blogGenerator.ts
│   │   ├── avatarGenerator.ts
│   │   ├── voiceLibrary.ts
│   │   ├── videoResolutions.ts
│   │   ├── socialMediaAccounts.ts
│   │   ├── socialMediaScheduler.ts
│   │   └── supabase/
│   │       ├── info.tsx
│   │       └── client.ts
│   │
│   └── styles/
│       └── globals.css
│
├── supabase/
│   └── functions/
│       └── server/
│           ├── index.tsx           # Main server file
│           └── kv_store.tsx        # Key-value utilities
│
├── Documentation/
│   ├── README.md                   ⭐ Main documentation
│   ├── QUICK_REFERENCE.md          # Quick start guide
│   ├── DEPLOYMENT_CHECKLIST.md     # Deployment steps
│   ├── PRODUCTION_REQUIREMENTS.md  # Full setup guide
│   ├── PROFESSIONAL_FEATURES.md    # Feature details
│   ├── UPGRADE_SUMMARY.md          # Recent changes
│   ├── BACKEND_FALLBACK_FIX.md    # Error handling
│   └── ARCHITECTURE.md             # This file
│
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

---

## State Management

### **React State (useState)**

```typescript
// App-level state
const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
const [customAvatar, setCustomAvatar] = useState<CustomAvatar | null>(null);
const [socialMediaSettings, setSocialMediaSettings] = useState<any>(null);
```

### **localStorage State (Fallback)**

```typescript
// Persistent storage when backend unavailable
localStorage.setItem('app_settings', JSON.stringify(settings));
localStorage.setItem('social_accounts', JSON.stringify(accounts));
localStorage.setItem('saved_avatars', JSON.stringify(avatars));
```

### **Supabase State (Production)**

```typescript
// Server-side persistence
await kv.set('user_settings', settings);
await kv.set('campaign_data', campaign);
await kv.set('avatar_config', avatar);
```

---

## API Endpoints

### **Backend Endpoints**

```
Base URL: https://{projectId}.supabase.co/functions/v1/make-server-7d87310d

POST /scrape
  - Scrape website content
  - Extract business data
  - Return structured information

POST /generate-voice (Optional)
  - Synthesize speech from text
  - Return audio file/URL

POST /render-video (Optional)
  - Create video from script + avatar
  - Return video file/URL

POST /post-social (Optional)
  - Post to social platforms
  - Return post IDs/URLs

GET /storage/{file}
  - Retrieve uploaded files
  - Serve assets
```

### **External API Integrations**

```
Voice Synthesis:
  - ElevenLabs API
  - Google Cloud TTS
  - OpenAI TTS API

Video Rendering:
  - Remotion Lambda
  - Shotstack API
  - FFmpeg (self-hosted)

Social Media:
  - Facebook Graph API
  - Instagram Graph API
  - TikTok Creator API
  - YouTube Data API

3D Avatars:
  - D-ID API
  - HeyGen API
  - Ready Player Me API

Image Generation:
  - DALL-E 3 API
  - Stability AI
  - Unsplash API
```

---

## Security Architecture

### **Frontend Security**

```typescript
// Public anon key (safe to expose)
export const publicAnonKey = 'eyJhbG...'; // Row-level security

// Never expose in frontend:
// - service_role key
// - API secrets
// - User passwords
```

### **Backend Security**

```typescript
// Supabase secrets (server-side only)
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const apiKeys = {
  elevenlabs: Deno.env.get('ELEVENLABS_API_KEY'),
  openai: Deno.env.get('OPENAI_API_KEY'),
  google: Deno.env.get('GOOGLE_TTS_CREDENTIALS'),
};

// CORS protection
app.use('*', cors({
  origin: ['https://yourdomain.com'],
  credentials: true
}));

// Rate limiting (recommended)
// Authentication (optional)
// Input validation (required)
```

### **Data Security**

```
✅ Encrypted at rest (Supabase)
✅ HTTPS in transit
✅ Row-level security (RLS)
✅ API key rotation
✅ Environment variables
✅ No hardcoded secrets
```

---

## Scaling Strategy

### **Current Capacity (Free Tier)**

```
Supabase Free:
  - 500 MB database
  - 1 GB file storage
  - 2 CPU hours/day functions
  - Unlimited API calls

Supports:
  - ~100 users/day
  - ~500 ads/day
  - ~100 apps/day
  - ~100 avatars/day
```

### **Scaling Path**

```
Stage 1: Free Tier ($0/mo)
  - Perfect for testing
  - Up to 100 users
  - localStorage fallback

Stage 2: Supabase Pro ($25/mo)
  - 8 GB database
  - 100 GB storage
  - Up to 1000 users

Stage 3: Add CDN ($20/mo)
  - Faster asset delivery
  - Reduced bandwidth costs
  - Global distribution

Stage 4: Add Services ($50-100/mo)
  - Voice APIs
  - Video rendering
  - Social posting
  - Professional quality

Stage 5: Enterprise ($200+/mo)
  - Dedicated resources
  - Custom domain
  - Priority support
  - SLA guarantees
```

---

## Performance Optimization

### **Frontend Optimization**

```typescript
// Code splitting
const AppBuilder = lazy(() => import('./components/ProfessionalAppBuilder'));

// Memoization
const memoizedComponent = useMemo(() => <ExpensiveComponent />, [deps]);

// Debouncing
const debouncedSearch = debounce(handleSearch, 300);

// Virtual scrolling
<VirtualList items={blogPosts} itemHeight={300} />

// Image optimization
<img loading="lazy" src={imageUrl} />
```

### **Backend Optimization**

```typescript
// Caching
const cache = new Map();
if (cache.has(url)) return cache.get(url);

// Batch operations
const results = await Promise.all(requests);

// Compression
import { compress } from 'compress';

// Connection pooling (Supabase handles this)
```

### **Database Optimization**

```sql
-- Indexes
CREATE INDEX idx_user_id ON campaigns(user_id);
CREATE INDEX idx_created_at ON avatars(created_at);

-- Query optimization
SELECT * FROM campaigns WHERE user_id = $1 LIMIT 10;
```

---

## Monitoring & Analytics

### **Application Monitoring**

```typescript
// Error tracking
try {
  await generateApp(prompt);
} catch (error) {
  console.error('App generation error:', error);
  // Send to error tracking service
}

// Performance monitoring
const start = performance.now();
await operation();
const duration = performance.now() - start;
console.log('Operation took:', duration, 'ms');
```

### **Usage Analytics**

```typescript
// Track feature usage
analytics.track('app_generated', {
  type: appType,
  screens: screenCount,
  duration: generationTime
});

// Track user behavior
analytics.page('App Builder');
analytics.track('button_clicked', { button: 'generate' });
```

---

## Disaster Recovery

### **Backup Strategy**

```bash
# Supabase automatic backups (Pro plan)
# Daily backups retained for 7 days

# Manual backup
supabase db dump > backup.sql

# Restore
supabase db push backup.sql
```

### **Fallback Strategy**

```typescript
// localStorage as fallback
try {
  await supabaseOperation();
} catch (error) {
  console.warn('Using localStorage fallback');
  localStorage.setItem(key, value);
}
```

---

## Development Workflow

```
1. Local Development
   npm run dev
   ↓
2. Test Features
   Manual testing + automated tests
   ↓
3. Commit Changes
   git commit -m "Add feature"
   ↓
4. Deploy Backend
   supabase functions deploy server
   ↓
5. Deploy Frontend
   vercel --prod
   ↓
6. Monitor
   Check logs and analytics
```

---

## Summary

**Architecture Highlights:**

✅ **Modular** - Each feature is independent  
✅ **Scalable** - Start free, grow as needed  
✅ **Resilient** - localStorage fallback  
✅ **Secure** - Encrypted, protected APIs  
✅ **Fast** - Optimized for performance  
✅ **Documented** - Complete guides included  

**Tech Stack:**
- Frontend: React + TypeScript + Tailwind
- Backend: Supabase + Deno + Hono
- Database: PostgreSQL + Key-Value Store
- Deployment: Vercel + Supabase Edge Functions

**Total Complexity:** Moderate
**Total Cost:** $0 to start, scale as needed
**Time to Deploy:** 30 minutes for basic setup

🚀 **Production-ready architecture that scales!**
