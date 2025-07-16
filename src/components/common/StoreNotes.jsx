import React, { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Info } from 'lucide-react';
import { max } from 'date-fns';

/**
 * Sample regex for extracting item and quantity from notes:
 * /^([\w\s]+) x(\d+)$/gm
 */
const StoreNotes = ({
  storeId,
  notes,
  onNotesChange,
  suggestedItems = [],
  maxItems = 10,
  showQtyButtons = false,
}) => {
  const [search, setSearch] = useState('');
  const filteredItems = suggestedItems.filter(item =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );
  const itemsToShow = filteredItems.slice(0, maxItems);
console.log('itemsToShow', maxItems, itemsToShow);
  // Regex for matching item and quantity in notes
  // Example: "Milk x2" matches Milk, 2
  const getItemQty = (itemName) => {
    const regex = new RegExp(`^${itemName} x(\\d+)$`, 'm');
    const match = notes.match(regex);
    return match ? parseInt(match[0].split('x')[1], 10) : 1;
  };
  const isChecked = (itemName) => {
    const regex = new RegExp(`^${itemName} x(\\d+)$`, 'm');
    return regex.test(notes);
  };
  const handleItemToggle = (item, checked, qty) => {
    let newNotes = notes || '';
    const regex = new RegExp(`^${item.name} x(\\d+)$`, 'm');
    if (checked) {
      // Add or update
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

  return (
    <div className="space-y-3">
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
        <Info className="w-4 h-4 text-muted-foreground" title="Tap info for details" />
      </Label>
      <div className="flex flex-wrap gap-2">
        {itemsToShow.map(item => {
          const checked = isChecked(item.name);
          const qty = getItemQty(item.name);
          return (
            <div key={item.name} className="flex items-center gap-2 bg-white border rounded px-2 py-1 shadow-sm min-w-[140px]">
              <input
                type="checkbox"
                checked={checked}
                onChange={e => handleItemToggle(item, e.target.checked, qty)}
                className="w-4 h-4 accent-primary"
              />
              <span className="text-xs whitespace-nowrap">{item.name}:</span>
              <div className="flex items-center gap-1">
                {showQtyButtons && (
                  <button
                    type="button"
                    className="w-5 h-5 flex items-center justify-center rounded border bg-gray-100 text-primary"
                    disabled={!checked || qty <= 1}
                    onClick={() => handleItemToggle(item, true, Math.max(1, qty - 1))}
                  >
                    <span className="font-bold">-</span>
                  </button>
                )}
                <input
                  type="number"
                  min={1}
                  value={qty}
                  onChange={e => handleItemToggle(item, true, Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-10 text-xs border rounded px-1 py-0.5 focus:outline-primary"
                  disabled={!checked}
                  style={{ WebkitAppearance: 'auto' }}
                />
                {showQtyButtons && (
                  <button
                    type="button"
                    className="w-5 h-5 flex items-center justify-center rounded border bg-gray-100 text-primary"
                    disabled={!checked}
                    onClick={() => handleItemToggle(item, true, qty + 1)}
                  >
                    <span className="font-bold">+</span>
                  </button>
                )}
              </div>
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
          );
        })}
      </div>
      <Label htmlFor={`notes-${storeId}`} className="text-sm font-medium">Shopping List / Notes</Label>
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
