
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
<p>jdfksdfjksdf</p>

  <Elements options={{clientSecret:'pi_3RTkUbA3GELNlHOQ0c7fMgE3_secret_PiJo0Y5rAWZ3NK2gwLaz8ZBiy'}} stripe={loadStripe("pk_test_L1f0e3XAzjsG7jtp4uN7L9ql")} >   
      <PaymentElement />
    </Elements> 
      </>
  )
};

export default LoginPage;
  