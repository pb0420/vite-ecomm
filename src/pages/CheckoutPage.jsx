import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
import { CreditCard } from 'lucide-react';

const CheckoutPage = () => {
  const { cart, getCartTotal, clearCart } = useCart();
  const { addOrder } = useOrders();
  const { user, updateUserInfo } = useAuth();
  const navigate = useNavigate();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deliveryDetails, setDeliveryDetails] = useState({ type: 'express', fee: 0, scheduledTime: null });
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
  const [appliedPromo, setAppliedPromo] = useState(null);

  useEffect(() => {
    const fetchInitialFee = async () => {
      try {
        const { data, error } = await supabase
          .from('delivery_settings')
          .select('express_fee')
          .eq('id', 1)
          .single();
        if (error && error.code !== 'PGRST116') throw error;
        setDeliveryDetails(prev => ({ ...prev, fee: data?.express_fee || 9.99 }));
      } catch (error) {
        console.error("Error fetching initial delivery fee:", error);
        setDeliveryDetails(prev => ({ ...prev, fee: 9.99 }));
      }
    };

    const fetchPostcodes = async () => {
      const { data, error } = await supabase
        .from('postcodes')
        .select('*')
        .order('suburb');
      
      if (error) {
        console.error('Error fetching postcodes:', error);
        return;
      }
      
      setPostcodes(data);
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
    fetchPostcodes();
    checkIfAccountSet();
  }, [user]);

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
      postcode: addressDetails.postcode
    }));
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

  const getSubtotal = () => {
    return getCartTotal();
  };

  const getDiscountAmount = () => {
    return appliedPromo ? appliedPromo.discountAmount : 0;
  };

  const getFinalTotal = () => {
    const subtotal = getSubtotal();
    const discount = getDiscountAmount();
    const deliveryFee = deliveryDetails.fee;
    return subtotal - discount + deliveryFee;
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
    promo_code: appliedPromo?.code || null,
    discount_amount: getDiscountAmount(),
  };

  return (
    <div className="container px-4 py-8 mx-auto md:px-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-3xl font-bold tracking-tight mb-8">Checkout</h1>

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
                      <Label htmlFor="postcode">Postcode</Label>
                      <Select 
                        value={accountDetails.postcode} 
                        onValueChange={(value) => setAccountDetails(prev => ({ ...prev, postcode: value }))}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select suburb" />
                        </SelectTrigger>
                        <SelectContent>
                          {postcodes.map((pc) => (
                            <SelectItem key={pc.id} value={pc.postcode}>
                              {pc.suburb} ({pc.postcode})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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

          <div style={{marginTop:'20px',zIndex:1}}>
            <Button 
              onClick={() => navigate('/stripe-payment',{state: {orderData:orderData,deliveryFee:deliveryDetails.fee, finalTotal: getFinalTotal()}})} 
              disabled={!user || !termsAccepted || showAccountSetup}
            >
              Proceed to Payment &nbsp; <CreditCard />
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default CheckoutPage;