-- Branches. Each has its own address, phone, navigation link and opening hours,
-- and its own permanent public address (/<slug>) for printed QR codes.
-- The menu itself (categories and dishes) is shared by every branch.

create table public.locations (
  id bigint generated always as identity primary key,
  -- Part of the public address and of printed QR codes: lowercase Latin
  -- letters, digits and hyphens, and never a word the site already uses.
  slug text not null unique,
  name text not null,
  name_ar text,
  name_en text,
  address text,
  address_ar text,
  address_en text,
  phone text,
  waze_url text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint locations_slug_format
    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 40),
  constraint locations_slug_not_reserved
    check (slug not in ('he', 'ar', 'en', 'admin', 'portal', 'auth', 'api')),
  constraint locations_waze_url_format
    check (waze_url is null or waze_url ~* '^https?://')
);

comment on table public.locations is
  'Branches of the restaurant. The slug is the permanent public path of a branch.';

create index locations_sort_order_idx on public.locations (sort_order);

create trigger locations_set_updated_at
before update on public.locations
for each row
execute function private.set_updated_at();

alter table public.locations enable row level security;
alter table public.locations force row level security;

create policy locations_public_read
  on public.locations
  for select
  to anon, authenticated
  using (is_active and (select private.restaurant_is_active()));

create policy locations_admin_all
  on public.locations
  for all
  to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

-- The existing restaurant becomes the first branch, with the contact details
-- that lived on the profile.
insert into public.locations
  (slug, name, name_ar, name_en, address, address_ar, address_en, phone, waze_url, sort_order)
select
  'akko', 'עכו', 'عكا', 'Akko',
  p.address, p.address_ar, p.address_en, p.phone, p.waze_url, 0
from (select 1) as one
left join public.restaurant_profile p on p.id = 1
where not exists (select 1 from public.locations);

-- Opening hours belong to a branch.
alter table public.opening_hours
  add column if not exists location_id bigint
    references public.locations (id) on delete cascade;

update public.opening_hours
set location_id = (select id from public.locations order by sort_order, id limit 1)
where location_id is null;

-- Rows written without a branch (the previous version of the site) go to the first one.
create or replace function private.opening_hours_default_location()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.location_id is null then
    new.location_id := (
      select id from public.locations order by sort_order, id limit 1
    );
  end if;
  return new;
end;
$$;

create trigger opening_hours_default_location
before insert on public.opening_hours
for each row
execute function private.opening_hours_default_location();

alter table public.opening_hours alter column location_id set not null;

create index opening_hours_location_idx
  on public.opening_hours (location_id, day_of_week, sort_order);
