# Parrilla Rutera — Playtest Survey Web

## Product definition

We are extending an existing static website for **Parrilla Rutera** with a focused playtest survey and a private results view.

The existing website is the product baseline. The implementation must preserve its current structure, logic, visual language, assets, and technology choices unless this document explicitly requires a change.

This project is **not** a website redesign.

## Why this exists

The survey exists to validate the player experience during the current Parrilla Rutera playtest, especially:

- whether players can complete Night 1 and Night 2;
- whether the game is understandable without excessive explanation;
- whether controls, cooking, charcoal/heat, and orders feel intuitive;
- whether difficulty feels fair;
- whether customer pacing creates enjoyable pressure;
- whether players feel they are learning;
- whether they want to continue playing;
- what they liked most;
- what single change they would prioritize.

The results view exists so the development team can review all survey submissions and aggregated metrics without exposing that data publicly.

## Audience

### Survey
Playtest participants who have just played Parrilla Rutera.

### Results
Internal development team only.

## V1 scope

V1 includes:

1. A single new button added to the existing `index` that sends players to the survey.
2. A survey on a separate HTML page/route.
3. A maximum of 15 questions.
4. Client-side validation and clear completion states.
5. Storage of each completed response in Supabase.
6. Automatic storage of response metadata:
   - submission timestamp;
   - anonymous session ID;
   - build version.
7. A separate private results page/route.
8. No visible link to the results page anywhere in the public website.
9. Password-gated access to survey results.
10. Results loaded from Supabase only after successful password validation.
11. No public read access to survey responses.
12. Visual integration with the existing website.
13. Responsive behavior appropriate for desktop and mobile.

## Locked technology decisions

The website remains:

- HTML
- CSS
- vanilla JavaScript

Do **not** migrate to:

- React
- Next.js
- Vue
- Svelte
- Angular
- TypeScript
- Vite
- another frontend framework or bundler

Supabase is the only new backend/data service expected for V1.

The Supabase browser client may be used from vanilla JavaScript.

Do not add a custom application server.

## Existing index protection

The existing index must not be redesigned or refactored.

The only intended product change to the index is:

- add one visually compatible CTA/button that navigates to the survey.

Default label if the existing copy does not suggest a better equivalent:

`Responder encuesta`

The agent must inspect the current index and reuse its existing button/CTA patterns.

## Public survey route

Preferred filename if the repository has no routing convention:

`preguntas.html`

If the repository already has a clear page naming/routing convention, follow that convention instead.

The survey must not be embedded into the index.

## Private results route

Preferred filename if the repository has no routing convention:

`resultados.html`

Rules:

- do not add a link to it from the index;
- do not add it to navigation;
- do not add it to footer links;
- do not add it to the survey completion screen;
- access is only possible by knowing the URL;
- knowing the URL alone must **not** expose survey data;
- the results data must require password validation before being returned.

The page shell itself may be statically reachable. The protected resource is the survey data.

## Admin password requirement

The user has defined a fixed password for the private results area.

**Do not commit the plaintext password into HTML, CSS, JavaScript, Markdown, or repository history.**

Implementation requirement:

- store only a secure password verifier/hash on the Supabase side;
- validate the entered password through a Supabase database function/RPC or equivalent Supabase-side mechanism;
- do not implement `if (password === "...")` in browser JavaScript;
- do not expose a `service_role` key to the browser;
- do not create a public SELECT policy on the responses table.

When provisioning the Supabase secret/hash, the deployment operator must set the agreed password out-of-band. If that value is not available to the implementing agent at deployment time, it is the only acceptable secret-related blocking question.

## Survey content

The V1 questionnaire contains exactly these 15 player-facing questions.

### Q1 — Night 1 completion

**¿Pudiste completar la primera noche?**

Options:
- Sí
- No

Stored field:
`completed_night_1`

### Q2 — Night 2 completion

**¿Pudiste completar la segunda noche?**

Options:
- Sí
- No
- No llegué a jugarla

Stored field:
`completed_night_2`

Recommended stored values:
- `yes`
- `no`
- `not_reached`

### Q3 — Highest night

**¿Hasta qué noche llegaste?**

Input:
- integer number

Validation:
- minimum 0
- no decimals
- reasonable upper bound may be configured from current build data if the repository exposes one;
- otherwise do not invent game progression limits: accept a non-negative integer.

Stored field:
`highest_night`

### Q4 — Initial understanding

**¿Qué tan fácil fue entender qué tenías que hacer al comenzar?**

Scale:
1 = Nada fácil
5 = Muy fácil

Stored field:
`initial_understanding`

### Q5 — Controls

**¿Qué tan intuitivos te parecieron los controles?**

Scale:
1 = Nada intuitivos
5 = Muy intuitivos

