
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/components/ui/use-toast';

const StripeSettingsForm = () => {
  const [settings, setSettings] = useState({ publishable_key: '', price_id: '' });
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchStripeSettings = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('stripe_settings')
          .select('publishable_key, price_id')
          .eq('id', 1)
          .single();

        if (error && error.code !== 'PGRST116') {
          throw error;
        }
        if (data) {
          setSettings({
            publishable_key: data.publishable_key || '',
            price_id: data.price_id || '',
          });
        } else {
          setSettings({ publishable_key: '', price_id: '' });
        }
      } catch (error) {
        console.error('Error fetching Stripe settings:', error);
        toast({ variant: "destructive", title: "Fetch Error", description: "Could not load Stripe settings." });
      } finally {
        setLoading(false);
      }
    };
    fetchStripeSettings();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!settings.publishable_key.trim()) {
      newErrors.publishable_key = 'Stripe Publishable Key is required.';
    } else if (!settings.publishable_key.startsWith('pk_')) {
        newErrors.publishable_key = 'Invalid Publishable Key format. Should start with "pk_".';
    }

    if (!settings.price_id.trim()) {
      newErrors.price_id = 'Stripe Price ID is required.';
    } else if (!settings.price_id.startsWith('price_')) {
        newErrors.price_id = 'Invalid Price ID format. Should start with "price_".';
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
        publishable_key: settings.publishable_key.trim(),
        price_id: settings.price_id.trim(),
        updated_at: new Date(),
      };

      const { error } = await supabase
        .from('stripe_settings')
        .upsert(updateData, { onConflict: 'id' });

      if (error) throw error;

      toast({ title: "Stripe Settings Updated", description: "Your Stripe configuration has been saved." });
    } catch (error) {
      console.error('Error saving Stripe settings:', error);
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
        <Label htmlFor="publishable_key">Stripe Publishable Key</Label>
        <Input
          id="publishable_key"
          name="publishable_key"
          type="text"
          value={settings.publishable_key}
          onChange={handleChange}
          placeholder="pk_live_..."
          className={errors.publishable_key ? 'border-destructive' : ''}
          disabled={isSaving}
        />
        {errors.publishable_key && <p className="text-xs text-destructive">{errors.publishable_key}</p>}
        <p className="text-xs text-muted-foreground">
          Find this in your Stripe Dashboard under Developers &gt; API Keys.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="price_id">Stripe Default Price ID</Label>
        <Input
          id="price_id"
          name="price_id"
          type="text"
          value={settings.price_id}
          onChange={handleChange}
          placeholder="price_..."
          className={errors.price_id ? 'border-destructive' : ''}
          disabled={isSaving}
        />
        {errors.price_id && <p className="text-xs text-destructive">{errors.price_id}</p>}
        <p className="text-xs text-muted-foreground">
          The Price ID for your primary product/service in Stripe. Used for client-only checkout.
        </p>
      </div>

      <Button type="submit" disabled={isSaving}>
        {isSaving ? 'Saving...' : 'Save Stripe Settings'}
      </Button>
    </form>
  );
};

export default StripeSettingsForm;
  