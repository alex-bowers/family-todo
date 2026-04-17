# Research: Backend Service Consolidation (Hasura to Supabase)

## Decision 1: Keep frontend stack unchanged
- Decision: Retain the current SvelteKit + Vite frontend architecture, component tree, stores, and route flows.
- Rationale: The migration objective is backend consolidation with no user-facing workflow regression.
- Alternatives considered: Frontend rewrite during migration; rejected because it compounds risk and obscures migration validation.

## Decision 2: Replace Hasura runtime with Supabase as unified data and API platform
- Decision: Use Supabase Postgres + API capabilities as the single managed backend service.
- Rationale: Meets the feature requirement to remove split GraphQL-service/database operations and reduce operational surface area.
- Alternatives considered: Keep Hasura + separate database; rejected because it preserves the current split operational model.

## Decision 3: Preserve repository/store contracts while swapping backend adapters
- Decision: Keep existing memory/store interfaces and replace internals behind repository boundaries.
- Rationale: Minimizes frontend churn and allows behavior-parity testing at stable seams.
- Alternatives considered: Direct store or component rewrites to new API semantics; rejected due to higher regression risk.

## Decision 4: Use controlled cutover with parity gates and rollback criteria
- Decision: Perform migration with rehearsal, explicit cutover gates, and predefined rollback triggers.
- Rationale: Reduces data-loss/duplication risk and ensures deterministic go/no-go decisions.
- Alternatives considered: Big-bang switch without rehearsals; rejected due to insufficient confidence and recovery clarity.

## Decision 5: Require strict migration verification checks
- Decision: Enforce row-count parity, key-set parity, fingerprint parity, referential integrity, duplicate detection, timestamp sanity, and idempotency checks.
# Research: Backend Service Consolidation (Hasura to Supabase)

## Decision 1: Keep frontend stack unchanged
- Decision: Retain the existing SvelteKit + Vite frontend stack, route structure, component behavior, and store contracts.
- Rationale: The feature scope is backend consolidation; changing frontend architecture would add risk without user-value gain.
- Alternatives considered: Frontend rewrite during migration; rejected because it expands scope and complicates parity validation.

## Decision 2: Replace Hasura runtime with Supabase as the unified platform
- Decision: Move to Supabase as the single hosted database and API platform for FamilyToDo shared memory operations.
- Rationale: Directly satisfies the requested move away from separate GraphQL service plus database operations.
- Alternatives considered: Keep Hasura stack; rejected because it preserves split-service operational complexity.

## Decision 3: Preserve repository/store boundaries and swap adapters underneath
- Decision: Keep repository interfaces and store APIs stable while implementing Supabase-backed adapters behind them.
- Rationale: Enables incremental migration and focused behavior-parity testing with minimal UI churn.
- Alternatives considered: Refactor stores/components to call new backend semantics directly; rejected because regression risk is higher.

## Decision 4: Use rehearsal-first cutover with explicit rollback triggers
- Decision: Require at least one full rehearsal and define objective rollback criteria before production cutover.
- Rationale: Migration safety improves when go/no-go is metrics-driven rather than ad hoc.
- Alternatives considered: Big-bang production switch without rehearsal; rejected due to recovery and confidence gaps.

## Decision 5: Enforce strict data verification gates
- Decision: Gate migration on row-count parity, key-set parity, fingerprint parity, referential integrity, duplicate detection, timestamp sanity, and idempotency checks.
- Rationale: These checks directly address data-loss and data-drift failure modes.
- Alternatives considered: Sample-based verification only; rejected because silent broad mismatches can be missed.

## Decision 6: Keep offline-capable sync semantics with deterministic conflict handling
- Decision: Maintain queue + incremental-pull synchronization and ensure deterministic handling for stale-write conflicts and tombstones.
- Rationale: Preserves PWA resilience expectations and cross-device consistency behavior.
- Alternatives considered: Online-only sync model; rejected because it regresses offline and reconnect experience.

## Decision 7: Require migration-focused automated test layers
- Decision: Require Vitest contract suites for lists/items/sync plus migration compatibility and idempotency, and Playwright multi-context convergence/reconnect scenarios.
- Rationale: Constitution and feature requirements require automated, measurable regression and integrity gates.
- Alternatives considered: Manual QA-only validation; rejected because it cannot provide reliable release confidence.

## Decision 8: Dependency posture remains minimal and intentional
- Decision: Add only Supabase dependencies required to replace Hasura paths and remove obsolete Hasura runtime dependencies during implementation.
- Rationale: Keeps with constitution principles and avoids dual-stack maintenance burden.
- Alternatives considered: Long-term dual backend support; rejected due to complexity and operational overhead.

## Implementation Outcomes

- Supabase runtime client and environment configuration were added with local fallback support.
- Repository and sync layers now execute against Supabase operation contracts while preserving existing store and route flows.
- Migration rehearsal and parity scripts are present and emit JSON artifacts for release gates.
- Contract, unit, and E2E suites include Supabase migration and convergence coverage.
