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
    <a
      size="md"
	  className='text-primary font-medium hover:underline text-lg flex items-center gap-1'
      onClick={openCart}
      tabIndex={0}
    >
      <span style={{fontSize:'12px',padding:'4px', wordSpacing:'0.5px', cursor:'pointer'}}>View Cart</span>
    </a>
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
