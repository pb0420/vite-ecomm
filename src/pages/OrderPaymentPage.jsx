import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { useOrders } from '@/contexts/OrderContext';
// import StripeCheckoutForm from '@/components/checkout/StripeCheckoutForm';
import { formatCurrency } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { da } from 'date-fns/locale';

import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

const stripePromise = loadStripe("pk_test_51RU0DpAcyZwL9ZCroHLDNCalx80u736eoFCb3mNARKz2BpDuDhl2VgtPJWp8t0jkaitH7zXOFDiE7B3q95rNColr00V7gqABTc", {
  stripeAccount: 'acct_1RU0DpAcyZwL9ZCr'
});

const CheckoutForm = ({ onPaymentSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
      });

      if (error) {
        throw new Error(error.message);
      }

      // Verify payment status
      const response = await fetch('https://bcbxcnxutotjzmdjeyde.supabase.co/functions/v1/verify-stripe-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjYnhjbnh1dG90anptZGpleWRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY0NjIwODksImV4cCI6MjA2MjAzODA4OX0.sMIn31DXRvBpQsxYZV2nn1lKqdEkEk2S0jvdve2yACY'
        },
        body: JSON.stringify({
          paymentIntentId: paymentIntent.id
        })
      });

      const result = await response.json();

      if (result.success) {
        await onPaymentSuccess(result.orderData);
        toast({ title: "Payment Successful", description: "Your order has been placed successfully." });
      } else {
        throw new Error(result.error || 'Payment verification failed');
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast({ 
        variant: "destructive", 
        title: "Payment Failed", 
        description: error.message 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Processing...' : 'Pay Now'}
      </Button>
    </form>
  );
};

const OrderPaymentPage = () => {
  const { user } = useAuth();
  const { cart, getCartTotal, clearCart } = useCart();
  const { addOrder } = useOrders();
  const navigate = useNavigate();
  const location = useLocation();
  const [clientSecret, setClientSecret] = useState(null);
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unloadCallback = (event) => {
      event.preventDefault();
      event.returnValue = "";
      return "";
    };
    window.addEventListener("beforeunload", unloadCallback);
    return () => window.removeEventListener("beforeunload", unloadCallback);
  }, []);

  useEffect(() => {
    if (!cart.length) {
      navigate('/checkout');
      return;
    }

    const createPaymentIntent = async () => {
      try {
        const productList = cart.map(item => ({
          id: item.id,
          quantity: item.quantity
        }));
        const orderData = location.state?.orderData;
        const response = await fetch('https://bcbxcnxutotjzmdjeyde.supabase.co/functions/v1/create-stripe-payment-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjYnhjbnh1dG90anptZGpleWRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY0NjIwODksImV4cCI6MjA2MjAzODA4OX0.sMIn31DXRvBpQsxYZV2nn1lKqdEkEk2S0jvdve2yACY'
          },
          body: JSON.stringify({
            order_type: 'delivery',
            productList,
            user_id: user.id,
            orderData,
            orderId: null
            // delivery_type: location.state?.deliveryType || 'express',
            // scheduled_delivery_time: location.state?.scheduledTime || null
          })
        });

        const data = await response.json();
        
        if (data.error) {
          throw new Error(data.error);
        }

        setClientSecret(data.clientSecret);
        setOrderData(data.orderData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    createPaymentIntent();
  }, [cart, navigate, location.state, user.id]);

  const handlePaymentSuccess = async (data) => {
    try {
      // const orderData = data.orderData;
      // console.log('Order Data:', JSON.parse(orderData));
      const payment_data = data.payment_data;
      const orderDataComplete = {
        ...orderData,
        payment_data
      }
      // console.log(orderDataComplete)
      const order = await addOrder(orderDataComplete);
      clearCart();
      navigate(`/order-confirmation/${order.id}`);
    } catch (error) {
      console.error('Error creating order:', error);
      setError('Failed to create order. Please contact support.');
    }
  };

  if (loading) {
    return (
      <div className="container flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-8 text-center">
        <h2 className="text-xl font-semibold text-destructive mb-4">Payment Error</h2>
        <p className="text-muted-foreground mb-4">{error}</p>
        <button onClick={() => navigate('/checkout')} className="text-primary hover:underline">
          Return to checkout
        </button>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-6">Complete Payment</h1>
      <div className="max-w-md mx-auto">
        <div className="mb-6 p-4 border rounded-lg bg-muted/30">
          <p className="text-sm text-muted-foreground mb-2">Order Total</p>
          <p className="text-2xl font-bold">{formatCurrency((location.state?.finalTotal || 0))}</p>
        </div>
        <Elements 
             stripe={stripePromise} 
             options={{
               clientSecret,
               appearance: {
                 theme: 'stripe',
                 variables: {
                   colorPrimary: '#2E8B57',
                 },
               },
             }}
        >
        <CheckoutForm onPaymentSuccess={handlePaymentSuccess} />
        </Elements>
         {/* <StripeCheckoutForm 
          clientSecret={clientSecret} 
          onPaymentSuccess={handlePaymentSuccess}
        /> */}
      </div>
    </div>
  );
};

export default OrderPaymentPage;