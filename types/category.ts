export type TransactionType = 'income' | 'outcome';

export interface Category {
  id: string;
  user_id: string;
  type: TransactionType;
  name: string;
  icon?: string;
  color?: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface CategoryCreate {
  type: TransactionType;
  name: string;
  icon?: string;
  color?: string;
  is_default?: boolean;
}

export interface CategoryUpdate {
  type?: TransactionType;
  name?: string;
  icon?: string;
  color?: string;
  is_default?: boolean;
}

