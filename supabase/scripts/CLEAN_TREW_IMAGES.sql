
-- ========================================================
-- LIMPIEZA DE FOTOS PARA PILOTO TREW VERDE
-- ========================================================

-- 1. Borrar la foto principal del campo image_url
UPDATE public.products 
SET image_url = NULL 
WHERE id = 'b99179d2-0761-42d9-9682-77f99b87ca09';

-- 2. Borrar cualquier foto que haya quedado en la galería de este producto
DELETE FROM public.product_images 
WHERE product_id = 'b99179d2-0761-42d9-9682-77f99b87ca09';
