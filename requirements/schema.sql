-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Profiles (Linked to Supabase Auth Users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.profiles enable row level security;
create policy "Allow users to read their own profiles"
  on public.profiles for select using (auth.uid() = id);
create policy "Allow users to update their own profiles"
  on public.profiles for update using (auth.uid() = id);

-- 2. Accounts
create table public.accounts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  icon text not null,
  color text not null,
  currency text default 'IDR' not null,
  balance numeric default 0 not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.accounts enable row level security;
create policy "Allow read for account owners"
  on public.accounts for select using (auth.uid() = user_id);
create policy "Allow insert for account owners"
  on public.accounts for insert with check (auth.uid() = user_id);
create policy "Allow update for account owners"
  on public.accounts for update using (auth.uid() = user_id);
create policy "Allow delete for account owners"
  on public.accounts for delete using (auth.uid() = user_id);

-- 3. Categories
create table public.categories (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade, -- NULL means default/system category
  name text not null,
  icon text not null,
  color text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.categories enable row level security;
create policy "Allow users to read default categories or their own"
  on public.categories for select using (user_id is null or auth.uid() = user_id);
create policy "Allow users to insert their own categories"
  on public.categories for insert with check (auth.uid() = user_id);
create policy "Allow users to update their own categories"
  on public.categories for update using (auth.uid() = user_id);
create policy "Allow users to delete their own categories"
  on public.categories for delete using (auth.uid() = user_id);

-- 4. People (for tracking splits or shared expenses)
create table public.people (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  icon text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.people enable row level security;
create policy "Allow read for people owners"
  on public.people for select using (auth.uid() = user_id);
create policy "Allow insert for people owners"
  on public.people for insert with check (auth.uid() = user_id);
create policy "Allow update for people owners"
  on public.people for update using (auth.uid() = user_id);
create policy "Allow delete for people owners"
  on public.people for delete using (auth.uid() = user_id);

-- 5. Transactions
create table public.transactions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  type text check (type in ('expense', 'income')) not null,
  amount numeric not null,
  category_id uuid references public.categories on delete set null,
  category_name text,
  account_id uuid references public.accounts on delete set null,
  account_name text,
  person_id uuid references public.people on delete set null,
  person_name text,
  note text,
  date date not null,
  location_lat double precision,
  location_lng double precision,
  receipt_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.transactions enable row level security;
create policy "Allow read for transaction owners"
  on public.transactions for select using (auth.uid() = user_id);
create policy "Allow insert for transaction owners"
  on public.transactions for insert with check (auth.uid() = user_id);
create policy "Allow update for transaction owners"
  on public.transactions for update using (auth.uid() = user_id);
create policy "Allow delete for transaction owners"
  on public.transactions for delete using (auth.uid() = user_id);

-- 6. Helper function to create profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  
  -- Insert default accounts
  insert into public.accounts (user_id, name, icon, color, currency, balance)
  values 
    (new.id, 'Mandiri SkyZ', 'CreditCard', 'text-indigo-500', 'IDR', 0),
    (new.id, 'Cash', 'Wallet', 'text-emerald-500', 'IDR', 0),
    (new.id, 'Bank BCA', 'Landmark', 'text-blue-500', 'IDR', 0);

  -- Insert default people
  insert into public.people (user_id, name, icon)
  values 
    (new.id, 'Me', 'Smile'),
    (new.id, 'Family', 'Users'),
    (new.id, 'Friend', 'User');

  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Unique indexes to prevent duplicate category names
create unique index if not exists unique_system_category_name on public.categories (name) where user_id is null;
create unique index if not exists unique_user_category_name on public.categories (user_id, name) where user_id is not null;

-- Seed Default Categories (user_id IS NULL means system defaults)
insert into public.categories (user_id, name, icon, color) values
  (null, 'Food', 'Utensils', 'text-blue-500'),
  (null, 'Communicat', 'Smartphone', 'text-slate-500'),
  (null, 'Daily', 'Coffee', 'text-green-500'),
  (null, 'Transport', 'Bus', 'text-orange-500'),
  (null, 'Tip', 'Ticket', 'text-yellow-500'),
  (null, 'Fees', 'Globe', 'text-indigo-500'),
  (null, 'SaaS Subs', 'Monitor', 'text-purple-500'),
  (null, 'Social', 'GlassWater', 'text-pink-500'),
  (null, 'Housing', 'Home', 'text-rose-500'),
  (null, 'Gifts', 'Gift', 'text-red-500'),
  (null, 'Clothing', 'Shirt', 'text-cyan-500'),
  (null, 'Entertainme', 'Tv', 'text-violet-500')
on conflict (name) where user_id is null do nothing;
