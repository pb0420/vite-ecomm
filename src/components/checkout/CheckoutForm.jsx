import React, { useState, useEffect } from 'react';
import { Truck, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import AddressSelector from '@/components/checkout/AddressSelector';
import AddressAutocomplete from '@/components/ui/address-autocomplete';
import { supabase } from '@/lib/supabaseClient';

const CheckoutForm = ({ onDetailsChange, errors }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '', 
    email: '', 
    phone: '', 
    address: '', 
    postcode: '',
    deliveryNotes: '',
  });
  const [showAddressSelector, setShowAddressSelector] = useState(false);
  const [postcodes, setPostcodes] = useState([]);
  const [filteredPostcodes, setFilteredPostcodes] = useState([]);
  const [postcodeSearch, setPostcodeSearch] = useState('');
  const [showPostcodeDropdown, setShowPostcodeDropdown] = useState(false);

  // Pre-fill form if user is logged in
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: '',
        postcode: '',
        deliveryNotes: '',
      });
    }
  }, [user]);

  // Fetch postcodes
  useEffect(() => {
    const fetchPostcodes = async () => {
      const { data, error } = await supabase
        .from('postcodes')
        .select('*')
        .order('suburb');
      
      if (error) {
        console.error('Error fetching postcodes:', error);
        return;
      }
      
      setPostcodes(data);
      setFilteredPostcodes(data);
    };

    fetchPostcodes();
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

  // Update parent component when form data changes
  useEffect(() => {
    onDetailsChange({ ...formData });
  }, [formData, onDetailsChange]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddressSelect = (address) => {
    const selectedAddress = user.addresses.find(addr => addr.address === address);
    if (selectedAddress) {
      setFormData(prev => ({
        ...prev,
        address: selectedAddress.address,
        postcode: selectedAddress.postcode
      }));
      // Find and set the postcode search
      const postcodeData = postcodes.find(pc => pc.postcode === selectedAddress.postcode);
      if (postcodeData) {
        setPostcodeSearch(`${postcodeData.suburb}, ${postcodeData.postcode}`);
      }
    }
    setShowAddressSelector(false);
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

  return (
    <div className="p-6 border rounded-lg">
      <h2 className="flex items-center text-xl font-semibold mb-4">
        <Truck className="mr-2 h-5 w-5 text-primary" />
        Delivery Information
      </h2>
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input 
              id="name" 
              name="name" 
              value={formData.name} 
              onChange={handleChange} 
              className={errors?.name ? 'border-destructive' : ''} 
            />
            {errors?.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email (Optional)</Label>
            <Input 
              id="email" 
              name="email" 
              type="email" 
              value={formData.email} 
              onChange={handleChange} 
              className={errors?.email ? 'border-destructive' : ''} 
            />
            {errors?.email && <p className="text-xs text-destructive">{errors.email}</p>}
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input 
            id="phone" 
            name="phone" 
            value={formData.phone} 
            onChange={handleChange} 
            className={errors?.phone ? 'border-destructive' : ''} 
          />
          {errors?.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="address">Delivery Address</Label>
            {user && user.addresses?.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAddressSelector(!showAddressSelector)}
                className="flex items-center text-primary"
              >
                <MapPin className="w-4 h-4 mr-1" />
                {showAddressSelector ? 'Hide saved addresses' : 'Use saved address'}
              </Button>
            )}
          </div>
          {showAddressSelector && (
            <AddressSelector onSelect={handleAddressSelect} />
          )}
          <AddressAutocomplete
            value={formData.address}
            onChange={(value) => setFormData(prev => ({ ...prev, address: value }))}
            onAddressSelect={handleAddressAutocomplete}
            placeholder="Start typing your address..."
            className={errors?.address ? 'border-destructive' : ''}
          />
          {errors?.address && <p className="text-xs text-destructive">{errors.address}</p>}
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
              className={errors?.postcode ? 'border-destructive' : ''}
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
          {errors?.postcode && <p className="text-xs text-destructive">{errors.postcode}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="deliveryNotes">Delivery Notes (Optional)</Label>
            {/* Delivery Notes with Suggestions */}
           <div className="flex flex-wrap gap-2 mb-2">
              {["Don't ring the doorbell","Leave at door","Call on arrival","Hand to me only","Knock softly","Text when here"].map(suggestion => (
                <button
                  type="button"
                  key={suggestion}
                  className="px-3 py-1 rounded-full bg-gray-100 hover:bg-primary/10 text-xs border border-gray-200 text-gray-700 transition"
                  onClick={() => setFormData(prev => ({ ...prev, deliveryNotes: formData.deliveryNotes + suggestion+'\n' }))}
                >
                  {suggestion}
                </button>
              ))}
            </div>   
          <Textarea
            id="deliveryNotes"
            name="deliveryNotes"
            value={formData.deliveryNotes}
            onChange={handleChange}
            placeholder="E.g., Leave at the door, call upon arrival, etc."
            rows={3}
          />
        </div>
      </div>
    </div>
  );
};

export default CheckoutForm;