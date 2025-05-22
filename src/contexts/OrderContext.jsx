import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/components/ui/use-toast';

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

  const addOrder = async (orderInput) => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .insert({
          user_id: orderInput.user_id || null,
          customer_name: orderInput.customer.name,
          customer_email: orderInput.customer.email,
          customer_phone: orderInput.customer.phone,
          customer_address: orderInput.customer.address,
          delivery_notes: orderInput.deliveryNotes,
          total: orderInput.total,
          status: 'pending',
          delivery_type: orderInput.deliveryType,
          scheduled_delivery_time: orderInput.scheduledDeliveryTime,
          delivery_fee: orderInput.deliveryFee,
          items: orderInput.items
        })
        .select()
        .single();

      if (error) throw error;
      
      toast({
        title: "Order Created",
        description: "Your order has been successfully placed.",
      });

      return data;
    } catch (error) {
      console.error('Error creating order:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create order. Please try again."
      });
      throw error;
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: "Order Updated",
        description: `Order status changed to ${status}.`,
      });
    } catch (error) {
      console.error('Error updating order status:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update order status."
      });
    }
  };

  const getOrderById = async (orderId) => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching order:', error);
      return null;
    }
  };

  const getOrdersByStatus = async (status) => {
    try {
      let query = supabase.from('orders').select('*');
      if (status) {
        query = query.eq('status', status);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching orders:', error);
      return [];
    }
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