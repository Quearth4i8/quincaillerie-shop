-- =====================================================================
--  Quincaillerie en ligne — Arabic version of the shop
--  Run this file AFTER 01_schema.sql (Supabase → SQL Editor → Run).
--  Adds an Arabic name to each rayon (shown when the site is in Arabic,
--  editable in Gestion → Rayons) and fills it for the sample rayons.
-- =====================================================================

alter table public.categories add column if not exists name_ar text;

update public.categories c
   set name_ar = v.name_ar
  from (values
    ('outillage-electrique', 'العدّة الكهربائية'),
    ('outillage-a-main',     'عدّة اليد'),
    ('plomberie-sanitaire',  'البلومبري والسانيتار'),
    ('electricite',          'التريسيتي والضوء'),
    ('peinture',             'الصباغة'),
    ('visserie-fixation',    'البراغي والمسامر'),
    ('jardin',               'الجنينة'),
    ('securite-epi',         'السلامة والحماية')
  ) as v(slug, name_ar)
 where c.slug = v.slug and c.name_ar is null;
