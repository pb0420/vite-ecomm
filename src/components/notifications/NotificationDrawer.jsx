import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Package, Store } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getQueryCache, setQueryCache } from "@/lib/queryCache";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { formatDateForTimezone, DEFAULT_TIMEZONE } from '@/lib/timezone';
import { fetchUserNotifications } from '@/lib/fetchNotifications';

const READ_KEY_PREFIX = "notifications_read_";

const NotificationDrawer = ({ open, onClose, onRead }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef();
  const navigate = useNavigate();

  // Get read notification IDs from localStorage
  const getReadIds = () => {
    if (!user) return [];
    try {
      return JSON.parse(localStorage.getItem(READ_KEY_PREFIX + user.id)).data || [];
    } catch {
      return [];
    }
  };

  // Set read notification IDs in localStorage
  const setReadIds = (ids) => {
    if (!user) return;
    setQueryCache(READ_KEY_PREFIX + `${user.id}`, ids, 100); // Cache for 100 minute
  };

  // Fetch notifications (upcoming orders and grocery runs)
  const fetchNotifications = async () => {
    if (!user) return;
    setLoading(true);
    let readIds = getReadIds();
    const notifs = await fetchUserNotifications(user.id);
    setNotifications(
      notifs.map(n => ({
        ...n,
        unread: !readIds.includes(`${n.type}_${n.id}`)
      }))
    );
    setLoading(false);
  };

  // Mark all notifications as read when drawer is opened
  useEffect(() => {
    if (open && notifications.length > 0 && user) {
      const ids = notifications.map(n => `${n.type}_${n.id}`);
      setReadIds(ids);
      setNotifications(notifications.map(n => ({ ...n, unread: false })));
      if (onRead) onRead();
    }
    // eslint-disable-next-line
  }, [open]);

  // Poll for updates every 30s for active notifications
  useEffect(() => {
    if (!open || !user) return;
    fetchNotifications();
    intervalRef.current = setInterval(fetchNotifications, 30000);
    return () => clearInterval(intervalRef.current);
    // eslint-disable-next-line
  }, [open, user]);

  // On click, go to order or pickup page
  const handleNotifClick = notif => {
    if (notif.type === "order") {
      navigate(`/order-confirmation/${notif.id}`);
    } else {
      navigate(`/pickup-order/${notif.id}`);
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-50 bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed top-0 right-0 z-50 h-full w-full max-w-md bg-white shadow-xl flex flex-col"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
          >
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Notifications</h2>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {loading ? (
                <div className="text-center text-muted-foreground">Loading...</div>
              ) : notifications.length === 0 ? (
                <div className="text-center text-muted-foreground">No notifications</div>
              ) : (
                notifications.map((notif, idx) => (
                  <div
                    key={notif.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border bg-muted cursor-pointer hover:bg-primary/10 transition relative`}
                    onClick={() => handleNotifClick(notif)}
                  >
                    {notif.type === "order" ? (
                      <Package className="w-6 h-6 text-primary" />
                    ) : (
                      <Store className="w-6 h-6 text-primary" />
                    )}
                    <div className="flex-1">
                      <div className="font-medium flex items-center gap-2">
                        {notif.title}
                        {notif.unread && (
                          <span className="inline-block w-2 h-2 rounded-full bg-orange-500" title="Unread" />
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {notif.time ? notif.time : ""}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default NotificationDrawer;