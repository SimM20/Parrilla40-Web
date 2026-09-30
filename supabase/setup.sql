-- Run once in the confirmed project's SQL Editor as postgres.
begin;
create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;
create schema playtest_private;
revoke all on schema playtest_private from public, anon, authenticated;

create table playtest_private.admin_verifier (
  singleton boolean primary key default true check (singleton),
  password_hash text not null check (password_hash ~ '^\$2[aby]\$12\$[./A-Za-z0-9]{53}$')
);
alter table playtest_private.admin_verifier enable row level security;
revoke all on playtest_private.admin_verifier from public, anon, authenticated;

create table public.playtest_responses (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  session_id uuid not null,
  build_version text not null check (char_length(build_version) between 1 and 100 and build_version ~ '[^[:space:]]'),
  completed_night_1 boolean not null,
  completed_night_2 text not null check (completed_night_2 in ('yes','no','not_reached')),
  highest_night integer not null check (highest_night >= 0),
  initial_understanding smallint not null check (initial_understanding between 1 and 5),
  controls_intuitiveness smallint not null check (controls_intuitiveness between 1 and 5),
  cooking_understanding smallint not null check (cooking_understanding between 1 and 5),
  heat_understanding smallint not null check (heat_understanding between 1 and 5),
  order_readability smallint not null check (order_readability between 1 and 5),
  difficulty_fairness smallint not null check (difficulty_fairness between 1 and 5),
  customer_pacing text not null check (customer_pacing in ('very_slow','slow','good','fast','very_fast')),
  learning_feeling smallint not null check (learning_feeling between 1 and 5),
  stress_experience text not null check (stress_experience in ('very_fun','mostly_fun','balanced','mostly_frustrating','very_frustrating')),
  want_to_continue text not null check (want_to_continue in ('yes','maybe','no')),
  favorite_part text not null check (char_length(favorite_part) between 1 and 4000 and favorite_part ~ '[^[:space:]]'),
  one_thing_to_change text not null check (char_length(one_thing_to_change) between 1 and 4000 and one_thing_to_change ~ '[^[:space:]]')
);
alter table public.playtest_responses enable row level security;
revoke all on public.playtest_responses from public, anon, authenticated;
grant insert (session_id, build_version, completed_night_1, completed_night_2,
  highest_night, initial_understanding, controls_intuitiveness, cooking_understanding,
  heat_understanding, order_readability, difficulty_fairness, customer_pacing,
  learning_feeling, stress_experience, want_to_continue, favorite_part, one_thing_to_change)
  on public.playtest_responses to anon;
create policy playtest_insert on public.playtest_responses for insert to anon with check (true);

-- A JSON array avoids PostgREST's row limit silently truncating dashboard totals.
-- This is the only public read entry point; no table SELECT grant or policy.
create function public.playtest_results(admin_password text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  verifier text;
begin
  select password_hash into verifier from playtest_private.admin_verifier where singleton;
  if verifier is null or admin_password is null
     or octet_length(admin_password) not between 1 and 72 then
    raise exception using errcode = 'P0001', message = 'Access denied';
  end if;
  if extensions.crypt(admin_password, verifier) is distinct from verifier then
    raise exception using errcode = 'P0001', message = 'Access denied';
  end if;
  return (select coalesce(jsonb_agg(to_jsonb(r) - 'session_id' - 'id'
    order by r.created_at desc, r.id), '[]'::jsonb) from public.playtest_responses r);
end;
$$;
revoke all on function public.playtest_results(text) from public, anon, authenticated;
grant execute on function public.playtest_results(text) to anon;
commit;
