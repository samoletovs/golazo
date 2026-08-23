## Golazo — Youth Football Development Platform

### Vision
Golazo helps young footballers develop physically, technically, and mentally — with AI coaching, gamification, and a community that grows with them. Started for a single Baltic youth player and expanding to Baltic teams. Full triangle: player + parent/mentor + coach. See `docs/VISION.md` for full strategy.

### Key Documents (READ BEFORE WORKING)
- `docs/VISION.md` — Product vision, mission, users, business model, strategy
- `docs/ROADMAP.md` — Phased feature roadmap (Phase 0-5)
- `docs/design-guidelines.md` — Design system, colors, typography, UX principles
- `docs/competitors.md` — Competitor analysis and gap assessment
- `docs/football-terminology.md` — FIFA/UEFA terminology rules
- `docs/youth-development.md` — UEFA youth development framework

### Environment
- Azure subscription: Visual Studio Enterprise
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

<!-- CANONICAL — maintained in samoletovs/nauroLabs-github at config/copilot-pr-guard.md.
     Rolled out by scripts/install-pr-guard.ps1. Edit it there, not in the copy. -->

## Before you open a pull request

Measured across 131 merged PRs in this lab: **15% were self-declared `[WIP]` or
no-ops**. Each one still cost a full 10–30 minute agent run, and agent runs are
the single largest line in the lab's CI bill — around 63% of the monthly
allowance. A PR that says it isn't finished is the most expensive possible way to
report that you couldn't finish.

So: do not open a pull request unless all three of these are true.

**1. You changed behaviour.**
A change that only adds comments, reformats code, or restates the issue is not a
fix. If you discover the work is already done, **say so in a comment on the issue
and stop** — do not open a PR titled `No-op: already implemented`. The comment is
the useful artifact; the PR is noise that a human then has to close.

**2. You finished.**
Never open a PR titled `[WIP]`, `[Draft]`, or `Partial`. If something blocks you,
comment on the issue with: what you were trying to do, what you tried, the exact
error or ambiguity that stopped you, and what decision you need from a human.
That comment is worth more than a half-finished branch and costs a fraction as
much to act on.

**3. You verified it, and you say how.**
The PR description must state what you ran and what it printed. "Should work" and
"this should fix the issue" are not verification.

- If the repo has tests, add one that **fails without your change**. A test that
  passes either way certifies the implementation, not the requirement.
- If the change is not testable, say plainly what you checked by hand.
- If you could not verify it, say that too, in the description, rather than
  leaving it implied.

**Write the description properly.** It is the only part of your work that reaches
a human on a phone screen, and the merge gate refuses PRs whose body is empty or
boilerplate. Say what was broken, what you changed, and how you know it works.
