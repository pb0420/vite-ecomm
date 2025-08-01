import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Store, Clock, Calendar, MessageCircle, Bot, MapPin, Phone, Search, CreditCard, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PhoneLoginForm from '@/components/auth/PhoneLoginForm';
import AddressAutocomplete from '@/components/ui/address-autocomplete';
import StoreSelector from '@/components/pickup/StoreSelector';
import PhotoUpload from '@/components/pickup/PhotoUpload';
import UpcomingOrders from '@/components/pickup/UpcomingOrders';
import PromoCodeInput from '@/components/checkout/PromoCodeInput';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import AddressSelector from '@/components/checkout/AddressSelector';
import { formatCurrency } from '@/lib/utils';
import { Calendar as CalendarPicker } from '@/components/ui/calendar';
import { fetchPostcodes } from '@/lib/fetchPostcodes';
import { addDays } from 'date-fns';
import { Info } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';


import { 
  formatDateForTimezone, 
  formatTimeToAMPM, 
  getCurrentDateInTimezone,
  DEFAULT_TIMEZONE
} from '@/lib/timezone';

const NOTE_SUGGESTIONS = [
  "Call on arrival\n",
  "Leave with reception\n",
  "Knock softly, baby sleeping\n",
  "Text me before delivery\n",
];

const StorePickupPage = () => {
  const { user, userLocation, updateUserInfo } = useAuth();
  const [stores, setStores] = useState([]);
  const [filteredStores, setFilteredStores] = useState([]);
  const [storeSearchQuery, setStoreSearchQuery] = useState('');
  const [upcomingOrders, setUpcomingOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStores, setSelectedStores] = useState([]);
  const [selectedDate, setSelectedDate] = useState(getCurrentDateInTimezone());
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
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
  const [filteredPostcodes, setFilteredPostcodes] = useState([]);
  const [postcodeSearch, setPostcodeSearch] = useState('');
  const [showPostcodeDropdown, setShowPostcodeDropdown] = useState(false);
  const [activeTab, setActiveTab] = useState('new-order');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [timezone, setTimezone] = useState(DEFAULT_TIMEZONE);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [reorderPreviousItems, setReorderPreviousItems] = useState(false);
  const [deliverySettings, setDeliverySettings] = useState({ convenience_fee_percent: 7, service_fee_percent: 3 });
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [userName, setUserName] = useState(user?.name || '');
  const [nameError, setNameError] = useState('');
  const [showInfoModal, setShowInfoModal] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([fetchStores(), loadPostcodes(), fetchTimezone()]);
    if (user) {
      fetchUpcomingOrders();
      // Auto-populate contact preferences if user has phone
      if (user.phone) {
        setPhoneNumber(user.phone);
        setWhatsappNumber(user.phone);
      }
    }
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

  useEffect(() => {
    if (storeSearchQuery.length === 0) {
      setFilteredStores(stores);
    } else {
      const filtered = stores.filter(store => 
        store.name.toLowerCase().includes(storeSearchQuery.toLowerCase()) ||
        store.address.toLowerCase().includes(storeSearchQuery.toLowerCase())
      );
      setFilteredStores(filtered);
    }
  }, [storeSearchQuery, stores]);

  useEffect(() => {
    if (selectedDate) {
      fetchAvailableTimeSlots(selectedDate);
    }
  }, [selectedDate, timezone]);

  useEffect(() => {
    const fetchDeliverySettings = async () => {
      const { data, error } = await supabase
        .from('delivery_settings')
        .select('convenience_fee_percent, service_fee_percent')
        .eq('id', 1)
        .single();
      if (!error && data) {
        setDeliverySettings({
          convenience_fee_percent: data.convenience_fee_percent || 7,
          service_fee_percent: data.service_fee_percent || 3
        });
      }
    };
    fetchDeliverySettings();
  }, []);

  useEffect(()=> {

    if(user && postcodes){
      setUserAddressSuburb();
    }

  },[user,postcodes])

  // Check if user needs to sign in (after store/date/time selection)
  const shouldShowLogin = !user && selectedStores.length > 0 && selectedDate && selectedTimeSlot;

  const setUserAddressSuburb = async() => {
      if(user.addresses && user.addresses?.length > 0){
        setAddress(user.addresses[0].address);
        if(postcodes && postcodes.length){
          const found = postcodes.find(pc =>
            user.addresses[0].address.toUpperCase().includes(pc.suburb.toUpperCase())
          );
          
          if (found) {
            setPostcode(user.addresses[0].postcode);
            setPostcodeSearch(`${found.suburb}, ${found.postcode}`);
          } else {
            setPostcodeSearch('');
          }
        }
      }
  }

  const fetchTimezone = async () => {
    try {
      const { data, error } = await supabase
        .from('delivery_settings')
        .select('timezone')
        .eq('id', 1)
        .single();

      if (!error && data?.timezone) {
        setTimezone(data.timezone);
      }
    } catch (error) {
      console.error('Error fetching timezone:', error);
    }
  };

  const fetchStores = async () => {
    try {
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .order('name');

      if (error) throw error;
      setStores(data || []);
      setFilteredStores(data || []);
    } catch (error) {
      console.error('Error fetching stores:', error);
      toast({ variant: "destructive", title: "Error", description: "Could not load stores." });
    } finally {
      setLoading(false);
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
  
  
  const fetchAvailableTimeSlots = async (date) => {
    setLoadingSlots(true);
    try {
      const dateString = formatDateForTimezone(date, timezone);
      const { data, error } = await supabase
        .from('time_slots')
        .select('*')
        .eq('date', dateString)
        .eq('is_active', true)
        .order('start_time');

      if (error) throw error;
      setAvailableTimeSlots(data || []);
      setSelectedTimeSlot(''); // Reset selection when date changes
    } catch (error) {
      console.error('Error fetching time slots:', error);
      setAvailableTimeSlots([]);
    } finally {
      setLoadingSlots(false);
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
        .in('status', ['pending', 'processing', 'ready'])
        .gte('pickup_date', formatDateForTimezone(getCurrentDateInTimezone(timezone), timezone))
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
      // Find and set the postcode search
      const found = postcodes.find(pc =>
          savedAddress.address.toUpperCase().includes(pc.suburb.toUpperCase())
      );
      if (found) {
        setPostcodeSearch(`${found.suburb}, ${found.postcode}`);
      } else {
        setPostcodeSearch('');
      }
    }
    setShowAddressSelector(false);
  };

  const handleAddressAutocomplete = (addressDetails) => {
    setAddress(addressDetails.address);
    setPostcode(addressDetails.postcode);
    setPostcodeSearch(`${addressDetails.suburb.toUpperCase()}, ${addressDetails.postcode}`);
  };

  const handlePostcodeSelect = (postcodeData) => {
    setPostcode(postcodeData.postcode);
    setPostcodeSearch(`${postcodeData.suburb}, ${postcodeData.postcode}`);
    setShowPostcodeDropdown(false);
  };

  const handlePromoApplied = (promo) => {
    setAppliedPromo(promo);
  };

  const handlePromoRemoved = () => {
    setAppliedPromo(null);
  };

  const handleLoginSuccess = () => {
    setShowLoginForm(false);
    // The user state will be updated automatically by the AuthContext
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
      const minimumOrder = 30;
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
      const subtotal = selectedStores.reduce((total, store) => total + (store.estimatedTotal || 0), 0);
      const discountAmount = appliedPromo ? appliedPromo.discountAmount : 0;
      const finalTotal = getFinalTotal();

      // Get the selected time slot for timeslot_id
      const timeSlot = availableTimeSlots.find(slot => slot.id === selectedTimeSlot);
      const timeSlotDisplay = timeSlot ? `${formatTimeToAMPM(timeSlot.start_time)} - ${formatTimeToAMPM(timeSlot.end_time)}` : '';

      // Create the main pickup order
      const { data: pickupOrder, error: orderError } = await supabase
        .from('pickup_orders')
        .insert({
          user_id: user.id,
          pickup_date: formatDateForTimezone(selectedDate, timezone),
          time_slot: timeSlotDisplay,
          timeslot_id: selectedTimeSlot,
          whatsapp_number: contactPreference === 'whatsapp' ? whatsappNumber : null,
          phone_number: contactPreference === 'phone' ? phoneNumber : null,
          delivery_address: address,
          postcode: postcode,
          photos: photos,
          status: 'pending',
          payment_status: 'pending',
          estimated_total: subtotal, // Use subtotal, not finalTotal
          promo_code: appliedPromo?.code || null,
          discount_amount: discountAmount,
          fees_data: {
              convenience_fee_percent: deliverySettings.convenience_fee_percent,
              service_fee_percent: deliverySettings.service_fee_percent,
              serviceFee: getServiceFee(),
              convenienceFee: getConvenienceFee(),
              deliveryFee: getDeliveryFee()
          },
          admin_messages: reorderPreviousItems ? [{
            from: 'customer',
            message: 'Please reorder my previous items along with this order.',
            timestamp: new Date().toISOString()
          }] : [],
          notes: deliveryNotes // Add delivery notes
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
      // if (appliedPromo) {
      //   await supabase.rpc('increment_promo_usage', { promo_code: appliedPromo.code });
      // }

      //Update user address if not set already

      if(!user.addresses || user.addresses.length === 0){
        const newAddresses = [{
          id: Math.random().toString(36).substr(2, 9),
          label: 'default',
          address,
          postcode
        }];
        updateUserInfo({ addresses: newAddresses });
      }

      // Navigate to payment page
      navigate('/pickup-payment', {
        state: {
          orderId: pickupOrder.id,
          orderData: {
            pickup_date: formatDateForTimezone(selectedDate, timezone),
            time_slot: timeSlotDisplay,
            contact_preference: contactPreference,
            whatsapp_number: contactPreference === 'whatsapp' ? whatsappNumber : null,
            phone_number: contactPreference === 'phone' ? phoneNumber : null,
            delivery_address: address,
            postcode: postcode,
            estimated_total: finalTotal,
            promo_code: appliedPromo?.code || null,
            discount_amount: discountAmount,
            stores: selectedStores,
            fees_data: {
              convenience_fee_percent: deliverySettings.convenience_fee_percent,
              service_fee_percent: deliverySettings.service_fee_percent,
              serviceFee: getServiceFee(),
              convenienceFee: getConvenienceFee(),
              deliveryFee: getDeliveryFee()
            },
            notes: deliveryNotes
          },
          finalTotal
        }
      });
      
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

  // Calculation helpers
  const getSubtotal = () => {
    return Number(orderSummary.subtotal || 0);
  };
  const getDeliveryFee = () => {
    return Number(orderSummary.deliveryFee || 0);
  };
  const getDiscount = () => {
    return Number(orderSummary.discountAmount || 0);
  };
  const getConvenienceFee = () => {
    return parseFloat((getSubtotal() * (deliverySettings.convenience_fee_percent / 100)).toFixed(2));
  };
  const getServiceFee = () => {
    const base = getSubtotal() + getDeliveryFee() + getConvenienceFee();
    return parseFloat((base * (deliverySettings.service_fee_percent / 100)).toFixed(2));
  };
  const getFinalTotal = () => {
    const total = getSubtotal() + getDeliveryFee() + getConvenienceFee() + getServiceFee() - getDiscount();
    return parseFloat(total.toFixed(2));
  };

   // Calculate totals with service charge and highest delivery fee
  const getOrderSummary = () => {
    const subtotal = selectedStores.reduce((total, store) => total + (store.estimatedTotal || 0), 0);
    const serviceCharge = subtotal * 0.10; // 10% service charge
    
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

  const isDateDisabled = (date) => {
    const today = getCurrentDateInTimezone(timezone);
    const todayStr = formatDateForTimezone(today, timezone);
    const dateStr = formatDateForTimezone(date, timezone);
    return dateStr < todayStr;
  };

  // Time slot conflict detection
  const handleTimeSlotChange = (slotId) => {
    const slot = availableTimeSlots.find(s => s.id === slotId);
    if (!slot) return setSelectedTimeSlot(slotId);

    // For each selected store, check if slot is within store hours
    const conflicts = selectedStores
      .map(store => {
        const storeData = stores.find(s => s.id === store.id);
        if (!storeData || !storeData.opening_time || !storeData.closing_time) return null;
        const [slotStartHour, slotStartMin] = slot.start_time.split(':').map(Number);
        const [slotEndHour, slotEndMin] = slot.end_time.split(':').map(Number);
        const [openHour, openMin] = storeData.opening_time.split(':').map(Number);
        const [closeHour, closeMin] = storeData.closing_time.split(':').map(Number);

        const slotStart = slotStartHour * 60 + slotStartMin;
        const slotEnd = slotEndHour * 60 + slotEndMin;
        const open = openHour * 60 + openMin;
        const close = closeHour * 60 + closeMin;

        if (slotStart < open || slotEnd > close) {
          return storeData.name;
        }
        return null;
      })
      .filter(Boolean);

    if (conflicts.length > 0) {
      toast({
        variant: "destructive",
        title: "Store Hours Conflict",
        description: `The selected time slot is outside operating hours for: ${conflicts.join(', ')}. Please choose another slot.`,
      });
      return; // Don't allow selection
    }
    setSelectedTimeSlot(slotId);
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Banner Section with How it Works - Made smaller */}
      <section className="relative min-h-[200px] bg-gradient-to-b from-[#2E8B57] via-[#3CB371] to-white overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://bcbxcnxutotjzmdjeyde.supabase.co/storage/v1/object/public/groceroo_images/assets/outbanner.webp"
            alt="Grocery delivery"
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#2E8B57]/90 via-[#3CB371]/80 to-white/60" />
        </div>
        
        <div className="container relative h-full px-4 md:px-2">
          <div className="flex flex-col justify-center h-full py-2">
            <motion.div 
              className="space-y-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
                <div>
                  <h1 className="text-lg md:text-xl font-bold text-white mb-1 text-left">Grocery Run </h1>
                  <p className="text-white/90 text-xs text-left">Custom shopping at multiple stores!</p>
                </div>
                

              
              <div className="grid gap-1 grid-cols-2 md:grid-cols-4 max-w-2xl mx-auto">
                <div className="flex items-center space-x-2 bg-[#3cb371] rounded-lg p-1.5 h-full">
                  <div className="w-9 h-9 md:w-12 md:h-12 flex items-center justify-center">
                    <Store className="w-7 h-7 md:w-10 md:h-10 text-white" />
                  </div>
                  <div className="flex flex-col justify-center text-left">
                    <h3 className="font-bold text-white text-sm md:text-base leading-tight">1. Add Stores</h3>
                    <p className="text-xs md:text-sm text-white/90">Select stores and set budget</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 bg-[#3cb371] rounded-lg p-1.5 h-full">
                  <div className="w-9 h-9 md:w-12 md:h-12 flex items-center justify-center">
                    <MessageCircle className="w-7 h-7 md:w-10 md:h-10 text-white" />
                  </div>
                  <div className="flex flex-col justify-center text-left">
                    <h3 className="font-bold text-white text-sm md:text-base leading-tight">2. Share Lists</h3>
                    <p className="text-xs md:text-sm text-white/90">Add shopping lists</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 bg-[#3cb371] rounded-lg p-2 h-full">
                  <div className="w-9 h-9 md:w-12 md:h-12 flex items-center justify-center">
                    <Clock className="w-7 h-7 md:w-10 md:h-10 text-white" />
                  </div>
                  <div className="flex flex-col justify-center text-left">
                    <h3 className="font-bold text-white text-sm md:text-base leading-tight">3. We Shop</h3>
                    <p className="text-xs md:text-sm text-white/90">We shop at all stores</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 bg-[#3cb371] rounded-lg p-2 h-full">
                  <div className="w-9 h-9 md:w-12 md:h-12 flex items-center justify-center">
                    <MapPin className="w-7 h-7 md:w-10 md:h-10 text-white" />
                  </div>
                  <div className="flex flex-col justify-center text-left">
                    <h3 className="font-bold text-white text-sm md:text-base leading-tight">4. Delivery</h3>
                    <p className="text-xs md:text-sm text-white/90">All items delivered to you</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
         <Dialog open={showInfoModal} onOpenChange={setShowInfoModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>How it Works?</DialogTitle>
                <DialogDescription>
                  Grocery Run is your convenient way to get groceries from multiple stores without the hassle:
                </DialogDescription>
                <span>
                  <ul className="list-disc pl-4 pb-4 space-y-2 text-sm text-align-left">
                    <li>Select one or more stores and set your budget for each.</li>
                    <li>Add your shopping lists, notes, or provide photos of products or past bills.</li>
                    <li>We shop at all selected stores for you.</li>
                    <li>All items are delivered in to the address provided.</li>
                    <li>Provide delivery instructions and contact preferences.</li>
                    <li>The final amount may change after shopping, and you may be required to pay the difference before delivery</li>
                  </ul>
                </span>
            
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </section>

      <div className="container px-4 py-6 mx-auto md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="max-w-6xl mx-auto"
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="new-order">Schedule</TabsTrigger>
              <TabsTrigger value="upcoming-orders">
                Upcoming ({upcomingOrders.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="new-order" className="space-y-6">
             <Card>
                <CardHeader>
                  <CardTitle>Schedule Grocery Run 
                  
                <button
                  style={{display:'inline'}}
                  type="button"
                  className="ml-2 p-1 rounded-full bg-grey/20 hover:bg-white/30"
                  onClick={() => setShowInfoModal(true)}
                  aria-label="Info"
                >
                  <Info className="w-5 h-5 text-grey" />
                </button>
                  <p className="text-grey/20 text-xs text-left">Order groceries from multiple stores around town!</p>
                  </CardTitle>
                  <CardDescription>
                    Schedule a grocery run by selecting stores, setting a date and time, and providing any special instructions. No alcohol or tobacco orders allowed.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="mb-4 space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-lg font-semibold mb-0">Add Stores</h3>
                        <div className="relative w-64 max-w-full">
                          <Search className="absolute left-2.5 top-3.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="search"
                            placeholder="Search stores..."
                            className="pl-8"
                            value={storeSearchQuery}
                            onChange={(e) => setStoreSearchQuery(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        <span className="font-medium text-green-600">Note:</span> You can provide your order lists/photos after scheduling up to 1 hour before time slot. 
                      </div>
                      <StoreSelector
                        stores={filteredStores}
                        selectedStores={selectedStores}
                        onStoreToggle={setSelectedStores}
                        onNotesChange={() => {}}
                        onEstimatedTotalChange={() => {}}
                        userLocation={userLocation}
                      />
                    </div>
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
                              {selectedDate ? formatDateForTimezone(selectedDate, timezone) : <span>Pick a date</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <div className="p-4">
                              {/* Calendar quick select buttons for today/tomorrow */}
                              <div className="flex gap-2 mb-2">
                                <Button type="button" size="sm" onClick={() => setSelectedDate(new Date())}>Today</Button>
                                <Button type="button" size="sm" onClick={() => setSelectedDate(addDays(new Date(), 1))}>Tomorrow</Button>
                              </div>
                              <CalendarPicker
                                mode="single"
                                selected={selectedDate}
                                onSelect={setSelectedDate}
                                disabled={isDateDisabled}
                                initialFocus
                              />
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div className="space-y-2">
                        <Label>Time Slot</Label>
                        {loadingSlots ? (
                          <div className="flex items-center justify-center py-4">
                            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                          </div>
                        ) : availableTimeSlots.length === 0 ? (
                          <p className="text-sm text-muted-foreground py-2">
                            No available time slots for this date.
                          </p>
                        ) : (
                          <Select value={selectedTimeSlot} onValueChange={handleTimeSlotChange}>
                            <SelectTrigger className={formErrors.timeSlot ? 'border-destructive' : ''}>
                              <SelectValue placeholder="Choose a time slot" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableTimeSlots.map(slot => {
                                // Disable slot if today and start time has passed
                                let disabled = false;
                                if (selectedDate) {
                                  const today = getCurrentDateInTimezone(timezone);
                                  const todayStr = formatDateForTimezone(today, timezone);
                                  const selectedStr = formatDateForTimezone(selectedDate, timezone);
                                  if (selectedStr === todayStr) {
                                    const now = new Date();
                                    const [slotHour, slotMin] = slot.start_time.split(':').map(Number);
                                    const slotStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), slotHour, slotMin);
                                    if (now > slotStart) disabled = true;
                                  }
                                }
                                return (
                                  <SelectItem key={slot.id} value={slot.id} disabled={disabled}>
                                    {formatTimeToAMPM(slot.start_time)} - {formatTimeToAMPM(slot.end_time)}
                                    {disabled && <span className="text-xs text-red-500 ml-2">(Unavailable)</span>}
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                        )}
                        {formErrors.timeSlot && <p className="text-xs text-destructive">{formErrors.timeSlot}</p>}
                      </div>
                    </div>

                    {/* Ask for user name if not set */}
                    {user && !user.name && (
                      <div className="space-y-2">
                        <Label htmlFor="user-name">Your Full Name</Label>
                        <Input
                          id="user-name"
                          value={userName}
                          onChange={e => setUserName(e.target.value)}
                          placeholder="Enter your name"
                          className={nameError ? 'border-destructive' : ''}
                        />
                        {nameError && <p className="text-xs text-destructive">{nameError}</p>}
                        <Button
                          type="button"
                          className="mt-2"
                          onClick={async () => {
                            if (!userName.trim()) {
                              setNameError('Please enter your name');
                              return;
                            }
                            setNameError('');
                            await updateUserInfo({ name: userName.trim() });
                            toast({ title: 'Name updated', description: 'Your name has been saved.' });
                          }}
                        >
                          Save Name
                        </Button>
                      </div>
                    )}

                    {/* Contact preferences - only show if user is logged in */}
                    {user && (
                      <>
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
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="inapp" id="inapp" />
                                <Label htmlFor="inapp">On this site</Label>
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

                        {/* Reorder previous items checkbox */}
                        {/* <div className="flex items-center space-x-2 mt-6">
                          <Checkbox 
                            id="reorder" 
                            checked={reorderPreviousItems}
                            onCheckedChange={setReorderPreviousItems}
                          />
                          <Label htmlFor="reorder" className="text-sm">
                            Reorder my previous items (we'll add them to this order)
                          </Label>
                        </div> */}

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
                              className={formErrors.postcode ? 'border-destructive' : ''}
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
                          {formErrors.postcode && <p className="text-xs text-destructive">{formErrors.postcode}</p>}
                        </div>

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
                        <hr></hr>
                        {/* Selected Stores Pills */}
                        {selectedStores.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-2">
                            {selectedStores.map(store => (
                              <span key={store.id} className="bg-seagreen text-white-800 border border-gray-200 rounded-full px-6 py-1 text-xs font-medium shadow-sm">
                                {store.name}
                              </span>
                            ))}
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
                                <span>{formatCurrency(getSubtotal())}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Convenience Fee ({deliverySettings.convenience_fee_percent}%):</span>
                                <span>{formatCurrency(getConvenienceFee())}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Delivery Fee :</span>
                                <span>{formatCurrency(getDeliveryFee())}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Service Fee ({deliverySettings.service_fee_percent}%):</span>
                                <span>{formatCurrency(getServiceFee())}</span>
                              </div>
                              {appliedPromo && getDiscount() > 0 && (
                                <div className="flex justify-between text-green-600">
                                  <span>Discount ({appliedPromo.code}):</span>
                                  <span>-{formatCurrency(getDiscount())}</span>
                                </div>
                              )}
                              <div className="flex justify-between font-semibold pt-2 border-t">
                                <span>Estimated Total:</span>
                                <span>{formatCurrency(getFinalTotal())}</span>
                              </div>
                            </div>
                          </motion.div>
                        )}

                        {/* Delivery Notes with Suggestions */}
                        <div className="space-y-2">
                          <Label htmlFor="delivery-notes">Delivery Notes</Label>
                          <div className="flex flex-wrap gap-2 mb-2 mt-2 pb-4">
                            {NOTE_SUGGESTIONS.map(suggestion => (
                              <button
                                type="button"
                                key={suggestion}
                                className="px-3 py-1 rounded-full bg-gray-100 hover:bg-primary/10 text-xs border border-gray-200 text-gray-700 transition"
                                onClick={() => setDeliveryNotes(notes => notes ? notes + (notes.endsWith('\n')?'':' ') + suggestion : suggestion)}
                              >
                                {suggestion}
                              </button>
                            ))}
                          </div>
                          <Textarea
                            id="delivery-notes"
                            value={deliveryNotes}
                            onChange={e => setDeliveryNotes(e.target.value)}
                            placeholder="Add instructions (optional)"
                            className={formErrors.deliveryNotes ? 'border-destructive' : ''}
                            rows={3}
                          />
                          {formErrors.deliveryNotes && <p className="text-xs text-destructive">{formErrors.deliveryNotes}</p>}
                          <div className="text-xs text-muted-foreground mt-1">
                            <span className="font-medium text-red-600">Note:</span> The final amount may change after shopping, and you may be required to pay the difference before delivery.
                          </div>
                        </div>

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
                          Proceed to Payment &nbsp;<CreditCard />
                        </Button>
                      </>
                    )}
                  </form>
                    {/* Show login form if user needs to sign in */}
                    {shouldShowLogin && (
                      <Card className="border-primary/20 bg-primary/5">
                        <CardHeader>
                          <CardTitle>Sign in to Continue</CardTitle>
                          <CardDescription>Please sign in to complete your grocery run order</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="max-w-lg mx-auto">
                            <PhoneLoginForm onSuccess={handleLoginSuccess} />
                          </div>
                        </CardContent>
                      </Card>
                    )}
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
        </motion.div>
      </div>
    </div>
  );
};

export default StorePickupPage;