-- Actualización de esquema para Tienda Shams
-- Agregando campos extendidos a la tabla de productos

ALTER TABLE products ADD COLUMN IF NOT EXISTS sku TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS provider_sku TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS season TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS provider TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS size_type TEXT; -- Tipo de talle (Curva)
ALTER TABLE products ADD COLUMN IF NOT EXISTS sub_family TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS cost_price DECIMAL(10, 2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS observations TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS external_url TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT true;

-- Asegurar que los nombres sean únicos si se desea
-- CREATE UNIQUE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
