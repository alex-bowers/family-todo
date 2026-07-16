# Data Model: Docker Dev Container Support

This feature does not introduce new application data entities. The data model is limited to configuration and environment definitions required by the devcontainer infrastructure.

## Configuration Entities

### Devcontainer Configuration (`devcontainer.json`)

Represents the VS Code Dev Container specification.

| Field | Type | Description |
|-------|------|-------------|
| name | string | Human-readable container name (e.g., "FamilyToDo Dev") |
| dockerComposeFile | string[] | Path to docker-compose.yml relative to workspace root |
| service | string | The docker-compose service name for the dev container |
| workspaceFolder | string | Mount point inside the container |
| forwardPorts | number[] | Ports automatically forwarded to the host |
| postCreateCommand | string | Command run after container creation (e.g., `pnpm install`) |
| postStartCommand | string | Command run after container starts (e.g., start local Supabase) |
| customizations.vscode.extensions | string[] | VS Code extensions to pre-install |
| customizations.vscode.settings | object | VS Code settings overrides |
| remoteUser | string | User inside the container (e.g., "node") |
| mountConsistency | string | macOS bind mount consistency ("delegated") |

### Docker Compose Configuration (`docker-compose.yml`)

Defines the multi-service orchestration for the development environment.

| Field | Type | Description |
|-------|------|-------------|
| version | string | Docker Compose spec version |
| services.app.build.context | string | Build context for the dev container |
| services.app.build.dockerfile | string | Path to Dockerfile |
| services.app.volumes | array | Workspace bind mount and optional cache volumes |
| services.app.environment | object | Environment variables passed to the container |
| services.app.ports | array | Port mappings (supplementing devcontainer.json forwarding) |
| services.supabase.image | string | Supabase local stack image or CLI-managed |
| services.supabase.ports | array | Supabase service port mappings |
| services.supabase.volumes | array | Supabase data and config persistence |

### Dockerfile Build Configuration (`Dockerfile`)

Defines the development environment image.

| Field | Type | Description |
|-------|------|-------------|
| FROM | string | Base image (`mcr.microsoft.com/devcontainers/typescript-node:20`) |
| RUN corepack enable | command | Enable Node.js corepack for pnpm |
| RUN corepack prepare pnpm@11.8.0 --activate | command | Install pinned pnpm version |
| RUN npx playwright install-deps chromium | command | Install Playwright browser dependencies |
| USER node | command | Run as non-root user |
| WORKDIR /workspaces/family-todo | string | Default working directory |

### Environment Secrets (`.env`)

Sensitive runtime configuration mounted at container start, not baked into the image.

| Field | Type | Description |
|-------|------|-------------|
| PUBLIC_SUPABASE_URL | string | Supabase project URL (local or cloud) |
| PUBLIC_SUPABASE_ANON_KEY | string | Supabase anonymous client key |
| SUPABASE_SERVICE_ROLE_KEY | string | Supabase service role key (for admin operations) |
| PUBLIC_HOUSEHOLD_ID | string | Default household UUID for development |

## State Transitions

### Container Lifecycle

```
[Build] -> [Create] -> [Post-Create: pnpm install] -> [Start] -> [Post-Start: start services]
   ^                                                        |
   |                                                        v
[Rebuild] <------------------------------------------ [Stop]
```

### Local Supabase Lifecycle

```
[Container Start] -> [supabase start] -> [Services Ready] -> [Dev Server Start]
       ^                                                        |
       |                                                        v
[Reset] <------------------------------------------------ [supabase stop]
```

## Validation Rules

- `devcontainer.json` must reference a valid `docker-compose.yml` file.
- `docker-compose.yml` must define a service matching the `service` field in `devcontainer.json`.
- `Dockerfile` must not contain hardcoded secrets or credentials.
- `.env` must be listed in `.gitignore` and `.dockerignore`.
- Forwarded ports must not conflict with commonly used host ports (e.g., 5432 for local Postgres).
