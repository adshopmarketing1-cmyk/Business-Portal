import { supabase } from '../lib/supabase';
import { Client } from '../types/database';

export const getClients = async (userId: string): Promise<Client[]> => {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching clients:', error);
    throw new Error(error.message);
  }
  return data as Client[];
};

export const createClient = async (
  userId: string,
  clientData: Omit<Client, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'balance_amount'>
): Promise<Client> => {
  const balance_amount = (clientData.total_amount || 0) - (clientData.paid_amount || 0);

  const { data, error } = await supabase
    .from('clients')
    .insert([
      {
        ...clientData,
        user_id: userId,
        balance_amount,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error('Error creating client:', error);
    throw new Error(error.message);
  }
  return data as Client;
};

export const updateClient = async (clientId: string, updates: Partial<Client>): Promise<Client> => {
  if (updates.total_amount !== undefined || updates.paid_amount !== undefined) {
    const { data: existing } = await supabase.from('clients').select('total_amount, paid_amount').eq('id', clientId).single();
    if (existing) {
      const total = updates.total_amount !== undefined ? updates.total_amount : existing.total_amount;
      const paid = updates.paid_amount !== undefined ? updates.paid_amount : existing.paid_amount;
      updates.balance_amount = total - paid;
    }
  }

  const { data, error } = await supabase
    .from('clients')
    .update(updates)
    .eq('id', clientId)
    .select()
    .single();

  if (error) {
    console.error('Error updating client:', error);
    throw new Error(error.message);
  }
  return data as Client;
};

export const deleteClient = async (clientId: string): Promise<void> => {
  const { error } = await supabase.from('clients').delete().eq('id', clientId);
  if (error) {
    console.error('Error deleting client:', error);
    throw new Error(error.message);
  }
};
