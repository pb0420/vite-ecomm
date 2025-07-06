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
      className={`product-card overflow-hidden rounded-lg border bg-card ${!product.in_stock ? 'opacity-60' : ''}`}
    >
      <Link to={`/product/${product.id}`} className="block">
        <div className="relative aspect-square w-full max-h-48 bg-muted">
          <img  
            alt={product.name}
            className="w-full h-full object-cover"
            src={product.image_url || "https://bcbxcnxutotjzmdjeyde.supabase.co/storage/v1/object/public/groceroo_images/assets/product-placeholder.webp"} 
          />
          
          {product.featured && (
            <Badge 
              variant="default" 
              className="absolute top-2 left-2 text-xs"
            >
              Featured
            </Badge>
          )}

          {!product.in_stock && (
            <Badge 
              variant="destructive" 
              className="absolute top-2 right-2 text-xs"
            >
              Out of Stock
            </Badge>
          )}
        </div>
        
        <div className="p-3">
          <h3 className="text-sm font-medium line-clamp-2">{product.name}</h3>
          <div className="flex items-center justify-between mt-1">
            <div className="flex flex-col">
              <span className="text-base font-semibold">{formatCurrency(product.price)}</span>
              <span className="text-xs text-muted-foreground">per {product.unit}</span>
            </div>
            
            {product.in_stock ? (
              quantity > 0 ? (
                <div className="flex items-center space-x-1" onClick={(e) => e.preventDefault()}>
                  <Button 
                    size="icon" 
                    variant="outline"
                    className="h-6 w-6"
                    onClick={(e) => handleQuantityChange(e, quantity - 1)}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="text-xs font-medium w-4 text-center">{quantity}</span>
                  <Button 
                    size="icon"
                    className="h-6 w-6"
                    onClick={(e) => handleQuantityChange(e, quantity + 1)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <Button 
                  size="icon" 
                  className="h-7 w-7 rounded-full"
                  onClick={handleAddToCart}
                >
                  <ShoppingCart className="h-3 w-3" />
                </Button>
              )
            ) : (
              <Button 
                size="icon" 
                className="h-7 w-7 rounded-full"
                disabled
              >
                <ShoppingCart className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default ProductCard;