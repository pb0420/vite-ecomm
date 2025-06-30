import {
	Toast,
	ToastClose,
	ToastDescription,
	ToastProvider,
	ToastTitle,
	ToastViewport,
} from '@/components/ui/toast';
import { useToast } from '@/components/ui/use-toast';
import React from 'react';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';

function ViewCartButton() {
  const { openCart } = useCart();
  return (
    <Button
      size="sm"
      className="bg-green-600 hover:bg-green-700 text-white ml-2 px-2 py-2 rounded"
      onClick={openCart}
      tabIndex={0}
    >
      <span style={{fontSize:'10px',padding:'4px', wordSpacing:'0.5px'}}>View Cart</span>
    </Button>
  );
}

export function Toaster() {
	const { toasts } = useToast();

	return (
    <ToastProvider>
      {toasts.map(({ id, title, description, action, ...props }) => {
        let actionNode = null;
        if (action === 'view-cart') {
          actionNode = <ViewCartButton />;
        } else if (action) {
          actionNode = action;
        }
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && <ToastDescription>{description}</ToastDescription>}
            </div>
            {actionNode}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
