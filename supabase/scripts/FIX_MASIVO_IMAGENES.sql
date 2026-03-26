
-- 1. Migrar imagen_url de la tabla products a la tabla product_images
-- Solo si el producto no tiene ya imágenes vinculadas
INSERT INTO public.product_images (product_id, url, is_primary, alt_text)
SELECT id, image_url, true, 'Principal'
FROM public.products
WHERE image_url IS NOT NULL 
  AND image_url <> ''
  AND id NOT IN (SELECT DISTINCT product_id FROM public.product_images);

-- 2. Corregir categorías sin padre (HOMBRE / MUJER)
-- Esto asegura que aparezcan en los menús de la tienda
UPDATE public.categories
SET parent_id = '00000000-0000-0000-0000-000000000002' -- ID de HOMBRE (verificado en scripts previos)
WHERE (UPPER(name) LIKE '%HOMBRE%' OR slug LIKE '%hombre%')
  AND parent_id IS NULL 
  AND name <> 'HOMBRE';

UPDATE public.categories
SET parent_id = '00000000-0000-0000-0000-000000000001' -- ID de MUJER
WHERE (UPPER(name) LIKE '%MUJER%' OR slug LIKE '%mujer%')
  AND parent_id IS NULL 
  AND name <> 'MUJER';

-- 3. Asegurar que 'Principal' se considere como stock disponible
-- (Ya lo corregí en el código de Store.tsx, pero esto ayuda a la consistencia)
UPDATE public.product_images
SET alt_text = NULL
WHERE alt_text = 'Principal';
