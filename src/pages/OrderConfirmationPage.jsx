
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle, Package, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useOrders } from '@/contexts/OrderContext';
import { formatCurrency } from '@/lib/utils';

const OrderConfirmationPage = () => {
  const { id } = useParams();
  const { getOrderById } = useOrders();
  const [order, setOrder] = useState(null);
  
  useEffect(() => {
    if (id) {
      const foundOrder = getOrderById(id);
      setOrder(foundOrder);
    }
  }, [id, getOrderById]);
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    }).format(date);
  };
  
  if (!order) {
    return (
      <div className="container px-4 py-8 mx-auto md:px-6">
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <h2 className="text-2xl font-bold">Order Not Found</h2>
          <p className="mt-2 text-muted-foreground">
            The order you're looking for doesn't exist.
          </p>
          <Link to="/shop">
            <Button className="mt-4">Continue Shopping</Button>
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container px-4 py-8 mx-auto md:px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl mx-auto text-center"
      >
        <div className="flex justify-center mb-4">
          <div className="p-3 rounded-full bg-primary/10">
            <CheckCircle className="h-12 w-12 text-primary" />
          </div>
        </div>
        
        <h1 className="text-3xl font-bold">Order Confirmed!</h1>
        <p className="mt-2 text-muted-foreground">
          Thank you for your order. We've received your order and will begin processing it right away.
        </p>
        
        <div className="mt-8 p-6 border rounded-lg text-left">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Order #{order.id}</h2>
            <span className="px-3 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary">
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </span>
          </div>
          
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Order Date</p>
              <p className="font-medium">{formatDate(order.date)}</p>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground">Delivery Address</p>
              <p className="font-medium">{order.customer.address}</p>
            </div>
            
            {order.deliveryNotes && (
              <div>
                <p className="text-sm text-muted-foreground">Delivery Notes</p>
                <p className="font-medium">{order.deliveryNotes}</p>
              </div>
            )}
          </div>
          
          <div className="mt-6 pt-6 border-t">
            <h3 className="font-semibold mb-4">Order Items</h3>
            
            <div className="space-y-3">
              {order.items.map((item, index) => (
                <div key={index} className="flex justify-between">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(item.price)} x {item.quantity}
                    </p>
                  </div>
                  <p className="font-medium">{formatCurrency(item.price * item.quantity)}</p>
                </div>
              ))}
            </div>
            
            <div className="mt-4 pt-4 border-t flex justify-between font-bold">
              <span>Total</span>
              <span>{formatCurrency(order.total)}</span>
            </div>
          </div>
        </div>
        
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/shop">
            <Button variant="outline">
              Continue Shopping
            </Button>
          </Link>
          <Link to="/account/orders">
            <Button>
              <Package className="mr-2 h-4 w-4" />
              View All Orders
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default OrderConfirmationPage;
