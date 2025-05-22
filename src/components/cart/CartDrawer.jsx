import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingCart, Trash2, Plus, Minus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { formatCurrency } from '@/lib/utils';

const CartDrawer = () => {
  const { 
    cart, 
    isCartOpen, 
    closeCart, 
    removeFromCart, 
    updateQuantity, 
    getCartTotal,
    clearCart
  } = useCart();
  const navigate = useNavigate();
  
  const handleCheckout = () => {
    closeCart();
    navigate('/checkout');
  };
  
  const drawerVariants = {
    closed: {
      x: '100%',
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 30
      }
    },
    open: {
      x: 0,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 30
      }
    }
  };
  
  const overlayVariants = {
    closed: { opacity: 0 },
    open: { opacity: 1 }
  };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          <motion.div 
            className="fixed inset-0 z-50 bg-black/50"
            initial="closed"
            animate="open"
            exit="closed"
            variants={overlayVariants}
            onClick={closeCart}
          />
          
          <motion.div 
            className="fixed top-0 right-0 z-50 h-full w-full max-w-md bg-white shadow-xl flex flex-col"
            initial="closed"
            animate="open"
            exit="closed"
            variants={drawerVariants}
          >
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center space-x-2">
                <ShoppingCart className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold">Your Cart</h2>
                <span className="text-sm text-gray-500">
                  ({cart.reduce((total, item) => total + item.quantity, 0)} items)
                </span>
              </div>
              <Button variant="ghost" size="icon" onClick={closeCart}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center flex-1 p-8 space-y-4 text-center">
                <div className="p-4 rounded-full bg-muted">
                  <ShoppingCart className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium">Your cart is empty</h3>
                <p className="text-sm text-muted-foreground">
                  Looks like you haven't added any products to your cart yet.
                </p>
                <Button onClick={() => {
                  closeCart();
                  navigate('/shop');
                }}>
                  Continue Shopping
                </Button>
              </div>
            ) : (
              <>
                <div className="flex-1 p-4 overflow-y-auto">
                  <ul className="space-y-4">
                    <AnimatePresence>
                      {cart.map(item => (
                        <motion.li 
                          key={item.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                          className="flex items-center space-x-4 p-3 rounded-lg border bg-card"
                        >
                          <div className="w-16 h-16 rounded-md bg-muted flex items-center justify-center overflow-hidden">
                            <img 
                              alt={item.name} 
                              className="w-full h-full object-cover" 
                              src={item.image_url || "https://images.pexels.com/photos/264636/pexels-photo-264636.jpeg"} 
                            />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium truncate">{item.name}</h4>
                            <p className="text-sm text-muted-foreground">{formatCurrency(item.price)} / {item.unit}</p>
                            
                            <div className="flex items-center mt-2 space-x-2">
                              <Button 
                                variant="outline" 
                                size="icon" 
                                className="h-7 w-7"
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="text-sm w-8 text-center">{item.quantity}</span>
                              <Button 
                                variant="outline" 
                                size="icon" 
                                className="h-7 w-7"
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          
                          <div className="flex flex-col items-end space-y-2">
                            <span className="text-sm font-medium">
                              {formatCurrency(item.price * item.quantity)}
                            </span>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-7 w-7 text-muted-foreground hover:text-destructive"
                              onClick={() => removeFromCart(item.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </motion.li>
                      ))}
                    </AnimatePresence>
                  </ul>
                </div>
                
                <div className="p-4 border-t bg-muted/30">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Subtotal</span>
                      <span className="text-sm font-medium">{formatCurrency(getCartTotal())}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Shipping</span>
                      <span className="text-sm text-muted-foreground">Calculated at checkout</span>
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t">
                      <span className="text-base font-semibold">Total</span>
                      <span className="text-base font-semibold">{formatCurrency(getCartTotal())}</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={clearCart}
                      >
                        Clear Cart
                      </Button>
                      <Button 
                        className="w-full"
                        onClick={handleCheckout}
                        disabled={cart.length === 0}
                      >
                        Checkout
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CartDrawer;