# Implementation Plan: Vite + Supabase Expense Tracker

Set up a React + TypeScript single-page application built on Vite, styled with Tailwind CSS v4, and integrated with Supabase database services. The app operates in a zero-friction "Demo Mode" that auto-authenticates the user anonymously to synchronize transaction entries immediately.

## Selected Configuration Choices

### 1. Styling Framework: Tailwind CSS v4
- Configured via the `@tailwindcss/vite` compiler plugin directly in `vite.config.ts`.
- Removed PostCSS configs since Tailwind v4 processes imports and theme specifications natively in `index.css`.

### 2. User Authentication: Demo Mode
- The application automatically signs in the user using Supabase Anonymous Login upon mounting:
  `supabase.auth.signInAnonymously()`
- Seeding of standard accounts and sharing profiles runs automatically in the DB trigger.
- **Fail-Safe Offline Mode**: If credentials are unset or the network is unavailable, transactions are saved locally via `localStorage`.

---

## Project Directory Structure

```
miu-expense/
├── requirements/
│   ├── implementation_plan.md      # This plan
│   ├── deployment_plan.md          # Supabase, GitHub & Vercel deployment guide
│   └── schema.sql                  # Database migrations script
├── public/
│   └── favicon.svg                 # App icon
├── src/
│   ├── components/                 # Reusable components
│   │   └── DatePickerModal.tsx     # Custom scroll-snap wheel date picker
│   ├── lib/
│   │   └── supabase.ts             # Supabase client client configuration
│   ├── types/
│   │   └── index.ts                # TypeScript interfaces
│   ├── App.tsx                     # Main dashboard, tab navigation, and keypad views
│   ├── index.css                   # Tailwind v4 configuration and global utilities
│   ├── main.tsx                    # React DOM bootstrapper
│   └── vite-env.d.ts
├── .env                            # Active credentials (local-only)
├── .env.example                    # Sample environment variables
├── .gitignore
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## Database Schema (Supabase)

The following tables handle users, accounts, sharing profiles, and transactions (including descriptive fallback fields for stand-alone items):

```sql
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Profiles
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.profiles enable row level security;
create policy "Allow users to manage their own profiles"
  on public.profiles for all using (auth.uid() = id);

-- 2. Accounts
create table public.accounts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  icon text not null,
  color text not null,
  currency text default 'IDR' not null,
  balance numeric default 0 not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.accounts enable row level security;
create policy "Allow all actions on accounts for owners"
  on public.accounts for all using (auth.uid() = user_id);

-- 3. Categories
create table public.categories (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade,
  name text not null,
  icon text not null,
  color text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.categories enable row level security;
create policy "Allow users to read default categories or their own"
  on public.categories for select using (user_id is null or auth.uid() = user_id);

-- 4. People
create table public.people (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  icon text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.people enable row level security;
create policy "Allow all actions on people for owners"
  on public.people for all using (auth.uid() = user_id);

-- 5. Transactions
create table public.transactions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  type text check (type in ('expense', 'income')) not null,
  amount numeric not null,
  category_id uuid references public.categories on delete set null,
  category_name text,
  account_id uuid references public.accounts on delete set null,
  account_name text,
  person_id uuid references public.people on delete set null,
  person_name text,
  note text,
  date date not null,
  location_lat double precision,
  location_lng double precision,
  receipt_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.transactions enable row level security;
create policy "Allow all actions on transactions for owners"
  on public.transactions for all using (auth.uid() = user_id);
```

---

## Verification Plan

### Automated Tests
- Run `npm run build` to verify standard build pipeline compilation.
- Ensure Vite HMR runs locally with `npm run dev` at `http://localhost:5173`.

### Manual Verification
- Test expense saving functionality: Verify it triggers the saving overlay and saves records directly to the transactions log.
- Confirm mobile custom Date Picker snapping aligns precisely with active indices.
- Change theme palettes (White & Blue, White & Green, White & Pink, Black & Pink) and verify active colors update across all screens.
