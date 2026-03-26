-- ============================================================
-- 🔥 FIX PERMISOS TABLAS (Para poder borrar/modificar) 🔥
-- Ejecuta esto en Supabase SQL Editor.
-- ============================================================

BEGIN;

-- 1. Permitir acceso total a 'product_images' para poder borrar
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anon Full Access Images" ON public.product_images;
CREATE POLICY "Anon Full Access Images" ON public.product_images FOR ALL TO public USING (true) WITH CHECK (true);

-- 2. Permitir actualizar 'products' (para limpiar image_url)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anon Update Products" ON public.products;
CREATE POLICY "Anon Update Products" ON public.products FOR UPDATE TO public USING (true);

-- 3. Permitir borrar 'products' (por si necesitamos eliminar duplicados)
DROP POLICY IF EXISTS "Anon Delete Products" ON public.products;
CREATE POLICY "Anon Delete Products" ON public.products FOR DELETE TO public USING (true);

COMMIT;
