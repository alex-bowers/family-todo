-- Supabase baseline schema for FamilyToDo migration
create extension if not exists pgcrypto;

create table if not exists public.todo_lists (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null,
  title text not null check (length(trim(title)) > 0),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz null
);

create table if not exists public.todo_items (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null,
  list_id uuid not null references public.todo_lists(id) on delete cascade,
  description text not null check (length(trim(description)) > 0),
  is_completed boolean not null default false,
  completed_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz null
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists todo_lists_set_updated_at on public.todo_lists;
create trigger todo_lists_set_updated_at
before update on public.todo_lists
for each row execute function public.set_updated_at();

drop trigger if exists todo_items_set_updated_at on public.todo_items;
create trigger todo_items_set_updated_at
before update on public.todo_items
for each row execute function public.set_updated_at();

alter table public.todo_lists enable row level security;
alter table public.todo_items enable row level security;

create policy if not exists todo_lists_household_scope_select on public.todo_lists
for select using (household_id::text = current_setting('request.jwt.claims', true)::jsonb ->> 'household_id');
create policy if not exists todo_lists_household_scope_write on public.todo_lists
for all using (household_id::text = current_setting('request.jwt.claims', true)::jsonb ->> 'household_id')
with check (household_id::text = current_setting('request.jwt.claims', true)::jsonb ->> 'household_id');

create policy if not exists todo_items_household_scope_select on public.todo_items
for select using (household_id::text = current_setting('request.jwt.claims', true)::jsonb ->> 'household_id');
create policy if not exists todo_items_household_scope_write on public.todo_items
for all using (household_id::text = current_setting('request.jwt.claims', true)::jsonb ->> 'household_id')
with check (household_id::text = current_setting('request.jwt.claims', true)::jsonb ->> 'household_id');
