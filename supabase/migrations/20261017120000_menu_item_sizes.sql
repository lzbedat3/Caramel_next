-- A dish may come in three sizes, each with its own price, and still be one
-- card on the menu. Either all three size prices are set or none is; when they
-- are, `price` holds the small one so every place that shows a single price
-- shows the "from" price.

alter table public.menu_items
  add column price_s numeric(10, 2),
  add column price_m numeric(10, 2),
  add column price_l numeric(10, 2),
  add constraint menu_items_sizes_all_or_none check (
    (price_s is null and price_m is null and price_l is null)
    or (price_s is not null and price_m is not null and price_l is not null)
  ),
  add constraint menu_items_sizes_non_negative check (
    coalesce(price_s, 0) >= 0
    and coalesce(price_m, 0) >= 0
    and coalesce(price_l, 0) >= 0
  );

comment on column public.menu_items.price_s is
  'Small size price. Set together with price_m and price_l, or not at all.';
comment on column public.menu_items.price_m is
  'Medium size price.';
comment on column public.menu_items.price_l is
  'Large size price.';
