import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Clock, ShieldCheck, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ProductCard from '@/components/products/ProductCard';
import CategoryCard from '@/components/products/CategoryCard';
import AiChatBot from '@/components/chat/AiChatBot';
import { supabase } from '@/lib/supabaseClient';

const CategoryIcon = ({ name }) => {
  const icons = {
    'Fruits & Vegetables': Clock,
    'Dairy & Eggs': Clock,
    'Bakery': Clock,
    'Meat & Seafood': Clock,
    'Pantry Staples': Clock,
    'Beverages': Clock,
    'Gift Packs': Clock,
  };
  
  const IconComponent = icons[name] || Clock;
  return <IconComponent className="w-4 h-4" />;
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
  
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[30vh] min-h-[300px] bg-[#F0E68C] overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src="https://images.pexels.com/photos/264636/pexels-photo-264636.jpeg" 
            alt="Fresh groceries" 
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#2E8B57]/80 to-[#F0E68C]/50" />
        </div>
        
        <div className="container relative h-full px-4 md:px-6">
          <div className="flex flex-col justify-center h-full max-w-2xl">
            <motion.div 
              className="space-y-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-4xl md:text-5xl font-bold text-white">
                Delivering now in
              </h1>
              <div className="flex items-center text-3xl text-white font-bold">
                <MapPin className="w-8 h-8 mr-2" />
                <span>Adelaide</span>
              </div>
              <p className="text-white/90 text-lg">
                Shop for fresh produce, pantry staples, and household essentials with fast delivery.
              </p>
              <div className="flex flex-col gap-2 min-[400px]:flex-row pt-4">
                <Link to="/shop">
                  <Button size="lg" className="w-full min-[400px]:w-auto bg-[#2E8B57] hover:bg-[#2E8B57]/90">
                    Shop Now
                  </Button>
                </Link>
                <Link to="/store-pickup">
                  <Button size="lg" variant="outline" className="w-full min-[400px]:w-auto bg-white/90 hover:bg-white">
                    Schedule Grocery Run
                  </Button>
                </Link>
              </div>
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
            <div className="grid grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-4 animate-pulse">
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
                    <div className="bg-white/90 rounded-full p-3 mb-2 group-hover:bg-[#2E8B57] group-hover:text-white transition-colors">
                      <CategoryIcon name={category.name} />
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-3">
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
              <div className="p-2 rounded-full bg-[#2E8B57]/10">
                <Clock className="h-6 w-6 text-[#2E8B57]" />
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
              <div className="p-2 rounded-full bg-[#2E8B57]/10">
                <ShieldCheck className="h-6 w-6 text-[#2E8B57]" />
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
              <div className="p-2 rounded-full bg-[#2E8B57]/10">
                <Clock className="h-6 w-6 text-[#2E8B57]" />
              </div>
              <h3 className="text-lg font-medium">Convenient Shopping</h3>
              <p className="text-sm text-muted-foreground">
                Shop anytime, anywhere with our easy-to-use platform.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* AI Shopping Assistant */}
      <AiChatBot />
    </div>
  );
};

export default HomePage;