import React, { useState, useEffect, useMemo } from "react";
import {loadStripe} from '@stripe/stripe-js';
import {CheckoutProvider} from '@stripe/react-stripe-js';
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate
} from "react-router-dom";
import StripeCheckoutForm from '@/components/checkout/StripeCheckoutForm';


const stripePromise = loadStripe("pk_test_L1f0e3XAzjsG7jtp4uN7L9ql");

const Return = () => {
  const [status, setStatus] = useState(null);
  const [customerEmail, setCustomerEmail] = useState('');

  useEffect(() => {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const sessionId = urlParams.get('session_id');

    fetch(`/session-status?session_id=${sessionId}`)
      .then((res) => res.json())
      .then((data) => {
        setStatus(data.status);
        setCustomerEmail(data.customer_email);
      });
  }, []);

  if (status === 'open') {
    return (
      <Navigate to="/checkout" />
    )
  }

  if (status === 'complete') {
    return (
      <section id="success">
        <p>
Success. Redirecting...
        </p>
      </section>
    )
  }

  return null;
}

const StripePaymentPage = ({ customerDetails, deliveryDetails }) => {
  
  const promise = useMemo(() => {
    return fetch('https://bcbxcnxutotjzmdjeyde.supabase.co/functions/v1/create-checkout-session', {
      headers:{
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjYnhjbnh1dG90anptZGpleWRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY0NjIwODksImV4cCI6MjA2MjAzODA4OX0.sMIn31DXRvBpQsxYZV2nn1lKqdEkEk2S0jvdve2yACY'
      }
      method: 'POST',
      data: {
        productIds:[1,2,3]
      }
    })
      .then((res) => res.json())
      .then((data) => data.clientSecret);
  }, []);

  const appearance = {
    theme: 'stripe',
  };

  return (
    <div>

        <CheckoutProvider
          stripe={stripePromise}
          options={{
            fetchClientSecret: () => promise,
            elementsOptions: {appearance},
          }}
        >
          <Routes>
            <Route path="/stripecheckout" element={<StripeCheckoutForm />} />
            <Route path="/return" element={<Return />} />
          </Routes>
        </CheckoutProvider>
      
    </div>
  )
  
}

export default StripePaymentPage;