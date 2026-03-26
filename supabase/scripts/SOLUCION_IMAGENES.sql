-- ==========================================
-- SCRIPT DE REPARACIÓN DE PERMISOS (IMÁGENES)
-- ==========================================
-- Ejecuta este script en el Editor SQL de Supabase para
-- corregir el problema de "Imágenes no cargan en la tienda".

-- 1. Habilitar seguridad en la tabla
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;

-- 2. Permitir que CUALQUIERA (Público) vea las imágenes
-- Esto es necesario para que la tienda (Store) pueda descargarlas.
DROP POLICY IF EXISTS "Public Read Product Images" ON product_images;
CREATE POLICY "Public Read Product Images"
ON product_images FOR SELECT
TO public
USING (true);

-- 3. Permitir que SOLO ADMIN pueda subir/editar/borrar
-- (Asumiendo que el admin está autenticado)
DROP POLICY IF EXISTS "Admin Manage Product Images" ON product_images;
CREATE POLICY "Admin Manage Product Images"
ON product_images FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 4. Verificar Bucket de Storage (Por si acaso)
-- Asegura que el bucket 'products' sea público
INSERT INTO storage.buckets (id, name, public)
VALUES ('products', 'products', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 5. Policies para storage.objects (Imágenes en sí)
DROP POLICY IF EXISTS "Public Access Bucket" ON storage.objects;
CREATE POLICY "Public Access Bucket"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'products');

DROP POLICY IF EXISTS "Auth Upload Bucket" ON storage.objects;
CREATE POLICY "Auth Upload Bucket"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'products');

DROP POLICY IF EXISTS "Auth Delete Bucket" ON storage.objects;
CREATE POLICY "Auth Delete Bucket"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'products');








