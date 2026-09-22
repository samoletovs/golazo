# Clubhouse release evidence

## Decisions and scope

The owner selected Clubhouse A for players aged 10-14 with parent support, then
explicitly selected cobalt blue, warm coral and neutral surfaces. Club identity
colors remain separate. On 2026-09-22 the owner also selected **ship the verified
design; track loading optimization separately**.

Implementation source: `7e6e50c4758f4cbfb0782fddb2d291931f8a6091`.
Its application code is unchanged from `9251a7d`; the intervening commit records
candidate evidence only. The original concept comparison and earlier candidate
validation files are retained as historical snapshots, not current approvals.

## Exact-source validation

[Remote quality run 35714074042](https://github.com/samoletovs/golazo/actions/runs/35714074042)
passed 214 tests, 11 evidence-gate regressions, lint, types, football terminology
and the frontend build. Manual dispatch correctly skipped deployment.

The parent downloaded that run's source-stamped artifact and executed the
committed browser runner against the compiled local app:

- [68 observations](remote-7e6e50c/observations.json) and 40 captures cover four
  languages, 320/390/1280px, real visible controls, local-write failure/retry,
  duplicate submission, actual entry/XP storage and cloud PUT payload, reload,
  rest/first use, long content, reduced motion and enlarged text.
- Native Chromium zoom was measured separately using `chrome.tabs.setZoom(2)`
  in a fresh temporary profile, with full-content DIP captures. It is not
  simulated by CSS zoom or device-scale emulation.
- The offline runner intentionally mocks Google Font CSS. A separate
  [real-font supplement](real-fonts-7e6e50c/real-font-observations.json) verifies
  actual loaded Inter/Outfit faces across EN/RU/LV/ES, initial/form/completion,
  and 390/1280px: 24 observations and 24 screenshots. Only existing public
  font endpoints are allowed externally; profiles/auth/APIs remain synthetic.
- Minimum measured scoped HTML text contrast: **5.72:1**.

Representative actual-font screenshots:
[mobile](real-fonts-7e6e50c/en-initial-390.png),
[desktop](real-fonts-7e6e50c/en-initial-1280.png),
[completion](real-fonts-7e6e50c/en-completion-1280.png).

## Independent review

`design-learning-review` (`8f2b3e8c-cac2-42fb-92a3-5ee7f2fac2ff`) reviewed the
source against base `86f42a0`, ran 59 focused tests, checked the candidate image
hashes and independently exercised storage failure, retained-input retry,
double submission, atomic entry/XP persistence and PUT payload, offline reload
and contrasting club identity versus cobalt actions.

The subsequent disposition included representative actual-font screenshots,
the 24-case real-font report, the remote artifact report and successful CI.
Final result: **no significant issues or release blockers identified**.
Native zoom and the full supplied evidence matrix were reviewed, not exhaustively
rerun by the reviewer. The [receipt](review.json) records that precise scope.

## Accepted loading limitation, not a performance claim

The current initial request graph includes **1,539,146 decoded JavaScript bytes**
and **61,036 CSS bytes**, including a **396,869-byte charts chunk before logging**.
The preflight retained only rounded bundle-build sizes, not a baseline request
trace or immutable artifact; it cannot establish a comparative speed change.

The owner accepted this limitation for the bounded design release.
[Issue #9](https://github.com/samoletovs/golazo/issues/9) tracks measurement and
optimization separately, unassigned and awaiting maintainer review. There is
no new approved budget, measured loading improvement, demonstrated regression
or field Core Web Vitals claim. The performance receipt category records the
scoped review and explicit acceptance, not a threshold pass.

## Remaining coverage limits

Chromium only. No real children's records or live credentials were used.
Downloaded-font coverage is normal scale; failure recovery, enlargement and
native zoom use the separately identified fallback-font suite. Physical devices,
screen readers, representative-player/parent usability, live authentication and
multi-device reconciliation remain unverified. No full WCAG certificate.

The existing persistence schema, XP rules and backend are preserved. Local-save
verification must not be described as server synchronization. Post-merge
deployment and live asset identity are separate from this pre-merge receipt.
