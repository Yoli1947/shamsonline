-- EJECUTAR ESTO EN SUPABASE SQL EDITOR
-- LIMPIA Y ORGANIZA TODO
BEGIN;

-- 1. Asegurar padres
INSERT INTO public.categories (id, name, slug, is_active)
VALUES ('00000000-0000-0000-0000-000000000001', 'MUJER', 'mujer', true) ON CONFLICT (id) DO UPDATE SET is_active = true;
INSERT INTO public.categories (id, name, slug, is_active)
VALUES ('00000000-0000-0000-0000-000000000002', 'HOMBRE', 'hombre', true) ON CONFLICT (id) DO UPDATE SET is_active = true;

-- 2. Crear las 14 categorías canónicas (si no existen)
DO $$
DECLARE
    mujer_id UUID := '00000000-0000-0000-0000-000000000001';
    hombre_id UUID := '00000000-0000-0000-0000-000000000002';
    cat_name TEXT;
BEGIN
    FOR cat_name IN SELECT UNNEST(ARRAY[
        'ABRIGOS Y PAÑOS', 'ACCESORIOS', 'CALZADO', 'CAMISAS', 'CAMPERAS/CHALECOS',
        'CHOMBAS', 'MALLAS', 'OTROS ARTICULOS', 'PANTALONES', 'PILOTOS',
        'REMERAS', 'SACOS', 'SWEATERS Y BUZOS', 'VESTIDOS'
    ]) LOOP
        IF NOT EXISTS (SELECT 1 FROM public.categories WHERE name = cat_name AND parent_id = mujer_id) THEN
            INSERT INTO public.categories (name, parent_id, slug, is_active)
            VALUES (cat_name, mujer_id, 'm-' || lower(regexp_replace(cat_name, '[^a-zA-Z]+', '-', 'g')), true);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM public.categories WHERE name = cat_name AND parent_id = hombre_id) THEN
            INSERT INTO public.categories (name, parent_id, slug, is_active)
            VALUES (cat_name, hombre_id, 'h-' || lower(regexp_replace(cat_name, '[^a-zA-Z]+', '-', 'g')), true);
        END IF;
    END LOOP;

    -- 3. Mapeo de productos (RE-VINCULACIÓN)
    UPDATE public.products p SET category_id = (
        SELECT sub.id FROM public.categories sub
        WHERE sub.parent_id = (CASE WHEN p.gender ILIKE 'Hombre' THEN hombre_id ELSE mujer_id END)
        AND sub.name = (
            SELECT CASE 
                WHEN old.name ILIKE '%PANTALON%' OR old.name ILIKE '%JEAN%' THEN 'PANTALONES'
                WHEN old.name ILIKE '%REMERA%' THEN 'REMERAS'
                WHEN old.name ILIKE '%CHOMBA%' THEN 'CHOMBAS'
                WHEN old.name ILIKE '%CAMPERA%' OR old.name ILIKE '%CHALECO%' THEN 'CAMPERAS/CHALECOS'
                WHEN old.name ILIKE '%CALZADO%' OR old.name ILIKE '%ZAPAT%' THEN 'CALZADO'
                WHEN old.name ILIKE '%CAMISA%' OR old.name ILIKE '%BLUSA%' THEN 'CAMISAS'
                WHEN old.name ILIKE '%VESTIDO%' THEN 'VESTIDOS'
                WHEN old.name ILIKE '%SWEATER%' OR old.name ILIKE '%BUZO%' THEN 'SWEATERS Y BUZOS'
                WHEN old.name ILIKE '%PILOTO%' THEN 'PILOTOS'
                WHEN old.name ILIKE '%SACO%' THEN 'SACOS'
                WHEN old.name ILIKE '%ABRIGO%' THEN 'ABRIGOS Y PAÑOS'
                WHEN old.name ILIKE '%MALLA%' THEN 'MALLAS'
                ELSE 'OTROS ARTICULOS'
            END FROM public.categories old WHERE old.id = p.category_id
        ) LIMIT 1
    ) WHERE category_id IS NOT NULL;
    
    -- Mapear los que NO tienen categoría también
    UPDATE public.products p SET category_id = (
        SELECT sub.id FROM public.categories sub
        WHERE sub.parent_id = (CASE WHEN p.gender ILIKE 'Hombre' THEN hombre_id ELSE mujer_id END)
        AND sub.name = (
            CASE 
                WHEN p.name ILIKE '%PANTALON%' OR p.name ILIKE '%JEAN%' THEN 'PANTALONES'
                WHEN p.name ILIKE '%REMERA%' THEN 'REMERAS'
                WHEN p.name ILIKE '%CHOMBA%' THEN 'CHOMBAS'
                WHEN p.name ILIKE '%CAMPERA%' OR p.name ILIKE '%CHALECO%' THEN 'CAMPERAS/CHALECOS'
                WHEN p.name ILIKE '%CALZADO%' OR p.name ILIKE '%ZAPAT%' THEN 'CALZADO'
                WHEN p.name ILIKE '%CAMISA%' OR p.name ILIKE '%BLUSA%' THEN 'CAMISAS'
                WHEN p.name ILIKE '%VESTIDO%' THEN 'VESTIDOS'
                WHEN p.name ILIKE '%SWEATER%' OR p.name ILIKE '%BUZO%' THEN 'SWEATERS Y BUZOS'
                WHEN p.name ILIKE '%PILOTO%' THEN 'PILOTOS'
                WHEN p.name ILIKE '%SACO%' THEN 'SACOS'
                WHEN p.name ILIKE '%ABRIGO%' THEN 'ABRIGOS Y PAÑOS'
                WHEN p.name ILIKE '%MALLA%' THEN 'MALLAS'
                ELSE 'OTROS ARTICULOS'
            END
        ) LIMIT 1
    ) WHERE category_id IS NULL;
END $$;

-- 4. Borrar raíces (Opcional, pero recomendado para limpieza)
DELETE FROM public.categories WHERE parent_id IS NULL AND id NOT IN ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002');

COMMIT;
