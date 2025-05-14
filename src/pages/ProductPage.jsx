import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Minus, Plus, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getProductById, getCategoryById } from '@/lib/data/helpers';
import { useCart } from '@/contexts/CartContext';
import { formatCurrency } from '@/lib/utils';

const ProductPage = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [category, setCategory] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const { addToCart, cart } = useCart();
  
  useEffect(() => {
    if (id) {
      const productId = parseInt(id);
      const foundProduct = getProductById(productId);
      
      if (foundProduct) {
        setProduct(foundProduct);
        const foundCategory = getCategoryById(foundProduct.category);
        setCategory(foundCategory);
        
        // Set initial quantity from cart if exists
        const cartItem = cart.find(item => item.id === productId);
        if (cartItem) {
          setQuantity(cartItem.quantity);
        }
      }
      
      setLoading(false);
    }
  }, [id, cart]);
  
  const handleAddToCart = () => {
    if (product) {
      addToCart(product, quantity);
    }
  };
  
  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };
  
  const increaseQuantity = () => {
    setQuantity(quantity + 1);
  };
  
  if (loading) {
    return (
      <div className="container px-4 py-8 mx-auto md:px-6">
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }
  
  if (!product) {
    return (
      <div className="container px-4 py-8 mx-auto md:px-6">
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <h2 className="text-2xl font-bold">Product Not Found</h2>
          <p className="mt-2 text-muted-foreground">
            The product you're looking for doesn't exist.
          </p>
          <Link to="/shop">
            <Button className="mt-4">Browse All Products</Button>
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container px-4 py-8 mx-auto md:px-6">
      <div className="mb-6">
        <Link to="/shop" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Shop
        </Link>
      </div>
      
      <div className="grid gap-8 md:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="overflow-hidden rounded-lg bg-muted aspect-square"
        >
          <img  
            alt={product.name} 
            className="w-full h-full object-cover" 
            src={product.image_url || "https://images.unsplash.com/photo-1607825878130-914be8978e27"} 
          />
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          {category && (
            <Link 
              to={`/category/${category.id}`}
              className="inline-block px-3 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary"
            >
              {category.name}
            </Link>
          )}
          
          <h1 className="text-3xl font-bold">{product.name}</h1>
          
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold">{formatCurrency(product.price)}</span>
            <span className="text-sm text-muted-foreground">per {product.unit}</span>
          </div>
          
          <p className="text-muted-foreground">{product.description}</p>
          
          <div className="pt-6 border-t">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={decreaseQuantity}
                  disabled={quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-12 text-center">{quantity}</span>
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={increaseQuantity}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              <Button 
                className="flex-1"
                onClick={handleAddToCart}
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                Add to Cart
              </Button>
            </div>
            
            <div className="mt-6 text-sm text-muted-foreground">
              <p>
                <span className="font-medium">Total:</span> {formatCurrency(product.price * quantity)}
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ProductPage;