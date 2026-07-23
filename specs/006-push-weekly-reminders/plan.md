# Implementation Plan: Push-Based Weekly Reminders

**Branch**: `006-push-weekly-reminders` | **Date**: 2026-07-23 | **Spec**: [specs/006-push-weekly-reminders/spec.md](specs/006-push-weekly-reminders/spec.md)
**Input**: Feature specification from `/specs/006-push-weekly-reminders/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Replace the existing timer-based weekly reminder with a push notification system so that the FamilyToDo PWA can deliver "Has everything been added to the shopping list?" notifications on Sunday at 18:05 UK time even when the app is closed. The solution involves: (1) subscribing devices to push notifications via the Push API when users enable reminders, (2) storing subscription data in Supabase, (3) sending push messages from a Cloudflare Pages Function triggered by a GitHub Actions cron workflow, and (4) handling push events in the existing service worker to display notifications.

## Technical Context

**Language/Version**: TypeScript on Node.js 20.x (SvelteKit current LTS support)
**Primary Dependencies**: SvelteKit 2.x, Vite, Supabase JS client, Vitest, Playwright, pnpm 11.8.0 (existing); custom Web Crypto-based Web Push signing module (no new npm dependency)
**Storage**: Supabase Postgres (cloud-hosted production; local Supabase CLI for development)
**Testing**: Vitest for unit/contract coverage, Playwright for end-to-end interaction coverage
**Target Platform**: Modern desktop and mobile browsers supporting Push API and service workers (Chrome, Safari, Firefox on Android/iOS/desktop)
**Project Type**: Web application (SvelteKit PWA)
**Performance Goals**: Push subscription creation should complete within 3 seconds; notification delivery should occur within 60 seconds of the scheduled time
**Constraints**: Cloudflare Pages Functions runtime (V8 isolate, not Node.js); no existing Worker or Edge Function infrastructure; must preserve existing offline-sync behavior; must handle UK daylight saving time transitions correctly
**Scale/Scope**: Household-scale volumes (tens of subscriptions per household, hundreds of households); one scheduled send per week

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

**Pre-Phase-0 Gate Assessment**

- **Code Quality**: PASS. Changes are confined to existing frontend components, service worker, Supabase schema, and a new Pages Function. No new architectural layer. Linting/formatting via existing ESLint/Prettier config.
- **Accessibility**: PASS. The notification toggle already exists and meets accessibility criteria (visible focus states, semantic labels, keyboard operability). No new interactive elements are introduced.
- **Testing**: PASS. The feature can be covered with: (a) Playwright E2E for the subscription toggle flow, (b) Vitest unit tests for push subscription helpers and VAPID/crypto utilities, (c) contract tests for the Pages Function endpoint, (d) manual verification for actual push delivery (browser automation cannot receive real push notifications).
- **Dependencies**: NEEDS CLARIFICATION. A Web Push signing library is required. The standard `web-push` npm package uses Node.js `crypto`, which may not work in Cloudflare Pages Functions. Research needed on: (a) whether Cloudflare's Node.js compatibility mode supports it, (b) Web Crypto-based alternatives, (c) whether a custom minimal implementation is viable.
- **UX Simplicity**: PASS. The user journey is unchanged — one toggle to enable/disable. The push subscription happens transparently after permission grant. No new configuration or steps are added.

## Project Structure

### Documentation (this feature)

```text
specs/006-push-weekly-reminders/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
src/
├── lib/
│   ├── components/
│   │   └── NotificationSettings.svelte    # Updated: subscribe/unsubscribe push
│   ├── utils/
│   │   └── notifications.ts               # Updated: add push subscription helpers
│   └── supabase/
│       └── client.ts                      # Existing: for subscription CRUD
├── routes/
│   └── +page.svelte                       # Existing: hosts NotificationSettings
└── service-worker.ts                      # Updated: handle pushsubscriptionchange

functions/
└── api/
    └── push/
        └── send.ts                          # New: Cloudflare Pages Function for sending

supabase/
└── migrations/
    └── 003_push_subscriptions.sql         # New: push subscriptions table

.github/
└── workflows/
    └── weekly-reminder.yml                  # New: GitHub Actions cron workflow

tests/
├── e2e/
│   └── push-notifications.spec.ts         # New: E2E for toggle flow
├── unit/
│   └── push-subscription.test.ts          # New: unit tests for helpers
└── contract/
    └── push-send.contract.test.ts         # New: contract tests for send endpoint
```

**Structure Decision**: Keep the existing single SvelteKit app structure. Add a `functions/` directory for Cloudflare Pages Functions (standard convention for SvelteKit + Cloudflare Pages adapter). Add a GitHub Actions workflow for cron scheduling. All other changes are modifications to existing files.

## Post-Phase-1 Constitution Check Re-evaluation

**Re-checked after design completion:**

- **Code Quality**: PASS. All changes are localized. No new linting rules needed. Review scope: `service-worker.ts`, `NotificationSettings.svelte`, `notifications.ts`, new `functions/api/push/send.ts`, new migration, new workflow.
- **Accessibility**: PASS. No new interactive elements. Existing toggle already meets accessibility criteria.
- **Testing**: PASS. Test plan covers E2E (toggle flow), unit (crypto/helpers), and contract (send endpoint). Manual verification required for actual push delivery.
- **Dependencies**: PASS (resolved in research). Custom Web Crypto implementation avoids npm dependency. No new packages required.
- **UX Simplicity**: PASS. User journey is one toggle. Push subscription is transparent. No new configuration.

**Gate result**: ALL PASS. Proceed to task generation.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|-----------|-----------------------------------|
| GitHub Actions cron + Cloudflare Pages Function (two infrastructure pieces) | No existing Worker/Edge Function infrastructure; Pages Functions are already deployed via the SvelteKit Cloudflare adapter | A single Cloudflare Worker with Cron Triggers would be simpler but requires setting up and maintaining a separate Worker project and binding it to Supabase |
| Custom Web Push signing implementation | VAPID protocol requires ECDSA signing and AES-GCM encryption; standard `web-push` uses Node.js crypto unavailable in Pages Functions | Using `web-push` with `nodejs_compat` flag rejected due to experimental status and bundle size increase; custom implementation is ~200 lines of well-understood Web Crypto code |
