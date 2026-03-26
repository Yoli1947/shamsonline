-- ============================================================
-- 🚨 EMERGENCIA: PERMISOS PARA RESTAURAR BACKUP 🚨
-- Ejecuta este código en el SQL EDITOR de tu panel de Supabase.
-- ============================================================

-- 1. Habilitar inserción/actualización para usuarios anónimos (TEMPORAL)
--    Esto permite que el script de restauración funcione sin login.

-- PRODUCTOS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Restore Products" ON products;
CREATE POLICY "Public Restore Products" ON products FOR ALL TO anon USING (true) WITH CHECK (true);

-- VARIANTES
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Restore Variants" ON product_variants;
CREATE POLICY "Public Restore Variants" ON product_variants FOR ALL TO anon USING (true) WITH CHECK (true);

-- IMÁGENES
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Restore Images" ON product_images;
CREATE POLICY "Public Restore Images" ON product_images FOR ALL TO anon USING (true) WITH CHECK (true);

-- MARCAS Y CATEGORÍAS (Por si acaso)
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Restore Brands" ON brands;
CREATE POLICY "Public Restore Brands" ON brands FOR ALL TO anon USING (true) WITH CHECK (true);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Restore Categories" ON categories;
CREATE POLICY "Public Restore Categories" ON categories FOR ALL TO anon USING (true) WITH CHECK (true);

-- Fin del script
