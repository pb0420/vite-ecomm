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
          customer_name: orderInput.customer_name,
          customer_email: orderInput.customer_email,
          customer_phone: orderInput.customer_phone,
          customer_address: orderInput.customer_address,
          customer_postcode: orderInput.customer_postcode,
          delivery_notes: orderInput.delivery_notes,
          total: orderInput.total,
          status: 'pending',
          delivery_type: orderInput.delivery_type,
          scheduled_delivery_time: orderInput.scheduled_delivery_time,
          delivery_fee: orderInput.delivery_fee,
          items: orderInput.items,
          payment_data:orderInput.payment_data
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