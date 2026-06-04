# Contract: Supabase Data and Sync Interface

## Purpose

Defines required data access and synchronization behavior after replacing Hasura with Supabase while keeping frontend repository contracts stable.

## Scope

- Household-scoped list and item reads/writes
- Incremental sync reads including tombstones
- Conflict-aware updates for deterministic resolution

## Read Contracts

### GetListsByHousehold

- Inputs:
  - householdId: UUID
- Behavior:
  - Return non-deleted lists for household scope ordered by sort_order, updated_at.
- Required fields:
  - id, household_id, title, sort_order, created_at, updated_at, deleted_at

### GetItemsByList

- Inputs:
  - householdId: UUID
  - listId: UUID
- Behavior:
  - Return non-deleted items in list scope ordered by updated_at.
- Required fields:
  - id, household_id, list_id, description, is_completed, completed_at, created_at, updated_at, deleted_at

### GetChangesSince

- Inputs:
  - householdId: UUID
  - since: timestamptz
- Behavior:
  - Return all changed list/item records after since, including tombstones.
  - Ordering must be deterministic for replay safety.

## Mutation Contracts

### CreateList

- Inputs:
  - householdId: UUID
  - title: string
- Rules:
  - Trim and reject empty title.
  - Emit created_at and updated_at.

### DeleteList

- Inputs:
  - householdId: UUID
  - listId: UUID
- Rules:
  - Apply soft delete marker on list.
  - Child item visibility must align with app query semantics.

### CreateItem

- Inputs:
  - householdId: UUID
  - listId: UUID
  - description: string
- Rules:
  - Trim and reject empty description.
  - Initialize is_completed=false and completed_at=null.

### UpdateItemText

- Inputs:
  - householdId: UUID
  - itemId: UUID
  - description: string
  - expectedUpdatedAt: timestamptz
- Rules:
  - Apply conditional update for conflict detection.
  - Return conflict error with current server record when precondition fails.

### SetItemCompletion

- Inputs:
  - householdId: UUID
  - itemId: UUID
  - isCompleted: boolean
  - expectedUpdatedAt: timestamptz
- Rules:
  - isCompleted=true sets completed_at to current timestamp.
  - isCompleted=false clears completed_at.
  - Conditional update behavior matches UpdateItemText.

### DeleteItem

- Inputs:
  - householdId: UUID
  - itemId: UUID
  - expectedUpdatedAt: timestamptz
- Rules:
  - Apply soft delete marker via conditional update.
  - Return conflict metadata when precondition fails.

## Realtime and Sync Contract

### HouseholdChangesChannel

- Subscription scope:
  - household_id filter for list and item changes.
- Behavior:
  - Realtime events trigger incremental pull via GetChangesSince.
  - Client does not rely on event payload ordering alone.

## Authorization Contract

- Row-level security enforces household_id scope.
- Cross-household reads/writes are denied.
- Unauthorized operations return permission errors and do not mutate data.

## Error Contract

- Validation errors:
  - Empty list title or item description -> user-facing validation message.
- Authorization errors:
  - Household scope mismatch -> permission denied.
- Conflict errors:
  - Conditional update precondition failure -> conflict response with latest server row.
- Availability errors:
  - Network/API unavailable -> mutation queued for retry by offline sync engine.
