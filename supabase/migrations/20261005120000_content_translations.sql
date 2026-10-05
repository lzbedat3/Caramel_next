-- Arabic and English versions of the content shown on the public menu.
-- The existing columns stay the default (Hebrew) text; an empty translation
-- falls back to it, so nothing changes until a translation is filled in.

alter table public.menu_items
  add column if not exists name_ar text,
  add column if not exists name_en text,
  add column if not exists short_description_ar text,
  add column if not exists short_description_en text;

alter table public.categories
  add column if not exists name_ar text,
  add column if not exists name_en text,
  add column if not exists subtitle_ar text,
  add column if not exists subtitle_en text;

alter table public.restaurant_profile
  add column if not exists name_ar text,
  add column if not exists name_en text,
  add column if not exists subtitle_ar text,
  add column if not exists subtitle_en text,
  add column if not exists about_ar text,
  add column if not exists about_en text,
  add column if not exists address_ar text,
  add column if not exists address_en text;
