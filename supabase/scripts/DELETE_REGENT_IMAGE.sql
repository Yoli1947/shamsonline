
-- Eliminar las imágenes asociadas al producto 'ZAPATILLA REGENTS BEIGE'

-- 1. Eliminar filas de la tabla de imágenes relacionadas
DELETE FROM public.product_images
WHERE product_id IN (
    SELECT id FROM public.products WHERE name ILIKE '%regent%beige%'
);

-- 2. Limpiar los campos de imagen en la tabla principal de productos
UPDATE public.products
SET 
    image_url = NULL,
    image_url_2 = NULL,
    image_url_3 = NULL,
    image_url_4 = NULL
WHERE name ILIKE '%regent%beige%';

-- Verificación (opcional)
SELECT id, name, image_url FROM public.products WHERE name ILIKE '%regent%beige%';
