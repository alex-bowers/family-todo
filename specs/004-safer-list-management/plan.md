# Implementation Plan: Safer List Management

**Branch**: `004-start-specification` | **Date**: 2026-06-05 | **Spec**: `/specs/004-safer-list-management/spec.md`
**Input**: Feature specification from `/specs/004-safer-list-management/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Reduce accidental list and item deletion while removing unnecessary navigation steps on the home page and improving mobile item-entry visibility. Implement within the current SvelteKit app by moving list deletion into the list detail route, using native browser confirmation prompts for destructive actions, making home-page list activation navigate directly to `/lists/[listId]`, and using built-in browser viewport/scroll behavior to keep the new-item input visible above mobile keyboards. No new dependencies are planned.

## Technical Context

**Language/Version**: TypeScript/JavaScript on Node.js 20.x with SvelteKit 2.x
**Primary Dependencies**: SvelteKit, Vite, Supabase JS client, Vitest, Playwright (existing only)
**Storage**: Supabase Postgres via existing repository layer, plus local cache/offline queue already used by the app
**Testing**: Vitest for unit/contract coverage and Playwright for end-to-end interaction coverage
**Target Platform**: Modern desktop and mobile browsers supported by the existing PWA
**Project Type**: Web application (SvelteKit PWA)
**Performance Goals**: Home-page list activation should feel immediate, destructive confirmation should block deletion until explicit confirmation, and new-item focus repositioning should complete quickly enough that users can type without waiting or manual scrolling
**Constraints**: No new dependencies unless strictly necessary; prefer Svelte and native browser APIs; preserve current repository/offline-sync behavior; maintain keyboard/focus accessibility for changed controls; keep component changes inside the current app structure
**Scale/Scope**: One home route, one list-detail route, and their supporting components/stores for current household-scale list and item volumes

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

**Pre-Phase-0 Gate Assessment**

- Code Quality: PASS. Planned changes stay within existing routes, Svelte components, and stores, with no new architectural layer or dependency surface.
- Accessibility: PASS. The plan preserves semantic interactive controls, requires visible focus states, and keeps destructive confirmations cancelable and understandable.
- Testing: PASS. The feature can be covered with existing Playwright suites for navigation/deletion/mobile-entry behavior and targeted Vitest coverage only if shared helper logic is extracted.
- Dependencies: PASS. Native browser confirmation and viewport APIs are sufficient; no modal or mobile-keyboard package is justified.
- UX Simplicity: PASS. The design removes a home-page step, hides destructive actions from the overview screen, and keeps item creation in the same input flow.

## Project Structure

### Documentation (this feature)

```text
specs/004-safer-list-management/
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
│   │   ├── ListSidebar.svelte
│   │   └── TodoItemList.svelte
│   ├── stores/
│   │   ├── item-store.ts
│   │   └── list-store.ts
│   └── memory/
│       ├── item-repository.ts
│       └── list-repository.ts
└── routes/
    ├── +page.svelte
    └── lists/
        └── [listId]/+page.svelte

tests/
├── e2e/
│   ├── items-flow.spec.ts
│   └── lists-flow.spec.ts
├── unit/
│   ├── item-store.test.ts
│   └── list-store.test.ts
└── contract/
```

**Structure Decision**: Keep the existing single SvelteKit app structure. Limit work to the current route/components/store boundaries so the feature can be implemented without introducing new folders, shared modal infrastructure, or third-party UI packages.

## Complexity Tracking

No constitution violations requiring exception at plan time.

| Violation | Why Needed | Simpler Alternative Rejected Because |
| --------- | ---------- | ------------------------------------ |
| None      | N/A        | N/A                                  |

## Post-Design Constitution Check

- Code Quality: PASS. Design keeps destructive-action rules at the route/component boundary and avoids cross-cutting architectural changes.
- Accessibility: PASS. Direct list activation stays keyboard reachable, focus-visible styling remains required, and confirmation flows are cancelable and clearly labeled.
- Testing: PASS. Required automated coverage is defined for home-page navigation, delete-confirmation paths, and mobile new-item visibility, with failing checks required before merge.
- Dependencies: PASS. Design relies on existing SvelteKit plus native browser APIs; no new runtime or test dependency is required.
- UX Simplicity: PASS. Users open lists in one step, delete only in the appropriate context, and add items without fighting keyboard overlap.
