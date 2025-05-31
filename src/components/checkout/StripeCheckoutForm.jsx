import React, { useState } from 'react';
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

const StripeCheckoutForm = ({ clientSecret, onPaymentSuccess }) => {
  if (!clientSecret) {
    return null;
  }

  return (
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
      <CheckoutForm onPaymentSuccess={onPaymentSuccess} />
    </Elements>
  );
};

export default StripeCheckoutForm;