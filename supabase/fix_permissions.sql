-- 1. Función para saber si el usuario es Admin
create or replace function public.is_admin()
returns boolean as $$
begin
  return (auth.jwt() ->> 'email') = 'admin@estudio.com.ar';
end;
$$ language plpgsql security definer;

-- 2. Habilitar permisos de escritura para el Admin en todas las tablas clave
-- Products
create policy "Admin insert products" on products for insert with check (is_admin());
create policy "Admin update products" on products for update using (is_admin());
create policy "Admin delete products" on products for delete using (is_admin());

-- Variants
create policy "Admin insert variants" on product_variants for insert with check (is_admin());
create policy "Admin update variants" on product_variants for update using (is_admin());
create policy "Admin delete variants" on product_variants for delete using (is_admin());

-- Images
create policy "Admin insert images" on product_images for insert with check (is_admin());
create policy "Admin update images" on product_images for update using (is_admin());
create policy "Admin delete images" on product_images for delete using (is_admin());

-- Brands
create policy "Admin insert brands" on brands for insert with check (is_admin());
create policy "Admin update brands" on brands for update using (is_admin());
create policy "Admin delete brands" on brands for delete using (is_admin());

-- Categories
create policy "Admin insert categories" on categories for insert with check (is_admin());
create policy "Admin update categories" on categories for update using (is_admin());
create policy "Admin delete categories" on categories for delete using (is_admin());
