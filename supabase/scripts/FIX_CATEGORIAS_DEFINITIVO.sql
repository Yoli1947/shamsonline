-- ============================================================
-- 🔥 FIX DEFINITIVO DE CATEGORÍAS (Usando OUTLET 17-02-2026) 🔥
-- Ejecuta esto en Supabase SQL Editor.
-- ============================================================

BEGIN;

-- 1. Asegurar PADRES (Mujer/Hombre)
INSERT INTO public.categories (id, name, slug, is_active)
VALUES ('00000000-0000-0000-0000-000000000001', 'MUJER', 'mujer', true)
ON CONFLICT (id) DO UPDATE SET is_active = true;

INSERT INTO public.categories (id, name, slug, is_active)
VALUES ('00000000-0000-0000-0000-000000000002', 'HOMBRE', 'hombre', true)
ON CONFLICT (id) DO UPDATE SET is_active = true;

-- 2. INSERTAR LAS 14 CATEGORÍAS CORRECTAS
DO $$
DECLARE
    mujer_id UUID := '00000000-0000-0000-0000-000000000001';
    hombre_id UUID := '00000000-0000-0000-0000-000000000002';
    cat_name TEXT;
BEGIN
    FOR cat_name IN SELECT UNNEST(ARRAY[
        'PANTALONES',
        'ACCESORIOS',
        'ABRIGOS Y PAÑOS',
        'VESTIDOS',
        'REMERAS',
        'MALLAS',
        'CALZADO',
        'SWEATERS Y BUZOS',
        'PILOTOS',
        'CAMISAS',
        'CHOMBAS',
        'CAMPERAS Y CHALECOS', 
        'SACOS',
        'OTROS ARTICULOS'
    ]) LOOP
        
        -- Crear para MUJER si no existe
        IF NOT EXISTS (SELECT 1 FROM public.categories WHERE name = cat_name AND parent_id = mujer_id) THEN
            INSERT INTO public.categories (name, parent_id, slug, is_active)
            VALUES (cat_name, mujer_id, 'm-' || lower(regexp_replace(cat_name, '[^a-zA-Z0-9]+', '-', 'g')), true);
        END IF;
        
        -- Crear para HOMBRE si no existe
        IF NOT EXISTS (SELECT 1 FROM public.categories WHERE name = cat_name AND parent_id = hombre_id) THEN
            INSERT INTO public.categories (name, parent_id, slug, is_active)
            VALUES (cat_name, hombre_id, 'h-' || lower(regexp_replace(cat_name, '[^a-zA-Z0-9]+', '-', 'g')), true);
        END IF;
    END LOOP;

    -- 3. REASIGNAR PRODUCTOS (Lógica de coincidencia por nombre)
    UPDATE public.products p
    SET category_id = (
        SELECT sub.id 
        FROM public.categories sub
        WHERE sub.parent_id = (CASE WHEN p.gender ILIKE 'Hombre' THEN hombre_id ELSE mujer_id END)
        AND sub.name = (
            CASE 
                WHEN p.name ILIKE '%CAMPERA%' OR p.name ILIKE '%CHALECO%' OR p.name ILIKE '%BOMBER%' OR p.name ILIKE '%PARKA%' THEN 'CAMPERAS Y CHALECOS'
                WHEN p.name ILIKE '%PANTALON%' OR p.name ILIKE '%JEAN%' OR p.name ILIKE '%BERMUDA%' OR p.name ILIKE '%SHORT%' THEN 'PANTALONES'
                WHEN p.name ILIKE '%REMERA%' OR p.name ILIKE '%TOP%' OR p.name ILIKE '%MUSCULOSA%' THEN 'REMERAS'
                WHEN p.name ILIKE '%CHOMBA%' OR p.name ILIKE '%POLO%' THEN 'CHOMBAS'
                WHEN p.name ILIKE '%CALZADO%' OR p.name ILIKE '%ZAPATO%' OR p.name ILIKE '%ZAPATILLA%' OR p.name ILIKE '%BOTA%' THEN 'CALZADO'
                WHEN p.name ILIKE '%CAMISA%' OR p.name ILIKE '%BLUSA%' THEN 'CAMISAS'
                WHEN p.name ILIKE '%VESTIDO%' OR p.name ILIKE '%MONO%' OR p.name ILIKE '%FALDA%' THEN 'VESTIDOS'
                WHEN p.name ILIKE '%SWEATER%' OR p.name ILIKE '%BUZO%' OR p.name ILIKE '%TEJIDO%' OR p.name ILIKE '%CARDIGAN%' THEN 'SWEATERS Y BUZOS'
                WHEN p.name ILIKE '%PILOTO%' OR p.name ILIKE '%IMPERMEABLE%' OR p.name ILIKE '%TRENCH%' THEN 'PILOTOS'
                WHEN p.name ILIKE '%SACO%' OR p.name ILIKE '%BLAZER%' OR p.name ILIKE '%AMBO%' THEN 'SACOS'
                WHEN p.name ILIKE '%ABRIGO%' OR p.name ILIKE '%PAÑO%' OR p.name ILIKE '%SOBRETODO%' THEN 'ABRIGOS Y PAÑOS'
                WHEN p.name ILIKE '%ACCESORIO%' OR p.name ILIKE '%CARTERA%' OR p.name ILIKE '%BOLSO%' OR p.name ILIKE '%BILLETERA%' OR p.name ILIKE '%BUFANDA%' OR p.name ILIKE '%GORRO%' OR p.name ILIKE '%CINTO%' THEN 'ACCESORIOS'
                WHEN p.name ILIKE '%MALLA%' OR p.name ILIKE '%BAÑADOR%' OR p.name ILIKE '%BIKINI%' THEN 'MALLAS'
                ELSE 'OTROS ARTICULOS'
            END
        )
        LIMIT 1
    );

END $$;

-- 4. LIMPIEZA: BORRAR CATEGORÍAS QUE NO ESTÉN EN LA LISTA OFICIAL
DELETE FROM public.categories
WHERE name NOT IN (
    'PANTALONES', 'ACCESORIOS', 'ABRIGOS Y PAÑOS', 'VESTIDOS', 'REMERAS', 'MALLAS', 'CALZADO', 
    'SWEATERS Y BUZOS', 'PILOTOS', 'CAMISAS', 'CHOMBAS', 'CAMPERAS Y CHALECOS', 'SACOS', 'OTROS ARTICULOS',
    'MUJER', 'HOMBRE'
);

COMMIT;
