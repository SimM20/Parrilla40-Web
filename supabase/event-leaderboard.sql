-- Ranking del evento. Run once in the project's SQL Editor as postgres, after setup.sql.
-- The game (event/leaderboard branch) inserts one row per finished run with the publishable key;
-- ranking-evento.html reads the best run per name through event_leaderboard_top().
begin;
create table public.event_leaderboard (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  player_name text not null check (char_length(player_name) between 1 and 20 and player_name ~ '[^[:space:]]'),
  -- Total money earned in the run, without subtracting purchases or upgrades.
  total_earned integer not null check (total_earned between 0 and 100000000)
);
alter table public.event_leaderboard enable row level security;
revoke all on public.event_leaderboard from public, anon, authenticated;
-- The game sends its own id so a retried upload is rejected (409) instead of duplicated.
grant insert (id, player_name, total_earned) on public.event_leaderboard to anon;
create policy event_leaderboard_insert on public.event_leaderboard for insert to anon with check (true);

-- Best run per name (case-insensitive), top 100. The only public read entry point.
create function public.event_leaderboard_top()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(jsonb_agg(jsonb_build_object(
      'player_name', b.player_name, 'total_earned', b.total_earned,
      'created_at', b.created_at, 'runs', b.runs)
    order by b.total_earned desc, b.created_at), '[]'::jsonb)
  from (
    select * from (
      select distinct on (lower(r.player_name)) r.player_name, r.total_earned, r.created_at,
        count(*) over (partition by lower(r.player_name)) as runs
      from public.event_leaderboard r
      order by lower(r.player_name), r.total_earned desc, r.created_at
    ) best
    order by best.total_earned desc, best.created_at
    limit 100
  ) b;
$$;
revoke all on function public.event_leaderboard_top() from public, anon, authenticated;
grant execute on function public.event_leaderboard_top() to anon;
commit;
