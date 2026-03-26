-- Create Gift Cards table
CREATE TABLE IF NOT EXISTS public.gift_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    amount NUMERIC NOT NULL,
    sender_name TEXT NOT NULL,
    sender_email TEXT NOT NULL,
    recipient_name TEXT NOT NULL,
    recipient_email TEXT NOT NULL,
    message TEXT,
    status TEXT DEFAULT 'pending', -- pending, active, used, expired
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.gift_cards ENABLE ROW LEVEL SECURITY;

-- Policies
-- 1. Anyone can insert (to buy a gift card)
CREATE POLICY "Anyone can create gift cards" ON public.gift_cards
    FOR INSERT WITH CHECK (true);

-- 2. Anyone can select (to validate/check balance)
CREATE POLICY "Anyone can view gift cards" ON public.gift_cards
    FOR SELECT USING (true);

-- 3. Only admins can update/delete
-- We rely on the existing user_roles table or admin logic
CREATE POLICY "Only admins can manage gift cards" ON public.gift_cards
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_roles.user_id = auth.uid() 
            AND user_roles.role = 'admin'
        )
    );

-- Function to trigger update_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_gift_cards_updated_at
    BEFORE UPDATE ON public.gift_cards
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
