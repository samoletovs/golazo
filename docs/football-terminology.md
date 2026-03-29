# Football Terminology Reference — Golazo App

> Based on FIFA Laws of the Game, UEFA documentation, and standard football glossary.
> Use this as the authoritative reference when naming features, types, UI labels, and API fields.

## Core Terms

### Match vs Game
- **Match** (✅ official FIFA/UEFA term): A scheduled competitive or friendly contest between two teams. FIFA Laws of the Game consistently use "match". Use this in the app.
- **Game**: Informal/colloquial synonym for match. Acceptable in casual UI text but prefer "match" in types, APIs, and data models.
- **Fixture**: A scheduled match, especially before it's been played. "Saturday's fixtures" = the matches scheduled for Saturday. Good for calendar/schedule context.

### Competition Types
| Term | Definition | Golazo Usage |
|------|-----------|--------------|
| **Friendly** (exhibition match) | Match with no competitive value, arranged between two teams | `matchType: 'friendly'` |
| **League** (round-robin) | Competition where clubs play each other, ranked by points | `matchType: 'league'` |
| **Cup** (knockout/single-elimination) | Competition where losing team is eliminated | `matchType: 'cup'` |
| **Tournament** | Multi-team competition, often over a short period at one venue | `matchType: 'tournament'` |
| **Competition** | Generic term for any organized football contest (league, cup, tournament) | `competition` field on match events |

### People & Roles
| Term | Definition | Golazo Usage |
|------|-----------|--------------|
| **Player** | Person who plays football | Primary app user role |
| **Coach** | Person who trains and instructs players | Future role (AI Coach currently simulates this) |
| **Manager** | Person in charge of team (chooses formation, tactics, substitutions) | Not used in youth context; use "coach" |
| **Mentor** | Parent/guardian who supports a player's development | Golazo-specific role for parents |
| **Referee** | Official who presides over a match | Not tracked in Golazo |
| **Captain** | Player chosen to lead a team | Could be a profile attribute |

### Team Structure
| Term | Definition | Golazo Usage |
|------|-----------|--------------|
| **Club** | Organization that runs one or more football teams | Registry: `SharedTeam` |
| **Academy** | Youth development program within a club | Registry: `type: 'academy'` |
| **Squad** | Specific age group/team within an academy (e.g. "U12 A") | Registry: `type: 'squad'` |
| **First team** | The most senior team fielded by a club | Not relevant for youth app |
| **Reserve team** | Supplementary team to the first team | Not relevant for youth app |

### Match Events & Stats
| Term | Definition | Golazo Usage |
|------|-----------|--------------|
| **Goal** | Ball crosses goal line between posts and under crossbar | `goals` stat |
| **Assist** | Pass that leads directly to a goal | `assists` stat |
| **Clean sheet** | Goalkeeper/team concedes no goals in a match | Could derive from match data |
| **Booking** (yellow card) | Caution for an offence | Not tracked |
| **Hat-trick** | Player scores three goals in one match | Achievement trigger? |
| **Brace** | Player scores two goals in one match | Achievement trigger? |
| **Tackle** | Winning the ball from an opponent | `tackles` stat |
| **Shot** | Attempt at goal | `shots` stat |
| **Key pass** | Pass that creates a scoring opportunity | `keyPasses` stat |

### Training & Development
| Term | Definition | Golazo Usage |
|------|-----------|--------------|
| **Training session** | Organized practice session | `TrainingEntry` / recurring schedule |
| **Drill** | Specific exercise within a training session | Exercise library items |
| **Warm-up** | Pre-training/match preparation | Exercise category |
| **Cool-down** | Post-training recovery | Exercise category |
| **Pre-season** | Period before competitive season starts | Schedule context |

### Positions (FIFA standard)
| Code | Full Name | Category |
|------|-----------|----------|
| GK | Goalkeeper | Goalkeeper |
| CB | Centre-back | Defender |
| LB | Left-back (fullback) | Defender |
| RB | Right-back (fullback) | Defender |
| CDM | Central defensive midfielder (holding midfielder) | Midfielder |
| CM | Central midfielder | Midfielder |
| CAM | Central attacking midfielder (playmaker) | Midfielder |
| LW | Left winger (wide midfielder) | Forward |
| RW | Right winger (wide midfielder) | Forward |
| ST | Striker (centre forward) | Forward |

### Schedule/Calendar Terms
| Term | Definition | Golazo Usage |
|------|-----------|--------------|
| **Fixture** | A scheduled match | Planned match in schedule |
| **Fixture list** | Schedule of upcoming matches | Schedule page |
| **Matchday** | Day when matches are played | Calendar date with matches |
| **Training day** | Day with scheduled training | Calendar date with training |
| **Season** | Time period for competitions (~Sep-May in Europe) | Stats aggregation period |

## Naming Conventions for Golazo Code

### TypeScript Types
- `MatchEntry` — logged match result ✅ (keep)  
- `TrainingEntry` — logged training session ✅ (keep)
- `ScheduleEvent` — planned event (match/training) ✅ (keep)
- `RecurringTraining` — weekly training template ✅ (keep)
- `MatchType` — friendly/league/cup/tournament ✅ (keep)
- `SharedTeam` — club/academy in registry ✅ (keep)

### API Endpoints
- `/api/shared-games` → Consider renaming to `/api/shared-fixtures` or `/api/shared-matches` in future
- `/api/teams` — team registry ✅ (keep)
- `/api/shared-tournaments` ✅ (keep, tournaments are the correct term)

### UI Labels
- "Match" not "Game" in all headings and labels
- "Fixture" for planned/scheduled matches
- "Training" not "Practice" or "Session"
- "Competition" as the generic parent (league name, cup name, tournament name)

## Key Insight: "Golazo"
From the glossary: **Golazo** — "a spectacular or impressive goal" (Spanish origin). Our app name is itself an authentic football term! ⚽
