# Devcontainer Contract

## Interface: VS Code Dev Container

The project exposes a VS Code Dev Container configuration that editors supporting the Dev Container specification can consume.

### Entry Point

- **File**: `.devcontainer/devcontainer.json`
- **Schema**: https://raw.githubusercontent.com/devcontainers/spec/main/schemas/devContainer.schema.json

### Required Capabilities

| Capability | Contract |
|------------|----------|
| Build | `dockerComposeFile` references a valid `docker-compose.yml`; `service` names a defined service |
| Workspace Mount | `workspaceFolder` is `/workspaces/family-todo` |
| Port Forwarding | Ports 5173, 4173, 54321, 54322, 54323 are listed in `forwardPorts` |
| Post-Create Setup | `postCreateCommand` runs `pnpm install` |
| Post-Start Services | `postStartCommand` runs `pnpm run dev` or documents how to start Supabase local |
| User | `remoteUser` is `node` (non-root) |

### VS Code Extensions Contract

The following extensions MUST be pre-installed for consistent developer experience:

| Extension ID | Purpose |
|--------------|---------|
| `dbaeumer.vscode-eslint` | Linting |
| `esbenp.prettier-vscode` | Formatting |
| `svelte.svelte-vscode` | Svelte language support |
| `ms-playwright.playwright` | Playwright test runner |

### Environment Contract

The container MUST provide the following environment:

| Variable | Source | Expected Value |
|----------|--------|----------------|
| `NODE_VERSION` | Base image | `20.x` |
| `PNPM_VERSION` | Corepack | `11.8.0` |
| `PUBLIC_SUPABASE_URL` | `.env` file | Local or cloud Supabase URL |
| `PUBLIC_SUPABASE_ANON_KEY` | `.env` file | Valid anon key |

## Interface: Docker Compose Services

### App Service

| Property | Value |
|----------|-------|
| Build Context | Repository root |
| Dockerfile | `.devcontainer/Dockerfile` |
| User | `node` |
| Working Directory | `/workspaces/family-todo` |
| Volumes | Workspace bind mount, pnpm store cache |

### Supabase Service (Optional)

| Property | Value |
|----------|-------|
| Image | Supabase CLI-managed or official local stack |
| Ports | 54321 (API), 54322 (Auth), 54323 (Studio) |
| Volumes | Supabase data, config, and migrations |

## Interface: Test Execution

All existing test commands MUST produce identical results inside the container:

| Command | Expected Result |
|---------|----------------|
| `pnpm run test:unit` | All unit and contract tests pass |
| `pnpm run test:e2e` | All Playwright tests pass |
| `pnpm run lint` | No lint errors |
| `pnpm run check` | No Svelte type-check errors |
| `pnpm run dev` | Dev server starts on port 5173 |
