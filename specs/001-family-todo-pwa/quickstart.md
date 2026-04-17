# Quickstart: FamilyToDo (SvelteKit + Cloudflare Pages + Hasura)

## Prerequisites
- Node.js 20+
- npm (or pnpm)
- Cloudflare account with Pages access
- Hasura Cloud account

## 1. Create and configure Hasura project (shared memory system)
1. Create a new Hasura Cloud project.
2. Create/connect a Postgres database for the project.
3. In Hasura Console, create tables:
   - households
   - todo_lists
   - todo_items
4. Add required columns and relationships per data-model.md.
5. Add indexes:
   - todo_lists(household_id, deleted_at)
   - todo_items(list_id, deleted_at)
   - todo_items(updated_at)
6. Configure permissions by role so each household can only read/write rows matching its household_id.
7. Enable GraphQL endpoint access and note:
   - HASURA_GRAPHQL_ENDPOINT
   - HASURA_GRAPHQL_ADMIN_SECRET (server-side only)
8. Create migration metadata and store it with project docs/scripts when implementation starts.

## 2. Initialize SvelteKit app
1. Create SvelteKit project scaffold.
2. Configure PWA assets (manifest.webmanifest, icons, service worker strategy).
3. Add a minimal GraphQL client dependency (no CSS framework).

## 3. Environment configuration
Set variables locally and in Cloudflare Pages:
- PUBLIC_HASURA_GRAPHQL_ENDPOINT=<hasura-endpoint>
- PUBLIC_HASURA_ROLE=<client-role>
- HASURA_GRAPHQL_ADMIN_SECRET=<secret for server-only actions if needed>
- PUBLIC_HOUSEHOLD_ID=<household uuid for initial testing strategy>

## 4. Cloudflare Pages deployment setup
1. Connect repo to Cloudflare Pages.
2. Configure build command and output for SvelteKit adapter compatible with Pages.
3. Add environment variables from step 3 to Pages project settings.
4. Deploy preview branch, then production branch.

## 5. Validate end-to-end behavior
1. Create list, item, complete item, delete item.
2. Open second device/session and confirm changes sync within target window.
3. Test offline mode:
   - perform change offline
   - reconnect
   - verify sync reconciliation
4. Verify PWA install prompt/experience on supported browser.

## 6. Test commands (to be finalized in implementation)
- Unit: run Vitest suite
- E2E: run Playwright flows for list/item lifecycle
- Contract: run GraphQL contract checks against Hasura schema

## 7. Hasura operational notes
- Rotate `HASURA_GRAPHQL_ADMIN_SECRET` on a fixed schedule and after any suspected leak.
- Never expose admin secret to browser code; browser requests use only:
   - `PUBLIC_HASURA_GRAPHQL_ENDPOINT`
   - `PUBLIC_HASURA_ROLE`
- Keep one role per household-scope policy and validate row-level filters before release.
- For sync incidents:
   1. Verify endpoint reachability and role permissions in Hasura Console.
   2. Check client-side queue size in local storage key `familytodo:queue:<household-id>`.
   3. Force reconnect (`online` event) and verify queued mutations flush.
- Confirm migration state before deploy:
   - Schema includes `deleted_at` and `updated_at` columns and trigger-based update timestamp maintenance.
   - Required indexes exist for list/item sync query paths.

## 8. Validation checklist outcomes

Validated on 2026-04-17 from project root:

1. `npm run build`
2. `npm run test:unit`
3. `npm run test:e2e`

Outcome summary:
- Build: PASS
- Unit + contract: PASS (11 tests)
- E2E: PASS (4 tests: lists, items, pwa-install, offline-sync)
- Lint: PASS (`npm run lint`)

Known caveat:
- Vitest reports a non-fatal hanging-process timeout after successful completion. This did not block passing status.

## Notes
- Keep dependencies minimal and justify each added package.
- Preserve keyboard accessibility and focus visibility in all interactive UI flows.
- No CSS framework usage is allowed for this feature.
