import { supabase } from '@/lib/supabaseClient';
import { getQueryCache, setQueryCache } from '@/lib/queryCache';

export async function fetchPostcodes({ cacheKey = 'postcodes', cacheMinutes = 1440 } = {}) {
  // Try cache first
  const cached = getQueryCache(cacheKey);
  if (cached) return cached;

  // Fetch from DB
  const { data, error } = await supabase
    .from('postcodes')
    .select('*')
    .order('suburb');

  if (error) throw error;
  setQueryCache(cacheKey, data, cacheMinutes);
  return data;
}