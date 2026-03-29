## Golazo — Youth Football Development Platform

### Vision
Golazo helps young footballers develop physically, technically, and mentally — with AI coaching, gamification, and a community that grows with them. Started for one player at Rīgas Futbola Skola, expanding to Baltic teams. Full triangle: player + parent/mentor + coach. See `docs/VISION.md` for full strategy.

### Key Documents (READ BEFORE WORKING)
- `docs/VISION.md` — Product vision, mission, users, business model, strategy
- `docs/ROADMAP.md` — Phased feature roadmap (Phase 0-5)
- `docs/design-guidelines.md` — Design system, colors, typography, UX principles
- `docs/competitors.md` — Competitor analysis and gap assessment
- `docs/football-terminology.md` — FIFA/UEFA terminology rules
- `docs/youth-development.md` — UEFA youth development framework

### Environment
- Azure subscription: Visual Studio Enterprise (146099412+samoletovs@users.noreply.github.com)
- Azure region: northeurope
- GitHub: samoletovs/golazo (private)

### Tech Stack
- React 19 + TypeScript + Vite + Tailwind CSS 4
- Azure Static Web Apps for hosting
- Azure Functions API + Cosmos DB backend
- i18n: react-i18next (EN primary, LV/RU/LT/ET/ES available)
- Auth: Google OAuth via Azure SWA
- AI: Azure OpenAI (coach recommendations)

### Practices
- TypeScript strict mode, no `any`
- Functional components with hooks
- Mobile-first design (375px primary breakpoint)
- Touch targets: minimum 44px
- English as primary language; i18n infrastructure for 6 languages
- State: React Context + localStorage + API sync (offline-first)
- Commit frequently with clear messages
- Push to `master` branch on GitHub
- Follow FIFA/UEFA terminology (see `docs/football-terminology.md`)
- Age-adaptive: content/UX filters by player's age category (U8-U10, U10-U12, U12-U16, U16+)

### Design Direction
- **Nike/Adidas clean premium aesthetic** — NOT dark gaming theme
- Light/neutral base with pitch green (#10B981) accents
- Inter font family, professional sports typography
- Data-rich but not cluttered — breathing space
- A 12-year-old should feel like they're using a pro athlete's app
- See `docs/design-guidelines.md` for full spec

### Core Feature Priorities (Current Phase)
1. UX polish — fix flows, reduce taps, improve navigation
2. Daily engagement — check-in + challenge + quiz morning routine
3. Content — articles, quizzes, player stories, structured programs
4. Mental wellbeing — mood tracking, AI analysis, parent alerts
5. Team/social features (later phase)

### Emoji Rating System
😴 😐 🙂 😄 🔥 (5-point scale for mood, energy, difficulty)

### Rank System
Beginner (bronze) → Amateur (silver) → Semi-Pro (gold) → Professional (diamond) → Legend (platinum)
