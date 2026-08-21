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

## Status

**Active experiment.** Training and match logs, progression, challenges,
exercise content, multilingual UI, backend sync, and coaching foundations are
implemented. The broader agent-managed football data model is still being
evaluated.

## License

MIT
