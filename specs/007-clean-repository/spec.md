# Feature Specification: Clean Repository Legacy Artefacts

**Feature Branch**: `007-clean-repository`
**Created**: 2026-11-05
**Status**: Draft
**Input**: User description: "Clean this repository. There are a lot of files that are related to past implementations. I want this repository to show how it has been created with GitHub Spec Kit but I don't need all the old code, from things like Hasura etc."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Maintain a focused active codebase (Priority: P1)

As a maintainer, I want obsolete implementation and migration artefacts removed or consolidated so that the repository clearly represents the current application and does not invite work against abandoned integrations.

**Why this priority**: Stale code and configuration create misleading maintenance paths and make it harder to understand which implementation is supported.

**Independent Test**: Review the active source, configuration, tests, operational documentation, and package scripts after cleanup; confirm that they describe and reference only the supported implementation and that the existing application checks still pass.

**Acceptance Scenarios**:

1. **Given** the repository contains active Supabase-backed code and obsolete Hasura/migration artefacts, **When** the cleanup is complete, **Then** active code, tests, configuration, scripts, and operational documentation contain no unresolved references to the retired backend or its one-time migration path.
2. **Given** a contributor follows the documented development and verification flow, **When** they inspect the repository or run the existing checks, **Then** they find one supported implementation path and no dead commands that depend on removed files.
3. **Given** an artefact is referenced by active code or a required check, **When** it is reviewed for removal, **Then** it is retained, replaced, or deliberately renamed before any dependent file is removed.

### User Story 2 - Preserve the Spec Kit creation record (Priority: P1)

As a reviewer, I want the repository to retain its Spec Kit feature history so that I can understand how the application was specified, planned, tested, and evolved without needing the superseded runtime code.

**Why this priority**: The repository is intended to demonstrate its development through GitHub Spec Kit, so removing the history would defeat a primary purpose of the cleanup.

**Independent Test**: Browse the Spec Kit configuration and historical feature directories; confirm that the existing feature specifications and their supporting planning artefacts remain discoverable and readable after cleanup.

**Acceptance Scenarios**:

1. **Given** the repository contains completed Spec Kit features, **When** legacy runtime files are removed, **Then** the existing feature directories and their specifications remain available as historical records.
2. **Given** a reviewer starts at the repository root, **When** they look for the project workflow and feature history, **Then** the Spec Kit configuration and the ordered feature records are easy to locate.
3. **Given** a historical specification mentions a retired technology, **When** the historical record is reviewed, **Then** that reference is retained where it explains an earlier decision and is not mistaken for an active runtime requirement.

### User Story 3 - Understand the supported repository surface (Priority: P2)

As a new contributor, I want concise documentation that distinguishes current implementation files from historical records so that I can start contributing without reverse-engineering old migrations or abandoned service setups.

**Why this priority**: Clear orientation reduces onboarding time and prevents accidental reintroduction of retired architecture.

**Independent Test**: Give a contributor the cleaned repository and its entry-point documentation; confirm that they can identify the supported backend, development setup, verification commands, and the purpose of the `specs/` history without additional maintainer guidance.

**Acceptance Scenarios**:

1. **Given** a fresh checkout, **When** a contributor reads the README and relevant architecture documentation, **Then** the supported runtime and the role of historical Spec Kit artefacts are stated consistently.
2. **Given** a contributor searches for the retired backend name, **When** the search is limited to active implementation and operational files, **Then** it returns no unresolved references.
3. **Given** the contributor needs to understand a past architectural decision, **When** they follow the repository's history links, **Then** they can find the relevant Spec Kit feature without relying on deleted runtime code.

### Edge Cases

