export type PaymentMethod = 'Cash' | 'UPI' | 'Credit Card' | 'Debit Card' | 'Bank Transfer' | 'Other';
export type PaymentStatus = 'paid' | 'pending' | 'partially_paid' | 'cancelled';
export type ClientStatus = 'active' | 'inactive';

export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  company_name: string | null;
  phone: string | null;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  user_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  total_amount: number;
  paid_amount: number;
  balance_amount: number;
  status: ClientStatus;
  created_at: string;
  updated_at: string;
}

export interface Expense {
  id: string;
  user_id: string;
  amount: number;
  category: string;
  description: string | null;
  date: string;
  payment_method: PaymentMethod;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Income {
  id: string;
  user_id: string;
  client_id: string | null;
  amount: number;
  description: string | null;
  date: string;
  payment_status: PaymentStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  client?: Client | null;
}

export interface Budget {
  id: string;
  user_id: string;
  category: string;
  budget_amount: number;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface DashboardMetrics {
  totalExpenses: number;
  totalIncoming: number;
  totalClientBalance: number;
  totalBudget: number;
  budgetUsed: number;
  remainingBudget: number;
}
