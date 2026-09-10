-- Permite elegir a mano qué productos aparecen en "Anticipo SS27".
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_anticipo_ss27 BOOLEAN DEFAULT false;
