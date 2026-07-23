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
  "target_timezone": "Europe/London",
  "target_day": 0,
  "target_hour": 18,
  "target_minute": 5,
  "title": "FamilyToDo",
  "body": "Has everything been added to the shopping list?",
  "tag": "familytodo-weekly-reminder",
  "icon": "/icons/icon-192.png",
  "badge": "/icons/icon-192.png"
}
```

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `target_timezone` | `string` | No | `"Europe/London"` | IANA timezone for scheduling |
| `target_day` | `number` | No | `0` | Day of week (0=Sunday) |
| `target_hour` | `number` | No | `18` | Hour in 24h format |
| `target_minute` | `number` | No | `5` | Minute |
| `title` | `string` | No | `"FamilyToDo"` | Notification title |
| `body` | `string` | No | `"Has everything been added to the shopping list?"` | Notification body |
| `tag` | `string` | No | `"familytodo-weekly-reminder"` | Notification tag for deduplication |
| `icon` | `string` | No | `"/icons/icon-192.png"` | Notification icon URL |
| `badge` | `string` | No | `"/icons/icon-192.png"` | Notification badge URL |

### Scheduling Behavior

The endpoint checks whether the current UTC time falls within the target window (±5 minutes of the scheduled time in the target timezone). If not, it returns `200 OK` with `sent: 0` and takes no action. This allows the cron to run frequently (e.g., hourly) without sending outside the target window.

## Response

### Success (200 OK)

```json
{
  "sent": 42,
  "failed": 2,
  "cleaned_up": 2,
  "skipped": false
}
```

| Field | Type | Description |
|-------|------|-------------|
| `sent` | `number` | Number of push messages successfully delivered |
| `failed` | `number` | Number of push messages that failed with a retryable error |
| `cleaned_up` | `number` | Number of subscriptions removed due to permanent failure (e.g., 410 Gone) |
| `skipped` | `boolean` | Whether the send was skipped because the current time is outside the target window |

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
