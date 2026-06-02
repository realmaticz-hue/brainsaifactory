# AI Blog Post Generator -- Complete Install & Run Guide

## Prerequisites

Before you begin, make sure you have these installed:

| Tool | Version | Check Command | Install From |
|------|---------|---------------|--------------|
| Node.js | 18.x or 20.x+ | `node --version` | https://nodejs.org |
| npm | 9.x+ (comes with Node) | `npm --version` | (included with Node) |
| Git | 2.x+ | `git --version` | https://git-scm.com |
| Supabase CLI | Latest | `supabase --version` | `npm i -g supabase` |
| Deno | 1.40+ (for Edge Functions) | `deno --version` | https://deno.land |


## Quick Start (5 Steps)

### Step 1: Clone & Install Dependencies

```bash
# Clone the repo (replace with your actual repo URL)
git clone https://github.com/YOUR_USERNAME/ai-blog-post-generator.git
cd ai-blog-post-generator

# Install all npm dependencies
npm install
```

This installs React 18, Tailwind CSS v4, all 25+ Radix UI components, Recharts,
Lucide icons, Sonner toasts, and every other dependency.

### Step 2: Fix Figma Make Import Syntax

The project was built in Figma Make, which uses a special `package@version` import
syntax that standard bundlers don't understand. Run the migration script:

```bash
# Dry run first (shows what will change, changes nothing)
node scripts/fix-imports.mjs

# If it looks correct, apply the changes
node scripts/fix-imports.mjs --apply
```

This rewrites ~40+ imports like:
- `from "sonner"` becomes `from "sonner"`
- `from "@radix-ui/react-dialog@1.1.6"` becomes `from "@radix-ui/react-dialog"`
- `from "class-variance-authority@0.7.1"` becomes `from "class-variance-authority"`

Or run both steps together:
```bash
npm run setup
```

### Step 3: Configure Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local` with your actual keys:

```env
# REQUIRED -- Supabase
SUPABASE_URL=https://bepcmibntfsijkqrlfzd.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
SUPABASE_DB_URL=postgresql://postgres:PASSWORD@db.bepcmibntfsijkqrlfzd.supabase.co:5432/postgres

# REQUIRED -- AI
OPENAI_API_KEY=sk-...
OPENROUTER_API_KEY=sk-or-...

# REQUIRED for Social Accounts Hub
FACEBOOK_APP_ID=2152774215473901
FACEBOOK_APP_SECRET=your_secret_here
```

Where to get each key:
- **Supabase keys**: https://supabase.com/dashboard/project/bepcmibntfsijkqrlfzd/settings/api
- **OpenAI key**: https://platform.openai.com/api-keys
- **OpenRouter key**: https://openrouter.ai/keys
- **Facebook credentials**: https://developers.facebook.com/apps/2152774215473901/settings/basic/

### Step 4: Start the Frontend

```bash
npm run dev
```

This launches Vite at `http://localhost:5173` with hot module replacement.

### Step 5: Start the Backend (Supabase Edge Functions)

In a **separate terminal**:

```bash
# Link to your Supabase project (first time only)
supabase link --project-ref bepcmibntfsijkqrlfzd

# Serve Edge Functions locally
supabase functions serve --env-file .env.local
```

This starts the Hono server on `http://localhost:54321/functions/v1/make-server-7d87310d/`.


## Architecture Overview

