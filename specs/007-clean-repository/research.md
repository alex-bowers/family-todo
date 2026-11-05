# Research: Clean Repository Legacy Artefacts

## Decision 1: Preserve Spec Kit history, remove only obsolete active paths

- **Decision**: Retain `.specify/`, the active Spec Kit integration files, `.github/agents/`, and the completed `specs/001` through `specs/006` feature records. Restrict deletion and renaming to active implementation, operational, test, and documentation artefacts that are proven obsolete.
- **Rationale**: The repository's stated purpose includes showing how it was created with GitHub Spec Kit. The feature records are therefore user-value-bearing history, not dead runtime code. The current `.specify/feature.json` also points to the new cleanup feature and must remain usable by later Spec Kit phases.
- **Alternatives considered**: Deleting old feature directories would make the repository smaller but would remove the requested development record. Keeping every old runtime artefact would preserve history at the cost of misleading active maintenance paths.

## Decision 2: Use the current Supabase implementation as the active boundary

- **Decision**: Treat the current Supabase-backed application, Supabase schema migrations, local cache/offline queue, push notification code, and their tests as active unless the dependency audit proves otherwise.
- **Rationale**: The README, package dependencies, runtime client, routes, and current database migrations identify Supabase as the supported implementation. Removing these files would change the application rather than clean it.
- **Alternatives considered**: Treating the older Hasura design as canonical would contradict the active source and the completed migration feature. Rebuilding the data layer is outside this cleanup.

## Decision 3: Remove completed migration tooling only after reference analysis

- **Decision**: Treat `hasura/`, the skeleton Hasura-to-Supabase migration runner, parity verifier, migration-only package commands, and the completed migration runbook as removal candidates. Confirm their absence from supported workflows before removal, and remove or rewrite only tests that exist solely to validate that completed migration.
- **Rationale**: The active migration scripts are explicitly skeleton/parity tooling and the application already uses Supabase. They add maintenance surface and imply an unfinished cutover. The reference audit prevents deleting a path that is still used by an operational procedure.
- **Alternatives considered**: Keeping the scripts “just in case” would retain dead commands and imply that a future cutover is still required. Replacing them with a new migration system would expand scope and add unsupported architecture.

## Decision 4: Rename active legacy terminology without changing runtime contracts

- **Decision**: Replace Hasura-specific active identifiers, fixture names, and contributor-facing references with neutral data/Supabase terminology. Preserve the existing domain behaviour, Supabase queries, row mappings, local fallback, synchronisation, and UI flows.
- **Rationale**: The current `SupabaseDataClient` is exported through Hasura-named symbols and repositories import those names, which makes the active implementation appear unfinished even though its backend calls are Supabase-based. A focused terminology cleanup improves maintainability without changing the data flow.
- **Alternatives considered**: Leaving all names untouched avoids code churn but fails the requirement to remove misleading active implementation paths. Rewriting the whole data layer would be higher risk and is not required.

## Decision 5: Keep verification proportional and repository-local

- **Decision**: Verify the cleanup with stale-reference and broken-path scans plus the existing project checks: type/static checks, lint, build, unit/contract tests, and end-to-end tests when their configured environment is available.
- **Rationale**: The change is primarily file and reference movement, so the highest risks are dangling imports, dead commands, misleading instructions, and accidental runtime regressions. Existing checks cover the application without adding a dependency or a new testing framework.
- **Alternatives considered**: Adding a dedicated dependency or custom audit tool would increase maintenance cost for a one-time cleanup. Relying only on a manual review would not reliably catch broken imports or commands.

## Decision 6: Preserve applied Supabase migration history

- **Decision**: Preserve `supabase/migrations/002_migration_run.sql` and the other existing Supabase migration files during this cleanup unless a separate, explicitly approved database-history decision proves that a file is unused and safe to retire.
- **Rationale**: A migration file can be part of the deployed schema history even when no current source code references its tables. Removing or altering it can make fresh environments diverge from deployed environments and cannot be safely inferred from repository references alone.
- **Alternatives considered**: Deleting migration files that appear unused would make the repository shorter but risks breaking reproducible setup and historical schema application. Rewriting the migration history is outside this repository-cleanup feature.

## Decision 7: Treat existing worktree changes as out of scope

- **Decision**: Preserve the pre-existing deleted prompts/integration files, modified Spec Kit configuration, and untracked Codex/agent content. Review them only to avoid collisions; do not fold them into the legacy-code cleanup.
- **Rationale**: The worktree was already dirty before planning began, and those changes may represent an independent Spec Kit integration update. Mixing them into the cleanup would make review and rollback ambiguous.
- **Alternatives considered**: Normalising all Spec Kit integration changes in one pass could produce a cleaner tree but would exceed the requested scope and risk discarding user work.

