# Tasks: Improve List Usability

**Input**: Design documents from `/specs/003-improve-list-usability/`
**Prerequisites**: plan.md (required), spec.md (required for user stories)

**Tests**: Test tasks are REQUIRED. Every user story and behavior change includes automated coverage per the constitution.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare test harness and feature-scoped documentation alignment.

- [X] T001 Add feature test matrix and pass/fail criteria in specs/003-improve-list-usability/quickstart.md
- [X] T002 [P] Add dependency decision note confirming zero new packages in specs/003-improve-list-usability/research.md
- [X] T003 [P] Add item usability acceptance checklist in specs/003-improve-list-usability/checklists/requirements.md

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish shared ordering and matching logic used by all stories.

**CRITICAL**: No user story implementation starts until this phase is complete.

- [X] T004 Create normalized item text helpers in src/lib/utils/item-text.ts
- [X] T005 [P] Create stable group+alphabetical ordering helper in src/lib/utils/item-ordering.ts
- [X] T006 [P] Create match scoring helper for duplicate suggestions in src/lib/utils/item-matching.ts
- [X] T007 Wire ordering helper into item derivation pipeline in src/lib/stores/item-store.ts
- [X] T008 Add foundational unit tests for normalization, ordering, and scoring in tests/unit/item-store.test.ts
- [X] T009 Document shared UX/accessibility rules for list interactions in specs/003-improve-list-usability/research.md

**Checkpoint**: Shared ordering/matching primitives are complete; user stories can proceed.

---

## Phase 3: User Story 1 - Find and Act on Incomplete Tasks Faster (Priority: P1) MVP

**Goal**: Show incomplete items first, alphabetical within groups, with larger and easier completion hit targets.

**Independent Test**: Render a mixed list, verify grouped alphabetical ordering, and toggle completion through enlarged interactive target area.

### Tests for User Story 1 (REQUIRED)

- [X] T010 [P] [US1] Add ordering behavior unit tests for mixed completion states in tests/unit/item-store.test.ts
- [X] T011 [P] [US1] Add UI interaction tests for enlarged completion hit area in tests/e2e/items-flow.spec.ts
- [X] T012 [US1] Add regression contract assertions for deterministic item ordering in tests/contract/items.supabase.contract.test.ts

### Implementation for User Story 1

- [X] T013 [US1] Apply grouped alphabetical ordering in store selectors in src/lib/stores/item-store.ts
- [X] T014 [US1] Ensure page-level item list consumers use sorted selectors in src/routes/lists/[listId]/+page.svelte
- [X] T015 [US1] Expand completion control click/tap target structure in src/lib/components/TodoItemList.svelte
- [X] T016 [US1] Update completion control styling for larger pointer target without CSS framework in src/lib/components/TodoItemList.svelte
- [X] T017 [US1] Verify keyboard and focus behavior for updated completion controls in src/lib/components/TodoItemList.svelte

**Checkpoint**: User Story 1 is functional and independently testable.

---

## Phase 4: User Story 2 - Avoid Duplicate Entries During Add (Priority: P2)

**Goal**: Surface likely existing-item matches while typing in the new item field to reduce accidental duplicates.

**Independent Test**: Type partial and near-duplicate input values and verify relevant existing-item suggestions appear before submit.

### Tests for User Story 2 (REQUIRED)

- [X] T018 [P] [US2] Add matching heuristic unit tests for case/whitespace normalization in tests/unit/item-store.test.ts
- [X] T019 [P] [US2] Add suggestion visibility and ranking E2E checks in tests/e2e/items-flow.spec.ts
- [X] T020 [US2] Add repository-level duplicate suggestion behavior test coverage in tests/contract/items.supabase.contract.test.ts

### Implementation for User Story 2

- [X] T021 [US2] Add suggestion state and selectors for new item draft input in src/lib/stores/item-store.ts
- [X] T022 [US2] Integrate match scoring helper into add-item typing flow in src/lib/stores/item-store.ts
- [X] T023 [US2] Render suggestion list under new item field with semantic roles in src/lib/components/TodoItemList.svelte
- [X] T024 [US2] Add keyboard navigation for suggestion list interactions in src/lib/components/TodoItemList.svelte
- [X] T025 [US2] Add empty/low-confidence suggestion handling messages in src/lib/components/TodoItemList.svelte