```
ai-blog-post-generator/
|
|-- App.tsx                          # Main React app entry (default export)
|-- src/main.tsx                     # Vite entry point (renders App.tsx)
|-- index.html                       # HTML shell
|
|-- components/                      # ~80+ React components
|   |-- ui/                          # shadcn/ui components (Radix-based)
|   |-- social/                      # Social Accounts Hub system
|   |-- GeniusAIChat.tsx             # AI Chat with Ultra-Builder mode
|   |-- AICodeAssistant.tsx          # AI Code Assistant
|   |-- EliteAppBuilder.tsx          # App Builder
|   |-- SocialAccountsHub.tsx        # OAuth social media integration
|   +-- ...
|
|-- pages/                           # Full-screen page components
|   |-- BrainCommandCenter.tsx       # 12-Agent Brain Observatory + Commands
|   |-- GitRepair.tsx                # Self-Healing Build System
|   |-- SocialAccountsDashboard.tsx  # Social Accounts Brain Command
|   |-- AutonomousAgent.tsx          # Autonomous Dev Agent
|   +-- OAuthCallback.tsx            # OAuth redirect handler
|
|-- utils/                           # Business logic & utilities
|   |-- superCodingBrain.ts          # 12-Agent architecture definitions
|   |-- brainCommandEngine.ts        # Brain Command CRUD engine
|   |-- blogGenerator.ts             # AI blog post generation
|   |-- megaBrainBootstrap.ts        # Mega Brain Bootstrap System
|   +-- ...
|
|-- supabase/functions/server/       # Backend (Deno Edge Functions)
|   |-- index.tsx                    # Hono server with all routes
|   |-- kv_store.tsx                 # KV database interface (DO NOT EDIT)
|   |-- scraper.tsx                  # Website content scraper
|   |-- geniusChat.tsx               # AI chat backend
|   |-- buildAnalyzer.tsx            # Git Repair build analysis
|   |-- socialAccountsManager.tsx    # Social OAuth backend
|   +-- ...
|
|-- styles/globals.css               # Tailwind v4 CSS-first config + theme
|-- package.json                     # All dependencies
|-- vite.config.ts                   # Vite build config
|-- tsconfig.json                    # TypeScript config
+-- scripts/fix-imports.mjs          # Figma Make import migration tool
```


## Key Systems & What They Need

### 1. Blog Post Generator (Core)
- **Needs**: `OPENAI_API_KEY` or `OPENROUTER_API_KEY`
- **What it does**: Scrapes any URL, generates 7s and 30s blog posts with AI
- **Backend routes**: `/scrape`, `/generate-blog`

### 2. Brain Command Center
- **Needs**: Nothing extra (runs client-side)
- **What it does**: 12-Agent AI observatory with Commands tab for Add/Edit/Test/Remove
- **Access**: Click "Brain" button in the Dev Tools bar

### 3. Genius AI Chat
- **Needs**: `OPENAI_API_KEY` or `OPENROUTER_API_KEY`
- **What it does**: Multi-model AI chat with Ultra-Builder mode
- **Backend routes**: `/genius-chat`, `/genius-chat/models`

### 4. Git Repair (Self-Healing Build System)
- **Needs**: GitHub API access (optional token for private repos)
- **What it does**: Analyzes repos, detects errors, auto-fixes code
- **Backend routes**: `/analyze-build`, `/fix-code`, `/generate-diff`

### 5. Social Accounts Hub
- **Needs**: `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET`
- **Facebook OAuth Redirect URIs** (must whitelist BOTH in Facebook Developer Console):
  - Custom Hub: `https://c627e5cd-d54a-4de0-80b4-44f404b39365-v2-figmaiframepreview.figma.site/oauth-callback.html`
  - Supabase Auth: `https://bepcmibntfsijkqrlfzd.supabase.co/auth/v1/callback`
  - Local dev: `http://localhost:5173/oauth-callback.html`
- **Backend routes**: `/social-accounts/*`

### 6. AI Avatars & Video
- **Needs**: Optional `HEYGEN_API_KEY`, `ELEVENLABS_API_KEY`
- **What it does**: AI character generation, voice synthesis, video creation
- **Backend routes**: `/generate-avatar`, `/voice-preview`


## Facebook OAuth Setup (Both Systems)

Your app uses two separate OAuth flows. Both need configuration:

### In Facebook Developer Console (https://developers.facebook.com/apps/2152774215473901):

1. **Settings > Basic**:
   - App Domains: `c627e5cd-d54a-4de0-80b4-44f404b39365-v2-figmaiframepreview.figma.site`
   - For local dev, also add: `localhost`

