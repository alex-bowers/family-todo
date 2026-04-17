# Dependency Decisions

## Purpose

Document each dependency used by FamilyToDo and why it is required under the
constitution principle that dependencies must be intentional and minimal.

## Current Dependencies

- @sveltejs/kit
Reason: Core framework for routing, rendering, and PWA-oriented app architecture.
Native alternative considered: Hand-built Vite SPA with custom routing and hydration.
Decision: Rejected due to higher maintenance and reduced convention support.

- @sveltejs/adapter-cloudflare
Reason: Deployable output format for Cloudflare Pages/Workers runtime.
Native alternative considered: Custom build/deploy scripting.
Decision: Rejected due to increased deployment complexity and risk.

- vite
Reason: Development server and bundler for SvelteKit.
Native alternative considered: None practical, this is the framework-standard bundler.
Decision: Keep.

- vitest
Reason: Fast TypeScript-native unit/contract test runner integrated with Vite.
Native alternative considered: Node test runner.
Decision: Node test runner lacks integrated mocking and coverage fit for this codebase.

- @playwright/test
Reason: End-to-end browser tests for PWA and cross-device flows.
Native alternative considered: Manual QA only.
Decision: Rejected because constitution requires automated behavior regression tests.

- eslint / typescript-eslint / eslint-plugin-svelte
Reason: Static analysis and quality gate for TypeScript + Svelte files.
Native alternative considered: TypeScript compiler checks only.
Decision: Compiler checks alone miss stylistic and safety issues.

- prettier / prettier-plugin-svelte
Reason: Consistent formatting with low maintenance overhead.
Native alternative considered: Manual formatting.
Decision: Rejected due to inconsistent diffs and review noise.

## Review Rules

- Additions require this document update in the same change set.
- Each addition must include at least one alternative considered.
- Remove dependencies when no longer used.
