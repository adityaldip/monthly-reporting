-- Create goals table (per user)
CREATE TABLE IF NOT EXISTS goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  target_amount DECIMAL(15, 2) NOT NULL CHECK (target_amount > 0),
  current_amount DECIMAL(15, 2) DEFAULT 0 CHECK (current_amount >= 0),
  currency_id UUID NOT NULL REFERENCES currencies(id) ON DELETE CASCADE,
  deadline DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);

-- Create index on user_id and status for filtering
CREATE INDEX IF NOT EXISTS idx_goals_user_status ON goals(user_id, status);

-- Create index on deadline for sorting
CREATE INDEX IF NOT EXISTS idx_goals_deadline ON goals(deadline);

-- Enable Row Level Security
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

-- Create policy: users can view their own goals
CREATE POLICY "Users can view own goals" ON goals
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy: users can insert their own goals
CREATE POLICY "Users can insert own goals" ON goals
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policy: users can update their own goals
CREATE POLICY "Users can update own goals" ON goals
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create policy: users can delete their own goals
CREATE POLICY "Users can delete own goals" ON goals
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE TRIGGER update_goals_updated_at
  BEFORE UPDATE ON goals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
