# Feature Specification: Backend Service Consolidation

**Feature Branch**: `002-migrate-to-supabase`
**Created**: 2026-04-17
**Status**: Draft
**Input**: User description: "Swap Hasura implementation for Supabase. Instead of having a separate graphQL service and database, swap to a service that hosts the database and provides an API."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Preserve Family Task Workflows (Priority: P1)

As a family member, I can keep creating, editing, completing, and deleting lists and items during and after the backend swap without changing how I use the app.

**Why this priority**: Preserving day-to-day household task management is the primary user value and cannot regress during infrastructure changes.

**Independent Test**: Can be tested by running the existing list and item lifecycle flows before and after the migration window and confirming no behavior differences in core flows.

**Acceptance Scenarios**:

1. **Given** an existing household with active lists and items, **When** a family member performs create, edit, complete, and delete actions after migration, **Then** all actions succeed with the same visible behavior as before.
2. **Given** a family member is using the app during the transition period, **When** they open or refresh the app, **Then** they can continue core list and item workflows without manual backend configuration.

---

### User Story 2 - Keep Household Data Accurate (Priority: P2)

As a family member, I can trust that existing lists, items, and completion states are preserved and remain synchronized across devices after the backend swap.

**Why this priority**: Data trust is essential; a migration that causes loss, duplication, or stale states undermines the product.

**Independent Test**: Can be tested by preparing fixture households before migration, executing migration, then validating record counts, content parity, and cross-device consistency.

**Acceptance Scenarios**:

1. **Given** pre-existing household lists and items, **When** migration completes, **Then** the same data is available with no unintended loss or duplication.
2. **Given** two family devices are connected to the same household, **When** one device updates a list or item after migration, **Then** the second device reflects the update within expected synchronization timing.

---

### User Story 3 - Simplify Backend Operations (Priority: P3)

As a project maintainer, I can operate the app on one managed backend platform that provides both data hosting and API access, reducing operational overhead and failure points.

**Why this priority**: This is the strategic business outcome of the change and supports faster iteration and simpler maintenance.

**Independent Test**: Can be tested by verifying production traffic and data operations rely on the single selected platform and no longer require the prior split-service arrangement.

**Acceptance Scenarios**:

1. **Given** the migration is complete, **When** maintainers review backend dependencies and runtime configuration, **Then** only the selected unified backend service is required for data and API operations.
2. **Given** routine maintenance tasks, **When** maintainers perform operational checks, **Then** they can complete required checks without interacting with the prior separate GraphQL service stack.

---

### Edge Cases

- Migration is interrupted after partial data transfer.
- A client attempts to write changes while migration is in progress.
- Duplicate or conflicting records are encountered during data transfer.
- A device reconnects with stale local changes immediately after migration cutover.
- The unified backend API is temporarily unavailable after launch.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST move from the current split backend arrangement to Supabase as the single managed backend service for data hosting and API access.
- **FR-002**: The system MUST preserve existing household lists, items, completion states, and relevant timestamps through migration.
- **FR-003**: The system MUST ensure core user workflows (list and item create/edit/complete/delete) behave consistently before and after migration.
- **FR-004**: The system MUST provide a controlled migration path with explicit handling for partial migration failures and recovery.
- **FR-005**: The system MUST prevent unintended data loss or duplication during migration and cutover.
- **FR-006**: The system MUST preserve cross-device synchronization behavior for shared household data after migration.
- **FR-007**: The migration MUST remove runtime dependence on the previous separate GraphQL-plus-database backend arrangement.
- **FR-008**: User-facing flows MUST define accessibility acceptance criteria (keyboard access, focus visibility, semantic labeling, and contrast expectations) for any screens affected by migration-related states.
- **FR-009**: Feature scope MUST define required automated tests and failure criteria before implementation begins.
- **FR-010**: Any new dependency MUST include explicit justification and a simpler/native alternative assessment.
- **FR-011**: Primary user journeys MUST avoid additional setup steps for family members during or after migration.
- **FR-012**: The test plan MUST include Vitest contract tests for list, item, sync, migration idempotency, and migration compatibility behavior at the repository boundary.
- **FR-013**: The migration release gate MUST include pre-cutover and post-cutover verification checks for row-count parity, key-set parity, fingerprint parity, duplicate detection, and referential integrity.
- **FR-014**: Cross-device synchronization acceptance MUST validate convergence correctness and propagation latency using multi-context Playwright scenarios.

## Testing Strategy & Release Gates *(mandatory)*

### Required Contract Tests (Vitest)

- List contract suite covering list read/write/delete mappings, soft-delete filtering, and timestamp mapping parity.
- Item contract suite covering create/edit/complete/delete behavior, completion metadata mapping, and list/household scoping.
- Sync contract suite covering incremental changes since checkpoint, tombstone propagation, and deterministic ordering.
- Migration idempotency suite proving repeated migration runs do not create additional records.
- Migration compatibility suite proving transformed Supabase rows satisfy existing repository/store expectations without UI changes.

### Required Migration Verification Checks

- Row-count parity by entity and lifecycle state (active and soft-deleted).
- Primary key set parity (no missing IDs, no unexpected IDs).
- Canonical record fingerprint parity for migrated rows.
- Referential integrity (no orphaned item rows).
- Duplicate detection across primary keys and app-relevant natural key combinations.
- Timestamp sanity checks (lifecycle ordering and consistency).
- Re-run idempotency verification (second run makes zero net data changes).
- Replay-window verification for writes performed during migration rehearsal.

### Acceptance Thresholds

- Data loss threshold: zero missing lists and zero missing items relative to source snapshot.
- Duplication threshold: zero duplicate list and item records after migration and replay.
- Integrity threshold: zero orphaned items and 100% canonical fingerprint parity after approved transforms.
- Cross-device convergence threshold: 100% of tested create/update/complete/delete operations converge to identical final state across devices.
- Cross-device propagation threshold: p95 update visibility <= 5 seconds and p99 <= 10 seconds in staging acceptance runs.
- Offline replay threshold: zero dropped operations and zero duplicate replays in acceptance scenarios.
- Release confidence threshold: all migration contract, verification, and E2E suites pass with no skipped required cases.

### Key Entities *(include if feature involves data)*

- **HouseholdList**: Represents a shared family list with attributes for identifier, name, ownership scope, and lifecycle timestamps.
- **HouseholdItem**: Represents a task item linked to a list with attributes for identifier, text, completion state, and lifecycle timestamps.
- **MigrationRun**: Represents a tracked migration attempt with attributes for start time, completion state, validation results, and recovery status.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of pre-migration list and item records are available and intact after cutover, with zero unresolved missing or duplicated records before feature completion.
- **SC-002**: In acceptance testing, at least 95% of users complete core list/item workflows on first attempt with no migration-specific guidance.
- **SC-003**: In post-cutover synchronization tests, 100% of cross-device updates converge to identical final state, with p95 visibility within 5 seconds and p99 within 10 seconds.
- **SC-004**: During the first week after rollout, support reports related to missing or duplicated tasks remain below 2% of active households.
- **SC-005**: Operational runbooks for this feature require one backend platform for routine data/API checks, with no required interaction with the previous split-service backend.

## Assumptions

- Existing household data exports and access permissions are available to support a full migration dry run.
- Migration can be performed in a controlled window where user communications can set expectations for brief service disruption if needed.
- Current user-facing functionality remains in scope and no major UX redesign is required for this feature.
- Security and compliance expectations remain unchanged from the current production baseline.
