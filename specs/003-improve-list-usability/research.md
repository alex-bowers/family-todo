# Research: Improve List Usability

## Decision 1: Keep dependency footprint unchanged

- Decision: Use native JavaScript text normalization, ranking, and sorting helpers.
- Rationale: Meets constitutional requirement for intentional/minimal dependencies.
- Alternatives considered: Fuzzy matching package; rejected because this feature needs lightweight behavior and predictable scoring.

## Decision 2: Incomplete-first grouped alphabetical ordering

- Decision: Display items grouped by completion state (incomplete first), then alphabetically by normalized description.
- Rationale: Users can act on open tasks faster and scan lists consistently.
- Alternatives considered: Pure alphabetical ordering; rejected because completed items can bury active tasks.

## Decision 3: Explicit duplicate-resolution flow

- Decision: Present suggestion matches while typing and require user choice between update-existing and create-new.
- Rationale: Prevents accidental duplicates without silently mutating records.
- Alternatives considered: Auto-update on exact match; rejected for safety and auditability.

## Decision 4: Larger pointer targets without CSS frameworks

- Decision: Increase checkbox hit area using semantic label wrappers and local component styles.
- Rationale: Improves click/tap reliability and mobile usability while preserving accessibility semantics.
- Alternatives considered: CSS framework utility classes; rejected per feature constraints.

## Shared UX and Accessibility Rules

- Preserve semantic checkbox and form labels.
- Keep suggestion interactions keyboard accessible (arrow keys + enter + escape).
- Maintain visible focus indicators on all interactive controls.
- Avoid additional setup/options in primary add-item flow.

## Implementation Outcomes

- Dependency changes: none.
- CSS framework additions: none.
- Behavior changes are isolated to item ordering and item-entry interactions.
