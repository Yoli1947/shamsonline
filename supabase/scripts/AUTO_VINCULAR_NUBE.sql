
-- ========================================================
-- SCRIPT DE VINCULACIÓN AUTOMÁTICA (NIVEL NUBE)
-- ========================================================
-- Este código crea un "Robot" dentro de tu base de datos que:
-- 1. Vigila cada vez que subes un archivo a Supabase Storage.
-- 2. Si el archivo está en el bucket 'products', lee el nombre.
-- 3. Busca el producto y lo vincula automáticamente.
-- Independiente de si lo subes desde la web, el panel de Supabase o el celular.

CREATE OR REPLACE FUNCTION public.auto_link_storage_image()
RETURNS TRIGGER AS $$
DECLARE
    v_base_code TEXT;
    v_product_id UUID;
    v_public_url TEXT;
    v_image_exists BOOLEAN;
    v_bucket_id TEXT := 'products';
    -- URL de tu Supabase (verificada)
    v_supabase_url TEXT := 'https://nksmphozttipzpdrxhft.supabase.co';
BEGIN
    -- 1. Solo procesar si se sube al bucket de productos
    IF NEW.bucket_id <> v_bucket_id THEN
        RETURN NEW;
    END IF;

    -- 2. Extraer el código del nombre del archivo
    -- Ejemplo: 'P12301_Front.jpg' -> 'P12301'
    -- Extrae todo lo que está antes del primer espacio, guión bajo o punto.
    v_base_code := UPPER(REGEXP_REPLACE(split_part(NEW.name, '/', (SELECT array_length(string_to_array(NEW.name, '/'), 1))), '(_| |\.).*', ''));

    -- 3. Buscar el producto que tenga ese SKU o CODIGO
    SELECT id INTO v_product_id 
    FROM public.products 
    WHERE UPPER(sku) = v_base_code OR UPPER(code) = v_base_code 
    LIMIT 1;

    -- 4. Si el producto existe, crear la relación en la tabla de imágenes
    IF v_product_id IS NOT NULL THEN
        -- Construir la URL pública final
        v_public_url := v_supabase_url || '/storage/v1/object/public/' || v_bucket_id || '/' || NEW.name;

        -- Evitar duplicados si la misma foto se sube dos veces
        SELECT EXISTS (
            SELECT 1 FROM public.product_images 
            WHERE product_id = v_product_id AND url = v_public_url
        ) INTO v_image_exists;

        IF NOT v_image_exists THEN
            -- Si es la primera foto del producto, marcarla como primaria
            INSERT INTO public.product_images (product_id, url, is_primary, alt_text)
            VALUES (
                v_product_id, 
                v_public_url, 
                NOT EXISTS (SELECT 1 FROM public.product_images WHERE product_id = v_product_id), 
                v_base_code
            );
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Activar el disparador (Trigger) en la tabla interna de Supabase Storage
-- Nota: Si da error de permisos, asegúrate de correrlo como administrador en la consola de Supabase
DROP TRIGGER IF EXISTS tr_auto_link_image ON storage.objects;
CREATE TRIGGER tr_auto_link_image
AFTER INSERT ON storage.objects
FOR EACH ROW
EXECUTE FUNCTION public.auto_link_storage_image();
