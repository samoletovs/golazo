# Golazo — Copilot Coding Agent Instructions

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
implementation. This is not final integrated visual acceptance or release
permission; earlier functional checks are not whole-app design acceptance.

## Build & verify

```bash
npm install
npm run build    # MUST pass with zero errors
npm run lint     # MUST pass
npm test         # vitest
```

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
Preserve backend/auth/data schemas and behavior. Stop at a verified, pushed held
candidate: the parent owns independent reviews, integrated owner acceptance,
PR and release. Do not open a PR, merge or deploy from this session.
Preserve the conventions above when implementing production UI; the standalone
synthetic concepts are explicitly outside the production React/i18n pipeline.

## Deploy

Azure Static Web App via CI/CD (git push to main).
