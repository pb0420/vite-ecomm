import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { DialogFooter } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Plus, Minus } from 'lucide-react';
import { addDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabaseClient';
import { 
  formatDateForTimezone, 
  formatTimeToAMPM, 
  generateTimeOptions, 
  isEndTimeAfterStartTime,
  getCurrentDateInTimezone,
  DEFAULT_TIMEZONE
} from '@/lib/timezone';

const TimeSlotForm = ({ timeSlot, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    dates: [getCurrentDateInTimezone()],
    start_time: '09:00',
    end_time: '11:00',
    max_orders: 10,
    slot_type: 'delivery',
    is_active: true
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bulkMode, setBulkMode] = useState(false);
  const [timezone, setTimezone] = useState(DEFAULT_TIMEZONE);

  // Fetch timezone from settings
  useEffect(() => {
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

    fetchTimezone();
  }, []);

  useEffect(() => {
    if (timeSlot) {
      // Parse the existing time slot date properly
      const slotDate = new Date(timeSlot.date + 'T12:00:00'); // Use noon to avoid timezone issues
      
      setFormData({
        dates: [slotDate],
        start_time: timeSlot.start_time.slice(0, 5),
        end_time: timeSlot.end_time.slice(0, 5),
        max_orders: timeSlot.max_orders,
        slot_type: timeSlot.slot_type,
        is_active: timeSlot.is_active
      });
      setBulkMode(false);
    } else {
      setFormData({
        dates: [getCurrentDateInTimezone(timezone)],
        start_time: '09:00',
        end_time: '11:00',
        max_orders: 10,
        slot_type: 'delivery',
        is_active: true
      });
      setBulkMode(false);
    }
  }, [timeSlot, timezone]);

  const handleChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleDateChange = (date, index) => {
    const newDates = [...formData.dates];
    newDates[index] = date;
    setFormData(prev => ({ ...prev, dates: newDates }));
    if (errors.dates) {
      setErrors(prev => ({ ...prev, dates: '' }));
    }
  };

  const addDate = () => {
    const lastDate = formData.dates[formData.dates.length - 1];
    const nextDate = addDays(lastDate, 1);
    setFormData(prev => ({ ...prev, dates: [...prev.dates, nextDate] }));
  };

  const removeDate = (index) => {
    if (formData.dates.length > 1) {
      const newDates = formData.dates.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, dates: newDates }));
    }
  };

  const addDateRange = () => {
    const startDate = getCurrentDateInTimezone(timezone);
    const dates = [];
    for (let i = 0; i < 7; i++) {
      dates.push(addDays(startDate, i));
    }
    setFormData(prev => ({ ...prev, dates }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.dates || formData.dates.length === 0) {
      newErrors.dates = 'At least one date is required';
    } else {
      const today = getCurrentDateInTimezone(timezone);
      const todayStr = formatDateForTimezone(today, timezone);
      
      for (const date of formData.dates) {
        const dateStr = formatDateForTimezone(date, timezone);
        if (dateStr < todayStr) {
          newErrors.dates = 'Dates cannot be in the past';
          break;
        }
      }
    }
    
    if (!formData.start_time) {
      newErrors.start_time = 'Start time is required';
    }
    
    if (!formData.end_time) {
      newErrors.end_time = 'End time is required';
    }
    
    if (formData.start_time && formData.end_time) {
      if (!isEndTimeAfterStartTime(formData.start_time, formData.end_time)) {
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
    
    try {
      if (timeSlot) {
        // Single slot update
        const submissionData = {
          date: formatDateForTimezone(formData.dates[0], timezone),
          start_time: formData.start_time,
          end_time: formData.end_time,
          max_orders: parseInt(formData.max_orders),
          slot_type: formData.slot_type,
          is_active: formData.is_active
        };
        await onSubmit(submissionData);
      } else {
        // Multiple slots creation
        for (const date of formData.dates) {
          const submissionData = {
            date: formatDateForTimezone(date, timezone),
            start_time: formData.start_time,
            end_time: formData.end_time,
            max_orders: parseInt(formData.max_orders),
            slot_type: formData.slot_type,
            is_active: formData.is_active
          };
          await onSubmit(submissionData);
        }
      }
    } catch (error) {
      console.error('Error submitting time slots:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const timeOptions = generateTimeOptions();

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!timeSlot && (
        <div className="flex items-center space-x-2 p-3 bg-muted/30 rounded-lg">
          <Checkbox
            id="bulk_mode"
            checked={bulkMode}
            onCheckedChange={setBulkMode}
          />
          <Label htmlFor="bulk_mode" className="text-sm">
            Create slots for multiple dates
          </Label>
        </div>
      )}

      <div className="space-y-2">
        <Label>Date{formData.dates.length > 1 ? 's' : ''}</Label>
        {formData.dates.map((date, index) => (
          <div key={index} className="flex items-center space-x-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    "flex-1 justify-start text-left font-normal",
                    !date && "text-muted-foreground",
                    errors.dates && "border-destructive"
                  )}
                  disabled={isSubmitting}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? formatDateForTimezone(date, timezone) : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(selectedDate) => handleDateChange(selectedDate, index)}
                  disabled={(date) => {
                    const today = getCurrentDateInTimezone(timezone);
                    const todayStr = formatDateForTimezone(today, timezone);
                    const dateStr = formatDateForTimezone(date, timezone);
                    return dateStr < todayStr;
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            
            {!timeSlot && formData.dates.length > 1 && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => removeDate(index)}
                disabled={isSubmitting}
              >
                <Minus className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
        
        {!timeSlot && (
          <div className="flex space-x-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addDate}
              disabled={isSubmitting}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Date
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addDateRange}
              disabled={isSubmitting}
            >
              Add Next 7 Days
            </Button>
          </div>
        )}
        
        {errors.dates && <p className="text-xs text-destructive">{errors.dates}</p>}
        
        {formData.dates.length > 1 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {formData.dates.map((date, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {formatDateForTimezone(date, timezone)}
              </Badge>
            ))}
          </div>
        )}
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

      <div className="grid grid-cols-2 gap-4">
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
          {isSubmitting ? 'Creating...' : (timeSlot ? 'Update Time Slot' : `Create ${formData.dates.length} Time Slot${formData.dates.length > 1 ? 's' : ''}`)}
        </Button>
      </DialogFooter>
    </form>
  );
};

export default TimeSlotForm;