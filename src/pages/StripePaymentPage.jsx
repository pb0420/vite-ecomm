import React, { useState, useEffect, useMemo } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
  useNavigate
} from "react-router-dom";
import StripeCheckoutWrapper from '@/components/checkout/StripeCheckoutForm'; 
  

const StripePaymentPage = ({ customerDetails, deliveryDetails }) => {

  return (

<StripeCheckoutWrapper /> 
     
  )
  
}

export default StripePaymentPage;