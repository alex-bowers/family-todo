# Family Todo

A simple, cross-device todo list app built with SvelteKit and Supabase.

This has been created as a SDD test using [Spec Kit](https://github.com/github/spec-kit).

## Repository History

Supabase is the supported backend for the current application. The ordered
feature records in [`specs/`](specs/) show how the repository was specified,
planned, tested, and evolved with GitHub Spec Kit:

- [`specs/001-family-todo-pwa`](specs/001-family-todo-pwa/) — initial application
- [`specs/002-swap-hasura-supabase`](specs/002-swap-hasura-supabase/) — backend transition
- [`specs/003-improve-list-usability`](specs/003-improve-list-usability/) — list usability
- [`specs/004-safer-list-management`](specs/004-safer-list-management/) — safer list management
- [`specs/005-docker-devcontainer`](specs/005-docker-devcontainer/) — development container
- [`specs/006-push-weekly-reminders`](specs/006-push-weekly-reminders/) — push reminders
- [`specs/007-clean-repository`](specs/007-clean-repository/) — repository cleanup

Older feature records may mention Hasura or migration tooling because they
document earlier decisions. Those references are historical; they are not
required for current setup or operation. Spec Kit configuration and governance
are kept in [`.specify/`](.specify/) and the agent definitions in
[`.github/agents/`](.github/agents/).
