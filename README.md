# ProofPath

**Research with receipts.** ProofPath is a research workspace for students. It helps you organize sources, connect each one to the claim it supports or challenges, and see the evidence trail behind an argument.

Built for the Education track of the [STEM2Connect AI Hackathon](https://stem2connect-online-hackathon.devpost.com/).

![Claim map: the support-vs-challenge balance for each claim, plus next research steps](docs/screenshot.jpg)

## My role & contributions

**Solo developer · AI-assisted**

- Designed the 8-point evidence checklist and the claim map
- Found and fixed a checklist bug where unchecking a box wrote "false" into the field

## The problem

Students often collect links without tracking who wrote them, when they were published, what methods they used, or whether independent sources agree. ProofPath turns those habits into a visible checklist.

## Features

- **Research library:** add, edit, search, and delete sources, each with a title, link, author, publisher, date, claim, and notes.
- **Eight-point evidence checklist** with a completeness ring for each source.
- **Stance:** mark each source as supporting, challenging, or giving context for its claim.
- **Claim map:** groups sources by claim, shows the support/challenge/context balance, and suggests next research steps.
- **Citations:** APA 7 and MLA 9 citations for each source, plus a bibliography export for the whole library.
- **Research coach:** checklist-based suggestions that work offline, with an optional AI coach when a provider key is configured on the server.
- **Import and export** the library as JSON.
- Only HTTP and HTTPS links are accepted, and all input is normalized and length-limited.

## Tech stack

React · Vite · CSS · Node.js (built-in HTTP server and test runner)

## Getting started

Requires Node.js 20.19+ or 22+.

```bash
npm install
npm run dev        # app on http://localhost:5173
npm run server     # coach API (second terminal)
```

To turn on the AI coach, copy `.env.example` to `.env` and set `AI_API_KEY` (plus `AI_BASE_URL` and `AI_MODEL` if you use a provider other than the default). Any OpenAI-compatible chat-completions endpoint works. The key stays on the server. Without a key, the local checklist coach is used.

To create a production build, run `npm run build`.

## Testing

```bash
npm run check   # import checks, server syntax checks, and the test suite
```

Tests cover checklist scoring, URL validation, input normalization, API request validation, and the AI-provider path against a mock server.

## Design notes

- **The checklist measures research process, not truth.** A source can pass every item and still be wrong, so ProofPath encourages reading original sources and finding independent confirmation.
- **Private by default.** The library lives in browser storage, with no account or remote database. The coach only receives the selected source's metadata and claim.

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) and [`docs/QA_AND_PRIVACY.md`](docs/QA_AND_PRIVACY.md).

## License

**Permission required.** © 2026 Dagmawi Melaku. You need my written permission before using, copying, or modifying this code, and any approved use must credit me with a link to this repository. Viewing, forking on GitHub, and running it to judge or review a submission are allowed without asking. To ask, [open an issue](../../issues/new). See [LICENSE](LICENSE) for the full terms.
