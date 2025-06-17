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
        <div className="aspect-square mx-auto bg-muted">
          <img  
            alt={category.name}
            className="w-full h-full object-cover"
            src={category.icon_url || "https://images.unsplash.com/photo-1491696888587-6a2c0225c9fb"} 
          />
        </div>
        
        <div className="p-3 text-center">
          <h3 className="text-sm font-medium">{category.name}</h3>
          <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{category.description}</p>
          
          <div className="flex items-center justify-center mt-2 text-primary">
            <span className="text-xs font-medium">Shop now</span>
            <ArrowRight className="ml-1 h-3 w-3" />
          </div>
        </div>
      </motion.div>
    </Link>
  );
};

export default CategoryCard;