# Implementation Plan: Docker Dev Container Support

**Branch**: `005-docker-devcontainer` | **Date**: 2026-07-15 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/005-docker-devcontainer/spec.md`

## Summary

Convert the FamilyToDo SvelteKit project to run inside a VS Code Dev Container. The container must provide Node.js 20, pnpm, all development tooling, and local Supabase services so that a developer can clone the repo, open it in a container, and run the full test suite and dev server without host-level installation. The existing local development workflow must remain fully functional.

## Technical Context

**Language/Version**: TypeScript on Node.js 20.x (SvelteKit current LTS support)
**Primary Dependencies**: SvelteKit 2.x, Vite, Supabase JS client, Vitest, Playwright, pnpm 11.8.0
**Storage**: Supabase Postgres (cloud-hosted production; local Supabase CLI for development)
**Testing**: Vitest (unit + contract), Playwright (e2e)
**Target Platform**: Web (PWA), containerized Linux development environment
**Project Type**: Web application
**Performance Goals**: Container build from clean cache < 10 min; dev server hot reload < 5 sec
**Constraints**: Must preserve existing local workflow; secrets must not be baked into image; must support macOS and Linux hosts
**Scale/Scope**: Single developer container, team-wide consistency

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

- **Code Quality**: Devcontainer configuration files (Dockerfile, docker-compose.yml, devcontainer.json) must pass linting where applicable (e.g., hadolint for Dockerfile). No application code changes are required.
- **Accessibility**: No user-facing changes. This is a developer-experience infrastructure feature.
- **Testing**:
  - All existing unit, contract, and e2e tests must pass inside the container.
  - A container build validation check must be added to CI or documented manual verification.
  - Playwright e2e tests must run successfully with the containerized dev server.
- **Dependencies**:
  - No new application dependencies.
  - Devcontainer uses official Docker images (Node.js 20, Supabase CLI) and VS Code extensions. These are development-environment dependencies, not runtime dependencies.
  - Justification: Containerization requires a base image and orchestration tooling; the official Node.js image and Supabase CLI are the standard, maintained choices.
  - Alternatives considered: Custom base image built from scratch (rejected — higher maintenance burden); podman instead of Docker (rejected — devcontainer spec is Docker-native).
- **UX Simplicity**: One-click "Reopen in Container" from VS Code. No manual configuration steps beyond copying `.env.example` to `.env`.

## Project Structure

### Documentation (this feature)

```text
specs/005-docker-devcontainer/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
.devcontainer/
├── devcontainer.json    # VS Code Dev Container specification
├── docker-compose.yml   # Multi-service orchestration (app + Supabase local)
├── Dockerfile           # Development environment image
└── supabase/            # Supabase local config (if not using project root)
    └── config.toml      # Local Supabase CLI configuration

src/
├── lib/
│   ├── components/
│   ├── graphql/
│   ├── memory/
│   ├── stores/
│   ├── supabase/
│   ├── sync/
│   └── utils/
└── routes/

tests/
├── contract/
├── e2e/
└── unit/
```

**Structure Decision**: The existing single-project web application structure is preserved. New `.devcontainer/` directory is added at repository root for container configuration. Supabase local configuration may be placed inside `.devcontainer/supabase/` or use the existing `supabase/` directory at root.

## Constitution Check (Post-Design)

Re-evaluated after Phase 1 design. All gates continue to pass:

- **Code Quality**: Dockerfile will be linted with hadolint. No application code changes.
- **Accessibility**: No user-facing changes; no accessibility impact.
- **Testing**: Existing test suites (unit, contract, e2e) are the validation gate. Container build itself will be validated by running `pnpm test` successfully inside the container.
- **Dependencies**: No new application dependencies. Devcontainer infrastructure uses official Microsoft and Supabase images only.
- **UX Simplicity**: One-click "Reopen in Container". Only manual step is copying `.env.example` to `.env`, which is the existing project convention.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No constitution violations. All gates pass:
- No new application dependencies.
- No user-facing UX changes.
- Testing requirements are satisfied by existing test suites running in container.
- Code quality gates apply only to new infrastructure configuration files.
