# Tasks: Safer List Management

**Input**: Design documents from `/specs/004-safer-list-management/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/, quickstart.md

**Tests**: Test tasks are REQUIRED. Every user story and behavior change includes automated coverage per the constitution.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Align documentation, dependency decisions, and validation expectations before implementation.

- [x] T001 Update feature validation matrix and pass/fail criteria in specs/004-safer-list-management/quickstart.md
- [x] T002 [P] Record native confirm and mobile viewport decisions with no-new-dependency confirmation in specs/004-safer-list-management/research.md
- [x] T003 [P] Add feature-specific readiness bullets for delete safety, direct navigation, and mobile entry in specs/004-safer-list-management/checklists/requirements.md

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish shared test harness and stable route hooks for the changed list-management interactions.

**CRITICAL**: No user story implementation starts until this phase is complete.

- [x] T004 Create reusable Playwright seeding helpers for home-page and list-detail scenarios in tests/e2e/helpers.ts
- [x] T005 [P] Create reusable long-list mobile fixture data for item-entry scenarios in tests/e2e/mobile-entry.fixture.ts
- [x] T006 [P] Add stable route hooks and test identifiers for list activation and list deletion entry points in src/routes/+page.svelte and src/routes/lists/[listId]/+page.svelte
- [x] T007 Wire shared E2E helpers into existing list and item flow suites in tests/e2e/lists-flow.spec.ts and tests/e2e/items-flow.spec.ts

**Checkpoint**: Shared route hooks and E2E fixtures are ready; user stories can now proceed independently.

---

## Phase 3: User Story 1 - Delete Content Deliberately (Priority: P1) MVP

**Goal**: Restrict list deletion to the detail view and require explicit confirmation before deleting lists or items.

**Independent Test**: Verify the home page shows no list delete control, then confirm and cancel list and item deletions from the list detail route and observe the correct preserved or deleted result.

### Tests for User Story 1 (REQUIRED)

- [x] T008 [P] [US1] Add list delete confirm and cancel coverage in tests/e2e/lists-flow.spec.ts
- [x] T009 [P] [US1] Add item delete confirm and cancel coverage in tests/e2e/items-flow.spec.ts
- [x] T010 [US1] Add list removal fallback regression coverage for confirmed deletes in tests/unit/list-store.test.ts

### Implementation for User Story 1

- [x] T011 [US1] Remove home-page list delete controls and delete callback wiring in src/lib/components/ListSidebar.svelte
- [x] T012 [US1] Update the home route so list overview interactions no longer expose destructive actions in src/routes/+page.svelte
- [x] T013 [US1] Add list-level delete action with native confirmation and post-delete redirect in src/routes/lists/[listId]/+page.svelte
- [x] T014 [US1] Gate item deletion behind explicit confirmation while preserving existing queue and repository behavior in src/lib/components/TodoItemList.svelte and src/routes/lists/[listId]/+page.svelte
- [x] T015 [US1] Verify destructive copy, semantic labels, and focus handling for detail-view delete actions in src/routes/lists/[listId]/+page.svelte and src/lib/components/TodoItemList.svelte

**Checkpoint**: User Story 1 is fully functional and independently testable.

---

## Phase 4: User Story 2 - Open Lists in One Step (Priority: P2)

**Goal**: Let users open a list directly from the home page with a single click, tap, or keyboard activation.

**Independent Test**: Load the home page with lists present and verify one pointer or keyboard interaction opens the selected list route on desktop and mobile-sized viewports.

### Tests for User Story 2 (REQUIRED)

- [x] T016 [P] [US2] Add direct-open pointer navigation coverage for home-page lists in tests/e2e/lists-flow.spec.ts
- [x] T017 [P] [US2] Add keyboard activation and mobile-sized direct-open coverage in tests/e2e/lists-navigation.spec.ts

### Implementation for User Story 2

- [x] T018 [US2] Convert the home-page list primary action from selection-only to route navigation in src/lib/components/ListSidebar.svelte
- [x] T019 [US2] Simplify selected-list detail messaging to match direct-open navigation in src/routes/+page.svelte
- [x] T020 [US2] Preserve accessible naming and focus-visible treatment for the updated home-page list activators in src/lib/components/ListSidebar.svelte

**Checkpoint**: User Stories 1 and 2 are both functional and independently testable.

---

## Phase 5: User Story 3 - Add Items Without Fighting the Keyboard (Priority: P3)

**Goal**: Keep the new-item input visible and ready for typing when it receives focus on mobile devices.

**Independent Test**: Open a long list on a mobile-sized viewport, focus the new-item input, confirm it scrolls into a visible typing position above the keyboard region, and create an item successfully.

### Tests for User Story 3 (REQUIRED)

- [x] T021 [P] [US3] Add mobile long-list focus visibility coverage for the new-item input in tests/e2e/items-flow.spec.ts
- [x] T022 [P] [US3] Add unit tests for planned mobile focus repositioning helper in tests/unit/mobile-focus.test.ts

### Implementation for User Story 3

- [x] T023 [US3] Create native scroll and viewport focus helper for item entry in src/lib/utils/mobile-focus.ts
- [x] T024 [US3] Integrate mobile focus repositioning and retry timing into the new-item field flow in src/lib/components/TodoItemList.svelte
- [x] T025 [US3] Adjust list detail layout and lifecycle hooks so mobile keyboard entry remains stable in src/routes/lists/[listId]/+page.svelte
- [x] T026 [US3] Preserve label, helper-text, duplicate-suggestion, and submit behavior during input repositioning in src/lib/components/TodoItemList.svelte

**Checkpoint**: All user stories are independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final hardening, documentation updates, and release-gate validation across stories.

- [x] T027 [P] Add final accessibility and mobile-browser verification notes in specs/004-safer-list-management/quickstart.md
- [x] T028 [P] Document final implementation outcomes and confirm zero new dependencies in specs/004-safer-list-management/research.md
- [x] T029 Run focused lint, check, unit, and E2E feature gates via package.json

---

## Dependencies & Execution Order

### Phase Dependencies

- Setup (Phase 1): no dependencies.
- Foundational (Phase 2): depends on Setup; blocks all user stories.
- User Stories (Phase 3+): depend on Foundational completion.
- Polish (Phase 6): depends on all targeted user stories being complete.

### User Story Dependencies

- US1 (P1): can start immediately after Foundational and is the MVP slice.
- US2 (P2): can start after Foundational and does not depend on US1 implementation details.
- US3 (P3): can start after Foundational and remains independent of US1 and US2 aside from shared route/test hooks.

### Within Each User Story

- Tests MUST be authored first and fail before implementation.
- Route/store behavior changes before UI polish completion.
- Accessibility verification completes before closing the story.

### Parallel Opportunities

- Setup: T002 and T003 can run in parallel.
- Foundational: T005 and T006 can run in parallel.
- US1 tests: T008 and T009 can run in parallel.
- US2 tests: T016 and T017 can run in parallel.
- US3 tests: T021 and T022 can run in parallel.
- Polish: T027 and T028 can run in parallel.

---

## Parallel Example: User Story 1

```bash
Task: T008 tests/e2e/lists-flow.spec.ts
Task: T009 tests/e2e/items-flow.spec.ts
```

## Parallel Example: User Story 2

```bash
Task: T016 tests/e2e/lists-flow.spec.ts
Task: T017 tests/e2e/lists-navigation.spec.ts
```

## Parallel Example: User Story 3

```bash
Task: T021 tests/e2e/items-flow.spec.ts
Task: T022 tests/unit/mobile-focus.test.ts
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 and Phase 2.
2. Complete Phase 3 (US1).
3. Validate delete restriction and confirmation behavior independently.

### Incremental Delivery

1. Deliver US1 to reduce accidental deletion risk.
2. Deliver US2 to remove the extra home-page navigation step.
3. Deliver US3 to improve mobile item-entry usability.
4. Finish polish and full validation gates.

### Parallel Team Strategy

1. Complete Setup and Foundational phases together.
2. After Foundational:
   - Engineer A: US1 tests and delete-flow implementation.
   - Engineer B: US2 direct-navigation tests and home-page interaction updates.
   - Engineer C: US3 mobile-focus helper/tests and input-visibility updates.
