# Evidence: family grid run 2026-11-22 (UTC), trellis 0.4.0

Status: `observed`. This document records one run of the bundle runner
(`npm run family`) over the canonical family workspace. It is a receipt, not
a standing claim: the next health statement is the next run.

## What ran

- Runner: trellis 0.4.0, `scripts/family.mjs`, the default probe lists plus the
  operational probes. The run used the trellis working tree that this record
  is committed with.
- Layout: the canonical family workspace, with the five member repositories as
  sibling checkouts of this one, each clean at the commit below. Those commits
  are local and not yet published.
- Every member's own test suite was spawned (`npm test` in each checkout) for
  the operational point. Exit codes were read as results.

| Member | Declared `VERSION` | Commit |
| :--- | :--- | :--- |
| seed | 0.3.0 | `cf1c5e4` |
| capillary | 0.3.0 | `4f1a735` |
| myosotis | 0.4.0 | `5b54be3` |
| aestivation | 0.4.0 | `b6c1c91` |
| drosera | 0.4.0 | `c19d757` |

## Results

| Member | Shape | Behavior | Consistency | Operational | Verdict |
| :--- | :--- | :--- | :--- | :--- | :--- |
| seed | 1 pass | 7 pass | 1 pass | 1 pass | pass |
| capillary | 1 pass | 6 pass | — | 1 pass | pass |
| myosotis | 1 pass | 6 pass | — | 1 pass | pass |
| aestivation | 1 pass | 6 pass | — | 1 pass | pass |
| drosera | 1 pass | 6 pass | — | 1 pass | pass |
| cross-family | — | — | 3 pass | — | pass |

**Family verdict: pass.** No fails, no unknowns. Runner exit code: 0.

## What changed since the trellis 0.3.0 run

No member moved. Trellis moved:

- The bundle runner now uses `familyGridAsync`, which awaits each check. The
  synchronous runner records an asynchronous check as `unknown` instead.
- Seven probes hold the newer member claims:
  - seed 0.3.0: `seed-resume-skips-and-stops` (asynchronous),
    `seed-lease-refuses-second-runner`, `seed-caller-admission-fails-closed`.
  - capillary 0.3.0: `capillary-relevance-and-recency-separate`,
    `capillary-moved-epoch-refuses-packet` (asynchronous).
  - aestivation 0.4.0: `aestivation-intent-grants-nothing`,
    `aestivation-correction-new-digest`.

## What this run does not claim

- It does not probe the parts of those claims the probes leave out: for
  example, a malformed lease on record, a duplicate caller id, or an
  unreadable epoch. Each member's own tests cover those.
- It does not claim the members are deployed, hosted, or running as services.
- It does not claim health beyond the five module repositories at the commits
  above, on the run date.
- It does not cover bloom or videsign.
