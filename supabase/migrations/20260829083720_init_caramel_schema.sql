-- Caramel restaurant schema
-- One restaurant, one or more admins. No seed/business data.

create schema if not exists private;

revoke all on schema private from public;
grant usage on schema private to postgres, service_role, authenticated, anon;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

create type public.weekday as enum (
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday'
);

create type public.social_platform as enum (
  'instagram',
  'facebook',
  'tiktok',
  'whatsapp',
  'youtube',
  'x',
  'website',
  'other'
);

create type public.hero_media_type as enum (
  'image',
  'video'
);

-- ---------------------------------------------------------------------------
-- Admin authorization
-- Source of truth lives in private so it is not exposed by the Data API.
-- Bootstrap the first admin from the SQL editor (see README / dashboard steps).
-- ---------------------------------------------------------------------------

create table private.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

comment on table private.admin_users is
  'Authorized restaurant admins. Not exposed via PostgREST.';

alter table private.admin_users enable row level security;

revoke all on table private.admin_users from public, anon, authenticated;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from private.admin_users
    where user_id = (select auth.uid())
  );
$$;

revoke all on function private.is_admin() from public;
grant execute on function private.is_admin() to authenticated, anon, service_role;

create or replace function private.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- restaurant_profile (singleton: exactly one row is allowed)
-- ---------------------------------------------------------------------------

