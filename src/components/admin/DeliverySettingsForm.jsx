import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/components/ui/use-toast';
import { formatCurrency } from '@/lib/utils';

const DeliverySettingsForm = () => {
  const [settings, setSettings] = useState({ 
    express_fee: '', 
    scheduled_fee: '', 
    late_fee: '',
    timezone: 'Australia/Adelaide',
    estimated_delivery_minutes: 45
  });
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const timezoneOptions = [
    { value: 'Australia/Adelaide', label: 'Adelaide (ACST/ACDT)' },
    { value: 'Australia/Sydney', label: 'Sydney (AEST/AEDT)' },
    { value: 'Australia/Melbourne', label: 'Melbourne (AEST/AEDT)' },
    { value: 'Australia/Brisbane', label: 'Brisbane (AEST)' },
    { value: 'Australia/Perth', label: 'Perth (AWST)' },
    { value: 'Australia/Darwin', label: 'Darwin (ACST)' },
  ];

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('delivery_settings')
          .select('*')
          .eq('id', 1)
          .single();

        if (error && error.code !== 'PGRST116') {
          throw error;
        }
        if (data) {
          setSettings({
            express_fee: data.express_fee || '',
            scheduled_fee: data.scheduled_fee || '',
            late_fee: data.late_fee || '',
            timezone: data.timezone || 'Australia/Adelaide',
            estimated_delivery_minutes: data.estimated_delivery_minutes || 45,
          });
        } else {
          // Initialize with defaults if no settings found
          setSettings({ 
            express_fee: '9.99', 
            scheduled_fee: '5.99', 
            late_fee: '7.99',
            timezone: 'Australia/Adelaide',
            estimated_delivery_minutes: 45
          });
        }
      } catch (error) {
        console.error('Error fetching delivery settings:', error);
        toast({ variant: "destructive", title: "Fetch Error", description: "Could not load delivery settings." });
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSelectChange = (name, value) => {
    setSettings(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const validateFee = (fee, name) => {
      if (!fee || isNaN(fee) || parseFloat(fee) < 0) {
        newErrors[name] = 'Valid non-negative fee is required';
      }
    };
    validateFee(settings.express_fee, 'express_fee');
    validateFee(settings.scheduled_fee, 'scheduled_fee');
    validateFee(settings.late_fee, 'late_fee');
    
    if (!settings.estimated_delivery_minutes || isNaN(settings.estimated_delivery_minutes) || parseInt(settings.estimated_delivery_minutes) <= 0) {
      newErrors.estimated_delivery_minutes = 'Valid delivery time is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm() || isSaving) return;

    setIsSaving(true);
    try {
      const updateData = {
        id: 1,
        express_fee: parseFloat(settings.express_fee),
        scheduled_fee: parseFloat(settings.scheduled_fee),
        late_fee: parseFloat(settings.late_fee),
        timezone: settings.timezone,
        estimated_delivery_minutes: parseInt(settings.estimated_delivery_minutes),
        updated_at: new Date(),
      };

      const { error } = await supabase
        .from('delivery_settings')
        .upsert(updateData, { onConflict: 'id' });

      if (error) throw error;

      toast({ title: "Settings Updated", description: "Delivery settings have been saved." });
    } catch (error) {
      console.error('Error saving delivery settings:', error);
      toast({ variant: "destructive", title: "Save Error", description: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-40"><div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-md">
      <div className="space-y-2">
        <Label htmlFor="express_fee">Express Delivery Fee ($)</Label>
        <Input
          id="express_fee" 
          name="express_fee" 
          type="number" 
          step="0.01"
          value={settings.express_fee} 
          onChange={handleChange}
          className={errors.express_fee ? 'border-destructive' : ''}
          disabled={isSaving}
        />
        {errors.express_fee && <p className="text-xs text-destructive">{errors.express_fee}</p>}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="scheduled_fee">Scheduled Delivery Fee ($)</Label>
        <Input
          id="scheduled_fee" 
          name="scheduled_fee" 
          type="number" 
          step="0.01"
          value={settings.scheduled_fee} 
          onChange={handleChange}
          className={errors.scheduled_fee ? 'border-destructive' : ''}
          disabled={isSaving}
        />
        {errors.scheduled_fee && <p className="text-xs text-destructive">{errors.scheduled_fee}</p>}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="late_fee">Late Delivery Fee ($)</Label>
        <Input
          id="late_fee" 
          name="late_fee" 
          type="number" 
          step="0.01"
          value={settings.late_fee} 
          onChange={handleChange}
          className={errors.late_fee ? 'border-destructive' : ''}
          disabled={isSaving}
        />
        {errors.late_fee && <p className="text-xs text-destructive">{errors.late_fee}</p>}
        <p className="text-xs text-muted-foreground">Fee applied for orders scheduled outside standard hours.</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="timezone">Timezone</Label>
        <Select 
          value={settings.timezone} 
          onValueChange={(value) => handleSelectChange('timezone', value)}
          disabled={isSaving}
        >
          <SelectTrigger className={errors.timezone ? 'border-destructive' : ''}>
            <SelectValue placeholder="Select timezone" />
          </SelectTrigger>
          <SelectContent>
            {timezoneOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.timezone && <p className="text-xs text-destructive">{errors.timezone}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="estimated_delivery_minutes">Estimated Delivery Time (minutes)</Label>
        <Input
          id="estimated_delivery_minutes" 
          name="estimated_delivery_minutes" 
          type="number" 
          min="1"
          value={settings.estimated_delivery_minutes} 
          onChange={handleChange}
          className={errors.estimated_delivery_minutes ? 'border-destructive' : ''}
          disabled={isSaving}
        />
        {errors.estimated_delivery_minutes && <p className="text-xs text-destructive">{errors.estimated_delivery_minutes}</p>}
        <p className="text-xs text-muted-foreground">This will be displayed on the homepage as "Delivering in: X minutes (approx.)"</p>
      </div>
      
      <Button type="submit" disabled={isSaving}>
        {isSaving ? 'Saving...' : 'Save Settings'}
      </Button>
    </form>
  );
};

export default DeliverySettingsForm;