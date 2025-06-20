// File: groceroo/src/pages/CategoryPage.jsx
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Search } from 'lucide-react'; // Import Search icon
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input'; // Import Input component
import ProductCard from '@/components/products/ProductCard';
import { supabase } from '@/lib/supabaseClient';

const CategoryPage = () => {
  const { id } = useParams();
  const [category, setCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(''); // State for local search query

  useEffect(() => {
    const fetchCategoryAndProducts = async () => {
      if (!id) return;

      try {
        // Fetch category details
        const { data: categoryData, error: categoryError } = await supabase
          .from('categories')
          .select('*')
          .eq('id', id)
          .single();

        if (categoryError) throw categoryError;
        setCategory(categoryData);

        // Fetch products for this category
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select(`
            *,
            categories (
              id,
              name
            )
          `)
          .or(`category_id.eq.${id},categories_ids.cs.[${id}]`)
          .order('name');

        if (productsError) throw productsError;
        setProducts(productsData || []);

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
        <Link to="/categories" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Categories
        </Link>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-8"
      >
        <div className="relative h-48 overflow-hidden rounded-lg bg-muted mb-4">
          <img
            alt={category.name}
            className="w-full h-full object-cover"
            src={category.image_url || "https://images.unsplash.com/photo-1675825547463-0788eca2320e"}
          />
          {/* Added greenish tint overlay */}
          <div className="absolute inset-0 bg-[#3CB371] opacity-90"></div>
          {/* Existing gradient overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
          <div className="absolute bottom-0 left-0 p-6">
            <h1 className="text-3xl font-bold text-white">{category.name}</h1>
            <p className="mt-2 text-white/90">{category.description}</p>
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
