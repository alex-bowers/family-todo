# Family Todo

A simple, cross-device todo list app built with SvelteKit and Supabase.

This has been created as a SDD test using [Spec Kit](https://github.com/github/spec-kit).

## Development Setup

### Option A: VS Code Dev Container (Recommended)

The fastest way to get started with a fully configured environment:

1. Install [VS Code](https://code.visualstudio.com/) and the [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)
2. Clone this repository and open it in VS Code
3. When prompted, click **"Reopen in Container"**
4. Wait for the container to build (~2–5 minutes first time)
5. Run `pnpm run dev` — the app is available at `http://localhost:5173`

See [Dev Container Quickstart](specs/005-docker-devcontainer/quickstart.md) for full details including Supabase local setup, troubleshooting, and test commands.

### Option B: Local Development

If you prefer to run directly on your host machine:

1. Install dependencies: `pnpm install`
2. Run development server: `pnpm run dev`
3. Run tests: `pnpm test`

See [Testing Documentation](docs/testing.md) for more information about running tests and known issues.
