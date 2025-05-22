
import React, { createContext, useContext, useState, useEffect } from 'react';
import { loadOrders, saveOrders } from '@/lib/storage';
import { sampleOrders } from '@/lib/data/orders'; // Keep using sample for local context
import { toast } from '@/components/ui/use-toast';
// NOTE: This context uses localStorage and sample data.
// For production, order management should happen via Supabase functions or a secure backend.

const OrderContext = createContext();

export const useOrders = () => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrders must be used within an OrderProvider');
  }
  return context;
};

export const OrderProvider = ({ children }) => {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const savedOrders = loadOrders();
    if (savedOrders && savedOrders.length > 0) {
      setOrders(savedOrders);
    } else {
      setOrders(sampleOrders);
      saveOrders(sampleOrders);
    }
  }, []);

  useEffect(() => {
    saveOrders(orders);
  }, [orders]);

  // Updated to accept more details, including delivery info
  const addOrder = (orderInput) => {
    const newOrder = {
      id: `ORD-${String(Date.now()).slice(-6)}`, // More unique ID for local
      date: new Date().toISOString(),
      status: 'pending',
      customer: orderInput.customer,
      items: orderInput.items,
      total: orderInput.total,
      deliveryNotes: orderInput.deliveryNotes,
      deliveryType: orderInput.deliveryType, // Added
      scheduledDeliveryTime: orderInput.scheduledDeliveryTime, // Added
      deliveryFee: orderInput.deliveryFee, // Added
    };

    setOrders(prevOrders => [...prevOrders, newOrder]);

    // Toast is handled in CheckoutPage after successful simulation/payment
    return newOrder; // Return the created order object
  };

  const updateOrderStatus = (orderId, status) => {
    setOrders(prevOrders =>
      prevOrders.map(order =>
        order.id === orderId
          ? { ...order, status }
          : order
      )
    );

    toast({
      title: "Order updated",
      description: `Order #${orderId} status changed to ${status}.`,
      duration: 2000,
    });
  };

  const getOrderById = (orderId) => {
    // Find order, potentially converting dates if stored as strings
    const order = orders.find(order => order.id === orderId);
    if (order && typeof order.date === 'string') {
        order.date = new Date(order.date);
    }
     if (order && typeof order.scheduledDeliveryTime === 'string') {
        order.scheduledDeliveryTime = new Date(order.scheduledDeliveryTime);
    }
    return order;
  };

  const getOrdersByStatus = (status) => {
    return status ? orders.filter(order => order.status === status) : orders;
  };

  return (
    <OrderContext.Provider value={{
      orders,
      addOrder,
      updateOrderStatus,
      getOrderById,
      getOrdersByStatus
    }}>
      {children}
    </OrderContext.Provider>
  );
};
  