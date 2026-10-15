---
name: dev
description: Start Pocket Mint's frontend dev server. Use when the user asks to run, start, or launch the app locally, or wants to test a change end to end.
disable-model-invocation: true
---

Start the frontend for local development:

```
npm run dev
```

This runs Next.js on **port 4000** (not the default 3000).

The backend is a separate repository (`pocket-mint-be`), not part of this
repo — start it independently if the task needs a live API. Point
`NEXT_PUBLIC_API_URL` (`.env`) at wherever that backend is running.

If `npm install` hasn't been run yet, run it first.

Report the URL back to the user once ready: `http://localhost:4000`.
