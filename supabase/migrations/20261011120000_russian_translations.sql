-- Russian versions of the content shown on the public menu, next to the Arabic
-- and English ones. An empty translation falls back to the default (Hebrew) text.

alter table public.menu_items
  add column if not exists name_ru text,
  add column if not exists short_description_ru text;

alter table public.categories
  add column if not exists name_ru text,
  add column if not exists subtitle_ru text;

alter table public.restaurant_profile
  add column if not exists name_ru text,
  add column if not exists subtitle_ru text,
  add column if not exists about_ru text,
  add column if not exists address_ru text;

alter table public.locations
  add column if not exists name_ru text,
  add column if not exists address_ru text;

alter table public.site_settings
  add column if not exists dedication_by_ru text,
  add column if not exists dedication_to_ru text;

-- "/ru" is now a language, so no branch may take it as its address.
alter table public.locations drop constraint locations_slug_not_reserved;
alter table public.locations add constraint locations_slug_not_reserved
  check (slug not in ('he', 'ar', 'en', 'ru', 'admin', 'portal', 'auth', 'api'));
