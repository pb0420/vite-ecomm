import { getQueryCache, setQueryCache, clearQueryCache } from '@/lib/queryCache';
import { supabase } from '@/lib/supabaseClient';
import { formatDateForTimezone, DEFAULT_TIMEZONE } from '@/lib/timezone';


/**
 * Fetch notifications (upcoming orders and grocery runs) for a user
 * @param {string} userId
 * @returns {Promise<Array>} notifications array with .unread property
 */
export const fetchUserNotifications = async (userId) => {
  if (!userId) return [];

  // Get read notification IDs from localStorage
  const readIds = (() => {
    try {
      return JSON.parse(localStorage.getItem("notifications_read_" + userId)).data || [];
    } catch {
      return [];
    }
  })();
  // Get previous cached notifications (for change detection)
  const cached = getQueryCache(`notifications_${userId}`) || [];

  // Fetch upcoming orders
  const { data: orders } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', userId)
    .in('status', ['pending', 'processing'])
    .order('expected_delivery_at', { ascending: true })
    .limit(3);

  // Fetch upcoming grocery runs
  const { data: pickups } = await supabase
    .from('pickup_orders')
    .select('*')
    .eq('user_id', userId)
    .in('status', ['pending', 'processing', 'out_for_delivery'])
    .order('pickup_date', { ascending: true })
    .limit(3);

  // Build new notifications array
  const notifs = [
    ...(orders || []).map(order => ({
      type: 'order',
      id: order.id,
      title: 'Upcoming Delivery',
      time: `${new Date(order.expected_delivery_at)}`,
      admin_messages: order.admin_messages || [],
      status: order.status,
    })),
    ...(pickups || []).map(pickup => ({
      type: 'pickup',
      id: pickup.id,
      title: 'Upcoming Grocery Run',
      time: pickup.time_slot ? `${new Date(pickup.pickup_date)} - ${pickup.time_slot}` : pickup.pickup_date,
      admin_messages: pickup.admin_messages || [],
      status: pickup.status,
    })),
  ];

  // Compare with cached to determine unread
  const unreadNotifs = notifs.map(n => {
    const cacheMatch = cached.find(c => c.type === n.type && c.id === n.id);
    let unread = false;
    if (!readIds.includes(`${n.type}_${n.id}`)) {
      // Not marked as read
      unread = true;
    } else if (cacheMatch) {
      // If admin_messages length, status, or time changed, mark as unread
      if (
        (cacheMatch.admin_messages?.length !== n.admin_messages.length) ||
        (cacheMatch.status !== n.status) ||
        (cacheMatch.time !== n.time)
      ) {
        unread = true;
        // clear that cache
        setQueryCache(`notifications_read_${userId}`, readIds.filter(c => c !== `${n.type}_${n.id}`), 1); // clear cache for this notif
      }
    }
    return { ...n, unread };
  });

  setQueryCache(`notifications_${userId}`, notifs, 1); // cache for 1 min
  return unreadNotifs;
};
