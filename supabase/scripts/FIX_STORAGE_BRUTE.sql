-- ==============================================================
-- 🔥 FIX FINAL PERMISOS STORAGE (ULTIMO INTENTO DE FUERZA BRUTA) 🔥
-- Ejecuta este script para forzar el acceso total al bucket.
-- ==============================================================

BEGIN;

-- 1. Asegurar el bucket 'products'
INSERT INTO storage.buckets (id, name, public)
VALUES ('products', 'products', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Eliminar TODAS LAS políticas posibles (para evitar el error "already exists")
DROP POLICY IF EXISTS "Public Read Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Insert" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Update" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Delete" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Admin Insert" ON storage.objects;
DROP POLICY IF EXISTS "Admin Update" ON storage.objects;
DROP POLICY IF EXISTS "Admin Delete" ON storage.objects;
DROP POLICY IF EXISTS "Give me access" ON storage.objects;
DROP POLICY IF EXISTS "Enable All Access for Authenticated Users" ON storage.objects;
DROP POLICY IF EXISTS "Enable All Access for Everyone" ON storage.objects;
DROP POLICY IF EXISTS "Admin Upload Access" ON storage.objects;
DROP POLICY IF EXISTS "Admin Update Access" ON storage.objects;
DROP POLICY IF EXISTS "Admin Delete Access" ON storage.objects;

-- 3. CREAR POLÍTICA "SUPER PERMISIVA" 
-- Permite TODO a CUALQUIERA (público total)
CREATE POLICY "Enable All Access for Everyone"
ON storage.objects FOR ALL 
TO public
USING (bucket_id = 'products')
WITH CHECK (bucket_id = 'products');

COMMIT;
