-- Wave 1 · Item 1.4 — Fix new-user group bootstrap (RLS)
-- Apply in the Supabase SQL Editor.
--
-- VERIFIED 2026-06-28 from a live new-user session. Console showed:
--   POST /groups?select=*  →  403
--   "new row violates row-level security policy for table \"groups\""
--
-- Corrected diagnosis: the FIRST failing statement is the INSERT into `groups`
-- (not group_members as originally assumed). With RLS enabled and no working
-- INSERT policy, a brand-new user cannot create their group at all, so the app
-- falls back to localStorage and the account is never provisioned server-side.
--
-- The complete fix is two parts:
--   (1) a reliable INSERT policy on `groups`, and
--   (2) seeding the owner membership in an AFTER INSERT trigger (SECURITY DEFINER,
--       so it bypasses the group_members admin/owner INSERT check).
-- Paired client change in src/App.tsx is already applied (see note at bottom).

-- ─────────────────────────────────────────────────────────────────────────────
-- (1) Allow any authenticated user to create a group.
-- Replaces the prior "auth.role() = 'authenticated'" check, which was either
-- missing or evaluating false in this project. auth.uid() is the robust test.
drop policy if exists "Allow group insert for authenticated users" on public.groups;
create policy "Allow group insert for authenticated users"
  on public.groups for insert
  with check (auth.uid() is not null);

-- ─────────────────────────────────────────────────────────────────────────────
-- (2) Seed the creating user as owner + default resources, inside the same txn.
-- Because this is an AFTER INSERT trigger, the membership row exists before the
-- INSERT...RETURNING (.select()) visibility check runs, so is_group_member(id)
-- passes and the client gets its row back.
create or replace function public.handle_new_group()
returns trigger as $$
begin
  if auth.uid() is not null then
    insert into public.group_members (group_id, user_id, email, role)
    values (new.id, auth.uid(), auth.jwt()->>'email', 'owner')
    on conflict (group_id, email) do nothing;
  end if;

  insert into public.accounts (group_id, name, icon, color, currency, balance)
  values
    (new.id, 'Mandiri SkyZ', 'CreditCard', 'text-indigo-500', 'IDR', 0),
    (new.id, 'Cash', 'Wallet', 'text-emerald-500', 'IDR', 0),
    (new.id, 'Bank BCA', 'Landmark', 'text-blue-500', 'IDR', 0);

  insert into public.people (group_id, name, icon)
  values
    (new.id, 'Me', 'Smile'),
    (new.id, 'Family', 'Users'),
    (new.id, 'Friend', 'User');

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_group_created on public.groups;
create trigger on_group_created
  after insert on public.groups
  for each row execute procedure public.handle_new_group();

-- ─────────────────────────────────────────────────────────────────────────────
-- Paired client change (DONE in src/App.tsx loadAllResources):
--   The client no longer INSERTs the owner group_members row (the trigger does it,
--   and a manual insert would now collide on unique(group_id, email)). After the
--   group insert it re-fetches the membership the trigger created. A best-effort
--   self-insert fallback remains only for the case where this trigger isn't applied.
