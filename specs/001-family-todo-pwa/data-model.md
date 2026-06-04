# Data Model: FamilyToDo Multi-List PWA

## Entity: Household

- Purpose: Logical ownership boundary for shared family data.
- Fields:
  - id: UUID (primary key)
  - name: text
  - created_at: timestamptz
- Relationships:
  - 1:N with TodoList

## Entity: TodoList

- Purpose: Represents one named list in a household.
- Fields:
  - id: UUID (primary key)
  - household_id: UUID (foreign key -> Household.id)
  - title: text
  - sort_order: integer
  - created_at: timestamptz
  - updated_at: timestamptz
  - deleted_at: timestamptz nullable (soft delete for sync safety)
- Validation rules:
  - title must be non-empty after trim
  - title length max 120 chars
  - sort_order must be >= 0
- Relationships:
  - 1:N with TodoItem

## Entity: TodoItem

- Purpose: Represents one actionable task in a list.
- Fields:
  - id: UUID (primary key)
  - list_id: UUID (foreign key -> TodoList.id)
  - description: text
  - is_completed: boolean
  - completed_at: timestamptz nullable
  - created_at: timestamptz
  - updated_at: timestamptz
  - deleted_at: timestamptz nullable (soft delete for sync safety)
- Validation rules:
  - description must be non-empty after trim
  - description length max 500 chars
- Relationships:
  - N:1 with TodoList

## Entity: SyncCursor

- Purpose: Track per-device sync checkpoint for efficient reconnect synchronization.
- Fields:
  - device_id: text
  - household_id: UUID
  - last_synced_at: timestamptz
- Validation rules:
  - device_id required and stable per install

## State Transitions

### TodoItem state

- Active -> Completed:
  - Trigger: user marks item complete
  - Effects: is_completed=true, completed_at set, render strike-through
- Completed -> Active:
  - Trigger: user unmarks completion
  - Effects: is_completed=false, completed_at cleared
- Active/Completed -> Deleted:
  - Trigger: user deletes item
  - Effects: deleted_at set (server), item removed from UI list

### TodoList lifecycle

- Created -> Active:
  - Trigger: list creation
- Active -> Deleted:
  - Trigger: list deletion
  - Effects: deleted_at set, associated items treated as removed in UI

## Consistency Notes

- Canonical truth lives in Hasura/Postgres.
- Client cache is a performance/offline mirror only.
- v1 conflict strategy: last-write-wins by server timestamp.
