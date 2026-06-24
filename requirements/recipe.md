# Reusable Project Recipe

> **Stack**: Vite 8 · React 19 · TypeScript 6 · Tailwind CSS 4 · Supabase · Vercel  
> **Based on**: [architect.md](file:///Users/arifindobson/Documents/arifinProject/miu-expense/requirements/architect.md)  
> **Purpose**: Follow this recipe to spin up a new project using the same proven stack.

---

## Quick Reference

```
npx create-vite@latest ./  →  React + TypeScript
npm i @supabase/supabase-js lucide-react
npm i -D tailwindcss @tailwindcss/vite
Configure vite.config.ts, supabase.ts, index.css
Set up Supabase project (DB, Auth, Storage, RLS)
Deploy to Vercel with env vars
```

---

## Phase 1 — Scaffold the Project

### 1.1 Create Vite + React + TypeScript App

```bash
# Create a new directory and scaffold inside it
mkdir my-new-app && cd my-new-app
npx -y create-vite@latest ./ --template react-ts
```

### 1.2 Install Dependencies

```bash
# Core
npm install @supabase/supabase-js lucide-react react react-dom

# Dev
npm install -D tailwindcss @tailwindcss/vite @vitejs/plugin-react \
  typescript @types/react @types/react-dom \
  eslint @eslint/js eslint-plugin-react-hooks eslint-plugin-react-refresh \
  typescript-eslint globals
```

### 1.3 Configure Vite

Replace `vite.config.ts`:

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
})
```

### 1.4 Configure TypeScript

Update `tsconfig.app.json`:

```json
{
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.app.tsbuildinfo",
    "target": "es2023",
    "lib": ["ES2023", "DOM"],
    "module": "esnext",
    "types": ["vite/client"],
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "erasableSyntaxOnly": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"]
}
```

---

## Phase 2 — Tailwind CSS v4 Setup

### 2.1 Entry CSS

Create/replace `src/index.css`:

```css
@import "tailwindcss";

/* Lock mobile viewport (for mobile-first PWA) */
html, body, #root {
  height: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;
  position: fixed;
  width: 100%;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}

/* Safe area utilities for notched screens */
@utility pb-safe {
  padding-bottom: env(safe-area-inset-bottom);
}

@utility pt-safe {
  padding-top: env(safe-area-inset-top);
}

/* Hide scrollbars */
@utility no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

/* Add your custom @keyframes + @utility animations here */
```

### 2.2 Import in Entry Point

In `src/main.tsx`:

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

---

## Phase 3 — Supabase Backend

### 3.1 Create Supabase Project

1. Go to [supabase.com](https://supabase.com) → **New Project**.
2. Set project name, DB password, region.
3. Wait for provisioning (~1-2 min).
4. Copy **Project URL** and **Anon Key** from **Settings → API**.

### 3.2 Create `.env`

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
```

> [!IMPORTANT]
> Add `.env` to `.gitignore`. Never commit real keys.

### 3.3 Create Supabase Client

Create `src/lib/supabase.ts`:

```ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const isConfigured = !!(supabaseUrl && supabaseAnonKey);

if (!isConfigured) {
  console.warn(
    'Supabase URL and Anon Key are missing. Define VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.'
  );
}

// Mock client for offline/unconfigured mode — prevents crashes
const mockSupabase = {
  auth: {
    getSession: async () => ({ data: { session: null }, error: null }),
    signInWithPassword: async () => ({
      data: { session: null, user: null },
      error: new Error('Supabase not configured'),
    }),
    signUp: async () => ({
      data: { session: null, user: null },
      error: new Error('Supabase not configured'),
    }),
    signOut: async () => ({ error: null }),
    onAuthStateChange: () => ({
      data: { subscription: { unsubscribe: () => {} } },
    }),
  },
  from: () => ({
    insert: async () => ({ data: null, error: new Error('Supabase not configured') }),
    select: () => ({
      eq: () => ({ order: () => ({ data: null, error: null }) }),
      or: () => ({ order: () => ({ data: null, error: null }) }),
    }),
    update: () => ({ eq: () => ({ data: null, error: null }) }),
    delete: () => ({ eq: () => ({ data: null, error: null }) }),
  }),
  storage: {
    from: () => ({
      upload: async () => ({ data: null, error: null }),
      getPublicUrl: () => ({ data: { publicUrl: '' } }),
    }),
  },
} as any;

export const supabase = isConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : mockSupabase;
```

