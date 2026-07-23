# Implementation Plan: Custom Push Notification Schedules

**Branch**: `007-custom-notification-schedules` | **Date**: 2026-07-23 | **Spec**: [specs/007-custom-notification-schedules/spec.md](specs/007-custom-notification-schedules/spec.md)
**Input**: Feature specification from `/specs/007-custom-notification-schedules/spec.md`

## Summary

Replace the single hardcoded weekly reminder with a database-driven, per-household notification scheduling system. Household members can create, edit, and delete custom recurring push notifications with free-form messages, scheduled for any day/time/timezone. The existing push subscription and Web Push infrastructure is reused.

## Technical Context

**Language/Version**: TypeScript on Node.js 20.x (SvelteKit current LTS support)
**Primary Dependencies**: SvelteKit 2.x, Vite, Supabase JS client, Vitest, Playwright, pnpm 11.8.0
**Storage**: Supabase Postgres (cloud-hosted production; local Supabase CLI for development)
**Testing**: Vitest for unit/contract coverage, Playwright for end-to-end interaction coverage
**Target Platform**: Modern desktop and mobile browsers supporting Push API and service workers
**Project Type**: Web application (SvelteKit PWA)
**Performance Goals**: Schedule CRUD operations should complete within 2 seconds; notification delivery should occur within 5 minutes of the scheduled time
**Constraints**: Cloudflare Pages Functions runtime (V8 isolate); must preserve existing offline-sync behavior; must handle timezone transitions correctly
**Scale/Scope**: Household-scale volumes (tens of subscriptions per household, hundreds of households); multiple schedules per household

## Constitution Check

- **Code Quality**: PASS. Changes are confined to existing frontend components, service worker, Supabase schema, and the existing Pages Function.
- **Accessibility**: PASS. New schedule management UI must meet accessibility criteria (visible focus states, semantic labels, keyboard operability).
- **Testing**: PASS. Cover with: (a) Playwright E2E for schedule CRUD, (b) Vitest unit tests for schedule helpers, (c) contract tests for the Pages Function endpoint, (d) manual verification for push delivery.
- **Dependencies**: PASS. No new dependencies required. Reuses existing Web Push signing module.
- **UX Simplicity**: PASS. One toggle for push notifications; schedules are managed in a dedicated settings area.

## Project Structure

### Documentation (this feature)

```text
specs/007-custom-notification-schedules/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output
```

### Source Code (repository root)

```text
supabase/migrations/004_notification_schedules.sql       # New schema
src/routes/api/push/send/+server.ts                    # Refactored send logic
.github/workflows/notification-scheduler.yml           # Updated cron workflow
src/service-worker.ts                                    # Read payload from push event
src/lib/components/NotificationScheduleManager.svelte    # New schedule management UI
src/routes/settings/+page.svelte                         # New settings page
src/lib/utils/notifications.ts                           # Remove local scheduling logic
src/lib/components/NotificationSettings.svelte           # Link subscriptions to schedules
```

## Phase 0: Research

**Goal**: Validate technical approach and identify blockers.

### Unknown 1: Cron Frequency vs. Cost

**Question**: Is running a GitHub Actions workflow every 5 minutes acceptable for a free-tier project?

**Findings**:
- GitHub Actions free tier includes 2,000 minutes/month for public repos, 500 for private.
- 5-minute cron = ~8,640 runs/month. Each run is a single curl command (~5 seconds).
- Total usage: ~720 minutes/month. Well within free tier for public repos.
- For private repos, may need to consider a Cloudflare Cron Trigger instead.

**Decision**: Proceed with GitHub Actions cron. Monitor usage.

### Unknown 2: Timezone-Aware Query Performance

**Question**: Can we efficiently query schedules by timezone without a full table scan?

**Findings**:
- The `notification_schedules` table will be small (hundreds to thousands of rows).
- An index on `(household_id, is_enabled, day_of_week, hour, minute)` is sufficient.
- Timezone conversion happens in the application layer (Pages Function) using `Intl.DateTimeFormat`, not in SQL.
- No complex timezone arithmetic in Postgres required.

**Decision**: Proceed with application-level timezone evaluation.

### Unknown 3: Junction Table Necessity

