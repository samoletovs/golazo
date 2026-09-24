# Academy design evidence

## Final reviewed candidate

**Source:** `8685e11ed619cb736ce2ce7e9db2a67ee0001c8d`.
The owner accepted the integrated app on 2026-09-23 and requested finalization.
All **220 original surface IDs** now have current-source mobile/desktop evidence.
The source inventory explicitly declares genuinely identical shared renderings;
each role/entry still retains its own behavioral observations.

- [Final review receipt](review.json) and [independent review/acceptance](final-review.json).
- [Complete surface coverage](source-8685e11/coverage-candidate.json).
- [Current gallery](index.html) and [real-font observations](source-8685e11/fonts-observations.json).
- Full existing suite: **268 tests**; design-gate regressions: **16**.
  Build, type-check, lint and terminology checks passed locally and in
  [exact-source CI run 35974762446](https://github.com/samoletovs/golazo/actions/runs/35974762446).
  Manual dispatch deliberately did not deploy.
- All 44 JS/CSS assets from the local tested build and locked-dependency CI
  artifact match byte-for-byte. Initial loading remains the separate
  [issue #9](https://github.com/samoletovs/golazo/issues/9), not an optimization claim.
- Repeated runtime/browser checks include native zoom, keyboard focus above
  wrapped navigation, retained-input retry, exact-once local records, all roles,
  ordinary denied versus authorized own-history evaluation contexts, and actual
  web-font loading. Bounds and untested platforms remain explicit in the receipt.

The reports below preserve the first held candidate and are **historical**, not
substitutes for the final source. Deployment is recorded separately after the
normal PR gates; these local observations do not assert authenticated live use.

## Initial held candidate

**Compiled source:** `4113f91a630285da4f78328f8a90ba3ecbf62cba`.
No PR, merge, deployment or final design acceptance is asserted.

- [Interactive synthetic preview](http://127.0.0.1:4323/__preview)
- [Review gallery](http://127.0.0.1:4323/__evidence/)
- [All 220 surface statuses](surface-status.json)
- [Verification summary and limits](verification.json)
- [Capture hashes and dimensions](capture-manifest.json)
- [Unapproved v2 draft](review.draft.json)

## Actual checks

- 251 unit tests in 29 files passed.
- Type-check/build, lint and football-terminology checks passed. Hook warnings
  and the large-chunk build warning remain; no optimization is claimed.
- 16 offline design-enforcement regressions passed, including v2 scope/craft/
  acceptance and merge-tree freshness cases.
- 161 primary-workspace observations cover real local training save, retained
  input and retry, keyboard, contrast/selected hover, reduced motion, 320/390/
  768/1024/1440 widths, 200% root text enlargement and actual browser zoom 2.
- 400 role/language/viewport navigation observations: player, coach and mentor;
  EN/LV/RU/ES; all five widths.
- 132 populated supporting-flow observations cover journal details, identity
  recovery, exercise/custom-drill dialogs, calendar setup, coach workspaces and
  linked-player selection.
- 164 entry-flow observations cover all existing role onboarding paths, nested
  team choice/duplicate handling, and two-game tournament import. The last
  onboarding state is the actual first Home after completion.
- 44 native-control observations include a keyboard-opened file chooser with a
  generated image, photo removal, actual credential PNG export, persisted
  language/theme/role changes, and exact-one match/reflection save after failure.

These are **901 bounded browser observations**, not 901 independent tests,
real-user sessions or design-quality votes. The 483 PNG artifacts include four
exported credentials and 27 additional viewport captures for legible dialog
thumbnails. Those recaptures are not added to the 901 observation headline, and
exported images are not passed off as browser screenshots.

## Coverage is explicit, not inflated

Every frozen scope ID is mapped to its owning implementation. Direct rendered/
control observations are linked for 76 IDs. The other 144 entries are explicitly
marked **source-integrated, not individually certified**. Many share a component
or workspace already exercised, but that is not equivalent to inspecting every
role/entry/state combination.

The generated v2 draft intentionally leaves checks, individual surface
certification, independent craft judgments and integrated owner acceptance
unapproved. It must not be renamed to a passing receipt. The parent still owns
the independent code/functional and separate visual craft reviews, complete
per-surface certification, and the owner's integrated preview acceptance.

## Data, fonts and platform limits

All profiles, team data, notes and responses are synthetic. No real child data,
authentication or production API was used. External video playback was not
verified. The native browser runs used Chromium on Windows; public font CSS was
mocked empty, so installed/fallback font rendering is the measured result.
No Safari/Firefox, screen-reader or real-player usability study is claimed.

Current initial JavaScript requests measured **1,714,957 decoded bytes** in each
of the four primary-language runs. Initial loading remains a known limitation.
The retained [baseline](baseline-build-manifest.json) records build outputs from
the PR #10 production base, **not** pre-PR #10 measurements or a comparable
initial-network baseline. No new performance budget or improvement is asserted.

## Provenance

Current rendered evidence lives only under [source-4113f91/](source-4113f91/).
The [historical A/B options](direction-history/provenance.json) retain their
original source and purpose. Original concept evidence was not rewritten.
Earlier implementation probes remain local, labelled with their actual source;
they are not reused as current evidence.

Browser procedures are preserved alongside this report:
[supporting flows](capture-support.cjs), [entry/tournament flows](capture-entry.cjs)
and [native controls](capture-controls.cjs). The primary runner remains
[`tests/test_training_browser.py`](../../../tests/test_training_browser.py);
the role probe is [`tests/academy-browser-probe.js`](../../../tests/academy-browser-probe.js).
