# Devpost draft — ProofPath

## Tagline
Research with receipts: turn a pile of links into a visible evidence trail.

## Inspiration
Students often save sources but do not consistently track authorship, dates, methods, citations, and independent corroboration. That makes it harder to build arguments that another person can verify.

## What it does
ProofPath is a student research workspace. Users add sources, record the claim each one addresses, mark whether it supports, challenges, or adds context, and work through an eight-point evidence checklist. The Claim Map groups sources by claim and shows the evidence balance, so a student can see when they have only collected sources that agree with them. It then suggests concrete next steps. ProofPath also produces APA/MLA citations and a bibliography, keeps per-source notes, and imports and exports a portable JSON library. An optional research coach (any OpenAI-compatible model, with a deterministic local fallback) points out evidence gaps without ever judging whether a claim is true.

## How we built it
React + Vite frontend, dependency-free Node.js HTTP server for the optional coach, local browser storage, and Node's built-in test runner (15 tests, including a mocked AI provider). The AI prompt receives only normalized fields; unsafe links are stripped and AI output is length-bounded before display.

## Important limitation
ProofPath is a research-process aid, not a fact-checker or truth detector. Its completion indicator measures checklist coverage only.

## Before submitting
Replace this draft with verified details, screenshots, a public GitHub repository, a 6-minute-or-less working demo video, and accurate AI/tool disclosure. Do not claim optional AI was used unless configured and shown in the demo.
