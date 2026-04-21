/* eslint-disable no-restricted-globals */
/**
 * Ne keširaj /_next/*: chunk imena se menjaju (HMR, rebuild) — SW keš
 * povećava 404 + „MIME text/plain” u konzoli na LAN/telefonu.
 */
const CACHE_STATIC = "smp-static-v4";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.map((k) => (k !== CACHE_STATIC ? caches.delete(k) : null))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/_next/")) return;
  if (
    url.pathname.startsWith("/icons/") ||
    url.pathname === "/manifest.webmanifest"
  ) {
    event.respondWith(
      caches.open(CACHE_STATIC).then(async (cache) => {
        const hit = await cache.match(req);
        if (hit) return hit;
        const res = await fetch(req);
        if (res.ok) cache.put(req, res.clone());
        return res;
      })
    );
  }
});

self.addEventListener("push", (event) => {
  let data = {
    title: "Salon Manager PRO",
    body: "",
    url: "/dashboard",
  };
  try {
    if (event.data) {
      const json = event.data.json();
      Object.assign(data, json);
    }
  } catch (_) {
    try {
      const t = event.data && event.data.text();
      if (t) data.body = t;
    } catch (_) {}
  }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icons/pwa-icon.svg",
      badge: "/icons/pwa-icon.svg",
      tag: "salon-notification",
      data: { url: data.url || "/dashboard" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/dashboard";
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((list) => {
        const abs = new URL(url, self.location.origin).href;
        for (const c of list) {
          if (c.url.startsWith(abs.split("#")[0]) && "focus" in c) {
            return c.focus();
          }
        }
        if (self.clients.openWindow) return self.clients.openWindow(abs);
      })
  );
});
