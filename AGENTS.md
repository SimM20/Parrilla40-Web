# AGENTS.md

Permanent rules for any coding agent working in this repository.

## Source of truth

Use this hierarchy:

1. `context.md` — product behavior, scope, data, flows, security requirements.
2. `AGENTS.md` — permanent implementation rules.
3. Existing repository code — current working behavior when it does not conflict with the two files above.
4. Current stage prompt in `prompts/` — task-specific scope.
5. `ASSETS_AND_ART_DIRECTION.md` — visual direction.
6. `PROMPT_SYSTEM.md` — workflow, tools, technology, verification.

When sources conflict, follow the higher source and make the smallest compatible change.

## Scope protection

Do not invent features.

Do not add “future-proof” systems that V1 does not need.

Do not convert this static site into an application framework.

Do not introduce React, Next.js, Vue, Svelte, Angular, TypeScript, Vite, a CSS framework, a charting framework, or a custom backend server.

Do not redesign the existing index.

The index may only receive the required survey CTA plus the minimum supporting markup/style necessary to make that CTA fit the existing page.

## Existing project protection

Before changing anything:

- inspect the repository structure;
- inspect the current `index`;
- inspect existing CSS and JavaScript;
- identify reusable patterns;
- identify current deployment assumptions.

Do not:

- rebuild working pages from scratch;
- delete valid code or assets;
- replace working systems because of personal preference;
- rename large parts of the repository without a real requirement;
- reformat unrelated files.

Keep diffs narrow.

## Implementation rules

Prefer:

- semantic HTML;
- vanilla JavaScript;
- existing CSS patterns;
- small focused modules when the repo already supports them;
- clear names;
- centralized configuration for Supabase and build version;
- native browser APIs;
- minimal dependencies.

Avoid:

- overengineering;
- abstractions before they are needed;
- duplicated form definitions;
- duplicated option mappings;
- placeholder implementations;
- empty functions;
- TODOs as substitutes for working behavior;
- silent failures.

## Questionnaire integrity

V1 has exactly 15 questions as defined in `context.md`.

Do not:

- add demographic questions;
- add “nice to have” questions;
- split the questionnaire into more questions;
- rewrite the meaning of the questions.

Minor punctuation or microcopy changes are allowed only if they improve clarity without changing meaning.

## Supabase and security

Never commit:

- `service_role` keys;
- database passwords;
- plaintext admin results password;
- other private secrets.

The public/anon/publishable Supabase browser key may be used client-side because the app is static, but security must rely on RLS and protected database functions.

The responses table must never be publicly readable.

The results page must never receive a privileged Supabase key.

Password validation must not be implemented as a hardcoded browser-side equality check.

Any `SECURITY DEFINER` database function must:

- use a safe fixed `search_path`;
- expose only the minimum required result;
- be granted only to the required role.

Validate structured values in both client UI and database constraints where practical.

## Privacy

Do not add identity collection.

Do not add:

- name;
- email;
- phone;
- account ID;
- demographic profile.

Use anonymous session IDs.

## Visual changes

The existing site is the visual reference.

For any new visual work:

1. audit existing pages and CSS;
2. reuse their visual grammar;
3. implement;
4. open in a real browser;
5. inspect at desktop and mobile sizes;
6. correct visual regressions.

Do not consider “the HTML renders” sufficient.

Use screenshots during implementation when they materially help compare the new pages with the existing site.

## Testing

Do not mark a stage complete without testing it.

At minimum, test affected behavior for:

- valid survey submission;
- missing required answers;
- failed Supabase request;
- repeated submit click while sending;
- successful password validation;
- failed password validation;
- direct results-page access without authentication;
- no public results leakage;
- responsive layout;
- keyboard navigation;
- browser console errors.

If the repository already has automated testing, extend it appropriately.

If it does not, do not install a large testing stack just for this feature. Use the simplest reliable verification method.

## Autonomous decisions

Do not ask for approval for minor implementation details.

Choose sensible defaults for:

- spacing adjustments;
- internal helper names;
- file organization consistent with the repo;
- focus behavior;
- minor transitions;
- loading copy;
- safe error copy;
- small responsive refinements.

Only block when an external value is truly required, such as:

- actual Supabase project credentials;
- deployment access;
- the secure out-of-band admin password verifier setup if unavailable.

## Finish the job

A stage is not complete because:

- files were created;
- structure exists;
- the “foundation” is ready;
- a mockup exists.

A stage is complete only when its required behavior works and its acceptance criteria pass.

Fix regressions before moving to the next prompt.
