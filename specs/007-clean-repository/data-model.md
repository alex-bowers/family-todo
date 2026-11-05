# Data Model: Clean Repository Legacy Artefacts

This feature does not change application or database data. The model below describes the repository objects and evidence used to make cleanup decisions.

## RepositoryArtefact

Represents one tracked repository file, directory, package command, configuration entry, workflow, or documented procedure.

### Attributes

- `path`: repository-relative path or named package/configuration entry.
- `category`: `active-implementation`, `supported-operations`, `historical-spec-kit`, or `obsolete-candidate`.
- `consumers`: active source files, tests, workflows, scripts, or documents that depend on the artefact.
- `evidence`: search results, imports, command references, or feature-history context supporting the classification.
- `disposition`: `retain`, `rename`, `consolidate`, or `remove`.
- `risk`: impact if the classification or disposition is wrong.

### Validation Rules

- Every removed or renamed artefact MUST have no unresolved active consumers.
- A historical Spec Kit artefact MUST be retained when it explains a past feature or architectural decision required to understand the repository's evolution.
- An artefact MUST NOT be classified as obsolete solely because it contains a retired technology name; its active consumers and historical purpose must also be considered.
- A disposition that changes an import or documented command MUST include an updated consumer or an explicit removal of the consumer.

## ActiveReference

Represents a dependency from one active repository artefact to another.

### Attributes

- `source`: importing file, script, workflow, package command, or active document.
- `target`: referenced path, identifier, command, environment value, or service.
- `referenceType`: import, test fixture, command, documentation instruction, configuration, or workflow.
- `status`: `resolved`, `updated`, or `removed-with-consumer`.

### Validation Rules

- All references to retained or renamed artefacts MUST resolve after cleanup.
- References in retained historical records MAY remain when they describe past behaviour, but MUST NOT be copied into active instructions.

## VerificationGate

Represents one required post-cleanup check.

### Attributes

- `name`: human-readable check name.
- `scope`: stale references, path integrity, static analysis, lint, build, unit/contract tests, end-to-end tests, or manual regression.
- `commandOrMethod`: existing repository command or documented manual check.
- `result`: `pass`, `fail`, or `not-run-with-reason`.
- `evidence`: output, diff review, or recorded environment limitation.

### Relationships

- A `RepositoryArtefact` can have zero or more `ActiveReference` records.
- Each `ActiveReference` connects one source artefact to one target artefact.
- A `VerificationGate` validates the final state of one or more `RepositoryArtefact` records and their references.

## State Transition

```text
unclassified
  -> classified
  -> retained
  -> renamed and references updated
  -> removed after dependency audit
  -> verified
```

An artefact classified as historical moves directly from `classified` to `retained`; it does not enter the removal path merely because its content describes an older implementation.

