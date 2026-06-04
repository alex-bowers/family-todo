# Research: FamilyToDo Multi-List PWA

## Decision 1: Use Hasura Cloud as shared memory system

- Decision: Use Hasura Cloud (managed Postgres + GraphQL API) as canonical cross-device memory.
- Rationale: Matches requirement for shared persistence across installed PWAs, removes custom backend hosting burden, and provides schema-first APIs with subscriptions support.
- Alternatives considered: Supabase, Firebase, custom Cloudflare Workers API + D1.

## Decision 2: Deploy SvelteKit app to Cloudflare Pages

- Decision: Host the SvelteKit frontend on Cloudflare Pages.
- Rationale: Directly matches hosting requirement and offers global edge delivery for fast app shell loads.
- Alternatives considered: Vercel, Netlify, self-hosted Node runtime.

## Decision 3: GraphQL contract-first integration with Hasura

- Decision: Define explicit GraphQL operation contracts (queries/mutations/subscriptions) for lists/items and sync behavior.
- Rationale: Keeps client-server boundaries stable, testable, and auditable as schema evolves.
- Alternatives considered: Ad hoc query strings in UI components, generated SDK without explicit contract docs.

## Decision 4: Offline-first with local cache plus reconnect sync

- Decision: Maintain local cache (IndexedDB/local storage) for continuity, then sync with Hasura when online.
- Rationale: Supports PWA usage patterns and minimizes UX disruption during connectivity transitions.
- Alternatives considered: Online-only operation, full CRDT stack in v1.

## Decision 5: Conflict resolution policy for concurrent edits

- Decision: v1 conflict policy uses server timestamp ordering (last-write-wins) with visible refresh on reconnect.
- Rationale: Simple and reliable for household scope while meeting cross-device consistency goals quickly.
- Alternatives considered: Manual merge UI, operational transforms, CRDT conflict-free collaboration model.

## Decision 6: Styling approach without CSS frameworks

- Decision: Use handcrafted CSS with design tokens (CSS variables) and scoped component styles.
- Rationale: Satisfies explicit no-framework constraint while keeping accessibility and consistency manageable.
- Alternatives considered: Tailwind CSS, Bootstrap, Bulma.

## Decision 7: Hasura project setup path (required enablement)

- Decision: Include a dedicated setup flow in quickstart: create Hasura project, create schema/tables, configure permissions, set env vars in Cloudflare Pages, and validate operations.
- Rationale: User explicitly requested setup guidance for Hasura; this must be first-class in delivery docs.
- Alternatives considered: Deferring setup to implementation tasks only, implicit setup via code comments.
