-- ============================================================
-- FIX RLS INFINITE RECURSION
-- ============================================================

DROP POLICY IF EXISTS "Admins pueden ver roles" ON public.user_roles;

-- Política simple sin recursión: El usuario puede leer su propio rol
CREATE POLICY "Usuarios pueden ver su propio rol" ON public.user_roles 
FOR SELECT TO authenticated 
USING ( user_id = auth.uid() );

-- Si queremos que los admins vean todo, la mejor forma de hacerlo sin recursión
-- es crear una función o mantenerlo simple si el frontend no necesita leer todos los roles.
-- Nuestro frontend solo lee su propio rol, así que esto es suficiente.

COMMIT;
