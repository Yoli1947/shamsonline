-- ============================================================
-- 🔥 SUPRA FIX PERMISSIONS - TIENDA SHAMS 🔥
-- Ejecuta este script completo en el SQL Editor de Supabase
-- ============================================================

-- 1. ASEGURAR COLUMNAS EXTENDIDAS EN PRODUCTS
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='sku') THEN
        ALTER TABLE products ADD COLUMN sku TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='code') THEN
        ALTER TABLE products ADD COLUMN code TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='cost_price') THEN
        ALTER TABLE products ADD COLUMN cost_price DECIMAL(12, 2) DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='provider_sku') THEN
        ALTER TABLE products ADD COLUMN provider_sku TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='season') THEN
        ALTER TABLE products ADD COLUMN season TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='provider') THEN
        ALTER TABLE products ADD COLUMN provider TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='size_type') THEN
        ALTER TABLE products ADD COLUMN size_type TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='sub_family') THEN
        ALTER TABLE products ADD COLUMN sub_family TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='gender') THEN
        ALTER TABLE products ADD COLUMN gender TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='observations') THEN
        ALTER TABLE products ADD COLUMN observations TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='external_url') THEN
        ALTER TABLE products ADD COLUMN external_url TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='is_published') THEN
        ALTER TABLE products ADD COLUMN is_published BOOLEAN DEFAULT true;
    END IF;
END $$;

-- 2. TABLA DE CURVAS DE TALLES (POR SI NO EXISTE)
CREATE TABLE IF NOT EXISTS public.size_curves (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    sizes TEXT[] NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. PERMISOS DE TABLAS (GRANT)
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 4. POLÍTICAS DE RLS - LIMPIEZA Y CREACIÓN
-- Función auxiliar para limpiar políticas rápidamente
DO $$ 
DECLARE
    table_name_var TEXT;
    policy_name_var TEXT;
BEGIN
    FOR table_name_var IN SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    LOOP
        FOR policy_name_var IN SELECT policyname FROM pg_policies WHERE tablename = table_name_var AND schemaname = 'public'
        LOOP
            EXECUTE format('DROP POLICY IF EXISTS %I ON %I', policy_name_var, table_name_var);
        END LOOP;
    END LOOP;
END $$;

-- 4a. Políticas de LECTURA (Públicas)
CREATE POLICY "Lectura publica brands" ON brands FOR SELECT USING (true);
CREATE POLICY "Lectura publica categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Lectura publica products" ON products FOR SELECT USING (true);
CREATE POLICY "Lectura publica product_images" ON product_images FOR SELECT USING (true);
CREATE POLICY "Lectura publica product_variants" ON product_variants FOR SELECT USING (true);
CREATE POLICY "Lectura publica size_curves" ON size_curves FOR SELECT USING (true);
CREATE POLICY "Lectura publica site_settings" ON site_settings FOR SELECT USING (true);

-- 4b. Políticas de ESCRITURA (Solo Admin/Autenticado)
CREATE POLICY "Admin full access brands" ON brands FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access categories" ON categories FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access products" ON products FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access product_images" ON product_images FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access product_variants" ON product_variants FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access size_curves" ON size_curves FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 5. STORAGE FIXED (Buckets y Policies)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('products', 'products', true) 
ON CONFLICT (id) DO UPDATE SET public = true;

CREATE POLICY "Storage Select" ON storage.objects FOR SELECT USING (bucket_id = 'products');
CREATE POLICY "Storage Insert Admin" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'products');
CREATE POLICY "Storage Update Admin" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'products');
CREATE POLICY "Storage Delete Admin" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'products');

-- Finalizado
COMMIT;
