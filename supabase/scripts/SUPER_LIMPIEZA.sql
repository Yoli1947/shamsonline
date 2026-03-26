
-- ========================================================
-- SUPER LIMPIEZA DE DUPLICADOS Y RECUPERACIÓN DE STOCK
-- ========================================================

-- 1. Identificar y eliminar los productos "vacíos" creados hoy que están tapando a los viejos
-- Primero les quitamos el código para que no bloqueen el update de los viejos
UPDATE public.products 
SET code = NULL 
WHERE id IN (
    SELECT p_new.id
    FROM public.products p_new
    JOIN public.products p_old ON (p_new.code = p_old.sku OR p_new.code = p_old.code)
    WHERE p_new.created_at > '2026-02-14' -- Creados hoy
      AND p_old.created_at < '2026-02-14' -- Existían antes
      AND p_new.id <> p_old.id
);

-- 2. Ahora sí, pasarle el código a los productos viejos que tienen el stock
UPDATE public.products p_old
SET code = p_old.sku
WHERE (p_old.code IS NULL OR p_old.code = '')
  AND p_old.sku IS NOT NULL
  AND EXISTS (
      -- Solo si no hay otro producto (que no sea un duplicado de hoy) usando ese código
      SELECT 1 FROM public.products p2 
      WHERE p2.code = p_old.sku 
      AND p2.id <> p_old.id
      AND p2.created_at < '2026-02-14'
  ) IS FALSE;

-- 3. Borrar los duplicados definitivamente
DELETE FROM public.products 
WHERE created_at > '2026-02-14'
  AND id IN (
      SELECT p_new.id
      FROM public.products p_new
      JOIN public.products p_old ON (p_new.sku = p_old.sku OR p_new.name = p_old.name)
      WHERE p_old.created_at < '2026-02-14'
        AND p_new.id <> p_old.id
  );

-- 4. CASO ESPECÍFICO DIPPER (Por seguridad)
DELETE FROM public.products WHERE id = '8fa5ced5-844f-4ee1-ad44-87adb496d252';
UPDATE public.products SET code = 'P12301668V' WHERE id = '03aa8257-0443-4ebc-8218-ad1d6f5af7e6';
