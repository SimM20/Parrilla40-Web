# Stage 05 — Private results page

Read the root source-of-truth documents and inspect the Stage 01 Supabase security implementation before coding.

## Goal

Create the unlinked password-gated results page and display useful survey results only after server-side password validation.

## Implement

1. Create the separate results page using the existing site's visual language.
2. Do not link it from any public page.
3. Initial state:
   - explanation;
   - password input;
   - submit button;
   - loading/error feedback.
4. On password submit:
   - call the protected Supabase-side validation/results function;
   - do not compare against a browser hardcoded password.
5. Wrong password:
   - show a generic invalid-password message;
   - render no survey data.
6. Correct password:
   - show results.
7. Results must include:
   - total responses;
   - Night 1 completion rate;
   - Night 2 completion rate with denominator clearly labeled;
   - average highest night;
   - averages for all 1–5 questions;
   - customer-pacing distribution;
   - stress-experience distribution;
   - desire-to-continue distribution;
   - qualitative responses for favorite part;
   - qualitative responses for one thing to change;
   - build version visibility.
8. If multiple build versions exist, add a simple build filter.
9. Handle zero responses cleanly.
10. Handle Supabase failure cleanly.

## Visualization

Use lightweight HTML/CSS.

Do not add a charting library.

## Session behavior

It is acceptable for the results page to keep the validated dataset in memory for the current page session.

Do not persist the plaintext admin password in localStorage/sessionStorage.

If a reload requires entering the password again, that is acceptable for V1.

## Do not

- add public navigation to this page;
- expose privileged keys;
- enable direct public SELECT;
- store the password in browser source;
- turn the page into a generic SaaS dashboard.

## Acceptance criteria

- direct URL loads only the password gate;
- no data is available before successful server-side validation;
- wrong password reveals no responses;
- valid password shows all required results;
- multiple builds can be distinguished;
- qualitative responses are readable;
- empty/error states work;
- no secret is stored client-side.

## Verify

Test:
- direct URL;
- wrong password;
- correct password;
- empty dataset;
- populated dataset;
- multiple build versions;
- network failure;
- browser console;
- network panel for accidental secret leakage.
