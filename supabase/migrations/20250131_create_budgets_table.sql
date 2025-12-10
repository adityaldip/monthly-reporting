-- Create budgets table (per user, per category, per month)
CREATE TABLE IF NOT EXISTS budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  amount DECIMAL(15, 2) NOT NULL CHECK (amount >= 0),
  currency_id UUID NOT NULL REFERENCES currencies(id) ON DELETE CASCADE,
  alert_threshold DECIMAL(5, 2) DEFAULT 80.0 CHECK (alert_threshold >= 0 AND alert_threshold <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, category_id, year, month)
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON budgets(user_id);

-- Create index on user_id, year, month for period lookups
CREATE INDEX IF NOT EXISTS idx_budgets_user_period ON budgets(user_id, year, month);

-- Create index on category_id for category lookups
CREATE INDEX IF NOT EXISTS idx_budgets_category_id ON budgets(category_id);

-- Enable Row Level Security
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

-- Create policy: users can view their own budgets
CREATE POLICY "Users can view own budgets" ON budgets
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy: users can insert their own budgets
CREATE POLICY "Users can insert own budgets" ON budgets
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policy: users can update their own budgets
CREATE POLICY "Users can update own budgets" ON budgets
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create policy: users can delete their own budgets
CREATE POLICY "Users can delete own budgets" ON budgets
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE TRIGGER update_budgets_updated_at
  BEFORE UPDATE ON budgets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

