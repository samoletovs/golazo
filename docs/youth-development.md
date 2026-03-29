# UEFA Youth Development Framework — Golazo Reference

> Based on UEFA Grassroots Charter, English FA EPPP, KNVB (Dutch) youth methodology,
> and standard European youth football development practices.
> Use this when building features related to age groups, skill development, training methodology.

## Age Groups (UEFA Standard)

| Code | Age Range | Key Focus | Match Format |
|------|-----------|-----------|--------------|
| **U6-U7** | 5-7 years | Fun, basic movement, ball familiarity | 3v3, 4v4 |
| **U8-U9** | 7-9 years | Ball mastery, 1v1, small games | 5v5, 7v7 |
| **U10-U11** | 9-11 years | Decision-making, passing, small-sided | 7v7, 9v9 |
| **U12-U13** | 11-13 years | Tactical awareness, technique refinement | 9v9, 11v11 |
| **U14-U15** | 13-15 years | Positional play, physical development | 11v11 |
| **U16-U17** | 15-17 years | Competition preparation, specialization | 11v11 |
| **U18-U19** | 17-19 years | Transition to senior football | 11v11 |

### Golazo Age Tier Mapping
```
U8       → 'u8'
U12      → 'u12'
U16      → 'u16'
U19+     → 'u19plus'
```

## The "Four Corner" Development Model (English FA)

Every session and development plan should address four pillars:

1. **Technical** — Ball mastery, passing, shooting, dribbling, first touch
2. **Physical** — Speed, agility, strength, endurance, coordination
3. **Psychological (Mental)** — Confidence, resilience, focus, decision-making
4. **Social** — Communication, teamwork, sportsmanship, respect

### Golazo's Skill Categories Alignment
| Four Corner | Golazo Category | Sub-skills examples |
|-------------|----------------|---------------------|
| Technical | `technical` | dribbling, shortPass, longPass, shooting, firstTouch, tackling |
| Physical | `physical` | speed, stamina, agility, strength, balance, coordination |
| Psychological | `mental` | confidence, focus, resilience, composure, motivation |
| Social | `mental` (merged) | communication, teamwork, coachability, leadership |
| Tactical* | `tactical` | positioning, vision, decisionMaking, pressing, gameReading |
| Knowledge* | `knowledge` | rules, nutrition, videoAnalysis, formations |

*Tactical and Knowledge are Golazo additions beyond the Four Corner model.

## Training Methodology Sources

### Coerver Coaching
- Focus: Individual ball mastery and 1v1 skills
- Key principle: "Speed of play through speed of technique"
- Applicable ages: All, especially U7-U13
- Golazo exercises: `methodology: 'coerver'`

### Horst Wein (Developing Game Intelligence)
- Focus: Decision-making through small-sided games
- Key principle: "The game is the best teacher"
- Applicable ages: U9-U15
- Golazo exercises: `methodology: 'horstWein'`

### Dan Abrahams (Soccer Tough)
- Focus: Mental skills — confidence, focus, composure
- Key principle: "The 4Cs: Commitment, Communication, Concentration, Control"
- Applicable ages: U11+
- Golazo exercises: `methodology: 'danAbrahams'`

### Talent Code (Daniel Coyle)
- Focus: Deep practice — slow, deliberate repetition
- Key principle: "Struggle in certain targeted ways → neurological growth"
- Applicable ages: All
- Golazo exercises: `methodology: 'talentCode'`

### UEFA Grassroots
- Focus: Age-appropriate physical development
- Key principle: "No early specialization; develop all-round athletes"
- Applicable ages: U6-U13
- Golazo exercises: `methodology: 'uefa'`

## Match Duration Standards (Youth)

| Age Group | Match Duration | Half Length | Substitutes |
|-----------|---------------|-------------|-------------|
| U7-U8 | 2 × 15 min | 15 min | Unlimited |
| U9-U10 | 2 × 20 min | 20 min | Unlimited |
| U11-U12 | 2 × 25 min | 25 min | Unlimited |
| U13-U14 | 2 × 30 min | 30 min | 5-7 |
| U15-U16 | 2 × 35 min | 35 min | 5 |
| U17-U18 | 2 × 40 min | 40 min | 5 |
| Senior | 2 × 45 min | 45 min | 3-5 |

### Golazo Default Duration
Golazo now sets an age-aware default match duration (still editable):

- U10 and younger: 50 min total (2x25)
- U11-U12: 60 min total (2x30)
- U13-U14: 70 min total (2x35)
- U15-U16: 80 min total (2x40)
- U17+: 90 min total (2x45)

This follows IFAB Law 7 baseline (2x45) while applying youth-appropriate reduced durations.

## Physical Testing Benchmarks (by age)

### Sprint (30m) — seconds
| Age | Below Average | Average | Good | Excellent |
|-----|---------------|---------|------|-----------|
| U10 | >6.5 | 5.5-6.5 | 4.8-5.5 | <4.8 |
| U12 | >5.8 | 5.0-5.8 | 4.5-5.0 | <4.5 |
| U14 | >5.2 | 4.5-5.2 | 4.1-4.5 | <4.1 |
| U16 | >4.8 | 4.2-4.8 | 3.9-4.2 | <3.9 |

### Beep Test Level
| Age | Below Average | Average | Good | Excellent |
|-----|---------------|---------|------|-----------|
| U10 | <4 | 4-6 | 6-8 | 8+ |
| U12 | <5 | 5-7 | 7-9 | 9+ |
| U14 | <6 | 6-8 | 8-10 | 10+ |
| U16 | <7 | 7-9 | 9-11 | 11+ |

### Standing Jump (cm)
| Age | Below Average | Average | Good | Excellent |
|-----|---------------|---------|------|-----------|
| U10 | <120 | 120-145 | 145-165 | 165+ |
| U12 | <140 | 140-165 | 165-185 | 185+ |
| U14 | <160 | 160-190 | 190-210 | 210+ |
| U16 | <175 | 175-205 | 205-225 | 225+ |

## Progression Principles

1. **No early specialization** before U12 — expose to all positions and skills
2. **Process over results** — development metrics over match results at young ages
3. **Play:practice ratio** — more playing, less standing in lines
4. **Individual development plans** — each player progresses at their own pace
5. **Long-term athlete development (LTAD)** — patience; peak performance age is 27-32
6. **Relative age effect** — be aware that children born early in the year may appear more developed
7. **Fun first** — if it's not fun, they'll quit; joy of the game is the foundation

## Weekly Training Structure (Typical U12)

| Day | Type | Duration | Focus |
|-----|------|----------|-------|
| Mon | Team training | 90 min | Technical + tactical |
| Tue | Rest or individual | — | Recovery |
| Wed | Team training | 90 min | Physical + match prep |
| Thu | Rest or individual | — | Recovery / light skills |
| Fri | Match or light training | 60-90 min | Match day -1 prep |
| Sat | Match day | — | Competition |
| Sun | Rest | — | Recovery |

**Key**: Avoid training on the day before AND after a match. 2-3 team sessions per week maximum for U12.
