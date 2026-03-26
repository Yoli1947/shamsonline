-- ============================================================
-- 🔥 FIX DEFINITIVO V8: TODAS LAS CATEGORÍAS (PURE SQL) 🔥
-- ============================================================

-- 1. Permisos
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for anon" ON public.categories;
CREATE POLICY "Enable all for anon" ON public.categories FOR ALL USING (true) WITH CHECK (true);

-- 2. Asegurar PADRES (Mujer/Hombre)
INSERT INTO public.categories (id, name, slug, is_active)
VALUES 
('00000000-0000-0000-0000-000000000001', 'MUJER', 'mujer', true),
('00000000-0000-0000-0000-000000000002', 'HOMBRE', 'hombre', true)
ON CONFLICT (id) DO UPDATE SET is_active = true;

-- 3. ASEGURAR CATEGORÍAS DESTINO (MUJER)
INSERT INTO public.categories (name, parent_id, slug, is_active)
VALUES 
('ABRIGOS/PAÑO',          '00000000-0000-0000-0000-000000000001', 'm-abrigos-pano',    true),
('CAMPERA/CHALECO',       '00000000-0000-0000-0000-000000000001', 'm-campera-chaleco', true),
('REMERA/CHOMBA',         '00000000-0000-0000-0000-000000000001', 'm-remera-chomba',   true),
('ACCESORIOS',            '00000000-0000-0000-0000-000000000001', 'm-accesorios',      true),
('VESTIDOS/FALDAS/MONOS', '00000000-0000-0000-0000-000000000001', 'm-vestidos-faldas-monos', true),
('CAMISAS/BLUSAS/TOP',    '00000000-0000-0000-0000-000000000001', 'm-camisas-blusas-top', true),
('PANTALONES/SHORTS',     '00000000-0000-0000-0000-000000000001', 'm-pantalones-shorts', true),
('JEANS',                 '00000000-0000-0000-0000-000000000001', 'm-jeans',             true),
('SWEATERS/BUZOS',        '00000000-0000-0000-0000-000000000001', 'm-sweaters-buzos',    true),
('BOTAS DE LLUVIA',       '00000000-0000-0000-0000-000000000001', 'm-botas-lluvia',      true),
('TRAJES/CONJUNTOS',      '00000000-0000-0000-0000-000000000001', 'm-trajes-conjuntos',  true)
ON CONFLICT (slug) DO UPDATE SET is_active = true, name = EXCLUDED.name;

-- 4. ASEGURAR CATEGORÍAS DESTINO (HOMBRE)
INSERT INTO public.categories (name, parent_id, slug, is_active)
VALUES 
('ABRIGOS/PAÑO',    '00000000-0000-0000-0000-000000000002', 'h-abrigos-pano',    true),
('CAMPERA/CHALECO', '00000000-0000-0000-0000-000000000002', 'h-campera-chaleco', true),
('REMERA/CHOMBA',   '00000000-0000-0000-0000-000000000002', 'h-remera-chomba',   true),
('CAMISAS',         '00000000-0000-0000-0000-000000000002', 'h-camisas',         true),
('ACCESORIOS',      '00000000-0000-0000-0000-000000000002', 'h-accesorios',      true),
('PANTALONES/BERMUDAS', '00000000-0000-0000-0000-000000000002', 'h-pantalones-bermudas', true),
('JEANS',           '00000000-0000-0000-0000-000000000002', 'h-jeans',             true),
('SWEATERS/BUZOS',  '00000000-0000-0000-0000-000000000002', 'h-sweaters-buzos',    true),
('SHORTS DE BAÑO',  '00000000-0000-0000-0000-000000000002', 'h-shorts-bano',       true),
('TRAJES/CONJUNTOS','00000000-0000-0000-0000-000000000002', 'h-trajes-conjuntos',  true)
ON CONFLICT (slug) DO UPDATE SET is_active = true, name = EXCLUDED.name;


-- 5. REASIGNACIÓN MASIVA DE PRODUCTOS (Basado en Nombre)
--    Esto asegura que los productos vayan a la categoría correcta independientemente de dónde estén ahora.

