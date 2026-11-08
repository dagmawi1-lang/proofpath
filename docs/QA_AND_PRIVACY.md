# Testing and privacy

## Automated checks
- Node built-in unit tests cover local coach behavior, eight-point scoring, URL protocol validation, input normalization, and API request validation.
- The API integration test starts the local server and checks unsupported content type, malformed JSON, and a successful local fallback response.
- `node --check server/index.js` and `node --check server/review.js` pass.

## Data boundaries
- Research entries are stored in browser localStorage and exported as JSON.
- No account system, remote database, or cross-device sync is included.
- The optional coach API receives only the selected source metadata and claim. Do not submit private research notes, personal information, or confidential school material.
- API keys remain server-side in `.env`; never add `.env` to version control.
- The checklist measures process completeness, not whether a claim is true or a publisher is trustworthy.

## Manual test checklist
- Fresh `npm install` and Vite production build.
- Browser test on desktop and mobile sizes.
- Screen-reader and keyboard review.
- AI coach behavior with a configured provider key.
