# Contract: Push Subscription Client API

**Interface**: TypeScript module exposing functions for managing push subscriptions from the browser.
**Location**: `src/lib/utils/notifications.ts` (extended)

## Functions

### `subscribeToPushNotifications(householdId: string): Promise<PushSubscription | null>`

Subscribes the current device to push notifications and stores the subscription in Supabase.

**Parameters**:
- `householdId`: The household identifier to associate with the subscription.

**Returns**: The `PushSubscription` object from the browser, or `null` if subscription failed.

**Behavior**:
1. Checks if `PushManager` is supported (`'PushManager' in window`).
2. Gets the service worker registration.
3. Calls `registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) })`.
4. Extracts `endpoint`, `p256dh`, and `auth` from the subscription.
5. Upserts the record to Supabase `push_subscriptions` table.
6. Returns the subscription on success, `null` on failure.

**Errors**:
- Throws if the browser does not support Push API.
- Throws if permission is not granted.
- Throws if Supabase upsert fails.

### `unsubscribeFromPushNotifications(householdId: string): Promise<void>`

Unsubscribes the current device and removes the subscription from Supabase.

**Parameters**:
- `householdId`: The household identifier associated with the subscription.

**Behavior**:
1. Gets the service worker registration.
2. Calls `registration.pushManager.unsubscribe()`.
3. Deletes the matching record from Supabase `push_subscriptions` table (by `endpoint`).
4. Silently succeeds if no subscription exists.

### `getPushSubscription(): Promise<PushSubscription | null>`

Returns the current push subscription if one exists, or `null`.

**Behavior**:
1. Gets the service worker registration.
2. Calls `registration.pushManager.getSubscription()`.
3. Returns the result.

## Types

```typescript
interface PushSubscriptionRecord {
  id: string;
  household_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  created_at: string;
  updated_at: string;
}
```

## Service Worker Contract

The service worker must handle the following events:

### `push` event

Already implemented in `src/service-worker.ts`. Receives a push message and displays a notification via `self.registration.showNotification()`.

### `pushsubscriptionchange` event

**New requirement**: Must be added to `src/service-worker.ts`.

**Behavior**:
1. Access `event.newSubscription` and `event.oldSubscription`.
2. If `event.newSubscription` exists:
   - Extract `endpoint`, `p256dh`, `auth`.
   - POST to Supabase REST API to upsert the new subscription.
   - If `event.oldSubscription` exists, DELETE the old subscription from Supabase.
3. If `event.newSubscription` is null and `event.oldSubscription` exists:
   - Attempt to resubscribe with `registration.pushManager.subscribe()`.
   - If successful, upsert the new subscription and delete the old one.

**Note**: The service worker does not have access to the Supabase JS client. It must use `fetch()` directly against the Supabase REST API endpoint, authenticated with the anon key.
