
-- ========================================================
-- MANTENIMIENTO SUPRA-RÁPIDO Y AUTOMÁTICO
-- ========================================================

-- 1. UNIFICAR DUPLICADOS DE P11201508V
-- Pasamos la foto y descripción del nuevo al viejo (que tiene los talles)
UPDATE public.products 
SET 
  code = 'P11201508V',
  image_url = 'https://nksmphozttipzpdrxhft.supabase.co/storage/v1/object/public/images/P11201508V.jpg',
  description = (SELECT description FROM public.products WHERE id = '92a08742-5ab7-426b-9387-7cd3f3af4f90'),
  is_published = true
WHERE id = 'b99179d2-0761-42d9-9682-77f99b87ca09';

-- Borramos el duplicado que no tiene talles
DELETE FROM public.products WHERE id = '92a08742-5ab7-426b-9387-7cd3f3af4f90';

-- 2. VINCULAR TODAS LAS FOTOS EXISTENTES A LA GALERÍA
-- (Esto hace que aparezcan en el Carrusel/ProductCard)
INSERT INTO public.product_images (product_id, url, is_primary, alt_text)
SELECT id, image_url, true, code
FROM public.products
WHERE image_url IS NOT NULL 
  AND image_url <> ''
  AND id NOT IN (SELECT DISTINCT product_id FROM public.product_images);

-- 3. ACTUALIZAR EL ROBOT PARA QUE SEA MULTI-CARPETA
CREATE OR REPLACE FUNCTION public.auto_link_storage_image()
RETURNS TRIGGER AS $$
DECLARE
    v_base_code TEXT;
    v_product_id UUID;
    v_public_url TEXT;
    v_supabase_url TEXT := 'https://nksmphozttipzpdrxhft.supabase.co';
BEGIN
    IF NEW.bucket_id NOT IN ('products', 'images') THEN
        RETURN NEW;
    END IF;

    v_base_code := UPPER(REGEXP_REPLACE(split_part(NEW.name, '/', (SELECT array_length(string_to_array(NEW.name, '/'), 1))), '(_| |\.).*', ''));

    SELECT id INTO v_product_id 
    FROM public.products 
    WHERE (UPPER(sku) = v_base_code OR UPPER(code) = v_base_code)
    ORDER BY created_at ASC LIMIT 1;

    IF v_product_id IS NOT NULL THEN
        v_public_url := v_supabase_url || '/storage/v1/object/public/' || NEW.bucket_id || '/' || NEW.name;

        INSERT INTO public.product_images (product_id, url, is_primary, alt_text)
        SELECT v_product_id, v_public_url, 
               NOT EXISTS (SELECT 1 FROM public.product_images WHERE product_id = v_product_id), 
               v_base_code
        WHERE NOT EXISTS (
            SELECT 1 FROM public.product_images 
            WHERE product_id = v_product_id AND url = v_public_url
        );
        
        UPDATE public.products 
        SET image_url = v_public_url 
        WHERE id = v_product_id AND (image_url IS NULL OR image_url = '');
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. ASEGURAR QUE LOS PERMISOS NO BLOQUEEN AL ROBOT
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Select" ON public.product_images;
CREATE POLICY "Public Select" ON public.product_images FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "System Insert" ON public.product_images;
CREATE POLICY "System Insert" ON public.product_images FOR INSERT TO public WITH CHECK (true);
