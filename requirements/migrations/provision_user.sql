-- Manual new-user provisioning  (interim workaround — see audit item 1.4, PARKED)
-- ─────────────────────────────────────────────────────────────────────────────
-- WHY THIS EXISTS
--   Client-side auto-provisioning (App.tsx creating the group on first login)
--   fails with: 42501 "new row violates row-level security policy for table
--   groups". An in-DB simulation that injected a valid `sub` claim ALSO failed,
--   which means auth.uid() resolves to NULL even with claims present — a deeper
--   auth-context issue, parked for now.
--
-- WHY THIS WORKS
--   This function is SECURITY DEFINER: it runs as the function owner and BYPASSES
--   RLS, so it never calls auth.uid() and is immune to the parked bug. Run it once
--   per new user/family during the current manual-onboarding phase.
--
-- USAGE (Supabase SQL Editor, as project owner)
--   1. Get the new user's UID from Authentication → Users.
--   2. select public.provision_user_group(
--        '935e1e0f-700c-418f-8643-f9c3335ea728',  -- user UID
--        'test01@miu.com',                         -- user email
--        null                                      -- optional group name
--      );
--   It returns the group_id, is idempotent (safe to re-run), and seeds default
--   accounts/people only if they don't already exist for the group.

create or replace function public.provision_user_group(
  p_user_id uuid,
  p_email text,
  p_group_name text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_group_id uuid;
  v_name text := coalesce(nullif(trim(p_group_name), ''), split_part(p_email, '@', 1) || '''s Ledger');
begin
  -- 0. Ensure a profile row exists
  insert into public.profiles (id, email)
  values (p_user_id, p_email)
  on conflict (id) do nothing;

  -- 1. If the user already belongs to a group, return it (idempotent)
  select gm.group_id into v_group_id
  from public.group_members gm
  where gm.user_id = p_user_id or lower(gm.email) = lower(p_email)
  limit 1;
  if v_group_id is not null then
    return v_group_id;
  end if;

  -- 2. Create the group
  insert into public.groups (name) values (v_name)
  returning id into v_group_id;

  -- 3. Owner membership (guarded: the on_group_created trigger may also add it)
  insert into public.group_members (group_id, user_id, email, role)
  values (v_group_id, p_user_id, p_email, 'owner')
  on conflict (group_id, email) do nothing;

  -- 4. Default accounts (only if not already seeded by a trigger)
  if not exists (select 1 from public.accounts where group_id = v_group_id) then
    insert into public.accounts (group_id, name, icon, color, currency, balance) values
      (v_group_id, 'Mandiri SkyZ', 'CreditCard', 'text-indigo-500', 'IDR', 0),
      (v_group_id, 'Cash', 'Wallet', 'text-emerald-500', 'IDR', 0),
      (v_group_id, 'Bank BCA', 'Landmark', 'text-blue-500', 'IDR', 0);
  end if;

  -- 5. Default people (only if not already seeded by a trigger)
  if not exists (select 1 from public.people where group_id = v_group_id) then
    insert into public.people (group_id, name, icon) values
      (v_group_id, 'Me', 'Smile'),
      (v_group_id, 'Family', 'Users'),
      (v_group_id, 'Friend', 'User');
  end if;

  return v_group_id;
end;
$$;

-- Run for the current test user:
-- select public.provision_user_group('935e1e0f-700c-418f-8643-f9c3335ea728', 'test01@miu.com', null);
