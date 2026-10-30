-- Apply once after setup.sql, in the confirmed project. The legacy email table is optional.
-- Additive: historical rows and the password verifier are never changed.
-- Coordinate this with the static-site release: legacy forms can no longer write.
begin;

create table public.playtest_responses_v2 (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  session_id uuid not null unique,
  build_version text not null check (char_length(build_version) between 1 and 100
    and build_version = btrim(build_version) and build_version ~ '[^[:space:]]'),
  perceived_time_flow smallint not null check (perceived_time_flow between 1 and 5),
  post_session_feeling text not null check (post_session_feeling in
    ('another_night', 'retry_better', 'enough_for_now', 'prefer_stop', 'unsure')),
  memorable_moment text check (memorable_moment is null or
    (char_length(memorable_moment) between 1 and 1200 and memorable_moment ~ '[^[:space:]]'))
);
alter table public.playtest_responses_v2 enable row level security;
revoke all on public.playtest_responses_v2 from public, anon, authenticated;
-- No table policy or grant: only the narrow RPC can write and deduplicate safely.

create function public.submit_playtest_v2(
  p_session_id uuid, p_build_version text, p_perceived_time_flow integer,
  p_post_session_feeling text, p_memorable_moment text default null
)
returns void language plpgsql security definer set search_path = '' as $$
declare
  moment text := nullif(btrim(p_memorable_moment), '');
begin
  if char_length(p_memorable_moment) > 1200 or char_length(p_build_version) > 100 then
    raise exception using errcode = '22023', message = 'Invalid response';
  end if;
  insert into public.playtest_responses_v2
    (session_id, build_version, perceived_time_flow, post_session_feeling, memorable_moment)
    values (p_session_id, btrim(p_build_version), p_perceived_time_flow, p_post_session_feeling, moment)
    on conflict (session_id) do nothing;
  if not found and not exists (
    select 1 from public.playtest_responses_v2 r
    where r.session_id = p_session_id
      and r.build_version = btrim(p_build_version)
      and r.perceived_time_flow = p_perceived_time_flow
      and r.post_session_feeling = p_post_session_feeling
      and r.memorable_moment is not distinct from moment
  ) then
    raise exception using errcode = '23505', message = 'Submission already recorded';
  end if;
end;
$$;
revoke all on function public.submit_playtest_v2(uuid, text, integer, text, text)
  from public, anon, authenticated;
grant execute on function public.submit_playtest_v2(uuid, text, integer, text, text) to anon;

-- An explicit payload excludes session identifiers and any future internal columns.
create function public.playtest_results_v2(admin_password text)
returns jsonb language plpgsql security definer set search_path = '' as $$
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
  return (select coalesce(jsonb_agg(jsonb_build_object(
    'created_at', r.created_at, 'build_version', r.build_version,
    'perceived_time_flow', r.perceived_time_flow,
    'post_session_feeling', r.post_session_feeling,
    'memorable_moment', r.memorable_moment
  ) order by r.created_at desc, r.id), '[]'::jsonb) from public.playtest_responses_v2 r);
end;
$$;
revoke all on function public.playtest_results_v2(text) from public, anon, authenticated;
grant execute on function public.playtest_results_v2(text) to anon;

-- New consent evidence is not inferred from historical, potentially duplicated emails.
-- No session ID, answer ID or foreign key joins email addresses to survey responses.
create table public.launch_notice_consents (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  email text not null unique check (char_length(email) between 3 and 254
    and email = lower(btrim(email)) and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
  language text not null check (language in ('es', 'en')),
  consent_version text not null check (consent_version = 'steam-wishlist-v1'),
  consent boolean not null check (consent),
  withdrawal_token_hash text not null unique check (withdrawal_token_hash ~ '^[a-f0-9]{64}$')
);
alter table public.launch_notice_consents enable row level security;
revoke all on public.launch_notice_consents from public, anon, authenticated;

create function public.subscribe_launch_notice(
  p_email text, p_language text, p_consent_version text,
  p_consent boolean, p_withdrawal_token text
)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if p_consent is distinct from true
     or p_consent_version is distinct from 'steam-wishlist-v1'
     or p_withdrawal_token is null or p_withdrawal_token !~ '^[a-f0-9]{64}$'
     or char_length(p_email) > 254 then
    raise exception using errcode = '22023', message = 'Invalid consent';
  end if;
  insert into public.launch_notice_consents
    (email, language, consent_version, consent, withdrawal_token_hash)
    values (lower(btrim(p_email)), p_language, p_consent_version, true,
      encode(extensions.digest(p_withdrawal_token, 'sha256'), 'hex'))
    on conflict (email) do nothing;
  -- Uniform response prevents address enumeration. Do not rotate an existing token:
  -- knowing an email address must not let another person obtain deletion authority.
end;
$$;
revoke all on function public.subscribe_launch_notice(text, text, text, boolean, text)
  from public, anon, authenticated;
grant execute on function public.subscribe_launch_notice(text, text, text, boolean, text) to anon;

create function public.revoke_launch_notice(p_withdrawal_token text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if p_withdrawal_token is null or p_withdrawal_token !~ '^[a-f0-9]{64}$' then
    raise exception using errcode = '22023', message = 'Invalid withdrawal token';
  end if;
  delete from public.launch_notice_consents
    where withdrawal_token_hash = encode(extensions.digest(p_withdrawal_token, 'sha256'), 'hex');
  -- Identical result for unknown, already used and valid tokens. Never return emails.
end;
$$;
revoke all on function public.revoke_launch_notice(text) from public, anon, authenticated;
grant execute on function public.revoke_launch_notice(text) to anon;

-- Retire legacy writes, including the column grants used by the original setup.
-- Keep every historical row and the password-protected playtest_results RPC intact.
revoke all on public.playtest_responses from public, anon, authenticated;
revoke insert (id, created_at, session_id, build_version, completed_night_1, completed_night_2,
  highest_night, initial_understanding, controls_intuitiveness, cooking_understanding,
  heat_understanding, order_readability, difficulty_fairness, customer_pacing,
  learning_feeling, stress_experience, want_to_continue, favorite_part, one_thing_to_change)
  on public.playtest_responses from public, anon, authenticated;
do $migration$
begin
  if to_regclass('public.launch_notify_signups') is not null then
    execute 'revoke all on public.launch_notify_signups from public, anon, authenticated';
    execute 'revoke insert (id, created_at, email, language) on public.launch_notify_signups from public, anon, authenticated';
  end if;
end;
$migration$;
commit;
