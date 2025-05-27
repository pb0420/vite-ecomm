import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { useOrders } from '@/contexts/OrderContext';
import { toast } from '@/components/ui/use-toast';

const PaymentSection = ({ customerDetails, deliveryDetails }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { cart, getCartTotal, clearCart } = useCart();
  const { addOrder } = useOrders();

  useEffect(() => {
    const success = searchParams.get('success');
    const sessionId = searchParams.get('session_id');

    if (success === 'true' && sessionId) {
      handlePaymentSuccess(sessionId);
    } else if (success === 'false') {
      toast({ 
        variant: "destructive", 
        title: "Payment Failed", 
        description: "Your payment was not completed. Please try again." 
      });
    }
  }, [searchParams]);

  const handlePaymentSuccess = async (sessionId) => {
    try {
      const orderData = {
        items: cart,
        total: getCartTotal() + deliveryDetails.fee,
        customer: customerDetails,
        deliveryType: deliveryDetails.type,
        scheduledDeliveryTime: deliveryDetails.scheduledTime,
        deliveryFee: deliveryDetails.fee,
      };

      const order = await addOrder(orderData);
      clearCart();
      navigate(`/order-confirmation/${order.id}`);
    } catch (error) {
      console.error('Error creating order:', error);
      toast({ 
        variant: "destructive", 
        title: "Error", 
        description: "There was a problem creating your order." 
      });
    }
  };

  const handleCheckout = async () => {
    setIsProcessing(true);
    try {
      const productIds = cart.map(item => item.id);
      
      const response = await fetch(`/functions/v1/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          productIds,
          deliveryFee: deliveryDetails.fee,
          customerDetails,
          deliveryNotes: customerDetails.deliveryNotes,
          deliveryType: deliveryDetails.type,
          scheduledTime: deliveryDetails.scheduledTime,
        }),
      });

      const { url, error } = await response.json();
      
      if (error) throw new Error(error);
      if (url) window.location.href = url;
      
    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast({ 
        variant: "destructive", 
        title: "Checkout Error", 
        description: "Could not initiate checkout. Please try again." 
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-6 border rounded-lg">
      <h2 className="flex items-center text-xl font-semibold mb-4">
        <CreditCard className="mr-2 h-5 w-5 text-primary" />
        Payment Method
      </h2>
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Secure payment processing powered by Stripe
        </p>
        <Button 
          className="w-full" 
          onClick={handleCheckout}
          disabled={isProcessing}
        >
          {isProcessing ? 'Processing...' : 'Proceed to Payment'}
        </Button>
      </div>
    </div>
  );
};

export default PaymentSection;