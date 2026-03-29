# Golazo — Feature Roadmap

> Last updated: 2026-03-30
> Target: Ready for football season 2026/2027 (August–September 2026)

## Phase 0: Foundation (April 2026) — "Make It Solid"
*Fix what's broken, polish what exists, redesign the UX*

### Design Overhaul
- [ ] Implement new design system (light theme, Nike/Adidas aesthetic)
- [ ] Redesign bottom navigation (5-tab layout)
- [ ] Redesign Dashboard as the daily landing page
- [ ] Redesign all cards (stat cards, coach card, quote card)
- [ ] Fix empty states across all pages
- [ ] Fix responsive issues and touch targets
- [ ] Typography migration (Inter + JetBrains Mono)

### UX Flow Fixes
- [ ] Streamline training log flow (fewer taps)
- [ ] Streamline match log flow (quick mode + detailed mode)
- [ ] Fix navigation confusion (too many tabs/pages)
- [ ] Add skeleton loading states (replace spinners)
- [ ] Improve onboarding flow
- [ ] Add proper error states and retry patterns

### Technical Debt
- [ ] Audit and clean up unused code/components
- [ ] Fix build warnings
- [ ] Review state management (Context vs localStorage sync)
- [ ] API sync reliability testing
- [ ] Review and fix type safety issues

---

## Phase 1: Daily Engagement (May 2026) — "Make Them Come Back"
*Build the habit loop that makes players open the app every day*

### Daily Check-in
- [ ] Mood + Energy quick tap flow (emoji, 2 taps, done)
- [ ] Check-in history stored with dates
- [ ] Streak counter for consecutive check-in days
- [ ] Check-in data feeds AI Coach analysis

### Daily Challenge
- [ ] Challenge engine: select age-appropriate drill from exercise library
- [ ] "Challenge of the Day" card on Dashboard
- [ ] Mark challenge as completed → XP reward
- [ ] Weekly challenge recap

### Daily Quiz
- [ ] Football knowledge quiz engine (rules, history, tactics)
- [ ] Age-appropriate question pools (U10, U12, U14, U16+)
- [ ] Quiz of the Day card on Dashboard
- [ ] Knowledge XP track (separate from training XP)
- [ ] AI-generated question pools per age tier

### Morning Routine Flow
- [ ] Combined flow: Check-in → Challenge → Quiz
- [ ] 2-minute total time target
- [ ] Streak rewards for completing full routine

### Enhanced Gamification
- [ ] Achievement badges redesign (unlock conditions, display)
- [ ] Weekly goals with ring progress (like Apple Watch)
- [ ] "This week vs last week" comparison cards
- [ ] Level-up celebration screen

---

## Phase 2: Content Engine (June–July 2026) — "Make It Valuable"
*Fill the app with age-appropriate content that players actually consume*

### Micro-Articles
- [ ] Article system with categories (tactics, nutrition, mental, rules, stories)
- [ ] Age-filtered content display
- [ ] Reading time indicator
- [ ] "Read" tracking → XP reward
- [ ] Initial content batch: 20-30 articles from methodology books

### Player Stories
- [ ] Famous players' youth stories (Modrić, Messi, De Bruyne, etc.)
- [ ] "The Road to" format — focus on youth development, not fame
- [ ] Age-relevant (U12 player sees what pros did at 12)
- [ ] 8-10 stories for launch

### Exercise Library Enhancement
- [ ] Better filtering (by skill, equipment, difficulty, position, age)
- [ ] Exercise of the Week (featured on dashboard)
- [ ] "My Saved Exercises" personal library
- [ ] Exercise completion logging → XP
- [ ] Session builder (combine exercises into a training plan)

### Structured Training Programs
- [ ] "4-Week Programs" by focus area (ball mastery, shooting, agility, etc.)
- [ ] Age-appropriate programs
- [ ] Progress tracking within programs
- [ ] Program completion badge

