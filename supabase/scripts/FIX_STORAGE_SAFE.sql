-- ======================================================
-- 🔥 FIX SEGURO DE PERMISOS STORAGE (SIN ERRORES) 🔥
-- Ejecuta esto. Si alguna línea falla, no te preocupes, 
-- lo importante son las Policies.
-- ======================================================

BEGIN;

-- 1. Asegurar que el bucket 'products' exista y sea público
INSERT INTO storage.buckets (id, name, public)
VALUES ('products', 'products', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Eliminar políticas viejas para limpiar (sin tocar la tabla en sí)
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Admin Insert" ON storage.objects;
DROP POLICY IF EXISTS "Admin Update" ON storage.objects;
DROP POLICY IF EXISTS "Admin Delete" ON storage.objects;
DROP POLICY IF EXISTS "Admin Upload Access" ON storage.objects;
DROP POLICY IF EXISTS "Admin Update Access" ON storage.objects;
DROP POLICY IF EXISTS "Admin Delete Access" ON storage.objects;
DROP POLICY IF EXISTS "Public Read Access" ON storage.objects;
DROP POLICY IF EXISTS "Anon Read Access" ON storage.objects;
DROP POLICY IF EXISTS "Give me access" ON storage.objects;

-- 3. Crear políticas NUEVAS y PERMISIVAS
-- Permitir descargar/ver imágenes a TODO EL MUNDO
CREATE POLICY "Public Read Access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'products');

-- Permitir SUBIR imágenes a usuarios autenticados (nuestro script)
CREATE POLICY "Authenticated Insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'products');

-- Permitir ACTUALIZAR imágenes a usuarios autenticados
CREATE POLICY "Authenticated Update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'products');

-- Permitir BORRAR imágenes a usuarios autenticados
CREATE POLICY "Authenticated Delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'products');

COMMIT;