> [!TIP]
> The mock client lets you develop the UI without a live Supabase instance. Data falls back to `localStorage`.

### 3.4 Database Schema Template

Run in **Supabase SQL Editor**. Adapt table names and columns to your domain:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles (auto-linked to auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc', now())
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- 2. Your domain tables...
-- CREATE TABLE public.your_table ( ... );
-- ALTER TABLE public.your_table ENABLE ROW LEVEL SECURITY;

-- 3. Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  -- Seed default resources here
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
```

### 3.5 Enable Authentication

1. **Supabase Dashboard** → **Authentication** → **Providers** → **Email**.
2. Toggle **Enable Signup** ON.
3. *(Optional)* Toggle **Confirm Email** OFF for faster dev iteration.

### 3.6 Storage Bucket (if needed)

```sql
-- Create a public bucket for file uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('uploads', 'uploads', true)
ON CONFLICT (id) DO NOTHING;

-- Public read
CREATE POLICY "Public Read" ON storage.objects
  FOR SELECT USING (bucket_id = 'uploads');

-- Authenticated insert
CREATE POLICY "Auth Insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'uploads'
    AND auth.role() = 'authenticated'
  );

-- Owner delete (folder = user ID)
CREATE POLICY "Owner Delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'uploads'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
```

---

## Phase 4 — Multi-Tenancy (Optional)

If your app needs shared group/team/family access, follow this pattern:

### 4.1 Groups + Members Tables

```sql
CREATE TABLE public.groups (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc', now())
);

