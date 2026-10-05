-- Guest reviews left at the bottom of the public menu: no sign-in, shown at
-- once, and hidden or deleted from the admin when one is out of line.

create table public.reviews (
  id bigint generated always as identity primary key,
  name text not null,
  rating smallint not null,
  message text,
  -- Where the guest is from, as they wrote it.
  city text,
  -- The branch whose menu the review was written on, if any.
  location_id bigint references public.locations (id) on delete set null,
  -- The language of the page it was written on.
  locale text,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  constraint reviews_name_length check (char_length(btrim(name)) between 2 and 60),
  constraint reviews_rating_range check (rating between 1 and 5),
  constraint reviews_message_length check (message is null or char_length(message) <= 600),
  constraint reviews_city_length check (city is null or char_length(city) <= 60),
  constraint reviews_locale_known check (locale is null or locale in ('he', 'ar', 'en'))
);

comment on table public.reviews is
  'Guest reviews from the public menu. Published immediately; moderated in the admin.';

create index reviews_visible_created_idx
  on public.reviews (created_at desc)
  where is_visible;

alter table public.reviews enable row level security;
alter table public.reviews force row level security;

create policy reviews_public_read
  on public.reviews
  for select
  to anon, authenticated
  using (is_visible and (select private.restaurant_is_active()));

-- Anyone may leave a review, but only a visible one dated now: a guest cannot
-- write a hidden row or backdate one.
create policy reviews_public_insert
  on public.reviews
  for insert
  to anon, authenticated
  with check (
    is_visible
    and created_at >= now() - interval '1 minute'
    and created_at <= now() + interval '1 minute'
    and (select private.restaurant_is_active())
  );

create policy reviews_admin_all
  on public.reviews
  for all
  to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));
