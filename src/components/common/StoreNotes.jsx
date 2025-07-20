import React, { useState, useEffect, useRef } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Info } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from "@/contexts/AuthContext";
import { setQueryCache, getQueryCache } from '@/lib/queryCache';

const DEFAULT_PRICE = 5;

const StoreNotes = ({
  storeId,
  notes,
  onNotesChange,
  suggestedItems = [],
  maxItems = 10,
  showQtyButtons = false,
  minimumOrder = 30,
  estimatedTotal = 0,
  onEstimatedTotalChange = () => {},
}) => {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [oldNotes, setOldNotes] = useState([]);
  const [showOldNotes, setShowOldNotes] = useState(false);
  const fetchedRef = useRef(false);

  useEffect(() => {
    async function fetchOldNotes() {
      if (!user?.id || !storeId || fetchedRef.current) return;
      const cacheKey = `oldNotes_${user.id}_${storeId}`;
      // Try cache first (5 min TTL)
      let cachedNotes = getQueryCache(cacheKey);
      if (cachedNotes) {
        setShowOldNotes(true);
        setOldNotes(cachedNotes);
        fetchedRef.current = true;
        return;
      }
      // Fetch from DB with join on pickup_orders for user_id
      const { data, error } = await supabase
        .from('pickup_order_stores')
        .select('pickup_order_id,notes,created_at,pickup_orders!inner(user_id)')
        .eq('store_id', storeId)
        .eq('pickup_orders.user_id', user.id)
        .order('created_at', { ascending: false });
      if (!error && data) {
        const notesArr = data.filter(n => n.notes).map(n => ({
            noteId: n.pickup_order_id,
          notes: n.notes,
          date: n.created_at,
        }));
        setShowOldNotes(true);
        setOldNotes(notesArr);
        setQueryCache(cacheKey, notesArr, 5); // 5 min TTL
        fetchedRef.current = true;
      }
    }
    fetchOldNotes();
  }, [user, storeId]);

  const filteredItems = suggestedItems.filter(item =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );
  const itemsToShow = filteredItems.slice(0, maxItems);

  // Regex for matching item and quantity in notes
  const getItemQty = (itemName) => {
    const regex = new RegExp(`^${itemName} x(\\d+)$`, 'm');
    const match = notes.match(regex);
    return match ? parseInt(match[0].split('x')[1], 10) : 0;
  };
  const handleItemQtyChange = (item, qty) => {
    let newNotes = notes || '';
    const regex = new RegExp(`^${item.name} x(\\d+)$`, 'm');
    if (qty > 0) {
      if (regex.test(newNotes)) {
        newNotes = newNotes.replace(regex, `${item.name} x${qty}`);
      } else {
        newNotes = newNotes ? `${newNotes}\n${item.name} x${qty}` : `${item.name} x${qty}`;
      }
    } else {
      newNotes = newNotes.replace(regex, '').replace(/\n+/g, '\n').trim();
    }
    onNotesChange(storeId, newNotes);
  };

  // Calculate estimated total from item quantities
  useEffect(() => {
    let total = 0;
    itemsToShow.forEach(item => {
      const qty = getItemQty(item.name);
      const price = item.price ? Number(item.price) : DEFAULT_PRICE;
      total += price * qty;
    });
    onEstimatedTotalChange(storeId, total);
    // eslint-disable-next-line
  }, [notes, suggestedItems, maxItems]);

  return (
    <div className="space-y-3">
      {oldNotes.length > 0 && showOldNotes && (
        <div className="mb-2">
          <Label className="text-sm font-medium">Previous Notes </Label>
          <div className="flex flex-col gap-2 mt-1">
            {oldNotes.map((n, idx) => (
              <button
                key={idx}
                type="button"
                className="border rounded px-2 py-1 text-xs bg-gray-50 hover:bg-primary/10 text-left"
                onClick={() => {
                  onNotesChange(storeId, n.notes);
                  setShowOldNotes(false);
                }}
              >
                <span className="font-semibold">{new Date(n.date).toLocaleDateString()}:</span> Order #{n.noteId.slice(0,6).toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      )}
      {oldNotes.length > 0 && !showOldNotes && (
        <button
          type="button"
          className="text-xs text-primary underline mb-2"
          onClick={() => setShowOldNotes(true)}
        >
          Show previous grocery run notes
        </button>
      )}
      {suggestedItems.length > maxItems && (
        <div className="mb-2">
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search suggested items..."
            className="border rounded px-2 py-1 w-full text-sm"
          />
        </div>
      )}
      <Label className="block mb-1 text-sm font-medium flex items-center gap-1">
        Suggested Items
      </Label>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1">
        {itemsToShow.map(item => {
          const qty = getItemQty(item.name);
          const price = item.price ? Number(item.price) : DEFAULT_PRICE;
          return (
            <div key={item.name} className="flex items-center justify-between bg-white border rounded px-1 py-1 shadow-sm min-w-[140px] max-w-full overflow-hidden">
              <div className="flex items-center gap-1">
                <span className="text-xs line-clamp-2">{item.name}:</span>
                {item.image_url || item.description ? (
                  <span className="ml-1 cursor-pointer group relative">
                    <Info className="w-4 h-4 text-primary" />
                    <div className="absolute z-10 left-6 top-0 bg-white border rounded shadow-lg p-2 text-xs w-40 hidden group-hover:block">
                      {item.image_url && (
                        <img src={item.image_url} alt={item.name} className="w-full h-16 object-cover mb-1 rounded" />
                      )}
                      {item.description && <div>{item.description}</div>}
                    </div>
                  </span>
                ) : null}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-right min-w-[40px]">A${price}</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    className="h-6 w-6 flex items-center justify-center rounded bg-[#34d399] hover:bg-[#27694a] text-white border"
                    disabled={qty <= 0}
                    onClick={() => handleItemQtyChange(item, Math.max(0, qty - 1))}
                  >
                    <span className="font-bold text-lg">-</span>
                  </button>
                  <input
                    type="number"
                    min={0}
                    value={qty}
                    onChange={e => handleItemQtyChange(item, Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-6 text-xs border rounded px-1 py-0.5 focus:outline-primary text-center"
                    style={{ WebkitAppearance: 'auto' }}
                  />
                  <button
                    type="button"
                    className="h-6 w-6 flex items-center justify-center rounded bg-[#34d399] hover:bg-[#27694a] text-white border"
                    onClick={() => handleItemQtyChange(item, qty + 1)}
                  >
                    <span className="font-bold text-lg">+</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div>
        <Label htmlFor={`notes-${storeId}`} className="text-sm font-medium">Shopping List / Notes</Label>
      </div>
      <Textarea
        id={`notes-${storeId}`}
        value={notes || ''}
        onChange={e => onNotesChange(storeId, e.target.value)}
        placeholder="Add your shopping list or special instructions..."
        rows={2}
        className="mt-1 text-base px-2 py-1 rounded border focus:outline-primary"
      />
    </div>
  );
};

export default StoreNotes;