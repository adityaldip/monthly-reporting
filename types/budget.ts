export interface Budget {
  id: string;
  user_id: string;
  category_id: string;
  category?: {
    id: string;
    name: string;
    icon?: string;
    color?: string;
    type: 'income' | 'outcome';
  };
  year: number;
  month: number;
  amount: number;
  currency_id: string;
  currency?: {
    id: string;
    code: string;
    name: string;
    symbol?: string;
  };
  alert_threshold: number;
  created_at: string;
  updated_at: string;
  // Computed fields
  spent?: number;
  remaining?: number;
  percentage?: number;
  isExceeded?: boolean;
  isNearLimit?: boolean;
}

export interface BudgetCreate {
  category_id: string;
  year: number;
  month: number;
  amount: number;
  currency_id: string;
  alert_threshold?: number;
}

export interface BudgetUpdate {
  category_id?: string;
  year?: number;
  month?: number;
  amount?: number;
  currency_id?: string;
  alert_threshold?: number;
}

