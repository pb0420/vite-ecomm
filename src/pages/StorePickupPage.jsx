import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Store, Clock, Calendar, MessageCircle, Bot, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar as CalendarPicker } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import PhoneLoginForm from '@/components/auth/PhoneLoginForm';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import AddressSelector from '@/components/checkout/AddressSelector';

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

  const timeSlots = generateTimeSlots();

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedStore || !selectedDate || !selectedTimeSlot || !whatsappNumber || !address || !estimatedTotal) {
      toast({ variant: "destructive", title: "Missing Information", description: "Please fill in all required fields." });
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
          whatsapp_number: whatsappNumber,
          delivery_address: address,
          notes,
          estimated_total: parseFloat(estimatedTotal),
          status: 'pending',
          payment_status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      toast({ title: "Order Created", description: "Your pickup order has been scheduled. We'll contact you on WhatsApp shortly." });
      navigate('/account/orders');
    } catch (error) {
      console.error('Error creating pickup order:', error);
      toast({ variant: "destructive", title: "Error", description: "Could not create pickup order." });
    }
  };

  if (loading) {
    return (
      <div className="container flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="container px-4 py-8 mx-auto md:px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="max-w-4xl mx-auto"
      >
        <div className="grid gap-8 md:grid-cols-[1fr_400px]">
          <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
            <img 
              src="https://images.pexels.com/photos/264636/pexels-photo-264636.jpeg"
              alt="Store pickup service"
              className="object-cover w-full h-full"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-0 left-0 p-6 text-white">
              <h2 className="text-2xl font-bold mb-2">Grocery Run</h2>
              <p className="text-white/90">Let us do the shopping for you!</p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Schedule a run</CardTitle>
              <CardDescription>
                Fill in your details below
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="store">Select Store</Label>
                  <Select value={selectedStore} onValueChange={setSelectedStore}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a store" />
                    </SelectTrigger>
                    <SelectContent>
                      {stores.map(store => (
                        <SelectItem key={store.id} value={store.id}>
                          {store.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                    <SelectTrigger>
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
                </div>

                <div className="space-y-2">
                  <Label htmlFor="whatsapp">WhatsApp Number</Label>
                  <Input
                    id="whatsapp"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    placeholder="Enter your WhatsApp number"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="address">Delivery Address</Label>
                    {user && user.addresses?.length > 0 && (
                      <Button
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
                  <Input
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Enter your delivery address"
                  />
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
                  />
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

                {!user ? (
                  <PhoneLoginForm onSuccess={() => {}} />
                ) : (
                  <Button type="submit" className="w-full">Schedule Pickup</Button>
                )}

                <div className="rounded-lg bg-muted p-4 text-sm">
                  <h4 className="font-medium mb-2">How it works:</h4>
                  <ul className="space-y-2">
                    <li className="flex items-center">
                      <Store className="w-4 h-4 mr-2 text-primary" />
                      Choose your preferred store and time
                    </li>
                    <li className="flex items-center">
                      <MessageCircle className="w-4 h-4 mr-2 text-primary" />
                      Share your list via WhatsApp
                    </li>
                    <li className="flex items-center">
                      <Clock className="w-4 h-4 mr-2 text-primary" />
                      We'll shop and send the final bill
                    </li>
                  </ul>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  );
};

export default StorePickupPage;