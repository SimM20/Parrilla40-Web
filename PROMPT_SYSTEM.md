# PROMPT_SYSTEM.md

## Operating model

The implementation agent works through the stage prompts in `prompts/` in numeric order.

For every stage:

`READ → INSPECT → PLAN → IMPLEMENT → RUN → TEST → FIX → VERIFY → CONTINUE`

Keep planning proportional to the task.

Do not produce large planning documents before small implementation changes.

Execution and verification are the priority.

## Skills

At project start, check whether these skills are available. If not, attempt to install them:

```bash
npx skills add https://github.com/Leonxlnx/taste-skill --skill gpt-taste
npx skills add https://github.com/Leonxlnx/taste-skill --skill redesign-existing-projects
npx skills add https://github.com/Leonxlnx/taste-skill --skill full-output-enforcement
npx skills add https://github.com/Leonxlnx/taste-skill --skill high-end-visual-design
npx skills add https://github.com/Leonxlnx/taste-skill --skill image-to-code
```

If a skill is already installed, do not reinstall it repeatedly.

If the installer reports it already exists, continue.

If a skill cannot be installed because of an external environment limitation, note it and continue with the repository work unless that skill is genuinely required to complete the stage.

### gpt-taste

Use as a general visual-quality guardrail.

Its role is to prevent generic, low-intent interface work.

It must not override the existing Parrilla Rutera visual language.

### redesign-existing-projects

This is especially important here because the website already exists.

Use it to:

- audit before editing;
- preserve working structure;
- reuse visual patterns;
- improve only what the requested feature requires.

Do not replace the existing site with a new design.

### full-output-enforcement

Use it to prevent:

- incomplete files;
- placeholder code;
- truncated output;
- empty handlers;
- “rest of implementation here” comments;
- partially working flows presented as finished.

### high-end-visual-design

Use only after the new feature works end-to-end.

Its role is refinement:

- hierarchy;
- typography;
- spacing;
- composition;
- motion;
- detail quality.

It must not transform the website into a generic premium SaaS aesthetic.

### image-to-code

Use only if the repository contains screenshots, mockups, or visual references that are relevant to the page being implemented.

Analyze those references before implementing.

Do not invent a visual interpretation if a concrete reference exists.

## Technology

### Frontend stack

Locked:

- HTML
- CSS
- vanilla JavaScript

Do not introduce a frontend framework or build system unless the repository already uses one for unrelated reasons and the feature can integrate without changing the product stack.

### Runtime

Browser-native static frontend.

### Package manager

No package manager is required for the runtime product.

`npx` may be used to install coding-agent skills.

If the existing repository already has npm tooling, preserve it; do not expand it unnecessarily.

### Database/backend

Supabase.

Purpose:

- persist survey responses;
- enforce RLS;
- provide protected results retrieval/password validation.

### Supabase browser integration

Use the official Supabase JavaScript browser client if the repository does not already expose a compatible integration.

If adding it to a no-build static site, prefer the simplest maintainable approach consistent with the current repository, such as the official browser CDN build.

Do not add bundling just to import Supabase.

### Keys

Client-side:

- project URL;
- public/anon/publishable key.

Never client-side:

- `service_role`;
- database password;
- admin results password.

### Database security

Use:

- RLS for table access;
- CHECK constraints for structured response values;
- protected RPC/function for admin results.

The function must reject invalid passwords before returning result data.

### Hosting

Preserve the repository's existing hosting/deployment approach.

Do not migrate hosting as part of this task.

If hosting cannot be discovered, document exact static deployment requirements at ship time rather than selecting a new vendor.

## Testing strategy

Prefer existing repository tooling.

If no automated test tooling exists, use focused manual/browser verification rather than introducing a large framework.

Minimum verification:

- load index;
- CTA reaches survey;
- survey renders all 15 questions;
- keyboard navigation works;
- validation works;
- valid submission reaches Supabase;
- submission failure is recoverable;
- results URL has no public navigation path;
- wrong password returns no data;
- correct password returns results;
- no direct public table SELECT is possible;
- mobile layout works;
- browser console remains clean.

Where database migrations are created, verify them in a non-production Supabase environment first when available.

## Implementation strategy

### Phase 1 — Functional MVP

First make the full flow work:

`index → survey → validation → Supabase insert → success`

and:

`private URL → password gate → protected data retrieval → results`

### Phase 2 — Reliability

Then handle:

- network errors;
- invalid data;
- loading states;
- duplicate-click prevention;
- empty results;
- multiple build versions;
- safe failure behavior.

### Phase 3 — Visual integration

Then refine:

- visual parity with existing site;
- responsive layout;
- accessibility;
- subtle motion;
- admin result readability.

### Phase 4 — Security and QA

Verify:

- RLS;
- RPC permissions;
- no secret leakage;
- no public SELECT;
- no service key;
- no console errors;
- all required flows.

### Phase 5 — Ship

No new features.

Only:

- final regression fixes;
- production verification;
- deployment notes.

## Local verification

Before choosing commands, inspect the repo for its current local-development instructions.

Do not add a bundler.

If the project is plain static files and has no local server instructions, use a simple static server available in the environment rather than relying on `file://` for all testing.

The specific command is an implementation detail and should match the developer environment.

## Database change documentation

Keep database setup reproducible.

Preferred:

- SQL migration file(s) if the repo already tracks database migrations;
- otherwise a clearly named SQL setup file plus exact Supabase SQL Editor instructions.

Never put the plaintext admin password in migration files.

## Definition of complete

The V1 is complete only when:

- the existing site still works;
- the index is unchanged except for the intended survey CTA and minimal compatible styling;
- the 15-question survey works;
- responses persist in Supabase;
- results remain unreadable publicly;
- the private results route requires password validation;
- valid admins can view aggregate and qualitative results;
- desktop/mobile behavior is acceptable;
- accessibility baseline is met;
- no secret is committed;
- deployment steps are documented.