- A file that appears obsolete is still imported by application code, tests, build configuration, or a documented verification command; it must not be deleted until the dependency is removed or replaced.
- A historical specification, plan, contract, or research document contains retired technology names as part of the decision record; those references may remain, but must be clearly historical rather than active instructions.
- A one-time migration or parity command is still needed for an explicitly supported operational process; it must be retained and documented rather than removed solely because it contains legacy terminology.
- Existing uncommitted user changes or local-only files are present during cleanup; the cleanup must not overwrite, discard, or delete them.
- The cleanup changes no application behaviour, production configuration, secrets, or persistent data; any discovered need for such a change is outside this feature.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The cleanup MUST inventory repository artefacts and classify them as active implementation, supported operational material, historical Spec Kit record, or obsolete before removing any file.
- **FR-002**: The cleanup MUST preserve the Spec Kit configuration, templates, workflow support, and existing completed feature records needed to demonstrate how the repository was created and evolved.
- **FR-003**: The cleanup MUST remove or consolidate obsolete Hasura-specific runtime artefacts, fixtures, contracts, configuration, and scripts that are not required by the current supported implementation.
- **FR-004**: The cleanup MUST remove or consolidate one-time backend migration and parity tooling that has no remaining supported operational use, including its dead package commands and runbook references.
- **FR-005**: The cleanup MUST update active source, tests, configuration, README content, and operational documentation so that they identify the supported implementation consistently and do not direct contributors to retired services.
- **FR-006**: Before removing or renaming an artefact, the implementation MUST verify that no active import, test, build step, workflow, package command, or documented procedure depends on its current path or name.
- **FR-007**: The cleanup MUST preserve existing user-visible todo, offline, synchronisation, notification, and installation behaviour; no product feature change is authorised by this specification.
- **FR-008**: The cleanup MUST NOT change production data, database schemas, authentication or authorisation behaviour, secrets, deployment targets, or external service configuration.
- **FR-009**: The cleanup MUST NOT add a dependency. Any dependency found to be unused as a result of the cleanup MUST be removed only when the existing project checks confirm that it is no longer needed.
- **FR-010**: The completed repository MUST retain a concise entry-point explanation of the supported implementation, the purpose of the historical `specs/` records, and the commands needed for normal development and verification.
- **FR-011**: The cleanup MUST include automated verification for stale active references, broken paths or commands, and regressions in the existing application checks.
- **FR-012**: The cleanup MUST preserve accessible behaviour of existing user-facing flows; because no interface change is planned, keyboard access, visible focus, semantic labelling, and contrast behaviour MUST remain unchanged.

### Key Entities

- **Repository artefact**: A tracked file, directory, package command, configuration entry, or documented procedure that is classified as active, supported, historical, or obsolete.
- **Active implementation surface**: The source, tests, configuration, scripts, workflows, and operational documentation required to build, verify, deploy, and maintain the current application.
- **Historical Spec Kit record**: A completed feature directory and its specification, plan, tasks, research, contracts, checklists, or related artefacts that explain how the repository evolved.
- **Cleanup classification**: The evidence-backed decision describing why an artefact is retained, removed, renamed, consolidated, or moved out of the active path.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: A repository search of active implementation, test, configuration, script, workflow, and operational documentation paths finds zero unresolved references to the retired Hasura backend or completed backend migration process.
- **SC-002**: 100% of files removed or renamed by the cleanup have a recorded classification and have no remaining active dependants at the point of change.
- **SC-003**: 100% of the existing completed Spec Kit feature records remain discoverable from the repository after cleanup, including the newly created cleanup specification.
- **SC-004**: All existing required formatting, static analysis, build, unit, and end-to-end verification checks pass after cleanup, with no new skipped or weakened check introduced by the change.
- **SC-005**: In a contributor walkthrough, at least 90% of participants can identify the supported implementation, normal verification flow, and location of historical Spec Kit records without maintainer assistance.
- **SC-006**: A regression review of the existing todo, offline, synchronisation, notification, and installation journeys records no user-visible behaviour change attributable to the cleanup.

## Assumptions

- The application has completed its move to Supabase; Supabase is the supported backend for the current implementation.
- The `specs/001` through `specs/006` directories are intentionally retained as the project's Spec Kit creation and decision history, even when they describe superseded architecture.
- Historical references to Hasura are acceptable inside retained records when they explain past decisions, provided active instructions and implementation paths no longer depend on them.
- Existing local development, testing, and deployment workflows are the source of truth for deciding whether a migration or operational artefact is still supported.
- Cleanup is performed as a reviewable repository change and does not include committing, branching, publishing, deploying, or changing external systems.
