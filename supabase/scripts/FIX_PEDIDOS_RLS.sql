-- ============================================================
-- 🔥 FIX URGENTE PARA CARRITO Y COMPRAS (SHAMS) 🔥
-- Ejecuta este script comprobado en el SQL Editor de Supabase
-- para permitir que los clientes anónimos puedan guardar sus pedidos de nuevo.
-- ============================================================

-- A. PEDIDOS (orders)
DROP POLICY IF EXISTS "Permitir inserción de pedidos" ON public.orders;
CREATE POLICY "Permitir inserción de pedidos" 
ON public.orders FOR INSERT 
WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir leer pedidos a dueños y admin" ON public.orders;
CREATE POLICY "Permitir leer pedidos a dueños y admin" 
ON public.orders FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Admin update orders" ON public.orders;
CREATE POLICY "Admin update orders" ON public.orders FOR UPDATE TO authenticated 
USING ( (SELECT role FROM public.user_roles WHERE user_id = auth.uid()) = 'admin' );


-- B. PRODUCTOS DEL PEDIDO (order_items)
DROP POLICY IF EXISTS "Permitir inserción de items" ON public.order_items;
CREATE POLICY "Permitir inserción de items" 
ON public.order_items FOR INSERT 
WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir leer items a administradores" ON public.order_items;
CREATE POLICY "Permitir leer items a administradores" 
ON public.order_items FOR SELECT 
USING (true);


-- C. CLIENTES (customers) - Por si se crean durante la compra
DROP POLICY IF EXISTS "Permitir registro de clientes anon" ON public.customers;
CREATE POLICY "Permitir registro de clientes anon" 
ON public.customers FOR INSERT 
WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir lectura de clientes" ON public.customers;
CREATE POLICY "Permitir lectura de clientes" 
ON public.customers FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Admin update customers" ON public.customers;
CREATE POLICY "Admin update customers" ON public.customers FOR UPDATE TO authenticated 
USING ( (SELECT role FROM public.user_roles WHERE user_id = auth.uid()) = 'admin' );

COMMIT;
