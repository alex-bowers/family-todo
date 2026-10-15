import { logger } from "./logger";
import { getSupabaseClient } from "$lib/supabase/client";

const NOTIFICATION_PREF_KEY = "familytodo:weekly-notification-enabled";
const PUSH_PREF_KEY = "familytodo:push-subscription-enabled";

/**
 * Check if the Notifications API is supported in this browser.
 */
export function notificationsSupported(): boolean {
  return typeof Notification !== "undefined";
}

/**
 * Request permission to show notifications.
 * Returns the current permission state.
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!notificationsSupported()) {
    return "denied";
  }

  if (Notification.permission === "granted") {
    return "granted";
  }

  if (Notification.permission === "denied") {
    return "denied";
  }

  const result = await Notification.requestPermission();
  logger.info("Notification permission result", { permission: result });
  return result;
}

/**
 * Get the current notification permission without prompting.
 */
export function getNotificationPermission(): NotificationPermission {
  if (!notificationsSupported()) {
    return "denied";
  }
  return Notification.permission;
}

/**
 * Read whether weekly notifications are enabled.
 */
export function isWeeklyNotificationEnabled(): boolean {
  if (typeof localStorage === "undefined") return false;
  return localStorage.getItem(NOTIFICATION_PREF_KEY) === "true";
}

/**
 * Enable or disable weekly notifications.
 */
export function setWeeklyNotificationEnabled(enabled: boolean): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(NOTIFICATION_PREF_KEY, String(enabled));
  logger.info("Weekly notification preference updated", { enabled });
}

// ---------------------------------------------------------------------------
// Push subscription helpers
// ---------------------------------------------------------------------------

/**
 * Convert a base64url string to a Uint8Array.
 * Required for the Push API applicationServerKey.
 */
export function urlBase64ToUint8Array(base64url: string): Uint8Array {
  const padding = "=".repeat((4 - (base64url.length % 4)) % 4);
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/") + padding;
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Check if the Push API is supported in this browser.
 */
export function pushSupported(): boolean {
  return typeof window !== "undefined" && "PushManager" in window;
}

/**
 * Get the current push subscription if one exists.
 */
export async function getPushSubscription(): Promise<PushSubscription | null> {
  if (!pushSupported()) {
    return null;
  }
  const registration = await navigator.serviceWorker.ready;
  return registration.pushManager.getSubscription();
}

/**
 * Subscribe the current device to push notifications and store the
 * subscription in Supabase.
 *
 * Returns the PushSubscription on success, or null on failure.
 */
export async function subscribeToPushNotifications(
  householdId: string,
): Promise<PushSubscription | null> {
  if (!pushSupported()) {
    logger.warn("Push API not supported");
    return null;
  }

  const vapidPublicKey = import.meta.env.PUBLIC_VAPID_PUBLIC_KEY;
  if (typeof vapidPublicKey !== "string" || !vapidPublicKey) {
    logger.error("VAPID public key is not configured");
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });

    const endpoint = subscription.endpoint;
    const key = subscription.getKey("p256dh");
    const auth = subscription.getKey("auth");

    if (!key || !auth) {
      logger.error("Push subscription missing keys");
      return null;
    }

    const p256dh = btoa(String.fromCharCode(...new Uint8Array(key)));
    const authBase64 = btoa(String.fromCharCode(...new Uint8Array(auth)));

    const client = getSupabaseClient();
    if (!client) {
      logger.error("Supabase client not available");
      return null;
    }

    const { error } = await client.from("push_subscriptions").upsert(
      {
        household_id: householdId,
        endpoint,
        p256dh,
        auth: authBase64,
      },
      { onConflict: "endpoint" },
    );

    if (error) {
      logger.error("Failed to store push subscription", { error });
      return null;
    }

    // Notify service worker of household_id for pushsubscriptionchange handling
    if ("serviceWorker" in navigator) {
      const swRegistration = await navigator.serviceWorker.ready;
      if (swRegistration.active) {
        swRegistration.active.postMessage({
          type: "SET_HOUSEHOLD_ID",
          householdId,
        });
      }
    }

    logger.info("Push subscription stored", { endpoint });
    return subscription;
  } catch (error) {
    logger.error("Failed to subscribe to push notifications", { error });
    return null;
  }
}

/**
 * Unsubscribe the current device from push notifications and remove the
 * subscription from Supabase.
 */
export async function unsubscribeFromPushNotifications(): Promise<void> {
  if (!pushSupported()) {
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      await subscription.unsubscribe();

      const client = getSupabaseClient();
      if (client) {
        const { error } = await client
          .from("push_subscriptions")
          .delete()
          .eq("endpoint", subscription.endpoint);

        if (error) {
          logger.error("Failed to delete push subscription", { error });
        } else {
          logger.info("Push subscription deleted", {
            endpoint: subscription.endpoint,
          });
        }
      }
    }
  } catch (error) {
    logger.error("Failed to unsubscribe from push notifications", { error });
  }
}

/**
 * Read whether push notifications are enabled.
 */
export function isPushNotificationEnabled(): boolean {
  if (typeof localStorage === "undefined") return false;
  return localStorage.getItem(PUSH_PREF_KEY) === "true";
}

/**
 * Enable or disable push notifications preference.
 */
export function setPushNotificationEnabled(enabled: boolean): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(PUSH_PREF_KEY, String(enabled));
  logger.info("Push notification preference updated", { enabled });
}
