// File: groceroo/src/pages/HomePage.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Clock, ShieldCheck, MessageCircle, Handshake, ShoppingCart, CupSoda, EggFried, Cookie, Hamburger, Croissant, Apple, Banana, Beef, Candy, Fish, Utensils, Car, MapPinCheckInside, Truck, Store, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ProductCard from '@/components/products/ProductCard';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';

const HomePage = () => {
  const { user } = useAuth();
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [previouslyOrderedProducts, setPreviouslyOrderedProducts] = useState([]);
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
          .limit(20);

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

        // Fetch previously ordered products if user is logged in
        if (user) {
          await fetchPreviouslyOrderedProducts();
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const fetchPreviouslyOrderedProducts = async () => {
    try {
      // Get user's orders
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('items')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5); // Get last 5 orders

      if (ordersError) throw ordersError;

      if (orders && orders.length > 0) {
        // Extract unique product IDs from order items
        const productIds = new Set();
        orders.forEach(order => {
          if (order.items && Array.isArray(order.items)) {
            order.items.forEach(item => {
              if (item.id) productIds.add(item.id);
            });
          }
        });

        if (productIds.size > 0) {
          // Fetch product details for these IDs
          const { data: previousProducts, error: productsError } = await supabase
            .from('products')
            .select(`
              *,
              categories (
                id,
                name
              )
            `)
            .in('id', Array.from(productIds))
            .limit(12);

          if (!productsError && previousProducts) {
            setPreviouslyOrderedProducts(previousProducts);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching previously ordered products:', error);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/shop');
    }
  };

  const openWhatsApp = () => {
    window.open('https://wa.me/61478477036', '_blank');
  };

  const iconClass = "w-5 h-5 text-primary";
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
      {/* Hero Section - Made smaller */}
      <section className="relative min-h-[350px] h-[40vh] max-h-[500px] bg-gradient-to-br from-[#2E8B57] via-[#3CB371] to-[#98FB98] overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="/banner_bg.jpeg"
            alt="Grocery delivery"
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[#2E8B57]/90 via-[#3CB371]/80 to-[#98FB98]/70" />
        </div>

        <div className="container relative h-full px-4 md:px-6">
          <div className="flex flex-col justify-center h-full max-w-4xl mx-auto py-4 md:py-6">
            <motion.div
              className="space-y-3 md:space-y-4"
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
                  <span className="text-[#2E8B57] font-semibold text-xs">Adelaide : </span>  <Clock className="w-3 h-3 text-[#2E8B57] mr-1.5" />
                  <span className="text-[#2E8B57] font-small text-xs">
                     {deliveryTime}m
                  </span>
                </div>

                {/* Delivery Time Pill - Right */}
                {/* <div className="inline-flex items-center bg-white/95 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-lg w-fit sm:ml-auto">
                  <Clock className="w-3 h-3 text-[#2E8B57] mr-1.5" />
                  <span className="text-[#2E8B57] font-small text-xs">
                    Delivering in: {deliveryTime}m
                  </span>
                </div> */}
              </motion.div>

              {/* Search Bar */}
              <motion.form
                onSubmit={handleSearch}
                className="flex gap-2 w-full"
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
                    className="h-10 md:h-12 pl-3 pr-3 bg-white/95 backdrop-blur-sm border-0 shadow-lg text-gray-800 placeholder:text-gray-500 text-sm"
                  />
                </div>
                <Button
                  type="submit"
                  size="sm"
                  className="h-10 md:h-12 px-4 bg-[#fd7507] hover:bg-[#fd7507]/90 shadow-lg text-sm"
                >
                  GO &nbsp;<ArrowRight className="w-3 h-3" />
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
                      <div className="w-12 h-12 md:w-14 md:h-14 mx-auto mb-1 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:bg-white/30 transition-all duration-300 shadow-lg">
                        <img
                          src={category.icon_url}
                          alt={category.name}
                          className="w-8 h-8 md:w-10 md:h-10 object-cover rounded-full"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                        <div className="w-8 h-8 md:w-10 md:h-10 hidden items-center justify-center">
                          {getCatIcon(category.name)}
                        </div>
                      </div>
                      <span className="text-xs font-medium text-white/90 group-hover:text-white transition-colors block truncate max-w-[45px] md:max-w-[55px]">
                        {category.name}
                      </span>
                    </Link>
                  ))}
                  <Link to="/categories" className="flex-none group text-center">
                    <div className="w-12 h-12 md:w-14 md:h-14 mx-auto mb-1 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:bg-white/30 transition-all duration-300 shadow-lg">
                      <div className="flex flex-col items-center">
                        <ArrowRight className="h-4 w-4 md:h-5 md:w-5 text-white" />
                      </div>
                    </div>
                    <span className="text-xs font-medium text-white/90 group-hover:text-white transition-colors block truncate max-w-[45px] md:max-w-[55px]">View All</span>
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
                    className="w-full h-10 md:h-12 bg-white/95 hover:bg-white border-2 border-white/50 shadow-lg text-[#2E8B57] hover:text-[#2E8B57] font-bold text-sm mx-auto backdrop-blur-sm transition-all duration-300 hover:scale-105"
                  >
                    <Truck className="w-4 h-4 mr-2" />
                    Schedule a Grocery Run
                  </Button>
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Previously Ordered Products Section - Only show if user is logged in */}
      {user && previouslyOrderedProducts.length > 0 && (
        <section className="py-8 bg-gray-50">
          <div className="container px-4 md:px-6">
            <div className="flex items-center justify-between mb-6">
              <motion.h2
                className="text-xl font-bold"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
              >
                Your Previous Orders
              </motion.h2>
              <Link to="/account" className="flex-none group text-center">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 mx-auto mb-1 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:bg-white/30 transition-all duration-300 shadow-lg">
                    <ArrowRight className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-xs font-medium text-primary transition-colors block truncate">View All</span>
                </div>
              </Link>
            </div>
            <motion.div
              className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              {previouslyOrderedProducts.slice(0, 8).map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </motion.div>
          </div>
        </section>
      )}

      {/* Featured Products Section */}
      <section className="py-8 bg-white">
        <div className="container px-4 md:px-6">
          <div className="flex items-center justify-between mb-6">
            <motion.h2
              className="text-xl font-bold"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              Featured Products
            </motion.h2>
            <Link to="/shop" className="flex-none group text-center">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 mx-auto mb-1 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:bg-white/30 transition-all duration-300 shadow-lg">
                  <ArrowRight className="h-5 w-5 text-primary" />
                </div>
                <span className="text-xs font-medium text-primary transition-colors block truncate">View All</span>
              </div>
            </Link>
          </div>
          <motion.div
            className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
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
      <section className="py-8 bg-gradient-to-r from-gray-50 to-gray-100">
        <div className="container px-4 md:px-6">
          <div className="grid gap-6 md:grid-cols-3">
            <motion.div
              className="flex flex-col items-center text-center space-y-3 p-5 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="p-3 rounded-full bg-[#2E8B57]/10">
                <Clock className="h-7 w-7 text-[#2E8B57]" />
              </div>
              <h3 className="text-lg font-semibold">Convenience</h3>
              <p className="text-muted-foreground text-sm">
                Get your groceries delivered right to your doorstep
              </p>
            </motion.div>

            <motion.div
              className="flex flex-col items-center text-center space-y-3 p-5 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="p-3 rounded-full bg-[#2E8B57]/10">
                <ShieldCheck className="h-7 w-7 text-[#2E8B57]" />
              </div>
              <h3 className="text-lg font-semibold">Quality</h3>
              <p className="text-muted-foreground text-sm">
                Strict product quality assurance and control with safe handling
              </p>
            </motion.div>

            <motion.div
              className="flex flex-col items-center text-center space-y-3 p-5 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="p-3 rounded-full bg-[#2E8B57]/10">
                <Handshake className="h-7 w-7 text-[#2E8B57]" />
              </div>
              <h3 className="text-lg font-semibold">Support</h3>
              <p className="text-muted-foreground text-sm">
                Fast and reliable customer support online and on WhatsApp
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