# Tasks: Backend Service Consolidation

**Input**: Design documents from `/specs/002-swap-hasura-supabase/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/, quickstart.md

**Tests**: Test tasks are REQUIRED. Every user story and behavior change includes automated coverage per constitution and specification gates.

**Organization**: Tasks are grouped by user story so each story can be implemented and validated independently.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare project scaffolding, dependencies, and migration directories for Supabase transition.

- [x] T001 Create Supabase migration and tooling directories in `supabase/migrations/.gitkeep` and `scripts/migration/.gitkeep`
- [x] T002 Add Supabase runtime dependency and script hooks in `package.json`
- [x] T003 [P] Add Supabase environment placeholders in `.env.example`
- [x] T004 [P] Add migration verification report output directory in `test-results/migration/.gitkeep`
- [x] T005 [P] Document dependency intent and alternatives for Supabase in `docs/architecture/dependencies.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish core backend abstractions and migration framework required by all stories.

**CRITICAL**: No user story work starts until this phase is complete.

- [x] T006 Implement centralized Supabase client bootstrap in `src/lib/supabase/client.ts`
- [x] T007 [P] Add runtime configuration accessors for Supabase env values in `src/lib/utils/config.ts`
- [x] T008 Define Supabase row-to-domain mapping helpers in `src/lib/memory/types.ts`
- [x] T009 [P] Create initial Supabase schema and RLS migration in `supabase/migrations/001_init_supabase.sql`
- [x] T010 [P] Create migration run metadata schema in `supabase/migrations/002_migration_run.sql`
- [x] T011 Implement migration runner skeleton with dry-run support in `scripts/migration/migrate-hasura-to-supabase.ts`
- [x] T012 Implement parity verification utility skeleton in `scripts/migration/verify-parity.ts`
- [x] T013 Add migration fixture loading helpers in `tests/contract/fixtures/supabase-fixtures.ts`
- [x] T014 Remove direct Hasura client coupling from sync engine bootstrap in `src/lib/sync/engine.ts`

**Checkpoint**: Foundational platform complete; user stories can begin.

---

## Phase 3: User Story 1 - Preserve Family Task Workflows (Priority: P1) 🎯 MVP

**Goal**: Keep list/item create-edit-complete-delete workflows unchanged while switching backend integration to Supabase.

**Independent Test**: Run list/item lifecycle tests and migration smoke flow; confirm visible behavior is unchanged for core user interactions.

### Tests for User Story 1 (REQUIRED)

- [x] T015 [P] [US1] Add list repository contract parity tests in `tests/contract/lists.supabase.contract.test.ts`
- [x] T016 [P] [US1] Add item repository contract parity tests in `tests/contract/items.supabase.contract.test.ts`
- [x] T017 [P] [US1] Add migration smoke user-flow test in `tests/e2e/migration-smoke.spec.ts`
- [x] T018 [US1] Update list store behavior assertions for Supabase-backed repositories in `tests/unit/list-store.test.ts`
- [x] T019 [US1] Update item store behavior assertions for Supabase-backed repositories in `tests/unit/item-store.test.ts`

### Implementation for User Story 1

- [x] T020 [US1] Replace Hasura-focused client implementation with Supabase adapter in `src/lib/graphql/client.ts`
- [x] T021 [US1] Replace GraphQL operation wrappers with Supabase query helpers in `src/lib/graphql/operations.ts`
- [x] T022 [US1] Implement Supabase-backed list repository operations in `src/lib/memory/list-repository.ts`
- [x] T023 [US1] Implement Supabase-backed item repository operations in `src/lib/memory/item-repository.ts`
- [x] T024 [US1] Update list store integration paths for Supabase repository behavior in `src/lib/stores/list-store.ts`
- [x] T025 [US1] Update item store integration paths for Supabase repository behavior in `src/lib/stores/item-store.ts`
- [x] T026 [US1] Wire list page data actions to new repository semantics in `src/routes/lists/[listId]/+page.svelte`
- [x] T027 [US1] Add accessible migration-status fallback messaging for degraded backend connectivity in `src/routes/+page.svelte`

**Checkpoint**: User Story 1 is fully functional and independently testable.

---

## Phase 4: User Story 2 - Keep Household Data Accurate (Priority: P2)

**Goal**: Guarantee no data loss/duplication and preserve cross-device synchronization correctness after migration.

**Independent Test**: Execute migration rehearsal plus parity checks and multi-context sync tests; verify zero data loss/duplication and convergence thresholds.

### Tests for User Story 2 (REQUIRED)

- [x] T028 [P] [US2] Add sync contract parity tests for incremental changes and tombstones in `tests/contract/sync.supabase.contract.test.ts`
- [x] T029 [P] [US2] Add migration idempotency contract suite in `tests/contract/migration-idempotency.contract.test.ts`
- [x] T030 [P] [US2] Add migration compatibility contract suite in `tests/contract/migration-compatibility.contract.test.ts`
- [x] T031 [P] [US2] Add cross-device convergence E2E scenario in `tests/e2e/cross-device-sync.spec.ts`
- [x] T032 [P] [US2] Add reconnect replay convergence E2E scenario in `tests/e2e/reconnect-after-cutover.spec.ts`

### Implementation for User Story 2

