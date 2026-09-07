import { supabase } from './supabase';

export async function testSupabaseConnection() {
  const { data, error } = await supabase
    .from('clinics')
    .select('id, name')
    .limit(10);

  if (error) {
    console.error('Supabase connection error:', error);
    return;
  }

  console.log('Supabase connected successfully:', data);
}
