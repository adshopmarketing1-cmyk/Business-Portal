import { supabase } from '../lib/supabase';
import { Budget } from '../types/database';

export const getBudgets = async (userId: string): Promise<Budget[]> => {
  const { data, error } = await supabase
    .from('budgets')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching budgets:', error);
    throw new Error(error.message);
  }
  return data as Budget[];
};

export const createBudget = async (
  userId: string,
  budgetData: Omit<Budget, 'id' | 'user_id' | 'created_at' | 'updated_at'>
): Promise<Budget> => {
  const { data, error } = await supabase
    .from('budgets')
    .insert([
      {
        ...budgetData,
        user_id: userId,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error('Error creating budget:', error);
    throw new Error(error.message);
  }
  return data as Budget;
};

export const updateBudget = async (budgetId: string, updates: Partial<Budget>): Promise<Budget> => {
  const { data, error } = await supabase
    .from('budgets')
    .update(updates)
    .eq('id', budgetId)
    .select()
    .single();

  if (error) {
    console.error('Error updating budget:', error);
    throw new Error(error.message);
  }
  return data as Budget;
};

export const deleteBudget = async (budgetId: string): Promise<void> => {
  const { error } = await supabase.from('budgets').delete().eq('id', budgetId);
  if (error) {
    console.error('Error deleting budget:', error);
    throw new Error(error.message);
  }
};
