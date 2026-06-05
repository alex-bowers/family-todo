# Research: Safer List Management

## Decision 1: Use native browser confirmation for destructive actions

- Decision: Use browser-native confirmation prompts for list and item deletion rather than adding a modal dependency or building a new modal system during this feature.
- Rationale: The app does not currently have a shared dialog component, the confirmation requirements are simple, and native confirmation already provides explicit confirm/cancel behavior with minimal surface area.
- Alternatives considered: Custom Svelte modal; rejected because it adds more implementation and accessibility complexity than this feature requires. Third-party dialog package; rejected because the current app can satisfy the requirement without new dependencies.

## Decision 2: Make home-page list activation navigate directly to the detail route

- Decision: Treat the list row's primary action on the home page as direct navigation to `/lists/[listId]` and remove reliance on the current select-then-open pattern.
- Rationale: This directly satisfies the requirement to open a list in one interaction and aligns desktop and mobile behavior around the same route-based action.
- Alternatives considered: Keep selection state and auto-trigger the existing secondary link; rejected because it preserves the unnecessary two-step mental model. Add a second explicit open button; rejected because it increases clutter.

## Decision 3: Restrict list deletion to the detail route only

- Decision: Remove list delete controls from the home-page list overview and expose list deletion only inside the list detail view.
- Rationale: Destructive actions belong in the context where the user is already focused on that list, reducing accidental deletion from the overview screen.
- Alternatives considered: Keep delete controls on the home page behind confirmation only; rejected because the requirement explicitly removes delete access from the home page and confirmation alone does not reduce overview-screen risk enough.

## Decision 4: Use native viewport and scroll APIs for mobile new-item visibility

- Decision: Keep the new-item field visible on focus by using built-in browser scrolling behavior, with the implementation allowed to combine `scrollIntoView` and a post-focus retry timed for on-screen keyboard movement when needed.
- Rationale: The requirement is about reliable visibility on common mobile browsers, and native viewport primitives can achieve that without adding a mobile keyboard library.
- Alternatives considered: Do nothing beyond current focus behavior; rejected because current long-list layouts can leave the input obscured by the keyboard. Third-party keyboard/viewport helper; rejected because the browser already exposes enough primitives for this scope.

## Decision 5: Test the user-facing behavior at the route level

- Decision: Cover the changed behaviors primarily with Playwright route-level tests, and add Vitest coverage only if shared helper logic is extracted during implementation.
- Rationale: The required outcomes are user-visible flows spanning routing, confirmation, and viewport behavior, so end-to-end coverage is the most reliable primary gate.
- Alternatives considered: Store-only tests as the main gate; rejected because they would miss the route navigation and browser viewport behavior central to this feature.

## Shared Accessibility and UX Rules

- Home-page list activation must remain keyboard reachable and visibly focused.
- Destructive confirmation copy must clearly identify the target list or item and always offer a cancel path.
- The home page must avoid extra controls or configuration for opening a list.
- New-item focus behavior must not break existing helper text, labeling, or duplicate-prevention interactions.

## Implementation Outcomes

- Dependency changes: none planned.
- UI architecture changes: none beyond route/component behavior updates.
- Browser API usage is preferred over new packages for confirmation and mobile viewport handling.

## Native Confirmation and Mobile Viewport Implementation

### Native Confirmation for Destructive Actions

- Implementation uses browser-native `confirm()` dialogs for both list and item deletion
- No third-party modal libraries were added to keep dependencies minimal
- Confirmation messages clearly identify the target being deleted
- Cancel paths are always available and preserve existing content

### Mobile Viewport Handling

- New item input visibility maintained using native `scrollIntoView()` API
- Additional retry mechanism with timeouts accounts for keyboard animation delays
- No mobile-specific libraries or frameworks added
- Solution works across common mobile browsers without additional dependencies

### No-New-Dependency Confirmation

- All functionality implemented using existing SvelteKit capabilities and native browser APIs
- No new npm packages added to package.json
- Existing test frameworks (Vitest, Playwright) used for coverage
- Existing component structure and patterns preserved

## Final Implementation Outcomes

### Completed User Stories

- ✅ User Story 1: Delete Content Deliberately
  - List deletion restricted to detail view with native confirmation
  - Item deletion requires explicit confirmation
  - Home page no longer exposes list delete controls
- ✅ User Story 2: Open Lists in One Step
  - Direct navigation from home page to list detail
  - Single click/tap activation with keyboard support
  - Removed unnecessary selection step
- ✅ User Story 3: Add Items Without Fighting the Keyboard
  - New item input scrolls into view on focus
  - Mobile keyboard overlap handled with native APIs
  - Users can type immediately without manual scrolling

### Technical Outcomes

- Zero new dependencies added to package.json
- Existing repository and store patterns preserved
- Native browser APIs used for confirmation dialogs and viewport management
- Comprehensive test coverage added (unit, integration, and E2E)
- Accessibility requirements met with semantic HTML and focus management
- Backward compatibility maintained with existing offline sync functionality

### Code Quality

- No architectural changes to existing component structure
- Minimal surface area for new functionality
- Clear separation of concerns in implementation
- Consistent with existing codebase patterns and conventions
