import { apiFetch } from '../lib/api';
import { Profile } from '../types/database';

export const getProfile = async (userId?: string): Promise<Profile | null> => {
  try {
    return await apiFetch<Profile>('/api/profile');
  } catch (error: any) {
    if (error.status === 404) return null;
    throw error;
  }
};

export const updateProfile = async (userId: string, updates: Partial<Profile>): Promise<Profile> => {
  return await apiFetch<Profile>('/api/profile', {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
};
