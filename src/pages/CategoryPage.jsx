
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ProductCard from '@/components/products/ProductCard';
import { getCategoryById, getProductsByCategory } from '@/lib/data/helpers'; // Updated import

const CategoryPage = () => {
  const { id } = useParams();
  const [category, setCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (id) {
      const categoryId = parseInt(id);
      const foundCategory = getCategoryById(categoryId);
      const categoryProducts = getProductsByCategory(categoryId);
      
      setCategory(foundCategory);
      setProducts(categoryProducts);
      setLoading(false);
    }
  }, [id]);
  
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
          <img  alt={category.name} class="w-full h-full object-cover" src="https://images.unsplash.com/photo-1675825547463-0788eca2320e" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
          <div className="absolute bottom-0 left-0 p-6">
            <h1 className="text-3xl font-bold text-white">{category.name}</h1>
            <p className="mt-2 text-white/90">{category.description}</p>
          </div>
        </div>
      </motion.div>
      
      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 p-8 text-center border rounded-lg">
          <h3 className="text-lg font-medium">No products found</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            There are currently no products in this category.
          </p>
          <Link to="/shop">
            <Button className="mt-4">Browse All Products</Button>
          </Link>
        </div>
      ) : (
        <div className="product-grid">
          {products.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
};

export default CategoryPage;
  