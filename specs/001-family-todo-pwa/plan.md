# Implementation Plan: FamilyToDo Multi-List PWA

**Branch**: `001-build-family-todo-pwa` | **Date**: 2026-04-17 | **Spec**: `/specs/001-family-todo-pwa/spec.md`
**Input**: Feature specification from `/specs/001-family-todo-pwa/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Build a SvelteKit PWA hosted on Cloudflare Pages that supports multiple family
todo lists, full item lifecycle management, and cross-device synchronization.
The app will use Hasura Cloud as the shared memory system (GraphQL + Postgres)
to persist and sync list/item data across installed PWAs, with an offline-first
UX and sync-on-reconnect behavior.

## Technical Context

**Language/Version**: TypeScript on Node.js 20.x (SvelteKit current LTS support)
**Primary Dependencies**: SvelteKit, Vite, Hasura GraphQL API (cloud-hosted), GraphQL client (lightweight)
**Storage**: Hasura-managed Postgres for canonical shared data; browser IndexedDB/local storage for offline cache
**Testing**: Vitest (unit), Playwright (E2E), GraphQL contract checks against Hasura schema
**Target Platform**: Modern desktop/mobile browsers; deploy on Cloudflare Pages
**Project Type**: Web application (PWA)
**Performance Goals**: Initial app shell load < 2.5s on mid-tier mobile; sync update visible on second device within 5s (SC-004)
**Constraints**: No CSS framework; offline-capable UI after first load; minimal dependency additions per constitution
**Scale/Scope**: Single household v1, multi-device synchronization, list/item CRUD + completion states

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Pre-Phase-0 Gate Assessment**

- Code Quality: PASS. Enforce TypeScript checks, ESLint, and focused PR scope; no
  hidden side effects in sync logic.
- Accessibility: PASS. Keyboard-first list/item controls, visible focus states,
  semantic labels, and contrast checks included in acceptance criteria.
- Testing: PASS. Unit + E2E + contract coverage planned for list/item lifecycle,
  cross-device sync, and PWA installability.
- Dependencies: PASS. Core stack limited to SvelteKit + minimal GraphQL client;
  no CSS framework by explicit requirement.
- UX Simplicity: PASS. Primary flows remain create/select list and create/edit/
  complete/delete items with minimal steps and clear empty states.

## Project Structure

### Documentation (this feature)

```text
specs/001-family-todo-pwa/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── app.html
├── lib/
│   ├── components/
│   ├── memory/
│   ├── sync/
│   ├── graphql/
│   └── stores/
└── routes/
    ├── +layout.svelte
    ├── +page.svelte
    └── lists/
        └── [listId]/
            └── +page.svelte

tests/
├── contract/
├── e2e/
└── unit/
```

**Structure Decision**: Use a single SvelteKit web app with local modules for
memory/sync/GraphQL boundaries. Keep Hasura as an external managed backend to
avoid maintaining a custom API service in v1.

## Complexity Tracking

No constitution violations requiring exception at plan time.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | N/A | N/A |

## Post-Design Constitution Check

- Code Quality: PASS. Data boundaries split into `memory`, `sync`, and `graphql`
  modules to keep responsibilities explicit and reviewable.
- Accessibility: PASS. Design keeps native form controls and explicit label/focus
  requirements for list and item interactions.
- Testing: PASS. Research + contracts + quickstart include required unit/e2e/
  contract validation strategy.
- Dependencies: PASS. Design stays with minimal stack and avoids CSS frameworks.
- UX Simplicity: PASS. Multi-list and item flows remain single-screen oriented,
  with no advanced configuration required.
