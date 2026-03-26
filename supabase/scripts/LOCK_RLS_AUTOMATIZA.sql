-- ============================================================
-- 🔒 RE-BLOQUEAR SEGURIDAD (CERRAR AUTOMATIZACIÓN) 🔒
-- Ejecuta este código en el SQL Editor de Supabase para 
-- volver a proteger tu base de datos contra escrituras anónimas.
-- ============================================================

-- 1. Quitar permisos sueltos a la tabla PRODUCTS
DROP POLICY IF EXISTS "Permitir todo a Anon en Products" ON products;

-- 2. Quitar permisos sueltos a la tabla VARIANTS (Stock)
DROP POLICY IF EXISTS "Permitir todo a Anon en Variants" ON product_variants;

-- 3. Quitar permisos sueltos a BRANDS y CATEGORIES
DROP POLICY IF EXISTS "Permitir todo a Anon en Brands" ON brands;
DROP POLICY IF EXISTS "Permitir todo a Anon en Categories" ON categories;

-- 4. Notificar que está listo
COMMENT ON TABLE products IS 'Protección RLS restaurada';
