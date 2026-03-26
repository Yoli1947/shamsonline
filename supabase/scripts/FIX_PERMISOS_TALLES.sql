-- ============================================================
-- 🔥 FIX PERMISOS CURVAS DE TALLES 🔥
-- Ejecuta este código en el SQL Editor de Supabase
-- ============================================================

-- 1. Asegurar que la tabla existe y tiene RLS activado
ALTER TABLE IF EXISTS public.size_curves ENABLE ROW LEVEL SECURITY;

-- 2. Dar permisos básicos de acceso a los roles
GRANT ALL ON public.size_curves TO authenticated;
GRANT ALL ON public.size_curves TO anon;
GRANT ALL ON public.size_curves TO service_role;

-- 3. Limpiar políticas antiguas para evitar duplicados
DROP POLICY IF EXISTS "Public read access for size_curves" ON public.size_curves;
DROP POLICY IF EXISTS "Admin full access size_curves" ON public.size_curves;
DROP POLICY IF EXISTS "Admin insert access for size_curves" ON public.size_curves;
DROP POLICY IF EXISTS "Admin update access for size_curves" ON public.size_curves;
DROP POLICY IF EXISTS "Admin delete access for size_curves" ON public.size_curves;

-- 4. Crear políticas robustas
-- Cualquiera puede ver las curvas (útil para el frontend si se necesita)
CREATE POLICY "Lectura publica size_curves" 
ON public.size_curves FOR SELECT 
USING (true);

-- Solo usuarios logueados pueden modificar/insertar/borrar
CREATE POLICY "Admin full access size_curves" 
ON public.size_curves FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- OPCIONAL: Si sigues teniendo problemas, esta política permite a "anon" (sin loguearse)
-- pero úsala solo como último recurso para debugear:
-- CREATE POLICY "Debug anon access" ON public.size_curves FOR ALL TO anon USING (true) WITH CHECK (true);
