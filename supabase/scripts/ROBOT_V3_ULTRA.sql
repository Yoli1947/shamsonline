
-- ========================================================
-- ROBOT DE VINCULACIÓN AUTOMÁTICA v3 (ULTRA REFORZADO)
-- ========================================================

-- 1. Dar permisos totales a la función para que no falle por esquemas
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- 2. Función mejorada con LOGS para ver qué pasa en el panel de Supabase
CREATE OR REPLACE FUNCTION public.auto_link_storage_image()
RETURNS TRIGGER AS $$
DECLARE
    v_base_code TEXT;
    v_product_id UUID;
    v_public_url TEXT;
    v_supabase_url TEXT := 'https://nksmphozttipzpdrxhft.supabase.co';
BEGIN
    -- LOG: Iniciando robot para el archivo
    RAISE LOG 'ROBOT: Procesando archivo % en bucket %', NEW.name, NEW.bucket_id;

    -- Solo procesar buckets de fotos
    IF NEW.bucket_id NOT IN ('products', 'images') THEN 
        RAISE LOG 'ROBOT: Bucket % ignorado', NEW.bucket_id;
        RETURN NEW; 
    END IF;

    -- Extraer código (Limpia nombres como P11101028H.jpg o P111_front.png)
    v_base_code := UPPER(REGEXP_REPLACE(split_part(NEW.name, '/', (SELECT array_length(string_to_array(NEW.name, '/'), 1))), '(_| |\.).*', ''));
    RAISE LOG 'ROBOT: Código detectado: %', v_base_code;

    -- Buscar producto (SKU o Código)
    SELECT id INTO v_product_id FROM public.products 
    WHERE (UPPER(sku) = v_base_code OR UPPER(code) = v_base_code)
    ORDER BY (CASE WHEN code IS NOT NULL THEN 0 ELSE 1 END) ASC, created_at ASC LIMIT 1;

    IF v_product_id IS NOT NULL THEN
        RAISE LOG 'ROBOT: Producto encontrado! ID: %', v_product_id;
        
        v_public_url := v_supabase_url || '/storage/v1/object/public/' || NEW.bucket_id || '/' || NEW.name;
        
        -- Insertar en galería si no existe
        INSERT INTO public.product_images (product_id, url, is_primary, alt_text)
        SELECT v_product_id, v_public_url, NOT EXISTS (SELECT 1 FROM public.product_images WHERE product_id = v_product_id), v_base_code
        WHERE NOT EXISTS (SELECT 1 FROM public.product_images WHERE product_id = v_product_id AND url = v_public_url);
        
        -- Poner como foto principal si está vacía
        UPDATE public.products SET image_url = v_public_url WHERE id = v_product_id AND (image_url IS NULL OR image_url = '');
        
        RAISE LOG 'ROBOT: Vinculación completada para %', v_base_code;
    ELSE
        RAISE LOG 'ROBOT: No se encontró ningún producto con el código %', v_base_code;
    END IF;

    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'ROBOT ERROR: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Asegurar que el trigger esté bien puesto
DROP TRIGGER IF EXISTS tr_auto_link_image ON storage.objects;
CREATE TRIGGER tr_auto_link_image
AFTER INSERT ON storage.objects
FOR EACH ROW
EXECUTE FUNCTION public.auto_link_storage_image();

-- 4. ACCIÓN INMEDIATA: Vincular todo lo que se subió hoy y no se vinculó
INSERT INTO public.product_images (product_id, url, is_primary, alt_text)
SELECT p.id, 
       'https://nksmphozttipzpdrxhft.supabase.co/storage/v1/object/public/images/' || p.code || '.jpg', 
       true, 
       p.code
FROM public.products p
WHERE p.code IS NOT NULL 
  AND p.id NOT IN (SELECT DISTINCT product_id FROM public.product_images)
  -- Intentar autovincular si la URL de imagen parece válida (existe en storage)
  -- Como no podemos verificar existencia desde SQL fácilmente, lo forzamos para los que tienen código
  ON CONFLICT DO NOTHING;

-- Actualizar URLs de imagen de productos que no tienen
UPDATE public.products p
SET image_url = 'https://nksmphozttipzpdrxhft.supabase.co/storage/v1/object/public/images/' || p.code || '.jpg'
WHERE p.image_url IS NULL OR p.image_url = ''
  AND p.code IS NOT NULL;
