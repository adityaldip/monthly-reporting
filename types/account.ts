export type AccountType = 'cash' | 'bank' | 'credit_card' | 'investment' | 'other';

export interface Account {
  id: string;
  user_id: string;
  name: string;
  type: AccountType;
  account_number?: string;
  currency_id?: string;
  currency?: {
    id: string;
    code: string;
    symbol?: string;
  };
  description?: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface AccountCreate {
  name: string;
  type: AccountType;
  account_number?: string;
  currency_id?: string;
  description?: string;
  is_default?: boolean;
}

export interface AccountUpdate {
  name?: string;
  type?: AccountType;
  account_number?: string;
  currency_id?: string;
  description?: string;
  is_default?: boolean;
}
