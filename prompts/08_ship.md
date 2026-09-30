# Stage 08 — Ship V1

Read the root source-of-truth documents. Do not add features in this stage.

## Goal

Perform final release verification and leave exact run/deployment instructions.

## Final checks

1. Run all existing automated tests if present.
2. Re-run the full manual flow:
   - index;
   - survey;
   - Supabase submission;
   - success;
   - private results URL;
   - invalid password;
   - valid password;
   - results.
3. Review browser console.
4. Review relevant network requests.
5. Search changed/new files for:
   - TODO;
   - FIXME;
   - placeholder;
   - mock data;
   - temporary logging;
   - hardcoded secrets.
6. Confirm:
   - no plaintext admin password;
   - no `service_role`;
   - no public SELECT;
   - correct build version;
   - correct Supabase project configuration;
   - all 15 questions;
   - responsive behavior;
   - accessibility baseline;
   - no index redesign/regression.
7. Verify production/static build behavior according to the existing repository.
8. Verify direct navigation to the new static pages works on the real hosting model.
9. Document exact deployment steps for the existing hosting target.
10. Document any one-time Supabase SQL/secret provisioning step still required.

## Database production safety

If applying database changes to production:

- confirm the target project before execution;
- do not overwrite existing unrelated policies/functions;
- use additive/minimal changes;
- verify RLS after deployment.

## Final output to the user

Report:

- implementation summary;
- changed/created files;
- database changes;
- configuration required;
- test/verification results;
- local run instructions;
- deployment instructions;
- any remaining external blocker.

Do not say the project is complete if a required V1 flow is unverified.
