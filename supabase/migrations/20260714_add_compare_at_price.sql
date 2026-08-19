-- Precio de lista original para mostrar tachado cuando el producto está en SALE.
-- El sync externo llena price (vigente, ya con el SALE aplicado) y compare_at_price
-- (original, null si no está en oferta). No reemplaza a sale_price/is_on_sale, que
-- siguen siendo un mecanismo aparte (precio especial por transferencia).
ALTER TABLE products ADD COLUMN IF NOT EXISTS compare_at_price DECIMAL(12, 2);
