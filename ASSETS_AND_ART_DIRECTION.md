# ASSETS_AND_ART_DIRECTION.md

## Core rule

This feature must look like it belongs to the existing **Parrilla Rutera** website.

The repository is the primary visual reference.

Do not create a second visual identity.

## Audit before design

Before styling the survey or results pages, inspect:

- index layout;
- existing CSS architecture;
- font families and weights;
- color variables or repeated color values;
- button styles;
- borders;
- shadows;
- background treatments;
- pixel-art assets;
- decorative textures;
- spacing rhythm;
- content width;
- responsive breakpoints;
- hover states;
- focus states;
- animations/transitions;
- headers and footers;
- any existing form controls.

Document only the patterns needed for implementation. Do not create a new design system document unless the repo already has one.

## Visual personality

Inherit the existing Parrilla Rutera website personality.

The game identity is:

- Argentine roadside grill;
- pixel-art driven;
- playful but readable;
- warm, characterful, and game-oriented;
- not corporate;
- not sterile;
- not a generic analytics product.

The survey should feel like a continuation of the game/site experience, not like an external Google Form.

## Survey page

Priorities:

1. question readability;
2. low cognitive load;
3. clear progress through the form;
4. comfortable input sizes;
5. obvious selected states;
6. clear submit/loading/success/error feedback.

Do not let decoration compete with the questions.

### Rating controls

For 1–5 ratings:

- make every value an explicit selectable control;
- preserve native semantics where possible;
- ensure selected state is unmistakable;
- include the meaning of both ends of the scale;
- make touch targets large enough for mobile.

### Long text

Open text fields should feel integrated with the site while remaining easy to type into.

Avoid tiny fixed-height boxes.

## Results page

The results view is internal, but it should still belong visually to the site.

Priorities:

- quick reading;
- strong information hierarchy;
- legible summary metrics;
- easy scanning of distributions;
- readable qualitative answers.

Do not turn it into a generic SaaS admin dashboard.

Simple cards/sections may be used only if they match the existing site's visual language.

Avoid adding a charting library. CSS/HTML bars or simple textual distributions are sufficient.

## Password gate

Keep it focused:

- short explanation;
- one password field;
- one submit button;
- visible loading/error state.

Do not reveal whether the password is “almost” correct or provide unnecessary security details.

## Palette

Do not invent a new palette.

Reuse colors from the existing site.

If the repo has CSS custom properties, use them.

If not, reuse the existing repeated color values rather than introducing an unrelated palette.

## Typography

Use the existing website typography.

Do not import a new font solely for the survey/results feature unless the repository already intended to use it.

## Spacing and layout

Follow the existing page rhythm.

For the survey:

- use a readable content width;
- keep each question visually separable;
- avoid huge dead space;
- avoid dense walls of controls.

On mobile:

- single-column form;
- no horizontal scroll;
- comfortable vertical rhythm;
- full-width controls where appropriate.

## Borders, radii, shadows

Copy the existing visual grammar.

Do not automatically add:

- large modern SaaS radii;
- glass panels;
- floating frosted cards;
- neon glows;
- soft enterprise-dashboard shadows.

## Iconography

Prefer existing assets and icon conventions.

Do not introduce a new icon library for this feature unless the site already uses it.

Most survey actions should work with text labels alone.

## Motion and microinteractions

Keep motion subtle and purposeful.

Acceptable uses:

- selected control feedback;
- button press/hover;
- form error reveal;
- transition to success state;
- modest loading feedback.

Respect `prefers-reduced-motion`.

Do not add cinematic page transitions or decorative motion that slows completion.

## States

Design and implement:

- default;
- hover where relevant;
- focus-visible;
- selected;
- disabled;
- loading;
- validation error;
- network error;
- success;
- empty results;
- results loading;
- invalid admin password.

## Accessibility

Visual polish must not reduce usability.

Requirements:

- sufficient text/background contrast;
- focus must remain visible;
- selected states cannot rely only on subtle color shifts;
- error states require text/icon/structure, not color alone;
- touch targets should be comfortably sized;
- text must remain readable at browser zoom;
- no essential information only in animation.

## Responsive

Use the site's existing breakpoints when possible.

The new pages must work on small phones through desktop.

Do not change existing index responsive behavior.

## Asset strategy

Priority order:

1. existing project assets;
2. original assets already associated with Parrilla Rutera;
3. existing licensed libraries already in the repo;
4. new external assets only if truly necessary and with clear licensing;
5. generated assets only if they fit the established art direction;
6. placeholders only during implementation, never in the shipped V1.

For any new external asset:

- verify license;
- save locally;
- do not hotlink;
- preserve attribution/source information if required.

This feature should not need significant new art.

## What this must NOT look like

Do not make the survey or results page look like:

- Google Forms;
- Typeform clone;
- generic Bootstrap;
- generic Tailwind landing page;
- premium SaaS dashboard;
- finance dashboard;
- cyberpunk UI;
- glassmorphism demo;
- random-gradient AI-generated UI;
- giant rounded cards everywhere;
- a visually unrelated microsite;
- an over-designed form that hides the actual questions.

The goal is **Parrilla Rutera first, survey second**.
