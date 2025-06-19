import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { Search, Filter, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ProductCard from '@/components/products/ProductCard';
import { supabase } from '@/lib/supabaseClient';

const PRODUCTS_PER_PAGE = 25;

const ShopPage = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const featuredParam = queryParams.get('featured');
  const searchParam = queryParams.get('search');
  
  const [searchInput, setSearchInput] = useState(searchParam || ''); // Input state for UI
  const [searchTerm, setSearchTerm] = useState(searchParam || ''); // Actual search term for API
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('name-asc');
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput.length >= 2 || searchInput.length === 0) {
        setSearchTerm(searchInput);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    // Reset pagination when filters change
    setCurrentPage(0);
    setProducts([]);
    setHasMore(true);
    fetchProducts(true);
  }, [searchTerm, selectedCategory, sortBy, featuredParam]);

  const fetchCategories = async () => {
    try {
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (categoriesError) throw categoriesError;
      setCategories(categoriesData || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchProducts = async (reset = false) => {
    const pageToFetch = reset ? 0 : currentPage;
    
    if (reset) {
      setInitialLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
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
        query = query.or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      }

      if (selectedCategory !== 'all') {
        query = query.eq('category_id', parseInt(selectedCategory));
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

      const newProducts = productsData || [];
      
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
      <section className="relative min-h-[320px] bg-gradient-to-br from-[#2E8B57] via-[#3CB371] to-[#98FB98] overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src="/banner_bg.jpeg" 
            alt="Grocery Delivery" 
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[#2E8B57]/90 via-[#3CB371]/80 to-[#98FB98]/70" />
        </div>
        
        <div className="container relative h-full px-4 md:px-6">
          <div className="flex flex-col justify-center h-full py-6">
            <motion.div 
              className="space-y-4 max-w-4xl mx-auto w-full"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Title and Description */}
              <div className="text-center">
                <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
                  {featuredParam === 'true' ? 'Featured Products' : 'Shop'}
                </h1>
                <p className="text-white/90 text-base">
                  Browse from our selection of groceries, household essentials and more.
                </p>
                {searchParam && (
                  <p className="text-white/80 text-sm mt-2">
                    Showing results for: "{searchParam}"
                  </p>
                )}
              </div>

              {/* Search Bar */}
              <motion.div
                className="relative max-w-xl mx-auto"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input
                    type="search"
                    placeholder="Search for products..."
                    className="h-10 pl-10 pr-4 bg-white/95 backdrop-blur-sm border-0 shadow-lg text-gray-800 placeholder:text-gray-500"
                    value={searchInput}
                    onChange={(e) => handleSearchInputChange(e.target.value)}
                  />
                  {searchInput.length > 0 && searchInput.length < 2 && (
                    <p className="absolute -bottom-5 left-0 text-xs text-white/80">
                      Enter at least 2 characters to search
                    </p>
                  )}
                </div>
              </motion.div>

              {/* Filters Row */}
              <motion.div
                className="flex flex-col sm:flex-row gap-3 items-center justify-center max-w-3xl mx-auto"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.5 }}
              >
                {/* Category Filter */}
                <div className="w-full sm:w-auto min-w-[180px]">
                  <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                    <SelectTrigger className="bg-white/95 backdrop-blur-sm border-0 shadow-lg">
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
                <div className="w-full sm:w-auto min-w-[160px]">
                  <Select value={sortBy} onValueChange={handleSortChange}>
                    <SelectTrigger className="bg-white/95 backdrop-blur-sm border-0 shadow-lg">
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

                {/* Reset Filters Button */}
                {hasActiveFilters && (
                  <Button 
                    variant="outline" 
                    className="bg-white/95 backdrop-blur-sm border-0 shadow-lg hover:bg-white text-gray-800"
                    onClick={handleResetFilters}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Reset
                  </Button>
                )}
              </motion.div>

              {/* Active Filters Display */}
              {hasActiveFilters && (
                <motion.div
                  className="flex flex-wrap gap-2 justify-center"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6, duration: 0.5 }}
                >
                  {searchInput && (
                    <div className="bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 text-white text-sm">
                      Search: "{searchInput}"
                    </div>
                  )}
                  {selectedCategory !== 'all' && (
                    <div className="bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 text-white text-sm">
                      Category: {categories.find(c => c.id.toString() === selectedCategory)?.name}
                    </div>
                  )}
                  {sortBy !== 'name-asc' && (
                    <div className="bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 text-white text-sm">
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
    </div>
  );
};

export default ShopPage;