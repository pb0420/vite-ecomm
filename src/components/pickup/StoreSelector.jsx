import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Store, Plus, Minus, MapPin, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/lib/utils';

const StoreSelector = ({ stores, selectedStores, onStoreToggle, onNotesChange, onEstimatedTotalChange }) => {
  const getMinimumOrder = (storeCount) => {
    const baseAmount = 30;
    return baseAmount;
    //return baseAmount + (storeCount - 1) * 25; // $30 for first store, +$25 for each additional
  };

  const handleStoreSelect = (store) => {
    const isSelected = selectedStores.some(s => s.id === store.id);
    
    if (isSelected) {
      onStoreToggle(selectedStores.filter(s => s.id !== store.id));
    } else {
      const newSelectedStores = [...selectedStores, {
        id: store.id,
        name: store.name,
        estimatedTotal: getMinimumOrder(selectedStores.length + 1),
        notes: ''
      }];
      onStoreToggle(newSelectedStores);
    }
  };

  const handleNotesChange = (storeId, notes) => {
    const updatedStores = selectedStores.map(store => 
      store.id === storeId ? { ...store, notes } : store
    );
    onStoreToggle(updatedStores);
    onNotesChange(storeId, notes);
  };

  const handleEstimatedTotalChange = (storeId, total) => {
    const updatedStores = selectedStores.map(store => 
      store.id === storeId ? { ...store, estimatedTotal: parseFloat(total) || 0 } : store
    );
    onStoreToggle(updatedStores);
    onEstimatedTotalChange(storeId, total);
  };

  const getTotalEstimated = () => {
    return selectedStores.reduce((total, store) => total + (store.estimatedTotal || 0), 0);
  };

  const getServiceCharge = () => {
    return getTotalEstimated() * 0.12; // 12% service charge
  };

  const getHighestDeliveryFee = () => {
    return selectedStores.reduce((highest, selectedStore) => {
      const store = stores.find(s => s.id === selectedStore.id);
      const deliveryFee = store?.store_delivery_fee || 0;
      return Math.max(highest, deliveryFee);
    }, 0);
  };

  return (
    <div className="space-y-6">
      <div>
        {/* <h3 className="text-lg font-semibold mb-4">Select Stores</h3> */}
        <div className="grid gap-4 md:grid-cols-2">
          {stores.map((store) => {
            const isSelected = selectedStores.some(s => s.id === store.id);
            const selectedStore = selectedStores.find(s => s.id === store.id);
            // const minimumOrder = getMinimumOrder(selectedStores.length + (isSelected ? 0 : 1));
            const minimumOrder = store.minimum_order_amount || getMinimumOrder(selectedStores.length + (isSelected ? 0 : 1));
            return (
              <motion.div
                key={store.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className={`cursor-pointer transition-all ${isSelected ? 'ring-2 ring-primary' : 'hover:shadow-md'}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {/* Store Image */}
                        <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                          {store.image ? (
                            <img 
                              src={store.image} 
                              alt={store.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Store className="w-6 h-6 text-muted-foreground" />
                          )}
                        </div>
                        <CardTitle className="text-base">
                          {store.name}
                        </CardTitle>
                      </div>
                      <Button
                        type="button"
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleStoreSelect(store)}
                      >
                        {isSelected ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4 mr-1" />
                      {store.address}
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Clock className="w-4 h-4 mr-1" />
                      {store.opening_time?.slice(0, 5)} - {store.closing_time?.slice(0, 5)}
                    </div>
                    <div className="flex justify-between items-center">
                      <Badge variant="secondary">
                        Min: {formatCurrency(minimumOrder)}
                      </Badge>
                      {/* <span className="text-sm font-medium">
                        Delivery: {formatCurrency(  store.store_delivery_fee)}
                      </span> */}
                    </div>
                    
                    {isSelected && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-3 pt-3 border-t"
                      >
                        <div className="space-y-2">
                          <Label htmlFor={`estimated-${store.id}`}>Estimated Total ($)</Label>
                          <Input
                            id={`estimated-${store.id}`}
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            min={minimumOrder}
                            step="5"
                            value={selectedStore?.estimatedTotal}
                            onChange={(e) => {
                              // Allow only numbers
                              const val = e.target.value.replace(/[^0-9.]/g, '');
                              handleEstimatedTotalChange(store.id, val);
                            }}
                            onBlur={(e) => {
                              let val = parseFloat(e.target.value);
                              if (isNaN(val) || val < minimumOrder) {
                                val = minimumOrder;
                              }
                              handleEstimatedTotalChange(store.id, val);
                            }}
                            placeholder={`Minimum ${formatCurrency(minimumOrder)}`}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`notes-${store.id}`}>Shopping List / Notes (or do it later) </Label>
                          <Textarea
                            id={`notes-${store.id}`}
                            value={selectedStore?.notes || ''}
                            onChange={(e) => handleNotesChange(store.id, e.target.value)}
                            placeholder="Enter your shopping list or special instructions..."
                            rows={3}
                          />
                        </div>
                      </motion.div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default StoreSelector;