**Question**: Do we need a junction table, or can we simplify by sending all enabled schedules to all household subscriptions?

**Findings**:
- Without a junction table, every subscribed device gets every schedule. This is fine for a family app.
- However, a junction table provides future flexibility (per-device schedule selection) and makes the data model explicit.
- Given the small scale, the added complexity is minimal and the flexibility is valuable.

**Decision**: Use a junction table (`notification_schedule_subscriptions`).

## Phase 1: Design

### Data Model

See [data-model.md](data-model.md).

### API Contracts

See [contracts/](contracts/).

### Quickstart

See [quickstart.md](quickstart.md).

## Phase 2: Tasks

See [tasks.md](tasks.md).

## Implementation Steps

### Phase 1: Database Schema

1. **Create `notification_schedules` table** — stores per-household schedules
   - `id uuid pk`, `household_id uuid not null`, `day_of_week smallint not null` (0–6), `hour smallint not null` (0–23), `minute smallint not null` (0–59), `timezone text not null default 'Europe/London'`, `title text not null`, `body text not null`, `tag text not null`, `icon text`, `badge text`, `is_enabled boolean not null default true`, `created_at timestamptz default now()`, `updated_at timestamptz default now()`
   - Index on `(household_id, is_enabled, day_of_week, hour, minute)` for efficient due-window queries
   - RLS policies: household-scoped select/insert/update/delete (same pattern as `push_subscriptions`)

2. **Create `notification_schedule_subscriptions` junction table** — links schedules to push subscriptions
   - `schedule_id uuid not null references notification_schedules(id) on delete cascade`, `subscription_id uuid not null references push_subscriptions(id) on delete cascade`, `created_at timestamptz default now()`
   - Composite primary key `(schedule_id, subscription_id)`
   - RLS policies matching household scope

3. **Migration file**: `supabase/migrations/004_notification_schedules.sql`

### Phase 2: Backend Send Logic

4. **Refactor `src/routes/api/push/send/+server.ts`**
   - Replace the single hardcoded target window check with a query against `notification_schedules`
   - Query: `SELECT * FROM notification_schedules WHERE is_enabled = true AND day_of_week = $current_day AND hour = $current_hour AND minute BETWEEN $current_minute - 5 AND $current_minute + 5 AND timezone = $tz`
   - For each due schedule, fetch linked `push_subscriptions` via the junction table
   - Send push with schedule-specific `title`, `body`, `tag`, `icon`, `badge`
   - Keep existing permanent-failure cleanup (DELETE subscription + cascade junction records)
   - Remove `target_timezone`, `target_day`, `target_hour`, `target_minute` from request body — the endpoint becomes a pure "send anything due now" trigger
   - Keep `force` flag for manual testing (bypass time window, send all enabled schedules)

5. **Update GitHub Actions cron workflow** (`.github/workflows/weekly-reminder.yml` → `.github/workflows/notification-scheduler.yml`)
   - Change cron to run every 5 minutes: `*/5 * * * *`
   - Remove schedule-specific inputs from workflow_dispatch (only keep `force`)
   - Update curl payload to `{}` or `{"force": false}`

### Phase 3: Service Worker

6. **Update `src/service-worker.ts` push event handler**
   - Currently hardcodes title/body/tag. Change to read these from the push payload (`event.data.json()`)
   - Fall back to sensible defaults if payload fields are missing
   - No other changes needed — `pushsubscriptionchange` and `notificationclick` remain the same

### Phase 4: Frontend — Schedule Management UI

7. **Create `src/lib/components/NotificationScheduleManager.svelte`**
   - List existing schedules for the household (fetch from Supabase)
   - Form to add a new schedule: day picker, time picker (hour/minute), timezone dropdown, title input, body textarea, tag input (optional, auto-generated from title), icon/badge inputs (optional)
   - Toggle to enable/disable each schedule
   - Delete schedule with confirmation
   - Uses existing Supabase client pattern (`getSupabaseClient()`)

8. **Create `src/routes/settings/+page.svelte`**
   - Mount `NotificationScheduleManager` alongside existing `NotificationSettings`
   - The existing bell toggle becomes "Push Notifications" (device-level subscription on/off)
   - New section below: "Notification Schedules" (household-level schedule management)

