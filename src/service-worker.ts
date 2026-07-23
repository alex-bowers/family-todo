const APP_CACHE = "familytodo-app-v2";
const ASSET_PATHS = ["/", "/app.webmanifest", "/favicon.ico", "/icons/icon.svg", "/icons/icon-192.png", "/icons/icon-512.png"];

// Household ID and Supabase config for pushsubscriptionchange handling
let householdId: string | null = null;
let supabaseUrl: string | null = null;
let supabaseAnonKey: string | null = null;

/**
 * Upsert a push subscription to Supabase via REST API.
 */
async function upsertSubscription(
  endpoint: string,
  p256dh: string,
  auth: string,
  hid: string,
): Promise<void> {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Supabase config not available in service worker");
    return;
  }

  const url = `${supabaseUrl}/rest/v1/push_subscriptions`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
      Prefer: "resolution=merge-duplicates",
    },
    body: JSON.stringify({
      household_id: hid,
      endpoint,
      p256dh,
      auth,
    }),
  });

  if (!response.ok) {
    console.error("Failed to upsert push subscription:", response.status);
  }
}

/**
 * Delete a push subscription from Supabase via REST API.
 */
async function deleteSubscriptionFromSupabase(endpoint: string): Promise<void> {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Supabase config not available in service worker");
    return;
  }

  const url = `${supabaseUrl}/rest/v1/push_subscriptions?endpoint=eq.${encodeURIComponent(endpoint)}`;
  const response = await fetch(url, {
    method: "DELETE",
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
    },
  });

  if (!response.ok) {
    console.error("Failed to delete push subscription:", response.status);
  }
}

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

self.addEventListener("push", (event) => {
  console.log("[SW] Push event received", event.data ? "with data" : "no data");

  let payload: unknown = {};
  try {
    payload = event.data ? event.data.json() : {};
    console.log("[SW] Push payload parsed:", payload);
  } catch (e) {
    console.error("[SW] Failed to parse push payload:", e);
    payload = {};
  }

  const data =
    typeof payload === "object" && payload !== null
      ? (payload as Record<string, unknown>)
      : {};

  const title = typeof data.title === "string" ? data.title : "FamilyToDo";
  const body =
    typeof data.body === "string"
      ? data.body
      : "Has everything been added to the shopping list?";
  const tag =
    typeof data.tag === "string" ? data.tag : "familytodo-weekly-reminder";

  event.waitUntil(
    (async () => {
      if (Notification.permission !== "granted") {
        console.warn("[SW] Push received but notification permission not granted");
        return;
      }
      console.log("[SW] Showing notification:", title);
      await self.registration.showNotification(title, {
        body,
        icon: "/icons/icon-192.png",
        badge: "/icons/icon-192.png",
        tag,
        requireInteraction: false,
      });
    })(),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.startsWith(self.location.origin) && "focus" in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow("/");
      }
    }),
  );
});

// Listen for messages from the main app (household_id and Supabase config)
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SET_HOUSEHOLD_ID") {
    householdId = event.data.householdId;
  }
  if (event.data && event.data.type === "SET_SUPABASE_CONFIG") {
    supabaseUrl = event.data.url;
    supabaseAnonKey = event.data.anonKey;
  }
});

// Handle push subscription changes (browser rotation, etc.)
self.addEventListener("pushsubscriptionchange", (event) => {
  const changeEvent = event as PushSubscriptionChangeEvent;

  event.waitUntil(
    (async () => {
      const registration = self.registration;

      if (changeEvent.newSubscription) {
        const newSub = changeEvent.newSubscription;
        const endpoint = newSub.endpoint;
        const key = newSub.getKey("p256dh");
        const auth = newSub.getKey("auth");

        if (key && auth && householdId) {
          const p256dh = btoa(String.fromCharCode(...new Uint8Array(key)));
          const authBase64 = btoa(String.fromCharCode(...new Uint8Array(auth)));
          await upsertSubscription(endpoint, p256dh, authBase64, householdId);
        }

        if (changeEvent.oldSubscription) {
          await deleteSubscriptionFromSupabase(changeEvent.oldSubscription.endpoint);
        }
      } else if (changeEvent.oldSubscription && householdId) {
        // Attempt to resubscribe
        try {
          const vapidPublicKey = await fetch("/app.webmanifest")
            .then((r) => r.json())
            .then((m) => m.vapid_public_key)
            .catch(() => null);

          if (vapidPublicKey) {
            const newSub = await registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
            });

            const endpoint = newSub.endpoint;
            const key = newSub.getKey("p256dh");
            const auth = newSub.getKey("auth");

            if (key && auth) {
              const p256dh = btoa(String.fromCharCode(...new Uint8Array(key)));
              const authBase64 = btoa(String.fromCharCode(...new Uint8Array(auth)));
              await upsertSubscription(endpoint, p256dh, authBase64, householdId);
            }

            await deleteSubscriptionFromSupabase(changeEvent.oldSubscription.endpoint);
          }
        } catch (error) {
          console.error("Failed to resubscribe after pushsubscriptionchange:", error);
        }
      }
    })(),
  );
});

/**
 * Convert a base64url string to a Uint8Array.
 */
function urlBase64ToUint8Array(base64url: string): Uint8Array {
  const padding = "=".repeat((4 - (base64url.length % 4)) % 4);
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/") + padding;
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
