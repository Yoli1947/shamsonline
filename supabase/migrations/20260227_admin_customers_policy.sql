
DROP POLICY IF EXISTS "Admins can view all customers" ON customers;
DROP POLICY IF EXISTS "Admins can update all customers" ON customers;
DROP POLICY IF EXISTS "Admins can view all addresses" ON customer_addresses;

-- Permitir que los administradores vean todos los clientes
CREATE POLICY "Admins can view all customers"
  ON customers FOR SELECT TO authenticated
  USING (public.is_admin());

-- Permitir que los administradores actualicen clientes
CREATE POLICY "Admins can update all customers"
  ON customers FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Permitir que los administradores vean todas las direcciones
CREATE POLICY "Admins can view all addresses"
  ON customer_addresses FOR SELECT TO authenticated
  USING (public.is_admin());
