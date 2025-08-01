import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Store, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, getDistance } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import StoreNotes from '@/components/common/StoreNotes';
import { Input } from '@/components/ui/input';


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
      const selectedStore = selectedStores.find(s => s.id === store.id);
      const hasInfo = selectedStore && (selectedStore.notes || selectedStore.estimatedTotal !== store.minimum_order_amount);
      if (hasInfo) {
        if (!window.confirm('Remove this store?')) {
          return;
        }
      }
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

  const handleStoreNotesEstimatedTotal = (storeId, total) => {
    const updatedStores = selectedStores.map(store => 
      store.id === storeId ? { ...store, estimatedTotal: total } : store
    );
    onStoreToggle(updatedStores);
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2">
        {sortedStores.map((store) => {
          const isSelected = selectedStores.some(s => s.id === store.id);
          const selectedStore = selectedStores.find(s => s.id === store.id);
          const minimumOrder = store.minimum_order_amount;
          // Distance
          const distance =
            userLocation && store.lat && store.lng
              ? getDistance(userLocation.lat, userLocation.lng, store.lat, store.lng)
              : null;
        
          return (
            <motion.div
              key={store.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="w-full"
            >
              <Card className={`transition-all ${isSelected ? 'ring-2 ring-primary shadow-lg' : 'hover:shadow-md'} p-2 sm:p-2`}> {/* Add padding for mobile */}
                <CardHeader className="pb-3 flex flex-row items-center justify-between border-b gap-2 sm:gap-2 p-2"> {/* Add gap for mobile */}
                  <div className="flex items-center space-x-2 sm:space-x-1">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
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
                      <div className="flex items-center gap-1 sm:gap-2">
                        <CardTitle className="text-base leading-tight">{store.name}</CardTitle>
                        <Badge className="bg-primary/10 text-primary font-semibold px-2 py-0.5 text-xs">Min ${minimumOrder}</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground leading-tight">{store.address.slice(0,20)}</div>
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
                    size="md"
                    className="rounded-full w-8 h-8 flex items-center justify-center"
                    onClick={() => handleStoreSelect(store)}
                  >
                    {isSelected ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  </Button>
                </CardHeader>
                {isSelected && (
                  <CardContent className="space-y-4 border-t pt-4 bg-gray-50 rounded-b-lg p-2">
                    {/* Estimated Total */}
                    <div className="space-y-1">
                      <Label htmlFor={`estimated-${store.id}`} className="text-sm font-medium">Estimated Total ($)</Label>
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
                        className={`mt-1 text-base px-2 py-1 rounded border focus:outline-primary ${selectedStore?.estimatedTotal < minimumOrder ? 'border-red-500 bg-red-50' : 'border-green-500 bg-green-50'}`}
                      />
                      {selectedStore?.estimatedTotal < minimumOrder && (
                        <span className="text-xs text-red-500">Minimum order: ${minimumOrder}</span>
                      )}
                    </div>
                    {/* Suggested Items */}
                    <StoreNotes
                      storeId={store.id}
                      notes={selectedStore?.notes || ''}
                      onNotesChange={handleNotesChange}
                      suggestedItems={Array.isArray(store.store_suggested_items) ? store.store_suggested_items : []}
                      maxItems={10}
                      showQtyButtons={true}
                      minimumOrder={minimumOrder}
                      estimatedTotal={selectedStore?.estimatedTotal || 0}
                      onEstimatedTotalChange={handleStoreNotesEstimatedTotal}
                    />
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