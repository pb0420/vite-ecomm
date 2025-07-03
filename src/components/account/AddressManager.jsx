import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import AddressAutocomplete from '@/components/ui/address-autocomplete';
import { fetchPostcodes } from '@/lib/fetchPostcodes';


const AddressManager = () => {
  const { user, updateUserInfo } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [formData, setFormData] = useState({ label: '', address: '', postcode: '' });
  const [loading, setLoading] = useState(false);
  const [postcodes, setPostcodes] = useState([]);
  const [filteredPostcodes, setFilteredPostcodes] = useState([]);
  const [postcodeSearch, setPostcodeSearch] = useState('');
  const [showPostcodeDropdown, setShowPostcodeDropdown] = useState(false);

  const addresses = user?.addresses || [];

  useEffect(() => {
    const loadPostcodes = async () => {
      try {
        const data = await fetchPostcodes();
        setPostcodes(data);
        setFilteredPostcodes(data);
      } catch (error) {
        console.error('Error fetching postcodes:', error);
      }
    };
    loadPostcodes();
  }, []);

  useEffect(() => {
    if (postcodeSearch.length === 0) {
      setFilteredPostcodes(postcodes);
    } else {
      const filtered = postcodes.filter(pc => 
        pc.suburb.toLowerCase().includes(postcodeSearch.toLowerCase()) ||
        pc.postcode.includes(postcodeSearch)
      );
      setFilteredPostcodes(filtered);
    }
  }, [postcodeSearch, postcodes]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.label.trim() || !formData.address.trim() || !formData.postcode) {
      toast({ variant: "destructive", title: "Error", description: "Please fill in all fields" });
      return;
    }

    setLoading(true);
    try {
      let newAddresses;
      if (editingAddress) {
        newAddresses = addresses.map(addr => 
          addr.id === editingAddress.id 
            ? { ...addr, label: formData.label, address: formData.address, postcode: formData.postcode }
            : addr
        );
      } else {
        const uniqueId = Math.random().toString(36).substr(2, 9);
        newAddresses = [...addresses, {
          id: uniqueId,
          label: formData.label,
          address: formData.address,
          postcode: formData.postcode
        }];
      }

      await updateUserInfo({ addresses: newAddresses });
      setIsDialogOpen(false);
      setEditingAddress(null);
      setFormData({ label: '', address: '', postcode: '' });
      setPostcodeSearch('');
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

  const handleAddressAutocomplete = (addressDetails) => {
    setFormData(prev => ({
      ...prev,
      address: addressDetails.address,
      postcode: addressDetails.postcode
    }));
    setPostcodeSearch(`${addressDetails.suburb.toUpperCase()}, ${addressDetails.postcode}`);
  };

  const handlePostcodeSelect = (postcode) => {
    setFormData(prev => ({ ...prev, postcode: postcode.postcode }));
    setPostcodeSearch(`${postcode.suburb}, ${postcode.postcode}`);
    setShowPostcodeDropdown(false);
  };

  const openDialog = (address = null) => {
    setEditingAddress(address);
    if (address) {
      setFormData({ 
        label: address.label, 
        address: address.address,
        postcode: address.postcode
      });
      // Find and set the postcode search
      const postcodeData = postcodes.find(pc => pc.postcode === address.postcode);
      if (postcodeData) {
        setPostcodeSearch(`${postcodeData.suburb}, ${postcodeData.postcode}`);
      }
    } else {
      setFormData({ label: '', address: '', postcode: '' });
      setPostcodeSearch('');
    }
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Saved Addresses</h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => openDialog()}>
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
                <AddressAutocomplete
                  value={formData.address}
                  onChange={(value) => setFormData(prev => ({ ...prev, address: value }))}
                  onAddressSelect={handleAddressAutocomplete}
                  placeholder="Start typing your address..."
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="postcode">Suburb & Postcode</Label>
                <div className="relative">
                  <Input
                    id="postcode"
                    placeholder="Search suburb or postcode..."
                    value={postcodeSearch}
                    onChange={(e) => {
                      setPostcodeSearch(e.target.value);
                      setShowPostcodeDropdown(true);
                    }}
                    onFocus={() => setShowPostcodeDropdown(true)}
                    disabled={loading}
                  />
                  {showPostcodeDropdown && filteredPostcodes.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {filteredPostcodes.slice(0, 10).map((pc) => (
                        <div
                          key={`${pc.suburb}-${pc.postcode}`}
                          className="px-4 py-2 cursor-pointer hover:bg-gray-100 border-b border-gray-100 last:border-b-0"
                          onClick={() => handlePostcodeSelect(pc)}
                        >
                          <div className="text-sm font-medium">{pc.suburb}</div>
                          <div className="text-xs text-gray-500">{pc.postcode}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsDialogOpen(false);
                    setShowPostcodeDropdown(false);
                  }} 
                  disabled={loading}
                >
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
          addresses.map((addr) => {
            const postcode = postcodes.find(pc => pc.postcode === addr.postcode);
            return (
              <div
                key={addr.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div>
                  <p className="font-medium">{addr.label}</p>
                  <p className="text-sm text-muted-foreground">{addr.address}</p>
                  <p className="text-sm text-muted-foreground">
                    {postcode ? `${postcode.suburb}, ${postcode.postcode}` : addr.postcode}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openDialog(addr)}
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
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AddressManager;