9. **Update `src/lib/utils/notifications.ts`**
   - Remove `getNextSundayAt1805UK`, `scheduleWeeklyNotification`, `cancelWeeklyNotification`, `shouldShowWeeklyReminder`, `markWeeklyReminderShown` — these are replaced by the server-side schedule system
   - Keep `showWeeklyReminder` (rename to `showLocalNotification`) as a fallback for immediate local notifications if needed
   - Keep push subscription helpers (`subscribeToPushNotifications`, `unsubscribeFromPushNotifications`, etc.)

### Phase 5: Frontend — Subscription Linking

10. **Update `NotificationSettings.svelte`**
    - When user enables push notifications, after subscribing the device, also insert a junction record linking the new subscription to ALL currently enabled schedules for the household
    - When user disables push notifications, unsubscribe and delete the push subscription (cascade handles junction records)
    - When a new schedule is created, automatically link it to all existing push subscriptions for the household

### Phase 6: Migration & Cleanup

11. **Data migration consideration**
    - Insert a default schedule into `notification_schedules` for each household that has push subscriptions: Sunday 18:05 Europe/London, title "FamilyToDo", body "Has everything been added to the shopping list?", tag "familytodo-weekly-reminder"
    - Link all existing `push_subscriptions` to this default schedule via the junction table
    - This preserves existing behaviour seamlessly

12. **Remove obsolete code**
    - Delete `getNextSundayAt1805UK` and related local scheduling logic from `notifications.ts`
    - Remove `NOTIFICATION_PREF_KEY` and `NOTIFICATION_LAST_SHOWN_KEY` localStorage items (or keep as legacy cleanup)
    - Update `+layout.svelte` to remove `scheduleWeeklyNotification` call

### Phase 7: Testing & Verification

13. **Contract tests**
    - Add `notification-schedules.contract.test.ts` for CRUD operations on `notification_schedules`
    - Add `notification-schedule-subscriptions.contract.test.ts` for junction table operations
    - Update `push-send.contract.test.ts` to verify schedule-driven sending

14. **E2E tests**
    - Test creating a schedule, enabling push, and receiving a notification at the scheduled time (use `force` flag or mock time)
    - Test deleting a schedule stops notifications
    - Test disabling a schedule pauses notifications without deleting

## Verification

1. Run `pnpm test` — all existing tests pass
2. Run `supabase migration up` locally and verify new tables exist with correct RLS
3. Manual test: create a schedule 1 minute in the future, enable push, trigger `/api/push/send` with `force: true`, verify notification arrives with custom title/body
4. Manual test: disable schedule, trigger send, verify no notification
5. Manual test: delete schedule, verify junction records are cleaned up (cascade)
6. Verify GitHub Actions workflow runs every 5 minutes and hits the endpoint correctly

## Decisions

- **Granularity**: 5-minute cron interval with a ±5 minute matching window. This means a schedule for 14:00 will match any time between 13:55 and 14:05. This is simple and reliable; sub-minute precision is not needed for household reminders.
- **Timezone handling**: Store `timezone` per schedule (IANA string). The send endpoint evaluates schedules in their declared timezone using `Intl.DateTimeFormat`, same pattern as the existing weekly reminder.
- **Scope**: Household-level schedules (shared by all members). Per-device opt-in is handled by the existing push subscription toggle — if a device is subscribed, it gets all enabled schedules for the household.
- **Excluded**: Recurring intervals other than weekly (e.g., "every 3 days"), one-off notifications, per-user schedules, notification history/audit log, delivery receipts, A/B testing message variants.

## Further Considerations

1. **UI location**: Should schedule management live on a dedicated `/settings` page or inline on the home page? The home page currently only shows the bell toggle. A `/settings` route is cleaner as the feature grows.
2. **Default schedule migration**: Should the existing weekly reminder be automatically migrated to a `notification_schedules` record, or should users manually recreate it? Auto-migration preserves behaviour but requires a data migration script.
3. **Schedule limit**: Should there be a max number of schedules per household (e.g., 10) to prevent abuse? Not needed for a family app, but worth considering if opening to broader use.
