import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const CategoryCard = ({ category }) => {
  return (
    <Link to={`/category/${category.id}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        whileHover={{ scale: 1.03 }}
        className="category-card overflow-hidden rounded-lg border bg-card"
      >
        <div className="aspect-square bg-muted">
          <img  
            alt={category.name}
            className="w-full h-full object-cover"
            src={category.image_url || "https://images.unsplash.com/photo-1491696888587-6a2c0225c9fb"} 
          />
        </div>
        
        <div className="p-4">
          <h3 className="text-lg font-medium">{category.name}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{category.description}</p>
          
          <div className="flex items-center mt-4 text-primary">
            <span className="text-sm font-medium">Shop now</span>
            <ArrowRight className="ml-1 h-4 w-4" />
          </div>
        </div>
      </motion.div>
    </Link>
  );
};

export default CategoryCard;