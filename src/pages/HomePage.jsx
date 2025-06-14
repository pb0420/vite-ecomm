import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Clock, ShieldCheck, MessageCircle, Handshake,ShoppingCart,CupSoda,EggFried,Cookie, Hamburger, Croissant, Apple, Banana, Beef, Candy, Fish, Utensils, Car, MapPinCheckInside, Truck, Store, Search  } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ProductCard from '@/components/products/ProductCard';
import { supabase } from '@/lib/supabaseClient';

const HomePage = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

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

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/shop');
    }
  };

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
      <section className="relative h-[35vh] min-h-[350px] bg-gradient-to-br from-[#2E8B57] via-[#3CB371] to-[#98FB98] overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src="/banner_bg.jpg" 
            alt="Fresh groceries" 
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[#2E8B57]/90 via-[#3CB371]/80 to-[#98FB98]/70" />
        </div>
        
        <div className="container relative h-full px-2 md:px-6">
          <div className="flex flex-col justify-center h-full max-w-3xl mx-auto text-center">
            <motion.div 
              className="space-y-8"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              {/* Location Pill */}
              <motion.div 
                className="inline-flex items-center bg-white/95 backdrop-blur-sm rounded-full px-6 py-3 shadow-lg mx-auto"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.4 }}
              >
                <MapPinCheckInside className="w-5 h-3 text-[#2E8B57] mr-2" />
                <span className="text-[#2E8B57] font-semibold text-lg">Adelaide</span>
              </motion.div>

              {/* Search Bar */}
              <motion.form 
                onSubmit={handleSearch} 
                className="flex gap-3 max-w-lg mx-auto"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.5 }}
              >
                <div className="flex-1 relative">
                  <Input
                    type="text"
                    placeholder="Search for groceries..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-14 pl-6 pr-6 bg-white/95 backdrop-blur-sm border-0 shadow-lg text-gray-800 placeholder:text-gray-500 rounded-full text-lg"
                  />
                </div>
                <Button 
                  type="submit"
                  size="lg" 
                  className="h-14 px-8 bg-[#fd7507] hover:bg-[#fd7507]/90 shadow-lg rounded-full font-semibold"
                >
                  <Search className="w-5 h-5 mr-2" />
                  Search
                </Button>
              </motion.form>

              {/* Categories Scroller */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.5 }}
                className="relative"
              >
                <div className="flex overflow-x-auto pb-4 space-x-6 scrollbar-hide justify-center">
                  {categories.slice(0, 6).map((category) => (
                    <Link
                      key={category.id}
                      to={`/category/${category.id}`}
                      className="flex-none group text-center"
                    >
                      <div className="w-16 h-16 mx-auto mb-2 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:bg-white/30 transition-all duration-300 shadow-lg">
                        <img 
                          src={category.icon_url} 
                          alt={category.name}
                          className="w-10 h-10 object-cover rounded-full"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                        <div className="w-10 h-10 hidden items-center justify-center">
                          {getCatIcon(category.name)}
                        </div>
                      </div>
                      <span className="text-sm font-medium text-white/90 group-hover:text-white transition-colors block truncate max-w-[80px]">
                        {category.name}
                      </span>
                    </Link>
                  ))}
                </div>
              </motion.div>

              {/* Grocery Run Button */}
              <motion.div 
                className="pt-2"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.5 }}
              >
                <Link to="/store-pickup" className="block">
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="w-full max-w-md h-16 bg-white/95 hover:bg-white border-2 border-white/50 shadow-lg text-[#2E8B57] hover:text-[#2E8B57] font-bold text-xl rounded-full mx-auto backdrop-blur-sm transition-all duration-300 hover:scale-105"
                  >
                    <Store className="w-4 h-4 mr-3" />
                    Schedule a Grocery Run
                  </Button>
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-12 bg-white">
        <div className="container px-4 md:px-6">
          <div className="flex items-center justify-between mb-8">
            <motion.h2 
              className="text-2xl font-bold"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              Featured Products
            </motion.h2>
            <Link to="/shop" className="text-primary hover:underline text-sm flex items-center font-medium">
              View All <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
          
          <motion.div 
            className="grid gap-6 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            {featuredProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 bg-gradient-to-r from-gray-50 to-gray-100">
        <div className="container px-4 md:px-6">
          <div className="grid gap-8 md:grid-cols-3">
            <motion.div 
              className="flex flex-col items-center text-center space-y-4 p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="p-4 rounded-full bg-[#2E8B57]/10">
                <Clock className="h-8 w-8 text-[#2E8B57]" />
              </div>
              <h3 className="text-xl font-semibold">Convenience</h3>
              <p className="text-muted-foreground">
                Get your groceries delivered right to your doorstep
              </p>
            </motion.div>
            
            <motion.div 
              className="flex flex-col items-center text-center space-y-4 p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="p-4 rounded-full bg-[#2E8B57]/10">
                <ShieldCheck className="h-8 w-8 text-[#2E8B57]" />
              </div>
              <h3 className="text-xl font-semibold">Quality</h3>
              <p className="text-muted-foreground">
                Strict quality assurance and control
              </p>
            </motion.div>
            
            <motion.div 
              className="flex flex-col items-center text-center space-y-4 p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="p-4 rounded-full bg-[#2E8B57]/10">
                <Handshake className="h-8 w-8 text-[#2E8B57]" />
              </div>
              <h3 className="text-xl font-semibold">Support</h3>
              <p className="text-muted-foreground">
                Super-fast customer support on WhatsApp
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* WhatsApp Button */}
      <Button
        onClick={openWhatsApp}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-[#25D366] hover:bg-[#25D366]/90 z-50"
        size="icon"
      >
        <MessageCircle className="h-6 w-6 text-white" />
      </Button>
    </div>
  );
};

export default HomePage;