// File: groceroo/src/pages/HomePage.jsx
import React, { useState, useEffect } from 'react';
import { color, motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Clock, ShieldCheck, MessageCircle, Handshake, ShoppingCart, CupSoda, EggFried, Cookie, Hamburger, Croissant, Apple, Banana, Beef, Candy, Fish, Utensils, Car, MapPinCheckInside, Truck, Store, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ProductCard from '@/components/products/ProductCard';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
// Import the AiChatBot component
import AiChatBot from '@/components/chat/AiChatBot'; // Assuming this path is correct
import { setQueryCache, getQueryCache } from '@/lib/queryCache';
import LoginDialog from '@/components/auth/LoginDialog';

function isIos() {
  return /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
}
function isAndroid() {
  return /android/.test(window.navigator.userAgent.toLowerCase());
}
function isInStandaloneMode() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  );
}

const AddToHomeScreenToast = ({ onClose, platform }) => (
  <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in-up max-w-xs w-full">
    <button onClick={onClose} className="ml-1 mr-2 text-lg font-bold">×</button>
    <span>
      {platform === 'ios'
        ? 'Install the app on your iOS device: tap Share, then "Add to Home Screen".'
        : 'Install the app: tap the menu and "Add to Home screen".'}
    </span>
  </div>
);

