# Supabase Migration Runbook

## Rehearsal

1. Run `npm run migration:dry-run`.
2. Run `npm run migration:verify`.
3. Review JSON outputs in `test-results/migration/`.

## Cutover

1. Announce maintenance window.
2. Pause writes and capture source snapshot reference.
3. Execute migration runner against target environment.
4. Execute parity verification and validate zero mismatches.

## Rollback Triggers

- Any missing record count mismatch.
- Any duplicate detection mismatch.
- Any unresolved sync convergence error in smoke checks.

## Post-Cutover Metrics

- migration_rows_read_total
- migration_rows_written_total
- migration_rows_mismatch_total
- offline_replay_failed_total
- sync_propagation_ms

## Sign-Off Template

- Migration run ID:
- Source snapshot reference:
- Target snapshot reference:
- Row-count parity: pass/fail
- Key-set parity: pass/fail
- Fingerprint parity: pass/fail
- Duplicate detection: pass/fail
- Referential integrity: pass/fail
- Cross-device convergence check: pass/fail
- Approved by:
