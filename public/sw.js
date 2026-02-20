/**
 * sw.js — Fonlok Service Worker
 *
 * Handles browser push notifications sent from the backend via web-push.
 * This file MUST be in the /public folder so it is served at the root
 * of your site (https://fonlok.com/sw.js).
 *
 * How it works:
 *   1. The browser receives a push event from the server
 *   2. The service worker shows a native browser notification
 *   3. When the user clicks the notification, they are sent to the right page
 */

// ── Map notification types to the page the user should go to ─────────────────
const typeToUrl = {
  invoice_paid: "/dashboard",
  payout_sent: "/dashboard",
  dispute_opened: "/dashboard",
  milestone_released: "/dashboard",
  new_message: "/dashboard",
  default: "/dashboard",
};

// ── Push event — show the notification ────────────────────────────────────────
self.addEventListener("push", (event) => {
  let data = {
    title: "Fonlok",
    body: "You have a new notification.",
    type: "default",
  };

  if (event.data) {
    try {
      data = JSON.parse(event.data.text());
    } catch {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: "/icon-192.png", // Add a 192×192 icon to /public for best results
    badge: "/badge-72.png", // Small monochrome icon shown in status bar (optional)
    tag: data.type || "fonlok-notification", // Replaces previous notification of the same type
    renotify: true,
    data: { url: typeToUrl[data.type] || typeToUrl.default, type: data.type },
    vibrate: [200, 100, 200],
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// ── Notification click — open the right page ──────────────────────────────────
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || "/dashboard";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // If the app is already open, focus it and navigate.
        // client.navigate() is Chrome/Firefox only — not supported in Safari,
        // so we guard with "navigate" in client before calling it.
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            client.focus();
            if ("navigate" in client) {
              client.navigate(targetUrl);
            } else {
              // Safari fallback: open a new window/tab to the target URL
              clients.openWindow(targetUrl);
            }
            return;
          }
        }
        // No existing window found — open a new tab
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      }),
  );
});

// ── Install / Activate — claim clients immediately ────────────────────────────
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});
