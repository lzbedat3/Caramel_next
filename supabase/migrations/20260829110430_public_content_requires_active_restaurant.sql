-- Public content is only readable while the restaurant profile is active.
-- Admin policies are unchanged and still allow full access via private.is_admin().

create or replace function private.restaurant_is_active()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.restaurant_profile
    where id = 1
      and is_active
  );
$$;

comment on function private.restaurant_is_active() is
  'Whether the singleton restaurant profile is marked active. Used by public-read RLS.';

revoke all on function private.restaurant_is_active() from public;
grant execute on function private.restaurant_is_active() to anon, authenticated, service_role;

drop policy opening_hours_public_read on public.opening_hours;
create policy opening_hours_public_read
  on public.opening_hours
  for select
  to anon, authenticated
  using ((select private.restaurant_is_active()));

drop policy social_links_public_read on public.social_links;
create policy social_links_public_read
  on public.social_links
  for select
  to anon, authenticated
  using (is_visible and (select private.restaurant_is_active()));

drop policy hero_media_public_read on public.hero_media;
create policy hero_media_public_read
  on public.hero_media
  for select
  to anon, authenticated
  using (is_visible and (select private.restaurant_is_active()));

drop policy categories_public_read on public.categories;
create policy categories_public_read
  on public.categories
  for select
  to anon, authenticated
  using (is_visible and (select private.restaurant_is_active()));

drop policy menu_items_public_read on public.menu_items;
create policy menu_items_public_read
  on public.menu_items
  for select
  to anon, authenticated
  using (is_visible and (select private.restaurant_is_active()));

drop policy site_settings_public_read on public.site_settings;
create policy site_settings_public_read
  on public.site_settings
  for select
  to anon, authenticated
  using ((select private.restaurant_is_active()));
