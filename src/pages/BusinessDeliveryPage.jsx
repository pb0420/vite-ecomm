import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Building2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';

const BusinessDeliveryPage = () => {
  const [formData, setFormData] = useState({
    businessName: '',
    contactName: '',
    email: '',
    phone: '',
    address: '',
    requirements: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.from('outside_contact').insert({
        type: 'business',
        business_name: formData.businessName,
        contact_name: formData.contactName,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        requirements: formData.requirements
      });
      if (error) throw error;
      toast({
        title: "Request Sent",
        description: "Thank you! We'll get back to you soon."
      });
      setFormData({
        businessName: '',
        contactName: '',
        email: '',
        phone: '',
        address: '',
        requirements: ''
      });
    } catch (err) {
      toast({ title: "Error", description: "Could not send request. Please try again." });
    }
    setLoading(false);
  };

  return (
    <div className="container px-4 py-8 mx-auto md:px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="max-w-2xl mx-auto"
      >
        <h1 className="text-3xl font-bold mb-2 text-primary flex items-center gap-2">
          <Building2 className="w-7 h-7 text-primary" /> Business Grocery Delivery
        </h1>
        <p className="text-muted-foreground mb-8 text-base">
          Are you a business in Adelaide looking for regular or bulk grocery delivery? Fill out the form below and we'll get in touch!
        </p>
        <div className="p-6 border rounded-lg bg-white shadow">
          <h2 className="text-xl font-semibold mb-4 text-primary">Business Delivery Request</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="businessName">Business Name</Label>
              <Input
                id="businessName"
                value={formData.businessName}
                onChange={(e) => setFormData(prev => ({ ...prev, businessName: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactName">Contact Name</Label>
              <Input
                id="contactName"
                value={formData.contactName}
                onChange={(e) => setFormData(prev => ({ ...prev, contactName: e.target.value }))}
                required
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Business Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="requirements">Delivery Requirements</Label>
              <Textarea
                id="requirements"
                rows={4}
                value={formData.requirements}
                onChange={(e) => setFormData(prev => ({ ...prev, requirements: e.target.value }))}
                placeholder="E.g. frequency, preferred days/times, bulk items, etc."
                required
                className="bg-gray-50"
              />
            </div>
            <Button type="submit" className="w-full mt-2" disabled={loading}>
              {loading ? (
                <>
                  <div className="mr-2 h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Request
                </>
              )}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default BusinessDeliveryPage;
