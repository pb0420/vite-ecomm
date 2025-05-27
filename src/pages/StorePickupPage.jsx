import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Store, Clock, Calendar, MessageCircle, Bot, MapPin, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar as CalendarPicker } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import PhoneLoginForm from '@/components/auth/PhoneLoginForm';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import AddressSelector from '@/components/checkout/AddressSelector';
import { formatCurrency } from '@/lib/utils';

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
  const [loading, setLoading] = useState(true);
  const [selectedStore, setSelectedStore] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [estimatedTotal, setEstimatedTotal] = useState('');
  const [showAddressSelector, setShowAddressSelector] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [contactPreference, setContactPreference] = useState('whatsapp');
  const [phoneNumber, setPhoneNumber] = useState('');
  
  const timeSlots = generateTimeSlots();
  const navigate = useNavigate();

  useEffect(() => {
    fetchStores();
  }, []);

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

  const handleAddressSelect = (selectedAddress) => {
    setAddress(selectedAddress);
    setShowAddressSelector(false);
  };

  const validateForm = () => {
    const errors = {};
    if (!selectedStore) errors.store = 'Please select a store';
    if (!selectedTimeSlot) errors.timeSlot = 'Please select a time slot';
    if (contactPreference === 'whatsapp' && !whatsappNumber) {
      errors.whatsapp = 'WhatsApp number is required for WhatsApp communication';
    }
    if (contactPreference === 'phone' && !phoneNumber) {
      errors.phone = 'Phone number is required for SMS/Call communication';
    }
    if (!address) errors.address = 'Delivery address is required';
    if (!estimatedTotal || parseFloat(estimatedTotal) < 50) {
      errors.estimated = 'Minimum order amount is $50';
    }
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
      const { data, error } = await supabase
        .from('pickup_orders')
        .insert({
          user_id: user.id,
          store_id: selectedStore,
          pickup_date: selectedDate.toISOString(),
          time_slot: selectedTimeSlot,
          whatsapp_number: contactPreference === 'whatsapp' ? whatsappNumber : null,
          phone_number: contactPreference === 'phone' ? phoneNumber : null,
          delivery_address: address,
          notes,
          estimated_total: parseFloat(estimatedTotal),
          status: 'pending',
          payment_status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      toast({ title: "Order Created", description: "Your pickup order has been scheduled. We'll contact you shortly." });
      navigate('/account/orders');
    } catch (error) {
      console.error('Error creating pickup order:', error);
      toast({ variant: "destructive", title: "Error", description: "Could not create pickup order." });
    }
  };

  const selectedStoreData = stores.find(store => store.id === selectedStore);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Banner Section */}
      <section className="relative h-[30vh] min-h-[200px] bg-[#F0E68C] overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src="https://images.pexels.com/photos/264636/pexels-photo-264636.jpeg" 
            alt="Store pickup service" 
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#2E8B57]/80 to-[#F0E68C]/50" />
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
              <p className="text-white/90">Let us do the shopping for you!</p>
            </motion.div>
          </div>
        </div>
      </section>

      <div className="container px-8 py-8 mx-auto md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="max-w-4xl mx-auto"
        >
          {/* How it works section */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>How it works</CardTitle>
              <CardDescription>Simple steps to get your groceries</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-3">
                <div className="flex flex-col items-center text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Store className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-medium">1. Choose Store</h3>
                  <p className="text-sm text-muted-foreground">Select your preferred store and pickup time</p>
                </div>
                <div className="flex flex-col items-center text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <MessageCircle className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-medium">2. Share List</h3>
                  <p className="text-sm text-muted-foreground">We'll contact you to get your shopping list</p>
                </div>
                <div className="flex flex-col items-center text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Clock className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-medium">3. We Shop</h3>
                  <p className="text-sm text-muted-foreground">We'll shop and deliver to your address</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-12"> 
            <Card>
              <CardHeader>
                <CardTitle>Schedule a delivery</CardTitle>
                <CardDescription>
                  Fill in your details below
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="store">Select Store</Label>
                    <Select value={selectedStore} onValueChange={setSelectedStore}>
                      <SelectTrigger className={formErrors.store ? 'border-destructive' : ''}>
                        <SelectValue placeholder="Choose a store" />
                      </SelectTrigger>
                      <SelectContent>
                        {stores.map(store => (
                          <SelectItem key={store.id} value={store.id}>
                            {store.name} - Delivery Fee: {formatCurrency(store.store_delivery_fee)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formErrors.store && <p className="text-xs text-destructive">{formErrors.store}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label>Select Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
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

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="address">Delivery Address</Label>
                      {user && user.addresses?.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => e.stopPropagation();setShowAddressSelector(!showAddressSelector)}
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
                    <Input
                      id="address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Enter your delivery address"
                      className={formErrors.address ? 'border-destructive' : ''}
                    />
                    {formErrors.address && <p className="text-xs text-destructive">{formErrors.address}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="estimated">Estimated Total ($)</Label>
                    <Input
                      id="estimated"
                      type="number"
                      min="50"
                      value={estimatedTotal}
                      onChange={(e) => setEstimatedTotal(e.target.value)}
                      placeholder="Enter estimated total amount (min $50)"
                      className={formErrors.estimated ? 'border-destructive' : ''}
                    />
                    {formErrors.estimated && <p className="text-xs text-destructive">{formErrors.estimated}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Additional Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Any special instructions?"
                      rows={3}
                    />
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

                  {!user ? (
                    <PhoneLoginForm onSuccess={() => {}} />
                  ) : (
                    <Button type="submit" className="w-full">Schedule Pickup</Button>
                  )}
                </form>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default StorePickupPage;