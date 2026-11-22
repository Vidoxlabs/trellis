# Evidence: family grid run 2026-11-22 (UTC), after predecessor coverage

Status: `observed`. This document records one run of the bundle runner
(`npm run family`) over the canonical family workspace. It is a receipt, not
a standing claim: the next health statement is the next run.

## What ran

- Runner: trellis 0.2.0, `scripts/family.mjs`, the default probe lists plus the
  operational probes, unchanged since `family-grid-2026-11-22-trellis-0.2.0.md`.
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
| seed | 1 pass | 4 pass | 1 pass | 1 pass | pass |
| capillary | 1 pass | 4 pass | — | 1 pass | pass |
| myosotis | 1 pass | 2 fail, 3 pass | — | 1 pass | fail |
| aestivation | 1 pass | 4 pass | — | 1 pass | pass |
| drosera | 1 pass | 2 fail, 3 pass | — | 1 pass | fail |
| cross-family | — | — | 1 fail, 2 pass | — | fail |

**Family verdict: fail.** Runner exit code: 1. Every member's own `npm test`
passed.

## The failures

All five are probes written against the earlier contracts. The members changed
those contracts on purpose in this run's commits, and say so in their own
contract change notes. Trellis records the disagreement and does not repair a
member from this checkout.

- `myosotis-forget-is-structural` and `myosotis-stale-projection-refused`. The
  probes call `forgetMemory(store, id)`. Myosotis 0.4.0 requires
  `{ id, confirmed: true, key }`, and a bare id is refused with no state
  change. The probes therefore see no removal and no epoch bump. The second
  probe also shows that a projection now holds ids and digests, not text.
- `drosera-cookbook-references-resolve` and `drosera-skill-names-refuse-vendors`.
  The probes build skills from `name`, `summary`, and `instructions`. Drosera
  0.4.0 also requires `procedure`, `guardrails`, and `verification`, so every
  such skill is refused, including names the contract allows.
- `vendor-list-agreement` (consistency). The probe reads "drosera refuses this
  word" from a refused skill. Drosera now refuses every skill without the three
  new lists, so the probe reports a vendor disagreement that the two vendor
  lists do not have. This is a probe input defect, not observed drift between
  seed and drosera.

## What repairs this

The repair is a later trellis task: build skills with the three new lists, and
forget with a confirmed, keyed request, gated by `since('0.4.0', ...)` so the
earlier releases keep their earlier probes. No member needs to move for that.

## What this run does not claim

- It does not claim the members are deployed, hosted, or running as services.
- It does not claim health beyond the five module repositories at the commits
  above, on the run date.
- It does not cover bloom or videsign.
