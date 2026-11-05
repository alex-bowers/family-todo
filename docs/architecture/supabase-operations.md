# Supabase Operations

## Daily Checks

- Confirm project availability and API health.
- Confirm recent sync propagation latency is within target thresholds.

## Incident Workflow

1. Capture failing household ID and operation context.
2. Inspect queued mutations and recent synchronisation errors.
3. If data drift is confirmed, compare the affected records with the current Supabase data and follow the service recovery process.

## Environment Keys

- PUBLIC_SUPABASE_URL
- PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
