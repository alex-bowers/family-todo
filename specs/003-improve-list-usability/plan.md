# Implementation Plan: Improve List Usability

**Branch**: `003-improve-list-usability` | **Date**: 2026-05-07 | **Spec**: `/specs/003-improve-list-usability/spec.md`
**Input**: Feature specification from `/specs/003-improve-list-usability/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Improve daily list interaction efficiency by sorting incomplete items first with alphabetical ordering inside each completion group, enlarging completion control hit areas, and reducing duplicate item creation through in-field suggestion and update-existing flows. Implement entirely within current Svelte component/store/repository boundaries using native JavaScript matching logic and existing styles (no CSS framework additions).

## Technical Context

**Language/Version**: TypeScript/JavaScript on Node.js 20.x with SvelteKit (existing repo setup)
**Primary Dependencies**: SvelteKit, Vite, Supabase JS client, Vitest, Playwright (existing only)
**Storage**: Supabase Postgres via existing repository layer + local cache/offline queue
**Testing**: Vitest (unit/contract) and Playwright (E2E)
**Target Platform**: Modern desktop/mobile browsers in existing PWA
**Project Type**: Web application (SvelteKit PWA)
**Performance Goals**: Re-sort and suggestion updates feel immediate during typing and toggling (no perceptible lag on typical household list sizes)
**Constraints**: No CSS framework additions; minimize new dependencies (prefer zero); preserve current component contracts and accessibility baseline
**Scale/Scope**: Single-list interaction enhancements for current household task volumes (dozens to low hundreds of items)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Pre-Phase-0 Gate Assessment**

- Code Quality: PASS. Changes are constrained to list rendering/order logic, add-item interaction, and repository update flow boundaries with no architectural churn.
- Accessibility: PASS. Plan includes keyboard navigable suggestion interactions, maintained labels/focus states, and larger pointer targets without removing checkbox semantics.
- Testing: PASS. Unit tests cover sort/match behavior, component interaction tests cover add/update flows, and E2E covers duplicate-prevention journeys.
- Dependencies: PASS. Planned implementation uses native JavaScript normalization/similarity helpers and existing project libraries; no CSS framework or new package required.
- UX Simplicity: PASS. Primary flow remains single-field add; duplicate handling adds contextual suggestions with explicit choice, not extra settings.

## Project Structure

### Documentation (this feature)

```text
specs/003-improve-list-usability/
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
│   ├── components/
│   │   └── TodoItemList.svelte
│   ├── stores/
│   │   └── item-store.ts
│   └── memory/
│       └── item-repository.ts
└── routes/
    └── lists/[listId]/+page.svelte

tests/
├── unit/
│   └── item-store.test.ts
├── contract/
│   └── items.supabase.contract.test.ts
└── e2e/
    └── items-flow.spec.ts
```

**Structure Decision**: Keep the existing single SvelteKit app structure and implement behavior changes in component/store/repository layers only; avoid introducing new architectural folders or frameworks.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No constitution violations requiring exception at plan time.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | N/A | N/A |

## Post-Design Constitution Check

- Code Quality: PASS. Design isolates sort/match/interaction rules and keeps write operations explicit (create vs update-existing confirmation).
- Accessibility: PASS. Larger targets retain semantic inputs, suggestion list interaction remains keyboard reachable, and focus treatment remains visible.
- Testing: PASS. Design requires deterministic unit tests for ordering/matching, component behavior tests, and E2E duplicate-prevention coverage.
- Dependencies: PASS. No new package required; native string normalization and lightweight scoring are sufficient. CSS framework addition explicitly out of scope.
- UX Simplicity: PASS. Users keep the same add field and list interaction model with only contextual guidance where duplicates are likely.
