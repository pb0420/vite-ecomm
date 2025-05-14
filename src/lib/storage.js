
// Local storage helpers - Keep cart for now, remove user/admin status

// Save cart to localStorage
export const saveCart = (cart) => {
  localStorage.setItem('groceroo-cart', JSON.stringify(cart));
};

// Load cart from localStorage
export const loadCart = () => {
  const cart = localStorage.getItem('groceroo-cart');
  return cart ? JSON.parse(cart) : [];
};

// Save orders to localStorage (Will be removed once Supabase is fully integrated for orders)
export const saveOrders = (orders) => {
  localStorage.setItem('groceroo-orders', JSON.stringify(orders));
};

// Load orders from localStorage (Will be removed once Supabase is fully integrated for orders)
export const loadOrders = () => {
  const orders = localStorage.getItem('groceroo-orders');
  return orders ? JSON.parse(orders) : [];
};

// Removed saveUserInfo, loadUserInfo, saveAdminStatus, loadAdminStatus as Supabase handles session/profile
  