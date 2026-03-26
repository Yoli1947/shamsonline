
-- SOLUCIÓN PARA PRODUCTO ANZED CAMEL
-- Este script borra las variantes incorrectas de color "Negro" 
-- que se filtraron en el producto "ANZED CAMEL".

DELETE FROM product_variants 
WHERE product_id = '72345ef2-cae0-4073-9d23-fd76b2931bdf' 
AND color = 'Negro';

-- Verificación:
SELECT * FROM product_variants 
WHERE product_id = '72345ef2-cae0-4073-9d23-fd76b2931bdf';
