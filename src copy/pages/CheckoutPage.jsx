
import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import CheckoutForm from '@/components/checkout/CheckoutForm';
import OrderSummary from '@/components/checkout/OrderSummary';
import DeliveryOptions from '@/components/checkout/DeliveryOptions';
import PaymentSection from '@/components/checkout/PaymentSection';
import { useCart } from '@/contexts/CartContext';
import { useOrders } from '@/contexts/OrderContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { formatCurrency } from '@/lib/utils'; // Import formatCurrency

const CheckoutPage = () => {
  const { cart, getCartTotal, clearCart } = useCart();
  const { addOrder } = useOrders();
  const { user, updateUserInfo } = useAuth();
  const navigate = useNavigate();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deliveryDetails, setDeliveryDetails] = useState({ type: 'express', fee: 0, scheduledTime: null });
  const [customerDetails, setCustomerDetails] = useState({ name: '', email: '', phone: '', address: '', deliveryNotes: '' });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    const fetchInitialFee = async () => {
      try {
        const { data, error } = await supabase
          .from('delivery_settings')
          .select('express_fee')
          .eq('id', 1)
          .single();
        if (error && error.code !== 'PGRST116') throw error;
        setDeliveryDetails(prev => ({ ...prev, fee: data?.express_fee || 9.99 }));
      } catch (error) {
        console.error("Error fetching initial delivery fee:", error);
        setDeliveryDetails(prev => ({ ...prev, fee: 9.99 }));
      }
    };
    fetchInitialFee();
  }, []);

  const handleDeliveryChange = useCallback((details) => {
    setDeliveryDetails(details);
  }, []);

  const handleDetailsChange = useCallback((details) => {
    setCustomerDetails(details);
  }, []);

  const validateCheckoutForm = () => {
     const errors = {};
     if (!customerDetails.name.trim()) errors.name = 'Name is required';
     if (!customerDetails.email.trim()) {
       errors.email = 'Email is required';
     } else if (!/\S+@\S+\.\S+/.test(customerDetails.email)) {
       errors.email = 'Email is invalid';
     }
     if (!customerDetails.phone.trim()) errors.phone = 'Phone number is required';
     if (!customerDetails.address.trim()) errors.address = 'Address is required';

     if (deliveryDetails.type === 'scheduled' && !deliveryDetails.scheduledTime) {
        errors.delivery = 'Please select a date and time for scheduled delivery.';
        toast({ variant: "destructive", title: "Missing Information", description: errors.delivery });
     }

     setFormErrors(errors);
     return Object.keys(errors).length === 0;
   };


  const handlePlaceOrder = async () => {
    if (!validateCheckoutForm()) return;

    setIsSubmitting(true);

    if (user && (
        user.name !== customerDetails.name ||
        user.phone !== customerDetails.phone ||
        user.address !== customerDetails.address
    )) {
      await updateUserInfo({
        name: customerDetails.name,
        phone: customerDetails.phone,
        address: customerDetails.address
      });
    }

    const orderData = {
      user_id: user?.id || null,
      customer_name: customerDetails.name,
      customer_email: customerDetails.email,
      customer_phone: customerDetails.phone,
      customer_address: customerDetails.address,
      delivery_notes: customerDetails.deliveryNotes,
      total: getCartTotal() + deliveryDetails.fee,
      status: 'pending',
      delivery_type: deliveryDetails.type,
      scheduled_delivery_time: deliveryDetails.scheduledTime,
      delivery_fee: deliveryDetails.fee,
    };

    const newOrder = addOrder({
        customer: { name: orderData.customer_name, email: orderData.customer_email, phone: orderData.customer_phone, address: orderData.customer_address },
        items: cart.map(item => ({ id: item.id, name: item.name, price: item.price, quantity: item.quantity })),
        total: orderData.total,
        deliveryNotes: orderData.deliveryNotes,
        deliveryType: orderData.delivery_type,
        scheduledDeliveryTime: orderData.scheduled_delivery_time,
        deliveryFee: orderData.delivery_fee,
    });

    setTimeout(() => {
      clearCart();
      setIsSubmitting(false);
      toast({
        title: "Order Placed!",
        description: "Your order has been successfully placed.",
      });
      navigate(`/order-confirmation/${newOrder.id}`);
    }, 1500);
  };

  if (cart.length === 0 && !isSubmitting) {
    return (
      <div className="container px-4 py-8 mx-auto md:px-6">
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <h2 className="text-2xl font-bold">Your cart is empty</h2>
          <p className="mt-2 text-muted-foreground">Add products to checkout.</p>
          <Button className="mt-4" onClick={() => navigate('/shop')}>Continue Shopping</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container px-4 py-8 mx-auto md:px-6">
      <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="text-3xl font-bold tracking-tight">
        Checkout
      </motion.h1>

      <div className="grid gap-8 mt-8 lg:grid-cols-[1fr_350px]">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }} className="space-y-6">
          <CheckoutForm onDetailsChange={handleDetailsChange} errors={formErrors} />
          <DeliveryOptions onDeliveryChange={handleDeliveryChange} />
          <PaymentSection />
           {formErrors.delivery && <p className="text-sm text-destructive">{formErrors.delivery}</p>}
          <Button onClick={handlePlaceOrder} className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <div className="mr-2 h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
                Processing...
              </>
            ) : `Place Order - ${formatCurrency(getCartTotal() + deliveryDetails.fee)}`}
          </Button>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.2 }}>
          <OrderSummary deliveryFee={deliveryDetails.fee} />
        </motion.div>
      </div>
    </div>
  );
};

export default CheckoutPage;
  