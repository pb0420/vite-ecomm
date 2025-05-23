import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Truck, Clock, ShieldCheck, MessageCircle, ShoppingBag, Gift, Cake, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ProductCard from '@/components/products/ProductCard';
import CategoryCard from '@/components/products/CategoryCard';
import AiChatBot from '@/components/chat/AiChatBot';
import { supabase } from '@/lib/supabaseClient';

const CategoryIcon = ({ name }) => {
  const icons = {
    'Fruits & Vegetables': ShoppingBag,
    'Dairy & Eggs': ShoppingBag,
    'Bakery': Cake,
    'Meat & Seafood': ShoppingBag,
    'Pantry Staples': ShoppingBag,
    'Beverages': ShoppingBag,
    'Gift Packs': Gift,
  };
  
  const IconComponent = icons[name] || ShoppingBag;
  return <IconComponent className="w-6 h-6" />;
};

const HomePage = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
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

        const { data: categoriesData, error: categoriesError } = await supabase
          .from('categories')
          .select('*')
          .order('name')
          .limit(6);

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

  const openWhatsApp = () => {
    window.open('https://wa.me/1234567890', '_blank');
  };
  
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="hero-gradient py-16 md:py-24">
        <div className="container px-4 md:px-6">
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
            <div className="space-y-4">
              <motion.div 
                className="flex items-center text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <span>Delivering now in</span>
              </motion.div>
              <motion.div
                className="flex items-center text-3xl md:text-4xl text-primary font-bold"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <MapPin className="w-8 h-8 mr-2" />
                <span>Adelaide</span>
              </motion.div>
              <motion.p 
                className="max-w-[600px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                Shop for fresh produce, pantry staples, and household essentials with fast delivery and exceptional quality.
              </motion.p>
              <motion.div 
                className="flex flex-col gap-2 min-[400px]:flex-row"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <Link to="/shop">
                  <Button size="lg" className="w-full min-[400px]:w-auto">
                   Quick Shop
                  </Button>
                </Link>
                <Link to="/store-pickup">
                  <Button size="lg" variant="outline" className="w-full min-[400px]:w-auto">
                    Schedule a Grocery Run
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
                src="https://images.pexels.com/photos/264636/pexels-photo-264636.jpeg" 
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-12 bg-background">
        <div className="container px-4 md:px-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold tracking-tight">Shop by Category</h2>
            <Link to="/categories" className="text-primary hover:underline flex items-center">
              View All <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
          
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 animate-pulse">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="aspect-square bg-muted rounded-lg"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  to={`/category/${category.id}`}
                  className="group relative aspect-square bg-muted rounded-lg overflow-hidden hover:shadow-lg transition-all"
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-black/0" />
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                    <div className="bg-white/90 rounded-full p-4 mb-2 group-hover:bg-primary group-hover:text-white transition-colors">
                      <CategoryIcon name={category.name} />
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="text-white text-sm font-medium text-center">{category.name}</h3>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-12">
        <div className="container px-4 md:px-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold tracking-tight">Featured Products</h2>
            <Link to="/shop" className="text-primary hover:underline flex items-center">
              View All <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
          
          {loading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="aspect-[4/5] bg-muted rounded-lg animate-pulse"></div>
              ))}
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {featuredProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
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

      {/* WhatsApp Button */}
      <Button
        onClick={openWhatsApp}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-green-500 hover:bg-green-600"
        size="icon"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>

      {/* AI Shopping Assistant */}
      <AiChatBot />
    </div>
  );
};

export default HomePage;