import React from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, Plus, Minus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/contexts/CartContext';
import { formatCurrency } from '@/lib/utils';

const ProductCard = ({ product }) => {
  const { addToCart, updateQuantity, cart } = useCart();
  
  // Get quantity from cart
  const cartItem = cart.find(item => item.id === product.id);
  const quantity = cartItem ? cartItem.quantity : 0;
  
  const handleQuantityChange = (e, newQuantity) => {
    e.preventDefault();
    e.stopPropagation();
    updateQuantity(product.id, newQuantity);
  };
  
  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, 1);
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="product-card overflow-hidden rounded-lg border bg-card"
    >
      <Link to={`/product/${product.id}`} className="block">
        <div className="relative aspect-square bg-muted">
          <img  
            alt={product.name}
            className="w-full h-full object-cover"
            src={product.image_url || "https://images.unsplash.com/photo-1554702299-1ac5541cd63b"} 
          />
          
          {product.featured && (
            <Badge 
              variant="default" 
              className="absolute top-2 left-2"
            >
              Featured
            </Badge>
          )}
        </div>
        
        <div className="p-4">
          <h3 className="font-medium truncate">{product.name}</h3>
          <div className="flex items-center justify-between mt-1">
            <div className="flex flex-col">
              <span className="text-lg font-semibold">{formatCurrency(product.price)}</span>
              <span className="text-xs text-muted-foreground">per {product.unit}</span>
            </div>
            
            {quantity > 0 ? (
              <div className="flex items-center space-x-2" onClick={(e) => e.preventDefault()}>
                <Button 
                  size="icon" 
                  variant="outline"
                  className="h-8 w-8"
                  onClick={(e) => handleQuantityChange(e, quantity - 1)}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium w-6 text-center">{quantity}</span>
                <Button 
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => handleQuantityChange(e, quantity + 1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button 
                size="icon" 
                className="rounded-full"
                onClick={handleAddToCart}
              >
                <ShoppingCart className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default ProductCard;