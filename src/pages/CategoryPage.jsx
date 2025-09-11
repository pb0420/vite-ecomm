// File: groceroo/src/pages/CategoryPage.jsx
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ProductCard from '@/components/products/ProductCard';
import { supabase } from '@/lib/supabaseClient';
import { setQueryCache, getQueryCache } from '@/lib/queryCache';

const CategoryPage = () => {
  const { id } = useParams();
  const [category, setCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(''); // State for local search query
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCategoryAndProducts = async () => {
      if (!id) return;
      setLoading(true);
      try {
        // Try cache first
        let categoryData = getQueryCache(`category_${id}`);
        let productsData = getQueryCache(`category_products_${id}`);
        if (!categoryData) {
          const { data, error } = await supabase
            .from('categories')
            .select('*')
            .eq('id', id)
            .single();
          if (error) throw error;
          categoryData = data;
          setQueryCache(`category_${id}`, data);
        }
        setCategory(categoryData);
        if (!productsData) {
          const { data, error } = await supabase
            .from('products')
            .select(`*, categories ( id, name )`)
            .or(`category_id.eq.${id},categories_ids.cs.[${id}]`)
            .order('name');
          if (error) throw error;
          productsData = data || [];
          setQueryCache(`category_products_${id}`, productsData);
        }
        setProducts(productsData);
      } catch (error) {
        console.error('Error fetching category or products:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCategoryAndProducts();
  }, [id]);

  // Filter products based on search query
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="container px-4 py-8 mx-auto md:px-6">
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="container px-4 py-8 mx-auto md:px-6">
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <h2 className="text-2xl font-bold">Category Not Found</h2>
          <p className="mt-2 text-muted-foreground">
            The category you're looking for doesn't exist.
          </p>
          <Link to="/categories">
            <Button className="mt-4">Browse All Categories</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container px-4 py-8 mx-auto md:px-6">
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back
        </Button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-8"
      >
        <div
          className="relative h-32 overflow-hidden rounded-lg bg-muted mb-4" // reduced height from h-48 to h-32
          style={category?.icon_url ? {
            backgroundImage: `url(${category.icon_url})`,
            backgroundRepeat: 'repeat',
            backgroundSize: '60px',
            backgroundPosition: 'center',
          } : {}}
        >
          {/* Tint overlay */}
          <div className="absolute inset-0 bg-[#3CB371] opacity-80"></div> {/* reduced opacity for lighter tint */}
          {/* Gradient overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div> {/* lighter gradient */}
          <div className="absolute bottom-0 left-0 p-4"> {/* reduced padding for smaller height */}
            <h1 className="text-2xl font-bold text-white">{category.name}</h1> {/* smaller text */}
            <p className="mt-2 text-white/90 text-base">{category.description}</p> {/* smaller text */}
          </div>
        </div>
      </motion.div>

      {/* Local Search Input */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          type="text"
          placeholder={`Search products in ${category.name}...`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-md border shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
        />
      </div>


      {filteredProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 p-8 text-center border rounded-lg">
          <h3 className="text-lg font-medium">
            {searchQuery ? `No products found matching "${searchQuery}"` : "No products found"}
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
             {searchQuery ? "Try a different search term." : "There are currently no products in this category."}
          </p>
           {!searchQuery && ( // Only show browse all products button if no search query
             <Link to="/shop">
               <Button className="mt-4">Browse All Products</Button>
             </Link>
           )}
        </div>
      ) : (
        <div className="product-grid grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"> {/* Added a basic grid class, adjust as needed */}
          {filteredProducts.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
};

export default CategoryPage;
