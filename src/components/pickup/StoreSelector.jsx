import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Store, Plus, Minus, MapPin, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/lib/utils';


// Helper: Haversine formula for distance in km
function getDistance(lat1, lon1, lat2, lon2) {
  if (
    typeof lat1 !== 'number' ||
    typeof lon1 !== 'number' ||
    typeof lat2 !== 'number' ||
    typeof lon2 !== 'number'
  )
    return null;
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Helper: Format time to AM/PM
function formatAMPM(time) {
  if (!time) return '';
  let [h, m] = time.split(':');
  h = parseInt(h, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
}

const StoreSelector = ({
  stores,
  selectedStores,
  onStoreToggle,
  onNotesChange,
  onEstimatedTotalChange,
  userLocation,
}) => {
  // Distance-based sorting
  const sortedStores = useMemo(() => {
    if (!userLocation) return stores;
    return [...stores].sort((a, b) => {
      const dA = getDistance(userLocation.lat, userLocation.lng, a.lat, a.lng) ?? Infinity;
      const dB = getDistance(userLocation.lat, userLocation.lng, b.lat, b.lng) ?? Infinity;
      return dA - dB;
    });
  }, [stores, userLocation]);


  const handleStoreSelect = (store) => {
    const isSelected = selectedStores.some(s => s.id === store.id);
    
    if (isSelected) {
      onStoreToggle(selectedStores.filter(s => s.id !== store.id));
    } else {
      const newSelectedStores = [...selectedStores, {
        id: store.id,
        name: store.name,
        estimatedTotal: store.minimum_order_amount,
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

  // Suggested items logic
  const handleSuggestedItemChange = (storeId, item, checked, quantity) => {
    const selectedStore = selectedStores.find(s => s.id === storeId);
    let notes = selectedStore?.notes || '';
    const itemLine = `${item.name} x${quantity}`;
    const regex = new RegExp(`${item.name} x\\d+`, 'g');
    if (checked) {
      // Add or update
      if (regex.test(notes)) {
        notes = notes.replace(regex, itemLine);
      } else {
        notes = notes ? `${notes}\n${itemLine}` : itemLine;
      }
    } else {
      // Remove
      notes = notes.replace(regex, '').replace(/^\s*[\r\n]/gm, '').trim();
    }
    handleNotesChange(storeId, notes);
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {sortedStores.map((store) => {
          const isSelected = selectedStores.some(s => s.id === store.id);
          const selectedStore = selectedStores.find(s => s.id === store.id);
          const minimumOrder = store.minimum_order_amount;
          // Distance
          const distance =
            userLocation && store.lat && store.lng
              ? getDistance(userLocation.lat, userLocation.lng, store.lat, store.lng)
              : null;
          // Suggested items
          const suggestedItems = Array.isArray(store.store_suggested_items)
            ? store.store_suggested_items
            : [];
        
          return (
            <motion.div
              key={store.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className={`transition-all ${isSelected ? 'ring-2 ring-primary shadow-lg' : 'hover:shadow-md'}`}>
                <CardHeader className="pb-3 flex flex-row items-center justify-between border-b">
                  <div className="flex items-center space-x-3">
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
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base">{store.name}</CardTitle>
                        <Badge className="bg-primary/10 text-primary font-semibold">
                          Min ${minimumOrder}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">{store.address}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs">
                          {formatAMPM(store.opening_time)} - {formatAMPM(store.closing_time)}
                        </span>
                        {distance && (
                          <span className="text-xs text-primary font-semibold">
                            • {distance.toFixed(1)} km
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleStoreSelect(store)}
                  >
                    {isSelected ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  </Button>
                </CardHeader>
                {isSelected && (
                  <CardContent className="space-y-4 border-t pt-4 bg-gray-50">
                    {/* Suggested Items */}
                    {suggestedItems.length > 0 && (
                      <div>
                        <Label className="block mb-1">Suggested Items</Label>
                        <div className="flex flex-wrap gap-2">
                          {suggestedItems.map((item, idx) => {
                            const regex = new RegExp(`${item.name} x(\\d+)`, 'g');
                            const match = selectedStore?.notes?.match(regex);
                            const selectedQty = match ? parseInt(match[0].split('x')[1], 10) : 1;
                            const checked = !!match;
                            return (
                              <div key={item.name} className="flex items-center gap-1 bg-white border rounded px-2 py-1 shadow-sm">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={e =>
                                    handleSuggestedItemChange(store.id, item, e.target.checked, selectedQty)
                                  }
                                />
                                <span className="text-xs">{item.name}:</span>
                                <input
                                  type="number"
                                  min={1}
                                  value={selectedQty}
                                  onChange={e =>
                                    handleSuggestedItemChange(store.id, item, true, Math.max(1, parseInt(e.target.value) || 1))
                                  }
                                  className="w-10 text-xs ml-1 border rounded px-1 py-0.5"
                                  disabled={!checked}
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    <hr className="my-2" />
                    {/* Estimated Total */}
                    <div>
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
                        placeholder={`Minimum $${minimumOrder}`}
                        className="mt-1"
                      />
                    </div>
                    {/* Notes */}
                    <div>
                      <Label htmlFor={`notes-${store.id}`}>Shopping List / Notes</Label>
                      <Textarea
                        id={`notes-${store.id}`}
                        value={selectedStore?.notes || ''}
                        onChange={(e) => handleNotesChange(store.id, e.target.value)}
                        placeholder="Add your shopping list or special instructions..."
                        rows={2}
                        className="mt-1"
                      />
                    </div>
                  </CardContent>
                )}
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default StoreSelector;