-- ============================================================
-- 🔥 SHAMS OUTLET - SEGURIDAD RLS PARA PRODUCCIÓN 🔥
-- Este script crea un sistema de roles real para administradores
-- y asegura todas las políticas para que usuarios normales 
-- NO puedan borrar o editar tus productos.
-- ============================================================

-- 1. CREAR TABLA DE ROLES
CREATE TABLE IF NOT EXISTS public.user_roles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('admin', 'customer')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS en la nueva tabla
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Solo los propios admins pueden leer y modificar la tabla de roles
CREATE POLICY "Admins pueden ver roles" ON public.user_roles FOR SELECT TO authenticated
USING (
    (SELECT role FROM public.user_roles WHERE user_id = auth.uid()) = 'admin' OR user_id = auth.uid()
);

-- OJO: La configuración inicial de admins deberá hacerse manualmente en la BD 
-- o usar un trigger de Auth si se quiere automatizar el primer admin.

-- 2. ASEGURAR TABLAS EXISTENTES
-- Eliminamos todas las políticas peligrosas donde cualquier usuario autenticado podía modificar
DO $$ 
DECLARE
    table_name_var TEXT;
    policy_name_var TEXT;
BEGIN
    FOR table_name_var IN SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    LOOP
        FOR policy_name_var IN SELECT policyname FROM pg_policies WHERE tablename = table_name_var AND schemaname = 'public'
        LOOP
            EXECUTE format('DROP POLICY IF EXISTS %I ON %I', policy_name_var, table_name_var);
        END LOOP;
        
        -- Aprovechamos para asegurar que todas las tablas tengan RLS habilitado
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', table_name_var);
    END LOOP;
END $$;

-- ============================================================
-- 3. POLÍTICAS DE LECTURA (PÚBLICAS - LO QUE EL CLIENTE VE)
-- ============================================================
CREATE POLICY "Lectura publica brands" ON brands FOR SELECT USING (true);
CREATE POLICY "Lectura publica categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Lectura publica products" ON products FOR SELECT USING (true);
CREATE POLICY "Lectura publica product_images" ON product_images FOR SELECT USING (true);
CREATE POLICY "Lectura publica product_variants" ON product_variants FOR SELECT USING (true);
CREATE POLICY "Lectura publica size_curves" ON size_curves FOR SELECT USING (true);
CREATE POLICY "Lectura publica site_settings" ON site_settings FOR SELECT USING (true);

-- ============================================================
-- 4. POLÍTICAS DE ESCRITURA/MODIFICACIÓN/BORRADO (SOLO ADMINS)
-- ============================================================
-- Aquí está la clave: Verificamos que el usuario en sesión (auth.uid())
-- exista en nuestra nueva tabla user_roles con el rol 'admin'

CREATE POLICY "Admin access brands" ON brands FOR ALL TO authenticated 
USING ( (SELECT role FROM public.user_roles WHERE user_id = auth.uid()) = 'admin' ) 
WITH CHECK ( (SELECT role FROM public.user_roles WHERE user_id = auth.uid()) = 'admin' );

CREATE POLICY "Admin access categories" ON categories FOR ALL TO authenticated 
USING ( (SELECT role FROM public.user_roles WHERE user_id = auth.uid()) = 'admin' ) 
WITH CHECK ( (SELECT role FROM public.user_roles WHERE user_id = auth.uid()) = 'admin' );

CREATE POLICY "Admin access products" ON products FOR ALL TO authenticated 
USING ( (SELECT role FROM public.user_roles WHERE user_id = auth.uid()) = 'admin' ) 
WITH CHECK ( (SELECT role FROM public.user_roles WHERE user_id = auth.uid()) = 'admin' );

CREATE POLICY "Admin access product_images" ON product_images FOR ALL TO authenticated 
USING ( (SELECT role FROM public.user_roles WHERE user_id = auth.uid()) = 'admin' ) 
WITH CHECK ( (SELECT role FROM public.user_roles WHERE user_id = auth.uid()) = 'admin' );

CREATE POLICY "Admin access product_variants" ON product_variants FOR ALL TO authenticated 
USING ( (SELECT role FROM public.user_roles WHERE user_id = auth.uid()) = 'admin' ) 
WITH CHECK ( (SELECT role FROM public.user_roles WHERE user_id = auth.uid()) = 'admin' );

CREATE POLICY "Admin access size_curves" ON size_curves FOR ALL TO authenticated 
USING ( (SELECT role FROM public.user_roles WHERE user_id = auth.uid()) = 'admin' ) 
WITH CHECK ( (SELECT role FROM public.user_roles WHERE user_id = auth.uid()) = 'admin' );

CREATE POLICY "Admin access site_settings" ON site_settings FOR ALL TO authenticated 
USING ( (SELECT role FROM public.user_roles WHERE user_id = auth.uid()) = 'admin' ) 
WITH CHECK ( (SELECT role FROM public.user_roles WHERE user_id = auth.uid()) = 'admin' );

-- ============================================================
-- 5. STORAGE FIXED (Buckets y Policies para FOTOS)
-- ============================================================
-- Los clientes pueden ver las fotos
DROP POLICY IF EXISTS "Storage Select" ON storage.objects;
CREATE POLICY "Storage Select" ON storage.objects FOR SELECT USING (bucket_id = 'products');

-- Solo los ADMIN pueden subir, editar o borrar fotos
DROP POLICY IF EXISTS "Storage Insert Admin" ON storage.objects;
CREATE POLICY "Storage Insert Admin" ON storage.objects FOR INSERT TO authenticated 
WITH CHECK ( bucket_id = 'products' AND (SELECT role FROM public.user_roles WHERE user_id = auth.uid()) = 'admin' );

DROP POLICY IF EXISTS "Storage Update Admin" ON storage.objects;
CREATE POLICY "Storage Update Admin" ON storage.objects FOR UPDATE TO authenticated 
USING ( bucket_id = 'products' AND (SELECT role FROM public.user_roles WHERE user_id = auth.uid()) = 'admin' );

DROP POLICY IF EXISTS "Storage Delete Admin" ON storage.objects;
CREATE POLICY "Storage Delete Admin" ON storage.objects FOR DELETE TO authenticated 
USING ( bucket_id = 'products' AND (SELECT role FROM public.user_roles WHERE user_id = auth.uid()) = 'admin' );

-- Finalizado
COMMIT;
