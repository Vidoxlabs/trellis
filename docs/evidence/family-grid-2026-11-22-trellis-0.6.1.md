# Family grid run on 2026-11-22 (UTC), trellis 0.6.1

Status `observed`. Trellis 0.6.1 ran `npm run family` against the five clean
module checkouts below. The operational probes ran each member's `npm test`.
Drosera `1ffd389` was a local commit, not yet on its remote, when this run
happened.

| Member | Version | Commit |
| --- | --- | --- |
| Seed | 0.6.0 | `57e334b` |
| Capillary | 1.3.0 | `a9f0554` |
| Myosotis | 1.1.0 | `fd88484` |
| Aestivation | 0.5.0 | `b85cf91` |
| Drosera | 1.0.0 | `1ffd389` |

| Member | Shape passes | Behavior passes | Consistency passes | Operational passes |
| --- | --- | --- | --- | --- |
| Seed | 1 | 9 | 1 | 1 |
| Capillary | 1 | 13 | — | 1 |
| Myosotis | 1 | 8 | — | 1 |
| Aestivation | 1 | 7 | — | 1 |
| Drosera | 1 | 7 | — | 1 |
| Cross-family | — | — | 3 | — |

The grid reported `pass` with 58 passing checks, zero fails, zero unknowns,
and exit code 0. Trellis's standalone suite also passed all 51 tests.

Before the probe fix, trellis 0.6.0 against drosera 1.0.0 reported `fail`:
`drosera-cookbook-references-resolve`, `drosera-skill-names-refuse-vendors`,
`drosera-skill-record-and-lifecycle`, `drosera-catalog-public-skills`, and the
cross probe `vendor-list-agreement`. Each built a skill without triggers,
inputs, outputs, examples, and sources. Drosera was right to refuse it. This
note is one run, not a standing health claim.
