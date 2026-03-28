# Design: Golazo v2.0 — Full Redesign

## Problem
Golazo is currently a client-only app with localStorage persistence. No backend means no cross-device sync, no leaderboards, no AI coaching. Visual design is chunky/kid-friendly — needs refinement for all ages.

## Approach
Add Azure Functions API + Cosmos DB backend via SWA managed functions. Refine visual tokens. Add progress tracking, AI coach, video exercises, leaderboards.

## Architecture
- **Frontend**: React 19 + Vite + Tailwind v4 (existing)
- **Backend**: SWA managed functions (`api/` folder, Node.js/TypeScript)
- **Database**: Azure Cosmos DB NoSQL (Free tier: 1000 RU/s, 25 GB)
- **Auth**: SWA Google OAuth → sync profile to Cosmos on login
- **AI**: Azure OpenAI via Functions proxy
- **Storage**: Azure Blob Storage for player photos
- **Data sync**: Offline-first (localStorage cache, API as source of truth)

### Cosmos DB Design
Single container `golazo` with partition key `/userId`:
- `docType: "profile"` — PlayerProfile
- `docType: "training"` — TrainingEntry
- `docType: "match"` — MatchEntry
- `docType: "tournament"` — Tournament
- `docType: "diary"` — DiaryEntry
- `docType: "schedule"` — ScheduleEvent
- `docType: "challenge"` — SpecialChallengeProgress
- `docType: "physical"` — PhysicalProfile
- `docType: "invite"` — InviteCode (partition: inviteCode)

### API Routes
| Method | Route | Description |
|--------|-------|-------------|
| GET | /api/sync | Full state sync (all user data) |
| PUT | /api/sync | Bulk upsert (offline sync) |
| GET/PUT | /api/profile | User profile |
| POST | /api/activities | Log training/match/tournament/diary |
| GET/POST | /api/schedule | Schedule events |
| POST | /api/invite | Create invite code |
| POST | /api/invite/accept | Accept invite |
| GET | /api/leaderboard | Friend leaderboard |
| POST | /api/coach | AI coach recommendation |

## Files to Change
- **New**: `api/` — entire Azure Functions backend (8 functions)
- **New**: `src/pages/ProgressPage.tsx` — progress tracking charts
- **New**: `src/pages/LeaderboardPage.tsx` — friend leaderboard
- **New**: `src/components/CoachCard.tsx` — AI coach dashboard card
- **New**: `src/components/VideoPlayer.tsx` — YouTube embed
- **New**: `src/components/AchievementBadge.tsx` — achievement display
- **Modify**: `src/contexts/AppContext.tsx` — API sync layer
- **Modify**: `src/index.css` — visual refresh tokens
- **Modify**: `src/pages/Dashboard.tsx` — add coach card
- **Modify**: `src/pages/Exercises.tsx` — video embed
- **Modify**: `src/pages/OnboardingPage.tsx` — fix parent→mentor
- **Modify**: `src/App.tsx` — add new routes
- **Modify**: `infrastructure/main.bicep` — add Cosmos, OpenAI
- **Modify**: all i18n files — new keys

## Cost Impact
- Cosmos DB Free tier: $0/month
- Azure OpenAI (GPT-4o-mini): ~$2-5/month (low usage)
- Blob Storage: ~$0.01/month
- Total: ~$2-5/month increase (within $150 budget)

## Security
- API validates SWA auth header (`x-ms-client-principal`)
- Cosmos access via managed identity (DefaultAzureCredential)
- No user input in queries (parameterized)
- AI coach rate-limited per user
