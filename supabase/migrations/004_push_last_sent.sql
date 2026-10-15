-- Record when each subscription last received the weekly reminder, so the
-- send endpoint sends at most once per device in each Sunday window.
alter table public.push_subscriptions
  add column if not exists last_sent_at timestamptz;
