import { supabase } from '../lib/supabase';
import { Income } from '../types/database';

export const getIncome = async (userId: string): Promise<Income[]> => {
  const { data, error } = await supabase
    .from('income')
    .select('*, client:clients(id, name)')
    .eq('user_id', userId)
    .order('date', { ascending: false });

  if (error) {
    console.error('Error fetching income records:', error);
    throw new Error(error.message);
  }
  return data as Income[];
};

export const createIncome = async (
  userId: string,
  incomeData: Omit<Income, 'id' | 'user_id' | 'created_at' | 'updated_at'>
): Promise<Income> => {
  const { data, error } = await supabase
    .from('income')
    .insert([
      {
        ...incomeData,
        user_id: userId,
      },
    ])
    .select('*, client:clients(id, name)')
    .single();

  if (error) {
    console.error('Error creating income record:', error);
    throw new Error(error.message);
  }

  // If tied to a client and payment_status is paid, update client's paid_amount
  if (incomeData.client_id && incomeData.payment_status === 'paid') {
    const { data: client } = await supabase
      .from('clients')
      .select('paid_amount, total_amount')
      .eq('id', incomeData.client_id)
      .single();

    if (client) {
      const newPaid = Number(client.paid_amount || 0) + Number(incomeData.amount);
      const newBalance = Number(client.total_amount || 0) - newPaid;
      await supabase
        .from('clients')
        .update({ paid_amount: newPaid, balance_amount: newBalance })
        .eq('id', incomeData.client_id);
    }
  }

  return data as Income;
};

export const updateIncome = async (incomeId: string, updates: Partial<Income>): Promise<Income> => {
  const { data, error } = await supabase
    .from('income')
    .update(updates)
    .eq('id', incomeId)
    .select('*, client:clients(id, name)')
    .single();

  if (error) {
    console.error('Error updating income record:', error);
    throw new Error(error.message);
  }
  return data as Income;
};

export const deleteIncome = async (incomeId: string): Promise<void> => {
  const { error } = await supabase.from('income').delete().eq('id', incomeId);
  if (error) {
    console.error('Error deleting income record:', error);
    throw new Error(error.message);
  }
};
