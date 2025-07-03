import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { loadCart, saveCart } from '@/lib/storage';
import { toast } from '@/components/ui/use-toast';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Toast queue to avoid calling toast inside state updaters
  const toastQueue = useRef([]);

  // Load cart from localStorage on initial render
  useEffect(() => {
    const savedCart = loadCart();
    if (savedCart && savedCart.length > 0) {
      setCart(savedCart);
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    saveCart(cart);
  }, [cart]);

  // Show toasts after state updates
  useEffect(() => {
    if (toastQueue.current.length > 0) {
      // Only show the latest toast (prevents stacking)
      const latestToast = toastQueue.current.pop();
      toastQueue.current = [];
      toast(latestToast);
    }
  }, [cart]);

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);
  const toggleCart = () => setIsCartOpen(!isCartOpen);

  const addToCart = (product, quantity = 1) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      if (existingItem) {
        // Update quantity if item already exists
        const updatedCart = prevCart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
        toastQueue.current.push({
          title: "Item updated",
          description: `${product.name} quantity updated in your cart.`,
          duration: 2000,
          action: 'view-cart'
        });
        return updatedCart;
      } else {
        // Add new item
        toastQueue.current.push({
          title: "Item added",
          description: `${product.name} added to your cart.`,
          duration: 2000,
          action: 'view-cart'
        });
        return [...prevCart, { ...product, quantity }];
      }
    });
  };

  const removeFromCart = (productId) => {
    setCart(prevCart => {
      const itemToRemove = prevCart.find(item => item.id === productId);
      if (itemToRemove) {
        toastQueue.current.push({
          title: "Item removed",
          description: `${itemToRemove.name} removed from your cart.`,
          duration: 2000,
          action: 'view-cart'
        });
      }
      return prevCart.filter(item => item.id !== productId);
    });
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prevCart => {
      const item = prevCart.find(item => item.id === productId);
      if (item && item.quantity !== quantity) {
        toastQueue.current.push({
          title: "Quantity updated",
          description: `${item.name} quantity set to ${quantity}.`,
          duration: 2000,
          action: 'view-cart'
        });
      }
      return prevCart.map(item =>
        item.id === productId
          ? { ...item, quantity }
          : item
      );
    });
  };

  const clearCart = () => {
    setCart([]);
    toastQueue.current.push({
      title: "Cart cleared",
      description: "All items have been removed from your cart.",
      duration: 2000,
      action: 'view-cart'
    });
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getCartCount = () => {
    return cart.reduce((count, item) => count + item.quantity, 0);
  };

  return (
    <CartContext.Provider value={{
      cart,
      isCartOpen,
      openCart,
      closeCart,
      toggleCart,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      getCartTotal,
      getCartCount
    }}>
      {children}
    </CartContext.Provider>
  );
};