### Football Knowledge Quizzes (expanded)
- [ ] Rules of the game by topic (offside, fouls, handball, etc.)
- [ ] Tactical awareness quizzes
- [ ] Famous matches and history
- [ ] Quiz streaks and leaderboard among friends

---

## Phase 3: Mental Wellbeing & AI Coach (July–August 2026) — "Make It Smart"
*The core differentiator: AI that cares about the whole player*

### Mood Analytics
- [ ] Mood trend visualization (daily, weekly, monthly)
- [ ] Mood vs training performance correlation chart
- [ ] Energy pattern detection (pre-match anxiety, post-loss dip, etc.)
- [ ] Burnout / overtraining risk indicator

### AI Coach Evolution
- [ ] Weekly AI summary: "This week you trained X times, mood was Y, focus on Z"
- [ ] Personalized exercise recommendations based on logged weaknesses
- [ ] Mental health-aware responses (detect low patterns, suggest rest/reflection)
- [ ] REST days recommendation when overtraining detected
- [ ] Interactive chat mode (not just card — conversational)

### Parent / Mentor Alerts
- [ ] Parent view: dashboard with child's mood trends, training consistency
- [ ] Alert triggers: 3+ consecutive low mood days, sudden drop in engagement
- [ ] Alert delivery: in-app notification + option for email/push
- [ ] Privacy boundary: parents see trends, NOT diary content
- [ ] Coach can see wellbeing status (opt-in) without personal details

### Diary Enhancement
- [ ] Guided prompts (not just blank page): "What went well?", "What was hard?"
- [ ] Mood tagging with context (match, training, school, friends)
- [ ] Private by default — only player sees diary content
- [ ] AI reads diary (with consent) to improve coaching suggestions

---

## Phase 4: Team & Social (Post-Launch, Q4 2026) — "Make It Social"
*Expand from individual player to team experience*

### Team Features
- [ ] Create/join teams with invite codes
- [ ] Team schedule (training + match calendar)
- [ ] RSVP for events
- [ ] Team chat / announcements
- [ ] Team leaderboard (XP, challenges, streaks)

### Coach Dashboard (V1)
- [ ] View all players' progress summaries
- [ ] Team overview: who trained, who's struggling, who's improving
- [ ] Match entry from coach perspective (lineup, substitutions, notes)
- [ ] Send team-wide messages

### Social Challenges
- [ ] Challenge a friend (e.g., "who logs more training this week")
- [ ] Team challenges (whole team vs a target)
- [ ] Inter-team challenges (Rīgas FS U12 vs FK Jelgava U12)

### Enhanced Leaderboard
- [ ] Category leaderboards (most training hours, best streaks, quiz scores)
- [ ] Monthly rankings
- [ ] Achievements showcase

---

## Phase 5: Data Hub (2027) — "Make It the Source of Truth"
*Baltic football data is fragmented — Golazo becomes the API that doesn’t exist yet*

### Data Pipeline Maturation
- [ ] Evolve hand-curated JSON registries into automated, monitored pipeline
- [ ] Add parsers for federation result pages and additional tournament platforms
- [ ] Monthly data quality reports and automated validation
- [ ] Data quality dashboard (coverage, freshness, completeness per country)

### Baltic Open Data Research
- [ ] Systematic scan of data.gov.lv, andmed.eesti.ee, data.gov.lt for sports-adjacent datasets
- [ ] Explore municipal sports facility data, school sports programs, sports funding datasets
- [ ] Document findings and integration opportunities

### Tournament Integration
- [ ] Auto-import tournament brackets and results
- [ ] Tournament calendar by age group
- [ ] Historical results archive
- [ ] Team/player statistics from tournaments

### Club Profiles
- [ ] Rich club pages: history, academy structure, coaching staff
- [ ] Club-specific training calendars
- [ ] Player count / active users per club (anonymized)

### Academy/Club Paid Tier
- [ ] Multi-team management for clubs
- [ ] Cross-age-group analytics
- [ ] Custom branding (club colors in app)
- [ ] Data export (PDF reports for parents/sponsors)
- [ ] Payment integration

