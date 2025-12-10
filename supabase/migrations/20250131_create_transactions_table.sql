-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('income', 'outcome')),
  amount DECIMAL(15, 2) NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'IDR',
  description TEXT,
  category TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_income_category CHECK (
    (type = 'income' AND category IN ('salary', 'bonus', 'freelance', 'investment', 'gift', 'other_income')) OR
    (type = 'outcome' AND category IN ('shopping', 'tax', 'food', 'transport', 'bills', 'entertainment', 'health', 'education', 'housing', 'other_outcome'))
  )
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);

-- Create index on date for faster date range queries
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);

-- Create index on type for filtering income/outcome
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);

-- Create index on currency for currency filtering
CREATE INDEX IF NOT EXISTS idx_transactions_currency ON transactions(currency);

-- Create index on category for category filtering
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);

-- Create composite index for user and date (common query pattern)
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, date DESC);

-- Enable Row Level Security
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Create policy: users can only see their own transactions
CREATE POLICY "Users can view own transactions" ON transactions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy: users can insert their own transactions
CREATE POLICY "Users can insert own transactions" ON transactions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policy: users can update their own transactions
CREATE POLICY "Users can update own transactions" ON transactions
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create policy: users can delete their own transactions
CREATE POLICY "Users can delete own transactions" ON transactions
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

