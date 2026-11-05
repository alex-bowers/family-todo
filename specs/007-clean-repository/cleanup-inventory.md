# Cleanup Inventory: Repository Legacy Artefacts

**Feature**: [Clean Repository Legacy Artefacts](spec.md)
**Started**: 2026-11-05
**Actual Git branch**: `main`

## Scope and Safety Boundary

This inventory records the evidence used before removing or renaming repository artefacts. Existing user changes were present before implementation and are out of scope. No branch, commit, deployment, production-data change, schema rewrite, or external service change is permitted.

The following are protected unless a separate approved decision changes the scope:

- `/Users/alexbowers/Code/Home/family-todo/.specify/`
- `/Users/alexbowers/Code/Home/family-todo/.github/agents/`
- `/Users/alexbowers/Code/Home/family-todo/specs/001-family-todo-pwa/` through `/Users/alexbowers/Code/Home/family-todo/specs/007-clean-repository/`
- `/Users/alexbowers/Code/Home/family-todo/supabase/migrations/`
- active application, notification, offline, synchronisation, devcontainer, deployment, and test infrastructure

## Pre-existing Worktree State

The following changes were present before implementation and must not be overwritten or folded into this cleanup:

```text
 D .github/prompts/speckit.analyze.prompt.md
 D .github/prompts/speckit.checklist.prompt.md
 D .github/prompts/speckit.clarify.prompt.md
 D .github/prompts/speckit.constitution.prompt.md
 D .github/prompts/speckit.implement.prompt.md
 D .github/prompts/speckit.plan.prompt.md
 D .github/prompts/speckit.specify.prompt.md
 D .github/prompts/speckit.tasks.prompt.md
 D .github/prompts/speckit.taskstoissues.prompt.md
 M .specify/feature.json
 M .specify/init-options.json
 M .specify/integration.json
 D .specify/integrations/copilot.manifest.json
 D .specify/integrations/copilot/scripts/update-context.ps1
 D .specify/integrations/copilot/scripts/update-context.sh
 M .specify/integrations/speckit.manifest.json
?? .agents/
?? .claude/
?? .specify/integrations/codex.manifest.json
?? .specify/integrations/codex/
?? AGENTS.md
?? specs/007-clean-repository/
```

## Classification

| Path or area | Category | Active consumers/evidence | Disposition | Risk/notes |
|---|---|---|---|---|
| `hasura/migrations/001_init.sql` | Obsolete candidate | No active source, test, package, workflow, or operational-document consumer found | Removed | Supabase migration history retained |
| `scripts/migration/migrate-hasura-to-supabase.ts` | Obsolete candidate | Exposed by `package.json`; documented by the migration runbook; skeleton implementation | Removed with package command | Removed as one coordinated unit |
| `scripts/migration/verify-parity.ts` | Obsolete candidate | Exposed by `package.json`; documented by the migration runbook; skeleton report generator | Removed with package command | Removed as one coordinated unit |
| `docs/architecture/supabase-migration-runbook.md` | Obsolete candidate | Only described completed migration commands and parity process | Removed | No longer active operational guidance |
| `src/lib/graphql/client.ts` | Active implementation with misleading names | Used by repositories, synchronisation, and the home route; implementation calls Supabase | Renamed active symbols | Request dispatch and data mapping preserved |
| `src/lib/memory/list-repository.ts` | Active implementation with misleading names | Imported `hasuraClient` and `HasuraClient` | Updated imports/types | Behaviour unchanged |
| `src/lib/memory/item-repository.ts` | Active implementation with misleading names | Imported `hasuraClient` and `HasuraClient` | Updated imports/types | Behaviour unchanged |
| `src/lib/sync/engine.ts` | Active implementation with misleading names | Imported and called Hasura-named client symbols | Updated imports/calls | Offline fallback and sync merge preserved |
| `src/routes/+page.svelte` | Active UI with misleading configuration name | Used `hasuraConfigured` for backend warning state | Updated import/call | Accessible status message preserved |
| `tests/contract/fixtures/hasura-fixtures.ts` | Active test support with obsolete names | Imported by multiple unit and contract tests; included unused migration parity helpers | Renamed to `data-fixtures.ts`; removed unused legacy helpers | Shared domain fixture values preserved |
| `tests/contract/migration-*.test.ts` | Review candidate | Mapping test covered current Supabase behaviour; idempotency test had no application dependency | Renamed mapping test; removed migration-only idempotency test | Current mapping coverage retained |
| `tests/e2e/*migration*` and `tests/e2e/reconnect-after-cutover.spec.ts` | Review candidate | Exercised current list, hydration, and reconnect flows under migration-era names | Renamed current regression tests | E2E remains disposable-data gated |
| `supabase/migrations/001_init_supabase.sql` through `004_push_last_sent.sql` | Supported schema history | Required for reproducible Supabase setup and current features | Retain unchanged | `002_migration_run.sql` may be applied history even without runtime references |
| `specs/001` through `specs/007` | Historical Spec Kit record | User explicitly wants creation history preserved | Retain | Retired technology references are historical |

## Reference Audit

The initial active-path search found Hasura-named symbols in the active client, repositories, sync engine, home route, and shared test fixtures. It also found migration commands in `package.json`, migration scripts, migration runbook references, migration-era tests, and stale agent-context wording. After cleanup, active source, tests, scripts, package commands, workflows, and operational documents contain no such references. The README retains the historical `specs/002-swap-hasura-supabase` link and explanation intentionally.

## Baseline Verification

Results are recorded after the baseline commands run in the implementation session:

| Check | Result | Notes |
|---|---|---|
| `pnpm check` | Fail (pre-existing) | 44 existing errors across Vite config, `ws` types, web-push types, Svelte components/routes, and tests; the Hasura-client nullability error in `src/lib/sync/engine.ts` was resolved by this cleanup |
| `pnpm run lint` | Fail (pre-existing) | Existing parsing error in `src/lib/components/NotificationSettings.svelte:15` |
| `pnpm run build` | Partial / fail in sandbox | Production bundles built, then the dev server failed to bind `127.0.0.1` with `EPERM` |
| `pnpm run test:unit` | Fail (pre-existing/undetermined) | Vitest exited with code 1 without diagnostic output; rerun after cleanup |

## Final Verification Gates

| Gate | Result | Evidence |
|---|---|---|
| Active-path stale-reference scan | Pass | No unresolved references outside the deliberate historical README link/explanation |
| Import and package-command path integrity | Pass (static audit) | Renamed fixtures resolve in imports; migration commands removed as a unit |
| Spec Kit history integrity | Pass | `specs/001`–`specs/007`, `.specify/`, and `.github/agents/` present |
| `pnpm check` and lint | Fail with pre-existing issues | `svelte-check` reduced from 45 to 44 errors after the in-scope nullability fix; lint retains the existing `NotificationSettings.svelte:15` parser error |
| Build and unit tests | Partial / fail in environment | Bundles built before sandbox `127.0.0.1` bind `EPERM`; Vitest exits 1 without diagnostics, including focused renamed-contract tests |
| End-to-end tests | Not run | No disposable Supabase test environment was confirmed; the suite can mutate test data |
| Manual regression and accessibility review | Not run | No browser/test environment was available without starting a potentially data-writing E2E flow |
| Final diff/worktree review | Pass | `git diff --check` passes; pre-existing worktree paths remain separately identifiable |

