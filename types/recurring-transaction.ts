export type RecurringFrequency = 'weekly' | 'monthly';

export interface RecurringTransaction {
  id: string;
  user_id: string;
  type: 'income' | 'outcome';
  amount: number;
  currency_id?: string;
  category_id?: string;
  description?: string;
  frequency: RecurringFrequency;
  start_date: string;
  end_date?: string;
  next_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Legacy fields
  currency?: string;
  category?: string;
  // Joined data
  currency_data?: {
    id: string;
    code: string;
    name: string;
    symbol?: string;
  };
  category_data?: {
    id: string;
    name: string;
    icon?: string;
    color?: string;
    type: 'income' | 'outcome';
  };
}

export interface RecurringTransactionCreate {
  type: 'income' | 'outcome';
  amount: number;
  currency_id?: string;
  category_id?: string;
  description?: string;
  frequency: RecurringFrequency;
  start_date: string;
  end_date?: string;
}

export interface RecurringTransactionUpdate {
  type?: 'income' | 'outcome';
  amount?: number;
  currency_id?: string;
  category_id?: string;
  description?: string;
  frequency?: RecurringFrequency;
  start_date?: string;
  end_date?: string;
  next_date?: string;
  is_active?: boolean;
}

