-- Migration for an existing setup.sql install. Run once in the SQL Editor as postgres.
-- Optional launch-notice emails from survey question 16. Kept apart from
-- playtest_responses, with no session_id, so the answers stay anonymous.
begin;
create table public.launch_notify_signups (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  email text not null check (char_length(email) between 3 and 254
    and email = lower(email) and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
  language text not null check (language in ('es','en'))
);
alter table public.launch_notify_signups enable row level security;
revoke all on public.launch_notify_signups from public, anon, authenticated;
-- Insert-only for the public site: no SELECT, so nobody can list the emails from the browser.
grant insert (email, language) on public.launch_notify_signups to anon;
create policy launch_notify_insert on public.launch_notify_signups for insert to anon with check (true);
commit;

-- To export the list later (SQL Editor, as postgres):
-- select email, min(created_at) as signed_up, min(language) as language
-- from public.launch_notify_signups group by email order by signed_up;
