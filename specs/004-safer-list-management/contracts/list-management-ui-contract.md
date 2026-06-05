# Contract: List Management Interaction

## Purpose

Defines the required user-facing interaction behavior for safer list management in the existing SvelteKit app.

## Scope

- Home-page list activation and overview controls
- List deletion from the list detail route
- Item deletion within the list detail route
- New-item focus behavior on mobile browsers

## Route Contract: Home Page (`/`)

### List Overview Behavior

- The home page shows the household's active lists.
- Each list row exposes one primary activation path that opens `/lists/[listId]` immediately.
- The home page does not expose a delete button, icon, swipe action, or equivalent destructive control for lists.
- New list creation remains available from the existing home-page form.

### Accessibility Rules

- Each list activator must have a clear accessible name containing the list title.
- Keyboard users must be able to tab to and activate each list row.
- Focus-visible styling must remain present on list activators.

## Route Contract: List Detail (`/lists/[listId]`)

### List-Level Actions

- The list detail view may expose list deletion.
- Starting list deletion must present a confirmation prompt before any mutation is sent.
- The confirmation message must clearly state that the entire list will be removed.
- Canceling or dismissing the confirmation must keep the list intact and keep the user in the detail view.
- Confirming deletion removes the list and returns the user to a valid post-delete state, typically the home page overview.

### Item-Level Actions

- Each item delete action must present a confirmation prompt before any mutation is sent.
- Canceling or dismissing item deletion must leave the item unchanged.
- Confirming item deletion removes only the targeted item.

### Existing Item Workflow Preservation

- Item creation, duplicate suggestion behavior, editing, completion toggling, and offline queue handling remain available after this feature.
- Delete confirmation must not silently bypass the existing item repository/store mutation path.

## Focus and Viewport Contract: New Item Entry

- Focusing the `new-item-description` input must bring the field into a typing-ready position near the top of the visible area.
- On supported mobile browsers, the field must remain visible above the on-screen keyboard without requiring manual user scrolling.
- The field's existing label, helper text, and submission behavior remain unchanged.

## Error and Cancelation Contract

- A canceled destructive confirmation must not mutate local state, queued offline mutations, or server-backed state.
- If a targeted list or item is already unavailable when the user confirms deletion, the UI must resolve to a non-corrupt state and surface the existing error handling path if needed.

## Required Automated Validation

- Playwright coverage must verify no home-page list delete control is present.
- Playwright coverage must verify a single interaction on the home page opens the selected list.
- Playwright coverage must verify both confirm and cancel paths for list and item deletion.
- Playwright coverage must verify the mobile-sized new-item field remains visible after focus in a long-list scenario.
- Vitest coverage is required for any extracted helper that determines confirmation copy or viewport repositioning behavior.
