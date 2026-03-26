-- ============================================================
-- 🔥 RESTABLECER CONTRASEÑA DE ADMINISTRADORA 🔥
-- Ejecuta este script en el SQL Editor de Supabase
-- ============================================================

-- Esto cambiará la contraseña de admteruzyolanda@gmail.com a: AdminPassword123!
-- (También confirmará el email automáticamente para que no te bloquee)

UPDATE auth.users
SET encrypted_password = crypt('AdminPassword123!', gen_salt('bf')),
    email_confirmed_at = NOW(),
    updated_at = NOW()
WHERE email = 'admteruzyolanda@gmail.com';

-- Si el mensaje inferior dice "SUCCESS" o "UPDATE 1", el cambio fue exitoso.
-- Ya puedes ir a https://shamsoutlet.com/admin/login
-- Usuario: admteruzyolanda@gmail.com
-- Nueva Clave: AdminPassword123!
