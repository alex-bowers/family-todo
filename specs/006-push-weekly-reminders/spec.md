# Feature Specification: Push-Based Weekly Reminders

**Feature Branch**: `006-push-weekly-reminders`
**Created**: 2026-07-23
**Status**: Draft
**Input**: User description: "Add push-based weekly reminders so the PWA can notify users when closed"

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Subscribe to Weekly Reminders (Priority: P1)

As a household member, I can enable weekly reminders in the app settings so that my device receives a push notification even when the app is closed.

**Why this priority**: Without push subscription, the weekly reminder only fires when the app happens to be open. This is the foundational step that makes the entire feature work.

**Independent Test**: Can be fully tested by toggling the notification bell on, observing the browser permission prompt, and verifying that a push subscription record is created and stored.

**Acceptance Scenarios**:

1. **Given** a user has not yet enabled weekly reminders, **When** they tap the notification bell toggle, **Then** the browser requests notification permission and, if granted, silently subscribes the device to push notifications.
2. **Given** a user has granted notification permission, **When** they enable weekly reminders, **Then** the device registers a push subscription with the backend and the toggle reflects the enabled state.
3. **Given** a user has enabled weekly reminders on one device, **When** they open the app on a second device and enable reminders there, **Then** the second device also registers its own push subscription without affecting the first.
4. **Given** a user denies notification permission, **When** they attempt to enable weekly reminders, **Then** the toggle remains off and the app informs them that notifications are blocked.

---

### User Story 2 - Receive Weekly Reminder When App Is Closed (Priority: P1)

As a household member with weekly reminders enabled, I receive a "Has everything been added to the shopping list?" notification on Sunday at 18:05 UK time regardless of whether the app is open, backgrounded, or closed.

**Why this priority**: This is the core user value of the feature. The existing timer-based reminder only works while the app is open, which defeats the purpose of a weekly nudge.

**Independent Test**: Can be tested by enabling reminders, closing the app entirely, and verifying that a notification arrives at the scheduled time via the device's native notification surface.

**Acceptance Scenarios**:

1. **Given** a user has enabled weekly reminders and the app is completely closed, **When** Sunday 18:05 UK time arrives, **Then** the device displays the weekly reminder notification within 60 seconds of the target time.
2. **Given** a user has enabled weekly reminders on multiple devices in the same household, **When** the scheduled time arrives, **Then** each subscribed device receives its own notification.
3. **Given** a user taps the weekly reminder notification, **When** the notification is activated, **Then** the app opens to the home page.
4. **Given** a user has not enabled weekly reminders, **When** the scheduled time arrives, **Then** no notification is sent to that user's devices.

---

### User Story 3 - Manage and Clean Up Subscriptions (Priority: P2)

As a household member, I can disable weekly reminders so that my device stops receiving them, and the system automatically removes subscriptions that are no longer valid.

**Why this priority**: Users need control over notifications, and expired or invalid subscriptions should not accumulate in the system.

**Independent Test**: Can be tested by disabling reminders and verifying no further notifications arrive, and by observing that the backend removes subscriptions that report expired endpoints.

**Acceptance Scenarios**:

1. **Given** a user has enabled weekly reminders, **When** they tap the notification bell to disable them, **Then** the device unsubscribes from push notifications and no further weekly reminders are sent to that device.
2. **Given** a push subscription has expired or the endpoint returns a permanent failure, **When** the backend attempts to send a notification to that endpoint, **Then** the subscription is removed from the database.
3. **Given** a user reinstalls the app or clears site data, **When** they re-enable weekly reminders, **Then** a fresh push subscription is created and the old one is replaced.

---

### Edge Cases

- A user enables reminders, then clears browser data or reinstalls the PWA — the old subscription becomes orphaned and should be cleaned up on the next send attempt.
- A user's device is offline when the weekly reminder is sent — the push service queues the message for a short window; if delivery fails permanently, the subscription is cleaned up.
- A user toggles reminders on and off rapidly — the system must handle duplicate subscription requests and avoid creating redundant records.
- The scheduled send time falls during a daylight saving transition in the UK — the reminder must still fire at the correct UK wall-clock time (18:05 Europe/London).
- A household has no members with push subscriptions enabled — the send job completes without error and without sending anything.
- A push subscription endpoint changes (browser vendor rotation) — the service worker handles `pushsubscriptionchange` and updates the stored record.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The system MUST request both notification permission and push subscription when a user enables weekly reminders.
- **FR-002**: The system MUST store each push subscription with the household identifier, endpoint URL, and encryption keys required for Web Push delivery.
- **FR-003**: The system MUST support multiple push subscriptions per household (one per device).
- **FR-004**: The system MUST send a weekly reminder push message to all active subscriptions for a household at Sunday 18:05 UK time.
- **FR-005**: The push message payload MUST include the title "FamilyToDo", the body "Has everything been added to the shopping list?", and the tag "familytodo-weekly-reminder".
- **FR-006**: The system MUST remove push subscriptions that return a permanent delivery failure (e.g., 410 Gone) during a send attempt.
- **FR-007**: The system MUST unsubscribe the device from push notifications when the user disables weekly reminders.
- **FR-008**: The service worker MUST display the notification when a push event is received, regardless of whether the app is open or closed.
- **FR-009**: The service worker MUST handle `pushsubscriptionchange` events by resubscribing and updating the stored subscription record.
- **FR-010**: The scheduled send mechanism MUST account for UK daylight saving time transitions so that the reminder consistently fires at 18:05 Europe/London.
- **FR-011**: User-facing flows MUST define accessibility acceptance criteria for the notification toggle, including visible focus states and screen-reader labels.
- **FR-012**: Feature scope MUST include automated tests for subscription creation, reminder delivery, and expired subscription cleanup before implementation begins.
- **FR-013**: Any new third-party service or library MUST include explicit justification and a simpler or native alternative assessment.

### Key Entities _(include if feature involves data)_

- **Push Subscription**: Represents a single device's registration for push notifications. Attributes: household identifier, endpoint URL (unique), P-256 DH public key, authentication secret, creation timestamp.
- **Weekly Reminder Send Job**: A scheduled execution that queries active subscriptions and delivers push messages. Attributes: execution timestamp, target household identifiers, success/failure per subscription.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Users who enable weekly reminders receive the notification within 60 seconds of Sunday 18:05 UK time, even when the app has been closed for more than 24 hours.
- **SC-002**: 100% of expired or invalid push subscriptions are removed from the database within one send attempt that encounters a permanent failure.
- **SC-003**: Users can enable or disable weekly reminders in under 3 seconds from the home page.
- **SC-004**: No household receives duplicate weekly reminders on the same device within a 7-day window.
- **SC-005**: The system correctly handles UK daylight saving transitions without skipping or double-sending reminders.

## Assumptions

- Users have devices and browsers that support the Push API and service workers (modern Chrome, Safari, Firefox on Android/iOS/desktop).
- The backend send mechanism uses a scheduled GitHub Actions workflow that triggers a Cloudflare Pages Function, as no existing Worker or Edge Function infrastructure is in place.
- VAPID keys are generated once and managed as secrets; the public key is exposed to the frontend at build time.
- The existing in-app timer-based reminder remains as a fallback when the app is open, but the push-based mechanism becomes the primary delivery path.
- Supabase Row Level Security policies allow authenticated users to manage only their own household's push subscriptions.
- The push send endpoint is protected by a shared secret to prevent unauthorized broadcast.
