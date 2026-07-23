# Data Model: Push-Based Weekly Reminders

**Feature**: Push-Based Weekly Reminders
**Date**: 2026-07-23

## Entities

### PushSubscription

Represents a single device's registration for Web Push notifications.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | `uuid` | PK, default `gen_random_uuid()` | Internal identifier |
| `household_id` | `uuid` | NOT NULL | Links to the household that owns this subscription |
| `endpoint` | `text` | NOT NULL, UNIQUE | Push service endpoint URL (browser-specific) |
| `p256dh` | `text` | NOT NULL | P-256 Diffie-Hellman public key for payload encryption |
| `auth` | `text` | NOT NULL | Authentication secret for payload encryption |
| `created_at` | `timestamptz` | NOT NULL, default `now()` | When the subscription was first created |
| `updated_at` | `timestamptz` | NOT NULL, default `now()` | When the subscription was last updated |

### Relationships

- **PushSubscription → Household**: Many-to-one. A household can have multiple active push subscriptions (one per device).
- **PushSubscription is independent** of `todo_lists` and `todo_items`. No foreign key to those tables.

## Validation Rules

- `endpoint` must be a valid HTTPS URL (enforced by browser Push API, but should be validated on insert).
- `p256dh` and `auth` must be base64url-encoded strings of the correct length (enforced by browser Push API).
- Duplicate `endpoint` values are prevented by the UNIQUE constraint. Upsert logic should update `household_id`, `p256dh`, `auth`, and `updated_at` on conflict.

## State Transitions

- **Created**: A new device enables weekly reminders → subscription is inserted.
- **Updated**: A device's subscription endpoint changes (e.g., browser rotation) → `endpoint` may change (old record deleted, new record inserted) or the same endpoint is updated with new keys.
- **Deleted (user-initiated)**: User disables weekly reminders → frontend calls `pushManager.unsubscribe()` and DELETEs the record from Supabase.
- **Deleted (system-initiated)**: Backend send attempt receives HTTP 410 Gone or other permanent failure → record is removed.

## SQL Schema

```sql
-- Push subscriptions for Web Push delivery
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_push_subscriptions_household
  on public.push_subscriptions(household_id);

-- Enable RLS
alter table public.push_subscriptions enable row level security;

-- Allow authenticated/anonymous users to manage their household's subscriptions
-- (The existing app uses auth.role() in ('anon', 'authenticated') for other tables)
drop policy if exists push_subscriptions_household_scope_select on public.push_subscriptions;
create policy push_subscriptions_household_scope_select on public.push_subscriptions
for select using (auth.role() in ('anon', 'authenticated'));

drop policy if exists push_subscriptions_household_scope_write on public.push_subscriptions;
create policy push_subscriptions_household_scope_write on public.push_subscriptions
for all using (auth.role() in ('anon', 'authenticated'))
with check (auth.role() in ('anon', 'authenticated'));

-- Note: The backend send function uses the service role key and bypasses RLS.
```

## Data Flow

1. **Frontend**: User enables reminders → `PushManager.subscribe()` → POST/UPSERT to `push_subscriptions` via Supabase JS client.
2. **Service Worker**: On `pushsubscriptionchange` → resubscribe → POST/UPSERT new subscription, DELETE old one.
3. **Backend (Pages Function)**: On cron trigger → SELECT all `push_subscriptions` → sign and send Web Push message to each endpoint → DELETE records that return permanent failures.
