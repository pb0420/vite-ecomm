import React, { useState, useEffect, useMemo } from "react";
import {loadStripe} from '@stripe/stripe-js';
import {Elements, PaymentElement, useStripe, useElements} from '@stripe/react-stripe-js';
import { useCart } from '@/contexts/CartContext';
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate
} from "react-router-dom";


const StripePaymentPage = ({ customerDetails, deliveryDetails }) => {

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
   <>
    
  {/* <Elements options={{clientSecret:'pi_3RTkUbA3GELNlHOQ0c7fMgE3_secret_PiJo0Y5rAWZ3NK2gwLaz8ZBiy'}} stripe={loadStripe("pk_test_L1f0e3XAzjsG7jtp4uN7L9ql")} >   
       <PaymentElement />
    </Elements>  */}

       <div className="p-4 border rounded-lg bg-gray-50">
          <PaymentElement />
      </div> 

     
    </>
  )
  
}

export default StripePaymentPage;