create table public.restaurant_profile (
  id smallint primary key default 1 check (id = 1),
  name text not null,
  subtitle text,
  about text,
  address text,
  waze_url text,
  phone text,
  email text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint restaurant_profile_email_format
    check (email is null or email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  constraint restaurant_profile_waze_url_format
    check (waze_url is null or waze_url ~* '^(https?://|waze://)')
);

comment on table public.restaurant_profile is
  'Single-row restaurant identity and contact content.';

create trigger restaurant_profile_set_updated_at
before update on public.restaurant_profile
for each row
execute function private.set_updated_at();

-- ---------------------------------------------------------------------------
-- opening_hours
-- ---------------------------------------------------------------------------

create table public.opening_hours (
  id bigint generated always as identity primary key,
  day_of_week public.weekday not null,
  opens_at time,
  closes_at time,
  is_closed boolean not null default false,
  note text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint opening_hours_times_when_open check (
    is_closed
    or (opens_at is not null and closes_at is not null)
  )
);

comment on table public.opening_hours is
  'Manually ordered weekly hours. Multiple rows per day are allowed (e.g. lunch and dinner).';

create index opening_hours_sort_order_idx
  on public.opening_hours (sort_order);

create index opening_hours_day_of_week_idx
  on public.opening_hours (day_of_week);

create trigger opening_hours_set_updated_at
before update on public.opening_hours
for each row
execute function private.set_updated_at();

-- ---------------------------------------------------------------------------
-- social_links
-- ---------------------------------------------------------------------------

create table public.social_links (
  id bigint generated always as identity primary key,
  platform public.social_platform not null,
  url text not null,
  is_visible boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint social_links_url_format
    check (url ~* '^https?://')
);

comment on table public.social_links is
  'Manually ordered social/profile links shown on the public site.';

create index social_links_sort_order_idx
  on public.social_links (sort_order);

create index social_links_visible_sort_idx
  on public.social_links (sort_order)
  where is_visible;

create trigger social_links_set_updated_at
before update on public.social_links
for each row
execute function private.set_updated_at();

-- ---------------------------------------------------------------------------
-- hero_media
-- ---------------------------------------------------------------------------

create table public.hero_media (
  id bigint generated always as identity primary key,
  type public.hero_media_type not null,
  storage_path text not null,
  alt_text text,
  poster_storage_path text,
  duration_seconds numeric(8, 2),
  autoplay boolean not null default false,
  loop boolean not null default false,
  muted boolean not null default true,
  is_visible boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint hero_media_duration_non_negative
    check (duration_seconds is null or duration_seconds >= 0),
  constraint hero_media_video_poster_optional
    check (type = 'video' or poster_storage_path is null)
);

comment on table public.hero_media is
  'Manually ordered hero images/videos. storage_path is a key inside the hero bucket.';

create index hero_media_sort_order_idx
  on public.hero_media (sort_order);

create index hero_media_visible_sort_idx
  on public.hero_media (sort_order)
  where is_visible;

create trigger hero_media_set_updated_at
before update on public.hero_media
for each row
execute function private.set_updated_at();

-- ---------------------------------------------------------------------------
-- categories
-- ---------------------------------------------------------------------------

create table public.categories (
  id bigint generated always as identity primary key,
  name text not null,
  subtitle text,
  storage_path text,
  is_visible boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.categories is
  'Menu categories. sort_order is the admin-controlled display order.';

create index categories_sort_order_idx
  on public.categories (sort_order);

create index categories_visible_sort_idx
  on public.categories (sort_order)
  where is_visible;

create trigger categories_set_updated_at
before update on public.categories
for each row
execute function private.set_updated_at();

-- ---------------------------------------------------------------------------
-- menu_items
-- ---------------------------------------------------------------------------

create table public.menu_items (
  id bigint generated always as identity primary key,
  category_id bigint not null references public.categories (id) on delete restrict,
  name text not null,
  short_description text,
  price numeric(10, 2) not null,
  storage_path text,
  is_visible boolean not null default true,
  is_available boolean not null default true,
  sort_order integer not null default 0,
  badge text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint menu_items_price_non_negative check (price >= 0)
);

comment on table public.menu_items is
  'Menu items. sort_order is the admin-controlled order within a category. is_visible hides the item; is_available marks it sold out while still shown.';

create index menu_items_category_id_idx
  on public.menu_items (category_id);

create index menu_items_category_sort_idx
  on public.menu_items (category_id, sort_order);

create index menu_items_visible_category_sort_idx
  on public.menu_items (category_id, sort_order)
  where is_visible;

create trigger menu_items_set_updated_at
before update on public.menu_items
for each row
execute function private.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS
-- Public: read visible/active content only.
-- Anon: no writes.
-- Authenticated admins: full manage via private.is_admin().
-- ---------------------------------------------------------------------------

alter table public.restaurant_profile enable row level security;
alter table public.opening_hours enable row level security;
alter table public.social_links enable row level security;
alter table public.hero_media enable row level security;
alter table public.categories enable row level security;
alter table public.menu_items enable row level security;

alter table public.restaurant_profile force row level security;
alter table public.opening_hours force row level security;
alter table public.social_links force row level security;
alter table public.hero_media force row level security;
alter table public.categories force row level security;
alter table public.menu_items force row level security;

-- restaurant_profile
create policy restaurant_profile_public_read
  on public.restaurant_profile
  for select
  to anon, authenticated
  using (is_active);

create policy restaurant_profile_admin_all
  on public.restaurant_profile
  for all
  to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

-- opening_hours (hours are public operational content)
create policy opening_hours_public_read
  on public.opening_hours
  for select
  to anon, authenticated
  using (true);

create policy opening_hours_admin_all
  on public.opening_hours
  for all
  to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

-- social_links
create policy social_links_public_read
  on public.social_links
  for select
  to anon, authenticated
  using (is_visible);

create policy social_links_admin_all
  on public.social_links
  for all
  to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

-- hero_media
create policy hero_media_public_read
  on public.hero_media
  for select
  to anon, authenticated
  using (is_visible);

create policy hero_media_admin_all
  on public.hero_media
  for all
  to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

-- categories
create policy categories_public_read
  on public.categories
  for select
  to anon, authenticated
  using (is_visible);

create policy categories_admin_all
  on public.categories
  for all
  to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

-- menu_items: public sees visible items (including sold-out)
create policy menu_items_public_read
  on public.menu_items
  for select
  to anon, authenticated
  using (is_visible);

create policy menu_items_admin_all
  on public.menu_items
  for all
  to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));
