# FIFA/UEFA Alignment Audit — Golazo

Date: 2026-03-29

## Official references used

1. IFAB Laws of the Game, Law 7 (Duration of the Match)
- https://www.theifab.com/laws/latest/the-duration-of-the-match/
- Core rule: standard match is 2x45; competition rules may set reduced durations.

2. UEFA Running Competitions
- https://www.uefa.com/running-competitions/
- Uses the official terms Matches and draws.

3. UEFA Development
- https://www.uefa.com/development/
- Development pathways: grassroots, youth players, coaches, referees.

4. UEFA Publications hub
- https://www.uefa.com/news-media/publications/
- Technical reports and The Technician (coaching review) as methodology sources.

5. UEFA Documents portal
- https://documents.uefa.com/
- Official regulations/guidelines source for federation-level rules.

## Alignment decisions

1. Terminology normalization
- App standard term is match for played contests.
- App standard term is fixture for planned schedule entries.
- Tournament import UX uses matches, not games.

2. Match duration standard
- IFAB baseline acknowledged: 2x45.
- Youth defaults are age-aware in app logic, while still editable per competition context.

## Implemented changes

1. New standards utility
- Added src/engine/footballStandards.ts
- Provides:
  - getMatchDurationRecommendation(birthDate)
  - addMinutesToTime(time, minutes)

2. Match logging aligned to age-aware duration defaults
- Updated src/pages/MatchLog.tsx
- Removed fixed 70-minute assumption and now defaults from standards utility.

3. Planned fixture duration defaults in schedule
- Updated src/pages/SchedulePage.tsx
- New fixture form now defaults end time using age-based match duration.
- Switching event type to match in the form applies recommended duration automatically.

4. Tournament import duration defaults
- Updated src/components/TournamentImport.tsx
- Default match duration now comes from age-based recommendation.

5. i18n terminology updates
- Updated src/i18n/en.json
  - Full game -> Full match
  - Number of games -> Number of matches
  - Add Game -> Add match
  - Schedule action label Match -> Fixture
  - Find Games/no games/found games/added games -> match terminology
- Updated src/i18n/ru.json, src/i18n/lt.json, src/i18n/lv.json
  - Tournament/import wording moved from generic game terms to football match terms.

## Current status

Aligned:
- Core football terminology in key scheduling/import surfaces.
- Match duration defaults now respect IFAB baseline + youth competition flexibility.

Still open (next pass):
- Optional endpoint naming migration: /api/shared-games -> /api/shared-matches.
- Optional model naming migration in tournament import payloads (games -> matches) with backward-compatible API aliases.
- Deep methodology integration into AI coach prompts using UEFA publication themes.
