alter table public.restaurant_profile
  add column logo_storage_path text;

comment on column public.restaurant_profile.logo_storage_path is
  'Object key inside the branding storage bucket. Null when no logo is set.';
