import React, { useState } from 'react';
import { Tag, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/components/ui/use-toast';
import { formatCurrency } from '@/lib/utils';

const PromoCodeInput = ({ subtotal, onPromoApplied, appliedPromo, onPromoRemoved }) => {
  const [promoCode, setPromoCode] = useState('');
  const [loading, setLoading] = useState(false);

  const validatePromoCode = async () => {
    if (!promoCode.trim()) {
      toast({ variant: "destructive", title: "Error", description: "Please enter a promo code" });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('code', promoCode.toUpperCase())
        .eq('is_active', true)
        .single();

      if (error || !data) {
        toast({ variant: "destructive", title: "Invalid Code", description: "Promo code not found or expired" });
        return;
      }

      // Check if code is still valid
      const now = new Date();
      const validFrom = new Date(data.valid_from);
      const validUntil = data.valid_until ? new Date(data.valid_until) : null;

      if (now < validFrom) {
        toast({ variant: "destructive", title: "Invalid Code", description: "This promo code is not yet active" });
        return;
      }

      if (validUntil && now > validUntil) {
        toast({ variant: "destructive", title: "Expired Code", description: "This promo code has expired" });
        return;
      }

      // Check usage limits
      if (data.max_uses && data.current_uses >= data.max_uses) {
        toast({ variant: "destructive", title: "Code Limit Reached", description: "This promo code has reached its usage limit" });
        return;
      }

      // Check minimum order amount
      if (data.minimum_order_amount && subtotal < data.minimum_order_amount) {
        toast({ 
          variant: "destructive", 
          title: "Minimum Order Required", 
          description: `Minimum order of ${formatCurrency(data.minimum_order_amount)} required for this promo code` 
        });
        return;
      }

      // Calculate discount
      let discountAmount = 0;
      if (data.discount_type === 'percentage') {
        discountAmount = (subtotal * data.discount_value) / 100;
      } else {
        discountAmount = data.discount_value;
      }

      // Ensure discount doesn't exceed subtotal
      discountAmount = Math.min(discountAmount, subtotal);

      onPromoApplied({
        code: data.code,
        description: data.description,
        discountType: data.discount_type,
        discountValue: data.discount_value,
        discountAmount: discountAmount
      });

      toast({ 
        title: "Promo Code Applied", 
        description: `You saved ${formatCurrency(discountAmount)}!` 
      });

      setPromoCode('');
    } catch (error) {
      console.error('Error validating promo code:', error);
      toast({ variant: "destructive", title: "Error", description: "Failed to validate promo code" });
    } finally {
      setLoading(false);
    }
  };

  const removePromoCode = () => {
    onPromoRemoved();
    toast({ title: "Promo Code Removed", description: "Promo code has been removed from your order" });
  };

  if (appliedPromo) {
    return (
      <div className="p-4 border rounded-lg bg-green-50 border-green-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Tag className="w-4 h-4 text-green-600" />
            <div>
              <p className="font-medium text-green-800">{appliedPromo.code}</p>
              <p className="text-sm text-green-600">{appliedPromo.description}</p>
              <p className="text-sm text-green-600">
                Discount: {formatCurrency(appliedPromo.discountAmount)}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={removePromoCode}
            className="text-green-600 hover:text-green-800"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="promo-code">Promo Code</Label>
      <div className="flex space-x-2">
        <Input
          id="promo-code"
          value={promoCode}
          onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
          placeholder="Enter promo code"
          disabled={loading}
        />
        <Button
          onClick={validatePromoCode}
          disabled={loading || !promoCode.trim()}
          variant="outline"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          ) : (
            'Apply'
          )}
        </Button>
      </div>
    </div>
  );
};

export default PromoCodeInput;