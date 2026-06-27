-- Migration: Group Onboarding & Profiles Visibility Updates
-- Run this in your Supabase SQL Editor to support instant member joining without unique constraint errors.

-- 1. Drop existing profiles policies to avoid duplicates and ensure idempotency
drop policy if exists "Allow users to read their own profiles" on public.profiles;
drop policy if exists "Allow all authenticated users to read profiles" on public.profiles;

-- 2. Allow all authenticated users to read profiles by email
-- This enables checking if an email belongs to an existing user during group addition.
create policy "Allow all authenticated users to read profiles"
  on public.profiles for select using (auth.role() = 'authenticated');

-- 4. Trigger Function: Automatically link pre-existing group_members rows when a user registers
-- This bypasses any async confirm flow, auto-linking the user to their groups when their auth record is created.
create or replace function public.link_new_user_to_groups()
returns trigger as $$
begin
  update public.group_members
  set user_id = new.id
  where lower(email) = lower(new.email) and user_id is null;
  return new;
end;
$$ language plpgsql security definer;

-- 5. Trigger on public.profiles insertion (which runs after auth.users creation)
drop trigger if exists on_profile_created_link_groups on public.profiles;
create trigger on_profile_created_link_groups
  after insert on public.profiles
  for each row execute procedure public.link_new_user_to_groups();

-- 6. Helper Security Definer Functions to bypass RLS recursion on group_members
-- When RLS is enabled on group_members, nested queries within its policies can recurse.
-- Security definer functions run as the database owner, bypassing RLS inside their scope.
create or replace function public.is_group_member(group_id uuid)
returns boolean as $$
begin
  return exists (
    select 1 from public.group_members
    where group_members.group_id = is_group_member.group_id
      and (group_members.user_id = auth.uid() or lower(group_members.email) = lower(auth.jwt()->>'email'))
  );
end;
$$ language plpgsql security definer;

create or replace function public.is_group_admin_or_owner(group_id uuid)
returns boolean as $$
begin
  return exists (
    select 1 from public.group_members
    where group_members.group_id = is_group_admin_or_owner.group_id
      and (group_members.user_id = auth.uid() or lower(group_members.email) = lower(auth.jwt()->>'email'))
      and group_members.role in ('owner', 'admin')
  );
end;
$$ language plpgsql security definer;

create or replace function public.is_group_owner(group_id uuid)
returns boolean as $$
begin
  return exists (
    select 1 from public.group_members
    where group_members.group_id = is_group_owner.group_id
      and (group_members.user_id = auth.uid() or lower(group_members.email) = lower(auth.jwt()->>'email'))
      and group_members.role = 'owner'
  );
end;
$$ language plpgsql security definer;

-- 7. Recreate group_members policies with helper functions
drop policy if exists "Allow read group_members for group members" on public.group_members;
create policy "Allow read group_members for group members"
  on public.group_members for select using (
    public.is_group_member(group_id)
  );

drop policy if exists "Allow insert group_members for group owners/admins" on public.group_members;
create policy "Allow insert group_members for group owners/admins"
  on public.group_members for insert with check (
    public.is_group_admin_or_owner(group_id)
  );

drop policy if exists "Allow update group_members for group owners/admins" on public.group_members;
create policy "Allow update group_members for group owners/admins"
  on public.group_members for update using (
    public.is_group_admin_or_owner(group_id)
  );

drop policy if exists "Allow delete group_members for group owners/admins" on public.group_members;
create policy "Allow delete group_members for group owners/admins"
  on public.group_members for delete using (
    public.is_group_admin_or_owner(group_id)
  );

-- 8. Recreate groups policies using helper functions
drop policy if exists "Allow group read for members" on public.groups;
create policy "Allow group read for members"
  on public.groups for select using (
    public.is_group_member(id)
  );

drop policy if exists "Allow group update for owners" on public.groups;
create policy "Allow group update for owners"
  on public.groups for update using (
    public.is_group_owner(id)
  );

-- 9. Recreate transactions policies using helper functions
drop policy if exists "Allow read transactions for group members" on public.transactions;
create policy "Allow read transactions for group members"
  on public.transactions for select using (
    public.is_group_member(group_id)
  );

drop policy if exists "Allow insert transactions for group members" on public.transactions;
create policy "Allow insert transactions for group members"
  on public.transactions for insert with check (
    public.is_group_member(group_id)
  );

drop policy if exists "Allow update transactions for group owners/admins" on public.transactions;
create policy "Allow update transactions for group owners/admins"
  on public.transactions for update using (
    public.is_group_admin_or_owner(group_id)
  );

drop policy if exists "Allow delete transactions for group owners/admins" on public.transactions;
create policy "Allow delete transactions for group owners/admins"
  on public.transactions for delete using (
    public.is_group_admin_or_owner(group_id)
  );
