
import React, { useState, useEffect } from 'react';
import { format } from "date-fns";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { motion } from 'framer-motion'; // Import motion
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from '@/lib/supabaseClient';
import { formatCurrency } from '@/lib/utils';

const generateTimeSlots = (startHour, endHour, intervalMinutes = 30) => {
  const slots = [];
  const startDate = new Date();
  startDate.setHours(startHour, 0, 0, 0);

  const endDate = new Date();
  endDate.setHours(endHour, 0, 0, 0);

  let currentTime = new Date(startDate);

  while (currentTime < endDate) {
    slots.push(
      format(currentTime, "HH:mm") // Format as HH:mm (24-hour)
    );
    currentTime.setMinutes(currentTime.getMinutes() + intervalMinutes);
  }
  return slots;
};

const DeliveryOptions = ({ onDeliveryChange }) => {
  const [deliveryType, setDeliveryType] = useState('express');
  const [scheduledDate, setScheduledDate] = useState(null);
  const [scheduledTime, setScheduledTime] = useState('');
  const [deliveryFees, setDeliveryFees] = useState({ express: 0, scheduled: 0 });
  const [loadingFees, setLoadingFees] = useState(true);

  const timeSlots = generateTimeSlots(9, 21); // Example: 9 AM to 9 PM

  useEffect(() => {
    const fetchFees = async () => {
      setLoadingFees(true);
      try {
        const { data, error } = await supabase
          .from('delivery_settings')
          .select('express_fee, scheduled_fee')
          .eq('id', 1)
          .single();
        if (error && error.code !== 'PGRST116') throw error;
        setDeliveryFees({
          express: data?.express_fee || 9.99, // Default fallback
          scheduled: data?.scheduled_fee || 5.99, // Default fallback
        });
      } catch (error) {
        console.error("Error fetching delivery fees:", error);
        // Use default fees if fetch fails
        setDeliveryFees({ express: 9.99, scheduled: 5.99 });
      } finally {
        setLoadingFees(false);
      }
    };
    fetchFees();
  }, []);

  useEffect(() => {
    let fee = 0;
    let deliveryTimestamp = null;

    if (deliveryType === 'express') {
      fee = deliveryFees.express;
    } else if (deliveryType === 'scheduled' && scheduledDate && scheduledTime) {
      fee = deliveryFees.scheduled;
      const [hours, minutes] = scheduledTime.split(':');
      const combinedDate = new Date(scheduledDate);
      combinedDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
      deliveryTimestamp = combinedDate.toISOString();
    }

    onDeliveryChange({
      type: deliveryType,
      fee: fee,
      scheduledTime: deliveryTimestamp,
    });
  }, [deliveryType, scheduledDate, scheduledTime, deliveryFees, onDeliveryChange]);

  const handleDateSelect = (date) => {
     setScheduledDate(date);
     // Optionally reset time if date changes?
     // setScheduledTime('');
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Delivery Options</h3>
      <RadioGroup value={deliveryType} onValueChange={setDeliveryType}>
        <div className="flex items-center space-x-2 p-4 border rounded-md has-[:checked]:border-primary">
          <RadioGroupItem value="express" id="express" />
          <Label htmlFor="express" className="flex-1 cursor-pointer">
            Express Delivery (ASAP)
            <span className="block text-sm text-muted-foreground">
              {loadingFees ? "Loading fee..." : `Fee: ${formatCurrency(deliveryFees.express)}`}
            </span>
          </Label>
        </div>
        <div className="flex flex-col space-y-4 p-4 border rounded-md has-[:checked]:border-primary">
           <div className="flex items-center space-x-2">
             <RadioGroupItem value="scheduled" id="scheduled" />
             <Label htmlFor="scheduled" className="flex-1 cursor-pointer">
               Schedule Delivery
               <span className="block text-sm text-muted-foreground">
                 {loadingFees ? "Loading fee..." : `Fee: ${formatCurrency(deliveryFees.scheduled)}`}
               </span>
             </Label>
           </div>
           {deliveryType === 'scheduled' && (
             <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="pl-6 space-y-4"
             >
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !scheduledDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {scheduledDate ? format(scheduledDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={scheduledDate}
                      onSelect={handleDateSelect}
                      initialFocus
                      disabled={(date) => date < new Date(new Date().setDate(new Date().getDate() - 1))} // Disable past dates
                    />
                  </PopoverContent>
                </Popover>
                <Select value={scheduledTime} onValueChange={setScheduledTime} disabled={!scheduledDate}>
                   <SelectTrigger>
                     <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                     <SelectValue placeholder="Select a time slot" />
                   </SelectTrigger>
                   <SelectContent>
                     {timeSlots.map(slot => (
                       <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
             </motion.div>
           )}
        </div>
      </RadioGroup>
    </div>
  );
};

export default DeliveryOptions;
  