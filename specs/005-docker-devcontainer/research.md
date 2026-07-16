# Research: Docker Dev Container Support

## Decision 1: Use Microsoft Dev Containers TypeScript-Node base image

- **Decision**: Use `mcr.microsoft.com/devcontainers/typescript-node:20` as the base image.
- **Rationale**: Official Microsoft devcontainer image pre-installs Node.js 20, TypeScript tooling, git, zsh, and common development utilities. Reduces Dockerfile maintenance and aligns with VS Code Dev Containers extension expectations.
- **Alternatives considered**:
  - `node:20` official image (rejected — requires manual installation of git, zsh, sudo, and non-root user setup that the devcontainer image handles).
  - Custom Dockerfile from `ubuntu:22.04` (rejected — excessive maintenance for a standard Node.js development environment).

## Decision 2: Use Docker Compose for multi-service orchestration

- **Decision**: Define a `docker-compose.yml` in `.devcontainer/` that runs the dev container alongside a Supabase local stack.
- **Rationale**: The project requires Supabase Postgres + Auth + API for full functionality. Running Supabase CLI inside the dev container would require Docker-in-Docker, which adds complexity and privilege requirements. Using docker-compose allows Supabase services to run as peer containers with shared networking.
- **Alternatives considered**:
  - Docker-in-Docker with Supabase CLI inside the dev container (rejected — requires privileged mode, heavier resource usage, and more complex setup).
  - Host-installed Supabase CLI (rejected — violates the goal of host-level zero-installation).
  - Cloud Supabase project for development (rejected — requires internet connectivity for all dev work and risks polluting shared data).

## Decision 3: Use Supabase CLI-managed local stack via docker-compose

- **Decision**: Use the Supabase CLI (`npx supabase`) to generate and manage the local Supabase configuration, but orchestrate the actual containers via docker-compose in the devcontainer setup.
- **Rationale**: The Supabase CLI provides schema migration management, local config generation, and service orchestration. Using it for config/migrations while docker-compose handles container lifecycle gives the best of both worlds.
- **Alternatives considered**:
  - Manual Postgres + PostgREST + GoTrue containers (rejected — duplicates Supabase CLI's proven orchestration and increases maintenance).
  - Supabase CLI `start` inside the dev container with Docker socket bind-mount (rejected — socket bind-mount is host-OS dependent and fragile on macOS with Docker Desktop).

## Decision 4: Install pnpm via corepack in the container

- **Decision**: Enable Node.js corepack in the Dockerfile to install the project's pinned pnpm version (`pnpm@11.8.0`).
- **Rationale**: The project specifies `packageManager: pnpm@11.8.0` in `package.json`. Corepack reads this field and installs the exact version automatically, ensuring consistency with the host workflow.
- **Alternatives considered**:
  - `npm install -g pnpm@11.8.0` (rejected — duplicates version management; corepack is the Node.js-native solution).
  - Use npm instead of pnpm (rejected — violates project conventions and lockfile format).

## Decision 5: Install Playwright system dependencies in the Dockerfile

- **Decision**: Add a Dockerfile step to install Playwright's Chromium system dependencies using `npx playwright install-deps chromium`.
- **Rationale**: Playwright e2e tests require OS-level browser dependencies (fonts, libraries, etc.) that are not present in the base Node.js image. Installing them at image build time ensures tests run without additional setup.
- **Alternatives considered**:
  - Install deps at container runtime (rejected — slower startup, requires internet on every container start).
  - Use Playwright's Docker image as base (rejected — not a devcontainer image, lacks VS Code integration features).

## Decision 6: Forward standard development ports automatically

- **Decision**: Forward ports 5173 (Vite dev), 4173 (Vite preview/e2e baseURL), 54321 (Supabase API), 54322 (Supabase Auth), and 54323 (Supabase Studio) in `devcontainer.json`.
- **Rationale**: These are the ports used by the project's dev server, e2e tests, and local Supabase services. Automatic forwarding removes manual `docker port` or `-p` flags.
- **Alternatives considered**:
  - Forward all ports dynamically (rejected — less predictable, harder to document).
  - Use host networking mode (rejected — not supported on macOS Docker Desktop).

## Decision 7: Mount the project workspace with delegated consistency on macOS

- **Decision**: Use the default devcontainer workspace mount with `consistency: delegated` for macOS hosts to improve file system performance.
- **Rationale**: Bind mounts on macOS Docker Desktop have known performance issues with file watching. The `delegated` flag lets the container's view of the mount be authoritative, improving Vite's file watcher responsiveness.
- **Alternatives considered**:
  - Docker volume instead of bind mount (rejected — changes are not immediately visible on the host filesystem, breaking the host-edit/container-serve workflow).
  - `CHOKIDAR_USEPOLLING=true` (rejected — polling increases CPU usage; delegated consistency is preferred for macOS).

## Decision 8: Pre-install VS Code extensions for consistent DX

- **Decision**: Include `dbaeumer.vscode-eslint`, `esbenp.prettier-vscode`, `svelte.svelte-vscode`, and `ms-playwright.playwright` in `devcontainer.json` customizations.
- **Rationale**: Ensures all developers have linting, formatting, Svelte language support, and Playwright test runner integration without manual extension installation.
- **Alternatives considered**:
  - No pre-installed extensions (rejected — inconsistent developer experience, potential for formatting/linting mismatches).
  - Include all possible extensions (rejected — bloats container startup time; only project-relevant extensions are included).

## Decision 9: Use `.env.example` as the template for container environment

- **Decision**: Document that developers must copy `.env.example` to `.env` and update values for local Supabase URLs/keys after starting the local stack.
- **Rationale**: The project already uses `.env.example` as a template. The devcontainer workflow should reuse this convention. Local Supabase start outputs the local URL and anon key, which the developer copies into `.env`.
- **Alternatives considered**:
  - Auto-generate `.env` on container startup (rejected — risks overwriting developer customizations; explicit copy is safer).
  - Bake default local Supabase values into the image (rejected — local Supabase keys are generated per-instance and should not be shared).

## Decision 10: Preserve existing local workflow

- **Decision**: No changes to `package.json` scripts, `vite.config.ts`, or application code. The devcontainer is purely additive.
- **Rationale**: The spec requires that developers who do not use Docker continue to work without regression. All container-specific configuration is isolated to `.devcontainer/`.
- **Alternatives considered**:
  - Modify `vite.config.ts` server settings for container (rejected — would break host-local development).
  - Add container-specific npm scripts (rejected — unnecessary; existing scripts work identically inside the container).
