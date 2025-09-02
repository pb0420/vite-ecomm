import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Info } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from "@/contexts/AuthContext";
import { setQueryCache, getQueryCache } from '@/lib/queryCache';
import { it } from 'date-fns/locale';

const DEFAULT_PRICE = 5;

const StoreNotes = ({
  storeId,
  notes,
  onNotesChange,
  suggestedItems = [],
  maxItems = 6,
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
        .order('created_at', { ascending: false })
        .limit(3);
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

  let filteredItems = [];
  try {
    filteredItems = suggestedItems.filter(item =>
      item.name && item.name.toLowerCase().includes(search.toLowerCase())
    );
  } catch (e) {
    filteredItems = [];
  }

  const itemsToShow = filteredItems.slice(0, maxItems);
  // Custom items state
  const [customItems, setCustomItems] = useState([]);
  const [customItemName, setCustomItemName] = useState('');
  // Get all items (suggested + custom)
  const [customItemPrices, setCustomItemPrices] = useState({});
  const allItems = [
    ...itemsToShow,
    ...customItems.map(name => ({
      name,
      price: customItemPrices[name] !== undefined ? customItemPrices[name] : DEFAULT_PRICE,
      custom: true
    }))
  ];

  // Add custom item
  const handleAddCustomItem = () => {
    const name = customItemName.trim();
    if (!name || allItems.some(i => i.name.toLowerCase() === name.toLowerCase())) return;
    setCustomItems([...customItems, name]);
    setCustomItemName('');
    setCustomItemPrices(prices => ({ ...prices, [name]: DEFAULT_PRICE }));
    // Set qty to 1 in notes
    let newNotes = notes || '';
    const regex = new RegExp(`^${name} >> (\\d+)$`, 'm');
    if (!regex.test(newNotes)) {
      newNotes = newNotes ? `${newNotes}\n${name} >> 1` : `${name} >> 1`;
      onNotesChange(storeId, newNotes);
    }
  };
  // Remove custom item
  const handleRemoveCustomItem = (name) => {
    setCustomItems(customItems.filter(i => i !== name));
    setCustomItemPrices(prices => {
      const newPrices = { ...prices };
      delete newPrices[name];
      return newPrices;
    });
    // Remove from notes
    const regex = new RegExp(`^${name} >> (\\d+)$`, 'm');
    onNotesChange(storeId, (notes || '').replace(regex, '').replace(/\n+/g, '\n').trim());
  };

  // Regex for matching item and quantity in notes
  const getItemQty = (itemName) => {
    const regex = new RegExp(`^${itemName} >> (\\d+)$`, 'm');
    const match = (notes || '').match(regex);
    return match ? parseInt(match[0].split('>>')[1], 10) : 0;
  };
  const handleItemQtyChange = (item, qty) => {
    let newNotes = notes || '';
    const regex = new RegExp(`^${item.name} >> (\\d+)$`, 'm');
    if (qty > 0) {
      if (regex.test(newNotes)) {
        newNotes = newNotes.replace(regex, `${item.name} >> ${qty}`);
      } else {
        newNotes = newNotes ? `${newNotes}\n${item.name} >> ${qty}` : `${item.name} >> ${qty}`;
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

  // Helper for info popup direction
  const getPopupPosition = (el) => {
    if (!el) return { left: '100%', top: 0 };
    const rect = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    // Try right, else left, else below
    if (rect.right + 180 < vw) return { left: '100%', top: 0 };
    if (rect.left - 180 > 0) return { right: '100%', top: 0 };
    if (rect.bottom + 120 < vh) return { left: 0, top: '100%' };
    return { left: 0, top: 0 };
  };

  // Track which info dialog is open
  const [infoOpen, setInfoOpen] = useState(null);

  // Highlight items in notes
  const isItemInNotes = (name) => getItemQty(name) > 0;

  return (
    <div className="space-y-3">
      {oldNotes.length > 0 && showOldNotes && (
        <div className="mb-2">
          <Label className="text-sm font-medium">Use Previous Notes </Label>
          <div className="flex flex-col gap-2 mt-1">
            {oldNotes.map((n, idx) => (
              <button
                key={idx}
                type="button"
                className="border rounded px-2 py-1 text-xs bg-gray-50 hover:bg-primary/10 flex justify-between items-center"
                onClick={() => {
                  if (notes) {
                    onNotesChange(storeId, notes + '\n' + n.notes);
                  } else {
                    onNotesChange(storeId, n.notes);
                  }
                  setShowOldNotes(false);
                }}
              >
                <span className="font-mono font-semibold text-green-700">Order #{n.noteId.slice(0,6).toUpperCase()}</span>
                <span className="ml-auto text-xs text-gray-500 font-medium">{new Date(n.date).toLocaleDateString()}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      <Label htmlFor={`notes-${storeId}`} className="text-sm font-medium mb-1">Shopping List</Label>
      <div className="relative flex items-center gap-2 mb-2">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Type to search or add items..."
          className="border rounded px-3 py-2 w-full text-base"
          autoComplete="off"
        />
        <button
          type="button"
          className="bg-green-400 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm font-semibold whitespace-nowrap"
          style={{ position: 'relative', right: 0 }}
          onClick={() => {
            if (search.trim() && !customItems.includes(search.trim())) {
              setCustomItems([...customItems, search.trim()]);
              setCustomItemName('');
              setSearch('');
              setCustomItemPrices(prices => ({ ...prices, [search.trim()]: DEFAULT_PRICE }));
              // Add to notes
              let newNotes = notes || '';
              const regex = new RegExp(`^${search.trim()} >> (\\d+)$`, 'm');
              if (!regex.test(newNotes)) {
                newNotes = newNotes ? `${newNotes}\n${search.trim()} >> 1` : `${search.trim()} >> 1`;
                onNotesChange(storeId, newNotes);
              }
            }
          }}
        >Add</button>
        {/* Show suggestions only when typing */}
        {search.length > 0 && filteredItems.length > 0 && (
          <div className="absolute z-10 bg-white border rounded shadow w-full left-0" style={{ top: '110%' }}>
            {filteredItems.map(item => (
              <button
                key={item.name}
                type="button"
                className="flex justify-between items-center w-full text-left px-3 py-2 hover:bg-primary/10 text-xs"
                onClick={() => {
                  setCustomItems([...customItems, item.name]);
                  setCustomItemName('');
                  setSearch('');
                  setCustomItemPrices(prices => ({ ...prices, [item.name]: item.price || DEFAULT_PRICE }));
                  // Add to notes
                  let newNotes = notes || '';
                  const regex = new RegExp(`^${item.name} >> (\\d+)$`, 'm');
                  if (!regex.test(newNotes)) {
                    newNotes = newNotes ? `${newNotes}\n${item.name} >> 1` : `${item.name} >> 1`;
                    onNotesChange(storeId, newNotes);
                  }
                }}
              >
                <span>{item.name}</span>
                {/* Only show price if available */}
                {item.price ? (
                  <span className="ml-2 text-gray-400 text-xs">A${item.price}</span>
                ) : null}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Selected items as interactive pills */}
      <div className="flex flex-wrap gap-2 mt-2">
        {customItems.map(name => {
          const qty = getItemQty(name);
          const price = customItemPrices[name];
          return (
            <div key={name} className="flex items-center bg-green-100 border border-green-300 rounded-full px-3 py-1 text-xs font-medium shadow">
              <span>{name}</span>
              {price && suggestedItems.some(item => item.name === name && item.price) ? (
                <span className="ml-2 text-gray-400 text-xs">A${price}</span>
              ) : null}
              <button
                type="button"
                className="ml-2 px-2 py-0.5 rounded bg-white text-black border border-gray-300"
                onClick={() => handleItemQtyChange({ name }, Math.max(0, qty - 1))}
              >-</button>
              <span className="mx-1">{qty}</span>
              <button
                type="button"
                className="px-2 py-0.5 rounded bg-green-500 text-white"
                onClick={() => handleItemQtyChange({ name }, qty + 1)}
              >+</button>
              <button
                type="button"
                className="ml-2 text-red-500 hover:underline flex items-center"
                onClick={() => handleRemoveCustomItem(name)}
                aria-label="Remove"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          );
        })}
      </div>
      
      {/* Instructions from component - fix add logic */}
      <h1>Instructions</h1>
      <div className="mt-2 flex flex-wrap gap-2">
        {["Find specials and better price options", "Replace out of stock items", "Call if unavailable", "Keep it under budget", "No plastic bags"].map((opt, idx) => (
          <button
            key={idx}
            type="button"
            className="border rounded px-2 py-1 text-xs bg-gray-50 hover:bg-primary/10"
            onClick={() => {
              if (notes && !notes.includes(opt)) {
                onNotesChange(storeId, notes ? notes + '\n' + opt : opt);
              } else if (!notes) {
                onNotesChange(storeId, opt);
              }
            }}
          >
            {opt}
          </button>
        ))}
      </div>

      {/* Main notes textarea remains for extra instructions */}
      <h1>Summary / Notes</h1>
      <Textarea
        id={`notes-${storeId}`}
        value={notes || ''}
        onChange={e => onNotesChange(storeId, e.target.value)}
        placeholder="..."
        rows={3}
        className="mt-1 text-base px-2 py-1 rounded border focus:outline-primary bg-green-50 border-green-800"
      />
    </div>
  );
};

export default StoreNotes;