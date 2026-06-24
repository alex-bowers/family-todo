import { logger } from "./logger";

const NOTIFICATION_PREF_KEY = "familytodo:weekly-notification-enabled";
const NOTIFICATION_LAST_SHOWN_KEY = "familytodo:weekly-notification-last-shown";

/** UK timezone identifier */
const UK_TIMEZONE = "Europe/London";

/** Target: Sunday at 18:05 UK time */
const TARGET_DAY = 0; // Sunday
const TARGET_HOUR = 18;
const TARGET_MINUTE = 5;

export interface NotificationSchedule {
  nextScheduledAt: Date;
}

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
 * Show the weekly reminder notification immediately.
 * Uses the service worker when available (required for PWAs),
 * falling back to the page-level Notification constructor.
 */
export async function showWeeklyReminder(): Promise<void> {
  if (!notificationsSupported() || Notification.permission !== "granted") {
    logger.warn("Cannot show notification: permission not granted");
    return;
  }

  try {
    // Prefer service worker notification — required for reliable display in PWAs
    if ("serviceWorker" in navigator) {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification("FamilyToDo", {
        body: "Has everything been added to the shopping list?",
        icon: "/icons/icon-192.png",
        badge: "/icons/icon-192.png",
        tag: "familytodo-weekly-reminder",
        requireInteraction: false,
      });
      logger.info("Weekly reminder notification shown via service worker");
      return;
    }

    // Fallback for browsers without service worker support
    const notification = new Notification("FamilyToDo", {
      body: "Has everything been added to the shopping list?",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      tag: "familytodo-weekly-reminder",
      requireInteraction: false,
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    logger.info("Weekly reminder notification shown");
  } catch (error) {
    logger.error("Failed to show notification", { error });
  }
}

/**
 * Calculate the next occurrence of Sunday 18:05 UK time.
 */
export function getNextSundayAt1805UK(from: Date = new Date()): Date {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: UK_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  // Parse UK time parts
  const parts = formatter.formatToParts(from);
  const getPart = (type: string) =>
    parseInt(parts.find((p) => p.type === type)?.value ?? "0", 10);

  const year = getPart("year");
  const month = getPart("month");
  const day = getPart("day");
  const hour = getPart("hour");
  const minute = getPart("minute");

  // Find next Sunday
  const currentDay = new Date(
    Date.UTC(year, month - 1, day, 0, 0, 0),
  ).getUTCDay();
  let daysUntilSunday = TARGET_DAY - currentDay;
  if (daysUntilSunday < 0) {
    daysUntilSunday += 7;
  }

  // If it's already Sunday and past 18:05, move to next Sunday
  if (
    daysUntilSunday === 0 &&
    (hour > TARGET_HOUR || (hour === TARGET_HOUR && minute >= TARGET_MINUTE))
  ) {
    daysUntilSunday = 7;
  }

  // Calculate target date in UK time
  const targetDate = new Date(
    Date.UTC(year, month - 1, day + daysUntilSunday, TARGET_HOUR, TARGET_MINUTE, 0),
  );

  // Adjust for UK timezone offset by parsing the target through the formatter
  // This handles BST/GMT transitions
  const targetParts = formatter.formatToParts(targetDate);
  const targetYear = parseInt(
    targetParts.find((p) => p.type === "year")?.value ?? String(year),
    10,
  );
  const targetMonth = parseInt(
    targetParts.find((p) => p.type === "month")?.value ?? String(month),
    10,
  );
  const targetDay = parseInt(
    targetParts.find((p) => p.type === "day")?.value ?? String(day + daysUntilSunday),
    10,
  );

  // Build a UTC "guess" for the target wall-clock time, then adjust it by the
  // Europe/London offset at that instant (handles GMT/BST correctly).
  const utcGuessMs = Date.UTC(
    targetYear,
    targetMonth - 1,
    targetDay,
    TARGET_HOUR,
    TARGET_MINUTE,
    0,
  );

  const offsetParts = formatter.formatToParts(new Date(utcGuessMs));
  const getOffsetPart = (type: string) =>
    parseInt(offsetParts.find((p) => p.type === type)?.value ?? "0", 10);
  const asIfUtcMs = Date.UTC(
    getOffsetPart("year"),
    getOffsetPart("month") - 1,
    getOffsetPart("day"),
    getOffsetPart("hour"),
    getOffsetPart("minute"),
    getOffsetPart("second"),
  );
  const ukOffsetMs = asIfUtcMs - utcGuessMs;

  return new Date(utcGuessMs - ukOffsetMs);
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

/**
 * Get the last shown timestamp (ISO string or null).
 */
export function getLastShownTimestamp(): string | null {
  if (typeof localStorage === "undefined") return null;
  return localStorage.getItem(NOTIFICATION_LAST_SHOWN_KEY);
}

/**
 * Mark the weekly reminder as shown now.
 */
export function markWeeklyReminderShown(): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(NOTIFICATION_LAST_SHOWN_KEY, new Date().toISOString());
}

/**
 * Check if we should show the weekly reminder (missed it while app was closed).
 * Returns true if notifications are enabled and we haven't shown one for the current week.
 */
export function shouldShowWeeklyReminder(): boolean {
  if (!isWeeklyNotificationEnabled()) return false;
  if (getNotificationPermission() !== "granted") return false;

  const lastShown = getLastShownTimestamp();
  if (!lastShown) return true;

  const now = new Date();
  const lastShownDate = new Date(lastShown);

  // Get the most recent Sunday 18:05 UK
  const mostRecentTarget = getNextSundayAt1805UK(now);
  // If mostRecentTarget is in the future, get the previous one
  if (mostRecentTarget.getTime() > now.getTime()) {
    const previousWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const previousTarget = getNextSundayAt1805UK(previousWeek);
    return lastShownDate.getTime() < previousTarget.getTime();
  }

  return lastShownDate.getTime() < mostRecentTarget.getTime();
}

/**
 * Schedule the weekly notification.
 * Returns a cleanup function to cancel the timeout.
 */
export function scheduleWeeklyNotification(): () => void {
  if (!isWeeklyNotificationEnabled()) {
    return () => {};
  }

  if (getNotificationPermission() !== "granted") {
    return () => {};
  }

  // Check if we missed one while the app was closed
  if (shouldShowWeeklyReminder()) {
    void (async () => {
      await showWeeklyReminder();
      markWeeklyReminderShown();
    })();
  }

  const next = getNextSundayAt1805UK();
  const now = new Date();
  const delayMs = next.getTime() - now.getTime();

  if (delayMs <= 0) {
    return () => {};
  }

  logger.info("Scheduling next weekly notification", {
    nextScheduledAt: next.toISOString(),
    delayMs,
  });

  const timeoutId = setTimeout(() => {
    if (isWeeklyNotificationEnabled() && getNotificationPermission() === "granted") {
      void (async () => {
        await showWeeklyReminder();
        markWeeklyReminderShown();
      })();
    }
    // Re-schedule for next week
    scheduleWeeklyNotification();
  }, delayMs);

  return () => clearTimeout(timeoutId);
}
