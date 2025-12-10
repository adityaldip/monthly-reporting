export interface Currency {
  id: string;
  user_id: string;
  code: string;
  name: string;
  symbol?: string;
  is_default: boolean;
  exchange_rate: number;
  created_at: string;
  updated_at: string;
}

export interface CurrencyCreate {
  code: string;
  name: string;
  symbol?: string;
  is_default?: boolean;
  exchange_rate?: number;
}

export interface CurrencyUpdate {
  code?: string;
  name?: string;
  symbol?: string;
  is_default?: boolean;
  exchange_rate?: number;
}

