---
description: "Actionable task list for cleaning obsolete repository artefacts while preserving Spec Kit history"
---

# Tasks: Clean Repository Legacy Artefacts

**Input**: Design documents from `/Users/alexbowers/Code/Home/family-todo/specs/007-clean-repository/`
**Prerequisites**: `/Users/alexbowers/Code/Home/family-todo/specs/007-clean-repository/plan.md`, `/Users/alexbowers/Code/Home/family-todo/specs/007-clean-repository/spec.md`, `/Users/alexbowers/Code/Home/family-todo/specs/007-clean-repository/research.md`, `/Users/alexbowers/Code/Home/family-todo/specs/007-clean-repository/data-model.md`, `/Users/alexbowers/Code/Home/family-todo/specs/007-clean-repository/quickstart.md`

**Tests**: Required. The specification requires automated stale-reference, path-integrity, static-analysis, build, unit/contract, and end-to-end verification; existing user journeys also require manual regression review.

**Organisation**: Tasks are grouped by user story so the active cleanup, Spec Kit history preservation, and contributor orientation can be reviewed independently after the shared inventory and baseline are complete.

## Task Format

- Every task uses `- [ ] [TaskID] [P?] [Story?] Description with an exact file path`.
- `[P]` marks work that can proceed in parallel after its stated dependencies are complete.
- Story labels map to the specification: `[US1]` active codebase, `[US2]` Spec Kit history, `[US3]` contributor orientation.

## Phase 1: Setup (Shared Inventory)

**Purpose**: Establish the evidence and boundaries needed to make safe, reviewable cleanup decisions.

- [X] T001 Create the cleanup classification inventory with columns for path, category, consumers, evidence, disposition, and risk in `/Users/alexbowers/Code/Home/family-todo/specs/007-clean-repository/cleanup-inventory.md`.
- [X] T002 Record the pre-existing worktree state from `git status --short` and the baseline verification environment in `/Users/alexbowers/Code/Home/family-todo/specs/007-clean-repository/cleanup-inventory.md`, preserving all changes that pre-date this implementation.
- [X] T003 Record the preservation boundary for `/Users/alexbowers/Code/Home/family-todo/.specify/`, `/Users/alexbowers/Code/Home/family-todo/.github/agents/`, `/Users/alexbowers/Code/Home/family-todo/specs/001-family-todo-pwa/`, `/Users/alexbowers/Code/Home/family-todo/specs/002-swap-hasura-supabase/`, `/Users/alexbowers/Code/Home/family-todo/specs/003-improve-list-usability/`, `/Users/alexbowers/Code/Home/family-todo/specs/004-safer-list-management/`, `/Users/alexbowers/Code/Home/family-todo/specs/005-docker-devcontainer/`, `/Users/alexbowers/Code/Home/family-todo/specs/006-push-weekly-reminders/`, and `/Users/alexbowers/Code/Home/family-todo/supabase/migrations/` in the inventory.

---

## Phase 2: Foundational (Blocking Audit and Baseline)

**Purpose**: Complete the dependency audit and establish checks before any removal or rename. No user-story cleanup may begin until these tasks are complete.

- [X] T004 Audit active imports, package scripts, workflows, tests, and operational documentation for `hasura`, migration-runner paths, parity commands, and retired environment names, then record every result in `/Users/alexbowers/Code/Home/family-todo/specs/007-clean-repository/cleanup-inventory.md`.
- [X] T005 Confirm that `/Users/alexbowers/Code/Home/family-todo/supabase/migrations/001_init_supabase.sql`, `/Users/alexbowers/Code/Home/family-todo/supabase/migrations/002_migration_run.sql`, `/Users/alexbowers/Code/Home/family-todo/supabase/migrations/003_push_subscriptions.sql`, and `/Users/alexbowers/Code/Home/family-todo/supabase/migrations/004_push_last_sent.sql` remain preserved schema history, and record the no-delete decision in `/Users/alexbowers/Code/Home/family-todo/specs/007-clean-repository/cleanup-inventory.md`.
- [X] T006 Define the identifier and path rename map for `hasuraClient`, `HasuraClient`, `hasuraConfigured`, and `tests/contract/fixtures/hasura-fixtures.ts`, including all consumers discovered in `/Users/alexbowers/Code/Home/family-todo/specs/007-clean-repository/cleanup-inventory.md`.
- [X] T007 Run the safe baseline checks `pnpm check`, `pnpm run lint`, `pnpm run build`, and `pnpm run test:unit` from `/Users/alexbowers/Code/Home/family-todo`, recording each result and any pre-existing failure in `/Users/alexbowers/Code/Home/family-todo/specs/007-clean-repository/cleanup-inventory.md`.

