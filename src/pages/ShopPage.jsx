import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, Filter, X, ArrowUpDown, Tag  } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ProductCard from '@/components/products/ProductCard';
import { supabase } from '@/lib/supabaseClient';
import { setQueryCache, getQueryCache } from '@/lib/queryCache';
import LoginDialog from '@/components/auth/LoginDialog';
import { useAuth } from '@/contexts/AuthContext';
import AiChatBot from '@/components/chat/AiChatBot'; 

const PRODUCTS_PER_PAGE = 25;

const ShopPage = () => {
  const { user } = useAuth();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const featuredParam = queryParams.get('featured');
  const searchParam = queryParams.get('search');
  const catFilterParam = queryParams.get('cat_filter');
  const sortParam = queryParams.get('sort');
  const navigate = useNavigate();
  
  const [searchInput, setSearchInput] = useState(searchParam || ''); // Input state for UI
  const [searchTerm, setSearchTerm] = useState(searchParam || ''); // Actual search term for API
  const [selectedCategory, setSelectedCategory] = useState(catFilterParam || 'all');
  const [sortBy, setSortBy] = useState(sortParam || 'name-asc');
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [showLoginDialog, setShowLoginDialog] = useState(false);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput.length >= 2 || searchInput.length === 0) {
        // Search limit for logged out users
        if (!user) {
          const count = parseInt(localStorage.getItem('search_count') || '0', 10);
          if (count >= 10) {
            setShowLoginDialog(true);
            return;
          }
          localStorage.setItem('search_count', (count + 1).toString());
        }
        setSearchTerm(searchInput);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [user,searchInput]);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    // Reset pagination when filters change
    setCurrentPage(0);
    setProducts([]);
    setHasMore(true);
    fetchProducts(true);

    navigate({
    pathname: location.pathname,
    search: `search=${searchTerm}&cat_filter=${selectedCategory}&sort=${sortBy}`,
  }, { replace: true });

  }, [searchTerm, selectedCategory, sortBy, featuredParam]);

  const fetchCategories = async () => {
    try {
      let categoriesData = getQueryCache('categories_all');
      if (!categoriesData) {
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .order('name');
        if (error) throw error;
        categoriesData = data || [];
        setQueryCache('categories_all', categoriesData);
      }
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchProducts = async (reset = false) => {
    const pageToFetch = reset ? 0 : currentPage;
    const cacheKey = `products_${featuredParam || 'all'}_${selectedCategory}_${sortBy}_${pageToFetch}_${searchTerm || 'all'}`;
    if (reset) {
      setInitialLoading(true);
    } else {
      setLoadingMore(true);
    }
    try {
      let cachedProducts = getQueryCache(cacheKey);
      let newProducts = [];
      if (cachedProducts) {
        newProducts = cachedProducts;
      } else {
        let query = supabase
          .from('products')
          .select(`
            *,
            categories (
              id,
              name
            )
          `);
        // Apply filters
        if (featuredParam === 'true') {
          query = query.eq('featured', true);
        }
        if (searchTerm && searchTerm.length >= 2) {
          //query = query.or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
          const searchText = searchTerm.replace(/\s+/g, '+');
          query = query.textSearch('fts', `${searchText}:*`);
        }
        if (selectedCategory !== 'all') {
          const categoryId = parseInt(selectedCategory);
          query = query.or(`category_id.eq.${categoryId},categories_ids.cs.[${categoryId}]`);
        }
        // Apply sorting
        switch (sortBy) {
          case 'name-asc':
            query = query.order('name', { ascending: true });
            break;
          case 'name-desc':
            query = query.order('name', { ascending: false });
            break;
          case 'price-asc':
            query = query.order('price', { ascending: true });
            break;
          case 'price-desc':
            query = query.order('price', { ascending: false });
            break;
          default:
            query = query.order('name', { ascending: true });
            break;
        }
        // Apply pagination
        const from = pageToFetch * PRODUCTS_PER_PAGE;
        const to = from + PRODUCTS_PER_PAGE - 1;
        query = query.range(from, to);
        const { data: productsData, error: productsError } = await query;
        if (productsError) throw productsError;
        newProducts = productsData || [];
        setQueryCache(cacheKey, newProducts);
      }
      if (reset) {
        setProducts(newProducts);
        setCurrentPage(1);
      } else {
        setProducts(prev => [...prev, ...newProducts]);
        setCurrentPage(prev => prev + 1);
      }
      // Check if there are more products
      setHasMore(newProducts.length === PRODUCTS_PER_PAGE);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setInitialLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      fetchProducts(false);
    }
  };

  const handleSearchInputChange = (value) => {
    setSearchInput(value);
  };

  const handleCategoryChange = (value) => {
    setSelectedCategory(value);
  };

  const handleSortChange = (value) => {
    setSortBy(value);
  };

  const handleResetFilters = () => {
    setSearchInput('');
    setSearchTerm('');
    setSelectedCategory('all');
    setSortBy('name-asc');
  };

  const hasActiveFilters = searchInput || selectedCategory !== 'all' || sortBy !== 'name-asc';

  return (
    <div className="flex flex-col min-h-screen">
      {/* Enhanced Hero Section with Filters - Made smaller */}
      <section className="relative min-h-[280px] bg-gradient-to-br from-[#2E8B57] via-[#3CB371] to-[#98FB98] overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src="https://bcbxcnxutotjzmdjeyde.supabase.co/storage/v1/object/public/groceroo_images/assets/outbanner.webp" 
            alt="Grocery Delivery" 
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[#2E8B57]/90 via-[#3CB371]/80 to-[#98FB98]/70" />
        </div>
        
        <div className="container relative h-full px-4 md:px-6">
          <div className="flex flex-col justify-center h-full py-5">
            <motion.div 
              className="space-y-3 max-w-4xl mx-auto w-full"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Title and Description */}
              <div className="text-center">
                <h1 className="text-xl md:text-2xl font-bold text-white mb-1">
                  {featuredParam === 'true' ? 'Featured Products' : 'Shop'}
                </h1>
                <p className="text-white/90 text-sm">
                  Browse from a selection of groceries, household essentials and more.
                </p>
                {/* {searchParam && (
                  <p className="text-white/80 text-xs mt-1">
                    Showing results for: "{searchParam}"
                  </p>
                )} */}
              </div>

              {/* Search Bar */}
              <motion.div
                className="relative max-w-xl mx-auto"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                <div className="relative">
                  <Search style={{zIndex:'1'}} className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input
                    type="search"
                    placeholder="Search for products..."
                    className="h-11 pl-10 pr-4 bg-white/95 backdrop-blur-sm border-0 shadow-lg text-gray-800 placeholder:text-gray-500"
                    value={searchInput}
                    onChange={(e) => handleSearchInputChange(e.target.value)}
                  />
                  {searchInput.length > 0 && searchInput.length < 2 && (
                    <p className="p-1 -bottom-4 left-0 text-xs text-white/80">
                      Enter at least 2 characters to search
                    </p>
                  )}
                </div>
              </motion.div>

              {/* Filters Row */}
              <motion.div
                className="flex flex-col sm:flex-row gap-2 items-center justify-center max-w-3xl mx-auto"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.5 }}
              >
                {/* Category Filter and Sort Filter in same line, less wide */}
                <div className="flex gap-2 w-full sm:w-auto justify-center">
                  {/* Category Filter */}
                  <div className="min-w-[120px] w-[200px] flex items-center">
                    <Filter className="w-5 h-5 text-white mr-2" />
                    <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                      <SelectTrigger className="bg-white/95 backdrop-blur-sm border-0 shadow-lg h-8 text-sm">
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories.map(category => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Sort Filter */}
                  <div className="min-w-[140px] w-[160px] flex items-center">
                    <ArrowUpDown className="w-5 h-5 text-white mr-2" />
                    <Select value={sortBy} onValueChange={handleSortChange}>
                      <SelectTrigger className="bg-white/95 backdrop-blur-sm border-0 shadow-lg h-8 text-sm">
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                        <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                        <SelectItem value="price-asc">Price (Low to High)</SelectItem>
                        <SelectItem value="price-desc">Price (High to Low)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {/* Reset Filters Button */}
                {hasActiveFilters && (
                  <Button 
                    variant="outline" 
                    size="lg"
                    className="bg-[#ff9800]/95 backdrop-blur-sm border-0 shadow-lg hover:bg-white text-gray-800 h-8 text-xs"
                    onClick={handleResetFilters}
                  >
                    <X className="w-3 h-3 mr-1" />
                    Reset
                  </Button>
                )}
              </motion.div>

              {/* Active Filters Display */}
              {hasActiveFilters && (
                <motion.div
                  className="flex flex-wrap gap-1 justify-center"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6, duration: 0.5 }}
                >
                  {searchInput && (
                    <div className="bg-white/20 backdrop-blur-sm rounded-full px-2 py-0.5 text-white text-xs">
                      Search: "{searchInput}"
                    </div>
                  )}
                  {selectedCategory !== 'all' && (
                    <div className="bg-white/20 backdrop-blur-sm rounded-full px-2 py-0.5 text-white text-xs">
                      Category: {categories.find(c => c.id.toString() === selectedCategory)?.name}
                    </div>
                  )}
                  {sortBy !== 'name-asc' && (
                    <div className="bg-white/20 backdrop-blur-sm rounded-full px-2 py-0.5 text-white text-xs">
                      Sort: {sortBy.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <div className="container px-4 py-8 mx-auto md:px-6">
        {initialLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 p-8 text-center border rounded-lg">
            <h3 className="text-lg font-medium">No products found</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Try adjusting your search or filter criteria.
            </p>
            {hasActiveFilters && (
              <Button 
                onClick={handleResetFilters}
                className="mt-4"
                variant="outline"
              >
                Clear all filters
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* Results Count */}
            <div className="mb-6">
              <p className="text-sm text-muted-foreground">
                Showing {products.length} product{products.length !== 1 ? 's' : ''}
                {hasActiveFilters && ' matching your criteria'}
              </p>
            </div>

            {/* Products Grid */}
            <div className="product-grid">
              {products.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            
            {/* Load More Button */}
            {hasMore && (
              <div className="flex justify-center mt-8">
                <Button 
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  variant="outline"
                  size="lg"
                >
                  {loadingMore ? (
                    <>
                      <div className="mr-2 h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                      Loading...
                    </>
                  ) : (
                    'Load More Products'
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
      
       <AiChatBot />

      {showLoginDialog && (
        <LoginDialog open={showLoginDialog} onOpenChange={setShowLoginDialog} />
      )}
    </div>
  );
};

export default ShopPage;