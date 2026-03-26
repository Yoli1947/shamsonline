-- =============================================================================
-- MIGRACIÓN: RLS policies correctas — solo admins pueden modificar datos
-- Fecha: 2026-02-26
-- Problema: Las policies anteriores usaban USING (true) o solo verificaban
--           que el usuario estuviera autenticado, permitiendo a cualquier
--           cliente registrado editar/borrar productos, marcas y categorías.
-- Solución: Función is_admin() que verifica la tabla user_roles por UUID.
-- =============================================================================

-- 1. Función auxiliar para verificar si el usuario actual es admin
-- Usa SECURITY DEFINER para poder leer user_roles sin exponer la tabla
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'admin'
  );
$$;

-- Otorgar permiso de ejecución a usuarios autenticados
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;


-- =============================================================================
-- 2. PRODUCTS — solo lectura pública, escritura solo admin
-- =============================================================================
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON products;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON products;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON products;
DROP POLICY IF EXISTS "Admins can insert products" ON products;
DROP POLICY IF EXISTS "Admins can update products" ON products;
DROP POLICY IF EXISTS "Admins can delete products" ON products;

CREATE POLICY "Admins can insert products"
  ON products FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update products"
  ON products FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete products"
  ON products FOR DELETE TO authenticated
  USING (public.is_admin());


-- =============================================================================
-- 3. PRODUCT_VARIANTS — solo lectura pública, escritura solo admin
-- =============================================================================
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON product_variants;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON product_variants;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON product_variants;
DROP POLICY IF EXISTS "Admins can insert product_variants" ON product_variants;
DROP POLICY IF EXISTS "Admins can update product_variants" ON product_variants;
DROP POLICY IF EXISTS "Admins can delete product_variants" ON product_variants;

CREATE POLICY "Admins can insert product_variants"
  ON product_variants FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update product_variants"
  ON product_variants FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete product_variants"
  ON product_variants FOR DELETE TO authenticated
  USING (public.is_admin());


-- =============================================================================
-- 4. PRODUCT_IMAGES — solo lectura pública, escritura solo admin
-- =============================================================================
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON product_images;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON product_images;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON product_images;
DROP POLICY IF EXISTS "Admins can insert product_images" ON product_images;
DROP POLICY IF EXISTS "Admins can update product_images" ON product_images;
DROP POLICY IF EXISTS "Admins can delete product_images" ON product_images;

CREATE POLICY "Admins can insert product_images"
  ON product_images FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update product_images"
  ON product_images FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete product_images"
  ON product_images FOR DELETE TO authenticated
  USING (public.is_admin());


-- =============================================================================
-- 5. BRANDS — solo lectura pública, escritura solo admin
-- =============================================================================
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON brands;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON brands;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON brands;
DROP POLICY IF EXISTS "Admins can manage brands" ON brands;
DROP POLICY IF EXISTS "Admins can insert brands" ON brands;
DROP POLICY IF EXISTS "Admins can update brands" ON brands;
DROP POLICY IF EXISTS "Admins can delete brands" ON brands;

CREATE POLICY "Admins can insert brands"
  ON brands FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update brands"
  ON brands FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete brands"
  ON brands FOR DELETE TO authenticated
  USING (public.is_admin());


-- =============================================================================
-- 6. CATEGORIES — solo lectura pública, escritura solo admin
-- =============================================================================
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON categories;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON categories;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON categories;
DROP POLICY IF EXISTS "Admins can insert categories" ON categories;
DROP POLICY IF EXISTS "Admins can update categories" ON categories;
DROP POLICY IF EXISTS "Admins can delete categories" ON categories;

CREATE POLICY "Admins can insert categories"
  ON categories FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update categories"
  ON categories FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete categories"
  ON categories FOR DELETE TO authenticated
  USING (public.is_admin());


-- =============================================================================
-- 7. SITE_SETTINGS — lectura pública, escritura solo admin
-- =============================================================================
DROP POLICY IF EXISTS "Admins can update site_settings" ON site_settings;
DROP POLICY IF EXISTS "Admins can insert site_settings" ON site_settings;

CREATE POLICY "Admins can insert site_settings"
  ON site_settings FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update site_settings"
  ON site_settings FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- =============================================================================
-- VERIFICACIÓN: ejecutar estas queries para confirmar que funciona
-- =============================================================================
-- SELECT public.is_admin();  -- debe retornar true si estás logueado como admin
-- Con un usuario cliente: SELECT public.is_admin();  -- debe retornar false
