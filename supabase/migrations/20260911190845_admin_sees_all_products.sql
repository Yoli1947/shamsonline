-- La unica policy de SELECT en products exigia is_active = true AND
-- is_published = true para TODOS, sin excepcion para admin (a diferencia de
-- brands, que ya tenia el patron correcto "publico ve activos, admin ve
-- todo"). Esto dejaba al panel admin ciego a cualquier producto sin publicar
-- (recien sincronizado desde el sistema de ventas, sin fotos todavia) en
-- toda la app: lista de Productos, Stock, filtro de temporadas, etc.
DROP POLICY IF EXISTS "Products are viewable by everyone" ON products;

CREATE POLICY "Public sees active, Admin sees all"
  ON products FOR SELECT
  USING ((is_active = true AND is_published = true) OR public.is_admin());
