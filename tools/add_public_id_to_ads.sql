-- Adds a numeric "public_id" for SEO-friendly ad URLs like /escorts/female/germany/berlin/692382
-- Safe to run multiple times (uses IF NOT EXISTS where possible).
--
-- Run this in Supabase SQL Editor.

-- 1) Create sequence starting at 100000 (6 digits)
create sequence if not exists ads_public_id_seq start 100000;

-- 2) Add column
alter table if exists public.ads
  add column if not exists public_id bigint;

-- 3) Default new rows from the sequence
alter table if exists public.ads
  alter column public_id set default nextval('ads_public_id_seq');

-- 4) Backfill existing rows
update public.ads
set public_id = nextval('ads_public_id_seq')
where public_id is null;

-- 5) Keep it unique
create unique index if not exists ads_public_id_unique on public.ads(public_id);

-- 6) Optional: ensure the sequence is always ahead of the current max
select setval('ads_public_id_seq', greatest((select coalesce(max(public_id), 99999) from public.ads) + 1, 100000), false);


