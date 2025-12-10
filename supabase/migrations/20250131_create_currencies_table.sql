-- Create currencies table (per user)
CREATE TABLE IF NOT EXISTS currencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  symbol TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  exchange_rate DECIMAL(15, 6) DEFAULT 1.0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, code)
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_currencies_user_id ON currencies(user_id);

-- Create index on user_id and is_default for default currency lookup
CREATE INDEX IF NOT EXISTS idx_currencies_user_default ON currencies(user_id, is_default);

-- Enable Row Level Security
ALTER TABLE currencies ENABLE ROW LEVEL SECURITY;

-- Create policy: users can view their own currencies
CREATE POLICY "Users can view own currencies" ON currencies
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy: users can insert their own currencies
CREATE POLICY "Users can insert own currencies" ON currencies
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policy: users can update their own currencies
CREATE POLICY "Users can update own currencies" ON currencies
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create policy: users can delete their own currencies
CREATE POLICY "Users can delete own currencies" ON currencies
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE TRIGGER update_currencies_updated_at
  BEFORE UPDATE ON currencies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to ensure only one default currency per user
CREATE OR REPLACE FUNCTION ensure_single_default_currency()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = TRUE THEN
    -- Set all other currencies for this user to not default
    UPDATE currencies
    SET is_default = FALSE
    WHERE user_id = NEW.user_id
      AND id != NEW.id
      AND is_default = TRUE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_single_default_currency_trigger
  BEFORE INSERT OR UPDATE ON currencies
  FOR EACH ROW
  WHEN (NEW.is_default = TRUE)
  EXECUTE FUNCTION ensure_single_default_currency();

