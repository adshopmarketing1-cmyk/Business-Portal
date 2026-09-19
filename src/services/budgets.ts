import { apiFetch } from '../lib/api';
import { Budget } from '../types/database';

export const getBudgets = async (userId?: string): Promise<Budget[]> => {
  return await apiFetch<Budget[]>('/api/budgets');
};

export const createBudget = async (
  userId: string,
  budgetData: Omit<Budget, 'id' | 'user_id' | 'created_at' | 'updated_at'>
): Promise<Budget> => {
  return await apiFetch<Budget>('/api/budgets', {
    method: 'POST',
    body: JSON.stringify(budgetData),
  });
};

export const updateBudget = async (budgetId: string, updates: Partial<Budget>): Promise<Budget> => {
  return await apiFetch<Budget>(`/api/budgets/${budgetId}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
};

export const deleteBudget = async (budgetId: string): Promise<void> => {
  await apiFetch(`/api/budgets/${budgetId}`, {
    method: 'DELETE',
  });
};
