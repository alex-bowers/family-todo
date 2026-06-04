# Contract: Hasura GraphQL Interface

> Deprecated for active development. Supabase contract is now canonical in
> `specs/002-swap-hasura-supabase/contracts/supabase-data-api-contract.md`.

## Purpose

Defines the required GraphQL operations between FamilyToDo (SvelteKit PWA) and Hasura shared memory backend.

## Core Query Contracts

### Query: GetLists

- Intent: Fetch active lists for one household.
- Inputs:
  - householdId: UUID!
- Output fields:
  - id
  - title
  - sort_order
  - updated_at
- Filter:
  - deleted_at is null

### Query: GetItemsByList

- Intent: Fetch active items for one list.
- Inputs:
  - listId: UUID!
- Output fields:
  - id
  - description
  - is_completed
  - completed_at
  - updated_at
- Filter:
  - deleted_at is null

## Core Mutation Contracts

### Mutation: CreateList

- Inputs:
  - householdId: UUID!
  - title: String!
- Behavior:
  - Inserts a list row with trimmed non-empty title.

### Mutation: DeleteList

- Inputs:
  - listId: UUID!
- Behavior:
  - Soft deletes list via deleted_at timestamp.
  - Soft deletes child items or excludes them by list deletion in query model.

### Mutation: CreateItem

- Inputs:
  - listId: UUID!
  - description: String!
- Behavior:
  - Inserts item with is_completed=false.

### Mutation: UpdateItemText

- Inputs:
  - itemId: UUID!
  - description: String!
- Behavior:
  - Updates description with trimmed non-empty value.

### Mutation: SetItemCompletion

- Inputs:
  - itemId: UUID!
  - isCompleted: Boolean!
- Behavior:
  - Sets completion state and completed_at timestamp accordingly.

### Mutation: DeleteItem

- Inputs:
  - itemId: UUID!
- Behavior:
  - Soft deletes item via deleted_at timestamp.

## Sync Contract

### Query: GetChangesSince

- Intent: Retrieve changed lists/items for reconnect sync.
- Inputs:
  - householdId: UUID!
  - since: timestamptz!
- Output:
  - all rows updated after since, including deleted rows (deleted_at non-null)

### Optional Subscription: HouseholdChanges

- Intent: Near-real-time updates across active devices.
- Inputs:
  - householdId: UUID!
- Output:
  - changed list/item records scoped to household

## Authorization Contract

- Hasura role model must restrict data by household_id.
- Anonymous/public access is not allowed for shared memory operations.
- Client must present authorized role token/session for household scope.

## Error Contract

- Validation errors:
  - empty title/description -> user-facing validation message
- Auth errors:
  - unauthorized household access -> permission denied
- Sync errors:
  - network/unavailable -> queue local changes and retry on reconnect
