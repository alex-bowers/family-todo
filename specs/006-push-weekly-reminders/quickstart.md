# Quickstart: Push-Based Weekly Reminders

**Feature**: Push-Based Weekly Reminders
**Branch**: `006-push-weekly-reminders`

## Prerequisites

- Node.js 20.x
- pnpm 11.8.0
- Supabase CLI (for local development)
- Cloudflare account (for Pages deployment)
- GitHub repository with Actions enabled

## Environment Setup

### 1. Generate VAPID Keys

```bash
npx web-push generate-vapid-keys
```

Save the output. You will need:
- **Public Key**: Exposed to the frontend
- **Private Key**: Kept secret, used by the backend send function

### 2. Configure Environment Variables

Create or update `.env`:

```bash
# Supabase (existing)
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# VAPID (new)
PUBLIC_VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
```

For Cloudflare Pages deployment, set secrets via Wrangler:

```bash
npx wrangler pages secret put VAPID_PRIVATE_KEY --project-name family-todo
npx wrangler pages secret put SUPABASE_SERVICE_ROLE_KEY --project-name family-todo
npx wrangler pages secret put SEND_SECRET --project-name family-todo
```

The `SEND_SECRET` is a random string used to authenticate the GitHub Actions cron job.

### 3. Configure GitHub Actions Secret

In your GitHub repository settings, add:
- `SEND_SECRET`: Same value as the Cloudflare secret
- `CF_PAGES_URL`: Your Cloudflare Pages deployment URL (e.g., `https://family-todo.pages.dev`)

## Local Development

### 1. Apply Database Migration

```bash
supabase migration up
```

Or apply the migration directly:

```bash
psql $SUPABASE_DB_URL -f supabase/migrations/003_push_subscriptions.sql
```

### 2. Start the Development Server

```bash
pnpm dev
```

### 3. Test Push Subscription Flow

1. Open the app in a browser that supports Push API (Chrome, Firefox, Safari).
2. Open DevTools → Application → Service Workers → ensure the service worker is registered.
3. Click the notification bell toggle.
4. Grant notification permission when prompted.
5. Verify in DevTools → Application → Service Workers → Push that a subscription exists.
6. Check the Supabase `push_subscriptions` table for a new record.

### 4. Test Push Send (Manual)

Trigger the send endpoint locally using curl:

```bash
curl -X POST http://localhost:8788/api/push/send \
  -H "Authorization: Bearer $SEND_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"target_timezone":"Europe/London","target_day":0,"target_hour":18,"target_minute":5}'
```

**Note**: Local push delivery requires the browser to be connected to a push service (e.g., FCM for Chrome, APNs for Safari). In development, you may need to use a tool like `web-push` CLI or Postman to send a test push message directly to the endpoint.

## Testing

### Run Unit Tests

```bash
pnpm test:unit
```

### Run E2E Tests

```bash
pnpm test:e2e
```

### Manual Push Test Checklist

- [ ] Enable reminders → permission prompt appears
- [ ] Grant permission → toggle turns on, subscription record created
- [ ] Disable reminders → toggle turns off, subscription record deleted
- [ ] Close the app completely → send endpoint triggered → notification arrives
- [ ] Tap notification → app opens to home page
- [ ] Expire subscription (clear browser data) → next send removes orphaned record

## Deployment

### 1. Deploy to Cloudflare Pages

```bash
pnpm run deploy:prod
```

### 2. Verify GitHub Actions Workflow

Check the Actions tab in GitHub to confirm the `weekly-reminder.yml` workflow is scheduled and running.

### 3. Monitor

- Check Cloudflare Pages Function logs for send errors.
- Monitor the `push_subscriptions` table for accumulation of expired records.
- Verify notifications arrive within 60 seconds of the target time.

## Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| "Push subscription failed" | Browser does not support Push API | Use a modern browser (Chrome 50+, Firefox 44+, Safari 16+) |
| "Unauthorized" on send endpoint | `SEND_SECRET` mismatch | Verify secrets in Cloudflare and GitHub match |
| Notification not arriving when app is closed | Service worker not registered | Check DevTools → Application → Service Workers |
| Duplicate notifications | Multiple subscriptions for same device | Ensure `unsubscribe` is called before `subscribe` |
| Orphaned subscriptions accumulating | Expired endpoints not cleaned up | Verify the send endpoint deletes 410 Gone responses |
