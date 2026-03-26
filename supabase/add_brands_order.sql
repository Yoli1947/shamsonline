
-- AGREGAR ORDEN A MARCAS
-- Ejecuta este script en el Editor SQL de Supabase

-- 1. Agregar columna sort_order a la tabla brands
ALTER TABLE brands ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- 2. Asegurarse de que el usuario tenga permisos (si es necesario)
-- Generalmente si ya puedes editar marcas, esto funcionará.