**Checkpoint**: Inventory, preservation boundary, rename map, and baseline results are recorded; no removal is allowed without evidence in the inventory.

---

## Phase 3: User Story 1 - Maintain a Focused Active Codebase (Priority: P1) 🎯 MVP

**Goal**: Remove obsolete active paths and make retained Supabase-backed code, tests, commands, and operational guidance truthful without changing application behaviour.

**Independent Test**: Active source, tests, configuration, scripts, package commands, and operational documents contain no unresolved Hasura or completed-migration references, all imports resolve, and the existing safe baseline checks still pass.

### Implementation for User Story 1

- [X] T008 [US1] Rename the Hasura-specific client exports and configuration helper to neutral Supabase/data terminology in `/Users/alexbowers/Code/Home/family-todo/src/lib/graphql/client.ts` without changing request dispatch, Supabase queries, response mappings, fallback behaviour, or public user flows.
- [X] T009 [P] [US1] Update repository imports, constructor types, and defaults to use the renamed client symbols in `/Users/alexbowers/Code/Home/family-todo/src/lib/memory/list-repository.ts`.
- [X] T010 [P] [US1] Update repository imports, constructor types, and defaults to use the renamed client symbols in `/Users/alexbowers/Code/Home/family-todo/src/lib/memory/item-repository.ts`.
- [X] T011 [P] [US1] Update synchronisation and home-page configuration consumers to use the renamed client symbols in `/Users/alexbowers/Code/Home/family-todo/src/lib/sync/engine.ts` and `/Users/alexbowers/Code/Home/family-todo/src/routes/+page.svelte`.
- [X] T012 [P] [US1] Rename `/Users/alexbowers/Code/Home/family-todo/tests/contract/fixtures/hasura-fixtures.ts` to a neutral fixture path and update every unit and contract test import without changing fixture values or assertions.
- [X] T013 [US1] Remove `/Users/alexbowers/Code/Home/family-todo/hasura/` only after T004 confirms it has no active consumers, and record the removal evidence in `/Users/alexbowers/Code/Home/family-todo/specs/007-clean-repository/cleanup-inventory.md`.
- [X] T014 [US1] Remove the completed migration scripts `/Users/alexbowers/Code/Home/family-todo/scripts/migration/migrate-hasura-to-supabase.ts` and `/Users/alexbowers/Code/Home/family-todo/scripts/migration/verify-parity.ts`, their `migration:dry-run` and `migration:verify` entries in `/Users/alexbowers/Code/Home/family-todo/package.json`, and the obsolete runbook `/Users/alexbowers/Code/Home/family-todo/docs/architecture/supabase-migration-runbook.md` only after T004 confirms no supported operational dependency.
- [X] T015 [US1] Classify `/Users/alexbowers/Code/Home/family-todo/tests/contract/migration-compatibility.contract.test.ts`, `/Users/alexbowers/Code/Home/family-todo/tests/contract/migration-idempotency.contract.test.ts`, `/Users/alexbowers/Code/Home/family-todo/tests/e2e/migration-smoke.spec.ts`, `/Users/alexbowers/Code/Home/family-todo/tests/e2e/migration-regression-empty-and-large-households.spec.ts`, and `/Users/alexbowers/Code/Home/family-todo/tests/e2e/reconnect-after-cutover.spec.ts`; remove only tests that exclusively cover the retired migration process, and rename or retain tests that cover current Supabase, synchronisation, or regression behaviour.
- [X] T016 [US1] Update active migration wording and obsolete service references in `/Users/alexbowers/Code/Home/family-todo/docs/architecture/dependencies.md` and `/Users/alexbowers/Code/Home/family-todo/docs/architecture/supabase-operations.md`, retaining only current Supabase operational guidance and recording any historical cross-reference in the inventory.
- [X] T017 [US1] Run the active-path stale-reference and broken-path audit across `/Users/alexbowers/Code/Home/family-todo/src/`, `/Users/alexbowers/Code/Home/family-todo/tests/`, `/Users/alexbowers/Code/Home/family-todo/scripts/`, `/Users/alexbowers/Code/Home/family-todo/docs/`, `/Users/alexbowers/Code/Home/family-todo/package.json`, and `/Users/alexbowers/Code/Home/family-todo/.github/workflows/`, then record the result in `/Users/alexbowers/Code/Home/family-todo/specs/007-clean-repository/cleanup-inventory.md`.

**Checkpoint**: User Story 1 is independently testable when active imports and commands resolve, no unresolved retired-backend references remain outside historical records, and the safe application checks pass.

---

## Phase 4: User Story 2 - Preserve the Spec Kit Creation Record (Priority: P1)

