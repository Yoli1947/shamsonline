-- Script para verificar y actualizar el género de productos PERRAMUS
-- Ejecutar en Supabase SQL Editor

-- 1. Ver productos de PERRAMUS y su género actual
SELECT 
    p.id,
    p.name,
    p.gender,
    p.features,
    b.name as brand_name
FROM products p
JOIN brands b ON p.brand_id = b.id
WHERE b.name = 'PERRAMUS'
ORDER BY p.name;

-- 2. Actualizar productos de PERRAMUS que no tienen género
-- IMPORTANTE: Revisa los resultados del query anterior antes de ejecutar esto

-- Ejemplo: Si quieres marcar ciertos productos como "Hombre"
-- UPDATE products 
-- SET gender = 'Hombre'
-- WHERE brand_id = (SELECT id FROM brands WHERE name = 'PERRAMUS')
-- AND name ILIKE '%hombre%';

-- Ejemplo: Si quieres marcar ciertos productos como "Mujer"
-- UPDATE products 
-- SET gender = 'Mujer'
-- WHERE brand_id = (SELECT id FROM brands WHERE name = 'PERRAMUS')
-- AND name ILIKE '%mujer%';

-- Ejemplo: Si quieres marcar todos como "Unisex" por defecto
-- UPDATE products 
-- SET gender = 'Unisex'
-- WHERE brand_id = (SELECT id FROM brands WHERE name = 'PERRAMUS')
-- AND gender IS NULL;

-- 3. Verificar los cambios
SELECT 
    p.id,
    p.name,
    p.gender,
    p.features,
    b.name as brand_name
FROM products p
JOIN brands b ON p.brand_id = b.id
WHERE b.name = 'PERRAMUS'
ORDER BY p.gender, p.name;
