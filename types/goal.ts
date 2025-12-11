export interface Goal {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  target_amount: number;
  current_amount: number;
  currency_id: string;
  currency?: {
    id: string;
    code: string;
    name: string;
    exchange_rate: number;
  };
  deadline?: string;
  status: 'active' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
  progress_percentage?: number;
  days_remaining?: number;
}

export interface GoalCreate {
  title: string;
  description?: string;
  target_amount: number;
  current_amount?: number;
  currency_id: string;
  deadline?: string;
}

export interface GoalUpdate {
  title?: string;
  description?: string;
  target_amount?: number;
  current_amount?: number;
  currency_id?: string;
  deadline?: string;
  status?: 'active' | 'completed' | 'cancelled';
}
