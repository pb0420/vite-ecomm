import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Label } from '@/components/ui/label';
import { Link } from 'react-router-dom';
import { CreditCard } from 'lucide-react';

import {loadStripe} from '@stripe/stripe-js';
import {
  CheckoutProvider
} from '@stripe/react-stripe-js';


const CheckoutPage = () => {
  const { cart, getCartTotal, clearCart } = useCart();
  const { addOrder } = useOrders();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deliveryDetails, setDeliveryDetails] = useState({ type: 'express', fee: 0, scheduledTime: null });
  const [customerDetails, setCustomerDetails] = useState({ name: '', email: '', phone: '', address: '', deliveryNotes: '' });
  const [formErrors, setFormErrors] = useState({});
   const [termsAccepted, setTermsAccepted] = useState(false);
   const [showStripePaymentSection, setShowStripePaymentSection] = useState(false);


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
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-3xl font-bold tracking-tight mb-8">Checkout</h1>

        <div className="grid gap-8 lg:grid-cols-[1fr_350px]">
          <div className="space-y-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <CheckoutForm onDetailsChange={handleDetailsChange} errors={formErrors} />
              <DeliveryOptions onDeliveryChange={handleDeliveryChange} />
              
              {!user ? (
                <div className="mt-6 p-6 border rounded-lg bg-muted/30">
                  <h3 className="text-lg font-semibold mb-4">Sign in to Continue</h3>
                  <PhoneLoginForm onSuccess={() => {}} />
                </div>
              ) : (<p></p>)}
            </motion.div>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.3, delay: 0.2 }}
            className="lg:sticky lg:top-20"
          >
            <OrderSummary deliveryFee={deliveryDetails.fee} />
          </motion.div>

          <div className="flex items-center space-x-2">
            <Checkbox 
              id="terms" 
              checked={termsAccepted}
              onCheckedChange={setTermsAccepted}
            />
            <Label htmlFor="terms" className="text-sm">
              I agree to the <Link to="/terms" className="text-primary hover:underline" target="_blank">Terms and Conditions</Link> and{' '}
              <Link to="/privacy" className="text-primary hover:underline" target="_blank">Privacy Policy</Link>
            </Label>
          </div>

          <Button onClick={setShowStripePaymentSection(true)} disabled={!user || !termsAccepted}> Proceed to Payment &nbsp; <CreditCard /></Button>
          <p style={{ marginTop:'-25px',fontSize:'8px'}}>Secure payment powered by Stripe</p>
          {
            showStripePaymentSection === true ? 
            (<PaymentSection 
              customerDetails={customerDetails}
              deliveryDetails={deliveryDetails}
            />):(<p></p>)
          }
        </div>
      </motion.div>
    </div>
  );
};

export default CheckoutPage;