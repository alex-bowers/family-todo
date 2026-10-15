import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("$lib/utils/web-push", () => ({
  sendPushMessage: vi.fn(),
}));

import { sendPushMessage } from "$lib/utils/web-push";
import { POST } from "../../src/routes/api/push/send/+server";

const SUPABASE_URL = "https://supabase.test";

const env = {
  SEND_SECRET: "test-secret",
  PUBLIC_SUPABASE_URL: SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
  VAPID_PRIVATE_KEY: "vapid-private",
  PUBLIC_VAPID_PUBLIC_KEY: "vapid-public",
};

function subscription(id: string, lastSentAt: string | null) {
  return {
    id,
    household_id: "household-1",
    endpoint: `https://push.test/${id}`,
    p256dh: "p256dh",
    auth: "auth",
    last_sent_at: lastSentAt,
  };
}

const mockSendPushMessage = vi.mocked(sendPushMessage);
const mockFetch = vi.fn();

function stubSupabase(subscriptions: ReturnType<typeof subscription>[]) {
  mockFetch.mockImplementation(async (_url: string, init?: RequestInit) => {
    if (init?.method === "GET") {
      return new Response(JSON.stringify(subscriptions), { status: 200 });
    }
    return new Response(null, { status: 204 });
  });
}

function callEndpoint(body: Record<string, unknown> = {}) {
  const request = new Request("https://app.test/api/push/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.SEND_SECRET}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  return POST({ request, platform: { env } } as never);
}

function patchedIds(): string[] {
  return mockFetch.mock.calls
    .filter(([, init]) => (init as RequestInit | undefined)?.method === "PATCH")
    .map(([url]) => new URL(url as string).searchParams.get("id")!.replace("eq.", ""));
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal("fetch", mockFetch);
  mockFetch.mockReset();
  mockSendPushMessage.mockReset();
  mockSendPushMessage.mockResolvedValue({
    ok: true,
    status: 201,
    statusText: "Created",
    permanentFailure: false,
  });
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("POST /api/push/send", () => {
  it("skips without querying Supabase outside the Sunday window", async () => {
    vi.setSystemTime(new Date("2026-10-11T19:30:00Z")); // 20:30 UK time
    stubSupabase([subscription("a", null)]);

    const response = await callEndpoint();

    expect(await response.json()).toEqual({
      sent: 0,
      failed: 0,
      cleaned_up: 0,
      already_sent: 0,
      skipped: true,
    });
    expect(mockFetch).not.toHaveBeenCalled();
    expect(mockSendPushMessage).not.toHaveBeenCalled();
  });

  it("sends only to devices not yet sent to in this window and records the send", async () => {
    vi.setSystemTime(new Date("2026-10-11T14:23:00Z")); // 15:23 UK time
    stubSupabase([
      subscription("never-sent", null),
      subscription("sent-last-week", "2026-10-04T12:23:00.000Z"),
      subscription("sent-today", "2026-10-11T12:23:00.000Z"),
    ]);

    const response = await callEndpoint();

    expect(await response.json()).toEqual({
      sent: 2,
      failed: 0,
      cleaned_up: 0,
      already_sent: 1,
      skipped: false,
    });
    expect(mockSendPushMessage.mock.calls.map(([options]) => options.endpoint)).toEqual([
      "https://push.test/never-sent",
      "https://push.test/sent-last-week",
    ]);
    expect(patchedIds()).toEqual(["never-sent", "sent-last-week"]);

    const patchBody = JSON.parse(
      mockFetch.mock.calls.find(([, init]) => init?.method === "PATCH")![1].body,
    );
    expect(patchBody).toEqual({ last_sent_at: "2026-10-11T14:23:00.000Z" });
  });

  it("requests the last_sent_at column explicitly", async () => {
    vi.setSystemTime(new Date("2026-10-11T14:23:00Z"));
    stubSupabase([]);

    await callEndpoint();

    const [url] = mockFetch.mock.calls[0];
    expect(new URL(url as string).searchParams.get("select")).toContain("last_sent_at");
  });

  it("does not record a send that failed, so the next run retries it", async () => {
    vi.setSystemTime(new Date("2026-10-11T14:23:00Z"));
    stubSupabase([subscription("a", null)]);
    mockSendPushMessage.mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Server Error",
      permanentFailure: false,
    });

    const response = await callEndpoint();

    expect(await response.json()).toMatchObject({ sent: 0, failed: 1 });
    expect(patchedIds()).toEqual([]);
  });

  it("fails the request when the subscriptions query fails", async () => {
    vi.setSystemTime(new Date("2026-10-11T14:23:00Z"));
    mockFetch.mockResolvedValue(new Response(null, { status: 400, statusText: "Bad Request" }));

    const response = await callEndpoint();

    expect(response.status).toBe(500);
    expect(mockSendPushMessage).not.toHaveBeenCalled();
  });

  it("sends to every device when forced, even outside the window", async () => {
    vi.setSystemTime(new Date("2026-10-14T10:00:00Z")); // Wednesday
    stubSupabase([
      subscription("a", null),
      subscription("b", "2026-10-14T09:00:00.000Z"),
    ]);

    const response = await callEndpoint({ force: true });

    expect(await response.json()).toMatchObject({ sent: 2, already_sent: 0, skipped: false });
    expect(patchedIds()).toEqual(["a", "b"]);
  });
});
