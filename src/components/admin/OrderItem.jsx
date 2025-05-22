import React from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronUp, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency } from '@/lib/utils';

const OrderItem = ({ order, onStatusChange }) => {
  const [isExpanded, setIsExpanded] = React.useState(false);
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    }).format(date);
  };
  
  const getStatusClass = (status) => {
    switch (status) {
      case 'pending': return 'order-status-pending';
      case 'processing': return 'order-status-processing';
      case 'delivered': return 'order-status-delivered';
      case 'cancelled': return 'order-status-cancelled';
      default: return '';
    }
  };
  
  const handleStatusChange = (value) => {
    onStatusChange(order.id, value);
  };
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="border rounded-lg overflow-hidden bg-card"
    >
      <div 
        className="p-4 flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-4">
          <div className="p-2 rounded-full bg-primary/10">
            <Package className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-medium">{order.id}</h3>
            <p className="text-sm text-muted-foreground">{formatDate(order.date)}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="hidden md:block">
            <p className="text-sm font-medium">{order.customer.name}</p>
            <p className="text-sm text-muted-foreground">{order.customer.email}</p>
          </div>
          
          <div className="hidden md:block">
            <p className="text-sm font-medium">{formatCurrency(order.total)}</p>
            <p className="text-sm text-muted-foreground">
              {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
            </p>
          </div>
          
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusClass(order.status)}`}>
            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </div>
          
          <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </div>
      
      {isExpanded && (
        <div className="p-4 border-t bg-muted/30">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-semibold mb-2">Customer Information</h4>
              <div className="space-y-1">
                <p className="text-sm">
                  <span className="font-medium">Name:</span> {order.customer.name}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Email:</span> {order.customer.email}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Phone:</span> {order.customer.phone}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Address:</span> {order.customer.address}
                </p>
                {order.deliveryNotes && (
                  <p className="text-sm">
                    <span className="font-medium">Delivery Notes:</span> {order.deliveryNotes}
                  </p>
                )}
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold">Order Status</h4>
                <Select defaultValue={order.status} onValueChange={handleStatusChange}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="mt-4">
                <h4 className="text-sm font-semibold mb-2">Order Items</h4>
                <div className="space-y-2">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex justify-between p-2 rounded bg-background">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">{item.name}</span>
                        <span className="text-xs text-muted-foreground">x{item.quantity}</span>
                      </div>
                      <span className="text-sm">{formatCurrency(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 pt-4 border-t flex justify-between">
                  <span className="font-semibold">Total</span>
                  <span className="font-semibold">{formatCurrency(order.total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default OrderItem;