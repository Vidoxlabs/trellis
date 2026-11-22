# Evidence: family grid run 2026-11-22 (UTC), trellis 0.2.0

Status: `observed`. This document records one run of the bundle runner
(`npm run family`) over the canonical family workspace. It is a receipt, not
a standing claim: the next health statement is the next run.

## What ran

- Runner: trellis 0.2.0, `scripts/family.mjs`, the default probe lists plus the
  operational probes. The run used the trellis working tree that this record
  is committed with.
- Layout: the canonical family workspace, with the five member repositories as
  sibling checkouts of this one, each clean at the commit below.
- Every member's own test suite was spawned (`npm test` in each checkout) for
  the operational point. Exit codes were read as results.

| Member | Declared `VERSION` | Commit |
| :--- | :--- | :--- |
| seed | 0.2.0 | `05bc9ba` |
| capillary | 0.2.0 | `30a0835` |
| myosotis | 0.3.0 | `423dc19` |
| aestivation | 0.3.0 | `001cc87` |
| drosera | 0.3.0 | `e8aa887` |

## Results

| Member | Shape | Behavior | Consistency | Operational | Verdict |
| :--- | :--- | :--- | :--- | :--- | :--- |
| seed | 1 pass | 4 pass | 1 pass | 1 pass | pass |
| capillary | 1 pass | 4 pass | — | 1 pass | pass |
| myosotis | 1 pass | 5 pass | — | 1 pass | pass |
| aestivation | 1 pass | 4 pass | — | 1 pass | pass |
| drosera | 1 pass | 5 pass | — | 1 pass | pass |
| cross-family | — | — | 3 pass | — | pass |

**Family verdict: pass.** No fails, no unknowns. Runner exit code: 0.

Every member was at or past the version each new probe names, so no probe
was held back by the version gate in this run.

## What is new since the earlier run today

The earlier record, `family-grid-2026-11-22.md`, ran trellis 0.1.0, whose
probes covered what each member claimed at its first release. Since then each
member added behavior, and trellis 0.2.0 probes it:

- seed: admission at intent, and rollback postures with registered
  compensating tools.
- capillary: unknown sources, kept out of packets and listed.
- myosotis: stale projections refused; consent ordered by sequence.
- aestivation: the gate trusts only a sound ledger; review bound to the plan
  digest.
- drosera: packs revalidate frozen entries; vendor words refused in skill
  names.
- cross-family: drosera's vendor list agrees with seed's forbidden segments on
  the corpus.

## One probe defect, caught before this run

The first draft of `vendor-list-agreement` built its corpus from drosera's own
list. A drosera that dropped a vendor seed still forbids would have passed,
because the dropped word was never tried. The trellis test that removes
`cursor` from a fixture drosera failed on that draft. The corpus now also holds
the vendor words both contracts name. This run is the corrected probe's result.

## What this run does not claim

- It does not claim the members are deployed, hosted, or running as services.
  Trellis probes modules, not deployments.
- It does not claim health beyond what was run: five module repositories at
  the commits above, on the run date.
- It does not see a vendor word seed adds outside the probe's corpus. Seed does
  not export its forbidden list, so the agreement is observed on the corpus
  only.
- It does not cover bloom or videsign. That boundary is named in
  `docs/interop.md`.
