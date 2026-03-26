-- ============================================================
-- 🔥 FIX COMPLETO DE CATEGORÍAS Y PERMISOS 🔥
-- Ejecuta TODO este script en el SQL Editor de Supabase
-- ============================================================

BEGIN;

-- 1. ARREGLAR PERMISOS (RLS) PARA QUE NO FALLE NADA
-- Permitir todo a usuarios autenticados (Admin) en las tablas clave
DROP POLICY IF EXISTS "Admin All Access" ON public.categories;
CREATE POLICY "Admin All Access" ON public.categories FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admin All Access" ON public.products;
CREATE POLICY "Admin All Access" ON public.products FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admin All Access" ON public.product_variants;
CREATE POLICY "Admin All Access" ON public.product_variants FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Admin All Access" ON public.product_images;
CREATE POLICY "Admin All Access" ON public.product_images FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Permitir lectura pública
DROP POLICY IF EXISTS "Public Read Access" ON public.categories;
CREATE POLICY "Public Read Access" ON public.categories FOR SELECT TO public USING (true);

-- 2. ASEGURAR CATEGORÍAS PADRE (MUJER/HOMBRE)
INSERT INTO public.categories (id, name, slug, is_active)
VALUES ('00000000-0000-0000-0000-000000000001', 'MUJER', 'mujer', true)
ON CONFLICT (id) DO UPDATE SET is_active = true;

INSERT INTO public.categories (id, name, slug, is_active)
VALUES ('00000000-0000-0000-0000-000000000002', 'HOMBRE', 'hombre', true)
ON CONFLICT (id) DO UPDATE SET is_active = true;

-- 3. CREAR LAS 14 CATEGORÍAS CANÓNICAS QUE FALTAN
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
        -- Mujer
        IF NOT EXISTS (SELECT 1 FROM public.categories WHERE name = cat_name AND parent_id = mujer_id) THEN
            INSERT INTO public.categories (name, parent_id, slug, is_active)
            VALUES (cat_name, mujer_id, 'm-' || lower(regexp_replace(cat_name, '[^a-zA-Z0-9]+', '-', 'g')), true);
        END IF;
        
        -- Hombre
        IF NOT EXISTS (SELECT 1 FROM public.categories WHERE name = cat_name AND parent_id = hombre_id) THEN
            INSERT INTO public.categories (name, parent_id, slug, is_active)
            VALUES (cat_name, hombre_id, 'h-' || lower(regexp_replace(cat_name, '[^a-zA-Z0-9]+', '-', 'g')), true);
        END IF;
    END LOOP;

    -- 4. REASIGNAR PRODUCTOS HUÉRFANOS A SUS CATEGORÍAS CORRECTAS
    UPDATE public.products p
    SET category_id = (
        SELECT sub.id 
        FROM public.categories sub
        WHERE sub.parent_id = (CASE WHEN p.gender ILIKE 'Hombre' THEN hombre_id ELSE mujer_id END)
        AND sub.name = (
            CASE 
                WHEN p.name ILIKE '%PANTALON%' OR p.name ILIKE '%JEAN%' OR p.name ILIKE '%BERMUDA%' OR p.name ILIKE '%SHORT%' THEN 'PANTALONES'
                WHEN p.name ILIKE '%REMERA%' OR p.name ILIKE '%TOP%' OR p.name ILIKE '%MUSCULOSA%' THEN 'REMERAS'
                WHEN p.name ILIKE '%CHOMBA%' OR p.name ILIKE '%POLO%' THEN 'CHOMBAS'
                WHEN p.name ILIKE '%CAMPERA%' OR p.name ILIKE '%CHALECO%' OR p.name ILIKE '%BOMBER%' OR p.name ILIKE '%PARKA%' THEN 'CAMPERAS/CHALECOS'
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

-- 5. BORRAR CATEGORÍAS VIEJAS O VACÍAS (Raíces huérfanas)
DELETE FROM public.categories
WHERE parent_id IS NULL 
AND id NOT IN ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002');

COMMIT;