Stored field:
`controls_intuitiveness`

### Q6 — Cooking and flipping

**¿Qué tan fácil fue entender cómo cocinar y dar vuelta la carne?**

Scale:
1 = Nada fácil
5 = Muy fácil

Stored field:
`cooking_understanding`

### Q7 — Charcoal and heat

**¿Qué tan fácil fue entender el funcionamiento del carbón y las zonas de calor?**

Scale:
1 = Nada fácil
5 = Muy fácil

Stored field:
`heat_understanding`

### Q8 — Orders

**¿Qué tan fácil fue leer los pedidos y saber qué quería cada cliente?**

Scale:
1 = Nada fácil
5 = Muy fácil

Stored field:
`order_readability`

### Q9 — Fairness

**¿Qué tan justa te pareció la dificultad?**

Scale:
1 = Muy injusta
5 = Muy justa

Stored field:
`difficulty_fairness`

### Q10 — Customer arrival pace

**¿Cómo te pareció el ritmo de llegada de clientes?**

Options:
- Muy lento
- Lento
- Bien
- Rápido
- Muy rápido

Recommended stored values:
- `very_slow`
- `slow`
- `good`
- `fast`
- `very_fast`

Stored field:
`customer_pacing`

### Q11 — Learning

**¿Sentiste que mejorabas y entendías mejor el juego mientras jugabas?**

Scale:
1 = Para nada
5 = Muchísimo

Stored field:
`learning_feeling`

### Q12 — Stress experience

**¿El estrés de atender varios pedidos te resultó divertido o frustrante?**

Options:
- Muy divertido
- Más divertido que frustrante
- Mitad y mitad
- Más frustrante que divertido
- Muy frustrante

Recommended stored values:
- `very_fun`
- `mostly_fun`
- `balanced`
- `mostly_frustrating`
- `very_frustrating`

Stored field:
`stress_experience`

### Q13 — Desire to continue

**¿Te dieron ganas de jugar otra noche para intentar hacerlo mejor?**

Options:
- Sí
- Tal vez
- No

Recommended stored values:
- `yes`
- `maybe`
- `no`

Stored field:
`want_to_continue`

### Q14 — Favorite part

**¿Qué fue lo que más te gustó?**

Input:
- free text

Stored field:
`favorite_part`

### Q15 — One change

**Si pudieras cambiar una sola cosa del juego, ¿qué cambiarías?**

Input:
- free text

Stored field:
`one_thing_to_change`

## Form behavior

### Entry

The player enters from the new index button or by direct URL.

### Completion

The player answers the 15 questions and submits once.

Required behavior:

- required structured questions cannot be left blank;
- open-text answers may be required unless testing shows a strong reason not to; V1 preference is to require both because they are core qualitative signals;
- show field-level validation near the relevant question;
- do not wipe completed answers after a validation error;
- disable duplicate submit while a request is in flight;
- display a clear sending state;
- display a clear success state;
- display a recoverable error state if Supabase submission fails;
- do not claim success until the insert succeeds.

### After success

Show a simple thank-you state.

Do not link to the private results page.

## Anonymous session ID

Generate an anonymous UUID/session identifier in the browser for the submission.

Purpose:

- distinguish rows;
- support debugging;
- avoid collecting personal identity.

Do not ask for:

- name;
- email;
- phone;
- account;
- demographic profile

in V1.

## Build version

Every response must include `build_version`.

Implementation rule:

- use one clearly configurable value in JavaScript or the existing project configuration pattern;
- do not duplicate the build version string across multiple files;
- changing the tested build should require editing one place.

If the existing site already exposes a build/version value, reuse it.

## Supabase data model

Preferred table:

`playtest_responses`

Recommended columns:

| Column | Type | Rules |
|---|---|---|
| `id` | uuid | primary key, generated server-side |
| `created_at` | timestamptz | default `now()` |
| `session_id` | uuid or text | required |
| `build_version` | text | required |
| `completed_night_1` | boolean | required |
| `completed_night_2` | text | `yes`, `no`, `not_reached` |
| `highest_night` | integer | >= 0 |
| `initial_understanding` | smallint | 1..5 |
| `controls_intuitiveness` | smallint | 1..5 |
| `cooking_understanding` | smallint | 1..5 |
| `heat_understanding` | smallint | 1..5 |
| `order_readability` | smallint | 1..5 |
| `difficulty_fairness` | smallint | 1..5 |
| `customer_pacing` | text | allowed values only |
| `learning_feeling` | smallint | 1..5 |
| `stress_experience` | text | allowed values only |
| `want_to_continue` | text | allowed values only |
| `favorite_part` | text | required in V1 |
| `one_thing_to_change` | text | required in V1 |

Use database CHECK constraints for enumerated/ranged values where practical.

