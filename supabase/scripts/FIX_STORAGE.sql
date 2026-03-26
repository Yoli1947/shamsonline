-- ==========================================
-- SOLUCION DEFINITIVA PARA PERMISOS DE STORAGE
-- ==========================================

-- 1. Habilitar RLS en objetos de storage (si no lo está)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 2. Política para PERMITIR TODO a usuarios autenticados (Admin)
CREATE POLICY "Admin Upload Access"
ON storage.objects FOR INSERT TO authenticated 
WITH CHECK (bucket_id = 'products');

CREATE POLICY "Admin Update Access"
ON storage.objects FOR UPDATE TO authenticated 
USING (bucket_id = 'products');

CREATE POLICY "Admin Delete Access"
ON storage.objects FOR DELETE TO authenticated 
USING (bucket_id = 'products');

-- 3. Política para permitir lectura pública (Select)
CREATE POLICY "Public Read Access"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'products');

-- 4. Asegurar que 'anon' también pueda leer (por si acaso)
CREATE POLICY "Anon Read Access"
ON storage.objects FOR SELECT TO anon
USING (bucket_id = 'products');

-- 5. Política permisiva global para debugging (opcional, usar con cuidado)
-- CREATE POLICY "Global Access" ON storage.objects FOR ALL USING (true) WITH CHECK (true);
