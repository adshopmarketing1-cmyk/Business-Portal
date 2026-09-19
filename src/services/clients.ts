import { apiFetch } from '../lib/api';
import { Client } from '../types/database';

export const getClients = async (userId?: string): Promise<Client[]> => {
  return await apiFetch<Client[]>('/api/clients');
};

export const createClient = async (
  userId: string,
  clientData: Omit<Client, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'balance_amount'>
): Promise<Client> => {
  return await apiFetch<Client>('/api/clients', {
    method: 'POST',
    body: JSON.stringify(clientData),
  });
};

export const updateClient = async (clientId: string, updates: Partial<Client>): Promise<Client> => {
  return await apiFetch<Client>(`/api/clients/${clientId}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
};

export const deleteClient = async (clientId: string): Promise<void> => {
  await apiFetch(`/api/clients/${clientId}`, {
    method: 'DELETE',
  });
};

export interface ClientPayment {
  id: string;
  user_id: string;
  client_id: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  reference_no?: string;
  notes?: string;
  created_at: string;
}

export const getClientPayments = async (clientId: string): Promise<ClientPayment[]> => {
  return await apiFetch<ClientPayment[]>(`/api/clients/${clientId}/payments`);
};

export const recordClientPayment = async (
  clientId: string,
  payment: { amount: number; payment_date?: string; payment_method?: string; reference_no?: string; notes?: string }
): Promise<{ payment: ClientPayment; client: Client }> => {
  return await apiFetch<{ payment: ClientPayment; client: Client }>(`/api/clients/${clientId}/payments`, {
    method: 'POST',
    body: JSON.stringify(payment),
  });
};
