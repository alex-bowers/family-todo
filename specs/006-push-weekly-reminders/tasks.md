# Tasks: Push-Based Weekly Reminders

**Input**: Design documents from `/specs/006-push-weekly-reminders/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Test tasks are REQUIRED. Every user story and behavior change MUST include appropriate automated coverage per the constitution.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Configure build environment, secrets, and directory structure for the push notification infrastructure.

- [X] T001 Add `PUBLIC_VAPID_PUBLIC_KEY` environment variable to build configuration in `.env.example` and `vite.config.ts`
- [X] T002 [P] Create `functions/` directory structure for Cloudflare Pages Functions at `functions/api/push/`
- [X] T003 [P] Document VAPID key generation steps and secret configuration in `specs/006-push-weekly-reminders/quickstart.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish shared database schema, Web Push signing module, and client-side subscription helpers that ALL user stories depend on.

**CRITICAL**: No user story work can begin until this phase is complete.

- [X] T004 Create `push_subscriptions` table migration in `supabase/migrations/003_push_subscriptions.sql`
- [X] T005 [P] Add RLS policies for `push_subscriptions` table in `supabase/migrations/003_push_subscriptions.sql`
- [X] T006 [P] Implement custom Web Push signing module (VAPID JWT + payload encryption) in `src/lib/utils/web-push.ts`
- [X] T007 Add `subscribeToPushNotifications` helper with Supabase upsert in `src/lib/utils/notifications.ts`
- [X] T008 [P] Add `unsubscribeFromPushNotifications` helper with Supabase delete in `src/lib/utils/notifications.ts`
- [X] T009 [P] Add `getPushSubscription` helper in `src/lib/utils/notifications.ts`
- [X] T010 [P] Add `urlBase64ToUint8Array` utility in `src/lib/utils/notifications.ts`

**Checkpoint**: Database schema is migrated, Web Push signing module is implemented, and all subscription helpers are available. User stories can now proceed.

---

## Phase 3: User Story 1 - Subscribe to Weekly Reminders (Priority: P1) 🎯 MVP

**Goal**: Users can enable weekly reminders and their device gets subscribed to push notifications.

**Independent Test**: Toggle the notification bell on, grant permission, verify a `push_subscriptions` record is created in Supabase with the correct household_id, endpoint, p256dh, and auth values.

### Tests for User Story 1 (REQUIRED) ✅

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T011 [P] [US1] Add E2E test for enable reminders toggle flow in `tests/e2e/push-notifications.spec.ts`
- [X] T012 [P] [US1] Add unit test for `subscribeToPushNotifications` in `tests/unit/push-subscription.test.ts`

### Implementation for User Story 1

- [X] T013 [US1] Update `NotificationSettings.svelte` to call `subscribeToPushNotifications` when enabling reminders in `src/lib/components/NotificationSettings.svelte`
- [X] T014 [US1] Add push subscription upsert to Supabase in `src/lib/utils/notifications.ts`

**Checkpoint**: User Story 1 is fully functional and independently testable. Enabling reminders creates a push subscription.

---

## Phase 4: User Story 2 - Receive Weekly Reminder When App Is Closed (Priority: P1) 🎯 MVP

**Goal**: Push messages are sent weekly at Sunday 18:05 UK time and displayed even when the app is closed.

**Independent Test**: With an active subscription, trigger the send endpoint and verify the notification arrives via the service worker.

### Tests for User Story 2 (REQUIRED) ✅

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T015 [P] [US2] Add contract test for push send endpoint in `tests/contract/push-send.contract.test.ts`
- [X] T016 [P] [US2] Add unit test for UK timezone scheduling gate in `tests/unit/push-send.test.ts`

### Implementation for User Story 2

- [X] T017 [US2] Implement Cloudflare Pages Function with Supabase query, batch send, and expired subscription cleanup at `functions/api/push/send.ts`
- [X] T018 [US2] Add GitHub Actions cron workflow at `.github/workflows/weekly-reminder.yml`

**Checkpoint**: User Stories 1 and 2 are both functional and independently testable. The weekly reminder is delivered via push.

---

## Phase 5: User Story 3 - Manage and Clean Up Subscriptions (Priority: P2)

**Goal**: Users can disable reminders and the system handles subscription rotation and cleanup.

**Independent Test**: Disable reminders, verify subscription is removed. Simulate subscription rotation and verify the service worker updates the stored record.

### Tests for User Story 3 (REQUIRED) ✅

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T019 [P] [US3] Add E2E test for disable reminders flow in `tests/e2e/push-notifications.spec.ts`
- [X] T020 [P] [US3] Add unit test for `unsubscribeFromPushNotifications` in `tests/unit/push-subscription.test.ts`

### Implementation for User Story 3

- [X] T021 [US3] Update `NotificationSettings.svelte` to call `unsubscribeFromPushNotifications` when disabling reminders in `src/lib/components/NotificationSettings.svelte`
- [X] T022 [US3] Add `pushsubscriptionchange` handler with Supabase update to `src/service-worker.ts`

**Checkpoint**: All user stories are independently functional. Users can subscribe, receive, and unsubscribe from push notifications.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Documentation, error handling, validation, and agent context updates.

- [X] T023 [P] Update `quickstart.md` with manual test checklist and troubleshooting in `specs/006-push-weekly-reminders/quickstart.md`
- [X] T024 [P] Add comprehensive error handling and logging for push operations across `src/lib/utils/notifications.ts` and `functions/api/push/send.ts`
- [X] T025 [P] Run lint and test suite validation (`pnpm test && pnpm run lint`)
- [X] T026 Update agent context with final technology decisions in `.github/copilot-instructions.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **User Stories (Phase 3–5)**: All depend on Foundational phase completion
  - User stories can proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P1 → P2)
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) — no dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) — depends on US1 for subscription data, but the send function can be developed against test fixtures
- **User Story 3 (P2)**: Can start after Foundational (Phase 2) — depends on US1 for subscription creation and US2 for cleanup logic

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Helpers before component integration
- Component integration before end-to-end validation
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel (T002, T003)
- All Foundational tasks marked [P] can run in parallel within Phase 2 (T005, T006, T008, T009, T010)
- Once Foundational phase completes, all three user stories can start in parallel (if team capacity allows)
- All tests for a user story marked [P] can run in parallel
- All Polish tasks marked [P] can run in parallel

### Suggested MVP Scope

**MVP = User Story 1 + User Story 2** (Phases 1–4)

This delivers the core value: users can subscribe and receive weekly reminders when the app is closed. User Story 3 (unsubscribe and cleanup) can be deferred to a follow-up if needed.

---

## Task Count Summary

| Phase | Tasks | Story |
|-------|-------|-------|
| Phase 1: Setup | 3 | — |
| Phase 2: Foundational | 7 | — |
| Phase 3: US1 (Subscribe) | 4 | P1 |
| Phase 4: US2 (Receive) | 4 | P1 |
| Phase 5: US3 (Manage) | 4 | P2 |
| Phase 6: Polish | 4 | — |
| **Total** | **26** | |

**Parallel opportunities identified**: 13 tasks marked [P] across all phases.
**Independent test criteria**: Each user story has explicit independent test instructions.
**MVP scope**: Phases 1–4 (16 tasks) deliver core push notification functionality.
