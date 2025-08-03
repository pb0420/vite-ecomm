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
  const allItems = [...itemsToShow, ...customItems.map(name => ({ name, price: DEFAULT_PRICE, custom: true }))];

  // Add custom item
  const handleAddCustomItem = () => {
    const name = customItemName.trim();
    if (!name || allItems.some(i => i.name.toLowerCase() === name.toLowerCase())) return;
    setCustomItems([...customItems, name]);
    setCustomItemName('');
  };
  // Remove custom item
  const handleRemoveCustomItem = (name) => {
    setCustomItems(customItems.filter(i => i !== name));
    // Remove from notes
    const regex = new RegExp(`^${name} x(\\d+)$`, 'm');
    onNotesChange(storeId, (notes || '').replace(regex, '').replace(/\n+/g, '\n').trim());
  };

  // Regex for matching item and quantity in notes
  const getItemQty = (itemName) => {
    const regex = new RegExp(`^${itemName} x(\\d+)$`, 'm');
    const match = (notes || '').match(regex);
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

  // Track which info popup is open
  const [infoOpen, setInfoOpen] = useState(null);
  const infoRefs = useRef({});

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
                className="border rounded px-2 py-1 text-xs bg-gray-50 hover:bg-primary/10 text-left"
                onClick={() => {
                  if (notes) {
                    onNotesChange(storeId, notes + '\n' + n.notes);
                  } else {
                    onNotesChange(storeId, n.notes);
                  }
                  setShowOldNotes(false);
                }}
              >
                <span className="font-semibold">{new Date(n.date).toLocaleDateString()}:</span> Order #{n.noteId.slice(0,6).toUpperCase()}
              </button>
            ))}
          </div>
        </div>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2 gap-2">
        {allItems.map(item => {
          const qty = getItemQty(item.name);
          const price = item.price ? Number(item.price) : DEFAULT_PRICE;
          return (
            <div
              key={item.name}
              className={`flex items-center justify-between border rounded px-2 py-2 shadow-sm min-w-[160px] max-w-full overflow-hidden transition-all
                ${isItemInNotes(item.name) ? 'bg-green-50 border-green-400 ring-2 ring-green-300' : item.custom ? 'bg-blue-50 border-blue-300' : 'bg-white'}
              `}
            >
              <div className="flex items-center gap-2">
                <span className="text-xs line-clamp-2 font-semibold">{item.name}{item.custom && <span className="ml-1 text-[10px] text-blue-500">(custom)</span>}:</span>
                {item.image_url || item.description ? (
                  <span
                    className="ml-1 cursor-pointer relative"
                    ref={el => infoRefs.current[item.name] = el}
                    onMouseEnter={() => setInfoOpen(item.name)}
                    onMouseLeave={() => setInfoOpen(null)}
                  >
                    <Info className="w-4 h-4 text-primary" />
                    <div
                      className={`absolute z-50 bg-white border rounded shadow-lg p-2 text-xs w-48 transition-opacity duration-100 ${infoOpen === item.name ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
                      style={infoOpen === item.name ? getPopupPosition(infoRefs.current[item.name]) : {}}
                    >
                      {item.image_url && (
                        <img src={item.image_url} alt={item.name} className="w-full h-16 object-cover mb-1 rounded" />
                      )}
                      {item.description && <div>{item.description}</div>}
                    </div>
                  </span>
                ) : null}
                {item.custom && (
                  <button
                    type="button"
                    className="ml-1 text-xs text-red-500 hover:underline"
                    onClick={() => handleRemoveCustomItem(item.name)}
                  >Remove</button>
                )}
              </div>
              <div className="flex items-center gap-3">
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
                    className="w-8 text-xs border rounded px-1 py-0.5 focus:outline-primary text-center appearance-none"
                    style={{ WebkitAppearance: 'none', MozAppearance: 'textfield' }}
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
      {/* Add custom item UI */}
      <div className="flex gap-2 mt-2">
        <input
          type="text"
          value={customItemName}
          onChange={e => setCustomItemName(e.target.value)}
          placeholder="Add custom item..."
          className="border rounded px-2 py-1 text-xs flex-1"
          onKeyDown={e => { if (e.key === 'Enter') handleAddCustomItem(); }}
        />
        <button
          type="button"
          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs font-semibold"
          onClick={handleAddCustomItem}
        >Add</button>
      </div>
       {/* Quick options for notes */}
      <div className="flex flex-wrap gap-2 mb-2">
        {["Find specials and better price options", "Replace out of stock items", "Call if unavailable", "Add organic options", "No plastic bags"].map((opt, idx) => (
          <button
            key={idx}
            type="button"
            className="border rounded px-2 py-1 text-xs bg-gray-50 hover:bg-primary/10"
            onClick={() => {
              if (notes && !notes.includes(opt)) {
                onNotesChange(storeId, notes + '\n' + opt);
              } else if (!notes) {
                onNotesChange(storeId, opt);
              }
            }}
          >
            {opt}
          </button>
        ))}
      </div>
      <div className="mt-2">
        <Label htmlFor={`notes-${storeId}`} className="text-sm font-medium">Shopping List / Notes</Label>
      </div>
      <Textarea
        id={`notes-${storeId}`}
        value={notes || ''}
        onChange={e => onNotesChange(storeId, e.target.value)}
        placeholder="Add your shopping list or special instructions..."
        rows={3}
        className="mt-1 text-base px-2 py-1 rounded border focus:outline-primary bg-yellow-50 border-yellow-300"
      />
    </div>
  );
};

export default StoreNotes;