# family-todo Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-06-05

## Active Technologies

- TypeScript/JavaScript on Node.js 20.x with SvelteKit 2.x + SvelteKit, Vite, Supabase JS client, Vitest, Playwright (existing only) (004-start-specification)
- Supabase Postgres via existing repository layer, plus local cache/offline queue already used by the app (004-start-specification)

- TypeScript on Node.js 20.x (frontend stack unchanged) + SvelteKit, Vite, Supabase JS client, Vitest, Playwrigh (002-migrate-to-supabase)
- Supabase Postgres (canonical shared memory) + browser local cache/queue for offline continuity (002-migrate-to-supabase)

- TypeScript on Node.js 20.x (SvelteKit current LTS support) + SvelteKit, Vite, Hasura GraphQL API (cloud-hosted), GraphQL client (lightweight) (001-build-family-todo-pwa)

## Project Structure

```text
src/
tests/
```

## Commands

pnpm test && pnpm run lint

## Code Style

TypeScript on Node.js 20.x (SvelteKit current LTS support): Follow standard conventions

## Recent Changes

- 004-start-specification: Added TypeScript/JavaScript on Node.js 20.x with SvelteKit 2.x + SvelteKit, Vite, Supabase JS client, Vitest, Playwright (existing only)

- 002-migrate-to-supabase: Added TypeScript on Node.js 20.x (frontend stack unchanged) + SvelteKit, Vite, Supabase JS client, Vitest, Playwrigh

- 001-build-family-todo-pwa: Added TypeScript on Node.js 20.x (SvelteKit current LTS support) + SvelteKit, Vite, Hasura GraphQL API (cloud-hosted), GraphQL client (lightweight)

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
