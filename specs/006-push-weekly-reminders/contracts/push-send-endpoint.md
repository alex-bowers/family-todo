# Contract: Push Send Endpoint

**Endpoint**: `POST /api/push/send`
**Runtime**: Cloudflare Pages Function
**Authentication**: Shared secret via `Authorization: Bearer <SEND_SECRET>` header

## Request

### Headers

| Header | Required | Description |
|--------|----------|-------------|
| `Authorization` | Yes | `Bearer <SEND_SECRET>` — shared secret to prevent unauthorized broadcast |
| `Content-Type` | Yes | `application/json` |

### Body

```json
{
  "force": false,
  "title": "FamilyToDo",
  "body": "Has everything been added to the shopping list?",
  "tag": "familytodo-weekly-reminder",
  "icon": "/icons/icon-192.png",
  "badge": "/icons/icon-192.png"
}
```

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `force` | `boolean` | No | `false` | Send to every device now, ignoring the window and previous sends. For testing. |
| `title` | `string` | No | `"FamilyToDo"` | Notification title |
| `body` | `string` | No | `"Has everything been added to the shopping list?"` | Notification body |
| `tag` | `string` | No | `"familytodo-weekly-reminder"` | Notification tag for deduplication |
| `icon` | `string` | No | `"/icons/icon-192.png"` | Notification icon URL |
| `badge` | `string` | No | `"/icons/icon-192.png"` | Notification badge URL |

### Scheduling Behavior

The reminder window is Sundays, 13:00 to 20:00 UK time (`Europe/London`), in both GMT and BST. The window is fixed in `src/lib/utils/reminder-window.ts`.

- Outside the window, the endpoint returns `200 OK` with `skipped: true` and does not query Supabase.
- Inside the window, it sends only to subscriptions whose `last_sent_at` is empty or earlier than 13:00 UK time that day. After each successful send, it sets `last_sent_at` to the current time.
- A failed send does not update `last_sent_at`, so the next call in the window retries that device.

This means the scheduler can call the endpoint many times during the window: each device receives the reminder once, and a late or dropped call is covered by the next one.

`last_sent_at` is added by `supabase/migrations/004_push_last_sent.sql`. The endpoint requests the column explicitly, so it returns `500` rather than sending if the migration has not been applied.

## Response

### Success (200 OK)

```json
{
  "sent": 42,
  "failed": 2,
  "cleaned_up": 2,
  "already_sent": 3,
  "skipped": false
}
```

| Field | Type | Description |
|-------|------|-------------|
| `sent` | `number` | Number of push messages successfully delivered |
| `failed` | `number` | Number of push messages that failed with a retryable error |
| `cleaned_up` | `number` | Number of subscriptions removed due to permanent failure (e.g., 410 Gone) |
| `already_sent` | `number` | Number of subscriptions not sent to because they already received this window's reminder |
| `skipped` | `boolean` | Whether the send was skipped because the current time is outside the window |

### Error (401 Unauthorized)

```json
{
  "error": "Unauthorized"
}
```

Returned when the `Authorization` header is missing or invalid.

### Error (500 Internal Server Error)

```json
{
  "error": "Internal server error",
  "message": "<details>"
}
```

Returned when Supabase query or push sending encounters an unexpected error.

## Error Handling

- **Supabase query failure**: Returns 500.
- **Individual push send failure**:
  - `410 Gone` or other permanent failure: Subscription is deleted from the database, counted in `cleaned_up`.
  - `429 Too Many Requests` or network timeout: Counted in `failed`, subscription is retained for retry.
  - Any other HTTP error: Counted in `failed`, subscription is retained.

## Rate Limiting

The endpoint is protected by the shared secret. The GitHub Actions workflow should include a concurrency limit of 1 to prevent overlapping runs.
