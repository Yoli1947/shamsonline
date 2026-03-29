-- script para unificar "PERRAMUS ACACIA" en "PERRAMUS"
-- ejecutar en el editor sql de supabase

DO $$ 
DECLARE 
    perramus_id UUID;
    acacia_id UUID;
BEGIN
    -- 1. obtener el id de la marca "PERRAMUS" principal
    SELECT id INTO perramus_id FROM brands WHERE name ILIKE 'PERRAMUS' LIMIT 1;
    
    -- 2. obtener el id de "PERRAMUS ACACIA"
    SELECT id INTO acacia_id FROM brands WHERE name ILIKE '%ACACIA%' AND (name ILIKE '%PERRAMUS%' OR name ILIKE '%ACACIA%') LIMIT 1;

    -- si no encontramos id principal pero si acacia, creamos el principal (opcional, pero mejor prevenir)
    IF perramus_id IS NULL AND acacia_id IS NOT NULL THEN
        INSERT INTO brands (name, slug, is_active) 
        VALUES ('PERRAMUS', 'perramus', true) 
        RETURNING id INTO perramus_id;
    END IF;

    -- 3. si ambos existen y son diferentes
    IF perramus_id IS NOT NULL AND acacia_id IS NOT NULL AND perramus_id <> acacia_id THEN
        RAISE NOTICE 'Unificando marcas: % -> %', acacia_id, perramus_id;

        -- actualizar productos que apuntan a acacia
        UPDATE products 
        SET brand_id = perramus_id 
        WHERE brand_id = acacia_id;

        -- desactivar o eliminar la marca acacia
        UPDATE brands 
        SET is_active = false, 
            name = name || ' (UNIFICADO)'
        WHERE id = acacia_id;
        
        RAISE NOTICE 'Proceso completado con éxito.';
    ELSE
        RAISE NOTICE 'No se encontraron ambas marcas o ya están unificadas.';
    END IF;
END $$;
