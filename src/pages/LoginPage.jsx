
import React from 'react';
import CustomerLoginFormCard from '@/components/auth/CustomerLoginFormCard';
import {Elements,PaymentElement} from '@stripe/react-stripe-js';
import {loadStripe} from '@stripe/stripe-js';

const LoginPage = () => {
  return (
  //   <div className="container px-4 py-8 mx-auto md:px-6">
  //     <CustomerLoginFormCard />
  //   </div>
    <>
<p>login</p>

  <Elements stripe={loadStripe("pk_test_L1f0e3XAzjsG7jtp4uN7L9ql")} options={{
  mode:'payment',
  currency:'aud',
  amount:1999
  }}>   
    <div></div>
      <PaymentElement />
    </Elements> 
      </>
  )
};

export default LoginPage;
  