-- Permite elegir a mano qué productos aparecen en "Nuestros Elegidos en Sale"
-- en vez de que se arme solo con cualquier producto que tenga descuento.
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_sale_pick BOOLEAN DEFAULT false;
