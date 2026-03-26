-- Agrega tracking del beneficio de primera compra a la tabla de pedidos
ALTER TABLE orders ADD COLUMN IF NOT EXISTS first_promo_used BOOLEAN DEFAULT FALSE;

-- Función RPC pública para verificar si el beneficio ya fue usado
-- Usa SECURITY DEFINER para bypassar RLS (la consulta es segura: solo devuelve boolean)
CREATE OR REPLACE FUNCTION public.check_promo_used(p_email TEXT, p_dni TEXT DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM orders
    WHERE first_promo_used = true
    AND (
      (p_email IS NOT NULL AND p_email != '' AND LOWER(TRIM(customer_email)) = LOWER(TRIM(p_email)))
      OR
      (p_dni IS NOT NULL AND p_dni != '' AND customer_dni = p_dni)
    )
    AND payment_status != 'failed'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_promo_used TO anon;
GRANT EXECUTE ON FUNCTION public.check_promo_used TO authenticated;
