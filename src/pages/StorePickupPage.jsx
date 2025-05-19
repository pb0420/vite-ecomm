import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Store, Clock, Calendar, WhatsappLogo } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/components/ui/use-toast';

const StorePickupPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stores, setStores] = useState([]);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStore, setSelectedStore] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [estimatedTotal, setEstimatedTotal] = useState('');

  useEffect(() => {
    if (!user) {
      toast({ title: "Authentication Required", description: "Please sign in to schedule a store pickup." });
      navigate('/login');
      return;
    }

    fetchStores();
  }, [user, navigate]);

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

  const fetchSlots = async (storeId) => {
    try {
      const { data, error } = await supabase
        .from('pickup_slots')
        .select('*')
        .eq('store_id', storeId)
        .order('start_time');

      if (error) throw error;
      setSlots(data || []);
    } catch (error) {
      console.error('Error fetching slots:', error);
      toast({ variant: "destructive", title: "Error", description: "Could not load time slots." });
    }
  };

  const handleStoreChange = (value) => {
    setSelectedStore(value);
    setSelectedSlot('');
    fetchSlots(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedStore || !selectedSlot || !whatsappNumber || !estimatedTotal) {
      toast({ variant: "destructive", title: "Missing Information", description: "Please fill in all required fields." });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('pickup_orders')
        .insert({
          user_id: user.id,
          store_id: selectedStore,
          slot_id: selectedSlot,
          whatsapp_number: whatsappNumber,
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
        className="max-w-2xl mx-auto"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Schedule Store Pickup</h1>
          <p className="mt-2 text-muted-foreground">
            Choose a store and time slot, and we'll help you with your grocery shopping.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Pickup Details</CardTitle>
            <CardDescription>
              Fill in the details below to schedule your pickup.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="store">Select Store</Label>
                <Select value={selectedStore} onValueChange={handleStoreChange}>
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

              {selectedStore && (
                <div className="space-y-2">
                  <Label htmlFor="slot">Select Time Slot</Label>
                  <Select value={selectedSlot} onValueChange={setSelectedSlot}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a time slot" />
                    </SelectTrigger>
                    <SelectContent>
                      {slots.map(slot => (
                        <SelectItem key={slot.id} value={slot.id}>
                          {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

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
                <Label htmlFor="estimated">Estimated Total (₹)</Label>
                <Input
                  id="estimated"
                  type="number"
                  value={estimatedTotal}
                  onChange={(e) => setEstimatedTotal(e.target.value)}
                  placeholder="Enter estimated total amount"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any special instructions or requests?"
                  rows={4}
                />
              </div>

              <div className="space-y-4">
                <div className="rounded-lg bg-muted p-4 text-sm">
                  <h4 className="font-medium mb-2">How it works:</h4>
                  <ul className="space-y-2">
                    <li className="flex items-center">
                      <Store className="w-4 h-4 mr-2 text-primary" />
                      Choose your preferred store and time slot
                    </li>
                    <li className="flex items-center">
                      <WhatsappLogo className="w-4 h-4 mr-2 text-primary" />
                      We'll contact you on WhatsApp for your grocery list
                    </li>
                    <li className="flex items-center">
                      <Clock className="w-4 h-4 mr-2 text-primary" />
                      We'll shop for you and send the final bill
                    </li>
                    <li className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2 text-primary" />
                      Pay within 10 minutes and pick up at your chosen time
                    </li>
                  </ul>
                </div>

                <Button type="submit" className="w-full">
                  Schedule Pickup
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default StorePickupPage;