
-- ========================================================
-- INICIALIZACIÓN DE VARIANTES PARA PILOTIN GAITHER
-- ========================================================

-- 1. Configurar Gaither para usar curva XS-4X (Tipo 1)
UPDATE public.products 
SET size_type = '1' 
WHERE code = 'P11201513C' OR name ILIKE '%GAITHER%';

-- 2. Crear variantes para 'AZUL CI' (según nombre) y 'AZUL' (por si acaso)
-- Esto permite que el Excel encuentre los talles correctos
INSERT INTO public.product_variants (product_id, size, color, stock)
SELECT p.id, talle.nombre, color.nombre, 0
FROM public.products p
CROSS JOIN (SELECT unnest(ARRAY['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL']) as nombre) as talle
CROSS JOIN (SELECT unnest(ARRAY['AZUL CI', 'AZUL']) as nombre) as color
WHERE (p.code = 'P11201513C' OR p.name ILIKE '%GAITHER%')
  AND NOT EXISTS (
      SELECT 1 FROM public.product_variants v 
      WHERE v.product_id = p.id AND v.size = talle.nombre AND v.color = color.nombre
  );
