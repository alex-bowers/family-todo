import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  isWeeklyNotificationEnabled,
  setWeeklyNotificationEnabled,
  notificationsSupported,
  getNotificationPermission,
} from "$lib/utils/notifications";

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
