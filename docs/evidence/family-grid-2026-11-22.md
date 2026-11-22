# Evidence: family grid run 2026-11-22 (UTC)

Status: `observed`. This document records one run of the bundle runner
(`npm run family`) over the canonical family workspace. It is a receipt, not
a standing claim: the next health statement is the next run.

## What ran

- Runner: trellis 0.1.0, `scripts/family.mjs`, default probe lists plus the
  operational probes.
- Layout: the canonical family workspace — the five member repositories as
  sibling checkouts of this one.
- Every member's own test suite was spawned (`npm test` in each checkout) for
  the operational point; exit codes were read as results.

## Results

| Member | Shape | Behavior | Consistency | Operational | Verdict |
| :--- | :--- | :--- | :--- | :--- | :--- |
| seed | 1 pass | 2 pass | 1 pass | 1 pass | pass |
| capillary | 1 pass | 3 pass | — | 1 pass | pass |
| myosotis | 1 pass | 3 pass | — | 1 pass | pass |
| aestivation | 1 pass | 2 pass | — | 1 pass | pass |
| drosera | 1 pass | 3 pass | — | 1 pass | pass |
| cross-family | — | — | 2 pass | — | pass |

**Family verdict: pass.** No fails, no unknowns. Runner exit code: 0.

The cross-family consistency point held both probes: drosera's local mirror of
seed's tool-id grammar accepted and rejected identically on the corpus, and
every member declared its `VERSION` in `x.y.z` form.

## One earlier fail, and what it taught

The first run of this grid verdicted **fail**: `capillary-packets-declare-their-cuts`
threw inside the probe. The probe's own budget arithmetic was wrong — its
fixture spent the total budget with room to spare, so the second item was
admitted instead of omitted, and the probe failed closed on the throw rather
than skipping. That is the fail-closed doctrine working as designed: a broken
probe is a fail on the record, never a rumor. The probe's arithmetic was
corrected; this run is the corrected probe's observed result.

## What this run does not claim

- It does not claim the members are deployed, hosted, or running as services —
  none of them are, and trellis probes modules, not deployments.
- It does not claim health beyond what was run: five module repositories, at
  their checkouts as they stood on the run date.
- It does not cover bloom or videsign: the engine probes module repositories
  with exported surfaces, and the boundary is named in `docs/interop.md`.
