
import React from 'react';
import { motion } from 'framer-motion';
import CategoryCard from '@/components/products/CategoryCard';
import { categories } from '@/lib/data/categories'; // Updated import

const CategoriesPage = () => {
  return (
    <div className="container px-4 py-8 mx-auto md:px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
        <p className="mt-2 text-muted-foreground">
          Browse our selection of grocery categories to find exactly what you need.
        </p>
      </motion.div>
      
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
  );
};

export default CategoriesPage;
  