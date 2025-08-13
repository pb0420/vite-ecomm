import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Car, Store, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from '@/components/ui/use-toast';

const WorkPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    position: 'driver',
    experience: '',
    availability: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    // Dummy API call
    try {
      await fetch('https://jsonplaceholder.typicode.com/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      toast({
        title: "Application Received",
        description: "Thank you for your interest! We'll review your application and get back to you soon."
      });
      setFormData({
        name: '',
        email: '',
        phone: '',
        position: 'driver',
        experience: '',
        availability: ''
      });
    } catch (err) {
      toast({ title: "Error", description: "Could not submit application. Please try again." });
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
        <h1 className="text-3xl font-bold mb-2 text-primary">Work With Us</h1>
        <p className="text-muted-foreground mb-8 text-base">
          Join our team and be part of Adelaide's growing grocery delivery service.
        </p>

        {/* <div className="grid gap-6 md:grid-cols-2 mb-8">
          <div className="p-6 border rounded-lg">
            <div className="p-3 rounded-full bg-primary/10 w-fit mb-4">
              <Car className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Delivery Driver</h3>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>• Flexible working hours</li>
              <li>• Competitive pay rates</li>
              <li>• Use your own vehicle</li>
              <li>• Weekly payments</li>
            </ul>
          </div>

          <div className="p-6 border rounded-lg">
            <div className="p-3 rounded-full bg-primary/10 w-fit mb-4">
              <Store className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">In-Store Assistant</h3>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>• Full-time & part-time roles</li>
              <li>• Product picking & packing</li>
              <li>• Customer service</li>
              <li>• Career growth opportunities</li>
            </ul>
          </div>
        </div> */}

        <div className="p-6 border rounded-lg bg-white shadow">
          <h2 className="text-xl font-semibold mb-4 text-primary">Expression of Interest</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
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
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Position of Interest</Label>
              <RadioGroup
                value={formData.position}
                onValueChange={(value) => setFormData(prev => ({ ...prev, position: value }))}
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="driver" id="driver" />
                  <Label htmlFor="driver">Delivery Driver</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="assistant" id="assistant" />
                  <Label htmlFor="assistant">In-Store Assistant</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="experience">Relevant Experience</Label>
              <Textarea
                id="experience"
                rows={3}
                value={formData.experience}
                onChange={(e) => setFormData(prev => ({ ...prev, experience: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="availability">Availability</Label>
              <Textarea
                id="availability"
                rows={2}
                value={formData.availability}
                onChange={(e) => setFormData(prev => ({ ...prev, availability: e.target.value }))}
                placeholder="Please specify your available days and hours"
                required
              />
            </div>

            <Button type="submit" className="w-full mt-2" disabled={loading}>
              {loading ? (
                <>
                  <div className="mr-2 h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Submit Application
                </>
              )}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default WorkPage;