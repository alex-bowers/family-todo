-- FamilyToDo initial schema for shared household memory
create extension if not exists "pgcrypto";

create table if not exists public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.todo_lists (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  title text not null,
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint todo_lists_title_not_blank check (length(btrim(title)) > 0),
  constraint todo_lists_title_max check (length(title) <= 120)
);

create table if not exists public.todo_items (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.todo_lists(id) on delete cascade,
  description text not null,
  is_completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint todo_items_description_not_blank check (length(btrim(description)) > 0),
  constraint todo_items_description_max check (length(description) <= 500),
  constraint completed_at_consistency check (
    (is_completed and completed_at is not null) or
    (not is_completed and completed_at is null)
  )
);

create index if not exists idx_todo_lists_household_deleted
  on public.todo_lists (household_id, deleted_at);

create index if not exists idx_todo_items_list_deleted
  on public.todo_items (list_id, deleted_at);

create index if not exists idx_todo_items_updated_at
  on public.todo_items (updated_at);

create index if not exists idx_todo_lists_updated_at
  on public.todo_lists (updated_at);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_todo_lists_updated_at on public.todo_lists;
create trigger trg_todo_lists_updated_at
before update on public.todo_lists
for each row execute procedure public.set_updated_at();

drop trigger if exists trg_todo_items_updated_at on public.todo_items;
create trigger trg_todo_items_updated_at
before update on public.todo_items
for each row execute procedure public.set_updated_at();
