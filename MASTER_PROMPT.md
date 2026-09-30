# MASTER PROMPT — Autonomous V1 Implementation

Implement the Parrilla Rutera playtest survey V1 in this repository.

Before changing code, read:

- `context.md`
- `AGENTS.md`
- `PROMPT_SYSTEM.md`
- `ASSETS_AND_ART_DIRECTION.md`

Then inspect the current repository and execute every file in `prompts/` in numeric order.

Rules:

- Treat each stage prompt as mandatory unless its required behavior is already fully implemented and verified.
- Do not skip verification because code “looks correct”.
- Keep the project functional between stages where possible.
- Fix errors and regressions before continuing.
- Do not ask for approval on minor implementation decisions.
- Only stop for a truly blocking external dependency or secret that cannot be derived from the repo, such as missing Supabase project access or the secure admin password verifier setup.
- Never commit the plaintext admin password or a Supabase `service_role` key.
- Do not redesign the index or migrate the stack.
- Do not add features outside `context.md`.

After the final stage, report:

1. what was implemented;
2. files changed/created;
3. Supabase/database setup performed;
4. any external configuration still required;
5. tests/verifications run and their results;
6. exact local run instructions;
7. exact deployment steps for the repository's existing hosting model.

Do not stop after scaffolding. Finish the V1.
