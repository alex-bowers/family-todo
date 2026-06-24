import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getNextSundayAt1805UK,
  shouldShowWeeklyReminder,
  isWeeklyNotificationEnabled,
  setWeeklyNotificationEnabled,
  getLastShownTimestamp,
  markWeeklyReminderShown,
  notificationsSupported,
  getNotificationPermission,
  scheduleWeeklyNotification,
} from "$lib/utils/notifications";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Create a Date at a given UTC instant expressed as ISO-like components. */
function utcDate(
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0,
  second = 0,
): Date {
  return new Date(Date.UTC(year, month - 1, day, hour, minute, second));
}

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const localStorageStore: Record<string, string> = {};

beforeEach(() => {
  vi.useFakeTimers();
  // Mock localStorage
  vi.stubGlobal("localStorage", {
    getItem: vi.fn((key: string) => localStorageStore[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      localStorageStore[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete localStorageStore[key];
    }),
    clear: vi.fn(() => {
      for (const key of Object.keys(localStorageStore)) {
        delete localStorageStore[key];
      }
    }),
    get length() {
      return Object.keys(localStorageStore).length;
    },
  });
  // Mock Notification API
  vi.stubGlobal("Notification", {
    permission: "granted",
    requestPermission: vi.fn().mockResolvedValue("granted"),
  });
  vi.stubGlobal("navigator", {
    serviceWorker: {
      ready: Promise.resolve({
        showNotification: vi.fn().mockResolvedValue(undefined),
      }),
    },
  });
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  for (const key of Object.keys(localStorageStore)) {
    delete localStorageStore[key];
  }
});

// ---------------------------------------------------------------------------
// getNextSundayAt1805UK
// ---------------------------------------------------------------------------

describe("getNextSundayAt1805UK", () => {
  it("returns the same Sunday 18:05 when called well before the target time", () => {
    // Wednesday 18 June 2026 10:00 UTC = Wednesday 18 June 2026 11:00 BST
    // Next Sunday is 22 June 2026 at 18:05 BST
    const from = utcDate(2026, 6, 18, 10, 0, 0);
    const result = getNextSundayAt1805UK(from);

    // The result should be a Sunday
    expect(result.getUTCDay()).toBe(0); // Sunday

    // It should be in the future relative to `from`
    expect(result.getTime()).toBeGreaterThan(from.getTime());

    // Should be within 7 days
    const diffDays =
      (result.getTime() - from.getTime()) / (1000 * 60 * 60 * 24);
    expect(diffDays).toBeLessThanOrEqual(7);
  });

  it("returns next Sunday when called on a Sunday after 18:05 UK time", () => {
    // Sunday 22 March 2026 18:10 UTC
    // In March, UK is in GMT, so 18:10 UTC = 18:10 GMT
    // This is after 18:05 UK time, so should roll to next Sunday
    const from = utcDate(2026, 3, 22, 18, 10, 0);
    const result = getNextSundayAt1805UK(from);

    // Should be the NEXT Sunday (29 March 2026)
    expect(result.getUTCDate()).toBe(29);
    expect(result.getUTCMonth()).toBe(2); // March = 2
  });

  it("returns today's Sunday when called on a Sunday before 18:05 UK time", () => {
    // Sunday 22 March 2026 17:00 UTC
    // In March, UK is in GMT, so 17:00 UTC = 17:00 GMT
    // This is before 18:05 UK time, so should return today
    const from = utcDate(2026, 3, 22, 17, 0, 0);
    const result = getNextSundayAt1805UK(from);

    // Should be the same Sunday (22 March 2026) at 18:05
    expect(result.getUTCDate()).toBe(22);
    expect(result.getUTCMonth()).toBe(2); // March = 2
  });

  // --- DST boundary tests ---

  it("handles spring-forward DST transition (GMT → BST) correctly", () => {
    // Clocks go forward in the UK on the last Sunday of March.
    // In 2026, that's Sunday 29 March 2026 at 01:00 GMT → 02:00 BST.
    //
    // Call from Saturday 28 March 2026 20:00 UTC (= 20:00 GMT)
    // Next Sunday is 29 March, which is the day DST starts.
    // At 18:05 BST on 29 March, the UTC time is 17:05 UTC.
    const from = utcDate(2026, 3, 28, 20, 0, 0);
    const result = getNextSundayAt1805UK(from);

    // Result should be 29 March 2026 at 17:05 UTC (= 18:05 BST)
    expect(result.getUTCDate()).toBe(29);
    expect(result.getUTCMonth()).toBe(2); // March
    expect(result.getUTCHours()).toBe(17); // 17:05 UTC = 18:05 BST
    expect(result.getUTCMinutes()).toBe(5);
  });

  it("handles fall-back DST transition (BST → GMT) correctly", () => {
    // Clocks go back in the UK on the last Sunday of October.
    // In 2026, that's Sunday 25 October 2026 at 02:00 BST → 01:00 GMT.
    //
    // Call from Saturday 24 October 2026 20:00 UTC (= 21:00 BST)
    // Next Sunday is 25 October, which is the day DST ends.
    // At 18:05 GMT on 25 October, the UTC time is 18:05 UTC.
    const from = utcDate(2026, 10, 24, 20, 0, 0);
    const result = getNextSundayAt1805UK(from);

    // Result should be 25 October 2026 at 18:05 UTC (= 18:05 GMT)
    expect(result.getUTCDate()).toBe(25);
    expect(result.getUTCMonth()).toBe(9); // October
    expect(result.getUTCHours()).toBe(18); // 18:05 UTC = 18:05 GMT
    expect(result.getUTCMinutes()).toBe(5);
  });

  it("handles a date in summer (BST) correctly", () => {
    // Thursday 16 July 2026 12:00 UTC = 13:00 BST
    // Next Sunday is 19 July 2026 at 18:05 BST = 17:05 UTC
    const from = utcDate(2026, 7, 16, 12, 0, 0);
    const result = getNextSundayAt1805UK(from);

    expect(result.getUTCDate()).toBe(19);
    expect(result.getUTCMonth()).toBe(6); // July
    expect(result.getUTCHours()).toBe(17); // 17:05 UTC = 18:05 BST
    expect(result.getUTCMinutes()).toBe(5);
  });

  it("handles a date in winter (GMT) correctly", () => {
    // Wednesday 13 January 2026 09:00 UTC = 09:00 GMT
    // Next Sunday is 18 January 2026 at 18:05 GMT = 18:05 UTC
    const from = utcDate(2026, 1, 13, 9, 0, 0);
    const result = getNextSundayAt1805UK(from);

    expect(result.getUTCDate()).toBe(18);
    expect(result.getUTCMonth()).toBe(0); // January
    expect(result.getUTCHours()).toBe(18); // 18:05 UTC = 18:05 GMT
    expect(result.getUTCMinutes()).toBe(5);
  });

  it("returns a result that is always in the future relative to `from`", () => {
    // Test several random dates to ensure the result is always > from
    const testDates = [
      utcDate(2026, 1, 1, 0, 0, 0),
      utcDate(2026, 6, 15, 12, 30, 0),
      utcDate(2026, 12, 25, 10, 0, 0),
      utcDate(2025, 3, 30, 0, 30, 0), // Day of spring DST
      utcDate(2025, 10, 26, 1, 30, 0), // Day of fall DST
    ];

    for (const from of testDates) {
      const result = getNextSundayAt1805UK(from);
      expect(result.getTime()).toBeGreaterThan(from.getTime());
    }
  });

  it("defaults to current date when no argument is provided", () => {
    // Set system time to a known date
    vi.setSystemTime(utcDate(2026, 6, 18, 10, 0, 0)); // Wednesday

    const result = getNextSundayAt1805UK();
    expect(result.getTime()).toBeGreaterThan(utcDate(2026, 6, 18, 10, 0, 0).getTime());
    expect(result.getUTCDay()).toBe(0); // Sunday
  });
});

// ---------------------------------------------------------------------------
// shouldShowWeeklyReminder
// ---------------------------------------------------------------------------

describe("shouldShowWeeklyReminder", () => {
  it("returns false when notifications are disabled", () => {
    setWeeklyNotificationEnabled(false);
    const result = shouldShowWeeklyReminder();
    expect(result).toBe(false);
  });

  it("returns false when notification permission is not granted", () => {
    setWeeklyNotificationEnabled(true);
    vi.stubGlobal("Notification", {
      permission: "denied",
      requestPermission: vi.fn(),
    });
    const result = shouldShowWeeklyReminder();
    expect(result).toBe(false);
  });

  it("returns true when never shown before and notifications enabled", () => {
    setWeeklyNotificationEnabled(true);
    // getLastShownTimestamp returns null by default
    const result = shouldShowWeeklyReminder();
    expect(result).toBe(true);
  });

  it("returns false when reminder was already shown this week", () => {
    setWeeklyNotificationEnabled(true);

    // Set "now" to Sunday 21 June 2026 at 19:00 UTC (= 20:00 BST)
    // The next Sunday 18:05 UK after this is 28 June 2026
    // But we want to test: last shown was AFTER the most recent target
    vi.setSystemTime(utcDate(2026, 6, 21, 19, 0, 0));

    // Mark as shown "just now" (after the most recent Sunday 18:05)
    markWeeklyReminderShown();

    const result = shouldShowWeeklyReminder();
    expect(result).toBe(false);
  });

  it("returns true when last shown was before the most recent Sunday 18:05", () => {
    setWeeklyNotificationEnabled(true);

    // Set "now" to Sunday 21 June 2026 at 19:00 UTC
    vi.setSystemTime(utcDate(2026, 6, 21, 19, 0, 0));

    // Simulate last shown was Saturday (before this Sunday's 18:05)
    const lastShown = utcDate(2026, 6, 20, 10, 0, 0).toISOString();
    localStorageStore["familytodo:weekly-notification-last-shown"] = lastShown;

    const result = shouldShowWeeklyReminder();
    expect(result).toBe(true);
  });

  it("returns true when last shown was in a previous week", () => {
    setWeeklyNotificationEnabled(true);

    // Set "now" to Wednesday 24 June 2026 at 10:00 UTC
    vi.setSystemTime(utcDate(2026, 6, 24, 10, 0, 0));

    // Last shown was last Sunday (14 June 2026)
    const lastShown = utcDate(2026, 6, 14, 18, 30, 0).toISOString();
    localStorageStore["familytodo:weekly-notification-last-shown"] = lastShown;

    const result = shouldShowWeeklyReminder();
    expect(result).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// scheduleWeeklyNotification
// ---------------------------------------------------------------------------

describe("scheduleWeeklyNotification", () => {
  it("returns a no-op cleanup function when notifications are disabled", () => {
    setWeeklyNotificationEnabled(false);
    const cleanup = scheduleWeeklyNotification();
    expect(cleanup).toBeTypeOf("function");
    cleanup(); // Should not throw
  });

  it("returns a no-op cleanup function when permission is not granted", () => {
    setWeeklyNotificationEnabled(true);
    vi.stubGlobal("Notification", {
      permission: "denied",
      requestPermission: vi.fn(),
    });
    const cleanup = scheduleWeeklyNotification();
    expect(cleanup).toBeTypeOf("function");
    cleanup();
  });

  it("schedules a timeout for the next Sunday 18:05", () => {
    setWeeklyNotificationEnabled(true);

    // Set "now" to Wednesday 24 June 2026 at 10:00 UTC
    vi.setSystemTime(utcDate(2026, 6, 24, 10, 0, 0));

    const setTimeoutSpy = vi.spyOn(globalThis, "setTimeout");

    const cleanup = scheduleWeeklyNotification();

    // setTimeout should have been called with a positive delay
    expect(setTimeoutSpy).toHaveBeenCalled();
    const callArgs = setTimeoutSpy.mock.calls[0];
    const delay = callArgs?.[1] as number;
    expect(delay).toBeGreaterThan(0);

    cleanup();
  });
});

// ---------------------------------------------------------------------------
// localStorage helpers
// ---------------------------------------------------------------------------

describe("localStorage helpers", () => {
  it("isWeeklyNotificationEnabled returns false by default", () => {
    expect(isWeeklyNotificationEnabled()).toBe(false);
  });

  it("setWeeklyNotificationEnabled persists the value", () => {
    setWeeklyNotificationEnabled(true);
    expect(isWeeklyNotificationEnabled()).toBe(true);

    setWeeklyNotificationEnabled(false);
    expect(isWeeklyNotificationEnabled()).toBe(false);
  });

  it("getLastShownTimestamp returns null by default", () => {
    expect(getLastShownTimestamp()).toBeNull();
  });

  it("markWeeklyReminderShown stores an ISO timestamp", () => {
    vi.setSystemTime(utcDate(2026, 6, 24, 12, 0, 0));
    markWeeklyReminderShown();

    const stored = getLastShownTimestamp();
    expect(stored).not.toBeNull();
    expect(new Date(stored!).getTime()).toBe(utcDate(2026, 6, 24, 12, 0, 0).getTime());
  });
});

// ---------------------------------------------------------------------------
// notificationsSupported / getNotificationPermission
// ---------------------------------------------------------------------------

describe("notificationsSupported", () => {
  it("returns true when Notification is defined", () => {
    expect(notificationsSupported()).toBe(true);
  });

  it("returns false when Notification is undefined", () => {
    vi.stubGlobal("Notification", undefined);
    expect(notificationsSupported()).toBe(false);
  });
});

describe("getNotificationPermission", () => {
  it("returns the current permission state", () => {
    vi.stubGlobal("Notification", { permission: "granted" });
    expect(getNotificationPermission()).toBe("granted");
  });

  it("returns denied when Notification is not supported", () => {
    vi.stubGlobal("Notification", undefined);
    expect(getNotificationPermission()).toBe("denied");
  });
});