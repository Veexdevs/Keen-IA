/**
 * Keew IA — service worker (offline shell).
 * Strategy: network-first for documents/API, cache-first for static assets.
 * The local reasoning core keeps working with no connection at all.
 */
/* Bumped whenever a shell file changes meaning. v2: the manifest moved from
 * "standalone" to "browser", and anyone holding the v1 copy kept opening the
 * site with no browser chrome. Bumping the name deletes the old cache on
 * activate, which is the only way to unstick a visitor who already installed. */
const VERSION = "keew-v2";
const SHELL = ["/", "/manifest.webmanifest", "/mark.svg", "/icons/app-icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(VERSION).then((cache) => cache.addAll(SHELL).catch(() => undefined)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // never cache the gateway or mutation endpoints
  if (url.pathname.startsWith("/api/") && !url.pathname.endsWith("/health")) return;

  /* The manifest decides whether the site opens in a tab or as an app. Serving
     it cache-first meant a corrected "display" never reached anyone who had
     visited before — the browser kept reading the old one and kept going
     fullscreen. It is 500 bytes: always ask the network, fall back to cache. */
  if (url.pathname === "/manifest.webmanifest") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put(request, copy));
          return res;
        })
        .catch(() => caches.match(request)),
    );
    return;
  }

  if (request.mode === "navigate" || request.destination === "document") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put(request, copy));
          return res;
        })
        .catch(() => caches.match(request).then((hit) => hit || caches.match("/"))),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((hit) => {
      if (hit) return hit;
      return fetch(request).then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put(request, copy));
        }
        return res;
      });
    }),
  );
});
