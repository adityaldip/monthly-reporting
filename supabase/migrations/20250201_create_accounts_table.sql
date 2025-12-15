-- Create accounts table (per user)
CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('cash', 'bank', 'credit_card', 'investment', 'other')),
  account_number TEXT,
  currency_id UUID REFERENCES currencies(id) ON DELETE SET NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);

-- Create index on user_id and is_default for filtering
CREATE INDEX IF NOT EXISTS idx_accounts_user_default ON accounts(user_id, is_default);

-- Add account_number column if it doesn't exist (for existing tables)
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS account_number TEXT;

-- Enable Row Level Security
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own accounts" ON accounts;
DROP POLICY IF EXISTS "Users can insert own accounts" ON accounts;
DROP POLICY IF EXISTS "Users can update own accounts" ON accounts;
DROP POLICY IF EXISTS "Users can delete own accounts" ON accounts;

-- Create policy: users can view their own accounts
CREATE POLICY "Users can view own accounts" ON accounts
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy: users can insert their own accounts
CREATE POLICY "Users can insert own accounts" ON accounts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policy: users can update their own accounts
CREATE POLICY "Users can update own accounts" ON accounts
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create policy: users can delete their own accounts
CREATE POLICY "Users can delete own accounts" ON accounts
  FOR DELETE
  USING (auth.uid() = user_id);

-- Drop existing trigger if it exists (for idempotency)
DROP TRIGGER IF EXISTS update_accounts_updated_at ON accounts;

-- Create updated_at trigger
CREATE TRIGGER update_accounts_updated_at
  BEFORE UPDATE ON accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
