import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { getQueryCache, setQueryCache, clearQueryCache } from '@/lib/queryCache';

const PwaUpdateBanner = () => {
  const [updateMessage, setUpdateMessage] = useState('A new version is available!');

  useEffect(() => {
    let intervalId;
    const checkPwaVersion = async () => {
      // Get cached version
      let cachedVersion = getQueryCache('pwa_version');
      let reloadCount = getQueryCache('pwa_reload_count') || 0;
      // Always fetch latest version from DB
      const { data, error } = await supabase
        .from('general_settings')
        .select('pwa_version, pwa_update_message')
        .eq('id', 1)
        .single();
      if (error || !data) return;
      setUpdateMessage(data.pwa_update_message || 'A new version is available!');
      // If no cached version, set it for 1 day
      if (!cachedVersion) {
        setQueryCache('pwa_version', data.pwa_version, 1440); // 1440 min = 1 day
        setQueryCache('pwa_reload_count', 0, 1440);
        return;
      }
      // If version changed, reload up to 2 times
      if (cachedVersion !== data.pwa_version) {
        if (reloadCount < 2) {
          setQueryCache('pwa_reload_count', reloadCount + 1, 1440);
          setQueryCache('pwa_version', data.pwa_version, 1440);
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
        // If already reloaded twice, do nothing
      } else {
        // If version matches, reset reload count
        setQueryCache('pwa_reload_count', 0, 1440);
      }
    };
    checkPwaVersion(); // Initial check
    intervalId = setInterval(checkPwaVersion, 1800000); // Check every 30 mins
    return () => clearInterval(intervalId);
  }, []);

  // No banner needed, update is automatic
  return null;
};

export default PwaUpdateBanner;