-- >>> MUJER <<<
UPDATE public.products SET category_id = (SELECT id FROM public.categories WHERE slug = 'm-abrigos-pano')
WHERE category_id IN (SELECT id FROM public.categories WHERE parent_id = '00000000-0000-0000-0000-000000000001')
AND (name ILIKE '%ABRIGO%' OR name ILIKE '%PAÑO%');

UPDATE public.products SET category_id = (SELECT id FROM public.categories WHERE slug = 'm-campera-chaleco')
WHERE category_id IN (SELECT id FROM public.categories WHERE parent_id = '00000000-0000-0000-0000-000000000001')
AND (name ILIKE '%CAMPERA%' OR name ILIKE '%CHALECO%' OR name ILIKE '%PILOTO%');

UPDATE public.products SET category_id = (SELECT id FROM public.categories WHERE slug = 'm-remera-chomba')
WHERE category_id IN (SELECT id FROM public.categories WHERE parent_id = '00000000-0000-0000-0000-000000000001')
AND (name ILIKE '%REMERA%' OR name ILIKE '%CHOMBA%' OR name ILIKE '%MUSCULOSA%');

UPDATE public.products SET category_id = (SELECT id FROM public.categories WHERE slug = 'm-camisas-blusas-top')
WHERE category_id IN (SELECT id FROM public.categories WHERE parent_id = '00000000-0000-0000-0000-000000000001')
AND (name ILIKE '%CAMISA%' OR name ILIKE '%BLUSA%' OR name ILIKE '%TOP %' OR name ILIKE '%TOP');

UPDATE public.products SET category_id = (SELECT id FROM public.categories WHERE slug = 'm-vestidos-faldas-monos')
WHERE category_id IN (SELECT id FROM public.categories WHERE parent_id = '00000000-0000-0000-0000-000000000001')
AND (name ILIKE '%VESTIDO%' OR name ILIKE '%FALDA%' OR name ILIKE '%MONO%');

UPDATE public.products SET category_id = (SELECT id FROM public.categories WHERE slug = 'm-jeans')
WHERE category_id IN (SELECT id FROM public.categories WHERE parent_id = '00000000-0000-0000-0000-000000000001')
AND (name ILIKE '%JEAN%');

UPDATE public.products SET category_id = (SELECT id FROM public.categories WHERE slug = 'm-sweaters-buzos')
WHERE category_id IN (SELECT id FROM public.categories WHERE parent_id = '00000000-0000-0000-0000-000000000001')
AND (name ILIKE '%SWEATER%' OR name ILIKE '%BUZO%' OR name ILIKE '%TEJIDO%' OR name ILIKE '%CARDIGAN%');

UPDATE public.products SET category_id = (SELECT id FROM public.categories WHERE slug = 'm-pantalones-shorts')
WHERE category_id IN (SELECT id FROM public.categories WHERE parent_id = '00000000-0000-0000-0000-000000000001')
AND (name ILIKE '%PANTALON%' OR name ILIKE '%SHORT%') AND name NOT ILIKE '%JEAN%';

UPDATE public.products SET category_id = (SELECT id FROM public.categories WHERE slug = 'm-botas-lluvia')
WHERE category_id IN (SELECT id FROM public.categories WHERE parent_id = '00000000-0000-0000-0000-000000000001')
AND (name ILIKE '%BOTA%' OR name ILIKE '%LLUVIA%' OR name ILIKE '%GAITHER%');

UPDATE public.products SET category_id = (SELECT id FROM public.categories WHERE slug = 'm-trajes-conjuntos')
WHERE category_id IN (SELECT id FROM public.categories WHERE parent_id = '00000000-0000-0000-0000-000000000001')
AND (name ILIKE '%TRAJE%' OR name ILIKE '%CONJUNTO%' OR name ILIKE '%SACO%');


