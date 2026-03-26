
-- ========================================================
-- ROBOT DE VINCULACIÓN AUTOMÁTICA v2 (SOPORTE MULTI-BUCKET)
-- ========================================================
-- Este código actualiza tu "Robot" para que vigile AMBOS buckets:
-- 'products' (usado por la app) e 'images' (usado manualmente).

CREATE OR REPLACE FUNCTION public.auto_link_storage_image()
RETURNS TRIGGER AS $$
DECLARE
    v_base_code TEXT;
    v_product_id UUID;
    v_public_url TEXT;
    v_image_exists BOOLEAN;
    -- URL de tu Supabase (verificada)
    v_supabase_url TEXT := 'https://nksmphozttipzpdrxhft.supabase.co';
BEGIN
    -- 1. Solo procesar si se sube a 'products' o 'images'
    IF NEW.bucket_id NOT IN ('products', 'images') THEN
        RETURN NEW;
    END IF;

    -- 2. Extraer el código del nombre del archivo
    -- Ejemplo: 'P12301_Front.jpg' -> 'P12301'
    v_base_code := UPPER(REGEXP_REPLACE(split_part(NEW.name, '/', (SELECT array_length(string_to_array(NEW.name, '/'), 1))), '(_| |\.).*', ''));

    -- 3. Buscar el producto (por código o SKU)
    SELECT id INTO v_product_id 
    FROM public.products 
    WHERE (UPPER(sku) = v_base_code OR UPPER(code) = v_base_code)
    ORDER BY created_at ASC -- Si hay duplicados, preferir el más antiguo
    LIMIT 1;

    -- 4. Si el producto existe, crear la relación
    IF v_product_id IS NOT NULL THEN
        v_public_url := v_supabase_url || '/storage/v1/object/public/' || NEW.bucket_id || '/' || NEW.name;

        SELECT EXISTS (
            SELECT 1 FROM public.product_images 
            WHERE product_id = v_product_id AND url = v_public_url
        ) INTO v_image_exists;

        IF NOT v_image_exists THEN
            -- Insertar en la galería
            INSERT INTO public.product_images (product_id, url, is_primary, alt_text)
            VALUES (
                v_product_id, 
                v_public_url, 
                NOT EXISTS (SELECT 1 FROM public.product_images WHERE product_id = v_product_id), 
                v_base_code
            );
            
            -- ADEMÁS: Actualizar el campo image_url directo del producto si está vacío
            UPDATE public.products 
            SET image_url = v_public_url,
                updated_at = NOW()
            WHERE id = v_product_id AND (image_url IS NULL OR image_url = '');
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
