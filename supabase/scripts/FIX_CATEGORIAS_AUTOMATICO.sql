-- ============================================================
-- 🔥 FIX CATEGORÍAS AUTOMÁTICO - VERSIÓN CORREGIDA 🔥
-- Ejecuta este script en el SQL Editor de Supabase
-- Versión corregida para evitar errores de restricción (ON CONFLICT)
-- ============================================================

BEGIN;

-- 1. ASEGURAR CATEGORÍAS PADRE (MUJER/HOMBRE)
-- Usamos una subconsulta para verificar existencia antes de insertar si no hay constraint
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.categories WHERE id = '00000000-0000-0000-0000-000000000001') THEN
        INSERT INTO public.categories (id, name, slug, is_active)
        VALUES ('00000000-0000-0000-0000-000000000001', 'MUJER', 'mujer', true);
    ELSE
        UPDATE public.categories SET name = 'MUJER', is_active = true WHERE id = '00000000-0000-0000-0000-000000000001';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.categories WHERE id = '00000000-0000-0000-0000-000000000002') THEN
        INSERT INTO public.categories (id, name, slug, is_active)
        VALUES ('00000000-0000-0000-0000-000000000002', 'HOMBRE', 'hombre', true);
    ELSE
        UPDATE public.categories SET name = 'HOMBRE', is_active = true WHERE id = '00000000-0000-0000-0000-000000000002';
    END IF;
END $$;

-- 2. NORMALIZACIÓN Y REASIGNACIÓN
DO $$
DECLARE
    mujer_id UUID := '00000000-0000-0000-0000-000000000001';
    hombre_id UUID := '00000000-0000-0000-0000-000000000002';
    cat_name TEXT;
    target_id UUID;
    v_slug TEXT;
