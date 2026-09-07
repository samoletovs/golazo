# golazo

golazo is a mobile-first football-development app for logging training and
matches, following curated exercises, and visualizing progress.

## Research question

golazo tests the NauroLabs question **"What's worth selling?"** It asks whether
a player-first data model and agent-maintained development experience can
become useful football infrastructure in a market where that data source does
not yet exist.

## What it does

- Records training sessions, matches, tournaments, and player reflections.
- Turns activity into XP, levels, streaks, achievements, and skill trends.
- Provides a multilingual exercise library and age-aware football guidance.
- Syncs user data through Azure Functions and supports AI coaching.

## Stack

- React 19, TypeScript, Vite, and Tailwind CSS
- Framer Motion, react-i18next, and Recharts
- Azure Functions, Cosmos DB, and Azure OpenAI
- Azure Static Web Apps

## Run locally

```powershell
npm install
Copy-Item api\local.settings.json.example api\local.settings.json
npm run dev
```

Before submitting a change:

```powershell
npm run lint
npm test
npm run validate:football-terms
npm run build
```

## Maintenance

`npm run maintain:dry` previews maintenance without writing data; it still reads
configured external sources. Returned task errors fail the command after independent
tasks finish. The scheduled workflow preserves the current-run report as an artifact
even on failure, and does not publish a maintenance PR when the pipeline fails.
Known exercise, video, discovery, team, and content outputs are preserved separately
for 14 days even if another task or report validation fails. Restore/review these
artifacts before rerunning; they are snapshots, not automatically approved changes.
If discoveries cannot be counted, the report retains all collected task errors and
adds a reporting error with an explicitly unknown count, rather than losing the report.

Video enrichment requires a valid `YOUTUBE_API_KEY`. Credential/quota failures stop
repeated requests, but every affected exercise remains listed in the report, including
newly generated candidates. Transport/5xx failures receive at most three attempts.
Generated exercise files are maintenance candidates, not yet part of the app's
curated exercise export.

Translation coverage and missing club colors remain real data-quality errors; do not
lower the coverage threshold or invent colors to make maintenance green. Notifications
capture the report before PR creation restores the checkout, and validate its run ID,
attempt, and source SHA. No prior report is treated as evidence of a successful run.

Offline regression tests (no credentials, network calls, or fixture files needed):

```powershell
npm test -- tests/maintenance.test.ts tests/exercises.test.ts
```

## Status

**Active experiment.** Training and match logs, progression, challenges,
exercise content, multilingual UI, backend sync, and coaching foundations are
implemented. The broader agent-managed football data model is still being
evaluated.

## License

MIT
