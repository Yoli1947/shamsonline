
-- ========================================================
-- LIMPIEZA DE FOTO PRINCIPAL PARA GAITHER
-- ========================================================

-- El producto tiene la URL en la tabla 'products', lo que pisa a la galería.
-- La borramos de ahí para que desaparezca de la web.

UPDATE public.products 
SET image_url = NULL 
WHERE code = 'P11201513C' OR name ILIKE '%GAITHER%';