BEGIN
    -- A. CREAR LAS 14 CATEGORÍAS CANÓNICAS PARA AMBOS GENEROS
    FOR cat_name IN SELECT UNNEST(ARRAY[
        'ABRIGOS Y PAÑOS', 'ACCESORIOS', 'CALZADO', 'CAMISAS', 'CAMPERAS/CHALECOS',
        'CHOMBAS', 'MALLAS', 'OTROS ARTICULOS', 'PANTALONES', 'PILOTOS',
        'REMERAS', 'SACOS', 'SWEATERS Y BUZOS', 'VESTIDOS'
    ]) LOOP
        -- Mujer
        v_slug := 'mujer-' || lower(regexp_replace(cat_name, '[^a-zA-Z0-9]+', '-', 'g'));
        IF NOT EXISTS (SELECT 1 FROM public.categories WHERE name = cat_name AND parent_id = mujer_id) THEN
            INSERT INTO public.categories (name, parent_id, slug, is_active)
            VALUES (cat_name, mujer_id, v_slug, true);
        ELSE
            UPDATE public.categories SET is_active = true WHERE name = cat_name AND parent_id = mujer_id;
        END IF;
        
        -- Hombre
        v_slug := 'hombre-' || lower(regexp_replace(cat_name, '[^a-zA-Z0-9]+', '-', 'g'));
        IF NOT EXISTS (SELECT 1 FROM public.categories WHERE name = cat_name AND parent_id = hombre_id) THEN
            INSERT INTO public.categories (name, parent_id, slug, is_active)
            VALUES (cat_name, hombre_id, v_slug, true);
        ELSE
            UPDATE public.categories SET is_active = true WHERE name = cat_name AND parent_id = hombre_id;
        END IF;
    END LOOP;

    -- B. MAPEO DE PRODUCTOS A LAS NUEVAS CATEGORÍAS
    UPDATE public.products p
    SET category_id = (
        SELECT sub.id 
        FROM public.categories sub
        WHERE sub.parent_id = (CASE WHEN p.gender ILIKE 'Hombre' THEN hombre_id ELSE mujer_id END)
        AND sub.name = (
            SELECT 
                CASE 
                    WHEN old.name ILIKE '%PANTALON%' OR old.name ILIKE '%JEAN%' OR old.name ILIKE '%BERMUDA%' OR old.name ILIKE '%SHORT%' THEN 'PANTALONES'
                    WHEN old.name ILIKE '%REMERA%' THEN 'REMERAS'
                    WHEN old.name ILIKE '%CHOMBA%' THEN 'CHOMBAS'
                    WHEN old.name ILIKE '%CAMPERA%' OR old.name ILIKE '%CHALECO%' THEN 'CAMPERAS/CHALECOS'
                    WHEN old.name ILIKE '%CALZADO%' OR old.name ILIKE '%BOTA%' OR old.name ILIKE '%ZAPATILLA%' THEN 'CALZADO'
                    WHEN old.name ILIKE '%CAMISA%' OR old.name ILIKE '%BLUSA%' THEN 'CAMISAS'
                    WHEN old.name ILIKE '%VESTIDO%' OR old.name ILIKE '%FALDA%' OR old.name ILIKE '%MONO%' THEN 'VESTIDOS'
                    WHEN old.name ILIKE '%SWEATER%' OR old.name ILIKE '%BUZO%' OR old.name ILIKE '%TEJIDO%' THEN 'SWEATERS Y BUZOS'
                    WHEN old.name ILIKE '%PILOTO%' OR old.name ILIKE '%IMPERMEABLE%' THEN 'PILOTOS'
                    WHEN old.name ILIKE '%SACO%' OR old.name ILIKE '%BLAZER%' THEN 'SACOS'
                    WHEN old.name ILIKE '%ABRIGO%' OR old.name ILIKE '%PAÑO%' THEN 'ABRIGOS Y PAÑOS'
                    WHEN old.name ILIKE '%ACCESORIO%' OR old.name ILIKE '%CARTERA%' OR old.name ILIKE '%BOLSO%' THEN 'ACCESORIOS'
                    WHEN old.name ILIKE '%MALLA%' OR old.name ILIKE '%SHORTS DE BAÑO%' THEN 'MALLAS'
                    ELSE 'OTROS ARTICULOS'
                END
            FROM public.categories old 
            WHERE old.id = p.category_id
        )
        LIMIT 1
    )
    WHERE category_id IS NOT NULL;

    -- C. ASIGNAR "OTROS ARTICULOS" A PRODUCTOS SIN CATEGORÍA
    UPDATE public.products p
    SET category_id = (
        SELECT id FROM public.categories 
        WHERE name = 'OTROS ARTICULOS' 
        AND parent_id = (CASE WHEN p.gender ILIKE 'Hombre' THEN hombre_id ELSE mujer_id END)
        LIMIT 1
    )
    WHERE category_id IS NULL;

END $$;

-- 3. LIMPIEZA TOTAL: Borrar categorías obsoletas
DELETE FROM public.categories
WHERE id NOT IN (
    '00000000-0000-0000-0000-000000000001', -- Padre Mujer
    '00000000-0000-0000-0000-000000000002'  -- Padre Hombre
)
AND (parent_id NOT IN ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002') OR parent_id IS NULL);

-- Opcional: Borrar categorías no canónicas
DELETE FROM public.categories
WHERE name NOT IN (
    'ABRIGOS Y PAÑOS', 'ACCESORIOS', 'CALZADO', 'CAMISAS', 'CAMPERAS/CHALECOS',
    'CHOMBAS', 'MALLAS', 'OTROS ARTICULOS', 'PANTALONES', 'PILOTOS',
    'REMERAS', 'SACOS', 'SWEATERS Y BUZOS', 'VESTIDOS', 'MUJER', 'HOMBRE'
);

COMMIT;

-- VERIFICACIÓN FINAL
SELECT 
    p.name as genero, 
    c.name as categoria, 
    count(pr.id) as total_productos
FROM public.categories c
JOIN public.categories p ON c.parent_id = p.id
LEFT JOIN public.products pr ON pr.category_id = c.id
GROUP BY p.name, c.name
ORDER BY p.name, total_productos DESC;