**Goal**: Keep the ordered Spec Kit development history and workflow support discoverable while separating historical technology references from active implementation requirements.

**Independent Test**: `/Users/alexbowers/Code/Home/family-todo/specs/001-family-todo-pwa/` through `/Users/alexbowers/Code/Home/family-todo/specs/007-clean-repository/` and the required `.specify` workflow/configuration files remain present, readable, and linked from the repository entry point.

### Implementation for User Story 2

- [X] T018 [P] [US2] Verify that the ordered feature records `/Users/alexbowers/Code/Home/family-todo/specs/001-family-todo-pwa/` through `/Users/alexbowers/Code/Home/family-todo/specs/007-clean-repository/` retain their specifications and available planning artefacts, recording any missing historical file without deleting or rewriting unrelated history in `/Users/alexbowers/Code/Home/family-todo/specs/007-clean-repository/cleanup-inventory.md`.
- [X] T019 [P] [US2] Verify that `/Users/alexbowers/Code/Home/family-todo/.specify/memory/constitution.md`, `/Users/alexbowers/Code/Home/family-todo/.specify/extensions.yml`, `/Users/alexbowers/Code/Home/family-todo/.specify/templates/`, `/Users/alexbowers/Code/Home/family-todo/.specify/scripts/`, `/Users/alexbowers/Code/Home/family-todo/.specify/workflows/`, and `/Users/alexbowers/Code/Home/family-todo/.github/agents/` remain available for the Spec Kit workflow.
- [X] T020 [US2] Add a concise historical-record index and preservation note to `/Users/alexbowers/Code/Home/family-todo/README.md`, linking the ordered `specs/` feature records and explaining that retired technology names inside them are historical decisions rather than active setup requirements.
- [X] T021 [US2] Run a Spec Kit integrity check over `/Users/alexbowers/Code/Home/family-todo/specs/`, `/Users/alexbowers/Code/Home/family-todo/.specify/`, and `/Users/alexbowers/Code/Home/family-todo/.github/agents/`, then record the result in `/Users/alexbowers/Code/Home/family-todo/specs/007-clean-repository/cleanup-inventory.md`.

**Checkpoint**: User Story 2 is independently testable when the ordered feature history and Spec Kit workflow support are present and the README explains their historical role.

---

## Phase 5: User Story 3 - Understand the Supported Repository Surface (Priority: P2)

**Goal**: Give contributors one clear entry point for the active Supabase implementation, development setup, verification flow, and Spec Kit history.

**Independent Test**: A contributor can read the entry-point documentation, identify the supported backend and normal checks, and locate the historical feature records without following retired migration instructions.

### Implementation for User Story 3

- [X] T022 [P] [US3] Update the setup, supported backend, Spec Kit history, and normal verification sections in `/Users/alexbowers/Code/Home/family-todo/README.md` without changing the existing development commands or deployment instructions that remain valid.
- [X] T023 [P] [US3] Align current architecture and testing guidance with the cleaned active surface in `/Users/alexbowers/Code/Home/family-todo/docs/architecture/dependencies.md`, `/Users/alexbowers/Code/Home/family-todo/docs/architecture/supabase-operations.md`, and `/Users/alexbowers/Code/Home/family-todo/docs/testing.md`.
- [X] T024 [US3] Regenerate or manually align the active technology and command context in `/Users/alexbowers/Code/Home/family-todo/AGENTS.md` and `/Users/alexbowers/Code/Home/family-todo/.github/copilot-instructions.md` so contributors are not directed to Hasura or removed migration commands.
- [X] T025 [US3] Perform a fresh-checkout contributor walkthrough using `/Users/alexbowers/Code/Home/family-todo/README.md`, `/Users/alexbowers/Code/Home/family-todo/docs/testing.md`, and `/Users/alexbowers/Code/Home/family-todo/specs/007-clean-repository/quickstart.md`, recording completion and any ambiguity in `/Users/alexbowers/Code/Home/family-todo/specs/007-clean-repository/cleanup-inventory.md`.

**Checkpoint**: User Story 3 is independently testable when active documentation describes one supported implementation and a contributor can locate the Spec Kit history without retired setup guidance.

---

## Phase 6: Polish & Cross-Cutting Verification

**Purpose**: Prove that the cleanup is complete, safe, and consistent across the repository.

