
import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Filter, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import OrderItem from '@/components/admin/OrderItem';
import { useOrders } from '@/contexts/OrderContext'; // Still uses local context for now

const AdminOrdersTab = () => {
  const { orders, getOrdersByStatus } = useOrders(); // Replace with Supabase fetch later
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredOrders = useMemo(() => {
    let result = statusFilter === 'all'
      ? [...orders]
      : getOrdersByStatus(statusFilter);

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(order =>
        order.id.toLowerCase().includes(term) ||
        order.customer.name.toLowerCase().includes(term) ||
        order.customer.email.toLowerCase().includes(term)
      );
    }
    return result.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [orders, statusFilter, searchTerm, getOrdersByStatus]);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-4">
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <h2 className="text-xl font-semibold">Orders Management</h2>
        <div className="flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-2">
          <div className="relative">
            <Filter className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input type="search" placeholder="Search orders..." className="pl-8 w-full md:w-[200px]" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-[180px]"><SelectValue placeholder="Filter by status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Orders</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="md:w-auto" onClick={() => { setSearchTerm(''); setStatusFilter('all'); }}>Reset Filters</Button>
        </div>
      </div>
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-8 border rounded-lg"><Package className="w-12 h-12 mx-auto text-muted-foreground" /><h3 className="mt-4 text-lg font-medium">No orders found</h3><p className="mt-2 text-sm text-muted-foreground">Try adjusting your filters.</p></div>
        ) : (
          filteredOrders.map(order => <OrderItem key={order.id} order={order} />)
        )}
      </div>
    </motion.div>
  );
};

export default AdminOrdersTab;
  