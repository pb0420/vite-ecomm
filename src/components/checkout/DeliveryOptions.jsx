import React, { useState, useEffect } from 'react';
import { format } from "date-fns";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { motion } from 'framer-motion';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from '@/lib/supabaseClient';
import { formatCurrency } from '@/lib/utils';
import { 
  formatDateForTimezone, 
  formatTimeToAMPM, 
  getCurrentDateInTimezone,
  DEFAULT_TIMEZONE
} from '@/lib/timezone';

const DeliveryOptions = ({ onDeliveryChange }) => {
  const [deliveryType, setDeliveryType] = useState('express');
  const [scheduledDate, setScheduledDate] = useState(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
  const [deliveryFees, setDeliveryFees] = useState({ express: 0, scheduled: 0 });
  const [loadingFees, setLoadingFees] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [timezone, setTimezone] = useState(DEFAULT_TIMEZONE);

  useEffect(() => {
    const fetchSettings = async () => {
      setLoadingFees(true);
      try {
        const { data, error } = await supabase
          .from('delivery_settings')
          .select('express_fee, scheduled_fee, timezone')
          .eq('id', 1)
          .single();
        
        if (error && error.code !== 'PGRST116') throw error;
        
        setDeliveryFees({
          express: data?.express_fee || 9.99,
          scheduled: data?.scheduled_fee || 5.99,
        });
        
        if (data?.timezone) {
          setTimezone(data.timezone);
        }
      } catch (error) {
        console.error("Error fetching delivery settings:", error);
        setDeliveryFees({ express: 9.99, scheduled: 5.99 });
      } finally {
        setLoadingFees(false);
      }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    if (scheduledDate && deliveryType === 'scheduled') {
      fetchAvailableTimeSlots(scheduledDate);
    }
  }, [scheduledDate, deliveryType, timezone]);

  useEffect(() => {
    let fee = 0;
    let deliveryTimestamp = null;
    let timeslotId = null;

    if (deliveryType === 'express') {
      fee = deliveryFees.express;
    } else if (deliveryType === 'scheduled' && selectedTimeSlot) {
      fee = deliveryFees.scheduled;
      const timeSlot = availableTimeSlots.find(slot => slot.id === selectedTimeSlot);
      if (timeSlot) {
        // Create proper date with timezone consideration
        const slotDate = new Date(timeSlot.date + 'T' + timeSlot.start_time);
        deliveryTimestamp = slotDate.toISOString();
        timeslotId = timeSlot.id;
      }
    }

    onDeliveryChange({
      type: deliveryType,
      fee: fee,
      scheduledTime: deliveryTimestamp,
      timeslot_id: timeslotId,
    });
  }, [deliveryType, selectedTimeSlot, deliveryFees, availableTimeSlots, onDeliveryChange]);

  const fetchAvailableTimeSlots = async (date) => {
    setLoadingSlots(true);
    try {
      const dateString = formatDateForTimezone(date, timezone);
      const { data, error } = await supabase
        .from('time_slots')
        .select('*')
        .eq('date', dateString)
        // .eq('slot_type', 'delivery')
        .eq('is_active', true)
        // .lt('current_orders', supabase.raw('max_orders'))
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

  const handleDateSelect = (date) => {
    setScheduledDate(date);
    setSelectedTimeSlot(''); // Reset time slot when date changes
  };

  const isDateDisabled = (date) => {
    const today = getCurrentDateInTimezone(timezone);
    const todayStr = formatDateForTimezone(today, timezone);
    const dateStr = formatDateForTimezone(date, timezone);
    return dateStr < todayStr;
  };

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
                    disabled={isDateDisabled}
                  />
                </PopoverContent>
              </Popover>
              
              {scheduledDate && (
                <div className="space-y-2">
                  <Label>Available Time Slots</Label>
                  {loadingSlots ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : availableTimeSlots.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-2">
                      No available time slots for this date.
                    </p>
                  ) : (
                    <Select value={selectedTimeSlot} onValueChange={setSelectedTimeSlot}>
                      <SelectTrigger>
                        <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                        <SelectValue placeholder="Select a time slot" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableTimeSlots.map(slot => (
                          <SelectItem key={slot.id} value={slot.id}>
                            {formatTimeToAMPM(slot.start_time)} - {formatTimeToAMPM(slot.end_time)}
                            {/* <span className="ml-2 text-xs text-muted-foreground">
                              ({slot.current_orders}/{slot.max_orders} booked)
                            </span> */}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </div>
      </RadioGroup>
    </div>
  );
};

export default DeliveryOptions;