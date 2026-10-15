/**
 * Weekly reminder send window: Sundays, 13:00 to 20:00 UK time.
 *
 * The send endpoint is called repeatedly during the window and sends to each
 * device at most once per window, so a late or dropped scheduler run is
 * covered by the next one.
 */

export const REMINDER_TIMEZONE = "Europe/London";
const REMINDER_WEEKDAY = "Sun";
const WINDOW_START_HOUR = 13;
const WINDOW_END_HOUR = 20;

const ukFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: REMINDER_TIMEZONE,
  weekday: "short",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

/**
 * Return the instant the current window opened (13:00 UK time that Sunday)
 * if `now` falls inside the window, otherwise null.
 *
 * UK clock changes happen at 01:00 UTC, so the UTC offset is constant for the
 * whole window and the start can be derived from `now` directly.
 */
export function getReminderWindowStart(now: Date): Date | null {
  const parts = ukFormatter.formatToParts(now);
  const getPart = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";

  if (getPart("weekday") !== REMINDER_WEEKDAY) {
    return null;
  }

  const hour = parseInt(getPart("hour"), 10);
  if (Number.isNaN(hour) || hour < WINDOW_START_HOUR || hour >= WINDOW_END_HOUR) {
    return null;
  }

  const minute = parseInt(getPart("minute"), 10);
  const second = parseInt(getPart("second"), 10);
  const elapsedMs =
    ((hour - WINDOW_START_HOUR) * 3600 + minute * 60 + second) * 1000 +
    now.getUTCMilliseconds();

  return new Date(now.getTime() - elapsedMs);
}

/**
 * Whether a device whose last reminder was sent at `lastSentAt` still needs
 * the reminder for the window that opened at `windowStart`.
 */
export function needsReminder(lastSentAt: string | null, windowStart: Date): boolean {
  if (!lastSentAt) {
    return true;
  }
  const lastSentMs = new Date(lastSentAt).getTime();
  return Number.isNaN(lastSentMs) || lastSentMs < windowStart.getTime();
}
