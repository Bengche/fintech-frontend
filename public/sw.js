/**
 * sw.js — Fonlok Service Worker
 *
 * Responsibilities:
 *  1. PWA offline support  — cache-first static assets, network-first pages
 *  2. Offline fallback     — serve /offline when navigation fails offline
 *  3. Push notifications   — show native alerts from the backend
 *  4. Notification clicks  — route the user to the right page
 *
 * Cache strategy summary
 * ┌──────────────────────────────┬──────────────────────────┐
 * │ Request type                 │ Strategy                 │
 * ├──────────────────────────────┼──────────────────────────┤
 * │ HTML navigation (pages)      │ Network-first            │
 * │   └─ offline fallback        │   → /offline page        │
 * │ Static assets (JS/CSS/fonts) │ Stale-while-revalidate   │
 * │ Images / icons               │ Cache-first (7 days)     │
 * │ API calls  (/api/)           │ Network-only (never cache│
 * │                              │ sensitive fintech data)  │
 * └──────────────────────────────┴──────────────────────────┘
 *
 * Cross-browser notes:
 *  - iOS Safari 16.4+: full SW support. Older iOS: graceful degradation.
 *  - Firefox/Samsung Internet/Opera: SW + caching + push all supported.
 */

// ── Cache names — bump CACHE_VERSION to invalidate all caches on deploy ───────
const CACHE_VERSION    = "v2";
const SHELL_CACHE      = `fonlok-shell-${CACHE_VERSION}`;
const ASSET_CACHE      = `fonlok-assets-${CACHE_VERSION}`;
const IMAGE_CACHE      = `fonlok-images-${CACHE_VERSION}`;

// ── App shell — precached during SW install ───────────────────────────────────
const PRECACHE_URLS = [
  "/offline",
  "/",
  "/login",
  "/register",
  "/manifest.webmanifest",
  "/favicon.ico",
  "/favicon.png",
  "/icon-192.png",
  "/apple-touch-icon.png",
];

// ── Notification type → destination URL ───────────────────────────────────────
const TYPE_TO_URL = {
  invoice_paid:       "/dashboard",
  payout_sent:        "/dashboard",
  dispute_opened:     "/dashboard",
  milestone_released: "/dashboard",
  new_message:        "/dashboard",
  default:            "/dashboard",
};


// ═══════════════════════════════════════════════════════════════════════════════
// LIFECYCLE — Install
// ═══════════════════════════════════════════════════════════════════════════════
self.addEventListener("install", (event) => {
  self.skipWaiting();

  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) =>
      Promise.allSettled(
        PRECACHE_URLS.map((url) =>
          cache.add(new Request(url, { cache: "reload" })).catch((err) =>
            console.warn(`[SW] Failed to precache ${url}:`, err)
          )
        )
      )
    )
  );
});


// ═══════════════════════════════════════════════════════════════════════════════
// LIFECYCLE — Activate
// ═══════════════════════════════════════════════════════════════════════════════
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter(
            (k) =>
              k.startsWith("fonlok-") &&
              k !== SHELL_CACHE &&
              k !== ASSET_CACHE &&
              k !== IMAGE_CACHE
          )
          .map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});


// ═══════════════════════════════════════════════════════════════════════════════
// FETCH — Route incoming requests
// ═══════════════════════════════════════════════════════════════════════════════
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (url.origin !== self.location.origin) return;
  if (!url.protocol.startsWith("http")) return;

  // API & auth — network-only, never cache sensitive financial data
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/auth/")) {
    return;
  }

  // HTML navigation — network-first with offline fallback
  if (request.mode === "navigate") {
    event.respondWith(networkFirstWithOfflineFallback(request));
    return;
  }

  // Images — cache-first (7-day TTL)
  if (request.destination === "image") {
    event.respondWith(cacheFirstImage(request));
    return;
  }

  // JS / CSS / fonts — stale-while-revalidate
  if (
    request.destination === "script" ||
    request.destination === "style"   ||
    request.destination === "font"
  ) {
    event.respondWith(staleWhileRevalidate(request, ASSET_CACHE));
    return;
  }

  // Everything else — network with cache fallback
  event.respondWith(networkWithCacheFallback(request));
});


// ═══════════════════════════════════════════════════════════════════════════════
// STRATEGY HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

async function networkFirstWithOfflineFallback(request) {
  const cache = await caches.open(SHELL_CACHE);
  try {
    const networkResponse = await fetchWithTimeout(request, 5000);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone()).catch(() => {});
    }
    return networkResponse;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    const offline = await cache.match("/offline");
    if (offline) return offline;
    return new Response(
      "<h1 style='font-family:sans-serif;padding:2rem;color:#0F1F3D'>You are offline</h1>",
      { headers: { "Content-Type": "text/html" } }
    );
  }
}

async function cacheFirstImage(request) {
  const cache = await caches.open(IMAGE_CACHE);
  const cached = await cache.match(request);
  if (cached) {
    const fetchedAt = cached.headers.get("sw-fetched-at");
    const age = fetchedAt ? Date.now() - parseInt(fetchedAt, 10) : Infinity;
    if (age < 7 * 24 * 60 * 60 * 1000) return cached;
  }
  try {
    const response = await fetch(request);
    if (response.ok) {
      const headers = new Headers(response.headers);
      headers.set("sw-fetched-at", String(Date.now()));
      const cloned = new Response(await response.blob(), {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
      cache.put(request, cloned).catch(() => {});
    }
    return response;
  } catch {
    return cached || Response.error();
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone()).catch(() => {});
      return response;
    })
    .catch(() => null);
  return cached || (await fetchPromise) || Response.error();
}

async function networkWithCacheFallback(request) {
  const cache = await caches.open(ASSET_CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone()).catch(() => {});
    return response;
  } catch {
    const cached = await cache.match(request);
    return cached || Response.error();
  }
}

function fetchWithTimeout(request, ms) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`SW fetch timeout after ${ms}ms`)),
      ms
    );
    fetch(request)
      .then((r) => { clearTimeout(timer); resolve(r); })
      .catch((e) => { clearTimeout(timer); reject(e); });
  });
}


// ═══════════════════════════════════════════════════════════════════════════════
// PUSH NOTIFICATIONS
// ═══════════════════════════════════════════════════════════════════════════════
self.addEventListener("push", (event) => {
  let data = { title: "Fonlok", body: "You have a new notification.", type: "default" };

  if (event.data) {
    try { data = { ...data, ...JSON.parse(event.data.text()) }; }
    catch { data.body = event.data.text(); }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body:     data.body,
      icon:     "/icon-192.png",
      badge:    "/badge-72.png",
      tag:      data.type || "fonlok",
      renotify: true,
      data: {
        url:  TYPE_TO_URL[data.type] || TYPE_TO_URL.default,
        type: data.type,
      },
      vibrate: [200, 100, 200],
      actions: [
        { action: "open",    title: "View" },
        { action: "dismiss", title: "Dismiss" },
      ],
    })
  );
});


// ═══════════════════════════════════════════════════════════════════════════════
// NOTIFICATION CLICK
// ═══════════════════════════════════════════════════════════════════════════════
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  if (event.action === "dismiss") return;

  const targetUrl = event.notification.data?.url || "/dashboard";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.startsWith(self.location.origin) && "focus" in client) {
            client.focus();
            if ("navigate" in client) client.navigate(targetUrl);
            return;
          }
        }
        if (clients.openWindow) return clients.openWindow(targetUrl);
      })
  );
});

self.addEventListener("notificationclose", () => {
  /* Analytics hook — log dismissals here if needed */
});
