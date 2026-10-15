import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { sendPushMessage } from '$lib/utils/web-push';
import { getReminderWindowStart, needsReminder } from '$lib/utils/reminder-window';

interface PushSubscription {
  id: string;
  household_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  last_sent_at: string | null;
}

interface SendRequestBody {
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
  already_sent: number;
  skipped: boolean;
}

const VAPID_SUBJECT = "mailto:admin@familytodo.app";

// Columns are listed explicitly so that a missing `last_sent_at` column
// (migration 004 not applied) fails the request instead of sending repeatedly.
const SUBSCRIPTION_COLUMNS = "id,household_id,endpoint,p256dh,auth,last_sent_at";

async function fetchSubscriptions(
  supabaseUrl: string,
  serviceRoleKey: string,
): Promise<PushSubscription[]> {
  const response = await fetch(
    `${supabaseUrl}/rest/v1/push_subscriptions?select=${SUBSCRIPTION_COLUMNS}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${serviceRoleKey}`,
        apikey: serviceRoleKey,
        "Content-Type": "application/json",
      },
    },
  );

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

async function markSubscriptionSent(
  supabaseUrl: string,
  serviceRoleKey: string,
  id: string,
  sentAt: Date,
): Promise<void> {
  const response = await fetch(
    `${supabaseUrl}/rest/v1/push_subscriptions?id=eq.${id}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${serviceRoleKey}`,
        apikey: serviceRoleKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ last_sent_at: sentAt.toISOString() }),
    },
  );

  if (!response.ok) {
    console.error(
      `Failed to record send for subscription ${id}: ${response.status}. It may be sent again later in this window.`,
    );
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
    const force = body.force === true;

    const now = new Date();
    const windowStart = getReminderWindowStart(now);

    if (!force && !windowStart) {
      const response: SendResponse = {
        sent: 0,
        failed: 0,
        cleaned_up: 0,
        already_sent: 0,
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

    // A forced send goes to every device; otherwise each device gets the
    // reminder once per window.
    const pending = force || !windowStart
      ? subscriptions
      : subscriptions.filter((sub) => needsReminder(sub.last_sent_at, windowStart));

    const title = body.title ?? "FamilyToDo";
    const messageBody =
      body.body ?? "Has everything been added to the shopping list?";
    const tag = body.tag ?? "familytodo-weekly-reminder";
    const icon = body.icon ?? "/icons/icon-192.png";
    const badge = body.badge ?? "/icons/icon-192.png";

    let sent = 0;
    let failed = 0;
    let cleanedUp = 0;

    for (const sub of pending) {
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
          await markSubscriptionSent(supabaseUrl, serviceRoleKey, sub.id, now);
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
      already_sent: subscriptions.length - pending.length,
      skipped: false,
    };

    return json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Push send error:", error);
    return json({ error: message }, { status: 500 });
  }
};
