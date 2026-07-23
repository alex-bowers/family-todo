import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { sendPushMessage } from '$lib/utils/web-push';

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
  force?: boolean;
}

interface SendResponse {
  sent: number;
  failed: number;
  cleaned_up: number;
  skipped: boolean;
}

const DEFAULT_TARGET = {
  timezone: "Europe/London",
  day: 0,
  hour: 18,
  minute: 5,
};

const VAPID_SUBJECT = "mailto:admin@familytodo.app";

const WEEKDAY_MAP: Record<string, number> = {
  Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
};

function isWithinTargetWindow(
  now: Date,
  targetTimezone: string,
  targetDay: number,
  targetHour: number,
  targetMinute: number,
): boolean {
  const timeFormatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: targetTimezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const dayFormatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: targetTimezone,
    weekday: "short",
  });

  const timeParts = timeFormatter.formatToParts(now);
  const currentHour = parseInt(
    timeParts.find((p) => p.type === "hour")?.value ?? "0",
    10,
  );
  const currentMinute = parseInt(
    timeParts.find((p) => p.type === "minute")?.value ?? "0",
    10,
  );

  const dayStr = dayFormatter.format(now).trim();
  const currentDay = WEEKDAY_MAP[dayStr];
  if (currentDay === undefined) {
    return false;
  }

  if (currentDay !== targetDay) {
    return false;
  }

  const targetTotalMinutes = targetHour * 60 + targetMinute;
  const currentTotalMinutes = currentHour * 60 + currentMinute;
  const diffMinutes = Math.abs(currentTotalMinutes - targetTotalMinutes);

  return diffMinutes <= 5;
}

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

export const POST: RequestHandler = async ({ request, platform }) => {
  const env = platform?.env as Record<string, string> | undefined;

  if (!env) {
    return json({ error: "Environment not available" }, { status: 500 });
  }

  const authHeader = request.headers.get("Authorization");
  const expectedToken = `Bearer ${env.SEND_SECRET}`;
  if (!authHeader || authHeader !== expectedToken) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body: SendRequestBody = await request.json().catch(() => ({}));

    const targetTimezone = body.target_timezone ?? DEFAULT_TARGET.timezone;
    const targetDay = body.target_day ?? DEFAULT_TARGET.day;
    const targetHour = body.target_hour ?? DEFAULT_TARGET.hour;
    const targetMinute = body.target_minute ?? DEFAULT_TARGET.minute;

    const now = new Date();
    const shouldSend =
      body.force === true ||
      isWithinTargetWindow(
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
      return json(response);
    }

    const supabaseUrl = env.PUBLIC_SUPABASE_URL;
    const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return json(
        { error: "Missing Supabase configuration" },
        { status: 500 },
      );
    }

    const subscriptions = await fetchSubscriptions(
      supabaseUrl,
      serviceRoleKey,
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

    for (const sub of subscriptions) {
      try {
        const result = await sendPushMessage({
          endpoint: sub.endpoint,
          p256dh: sub.p256dh,
          auth: sub.auth,
          vapidPrivateKey: env.VAPID_PRIVATE_KEY,
          vapidPublicKey: env.PUBLIC_VAPID_PUBLIC_KEY,
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
            supabaseUrl,
            serviceRoleKey,
            sub.id,
          );
          cleanedUp++;
        } else {
          console.error(
            `Push failed: ${result.status} ${result.statusText} for ${sub.endpoint}`,
          );
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

    return json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Push send error:", error);
    return json({ error: message }, { status: 500 });
  }
};
