// File: groceroo/src/pages/HomePage.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Clock, ShieldCheck, MessageCircle, Handshake, ShoppingCart, CupSoda, EggFried, Cookie, Hamburger, Croissant, Apple, Banana, Beef, Candy, Fish, Utensils, Car, MapPinCheckInside, Truck, Store, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ProductCard from '@/components/products/ProductCard';
import { supabase } from '@/lib/supabaseClient';

const HomePage = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deliveryTime, setDeliveryTime] = useState(45); // Default fallback
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch featured products
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
          .limit(7);

        if (categoriesError) throw categoriesError;

        // Fetch delivery settings for estimated delivery time
        const { data: deliverySettings, error: deliveryError } = await supabase
          .from('delivery_settings')
          .select('estimated_delivery_minutes')
          .eq('id', 1)
          .single();

        if (!deliveryError && deliverySettings) {
          setDeliveryTime(deliverySettings.estimated_delivery_minutes);
        }

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

  const iconClass = "w-6 h-6 text-primary";
  const getCatIcon = (cName) => {
    switch (cName.toLowerCase()) {
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
      {/* Hero Section - Improved responsive height */}
      <section className="relative min-h-[400px] h-[50vh] max-h-[600px] bg-gradient-to-br from-[#2E8B57] via-[#3CB371] to-[#98FB98] overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="/banner_bg.jpeg"
            alt="Fresh groceries"
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[#2E8B57]/90 via-[#3CB371]/80 to-[#98FB98]/70" />
        </div>

        <div className="container relative h-full px-4 md:px-6">
          <div className="flex flex-col justify-center h-full max-w-4xl mx-auto py-6 md:py-8">
            <motion.div
              className="space-y-4 md:space-y-5"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              {/* Location and Delivery Time Pills */}
              <motion.div
                className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.4 }}
              >
                {/* Location Pill - Left */}
                <div className="inline-flex items-center bg-white/95 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-lg w-fit">
                  <MapPinCheckInside className="w-3 h-3 text-[#fd7507] mr-1.5" />
                  <span className="text-[#2E8B57] font-semibold text-xs">Adelaide</span>&nbsp;
                  <Clock className="w-3 h-3 text-[#2E8B57] mr-1.5" />
                  <span className="text-[#2E8B57] font-medium text-xs">
                    {deliveryTime}m 
                  </span>
                </div>

                {/* Delivery Time Pill - Right */}
                {/* <div className="inline-flex items-center bg-white/95 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-lg w-fit sm:ml-auto">
                  <Clock className="w-3 h-3 text-[#2E8B57] mr-1.5" />
                  <span className="text-[#2E8B57] font-medium text-xs">
                    Delivering in: {deliveryTime}m (approx.)
                  </span>
                </div> */}
              </motion.div>

              {/* Search Bar */}
              <motion.form
                onSubmit={handleSearch}
                className="flex gap-2 w-full" // Modified className here
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.5 }}
              >
                <div className="flex-1 relative">
                  <Input
                    type="text"
                    placeholder="Search for groceries and more..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-12 md:h-14 pl-3 pr-3 bg-white/95 backdrop-blur-sm border-0 shadow-lg text-gray-800 placeholder:text-gray-500 text-sm"
                  />
                </div>
                <Button
                  type="submit"
                  size="sm"
                  className="h-12 md:h-14 px-4 bg-[#fd7507] hover:bg-[#fd7507]/90 shadow-lg text-sm"
                >
                  <Search className="w-3 h-3 mr-2" />
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
                <div className="flex overflow-x-auto pb-2 space-x-3 scrollbar-hide px-4 md:px-0 md:justify-center">
                  {categories.map((category) => (
                    <Link
                      key={category.id}
                      to={`/category/${category.id}`}
                      className="flex-none group text-center"
                    >
                      <div className="w-14 h-14 md:w-16 md:h-16 mx-auto mb-1 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:bg-white/30 transition-all duration-300 shadow-lg">
                        <img
                          src={category.icon_url}
                          alt={category.name}
                          className="w-10 h-10 md:w-12 md:h-12 object-cover rounded-full"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                        <div className="w-10 h-10 md:w-12 md:h-12 hidden items-center justify-center">
                          {getCatIcon(category.name)}
                        </div>
                      </div>
                      <span className="text-xs font-medium text-white/90 group-hover:text-white transition-colors block truncate max-w-[50px] md:max-w-[60px]">
                        {category.name}
                      </span>
                    </Link>
                  ))}
                  <Link to="/categories" className="flex-none group text-center">
                    <div className="w-14 h-14 md:w-16 md:h-16 mx-auto mb-1 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:bg-white/30 transition-all duration-300 shadow-lg">
                      <div className="flex flex-col items-center">
                        <ArrowRight className="h-5 w-5 md:h-6 md:w-6 text-white" />
                      </div>
                    </div>
                    <span className="text-xs font-medium text-white/90 group-hover:text-white transition-colors block truncate max-w-[50px] md:max-w-[60px]">View All</span>
                  </Link>
                </div>
              </motion.div>

              {/* Grocery Run Button */}
              <motion.div
                className="pt-2 flex justify-center"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.5 }}
              >
                <Link to="/store-pickup" className="block w-full max-w-md">
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full h-12 md:h-14 bg-white/95 hover:bg-white border-2 border-white/50 shadow-lg text-[#2E8B57] hover:text-[#2E8B57] font-bold text-sm md:text-base mx-auto backdrop-blur-sm transition-all duration-300 hover:scale-105"
                  >
                    ...<Truck className="w-4 h-4 mr-2" />
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
            <Link to="/shop" className="flex-none group text-center">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 mx-auto mb-1 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:bg-white/30 transition-all duration-300 shadow-lg">
                  <ArrowRight className="h-6 w-6 text-primary" />
                </div>
                <span className="text-xs font-medium text-primary transition-colors block truncate">View All</span>
              </div>
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
