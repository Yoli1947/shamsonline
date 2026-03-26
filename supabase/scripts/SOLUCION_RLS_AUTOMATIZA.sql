
-- ============================================================
-- 🛠️ SOLUCIÓN PARA AUTOMATIZACIÓN (IMPORTADOR Y RENOMBRADOR) 🛠️
-- Ejecuta este código en el SQL Editor de Supabase para que 
-- los scripts de tu computadora puedan guardar datos.
-- ============================================================

-- 1. Dar permisos a la tabla PRODUCTS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir todo a Anon en Products" ON products;
CREATE POLICY "Permitir todo a Anon en Products" ON products 
FOR ALL TO anon USING (true) WITH CHECK (true);

-- 2. Dar permisos a la tabla VARIANTS (Stock)
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir todo a Anon en Variants" ON product_variants;
CREATE POLICY "Permitir todo a Anon en Variants" ON product_variants 
FOR ALL TO anon USING (true) WITH CHECK (true);

-- 3. Dar permisos a BRANDS y CATEGORIES (Para que el Excel cree marcas nuevas)
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir todo a Anon en Brands" ON brands;
CREATE POLICY "Permitir todo a Anon en Brands" ON brands 
FOR ALL TO anon USING (true) WITH CHECK (true);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir todo a Anon en Categories" ON categories;
CREATE POLICY "Permitir todo a Anon en Categories" ON categories 
FOR ALL TO anon USING (true) WITH CHECK (true);

-- 4. Notificar que está listo
COMMENT ON TABLE products IS 'Permisos abiertos temporalmente para automatización';
