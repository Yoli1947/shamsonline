
-- ========================================================
-- SOLUCIÓN DEFINITIVA: PERMISOS Y ROBOT AUTOMÁTICO
-- ========================================================

-- 1. BAJAR RLS TEMPORALMENTE PARA LIMPIAR (Solo si eres superuser, si no, las políticas bastan)
-- ALTER TABLE public.product_images DISABLE ROW LEVEL SECURITY;

-- 2. PERMISOS CLAVE PARA EL ROBOT
-- Esto permite que cualquier proceso (incluso el anónimo) pueda insertar imágenes
-- IMPORTANTE: Esto es necesario para que el robot funcione desde afuera.
DROP POLICY IF EXISTS "Permitir Insertar Imagenes Publico" ON public.product_images;
CREATE POLICY "Permitir Insertar Imagenes Publico" 
ON public.product_images FOR INSERT 
TO public 
WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir Ver Imagenes Publico" ON public.product_images;
CREATE POLICY "Permitir Ver Imagenes Publico" 
ON public.product_images FOR SELECT 
TO public 
USING (true);

-- 3. EL ROBOT (Ahora con SECURITY DEFINER explícito y permisos)
CREATE OR REPLACE FUNCTION public.auto_link_storage_image()
RETURNS TRIGGER AS $$
DECLARE
    v_base_code TEXT;
    v_product_id UUID;
    v_public_url TEXT;
    v_supabase_url TEXT := 'https://nksmphozttipzpdrxhft.supabase.co';
BEGIN
    -- Solo buckets de fotos
    IF NEW.bucket_id NOT IN ('products', 'images') THEN 
        RETURN NEW; 
    END IF;

    -- Extraer código (P11101028H.jpg -> P11101028H)
    v_base_code := UPPER(REGEXP_REPLACE(split_part(NEW.name, '/', (SELECT array_length(string_to_array(NEW.name, '/'), 1))), '(_| |\.).*', ''));

    -- Buscar producto
    SELECT id INTO v_product_id FROM public.products 
    WHERE (UPPER(sku) = v_base_code OR UPPER(code) = v_base_code)
    ORDER BY (CASE WHEN code IS NOT NULL THEN 0 ELSE 1 END) ASC, created_at ASC LIMIT 1;

    IF v_product_id IS NOT NULL THEN
        v_public_url := v_supabase_url || '/storage/v1/object/public/' || NEW.bucket_id || '/' || NEW.name;
        
        -- Insertar en galería (SECURITY DEFINER permite saltarse el RLS si es necesario)
        INSERT INTO public.product_images (product_id, url, is_primary, alt_text)
        VALUES (
            v_product_id, 
            v_public_url, 
            NOT EXISTS (SELECT 1 FROM public.product_images WHERE product_id = v_product_id), 
            v_base_code
        )
        ON CONFLICT DO NOTHING;
        
        -- Actualizar URL principal
        UPDATE public.products 
        SET image_url = v_public_url 
        WHERE id = v_product_id AND (image_url IS NULL OR image_url = '');
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. RE-ACTIVAR TRIGGER
DROP TRIGGER IF EXISTS tr_auto_link_image ON storage.objects;
CREATE TRIGGER tr_auto_link_image
AFTER INSERT ON storage.objects
FOR EACH ROW
EXECUTE FUNCTION public.auto_link_storage_image();

-- 5. SINCRONIZACIÓN FORZADA DE P11101028H (Para dar respuesta rápida)
UPDATE public.products 
SET image_url = 'https://nksmphozttipzpdrxhft.supabase.co/storage/v1/object/public/images/P11101028H.jpg'
WHERE code = 'P11101028H';

INSERT INTO public.product_images (product_id, url, is_primary, alt_text)
SELECT id, 'https://nksmphozttipzpdrxhft.supabase.co/storage/v1/object/public/images/P11101028H.jpg', true, 'P11101028H'
FROM public.products WHERE code = 'P11101028H'
ON CONFLICT DO NOTHING;
