-- Function to insert default currencies for a new user
CREATE OR REPLACE FUNCTION insert_default_currencies_for_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert default currencies when a new user is created
  INSERT INTO currencies (user_id, code, name, symbol, is_default, exchange_rate)
  VALUES
    (NEW.id, 'IDR', 'Rupiah Indonesia', 'Rp', TRUE, 1.0),
    (NEW.id, 'USD', 'US Dollar', '$', FALSE, 1.0),
    (NEW.id, 'EUR', 'Euro', '€', FALSE, 1.0),
    (NEW.id, 'SGD', 'Singapore Dollar', 'S$', FALSE, 1.0);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create default currencies when user is created
CREATE TRIGGER create_default_currencies_on_user_create
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION insert_default_currencies_for_user();

