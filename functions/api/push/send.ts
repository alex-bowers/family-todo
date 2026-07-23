/**
 * Cloudflare Pages Function: POST /api/push/send
 *
 * Sends weekly push reminders to all active subscriptions.
 * Triggered by GitHub Actions cron workflow.
 */

import { sendPushMessage } from "../../../src/lib/utils/web-push";

interface Env {
  VAPID_PRIVATE_KEY: string;
  VAPID_PUBLIC_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  SUPABASE_URL: string;
  SEND_SECRET: string;
}

interface PushSubscription {
  id: string;
  household_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

interface SendRequestBody {
  target_timezone?: string;
  target_day?: number;
  target_hour?: number;
  target_minute?: number;
  title?: string;
  body?: string;
  tag?: string;
  icon?: string;
  badge?: string;
}

interface SendResponse {
  sent: number;
  failed: number;
  cleaned_up: number;
  skipped: boolean;
}

const DEFAULT_TARGET = {
  timezone: "Europe/London",
  day: 0, // Sunday
  hour: 18,
  minute: 5,
};

const VAPID_SUBJECT = "mailto:admin@familytodo.app";

/**
 * Check if the current UTC time falls within the target window
 * (±5 minutes of the scheduled time in the target timezone).
 */
function isWithinTargetWindow(
  now: Date,
  targetTimezone: string,
  targetDay: number,
  targetHour: number,
  targetMinute: number,
): boolean {
  // Use numeric weekday formatter for unambiguous day-of-week detection
  const numericFormatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: targetTimezone,
    weekday: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const numericParts = numericFormatter.formatToParts(now);
  const currentDay = parseInt(
    numericParts.find((p) => p.type === "weekday")?.value ?? "0",
    10,
  );
  const currentHour = parseInt(
    numericParts.find((p) => p.type === "hour")?.value ?? "0",
    10,
  );
  const currentMinute = parseInt(
    numericParts.find((p) => p.type === "minute")?.value ?? "0",
    10,
  );

  // Check if we're on the right day and within ±5 minutes of target time
  if (currentDay !== targetDay) {
    return false;
  }

  const targetTotalMinutes = targetHour * 60 + targetMinute;
  const currentTotalMinutes = currentHour * 60 + currentMinute;
  const diffMinutes = Math.abs(currentTotalMinutes - targetTotalMinutes);

  return diffMinutes <= 5;
}

/**
 * Fetch all push subscriptions from Supabase.
 */
async function fetchSubscriptions(
  supabaseUrl: string,
  serviceRoleKey: string,
): Promise<PushSubscription[]> {
  const response = await fetch(`${supabaseUrl}/rest/v1/push_subscriptions?select=*`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${serviceRoleKey}`,
      apikey: serviceRoleKey,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch subscriptions: ${response.status} ${response.statusText}`,
    );
  }

  return (await response.json()) as PushSubscription[];
}

/**
 * Delete a subscription from Supabase by ID.
 */
async function deleteSubscription(
  supabaseUrl: string,
  serviceRoleKey: string,
  id: string,
): Promise<void> {
  const response = await fetch(
    `${supabaseUrl}/rest/v1/push_subscriptions?id=eq.${id}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${serviceRoleKey}`,
        apikey: serviceRoleKey,
        "Content-Type": "application/json",
      },
    },
  );

  if (!response.ok) {
    console.error(`Failed to delete subscription ${id}: ${response.status}`);
  }
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  // Validate authorization
  const authHeader = request.headers.get("Authorization");
  const expectedToken = `Bearer ${env.SEND_SECRET}`;
  if (!authHeader || authHeader !== expectedToken) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // Parse request body
    const body: SendRequestBody = await request.json().catch(() => ({}));

    const targetTimezone = body.target_timezone ?? DEFAULT_TARGET.timezone;
    const targetDay = body.target_day ?? DEFAULT_TARGET.day;
    const targetHour = body.target_hour ?? DEFAULT_TARGET.hour;
    const targetMinute = body.target_minute ?? DEFAULT_TARGET.minute;

    // Check if we're within the target window
    const now = new Date();
    const shouldSend = isWithinTargetWindow(
      now,
      targetTimezone,
      targetDay,
      targetHour,
      targetMinute,
    );

    if (!shouldSend) {
      const response: SendResponse = {
        sent: 0,
        failed: 0,
        cleaned_up: 0,
        skipped: true,
      };
      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Fetch subscriptions
    const subscriptions = await fetchSubscriptions(
      env.SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY,
    );

    const title = body.title ?? "FamilyToDo";
    const messageBody =
      body.body ?? "Has everything been added to the shopping list?";
    const tag = body.tag ?? "familytodo-weekly-reminder";
    const icon = body.icon ?? "/icons/icon-192.png";
    const badge = body.badge ?? "/icons/icon-192.png";

    let sent = 0;
    let failed = 0;
    let cleanedUp = 0;

    // Send to each subscription
    for (const sub of subscriptions) {
      try {
        const result = await sendPushMessage({
          endpoint: sub.endpoint,
          p256dh: sub.p256dh,
          auth: sub.auth,
          vapidPrivateKey: env.VAPID_PRIVATE_KEY,
          vapidPublicKey: env.VAPID_PUBLIC_KEY,
          vapidSubject: VAPID_SUBJECT,
          title,
          body: messageBody,
          tag,
          icon,
          badge,
        });

        if (result.ok) {
          sent++;
        } else if (result.permanentFailure) {
          await deleteSubscription(
            env.SUPABASE_URL,
            env.SUPABASE_SERVICE_ROLE_KEY,
            sub.id,
          );
          cleanedUp++;
        } else {
          failed++;
        }
      } catch (error) {
        console.error(`Failed to send push to ${sub.endpoint}:`, error);
        failed++;
      }
    }

    const response: SendResponse = {
      sent,
      failed,
      cleaned_up: cleanedUp,
      skipped: false,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Push send error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};
