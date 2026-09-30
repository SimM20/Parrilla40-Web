# Stage 01 — Supabase data model and security

Read the root source-of-truth documents and inspect any existing Supabase/database setup before implementing.

## Goal

Create a reproducible Supabase schema and security model for survey submission and protected results retrieval.

## Implement

1. Create/extend the database setup for `playtest_responses` using the schema in `context.md`.
2. Add appropriate CHECK constraints.
3. Enable RLS.
4. Permit public/anon INSERT only.
5. Ensure public/anon cannot SELECT, UPDATE, or DELETE responses.
6. Implement a protected Supabase-side password validation/results retrieval mechanism.
7. Store only a secure password verifier/hash on the Supabase side.
8. Keep the plaintext admin password out of repository files.
9. Ensure any `SECURITY DEFINER` function has a fixed safe `search_path`.
10. Grant only the required EXECUTE permission.
11. Make the setup reproducible through the repository's existing migration approach or a clearly named SQL setup file.

## Results payload

The protected function must support the results page needs from `context.md`.

It may return raw rows for client-side aggregation if the dataset is expected to stay small, or return both aggregates and rows if that is simpler/safer.

Do not create unnecessary analytics infrastructure.

## Do not

- expose `service_role`;
- create public SELECT on the table;
- put the plaintext admin password in SQL/JS/Markdown;
- introduce Supabase Auth accounts unless required by an existing repository decision;
- build a custom server.

## Acceptance criteria

- valid anonymous insert is possible;
- anonymous select fails;
- invalid admin password returns no survey data;
- valid admin validation can retrieve the required result data;
- database constraints reject invalid structured values;
- no private key or plaintext admin password is committed.

## Verify

Test the policies/functions directly against a non-production Supabase project when access exists.

If project credentials are the only missing external dependency, leave exact setup instructions and continue with client code using the repository's safe public configuration pattern.
