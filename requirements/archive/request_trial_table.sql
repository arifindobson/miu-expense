-- SQL Migration: Request Trial Table
-- Run this in your Supabase SQL Editor to support the new request trial form.

CREATE TABLE IF NOT EXISTS public.request_trials (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  name text NOT NULL,
  whatsapp_number text NOT NULL,
  reason text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.request_trials ENABLE ROW LEVEL SECURITY;

-- Allow anyone (even unauthenticated visitors) to submit a trial request
DROP POLICY IF EXISTS "Allow anonymous inserts to request_trials" ON public.request_trials;
CREATE POLICY "Allow anonymous inserts to request_trials" 
  ON public.request_trials FOR INSERT WITH CHECK (true);
