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
 console.log('open this')
  return (
<div>
  <p>hiii</p>
<StripeCheckoutWrapper /> 
 </div>    
  )
  
}

export default StripePaymentPage;