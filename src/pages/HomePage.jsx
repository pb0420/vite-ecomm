// File: groceroo/src/pages/HomePage.jsx
import React, { useState, useEffect } from 'react';
import { getDeliveryTime } from '@/lib/deliveryTime';
import { color, motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Clock, ShieldCheck, MessageCircle, Handshake, ShoppingCart, CupSoda, EggFried, Cookie, Hamburger, Croissant, Apple, Banana, Beef, Candy, Fish, Utensils, Car, MapPin, Truck, Store, Search, Locate } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ProductCard from '@/components/products/ProductCard';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { setQueryCache, getQueryCache } from '@/lib/queryCache';
import LoginDialog from '@/components/auth/LoginDialog';
import { getDistance } from '@/lib/utils';

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
        ? 'Install the web-app on your iOS device: tap Share, then "Add to Home Screen".'
        : 'Install the web-app: tap the menu and "Add to Home screen".'}
    </span>
  </div>
);

const ADELAIDE_COORDS = { lat: -34.9285, lng: 138.6007 };

const HomePage = () => {
  const { user, userLocation, getUserLocation } = useAuth();
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [previouslyOrderedProducts, setPreviouslyOrderedProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deliveryTime, setDeliveryTime] = useState(45); // Default fallback
  const [showA2HS, setShowA2HS] = useState(false);
  const [platform, setPlatform] = useState(null);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        let productsData = getQueryCache('featuredProducts');
        let categoriesData = getQueryCache('categories_home');
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
        setFeaturedProducts(productsData);
        setCategories(categoriesData);
        // Fetch delivery time from utility
        const dt = await getDeliveryTime();
        if (dt) setDeliveryTime(dt);
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
              .limit(20);
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

  // Debounced search navigation
  useEffect(() => {
    if (!searchQuery) return;
    if (searchQuery.length < 2) return; // Minimum 2 characters to search
    setSearchLoading(true);
    const timer = setTimeout(() => {
    setSearchLoading(false);
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
    }, 950);
    return () => clearTimeout(timer);
  }, [searchQuery, user, navigate]);


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

  const isTooFar = userLocation && getDistance(userLocation.lat, userLocation.lng, ADELAIDE_COORDS.lat, ADELAIDE_COORDS.lng) > 50;

  return (
    <div className="flex flex-col min-h-screen">
      {showA2HS && <AddToHomeScreenToast onClose={handleCloseA2HS} platform={platform} />}
      <section className="relative min-h-[90px] h-[12vh] max-h-[120px] bg-gradient-to-b from-[#2E8B57] via-[#3CB371] to-white overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://bcbxcnxutotjzmdjeyde.supabase.co/storage/v1/object/public/groceroo_images/assets/outbanner.webp"
            alt="Grocery delivery"
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#2E8B57]/90 via-[#3CB371]/80 to-white/90" />
        </div>
        <div className="container relative h-full px-4 md:px-6">
          <div className="flex flex-col justify-center h-full max-w-4xl mx-auto pb-1 md:pt-2 md:pb-1">
            {isTooFar && (
              <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-black/40 text-white text-xs px-3 py-1 rounded shadow z-10">
                You seem to be too far away.
              </div>
            )}
            <motion.div
              className="space-y-2 md:space-y-3"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              {/* Search Bar */}
              <motion.form
                onSubmit={e => e.preventDefault()}
                className="flex gap-1 w-full mt-3"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.3 }}
              >
                <div className="flex w-full items-start relative">
                  {/* Left: Search bar */}
                  <div className="flex-1 relative pb-2">
                    <Input
                      type="text"
                      placeholder="Search for groceries and more..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="h-11 md:h-11 pl-3 bg-white/95 backdrop-blur-sm shadow-lg border-0 text-gray-800 placeholder:text-gray-500 text-sm"
                    />
                    {searchLoading && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2">
                        <svg className="animate-spin h-5 w-5 text-gray-400" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
                        </svg>
                      </span>
                    )}
                  </div>
                  {/* Right: Location and delivery time pill */}
                  <div className="flex flex-col items-end ml-2 min-w-[90px]">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/80 shadow border border-gray-200 text-xs text-gray-700 font-semibold mb-1 tracking-wide">
                      <MapPin className="w-3 h-3 text-[#fd7507] mr-1" />Adelaide
                    </span>
                    {userLocation ? (
                      <span className="inline-flex items-center gap-1 bg-gradient-to-r from-[#fff7e6] to-white text-[#fd7507] text-xs px-3 py-1 rounded-full shadow border border-[#fd7507] font-semibold tracking-wide">
                        <Clock className="w-3 h-3 text-[#fd7507] font-semibold text-base" />
                        <span className="ml-1">{deliveryTime} min</span>
                      </span>
                    ) : (
                      <Button
                        size="sm"
                        className="bg-[#fd7507] text-white px-3 py-1 rounded-full shadow"
                        onClick={getUserLocation}
                      >
                        <Locate />
                        <span className="ml-1 text-xs">Get Location</span>
                      </Button>
                    )}
                  </div>
                </div>
              </motion.form>
              {/* Location and Delivery Time Row - moved below search, left aligned */}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Categories and Buttons Section */}
      <section className="py-2 bg-white">
        <div className="container px-4 md:px-6">
          {/* Categories Scroller */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.3 }}
            className="relative mb-4"
          >
            <div className="flex overflow-x-auto pb-1 space-x-2 md:space-x-3 scrollbar-hide px-1 md:px-0 md:justify-center">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  to={`/category/${category.id}`}
                  className="flex-none group text-center"
                >
                  <div className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-1 bg-white flex items-center justify-center group-hover:bg-gray-100 transition-all duration-300 shadow-none border-none rounded-none">
                    <img
                      src={category.icon_url}
                      alt={category.name}
                      className="w-12 h-12 md:w-16 md:h-16 object-cover rounded-none"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  </div>
                  <span className="text-xs font-medium text-gray-800 group-hover:text-primary transition-colors block truncate max-w-[75px] md:max-w-[90px]">
                    {category.name}
                  </span>
                </Link>
              ))}
              <Link to="/categories" className="flex-none group text-center">
                <div className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-1 bg-white flex items-center justify-center group-hover:bg-gray-100 transition-all duration-300 shadow-none border-none rounded-none">
                  <div className="flex flex-col items-center">
                    <ArrowRight className="h-8 w-8 md:h-10 md:w-10 text-primary" />
                  </div>
                </div>
                <span className="text-xs font-medium text-gray-800 group-hover:text-primary transition-colors block truncate max-w-[75px] md:max-w-[90px]">View All</span>
              </Link>
            </div>
          </motion.div>

          {/* Shop & Grocery Run Buttons */}
          <motion.div
            className="flex justify-center gap-2 md:max-w-[500px] lg:max-w-[500px] mx-auto"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            <Link to="/shop" className="block w-[60%] max-w-[120px]">
              <Button
                size="sm"
                className="w-full h-10 font-bold text-base mx-auto rounded-half border-2 border-[#fd7507] bg-white text-[#fd7507] shadow-lg hover:bg-[#fd7507] hover:text-white transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2"
              >
                <Store className="w-4 h-5 mr-2" /> Shop
              </Button>
            </Link>
            <Link to="/grocery-run" className="block w-full">
              <Button
                size="sm"
                className="w-full h-10 font-bold text-base mx-auto rounded-full border-2 border-[#3bc371] bg-white text-[#3bc371] shadow-lg hover:bg-[#3bc371] hover:text-white transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2"
              >
                <Truck className="w-5 h-5 mr-2" /> Grocery Run
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Previously Ordered Products Section - Only show if user is logged in */}
      {user && previouslyOrderedProducts.length > 0 && (
        <section className="py-6 bg-gray-50">
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
            <Link to="/shop?featured=true" className="flex-none group text-center">
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

      {showLoginDialog && (
        <LoginDialog open={showLoginDialog} onOpenChange={setShowLoginDialog} />
      )}
    </div>
  );
};

export default HomePage;
