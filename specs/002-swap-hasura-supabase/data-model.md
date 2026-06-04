# Data Model: Backend Service Consolidation

## Entity: HouseholdList

### Purpose

Represents a shared household todo list visible to all authorized household devices.

### Fields

- id: UUID (primary key)
- household_id: UUID (tenant scope key)
- title: text (non-empty, trimmed)
- sort_order: integer (optional ordering hint)
- created_at: timestamptz
- updated_at: timestamptz
- deleted_at: timestamptz nullable (soft delete marker)

### Validation Rules

- title must be non-empty after trimming.
- household_id is required.
- deleted_at, when present, must be >= created_at.

### State Transitions

- Active -> SoftDeleted when deleted_at is set.
- SoftDeleted records are excluded from default active list queries.

## Entity: HouseholdItem

### Purpose

Represents an actionable todo item linked to one household list.

### Fields

- id: UUID (primary key)
- household_id: UUID (tenant scope key)
- list_id: UUID (foreign key to HouseholdList.id)
- description: text (non-empty, trimmed)
- is_completed: boolean
- completed_at: timestamptz nullable
- created_at: timestamptz
- updated_at: timestamptz
- deleted_at: timestamptz nullable (soft delete marker)

### Validation Rules

- description must be non-empty after trimming.
- list_id must reference an existing HouseholdList in the same household scope.
- completed_at must be null when is_completed is false.
- completed_at must be present when is_completed is true.
- deleted_at, when present, must be >= created_at.

### State Transitions

- Incomplete -> Completed when is_completed becomes true and completed_at is set.
- Completed -> Incomplete when is_completed becomes false and completed_at is cleared.
- Any active state -> SoftDeleted when deleted_at is set.

## Entity: MigrationRun

### Purpose

Tracks migration execution and verification outcomes for rehearsal and production cutover.

### Fields

- id: UUID (primary key)
- started_at: timestamptz
- finished_at: timestamptz nullable
- status: enum (pending, running, succeeded, failed, rolled_back)
- source_snapshot_ref: text
- target_snapshot_ref: text nullable
- verification_summary: jsonb
- rollback_triggered: boolean

### Validation Rules

- status transitions must follow pending -> running -> succeeded/failed/rolled_back.
- finished_at is required for terminal statuses.
- verification_summary must include all required parity checks.

## Relationships

- HouseholdList 1 -> many HouseholdItem
- MigrationRun is operational metadata and not user-visible domain data

## Migration Mapping Notes

- Existing Hasura list and item records map one-to-one into HouseholdList and HouseholdItem.
- Source IDs and lifecycle timestamps are preserved to maintain parity and client cache compatibility.
- Soft-deleted records are migrated and remain query-filtered from active views.
