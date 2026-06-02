/**
 * downloadProject — builds a real .zip with full folder structure
 * using JSZip (imported dynamically so it's only loaded when needed).
 */

import JSZip from 'jszip';

export interface ProjectFile {
  path: string;
  code: string;
}

export async function downloadProjectZip(opts: {
  appName: string;
  files: ProjectFile[];
  features: Set<string>;
  stack: string;
  vercelConfig: string;
}): Promise<void> {
  const { appName, files, features, stack, vercelConfig } = opts;

  const slug = appName.toLowerCase().replace(/\s+/g, '-');
  const zip  = new JSZip();
  const root = zip.folder(slug)!;

  // ── 1. Every agent-generated source file at its exact path ──────
  for (const f of files) {
    const parts  = f.path.split('/');
    const fname  = parts.pop()!;
    const folder = parts.length ? root.folder(parts.join('/'))! : root;
    folder.file(fname, f.code);
  }

  // ── 2. package.json ──────────────────────────────────────────────
  const hasBilling = features.has('billing');
  const hasTests   = features.has('tests');

  root.file('package.json', JSON.stringify({
    name: slug,
    version: '0.1.0',
    private: true,
    type: 'module',
    scripts: {
      dev:     'vite',
      build:   'tsc && vite build',
      preview: 'vite preview',
      lint:    'eslint src --ext ts,tsx',
      ...(hasTests ? { test: 'vitest' } : {}),
    },
    dependencies: {
      'react':                   '^18.3.0',
      'react-dom':               '^18.3.0',
      'react-router':            '^7.0.0',
      '@supabase/supabase-js':   '^2.45.0',
      '@tanstack/react-query':   '^5.62.0',
      'lucide-react':            '^0.400.0',
      'zod':                     '^3.23.0',
      'hono':                    '^4.6.0',
      ...(hasBilling ? {
        'stripe':                '^14.0.0',
        '@stripe/react-stripe-js': '^2.8.0',
      } : {}),
    },
    devDependencies: {
      '@types/react':            '^18.3.0',
      '@types/react-dom':        '^18.3.0',
      '@vitejs/plugin-react':    '^4.3.0',
      'typescript':              '^5.5.0',
      'vite':                    '^5.4.0',
      'tailwindcss':             '^4.0.0',
      '@tailwindcss/vite':       '^4.0.0',
      '@tailwindcss/postcss':    '^4.0.0',
      'autoprefixer':            '^10.4.0',
      'eslint':                  '^9.0.0',
      ...(hasTests ? {
        'vitest':                        '^1.6.0',
        '@testing-library/react':        '^16.0.0',
        '@testing-library/jest-dom':     '^6.0.0',
        '@testing-library/user-event':   '^14.0.0',
      } : {}),
    },
  }, null, 2));

  // ── 3. vite.config.ts ────────────────────────────────────────────
  root.file('vite.config.ts', [
    "import { defineConfig } from 'vite';",
    "import react from '@vitejs/plugin-react';",
    "import tailwindcss from '@tailwindcss/vite';",
    '',
    'export default defineConfig({',
    '  plugins: [react(), tailwindcss()],',
    '  server: { port: 5173 },',
    '  build: { outDir: \'dist\', sourcemap: true },',
    '});',
    '',
  ].join('\n'));

  // ── 4. tsconfig.json ─────────────────────────────────────────────
  root.file('tsconfig.json', JSON.stringify({
    compilerOptions: {
      target: 'ES2020',
      useDefineForClassFields: true,
      lib: ['ES2020', 'DOM', 'DOM.Iterable'],
      module: 'ESNext',
      skipLibCheck: true,
      moduleResolution: 'bundler',
      allowImportingTsExtensions: true,
      resolveJsonModule: true,
      isolatedModules: true,
      noEmit: true,
      jsx: 'react-jsx',
      strict: true,
      noUnusedLocals: false,
      noUnusedParameters: false,
      noFallthroughCasesInSwitch: true,
      baseUrl: '.',
      paths: { '@/*': ['./src/*'] },
    },
    include: ['src'],
    references: [{ path: './tsconfig.node.json' }],
  }, null, 2));

  root.file('tsconfig.node.json', JSON.stringify({
    compilerOptions: {
      composite: true,
      skipLibCheck: true,
      module: 'ESNext',
      moduleResolution: 'bundler',
      allowSyntheticDefaultImports: true,
    },
    include: ['vite.config.ts'],
  }, null, 2));

  // ── 5. tailwind / PostCSS ────────────────────────────────────────
  root.file('postcss.config.js', [
    "export default {",
    "  plugins: {",
    '    "@tailwindcss/postcss": {},',
    "    autoprefixer: {},",
    "  },",
    "};",
    "",
  ].join('\n'));

  // ── 6. index.html ────────────────────────────────────────────────
  root.file('index.html', [
    '<!doctype html>',
    '<html lang="en">',
    '  <head>',
    '    <meta charset="UTF-8" />',
    '    <link rel="icon" type="image/svg+xml" href="/vite.svg" />',
    '    <meta name="viewport" content="width=device-width, initial-scale=1.0" />',
    `    <title>${appName}</title>`,
    '  </head>',
    '  <body>',
    '    <div id="root"></div>',
    '    <script type="module" src="/src/main.tsx"></script>',
    '  </body>',
    '</html>',
    '',
  ].join('\n'));

  // ── 7. src/ bootstrap files ──────────────────────────────────────
  const src = root.folder('src')!;

  src.file('index.css', [
    '@tailwind base;',
    '@tailwind components;',
    '@tailwind utilities;',
    '',
    ':root {',
    '  font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;',
    '  line-height: 1.5;',
    '  color-scheme: light dark;',
    '}',
    'body { margin: 0; }',
    '',
  ].join('\n'));

  src.file('main.tsx', [
    "import React from 'react';",
    "import ReactDOM from 'react-dom/client';",
    "import { RouterProvider } from 'react-router';",
    "import { QueryClient, QueryClientProvider } from '@tanstack/react-query';",
    "import { router } from './router';",
    "import './index.css';",
    '',
    'const queryClient = new QueryClient();',
    '',
    "ReactDOM.createRoot(document.getElementById('root')!).render(",
    '  <React.StrictMode>',
    '    <QueryClientProvider client={queryClient}>',
    '      <RouterProvider router={router} />',
    '    </QueryClientProvider>',
    '  </React.StrictMode>,',
    ');',
    '',
  ].join('\n'));

  src.file('router.tsx', [
    "import { createBrowserRouter } from 'react-router';",
    '',
    'export const router = createBrowserRouter([',
    '  {',
    "    path: '/',",
    "    lazy: () => import('./layouts/Root').then(m => ({ Component: m.Root })),",
    '    children: [',
    "      { index: true, lazy: () => import('./pages/Dashboard').then(m => ({ Component: m.Dashboard })) },",
    '    ],',
    '  },',
    ']);',
    '',
  ].join('\n'));

  // ── 8. .env.example ──────────────────────────────────────────────
  const envLines = [
    `# ${appName} — Environment Variables`,
    '# Copy to .env.local and fill in your real values',
    '',
    '# Supabase (required)',
    'VITE_SUPABASE_URL=https://your-project.supabase.co',
    'VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    'SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  ];
  if (hasBilling) {
    envLines.push('', '# Stripe (billing)', 'VITE_STRIPE_PK=pk_test_...', 'STRIPE_SECRET_KEY=sk_test_...', 'STRIPE_WEBHOOK_SECRET=whsec_...');
  }
  envLines.push('', '# App', 'VITE_APP_URL=http://localhost:5173', `VITE_APP_NAME=${appName}`, '');
  root.file('.env.example', envLines.join('\n'));

  // ── 9. .gitignore ────────────────────────────────────────────────
  root.file('.gitignore', [
    'node_modules/',
    'dist/',
    'dist-ssr/',
    '*.local',
    '',
    '# Environment — NEVER commit',
    '.env',
    '.env.local',
    '.env.*.local',
    '',
    '.DS_Store',
    'coverage/',
    '*.log',
    '',
  ].join('\n'));

  // ── 10. vercel.json ──────────────────────────────────────────────
  root.file('vercel.json', vercelConfig);

  // ── 11. README.md ────────────────────────────────────────────────
  const treeLines = files.map(f => `├── ${f.path}`).join('\n');
  root.file('README.md', [
    `# ${appName}`,
    '',
    '> Generated by **Elite AI App Builder** — Multi-Agent v2.0',
    '',
    '## 🚀 Quick Start',
    '',
    '```bash',
    '# 1. Install dependencies',
    'npm install',
    '',
    '# 2. Set environment variables',
    'cp .env.example .env.local',
    '# → Fill in VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY',
    '',
    '# 3. Run database migrations',
    '# → Copy src/lib/schema.sql into Supabase SQL Editor → Run',
    '',
    '# 4. Start the dev server',
    'npm run dev',
    '# → http://localhost:5173',
    '```',
    '',
    '## 📁 Project Structure',
    '',
    '```',
    `${slug}/`,
    treeLines,
    '├── index.html',
    '├── vite.config.ts',
    '├── tsconfig.json',
    '└── .env.example',
    '```',
    '',
    '## 🛠 Tech Stack',
    '',
    '| Layer | Technology |',
    '|-------|-----------|',
    '| Frontend | React 18 + TypeScript + Tailwind CSS v4 |',
    '| Routing | React Router v7 |',
    '| Data Fetching | TanStack Query v5 |',
    '| Backend | Hono on Supabase Edge Functions |',
    '| Database | Supabase PostgreSQL + Row Level Security |',
    ...(hasBilling ? ['| Payments | Stripe |'] : []),
    '| Icons | Lucide React |',
    '',
    '## 🚢 Deploy to Vercel',
    '',
    '```bash',
    '# Option A — Vercel CLI',
    'npx vercel --prod',
    '',
    '# Option B — Connect GitHub repo at vercel.com/new',
    '```',
    '',
    '## 🔧 Troubleshooting: Tailwind CSS',
    '',
    'If Tailwind styles are not working after `npm install && npm run dev`, verify these files:',
    '',
    '### postcss.config.js',
    '',
    '```js',
    'export default {',
    '  plugins: {',
    '    "@tailwindcss/postcss": {},',
    '    autoprefixer: {},',
    '  },',
    '};',
    '```',
    '',
    '### src/index.css (must contain)',
    '',
    '```css',
    '@tailwind base;',
    '@tailwind components;',
    '@tailwind utilities;',
    '```',
    '',
    '### Missing files after download?',
    '',
    'If any scaffold files are missing from the ZIP, create them manually with the content above.',
    'Required scaffold files: `postcss.config.js`, `src/index.css`, `vite.config.ts`, `tsconfig.json`, `index.html`, `src/main.tsx`, `package.json`.',
    '',
    '---',
    `*Generated ${new Date().toLocaleDateString()} — Elite AI App Builder*`,
    '',
  ].join('\n'));

  // ── 12. Generate ZIP and trigger browser download ────────────────
  const blob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  const url = URL.createObjectURL(blob);
  const a   = document.createElement('a');
  a.href     = url;
  a.download = `${slug}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}