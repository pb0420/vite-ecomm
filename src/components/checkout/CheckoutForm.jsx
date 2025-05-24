import React, { useState, useEffect } from 'react';
import { Truck, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import AddressSelector from '@/components/checkout/AddressSelector';

const CheckoutForm = ({ onDetailsChange, errors }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '', 
    email: '', 
    phone: '', 
    address: '', 
    deliveryNotes: '',
  });
  const [showAddressSelector, setShowAddressSelector] = useState(false);

  // Pre-fill form if user is logged in
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: '',
        deliveryNotes: '',
      });
    }
  }, [user]);

  // Update parent component when form data changes
  useEffect(() => {
    onDetailsChange(formData);
  }, [formData, onDetailsChange]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddressSelect = (address) => {
    setFormData(prev => ({ ...prev, address }));
    setShowAddressSelector(false);
  };

  return (
    <div className="p-6 border rounded-lg">
      <h2 className="flex items-center text-xl font-semibold mb-4">
        <Truck className="mr-2 h-5 w-5 text-primary" />
        Delivery Information
      </h2>
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input 
              id="name" 
              name="name" 
              value={formData.name} 
              onChange={handleChange} 
              className={errors?.name ? 'border-destructive' : ''} 
            />
            {errors?.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email (Optional)</Label>
            <Input 
              id="email" 
              name="email" 
              type="email" 
              value={formData.email} 
              onChange={handleChange} 
              className={errors?.email ? 'border-destructive' : ''} 
            />
            {errors?.email && <p className="text-xs text-destructive">{errors.email}</p>}
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input 
            id="phone" 
            name="phone" 
            value={formData.phone} 
            onChange={handleChange} 
            className={errors?.phone ? 'border-destructive' : ''} 
          />
          {errors?.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="address">Delivery Address</Label>
            {user && user.addresses?.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAddressSelector(!showAddressSelector)}
                className="flex items-center text-primary"
              >
                <MapPin className="w-4 h-4 mr-1" />
                {showAddressSelector ? 'Hide saved addresses' : 'Use saved address'}
              </Button>
            )}
          </div>
          {showAddressSelector && (
            <AddressSelector onSelect={handleAddressSelect} />
          )}
          <Input 
            id="address" 
            name="address" 
            value={formData.address} 
            onChange={handleChange} 
            className={errors?.address ? 'border-destructive' : ''} 
          />
          {errors?.address && <p className="text-xs text-destructive">{errors.address}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="deliveryNotes">Delivery Notes (Optional)</Label>
          <Textarea
            id="deliveryNotes"
            name="deliveryNotes"
            value={formData.deliveryNotes}
            onChange={handleChange}
            placeholder="E.g., Leave at the door, call upon arrival, etc."
            rows={3}
          />
        </div>
      </div>
    </div>
  );
};

export default CheckoutForm;