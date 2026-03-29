# Golazo — Product Vision

> Last updated: 2026-03-30

## Origin Story

Golazo started as a personal tool for a father (mentor) to help his son — an U12 player at [Rīgas Futbola Skola](https://rigasfs.lv/) — organize training, track matches, build discipline, and stay mentally strong. When teammates saw it and wanted it too, organic demand validated the idea. Golazo is now evolving from a personal experiment into a platform for youth football players across the Baltics.

## NauroLabs Experiment

Golazo is part of the NauroLabs research lab. While it's a real product built for real players, it also tests a fundamental question: **what interface do young athletes prefer — an app or a conversational agent?**

The strategy is two-phase:

1. **App-first (now)** — Use the app to discover what works: which guidance scenarios engage players, what data structures capture meaningful progress, what flows drive daily habits. The app is our experimentation ground — we need to understand the value before we can deliver it through any other channel.

2. **Agent experiment (later)** — Once the app proves which flows, data, and coaching patterns matter, build a WhatsApp agent that delivers the same value conversationally. A player says "I just finished training" → the agent asks what they did → logs it → gives feedback → awards XP. All without opening an app.

The experiment: does the agent replace the app? Complement it? Or does the app survive as the visualization and reporting layer while the agent handles daily interaction? This directly tests NauroLabs' core question: *"Do we still need apps?"*

We don't know the answer yet — and that's the point. We build the app first because we don't yet know the scenarios, data structures, or guidance patterns well enough to script an agent. The app teaches us what to build the agent for.

This also tests a second NauroLabs question: *"Can a company run itself?"* — Golazo is designed to be agent-managed from the ground up. No manual administration. Agents collect, validate, and fix data. Agents monitor the product, analyze usage patterns, propose improvements, and implement them. The human role is strategic direction — everything else should be automated.

## Agent-Managed Platform

Golazo is not just an app with AI features — it's an **agent-managed product**. The goal: zero manual administration. Everything that can be automated, is automated. Agents run the platform.

### Data Agents
- **Collection**: Agents discover and scrape club data, tournament results, federation updates — no human curation
- **Enrichment**: Agents fetch logos, resolve aliases, fill missing fields, cross-reference sources
- **Validation**: Duplicate detection, error correction, staleness detection (outdated info, defunct clubs, wrong URLs)
- **Self-healing**: When data is wrong or missing, agents fix it — re-scrape, re-fetch, flag for review only if confidence is low

### Product Agents
- **Usage analysis**: Agents track which features players actually use, where they drop off, what flows feel broken
- **Trend research**: Agents monitor competitor apps, youth sports tech trends, football methodology updates — and propose feature improvements
- **Design improvements**: Agents identify UI/UX issues (accessibility gaps, responsive failures, slow interactions) and propose or implement fixes
- **Performance monitoring**: Agents watch API response times, bundle sizes, rendering performance — and optimize
- **Security scanning**: Agents audit dependencies, detect vulnerabilities, check auth flows — and patch

### Quality Agents
- **Content quality**: Agents review exercises, quizzes, articles for accuracy, age-appropriateness, and relevance
- **Translation quality**: Agents detect untranslated strings, inconsistent terminology, missing i18n keys
- **Test coverage**: Agents identify untested code paths, generate test cases, flag regressions

### The Principle
The human (Sam) sets the direction: what to build, for whom, and why. Agents handle everything else — data ops, quality assurance, monitoring, optimization, and routine improvements. If something needs daily attention, it should be an agent's job, not a human's.

This is gradual — we don't have all these agents today. But every manual process we build should be designed with the assumption that an agent will replace the human in that loop.

## Mission

**Help every young footballer develop — physically, technically, and mentally — with the support of AI, data, and a community that grows with them.**

## Core Insight

Youth football development is fragmented: training logs in notebooks, tournament results on random websites, mental wellbeing ignored, parent-coach communication scattered across WhatsApp groups. No single tool connects player → parent → coach with age-appropriate, data-driven guidance. Golazo consolidates everything into one place that adapts as the player grows.

## Target Users (Full Triangle)

### 1. Player (primary user)
- Age range: 8–19+ (U8 through Senior Youth, expandable to adult amateur/pro)
- Logs training sessions, matches, tournaments, personal diary
- Tracks XP, levels, streaks, achievements, skill radar
- Receives age-appropriate content: exercises, articles, quizzes, player stories
- Daily engagement loop: check-in + challenge + quiz
- Wants to feel professional — not childish

### 2. Parent / Mentor
- Monitors child's progress: physical development, mood trends, training consistency
- Receives AI-powered alerts if concerning mental health patterns detected
- Manages schedule, tournament logistics
- Does NOT need to be tech-savvy — simple dashboard view

### 3. Coach (future phase)
- Full team management: training plans, match calendar, tournament schedule
- Player evaluation dashboards per age group
- Communication with players and parents
- Training library with session planning

## Age-Adaptive Experience

The app adapts to the player's age category (calculated from birth date):
- **U8–U10 (Foundation)**: Simple UI, fun-first, basic logging, lots of gamification
- **U10–U12 (Development)**: Full logging, skill radar, exercises, daily challenges
- **U12–U16 (Youth)**: Physical testing, tactical content, mental health monitoring
- **U16–U19+ (Senior Youth)**: Advanced stats, competition prep, specialization content

Content, displayed teams, news, statistics, and tournament data are all **filtered by the player's age category**. As the player ages up, the app transitions automatically — new category, new relevant data.

## Key Differentiators

### 1. Mental Wellbeing as Core Feature
Not an afterthought. Daily mood/energy check-ins feed an AI coach that:
- Detects patterns (overtraining, burnout, low motivation, social issues)
- Provides personalized encouragement and advice
- **Alerts parents/mentors** when trends are concerning
- References sports psychology (Dan Abrahams methodology)

### 2. Age-Adaptive Content
Everything changes with the player's age tier — not a one-size-fits-all app.

### 3. Baltic Football Data Hub
Consolidated database of clubs, academies, teams, and tournaments across Latvia, Estonia, Lithuania — data that currently lives in dozens of scattered websites. Automated discovery and enrichment of club data.

### 4. Player-First Design
Built for the player's perspective — logging their own journey, not a coach's admin tool disguised as a player app.

### 5. Gamification That Grows Up
XP, streaks, challenges, and achievements that feel rewarding at 10 and still relevant at 17. FIFA/EA FC-inspired player cards that make the player feel professional.

## Business Model

**Hybrid: Free players, paid clubs**

| Tier | User | Price | Features |
|------|------|-------|----------|
| Free | Individual player | €0 | Full player experience: logging, progress, exercises, AI coach, challenges |
| Team | Coach + team | €X/month | Team dashboard, player evaluation, training planning, schedule management |
| Academy | Club/academy | €X/month | Multi-team management, cross-age-group analytics, club branding, data exports |

Players should NEVER pay. Revenue comes from coaches and clubs who get management tools built on top of the player data the kids are already generating.

## Daily Engagement Loop

A 12-year-old opens Golazo every day because:

1. **Daily Check-in** (30 seconds) — mood + energy emoji tap → feeds AI coach
2. **Daily Challenge** — specific drill or exercise to complete → XP reward
3. **Daily Quiz / Trivia** — football rules, history, tactics → knowledge XP
4. **Streak Counter** — don't break the chain → rising streak rewards
5. **Inspirational Quote** — new footballer quote each day

Combined into a "Morning Routine" flow that takes 2 minutes and sets up the day.

## Content Strategy

All content types, prioritized:

| Priority | Content Type | Source | Status |
|----------|-------------|--------|--------|
| P0 | Exercise library with videos | Curated YouTube + original | ✅ Exists (25+ drills) |
| P0 | Footballer quotes | Manually curated | ✅ Exists (16 quotes) |
| P1 | Daily challenges / drills | Generated from exercise library | 🔄 Scaffolded |
| P1 | Football knowledge quizzes | AI-generated per age group | ❌ Not started |
| P1 | Micro-articles (tactics, nutrition, mental) | AI-curated from methodology books | ❌ Not started |
| P2 | Player stories (famous players' youth) | Research + write | ❌ Not started |
| P2 | Structured training programs by age | Based on UEFA methodology | ❌ Not started |
| P3 | Video tutorials (original) | Record / commission | ❌ Not started |

## Platform Strategy

**PWA now, agent later.**

Current: React PWA accessible via mobile browser — the primary development target for discovering flows and proving value.

Future paths (not mutually exclusive):
- **WhatsApp/Telegram agent** — Once app flows are proven, test a conversational interface that handles daily coaching, logging, and feedback. The experiment: do players prefer talking to an agent or tapping through an app?
- **Native wrapper** — When traction justifies it, wrap in Capacitor for App Store / Google Play presence. The web app remains the source of truth.

## Language Strategy

**English primary** for now — simplifies maintenance and teaches kids English.
Baltic languages (LV, RU, LT, ET) re-enabled when expanding to local markets.
i18n infrastructure already exists for 6 languages — it's a configuration switch, not a rebuild.

## Data Strategy: Baltic Football Hub

Baltic football data is the biggest unsolved problem — and the biggest opportunity. No single source consolidates clubs, tournaments, schedules, and results across Latvia, Estonia, and Lithuania. The data lives scattered across federation websites, tournament platforms (turniir.ee, sportdata.org), social media, and WhatsApp groups. Baltic open data portals (data.gov.lv, andmed.eesti.ee, data.gov.lt) have limited sports-specific data discovered so far.

### Current State
- **Team registries**: Hand-curated JSON files for LV, EE, LT (`data/teams-*.json`), seeded to Cosmos DB
- **Tournament import**: User-initiated — paste a URL (turniir.ee format supported), API parses fixtures and cross-references teams against the registry
- **Live refresh**: Timer function auto-refreshes active tournaments every 30 minutes
- **Club enrichment**: `team-info` API scrapes club websites for logos, descriptions, metadata
- **Validation**: Maintenance scripts check for missing fields, duplicates, data quality issues

### The Problem
- No automated federation scraping — all club data is manually curated
- Tournament data depends on users pasting URLs — no discovery
- Baltic open data research ongoing, but limited sports datasets found so far
- Different countries use different platforms, formats, and languages

### Strategy
1. **Continue open data research** — Systematically scan data.gov.lv, andmed.eesti.ee, data.gov.lt for sports, education, and municipal datasets that could enrich football data indirectly (school sports, municipal funding, facility data)
2. **Mature the pipeline** — Evolve manual JSON curation + ad-hoc scripts into a reliable, automated data collection pipeline with monitoring and quality checks
3. **Expand source coverage** — Add parsers for more tournament platforms, federation result pages, and league standings beyond turniir.ee
4. **Build the missing API** — Long-term goal: Golazo becomes the Baltic football data source that doesn't exist yet. A public API with consolidated club, tournament, and schedule data, available for anyone to use

### Data We Want to Consolidate
- Club profiles (name, logo, website, academy structure, age groups)
- Tournament calendars and results by age category
- League standings
- Player statistics (aggregated, anonymized for non-Golazo users)

## Design Direction

**Nike/Adidas Training Club aesthetic** — clean, premium, mature.

Moving away from dark FIFA/gaming theme toward:
- Light or neutral base with bold accent colors
- Professional sports typography
- Data-rich but not cluttered
- Feels like a training tool used by real athletes
- A 12-year-old should feel like they're using a pro athlete's app

NOT a kids game. NOT childish. NOT overly dark/gaming. Think: Strava meets Nike Training Club, but for football.

## Timeline

**Target: Before football season 2026/2027 (August–September 2026)**

- ~5 months to make this feel "real" for the team
- Prioritize UX polish, daily engagement, and content over new features
- Coach features are Phase 3+ (after player experience is solid)

## Technical Architecture (Current)

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS 4
- **Backend**: Azure Functions (Node.js) + Cosmos DB
- **Auth**: Google OAuth via Azure SWA
- **AI**: Azure OpenAI (coach recommendations)
- **Hosting**: Azure Static Web Apps
- **State**: React Context + localStorage + API sync (offline-first)
- **i18n**: react-i18next (6 languages ready)

Architecture review needed to validate this supports the vision at scale.

## Success Metrics

| Metric | Target (Season 1) |
|--------|-------------------|
| Daily active players | 20+ (one team) |
| Weekly retention | 60%+ |
| Average sessions logged/week | 3+ per active player |
| Streak length (median) | 5+ days |
| Mental health alerts triggered | Working and tested |
| Parent satisfaction | Qualitative feedback |