-- >>> HOMBRE <<<
UPDATE public.products SET category_id = (SELECT id FROM public.categories WHERE slug = 'h-abrigos-pano')
WHERE category_id IN (SELECT id FROM public.categories WHERE parent_id = '00000000-0000-0000-0000-000000000002')
AND (name ILIKE '%ABRIGO%' OR name ILIKE '%PAÑO%');

UPDATE public.products SET category_id = (SELECT id FROM public.categories WHERE slug = 'h-campera-chaleco')
WHERE category_id IN (SELECT id FROM public.categories WHERE parent_id = '00000000-0000-0000-0000-000000000002')
AND (name ILIKE '%CAMPERA%' OR name ILIKE '%CHALECO%' OR name ILIKE '%PILOTO%');

UPDATE public.products SET category_id = (SELECT id FROM public.categories WHERE slug = 'h-remera-chomba')
WHERE category_id IN (SELECT id FROM public.categories WHERE parent_id = '00000000-0000-0000-0000-000000000002')
AND (name ILIKE '%REMERA%' OR name ILIKE '%CHOMBA%' OR name ILIKE '%POLO%');

UPDATE public.products SET category_id = (SELECT id FROM public.categories WHERE slug = 'h-camisas')
WHERE category_id IN (SELECT id FROM public.categories WHERE parent_id = '00000000-0000-0000-0000-000000000002')
AND (name ILIKE '%CAMISA%');

UPDATE public.products SET category_id = (SELECT id FROM public.categories WHERE slug = 'h-jeans')
WHERE category_id IN (SELECT id FROM public.categories WHERE parent_id = '00000000-0000-0000-0000-000000000002')
AND (name ILIKE '%JEAN%');

UPDATE public.products SET category_id = (SELECT id FROM public.categories WHERE slug = 'h-sweaters-buzos')
WHERE category_id IN (SELECT id FROM public.categories WHERE parent_id = '00000000-0000-0000-0000-000000000002')
AND (name ILIKE '%SWEATER%' OR name ILIKE '%BUZO%' OR name ILIKE '%TEJIDO%');

UPDATE public.products SET category_id = (SELECT id FROM public.categories WHERE slug = 'h-pantalones-bermudas')
WHERE category_id IN (SELECT id FROM public.categories WHERE parent_id = '00000000-0000-0000-0000-000000000002')
AND (name ILIKE '%PANTALON%' OR name ILIKE '%BERMUDA%') AND name NOT ILIKE '%JEAN%';

UPDATE public.products SET category_id = (SELECT id FROM public.categories WHERE slug = 'h-shorts-bano')
WHERE category_id IN (SELECT id FROM public.categories WHERE parent_id = '00000000-0000-0000-0000-000000000002')
AND (name ILIKE '%SHORT%' OR name ILIKE '%MALLA%' OR name ILIKE '%BAÑO%');

UPDATE public.products SET category_id = (SELECT id FROM public.categories WHERE slug = 'h-trajes-conjuntos')
WHERE category_id IN (SELECT id FROM public.categories WHERE parent_id = '00000000-0000-0000-0000-000000000002')
AND (name ILIKE '%TRAJE%' OR name ILIKE '%CONJUNTO%' OR name ILIKE '%SACO%' OR name ILIKE '%AMBO%');


-- 6. LIMPIEZA FINAL (Opcional, para borrar categorías vacías y viejas)
DELETE FROM public.categories 
WHERE id NOT IN (SELECT DISTINCT category_id FROM public.products WHERE category_id IS NOT NULL)
AND parent_id IN ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002')
AND slug NOT IN (
    'm-abrigos-pano','m-campera-chaleco','m-remera-chomba','m-accesorios','m-vestidos-faldas-monos','m-camisas-blusas-top','m-pantalones-shorts','m-jeans','m-sweaters-buzos','m-botas-lluvia','m-trajes-conjuntos',
    'h-abrigos-pano','h-campera-chaleco','h-remera-chomba','h-camisas','h-accesorios','h-pantalones-bermudas','h-jeans','h-sweaters-buzos','h-shorts-bano','h-trajes-conjuntos'
);
