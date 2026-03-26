
-- ==========================================
-- SOLUCIÓN DEFINITIVA PARA PEDIDOS Y PAGOS
-- Ejecutar en SQL Editor de Supabase
-- ==========================================

-- 1. Asegurar que existan las columnas para método de envío y pago
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_method TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS notes TEXT;

-- 2. Función para descontar stock (Indispensable)
CREATE OR REPLACE FUNCTION public.decrement_stock(p_variant_id UUID, p_quantity INTEGER)
RETURNS VOID AS $$
BEGIN
    UPDATE public.product_variants
    SET stock = stock - p_quantity
    WHERE id = p_variant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Habilitar RLS en las tablas (por seguridad)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- 4. POLÍTICAS DE ACCESO (Permitir que cualquiera cree pedidos)

-- Eliminar políticas viejas para evitar conflictos
DROP POLICY IF EXISTS "Permitir inserción pública de pedidos" ON public.orders;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.orders;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.orders;

-- Política para INSERTAR pedidos (Público y Autenticado)
CREATE POLICY "Permitir crear pedidos" 
ON public.orders FOR INSERT 
TO public
WITH CHECK (true);

-- Política para VER pedidos (Solo el dueño o Admin - simplificado para demo: público puede ver lo suyo si tiene ID, pero por ahora dejamos que el Insert devuelva datos)
DROP POLICY IF EXISTS "Ver pedidos propios" ON public.orders;
CREATE POLICY "Ver pedidos propios" 
ON public.orders FOR SELECT 
TO public
USING (true); -- En producción, idealmente filtrar por session_id o email, pero para debug dejar true

-- Repetir para ORDER ITEMS
DROP POLICY IF EXISTS "Permitir inserción pública de items" ON public.order_items;
CREATE POLICY "Permitir items" 
ON public.order_items FOR INSERT 
TO public
WITH CHECK (true);

DROP POLICY IF EXISTS "Ver items" ON public.order_items;
CREATE POLICY "Ver items" 
ON public.order_items FOR SELECT 
TO public
USING (true);

-- 5. Asegurar lectura de variantes para el stock
DROP POLICY IF EXISTS "Product variants viewable" ON public.product_variants;
CREATE POLICY "Product variants viewable" 
ON public.product_variants FOR SELECT 
TO public
USING (true);

-- Permisos extra por si acaso
GRANT ALL ON public.orders TO anon;
GRANT ALL ON public.orders TO authenticated;
GRANT ALL ON public.order_items TO anon;
GRANT ALL ON public.order_items TO authenticated;
GRANT ALL ON public.product_variants TO anon;
GRANT ALL ON public.product_variants TO authenticated;
