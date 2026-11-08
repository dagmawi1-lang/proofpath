# Changelog

## 1.3.0 - 2026-11-07
- **Bug fix:** checking or unchecking a text-based checklist item (author, date, claim, link) used to write the text "true" or "false" into that field. Unchecking "Author" then left it permanently checked. These items now open the edit form instead. Yes/no and count items toggle correctly.
- **Edit sources** after adding them. Corroboration count, stance, and publish date are now in the form.
- **Stance:** each source is marked as supporting, challenging, or giving context for its claim.
- **Claim map view:** groups sources by claim, shows the support/challenge/context balance and average checklist completeness, and suggests next research steps (find an independent second source, look for a challenging source, finish the checklists).
- **Citations:** simplified APA 7 and MLA 9 citation for each source, with a copy button, plus a whole-library bibliography export.
- **Notes** field for each source (key quotes, page numbers).
- **Import** a previously exported library, with validation, normalization, and de-duplicated ids.
- The coach now calls `/api/coach` on the same origin (Vite proxies it to the coach server in development), with `VITE_API_URL` as an override. The URL was previously hard-coded to `http://localhost:8787`, which breaks when deployed.
- The coach result says whether it came from the AI provider or the local checklist.
- Responsive sidebar navigation, toasts, focus rings, labeled inputs, and delete confirmation.
- Tests: 7 → 15, including mocked AI-provider success, malformed-output, and error paths.

## 1.2.1 - 2026-11-04
- Added a static check for the React app's local review-module imports and Lucide icon exports.
- Added a consolidated `npm run check` verification command.

## 1.2.0
- Normalize and bound user-entered source fields before scoring or sending them to the optional coach API.
- Accept only HTTP and HTTPS source links in the checklist and UI.
- Harden the optional API with JSON content-type checks, malformed-body handling, request-size limits, timeouts, bounded AI output, and configurable local CORS origin.
- Handle malformed browser storage more safely and preserve stable source IDs.
- Add source-normalization, unsafe-link, and API integration tests.

## 1.1.0
- Improved project documentation and package scripts.

## 1.0.0
- Initial release: research library, eight-point evidence checklist, local coach, and JSON export.
