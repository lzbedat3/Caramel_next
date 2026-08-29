-- Public restaurant media. Writes are admin-only.
-- Public buckets so next/image can load objects without signed URLs.
-- Upsert requires INSERT + SELECT + UPDATE.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'menu-items',
    'menu-items',
    true,
    5242880,
    array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif']
  ),
  (
    'categories',
    'categories',
    true,
    5242880,
    array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif']
  ),
  (
    'hero',
    'hero',
    true,
    52428800,
    array[
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/avif',
      'image/gif',
      'video/mp4',
      'video/webm',
      'video/quicktime'
    ]
  ),
  (
    'branding',
    'branding',
    true,
    5242880,
    array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif', 'image/svg+xml']
  )
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Public read (bucket is public; policy still required for listing via API)
create policy storage_menu_items_public_read
  on storage.objects
  for select
  to public
  using (bucket_id = 'menu-items');

create policy storage_categories_public_read
  on storage.objects
  for select
  to public
  using (bucket_id = 'categories');

create policy storage_hero_public_read
  on storage.objects
  for select
  to public
  using (bucket_id = 'hero');

create policy storage_branding_public_read
  on storage.objects
  for select
  to public
  using (bucket_id = 'branding');

-- Admin writes (insert / update / delete). SELECT above covers upsert.
create policy storage_menu_items_admin_insert
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'menu-items' and (select private.is_admin()));

create policy storage_menu_items_admin_update
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'menu-items' and (select private.is_admin()))
  with check (bucket_id = 'menu-items' and (select private.is_admin()));

create policy storage_menu_items_admin_delete
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'menu-items' and (select private.is_admin()));

create policy storage_categories_admin_insert
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'categories' and (select private.is_admin()));

create policy storage_categories_admin_update
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'categories' and (select private.is_admin()))
  with check (bucket_id = 'categories' and (select private.is_admin()));

create policy storage_categories_admin_delete
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'categories' and (select private.is_admin()));

create policy storage_hero_admin_insert
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'hero' and (select private.is_admin()));

create policy storage_hero_admin_update
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'hero' and (select private.is_admin()))
  with check (bucket_id = 'hero' and (select private.is_admin()));

create policy storage_hero_admin_delete
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'hero' and (select private.is_admin()));

create policy storage_branding_admin_insert
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'branding' and (select private.is_admin()));

create policy storage_branding_admin_update
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'branding' and (select private.is_admin()))
  with check (bucket_id = 'branding' and (select private.is_admin()));

create policy storage_branding_admin_delete
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'branding' and (select private.is_admin()));
