# Golazo — Copilot Coding Agent Instructions

## Project

Golazo is a mobile-first gamified football development platform for players of all ages. React 19 + TypeScript + Vite + Tailwind CSS 4. Light theme with refined pitch green accents. Azure Functions API + Cosmos DB backend with offline-first data sync.

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
├── index.css                  # Design tokens + Tailwind + utility classes
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
│   ├── BottomNav.tsx           # Mobile bottom navigation (5 tabs)
│   ├── XpBar.tsx               # XP/level/streak header bar
│   ├── QuoteCard.tsx           # Daily quote display
│   ├── SkillRadar.tsx          # SVG spider chart
│   ├── CoachCard.tsx           # AI Coach recommendation card
│   ├── VideoPlayer.tsx         # YouTube embed for exercises
│   └── FeedbackButton.tsx      # i18n feedback form
├── pages/                     # Page-level components
│   ├── Dashboard.tsx           # Home — stats, quote, AI coach, radar
│   ├── LogPage.tsx             # Log selector (training/match/diary/tournament)
│   ├── TrainingLog.tsx         # Training entry form
│   ├── MatchLog.tsx            # Match entry form with tap counters
│   ├── ProgressPage.tsx        # Charts: XP, matches, training, skills, physical
│   ├── Exercises.tsx           # Exercise library with video embed
│   ├── Challenges.tsx          # Daily/weekly/special challenges
│   ├── Profile.tsx             # FIFA-style card + language selector
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
│   └── AppContext.tsx          # Global state + localStorage persistence
├── components/                # Reusable UI components
│   ├── BottomNav.tsx           # Mobile bottom navigation
│   ├── XpBar.tsx               # XP/level/streak header bar
│   ├── QuoteCard.tsx           # Daily quote display
│   └── SkillRadar.tsx          # SVG spider chart
├── pages/                     # Page-level components
│   ├── Dashboard.tsx           # Home — stats, quote, radar, matches
│   ├── LogPage.tsx             # Log selector (training/match/diary/tournament)
│   ├── TrainingLog.tsx         # Training entry form
│   ├── MatchLog.tsx            # Match entry form with tap counters
│   ├── Exercises.tsx           # Exercise library browser
│   ├── Challenges.tsx          # Daily/weekly/special challenges
│   └── Profile.tsx             # FIFA-style card + language selector
└── i18n/                      # Internationalization
    ├── index.ts                # i18next config
    ├── ru.json                 # Russian (primary)
    ├── lv.json                 # Latvian
    ├── en.json                 # English
    └── es.json                 # Spanish
```

## Conventions

- TypeScript strict mode, no `any`
- Functional components with hooks
- Named exports (except App default)
- Tailwind CSS 4 + CSS custom properties for design tokens
- Mobile-first: 375px primary breakpoint
- i18n: all user-facing strings via react-i18next
- State: React Context + localStorage (no backend yet)
- Touch targets: minimum 44px
- Accessibility: aria-labels on all interactive elements

## Design System

- Dark theme: `--color-pitch-black` (#0a0f0a) base
- Green accents: `--color-pitch-green-light` (#22c55e)
- Rank colors: bronze/silver/gold/diamond/platinum
- Cards: `--color-surface` with `--color-pitch-line` borders
- Emoji-based ratings (5-point scale)
- FIFA/EA FC aesthetic — energetic, not childish

## Deploy

Azure Static Web App via CI/CD (git push to main).
