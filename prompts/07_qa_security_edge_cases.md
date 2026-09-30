# Stage 07 — QA, security, and edge cases

Read the root source-of-truth documents and treat this stage as a release gate.

## Goal

Find and fix functional, security, and UX failures before shipping.

## Functional QA

Verify:

- index CTA;
- direct survey URL;
- all 15 questions;
- every option value mapping;
- rating min/max labels;
- numeric highest-night validation;
- open-text handling;
- valid submission;
- invalid submission;
- failed submission and retry;
- repeated submit clicks;
- success state;
- direct results URL;
- invalid password;
- valid password;
- empty results;
- populated results;
- multi-build filter;
- qualitative text rendering.

## Security QA

Verify:

- no plaintext admin password exists in repo;
- no `service_role` key exists in frontend or repo;
- no public SELECT policy exists;
- public cannot UPDATE/DELETE responses;
- invalid password returns no private rows;
- results function uses safe permissions;
- `SECURITY DEFINER` function has a fixed safe `search_path`;
- user-provided free text is rendered safely as text, not injected as HTML;
- database constraints reject malformed structured values.

## Privacy QA

Verify that the app does not collect or store identity fields beyond the defined anonymous metadata.

## UX edge cases

Test:

- very long qualitative responses;
- slow connection;
- Supabase unavailable;
- refresh on survey before submit;
- refresh on results;
- zero results;
- one result;
- many responses;
- unexpected build-version strings.

Use sensible text-length limits only if needed to protect usability/storage, and document them if added. Do not silently truncate.

## Regression QA

Verify existing index functionality and styling.

Review browser console and network panel.

## Acceptance criteria

All critical issues found in this stage are fixed.

No known security shortcut remains.

No feature outside V1 is added.
