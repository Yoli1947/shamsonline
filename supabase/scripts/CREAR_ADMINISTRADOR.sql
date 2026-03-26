-- ============================================================
-- SHAMS OUTLET - OTORGAR PERMISO DE ADMINISTRADOR
-- Ejecutar en SQL Editor de Supabase DESPUÉS de SECURE_PRODUCTION.sql
-- ============================================================

DO $$
DECLARE
    target_user_id UUID;
BEGIN
    -- 1. Buscar el ID del usuario usando el email que nos proporcionaste
    SELECT id INTO target_user_id FROM auth.users WHERE email = 'admteruzyolanda@gmail.com';

    -- 2. Verificar si el usuario existe
    IF target_user_id IS NULL THEN
        RAISE EXCEPTION 'El usuario con ese email (admteruzyolanda@gmail.com) NO existe en Supabase Auth. ¿Ya te registraste?';
    END IF;

    -- 3. Insertar o actualizar el rol en la tabla user_roles
    INSERT INTO public.user_roles (user_id, role)
    VALUES (target_user_id, 'admin')
    ON CONFLICT (user_id) DO UPDATE SET role = 'admin';

    RAISE NOTICE '¡Éxito! El usuario ha sido convertido en Administrador.';
END $$;
