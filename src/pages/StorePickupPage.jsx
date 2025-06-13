import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Store, Clock, Calendar, MessageCircle, Bot, MapPin, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PhoneLoginForm from '@/components/auth/PhoneLoginForm';
import AddressAutocomplete from '@/components/ui/address-autocomplete';
import StoreSelector from '@/components/pickup/StoreSelector';
import PhotoUpload from '@/components/pickup/PhotoUpload';
import UpcomingOrders from '@/components/pickup/UpcomingOrders';
import PromoCodeInput from '@/components/checkout/PromoCodeInput';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import AddressSelector from '@/components/checkout/AddressSelector';
import { formatCurrency } from '@/lib/utils';
import { Calendar as CalendarPicker } from '@/components/ui/calendar';

const generateTimeSlots = () => {
  const slots = [];
  for (let hour = 9; hour < 21; hour += 2) {
    const startTime = `${hour.toString().padStart(2, '0')}:00`;
    const endTime = `${(hour + 2).toString().padStart(2, '0')}:00`;
    slots.push({ id: `${startTime}-${endTime}`, label: `${startTime} - ${endTime}` });
  }
  return slots;
};

const StorePickupPage = () => {
  const { user } = useAuth();
  const [stores, setStores] = useState([]);
  const [upcomingOrders, setUpcomingOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStores, setSelectedStores] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [address, setAddress] = useState('');
  const [postcode, setPostcode] = useState('');
  const [photos, setPhotos] = useState([]);
  const [showAddressSelector, setShowAddressSelector] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [contactPreference, setContactPreference] = useState('whatsapp');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [postcodes, setPostcodes] = useState([]);
  const [activeTab, setActiveTab] = useState('new-order');
  const [appliedPromo, setAppliedPromo] = useState(null);
  
  const timeSlots = generateTimeSlots();
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([fetchStores(), fetchPostcodes()]);
    if (user) {
      fetchUpcomingOrders();
    }
  }, [user]);

  const fetchStores = async () => {
    try {
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .order('name');

      if (error) throw error;
      setStores(data || []);
    } catch (error) {
      console.error('Error fetching stores:', error);
      toast({ variant: "destructive", title: "Error", description: "Could not load stores." });
    } finally {
      setLoading(false);
    }
  };

  const fetchPostcodes = async () => {
    try {
      const { data, error } = await supabase
        .from('postcodes')
        .select('*')
        .order('suburb');
      
      if (error) throw error;
      setPostcodes(data || []);
    } catch (error) {
      console.error('Error fetching postcodes:', error);
      toast({ variant: "destructive", title: "Error", description: "Could not load postcodes." });
    }
  };

  const fetchUpcomingOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('pickup_orders')
        .select(`
          *,
          pickup_order_stores (
            store_id,
            estimated_total,
            actual_total,
            notes,
            status,
            stores (name)
          )
        `)
        .eq('user_id', user.id)
        .gte('pickup_date', new Date().toISOString().split('T')[0])
        .order('pickup_date', { ascending: true });

      if (error) throw error;
      setUpcomingOrders(data || []);
    } catch (error) {
      console.error('Error fetching upcoming orders:', error);
      toast({ variant: "destructive", title: "Error", description: "Could not load upcoming orders." });
    }
  };

  const handleAddressSelect = (selectedAddress) => {
    const savedAddress = user.addresses.find(addr => addr.address === selectedAddress);
    if (savedAddress) {
      setAddress(savedAddress.address);
      setPostcode(savedAddress.postcode);
    }
    setShowAddressSelector(false);
  };

  const handleAddressAutocomplete = (addressDetails) => {
    setAddress(addressDetails.address);
    setPostcode(addressDetails.postcode);
  };

  const handlePromoApplied = (promo) => {
    setAppliedPromo(promo);
  };

  const handlePromoRemoved = () => {
    setAppliedPromo(null);
  };

  const validateForm = () => {
    const errors = {};
    if (selectedStores.length === 0) errors.stores = 'Please select at least one store';
    if (!selectedTimeSlot) errors.timeSlot = 'Please select a time slot';
    if (contactPreference === 'whatsapp' && !whatsappNumber) {
      errors.whatsapp = 'WhatsApp number is required for WhatsApp communication';
    }
    if (contactPreference === 'phone' && !phoneNumber) {
      errors.phone = 'Phone number is required for SMS/Call communication';
    }
    if (!address) errors.address = 'Delivery address is required';
    if (!postcode) errors.postcode = 'Please select a postcode';
    
    // Validate minimum order amounts
    selectedStores.forEach((store, index) => {
      const minimumOrder = 50 + index * 25;
      if (!store.estimatedTotal || store.estimatedTotal < minimumOrder) {
        errors[`store_${store.id}`] = `Minimum order for this store is ${formatCurrency(minimumOrder)}`;
      }
    });

    if (!termsAccepted) {
      errors.terms = 'You must accept the terms and conditions';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast({ variant: "destructive", title: "Missing Information", description: "Please fill in all required fields and accept the terms." });
      return;
    }

    try {
      const subtotal = selectedStores.reduce((total, store) => total + store.estimatedTotal, 0);
      const discountAmount = appliedPromo ? appliedPromo.discountAmount : 0;
      const finalTotal = subtotal - discountAmount;

      // Create the main pickup order
      const { data: pickupOrder, error: orderError } = await supabase
        .from('pickup_orders')
        .insert({
          user_id: user.id,
          pickup_date: selectedDate.toISOString().split('T')[0],
          time_slot: selectedTimeSlot,
          whatsapp_number: contactPreference === 'whatsapp' ? whatsappNumber : null,
          phone_number: contactPreference === 'phone' ? phoneNumber : null,
          delivery_address: address,
          postcode: postcode,
          photos: photos,
          status: 'pending',
          payment_status: 'pending',
          estimated_total: finalTotal,
          promo_code: appliedPromo?.code || null,
          discount_amount: discountAmount
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create entries for each selected store
      const storeOrders = selectedStores.map(store => ({
        pickup_order_id: pickupOrder.id,
        store_id: store.id,
        estimated_total: store.estimatedTotal,
        notes: store.notes,
        status: 'pending'
      }));

      const { error: storeOrdersError } = await supabase
        .from('pickup_order_stores')
        .insert(storeOrders);

      if (storeOrdersError) throw storeOrdersError;

      // Update promo code usage if applied
      if (appliedPromo) {
        await supabase.rpc('increment_promo_usage', { promo_code: appliedPromo.code });
      }

      toast({ title: "Order Created", description: "Your pickup order has been scheduled. We'll contact you shortly." });
      
      // Reset form
      setSelectedStores([]);
      setSelectedTimeSlot('');
      setWhatsappNumber('');
      setPhoneNumber('');
      setPhotos([]);
      setTermsAccepted(false);
      setAppliedPromo(null);
      
      // Refresh upcoming orders and switch to that tab
      fetchUpcomingOrders();
      setActiveTab('upcoming-orders');
      
    } catch (error) {
      console.error('Error creating pickup order:', error);
      toast({ variant: "destructive", title: "Error", description: "Could not create pickup order." });
    }
  };

  const handleSendMessage = async (orderId, message) => {
    try {
      // Get current order
      const { data: currentOrder, error: fetchError } = await supabase
        .from('pickup_orders')
        .select('admin_messages')
        .eq('id', orderId)
        .single();

      if (fetchError) throw fetchError;

      const currentMessages = currentOrder.admin_messages || [];
      const newMessage = {
        from: 'customer',
        message: message,
        timestamp: new Date().toISOString()
      };

      const { error: updateError } = await supabase
        .from('pickup_orders')
        .update({
          admin_messages: [...currentMessages, newMessage]
        })
        .eq('id', orderId);

      if (updateError) throw updateError;

      toast({ title: "Message sent", description: "Your message has been sent to the admin." });
      fetchUpcomingOrders(); // Refresh to show new message
    } catch (error) {
      console.error('Error sending message:', error);
      toast({ variant: "destructive", title: "Error", description: "Could not send message." });
    }
  };

  // Calculate totals with service charge and highest delivery fee
  const getOrderSummary = () => {
    const subtotal = selectedStores.reduce((total, store) => total + (store.estimatedTotal || 0), 0);
    const serviceCharge = subtotal * 0.12; // 12% service charge
    
    // Get highest delivery fee instead of sum
    const highestDeliveryFee = selectedStores.reduce((highest, selectedStore) => {
      const store = stores.find(s => s.id === selectedStore.id);
      const deliveryFee = store?.store_delivery_fee || 0;
      return Math.max(highest, deliveryFee);
    }, 0);

    const discountAmount = appliedPromo ? appliedPromo.discountAmount : 0;
    const total = subtotal + serviceCharge + highestDeliveryFee - discountAmount;
    
    return {
      subtotal,
      serviceCharge,
      deliveryFee: highestDeliveryFee,
      discountAmount,
      total
    };
  };

  const orderSummary = getOrderSummary();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Banner Section */}
      <section className="relative h-[30vh] min-h-[200px] bg-[#F0E68C] overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src="/banner_bg.jpg" 
            alt="Fresh groceries" 
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#99C54F]/80 to-[#FFD580]/50" />
        </div>
        
        <div className="container relative h-full px-4 md:px-6">
          <div className="flex flex-col justify-center h-full max-w-2xl">
            <motion.div 
              className="space-y-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-3xl md:text-4xl font-bold text-white">Grocery Run</h1>
              <p className="text-white/90">Let us do the shopping for you at multiple stores!</p>
            </motion.div>
          </div>
        </div>
      </section>

      <div className="container px-8 py-8 mx-auto md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="max-w-6xl mx-auto"
        >
          {/* How it works section */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>How it works</CardTitle>
              <CardDescription>Simple steps to get your groceries from multiple stores</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-4">
                <div className="flex flex-col items-center text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Store className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-medium">1. Choose Stores</h3>
                  <p className="text-sm text-muted-foreground">Select one or more stores and set your budget for each</p>
                </div>
                <div className="flex flex-col items-center text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <MessageCircle className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-medium">2. Share Lists</h3>
                  <p className="text-sm text-muted-foreground">Add shopping lists and photos for each store</p>
                </div>
                <div className="flex flex-col items-center text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Clock className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-medium">3. We Shop</h3>
                  <p className="text-sm text-muted-foreground">We'll shop at all selected stores during your time slot</p>
                </div>
                <div className="flex flex-col items-center text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-medium">4. Delivery</h3>
                  <p className="text-sm text-muted-foreground">All items delivered to your address in one trip</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {!user ? (
            <Card>
              <CardHeader>
                <CardTitle>Sign in to Continue</CardTitle>
                <CardDescription>Please sign in to schedule a grocery run</CardDescription>
              </CardHeader>
              <CardContent>
                <PhoneLoginForm onSuccess={() => {}} />
              </CardContent>
            </Card>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="new-order">New Order</TabsTrigger>
                <TabsTrigger value="upcoming-orders">
                  Upcoming Orders ({upcomingOrders.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="new-order" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Schedule a Multi-Store Run</CardTitle>
                    <CardDescription>
                      Add one or more stores and we'll shop at all of them for you
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <StoreSelector
                        stores={stores}
                        selectedStores={selectedStores}
                        onStoreToggle={setSelectedStores}
                        onNotesChange={() => {}}
                        onEstimatedTotalChange={() => {}}
                      />
                      {formErrors.stores && <p className="text-xs text-destructive">{formErrors.stores}</p>}

                      <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Select Date</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                type="button"
                                variant="outline"
                                className={cn(
                                  "w-full justify-start text-left font-normal",
                                  !selectedDate && "text-muted-foreground"
                                )}
                              >
                                <Calendar className="mr-2 h-4 w-4" />
                                {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <CalendarPicker
                                mode="single"
                                selected={selectedDate}
                                onSelect={setSelectedDate}
                                disabled={(date) => date < new Date()}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>

                        <div className="space-y-2">
                          <Label>Time Slot</Label>
                          <Select value={selectedTimeSlot} onValueChange={setSelectedTimeSlot}>
                            <SelectTrigger className={formErrors.timeSlot ? 'border-destructive' : ''}>
                              <SelectValue placeholder="Choose a time slot" />
                            </SelectTrigger>
                            <SelectContent>
                              {timeSlots.map(slot => (
                                <SelectItem key={slot.id} value={slot.id}>
                                  {slot.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {formErrors.timeSlot && <p className="text-xs text-destructive">{formErrors.timeSlot}</p>}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Contact Preference</Label>
                          <RadioGroup value={contactPreference} onValueChange={setContactPreference} className="grid gap-2">
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="whatsapp" id="whatsapp" />
                              <Label htmlFor="whatsapp">WhatsApp</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="phone" id="phone" />
                              <Label htmlFor="phone">SMS/Call</Label>
                            </div>
                          </RadioGroup>
                        </div>

                        {contactPreference === 'whatsapp' && (
                          <div className="space-y-2">
                            <Label htmlFor="whatsapp">WhatsApp Number</Label>
                            <Input
                              id="whatsapp"
                              value={whatsappNumber}
                              onChange={(e) => setWhatsappNumber(e.target.value)}
                              placeholder="Enter your WhatsApp number"
                              className={formErrors.whatsapp ? 'border-destructive' : ''}
                            />
                            {formErrors.whatsapp && <p className="text-xs text-destructive">{formErrors.whatsapp}</p>}
                          </div>
                        )}

                        {contactPreference === 'phone' && (
                          <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input
                              id="phone"
                              value={phoneNumber}
                              onChange={(e) => setPhoneNumber(e.target.value)}
                              placeholder="Enter your phone number"
                              className={formErrors.phone ? 'border-destructive' : ''}
                            />
                            {formErrors.phone && <p className="text-xs text-destructive">{formErrors.phone}</p>}
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="address">Delivery Address</Label>
                          {user && user.addresses?.length > 0 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setShowAddressSelector(!showAddressSelector)}
                              className="flex items-center text-primary"
                            >
                              <MapPin className="w-4 h-4 mr-1" />
                              {showAddressSelector ? 'Hide saved addresses' : 'Use saved address'}
                            </Button>
                          )}
                        </div>
                        {showAddressSelector && (
                          <AddressSelector onSelect={handleAddressSelect} />
                        )}
                        <AddressAutocomplete
                          value={address}
                          onChange={setAddress}
                          onAddressSelect={handleAddressAutocomplete}
                          placeholder="Start typing your address..."
                          className={formErrors.address ? 'border-destructive' : ''}
                        />
                        {formErrors.address && <p className="text-xs text-destructive">{formErrors.address}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="postcode">Postcode</Label>
                        <Select value={postcode} onValueChange={setPostcode}>
                          <SelectTrigger className={formErrors.postcode ? 'border-destructive' : ''}>
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
                        {formErrors.postcode && <p className="text-xs text-destructive">{formErrors.postcode}</p>}
                      </div>

                      <PhotoUpload
                        photos={photos}
                        onPhotosChange={setPhotos}
                        maxPhotos={10}
                      />

                      {/* Promo Code Section */}
                      {selectedStores.length > 0 && (
                        <div className="p-4 border rounded-lg">
                          <h4 className="font-semibold mb-4">Promo Code</h4>
                          <PromoCodeInput
                            subtotal={orderSummary.subtotal}
                            onPromoApplied={handlePromoApplied}
                            appliedPromo={appliedPromo}
                            onPromoRemoved={handlePromoRemoved}
                          />
                        </div>
                      )}

                      {/* Order Summary with Service Charge */}
                      {selectedStores.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-4 border rounded-lg bg-muted/30"
                        >
                          <h4 className="font-semibold mb-2">Order Summary</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span>Estimated Subtotal:</span>
                              <span>{formatCurrency(orderSummary.subtotal)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Service Charge (12%):</span>
                              <span>{formatCurrency(orderSummary.serviceCharge)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Delivery Fee (Highest):</span>
                              <span>{formatCurrency(orderSummary.deliveryFee)}</span>
                            </div>
                            {appliedPromo && orderSummary.discountAmount > 0 && (
                              <div className="flex justify-between text-green-600">
                                <span>Discount ({appliedPromo.code}):</span>
                                <span>-{formatCurrency(orderSummary.discountAmount)}</span>
                              </div>
                            )}
                            <div className="flex justify-between font-semibold pt-2 border-t">
                              <span>Estimated Total:</span>
                              <span>{formatCurrency(orderSummary.total)}</span>
                            </div>
                          </div>
                        </motion.div>
                      )}

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
                      {formErrors.terms && <p className="text-xs text-destructive">{formErrors.terms}</p>}

                      <Button type="submit" className="w-full" disabled={selectedStores.length === 0}>
                        Schedule Multi-Store Run
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="upcoming-orders">
                <UpcomingOrders 
                  orders={upcomingOrders} 
                  onSendMessage={handleSendMessage}
                />
              </TabsContent>
            </Tabs>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default StorePickupPage;