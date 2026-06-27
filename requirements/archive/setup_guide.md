# Project and Supabase Setup Guide

This guide provides the quick-start instructions to set up your local development environment and link it to a Supabase database instance.

---

## 1. Prerequisites

Make sure you have the following installed on your machine:
- **Node.js** (v18 or higher recommended)
- **npm** (v9 or higher)
- A free **[Supabase](https://supabase.com)** account

---

## 2. Local Project Setup

Follow these steps to configure your local project environment:

### Step 1: Install Dependencies
Open your terminal in the project root directory and install the required npm packages:
```bash
npm install
```

### Step 2: Configure Environment Variables
Create a local environment file by copying the template:
```bash
cp .env.example .env
```
Keep this terminal window ready. We will fill in the values in the next section.

---

## 3. Supabase Database Setup

Supabase provides the PostgreSQL database and anonymous authentication needed for the app's zero-friction "Demo Mode."

### Step 1: Create a Supabase Project
1. Log in to the [Supabase Dashboard](https://supabase.com).
2. Click **New Project** and choose your organization.
3. Enter a project name (e.g. `miu-expense`), set a secure database password, and select your hosting region.
4. Click **Create new project** and wait for the initialization to complete (typically takes 1-2 minutes).

### Step 2: Initialize Database Schema
1. Click the **SQL Editor** tab on the left sidebar (marked with the `SQL` icon).
2. Click **New query** to open a blank editor tab.
3. Open the file [requirements/schema.sql](file:///Users/arifindobson/Documents/arifinProject/miu-expense/requirements/schema.sql) in your project.
4. Copy the entire contents of the SQL script and paste it into the Supabase SQL editor.
5. Click **Run** (bottom right of the query panel).
6. Verify that the query returns success. This creates all tables (`profiles`, `accounts`, `people`, `transactions`), establishes relationships, and configures Row Level Security (RLS) policies.

### Step 3: Enable Anonymous Authentication
To allow users to log in instantly without typing passwords:
1. Navigate to **Authentication** (the user icon on the sidebar) -> **Providers**.
2. Scroll down to the **Anonymous** section.
3. Toggle **Enable Anonymous Sign-ins** to **ON**.
4. Click **Save**.

### Step 4: Get API Credentials
1. Navigate to **Project Settings** (gear icon) -> **API** on the left sidebar.
2. Copy the **Project URL** (under the Project API URL section).
3. Copy the **anon public** API key (under the Project API Keys section).

---

## 4. Link Supabase to the App

1. Open the `.env` file you created in your project root.
2. Paste your credentials into the variables:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
3. Save the `.env` file.

---

## 5. Running the Application

Start the local development server:
```bash
npm run dev
```
1. Open your browser and navigate to **[http://localhost:5173/](http://localhost:5173/)**.
2. **Verification**: Open the browser Developer Console (F12). You should see:
   `Demo Mode: Automatically signed in anonymously to Supabase.`
3. Any transaction you add now will synchronize immediately with your live Supabase database tables!

---

## 6. Offline/Demo Mode Fallback
If you choose not to set up Supabase or run the app without `.env` variables:
- The app logs a warning in the console indicating missing keys.
- The app automatically switches to **Offline Fallback mode**, storing all added expenses and settings locally in the browser's `localStorage` (under the key `miu_transactions`).
