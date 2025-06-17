import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { DialogFooter } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const TimeSlotForm = ({ timeSlot, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    date: new Date(),
    start_time: '09:00',
    end_time: '11:00',
    max_orders: 10,
    slot_type: 'delivery',
    is_active: true
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (timeSlot) {
      setFormData({
        date: new Date(timeSlot.date),
        start_time: timeSlot.start_time.slice(0, 5), // Remove seconds
        end_time: timeSlot.end_time.slice(0, 5), // Remove seconds
        max_orders: timeSlot.max_orders,
        slot_type: timeSlot.slot_type,
        is_active: timeSlot.is_active
      });
    } else {
      setFormData({
        date: new Date(),
        start_time: '09:00',
        end_time: '11:00',
        max_orders: 10,
        slot_type: 'delivery',
        is_active: true
      });
    }
  }, [timeSlot]);

  const handleChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.date) {
      newErrors.date = 'Date is required';
    } else if (formData.date < new Date().setHours(0, 0, 0, 0)) {
      newErrors.date = 'Date cannot be in the past';
    }
    
    if (!formData.start_time) {
      newErrors.start_time = 'Start time is required';
    }
    
    if (!formData.end_time) {
      newErrors.end_time = 'End time is required';
    }
    
    if (formData.start_time && formData.end_time) {
      const startTime = new Date(`2000-01-01T${formData.start_time}:00`);
      const endTime = new Date(`2000-01-01T${formData.end_time}:00`);
      
      if (endTime <= startTime) {
        newErrors.end_time = 'End time must be after start time';
      }
    }
    
    if (!formData.max_orders || formData.max_orders < 1) {
      newErrors.max_orders = 'Maximum orders must be at least 1';
    }
    
    if (!formData.slot_type) {
      newErrors.slot_type = 'Slot type is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm() || isSubmitting) return;

    setIsSubmitting(true);
    
    const submissionData = {
      date: formData.date.toISOString().split('T')[0],
      start_time: formData.start_time,
      end_time: formData.end_time,
      max_orders: parseInt(formData.max_orders),
      slot_type: formData.slot_type,
      is_active: formData.is_active
    };

    await onSubmit(submissionData);
    setIsSubmitting(false);
  };

  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const displayTime = formatTimeToAMPM(hour, minute);
        options.push({ value: timeString, label: displayTime });
      }
    }
    return options;
  };

  const formatTimeToAMPM = (hour, minute) => {
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minute.toString().padStart(2, '0')} ${ampm}`;
  };

  const timeOptions = generateTimeOptions();

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !formData.date && "text-muted-foreground",
                  errors.date && "border-destructive"
                )}
                disabled={isSubmitting}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.date ? format(formData.date, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={formData.date}
                onSelect={(date) => handleChange('date', date)}
                disabled={(date) => date < new Date().setHours(0, 0, 0, 0)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          {errors.date && <p className="text-xs text-destructive">{errors.date}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="slot_type">Slot Type</Label>
          <Select 
            value={formData.slot_type} 
            onValueChange={(value) => handleChange('slot_type', value)}
            disabled={isSubmitting}
          >
            <SelectTrigger className={errors.slot_type ? 'border-destructive' : ''}>
              <SelectValue placeholder="Select slot type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="delivery">Delivery</SelectItem>
              <SelectItem value="pickup">Pickup</SelectItem>
            </SelectContent>
          </Select>
          {errors.slot_type && <p className="text-xs text-destructive">{errors.slot_type}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="start_time">Start Time</Label>
          <Select 
            value={formData.start_time} 
            onValueChange={(value) => handleChange('start_time', value)}
            disabled={isSubmitting}
          >
            <SelectTrigger className={errors.start_time ? 'border-destructive' : ''}>
              <SelectValue placeholder="Select start time" />
            </SelectTrigger>
            <SelectContent>
              {timeOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.start_time && <p className="text-xs text-destructive">{errors.start_time}</p>}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="end_time">End Time</Label>
          <Select 
            value={formData.end_time} 
            onValueChange={(value) => handleChange('end_time', value)}
            disabled={isSubmitting}
          >
            <SelectTrigger className={errors.end_time ? 'border-destructive' : ''}>
              <SelectValue placeholder="Select end time" />
            </SelectTrigger>
            <SelectContent>
              {timeOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.end_time && <p className="text-xs text-destructive">{errors.end_time}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="max_orders">Maximum Orders</Label>
        <Input
          id="max_orders"
          type="number"
          min="1"
          value={formData.max_orders}
          onChange={(e) => handleChange('max_orders', e.target.value)}
          className={errors.max_orders ? 'border-destructive' : ''}
          disabled={isSubmitting}
        />
        {errors.max_orders && <p className="text-xs text-destructive">{errors.max_orders}</p>}
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="is_active"
          checked={formData.is_active}
          onCheckedChange={(checked) => handleChange('is_active', checked)}
          disabled={isSubmitting}
        />
        <Label htmlFor="is_active">Active (available for booking)</Label>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : (timeSlot ? 'Update Time Slot' : 'Create Time Slot')}
        </Button>
      </DialogFooter>
    </form>
  );
};

export default TimeSlotForm;