import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { getQueryCache, setQueryCache, clearQueryCache } from '@/lib/queryCache';


const LOCAL_VERSION = '1.0.2'; // <-- Set your current deployed version here
const RELOAD_CACHE_KEY = 'pwa_update_read_';

const PwaUpdateBanner = () => {
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
      if (LOCAL_VERSION !== data.pwa_version) {
          setUpdateMessage(data.pwa_update_message || 'A new version is available!');
        // Use queryCache to track reload count for this version
        let reloadCount = getQueryCache(RELOAD_CACHE_KEY + '_' + data.pwa_version) || 0;
        if (reloadCount < 2) {
          setQueryCache(RELOAD_CACHE_KEY + '_' + data.pwa_version, reloadCount + 1, 10); // 10 min cache
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(function (registrations) {
              for (let registration of registrations) {
                registration.unregister();
              }
              window.location.reload(true);
            });
          } else {
            window.location.reload(true);
          }
        }
        // If reloadCount >= 2, do nothing (prevents infinite reload)
      }else{
         for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(RELOAD_CACHE_KEY)) {
            localStorage.removeItem(key);
            i--;
          }
        }
      }
    };
    let checkIfSecondRefreshRequired = localStorage.getItem('updateSecondTime');
    if (checkIfSecondRefreshRequired == 1) {
      localStorage.removeItem('updateSecondTime'); // Clear the flag after reload
      window.location.reload(true); // Force reload to get new files
    }
    checkPwaVersion(); // Initial check
    intervalId = setInterval(checkPwaVersion, 1800000); // Check every 30 mins
    return () => clearInterval(intervalId);
  }, []);

  // No banner needed, update is automatic
  return null;
};

export default PwaUpdateBanner;