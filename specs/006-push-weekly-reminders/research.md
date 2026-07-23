# Research: Push-Based Weekly Reminders

**Date**: 2026-07-23
**Feature**: Push-Based Weekly Reminders
**Resolves**: Technical Context clarifications from plan.md

## Unknown 1: Web Push Library for Cloudflare Pages Functions

### Decision
Use a **custom minimal Web Push implementation** built on the Web Crypto API, packaged as a small TypeScript module inside the project. No external npm dependency for Web Push signing.

### Rationale
- Cloudflare Pages Functions run in a V8 isolate with **Web Crypto API** available but **no Node.js `crypto` module** by default.
- The standard `web-push` npm package depends on Node.js `crypto` (specifically `createSign`, `createHash`, `randomBytes`) and will not run in a Pages Function without Node.js compatibility mode, which is experimental and adds bundle size.
- Cloudflare's Node.js compatibility mode (`nodejs_compat`) is available but adds complexity and may have edge cases with crypto operations.
- A custom implementation using Web Crypto (`crypto.subtle.sign`, `crypto.subtle.encrypt`) is approximately 200-300 lines of well-understood code for the VAPID JWT signing and payload encryption paths that this feature actually needs.
- The feature only needs **one push message type** (weekly reminder with fixed title/body), so the full generality of `web-push` is unnecessary.

### Alternatives Considered

| Alternative | Rejected Because |
|-------------|-----------------|
| `web-push` npm package with `nodejs_compat` | Adds experimental compatibility flag, increases bundle size, and introduces a dependency that may break on Cloudflare runtime updates |
| `@block65/webcrypto-web-push` | Small Web Crypto-based library, but unmaintained (last update 2023) and lacks TypeScript definitions |
| `web-push` via Supabase Edge Function (Deno) | Would require moving the send logic to Supabase Edge Functions, adding a second backend platform and complicating the cron trigger setup |
| Cloudflare Worker with `web-push` | Would require creating and maintaining a separate Worker project, KV bindings, and secret management outside the existing Pages deployment |

### Implementation Notes
- VAPID signing requires ECDSA with P-256 curve and SHA-256 — fully supported by Web Crypto's `SubtleCrypto.sign()`.
- Payload encryption requires AES-128-GCM and ECDH key exchange — also fully supported by Web Crypto.
- The VAPID private key is stored as a Cloudflare secret (`VAPID_PRIVATE_KEY`).
- The VAPID public key is exposed to the frontend via an environment variable (`PUBLIC_VAPID_PUBLIC_KEY`).

## Unknown 2: Cron Scheduling Mechanism

### Decision
Use **GitHub Actions scheduled workflow** (`schedule: '5 18 * * 0'`) that HTTP-POSTs to the Cloudflare Pages Function send endpoint.

### Rationale
- Simplest to implement given the existing repository already uses GitHub Actions (implied by `.github/` directory structure).
- No additional infrastructure to provision or maintain.
- The cron expression `'5 18 * * 0'` runs at 18:05 UTC every Sunday. The Pages Function then queries Supabase for subscriptions and handles UK timezone logic internally (or the cron can be adjusted seasonally for BST).
- GitHub Actions scheduling has a documented ±5 minute delay tolerance, which is acceptable for a weekly reminder.

### Alternatives Considered

| Alternative | Rejected Because |
|-------------|-----------------|
| Cloudflare Cron Triggers | Requires a separate Worker project; cannot attach Cron Triggers to Pages Functions directly |
| Supabase `pg_cron` + Edge Function | Requires enabling the `pg_cron` extension and maintaining Edge Functions in Deno, adding platform complexity |
| In-app `setTimeout` with background sync | Does not solve the core problem — browsers do not allow arbitrary timers when the app is closed |

### Timezone Handling
- The cron runs at 18:05 UTC.
- During GMT (winter): 18:05 UTC = 18:05 UK time. Correct.
- During BST (summer): 18:05 UTC = 19:05 UK time. **Incorrect** — one hour late.
- **Resolution**: The Pages Function should calculate the next UK-targeted send time internally and skip if not yet due, OR the GitHub Actions workflow should use a dynamic schedule. For simplicity, the Pages Function will accept a `target_timezone=Europe/London` parameter and compute whether the current UTC time maps to Sunday 18:05 UK time, handling the offset correctly. The cron can run more frequently (e.g., every hour) and the function gates actual sends.

**Revised cron approach**: Run every hour (`0 * * * *`) and let the Pages Function decide whether to send based on UK time calculation. This avoids seasonal cron adjustments.

## Unknown 3: Push Subscription Storage and RLS

### Decision
Store push subscriptions in a new Supabase table `public.push_subscriptions` with Row Level Security policies that allow authenticated users to manage only their household's subscriptions.

### Rationale
- The existing app uses anonymous authentication (or no auth) with household-scoped data. The RLS policies on `todo_lists` and `todo_items` already use `auth.role() in ('anon', 'authenticated')`.
- Push subscriptions are scoped to a `household_id`, matching the existing data model.
- The frontend can upsert subscriptions directly via the Supabase JS client using the anon key.
- The backend send function uses the service role key to read all active subscriptions across households.

### Table Design
```sql
create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### RLS Policies
- `SELECT/INSERT/UPDATE/DELETE` for authenticated users where `household_id` matches the requesting user's household.
- The send function bypasses RLS by using the service role key.

## Unknown 4: Service Worker Push Subscription Change Handling

### Decision
Add a `pushsubscriptionchange` event handler to the existing service worker that resubscribes and updates the stored subscription via a background fetch to the Supabase REST API.

### Rationale
- Browsers may rotate push subscription endpoints without warning. Without handling this, subscriptions become orphaned and notifications fail silently.
- The `pushsubscriptionchange` event fires on the service worker when the subscription changes.
- The handler should: (1) unsubscribe the old subscription, (2) subscribe with the same `applicationServerKey`, (3) POST the new subscription to the backend.
- This requires the service worker to have access to the Supabase URL and anon key, which can be inlined at build time or fetched from the client.

### Implementation Approach
- Inline the Supabase URL and anon key into the service worker at build time via Vite's `define` or environment variable substitution.
- Use `fetch()` directly in the service worker to call the Supabase REST API (POST to `/rest/v1/push_subscriptions`).

## Summary of Decisions

| Area | Decision | Rationale |
|------|----------|-----------|
| Web Push signing | Custom Web Crypto implementation | Avoids Node.js crypto dependency, keeps bundle small, feature scope is narrow |
| Cron scheduling | GitHub Actions hourly cron + Pages Function gating | Simplest infrastructure, handles timezone correctly |
| Subscription storage | Supabase table with household-scoped RLS | Consistent with existing data model |
| Subscription rotation | Service worker `pushsubscriptionchange` handler | Prevents orphaned subscriptions, standard practice |
| VAPID key management | Cloudflare secret (private) + build env (public) | Standard secret management for Pages deployments |
