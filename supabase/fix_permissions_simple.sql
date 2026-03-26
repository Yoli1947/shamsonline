-- SOLUCIÓN DEFINITIVA PARA ERROR RLS (PERMISOS)
-- Este script permite que CUALQUIER usuario que haya iniciado sesión (authenticated) pueda crear/editar productos.
-- Es más permisivo y solucionará el error "new row violates row-level security policy" inmediatamente.

-- 1. Habilitar permisos para tabla PRODUCTS
create policy "Enable insert for authenticated users" on products for insert to authenticated with check (true);
create policy "Enable update for authenticated users" on products for update to authenticated using (true);
create policy "Enable delete for authenticated users" on products for delete to authenticated using (true);

-- 2. Habilitar permisos para VARIANTS
create policy "Enable insert for authenticated variants" on product_variants for insert to authenticated with check (true);
create policy "Enable update for authenticated variants" on product_variants for update to authenticated using (true);
create policy "Enable delete for authenticated variants" on product_variants for delete to authenticated using (true);

-- 3. Habilitar permisos para IMAGES (tablas de DB y Storage)
create policy "Enable insert for authenticated images" on product_images for insert to authenticated with check (true);
create policy "Enable update for authenticated images" on product_images for update to authenticated using (true);
create policy "Enable delete for authenticated images" on product_images for delete to authenticated using (true);

-- STORAGE BUCKETS (Por si acaso falla la subida de imagen también)
-- Asegúrate de que el bucket 'products' sea público o tenga estas policies:
-- (Esto se configura idealmente en la UI de Storage, pero si tienes SQL permission...):
insert into storage.buckets (id, name, public) values ('products', 'products', true) on conflict (id) do nothing;

create policy "Authenticated can upload images" on storage.objects for insert to authenticated with check (bucket_id = 'products');
create policy "Authenticated can update images" on storage.objects for update to authenticated using (bucket_id = 'products');

-- 4. BRANDS & CATEGORIES
create policy "Enable all for authenticated brands" on brands for all to authenticated using (true);
create policy "Enable all for authenticated categories" on categories for all to authenticated using (true);
