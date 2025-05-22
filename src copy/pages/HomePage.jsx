import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Truck, Clock, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ProductCard from '@/components/products/ProductCard';
import CategoryCard from '@/components/products/CategoryCard';
import { supabase } from '@/lib/supabaseClient';

const HomePage = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch featured products with category information
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select(`
            *,
            categories (
              id,
              name
            )
          `)
          .eq('featured', true)
          .limit(4);

        if (productsError) throw productsError;

        // Fetch categories
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('categories')
          .select('*')
          .order('name')
          .limit(3);

        if (categoriesError) throw categoriesError;

        setFeaturedProducts(productsData || []);
        setCategories(categoriesData || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);
  
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="hero-gradient py-16 md:py-24">
        <div className="container px-4 md:px-6">
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
            <div className="space-y-4">
              <motion.h1 
                className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                Fresh Groceries Delivered to Your Doorstep
              </motion.h1>
              <motion.p 
                className="max-w-[600px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                Shop for fresh produce, pantry staples, and household essentials with fast delivery and exceptional quality.
              </motion.p>
              <motion.div 
                className="flex flex-col gap-2 min-[400px]:flex-row"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Link to="/shop">
                  <Button size="lg" className="w-full min-[400px]:w-auto">
                    Shop Now
                  </Button>
                </Link>
                <Link to="/categories">
                  <Button size="lg" variant="outline" className="w-full min-[400px]:w-auto">
                    Browse Categories
                  </Button>
                </Link>
              </motion.div>
            </div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mx-auto w-full max-w-[500px] aspect-square rounded-xl overflow-hidden"
            >
              <img  
                alt="Fresh groceries" 
                className="w-full h-full object-cover" 
                src="https://images.unsplash.com/photo-1573246123716-6b1782bfc499" 
              />
            </motion.div>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-12 bg-muted/30">
        <div className="container px-4 md:px-6">
          <div className="grid gap-6 md:grid-cols-3">
            <motion.div 
              className="flex flex-col items-center text-center space-y-2 p-6 bg-background rounded-lg shadow-sm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="p-2 rounded-full bg-primary/10">
                <Truck className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-medium">Fast Delivery</h3>
              <p className="text-sm text-muted-foreground">
                Get your groceries delivered within hours of ordering.
              </p>
            </motion.div>
            
            <motion.div 
              className="flex flex-col items-center text-center space-y-2 p-6 bg-background rounded-lg shadow-sm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <div className="p-2 rounded-full bg-primary/10">
                <ShieldCheck className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-medium">Quality Guarantee</h3>
              <p className="text-sm text-muted-foreground">
                We ensure the freshness and quality of all our products.
              </p>
            </motion.div>
            
            <motion.div 
              className="flex flex-col items-center text-center space-y-2 p-6 bg-background rounded-lg shadow-sm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <div className="p-2 rounded-full bg-primary/10">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-medium">Convenient Shopping</h3>
              <p className="text-sm text-muted-foreground">
                Shop anytime, anywhere with our easy-to-use platform.
              </p>
            </motion.div>
          </div>
        </div>
      </section>
      
      {/* Featured Products Section */}
      <section className="py-12">
        <div className="container px-4 md:px-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold tracking-tight">Featured Products</h2>
            <Link to="/shop" className="flex items-center text-primary text-sm font-medium">
              View All <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="product-grid">
              {featuredProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>
      
      {/* Categories Section */}
      <section className="py-12 bg-muted/30">
        <div className="container px-4 md:px-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold tracking-tight">Shop by Category</h2>
            <Link to="/categories" className="flex items-center text-primary text-sm font-medium">
              All Categories <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map(category => (
                <CategoryCard key={category.id} category={category} />
              ))}
            </div>
          )}
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-12 bg-primary text-primary-foreground">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Ready to simplify your grocery shopping?</h2>
            <p className="max-w-[600px] text-primary-foreground/90 md:text-xl/relaxed">
              Join thousands of happy customers who have made Groceroo their go-to grocery delivery service.
            </p>
            <Link to="/shop">
              <Button size="lg" variant="secondary" className="mt-4">
                Start Shopping Now
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;