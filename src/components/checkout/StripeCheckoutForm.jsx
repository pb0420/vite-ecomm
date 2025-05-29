import React, { useState, useEffect, useMemo, memo } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {Elements, PaymentElement, useStripe, useElements,CardElement} from '@stripe/react-stripe-js';
import { useCart } from '@/contexts/CartContext';
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
  useNavigate
} from "react-router-dom";

const stripePromise = loadStripe("pk_test_51RU0DpAcyZwL9ZCroHLDNCalx80u736eoFCb3mNARKz2BpDuDhl2VgtPJWp8t0jkaitH7zXOFDiE7B3q95rNColr00V7gqABTc",{
    stripeAccount: 'acct_1RU0DpAcyZwL9ZCr'
  });
const StripeCheckoutWrapper = () => {

  const { cart, getCartTotal, clearCart } = useCart();
  const productIds = cart.map(item => item.id);
  const [stripeCS, setStripeCS] = useState(false);

  useEffect(() => {
    console.log('i fire once');
    async function createPaymentIntent() {
      try {
        const response = await fetch('https://bcbxcnxutotjzmdjeyde.supabase.co/functions/v1/create-checkout-session', {
      headers:{
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjYnhjbnh1dG90anptZGpleWRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY0NjIwODksImV4cCI6MjA2MjAzODA4OX0.sMIn31DXRvBpQsxYZV2nn1lKqdEkEk2S0jvdve2yACY'
      },
      method: 'POST',
      body: JSON.stringify({
        productIds:productIds
      })
    }).then((res) => res.json()).then((data) => setStripeCS(data.clientSecret));
        
        
      } catch (error) {
        console.error("Error creating payment intent:", error);
        setStripeCS(false)
      }
    }

    createPaymentIntent();
  }, []);
  
  return(
   <>
     {stripeCS === false ? (<p>Loading...</p>) : (

       <Elements
          stripe={stripePromise}
          options={{
            clientSecret: stripeCS,
            appearance: { theme: "stripe" },
          }}
        >
          <h1>Checkout</h1>
          <StripeCheckoutForm />
        </Elements> 

     
     )}
      </> 
  );
}

const StripeCheckoutForm = ({ customerDetails, deliveryDetails }) => {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  console.log('el',elements)


  return (
       <form>
          <PaymentElement />
      </form> 
     
  )
  
}

export default StripeCheckoutWrapper;