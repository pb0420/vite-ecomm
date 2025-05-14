
import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Package, List, Tag, Settings as SettingsIcon } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AdminSummaryCards from '@/components/admin/AdminSummaryCards';
import AdminOrdersTab from '@/components/admin/AdminOrdersTab';
import AdminProductsTab from '@/components/admin/AdminProductsTab';
import AdminCategoriesTab from '@/components/admin/AdminCategoriesTab';
import AdminSettingsTab from '@/components/admin/AdminSettingsTab';
import DeleteConfirmationDialog from '@/components/admin/DeleteConfirmationDialog';
import { useAuth } from '@/contexts/AuthContext';
import { useOrders } from '@/contexts/OrderContext';
import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/components/ui/use-toast';
import useSupabaseStorage from '@/hooks/useSupabaseStorage';

const useAdminRedirect = () => {
  const { isAdmin, loading: authLoading, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading) {
      if (!user) { // If no user is logged in at all
        toast({ variant: "destructive", title: "Authentication Required", description: "Please log in to access this page." });
        navigate('/admin-login');
      } else if (!isAdmin) { // If user is logged in but not an admin
        toast({ variant: "destructive", title: "Access Denied", description: "You must be an admin to view this page." });
        navigate('/admin-login'); // Or '/' if you want to send them to homepage
      }
    }
  }, [isAdmin, authLoading, user, navigate]);

  return { authLoading, isAdmin };
};

const useAdminDataDeletion = (activeTabSetter) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { deleteFile } = useSupabaseStorage();

  const openDeleteDialog = useCallback((type, id, imageUrl = null) => {
    setItemToDelete({ type, id, imageUrl });
    setIsDeleteDialogOpen(true);
  }, []);

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);

    try {
      let tableName = '';
      let itemName = itemToDelete.type;

      if (itemToDelete.type === 'product') tableName = 'products';
      else if (itemToDelete.type === 'category') {
        tableName = 'categories';
        const { data: productsInCategory, error: checkError } = await supabase
          .from('products').select('id').eq('category_id', itemToDelete.id).limit(1);
        if (checkError) throw checkError;
        if (productsInCategory && productsInCategory.length > 0) {
          throw new Error("Cannot delete category as it is assigned to products.");
        }
      } else throw new Error("Invalid item type for deletion");

      const { error: dbError } = await supabase.from(tableName).delete().eq('id', itemToDelete.id);
      if (dbError) throw dbError;

      if (itemToDelete.imageUrl) {
        const { error: storageError } = await deleteFile(itemToDelete.imageUrl);
        if (storageError) console.warn("Failed to delete associated image:", storageError);
      }

      toast({ title: `${itemName.charAt(0).toUpperCase() + itemName.slice(1)} Deleted` });
      
      const currentTab = activeTabSetter(prev => prev); 
      activeTabSetter(''); 
      setTimeout(() => activeTabSetter(currentTab), 0);


    } catch (error) {
      console.error(`Error deleting ${itemToDelete.type}:`, error);
      toast({ variant: "destructive", title: "Deletion Failed", description: error.message });
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };

  return { isDeleteDialogOpen, itemToDelete, isDeleting, openDeleteDialog, confirmDelete, setIsDeleteDialogOpen };
};


const AdminPageHeader = () => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="mb-8">
    <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
    <p className="mt-2 text-muted-foreground">Manage orders, products, categories, and settings for Groceroo.</p>
  </motion.div>
);

const AdminPage = () => {
  const { authLoading, isAdmin } = useAdminRedirect();
  const { getOrdersByStatus } = useOrders(); 
  const [activeTab, setActiveTab] = useState("orders");
  const { isDeleteDialogOpen, itemToDelete, isDeleting, openDeleteDialog, confirmDelete, setIsDeleteDialogOpen } = useAdminDataDeletion(setActiveTab);
  
  const pendingOrdersCount = getOrdersByStatus('pending').length;
  const processingOrdersCount = getOrdersByStatus('processing').length;
  const deliveredOrdersCount = getOrdersByStatus('delivered').length;

  if (authLoading) {
    return <div className="container flex items-center justify-center h-screen"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;
  }
  if (!isAdmin) return null; 

  const tabItems = [
    { value: "orders", label: "Orders", icon: Package, component: <AdminOrdersTab /> },
    { value: "products", label: "Products", icon: List, component: <AdminProductsTab key="products" openDeleteDialog={openDeleteDialog} /> },
    { value: "categories", label: "Categories", icon: Tag, component: <AdminCategoriesTab key="categories" openDeleteDialog={openDeleteDialog} /> },
    { value: "settings", label: "Settings", icon: SettingsIcon, component: <AdminSettingsTab /> },
  ];

  return (
    <div className="container px-4 py-8 mx-auto md:px-6">
      <AdminPageHeader />
      <AdminSummaryCards
        pendingCount={pendingOrdersCount}
        processingCount={processingOrdersCount}
        deliveredCount={deliveredOrdersCount}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-8 space-y-6">
        <TabsList className={`grid w-full grid-cols-${tabItems.length} md:w-auto md:inline-flex`}>
          {tabItems.map(tab => (
            <TabsTrigger key={tab.value} value={tab.value} className="flex items-center">
              <tab.icon className="w-4 h-4 mr-2" />{tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {tabItems.map(tab => (
          <TabsContent key={tab.value} value={tab.value}>{tab.component}</TabsContent>
        ))}
      </Tabs>

      <DeleteConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        itemType={itemToDelete?.type}
        onConfirm={confirmDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default AdminPage;
  