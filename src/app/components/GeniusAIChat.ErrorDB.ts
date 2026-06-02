// ─── Inline Error Pattern Database ───────────────────────────────────────────
// Fast local fix suggestions for common React/TypeScript/Node errors
// Returns null if not matched — caller falls through to server AI.

export function detectAndSolveError(input: string): string | null {
  const text = input.toLowerCase();

  // React / react-dom version mismatch
  if (
    text.includes('incompatible react versions') ||
    (text.includes('react') && text.includes('react-dom') &&
      (text.includes('must have the exact same version') ||
       text.includes('exact same version') ||
       (text.includes('react:') && text.includes('react-dom:'))))
  ) {
    return `# 🔧 React / react-dom Version Mismatch — Fixed!

**What This Error Means:**
React and react-dom must always be on the **exact same version**. Even a patch difference (e.g. \`19.2.4\` vs \`19.2.3\`) will crash the app.

---

## ✅ Step-by-Step Fix

**Step 1 — Check current versions**
\`\`\`bash
npm list react react-dom
\`\`\`

**Step 2 — Force both to the same version**
\`\`\`bash
# npm
npm install react@latest react-dom@latest

# yarn
yarn add react@latest react-dom@latest

# pnpm
pnpm add react@latest react-dom@latest
\`\`\`

**Step 3 — Lock versions in package.json**
\`\`\`json
{
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "overrides": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  }
}
\`\`\`

**Step 4 — Clear cache and reinstall**
\`\`\`bash
rm -rf node_modules package-lock.json && npm install
\`\`\`

---

## ✅ Verify
\`\`\`bash
npm list react react-dom
# Both should show the SAME version
\`\`\``;
  }

  // Cannot read properties of undefined/null
  if (text.includes('cannot read propert') || text.includes('cannot read properties of undefined') || text.includes('cannot read properties of null')) {
    return `# 🔧 "Cannot read properties of undefined/null" — Fixed!

**What This Means:**
You're accessing a property (e.g. \`.name\`, \`.map\`, \`.length\`) on something that is \`undefined\` or \`null\`.

---

## ✅ Quick Fixes

**Fix 1 — Optional Chaining (safest)**
\`\`\`typescript
// ❌ Crashes if user is undefined
console.log(user.name);

// ✅ Returns undefined instead of crashing
console.log(user?.name);
console.log(user?.address?.city);
console.log(items?.map(i => i.id));
\`\`\`

**Fix 2 — Default values with ??**
\`\`\`typescript
const name  = user?.name   ?? 'Guest';
const count = items?.length ?? 0;
\`\`\`

**Fix 3 — Guard clause**
\`\`\`typescript
function MyComponent({ data }) {
  if (!data) return <div>Loading...</div>;
  return <div>{data.name}</div>;
}
\`\`\`

**Fix 4 — Safe useState defaults**
\`\`\`typescript
const [items, setItems] = useState<Item[]>([]);
const [user,  setUser]  = useState<User | null>(null);
\`\`\``;
  }

  // CORS error
  if (text.includes('cors') && (text.includes('blocked') || text.includes('access-control') || text.includes('preflight') || text.includes('cross-origin'))) {
    return `# 🔧 CORS Error — Fixed!

**What This Means:**
Your browser blocked the request because the server didn't send the correct \`Access-Control-Allow-Origin\` headers.

---

## ✅ Fix 1 — Add CORS to your server (Hono / Express)

**Hono (Deno/Node)**
\`\`\`typescript
import { cors } from 'hono/cors';
app.use('/*', cors({ origin: '*' }));
\`\`\`

**Express**
\`\`\`javascript
const cors = require('cors');
app.use(cors({ origin: '*' }));
\`\`\`

## ✅ Fix 2 — Vite dev proxy (avoids CORS entirely)
\`\`\`typescript
// vite.config.ts
export default {
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\\/api/, '')
      }
    }
  }
}
\`\`\``;
  }

  // Module not found
  if (text.includes('module not found') || text.includes('cannot find module') || text.includes('failed to resolve import')) {
    return `# 🔧 Module Not Found — Fixed!

## ✅ Quick Fixes

**Fix 1 — Install the missing package**
\`\`\`bash
npm install <package-name>
# or
yarn add <package-name>
\`\`\`

**Fix 2 — Check import path (common typo)**
\`\`\`typescript
// ❌ Wrong path
import { MyComponent } from './components/mycomponent';

// ✅ Correct (exact case)
import { MyComponent } from './components/MyComponent';
\`\`\`

**Fix 3 — Missing @types (TypeScript)**
\`\`\`bash
npm install --save-dev @types/<package-name>
\`\`\`

**Fix 4 — Clear cache**
\`\`\`bash
rm -rf node_modules .next dist && npm install
\`\`\``;
  }

  // Hydration mismatch
  if (text.includes('hydration') || text.includes('did not match') || text.includes('text content does not match')) {
    return `# 🔧 React Hydration Mismatch — Fixed!

**What This Means:**
The HTML rendered on the server doesn't match what React renders on the client (e.g. random IDs, dates, window access).

---

## ✅ Fixes

**Fix 1 — Use useEffect for client-only data**
\`\`\`typescript
const [mounted, setMounted] = useState(false);
useEffect(() => setMounted(true), []);

if (!mounted) return null; // or a skeleton
return <div>{new Date().toLocaleDateString()}</div>;
\`\`\`

**Fix 2 — suppressHydrationWarning (minor differences)**
\`\`\`tsx
<time suppressHydrationWarning>{new Date().toLocaleTimeString()}</time>
\`\`\`

**Fix 3 — next/dynamic with ssr: false (Next.js)**
\`\`\`typescript
import dynamic from 'next/dynamic';
const Component = dynamic(() => import('./Component'), { ssr: false });
\`\`\``;
  }

  // Missing key prop
  if (text.includes('each child in a list') || text.includes('missing key') || text.includes('unique key') || text.includes('"key" prop')) {
    return `# 🔧 Missing "key" Prop in List — Fixed!

**What This Means:**
React needs a unique \`key\` on each element in a list to efficiently update the DOM.

---

## ✅ Fix

\`\`\`tsx
// ❌ Missing key
{items.map(item => <div>{item.name}</div>)}

// ✅ Stable unique key (use ID, never index if list can reorder)
{items.map(item => <div key={item.id}>{item.name}</div>)}

// ✅ If no ID, generate one
{items.map((item, i) => <div key={item.slug ?? i}>{item.name}</div>)}
\`\`\`

**Why index keys are bad:**
Using \`index\` as key causes bugs when items are reordered, filtered, or deleted.
Use a stable, unique identifier like \`id\`, \`slug\`, or \`uuid\`.`;
  }

  // DOM nesting
  if (text.includes('validatedomnesting') || text.includes('dom nesting') || text.includes('cannot appear as a descendant') || text.includes('nested')) {
    return `# 🔧 Invalid DOM Nesting — Fixed!

**What This Means:**
You have an invalid HTML structure (e.g. \`<button>\` inside \`<a>\`, or \`<p>\` inside \`<p>\`).

---

## ✅ Common Fixes

**Fix 1 — button inside anchor (most common)**
\`\`\`tsx
// ❌ Invalid — button cannot be inside anchor
<a href="/page"><button>Click</button></a>

// ✅ Style the anchor as a button
<a href="/page" className="btn">Click</a>

// ✅ Or use role="link" on button
<button onClick={() => navigate('/page')}>Click</button>
\`\`\`

**Fix 2 — p inside p (block inside inline)**
\`\`\`tsx
// ❌ Invalid
<p>Text <p>More text</p></p>

// ✅ Use span for inline
<p>Text <span>More text</span></p>

// ✅ Or use div for block
<div>Text <p>More text</p></div>
\`\`\``;
  }

  // eaddrinuse
  if (text.includes('eaddrinuse') || text.includes('address already in use') || text.includes('port already in use')) {
    return `# 🔧 Port Already In Use (EADDRINUSE) — Fixed!

## ✅ Kill the process using the port

**macOS / Linux**
\`\`\`bash
# Find and kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or for port 5173 (Vite)
lsof -ti:5173 | xargs kill -9
\`\`\`

**Windows**
\`\`\`cmd
netstat -ano | findstr :3000
taskkill /PID <PID_NUMBER> /F
\`\`\`

## ✅ Use a different port
\`\`\`bash
# Vite
vite --port 5174

# Next.js
next dev --port 3001

# Node
PORT=3001 node server.js
\`\`\``;
  }

  // npm ERR
  if (text.includes('npm err') || text.includes('npm error') || text.includes('etarget') || text.includes('no matching version')) {
    return `# 🔧 npm Install Error — Fixed!

## ✅ Step-by-Step Fixes

**Fix 1 — Clear cache and retry**
\`\`\`bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
\`\`\`

**Fix 2 — Check Node.js version compatibility**
\`\`\`bash
node --version   # Should be LTS (18.x or 20.x)
npm --version
\`\`\`

**Fix 3 — Use legacy peer deps if peer conflict**
\`\`\`bash
npm install --legacy-peer-deps
\`\`\`

**Fix 4 — Check package name spelling**
\`\`\`bash
# Verify package exists on npm
npm info <package-name>
\`\`\``;
  }

  return null; // No match — pass to server AI
}
