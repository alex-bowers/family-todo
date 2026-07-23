-- Push subscriptions for Web Push delivery
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_push_subscriptions_household
  on public.push_subscriptions(household_id);

-- Enable RLS
alter table public.push_subscriptions enable row level security;

-- Allow authenticated/anonymous users to manage their household's subscriptions
-- (The existing app uses auth.role() in ('anon', 'authenticated') for other tables)
drop policy if exists push_subscriptions_household_scope_select on public.push_subscriptions;
create policy push_subscriptions_household_scope_select on public.push_subscriptions
for select using (auth.role() in ('anon', 'authenticated'));

drop policy if exists push_subscriptions_household_scope_write on public.push_subscriptions;
create policy push_subscriptions_household_scope_write on public.push_subscriptions
for all using (auth.role() in ('anon', 'authenticated'))
with check (auth.role() in ('anon', 'authenticated'));
