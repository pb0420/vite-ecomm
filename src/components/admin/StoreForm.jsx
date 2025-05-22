import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DialogFooter } from '@/components/ui/dialog';

const StoreForm = ({ store, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    opening_time: '09:00',
    closing_time: '21:00'
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (store) {
      setFormData({
        name: store.name || '',
        address: store.address || '',
        phone: store.phone || '',
        opening_time: store.opening_time?.slice(0, 5) || '09:00',
        closing_time: store.closing_time?.slice(0, 5) || '21:00'
      });
    }
  }, [store]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    if (!formData.opening_time) newErrors.opening_time = 'Opening time is required';
    if (!formData.closing_time) newErrors.closing_time = 'Closing time is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm() || isSubmitting) return;

    setIsSubmitting(true);
    await onSubmit(formData);
    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Store Name</Label>
        <Input
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className={errors.name ? 'border-destructive' : ''}
          disabled={isSubmitting}
        />
        {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Input
          id="address"
          name="address"
          value={formData.address}
          onChange={handleChange}
          className={errors.address ? 'border-destructive' : ''}
          disabled={isSubmitting}
        />
        {errors.address && <p className="text-xs text-destructive">{errors.address}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number</Label>
        <Input
          id="phone"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          className={errors.phone ? 'border-destructive' : ''}
          disabled={isSubmitting}
        />
        {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="opening_time">Opening Time</Label>
          <Input
            id="opening_time"
            name="opening_time"
            type="time"
            value={formData.opening_time}
            onChange={handleChange}
            className={errors.opening_time ? 'border-destructive' : ''}
            disabled={isSubmitting}
          />
          {errors.opening_time && <p className="text-xs text-destructive">{errors.opening_time}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="closing_time">Closing Time</Label>
          <Input
            id="closing_time"
            name="closing_time"
            type="time"
            value={formData.closing_time}
            onChange={handleChange}
            className={errors.closing_time ? 'border-destructive' : ''}
            disabled={isSubmitting}
          />
          {errors.closing_time && <p className="text-xs text-destructive">{errors.closing_time}</p>}
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : (store ? 'Update Store' : 'Add Store')}
        </Button>
      </DialogFooter>
    </form>
  );
};

export default StoreForm;