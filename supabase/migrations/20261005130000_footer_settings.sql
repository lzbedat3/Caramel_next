-- The credit and dedication at the bottom of the public menu, editable in the
-- admin settings instead of living in the code. Empty fields hide their line.

alter table public.site_settings
  add column if not exists credit_name text,
  add column if not exists credit_url text,
  add column if not exists dedication_by text,
  add column if not exists dedication_by_ar text,
  add column if not exists dedication_by_en text,
  add column if not exists dedication_to text,
  add column if not exists dedication_to_ar text,
  add column if not exists dedication_to_en text;

-- Carry over the text that was in the code, so nothing disappears from the site.
insert into public.site_settings (id) values (1) on conflict (id) do nothing;

update public.site_settings
set
  credit_name = coalesce(credit_name, 'Darb Rest'),
  credit_url = coalesce(credit_url, 'https://darb.co.il'),
  dedication_by = coalesce(dedication_by, 'למא & נור'),
  dedication_by_ar = coalesce(dedication_by_ar, 'لمى ونور'),
  dedication_by_en = coalesce(dedication_by_en, 'Lama & Nour'),
  dedication_to = coalesce(dedication_to, 'למחמוד, שמקבל כל אורח באהבה ומגיש כל מנה בתשוקה - תודה על כל מה שאתה עושה.'),
  dedication_to_ar = coalesce(dedication_to_ar, 'إلى محمود، الذي يستقبل كل ضيف بمحبة ويقدّم كل طبق بشغف - شكرًا على كل ما تفعله.'),
  dedication_to_en = coalesce(dedication_to_en, 'To Mahmoud, who welcomes every guest with love and serves every dish with passion - thank you for everything you do.')
where id = 1;
