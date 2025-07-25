import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import CategoryCard from '@/components/products/CategoryCard';
import { supabase } from '@/lib/supabaseClient';
import { getQueryCache, setQueryCache } from '@/lib/queryCache';

const CategoriesPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        let cached = getQueryCache('categories_all');
        if (cached) {
          setCategories(cached);
        } else {
          const { data, error } = await supabase
            .from('categories')
            .select('*')
            .order('name');
          if (error) throw error;
          setCategories(data || []);
          setQueryCache('categories_all', data || []);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  if (loading) {
    return (
      <div className="container px-4 py-8 mx-auto md:px-6">
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Banner Section */}
      <section className="relative h-[30vh] min-h-[200px] bg-gradient-to-b from-[#2E8B57] via-[#3CB371] to-white overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src="https://bcbxcnxutotjzmdjeyde.supabase.co/storage/v1/object/public/groceroo_images/assets/outbanner.webp" 
            alt="Fresh groceries" 
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#2E8B57]/90 via-[#3CB371]/80 to-white/90" />
        </div>
        
        <div className="container relative h-full px-4 md:px-6">
          <div className="flex flex-col justify-center h-full max-w-2xl">
            <motion.div 
              className="space-y-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-3xl md:text-4xl font-bold text-white">Categories</h1>
              <p className="text-white/90">
                Browse our selection of grocery categories to find exactly what you need.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      <div className="container px-4 py-8 mx-auto md:px-6">
         <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {categories.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }} // Adjusted delay slightly for more items
            >
              <CategoryCard category={category} />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CategoriesPage;