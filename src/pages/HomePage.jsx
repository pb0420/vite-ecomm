import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Clock, ShieldCheck, MessageCircle, Handshake,ShoppingCart,CupSoda,EggFried,Cookie, Hamburger, Croissant, Apple, Banana, Beef, Candy, Fish, Utensils, Car, MapPinCheckInside, Truck, Store  } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ProductCard from '@/components/products/ProductCard';
import { supabase } from '@/lib/supabaseClient';

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
          .order('name');

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

  const iconClass = "w-8 h-8 text-primary";
  const getCatIcon = (cName) => {
     switch(cName.toLowerCase()){
      case "beverages":
      case "soda":
      case "drinks":
        return <CupSoda className={iconClass} />;
      case "dairy & eggs":
        return <EggFried className={iconClass} />;
      case "cookies":
      case "biscuits":
        return <Cookie className={iconClass} />;
      case "burgers":
      case "fast food":
        return <Hamburger className={iconClass} />;
      case "bakery":
        return <Croissant className={iconClass} />;
      case "fruits":
        return <Apple className={iconClass} />;
      case "meat":
        return <Beef className={iconClass} />;
      case "confectionary":
        return <Candy className={iconClass} />;
      case "seafood":
        return <Fish className={iconClass} />;
      case "kitchen":
        return <Utensils className={iconClass} />;
      default:
        return <Clock className={iconClass} />;
     }
  }
  
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[30vh] min-h-[300px] bg-[#F0E68C] overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src="/banner_bg.jpg" 
            alt="Fresh groceries" 
            className="w-full h-full object-cover opacity-70"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#99C54F]/80 to-[#FFD580]/50" />
        </div>
        
        <div className="container relative h-full px-4 md:px-6">
          <div className="flex flex-col justify-center h-full max-w-1xl">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
                <h2 className="text-1xl md:text-3xl font-bold text-white"><button><MapPinCheckInside /></button> &nbsp;Adelaide </h2>
              
              <p className="text-xl text-white/90">
               Get groceries and more delivered to your doorstep!
              </p>
              <div className="flex flex-col gap-2 min-[400px]:flex-row pt-4">
                <Link to="/shop">
                  <Button size="lg" className="w-full min-[400px]:w-auto bg-[#fd7507] hover:bg-[#fd7507]/90">
                   <ShoppingCart />&nbsp;  Quick Shop
                  </Button>
                </Link>
                <Link to="/store-pickup">
                  <Button size="lg" variant="outline" className="w-full min-[400px]:w-auto bg-white/90 hover:bg-white">
                   <Store />&nbsp; Schedule a Grocery Run
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-8 bg-background">
        <div className="container px-4 md:px-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Categories</h2>
            <Link to="/categories" className="text-primary hover:underline text-sm flex items-center">
              View All <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
          
          <div className="relative">
            <div className="flex overflow-x-auto pb-4 space-x-4 scrollbar-hide">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  to={`/category/${category.id}`}
                  className="flex-none w-24 group text-center"
                >
                  <div className="w-16 h-16 mx-auto mb-2 bg-muted/50 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                    {/* {getCatIcon(category.name)} */}
                     <img src={category.icon_url || getCatIcon(category.name)} alt="Fresh groceries" className="w-full h-full object-cover "/>
                  </div>
                  <span className="text-xs font-medium block truncate">{category.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-8">
        <div className="container px-4 md:px-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Featured Products</h2>
            <Link to="/shop" className="text-primary hover:underline text-sm flex items-center">
              View All <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
          
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
            {featuredProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-8 bg-muted/30">
        <div className="container px-4 md:px-6">
          <div className="grid gap-4 md:grid-cols-3">
            <motion.div 
              className="flex flex-col items-center text-center space-y-2 p-4 bg-background rounded-lg shadow-sm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="p-2 rounded-full bg-[#2E8B57]/10">
                <Clock className="h-5 w-5 text-[#2E8B57]" />
              </div>
              <h3 className="text-base font-medium">Convenience</h3>
              <p className="text-sm text-muted-foreground">
                Get your groceries delivered right to your doorstep
              </p>
            </motion.div>
            
            <motion.div 
              className="flex flex-col items-center text-center space-y-2 p-4 bg-background rounded-lg shadow-sm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <div className="p-2 rounded-full bg-[#2E8B57]/10">
                <ShieldCheck className="h-5 w-5 text-[#2E8B57]" />
              </div>
              <h3 className="text-base font-medium">Quality</h3>
              <p className="text-sm text-muted-foreground">
                Strict quality assurance and control
              </p>
            </motion.div>
            
            <motion.div 
              className="flex flex-col items-center text-center space-y-2 p-4 bg-background rounded-lg shadow-sm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <div className="p-2 rounded-full bg-[#2E8B57]/10">
                <Handshake className="h-5 w-5 text-[#2E8B57]" />
              </div>
              <h3 className="text-base font-medium">Support</h3>
              <p className="text-sm text-muted-foreground">
                Super-fast customer support on WhatsApp
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* WhatsApp Button */}
      <Button
        onClick={openWhatsApp}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-[#25D366] hover:bg-[#25D366]/90"
        size="icon"
      >
        <MessageCircle className="h-6 w-6 text-white" />
      </Button>
    </div>
  );
};

export default HomePage;