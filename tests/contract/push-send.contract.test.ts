import { describe, expect, it, vi, beforeEach } from "vitest";
import { sendPushMessage } from "$lib/utils/web-push";

// Mock crypto.subtle for contract tests
const mockCrypto = {
  subtle: {
    importKey: vi.fn(),
    sign: vi.fn(),
    generateKey: vi.fn(),
    deriveBits: vi.fn(),
    exportKey: vi.fn(),
    encrypt: vi.fn(),
  },
  getRandomValues: vi.fn((arr: Uint8Array) => {
    for (let i = 0; i < arr.length; i++) {
      arr[i] = i;
    }
    return arr;
  }),
};

vi.stubGlobal("crypto", mockCrypto);

// Mock fetch for push endpoint tests
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

// Mock atob/btoa for base64 operations
vi.stubGlobal("atob", (str: string) => Buffer.from(str, "base64").toString("binary"));
vi.stubGlobal("btoa", (str: string) => Buffer.from(str, "binary").toString("base64"));

describe("Push send contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns permanentFailure=true for 410 Gone responses", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 410,
      statusText: "Gone",
    });

    // Setup crypto mocks for a minimal signing path
    mockCrypto.subtle.importKey.mockResolvedValue({} as CryptoKey);
    mockCrypto.subtle.sign.mockResolvedValue(new ArrayBuffer(64));
    mockCrypto.subtle.generateKey.mockResolvedValue({
      privateKey: {} as CryptoKey,
      publicKey: {} as CryptoKey,
    });
    mockCrypto.subtle.deriveBits.mockResolvedValue(new ArrayBuffer(32));
    mockCrypto.subtle.exportKey.mockResolvedValue(new ArrayBuffer(65));
    mockCrypto.subtle.encrypt.mockResolvedValue(new ArrayBuffer(16));

    const result = await sendPushMessage({
      endpoint: "https://fcm.googleapis.com/fcm/send/test-1",
      p256dh: "test-p256dh",
      auth: "test-auth",
      vapidPrivateKey: "test-private-key",
      vapidPublicKey: "test-public-key",
      vapidSubject: "mailto:admin@example.com",
      title: "FamilyToDo",
      body: "Test message",
    });

    expect(result.permanentFailure).toBe(true);
    expect(result.status).toBe(410);
  });

  it("returns permanentFailure=true for 404 Not Found responses", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 404,
      statusText: "Not Found",
    });

    mockCrypto.subtle.importKey.mockResolvedValue({} as CryptoKey);
    mockCrypto.subtle.sign.mockResolvedValue(new ArrayBuffer(64));
    mockCrypto.subtle.generateKey.mockResolvedValue({
      privateKey: {} as CryptoKey,
      publicKey: {} as CryptoKey,
    });
    mockCrypto.subtle.deriveBits.mockResolvedValue(new ArrayBuffer(32));
    mockCrypto.subtle.exportKey.mockResolvedValue(new ArrayBuffer(65));
    mockCrypto.subtle.encrypt.mockResolvedValue(new ArrayBuffer(16));

    const result = await sendPushMessage({
      endpoint: "https://fcm.googleapis.com/fcm/send/test-1",
      p256dh: "test-p256dh",
      auth: "test-auth",
      vapidPrivateKey: "test-private-key",
      vapidPublicKey: "test-public-key",
      vapidSubject: "mailto:admin@example.com",
      title: "FamilyToDo",
      body: "Test message",
    });

    expect(result.permanentFailure).toBe(true);
    expect(result.status).toBe(404);
  });

  it("returns ok=true for successful 201 responses", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 201,
      statusText: "Created",
    });

    mockCrypto.subtle.importKey.mockResolvedValue({} as CryptoKey);
    mockCrypto.subtle.sign.mockResolvedValue(new ArrayBuffer(64));
    mockCrypto.subtle.generateKey.mockResolvedValue({
      privateKey: {} as CryptoKey,
      publicKey: {} as CryptoKey,
    });
    mockCrypto.subtle.deriveBits.mockResolvedValue(new ArrayBuffer(32));
    mockCrypto.subtle.exportKey.mockResolvedValue(new ArrayBuffer(65));
    mockCrypto.subtle.encrypt.mockResolvedValue(new ArrayBuffer(16));

    const result = await sendPushMessage({
      endpoint: "https://fcm.googleapis.com/fcm/send/test-1",
      p256dh: "test-p256dh",
      auth: "test-auth",
      vapidPrivateKey: "test-private-key",
      vapidPublicKey: "test-public-key",
      vapidSubject: "mailto:admin@example.com",
      title: "FamilyToDo",
      body: "Test message",
    });

    expect(result.ok).toBe(true);
    expect(result.permanentFailure).toBe(false);
    expect(result.status).toBe(201);
  });

  it("sends correct headers in the push request", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 201,
      statusText: "Created",
    });

    mockCrypto.subtle.importKey.mockResolvedValue({} as CryptoKey);
    mockCrypto.subtle.sign.mockResolvedValue(new ArrayBuffer(64));
    mockCrypto.subtle.generateKey.mockResolvedValue({
      privateKey: {} as CryptoKey,
      publicKey: {} as CryptoKey,
    });
    mockCrypto.subtle.deriveBits.mockResolvedValue(new ArrayBuffer(32));
    mockCrypto.subtle.exportKey.mockResolvedValue(new ArrayBuffer(65));
    mockCrypto.subtle.encrypt.mockResolvedValue(new ArrayBuffer(16));

    await sendPushMessage({
      endpoint: "https://fcm.googleapis.com/fcm/send/test-1",
      p256dh: "test-p256dh",
      auth: "test-auth",
      vapidPrivateKey: "test-private-key",
      vapidPublicKey: "test-public-key",
      vapidSubject: "mailto:admin@example.com",
      title: "FamilyToDo",
      body: "Test message",
      tag: "custom-tag",
      icon: "/icons/custom.png",
      badge: "/icons/custom.png",
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [, init] = mockFetch.mock.calls[0];
    expect(init.method).toBe("POST");
    expect(init.headers["Content-Type"]).toBe("application/octet-stream");
    expect(init.headers["Content-Encoding"]).toBe("aes128gcm");
    expect(init.headers["TTL"]).toBe("86400");
    expect(init.headers["Authorization"]).toMatch(/^vapid t=.*, k=test-public-key$/);
  });
});
