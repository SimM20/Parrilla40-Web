# Stage 00 — Repository audit and guardrails

Before implementing this stage, read the four root source-of-truth documents, then inspect the current repository.

## Goal

Understand the existing site before changing it and prepare the implementation environment without changing product behavior.

## Do

1. Inspect:
   - repository tree;
   - index HTML;
   - CSS files;
   - JavaScript files;
   - assets;
   - any current Supabase usage;
   - deployment/config files;
   - existing local-run instructions.
2. Identify:
   - visual/button patterns suitable for the survey CTA;
   - page-shell patterns reusable by `preguntas` and `resultados`;
   - existing breakpoints;
   - any configuration pattern;
   - whether Supabase client is already present.
3. Check/install the five Taste skills defined in `PROMPT_SYSTEM.md`.
4. Confirm there are no existing survey/results implementations that should be reused.
5. Establish the smallest file plan consistent with the existing repo.

## Do not

- change the index yet;
- redesign anything;
- migrate stack;
- add product dependencies;
- create placeholder pages and call the stage done.

## Acceptance criteria

- repository architecture is understood;
- existing visual patterns to reuse are identified;
- skills were checked/attempted;
- implementation can proceed without guessing the site structure;
- no unrelated files were modified.

## Verify

Run the site using its existing local workflow and confirm the pre-change site still works.
