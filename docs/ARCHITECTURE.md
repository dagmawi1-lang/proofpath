# Architecture

- `src/App.jsx`: single-page research library and source review interface.
- `src/lib/review.js`: shared checklist and local coach logic.
- `server/index.js`: minimal optional AI API proxy; API keys stay server-side.
- `server/review.js`: local fallback coach logic.
- `tests/review.test.js`: core logic tests.
- Browser local storage persists the demo library; no account or cloud database.

## Request flow
The UI posts a selected source to `/api/coach`. The server returns deterministic local advice by default. If an API key is configured, it attempts a JSON response from the configured chat-completions endpoint and falls back locally if the provider is unavailable.
