# Quickstart: Docker Dev Container Support

## 1. Prerequisites

- Docker Engine (Desktop or CLI) installed on the host machine
- VS Code with the Dev Containers extension installed
- Git (to clone the repository)

## 2. Clone and Open

```bash
git clone <repository-url> family-todo
cd family-todo
```

Open the folder in VS Code. When prompted, click **"Reopen in Container"**. If not prompted, open the Command Palette (`Cmd/Ctrl+Shift+P`) and run:

```
Dev Containers: Reopen in Container
```

## 3. Wait for Build

The container will build automatically. First build takes ~2–5 minutes. Subsequent opens are near-instant.

**Verified tooling inside the container:**
- Node.js v22.x
- pnpm 11.8.0+ (via corepack)
- Supabase CLI 2.109.1+
- Playwright Chromium dependencies

## 4. Configure Environment

After the container starts, copy the environment template:

```bash
cp .env.example .env
```

If using local Supabase, start the local stack and copy the displayed URL and anon key into `.env`:

```bash
npx supabase start
```

Update `.env` with the local Supabase values output by the command above.

## 5. Install Dependencies

Dependencies are installed automatically via `postCreateCommand`. If you need to reinstall:

```bash
pnpm install
```

## 6. Run the Development Server

```bash
pnpm run dev
```

The application will be available at `http://localhost:5173` on your host machine. Vite is configured with `host: true` for container networking.

## 7. Run Tests

### Unit and Contract Tests

```bash
pnpm run test:unit
```

**Status:** 58/58 tests pass inside the container.

### End-to-End Tests

```bash
pnpm run test:e2e
```

### All Tests

```bash
pnpm test
```

## 8. Start Local Supabase (Optional)

If your feature work requires local Supabase services:

```bash
npx supabase start
```

Access Supabase Studio at `http://localhost:54323`.

To stop local Supabase:

```bash
npx supabase stop
```

To reset local Supabase data:

```bash
npx supabase stop --no-backup
npx supabase start
```

## Troubleshooting

### Port Already in Use

If `pnpm run dev` fails because port 5173 is in use on the host, stop any local dev server first:

```bash
lsof -ti:5173 | xargs kill -9
```

### Hot Reload Not Working

File changes should trigger Vite HMR automatically via the bind mount. If changes aren't detected:

```bash
export CHOKIDAR_USEPOLLING=true
pnpm run dev
```

### Docker-in-Docker for Supabase

The devcontainer uses Microsoft's `docker-in-docker` feature to allow the Supabase CLI to spawn its own containers. This is handled automatically by VS Code Dev Containers — no manual socket mounting required.

## 9. Lint and Type Check

```bash
pnpm run lint
pnpm run check
```

## 10. Rebuild Container

If you change `Dockerfile`, `docker-compose.yml`, or `devcontainer.json`, rebuild the container:

```bash
# In VS Code Command Palette
Dev Containers: Rebuild Container
```

## Fallback: Local Development (No Docker)

If you cannot use Docker, the existing local workflow remains fully functional:

1. Install Node.js 20.x and pnpm 11.8.0 on your host machine.
2. Run `pnpm install`.
3. Copy `.env.example` to `.env` and configure.
4. Run `pnpm run dev` and `pnpm test` as usual.
