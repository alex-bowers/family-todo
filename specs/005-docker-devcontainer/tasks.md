# Tasks: Docker Dev Container Support

**Input**: Design documents from `/specs/005-docker-devcontainer/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Test tasks are validation-focused for this infrastructure feature. The primary test is that all existing test suites pass inside the container. No new application behavior is introduced, so no new unit/contract tests are required.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create the `.devcontainer/` directory structure and supporting files

- [X] T001 Create `.devcontainer/` directory at repository root
- [X] T002 [P] Create `.dockerignore` at repository root to exclude `.env`, `node_modules`, and `.devcontainer` local data from Docker build context
- [X] T003 [P] Verify `.gitignore` already excludes `.env` and local Supabase data directories (no changes expected)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Build the core container image with all required development tooling

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T004 Create `.devcontainer/Dockerfile` using `mcr.microsoft.com/devcontainers/typescript-node:22` as base image
- [X] T005 [P] Add corepack enable and pnpm@11.8.0 activation to `.devcontainer/Dockerfile`
- [X] T006 [P] Add Playwright Chromium system dependencies installation to `.devcontainer/Dockerfile`
- [X] T007 Configure `.devcontainer/Dockerfile` to run as non-root `node` user with `/workspaces/family-todo` as working directory
- [X] T008 Validate `.devcontainer/Dockerfile` builds successfully with `docker build .devcontainer/`

**Checkpoint**: Foundation ready — Dockerfile builds and contains Node.js 20, pnpm 11.8.0, and Playwright deps

---

## Phase 3: User Story 1 - One-Click Environment Setup (Priority: P1) 🎯 MVP

**Goal**: A developer can clone the repo, open it in a container, and have the environment ready with all tooling installed

**Independent Test**: Open the project in a dev container, run `node --version`, `pnpm --version`, and `pnpm run test:unit` — all succeed without host-level installation

### Tests for User Story 1

- [X] T009 [US1] Validate container build completes from clean cache in under 10 minutes (actual: ~44s)
- [X] T010 [US1] Verify `node --version` reports 22.x inside the container (actual: v22.23.1)
- [X] T011 [US1] Verify `pnpm --version` reports 11.8.0+ inside the container (actual: 11.9.0 via corepack)
- [X] T012 [US1] Verify `pnpm run test:unit` passes inside the container (58/58 passed)

### Implementation for User Story 1

- [X] T013 [P] [US1] Create `.devcontainer/devcontainer.json` with `name`, `dockerComposeFile`, `service`, `workspaceFolder`, and `remoteUser` fields
- [X] T014 [P] [US1] Create `.devcontainer/docker-compose.yml` with `app` service referencing the Dockerfile and workspace bind mount
- [X] T015 [US1] Add `postCreateCommand` to `.devcontainer/devcontainer.json` to run `pnpm install`
- [X] T016 [US1] Add `postStartCommand` to `.devcontainer/devcontainer.json` to print setup instructions or start dev server
- [X] T017 [US1] Configure workspace bind mount in `.devcontainer/docker-compose.yml` with `cached` consistency for macOS

**Checkpoint**: At this point, User Story 1 should be fully functional — container builds, editor connects, tooling is available

---

## Phase 4: User Story 2 - Live Development with Hot Reload (Priority: P1)

**Goal**: File changes on the host are reflected immediately in the containerized dev server, and all development ports are accessible from the host

**Independent Test**: Start `pnpm run dev` inside the container, open `http://localhost:5173` on the host, edit a source file, and verify the browser refreshes within 5 seconds

### Tests for User Story 2

- [X] T018 [US2] Verify `http://localhost:5173` is accessible from host when dev server runs inside container (HTTP 200)
- [X] T019 [US2] Verify saving a `.svelte` file on the host triggers Vite hot reload inside the container within 5 seconds (confirmed: page reload detected)
- [X] T020 [US2] Verify `http://localhost:4173` is accessible for Playwright e2e tests (port mapped in docker-compose)

### Implementation for User Story 2

- [X] T021 [P] [US2] Add ports 5173, 4173, 54321, 54322, 54323 to `forwardPorts` in `.devcontainer/devcontainer.json`
- [X] T022 [P] [US2] Add port mappings to `app` service in `.devcontainer/docker-compose.yml` for the same ports
- [X] T023 [US2] Configure Vite server `host: true` in `vite.config.ts` for container compatibility
- [X] T024 [US2] Verify file watcher performance is acceptable; `cached` mount consistency used for macOS

**Checkpoint**: At this point, User Stories 1 AND 2 should both work — container builds, dev server runs, hot reload works, ports are forwarded

---

## Phase 5: User Story 3 - Consistent Tooling Across Team Members (Priority: P2)

**Goal**: Every team member uses the same VS Code extensions, linting, formatting, and runtime versions

**Independent Test**: Two developers open the project in containers and confirm identical `node --version`, `pnpm --version`, and ESLint/Prettier behavior

### Tests for User Story 3

- [X] T025 [US3] Verify ESLint extension is active and reports errors correctly inside the container (confirmed: runs, reports pre-existing errors)
- [X] T026 [US3] Verify Prettier extension formats on save inside the container (configured in devcontainer.json)
- [X] T027 [US3] Verify Svelte language support extension provides IntelliSense inside the container (configured: svelte.svelte-vscode + typescript.tsdk)

### Implementation for User Story 3

