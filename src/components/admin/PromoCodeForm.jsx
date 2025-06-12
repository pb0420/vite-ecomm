import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { DialogFooter } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const PromoCodeForm = ({ promoCode, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discount_type: 'percentage',
    discount_value: '',
    minimum_order_amount: '',
    max_uses: '',
    valid_from: new Date(),
    valid_until: null,
    is_active: true
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (promoCode) {
      setFormData({
        code: promoCode.code || '',
        description: promoCode.description || '',
        discount_type: promoCode.discount_type || 'percentage',
        discount_value: promoCode.discount_value?.toString() || '',
        minimum_order_amount: promoCode.minimum_order_amount?.toString() || '',
        max_uses: promoCode.max_uses?.toString() || '',
        valid_from: promoCode.valid_from ? new Date(promoCode.valid_from) : new Date(),
        valid_until: promoCode.valid_until ? new Date(promoCode.valid_until) : null,
        is_active: promoCode.is_active !== undefined ? promoCode.is_active : true
      });
    } else {
      setFormData({
        code: '',
        description: '',
        discount_type: 'percentage',
        discount_value: '',
        minimum_order_amount: '',
        max_uses: '',
        valid_from: new Date(),
        valid_until: null,
        is_active: true
      });
    }
  }, [promoCode]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleDateChange = (name, date) => {
    setFormData(prev => ({ ...prev, [name]: date }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.code.trim()) {
      newErrors.code = 'Promo code is required';
    } else if (formData.code.length < 3) {
      newErrors.code = 'Promo code must be at least 3 characters';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    if (!formData.discount_value || isNaN(formData.discount_value) || parseFloat(formData.discount_value) <= 0) {
      newErrors.discount_value = 'Valid discount value is required';
    } else {
      const value = parseFloat(formData.discount_value);
      if (formData.discount_type === 'percentage' && value > 100) {
        newErrors.discount_value = 'Percentage discount cannot exceed 100%';
      }
    }
    
    if (formData.minimum_order_amount && (isNaN(formData.minimum_order_amount) || parseFloat(formData.minimum_order_amount) < 0)) {
      newErrors.minimum_order_amount = 'Minimum order amount must be a valid number';
    }
    
    if (formData.max_uses && (isNaN(formData.max_uses) || parseInt(formData.max_uses) <= 0)) {
      newErrors.max_uses = 'Maximum uses must be a positive number';
    }
    
    if (formData.valid_until && formData.valid_until <= formData.valid_from) {
      newErrors.valid_until = 'End date must be after start date';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm() || isSubmitting) return;

    setIsSubmitting(true);
    
    const submissionData = {
      code: formData.code.toUpperCase().trim(),
      description: formData.description.trim(),
      discount_type: formData.discount_type,
      discount_value: parseFloat(formData.discount_value),
      minimum_order_amount: formData.minimum_order_amount ? parseFloat(formData.minimum_order_amount) : 0,
      max_uses: formData.max_uses ? parseInt(formData.max_uses) : null,
      valid_from: formData.valid_from.toISOString(),
      valid_until: formData.valid_until ? formData.valid_until.toISOString() : null,
      is_active: formData.is_active
    };

    await onSubmit(submissionData);
    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="code">Promo Code</Label>
          <Input
            id="code"
            name="code"
            value={formData.code}
            onChange={handleChange}
            placeholder="e.g., SAVE10"
            className={errors.code ? 'border-destructive' : ''}
            disabled={isSubmitting}
          />
          {errors.code && <p className="text-xs text-destructive">{errors.code}</p>}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="discount_type">Discount Type</Label>
          <Select 
            value={formData.discount_type} 
            onValueChange={(value) => handleSelectChange('discount_type', value)}
            disabled={isSubmitting}
          >
            <SelectTrigger className={errors.discount_type ? 'border-destructive' : ''}>
              <SelectValue placeholder="Select discount type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="percentage">Percentage (%)</SelectItem>
              <SelectItem value="fixed">Fixed Amount ($)</SelectItem>
            </SelectContent>
          </Select>
          {errors.discount_type && <p className="text-xs text-destructive">{errors.discount_type}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Brief description of the promo code"
          className={errors.description ? 'border-destructive' : ''}
          disabled={isSubmitting}
          rows={2}
        />
        {errors.description && <p className="text-xs text-destructive">{errors.description}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="discount_value">
            Discount Value {formData.discount_type === 'percentage' ? '(%)' : '($)'}
          </Label>
          <Input
            id="discount_value"
            name="discount_value"
            type="number"
            step={formData.discount_type === 'percentage' ? '0.1' : '0.01'}
            min="0"
            max={formData.discount_type === 'percentage' ? '100' : undefined}
            value={formData.discount_value}
            onChange={handleChange}
            placeholder={formData.discount_type === 'percentage' ? '10' : '5.00'}
            className={errors.discount_value ? 'border-destructive' : ''}
            disabled={isSubmitting}
          />
          {errors.discount_value && <p className="text-xs text-destructive">{errors.discount_value}</p>}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="minimum_order_amount">Minimum Order Amount ($)</Label>
          <Input
            id="minimum_order_amount"
            name="minimum_order_amount"
            type="number"
            step="0.01"
            min="0"
            value={formData.minimum_order_amount}
            onChange={handleChange}
            placeholder="0.00"
            className={errors.minimum_order_amount ? 'border-destructive' : ''}
            disabled={isSubmitting}
          />
          {errors.minimum_order_amount && <p className="text-xs text-destructive">{errors.minimum_order_amount}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="max_uses">Maximum Uses (Optional)</Label>
        <Input
          id="max_uses"
          name="max_uses"
          type="number"
          min="1"
          value={formData.max_uses}
          onChange={handleChange}
          placeholder="Leave empty for unlimited uses"
          className={errors.max_uses ? 'border-destructive' : ''}
          disabled={isSubmitting}
        />
        {errors.max_uses && <p className="text-xs text-destructive">{errors.max_uses}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Valid From</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !formData.valid_from && "text-muted-foreground",
                  errors.valid_from && "border-destructive"
                )}
                disabled={isSubmitting}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.valid_from ? format(formData.valid_from, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={formData.valid_from}
                onSelect={(date) => handleDateChange('valid_from', date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          {errors.valid_from && <p className="text-xs text-destructive">{errors.valid_from}</p>}
        </div>
        
        <div className="space-y-2">
          <Label>Valid Until (Optional)</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !formData.valid_until && "text-muted-foreground",
                  errors.valid_until && "border-destructive"
                )}
                disabled={isSubmitting}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.valid_until ? format(formData.valid_until, "PPP") : <span>No expiry</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={formData.valid_until}
                onSelect={(date) => handleDateChange('valid_until', date)}
                disabled={(date) => date < formData.valid_from}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          {errors.valid_until && <p className="text-xs text-destructive">{errors.valid_until}</p>}
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="is_active"
          checked={formData.is_active}
          onCheckedChange={(checked) => handleSelectChange('is_active', checked)}
          disabled={isSubmitting}
        />
        <Label htmlFor="is_active">Active</Label>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : (promoCode ? 'Update Promo Code' : 'Create Promo Code')}
        </Button>
      </DialogFooter>
    </form>
  );
};

export default PromoCodeForm;