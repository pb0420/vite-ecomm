import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Filter, PlusCircle, Edit, Trash2, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import ProductForm from '@/components/admin/ProductForm';
import { supabase } from '@/lib/supabaseClient';
import { formatCurrency } from '@/lib/utils';
import { toast } from '@/components/ui/use-toast';

const AdminProductsTab = ({ openDeleteDialog }) => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isUploading, setisUploading] = useState(false);

  const fetchProductsAndCategories = useCallback(async () => {
    setLoading(true);
    try {
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*, categories(id, name)') // Join with categories
        .order('name', { ascending: true });

      if (productsError) throw productsError;
      setProducts(productsData || []);

      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true });

      if (categoriesError) throw categoriesError;
      setCategories(categoriesData || []);

    } catch (error) {
      console.error('Error fetching products or categories:', error);
      toast({ variant: "destructive", title: "Fetch Error", description: "Could not load products or categories." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProductsAndCategories();
  }, [fetchProductsAndCategories]);

  const filteredProducts = useMemo(() => {
    let result = [...products];
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(product =>
        product.name.toLowerCase().includes(term) ||
        product.description?.toLowerCase().includes(term) ||
        product.categories?.name.toLowerCase().includes(term) // Search category name
      );
    }
    return result; // Already sorted by fetch
  }, [products, searchTerm]);

  const handleProductSubmit = async (productData) => {
     setLoading(true); // Indicate loading during DB operation
     try {
       let result;
       if (editingProduct) {
         // Update
         const { data, error } = await supabase
           .from('products')
           .update({
             ...productData,
             category_id: productData.category_id, // Ensure category_id is passed
             categories_ids: productData.categories_ids || [], // Pass categories_ids array
             updated_at: new Date(), // Ensure updated_at is set
           })
           .eq('id', editingProduct.id)
           .select('*, categories(id, name)')
           .single();
         if (error) throw error;
         result = data;
         toast({ title: "Product Updated", description: `${result.name} has been updated.` });
       } else {
         // Add new
         const { data, error } = await supabase
           .from('products')
           .insert({
            ...productData,
            category_id: productData.category_id,
            categories_ids: productData.categories_ids || [], // Pass categories_ids array
           })
           .select('*, categories(id, name)')
           .single();
         if (error) throw error;
         result = data;
         toast({ title: "Product Added", description: `${result.name} has been added.` });
       }

       // Optimistically update UI or refetch
       fetchProductsAndCategories(); // Refetch to ensure data consistency
       setIsDialogOpen(false);
       setEditingProduct(null);

     } catch (error) {
       console.error('Error saving product:', error);
       toast({ variant: "destructive", title: "Save Error", description: error.message });
     } finally {
        setLoading(false); // Stop loading indicator
     }
   };

  const triggerDelete = (productId) => {
    const productToDelete = products.find(p => p.id === productId);
    if (productToDelete) {
      openDeleteDialog('product', productId, productToDelete.image_url); // Pass image_url
    }
  };

  const fileInputRef = useRef(null);
  const triggerFileUpload = async (event) => {
    setisUploading(true)
    fileInputRef.current.click();
  };

  const handleFileUpload = async (event) => {
  const file = event.target.files[0];
  if (!file) {
    return;
  }

  // Basic file type check (optional but recommended)
  if (file.type !== 'text/csv') {
    console.error('Please upload a CSV file.');
    // TODO: Show error message to user
    return;
  }

  const reader = new FileReader();

  reader.onload = async (e) => { // Made onload async to use await with Supabase
    const text = e.target.result;
    // Assuming CSV format: name,price,description,stock
    // You might want to use a dedicated CSV parsing library for more complex cases
    const lines = text.split('\n').filter(line => line.trim() !== '');

    if (lines.length === 0) {
        console.warn('CSV file is empty.');
        // TODO: Show warning to user
        return;
    }

    // Simple parsing: skip header, split by comma
    const products = lines.slice(1).map(line => {
      const [name, price, description, stock] = line.split(',');
      return {
        name: name ? name.trim() : '',
        price: price ? parseFloat(price.trim()) : 0, // Convert price to number
        description: description ? description.trim() : '',
        stock: stock ? parseInt(stock.trim(), 10) : 0, // Convert stock to integer
      };
    }).filter(product => product.name); // Filter out lines that don't have a name

    console.log('Parsed Products:', products);

    if (products.length === 0) {
        console.warn('No valid product data found in CSV.');
        // TODO: Show warning to user
        return;
    }

    // Insert data into Supabase
    // Assuming 'supabase' client is initialized and available in scope
    // Replace 'products' with your actual Supabase table name if different
    try {
      const { data, error } = await supabase
        .from('products') // <-- Replace 'products' with your table name
        .insert(products);

      if (error) {
        console.error('Error inserting data into Supabase:', error);
        // TODO: Show error message to user
      } else {
        console.log('Bulk upload successful to Supabase:', data);
        // TODO: Show success message to user (e.g., "Successfully uploaded X products")
        // TODO: Potentially refresh the product list displayed in the admin panel
      }
    } catch (error) {
      console.error('Unexpected error during Supabase insert:', error);
      // TODO: Show unexpected error message to user
    }
  };

  reader.onerror = (e) => {
    console.error('Error reading file:', e);
    // TODO: Show file reading error to user
  };

  // Read the file as text
  reader.readAsText(file);
};

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-4">
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <h2 className="text-xl font-semibold">Products Management</h2>
        <div className="flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-2">
          <div className="relative">
            <Filter className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input type="search" placeholder="Search products..." className="pl-8 w-full md:w-[200px]" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(isOpen) => {
              setIsDialogOpen(isOpen);
              if (!isOpen) setEditingProduct(null); // Reset editing state on close
            }}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingProduct(null)}>
                <PlusCircle className="w-4 h-4 mr-2" /> Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
              </DialogHeader>
              {editingProduct && editingProduct.image_url && (
                <div className="mb-4 flex items-center gap-2">
                  <img src={editingProduct.image_url} alt="Product" className="w-16 h-16 object-cover rounded border" />
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 border-red-300 hover:bg-red-50"
                    onClick={() => setEditingProduct({ ...editingProduct, image_url: '' })}
                  >Remove Image</Button>
                </div>
              )}
              <ProductForm
                key={editingProduct ? editingProduct.id : 'new'} // Add key to force re-render
                product={editingProduct}
                categories={categories} // Pass fetched categories
                onSubmit={handleProductSubmit}
                onCancel={() => setIsDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
           {/* Add the Upload CSV button */}
           <Button onClick={triggerFileUpload} disabled={isUploading}>
            {isUploading ? 'Uploading...' : 'Upload CSV'}
          </Button>
          {/* Hidden file input */}
          <input
            type="file"
            ref={fileInputRef}
            accept=".csv"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
          {/* Existing Add Product button */}
        </div>
      </div>
      {loading ? (
        <div className="flex items-center justify-center h-64">
           <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
         </div>
      ) : (
      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Image</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Featured</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="h-24 text-center">No products found.</TableCell></TableRow>
            ) : (
              filteredProducts.map(product => (
                  <TableRow key={product.id}>
                    <TableCell>
                     <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center overflow-hidden">
                       {product.image_url ? (
                         <img src={product.image_url} alt={product.name} className="object-cover w-full h-full" />
                       ) : (
                         <ImageIcon className="w-6 h-6 text-muted-foreground" />
                       )}
                     </div>
                    </TableCell>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{product.categories?.name || 'N/A'}</TableCell>
                    <TableCell>{formatCurrency(product.price)}</TableCell>
                    <TableCell>
                      <Badge variant={product.in_stock ? "default" : "destructive"} className={`whitespace-nowrap ${product.in_stock ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {product.in_stock ? 'In Stock' : 'Out'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Checkbox checked={product.featured} disabled className="cursor-default" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => { setEditingProduct(product); setIsDialogOpen(true); }}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => triggerDelete(product.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
     )}
    </motion.div>
  );
};

export default AdminProductsTab;
