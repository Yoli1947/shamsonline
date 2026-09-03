-- Agrega los campos que necesita el flujo de Gift Cards (GiftCardPage.tsx / mp-webhook)
-- para guardar quién la regala, quién la recibe y el mensaje. Sin esto, order_items
-- no tenía dónde guardar esos datos y se perdían silenciosamente antes de llegar
-- a EchoGiftCard. Todas las columnas son nullable: no afecta filas existentes.

ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS type text,
  ADD COLUMN IF NOT EXISTS product_type text,
  ADD COLUMN IF NOT EXISTS is_gift boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS recipient_name text,
  ADD COLUMN IF NOT EXISTS recipient_phone text,
  ADD COLUMN IF NOT EXISTS recipient_email text,
  ADD COLUMN IF NOT EXISTS sender_name text,
  ADD COLUMN IF NOT EXISTS message text,
  ADD COLUMN IF NOT EXISTS scheduled_send_at timestamptz;
