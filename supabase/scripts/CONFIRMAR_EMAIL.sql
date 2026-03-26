-- ============================================================
-- 🔥 CONFIRMAR EMAIL MANUALMENTE 🔥
-- Ejecuta este script en el SQL Editor de Supabase
-- para omitir la confirmación por correo de la administradora.
-- ============================================================

UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email = 'admteruzyolanda@gmail.com';

-- Si dice SUCCESS o UPDATE 1, ya puedes ingresar!