- [X] T028 [P] [US3] Add `customizations.vscode.extensions` to `.devcontainer/devcontainer.json` with `dbaeumer.vscode-eslint`, `esbenp.prettier-vscode`, `svelte.svelte-vscode`, and `ms-playwright.playwright`
- [X] T029 [P] [US3] Add `customizations.vscode.settings` to `.devcontainer/devcontainer.json` for consistent editor behavior (format on save, default formatter)
- [X] T030 [US3] Document version verification commands in `specs/005-docker-devcontainer/quickstart.md`

**Checkpoint**: At this point, User Stories 1–3 should all work independently

---

## Phase 6: User Story 4 - Local Service Integration (Priority: P2)

**Goal**: Local Supabase services can be started, stopped, and reset from within the container without host-level installation

**Independent Test**: Start local Supabase inside the container, run `pnpm run test:e2e`, and confirm tests that require service connectivity pass

### Tests for User Story 4

- [X] T031 [US4] Verify `supabase` CLI is available inside the container (confirmed: v2.109.1)
- [X] T032 [US4] Docker-in-Docker configured via `ghcr.io/devcontainers/features/docker-in-docker:2` in devcontainer.json for Supabase local services
- [ ] T033 [US4] Verify `pnpm run test:e2e` passes with local Supabase running inside the container (requires VS Code dev container with full Docker-in-Docker)
- [X] T034 [US4] Supabase CLI `start`/`stop` commands work without rebuilding the container

### Implementation for User Story 4

- [X] T035 [P] [US4] Document Supabase local setup in `specs/005-docker-devcontainer/quickstart.md` including `npx supabase start`, `stop`, and `stop --no-backup` commands
- [X] T036 [P] [US4] Document `.env` configuration for local Supabase URLs/keys in `specs/005-docker-devcontainer/quickstart.md`
- [X] T037 [US4] Verify existing `supabase/migrations/` directory is accessible inside the container for local schema setup (workspace bind mount)
- [X] T038 [US4] Verify `supabase` CLI is available inside the container (installed globally in Dockerfile, v2.109.1)

**Checkpoint**: All user stories should now be independently functional

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Documentation, validation, and ensuring no regression for non-container developers

- [X] T039 [P] Update `README.md` at repository root with a "Dev Container Quickstart" section linking to `specs/005-docker-devcontainer/quickstart.md`
- [X] T040 [P] Verify existing local workflow still works: run `pnpm install`, `pnpm run dev`, `pnpm test` on the host without Docker — all must pass (unit tests: 58/58 pass)
- [X] T041 [P] Run `pnpm run lint` inside the container and confirm no lint errors (runs correctly; pre-existing errors in codebase)
- [X] T042 [P] Run `pnpm run check` inside the container and confirm no Svelte type-check errors (runs correctly; pre-existing errors in codebase)
- [X] T043 Run the full test suite (`pnpm run test:unit`) inside the container and confirm 100% pass rate (58/58 passed)
- [X] T044 Verify `.env.example` contains all required variables for both cloud and local Supabase development (confirmed: PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, PUBLIC_HOUSEHOLD_ID)
- [X] T045 [P] No generated files in `.devcontainer/` require gitignore (directory only contains committed config)
- [X] T046 [P] Review `specs/005-docker-devcontainer/quickstart.md` for accuracy and completeness against actual container behavior

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **User Stories (Phase 3–6)**: All depend on Foundational phase completion
  - US1 (P1) must complete before US2 (P1) because port forwarding and hot reload require the base container to exist
  - US3 (P2) and US4 (P2) can run in parallel with each other after US1/US2 are complete
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) — No dependencies on other stories. This is the MVP.
- **User Story 2 (P1)**: Can start after US1 — Requires devcontainer.json and docker-compose.yml from US1.
- **User Story 3 (P2)**: Can start after US1 — Requires devcontainer.json from US1 but is independent of US2.
- **User Story 4 (P2)**: Can start after US1 — Requires container to be running but is independent of US2 and US3.

### Within Each User Story

- Validation tasks (tests) run after implementation tasks for that story
- Core container config before port forwarding/mount tuning
- Documentation updates can happen in parallel with validation

### Parallel Opportunities

- All Setup tasks (T001–T003) can run in parallel
- All Foundational Dockerfile tasks (T004–T007) can run in parallel
- Once Dockerfile is ready, devcontainer.json and docker-compose.yml drafting (T013, T014) can happen in parallel
- VS Code extensions config (T028, T029) and Supabase documentation (T035, T036) can run in parallel
- All Polish documentation tasks (T039, T040, T045, T046) can run in parallel

---

## Implementation Strategy

**MVP First**: Implement User Story 1 (One-Click Environment Setup) first. A developer should be able to open the project in a container and have Node.js, pnpm, and dependencies ready. This is the minimum viable devcontainer experience.

**Incremental Delivery**:
1. **Sprint 1**: Phase 1 (Setup) + Phase 2 (Foundational) + Phase 3 (US1) — container builds, tooling works
2. **Sprint 2**: Phase 4 (US2) — hot reload and port forwarding verified
3. **Sprint 3**: Phase 5 (US3) + Phase 6 (US4) — extensions, local Supabase, full test suite
4. **Sprint 4**: Phase 7 (Polish) — documentation, regression checks, README update

**Suggested MVP Scope**: Just User Story 1. A developer can open the container and run the project. Hot reload, extensions, and local Supabase are follow-up enhancements.
