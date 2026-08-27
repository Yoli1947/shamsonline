-- Marca unidades con falla/defecto a nivel de variante, sin borrar el registro de stock.
-- El storefront excluye estas unidades del stock disponible (no se pueden comprar),
-- pero siguen visibles en el admin para que se puedan gestionar (reponer, dar de baja, etc.).
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS has_defect BOOLEAN DEFAULT false;
