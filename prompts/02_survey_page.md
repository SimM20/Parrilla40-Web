# Stage 02 — Survey page

Read the root source-of-truth documents and inspect the current site before implementing.

## Goal

Build the complete 15-question survey UI as a separate static page while matching the existing website.

## Implement

1. Create the survey page using the repo's page-shell conventions.
2. Render exactly the 15 questions defined in `context.md`.
3. Use semantic HTML form controls.
4. Implement accessible 1–5 rating controls.
5. Implement the defined option groups.
6. Implement the highest-night numeric input.
7. Implement the two qualitative text responses.
8. Add:
   - inline validation containers;
   - submit control;
   - loading state;
   - error state;
   - success/thank-you state.
9. Add only the CSS required for this page, preferably reusing existing classes/tokens.

## Behavior in this stage

Form UI and client validation must work locally even before live Supabase submission is wired.

Preserve entered values after validation errors.

## Do not

- add questions;
- remove questions;
- redesign the index;
- add a multi-step wizard unless the existing site's interaction pattern clearly requires it;
- add a framework;
- create a generic external-form aesthetic.

## Acceptance criteria

- all 15 questions are present and correctly worded;
- required fields validate;
- rating labels communicate both ends of each scale;
- keyboard use is possible;
- mobile layout has no horizontal overflow;
- success/error/loading containers exist and are accessible;
- page visually belongs to the existing site.

## Verify

Open in a browser at desktop and mobile sizes.

Complete the form using only keyboard input at least once.

Check console for errors.
