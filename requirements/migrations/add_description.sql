-- Add an optional free-text "description" to accounts and categories.
-- Run in the Supabase SQL Editor. Until this is applied, the app still works:
-- editing/adding online silently drops the description (and logs a console warning);
-- once applied, descriptions persist normally. Offline (localStorage) works regardless.

alter table public.accounts   add column if not exists description text;
alter table public.categories add column if not exists description text;
