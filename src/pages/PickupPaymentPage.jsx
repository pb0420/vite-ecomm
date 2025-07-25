import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CreditCard, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import StripeCheckoutForm from '@/components/checkout/StripeCheckoutForm';
import { formatCurrency } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/components/ui/use-toast';

const PickupPaymentPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [clientSecret, setClientSecret] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { orderId, orderData, finalTotal } = location.state || {};

  useEffect(() => {
    if (!orderId || !orderData || !finalTotal) {
      navigate('/grocery-run');
      return;
    }

    const createPaymentIntent = async () => {
      try {
        const response = await fetch('https://bcbxcnxutotjzmdjeyde.supabase.co/functions/v1/create-stripe-payment-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjYnhjbnh1dG90anptZGpleWRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY0NjIwODksImV4cCI6MjA2MjAzODA4OX0.sMIn31DXRvBpQsxYZV2nn1lKqdEkEk2S0jvdve2yACY'
          },
          body: JSON.stringify({
            order_type: 'pickup',
            orderId,
            orderData,
            amount: Math.round(finalTotal * 100), // Convert to cents
            user_id: user.id,
            productList: null
          })
        });

        const data = await response.json();
        
        if (data.error) {
          throw new Error(data.error);
        }

        setClientSecret(data.clientSecret);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    createPaymentIntent();
  }, [orderId, orderData, finalTotal, navigate, user.id]);

  useEffect(() => {
      const handleBeforeUnload = (e) => {
        e.preventDefault();
        e.returnValue = 'Leaving this page may interrupt your payment. Are you sure you want to leave?';
        return e.returnValue;
      };
      window.addEventListener('beforeunload', handleBeforeUnload);
      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
      };
  }, []);
    
  const handlePaymentSuccess = async (data) => {
    try {
      // Update pickup order payment status
      const { error: updateError } = await supabase
        .from('pickup_orders')
        .update({ 
          payment_status: 'paid',
          payment_data: data.payment_data,
          status: 'processing'
        })
        .eq('id', orderId);

      if (updateError) throw updateError;

      toast({ 
        title: "Payment Successful", 
        description: "Your grocery run has been scheduled and payment confirmed." 
      });

      navigate('/grocery-run', { 
        state: { 
          tab: 'upcoming-orders',
          message: 'Your grocery run has been scheduled successfully!'
        }
      });
    } catch (error) {
      console.error('Error updating order:', error);
      setError('Payment successful but failed to update order. Please contact support.');
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
      <div className="container py-8">
        <div className="max-w-md mx-auto text-center">
          <h2 className="text-xl font-semibold text-destructive mb-4">Payment Error</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => navigate('/grocery-run')} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Return to Grocery Run
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="max-w-3xl md:max-w-4xl mx-auto"
      >

        <div className="grid gap-8 md:grid-cols-2">
          {/* Order Summary */}
          <Card className="bg-muted/30 border">
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="w-5 h-5 mr-2" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Pickup Date:</span>
                  <span>{new Date(orderData.pickup_date).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Time Slot:</span>
                  <span>{orderData.time_slot}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Stores:</span>
                  <span>{orderData.stores?.length || 0} stores</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Contact:</span>
                  <span>
                    {orderData.contact_preference === 'whatsapp' 
                      ? `WhatsApp: ${orderData.whatsapp_number}`
                      : `Phone: ${orderData.phone_number}`
                    }
                  </span>
                </div>
              </div>
              <div className="pt-4 border-t">
                <div className="flex justify-between font-semibold">
                  <span>Total Amount:</span>
                  <span className="text-lg">{formatCurrency(finalTotal)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Form */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Details</CardTitle>
            </CardHeader>
            <CardContent>
              <StripeCheckoutForm 
                clientSecret={clientSecret} 
                onPaymentSuccess={handlePaymentSuccess}
              />
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  );
};

export default PickupPaymentPage;