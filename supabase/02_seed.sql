-- =====================================================================
--  Starter data — run AFTER 01_schema.sql.
--  Prices, fees and products below are SAMPLES: edit them from the
--  admin pages (/admin/livraison, /gestion/produits) or delete them.
-- =====================================================================

-- Shop settings (edit at /admin/parametres)
update public.settings
   set shop_name = 'Dar Brico',
       tagline   = 'Quincaillerie en ligne',
       phone     = '+216 00 000 000',
       whatsapp  = '21600000000',
       address   = 'Tunis, Tunisie',
       hours     = 'Lun–Sam · 8h–19h'
 where id = 1;

-- The 24 gouvernorats (fees are placeholders — set the real ones)
insert into public.delivery_zones (governorate, fee, delay) values
  ('Tunis', 7, '24h'), ('Ariana', 7, '24h'), ('Ben Arous', 7, '24h'), ('La Manouba', 7, '24h'),
  ('Bizerte', 8, '48h'), ('Nabeul', 8, '48h'), ('Zaghouan', 8, '48h'), ('Béja', 8, '48h'),
  ('Jendouba', 8, '48h'), ('Le Kef', 8, '48h'), ('Siliana', 8, '48h'), ('Sousse', 8, '48h'),
  ('Monastir', 8, '48h'), ('Mahdia', 8, '48h'), ('Kairouan', 8, '48h'), ('Kasserine', 8, '48–72h'),
  ('Sidi Bouzid', 8, '48–72h'), ('Sfax', 8, '48h'), ('Gafsa', 8, '48–72h'), ('Tozeur', 8, '48–72h'),
  ('Kébili', 8, '48–72h'), ('Gabès', 8, '48–72h'), ('Médenine', 8, '48–72h'), ('Tataouine', 8, '48–72h')
on conflict (governorate) do nothing;

-- Categories (icon = name of an icon known by the app, see src/lib/icons.tsx)
insert into public.categories (slug, name, icon, sort_order) values
  ('outillage-electrique', 'Outillage électrique',     'drill',  1),
  ('outillage-a-main',     'Outillage à main',         'wrench', 2),
  ('plomberie-sanitaire',  'Plomberie & sanitaire',    'faucet', 3),
  ('electricite',          'Électricité & éclairage',  'bulb',   4),
  ('peinture',             'Peinture',                 'roller', 5),
  ('visserie-fixation',    'Visserie & fixation',      'screw',  6),
  ('jardin',               'Jardin',                   'leaf',   7),
  ('securite-epi',         'Sécurité & EPI',           'helmet', 8)
on conflict (slug) do nothing;

-- Sample products
insert into public.products (slug, name, reference, description, highlights, specs, category_id, price, old_price, stock, badge, is_featured)
select v.slug, v.name, v.reference, v.description, v.highlights, v.specs::jsonb,
       (select id from public.categories c where c.slug = v.cat),
       v.price, v.old_price, v.stock, v.badge, v.featured
from (values
  ('perceuse-visseuse-sans-fil-20v', 'Perceuse visseuse sans fil 20V + 2 batteries', 'PV-20V',
   'Une perceuse visseuse polyvalente pour la maison et les petits chantiers : montage de meubles, fixation d''étagères, perçage bois et métal.',
   array['2 batteries 20V + chargeur', 'Mandrin auto-serrant 13 mm', 'Livrée en coffret'],
   '[{"label":"Tension","value":"20 V"},{"label":"Mandrin","value":"13 mm"},{"label":"Vitesses","value":"2"}]',
   'outillage-electrique', 189.000, 229.000, 12, 'PROMO', true),
  ('meuleuse-angle-115-900w', 'Meuleuse d''angle 115 mm 900W', 'MA-115',
   'Meuleuse compacte pour la coupe et le meulage du métal et de la pierre.',
   array['Disque 115 mm', 'Poignée latérale', 'Protection réglable'],
   '[{"label":"Puissance","value":"900 W"},{"label":"Disque","value":"115 mm"}]',
   'outillage-electrique', 89.000, null, 8, null, false),
  ('perforateur-sds-800w', 'Perforateur burineur SDS+ 800W', 'PF-SDS',
   'Pour percer le béton et la brique, avec fonction burinage.',
   array['3 modes', 'Mandrin SDS+', 'Coffret de transport'],
   '[{"label":"Puissance","value":"800 W"},{"label":"Emmanchement","value":"SDS+"}]',
   'outillage-electrique', 229.000, 259.000, 5, 'PROMO', true),
  ('escabeau-metal-4-marches', 'Escabeau métal 4 marches antidérapant', 'ESC-4',
   'Escabeau pliant stable avec marches larges antidérapantes.',
   array['4 marches larges', 'Pieds antidérapants', 'Pliable'],
   '[{"label":"Marches","value":"4"},{"label":"Matériau","value":"Acier"}]',
   'outillage-a-main', 145.000, null, 6, null, true),
  ('pistolet-silicone-pro', 'Pistolet à silicone professionnel', 'PS-01',
   'Application précise et régulière du silicone et des mastics.',
   array['Cartouches standard', 'Débit régulier'],
   '[{"label":"Cartouche","value":"310 ml"}]',
   'outillage-a-main', 18.500, null, 40, null, true),
  ('coffret-outillage-108', 'Coffret outillage 108 pièces', 'CO-108',
   'Le coffret complet pour tous les petits travaux de la maison.',
   array['108 pièces', 'Clés, douilles, tournevis'],
   '[{"label":"Pièces","value":"108"}]',
   'outillage-a-main', 119.000, 139.000, 10, 'PROMO', true),
  ('mitigeur-lavabo-chrome', 'Mitigeur lavabo chromé', 'ML-01',
   'Mitigeur monocommande pour lavabo, finition chromée.',
   array['Cartouche céramique', 'Flexibles fournis'],
   '[{"label":"Finition","value":"Chromé"}]',
   'plomberie-sanitaire', 79.000, null, 15, 'NOUVEAU', true),
  ('rouleau-peinture-230', 'Rouleau peinture 230 mm + bac', 'RP-230',
   'Kit rouleau et bac pour murs et plafonds.',
   array['Rouleau 230 mm', 'Bac inclus'],
   '[{"label":"Largeur","value":"230 mm"}]',
   'peinture', 14.900, null, 30, null, true),
  ('vis-bois-4x40-200', 'Vis bois 4×40 mm — boîte de 200', 'VB-440',
   'Vis à bois tête fraisée, empreinte cruciforme.',
   array['Boîte de 200', 'Acier zingué'],
   '[{"label":"Dimensions","value":"4 × 40 mm"},{"label":"Quantité","value":"200"}]',
   'visserie-fixation', 9.500, null, 100, null, true),
  ('gants-protection-renforces', 'Gants de protection renforcés', 'GP-01',
   'Gants de travail résistants pour la manutention et le chantier.',
   array['Paume renforcée', 'Taille unique'],
   '[{"label":"Taille","value":"Unique"}]',
   'securite-epi', 7.800, null, 50, null, true)
) as v(slug, name, reference, description, highlights, specs, cat, price, old_price, stock, badge, featured)
on conflict (slug) do nothing;