**Checkpoint**: User Stories 1 and 2 are both functional and independently testable.

---

## Phase 5: User Story 3 - Reactivate Potential Duplicates (Priority: P3)

**Goal**: Let users explicitly mark an existing matched item as uncompleted instead of creating a duplicate.

**Independent Test**: Enter text that strongly matches an existing item and confirm reactivate-existing vs create-new choices work as expected.

### Tests for User Story 3 (REQUIRED)

- [X] T026 [P] [US3] Add unit tests for update-existing decision flow and guardrails in tests/unit/item-store.test.ts
- [X] T027 [P] [US3] Add E2E coverage for confirm-update and create-anyway branches in tests/e2e/items-flow.spec.ts
- [X] T028 [US3] Add contract tests for completion update path used by duplicate resolution in tests/contract/items.supabase.contract.test.ts

### Implementation for User Story 3

- [X] T029 [US3] Add explicit reactivate-existing action handler in add-item workflow in src/lib/stores/item-store.ts
- [X] T030 [US3] Reuse existing item update repository method for duplicate-resolution edits in src/lib/memory/item-repository.ts
- [X] T031 [US3] Add confirmation UI and create-anyway fallback controls in src/lib/components/TodoItemList.svelte
- [X] T032 [US3] Preserve audit-safe behavior so no silent overwrite occurs in src/lib/components/TodoItemList.svelte

**Checkpoint**: All user stories are independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final hardening and documentation/test completion across stories.

- [X] T033 [P] Add final accessibility verification notes for changed interactions in specs/003-improve-list-usability/quickstart.md
- [X] T034 [P] Add edge-case test scenarios for long text and tie ordering in tests/e2e/items-flow.spec.ts
- [ ] T035 Run full lint and test gates for feature readiness via package.json
- [X] T036 Document implementation outcomes and no-new-dependency confirmation in specs/003-improve-list-usability/research.md

---

## Dependencies & Execution Order

### Phase Dependencies

- Setup (Phase 1): no dependencies.
- Foundational (Phase 2): depends on Setup; blocks all user stories.
- User Stories (Phase 3+): depend on Foundational completion.
- Polish (Phase 6): depends on all targeted user stories complete.

### User Story Dependencies

- US1 (P1): can start immediately after Foundational.
- US2 (P2): can start after Foundational; independent of US1 implementation details.
- US3 (P3): depends on US2 suggestion infrastructure and starts after US2 core implementation.

### Within Each User Story

- Tests MUST be authored first and fail before implementation.
- Shared/state logic before UI wiring.
- Accessibility verification before story completion.

### Parallel Opportunities

- Setup: T002 and T003 can run in parallel.
- Foundational: T005 and T006 can run in parallel.
- US1 tests: T010 and T011 can run in parallel.
- US2 tests: T018 and T019 can run in parallel.
- US3 tests: T026 and T027 can run in parallel.
- Polish: T033 and T034 can run in parallel.

---

## Parallel Example: User Story 1

```bash
Task: T010 tests/unit/item-store.test.ts
Task: T011 tests/e2e/items-flow.spec.ts
```

## Parallel Example: User Story 2

```bash
Task: T018 tests/unit/item-store.test.ts
Task: T019 tests/e2e/items-flow.spec.ts
```

## Parallel Example: User Story 3

```bash
Task: T026 tests/unit/item-store.test.ts
Task: T027 tests/e2e/items-flow.spec.ts
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 and Phase 2.
2. Complete Phase 3 (US1).
3. Validate independent behavior for ordering and larger hit targets.

### Incremental Delivery

1. Deliver US1 for immediate usability gains.
2. Deliver US2 for duplicate prevention via suggestions.
3. Deliver US3 for explicit update-existing workflow.
4. Finish polish and full validation gates.

### Parallel Team Strategy

1. Team completes Setup and Foundational phases together.
2. After Foundational:
   - Engineer A: US1 implementation and tests.
   - Engineer B: US2 implementation and tests.
   - Engineer C: US3 implementation and tests after US2 suggestion layer is ready.
