# Tasks: FamilyToDo Multi-List PWA

**Input**: Design documents from `/specs/001-family-todo-pwa/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Test tasks are REQUIRED. Every user story and behavior change includes automated coverage.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and baseline tooling for SvelteKit + Cloudflare Pages + PWA

- [x] T001 Initialize SvelteKit project dependencies and scripts in package.json
- [x] T002 Configure Cloudflare Pages adapter and build settings in svelte.config.js
- [x] T003 [P] Configure linting and formatting rules in eslint.config.js
- [x] T004 [P] Configure unit and E2E test runners in vite.config.ts
- [x] T005 [P] Create baseline PWA manifest and icon references in static/manifest.webmanifest

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core shared memory, sync, and data boundaries required before any user story

**⚠️ CRITICAL**: No user story implementation starts before this phase is complete

- [x] T006 Create Hasura schema migration for households, lists, and items in hasura/migrations/001_init.sql
- [x] T007 [P] Define GraphQL operations from contract in src/lib/graphql/operations.ts
- [x] T008 [P] Implement GraphQL client and env wiring in src/lib/graphql/client.ts
- [x] T009 Define shared domain types for memory entities in src/lib/memory/types.ts
- [x] T010 [P] Implement local cache adapter for offline mirror in src/lib/memory/cache.ts
- [x] T011 [P] Implement sync engine with last-write-wins policy in src/lib/sync/engine.ts
- [x] T012 Implement household context/session resolver in src/lib/memory/household.ts
- [x] T013 Configure global app error and logging helpers in src/lib/utils/logger.ts
- [x] T014 Document dependency justification and minimal-stack decisions in docs/architecture/dependencies.md
- [x] T015 Create reusable contract test fixtures for Hasura responses in tests/contract/fixtures/hasura-fixtures.ts

**Checkpoint**: Foundation ready; user stories can proceed independently

---

## Phase 3: User Story 1 - Manage Multiple Lists (Priority: P1) 🎯 MVP

**Goal**: Users can create, select, and delete multiple lists with correct empty-state handling

**Independent Test**: Create two lists, delete one, verify selection fallback and remaining list stability

### Tests for User Story 1 (REQUIRED)

- [x] T016 [P] [US1] Add GraphQL contract tests for list queries/mutations in tests/contract/lists.contract.test.ts
- [x] T017 [P] [US1] Add E2E test for list create/delete flow in tests/e2e/lists-flow.spec.ts
- [x] T018 [P] [US1] Add unit tests for list store transitions in tests/unit/list-store.test.ts

### Implementation for User Story 1

- [x] T019 [P] [US1] Implement list repository methods in src/lib/memory/list-repository.ts
- [x] T020 [P] [US1] Implement list state store in src/lib/stores/list-store.ts
- [x] T021 [US1] Build list sidebar and empty-state component in src/lib/components/ListSidebar.svelte
- [x] T022 [US1] Wire list selection/create/delete actions in src/routes/+page.svelte
- [x] T023 [US1] Add accessibility labels and focus behavior for list controls in src/lib/components/ListSidebar.svelte
- [x] T024 [US1] Implement list refresh-on-reconnect sync hook in src/lib/sync/list-sync.ts

**Checkpoint**: User Story 1 is functional and independently testable

---

## Phase 4: User Story 2 - Manage Items Within A List (Priority: P2)

**Goal**: Users can create, edit, complete (strike-through), and delete items in a selected list

**Independent Test**: In one list, add item, edit text, complete/uncomplete, then delete and verify removal

### Tests for User Story 2 (REQUIRED)

- [x] T025 [P] [US2] Add GraphQL contract tests for item mutations/queries in tests/contract/items.contract.test.ts
- [x] T026 [P] [US2] Add E2E test for item lifecycle in tests/e2e/items-flow.spec.ts
- [x] T027 [P] [US2] Add unit tests for item completion display state in tests/unit/item-store.test.ts

### Implementation for User Story 2

- [x] T028 [P] [US2] Implement item repository methods in src/lib/memory/item-repository.ts
- [x] T029 [P] [US2] Implement item state store in src/lib/stores/item-store.ts
- [x] T030 [US2] Build item list/editor component with strike-through styling in src/lib/components/TodoItemList.svelte
- [x] T031 [US2] Wire list-detail item actions in src/routes/lists/[listId]/+page.svelte
- [x] T032 [US2] Add blank-value validation feedback for item edits in src/lib/components/TodoItemList.svelte
- [x] T033 [US2] Add keyboard and focus handling for item actions in src/lib/components/TodoItemList.svelte

**Checkpoint**: User Stories 1 and 2 both work independently

---

## Phase 5: User Story 3 - Install And Reopen As A PWA (Priority: P3)

**Goal**: Users can install the app and maintain cross-device/offline sync behavior

**Independent Test**: Install app on supported browser, relaunch from icon, perform offline change, reconnect and confirm sync

### Tests for User Story 3 (REQUIRED)

- [x] T034 [P] [US3] Add GraphQL contract test for incremental sync query in tests/contract/sync.contract.test.ts
- [x] T035 [P] [US3] Add E2E installability and launch test in tests/e2e/pwa-install.spec.ts
- [x] T036 [P] [US3] Add E2E offline-then-reconnect sync test in tests/e2e/offline-sync.spec.ts

### Implementation for User Story 3

- [x] T037 [P] [US3] Finalize PWA manifest metadata and icons in static/manifest.webmanifest
- [x] T038 [P] [US3] Implement service worker cache/sync behavior in src/service-worker.ts
- [x] T039 [US3] Build install prompt and unsupported-browser fallback in src/lib/components/PwaInstallPrompt.svelte
- [x] T040 [US3] Mount install lifecycle handlers in src/routes/+layout.svelte
- [x] T041 [US3] Implement realtime/polling bridge for cross-device updates in src/lib/sync/realtime.ts
- [x] T042 [US3] Implement offline queue and replay-on-reconnect in src/lib/sync/offline-queue.ts
- [x] T043 [US3] Add accessibility announcements for install/sync status in src/lib/components/PwaInstallPrompt.svelte

**Checkpoint**: All three user stories are independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Hardening, documentation, and quality improvements across stories

- [x] T044 [P] Update Hasura setup and operational notes in specs/001-family-todo-pwa/quickstart.md
- [x] T045 Harden GraphQL role/secret handling in src/lib/graphql/client.ts
- [x] T046 [P] Optimize list and item render/update performance in src/lib/stores/item-store.ts
- [x] T047 [P] Add regression E2E test for concurrent edit conflicts in tests/e2e/sync-conflict.spec.ts
- [x] T048 Run full validation checklist and record outcomes in specs/001-family-todo-pwa/quickstart.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies
- **Phase 2 (Foundational)**: Depends on Phase 1 and blocks all user stories
- **Phase 3 (US1)**: Depends on Phase 2
- **Phase 4 (US2)**: Depends on Phase 2
- **Phase 5 (US3)**: Depends on Phase 2
- **Phase 6 (Polish)**: Depends on completion of selected user stories

### User Story Dependencies

- **US1 (P1)**: Starts after foundational phase; no dependency on other stories
- **US2 (P2)**: Starts after foundational phase; can run independently with seeded list data
- **US3 (P3)**: Starts after foundational phase; validates install/sync behavior using shared memory stack

### Within Each User Story

- Tests first and failing before implementation
- Repository/data access before stores/UI wiring
- UI and accessibility completion before story checkpoint
- Sync integration before final story validation

---

## Parallel Opportunities

- Setup tasks T003-T005 can run in parallel
- Foundational tasks T007, T008, T010, and T011 can run in parallel after T006/T009 alignment
- In each story, contract/E2E/unit tests marked [P] can run in parallel
- Repository/store tasks marked [P] can run in parallel before page wiring
- US1, US2, and US3 can be staffed in parallel after Phase 2 completion

---

## Parallel Example: User Story 1

```bash
# Parallel test work:
Task T016 tests/contract/lists.contract.test.ts
Task T017 tests/e2e/lists-flow.spec.ts
Task T018 tests/unit/list-store.test.ts

