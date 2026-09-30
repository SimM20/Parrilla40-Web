# Stage 03 — Survey submission and persistence

Read the root source-of-truth documents and inspect the survey implementation from Stage 02.

## Goal

Make the survey work end-to-end with Supabase persistence.

## Implement

1. Add the smallest maintainable Supabase browser-client integration.
2. Centralize:
   - Supabase project URL;
   - public/anon/publishable key;
   - tested build version.
3. Never include private keys.
4. Generate an anonymous UUID/session ID per submission session.
5. Map every survey answer to the database fields defined in `context.md`.
6. Validate before insert.
7. Prevent duplicate submit clicks while a request is in flight.
8. Only show success after Supabase confirms the insert.
9. On network/database failure:
   - keep the answers;
   - show safe error copy;
   - allow retry.
10. Do not expose raw database error text to players.

## Do not

- use `service_role`;
- weaken RLS to make submission easier;
- collect identity;
- clear the form before insert success;
- silently discard failed submissions.

## Acceptance criteria

- valid form creates one correct Supabase row;
- `created_at`, `session_id`, and `build_version` are present;
- structured values match allowed DB values;
- double-clicking submit does not create accidental concurrent submissions;
- failed insert leaves answers intact;
- retry can succeed;
- no secret is exposed.

## Verify

Test:
- valid submission;
- invalid/missing field;
- simulated/real network failure;
- repeated submit click;
- resulting database row.

Check browser console.
