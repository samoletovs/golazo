# Academy implementation candidate

This is the implementation of the owner's **A - Academy weekboard** selection.
The owner accepted the integrated compiled preview on 2026-09-23 at 18:19 +03:00
and authorized finalization. Independent review and complete source-bound
surface verification remain release requirements, not implied by that acceptance.
The canonical [brief](../.impeccable.md) and frozen
[220-surface scope](../.design-scope.json) govern the complete player, coach and
mentor experience. Original concepts remain in their historical directory.

## Connected screen family

| Area | Real implementation |
| --- | --- |
| Shared shell | Role-aware Academy rail, tablet navigation, wrapping phone navigation with measured clearance, secondary spaces and original SVG icons |
| Home | Actual scheduled/recurring week, day drillthrough, recorded activity, latest match, season and previous-week comparison, routine/quiz/challenge, goals, announcements, coach advice and tournament discovery |
| Log | Training, match and reflection forms beside an owner-filtered saved-entry journal; read-only record details; scheduled-entry prefill and recoverable skip choices; real age-scaled rewards; tournament entry |
| Progress | Recorded activity and training minutes, read-only match review, accessible value tables, current skill-snapshot explanation, physical/wellbeing views and evaluation history; no reconstructed historical XP series presented as fact |
| Learn | Articles, categories, programs/workouts and exercise search/filter/sort/detail/video/custom-drill flows |
| Profile | Original Academy credential and PNG export, existing-field identity editor, photo controls, teams, goals, achievements and physical history/customization |
| Settings | Existing language, theme, role, sign-out and reset capabilities moved into a dedicated workspace |
| Calendar and football | Week/month views, selected-day detail, training/match/event forms, recurring setup, tournament import and existing tournament/match drillthroughs |
| Coach | Squad selection, roster/player detail, training/drill planning, announcements, evaluation, attendance and team challenges |
| Mentor | Linked-player selection and player-linked activity, clearly separated from unscoped device check-in history; no diary text |
| Entry/recovery | Sign-in, existing role-specific onboarding steps, bootstrap skeleton and error recovery; shared native dialog focus/Escape behavior |

The CSS replacement removes the competing Clubhouse stylesheet and narrow app
shell. The compatibility classes used by smaller existing controls now resolve to
the same Academy tokens, rather than a second overlaid theme. Unimported legacy
helpers are not represented as reachable product screens.

Finalization found a keyboard-focus obstruction at 200% text size: the wrapping
bottom navigation exceeded the document's fixed scroll clearance. The shell now
publishes its measured fixed-navigation height to the document scroll container,
so focus scrolling accounts for the actual obstruction. The existing browser
regression requires the focused footer link to remain fully above navigation;
it is not satisfied by merely checking that the link receives focus.

The final gap pass also connected the existing standalone exercise library to
player navigation and made recorded tournament matches an inspectable disclosure.
Daily-quiz answers remain visible after answering, fully timed workouts display
the sum of their existing sections, and local advice uses the translated skill
category when a more specific sub-skill translation does not exist. These changes
do not add exercises, alter workout prescriptions or change stored record formats.
The retained quiz is keyed by its existing UTC date, so same-day feedback survives
routine completion while the next day's question starts enabled. Team selection
uses the existing plural position translation. The scope retains all 220 IDs,
corrects the observed onboarding entry names, and records genuinely shared
renderings explicitly instead of manufacturing different screenshots.

## Behavior and truthfulness

- No backend endpoint, authentication contract or persisted product schema was
  changed. There are no synthetic production records or new recommendation APIs.
- Document language and displayed dates follow the selected app language.
  Persisted ISO dates and calendar identifiers are unchanged.
- Training, match and diary records and their real XP changes are written
  atomically to local storage before publication. A stable draft ID prevents a
  double-submit from duplicating a record or reward. Existing match growth and
  age-tier rules remain in the engine.
- Saved-entry inspection is read-only and never grants XP. Identity editing uses
  the existing profile fields and setter; it does not add a record-edit endpoint
  or manufacture an unstored experience/history field.
