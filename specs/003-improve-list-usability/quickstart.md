# Quickstart: Improve List Usability

## Prerequisites

- Node.js 20.x
- npm install completed
- Feature branch `003-improve-list-usability`

## Validation Matrix

### Story 1: Ordering + Larger Toggle Targets

1. Open a list with mixed completed/incomplete items.
2. Confirm incomplete items render first.
3. Confirm each completion-state group is alphabetically ordered.
4. Click the larger completion hit box and verify state toggles.
5. Use keyboard Tab/Space to toggle and confirm focus visibility.

Pass criteria:
- All ordering checks are deterministic.
- Pointer and keyboard completion interactions succeed on first attempt.

### Story 2: Duplicate Suggestions While Typing

1. Type a value similar to an existing item (case and spacing variants).
2. Confirm suggestions appear under the new item field.
3. Navigate suggestions with ArrowUp/ArrowDown.

Pass criteria:
- Suggestions appear for strong and medium-confidence matches.
- No suggestion appears for unrelated text.

### Story 3: Reactivate Existing vs Create New

1. Type text matching an existing item.
2. Confirm duplicate resolution actions appear.
3. Choose `Mark existing as uncompleted` and verify original item becomes active (uncompleted).
4. Repeat and choose `Create new anyway` and verify a distinct item is created.

Pass criteria:
- No silent overwrite occurs.
- Both explicit paths produce expected result.

## Accessibility Verification

- New item input includes helper text and remains label-associated.
- Suggestion list has semantic grouping and keyboard path.
- Toggle controls maintain semantic checkbox behavior and visible focus states.

## Command Checklist

```bash
npm run lint
npm run test:unit
npm run test:e2e -- tests/e2e/items-flow.spec.ts
```