- [x] T033 [US2] Implement deterministic incremental sync pull behavior in `src/lib/sync/list-sync.ts`
- [x] T034 [US2] Implement offline queue retry metadata and idempotent dispatch in `src/lib/sync/offline-queue.ts`
- [x] T035 [US2] Implement realtime-triggered pull reconciliation for Supabase updates in `src/lib/sync/realtime.ts`
- [x] T036 [US2] Integrate queue-flush and pull ordering guarantees in `src/lib/sync/engine.ts`
- [x] T037 [US2] Implement migration run execution and state recording in `scripts/migration/migrate-hasura-to-supabase.ts`
- [x] T038 [US2] Implement parity verification reports (counts, key-sets, fingerprints, integrity, duplicates) in `scripts/migration/verify-parity.ts`
- [x] T039 [US2] Add migration fixture parity datasets for pre/post validation in `tests/contract/fixtures/hasura-fixtures.ts`
- [x] T040 [US2] Add migration runbook for rehearsal, cutover, and rollback in `docs/architecture/supabase-migration-runbook.md`

**Checkpoint**: User Stories 1 and 2 both work independently with validated data integrity and synchronization.

---

## Phase 5: User Story 3 - Simplify Backend Operations (Priority: P3)

**Goal**: Remove remaining Hasura operational coupling so maintainers run one backend platform.

**Independent Test**: Verify runtime config, docs, and dependency tree no longer require Hasura-specific operational steps.

### Tests for User Story 3 (REQUIRED)

- [x] T041 [P] [US3] Add operational regression test asserting Supabase-only runtime configuration in `tests/unit/supabase-runtime-config.test.ts`
- [x] T042 [P] [US3] Add high-volume migrated-household E2E coverage in `tests/e2e/migration-regression-empty-and-large-households.spec.ts`

### Implementation for User Story 3

- [x] T043 [US3] Remove obsolete Hasura contract usage and reference Supabase contract in `specs/001-family-todo-pwa/contracts/hasura-graphql-contract.md`
- [x] T044 [US3] Update architecture dependency inventory to Supabase-only backend operations in `docs/architecture/dependencies.md`
- [x] T045 [US3] Document Supabase operational checks and incident playbook in `docs/architecture/supabase-operations.md`
- [x] T046 [US3] Remove deprecated Hasura environment references from app and test configs in `src/lib/utils/config.ts` and `playwright.config.ts`

**Checkpoint**: All user stories are independently functional and operational simplification is complete.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final hardening, validation, and documentation alignment across all stories.

- [x] T047 [P] Add final migration quickstart verification steps based on implemented commands in `specs/002-swap-hasura-supabase/quickstart.md`
- [x] T048 [P] Refresh feature research decisions with implementation outcomes in `specs/002-swap-hasura-supabase/research.md`
- [x] T049 Run full lint and automated test suite gates for release readiness via `package.json`
- [x] T050 Capture post-cutover metrics checklist and acceptance sign-off template in `docs/architecture/supabase-migration-runbook.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- Setup (Phase 1): No dependencies.
- Foundational (Phase 2): Depends on Setup; blocks all user stories.
- User Story phases (Phase 3-5): Depend on Foundational completion.
- Polish (Phase 6): Depends on completion of all targeted user stories.

### User Story Dependencies

- User Story 1 (P1): Starts after Foundational; no dependency on other stories.
- User Story 2 (P2): Starts after Foundational and can run in parallel with US1 once shared foundations are done.
- User Story 3 (P3): Starts after Foundational; should complete after US1 and US2 backend behavior is stable.

### Within Each User Story

- Tests are created first and must fail before implementation.
- Repository and sync behavior changes precede UI integration refinements.
- Story-specific validations complete before moving to next story priority.

### Parallel Opportunities

- Setup: T003, T004, T005 can run in parallel.
- Foundational: T007, T009, T010 can run in parallel.
- US1 tests: T015, T016, T017 can run in parallel.
- US2 tests: T028, T029, T030, T031, T032 can run in parallel.
- US3 tests: T041 and T042 can run in parallel.

---

## Parallel Example: User Story 2

```bash
# Run US2 contract test authoring in parallel
Task: T028 tests/contract/sync.supabase.contract.test.ts
Task: T029 tests/contract/migration-idempotency.contract.test.ts
Task: T030 tests/contract/migration-compatibility.contract.test.ts

# Run US2 E2E scenario authoring in parallel
Task: T031 tests/e2e/cross-device-sync.spec.ts
Task: T032 tests/e2e/reconnect-after-cutover.spec.ts
```

---

## Implementation Strategy

### MVP First (User Story 1 only)

1. Complete Phase 1 and Phase 2.
2. Complete Phase 3 (US1).
3. Validate list/item workflow parity via US1 tests before any broader migration rollout.

### Incremental Delivery

1. Deliver US1 to preserve user workflow continuity.
2. Deliver US2 to enforce migration integrity and sync correctness gates.
3. Deliver US3 to complete operational simplification and remove Hasura coupling.
4. Finish with Phase 6 polish tasks and final validation.

### Team Parallel Strategy

1. Team aligns on Setup + Foundational tasks first.
2. After Foundational checkpoint:
   - Engineer A: US1 repository/store integration.
   - Engineer B: US2 migration tooling and parity verification.
   - Engineer C: US2/US3 E2E and operational documentation.
3. Merge behind feature flags/checkpoints with required test gates passing.

---

## Notes

- `[P]` indicates tasks that can run concurrently on separate files.
- `[US#]` tags map each task to its user story for traceability.
- Commit after each task or tightly related task group.
- Keep all migration checks and replay validations deterministic and reproducible.
