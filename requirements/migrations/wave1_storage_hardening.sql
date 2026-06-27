-- Wave 1 · Item 1.3 — Harden the `receipts` storage bucket
-- Apply in the Supabase SQL Editor. Read the notes before running.
--
-- Status of the code-side change (already done in this repo):
--   • ReceiptScanner now generates filenames with crypto.randomUUID() instead of
--     Math.random().toString(36) — receipt paths are no longer guessable/enumerable.
--
-- This file does TWO things:
--   (A) SAFE NOW — tighten the INSERT policy so a user can only write into their
--       own folder. No app changes required; does not affect display.
--   (B) FULL FIX (recommended, deferred) — make the bucket PRIVATE and serve via
--       signed URLs. This REQUIRES an app-side change first (see note) or receipt
--       images will stop loading. Left commented out on purpose.

-- ─────────────────────────────────────────────────────────────────────────────
-- (A) SAFE NOW: restrict uploads to the uploader's own folder
-- Files are stored as `${userId}/${timestamp}-${uuid}.jpg`, so foldername[1] = userId.
drop policy if exists "Allow Authenticated Insert" on storage.objects;
create policy "Allow insert into own receipts folder" on storage.objects
  for insert with check (
    bucket_id = 'receipts'
    and auth.role() = 'authenticated'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- (B) FULL FIX — PRIVATE BUCKET + SIGNED URLS  (DO NOT RUN until the app change below)
--
-- App change required first:
--   • On upload, store the storage PATH (`${userId}/...jpg`) in transactions.receipt_url,
--     not the public URL.
--   • On display, resolve paths to short-lived signed URLs with
--     supabase.storage.from('receipts').createSignedUrl(path, 60*60).
--   • Migrate existing rows: existing receipt_url values are full public URLs / base64;
--     display code must handle all three (path | data: | legacy public URL).
--
-- Once the app handles signed URLs, run:
--
--   update storage.buckets set public = false where id = 'receipts';
--
--   drop policy if exists "Allow Public Select" on storage.objects;
--   -- Group members can read receipts uploaded by anyone in their group.
--   -- (Requires joining the storage path's userId back to a shared group; simplest
--   --  is to grant SELECT to authenticated and rely on unguessable paths + signed
--   --  URLs, OR store receipts under a `${groupId}/` prefix and check is_group_member.)
--   create policy "Allow authenticated read of receipts" on storage.objects
--     for select using (
--       bucket_id = 'receipts' and auth.role() = 'authenticated'
--     );
--
-- Tracking: this (B) portion is the bigger half of audit item 1.3 and is intentionally
-- deferred to Wave 2 alongside the receipt display refactor.
