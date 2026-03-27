# Golazo — Copilot Coding Agent Instructions

## Project

Golazo is a mobile-first gamified football development app for youth players. React 19 + TypeScript + Vite + Tailwind CSS 4. Dark theme with football pitch green accents.

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
