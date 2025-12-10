-- Create recurring_transactions table
CREATE TABLE IF NOT EXISTS recurring_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(10) NOT NULL CHECK (type IN ('income', 'outcome')),
  amount DECIMAL(15, 2) NOT NULL,
  currency_id UUID REFERENCES currencies(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  description TEXT,
  frequency VARCHAR(20) NOT NULL CHECK (frequency IN ('weekly', 'monthly')),
  start_date DATE NOT NULL,
  end_date DATE, -- NULL means no end date
  next_date DATE NOT NULL, -- Next date to create transaction
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Legacy fields for backward compatibility
  currency VARCHAR(10),
  category VARCHAR(50)
);

-- Create index on user_id and next_date for faster lookups
CREATE INDEX IF NOT EXISTS idx_recurring_transactions_user ON recurring_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_transactions_next_date ON recurring_transactions(next_date);
CREATE INDEX IF NOT EXISTS idx_recurring_transactions_active ON recurring_transactions(user_id, is_active, next_date);

-- Enable Row Level Security
ALTER TABLE recurring_transactions ENABLE ROW LEVEL SECURITY;

-- Create policy: users can view their own recurring transactions
CREATE POLICY "Users can view own recurring transactions" ON recurring_transactions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy: users can insert their own recurring transactions
CREATE POLICY "Users can insert own recurring transactions" ON recurring_transactions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policy: users can update their own recurring transactions
CREATE POLICY "Users can update own recurring transactions" ON recurring_transactions
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create policy: users can delete their own recurring transactions
CREATE POLICY "Users can delete own recurring transactions" ON recurring_transactions
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE TRIGGER update_recurring_transactions_updated_at
  BEFORE UPDATE ON recurring_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

