
-- ========================================================
-- LIMPIEZA DE COLORES PARA PILOTIN GAITHER
-- ========================================================

-- Eliminamos las variantes de color 'Negro' y 'AZUL' (dejando solo 'AZUL CI' o lo que figure en planilla)
DELETE FROM public.product_variants
WHERE (product_id IN (SELECT id FROM public.products WHERE name ILIKE '%GAITHER%') 
       OR product_id IN (SELECT id FROM public.products WHERE code = 'P11201513C'))
  AND UPPER(color) IN ('NEGRO', 'AZUL');

-- Verificación: el color 'AZUL CI' permanece intacto.
