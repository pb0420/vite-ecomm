import React from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { MapPin } from 'lucide-react';

const AddressSelector = ({ onSelect }) => {
  const { user } = useAuth();
  const addresses = user?.addresses || [];

  return (
    <div className="space-y-2">
      {addresses.map((addr) => (
        <Button
          key={addr.id}
          variant="outline"
          className="w-full justify-start text-left"
          onClick={() => onSelect(addr.address)}
        >
          <MapPin className="w-4 h-4 mr-2" />
          <div className="flex flex-col items-start">
            <span className="font-medium">{addr.label}</span>
            <span className="text-xs text-muted-foreground truncate line-clamp-2">{addr.address.length > 30 ? addr.address.slice(0,30)+'...' : addr.address}</span>
          </div>
        </Button>
      ))}
    </div>
  );
};

export default AddressSelector;