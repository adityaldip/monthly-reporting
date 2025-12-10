-- Update transactions table to use foreign keys for currency and category
-- First, add new columns for foreign keys
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS currency_id UUID REFERENCES currencies(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id) ON DELETE SET NULL;

-- Create indexes for foreign keys
CREATE INDEX IF NOT EXISTS idx_transactions_currency_id ON transactions(currency_id);
CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON transactions(category_id);

-- Migrate existing data: Keep old currency and category columns for backward compatibility
-- But new transactions should use currency_id and category_id

-- Update constraint to allow either old format (currency, category) or new format (currency_id, category_id)
-- For now, we'll keep both for migration period
-- You can drop the old columns later after migration is complete

-- Add check constraint to ensure either old or new format is used
ALTER TABLE transactions
  ADD CONSTRAINT check_currency_format CHECK (
    (currency IS NOT NULL AND currency_id IS NULL) OR
    (currency IS NULL AND currency_id IS NOT NULL) OR
    (currency IS NOT NULL AND currency_id IS NOT NULL)
  );

ALTER TABLE transactions
  ADD CONSTRAINT check_category_format CHECK (
    (category IS NOT NULL AND category_id IS NULL) OR
    (category IS NULL AND category_id IS NOT NULL) OR
    (category IS NOT NULL AND category_id IS NOT NULL)
  );

