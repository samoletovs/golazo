# Golazo / Football academy directions

**Interactive concepts, not a production redesign. Owner choice is pending.**

The owner rejected the first shipped slice's aesthetic quality and incomplete
application scope. These concepts start from the whole football product rather
than a larger greeting, jersey and metric-card homepage. The confirmed
[brief](../../../.impeccable.md) retains players aged 10–14, supporting parents
and Golazo's cobalt/coral neutral palette.

## Open one comparison

From this isolated checkout:

```powershell
node docs\design-directions\academy-20260922\server.mjs
```

- [Interactive comparison](http://127.0.0.1:4321/) — defaults to A / Latvian.
- [Contact sheet](http://127.0.0.1:4321/contact.html) — both directions, all five
  tabs, desktop and mobile; switch LV/EN.
- [A / weekboard](http://127.0.0.1:4321/?direction=a&lang=lv#home)
- [B / player journal](http://127.0.0.1:4321/?direction=b&lang=lv#home)
- [Whole-app inventory in the preview](http://127.0.0.1:4321/#coverage)

The local server binds only `127.0.0.1` and serves this concept directory.
There are no dependencies to restore for the prototype, no remote fonts,
analytics, APIs, auth, uploads, localStorage or sync. CSS/JS/SVG are original;
fonts resolve locally. All records are fictional and reset on reload.

## The comparison, not a recolor

| Surface | A — Academy weekboard (lead) | B — Player journal |
|---|---|---|
| Shell | Persistent academy rail and wide working canvas | Horizontal matchday navigation and journal spreads |
| Home | Spatial weekboard, date-stamped session, practice geometry | Dated match review, next session and side agenda |
| Log | Entry tools beside recent records | A journal tool strip and date-indexed ledger |
| Progress | Inspectable weekly histogram and focus tags | Wide activity trace with a separate focus column |
| Learn | Filter rail and comparable practice tiles | Featured practice spread and a compact library |
| Profile | Academy registration card and personal choices | Player dossier, position diagram and goal section |

Both use the same dated entries, forms and capabilities. Cobalt `#2447C5` is the
product action color, coral `#FF9B7B` marks emphasis, ink `#14243B` anchors type,
and neutral `#F3F5F8`/white surfaces keep the content readable. Club identity is
not permission to recolor every control. Local Bahnschrift/Arial Narrow carries
the athletic display role; Segoe UI/system text carries reading and controls.
These are concept choices for Golazo, not universal font/palette rules.

The real-use-scale refinement keeps review controls out of the way on phones:
the whole week and today's log action are visible together, the journal's
three entry types are compact, and the library uses readable practice rows.
Original station diagrams now distinguish receiving, wall passing and turns
instead of repeating a generic full-pitch illustration. A's progress sheet
adds a six-week total calculated from the same dated records, not a new KPI or
ability score. The player credential is compact enough to show its edit action.
These are visual proposals to judge in the preview, not evidence of owner acceptance.

The signature is the football working material: a weekboard, dated match sheet,
original receiving/passing/turning diagrams and player registration geometry.
There is no commercial card frame, stock footballer, borrowed mascot or photo.

## Explore beyond the five tabs

Training, match and reflection logs; exercise detail and saved practice; article
and program/workout views; schedule/week/month/event dialog; tournament
fixtures; settings; six-step player onboarding; goals, team/identity dialogs;
check-in and quiz; representative coach, roster, planner, attendance and mentor
workspaces are rendered.

Use **Views / Skati** to change player/coach/mentor, populated/starting-out
data, or make the next demo save fail. Changing A/B keeps the current page and
draft. A failed log preserves answers and supports retry. Parent/mentor views
never display private reflection text. Coach statistics show the actual
baseline limitation instead of invented aggregates.
On phones, the contact sheet is also available inside **Views / Skati**.

Other reachable surfaces have **individual mapped treatments**, accessible
through the inventory and contextual links. A mapped treatment is explicitly
not an implemented feature or an old production page. It names the planned
desktop/mobile layout, source component, states and unchanged behavior.

See [COVERAGE.md](COVERAGE.md), [the coverage registry](inventory.mjs), and the
[source dependency/state scan](source-map.json). The source scan distinguishes
import-graph reachability from actual navigation. `leaderboard` has a render
branch but no inbound player link found; `coach`/`squads` are declared Page values
without matching render branches. `TournamentPage` and several helpers are not
imported from App. None is silently counted as a working reachable page.

## Data and feasibility

- Fixed scenario date: **22 September 2026**. Fictional **Player 07 / U13**,
  North Academy, Riverside Juniors and Eastbank U13; no children's names/photos.
- Six-week minutes are derived from dated training fixtures:
  `120, 165, 90, 180, 135, 90`. Last seven days: two entries, 150 minutes.
  Logging today's 60-minute training gives three entries / 210 minutes and
  updates the current-week total to 150. These are records, not ability claims.
- Sparse mode has no fabricated match results, check-ins, physical records or
  preselected personal goal. A trend waits for entries spanning more than one
  recorded week; there is no target line or predicted readiness score.
- Training/match/diary fields follow existing shapes. U13 example rewards are
  visibly simulated, not a new XP implementation. Rest/navigation grants nothing.
- Diary AI consent currently defaults to `true` in production; this control
  mirrors that state and sends nothing. A privacy-default change needs a separate
  decision. Mentor privacy remains aggregate-only.
- Videos/imports/AI advice are not fetched. Their existing capabilities and
  pending visual treatment are documented rather than faked.
- Onboarding and specialist forms are representative concepts, not full
  production field/permission/schema implementations.

## Verification

Dependency-free model and coverage checks:

```powershell
node --test docs\design-directions\academy-20260922\concept.test.mjs
node --check docs\design-directions\academy-20260922\app.mjs
```

Use an existing compatible Python interpreter with Playwright already installed:

```powershell
python docs\design-directions\academy-20260922\browser_checks.py
```

After committing source, restart the server so `X-Concept-Source` reports that
revision, then capture the same source:

```powershell
python docs\design-directions\academy-20260922\browser_checks.py --source <full-source-sha> --capture
```

The runner uses fresh local-only browser contexts, actual five-tab clicks,
visible log/drillthrough controls, draft retention across directions, error and
retry, mentor privacy, learning actions, calendar/event/tournament, onboarding,
coach planning/attendance, sparse data, reduced motion, long Latvian and
320/390/768/1024/1440px layouts. The weekboard responds to its actual available
content width: tablet/narrow placements use compact dates with full event
drillthroughs, while wide placements retain full labels. Tests inspect rendered
word ranges for fragmentation/clipping and assert a single `2 : 1` score separator.
It checks rendered HTML contrast and 200% root text size.
It produces viewport comparisons, full-page references, state captures and
contact sheets under `evidence/`.

The initial preflight confirmed the dependency-free football-terminology
baseline. The stale skill loader was compared against freshly fetched governance
`c541f55d0196caa8ac03bfc0f1c2ec334a8a0a22`; current charter/skills were read from
an isolated checkout. An already-installed compatible TypeScript parser was
used read-only for the source scan after checking matching project lockfiles.
No dependencies, frameworks or security settings were changed.

## Limits and decision boundary

Checks demonstrate bounded navigation/state behavior, **not aesthetic approval**,
real-user research, full WCAG conformance or an award-winning result. Native
browser zoom, screen-reader use, physical devices and a production backend are
not claimed for this concept run. There is no approved performance budget or
production-optimization claim.

The pre-tablet-fix captures remain unchanged in Git at checkpoint
`d75c40985d10ebc14285657d38f9ab5490fe6cdd` (rendered source
`485a4df6e5483f4656c37b79b59fc19da330ce78`). Refreshed captures record their own
source revision; old evidence is not relabelled as if it exercised the fix.

The new branch is backed up **without a PR or deployment**. Production source,
backend, auth, schema, dependency manifests and CI stay byte-identical to the
fresh base. The owner can select A, B, a deliberate combination, or revisions.
No site/app redesign is declared delivered by this concept checkpoint.
