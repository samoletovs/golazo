# Golazo — Copilot Coding Agent Instructions

Feedback triage uses `gpt-6-luna` on the existing personal-agents Azure account,
with reasoning disabled and a 300-token output ceiling. Player progression and
coaching application behavior are unchanged by this retirement migration.

## Project

Golazo is a mobile-first gamified football development platform. The confirmed
design audience is players aged 10–14, with parents supporting. React 19 +
TypeScript + Vite + Tailwind CSS 4. Azure Functions API + Cosmos DB backend with
offline-first data sync.

Canonical design context: [`.impeccable.md`](.impeccable.md). It records the
confirmed audience, Football academy character, cobalt/coral palette, whole-app
scope and healthy-motivation principles. The owner rejected the first slice's
visual quality and incomplete application scope after PR #10. Current concepts
in `docs/design-directions/academy-20260922/` preserve the comparison. On
2026-09-23 the owner selected A, Academy weekboard, for full real-app
implementation. After reviewing the compiled real-app preview, the owner
accepted the integrated Academy result on 2026-09-23 at 18:19 +03:00 and asked
to finalize it. See the brief for the exact source and decision. Earlier
functional checks are not whole-app design acceptance or proof of complete
surface verification.

## Build & verify

```bash
npm install
npm run build    # MUST pass with zero errors
npm run lint     # MUST pass
npm test         # vitest
```

### API runtime and verification

- The API is CommonJS JavaScript, loaded through `src/functions/*.js`; it has no
  TypeScript build step.
- SWA `platform.apiRuntime`, CI and deployment must use Node 22. API engines also
  allow Node 24 locally; local results do not substitute for Node 22 CI proof.
- Cosmos and Identity SDK engine requirements drive this choice. Node 20 remains
  listed as supported by SWA but does not satisfy these SDKs.
- Restore with `npm ci --prefix api --engine-strict`, then run
  `npm test --prefix api`. Keep the API lockfile and strict-engine `.npmrc`.
- API tests use the real Azure SDKs with synthetic inputs and no external I/O.
  Preserve routes, Google/SWA authentication, function registrations and lazy
  Cosmos initialization when updating the runtime or dependencies.
- Backend-only changes use the existing changed-path design classification;
  do not rewrite historical design evidence or weaken design gates.

## Structure

```
src/
├── App.tsx                    # Main app — page routing + layout
├── main.tsx                   # Entry point + i18n init
├── index.css                  # Academy tokens, responsive shell and shared controls
├── academy/navigation.ts      # Typed role-aware navigation
├── engine/                    # Game logic (XP, skills, types)
│   ├── types.ts               # All TypeScript types/interfaces
│   ├── xp.ts                  # XP/level/streak calculations
│   └── skills.ts              # Skill tree logic, radar chart data
├── data/                      # Static data
│   ├── quotes.ts              # 16 player quotes in 4 languages
│   └── exercises.ts           # 25 curated drills with methodology tags
├── contexts/                  # React Context
│   ├── AppContext.tsx          # Global state + localStorage + API sync
│   └── AuthContext.tsx         # Google OAuth via SWA
├── components/                # Reusable UI components
│   ├── academy/               # Shared page, dialog, shell and tactical primitives
│   ├── QuoteCard.tsx           # Daily quote display
│   ├── SkillRadar.tsx          # SVG spider chart
│   ├── CoachCard.tsx           # AI Coach recommendation card
│   ├── VideoPlayer.tsx         # YouTube embed for exercises
│   └── FeedbackButton.tsx      # i18n feedback form
├── pages/                     # Page-level components
│   ├── Dashboard.tsx           # Academy weekboard, recorded season and practice
│   ├── LogPage.tsx             # Log selector (training/match/diary/tournament)
│   ├── TrainingLog.tsx         # Training entry form
│   ├── MatchLog.tsx            # Match entry form with tap counters
│   ├── ProgressPage.tsx        # Charts: XP, matches, training, skills, physical
│   ├── Exercises.tsx           # Exercise library with video embed
│   ├── Challenges.tsx          # Daily/weekly/special challenges
│   ├── Profile.tsx             # Academy identity, teams, goals and physical history
│   ├── SettingsPage.tsx        # Language, theme, role and account controls
│   ├── LeaderboardPage.tsx     # Friend leaderboard with invite codes
│   ├── SchedulePage.tsx        # Calendar of upcoming events
│   ├── LoginPage.tsx           # Google OAuth entry
│   └── OnboardingPage.tsx      # 6-step profile setup
└── i18n/                      # Internationalization
    ├── index.ts                # i18next config
    ├── ru.json                 # Russian (primary)
    ├── lv.json                 # Latvian
    ├── en.json                 # English
    └── es.json                 # Spanish
api/
├── host.json                  # Azure Functions config
├── package.json               # API dependencies
├── package-lock.json          # Reproducible API dependency tree
├── .npmrc                     # Reject incompatible Node engines
├── test/                      # Offline Node runtime and API regression tests
└── src/
    ├── cosmos.js               # Cosmos DB client + auth helpers
    └── functions/
        ├── sync.js             # GET/PUT full state sync
        ├── profile.js          # GET/PUT user profile
        ├── invite.js           # POST create/accept invite codes
        ├── leaderboard.js      # GET friend leaderboard
        └── coach.js            # POST AI coaching (Azure OpenAI)
```

## Conventions

- TypeScript strict mode, no `any`
- Functional components with hooks
- Named exports (except App default)
- Tailwind CSS 4 + CSS custom properties for design tokens
- Mobile-first: 375px primary breakpoint
- i18n: all user-facing strings via react-i18next
- State: React Context + localStorage with offline-first API synchronization; a local save is not server confirmation
- Touch targets: minimum 44px
- Accessibility: aria-labels on all interactive elements

## Design System

Use [the canonical design brief](.impeccable.md), not the historical conflicting
light/dark or commercial-game recipes previously recorded here.
The current task is the complete A implementation across `.design-scope.json`.
Do not reduce it to one feature or silently leave routes/roles on a legacy shell.
Preserve backend/auth/data schemas and behavior. The integrated direction is
accepted; finalization must complete independent review and source-bound surface
verification before opening a ready PR. Use the normal checked merge and
deployment process; do not bypass a failing gate or treat owner acceptance as
certification of untested behavior.
Preserve the conventions above when implementing production UI; the standalone
synthetic concepts are explicitly outside the production React/i18n pipeline.

## Deploy

Azure Static Web App via CI/CD (git push to the default `master` branch).

Successful Dependabot/Copilot merge-workflow completions also trigger a trusted
delivery handoff, since `GITHUB_TOKEN` merges suppress ordinary push and PR-close
events. Only confirmed same-repository default-branch merges qualify. Quality
checks and deployment use the same current default SHA, checked again before
upload; then the confirmed PR preview is closed. No unmerged branch or PR artifact
is executed by the handoff.

Ordinary manual CI dispatch remains validation-only. A default-branch dispatch
with `delivery_pr` explicitly retries an already merged PR through the same gates.
The helper `scripts/merged-pr-delivery.py` and
`tests/test_merged_pr_delivery.py` are shared governance copies.
