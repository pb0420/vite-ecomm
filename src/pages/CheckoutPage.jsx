import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import CheckoutForm from '@/components/checkout/CheckoutForm';
import OrderSummary from '@/components/checkout/OrderSummary';
import DeliveryOptions from '@/components/checkout/DeliveryOptions';
import PaymentSection from '@/components/checkout/PaymentSection';
import PromoCodeInput from '@/components/checkout/PromoCodeInput';
import PhoneLoginForm from '@/components/auth/PhoneLoginForm';
import AddressAutocomplete from '@/components/ui/address-autocomplete';
import { useCart } from '@/contexts/CartContext';
import { useOrders } from '@/contexts/OrderContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { formatCurrency } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { CreditCard, ShoppingCart } from 'lucide-react';
import { fetchPostcodes } from '@/lib/fetchPostcodes';
import { addDays } from 'date-fns';

const CheckoutPage = () => {
  const { cart, getCartTotal, clearCart } = useCart();
  const { addOrder } = useOrders();
  const { user, updateUserInfo } = useAuth();
  const navigate = useNavigate();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deliveryDetails, setDeliveryDetails] = useState({ 
    type: 'express', 
    fee: 0, 
    scheduledTime: null,
    timeslot_id: null 
  });
  const [customerDetails, setCustomerDetails] = useState({ name: '', email: '', phone: '', address: '', deliveryNotes: '' });
  const [formErrors, setFormErrors] = useState({});
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showAccountSetup, setShowAccountSetup] = useState(false);
  const [accountDetails, setAccountDetails] = useState({
    name: '',
    address: '',
    postcode: ''
  });
  const [postcodes, setPostcodes] = useState([]);
  const [filteredPostcodes, setFilteredPostcodes] = useState([]);
  const [postcodeSearch, setPostcodeSearch] = useState('');
  const [showPostcodeDropdown, setShowPostcodeDropdown] = useState(false);
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [serviceFeePercent, setServiceFeePercent] = useState(3);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    const fetchInitialFee = async () => {
      try {
        const { data, error } = await supabase
          .from('delivery_settings')
          .select('express_fee,service_fee_percent')
          .eq('id', 1)
          .single();
        if (error && error.code !== 'PGRST116') throw error;
        setDeliveryDetails(prev => ({ ...prev, fee: data?.express_fee || 9.99 }));
        setServiceFeePercent(data?.service_fee_percent || 3);
      } catch (error) {
        console.error("Error fetching initial delivery fee:", error);
        setDeliveryDetails(prev => ({ ...prev, fee: 9.99 }));
        setServiceFeePercent(3);
      }
    };

  const loadPostcodes = async () => {
    try {
      const data = await fetchPostcodes();
      setPostcodes(data);
      setFilteredPostcodes(data);
    } catch (error) {
      console.error('Error fetching postcodes:', error);
    }
  };

    const checkIfAccountSet = () => {
      if (user) {
        const isAccountIncomplete = !user.name || !user.addresses || user.addresses.length === 0;
        setShowAccountSetup(isAccountIncomplete);
        if (!isAccountIncomplete) {
          // Set cookie to remember account is set up
          document.cookie = "accountSetup=true; max-age=86400"; // 24 hours
        }
      }
    };

    fetchInitialFee();
    loadPostcodes();
    checkIfAccountSet();
  }, [user]);

  useEffect(() => {
    if (postcodeSearch.length === 0) {
      setFilteredPostcodes(postcodes);
    } else {
      const filtered = postcodes.filter(pc => 
        pc.suburb.toLowerCase().includes(postcodeSearch.toLowerCase()) ||
        pc.postcode.includes(postcodeSearch)
      );
      setFilteredPostcodes(filtered);
    }
  }, [postcodeSearch, postcodes]);

  const handleAccountSetup = async (e) => {
    e.preventDefault();
    try {
      await updateUserInfo({
        name: accountDetails.name,
        addresses: [{
          id: Date.now().toString(),
          label: 'Default',
          address: accountDetails.address,
          postcode: accountDetails.postcode
        }]
      });
      setShowAccountSetup(false);
      document.cookie = "accountSetup=true; max-age=86400";
      toast({ title: "Success", description: "Account details updated successfully" });
    } catch (error) {
      console.error('Error updating account:', error);
      toast({ variant: "destructive", title: "Error", description: "Failed to update account details" });
    }
  };

  const handleAddressAutocomplete = (addressDetails) => {
    setAccountDetails(prev => ({
      ...prev,
      address: addressDetails.address,
      postcode: addressDetails.postcode.toString()
    }));
    setPostcodeSearch(`${addressDetails.suburb.toUpperCase()}, ${addressDetails.postcode}`);
  };

  const handlePostcodeSelect = (postcode) => {
    setAccountDetails(prev => ({ ...prev, postcode: postcode.postcode }));
    setPostcodeSearch(`${postcode.suburb}, ${postcode.postcode}`);
    setShowPostcodeDropdown(false);
  };

  const handleDeliveryChange = useCallback((details) => {
    setDeliveryDetails(details);
  }, []);

  const handleDetailsChange = useCallback((details) => {
    setCustomerDetails(details);
  }, []);

  const handlePromoApplied = (promo) => {
    setAppliedPromo(promo);
  };

  const handlePromoRemoved = () => {
    setAppliedPromo(null);
  };

  // cart toal + delivery fee
  const getSubtotal = () => {
    const cartTotal =  Number(getCartTotal() || 0);
    const deliveryFee = Number(deliveryDetails.fee || 0);
    return parseFloat((cartTotal + deliveryFee).toFixed(2));
  };
  const getDiscountAmount = () => {
    return Number(appliedPromo ? appliedPromo.discountAmount : 0);
  };
  const getServiceFee = () => {
    const base = getSubtotal();
    return parseFloat((base * (serviceFeePercent / 100)).toFixed(2));
  };
  const getFinalTotal = () => {
    const subtotal = getSubtotal();
    const discount = getDiscountAmount();
    const serviceFee = getServiceFee();
    const total = subtotal - discount + serviceFee;
    return parseFloat(total.toFixed(2));
  };
  
  if (cart.length === 0 && !isSubmitting) {
    return (
      <div className="container px-4 py-8 mx-auto md:px-6">
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <h2 className="text-2xl font-bold">Your cart is empty</h2>
          <p className="mt-2 text-muted-foreground">Add products to checkout.</p>
          <Button className="mt-4" onClick={() => navigate('/shop')}>Continue Shopping</Button>
        </div>
      </div>
    );
  }

  const orderData = {
    customer_name: customerDetails.name,
    customer_email: customerDetails.email,
    customer_phone: customerDetails.phone,
    customer_address: customerDetails.address,
    customer_postcode: customerDetails.postcode,
    customer_city: customerDetails.city,
    delivery_notes: customerDetails.deliveryNotes,
    delivery_type: deliveryDetails.type,
    scheduled_delivery_time: deliveryDetails.scheduledTime,
    timeslot_id: deliveryDetails.timeslot_id,
    promo_code: appliedPromo?.code || null,
    discount_amount: getDiscountAmount(),
    fees_data: {
      delivery_fee: deliveryDetails.fee,
      service_fee: getServiceFee(),
      total: getFinalTotal(),
      serviceFeePercent: serviceFeePercent
    }
  };

  return (
    <div className="container px-4 py-8 mx-auto md:px-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-3xl font-bold tracking-tight mb-8">Checkout &nbsp;<ShoppingCart style={{display:'inline'}} /></h1>

         <div>
              <Link
          to="/shop"
          className="text-primary font-medium hover:underline text-sm flex items-center gap-1 mb-4"
          style={{ textDecoration: 'none' }}
        >
          Forgot something? <span className="underline">Continue Shopping</span>
        </Link>
          </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_350px]">
          <div className="space-y-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              {!user ? (
                <div className="mt-6 p-6 border rounded-lg bg-muted/30">
                  <h3 className="text-lg font-semibold mb-4">Sign in to Continue</h3>
                  <PhoneLoginForm onSuccess={() => {}} />
                </div>
              ) : showAccountSetup ? (
                <div className="p-6 border rounded-lg bg-muted/30">
                  <h3 className="text-lg font-semibold mb-4">Complete Your Account Details</h3>
                  <form onSubmit={handleAccountSetup} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={accountDetails.name}
                        onChange={(e) => setAccountDetails(prev => ({ ...prev, name: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address">Delivery Address</Label>
                      <AddressAutocomplete
                        value={accountDetails.address}
                        onChange={(value) => setAccountDetails(prev => ({ ...prev, address: value }))}
                        onAddressSelect={handleAddressAutocomplete}
                        placeholder="Start typing your address..."
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="postcode">Suburb & Postcode</Label>
                      <div className="relative">
                        <Input
                          id="postcode"
                          placeholder="Search suburb or postcode..."
                          value={postcodeSearch}
                          onChange={(e) => {
                            setPostcodeSearch(e.target.value);
                            setShowPostcodeDropdown(true);
                          }}
                          onFocus={() => setShowPostcodeDropdown(true)}
                          required
                        />
                        {showPostcodeDropdown && filteredPostcodes.length > 0 && (
                          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                            {filteredPostcodes.slice(0, 10).map((pc) => (
                              <div
                                key={`${pc.suburb}-${pc.postcode}`}
                                className="px-4 py-2 cursor-pointer hover:bg-gray-100 border-b border-gray-100 last:border-b-0"
                                onClick={() => handlePostcodeSelect(pc)}
                              >
                                <div className="text-sm font-medium">{pc.suburb}</div>
                                <div className="text-xs text-gray-500">{pc.postcode}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <Button type="submit">Save Details</Button>
                  </form>
                </div>
              ) : (
                <>
                  <CheckoutForm onDetailsChange={handleDetailsChange} errors={formErrors} />
                  <DeliveryOptions onDeliveryChange={handleDeliveryChange} />
                  <div className="p-6 border rounded-lg">
                    <h3 className="text-lg font-semibold mb-4">Promo Code</h3>
                    <PromoCodeInput
                      subtotal={getSubtotal()}
                      onPromoApplied={handlePromoApplied}
                      appliedPromo={appliedPromo}
                      onPromoRemoved={handlePromoRemoved}
                    />
                  </div>
                </>
              )}
            </motion.div>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.3, delay: 0.2 }}
            className="lg:sticky lg:top-20"
          >
            <OrderSummary 
              deliveryFee={deliveryDetails.fee} 
              appliedPromo={appliedPromo}
              discountAmount={getDiscountAmount()}
              serviceFeePercent={serviceFeePercent}
              serviceFee={getServiceFee()}
            />
          </motion.div>

          <div className="flex items-center space-x-2">
            <Checkbox 
              id="terms" 
              checked={termsAccepted}
              onCheckedChange={setTermsAccepted}
            />
            <Label htmlFor="terms" className="text-sm">
              I agree to the <Link to="/terms" className="text-primary hover:underline" target="_blank">Terms and Conditions</Link> and{' '}
              <Link to="/privacy" className="text-primary hover:underline" target="_blank">Privacy Policy</Link>
            </Label>
          </div>
        </div>
      </motion.div>

      {/* Proceed to Payment Button at the bottom of the page, above the footer */}
      <div className="flex justify-center w-full mt-8 mb-4">
        <Button
          className="w-full max-w-xl text-base h-12 md:h-12 md:text-lg shadow-lg"
          onClick={() => navigate('/stripe-payment',{state: {orderData:orderData,deliveryFee:deliveryDetails.fee, finalTotal: getFinalTotal(), serviceFee: getServiceFee(), discountAmount: getDiscountAmount()}})}
          disabled={!user || !termsAccepted || showAccountSetup || customerDetails.address.length === 0 || getSubtotal() <= 0 || isSubmitting}
        >
          Proceed to Payment &nbsp; <CreditCard />
        </Button>
      </div>
    </div>
  );
};

export default CheckoutPage;