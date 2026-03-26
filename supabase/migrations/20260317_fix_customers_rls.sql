-- ============================================================
-- FIX: Clientes no aparecen en el admin
-- Problema: tabla customers sin políticas INSERT + no hay trigger
-- ============================================================

-- 1. Habilitar RLS si no estaba (por seguridad)
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- 2. Eliminar políticas anteriores que puedan estar duplicadas
DROP POLICY IF EXISTS "Admins can view all customers" ON customers;
DROP POLICY IF EXISTS "Admins can update all customers" ON customers;
DROP POLICY IF EXISTS "Users can insert their own profile" ON customers;
DROP POLICY IF EXISTS "Users can view their own profile" ON customers;
DROP POLICY IF EXISTS "Users can update their own profile" ON customers;
DROP POLICY IF EXISTS "Anon can insert customer on signup" ON customers;

-- 3. Los admins pueden ver TODOS los clientes
CREATE POLICY "Admins can view all customers"
  ON customers FOR SELECT TO authenticated
  USING (public.is_admin());

-- 4. Los admins pueden actualizar clientes
CREATE POLICY "Admins can update all customers"
  ON customers FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 5. Cualquier usuario autenticado puede insertar su propio perfil
CREATE POLICY "Users can insert their own profile"
  ON customers FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = auth_user_id);

-- 6. También permitir insert con anon en caso de que email confirmation esté activa
--    (el usuario aún no está autenticado cuando se inserta el perfil)
CREATE POLICY "Anon can insert customer on signup"
  ON customers FOR INSERT TO anon
  WITH CHECK (true);

-- 7. Un usuario puede ver y actualizar su propio perfil
CREATE POLICY "Users can view their own profile"
  ON customers FOR SELECT TO authenticated
  USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can update their own profile"
  ON customers FOR UPDATE TO authenticated
  USING (auth.uid() = auth_user_id)
  WITH CHECK (auth.uid() = auth_user_id);

-- 8. Trigger: auto-crear fila en customers cuando se registra un usuario en auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  fname TEXT;
  lname TEXT;
  full_name TEXT;
BEGIN
  full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', '');
  fname := split_part(full_name, ' ', 1);
  lname := TRIM(SUBSTRING(full_name FROM LENGTH(fname) + 2));

  INSERT INTO public.customers (auth_user_id, email, first_name, last_name)
  VALUES (NEW.id, NEW.email, fname, lname)
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

-- Eliminar trigger si existía
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Crear trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 9. Backfill: migrar usuarios existentes de auth.users a customers
INSERT INTO public.customers (auth_user_id, email, first_name, last_name)
SELECT
  u.id,
  u.email,
  COALESCE(split_part(COALESCE(u.raw_user_meta_data->>'full_name', ''), ' ', 1), ''),
  COALESCE(
    TRIM(SUBSTRING(COALESCE(u.raw_user_meta_data->>'full_name', '') FROM
      LENGTH(split_part(COALESCE(u.raw_user_meta_data->>'full_name', ''), ' ', 1)) + 2
    )), ''
  )
FROM auth.users u
WHERE u.email NOT IN (
  SELECT email FROM public.user_roles WHERE role = 'admin'
)
ON CONFLICT DO NOTHING;
