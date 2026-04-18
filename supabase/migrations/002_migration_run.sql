-- Migration run metadata for rehearsal and cutover verification
create table if not exists public.migration_runs (
  id uuid primary key default gen_random_uuid(),
  started_at timestamptz not null default now(),
  finished_at timestamptz null,
  status text not null check (status in ('pending', 'running', 'succeeded', 'failed', 'rolled_back')),
  source_snapshot_ref text not null,
  target_snapshot_ref text null,
  verification_summary jsonb not null default '{}'::jsonb,
  rollback_triggered boolean not null default false
);
