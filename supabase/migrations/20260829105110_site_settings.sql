-- Optional SEO overrides for the public site. Singleton: exactly one row is allowed.
-- Restaurant identity (name, about, address) stays on restaurant_profile.

create table public.site_settings (
  id smallint primary key default 1 check (id = 1),
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint site_settings_seo_title_length
    check (seo_title is null or char_length(seo_title) between 1 and 70),
  constraint site_settings_seo_description_length
    check (seo_description is null or char_length(seo_description) between 1 and 320)
);

comment on table public.site_settings is
  'Single-row public-site SEO overrides. Does not replace restaurant profile fields.';

create trigger site_settings_set_updated_at
before update on public.site_settings
for each row
execute function private.set_updated_at();

alter table public.site_settings enable row level security;
alter table public.site_settings force row level security;

create policy site_settings_public_read
  on public.site_settings
  for select
  to anon, authenticated
  using (true);

create policy site_settings_admin_all
  on public.site_settings
  for all
  to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));
