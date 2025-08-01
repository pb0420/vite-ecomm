import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Minus, Plus, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { formatCurrency } from '@/lib/utils';
import { supabase } from '@/lib/supabaseClient';

const ProductPage = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const { addToCart, updateQuantity, cart } = useCart();
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      
      try {
        const { data, error } = await supabase
          .from('products')
          .select(`
            *,
            categories (
              id,
              name
            )
          `)
          .eq('id', id)
          .single();

        if (error) throw error;
        setProduct(data);
      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Get quantity from cart
  const cartItem = cart.find(item => item?.id === product?.id);
  const quantity = cartItem ? cartItem.quantity : 0;
  
  const handleQuantityChange = (newQuantity) => {
    if (product) {
      updateQuantity(product.id, newQuantity);
    }
  };
  
  const handleAddToCart = () => {
    if (product) {
      addToCart(product, 1);
    }
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
        <Button
          variant="ghost"
          size="sm"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Go Back
        </Button>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 items-start">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="overflow-hidden rounded-lg bg-white aspect-square flex items-center justify-center min-h-[180px] max-h-[220px]"
        >
          <img  
            alt={product.name} 
            className="w-3/5 h-3/5 object-contain mx-auto"
            src={product.image_url || "https://bcbxcnxutotjzmdjeyde.supabase.co/storage/v1/object/public/groceroo_images/assets/product-placeholder.webp"} 
          />
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          {product.categories && (
            <Link 
              to={`/category/${product.categories.id}`}
              className="inline-block px-3 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary"
            >
              {product.categories.name}
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
              {quantity > 0 ? (
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="outline" 
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleQuantityChange(quantity - 1)}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-medium w-6 text-center">{quantity}</span>
                  <Button 
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleQuantityChange(quantity + 1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button 
                  className="flex-1"
                  onClick={handleAddToCart}
                  disabled={!product.in_stock}
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  {product.in_stock ? 'Add to Cart' : 'Unavailable'}
                </Button>
              )}
            </div>
            
            {quantity > 0 && (
              <div className="mt-6 text-sm text-muted-foreground">
                <p>
                  <span className="font-medium">Total:</span> {formatCurrency(product.price * quantity)}
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ProductPage;