-- Update transactions table to make category and currency nullable
-- Since we're now using category_id and currency_id

-- Drop old constraints first
ALTER TABLE transactions
  DROP CONSTRAINT IF EXISTS valid_income_category,
  DROP CONSTRAINT IF EXISTS check_category_format,
  DROP CONSTRAINT IF EXISTS check_currency_format;

-- Make columns nullable
ALTER TABLE transactions
  ALTER COLUMN category DROP NOT NULL,
  ALTER COLUMN currency DROP NOT NULL;

-- New constraint: must have either category_id OR category (not both null)
ALTER TABLE transactions
  ADD CONSTRAINT check_category_format CHECK (
    (category_id IS NOT NULL) OR
    (category IS NOT NULL)
  );

-- New constraint: must have either currency_id OR currency (not both null)
ALTER TABLE transactions
  ADD CONSTRAINT check_currency_format CHECK (
    (currency_id IS NOT NULL) OR
    (currency IS NOT NULL)
  );

