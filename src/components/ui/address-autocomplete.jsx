import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabaseClient';

const AddressAutocomplete = ({ 
  value, 
  onChange, 
  onAddressSelect, 
  placeholder = "Enter your address", 
  className,
  disabled,
  ...props 
}) => {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);
  const skipNextSearch = useRef(false); // Prevent search on suggestion click
  const debounceTimeout = useRef();

  // Single function to search addresses
  const searchAddresses = async (searchValue) => {
    setLoading(true);
    try {
      if (searchValue.length >= 3) {
        let searchValueSpacesReplacedWithPlus = searchValue.replace(/\s+/g, '+');
        const fallbackResponse = await supabase
          .from('adelaide_address_data')
          .select('ADDRESS_LA, LOCALITY_N, POSTCODE')
          .textSearch('fts', `${searchValueSpacesReplacedWithPlus}:*`)
          .limit(18446744);
        if (fallbackResponse.error) throw fallbackResponse.error;
        const transformedData = transformData(fallbackResponse.data);
        setSuggestions(transformedData);
        setShowSuggestions(transformedData.length > 0);
        return;
      }
      setSuggestions([]);
      setShowSuggestions(false);
    } catch (error) {
      console.error('Error searching addresses:', error);
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setLoading(false);
    }
  };

  // Debounced effect for searching
  useEffect(() => {
    if (skipNextSearch.current) {
      skipNextSearch.current = false;
      return;
    }
    if (!value || value.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(() => {
      searchAddresses(value);
    }, 400);
    return () => clearTimeout(debounceTimeout.current);
  }, [value]);

  // Transform function to map database columns to expected format
  const transformData = (data) => {
    const keyMap = {
      ADDRESS_LA: "address",
      LOCALITY_N: "suburb",
      POSTCODE: "postcode"
    };
    return data.map(item => {
      const transformedItem = {};
      for (const key in item) {
        transformedItem[keyMap[key] || key] = item[key];
      }
      return transformedItem;
    });
  };

  // Handle input change
  const handleInputChange = (e) => {
    onChange(e.target.value);
  };

  // Handle suggestion selection
  const handleSuggestionClick = (suggestion) => {
    skipNextSearch.current = true;
    onChange(suggestion.address);
    setShowSuggestions(false);
    if (onAddressSelect) {
      onAddressSelect({
        address: suggestion.address,
        suburb: suggestion.suburb.toUpperCase(),
        postcode: suggestion.postcode
      });
    }
  };

  // Handle keyboard navigation (no spacebar logic)
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        inputRef.current && 
        !inputRef.current.contains(event.target) &&
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={className}
        disabled={disabled}
        {...props}
      />
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className="px-4 py-2 cursor-pointer hover:bg-gray-100 border-b border-gray-100 last:border-b-0"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              <div className="text-sm font-medium">{suggestion.address}</div>
              <div className="text-xs text-gray-500">
                {suggestion.suburb}, {suggestion.postcode}
              </div>
            </div>
          ))}
        </div>
      )}
      {loading && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
};

export default AddressAutocomplete;