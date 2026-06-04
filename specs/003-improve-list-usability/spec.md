# Feature Specification: Improve List Usability

**Feature Branch**: `003-improve-list-usability`
**Created**: 2026-05-07
**Status**: Draft
**Input**: User description: "Improve list usability. I would like uncompleted items to moved above completed items. It'd like items to be ordered alphabetically, which means uncompleted ordered, then completed ordered. I'd like the clickable areas within the items to be bigger as it's difficult to hit the checkbox. Finally, I'd like not duplicate items, which means there needs to be a search feature within the #new-item-description field and it must be clever enough to make edits to the existing item instead of creating a new one."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Find and Act on Incomplete Tasks Faster (Priority: P1)

As a household member, I can immediately see incomplete items at the top of a list and interact with them using larger click/tap targets so I can complete tasks quickly with fewer mis-clicks.

**Why this priority**: Faster completion of open tasks is the primary daily value of the product, and interaction friction directly harms that value.

**Independent Test**: Can be fully tested by opening a list containing mixed completion states, verifying sort order, and completing items through both checkbox and row-level click/tap targets.

**Acceptance Scenarios**:

1. **Given** a list contains both incomplete and completed items, **When** the list is displayed, **Then** all incomplete items appear before all completed items.
2. **Given** multiple incomplete items with different names, **When** the list is displayed, **Then** incomplete items are ordered alphabetically and completed items are ordered alphabetically in their own group.
3. **Given** a user clicks or taps within the completion control area for an item, **When** the interaction occurs, **Then** the completion state toggles reliably without requiring pixel-precise targeting.

---

### User Story 2 - Avoid Duplicate Entries During Add (Priority: P2)

As a household member, I can see likely existing matches while typing a new item so I do not accidentally create duplicates.

**Why this priority**: Duplicate tasks create confusion and reduce trust in the list, but users can still complete tasks without this enhancement.

**Independent Test**: Can be tested by typing partial and near-duplicate text in the new-item input and validating that existing likely matches are shown before submit.

**Acceptance Scenarios**:

1. **Given** existing items in the list, **When** a user types in the new-item field, **Then** matching or similar existing items are surfaced in-context before a new item is created.
2. **Given** no meaningful match exists, **When** the user submits the new item, **Then** a new item is created normally.

---

### User Story 3 - Reactivate Potential Duplicates (Priority: P3)

As a household member, I can choose to reactivate an existing matched item as uncompleted instead of creating a duplicate so list quality stays clean over time.

**Why this priority**: This improves long-term list hygiene and reduces cleanup work, but can follow after duplicate awareness and sorting improvements.

**Independent Test**: Can be tested by typing text that matches an existing item and confirming the flow reactivates that existing item to uncompleted instead of creating a second copy.

**Acceptance Scenarios**:

1. **Given** the input text clearly matches an existing item, **When** the user confirms the suggested action, **Then** the existing item is marked uncompleted and no new duplicate item is created.
2. **Given** the user rejects the update suggestion, **When** they proceed, **Then** they can still create a distinct new item intentionally.

---

### Edge Cases

- Items differ only by casing, punctuation, or extra whitespace (for example, "Milk", "milk", or "milk ").
- Multiple items would sort to the same alphabetical position.
- Existing item is completed but a new entry suggests an incomplete variant of the same task.
- Very long item text still needs discoverable suggestions and tappable controls without layout breakage.
- Rapid typing or offline mode temporarily prevents suggestion refresh.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The system MUST display incomplete items before completed items in every list view.
- **FR-002**: The system MUST apply alphabetical ordering by item description within each completion-state group.
- **FR-003**: The system MUST keep list ordering consistent immediately after create, update, delete, or completion toggle actions.
- **FR-004**: Completion controls MUST provide larger clickable/tappable target areas than the current baseline and remain operable with mouse, touch, and keyboard.
- **FR-005**: The new-item description field MUST provide in-context search suggestions for existing items as the user types.
- **FR-006**: Suggestion behavior MUST include normalized matching that accounts for case differences and surrounding whitespace.
- **FR-007**: When user input strongly matches an existing item, the system MUST present an explicit option to mark that existing item as uncompleted instead of creating a new one.
- **FR-008**: Duplicate prevention behavior MUST never silently modify an existing item; user confirmation is required before applying a status change to a matched item.
- **FR-009**: Users MUST be able to intentionally create a distinct new item even when suggestions are shown.
- **FR-010**: User-facing flows MUST define accessibility acceptance criteria (keyboard access, focus visibility, semantic labeling, and contrast expectations) for affected screens.
- **FR-011**: Feature scope MUST define required automated tests and failure criteria before implementation begins.
- **FR-012**: Any new dependency MUST include explicit justification and a simpler/native alternative assessment.
- **FR-013**: Primary user journeys MUST avoid additional setup steps or configuration.

### Key Entities _(include if feature involves data)_

- **List Item**: A household task entry with description text, completion state, and list membership; used for ordering, matching, and updates.
- **New Item Draft**: The in-progress text entered in the add-item field, used to drive suggestion lookup and duplicate-prevention decisions.
- **Suggestion Match**: A ranked relationship between New Item Draft and one or more existing List Items that may represent a duplicate or edit target.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: In usability validation, at least 95% of participants can mark an item complete on the first attempt without pointer re-positioning.
- **SC-002**: In acceptance tests, 100% of rendered lists show incomplete items first and alphabetical ordering within both incomplete and completed groups.
- **SC-003**: During duplicate-entry test scenarios, accidental duplicate creations are reduced by at least 80% compared with the current baseline behavior.
- **SC-004**: At least 90% of users presented with a strong duplicate suggestion choose either update-existing or intentional-create in a single interaction without abandoning the flow.

## Assumptions

- Primary use remains household task entry and completion on both desktop and mobile-sized screens.
- Existing item descriptions are treated as the canonical text source for sorting and matching.
- Duplicate detection uses practical text normalization and similarity heuristics, not domain-specific AI or external services.
- This feature applies within a single list context and does not attempt cross-list duplicate prevention.
- Existing item retrieval and update behavior from the current list repository remains available for suggestion and edit flows.
