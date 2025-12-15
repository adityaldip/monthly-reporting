-- Add account_id column to transactions table
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES accounts(id) ON DELETE SET NULL;

-- Create index for account_id
CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions(account_id);
