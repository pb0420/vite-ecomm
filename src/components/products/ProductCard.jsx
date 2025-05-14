
import React from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/contexts/CartContext';
import { formatCurrency } from '@/lib/utils';

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  
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
           src="https://images.unsplash.com/photo-1554702299-1ac5541cd63b" />
          
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
            <Button 
              size="icon" 
              className="rounded-full"
              onClick={handleAddToCart}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default ProductCard;
