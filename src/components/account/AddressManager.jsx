import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';

const AddressManager = () => {
  const { user, updateUserInfo } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [formData, setFormData] = useState({ label: '', address: '' });
  const [loading, setLoading] = useState(false);

  const addresses = user?.addresses || [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.label.trim() || !formData.address.trim()) {
      toast({ variant: "destructive", title: "Error", description: "Please fill in all fields" });
      return;
    }

    setLoading(true);
    try {
      let newAddresses;
      if (editingAddress) {
        // Update existing address
        newAddresses = addresses.map(addr => 
          addr.id === editingAddress.id 
            ? { ...addr, label: formData.label, address: formData.address }
            : addr
        );
      } else {
        const uniqueId =Math.random().toString(36).substr(2, 9);
        // Add new address
        newAddresses = [...addresses, {
          id: uniqueId,
          label: formData.label,
          address: formData.address
        }];
      }

      await updateUserInfo({ addresses: newAddresses });
      setIsDialogOpen(false);
      setEditingAddress(null);
      setFormData({ label: '', address: '' });
      toast({ title: "Success", description: editingAddress ? "Address updated" : "Address added" });
    } catch (error) {
      console.error('Error saving address:', error);
      toast({ variant: "destructive", title: "Error", description: "Could not save address" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (addressId) => {
    try {
      const newAddresses = addresses.filter(addr => addr.id !== addressId);
      await updateUserInfo({ addresses: newAddresses });
      toast({ title: "Success", description: "Address deleted" });
    } catch (error) {
      console.error('Error deleting address:', error);
      toast({ variant: "destructive", title: "Error", description: "Could not delete address" });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Saved Addresses</h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingAddress(null);
              setFormData({ label: '', address: '' });
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Add Address
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingAddress ? 'Edit Address' : 'Add New Address'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="label">Label</Label>
                <Input
                  id="label"
                  placeholder="e.g., Home, Work"
                  value={formData.label}
                  onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  placeholder="Enter full address"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  disabled={loading}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={loading}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Saving...' : (editingAddress ? 'Update' : 'Add')}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2">
        {addresses.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">No addresses saved yet.</p>
        ) : (
          addresses.map((addr) => (
            <motion.div
              key={addr.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div>
                <p className="font-medium">{addr.label}</p>
                <p className="text-sm text-muted-foreground">{addr.address}</p>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setEditingAddress(addr);
                    setFormData({ label: addr.label, address: addr.address });
                    setIsDialogOpen(true);
                  }}
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive"
                  onClick={() => handleDelete(addr.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default AddressManager;