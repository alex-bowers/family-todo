# Data Model: Safer List Management

## Entity: HouseholdListView

### Purpose

Represents a household list as exposed to the UI for overview and detail interactions.

### Fields

- id: UUID
- household_id: UUID
- title: string
- route_href: string (`/lists/{id}`)
- delete_control_visible: boolean
- deleted_at: ISO timestamp nullable

### Validation Rules

- title must be non-empty after trimming.
- route_href must resolve to the list detail route for the same list id.
- delete_control_visible must be false on the home-page overview and true only in the list-detail context.
- deleted_at, when present, means the list is no longer shown in active list views.

### State Transitions

- OverviewVisible -> DetailVisible when the user activates the list from the home page.
- DetailVisible -> PendingListDeleteConfirmation when the user starts list deletion in the detail view.
- PendingListDeleteConfirmation -> Deleted on explicit confirmation.
- PendingListDeleteConfirmation -> DetailVisible on cancel or dismiss.

## Entity: ListItemView

### Purpose

Represents an individual item in a list detail view with destructive and editing actions.

### Fields

- id: UUID
- list_id: UUID
- description: string
- is_completed: boolean
- deleted_at: ISO timestamp nullable
- delete_confirmation_required: boolean

### Validation Rules

- description must remain non-empty after trimming.
- delete_confirmation_required must remain true for all item deletion paths.
- deleted_at stays null until deletion is explicitly confirmed.

### State Transitions

- Visible -> PendingItemDeleteConfirmation when the user activates item deletion.
- PendingItemDeleteConfirmation -> Deleted on explicit confirmation.
- PendingItemDeleteConfirmation -> Visible on cancel or dismiss.

## Entity: DeleteConfirmationState

### Purpose

Captures the temporary decision state for a pending destructive action before any mutation occurs.

### Fields

- target_type: enum (`list`, `item`)
- target_id: UUID
- target_label: string
- message: string
- status: enum (`idle`, `awaiting_confirmation`, `confirmed`, `cancelled`)

### Validation Rules

- message must clearly identify the content being deleted.
- status may enter `confirmed` only from `awaiting_confirmation` after an explicit user confirmation action.
- `cancelled` leaves the underlying list or item unchanged.

## Entity: NewItemEntryViewportState

### Purpose

Represents whether the new-item input is in a typing-ready position when mobile keyboards are shown.

### Fields

- list_id: UUID
- input_id: string (`new-item-description`)
- focus_active: boolean
- positioned_for_typing: boolean
- keyboard_overlap_detected: boolean

### Validation Rules

- When `focus_active` is true on supported mobile browsers, `positioned_for_typing` must become true before the user needs to manually scroll.
- `keyboard_overlap_detected` may be true transiently, but the final visible state for active typing must still be `positioned_for_typing=true`.
- Existing item-creation semantics are unchanged by viewport repositioning.

### State Transitions

- Idle -> Focused when the input receives focus.
- Focused -> Positioned when the page scrolls or repositions the field into view.
- Positioned -> Submitted when the user creates an item.
- Positioned -> Idle when the field blurs without submission.

## Relationships

- HouseholdListView 1 -> many ListItemView
- HouseholdListView 1 -> 0..1 DeleteConfirmationState for list deletion
- ListItemView 1 -> 0..1 DeleteConfirmationState for item deletion
- HouseholdListView 1 -> 1 NewItemEntryViewportState while its detail view is active

## Notes

- This feature changes interaction state, not the persisted list/item schema.
- Existing repository methods remain the source of truth for create/delete mutations.