CREATE TABLE public.group_members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users,  -- nullable for pre-invites
  email TEXT NOT NULL,
  role TEXT CHECK (role IN ('owner', 'admin', 'member')) DEFAULT 'member',
  created_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
  UNIQUE (group_id, email)
);
```

### 4.2 Security Definer Helpers (avoid RLS recursion)

```sql
CREATE OR REPLACE FUNCTION public.is_group_member(p_group_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = p_group_id
      AND (user_id = auth.uid() OR lower(email) = lower(auth.jwt()->>'email'))
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_group_admin_or_owner(p_group_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = p_group_id
      AND (user_id = auth.uid() OR lower(email) = lower(auth.jwt()->>'email'))
      AND role IN ('admin', 'owner')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 4.3 RLS Pattern for Group-Scoped Tables

```sql
-- Example: scope a "tasks" table to groups
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can read" ON public.tasks
  FOR SELECT USING (public.is_group_member(group_id));

CREATE POLICY "Members can insert" ON public.tasks
  FOR INSERT WITH CHECK (public.is_group_member(group_id));

CREATE POLICY "Admins can update" ON public.tasks
  FOR UPDATE USING (public.is_group_admin_or_owner(group_id));

CREATE POLICY "Admins can delete" ON public.tasks
  FOR DELETE USING (public.is_group_admin_or_owner(group_id));
```

### 4.4 Pre-Onboarding Trigger

Auto-link invited users when they sign up:

```sql
CREATE OR REPLACE FUNCTION public.link_new_user_to_groups()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.group_members
  SET user_id = NEW.id
  WHERE lower(email) = lower(NEW.email) AND user_id IS NULL;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_user_created_link_groups
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.link_new_user_to_groups();
```

---

## Phase 5 — PWA Configuration

### 5.1 Web App Manifest

Create `public/manifest.json`:

```json
{
  "name": "My App Name",
  "short_name": "MyApp",
  "description": "A short description of your app.",
  "start_url": "/",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#ffffff",
  "theme_color": "#6366f1",
  "icons": [
    {
      "src": "/favicon.svg",
      "sizes": "any",
      "type": "image/svg+xml",
      "purpose": "any maskable"
    }
  ]
}
```

### 5.2 HTML Head Tags

In `index.html`, add inside `<head>`:

```html
<link rel="manifest" href="/manifest.json" />
<meta name="theme-color" content="#6366f1" />

<!-- iOS Standalone Mode -->
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="default" />
<meta name="apple-mobile-web-app-title" content="MyApp" />
<link rel="apple-touch-icon" href="/favicon.svg" />
```

### 5.3 Service Worker

Create `public/sw.js`:

```js
const CACHE_NAME = 'my-app-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/manifest.json'
];

// Install: pre-cache shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((key) => key !== CACHE_NAME && caches.delete(key)))
    )
  );
  self.clients.claim();
});

// Fetch: stale-while-revalidate (skip API calls)
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (event.request.url.includes('supabase.co')) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) {
        // Background revalidate
        fetch(event.request).then((fresh) => {
          if (fresh.status === 200) {
            caches.open(CACHE_NAME).then((c) => c.put(event.request, fresh));
          }
        }).catch(() => {});
        return cached;
      }
      return fetch(event.request).then((response) => {
        if (response.status === 200 && event.request.url.startsWith(self.location.origin)) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((c) => c.put(event.request, clone));
        }
        return response;
      });
    }).catch(() => caches.match('/'))
  );
});
```

### 5.4 Register Service Worker

Add to the bottom of `src/main.tsx`:

```ts
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((reg) => console.log('SW registered:', reg.scope))
      .catch((err) => console.warn('SW registration failed:', err));
  });
}
```

---

## Phase 6 — Project Structure

Create these directories and files:

```
src/
├── main.tsx                   # Bootstrap + SW registration
├── App.tsx                    # Root component
├── index.css                  # Tailwind v4 + custom utilities
│
├── components/
│   ├── LoginScreen.tsx        # Auth UI
│   └── ...                    # Feature components
│
├── lib/
│   └── supabase.ts            # Supabase client + mock fallback
│
└── types/
    └── index.ts               # Shared TypeScript interfaces
```

### Type Definitions Template

`src/types/index.ts`:

```ts
export interface Group {
  id: string;
  name: string;
  created_at?: string;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id?: string | null;
  email: string;
  role: 'owner' | 'admin' | 'member';
  created_at?: string;
}

// Add your domain types here...
```

---

## Phase 7 — Theming System

Define themes as typed config objects for easy switching:

```ts
interface ThemeConfig {
  name: string;
  bg: string;
  textMain: string;
  textMuted: string;
  surface: string;
  primary: string;
  primaryText: string;
  primarySoft: string;
  border: string;
  modalBg: string;
  modalOverlay: string;
  // ... extend as needed
}

const THEMES: Record<string, ThemeConfig> = {
  'light-blue': {
    name: 'Light Blue',
    bg: 'bg-white',
    textMain: 'text-slate-900',
    textMuted: 'text-slate-500',
    surface: 'bg-slate-50',
    primary: 'bg-blue-500 hover:bg-blue-600 text-white',
    primaryText: 'text-blue-500',
    primarySoft: 'bg-blue-50',
    border: 'border-slate-200',
    modalBg: 'bg-white border-slate-200 shadow-xl',
    modalOverlay: 'bg-slate-900/20',
  },
  'dark-pink': {
    name: 'Dark Pink',
    bg: 'bg-slate-950',
    textMain: 'text-slate-100',
    textMuted: 'text-slate-400',
    surface: 'bg-slate-900',
    primary: 'bg-pink-600 hover:bg-pink-700 text-white',
    primaryText: 'text-pink-500',
    primarySoft: 'bg-pink-500/10',
    border: 'border-slate-800',
    modalBg: 'bg-slate-900 border-slate-800 shadow-2xl',
    modalOverlay: 'bg-black/60',
  },
};
```

Use the active theme object `t` throughout components via props or context:

```tsx
<div className={`${t.bg} ${t.textMain} min-h-screen`}>
  <button className={t.primary}>Save</button>
</div>
```

---

## Phase 8 — Offline Fallback Pattern

When Supabase is unreachable, read/write to `localStorage`:

```ts
// Convention: prefix all keys with your app name
const STORAGE_KEYS = {
  transactions: 'myapp_transactions',
  activeGroup: 'myapp_active_group',
  keepLoggedIn: 'myapp_keep_logged_in',
  // ...
} as const;

// Save fallback
function saveToLocalStorage(key: string, item: any) {
  const existing = JSON.parse(localStorage.getItem(key) || '[]');
  existing.push({ ...item, id: crypto.randomUUID(), created_at: new Date().toISOString() });
  localStorage.setItem(key, JSON.stringify(existing));
}

// Load fallback
function loadFromLocalStorage<T>(key: string): T[] {
  return JSON.parse(localStorage.getItem(key) || '[]');
}
```

> [!TIP]
> Use `default-` prefixed IDs for mock/local data. Filter them out before Supabase inserts to avoid foreign key violations.

---

## Phase 9 — Vercel Deployment

### 9.1 Create `vercel.json`

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "buildCommand": "npm run build"
}
```

### 9.2 Ensure Build Script

In `package.json`:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "lint": "eslint ."
  }
}
```

### 9.3 Deploy

1. Push code to **GitHub**.
2. Go to [vercel.com](https://vercel.com) → **Add New → Project** → Import repo.
3. Verify settings:
   - **Framework**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add **Environment Variables**:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Click **Deploy**.

### 9.4 Post-Deploy Checklist

- [ ] App loads at production URL
- [ ] Auth sign-up / sign-in works
- [ ] Data persists in Supabase
- [ ] PWA installs on mobile (Add to Home Screen)
- [ ] Offline mode loads cached shell
- [ ] Service Worker is registered (DevTools → Application)

---

## Phase 10 — .gitignore

```gitignore
node_modules
dist
.env
*.local
.DS_Store
```

---

## Checklist — New Project From This Recipe

```
[ ] Phase 1: Scaffold Vite + React + TS
[ ] Phase 1: Install dependencies
[ ] Phase 1: Configure vite.config.ts
[ ] Phase 2: Set up Tailwind CSS v4 in index.css
[ ] Phase 3: Create Supabase project
[ ] Phase 3: Add .env with keys
[ ] Phase 3: Create src/lib/supabase.ts with mock fallback
[ ] Phase 3: Run schema SQL in Supabase SQL Editor
[ ] Phase 3: Enable Email auth
[ ] Phase 3: (Optional) Create storage bucket
[ ] Phase 4: (Optional) Add groups + members tables
[ ] Phase 4: (Optional) Add security definer helpers
[ ] Phase 4: (Optional) Add pre-onboarding trigger
[ ] Phase 5: Create manifest.json
[ ] Phase 5: Add PWA meta tags to index.html
[ ] Phase 5: Create sw.js
[ ] Phase 5: Register SW in main.tsx
[ ] Phase 6: Set up src/ directory structure
[ ] Phase 6: Define types in src/types/index.ts
[ ] Phase 7: Define ThemeConfig + THEMES
[ ] Phase 8: Implement localStorage offline fallback
[ ] Phase 9: Create vercel.json
[ ] Phase 9: Push to GitHub
[ ] Phase 9: Deploy on Vercel with env vars
[ ] Phase 9: Run post-deploy checklist
```

---

## Version Reference

These are the tested, compatible versions from the Miu Expense project:

| Package | Version |
|---------|---------|
| `react` | ^19.2.6 |
| `react-dom` | ^19.2.6 |
| `@supabase/supabase-js` | ^2.108.2 |
| `lucide-react` | ^1.21.0 |
| `vite` | ^8.0.12 |
| `@vitejs/plugin-react` | ^6.0.1 |
| `tailwindcss` | ^4.3.1 |
| `@tailwindcss/vite` | ^4.3.1 |
| `typescript` | ~6.0.2 |
| `eslint` | ^10.3.0 |