## Supabase security model

### Public survey

The browser uses only the Supabase public/anon/publishable client credentials.

Those credentials are expected to be visible in a static frontend and are **not** a substitute for RLS.

Requirements:

- enable RLS on `playtest_responses`;
- allow public/anon INSERT for valid rows;
- do not allow public/anon SELECT;
- do not allow public/anon UPDATE;
- do not allow public/anon DELETE.

### Results

The results page must not gain access by receiving a privileged Supabase key.

Use a protected Supabase-side function/RPC that:

1. receives the submitted admin password;
2. checks it against a server-side password verifier/hash;
3. rejects invalid passwords;
4. returns only the result data needed by the admin page after successful validation.

Security notes:

- use a secure hash/verifier mechanism available in Supabase/Postgres;
- keep the verifier inaccessible to the browser;
- a `SECURITY DEFINER` function must use a fixed safe `search_path`;
- grant only the minimum EXECUTE permission needed;
- never expose `service_role`;
- never add a public table SELECT policy as a shortcut.

This is a low-complexity internal dashboard, not a full account/authentication system.

## Results dashboard

After successful password validation, show:

### Summary

- total responses;
- Night 1 completion rate;
- Night 2 completion rate:
  - calculate clearly and label the denominator;
  - preferred: show completion among all respondents and, if useful, also among players who reached Night 2;
- average highest night reached;
- averages for each 1–5 rating question;
- distribution of customer pacing;
- distribution of stress experience;
- distribution of desire to continue.

### Qualitative responses

Show the text answers for:

- favorite part;
- one thing to change.

### Build visibility

Because `build_version` is stored, the dashboard should make build provenance visible.

V1 preferred behavior:

- show build version in each result;
- if multiple build versions exist, provide a simple build filter.

Do not add a complex analytics suite.

## Main user flows

### Flow A — Player survey

`Index CTA → Survey → Validate → Submit to Supabase → Success`

### Flow B — Direct survey

`Direct survey URL → Survey → Validate → Submit → Success`

### Flow C — Admin results

`Direct private URL → Password gate → Supabase validation → Results`

### Flow D — Invalid admin password

`Results URL → Password gate → Invalid password → No data returned → Retry`

### Flow E — Supabase unavailable

Survey:
- keep answers in the form;
- show submission failure;
- allow retry.

Results:
- show a clear load error;
- do not expose cached/private data accidentally;
- allow retry.

## Visual behavior

The new pages must feel like part of the existing Parrilla Rutera website.

The repository itself is the visual source of truth.

The implementation agent must inspect:

- current CSS;
- fonts;
- palette;
- spacing;
- buttons;
- containers;
- backgrounds;
- assets;
- pixel-art usage;
- breakpoints;
- hover/focus states;
- existing motion.

Do not invent a separate design system.

## Responsive requirements

The survey and password/results pages must work on:

- desktop;
- tablet;
- mobile.

Survey priorities on narrow screens:

- readable question text;
- large touch targets;
- no horizontal scrolling;
- rating controls remain understandable;
- text inputs remain usable;
- submit state remains visible.

The index must retain its existing responsive behavior.

## Accessibility baseline

V1 requirements:

- semantic form controls;
- associated labels;
- keyboard navigation;
- visible focus states;
- sufficient contrast using the existing visual language;
- validation not communicated by color alone;
- reduced-motion respect for non-essential motion;
- meaningful button text;
- native HTML whenever possible.

## Performance

Keep the feature lightweight.

Do not add a frontend framework, charting library, CSS framework, or heavy animation dependency for this feature.

The survey should be usable quickly on a normal mobile connection.

## Error handling

Do not expose raw database errors to end users.

Log useful development details to the console during development, but user-facing messages should be concise and safe.

## Non-goals / Out of Scope

Do not build in V1:

- user accounts;
- player login;
- email collection;
- social login;
- public survey analytics;
- public results;
- a CMS;
- a custom backend server;
- React/Next/Vue/Svelte/Angular migration;
- TypeScript migration;
- a design-system rewrite;
- an index redesign;
- changes to the game itself;
- gameplay telemetry integration;
- automatic game-to-survey deep linking;
- CAPTCHA unless later required by real abuse;
- complex role management;
- multiple admin accounts;
- export to Excel/CSV unless later requested;
- advanced charting libraries;
- notification/email systems;
- A/B testing;
- localization beyond the existing site behavior.

## Open Decisions

These do not block local implementation and should follow the existing repository where possible:

1. Exact final public filenames/routes if the repository already has a routing convention.
2. Existing hosting/deployment target if not discoverable in the repository.
3. Exact build-version value for the build being tested.
4. Exact Supabase project credentials and the out-of-band admin password verifier setup.

Do not reopen already locked product decisions.
