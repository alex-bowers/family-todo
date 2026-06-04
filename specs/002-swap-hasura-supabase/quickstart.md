# Quickstart: Plan Validation for Hasura to Supabase Migration

## 1. Prerequisites

- Node.js 20.x
- pnpm
- Existing FamilyToDo workspace checked out on branch 002-migrate-to-supabase
- Supabase project credentials for non-production validation

## 2. Install and baseline checks

Run from repository root:

```bash
pnpm install
pnpm run lint
pnpm test
```

Expected result:
- Baseline passes before migration work begins.

## 3. Environment preparation

Create or update environment values required by the new Supabase integration.

Required variables (names may be finalized during implementation):
- public API URL for Supabase project
- public anon key for client operations
- service-level key for migration tooling in controlled environments only

Validation goal:
- Application and tests can load configuration without Hasura-specific runtime requirements.

## 4. Run migration rehearsal

Execute migration tooling against a rehearsal dataset and produce verification artifacts.

```bash
pnpm run migration:dry-run
pnpm run migration:verify
```

Required verification outputs:
- Row-count parity report
- Key-set parity report
- Fingerprint parity report
- Referential integrity and duplicate check report
- Idempotency rerun report

Gate:
- All required checks pass with zero unresolved mismatches.

## 5. Execute contract and E2E migration suites

Run required suites:

```bash
pnpm run test:unit
pnpm run test:e2e
```

Required test coverage before cutover approval:
- Contract parity tests for list, item, and sync boundaries
- Migration idempotency and compatibility contract tests
- Multi-context cross-device convergence scenarios
- Offline reconnect and replay scenarios

Gate:
- No required suite failures; no skipped required migration cases.

## 6. Cutover readiness checklist

Before production cutover, confirm:
- Supabase runtime path is feature-complete for list/item/sync workflows.
- Hasura runtime dependency is removable from active app path.
- Rollback triggers and owner responsibilities are documented.
- User communication plan exists for cutover window.

## 7. Post-cutover validation

Immediately after cutover:
- Re-run parity checks on production snapshot.
- Execute migration smoke and cross-device sync checks.
- Monitor missing/duplicate/convergence metrics through stabilization window.

Success condition:
- Core user workflows operate unchanged and data integrity/sync thresholds remain within specification gates.
