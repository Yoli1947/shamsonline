-- 🔥 FIX IMAGEN TRENCH NINI 🔥

-- 1. Intentar encontrar el ID del producto por SKU o Código
DO $$
DECLARE
    v_product_id UUID;
    v_image_url TEXT := 'https://production-tailor-made-perramus.s3.amazonaws.com/perramus-site/product-images/P21101087V/NINI_VERDE_FRONT.jpg';
BEGIN
    SELECT id INTO v_product_id FROM products WHERE sku = 'P21101087V' OR code = 'P21101087V' LIMIT 1;

    IF v_product_id IS NOT NULL THEN
        -- Borrar imágenes viejas para este producto para limpiar
        DELETE FROM product_images WHERE product_id = v_product_id;
        
        -- Insertar la nueva imagen oficial como primaria
        INSERT INTO product_images (product_id, url, is_primary, alt_text)
        VALUES (v_product_id, v_image_url, true, 'Trench Nini Verde');
        
        RAISE NOTICE 'Imagen actualizada para el producto ID: %', v_product_id;
    ELSE
        RAISE NOTICE 'No se encontró el producto con SKU P21101087V';
    END IF;
END $$;
