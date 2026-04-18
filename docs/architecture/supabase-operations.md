# Supabase Operations

## Daily Checks

- Confirm project availability and API health.
- Confirm latest migration parity report status.
- Confirm recent sync propagation latency is within target thresholds.

## Incident Workflow

1. Capture failing household ID and operation context.
2. Inspect queue replay and parity artifacts.
3. If data drift is confirmed, trigger rollback workflow from runbook.

## Environment Keys

- PUBLIC_SUPABASE_URL
- PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
