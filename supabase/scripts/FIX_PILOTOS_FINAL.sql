-- ============================================================
-- 🧹 LIMPIEZA DE CATEGORÍAS DUPLICADAS
-- Ejecuta este código en el SQL Editor de Supabase
-- ============================================================

-- 1. Eliminar la categoría "PILOTOS HOMBRE" creada hoy por error (la que está suelta en la raíz)
DELETE FROM public.categories 
WHERE name = 'PILOTOS HOMBRE' 
  AND parent_id IS NULL;

-- 2. Asegurar que la categoría original "PILOTOS" dentro de HOMBRE esté activa y visible
UPDATE public.categories 
SET is_active = true 
WHERE name = 'PILOTOS' 
  AND parent_id = '00000000-0000-0000-0000-000000000002'; -- ID de HOMBRE

-- 3. Verificamos el resultado
SELECT id, name, parent_id, is_active 
FROM public.categories 
WHERE name LIKE '%PILOT%';

-- Deberías ver solo 2 resultados activos: 
-- 1. PILOTOS (bajo MUJER)
-- 2. PILOTOS (bajo HOMBRE)