- Tournament import saves the tournament and all of its fixtures in one local
  write. Repeating the same open import draft does not duplicate them. Optional
  team sharing is reported separately and is not implied by local success.
- A local save explicitly does **not** confirm a cloud save. Remote coach writes
  report failed/unconfirmed responses and retain the editor. Multi-squad retries
  skip confirmed targets within that editor. An interrupted response remains
  uncertain: without a backend idempotency contract, a new/reopened remote
  submission cannot be promised globally exactly-once.
- The existing reset action clears this device's football state, not the cloud
  account. Its confirmation says that synced data may return; no remote deletion
  capability is invented.
- Coach aggregate statistics were static zero/equal-weight displays, not a
  working analytics endpoint. The candidate states that the data is unavailable
  rather than showing those figures as observations.
- Existing check-ins have no player identifier. Mentor wellbeing remains
  explicitly a device snapshot, not a claim about the selected linked player.
  The selection filters only records that actually carry a player identifier.
- Evaluation history remains subject to the existing managed-team authorization.
  Ordinary player and mentor requests are denied; authorized own-history evidence
  uses an account retaining its pre-existing managed-team entitlement after role
  switching. This is not newly granted access to a linked child's evaluations.
- Program focus metadata is not displayed as a measured skill increase.
  Overall skill ratings and XP rank are labelled separately.
- Offline calculated practice ideas are labelled separately from an AI response.
  An unavailable AI request remains an explicit error with a retry, not an
  apparently successful generated plan.
- Rest and missed sessions do not generate records or XP. Comparisons describe
  stored activity without presenting lower frequency as failure.

## Local compiled preview

Use the existing interpreter with Playwright already installed; no package
download or environment switch is necessary. Build and stamp the exact source:

```powershell
npm run build
$source = git rev-parse HEAD
Set-Content -LiteralPath dist\source-revision.txt -Value $source -NoNewline
& C:\Python314\python.exe tests\academy_preview.py --dist dist --source $source --port 4323
```

Open `http://127.0.0.1:4323/__preview`. The launcher is test tooling, not part of
the shipped bundle. It labels its fictional profile and can reset player, coach
or mentor scenarios. It refuses to replace a different existing local profile.
The server binds only to loopback, serves the compiled assets, returns synthetic
read fixtures and deliberately refuses remote writes. It never proxies to a live
service or signs into a real account.

The clean `/` response remains the unmodified compiled HTML for browser
verification. The labelled owner preview adds test-only framing around that
same compiled app; do not confuse the framing with production UI.

## Verification and outstanding review

Use the source hashes, observations, captures and surface-status record in
[the candidate evidence directory](design-evidence/academy-20260923/). Captures
from earlier source hashes are historical and must not be relabelled.

- `npm test -- --maxWorkers=1`, `npm run build`, `npm run lint` and
  `npm run validate:football-terms` use the existing toolchain.
- `tests/test_design_gate.py` exercises missing/stale evidence, merge-tree base
  drift, backend-only scope, v2 surface coverage, separate craft review and
  integrated owner acceptance.
- `tests/test_training_browser.py` uses the actual compiled source marker,
  local-only fixtures, native keyboard controls, local-write failure/retry,
  narrow/tablet/desktop layouts, contrast, enlarged text and true browser zoom.
- `tests/academy-browser-probe.js` describes the role/language/navigation probe.
  The source-level shell regression follows actual imports; it is not a claim
  that craft quality or every interaction has been independently reviewed.

The retained baseline manifest is **build output sizes at the PR #10 production
base**, not pre-PR #10 performance evidence and not an initial-network baseline.
Current request measurements are recorded separately. Initial JavaScript remains
large. There is no new approved performance budget or optimization claim, and
unrelated loading-optimization work is not included.

Independent code/functional review and a separate visual craft review belong to
the parent delivery process. The owner's integrated acceptance is recorded in
the brief. A v2 draft remains deliberately non-passing until the review judgments
and complete surface evidence exist.
