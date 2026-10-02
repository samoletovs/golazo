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

### API runtime

The CommonJS Azure Functions API runs on **Node.js 22** in SWA; CI and deployment
must use Node 22 as well. Node 24 is also allowed for local development, but a
local Node 24 pass does not replace verification on the deployed Node 22 runtime.

The current Cosmos and Identity SDKs require Node 22 or newer. This is an SDK
engine requirement, not a claim that SWA no longer supports Node 20.
[Microsoft lists Node 22 for SWA-managed Functions 4 on Linux](https://learn.microsoft.com/azure/static-web-apps/languages-runtimes).

Restore the committed API lockfile and run the offline API checks separately
from the frontend:

```powershell
npm ci --prefix api --engine-strict
npm test --prefix api
```

The API's `.npmrc` makes incompatible dependency engines an error, not a warning.
Keep `api/package-lock.json` committed when updating dependencies. The Node test
suite loads the real SDKs, validates runtime/lockfile alignment, and checks
function registration and authentication without Cosmos, credentials or network
access. No API build or TypeScript compilation is required.

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

### Academy weekboard

The integrated **Academy A** design was accepted on 2026-09-23. It uses
cobalt blue, warm coral and neutral surfaces across Home, Log, Progress, Learn
and Profile, plus scheduling, settings, onboarding and coach/mentor workspaces.
The same system adapts to phone, tablet and desktop layouts.

See [the canonical brief](.impeccable.md),
[implementation and behavior boundaries](docs/academy-implementation.md), and
[source-bound verification evidence](docs/design-evidence/academy-20260923/).
Owner acceptance and technical checks are separate from full surface verification;
publication and deployment status are recorded with the release evidence.

Home integrates the football week and recorded activity. Log includes a
read-only journal; Progress distinguishes current skill snapshots from recorded
activity; Learn retains articles, programs and the exercise library. Local saves
are explicitly distinguished from server confirmation. Existing account and
managed-team permissions remain unchanged.

The [A/B academy comparison](docs/design-directions/academy-20260922/README.md)
and [earlier Clubhouse training slice](docs/training-clubhouse.md) remain
historical records. The former homepage-only release did not meet the whole-app
design goal and is not used as completion evidence for Academy.

**Active experiment.** Training and match logs, progression, challenges,
exercise content, multilingual UI, backend sync, and coaching foundations are
implemented. The broader agent-managed football data model is still being
evaluated.

## License

MIT
