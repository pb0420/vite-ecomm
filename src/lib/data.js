
// This file is deprecated and will be removed once Supabase is integrated.
// Data is now imported from individual files in src/lib/data/

import { categories } from './data/categories';
import { products } from './data/products';
import { sampleOrders } from './data/orders';
import { getProductById, getProductsByCategory, getCategoryById, getFeaturedProducts } from './data/helpers';

export {
  categories,
  products,
  sampleOrders,
  getProductById,
  getProductsByCategory,
  getCategoryById,
  getFeaturedProducts
};
  