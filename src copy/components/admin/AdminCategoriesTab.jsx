
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Filter, PlusCircle, Edit, Trash2, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import CategoryForm from '@/components/admin/CategoryForm';
import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/components/ui/use-toast';

const AdminCategoriesTab = ({ openDeleteDialog }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setCategories(data || []);

    } catch (error) {
      console.error('Error fetching categories:', error);
      toast({ variant: "destructive", title: "Fetch Error", description: "Could not load categories." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const filteredCategories = useMemo(() => {
    let result = [...categories];
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(category =>
        category.name.toLowerCase().includes(term) ||
        category.description?.toLowerCase().includes(term)
      );
    }
    return result; // Already sorted by fetch
  }, [categories, searchTerm]);

 const handleCategorySubmit = async (categoryData) => {
    setLoading(true);
    try {
      let result;
      if (editingCategory) {
        // Update
        const { data, error } = await supabase
          .from('categories')
          .update(categoryData)
          .eq('id', editingCategory.id)
          .select()
          .single();
        if (error) throw error;
        result = data;
        toast({ title: "Category Updated", description: `${result.name} has been updated.` });
      } else {
        // Add new
        const { data, error } = await supabase
          .from('categories')
          .insert(categoryData)
          .select()
          .single();
        if (error) throw error;
        result = data;
        toast({ title: "Category Added", description: `${result.name} has been added.` });
      }

      fetchCategories(); // Refetch
      setIsDialogOpen(false);
      setEditingCategory(null);

    } catch (error) {
      console.error('Error saving category:', error);
      toast({ variant: "destructive", title: "Save Error", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const triggerDelete = (categoryId) => {
    const categoryToDelete = categories.find(c => c.id === categoryId);
    if (categoryToDelete) {
      openDeleteDialog('category', categoryId, categoryToDelete.image_url); // Pass image_url
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-4">
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <h2 className="text-xl font-semibold">Categories Management</h2>
        <div className="flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-2">
          <div className="relative">
            <Filter className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input type="search" placeholder="Search categories..." className="pl-8 w-full md:w-[200px]" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(isOpen) => {
              setIsDialogOpen(isOpen);
              if (!isOpen) setEditingCategory(null);
            }}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingCategory(null)}>
                <PlusCircle className="w-4 h-4 mr-2" /> Add Category
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{editingCategory ? 'Edit Category' : 'Add New Category'}</DialogTitle>
              </DialogHeader>
              <CategoryForm
                 key={editingCategory ? editingCategory.id : 'new'}
                 category={editingCategory}
                 onSubmit={handleCategorySubmit}
                 onCancel={() => setIsDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
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
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCategories.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="h-24 text-center">No categories found.</TableCell></TableRow>
            ) : (
              filteredCategories.map(category => (
                <TableRow key={category.id}>
                  <TableCell>
                     <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center overflow-hidden">
                       {category.image_url ? (
                         <img src={category.image_url} alt={category.name} className="object-cover w-full h-full" />
                       ) : (
                         <ImageIcon className="w-6 h-6 text-muted-foreground" />
                       )}
                     </div>
                  </TableCell>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground truncate max-w-xs">{category.description}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => { setEditingCategory(category); setIsDialogOpen(true); }}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => triggerDelete(category.id)}>
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

export default AdminCategoriesTab;
  