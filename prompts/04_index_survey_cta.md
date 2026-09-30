# Stage 04 — Index survey CTA

Read the root source-of-truth documents and inspect the current index again before editing it.

## Goal

Add exactly one clear entry point from the existing index to the survey with minimal change.

## Implement

1. Identify the best existing CTA/button pattern.
2. Add one button/link that goes to the survey route.
3. Use existing classes/styles when possible.
4. Default label: `Responder encuesta` unless an existing copy pattern suggests an equivalent wording that is clearer and consistent.
5. Preserve all existing index behavior and responsive layout.

## Do not

- redesign the index;
- rearrange sections;
- rewrite unrelated copy;
- change navigation architecture;
- add a link to the private results page;
- refactor unrelated CSS/JS.

## Acceptance criteria

- index has one survey CTA;
- CTA is visually consistent;
- CTA works;
- no other functional or visual index change is introduced;
- existing responsive behavior remains intact.

## Verify

Compare before/after in a browser.

Test the CTA and all existing index interactions touched by the changed markup.
