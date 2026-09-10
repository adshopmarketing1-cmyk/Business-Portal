import { supabase } from '../lib/supabase';
import { Profile } from '../types/database';

export const getProfile = async (userId: string): Promise<Profile | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // Profile does not exist yet, return null
      return null;
    }
    console.error('Error fetching profile:', error);
    throw new Error(error.message);
  }
  return data as Profile;
};

export const updateProfile = async (userId: string, updates: Partial<Profile>): Promise<Profile> => {
  const { data, error } = await supabase
    .from('profiles')
    .upsert({ id: userId, ...updates, updated_at: new Date().toISOString() })
    .select()
    .single();

  if (error) {
    console.error('Error updating profile:', error);
    throw new Error(error.message);
  }
  return data as Profile;
};
