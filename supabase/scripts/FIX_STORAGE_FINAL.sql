-- 🔥 FIX FINAL PARA STORAGE (PRODUCTOS) 🔥

-- 1. Habilitar seguridad (es necesario para que funcionen las policies)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 2. Limpiar políticas viejas
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Admin Insert" ON storage.objects;
DROP POLICY IF EXISTS "Admin Update" ON storage.objects;
DROP POLICY IF EXISTS "Admin Delete" ON storage.objects;

-- 3. Crear políticas PERMISIVAS para que funcione la carga
-- Permitir lectura a todo el mundo (imágenes públicas)
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'products' );

-- Permitir INSERT a usuarios autenticados (nuestro script lo es)
CREATE POLICY "Admin Insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'products' );

-- Permitir UPDATE a usuarios autenticados
CREATE POLICY "Admin Update"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'products' );

-- Permitir DELETE a usuarios autenticados (por si acaso)
CREATE POLICY "Admin Delete"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'products' );

-- 4. Asegurar que el bucket existe y es público
INSERT INTO storage.buckets (id, name, public)
VALUES ('products', 'products', true)
ON CONFLICT (id) DO UPDATE SET public = true;
