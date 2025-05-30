import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Filter, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import OrderItem from '@/components/admin/OrderItem';
import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/components/ui/use-toast';

const AdminOrdersTab = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({ variant: "destructive", title: "Error", description: "Could not load orders." });
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId);

      if (error) throw error;
      
      toast({ title: "Status Updated", description: `Order status changed to ${status}` });
      fetchOrders(); // Refresh orders list
    } catch (error) {
      console.error('Error updating order status:', error);
      toast({ variant: "destructive", title: "Error", description: "Could not update order status." });
    }
  };

  const updateDeliveryTime = async (orderId, expectedDeliveryAt) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ expected_delivery_at: expectedDeliveryAt })
        .eq('id', orderId);

      if (error) throw error;
      
      toast({ title: "Delivery Time Updated", description: "Expected delivery time has been updated" });
      fetchOrders(); // Refresh orders list
    } catch (error) {
      console.error('Error updating delivery time:', error);
      toast({ variant: "destructive", title: "Error", description: "Could not update delivery time." });
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.3 }} 
      className="space-y-4"
    >
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <h2 className="text-xl font-semibold">Orders Management</h2>
        <div className="flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-2">
          <div className="relative">
            <Filter className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              type="search" 
              placeholder="Search orders..." 
              className="pl-8 w-full md:w-[200px]" 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Orders</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            className="md:w-auto" 
            onClick={() => { 
              setSearchTerm(''); 
              setStatusFilter('all'); 
            }}
          >
            Reset Filters
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-8 border rounded-lg">
              <Package className="w-12 h-12 mx-auto text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">No orders found</h3>
              <p className="mt-2 text-sm text-muted-foreground">Try adjusting your filters.</p>
            </div>
          ) : (
            filteredOrders.map(order => (
              <OrderItem 
                key={order.id} 
                order={{
                  id: order.id,
                  date: order.created_at,
                  customer: {
                    name: order.customer_name,
                    email: order.customer_email,
                    phone: order.customer_phone,
                    address: order.customer_address
                  },
                  items: order.items,
                  total: order.total,
                  status: order.status,
                  deliveryNotes: order.delivery_notes,
                  expected_delivery_at: order.expected_delivery_at
                }}
                onStatusChange={updateOrderStatus}
                onDeliveryTimeChange={updateDeliveryTime}
              />
            ))
          )}
        </div>
      )}
    </motion.div>
  );
};

export default AdminOrdersTab;