# Stage 06 — Visual integration, responsive behavior, accessibility

Read the root source-of-truth documents and inspect all implemented pages in a real browser.

## Goal

Polish the working feature without changing product scope.

## Apply the Taste skills

Use:
- `gpt-taste`;
- `redesign-existing-projects`;
- `high-end-visual-design`;

and `image-to-code` only if concrete visual references exist in the repo.

## Survey

Refine:

- question hierarchy;
- selected states;
- rating readability;
- text-area usability;
- validation presentation;
- submit/loading/success/error states;
- mobile spacing.

## Results

Refine:

- metric hierarchy;
- distribution readability;
- qualitative-response scanning;
- build filter;
- password gate;
- empty/loading/error states.

## Accessibility

Verify and fix:

- label associations;
- keyboard navigation;
- focus-visible styles;
- contrast;
- non-color-only states;
- semantic buttons/inputs;
- reduced motion;
- browser zoom resilience;
- touch target sizing.

## Responsive

Test at several widths from small mobile to desktop.

Do not alter the existing index beyond correcting a regression caused by the new CTA.

## Do not

- add decorative features;
- add new art unless required;
- add new libraries;
- change questionnaire content;
- change database behavior.

## Acceptance criteria

- new pages visually belong to the site;
- no horizontal scrolling on target mobile widths;
- all controls are usable by keyboard;
- focus is clearly visible;
- no essential state relies on color alone;
- the index remains visually stable;
- motion respects reduced-motion preference.

## Verify

Use browser screenshots where useful.

Check at minimum:
- narrow mobile;
- typical mobile;
- tablet-ish width;
- desktop.

Fix issues before continuing.
