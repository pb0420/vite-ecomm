import React from 'react';
import { Separator } from '@/components/ui/separator';
import { useCart } from '@/contexts/CartContext';
import { formatCurrency } from '@/lib/utils';

const OrderSummary = ({ deliveryFee = 0, appliedPromo = null, discountAmount = 0, serviceFeePercent = 0 , serviceFee = 0 }) => {
  const { cart, getCartTotal } = useCart();
  const subtotal = getCartTotal();
  const total = subtotal - discountAmount + deliveryFee + serviceFee;

  return (
    <div className="sticky top-20 p-6 border rounded-lg bg-muted/20">
      <h2 className="text-xl font-semibold mb-4">Order Summary</h2>

      <div className="space-y-3 max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-rounded pr-2 mb-4 custom-scrollbar">
        {cart.length > 0 ? cart.map(item => (
          <div key={item.id} className="flex justify-between items-start">
            <div className="flex-1 mr-2">
              <p className="font-medium text-sm leading-tight">{item.name}</p>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(item.price)} x {item.quantity}
              </p>
            </div>
            <p className="font-medium text-sm whitespace-nowrap">{formatCurrency(item.price * item.quantity)}</p>
          </div>
        )) : (
           <p className="text-sm text-muted-foreground text-center py-4">Your cart is empty.</p>
        )}
      </div>

      <Separator className="my-4" />

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Cart Total</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        
        {appliedPromo && discountAmount > 0 && (
          <div className="flex justify-between text-green-600">
            <span>Discount ({appliedPromo.code})</span>
            <span>-{formatCurrency(discountAmount)}</span>
          </div>
        )}
        
        <div className="flex justify-between">
          <span className="text-muted-foreground">Delivery Fee</span>
          <span>{formatCurrency(deliveryFee)}</span>
        </div>
        {serviceFee > 0 && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Service Fee ({serviceFeePercent} %)</span>
            <span>{formatCurrency(serviceFee)}</span>
          </div>
        )}
        <Separator className="my-2" />
        <div className="flex justify-between font-bold text-base pt-1">
          <span>Total</span>
          <span>{formatCurrency(total)}</span>
        </div>
      </div>
    </div>
  );
};

export default OrderSummary;