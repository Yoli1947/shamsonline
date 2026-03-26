-- ================================================================
-- RESTAURAR LOS 3 PRODUCTOS TREW ELIMINADOS POR ERROR
-- Ejecutar en: https://supabase.com/dashboard -> SQL Editor
-- ================================================================

INSERT INTO public.products (
  id, name, slug, description, features,
  brand_id, category_id,
  price, cost_price, sale_price, is_on_sale,
  is_active, is_featured, is_published,
  provider, provider_sku, size_type,
  gender, season, sub_family,
  image_url
)
VALUES
(
  'd61ebc4e-25a2-445b-8a1f-e7992b818f6b',
  'PILOTO TREW MARINO',
  'piloto-trew-marino-alt',
  '- Piloto con capucha, con bolsa interna para el auto-guardado de la prenda.',
  ARRAY['Hombre','Mujer'],
  'ac64bc58-c01c-46b9-b006-0c1b1eb30c73',
  'c23c1bb6-3ffe-4fb0-95f4-21e2018efd8d',
  124500, 26870, NULL, false,
  true, false, true,
  'PERRAMUS', '11201508', '1',
  'Hombre', 'PV22', 'OUTLET',
  NULL
),
(
  'e981c591-74f5-4044-83cc-8c609d65f055',
  'PILOTO TREW GRIS',
  'piloto-trew-gris-alt',
  '- Piloto con capucha, con bolsa interna para el auto-guardado de la prenda.',
  ARRAY['Hombre','Mujer'],
  'ac64bc58-c01c-46b9-b006-0c1b1eb30c73',
  'c23c1bb6-3ffe-4fb0-95f4-21e2018efd8d',
  124500, 26870, NULL, false,
  true, false, true,
  'PERRAMUS', '11201508', '1',
  'Hombre', 'PV22', 'OUTLET',
  NULL
),
(
  'd1486372-809c-482f-9872-268a33f9ecce',
  'PILOTO TREW LIMA',
  'piloto-trew-lima-alt',
  '- Piloto con capucha, con bolsa interna para el auto-guardado de la prenda.',
  ARRAY['Hombre','Mujer'],
  'ac64bc58-c01c-46b9-b006-0c1b1eb30c73',
  'c23c1bb6-3ffe-4fb0-95f4-21e2018efd8d',
  124500, 26870, NULL, false,
  true, false, true,
  'PERRAMUS', '11201508', '1',
  'Hombre', 'PV22', 'OUTLET',
  NULL
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  is_active = true,
  is_published = true;

-- Verificar resultado
SELECT name, code, image_url, is_active 
FROM public.products 
WHERE name ILIKE '%TREW%'
ORDER BY name;
