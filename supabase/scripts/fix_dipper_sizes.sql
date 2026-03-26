-- Corregir talles duplicados en CAMPERA DIPPER NEGRA y VERDE
-- Problema: "2X", "3X", "4X" son duplicados de "2XL", "3XL", "4XL"
-- Accion: sumar stock de los duplicados a los originales y eliminar los duplicados

-- 1. Sumar stock de "2X" VERDE a "2XL" VERDE (2 + 2 = 4)
UPDATE product_variants
SET stock = stock + 2
WHERE id = '3e5cc6db-1022-45c4-bb98-453c9094119f'; -- 2XL VERDE

-- 2. Eliminar las variantes duplicadas (2X, 3X, 4X)
DELETE FROM product_variants
WHERE id IN (
  '1c0ed3af-e0a4-4eb8-a242-321527599832', -- 2X VERDE (stock transferido a 2XL)
  '3b4089be-d0b0-4ac0-a57b-a64661b99572', -- 2X NEGRA (stock 0)
  '5fac166a-6697-44b3-80e5-36e2fe93a420', -- 3X VERDE (stock 0)
  'b919b4a6-4c42-49db-a49a-663fb84f3b51', -- 3X NEGRA (stock 0)
  '1e539b4a-874e-4434-b90f-b6a57d2b91ae', -- 4X VERDE (stock 0)
  'b5afa2a6-ddd3-4970-8c76-13f4982bf98d'  -- 4X NEGRA (stock 0)
);
