import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { Search, Filter } from 'lucide-react';
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
  
  const [searchInput, setSearchInput] = useState(''); // Input state for UI
  const [searchTerm, setSearchTerm] = useState(''); // Actual search term for API
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

  return (
    <div className="flex flex-col min-h-screen">
      {/* Banner Section */}
      <section className="relative h-[30vh] min-h-[200px] bg-[#F0E68C] overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src="/banner_bg.jpg" 
            alt="Fresh groceries" 
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#99C54F]/80 to-[#FFD580]/50" />
        </div>
        
        <div className="container relative h-full px-4 md:px-6">
          <div className="flex flex-col justify-center h-full max-w-2xl">
            <motion.div 
              className="space-y-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-3xl md:text-4xl font-bold text-white">
                {featuredParam === 'true' ? 'Featured Products' : 'All Products'}
              </h1>
              <p className="text-white/90">
                Browse our selection of fresh groceries and household essentials.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      <div className="container px-4 py-8 mx-auto md:px-6">
        <div className="grid gap-6 md:grid-cols-[250px_1fr]">
          {/* Filters Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="space-y-6"
          >
            <div className="p-4">
              <h3 className="mb-2 text-lg font-medium">Search</h3>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search products... (min 2 chars)"
                  className="pl-8"
                  value={searchInput}
                  onChange={(e) => handleSearchInputChange(e.target.value)}
                />
              </div>
              {searchInput.length > 0 && searchInput.length < 2 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Enter at least 2 characters to search
                </p>
              )}
            </div>
            
            <div>
              <h3 className="mb-2 text-lg font-medium">Categories</h3>
              <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
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
            
            <div>
              <h3 className="mb-2 text-lg font-medium">Sort By</h3>
              <Select value={sortBy} onValueChange={handleSortChange}>
                <SelectTrigger>
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
            
            <Button 
              variant="outline" 
              className="w-full"
              onClick={handleResetFilters}
            >
              <Filter className="w-4 h-4 mr-2" />
              Reset Filters
            </Button>
          </motion.div>
          
          {/* Products Grid */}
          <div>
            {initialLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 p-8 text-center border rounded-lg">
                <h3 className="text-lg font-medium">No products found</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Try adjusting your search or filter criteria.
                </p>
              </div>
            ) : (
              <>
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
      </div>
    </div>
  );
};

export default ShopPage;