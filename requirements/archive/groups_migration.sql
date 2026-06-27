-- Migration: Family Groups and Members support

-- 1. Create groups table
create table if not exists public.groups (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on groups
alter table public.groups enable row level security;

-- 2. Create group_members table
create table if not exists public.group_members (
  id uuid default uuid_generate_v4() primary key,
  group_id uuid references public.groups on delete cascade not null,
  user_id uuid references auth.users on delete cascade,
  email text not null,
  role text check (role in ('owner', 'admin', 'member')) not null default 'member',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (group_id, email)
);

-- Enable RLS on group_members
alter table public.group_members enable row level security;

-- 3. Add group_id to transactions table
alter table public.transactions add column if not exists group_id uuid references public.groups on delete cascade;

-- 4. RLS Policies for groups
create policy "Allow group read for members"
  on public.groups for select using (
    exists (
      select 1 from public.group_members
      where group_members.group_id = groups.id and (group_members.user_id = auth.uid() or group_members.email = auth.jwt()->>'email')
    )
  );

create policy "Allow group insert for authenticated users"
  on public.groups for insert with check (auth.role() = 'authenticated');

create policy "Allow group update for owners"
  on public.groups for update using (
    exists (
      select 1 from public.group_members
      where group_members.group_id = groups.id and group_members.user_id = auth.uid() and group_members.role = 'owner'
    )
  );

-- 5. RLS Policies for group_members
create policy "Allow read group_members for group members"
  on public.group_members for select using (
    exists (
      select 1 from public.group_members m
      where m.group_id = group_members.group_id and (m.user_id = auth.uid() or m.email = auth.jwt()->>'email')
    )
  );

create policy "Allow insert group_members for group owners/admins"
  on public.group_members for insert with check (
    exists (
      select 1 from public.group_members m
      where m.group_id = group_members.group_id and m.user_id = auth.uid() and m.role in ('owner', 'admin')
    )
  );

create policy "Allow update group_members for group owners/admins"
  on public.group_members for update using (
    exists (
      select 1 from public.group_members m
      where m.group_id = group_members.group_id and m.user_id = auth.uid() and m.role in ('owner', 'admin')
    )
  );

create policy "Allow delete group_members for group owners/admins"
  on public.group_members for delete using (
    exists (
      select 1 from public.group_members m
      where m.group_id = group_members.group_id and m.user_id = auth.uid() and m.role in ('owner', 'admin')
    )
  );

-- 6. RLS Policies update for transactions (Family-shared check)
create policy "Allow read transactions for group members"
  on public.transactions for select using (
    exists (
      select 1 from public.group_members
      where group_members.group_id = transactions.group_id and (group_members.user_id = auth.uid() or group_members.email = auth.jwt()->>'email')
    )
  );

create policy "Allow insert transactions for group members"
  on public.transactions for insert with check (
    exists (
      select 1 from public.group_members
      where group_members.group_id = transactions.group_id and (group_members.user_id = auth.uid() or group_members.email = auth.jwt()->>'email')
    )
  );

create policy "Allow update transactions for group owners/admins"
  on public.transactions for update using (
    exists (
      select 1 from public.group_members
      where group_members.group_id = transactions.group_id and (group_members.user_id = auth.uid() or group_members.email = auth.jwt()->>'email') and group_members.role in ('owner', 'admin')
    )
  );

create policy "Allow delete transactions for group owners/admins"
  on public.transactions for delete using (
    exists (
      select 1 from public.group_members
      where group_members.group_id = transactions.group_id and (group_members.user_id = auth.uid() or group_members.email = auth.jwt()->>'email') and group_members.role in ('owner', 'admin')
    )
  );
