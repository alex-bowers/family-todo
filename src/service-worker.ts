const APP_CACHE = "familytodo-app-v2";
const ASSET_PATHS = ["/", "/app.webmanifest", "/favicon.ico", "/icons/icon.svg", "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(APP_CACHE).then((cache) => {
      return cache.addAll(ASSET_PATHS);
    }),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then(async (keys) => {
      await Promise.all(
        keys
          .filter((key) => key !== APP_CACHE)
          .map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    }),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(async (cached) => {
      if (cached) {
        return cached;
      }

      try {
        const networkResponse = await fetch(event.request);
        if (
          networkResponse.ok &&
          event.request.url.startsWith(self.location.origin)
        ) {
          const cache = await caches.open(APP_CACHE);
          cache.put(event.request, networkResponse.clone());
        }
        return networkResponse;
      } catch {
        return new Response("Offline", {
          status: 503,
          statusText: "Offline",
        });
      }
    }),
  );
});

self.addEventListener("sync", (event) => {
  if (event.tag === "familytodo-sync-queue") {
    event.waitUntil(Promise.resolve());
  }
});
