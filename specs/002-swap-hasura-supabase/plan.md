# Implementation Plan: Backend Service Consolidation

**Branch**: `002-migrate-to-supabase` | **Date**: 2026-04-17 | **Spec**: `/specs/002-swap-hasura-supabase/spec.md`
**Input**: Feature specification from `/specs/002-swap-hasura-supabase/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Migrate FamilyToDo from a Hasura-centered backend to Supabase as the single managed data-and-API platform while keeping the existing frontend stack and user workflows unchanged. The migration design preserves repository and store interfaces, replaces backend adapters and sync integrations, and enforces strict parity, idempotency, and cross-device convergence release gates.

## Technical Context

**Language/Version**: TypeScript on Node.js 20.x (frontend stack unchanged)
**Primary Dependencies**: SvelteKit, Vite, Supabase JS client, Vitest, Playwright
**Storage**: Supabase Postgres (canonical shared memory) + browser local cache/queue for offline continuity
**Testing**: Vitest (unit and contract), Playwright (E2E multi-device and migration behavior)
**Target Platform**: Modern desktop/mobile browsers via existing SvelteKit PWA deployment
**Project Type**: Web application (PWA)
**Performance Goals**: Cross-device update visibility p95 <= 5s and p99 <= 10s; no UX regression in list/item core workflows
**Constraints**: Keep frontend architecture and UX flows; remove Hasura runtime dependency; enforce zero unresolved data loss/duplication before cutover
**Scale/Scope**: Single-household v1 behavior, existing list/item datasets, rehearsal-backed migration and cutover

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

**Pre-Phase-0 Gate Assessment**

- Code Quality: PASS. Scope is constrained to backend integration seams and migration tooling with focused module boundaries for reviewable changes.
- Accessibility: PASS. No mandatory UX redesign; migration-related status messaging must preserve keyboard access, focus visibility, and semantic labeling.
- Testing: PASS. Required contract, verification, and E2E suites are explicit release gates with measurable fail criteria.
- Dependencies: PASS. Frontend stack remains unchanged; Supabase replaces Hasura with a simpler single-platform backend footprint.
- UX Simplicity: PASS. End-user list/item flows remain unchanged and require no migration-specific setup.

## Project Structure

### Documentation (this feature)

```text
specs/002-swap-hasura-supabase/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── lib/
│   ├── graphql/         # existing Hasura-oriented integration to be replaced/refactored
│   ├── memory/          # repository contracts and local cache boundaries
│   ├── stores/          # UI-facing state contracts kept stable
│   └── sync/            # queue/realtime/pull orchestration adapted for Supabase
└── routes/              # user journeys remain behaviorally unchanged

tests/
├── contract/
├── unit/
└── e2e/
```

**Structure Decision**: Keep the current single SvelteKit application and migrate backend adapter internals only. Frontend components/routes/stores remain the stable surface while Hasura-specific data and sync integrations are replaced with Supabase-backed equivalents.

## Complexity Tracking

No constitution violations requiring exception at plan time.

| Violation | Why Needed | Simpler Alternative Rejected Because |
| --------- | ---------- | ------------------------------------ |
| None      | N/A        | N/A                                  |

## Post-Design Constitution Check

- Code Quality: PASS. Data access, sync orchestration, and migration verification concerns are separated into focused artifacts and modules.
- Accessibility: PASS. Any migration-state UI messaging remains non-blocking and accessible without degrading existing interaction patterns.
- Testing: PASS. Contract parity, migration verification, and multi-device convergence tests are required pre-cutover gates.
- Dependencies: PASS. Dependency posture is simplified by removing Hasura runtime coupling and avoiding unnecessary new frontend packages.
- UX Simplicity: PASS. Family members continue the same list/item workflows without added configuration.
