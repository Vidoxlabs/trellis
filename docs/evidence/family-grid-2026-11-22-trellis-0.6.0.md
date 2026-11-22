# Family grid run on 2026-11-22 (UTC), trellis 0.6.0

Status `observed`. Trellis 0.6.0 ran `npm run family` against the five clean
module checkouts below. The operational probes ran each member's `npm test`.
Seed `57e334b` and capillary `a9f0554` were local commits, not yet on their
remotes, when this run happened.

| Member | Version | Commit |
| --- | --- | --- |
| Seed | 0.6.0 | `57e334b` |
| Capillary | 1.3.0 | `a9f0554` |
| Myosotis | 1.1.0 | `fd88484` |
| Aestivation | 0.5.0 | `b85cf91` |
| Drosera | 0.5.0 | `210cee0` |

| Member | Shape passes | Behavior passes | Consistency passes | Operational passes |
| --- | --- | --- | --- | --- |
| Seed | 1 | 9 | 1 | 1 |
| Capillary | 1 | 13 | — | 1 |
| Myosotis | 1 | 8 | — | 1 |
| Aestivation | 1 | 7 | — | 1 |
| Drosera | 1 | 7 | — | 1 |
| Cross-family | — | — | 3 | — |

The grid reported `pass` with 58 passing checks, zero fails, zero unknowns,
and exit code 0. Trellis's standalone suite also passed all 49 tests.

No probe needed a fixture repair: every existing probe already built recorded
sources with evidence class and confidence, and personal memories with
`explicit-user` provenance. The six new probes cover seed failure classes,
capillary literal search, and capillary's thread, recent, context brief, and
trace functions. This note is one run, not a standing health claim.
