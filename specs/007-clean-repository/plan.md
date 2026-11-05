# Implementation Plan: Clean Repository Legacy Artefacts

**Branch**: `main` (feature directory `specs/007-clean-repository`) | **Date**: 2026-11-05 | **Spec**: [/Users/alexbowers/Code/Home/family-todo/specs/007-clean-repository/spec.md](/Users/alexbowers/Code/Home/family-todo/specs/007-clean-repository/spec.md)
**Input**: Feature specification from `/Users/alexbowers/Code/Home/family-todo/specs/007-clean-repository/spec.md`

## Summary

Create a focused, reviewable repository cleanup that removes obsolete Hasura and completed-migration implementation artefacts while preserving the application's current Supabase-backed behaviour and the complete Spec Kit feature history. The implementation will begin with an evidence-backed inventory, then remove or rename only artefacts with no supported active dependants, update active references and documentation, and finish with repository and application verification.

The cleanup will not change production data, database schemas, deployment configuration, authentication, user-facing behaviour, or dependencies. Historical references inside retained `specs/001` through `specs/006` records remain valid as development history and will be clearly separated from active instructions.

## Technical Context

**Language/Version**: TypeScript and JavaScript on Node.js 20.x
**Primary Dependencies**: SvelteKit 2.x, Vite, Supabase JS client, Vitest, Playwright, ESLint, Prettier, pnpm 11.8.0
**Storage**: Supabase Postgres for shared data, with existing browser-local cache and offline queue; no storage schema change
**Testing**: Existing static checks, linting, build, unit/contract tests, and Playwright end-to-end tests
**Target Platform**: SvelteKit web/PWA application with Cloudflare Pages deployment and local development through the existing host or dev container workflows
**Project Type**: Web application with repository-local operational scripts and Spec Kit documentation
**Performance Goals**: No runtime performance change; preserve the current application build and test baseline
**Constraints**: No production data or schema changes; no new dependencies; no deployment, commit, or branch creation; preserve uncommitted user changes and historical Spec Kit records; make only reviewable file/reference changes
**Scale/Scope**: Repository cleanup across active source, tests, scripts, docs, package commands, and agent context; preserve `.specify/`, `.github/` Spec Kit support, `specs/001` through `specs/006`, and current Supabase schema migrations

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

- **Code Quality**: PASS. The design requires an inventory and dependency/reference audit before removal, keeps changes focused, and verifies formatting, static analysis, build, and repository path integrity.
- **Accessibility**: PASS. No user interface or user journey changes are planned. Existing keyboard access, visible focus, semantic labelling, and contrast behaviour remain regression criteria.
- **Testing**: PASS. The design includes stale-reference and broken-path checks plus the existing project checks at unit, build, static-analysis, and end-to-end levels where the environment supports them.
- **Dependencies**: PASS. No dependency is added. Unused dependencies may only be removed after the active source and verification audit proves they are no longer required.
- **UX Simplicity**: PASS. The cleanup changes repository orientation only; it removes misleading choices and does not add application configuration or user-facing steps.

## Project Structure

### Documentation (this feature)

```text
/Users/alexbowers/Code/Home/family-todo/specs/007-clean-repository/
├── plan.md              # This implementation plan
├── research.md          # Cleanup boundary and repository audit decisions
├── data-model.md        # Repository artefact and verification entities
├── quickstart.md        # Implementation and verification procedure
└── checklists/
    └── requirements.md  # Specification quality checklist
```

No `contracts/` directory is planned because this is an internal repository cleanup and does not change a public API, endpoint, command protocol, or external integration contract.

### Source Code (repository root)

```text
/Users/alexbowers/Code/Home/family-todo/
├── .specify/                    # Retained Spec Kit configuration, templates, and workflows
├── .github/agents/              # Retained Spec Kit agent definitions
├── specs/                       # Retained ordered feature history, plus this cleanup feature
├── src/                         # Active SvelteKit application and Supabase-backed runtime
├── static/                      # Active PWA assets and headers
├── supabase/migrations/         # Active database schema history; retained
├── scripts/                     # Retained current maintenance scripts only
├── tests/                       # Active unit, contract, and end-to-end coverage
├── docs/                        # Current development and operational documentation
└── package.json                 # Active development and verification commands
```

The cleanup inventory will explicitly classify the following known areas before editing:

- `hasura/`, Hasura-specific active names, and Hasura-only fixtures/contracts: remove or rename when no active dependency remains.
- `scripts/migration/`, migration-only package commands, and the completed migration runbook: remove when confirmed to have no supported operational use.
- Migration-only tests and smoke flows: remove or replace only when their assertions are not part of current Supabase behaviour coverage.
- `src/lib/graphql/` and related client/repository names: make active terminology truthful without changing data requests, stores, sync, or UI behaviour.
- `specs/001` through `specs/006`, `.specify/`, `.github/agents/`, and current Supabase migrations: retain as history or active support.

**Structure Decision**: Keep the existing single SvelteKit project structure. The change is a repository-surface cleanup, not an architectural split or a runtime migration.

## Complexity Tracking

No constitution violations require justification.

## Post-Design Constitution Check

- **Code Quality**: PASS. The design now has explicit classification, reference-audit, rename/removal, and diff-review gates.
- **Accessibility**: PASS. Existing accessible user journeys remain unchanged and are included in regression review.
- **Testing**: PASS. The quickstart names the existing static, lint, build, unit, and end-to-end checks and records environment limitations rather than weakening coverage.
- **Dependencies**: PASS. The design adds no dependencies and treats removal of unused packages as conditional on verification.
- **UX Simplicity**: PASS. The design removes misleading repository choices without adding application or contributor configuration beyond the existing workflow.

