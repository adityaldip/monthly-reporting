export type TransactionType = 'income' | 'outcome';

// Legacy currency codes (for backward compatibility)
export type LegacyCurrency = 'IDR' | 'USD' | 'EUR' | 'SGD' | 'MYR' | 'JPY' | 'CNY' | 'GBP' | 'AUD' | 'CAD';

// Legacy categories (for backward compatibility)
export type IncomeCategory = 'salary' | 'bonus' | 'freelance' | 'investment' | 'gift' | 'other_income';
export type OutcomeCategory = 'shopping' | 'tax' | 'food' | 'transport' | 'bills' | 'entertainment' | 'health' | 'education' | 'housing' | 'other_outcome';
export type TransactionCategory = IncomeCategory | OutcomeCategory;

export interface Transaction {
  id: string;
  user_id: string;
  type: TransactionType;
  amount: number;
  // Legacy fields (for backward compatibility)
  currency?: LegacyCurrency;
  category?: TransactionCategory;
  // New fields (using foreign keys)
  currency_id?: string;
  category_id?: string;
  account_id?: string;
  description?: string;
  date: string;
  created_at: string;
  updated_at: string;
  // Enriched data (from joins)
  account?: {
    id: string;
    name: string;
    account_number?: string;
    type: string;
  };
}

export interface TransactionCreate {
  type: TransactionType;
  amount: number;
  // Use either legacy format or new format
  currency?: LegacyCurrency;
  category?: TransactionCategory;
  currency_id?: string;
  category_id?: string;
  account_id?: string;
  description?: string;
  date: string;
}

export interface TransactionUpdate {
  type?: TransactionType;
  amount?: number;
  currency?: LegacyCurrency;
  currency_id?: string;
  description?: string;
  category?: TransactionCategory;
  category_id?: string;
  account_id?: string;
  date?: string;
}

// Helper to get valid categories based on type
export const getIncomeCategories = (): IncomeCategory[] => [
  'salary',
  'bonus',
  'freelance',
  'investment',
  'gift',
  'other_income',
];

export const getOutcomeCategories = (): OutcomeCategory[] => [
  'shopping',
  'tax',
  'food',
  'transport',
  'bills',
  'entertainment',
  'health',
  'education',
  'housing',
  'other_outcome',
];

// Category labels in Indonesian
export const categoryLabels: Record<TransactionCategory, string> = {
  // Income
  salary: 'Gaji',
  bonus: 'Bonus',
  freelance: 'Freelance',
  investment: 'Investasi',
  gift: 'Hadiah',
  other_income: 'Pendapatan Lainnya',
  // Outcome
  shopping: 'Belanja',
  tax: 'Pajak',
  food: 'Makanan',
  transport: 'Transportasi',
  bills: 'Tagihan',
  entertainment: 'Hiburan',
  health: 'Kesehatan',
  education: 'Pendidikan',
  housing: 'Perumahan',
  other_outcome: 'Pengeluaran Lainnya',
};

