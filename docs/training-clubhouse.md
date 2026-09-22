# Clubhouse player-training slice

## Actual owner decisions

On 2026-09-22 the owner chose **A — Clubhouse**, then explicitly chose **cobalt
blue + warm coral with neutral surfaces** as the default. Green was not approved
as Golazo's default; it was not banned across products or from an explicitly
chosen alternate theme. See [the canonical brief](../.impeccable.md).

The [original concepts](design-directions/training-20260922/README.md) and their
evidence are historical, including their pre-choice wording. They are not
screenshots or test results for the production implementation.

## Scope and behavior

- Player Home uses an original jersey/club identity and a prominent training
  action, actual seven-day totals and real XP. Existing matches/goals/activities
  remain accessible through **More football**. Coach/mentor flows are unchanged.
- The default is cobalt/coral and neutral surfaces. Club colors appear separately
  on the jersey with black/white foregrounds measured by relative luminance. The
  existing My Club preference no longer tints every surface. Existing explicit
  alternate presets remain available.
- The form keeps the existing eight training types, energy/mood, notes, focus
  areas, profile identity and schedule linkage. It supports positive whole-minute
  durations with native date/duration validation.
- A training save writes the existing entry array and XP together to the
  existing `golazo-state` key **before publishing React state**. It uses
  `awardXp` / `XP_AWARDS.logTraining` / `getAgeTier`, not the concept's fake reward.
  Stable entry IDs and same-schedule/date checks make a retry idempotent.
- A failed local write leaves both entry and XP unchanged, keeps the form,
  displays an inline error plus the existing error toast and permits retry.
  Successful completion says **saved on this device**, not "synced".
- Existing debounced cloud synchronization remains separate. A failing PUT does
  not roll back the local entry or award; no server-confirmation capability is
  invented. The existing cloud-hydration/merge policy is unchanged: this is not
  a new offline reconciliation protocol or a multi-device conflict fix.
- Rest/missed-day reassurance points to the real schedule. It creates no record,
  grants no XP and doesn't ask for a reason. Existing XP/streak calculations are
  preserved but streak pressure is not displayed in this slice.

No backend, auth, persisted model/schema, dependencies or new component framework
are introduced. The implementation uses the existing six locale resources.

## Verification commands

The exact lockfile restored successfully **offline**, without a download or
version substitution:

```powershell
npm ci --offline --no-audit --no-fund
npm test
npm run lint
npm run validate:football-terms
npm run build
```

New unit/integration coverage lives in `training.test.ts`, `TrainingFlow.test.tsx`
and `clubhouseTheme.test.ts`. It verifies actual age-scaled awards, same-turn
updates, retries/double submission, retained inputs, honest local wording,
zero inactivity rewards, default palette and extreme club-color contrast.

The real-app browser test uses an existing compatible Python interpreter with
Playwright installed (not a new application dependency). Build the exact frozen
source, stamp it, and serve only the compiled output:

```powershell
$source = git rev-parse HEAD
npm run build
Set-Content -Encoding utf8 -NoNewline dist\source-revision.txt $source
npm run preview -- --host 127.0.0.1 --port 4318 --strictPort
# In another terminal, use the selected compatible Python executable:
python tests\test_training_browser.py --repo . --source $source --output docs\design-evidence\training-clubhouse-20260922
```

The browser runner rejects a mismatched source marker or changed source,
intercepts all auth/API requests, uses fresh synthetic player contexts, and
tests the visible journey, local-storage failure/retry, failed cloud PUT, reload,
320/390/1280px, long translated content, actual selected+hover colors and 200%
text. True browser zoom is separately measured using `chrome.tabs.setZoom(2)` in
an isolated temporary Chromium profile with a local-only test extension; this is
not CSS zoom or DPR emulation. Captures use full-content DIP bounds at native zoom.

The existing remote Google font CSS is mocked empty during this offline test:
system fallback typography is assessed, not downloaded font rendering. No live
children's data, auth or backend is accessed. No representative-user, physical
device or screen-reader assessment is claimed.

## Existing CI, now source-bound

- `scripts/design-gate.py` is pinned to reviewed governance commit
  `8fa6ccbe7481bc00aad0568517dde4cd3bafbf3a`.
- The shipped Rosette PR checker and its offline regression tests are adopted
  unchanged from `d275259233f61f00898649dcd5fbc3e24a43d0d8`. Exact upstream hashes
  are recorded in `scripts/design-gate.upstream.json`.
- The existing CI workflow checks out **`${{ github.sha }}`** for quality and
  deployment, including the same synthetic PR merge tree, with full history for
  evidence validation. Tests cover missing/stale receipts, missing history,
  backend-only changes and non-conflicting base UI drift.
- A UI PR must include a current independently reviewed `review.json`.
  Historical concept `verification.json` cannot satisfy that gate.
- Manual dispatch runs quality/build and emits
  `golazo-preview-<full SHA>` with `source-revision.txt`; it **cannot deploy**.
  There is no new cron. Actual deployment retains the existing API location and
  uses the same tested Node version rather than a separate Oryx frontend build.

## Candidate boundary

Owner direction is approved; **production implementation review is pending**.
Browser observations, when collected, are candidate evidence only, not a review
receipt. The parent coordinates remote validation, independent review, receipt,
PR, merge and deployment. No mergeable PR or production deployment is performed
by the implementing session.
