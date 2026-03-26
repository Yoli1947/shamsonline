-- ============================================================
-- 🔥 FIX PERMISOS USER_ROLES 🔥
-- Ejecuta este script en el SQL Editor de Supabase
-- ============================================================

-- Por defecto, nadie podía leer su propio rol al iniciar sesión
-- lo que causaba el bloqueo de "Acceso denegado". 
-- Esta regla permite que un usuario pueda leer su propio rol
-- para que la tienda sepa que es Administrador y le abra la puerta.

DROP POLICY IF EXISTS "Admins pueden ver roles" ON public.user_roles;

CREATE POLICY "Usuarios pueden ver su propio rol" ON public.user_roles 
FOR SELECT TO authenticated
USING ( user_id = auth.uid() );

-- ============================================================
-- 💡 NOTA: Si el mensaje dice "SUCCESS", el flujo de login 
-- ya no te bloqueará. ¡Vuelve a intentarlo!
-- ============================================================
