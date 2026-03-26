-- ============================================================
-- 🔥 FIX URGENTE PARA LOGIN DE ADMINISTRADOR 🔥
-- Ejecuta este script en el SQL Editor de Supabase
-- ============================================================

-- Inserta el rol 'admin' para tu cuenta (admteruzyolanda@gmail.com)
-- si la cuenta ya existe en auth.users

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE email = 'admteruzyolanda@gmail.com'
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';

-- ============================================================
-- 💡 NOTA: Si el mensaje dice "INSERT 0 1", funcionó.
-- Ahora recarga la página de /admin/login de tu tienda y entra 
-- con admteruzyolanda@gmail.com y AdminPassword123!
-- ============================================================
