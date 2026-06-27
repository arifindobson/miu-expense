-- Migration: Group-Scoped (Multi-Tenant) Resources
-- Run this in your Supabase SQL Editor to make accounts, custom categories, and custom people shared within group tenants.

-- 1. Schema Scaling: Add group_id columns and make user_id optional (nullable)
ALTER TABLE public.accounts ADD COLUMN IF NOT EXISTS group_id uuid REFERENCES public.groups(id) ON DELETE CASCADE;
ALTER TABLE public.accounts ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE public.people ADD COLUMN IF NOT EXISTS group_id uuid REFERENCES public.groups(id) ON DELETE CASCADE;
ALTER TABLE public.people ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS group_id uuid REFERENCES public.groups(id) ON DELETE CASCADE;

-- 2. Data Backfilling: Assign existing user accounts/people/categories to their active group membership
UPDATE public.accounts a
SET group_id = (
  SELECT group_id 
  FROM public.group_members m 
  WHERE m.user_id = a.user_id 
  ORDER BY m.created_at ASC 
  LIMIT 1
)
WHERE a.group_id IS NULL;

UPDATE public.people p
SET group_id = (
  SELECT group_id 
  FROM public.group_members m 
  WHERE m.user_id = p.user_id 
  ORDER BY m.created_at ASC 
  LIMIT 1
)
WHERE p.group_id IS NULL;

UPDATE public.categories c
SET group_id = (
  SELECT group_id 
  FROM public.group_members m 
  WHERE m.user_id = c.user_id 
  ORDER BY m.created_at ASC 
  LIMIT 1
)
WHERE c.group_id IS NULL AND c.user_id IS NOT NULL;

-- 3. Deduplication: Delete duplicate categories inside the same group before enforcing the unique constraint
DELETE FROM public.categories c1
USING public.categories c2
WHERE c1.id > c2.id
  AND c1.group_id = c2.group_id
  AND lower(c1.name) = lower(c2.name)
  AND c1.group_id IS NOT NULL;

-- 4. Unique Constraints: Drop user-based unique constraint index on categories and create group-based constraint
DROP INDEX IF EXISTS public.unique_user_category_name;
CREATE UNIQUE INDEX IF NOT EXISTS unique_group_category_name ON public.categories (group_id, name) WHERE group_id IS NOT NULL;

-- 4. Rewrite RLS Policies for Accounts
DROP POLICY IF EXISTS "Allow read for account owners" ON public.accounts;
DROP POLICY IF EXISTS "Allow insert for account owners" ON public.accounts;
DROP POLICY IF EXISTS "Allow update for account owners" ON public.accounts;
DROP POLICY IF EXISTS "Allow delete for account owners" ON public.accounts;

DROP POLICY IF EXISTS "Allow read accounts for group members" ON public.accounts;
DROP POLICY IF EXISTS "Allow insert accounts for group members" ON public.accounts;
DROP POLICY IF EXISTS "Allow update accounts for group members" ON public.accounts;
DROP POLICY IF EXISTS "Allow delete accounts for group members" ON public.accounts;

CREATE POLICY "Allow read accounts for group members" ON public.accounts
  FOR SELECT USING (public.is_group_member(group_id));

CREATE POLICY "Allow insert accounts for group members" ON public.accounts
  FOR INSERT WITH CHECK (public.is_group_member(group_id));

CREATE POLICY "Allow update accounts for group members" ON public.accounts
  FOR UPDATE USING (public.is_group_member(group_id));

CREATE POLICY "Allow delete accounts for group members" ON public.accounts
  FOR DELETE USING (public.is_group_member(group_id));

-- 5. Rewrite RLS Policies for People
DROP POLICY IF EXISTS "Allow read for people owners" ON public.people;
DROP POLICY IF EXISTS "Allow insert for people owners" ON public.people;
DROP POLICY IF EXISTS "Allow update for people owners" ON public.people;
DROP POLICY IF EXISTS "Allow delete for people owners" ON public.people;

DROP POLICY IF EXISTS "Allow read people for group members" ON public.people;
DROP POLICY IF EXISTS "Allow insert people for group members" ON public.people;
DROP POLICY IF EXISTS "Allow update people for group members" ON public.people;
DROP POLICY IF EXISTS "Allow delete people for group members" ON public.people;

CREATE POLICY "Allow read people for group members" ON public.people
  FOR SELECT USING (public.is_group_member(group_id));

CREATE POLICY "Allow insert people for group members" ON public.people
  FOR INSERT WITH CHECK (public.is_group_member(group_id));

CREATE POLICY "Allow update people for group members" ON public.people
  FOR UPDATE USING (public.is_group_member(group_id));

CREATE POLICY "Allow delete people for group members" ON public.people
  FOR DELETE USING (public.is_group_member(group_id));

-- 6. Rewrite RLS Policies for Categories
DROP POLICY IF EXISTS "Allow users to read default categories or their own" ON public.categories;
DROP POLICY IF EXISTS "Allow users to insert their own categories" ON public.categories;
DROP POLICY IF EXISTS "Allow users to update their own categories" ON public.categories;
DROP POLICY IF EXISTS "Allow users to delete their own categories" ON public.categories;

DROP POLICY IF EXISTS "Allow read categories for group members" ON public.categories;
DROP POLICY IF EXISTS "Allow insert categories for group members" ON public.categories;
DROP POLICY IF EXISTS "Allow update categories for group members" ON public.categories;
DROP POLICY IF EXISTS "Allow delete categories for group members" ON public.categories;

CREATE POLICY "Allow read categories for group members" ON public.categories
  FOR SELECT USING (user_id IS NULL OR public.is_group_member(group_id));

CREATE POLICY "Allow insert categories for group members" ON public.categories
  FOR INSERT WITH CHECK (public.is_group_member(group_id));

CREATE POLICY "Allow update categories for group members" ON public.categories
  FOR UPDATE USING (public.is_group_member(group_id));

CREATE POLICY "Allow delete categories for group members" ON public.categories
  FOR DELETE USING (public.is_group_member(group_id));

-- 7. Modify triggers: Seed default accounts and people on Group Creation, not User Registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.handle_new_group()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert default accounts for this new group
  INSERT INTO public.accounts (group_id, name, icon, color, currency, balance)
  VALUES 
    (new.id, 'Mandiri SkyZ', 'CreditCard', 'text-indigo-500', 'IDR', 0),
    (new.id, 'Cash', 'Wallet', 'text-emerald-500', 'IDR', 0),
    (new.id, 'Bank BCA', 'Landmark', 'text-blue-500', 'IDR', 0);

  -- Insert default people for this new group
  INSERT INTO public.people (group_id, name, icon)
  VALUES 
    (new.id, 'Me', 'Smile'),
    (new.id, 'Family', 'Users'),
    (new.id, 'Friend', 'User');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_group_created ON public.groups;
CREATE TRIGGER on_group_created
  AFTER INSERT ON public.groups
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_group();
