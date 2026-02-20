/**
 * useNotifications.ts
 *
 * React hook that manages:
 *   - Fetching in-app notifications from the backend
 *   - Polling for new notifications every 30 seconds
 *   - Registering the Service Worker and subscribing to Web Push
 *   - markRead / markAllRead helpers
 *
 * Usage:
 *   const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
 */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

export interface AppNotification {
  id: number;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
}

// Converts the VAPID public key string (base64url) to the Uint8Array format
// that the browser needs for push subscription.
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const output = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    output[i] = rawData.charCodeAt(i);
  }
  return output;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const pushSetupDone = useRef(false);

  // ── Fetch notifications from the backend ────────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/notifications`, {
        withCredentials: true,
      });
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch {
      // If the user is not logged in (401), silently do nothing.
      // The global Axios interceptor in UserContext.js handles the redirect.
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Mark a single notification as read ──────────────────────────────────────
  const markRead = useCallback(async (id: number) => {
    try {
      await axios.patch(
        `${API_URL}/notifications/${id}/read`,
        {},
        { withCredentials: true },
      );
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      /* ignore */
    }
  }, []);

  // ── Mark all notifications as read ──────────────────────────────────────────
  const markAllRead = useCallback(async () => {
    try {
      await axios.patch(
        `${API_URL}/notifications/read-all`,
        {},
        { withCredentials: true },
      );
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch {
      /* ignore */
    }
  }, []);

  // ── Set up Web Push subscription ────────────────────────────────────────────
  const setupPush = useCallback(async () => {
    if (pushSetupDone.current) return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

    try {
      // 1. Register the service worker
      const registration = await navigator.serviceWorker.register("/sw.js");

      // 2. Ask for notification permission
      const permission = await Notification.requestPermission();
      if (permission !== "granted") return;

      // 3. Get the VAPID public key from the server
      const keyRes = await axios.get(
        `${API_URL}/notifications/vapid-public-key`,
      );
      const vapidKey = keyRes.data.publicKey;
      if (!vapidKey) return;

      // 4. Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey)
          .buffer as ArrayBuffer,
      });

      // 5. Send the subscription to our backend to save it
      await axios.post(
        `${API_URL}/notifications/subscribe`,
        { subscription },
        { withCredentials: true },
      );

      pushSetupDone.current = true;
      console.log("✅ Push notifications enabled");
    } catch (err) {
      // Non-fatal: in-app notifications still work even if push fails
      console.warn("Push setup skipped:", err);
    }
  }, []);

  // ── On mount: fetch, set up push, then poll every 30s ───────────────────────
  useEffect(() => {
    fetchNotifications();
    setupPush();

    const interval = setInterval(fetchNotifications, 30_000);
    return () => clearInterval(interval);
  }, [fetchNotifications, setupPush]);

  return {
    notifications,
    unreadCount,
    loading,
    markRead,
    markAllRead,
    refetch: fetchNotifications,
  };
}
