import { apiFetch } from '../lib/api';
import { Income } from '../types/database';

export const getIncome = async (userId?: string): Promise<Income[]> => {
  return await apiFetch<Income[]>('/api/income');
};

export const createIncome = async (
  userId: string,
  incomeData: Omit<Income, 'id' | 'user_id' | 'created_at' | 'updated_at'>
): Promise<Income> => {
  return await apiFetch<Income>('/api/income', {
    method: 'POST',
    body: JSON.stringify(incomeData),
  });
};

export const updateIncome = async (incomeId: string, updates: Partial<Income>): Promise<Income> => {
  return await apiFetch<Income>(`/api/income/${incomeId}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
};

export const deleteIncome = async (incomeId: string): Promise<void> => {
  await apiFetch(`/api/income/${incomeId}`, {
    method: 'DELETE',
  });
};
