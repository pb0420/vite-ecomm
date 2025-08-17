// File: groceroo/src/lib/deliveryTime.js
import { supabase } from './supabaseClient';
import { getQueryCache, setQueryCache } from './queryCache';

export async function getDeliveryTime() {
  let deliverySettings = getQueryCache('deliverySettings');
  if (!deliverySettings) {
    const { data, error } = await supabase
      .from('delivery_settings')
      .select('estimated_delivery_minutes')
      .eq('id', 1)
      .single();
    if (!error && data) {
      deliverySettings = data;
      setQueryCache('deliverySettings', deliverySettings);
    }
  }
  return deliverySettings?.estimated_delivery_minutes || 45;
}
