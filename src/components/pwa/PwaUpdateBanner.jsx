import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabaseClient';

const PwaUpdateBanner = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [version, setVersion] = useState(null);
  const [updateMessage, setUpdateMessage] = useState('A new version is available!');

  useEffect(() => {
    let intervalId;
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
      } else if (currentVersion !== data.pwa_version) {
        setVersion(data.pwa_version);
        setUpdateAvailable(true);
        setUpdateMessage(data.pwa_update_message || 'A new version is available!');
      }
    };
    let checkIfSecondRefreshRequired = localStorage.getItem('updateSecondTime');
    if (checkIfSecondRefreshRequired == 1) {
      window.location.reload(true); // Force reload to get new files
      localStorage.removeItem('updateSecondTime'); // Clear the flag after reload
    }
    checkPwaVersion(); // Initial check
    intervalId = setInterval(checkPwaVersion, 1800000); // Check every 30 mins
    return () => clearInterval(intervalId);
  }, []);

  const handleUpdate = () => {
    // Update local version and reload PWA
    localStorage.setItem('pwa_version', version); // You may want to set the actual version here
    localStorage.setItem('updateSecondTime',1);
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(function (registrations) {
        for (let registration of registrations) {
          // registration.update();  does not work!
          registration.unregister();
        }
        window.location.reload(true);
      });
    }
  };

  if (!updateAvailable) return null;

  return (
    <div className="fixed top-4 left-1/2 z-50 -translate-x-1/2 bg-[#ff9800]/95 text-primary-foreground px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in-up max-w-xs w-full">
      <span>{updateMessage}</span>
      <Button size="sm" className="ml-2" onClick={handleUpdate}>
        Update Now
      </Button>
    </div>
  );
};

export default PwaUpdateBanner;