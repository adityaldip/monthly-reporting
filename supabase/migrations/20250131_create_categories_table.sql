-- Create categories table (per user)
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('income', 'outcome')),
  name TEXT NOT NULL,
  icon TEXT,
  color TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, type, name)
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);

-- Create index on user_id and type for filtering
CREATE INDEX IF NOT EXISTS idx_categories_user_type ON categories(user_id, type);

-- Enable Row Level Security
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Create policy: users can view their own categories
CREATE POLICY "Users can view own categories" ON categories
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy: users can insert their own categories
CREATE POLICY "Users can insert own categories" ON categories
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policy: users can update their own categories
CREATE POLICY "Users can update own categories" ON categories
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create policy: users can delete their own categories
CREATE POLICY "Users can delete own categories" ON categories
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

