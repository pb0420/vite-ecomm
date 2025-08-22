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
    // Ensure total is a valid number rounded to 2 decimal places
    total = parseFloat(total);
    if (isNaN(total) || total < 0) {
      // store minimum value
     total = selectedStores.find(s => s.id === storeId)?.minimum_order_amount || 0;
    } else {
      total = Math.round(total * 100) / 100; // Round to 2
    }
    // Update selected stores with the new estimated total
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
      <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 max-w-5xl mx-auto">
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
              <Card className={`transition-all ${isSelected ? 'ring-2 ring-primary shadow-lg' : 'hover:shadow-md'} p-2 sm:p-2`}>
                <CardHeader className="pb-3 border-b gap-2 sm:gap-2 p-2">
                  <div className="flex flex-row gap-4 items-stretch w-full min-h-[5.5rem]">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-muted flex items-center justify-center overflow-hidden border-2 border-primary/30 shadow-sm flex-shrink-0">
                      {store.image ? (
                        <img
                          src={store.image}
                          alt={store.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Store className="w-12 h-12 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex flex-col flex-1 min-w-0 justify-between">
                      <div>
                        <CardTitle className="text-lg sm:text-xl font-bold leading-tight text-primary-dark line-clamp-2">{store.name}</CardTitle>
                        <span className="text-base text-muted-foreground leading-tight font-medium truncate block">{store.address.slice(0, 48)}</span>
                        {distance && (
                          <span className="text-base text-primary font-semibold block">
                            • {distance.toFixed(1)} km
                          </span>
                        )}
                      </div>
                      <span className="text-base font-semibold block truncate mt-2">
                        {formatAMPM(store.opening_time)} - {formatAMPM(store.closing_time)}
                      </span>
                    </div>
                  </div>
                  <div className="flex w-full items-end justify-between mt-4">
                    <Button
                      type="button"
                      variant={isSelected ? "solid" : "outline"}
                      size="icon"
                      className={`rounded-xl w-36 h-14 flex items-center justify-center border-2 shadow-lg transition-all duration-150 text-lg ${isSelected ? 'bg-green-500 text-white border-green-500 hover:bg-green-600' : 'bg-white text-primary border-primary hover:bg-primary/10'} ml-0`}
                      style={{ boxShadow: '0 4px 16px 0 rgba(60,179,113,0.10)' }}
                      onClick={() => handleStoreSelect(store)}
                      aria-label={isSelected ? 'Remove store' : 'Add store'}
                    >
                      {isSelected ? <Minus className="w-8 h-8" /> : <Plus className="w-8 h-8" />}
                      <span className="ml-2 font-semibold text-base">{isSelected ? 'Remove' : 'Add'}</span>
                    </Button>
                    <span className="text-sm text-primary font-semibold whitespace-nowrap mb-1">Min: ${minimumOrder}</span>
                  </div>
                </CardHeader>
                {isSelected && (
                  <CardContent className="space-y-4 border-t pt-4 bg-gray-50 rounded-b-lg p-2">
                    {/* Suggested Items */}
                    <StoreNotes
                      storeId={store.id}
                      notes={selectedStore?.notes || ''}
                      onNotesChange={handleNotesChange}
                      suggestedItems={Array.isArray(store.store_suggested_items) ? store.store_suggested_items : []}
                      maxItems={6}
                      showQtyButtons={true}
                      minimumOrder={minimumOrder}
                      estimatedTotal={selectedStore?.estimatedTotal || 0}
                      onEstimatedTotalChange={handleStoreNotesEstimatedTotal}
                    />
                    {/* Estimated Total - moved to bottom */}
                    <div className="space-y-1 mt-4">
                      <Label htmlFor={`estimated-${store.id}`} className="text-sm font-medium">Estimated Total ($)</Label>
                      <Input
                        id={`estimated-${store.id}`}
                        type="text"
                        inputMode="numeric"
                        min={minimumOrder}
                        step="5"
                        value={
                          selectedStore?.estimatedTotal !== undefined && selectedStore?.estimatedTotal !== ''
                            ? Number(selectedStore.estimatedTotal).toFixed(2)
                            : ''
                        }
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9.]/g, '');
                          handleEstimatedTotalChange(store.id, val);
                        }}
                        onBlur={(e) => {
                          let val = parseFloat(e.target.value);
                          if (isNaN(val) || val < minimumOrder) {
                            val = minimumOrder;
                          }
                          // Round to 2 digits
                          val = Math.round(val * 100) / 100;
                          handleEstimatedTotalChange(store.id, val);
                        }}
                        placeholder={`Minimum $${minimumOrder}`}
                        className={`mt-1 text-base px-2 py-1 rounded border focus:outline-primary ${selectedStore?.estimatedTotal < minimumOrder ? 'border-red-500 bg-red-50' : 'border-green-500 bg-green-50'}`}
                      />
                      {selectedStore?.estimatedTotal < minimumOrder && (
                        <span className="text-xs text-red-500">Minimum order: ${minimumOrder}</span>
                      )}
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