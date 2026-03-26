-- =============================================================================
-- MIGRACIÓN: Optimización de Rendimiento (FASE 2)
-- Fecha: 2026-02-26
-- Objetivo: Mejorar los tiempos de respuesta del catálogo (800+ productos)
-- =============================================================================

-- 1. Índices para claves foráneas (Acelera los JOIN con Brands y Categories)
CREATE INDEX IF NOT EXISTS idx_products_brand_id ON public.products(brand_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);

-- 2. Índices para filtros comunes
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_products_is_published ON public.products(is_published) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_products_gender ON public.products(gender);

-- 3. Índices para búsquedas de stock y variantes
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON public.product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_stock ON public.product_variants(stock) WHERE stock > 0;

-- 4. Ínidices para identificación rápida
CREATE INDEX IF NOT EXISTS idx_products_code ON public.products(code);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);

-- 5. Optimización de la función de conteo y búsqueda
-- (Postgres ya optimiza esto, pero los índices arriba son la clave)

ANALYZE public.products;
ANALYZE public.product_variants;
ANALYZE public.brands;
ANALYZE public.categories;
