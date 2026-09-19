import { apiFetch } from '../lib/api';
import { Expense } from '../types/database';

export const getExpenses = async (userId?: string, search?: string, category?: string): Promise<Expense[]> => {
  let expenses = await apiFetch<Expense[]>('/api/expenses');

  if (category && category !== 'all') {
    expenses = expenses.filter(e => e.category === category);
  }

  if (search && search.trim() !== '') {
    const q = search.toLowerCase();
    expenses = expenses.filter(e => 
      (e.description && e.description.toLowerCase().includes(q)) ||
      (e.category && e.category.toLowerCase().includes(q)) ||
      (e.notes && e.notes.toLowerCase().includes(q))
    );
  }

  return expenses;
};

export const createExpense = async (userId: string, expense: Omit<Expense, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Expense> => {
  return await apiFetch<Expense>('/api/expenses', {
    method: 'POST',
    body: JSON.stringify(expense),
  });
};

export const updateExpense = async (expenseId: string, updates: Partial<Expense>): Promise<Expense> => {
  return await apiFetch<Expense>(`/api/expenses/${expenseId}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
};

export const deleteExpense = async (expenseId: string): Promise<void> => {
  await apiFetch(`/api/expenses/${expenseId}`, {
    method: 'DELETE',
  });
};
