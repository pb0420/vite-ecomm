import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import CheckoutForm from '@/components/checkout/CheckoutForm';
import OrderSummary from '@/components/checkout/OrderSummary';
import DeliveryOptions from '@/components/checkout/DeliveryOptions';
import PaymentSection from '@/components/checkout/PaymentSection';
import PhoneLoginForm from '@/components/auth/PhoneLoginForm';
import { useCart } from '@/contexts/CartContext';
import { useOrders } from '@/contexts/OrderContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { formatCurrency } from '@/lib/utils';

const CheckoutPage = () => {
  const { cart, getCartTotal, clearCart } = useCart();
  const { addOrder } = useOrders();
  const { user } = useAuth();
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
    if (!customerDetails.phone.trim()) errors.phone = 'Phone number is required';
    if (!customerDetails.address.trim()) errors.address = 'Address is required';
    if (customerDetails.email && !/\S+@\S+\.\S+/.test(customerDetails.email)) {
      errors.email = 'Email is invalid';
    }

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

    try {
      const orderData = {
        user_id: user?.id,
        customer: {
          name: customerDetails.name,
          email: customerDetails.email || null,
          phone: customerDetails.phone,
          address: customerDetails.address
        },
        items: cart.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity
        })),
        total: getCartTotal() + deliveryDetails.fee,
        deliveryNotes: customerDetails.deliveryNotes,
        deliveryType: deliveryDetails.type,
        scheduledDeliveryTime: deliveryDetails.scheduledTime,
        deliveryFee: deliveryDetails.fee,
      };

      const newOrder = await addOrder(orderData);
      clearCart();
      navigate(`/order-confirmation/${newOrder.id}`);
    } catch (error) {
      console.error('Error placing order:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to place order. Please try again."
      });
    } finally {
      setIsSubmitting(false);
    }
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
      <motion.h1 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.3 }} 
        className="text-3xl font-bold tracking-tight"
      >
        Checkout
      </motion.h1>

      <div className="grid gap-8 mt-8 lg:grid-cols-[1fr_350px]">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.3, delay: 0.1 }} 
          className="space-y-6"
        >
          <CheckoutForm onDetailsChange={handleDetailsChange} errors={formErrors} />
          <DeliveryOptions onDeliveryChange={handleDeliveryChange} />
          <PaymentSection />
          {formErrors.delivery && <p className="text-sm text-destructive">{formErrors.delivery}</p>}
          
          {!user ? (
            <PhoneLoginForm onSuccess={() => {}} />
          ) : (
            <Button onClick={handlePlaceOrder} className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <div className="mr-2 h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
                  Processing...
                </>
              ) : `Place Order - ${formatCurrency(getCartTotal() + deliveryDetails.fee)}`}
            </Button>
          )}
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <OrderSummary deliveryFee={deliveryDetails.fee} />
        </motion.div>
      </div>
    </div>
  );
};

export default CheckoutPage;