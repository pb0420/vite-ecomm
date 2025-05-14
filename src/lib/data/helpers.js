
import { products } from './products';
import { categories } from './categories';

// Helper function to get a product by ID
export const getProductById = (id) => {
  return products.find(product => product.id === id);
};

// Helper function to get products by category
export const getProductsByCategory = (categoryId) => {
  return products.filter(product => product.category === categoryId);
};

// Helper function to get a category by ID
export const getCategoryById = (id) => {
  return categories.find(category => category.id === id);
};

// Helper function to get featured products
export const getFeaturedProducts = () => {
  return products.filter(product => product.featured);
};
  