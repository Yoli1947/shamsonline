
-- ========================================================
-- SOLUCIÓN ERROR DE DUPLICADO Y VINCULACIÓN FINAL
-- ========================================================

-- 1. ELIMINAR EL DUPLICADO QUE BLOQUEA EL CÓDIGO
-- Este es el producto que tiene la foto pero NO tiene los talles.
-- Al borrarlo, liberamos el código 'P11201508V' para usarlo en el correcto.
DELETE FROM public.products WHERE id = '92a08742-5ab7-426b-9387-7cd3f3af4f90';

-- 2. ACTUALIZAR EL PRODUCTO REAL (El que tiene todos los talles y stock)
UPDATE public.products 
SET 
  code = 'P11201508V',
  image_url = 'https://nksmphozttipzpdrxhft.supabase.co/storage/v1/object/public/images/P11201508V.jpg',
  description = 'Descubre el Piloto Trew Verde de PERRAMUS, un elegante y versátil pantalón que combina estilo y confort, ideal para cualquier ocasión. Confeccionado con materiales de alta calidad, ofrece un ajuste perfecto y una durabilidad excepcional. Su diseño moderno y color verde vibrante lo convierten en una pieza destacada de nuestra colección PV22.',
  is_published = true
WHERE id = 'b99179d2-0761-42d9-9682-77f99b87ca09';

-- 3. VINCULACIÓN AUTOMÁTICA DE TODOS LOS PRODUCTOS
-- Esto busca cualquier producto con foto y lo mete en la galería para que se vea en el carrusel.
INSERT INTO public.product_images (product_id, url, is_primary, alt_text)
SELECT id, image_url, true, code
FROM public.products
WHERE image_url IS NOT NULL 
  AND image_url <> ''
  AND id NOT IN (SELECT DISTINCT product_id FROM public.product_images);

-- 4. ACTUALIZAR EL ROBOT PARA QUE NO VUELVA A PASAR
CREATE OR REPLACE FUNCTION public.auto_link_storage_image()
RETURNS TRIGGER AS $$
DECLARE
    v_base_code TEXT;
    v_product_id UUID;
    v_public_url TEXT;
    v_supabase_url TEXT := 'https://nksmphozttipzpdrxhft.supabase.co';
BEGIN
    IF NEW.bucket_id NOT IN ('products', 'images') THEN RETURN NEW; END IF;
    
    v_base_code := UPPER(REGEXP_REPLACE(split_part(NEW.name, '/', (SELECT array_length(string_to_array(NEW.name, '/'), 1))), '(_| |\.).*', ''));

    -- Buscamos el producto priorizando el que ya tiene datos
    SELECT id INTO v_product_id FROM public.products 
    WHERE (UPPER(sku) = v_base_code OR UPPER(code) = v_base_code)
    ORDER BY (CASE WHEN code IS NOT NULL THEN 0 ELSE 1 END) ASC, created_at ASC LIMIT 1;

    IF v_product_id IS NOT NULL THEN
        v_public_url := v_supabase_url || '/storage/v1/object/public/' || NEW.bucket_id || '/' || NEW.name;
        
        INSERT INTO public.product_images (product_id, url, is_primary, alt_text)
        SELECT v_product_id, v_public_url, NOT EXISTS (SELECT 1 FROM public.product_images WHERE product_id = v_product_id), v_base_code
        WHERE NOT EXISTS (SELECT 1 FROM public.product_images WHERE product_id = v_product_id AND url = v_public_url);
        
        UPDATE public.products SET image_url = v_public_url WHERE id = v_product_id AND (image_url IS NULL OR image_url = '');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
