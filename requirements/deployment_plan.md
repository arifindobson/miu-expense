# Deployment Plan: Supabase, GitHub, and Vercel Setup

This document provides step-by-step instructions to configure your Supabase backend, manage your source code via GitHub, and deploy the application live on Vercel.

---

## 1. Supabase Backend Setup

Supabase will act as your Postgres database, storage manager, and authentication server.

### Step 1: Create a Supabase Project
1. Go to the [Supabase Dashboard](https://supabase.com) and log in.
2. Click **New Project** and select your organization.
3. Define a **Project Name** (e.g. `miu-expense-tracker`), database password, and choose your region.
4. Click **Create new project** and wait for provision to complete (takes ~1-2 minutes).

### Step 2: Initialize Database Schema & RLS Policies
We need to run the database setup query to create tables, relationships, triggers, and Row Level Security (RLS) policies.
1. In the Supabase sidebar, click on the **SQL Editor** tab (represented by `SQL` icon).
2. Click **New query** (or **Blank query**).
3. Copy the entire contents of the file located at: [requirements/schema.sql](file:///Users/arifindobson/Documents/arifinProject/miu-expense/requirements/schema.sql).
4. Paste it into the editor.
5. Click **Run** in the bottom right corner.
6. Verify that the query executes successfully and all tables are created.

### Step 3: Enable Email / Password Signups
By default, Supabase enables Email/Password authentication.
1. Go to the **Authentication** tab -> **Providers** -> **Email**.
2. Ensure **Enable Signup** is toggled ON.
3. *(Optional)* Turn OFF **Confirm Email** if you want users to log in instantly without waiting for an email confirmation link (recommended for quick testing).

---

## 2. GitHub Repository Setup

GitHub will manage your source code and trigger automated deployments to Vercel whenever you push changes.

### Step 1: Initialize Git Locally
If you haven't initialized a git repository inside your local workspace:
1. Open your terminal in the root directory `/Users/arifindobson/Documents/arifinProject/miu-expense`.
2. Run the following commands:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Vite + Tailwind v4 + Custom Date Picker UI"
   ```

### Step 2: Create Repository on GitHub
1. Go to [GitHub](https://github.com) and click **New Repository**.
2. Set the repository name (e.g., `miu-expense`) and choose your visibility (Public or Private).
3. Do **NOT** initialize with a README, `.gitignore`, or license (since these are already in your project).
4. Click **Create Repository**.

### Step 3: Link and Push Local Code
Copy the instructions shown on GitHub to push your existing repository:
```bash
git branch -M main
git remote add origin git@github.com:YOUR_GITHUB_USERNAME/miu-expense.git
git push -u origin main
```

---

## 3. Vercel Hosting Deployment

Vercel will build and host your Vite client-side code, syncing updates automatically with your GitHub repository.

### Step 1: Connect your Vercel Account
1. Sign in to [Vercel](https://vercel.com).
2. Click **Add New** -> **Project**.
3. Under "Import Git Repository", search for and import `miu-expense`.

### Step 2: Configure Project Build Settings
Vercel automatically detects that you are deploying a **Vite** application and configures build options. Double-check these settings:
- **Framework Preset**: Vite
- **Root Directory**: `./` (leave default)
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

### Step 3: Set Environment Variables
Before clicking Deploy, expand the **Environment Variables** section and input your Supabase project keys. You can retrieve these keys in Supabase under **Project Settings** -> **API**:
1. Add `VITE_SUPABASE_URL` as key, and paste your **Project URL** as value.
2. Add `VITE_SUPABASE_ANON_KEY` as key, and paste your **Anon Public API Key** as value.

### Step 4: Deploy & Verify
1. Click **Deploy**.
2. Vercel will clone, compile typescript, bundle assets with Rollup, and deploy the application.
3. Once finished, click on the preview window to visit your live production URL!

---

## 4. Local Development Sync (.env)

For local development:
1. Create a copy of `.env.example` named `.env` in the root workspace:
   ```bash
   cp .env.example .env
   ```
2. Open `.env` and fill in your keys:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
3. Restart your dev server with `npm run dev` to pick up the credentials.
