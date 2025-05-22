import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle, Package, ArrowRight, Truck, Clock, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabaseClient';
import { formatCurrency } from '@/lib/utils';

const OrderConfirmationPage = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deliveryTime, setDeliveryTime] = useState(null);
  
  useEffect(() => {
    const fetchOrder = async () => {
      if (!id) return;
      
      try {
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .select('*')
          .eq('id', id)
          .single();

        if (orderError) throw orderError;

        if (orderData) {
          setOrder(orderData);

          // Fetch delivery settings for express delivery time
          if (orderData.delivery_type === 'express') {
            const { data: settingsData } = await supabase
              .from('delivery_settings')
              .select('express_delivery_time')
              .eq('id', 1)
              .single();

            if (settingsData) {
              const orderDate = new Date(orderData.created_at);
              const deliveryInterval = settingsData.express_delivery_time;
              // Parse interval string (e.g., "2 hours") and add to order date
              const hours = parseInt(deliveryInterval.match(/(\d+) hours?/)?.[1] || '2');
              const estimatedDelivery = new Date(orderDate.getTime() + (hours * 60 * 60 * 1000));
              setDeliveryTime(estimatedDelivery);
            }
          } else if (orderData.scheduled_delivery_time) {
            setDeliveryTime(new Date(orderData.scheduled_delivery_time));
          }
        }
      } catch (error) {
        console.error('Error fetching order:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);
  
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    }).format(date);
  };

  const getStatusInfo = () => {
    if (!order) return null;

    const statusConfig = {
      pending: {
        color: 'text-yellow-500',
        bgColor: 'bg-yellow-100',
        icon: Clock,
        title: 'Order Pending',
        description: deliveryTime ? `Estimated delivery by ${formatDate(deliveryTime)}` : 'Processing your order'
      },
      processing: {
        color: 'text-blue-500',
        bgColor: 'bg-blue-100',
        icon: Package,
        title: 'Order Processing',
        description: 'Your order is being prepared'
      },
      delivered: {
        color: 'text-green-500',
        bgColor: 'bg-green-100',
        icon: CheckCircle,
        title: 'Order Delivered',
        description: 'Your order has been delivered'
      },
      cancelled: {
        color: 'text-red-500',
        bgColor: 'bg-red-100',
        icon: XCircle,
        title: 'Order Cancelled',
        description: 'This order has been cancelled'
      }
    };

    return statusConfig[order.status] || statusConfig.pending;
  };
  
  if (loading) {
    return (
      <div className="container px-4 py-8 mx-auto md:px-6">
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }
  
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

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;
  
  return (
    <div className="container px-4 py-8 mx-auto md:px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl mx-auto"
      >
        {/* Order Status Section */}
        <div className="mb-8 text-center">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className={`mx-auto w-24 h-24 rounded-full ${statusInfo.bgColor} flex items-center justify-center mb-4`}
          >
            <StatusIcon className={`w-12 h-12 ${statusInfo.color}`} />
          </motion.div>
          <h1 className="text-2xl font-bold mb-2">{statusInfo.title}</h1>
          <p className="text-muted-foreground">{statusInfo.description}</p>
        </div>

        {/* Order Progress Bar */}
        <div className="mb-8">
          <div className="relative">
            <div className="absolute left-0 top-1/2 w-full h-1 bg-muted transform -translate-y-1/2">
              <div 
                className={`h-full bg-primary transition-all duration-500 ${
                  order.status === 'pending' ? 'w-1/3' :
                  order.status === 'processing' ? 'w-2/3' :
                  order.status === 'delivered' ? 'w-full' : 'w-0'
                }`}
              />
            </div>
            <div className="relative flex justify-between">
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  ['pending', 'processing', 'delivered'].includes(order.status) ? 'bg-primary text-primary-foreground' : 'bg-muted'
                }`}>
                  <CheckCircle className="w-4 h-4" />
                </div>
                <span className="mt-2 text-sm">Confirmed</span>
              </div>
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  ['processing', 'delivered'].includes(order.status) ? 'bg-primary text-primary-foreground' : 'bg-muted'
                }`}>
                  <Package className="w-4 h-4" />
                </div>
                <span className="mt-2 text-sm">Processing</span>
              </div>
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  order.status === 'delivered' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                }`}>
                  <Truck className="w-4 h-4" />
                </div>
                <span className="mt-2 text-sm">Delivered</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-8 p-6 border rounded-lg text-left">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Order #{order.id}</h2>
            <span className={`px-3 py-1 text-xs font-medium rounded-full ${statusInfo.bgColor} ${statusInfo.color}`}>
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </span>
          </div>
          
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Order Date</p>
              <p className="font-medium">{formatDate(order.created_at)}</p>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground">Delivery Address</p>
              <p className="font-medium">{order.customer_address}</p>
            </div>
            
            {order.delivery_notes && (
              <div>
                <p className="text-sm text-muted-foreground">Delivery Notes</p>
                <p className="font-medium">{order.delivery_notes}</p>
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