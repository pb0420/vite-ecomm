import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { getQueryCache, setQueryCache, clearQueryCache } from '@/lib/queryCache';


// IMPORTANT: This version string should always match the value in the database (general_settings.pwa_version)
const CODE_PWA_VERSION = '1.0.2';

const PwaUpdateBanner = () => {
  const [updateMessage, setUpdateMessage] = useState('A new version is available!');
  const [showBanner, setShowBanner] = useState(false);

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
        setQueryCache('pwa_version', data.pwa_version, 1440); // 1 day cache
        setQueryCache('pwa_reload_count', 0, 30);
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

        // --- NEW LOGIC: If in-code version and DB version differ, show update banner and trigger update logic ---
        if (CODE_PWA_VERSION !== data.pwa_version) {
          setShowBanner(true);
        } else {
          setShowBanner(false);
        }
      }
    };
    checkPwaVersion(); // Initial check
    intervalId = setInterval(checkPwaVersion, 3600000); // Check every 60 mins
    return () => clearInterval(intervalId);
  }, []);

  // Show update banner if needed
  const handleUpdate = () => {
    setQueryCache('pwa_version', CODE_PWA_VERSION, 1440);
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
  };

  if (showBanner) {
    return (
      <div className="fixed bottom-0 left-0 w-full bg-yellow-500 text-white text-center py-5 z-50 shadow-lg font-semibold flex flex-row items-center justify-center gap-4 min-h-[64px]">
        <span className="text-base sm:text-lg">{updateMessage}</span>
        <button
          onClick={handleUpdate}
          className="ml-4 px-6 py-3 bg-white text-yellow-700 font-bold rounded shadow hover:bg-yellow-100 transition border border-yellow-300 text-base sm:text-lg"
        >
          Update
        </button>
      </div>
    );
  }
  return null;
};

export default PwaUpdateBanner;