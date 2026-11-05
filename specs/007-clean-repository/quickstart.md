# Quickstart: Clean Repository Legacy Artefacts

This procedure is for implementing and verifying the repository cleanup. It does not deploy, commit, create a branch, change production data, or run a database migration.

## Prerequisites

- Work from `/Users/alexbowers/Code/Home/family-todo`.
- Review `git status --short` before editing and preserve all pre-existing changes.
- Use the existing Node.js, pnpm, and project tooling already documented by the repository.
- Keep the current Supabase configuration and database migrations available for normal application checks.

## Implementation Flow

1. Inventory tracked files and active references. Classify each candidate as active, supported operational material, historical Spec Kit record, or obsolete.
2. Retain `.specify/`, `.github/agents/`, the ordered `specs/001`–`specs/006` records, the new `specs/007-clean-repository` records, active Supabase migrations, and any source or test file still required by current behaviour.
3. Remove confirmed obsolete Hasura directories, completed migration-only scripts, dead package commands, and migration-only documentation.
4. Rename or consolidate active Hasura-specific identifiers and fixture names where they describe the current Supabase implementation. Update every import, test, route, script, and active document that consumes them.
5. Remove or replace tests only when they exclusively verify the retired migration process. Preserve tests that verify current list, item, offline, synchronisation, notification, or installation behaviour.
6. Update active README, architecture, agent context, package command, and operational references so they describe one supported implementation. Keep retired technology references in historical feature records when they explain past decisions.
7. Review the final diff for accidental changes to user behaviour, schema, secrets, deployment configuration, or unrelated user work.

## Verification

Run the existing checks from `/Users/alexbowers/Code/Home/family-todo`:

```bash
pnpm check
pnpm run lint
pnpm run build
pnpm run test:unit
pnpm run test:e2e
```

If the end-to-end environment is unavailable, record that limitation and run the checks that do not require it. Do not weaken or skip a required check silently.

The end-to-end cleanup command and migration-era tests may write to the configured test Supabase data. Run them only when the environment is confirmed disposable and configured for tests; otherwise record the limitation and do not substitute a production or shared environment.

Run a final repository audit using tracked files and active paths. Confirm that:

- active source, tests, scripts, configuration, workflows, README, and operational documentation have no unresolved Hasura or completed-migration references;
- all retained historical Spec Kit records remain present and readable;
- all imports and documented package commands resolve;
- `supabase/migrations/` and current Supabase runtime behaviour are unchanged except for approved terminology/documentation updates; and
- the final `git diff` contains only the planned cleanup and does not include pre-existing user changes.

