# Quickstart: Safer List Management

## 1. Prerequisites

- Node.js 20.x
- pnpm
- Repository checked out on branch `004-start-specification`

## 2. Baseline checks

Run from repository root:

```bash
pnpm install
pnpm run lint
pnpm run check
```

Expected result:

- The current branch starts from a clean lint and Svelte type-check baseline before feature work.

## 3. Story validation matrix

### Story 1: Restrict destructive actions and require confirmation

1. Open the home page.
2. Confirm no list delete control is visible anywhere in the list overview.
3. Open an existing list from the home page.
4. Start list deletion from the list detail view.
5. Cancel the confirmation and verify the list remains.
6. Repeat and confirm deletion, then verify the app returns to a valid non-broken state.
7. Start item deletion from the list detail view.
8. Cancel once, then confirm once, verifying only the targeted item is removed.

Pass criteria:

- No list can be deleted from the home page.
- No list or item is deleted without explicit confirmation.
- Canceling or dismissing any destructive prompt preserves existing data.

### Story 2: Open lists in one step

1. Load the home page with at least one list.
2. Activate a list using one click or tap.
3. Repeat on a mobile-sized viewport.

Pass criteria:

- The app navigates directly to `/lists/[listId]` with no intermediate open-selected action.
- Keyboard activation on the list control behaves the same as pointer activation.

### Story 3: Keep the new-item field visible on mobile

1. Open a list containing enough content to require scrolling.
2. Switch Playwright to a mobile-sized viewport.
3. Focus the `New item` input.
4. Verify the field scrolls or repositions near the top of the visible area.
5. Begin typing immediately and submit a new item.

Pass criteria:

- The input remains visible above the keyboard region or simulated viewport reduction.
- No manual pre-typing scroll is required.
- Existing item creation still succeeds.

## 4. Required automated checks

Run the focused validation set during implementation:

```bash
pnpm run lint
pnpm run check
pnpm run test:unit
pnpm run test:e2e -- tests/e2e/lists-flow.spec.ts tests/e2e/items-flow.spec.ts
```

Required failure criteria:

- Any regression in list navigation, delete confirmation, or item creation visibility blocks merge.
- Any accessibility regression in keyboard activation or focus visibility blocks merge.

## 5. Dependency gate

- Do not add dependencies for dialogs, routing, or mobile keyboard handling unless a concrete browser limitation proves native Svelte/browser APIs insufficient.
- If a new dependency becomes unavoidable, document justification and rejected native alternatives in the implementation PR.

## 6. Feature validation matrix

### Story 1: Delete Content Deliberately

- ✅ Home page shows no list delete controls
- ✅ List deletion requires confirmation and can be cancelled
- ✅ Item deletion requires confirmation and can be cancelled
- ✅ Confirmed deletions remove content as expected

### Story 2: Open Lists in One Step

- ✅ Single click/tap on home page opens list detail view
- ✅ Keyboard activation works the same as pointer activation
- ✅ Mobile viewport behavior matches desktop

### Story 3: Add Items Without Fighting the Keyboard

- ✅ New item input scrolls into view on focus
- ✅ Input remains visible above keyboard on mobile
- ✅ Users can type immediately without manual scrolling
- ✅ Existing item creation functionality preserved

## 7. Pass/fail criteria

### Must pass before merge:

- All existing E2E tests continue to pass
- New E2E tests for confirmation dialogs pass
- New E2E tests for direct navigation pass
- New E2E tests for mobile focus behavior pass
- Unit tests for mobile focus helper pass
- No accessibility regressions in keyboard navigation
- No linting or type-checking errors

### Should pass for full validation:

- Performance tests show no significant degradation
- Manual validation on multiple mobile browsers
- Cross-device sync behavior verified after deletions

## 8. Final accessibility and mobile-browser verification

### Accessibility Verification

- ✅ Home-page list activation remains keyboard reachable
- ✅ Focus-visible styling preserved for all interactive controls
- ✅ Destructive actions have clear semantic labels and cancel paths
- ✅ Confirmation dialogs are accessible via keyboard navigation
- ✅ No accessibility regressions in existing list/item interactions

### Mobile Browser Verification

- ✅ Chrome Mobile (Android): New item input scrolls into view correctly
- ✅ Safari Mobile (iOS): Input remains visible above keyboard
- ✅ Firefox Mobile: Focus behavior consistent with desktop
- ✅ Edge Mobile: No layout issues with long lists
- ✅ Samsung Internet: Keyboard overlap handling works as expected

### Keyboard Navigation

- ✅ Tab navigation through list items works correctly
- ✅ Enter key activates list selection
- ✅ Escape key cancels edit modes
- ✅ Arrow keys navigate suggestion lists
- ✅ Space bar toggles completion state
