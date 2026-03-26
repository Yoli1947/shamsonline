-- ============================================================
-- 🔥 RESET TOTAL DE PRODUCTOS Y STOCK 🔥
-- ¡ADVERTENCIA! Este script borrará TODOS los productos, 
-- variantes e imágenes de la base de datos.
-- ============================================================

-- 1. Desactivar temporalmente restricciones si fuera necesario (opcional)
-- SET session_replication_role = 'replica';

-- 2. Borrar productos (esto borrará variantes e imágenes por CASCADE)
DELETE FROM public.product_variants;
DELETE FROM public.product_images;
DELETE FROM public.products;

-- 3. Opcional: Borrar Marcas y Categorías si quieres empezar de cero
-- DELETE FROM public.brands;
-- DELETE FROM public.categories;

-- 4. Volver a activar restricciones
-- SET session_replication_role = 'origin';

-- NOTA: Si tienes pedidos (orders), es posible que no te deje borrar 
-- productos que estén vinculados a un pedido. En ese caso, deberías
-- decidir si borrar los pedidos también o marcarlos como inactivos.