const HomePage = () => {
  const { user } = useAuth();
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [previouslyOrderedProducts, setPreviouslyOrderedProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deliveryTime, setDeliveryTime] = useState(45); // Default fallback
  const [showA2HS, setShowA2HS] = useState(false);
  const [platform, setPlatform] = useState(null);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Try cache first
        let productsData = getQueryCache('featuredProducts');
        let categoriesData = getQueryCache('categories_home');
        let deliverySettings = getQueryCache('deliverySettings');

        if (!productsData) {
          const { data, error } = await supabase
            .from('products')
            .select(`*, categories ( id, name )`)
            .eq('featured', true)
            .limit(20);
          if (error) throw error;
          productsData = data || [];
          setQueryCache('featuredProducts', productsData);
        }
        if (!categoriesData) {
          const { data, error } = await supabase
            .from('categories')
            .select('*')
            .order('priority',{ ascending: false })
            .limit(7);
          if (error) throw error;
          categoriesData = data || [];
          setQueryCache('categories_home', categoriesData);
        }
        if (!deliverySettings) {
          const { data, error } = await supabase
            .from('delivery_settings')
            .select('estimated_delivery_minutes')
            .eq('id', 1)
            .single();
          if (!error && data) {
            deliverySettings = data;
            setQueryCache('deliverySettings', deliverySettings);
          }
        }
        setFeaturedProducts(productsData);
        setCategories(categoriesData);
        if (deliverySettings) setDeliveryTime(deliverySettings.estimated_delivery_minutes);

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
      let previousProducts = getQueryCache(`previouslyOrderedProducts_${user?.id}`);
      if (!previousProducts) {
        // Get user's orders
        const { data: orders, error: ordersError } = await supabase
          .from('orders')
          .select('items')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);
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
            const { data, error } = await supabase
              .from('products')
              .select(`*, categories ( id, name )`)
              .in('id', Array.from(productIds))
              .limit(12);
            if (!error && data) {
              previousProducts = data;
              setQueryCache(`previouslyOrderedProducts_${user.id}`, previousProducts);
            }
          }
        }
      }
      if (previousProducts) setPreviouslyOrderedProducts(previousProducts);
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

  // Debounced search navigation
  useEffect(() => {
    if (!searchQuery) return;
    const timer = setTimeout(() => {
      // Search limit for logged out users
      if (!user) {
        const count = parseInt(localStorage.getItem('search_count') || '0', 10);
        if (count >= 10) {
          setShowLoginDialog(true);
          return;
        }
        localStorage.setItem('search_count', (count + 1).toString());
      }
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, user, navigate]);

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
      case "candy": // Added candy case
        return <Candy className={iconClass} />;
      case "seafood":
        return <Fish className={iconClass} />;
      case "kitchen":
        return <Utensils className={iconClass} />;
      default:
        return <Clock className={iconClass} />;
    }
  }

  useEffect(() => {
    if (window.innerWidth > 768) return; // Only show on small screens
    if (isInStandaloneMode()) return; // Already installed
    if (localStorage.getItem('a2hs-dismissed')) return;
    if (isIos()) {
      setPlatform('ios');
      setShowA2HS(true);
    } else if (isAndroid()) {
      setPlatform('android');
      setShowA2HS(true);
    }
  }, []);

  const handleCloseA2HS = () => {
    setShowA2HS(false);
    localStorage.setItem('a2hs-dismissed', '1');
  };

  return (
    <div className="flex flex-col min-h-screen">
      {showA2HS && <AddToHomeScreenToast onClose={handleCloseA2HS} platform={platform} />}
      {/* Hero Section - Made smaller */}
      <section className="relative min-h-[350px] h-[40vh] max-h-[500px] bg-gradient-to-br from-[#2E8B57] via-[#3CB371] to-[#98FB98] overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="/outbanner.webp"
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
                transition={{ delay: 0.1, duration: 0.2 }}
              >
                {/* Location Pill - Left */}
                <div className="inline-flex items-center bg-white/95 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-lg w-fit">
                  <MapPinCheckInside className="w-3 h-3 text-[#fd7507] mr-1.5" />
                  <span className="text-[#2E8B57] font-semibold text-xs">Adelaide &nbsp; </span>  <Clock className="w-3 h-3 text-[#2E8B57] mr-1.5" />
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
                onSubmit={e => e.preventDefault()}
                className="flex gap-1 w-full"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.3 }}
              >
                <div className="flex-1 relative">
                  <Input
                    type="text"
                    placeholder="Search for groceries and more..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-10 md:h-12 pl-3 bg-white/95 backdrop-blur-sm border-0 shadow-lg text-gray-800 placeholder:text-gray-500 text-sm"
                  />
                </div>
              </motion.form>

              {/* Grocery Run and Shop Buttons */}
              <motion.div
                className="pt-2 flex justify-center gap-2"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.3 }}
              >
              </motion.div>

              {/* Categories Scroller */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.3 }}
                className="relative"
              >
                <div className="flex overflow-x-auto pb-1 space-x-3 scrollbar-hide px-4 md:px-0 md:justify-center">
                  {categories.map((category) => (
                    <Link
                      key={category.id}
                      to={`/category/${category.id}`}
                      className="flex-none group text-center"
                    >
                      <div className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-1 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:bg-white/30 transition-all duration-300 shadow-lg">
                        <img
                          src={category.icon_url}
                          alt={category.name}
                          className="w-12 h-12 md:w-14 md:h-14 object-cover rounded-full"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                        <div className="w-12 h-12 md:w-14 md:h-14 hidden items-center justify-center">
                          {getCatIcon(category.name)}
                        </div>
                      </div>
                      <span className="text-xs font-medium text-white/90 group-hover:text-white transition-colors block truncate max-w-[60px] md:max-w-[75px]">
                        {category.name}
                      </span>
                    </Link>
                  ))}
                  <Link to="/categories" className="flex-none group text-center">
                    <div className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-1 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:bg-white/30 transition-all duration-300 shadow-lg">
                      <div className="flex flex-col items-center">
                        <ArrowRight className="h-6 w-6 md:h-8 md:w-8 text-white" />
                      </div>
                    </div>
                    <span className="text-xs font-medium text-white/90 group-hover:text-white transition-colors block truncate max-w-[60px] md:max-w-[75px]">View All</span>
                  </Link>
                </div>
              </motion.div>

              {/* Grocery Run Button */}
              <motion.div
                className="pt-2 flex justify-center md:max-w-[400px] lg:max-w-[400px] mx-auto gap-2"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.3 }}
              >
                <Link to="/shop" className="block w-full max-w-[160px]">
                  <Button
                    size="lg"
                    style={{ background: '#fd7507', color: 'white' }}
                    className="w-full h-10 md:h-12 font-bold text-sm mx-auto backdrop-blur-sm transition-all duration-300 hover:scale-105"
                  >
                   <Store className="w-4 h-4 mr-2" /> Shop
                  </Button>
                </Link>
                <Link to="/grocery-run" className="block w-full">
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full h-10 md:h-12 bg-white/95 hover:bg-white border-2 border-white/50 shadow-lg text-[#2E8B57] hover:text-[#2E8B57] font-bold text-sm mx-auto backdrop-blur-sm transition-all duration-300 hover:scale-105"
                  >
                  ...<Truck className="w-4 h-4 mr-2" />
                    Grocery Run
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
            <motion.h2
              className="text-xl font-bold mb-4"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              Previously Ordered
            </motion.h2>
            <motion.div
              className="flex gap-4 overflow-x-auto scrollbar-hide pb-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              {previouslyOrderedProducts.slice(0, 12).map(product => (
                <div key={product.id} className="flex-none w-48">
                  <ProductCard product={product} />
                </div>
              ))}
            </motion.div>
          </div>
        </section>
      )}

      {/* Featured Products Section */}
      <section className="py-2 bg-white">
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

      {/* Integrate the AiChatBot component */}
      <AiChatBot />


      {showLoginDialog && (
        <LoginDialog open={showLoginDialog} onOpenChange={setShowLoginDialog} />
      )}
    </div>
  );
};

export default HomePage;
