
-- ========================================================
-- INICIALIZACIÓN DE VARIANTES PARA PILOTINES MOSLEY
-- ========================================================

-- 1. Asegurar que Mosley Habano tenga tipo de talle 1 (XS-4X)
UPDATE public.products SET size_type = '1' WHERE code = 'P11101028H';

-- 2. Crear las variantes que faltan para Mosley Habano
INSERT INTO public.product_variants (product_id, size, color, stock)
SELECT p.id, talle.nombre, 'HABANO', 0
FROM public.products p
CROSS JOIN (SELECT unnest(ARRAY['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL']) as nombre) as talle
WHERE p.code = 'P11101028H'
  AND NOT EXISTS (
      SELECT 1 FROM public.product_variants v 
      WHERE v.product_id = p.id AND v.size = talle.nombre AND v.color = 'HABANO'
  );

-- 3. Si hay otros colores de Mosley sin variantes, esto los arregla
UPDATE public.products SET size_type = '1' WHERE name ILIKE '%MOSLEY%' AND size_type IS NULL;

INSERT INTO public.product_variants (product_id, size, color, stock)
SELECT p.id, talle.nombre, 
       COALESCE(SUBSTRING(p.name FROM '%#" (.*) (#"%' FOR '#'), 'UNICO'), 
       nombre
FROM public.products p
CROSS JOIN (SELECT unnest(ARRAY['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL']) as nombre) as talle
WHERE p.name ILIKE '%MOSLEY%'
  AND NOT EXISTS (SELECT 1 FROM public.product_variants v WHERE v.product_id = p.id);
