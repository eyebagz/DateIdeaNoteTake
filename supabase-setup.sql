-- Run this entire file in Supabase: SQL Editor -> New query -> Run.
-- This deliberately allows anyone with the public website to read, add,
-- edit and delete date ideas and to upload/view/delete date photos.
-- Do not use this policy model for private or sensitive information.

create table if not exists public.date_ideas (
  id text primary key,
  data jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.date_ideas enable row level security;

drop policy if exists "Anyone can view date ideas" on public.date_ideas;
drop policy if exists "Anyone can add date ideas" on public.date_ideas;
drop policy if exists "Anyone can edit date ideas" on public.date_ideas;
drop policy if exists "Anyone can delete date ideas" on public.date_ideas;

create policy "Anyone can view date ideas"
on public.date_ideas for select to anon, authenticated using (true);

create policy "Anyone can add date ideas"
on public.date_ideas for insert to anon, authenticated with check (true);

create policy "Anyone can edit date ideas"
on public.date_ideas for update to anon, authenticated using (true) with check (true);

create policy "Anyone can delete date ideas"
on public.date_ideas for delete to anon, authenticated using (true);

-- Public bucket for the optional date-memory photos.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('date-photos', 'date-photos', true, 5242880, array['image/jpeg','image/png','image/webp','image/gif'])
on conflict (id) do update set public = true, file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg','image/png','image/webp','image/gif'];

drop policy if exists "Anyone can view date photos" on storage.objects;
drop policy if exists "Anyone can upload date photos" on storage.objects;
drop policy if exists "Anyone can delete date photos" on storage.objects;

create policy "Anyone can view date photos"
on storage.objects for select to anon, authenticated
using (bucket_id = 'date-photos');

create policy "Anyone can upload date photos"
on storage.objects for insert to anon, authenticated
with check (bucket_id = 'date-photos');

create policy "Anyone can delete date photos"
on storage.objects for delete to anon, authenticated
using (bucket_id = 'date-photos');

-- Enable realtime notifications for the shared date list.
alter publication supabase_realtime add table public.date_ideas;