# Parallel implementation work:
Task T019 src/lib/memory/list-repository.ts
Task T020 src/lib/stores/list-store.ts
```

## Parallel Example: User Story 2

```bash
# Parallel test work:
Task T025 tests/contract/items.contract.test.ts
Task T026 tests/e2e/items-flow.spec.ts
Task T027 tests/unit/item-store.test.ts

# Parallel implementation work:
Task T028 src/lib/memory/item-repository.ts
Task T029 src/lib/stores/item-store.ts
```

## Parallel Example: User Story 3

```bash
# Parallel test work:
Task T034 tests/contract/sync.contract.test.ts
Task T035 tests/e2e/pwa-install.spec.ts
Task T036 tests/e2e/offline-sync.spec.ts

# Parallel implementation work:
Task T037 static/manifest.webmanifest
Task T038 src/service-worker.ts
```

---

## Implementation Strategy

### MVP First (US1)

1. Complete Phases 1 and 2
2. Complete Phase 3 (US1)
3. Validate list lifecycle independently
4. Demo/deploy MVP if stable

### Incremental Delivery

1. Foundation (Phases 1-2)
2. Deliver US1 (multi-list)
3. Deliver US2 (item lifecycle)
4. Deliver US3 (PWA + sync hardening)
5. Finish with Phase 6 hardening and docs

### Parallel Team Strategy

1. Team completes Setup + Foundational together
2. Then split by story:
   - Dev A: US1
   - Dev B: US2
   - Dev C: US3
3. Rejoin for Polish phase and final validation