### Public Baltic Football API
- [ ] REST API exposing consolidated club, tournament, and schedule data
- [ ] Open access for developers, researchers, and media
- [ ] API documentation and usage examples
- [ ] Rate limiting and API key management

---

## Phase 6: Agent Experiment (2027+) — "Do We Still Need the App?"
*The NauroLabs research question: can a conversational agent replace the app?*

Prerequisite: Phases 1–3 must be complete. We need proven flows, data structures, and coaching patterns before we can script an agent. The app teaches us what to build the agent for.

### WhatsApp/Telegram Agent
- [ ] Conversational coach that handles daily check-in, training logging, and feedback
- [ ] Natural language input: "I trained for 1 hour, worked on shooting" → parsed and logged
- [ ] XP awards, streak tracking, and challenge delivery via chat
- [ ] AI coaching responses based on accumulated player data
- [ ] Push-based engagement: agent initiates daily check-in, not just responds

### A/B Experiment
- [ ] Some players use app only, some use agent only, some use both
- [ ] Measure: daily engagement, retention, sessions logged, streak length
- [ ] Measure: data quality (does conversational input produce usable data?)
- [ ] Measure: player preference (which do they actually choose when given both?)

### Outcome Scenarios
- **Agent wins**: App becomes reporting/visualization layer only. Agent is the daily interface.
- **App wins**: Agent adds value for reminders/nudges but core interaction stays in-app.
- **Both**: Different players prefer different interfaces. Support both, share the same data.
- **Neither**: The value is in the data and coaching, not the interface. Focus on content quality.

---

## Ongoing: Agent-Managed Operations
*Runs across all phases — automate everything, administer nothing*

These are not one-time features but continuous automation targets. Every manual process should be designed with the assumption that an agent will replace the human.

### Data Agents
- [ ] Automated club data collection from federation websites and social media
- [ ] Tournament discovery — find new tournaments without users pasting URLs
- [ ] Duplicate detection and merge suggestions across team registries
- [ ] Staleness detection — flag clubs with outdated info, defunct URLs, missing seasons
- [ ] Self-healing data — re-scrape, re-fetch, auto-correct when confidence is high
- [ ] Data quality dashboard with automated alerts

### Product Improvement Agents
- [ ] Usage analytics agent — track feature adoption, drop-off points, engagement patterns
- [ ] Trend research agent — monitor competitor apps, youth sports tech, football methodology
- [ ] Propose feature improvements based on usage data + trend analysis
- [ ] UI/UX audit agent — detect accessibility gaps, responsive issues, slow interactions
- [ ] Performance monitoring — API response times, bundle sizes, rendering bottlenecks
- [ ] Security scanning — dependency audit, vulnerability detection, auth flow checks

### Content Agents
- [ ] Exercise library enrichment — find new drills, validate video links, update metadata
- [ ] Quiz generation agent — create age-appropriate questions from football knowledge base
- [ ] Translation quality agent — detect missing i18n keys, inconsistent terms, untranslated strings
- [ ] Article freshness — flag outdated content, suggest updates

### Quality Agents
- [ ] Automated test generation for untested code paths
- [ ] Regression detection after deployments
- [ ] Build health monitoring and auto-fix for common issues

---

## Milestone Summary

| Milestone | Date | Key Deliverable |
|-----------|------|-----------------|
| Phase 0 complete | End Apr 2026 | Redesigned, polished, bug-free app |
| Phase 1 complete | End May 2026 | Daily engagement loop live |
| Phase 2 complete | Mid Jul 2026 | Content-rich, valuable to use daily |
| Phase 3 complete | Mid Aug 2026 | AI coach with mental health monitoring |
| **Season launch** | **Sep 2026** | **Deploy to full team (20+ players)** |
| Phase 4 start | Oct 2026 | Team/social features |
| Phase 5 start | 2027 | Data hub and public API |
| Phase 6 start | 2027+ | Agent experiment: app vs conversational coach |
| Ongoing | All phases | Agent-managed operations (data, quality, product improvement) |
