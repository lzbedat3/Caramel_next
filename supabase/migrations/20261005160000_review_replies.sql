-- The owner's public reply to a review, written in the admin.

alter table public.reviews
  add column if not exists reply text,
  add column if not exists replied_at timestamptz;

alter table public.reviews
  add constraint reviews_reply_length
    check (reply is null or char_length(reply) <= 600);

-- A guest's own insert can never carry a reply.
drop policy if exists reviews_public_insert on public.reviews;

create policy reviews_public_insert
  on public.reviews
  for insert
  to anon, authenticated
  with check (
    is_visible
    and reply is null
    and replied_at is null
    and created_at >= now() - interval '1 minute'
    and created_at <= now() + interval '1 minute'
    and (select private.restaurant_is_active())
  );
