-- 1. Create a storage bucket for receipts if it doesn't exist
insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', true)
on conflict (id) do nothing;

-- 2. Policy to allow public access to read files in receipts bucket
drop policy if exists "Allow Public Select" on storage.objects;
create policy "Allow Public Select" on storage.objects 
  for select using (bucket_id = 'receipts');

-- 3. Policy to allow authenticated users to upload files to receipts bucket
drop policy if exists "Allow Authenticated Insert" on storage.objects;
create policy "Allow Authenticated Insert" on storage.objects 
  for insert with check (
    bucket_id = 'receipts' 
    and auth.role() = 'authenticated'
  );

-- 4. Policy to allow users to delete their own files
drop policy if exists "Allow User Delete" on storage.objects;
create policy "Allow User Delete" on storage.objects 
  for delete using (
    bucket_id = 'receipts' 
    and auth.uid()::text = (storage.foldername(name))[1]
  );
