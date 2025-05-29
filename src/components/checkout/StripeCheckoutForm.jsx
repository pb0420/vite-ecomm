import React, { useState, useEffect, useMemo } from "react";
import {loadStripe} from '@stripe/stripe-js';
import {Elements, PaymentElement, useStripe, useElements} from '@stripe/react-stripe-js';
import { useCart } from '@/contexts/CartContext';
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
  useNavigate
} from "react-router-dom";

const StripeCheckoutWrapper = () => {
  <Elements options = {{ mode:'payment', currency:'usd', amount:1999 , appearance : {
    theme: 'stripe',
  }}} stripe={stripePromise} > 
  <StripeCheckoutForm />
  </Elements>
}
{
  <p>yaaa</p> 
}

const stripePromise = loadStripe("pk_test_L1f0e3XAzjsG7jtp4uN7L9ql");
const StripeCheckoutForm = ({ customerDetails, deliveryDetails }) => {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const { cart, getCartTotal, clearCart } = useCart();
  const productIds = cart.map(item => item.id);
  const [stripeCS, setStripeCS] = useState(false);


  // useEffect(() => {
  //   fetch('https://bcbxcnxutotjzmdjeyde.supabase.co/functions/v1/create-checkout-session', {
  //     headers:{
  //       'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjYnhjbnh1dG90anptZGpleWRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY0NjIwODksImV4cCI6MjA2MjAzODA4OX0.sMIn31DXRvBpQsxYZV2nn1lKqdEkEk2S0jvdve2yACY'
  //     },
  //     method: 'POST',
  //     body: JSON.stringify({
  //       productIds:productIds
  //     })
  //   }).then((res) => res.json()).then((data) => setStripeCS(data.clientSecret));
    
  // }, [])


  return (



       <form>
         here goes the PE
          <PaymentElement />
      </form> 
     
  )
  
}

export default StripeCheckoutWrapper;