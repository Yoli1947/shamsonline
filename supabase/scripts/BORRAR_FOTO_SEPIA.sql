-- 🔥 BORRAR FOTO Y DESCRIPCIÓN: CAMISA SEPIA BLANCA 2X1 🔥
-- Ejecuta este script en el SQL Editor de Supabase (https://app.supabase.com/)

DO $$
DECLARE
    v_product_id UUID;
BEGIN
    -- 1. Buscar el ID del producto por su nombre o código
    SELECT id INTO v_product_id 
    FROM products 
    WHERE name ILIKE '%camisa sepia blanca%' 
       OR code = 'AR0218XBL' 
    LIMIT 1;

    IF v_product_id IS NOT NULL THEN
        -- 2. Limpiar la foto principal y la descripción en la tabla products
        UPDATE products 
        SET image_url = NULL, 
            description = '',
            observations = ''
        WHERE id = v_product_id;
        
        -- 3. Borrar imágenes secundarias vinculadas en product_images
        DELETE FROM product_images WHERE product_id = v_product_id;
        
        RAISE NOTICE '✅ Datos borrados exitosamente para el producto ID: %', v_product_id;
    ELSE
        RAISE NOTICE '❌ No se encontró ningún producto que coincida con "camisa sepia blanca"';
    END IF;
END $$;