2. **Facebook Login > Settings**:
   - Valid OAuth Redirect URIs (add ALL of these):
     ```
     https://c627e5cd-d54a-4de0-80b4-44f404b39365-v2-figmaiframepreview.figma.site/oauth-callback.html
     https://bepcmibntfsijkqrlfzd.supabase.co/auth/v1/callback
     http://localhost:5173/oauth-callback.html
     ```

3. **Required Permissions**:
   - `email`, `public_profile`
   - `pages_manage_posts` (for posting to Facebook Pages)
   - `instagram_basic`, `instagram_content_publish` (for Instagram)


## Supabase Database

The backend uses a single KV store table that is already created:

```sql
-- This already exists on your Supabase project. No migration needed.
CREATE TABLE kv_store_7d87310d (
  key TEXT NOT NULL PRIMARY KEY,
  value JSONB NOT NULL
);
```

All data (blog posts, social accounts, settings, memory) is stored as JSON
values in this table via the `kv_store.tsx` utility. No additional tables or
migrations are required.


## Troubleshooting

### "Module not found" errors after install
Run the import fixer:
```bash
node scripts/fix-imports.mjs --apply
```

### Backend returns 401 "Missing authorization header"
Make sure your `.env.local` has the correct `SUPABASE_ANON_KEY`. The frontend
sends this as `Authorization: Bearer <key>` on every server request.

### "Failed to fetch" when generating blog posts
1. Make sure the Supabase Edge Functions are running (`supabase functions serve`)
2. Check the terminal where Edge Functions are running for error logs
3. Verify `OPENAI_API_KEY` is set in `.env.local`

### Facebook OAuth "redirect_uri mismatch"
Add `http://localhost:5173/oauth-callback.html` to your Facebook app's
Valid OAuth Redirect URIs.

### Tailwind classes not working
Make sure `styles/globals.css` is imported in `src/main.tsx`. The Tailwind v4
configuration lives entirely in that CSS file using `@theme inline`.

### TypeScript errors in supabase/functions/
These files are Deno code, not Node.js. They are excluded from `tsconfig.json`
via the `exclude` array. They run on Supabase's Deno runtime, not Vite.


## Production Build

```bash
npm run build
```

Output goes to `dist/`. Deploy to any static hosting (Vercel, Netlify, Cloudflare Pages).
The backend stays on Supabase Edge Functions.

For Vercel:
```bash
npx vercel --prod
```

For Netlify, add a `_redirects` file to `public/`:
```
/*    /index.html   200
```


## Complete Dependency List (for reference)

### Frontend (npm)
| Package | Version | Purpose |
|---------|---------|---------|
| react / react-dom | 18.3+ | Core framework |
| tailwindcss | 4.0 | CSS utility framework |
| @tailwindcss/vite | 4.0 | Vite plugin for Tailwind v4 |
| lucide-react | 0.460+ | Icon library (500+ icons) |
| recharts | 2.15+ | Charts (Brain Center, Analytics) |
| sonner | 2.0.3 | Toast notifications |
| next-themes | 0.4.6 | Theme switching |
| clsx | 2.1+ | Conditional class names |
| tailwind-merge | 2.6+ | Merge Tailwind classes |
| class-variance-authority | 0.7.1 | Component variants |
| cmdk | 1.1.1 | Command palette |
| vaul | 1.1.2 | Drawer component |
| embla-carousel-react | 8.6.0 | Carousel |
| react-day-picker | 8.10.1 | Calendar date picker |
| react-resizable-panels | 2.1.7 | Resizable layouts |
| react-hook-form | 7.55.0 | Form handling |
| input-otp | 1.4.2 | OTP code input |
| @supabase/supabase-js | 2.49+ | Supabase client |
| @radix-ui/* | (25 packages) | Accessible UI primitives |

### Backend (Deno -- runs on Supabase Edge Functions)
| Package | Import Syntax | Purpose |
|---------|---------------|---------|
| hono | `npm:hono` | Web server framework |
| @supabase/supabase-js | `jsr:@supabase/supabase-js@2` | Database/auth client |
