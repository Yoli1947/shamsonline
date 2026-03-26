
-- ==========================================
-- SOLUCIÓN PARA PEDIDOS Y STOCK
-- Ejecutar esto en el SQL Editor de Supabase
-- ==========================================

-- 1. Función para descontar stock (Requerida por lib/orders.js)
CREATE OR REPLACE FUNCTION public.decrement_stock(p_variant_id UUID, p_quantity INTEGER)
RETURNS VOID AS $$
BEGIN
    UPDATE public.product_variants
    SET stock = stock - p_quantity
    WHERE id = p_variant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Políticas de RLS para permitir que cualquiera pueda comprar (INSERT)
-- Sin estas políticas, el sitio web público no puede guardar pedidos
DROP POLICY IF EXISTS "Permitir inserción pública de pedidos" ON public.orders;
CREATE POLICY "Permitir inserción pública de pedidos" 
ON public.orders FOR INSERT 
WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir inserción pública de items" ON public.order_items;
CREATE POLICY "Permitir inserción pública de items" 
ON public.order_items FOR INSERT 
WITH CHECK (true);

-- 3. Asegurar que los pedidos sean visibles para el admin
DROP POLICY IF EXISTS "Admin puede ver todos los pedidos" ON public.orders;
CREATE POLICY "Admin puede ver todos los pedidos" 
ON public.orders FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Admin puede ver todos los items" ON public.order_items;
CREATE POLICY "Admin puede ver todos los items" 
ON public.order_items FOR SELECT 
USING (true);

-- 4. Permitir lectura pública de variantes (para que el carrito funcione bien)
DROP POLICY IF EXISTS "Product variants are viewable by everyone" ON public.product_variants;
CREATE POLICY "Product variants are viewable by everyone" 
ON public.product_variants FOR SELECT 
USING (true);
