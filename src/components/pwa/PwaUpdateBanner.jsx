import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabaseClient';

const PwaUpdateBanner = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [version, setVersion] = useState(localStorage.getItem('pwa_version') || '1.0.0');
  const [updateMessage, setUpdateMessage] = useState('A new version is available!');

  useEffect(() => {
    const checkPwaVersion = async () => {
      const { data, error } = await supabase
        .from('general_settings')
        .select('pwa_version, pwa_update_message')
        .eq('id', 1)
        .single();
      if (error || !data) return;
      const currentVersion = localStorage.getItem('pwa_version');
        if (!currentVersion) {
            // If no version is set, assume this is the first load
            setVersion(data.pwa_version);
            localStorage.setItem('pwa_version', data.pwa_version);
            setUpdateAvailable(false);
        }else if (currentVersion !== data.pwa_version) {
            setVersion(data.pwa_version);
            setUpdateAvailable(true);
            setUpdateMessage(data.pwa_update_message || 'A new version is available!');
        }
    };
    checkPwaVersion();
  }, []);

  const handleUpdate = () => {
    // Update local version and reload PWA
    localStorage.setItem('pwa_version', version); // You may want to set the actual version here
    window.location.reload(true); // Force reload to get new files
  };

  if (!updateAvailable) return null;

  return (
    <div className="fixed top-4 left-1/2 z-50 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in-up max-w-xs w-full">
      <span>{updateMessage}</span>
      <Button size="sm" className="ml-2" onClick={handleUpdate}>
        Update Now
      </Button>
    </div>
  );
};

export default PwaUpdateBanner;