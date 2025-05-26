import React from 'react';
import { motion } from 'framer-motion';
import CategoryCard from '@/components/products/CategoryCard';
import { categories } from '@/lib/data/categories';

const CategoriesPage = () => {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Banner Section */}
      <section className="relative h-[30vh] min-h-[200px] bg-[#F0E68C] overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src="https://images.pexels.com/photos/264636/pexels-photo-264636.jpeg" 
            alt="Fresh groceries" 
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#2E8B57]/80 to-[#F0E68C]/50" />
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
        <div className="grid gap-6 mt-8 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
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