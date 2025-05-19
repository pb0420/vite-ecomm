import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/components/ui/use-toast';

const StripeSettingsForm = () => {
  const [settings, setSettings] = useState({ publishable_key: '', price_id: '', openai_key: '' });
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const [{ data: stripeData }, { data: openaiData }] = await Promise.all([
          supabase
            .from('stripe_settings')
            .select('publishable_key, price_id')
            .eq('id', 1)
            .single(),
          supabase
            .from('openai_settings')
            .select('api_key')
            .eq('id', 1)
            .single()
        ]);

        setSettings({
          publishable_key: stripeData?.publishable_key || '',
          price_id: stripeData?.price_id || '',
          openai_key: openaiData?.api_key || ''
        });
      } catch (error) {
        console.error('Error fetching settings:', error);
        toast({ variant: "destructive", title: "Fetch Error", description: "Could not load settings." });
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

    if (!settings.openai_key.trim()) {
      newErrors.openai_key = 'OpenAI API Key is required.';
    } else if (!settings.openai_key.startsWith('sk-')) {
      newErrors.openai_key = 'Invalid OpenAI API Key format. Should start with "sk-".';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm() || isSaving) return;

    setIsSaving(true);
    try {
      const [stripeResult, openaiResult] = await Promise.all([
        supabase
          .from('stripe_settings')
          .upsert({
            id: 1,
            publishable_key: settings.publishable_key.trim(),
            price_id: settings.price_id.trim(),
            updated_at: new Date(),
          }, { onConflict: 'id' }),
        supabase
          .from('openai_settings')
          .upsert({
            id: 1,
            api_key: settings.openai_key.trim(),
            updated_at: new Date(),
          }, { onConflict: 'id' })
      ]);

      if (stripeResult.error) throw stripeResult.error;
      if (openaiResult.error) throw openaiResult.error;

      toast({ title: "Settings Updated", description: "Your payment and AI settings have been saved." });
    } catch (error) {
      console.error('Error saving settings:', error);
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
          The Price ID for your primary product/service in Stripe.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="openai_key">OpenAI API Key</Label>
        <Input
          id="openai_key"
          name="openai_key"
          type="password"
          value={settings.openai_key}
          onChange={handleChange}
          placeholder="sk-..."
          className={errors.openai_key ? 'border-destructive' : ''}
          disabled={isSaving}
        />
        {errors.openai_key && <p className="text-xs text-destructive">{errors.openai_key}</p>}
        <p className="text-xs text-muted-foreground">
          Your OpenAI API key for the AI shopping assistant. Find this in your OpenAI dashboard.
        </p>
      </div>

      <Button type="submit" disabled={isSaving}>
        {isSaving ? 'Saving...' : 'Save Settings'}
      </Button>
    </form>
  );
};

export default StripeSettingsForm;