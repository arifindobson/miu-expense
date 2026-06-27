-- SQL Migration to add email column to the people table
-- Run this in your Supabase SQL Editor

ALTER TABLE public.people ADD COLUMN IF NOT EXISTS email text;
