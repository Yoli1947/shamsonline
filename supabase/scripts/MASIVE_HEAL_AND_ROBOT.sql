
-- ========================================================
-- CURACIÓN MASIVA DE DATOS Y ROBOT ANTI-DUPLICADOS
-- ========================================================

-- 1. CURAR DATOS VIEJOS: Copiar SKU al campo Code si está vacío
-- Esto evita que el sistema cree productos nuevos cuando ya existen
UPDATE public.products 
SET code = sku 
WHERE (code IS NULL OR code = '') 
  AND (sku IS NOT NULL AND sku <> '');

-- 2. ROBOT INTELIGENTE v4 (Autocuración)
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

    -- Buscar el producto (mejoramos la búsqueda)
    SELECT id INTO v_product_id FROM public.products 
    WHERE (UPPER(sku) = v_base_code OR UPPER(code) = v_base_code)
    ORDER BY (CASE WHEN code IS NOT NULL THEN 0 ELSE 1 END) ASC, created_at ASC LIMIT 1;

    IF v_product_id IS NOT NULL THEN
        v_public_url := v_supabase_url || '/storage/v1/object/public/' || NEW.bucket_id || '/' || NEW.name;
        
        -- A) VINCULACIÓN A GALERÍA
        INSERT INTO public.product_images (product_id, url, is_primary, alt_text)
        VALUES (v_product_id, v_public_url, NOT EXISTS (SELECT 1 FROM public.product_images WHERE product_id = v_product_id), v_base_code)
        ON CONFLICT DO NOTHING;
        
        -- B) AUTOCURACIÓN: Si el producto no tiene código, se lo ponemos ahora
        UPDATE public.products 
        SET code = v_base_code,
            image_url = v_public_url,
            updated_at = NOW()
        WHERE id = v_product_id AND (code IS NULL OR code = '' OR image_url IS NULL OR image_url = '');
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-activar el disparador
DROP TRIGGER IF EXISTS tr_auto_link_image ON storage.objects;
CREATE TRIGGER tr_auto_link_image
AFTER INSERT ON storage.objects
FOR EACH ROW
EXECUTE FUNCTION public.auto_link_storage_image();