- [X] T026 [P] Run `pnpm check` and `pnpm run lint` from `/Users/alexbowers/Code/Home/family-todo` and record results in `/Users/alexbowers/Code/Home/family-todo/specs/007-clean-repository/cleanup-inventory.md`.
- [X] T027 [P] Run `pnpm run build` and `pnpm run test:unit` from `/Users/alexbowers/Code/Home/family-todo` and record results in `/Users/alexbowers/Code/Home/family-todo/specs/007-clean-repository/cleanup-inventory.md`.
- [X] T028 [P] Run `pnpm run test:e2e` only against the confirmed disposable test environment from `/Users/alexbowers/Code/Home/family-todo`, recording results or the environment limitation in `/Users/alexbowers/Code/Home/family-todo/specs/007-clean-repository/cleanup-inventory.md`.
- [X] T029 Perform manual regression checks for list and item creation, offline behaviour, synchronisation, notifications, PWA installation, keyboard access, visible focus, semantic labelling, and contrast using `/Users/alexbowers/Code/Home/family-todo/tests/e2e/` and the running application, then record evidence in `/Users/alexbowers/Code/Home/family-todo/specs/007-clean-repository/cleanup-inventory.md`.
- [X] T030 Run `git diff --check`, review `git status --short`, and confirm that `/Users/alexbowers/Code/Home/family-todo/specs/007-clean-repository/cleanup-inventory.md` identifies every removal/rename and excludes all pre-existing user changes.
- [X] T031 Update the verification-gate results and final disposition for every classified artefact in `/Users/alexbowers/Code/Home/family-todo/specs/007-clean-repository/cleanup-inventory.md`, then confirm the final state meets the acceptance scenarios and success criteria in `/Users/alexbowers/Code/Home/family-todo/specs/007-clean-repository/spec.md`.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies; creates the classification inventory and records the pre-existing worktree boundary.
- **Foundational (Phase 2)**: Depends on Phase 1; blocks all cleanup and rename work until references, schema-history preservation, rename mappings, and baselines are recorded.
- **User Story 1 (Phase 3)**: Depends on Phase 2; delivers the active-code cleanup MVP.
- **User Story 2 (Phase 4)**: Depends on Phase 2; can proceed in parallel with User Story 1 because it preserves historical and workflow artefacts rather than editing active runtime code.
- **User Story 3 (Phase 5)**: Depends on the final active surface from User Story 1 and the preservation boundary from User Story 2; documentation must describe the resulting repository, not an intermediate state.
- **Polish (Phase 6)**: Depends on all desired user stories; provides the release gate for the complete cleanup.

### User Story Dependencies

- **User Story 1 (P1)**: Depends only on the Foundational phase; no dependency on other user stories.
- **User Story 2 (P1)**: Depends only on the Foundational phase; independently verifiable and parallelisable with User Story 1 after the audit.
- **User Story 3 (P2)**: Depends on User Stories 1 and 2 so contributor guidance reflects both the cleaned active implementation and the preserved history.

### Within Each User Story

- Complete the inventory and rename map before any deletion or coordinated rename.
- Update the active client exports before updating its consumers.
- Update or remove tests with the implementation paths they cover; do not leave dangling imports.
- Run the story checkpoint before starting the next dependent story.

## Parallel Execution Examples

### After Foundational Phase

```text
Track A: T008 -> T009, T010, T011
Track B: T012
Track C: T013 -> T014
Track D: T018, T019
```

T014 and T015 must still use the evidence recorded in T004. T018 and T019 are read-only preservation checks and can run alongside active-code work without modifying the same implementation files.

### Polish Phase

```text
Track A: T026
Track B: T027
Track C: T028 (only with a confirmed disposable test environment)
```

T029–T031 remain sequential because they consolidate the verification evidence and final disposition.

## Implementation Strategy

### MVP First

1. Complete Phase 1 inventory and Phase 2 foundational audit/baseline.
2. Deliver User Story 1 by removing confirmed obsolete active paths and replacing misleading active terminology.
3. Validate the active source, imports, commands, and safe project checks.
4. Deliver the preservation checkpoint for User Story 2 before considering the cleanup complete; preserving the Spec Kit record is part of the core intent, not optional polish.

### Incremental Delivery

1. Inventory and baseline provide a reversible evidence trail.
2. Active cleanup can be reviewed independently as User Story 1.
3. Spec Kit history preservation can be reviewed independently as User Story 2.
4. Contributor documentation follows the final active surface as User Story 3.
5. Cross-cutting verification closes the work only when no active references, broken paths, or behaviour regressions remain.

## Notes

- `[P]` tasks touch disjoint files or are read-only checks and may run in parallel after their dependencies are complete.
- No database migration, production-data change, deployment, commit, or branch creation is part of this task list.
- Do not delete or alter `supabase/migrations/002_migration_run.sql` or other applied migration history based only on a repository search.
- Retired Hasura references inside preserved Spec Kit records remain historical documentation and are excluded from the active-reference gate.
