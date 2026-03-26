-- ==========================================
-- SCRIPT DE CORRECCIÓN TOTAL DE PERMISOS
-- ==========================================

-- 1. Asegurar que el bucket de imágenes existe y es público
INSERT INTO storage.buckets (id, name, public) 
VALUES ('products', 'products', true) 
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Eliminar políticas antiguas para evitar conflictos y empezar limpio
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON products;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON products;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON products;
DROP POLICY IF EXISTS "Enable insert for authenticated variants" ON product_variants;
DROP POLICY IF EXISTS "Enable update for authenticated variants" ON product_variants;
DROP POLICY IF EXISTS "Enable delete for authenticated variants" ON product_variants;
DROP POLICY IF EXISTS "Authenticated can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can update images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view images" ON storage.objects;

-- 3. PERMISOS DE TABLAS (CRUD Completo para usuarios logueados)

-- Products
CREATE POLICY "Enable all for authenticated users" ON products 
FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Variants
CREATE POLICY "Enable all for authenticated variants" ON product_variants 
FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Images (Tabla relacional, si se usa)
CREATE POLICY "Enable all for authenticated product_images" ON product_images 
FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Brands & Categories
CREATE POLICY "Enable all for authenticated brands" ON brands 
FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Enable all for authenticated categories" ON categories 
FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 4. PERMISOS DE STORAGE (Subida de imágenes)

-- Permitir subir objetos al bucket 'products'
CREATE POLICY "Authenticated can upload images" ON storage.objects 
FOR INSERT TO authenticated 
WITH CHECK (bucket_id = 'products');

-- Permitir actualizar objetos (reemplazar imagen)
CREATE POLICY "Authenticated can update images" ON storage.objects 
FOR UPDATE TO authenticated 
USING (bucket_id = 'products');

-- Permitir borrar objetos
CREATE POLICY "Authenticated can delete images" ON storage.objects 
FOR DELETE TO authenticated 
USING (bucket_id = 'products');

-- Permitir VER imágenes (Público)
CREATE POLICY "Public can view images" ON storage.objects 
FOR SELECT TO public 
USING (bucket_id = 'products');

-- ==========================================
-- FIN DEL SCRIPT
-- ==========================================
