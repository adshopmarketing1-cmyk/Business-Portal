import { supabase } from '../lib/supabase';
import { Expense } from '../types/database';

export const getExpenses = async (userId: string, search?: string, category?: string): Promise<Expense[]> => {
  let query = supabase
    .from('expenses')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false });

  if (category && category !== 'all') {
    query = query.eq('category', category);
  }

  if (search) {
    query = query.or(`description.ilike.%${search}%,category.ilike.%${search}%,notes.ilike.%${search}%`);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Error fetching expenses:', error);
    throw new Error(error.message);
  }
  return data as Expense[];
};

export const createExpense = async (userId: string, expense: Omit<Expense, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Expense> => {
  const { data, error } = await supabase
    .from('expenses')
    .insert([
      {
        ...expense,
        user_id: userId,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error('Error creating expense:', error);
    throw new Error(error.message);
  }
  return data as Expense;
};

export const updateExpense = async (expenseId: string, updates: Partial<Expense>): Promise<Expense> => {
  const { data, error } = await supabase
    .from('expenses')
    .update(updates)
    .eq('id', expenseId)
    .select()
    .single();

  if (error) {
    console.error('Error updating expense:', error);
    throw new Error(error.message);
  }
  return data as Expense;
};

export const deleteExpense = async (expenseId: string): Promise<void> => {
  const { error } = await supabase.from('expenses').delete().eq('id', expenseId);
  if (error) {
    console.error('Error deleting expense:', error);
    throw new Error(error.message);
  }
};
