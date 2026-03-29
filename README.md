# Golazo ⚽

A mobile-first gamified football development app for youth players. Track training sessions, log matches and tournaments, earn XP, level up through football-themed ranks, and improve with curated exercises from the world's best coaching methodologies.

**Live:** [golazo.naurolabs.com](https://golazo.naurolabs.com)

## Features

- 🎮 **Gamification** — XP, 50 levels, football ranks (Новичок → Про), streaks, achievements
- ⚽ **Training log** — Quick entry with emoji ratings, duration presets, focus areas
- 🏟️ **Match log** — Tap counters for goals/assists/shots, self-rating, post-match reflection
- 🏆 **Tournaments** — Group weekend games, tournament summary with W/D/L
- 📊 **Skill radar** — 6-category spider chart (Technical, Physical, Tactical, Mental, Match Play, Knowledge)
- 📚 **Exercise library** — 25+ drills from Coerver, Horst Wein, Dan Abrahams, UEFA
- 💬 **Wisdom quotes** — 16 quotes from Modrić, Messi, Iniesta, Xavi, De Bruyne in 4 languages
- 🌐 **Multi-language** — Russian (primary), Latvian, English, Spanish
- 📱 **Mobile-first** — Dark theme, bottom navigation, 44px touch targets
- 🎴 **FIFA-style player card** — Overall rating, per-category stats, season record

## Tech Stack

React 19 · TypeScript · Vite · Tailwind CSS 4 · Framer Motion · react-i18next · Recharts

## Development

```bash
npm install
npm run dev      # Start dev server
npm run build    # Type-check + build
npm run lint     # ESLint
npm test         # Vitest
npm run validate:football-terms  # UEFA/FIFA terminology guardrail
```

## UEFA/FIFA guardrails

- Canonical terminology reference: `docs/football-terminology.md`
- Youth development and duration guidance: `docs/youth-development.md`
- Current alignment report: `docs/fifa-uefa-alignment.md`
- CI enforces terminology compliance via `npm run validate:football-terms`

## Methodologies

Built on knowledge from 10 football development books:
- **Coerver Coaching** — Ball mastery, 1v1 moves
- **Horst Wein** — Game intelligence through mini-games
- **Dan Abrahams** — 4C mental model (Commitment, Concentration, Confidence, Control)
- **Daniel Coyle** — Deep practice, deliberate repetition
- **Carol Dweck** — Growth mindset (mistakes = learning XP)
- **UEFA** — Age-appropriate training for U12-U14

---

A [NauroLabs](https://naurolabs.com) experiment.
