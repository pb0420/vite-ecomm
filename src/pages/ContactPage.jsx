import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.from('outside_contact').insert({
        type: 'contact',
        name: formData.name,
        email: formData.email,
        subject: formData.subject,
        message: formData.message
      });
      if (error) throw error;
      toast({
        title: "Message Sent",
        description: "Thank you for your message. We'll get back to you soon!"
      });
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (err) {
      toast({ title: "Error", description: "Could not send message. Please try again." });
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
        <h1 className="text-3xl font-bold mb-2 text-primary">Contact Us</h1>
        <p className="text-muted-foreground mb-8 text-base">
          Have questions or feedback? We'd love to hear from you.
        </p>

        <div className="grid gap-8 md:grid-cols-2 mb-8">
          <div className="flex items-center space-x-4 bg-white rounded-lg shadow p-4">
            <div className="p-3 rounded-full bg-[#fd7507]/20">
              <Mail className="w-6 h-6 text-[#fd7507]" />
            </div>
            <div>
              <h3 className="font-medium text-primary">Email</h3>
              <p className="text-sm text-muted-foreground">contact@groceroo.com.au</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4 bg-white rounded-lg shadow p-4">
            <div className="p-3 rounded-full bg-[#3cb371]/20">
              <Phone className="w-6 h-6 text-[#3cb371]" />
            </div>
            <div>
              <h3 className="font-medium text-primary">Phone</h3>
              <p className="text-sm text-muted-foreground">+61 478 477 036</p>
            </div>
          </div>
        </div>

        <div className="p-6 border rounded-lg bg-white shadow">
          <h2 className="text-xl font-semibold mb-4 text-primary">Send us a message</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
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
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                rows={5}
                value={formData.message}
                onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
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
                  Send Message
                </>
              )}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default ContactPage;