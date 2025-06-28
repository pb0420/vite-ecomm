import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Filter, PlusCircle, Edit, Trash2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';
import StoreForm from '@/components/admin/StoreForm';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

const AdminStoresTab = () => {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStore, setEditingStore] = useState(null);
  const [suggestedItems, setSuggestedItems] = useState([]);
  const [editingSuggestedStore, setEditingSuggestedStore] = useState(null);
  const [suggestedDialogOpen, setSuggestedDialogOpen] = useState(false);
  const [suggestedInput, setSuggestedInput] = useState('');

  const fetchStores = async () => {
    try {
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .order('name');

      if (error) throw error;
      setStores(data || []);
    } catch (error) {
      console.error('Error fetching stores:', error);
      toast({ variant: "destructive", title: "Error", description: "Could not load stores." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStores();
  }, []);

  const handleStoreSubmit = async (storeData) => {
    try {
      if (editingStore) {
        const { error } = await supabase
          .from('stores')
          .update(storeData)
          .eq('id', editingStore.id);

        if (error) throw error;
        toast({ title: "Store Updated", description: `${storeData.name} has been updated.` });
      } else {
        const { error } = await supabase
          .from('stores')
          .insert(storeData);

        if (error) throw error;
        toast({ title: "Store Added", description: `${storeData.name} has been added.` });
      }

      setIsDialogOpen(false);
      setEditingStore(null);
      fetchStores();
    } catch (error) {
      console.error('Error saving store:', error);
      toast({ variant: "destructive", title: "Error", description: "Could not save store." });
    }
  };

  const handleDeleteStore = async (storeId) => {
    if (!window.confirm('Are you sure you want to delete this store?')) return;

    try {
      const { error } = await supabase
        .from('stores')
        .delete()
        .eq('id', storeId);

      if (error) throw error;
      toast({ title: "Store Deleted", description: "Store has been removed." });
      fetchStores();
    } catch (error) {
      console.error('Error deleting store:', error);
      toast({ variant: "destructive", title: "Error", description: "Could not delete store." });
    }
  };

  const filteredStores = stores.filter(store =>
    store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    store.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEditSuggestedItems = (store) => {
    setEditingSuggestedStore(store);
    setSuggestedItems(Array.isArray(store.store_suggested_items) ? store.store_suggested_items : []);
    setSuggestedInput((Array.isArray(store.store_suggested_items) ? store.store_suggested_items : []).map(i => i.name + (i.qty ? `:${i.qty}` : '')).join('\n'));
    setSuggestedDialogOpen(true);
  };

  const handleSaveSuggestedItems = async () => {
    const items = suggestedInput.split('\n').map(line => {
      const [name, qty] = line.split(':');
      return name ? { name: name.trim(), qty: qty ? parseInt(qty, 10) : 1 } : null;
    }).filter(Boolean);
    try {
      const { error } = await supabase
        .from('stores')
        .update({ store_suggested_items: items })
        .eq('id', editingSuggestedStore.id);
      if (error) throw error;
      toast({ title: "Suggested Items Updated", description: `Suggested items updated for ${editingSuggestedStore.name}.` });
      setSuggestedDialogOpen(false);
      setEditingSuggestedStore(null);
      fetchStores();
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Could not update suggested items." });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <h2 className="text-xl font-semibold">Store Management</h2>
        <div className="flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-2">
          <div className="relative">
            <Filter className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search stores..."
              className="pl-8 w-full md:w-[200px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingStore(null)}>
                <PlusCircle className="w-4 h-4 mr-2" /> Add Store
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{editingStore ? 'Edit Store' : 'Add New Store'}</DialogTitle>
              </DialogHeader>
              <StoreForm
                store={editingStore}
                onSubmit={handleStoreSubmit}
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
                <TableHead>Name</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Hours</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStores.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">No stores found.</TableCell>
                </TableRow>
              ) : (
                filteredStores.map((store) => (
                  <TableRow key={store.id}>
                    <TableCell className="font-medium">{store.name}</TableCell>
                    <TableCell>{store.address}</TableCell>
                    <TableCell>{store.phone}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span>{store.opening_time.slice(0, 5)} - {store.closing_time.slice(0, 5)}</span>
                      </div>
                      {/* Suggested Items */}
                      <div className="mt-1">
                        <span className="text-xs font-semibold">Suggested Items:</span>
                        <ul className="list-disc ml-5 text-xs text-muted-foreground">
                          {Array.isArray(store.store_suggested_items) && store.store_suggested_items.length > 0 ? (
                            store.store_suggested_items.map((item, idx) => (
                              <li key={idx}>{item.name}{item.qty ? ` (Qty: ${item.qty})` : ''}</li>
                            ))
                          ) : (
                            <li className="italic text-muted-foreground">None</li>
                          )}
                        </ul>
                        <Button size="xs" variant="outline" className="mt-1" onClick={() => handleEditSuggestedItems(store)}>
                          Edit Suggested Items
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingStore(store);
                          setIsDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDeleteStore(store.id)}
                      >
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

      {/* Suggested Items Dialog */}
      <Dialog open={suggestedDialogOpen} onOpenChange={setSuggestedDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Suggested Items</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Enter one item per line. Use <code>Item Name:Qty</code> for quantity (default 1).</Label>
            <Textarea
              value={suggestedInput}
              onChange={e => setSuggestedInput(e.target.value)}
              rows={6}
              placeholder={"Milk:2\nBread\nEggs:12"}
            />
            <div className="flex justify-end gap-2 mt-2">
              <Button variant="outline" onClick={() => setSuggestedDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSaveSuggestedItems}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default AdminStoresTab;