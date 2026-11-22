# Family grid run on 2026-11-22 (UTC), trellis 0.6.2

Status `observed`. Trellis 0.6.2 ran `npm run family` against the five clean
module checkouts below. The operational probes ran each member's `npm test`.
Drosera `8612892` was a local commit, not yet on its remote, when this run
happened.

| Member | Version | Commit |
| --- | --- | --- |
| Seed | 0.6.0 | `57e334b` |
| Capillary | 1.3.0 | `a9f0554` |
| Myosotis | 1.1.0 | `fd88484` |
| Aestivation | 0.5.0 | `b85cf91` |
| Drosera | 2.0.0 | `8612892` |

| Member | Shape passes | Behavior passes | Consistency passes | Operational passes |
| --- | --- | --- | --- | --- |
| Seed | 1 | 9 | 1 | 1 |
| Capillary | 1 | 13 | — | 1 |
| Myosotis | 1 | 8 | — | 1 |
| Aestivation | 1 | 7 | — | 1 |
| Drosera | 1 | 7 | — | 1 |
| Cross-family | — | — | 3 | — |

The grid reported `pass` with 58 passing checks, zero fails, zero unknowns,
and exit code 0. Trellis's standalone suite also passed all 53 tests.

Before the probe fix, trellis 0.6.1 against drosera 2.0.0 reported `fail` on
`drosera-catalog-public-skills`, which promoted a draft directly, and on
`drosera-skill-record-and-lifecycle`, which expected three lifecycle states.
Drosera was right on both. This note is one run, not a standing health claim.
