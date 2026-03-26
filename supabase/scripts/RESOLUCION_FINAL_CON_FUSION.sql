
-- ========================================================
-- RESOLUCIÓN DE CONFLICTOS Y FUSIÓN DE ARTÍCULOS
-- ========================================================

-- 1. TRASPASAR VARIANTES (Colores/Talles) de productos nuevos a los viejos
-- Esto evita perder los "Negros" que se subieron hoy en productos que antes eran solo "Camel"
UPDATE public.product_variants
SET product_id = '72345ef2-cae0-4073-9d23-fd76b2931bdf' -- El ID del producto viejo (anzed)
WHERE product_id = '79041f60-1771-4133-bedc-6ac222489e97'; -- El ID del duplicado creado hoy

-- Repetir para Dipper (si quedara alguno)
UPDATE public.product_variants
SET product_id = '03aa8257-0443-4ebc-8218-ad1d6f5af7e6'
WHERE product_id = '8fa5ced5-844f-4ee1-ad44-87adb496d252';

-- 2. TRASPASAR IMÁGENES
UPDATE public.product_images
SET product_id = '72345ef2-cae0-4073-9d23-fd76b2931bdf'
WHERE product_id = '79041f60-1771-4133-bedc-6ac222489e97';

-- 3. BORRAR LOS DUPLICADOS (Ya no tienen nada vinculado)
DELETE FROM public.products WHERE id = '79041f60-1771-4133-bedc-6ac222489e97';
DELETE FROM public.products WHERE id = '8fa5ced5-844f-4ee1-ad44-87adb496d252';

-- 4. AHORA SÍ: ASIGNAR EL CÓDIGO A LOS PRODUCTOS ORIGINALES
-- Esto ya no dará error porque el código 'P12301203C' quedó libre al borrar el duplicado
UPDATE public.products SET code = 'P12301203C' WHERE id = '72345ef2-cae0-4073-9d23-fd76b2931bdf';
UPDATE public.products SET code = 'P12301668V' WHERE id = '03aa8257-0443-4ebc-8218-ad1d6f5af7e6';

-- 5. CURACIÓN FINAL AUTOMÁTICA
UPDATE public.products 
SET code = sku 
WHERE (code IS NULL OR code = '') 
  AND (sku IS NOT NULL AND sku <> '')
  AND sku NOT IN (SELECT code FROM public.products WHERE code IS NOT NULL);
