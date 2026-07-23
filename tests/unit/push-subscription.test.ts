import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock the Supabase client before importing the module under test
const { mockFrom } = vi.hoisted(() => ({ mockFrom: vi.fn() }));
vi.mock("$lib/supabase/client", () => ({
  getSupabaseClient: vi.fn(() => ({ from: mockFrom })),
}));

import {
  urlBase64ToUint8Array,
  pushSupported,
  getPushSubscription,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
  isPushNotificationEnabled,
  setPushNotificationEnabled,
} from "$lib/utils/notifications";

const localStorageStore: Record<string, string> = {};

beforeEach(() => {
  mockFrom.mockReset();
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
});

afterEach(() => {
  vi.unstubAllGlobals();
  for (const key of Object.keys(localStorageStore)) {
    delete localStorageStore[key];
  }
});

// ---------------------------------------------------------------------------
// urlBase64ToUint8Array
// ---------------------------------------------------------------------------

describe("urlBase64ToUint8Array", () => {
  it("converts a base64url string to Uint8Array", () => {
    const input = "AQIDBA"; // base64url for [1, 2, 3, 4]
    const result = urlBase64ToUint8Array(input);
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result).toHaveLength(4);
    expect(Array.from(result)).toEqual([1, 2, 3, 4]);
  });

  it("handles strings requiring padding", () => {
    const input = "AQID"; // base64url for [1, 2, 3]
    const result = urlBase64ToUint8Array(input);
    expect(result).toHaveLength(3);
    expect(Array.from(result)).toEqual([1, 2, 3]);
  });
});

// ---------------------------------------------------------------------------
// pushSupported
// ---------------------------------------------------------------------------

describe("pushSupported", () => {
  it("returns true when PushManager is available", () => {
    vi.stubGlobal("window", { PushManager: vi.fn() });
    expect(pushSupported()).toBe(true);
  });

  it("returns false when PushManager is not available", () => {
    vi.stubGlobal("window", {});
    expect(pushSupported()).toBe(false);
  });

  it("returns false when window is undefined (SSR)", () => {
    vi.stubGlobal("window", undefined);
    expect(pushSupported()).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// getPushSubscription
// ---------------------------------------------------------------------------

describe("getPushSubscription", () => {
  it("returns null when PushManager is not supported", async () => {
    vi.stubGlobal("window", {});
    const result = await getPushSubscription();
    expect(result).toBeNull();
  });

  it("returns the current subscription when available", async () => {
    const mockSubscription = { endpoint: "https://example.com/push/1" } as PushSubscription;
    vi.stubGlobal("navigator", {
      serviceWorker: {
        ready: Promise.resolve({
          pushManager: {
            getSubscription: vi.fn().mockResolvedValue(mockSubscription),
          },
        }),
      },
    });
    vi.stubGlobal("window", { PushManager: vi.fn() });

    const result = await getPushSubscription();
    expect(result).toBe(mockSubscription);
  });

  it("returns null when no subscription exists", async () => {
    vi.stubGlobal("navigator", {
      serviceWorker: {
        ready: Promise.resolve({
          pushManager: {
            getSubscription: vi.fn().mockResolvedValue(null),
          },
        }),
      },
    });
    vi.stubGlobal("window", { PushManager: vi.fn() });

    const result = await getPushSubscription();
    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// subscribeToPushNotifications
// ---------------------------------------------------------------------------

describe("subscribeToPushNotifications", () => {
  it("returns null when PushManager is not supported", async () => {
    vi.stubGlobal("window", {});
    const result = await subscribeToPushNotifications("household-1");
    expect(result).toBeNull();
  });

  it("returns null when VAPID public key is not configured", async () => {
    vi.stubGlobal("window", { PushManager: vi.fn() });
    vi.stubGlobal("import", { meta: { env: {} } });
    const result = await subscribeToPushNotifications("household-1");
    expect(result).toBeNull();
  });

  it("subscribes and stores subscription in Supabase", async () => {
    const mockSubscription = {
      endpoint: "https://fcm.googleapis.com/fcm/send/test-1",
      getKey: vi.fn((name: string) => {
        if (name === "p256dh") return new Uint8Array([1, 2, 3]).buffer;
        if (name === "auth") return new Uint8Array([4, 5, 6]).buffer;
        return null;
      }),
    } as unknown as PushSubscription;

    const upsertMock = vi.fn().mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({ upsert: upsertMock });

    vi.stubGlobal("navigator", {
      serviceWorker: {
        ready: Promise.resolve({
          pushManager: {
            subscribe: vi.fn().mockResolvedValue(mockSubscription),
          },
        }),
      },
    });

    vi.stubGlobal("window", { PushManager: vi.fn() });
    vi.stubEnv("PUBLIC_VAPID_PUBLIC_KEY", "test-public-key");

    const result = await subscribeToPushNotifications("household-1");
    expect(result).toBe(mockSubscription);
    expect(upsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        household_id: "household-1",
        endpoint: "https://fcm.googleapis.com/fcm/send/test-1",
      }),
      { onConflict: "endpoint" },
    );
  });
});

// ---------------------------------------------------------------------------
// unsubscribeFromPushNotifications
// ---------------------------------------------------------------------------

describe("unsubscribeFromPushNotifications", () => {
  it("does nothing when PushManager is not supported", async () => {
    vi.stubGlobal("window", {});
    await expect(unsubscribeFromPushNotifications()).resolves.toBeUndefined();
  });

  it("unsubscribes and deletes subscription from Supabase", async () => {
    const unsubscribeMock = vi.fn().mockResolvedValue(undefined);
    const mockSubscription = {
      endpoint: "https://fcm.googleapis.com/fcm/send/test-1",
      unsubscribe: unsubscribeMock,
    } as unknown as PushSubscription;

    const eqMock = vi.fn().mockResolvedValue({ error: null });
    const deleteMock = vi.fn().mockReturnValue({ eq: eqMock });
    mockFrom.mockReturnValue({ delete: deleteMock });

    vi.stubGlobal("navigator", {
      serviceWorker: {
        ready: Promise.resolve({
          pushManager: {
            getSubscription: vi.fn().mockResolvedValue(mockSubscription),
          },
        }),
      },
    });

    vi.stubGlobal("window", { PushManager: vi.fn() });

    await unsubscribeFromPushNotifications();
    expect(unsubscribeMock).toHaveBeenCalled();
    expect(eqMock).toHaveBeenCalledWith("endpoint", "https://fcm.googleapis.com/fcm/send/test-1");
  });
});

// ---------------------------------------------------------------------------
// isPushNotificationEnabled / setPushNotificationEnabled
// ---------------------------------------------------------------------------

describe("push notification preference", () => {
  it("returns false by default", () => {
    expect(isPushNotificationEnabled()).toBe(false);
  });

  it("returns true after enabling", () => {
    setPushNotificationEnabled(true);
    expect(isPushNotificationEnabled()).toBe(true);
  });

  it("returns false after disabling", () => {
    setPushNotificationEnabled(true);
    setPushNotificationEnabled(false);
    expect(isPushNotificationEnabled()).toBe(false);
  });
});
