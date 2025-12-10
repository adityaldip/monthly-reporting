-- Function to insert default categories for a new user
CREATE OR REPLACE FUNCTION insert_default_categories_for_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert default income categories
  INSERT INTO categories (user_id, type, name, is_default)
  VALUES
    (NEW.id, 'income', 'Gaji', TRUE),
    (NEW.id, 'income', 'Bonus', FALSE),
    (NEW.id, 'income', 'Freelance', FALSE),
    (NEW.id, 'income', 'Investasi', FALSE),
    (NEW.id, 'income', 'Hadiah', FALSE),
    (NEW.id, 'income', 'Pendapatan Lainnya', FALSE);
  
  -- Insert default outcome categories
  INSERT INTO categories (user_id, type, name, is_default)
  VALUES
    (NEW.id, 'outcome', 'Belanja', TRUE),
    (NEW.id, 'outcome', 'Pajak', FALSE),
    (NEW.id, 'outcome', 'Makanan', FALSE),
    (NEW.id, 'outcome', 'Transportasi', FALSE),
    (NEW.id, 'outcome', 'Tagihan', FALSE),
    (NEW.id, 'outcome', 'Hiburan', FALSE),
    (NEW.id, 'outcome', 'Kesehatan', FALSE),
    (NEW.id, 'outcome', 'Pendidikan', FALSE),
    (NEW.id, 'outcome', 'Perumahan', FALSE),
    (NEW.id, 'outcome', 'Pengeluaran Lainnya', FALSE);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create default categories when user is created
CREATE TRIGGER create_default_categories_on_user_create
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION insert_default_categories_for_user();

