# Family grid run on 2026-11-23 (UTC), trellis 0.7.0

Status `observed`. Trellis 0.7.0 ran `npm run family` against the five clean
module checkouts below. The operational probes ran each member's `npm test`.
Seed `d0f8bad` and drosera `d05aff0` were local commits, not yet on their
remotes, when this run happened.

| Member | Version | Commit |
| --- | --- | --- |
| Seed | 0.7.0 | `d0f8bad` |
| Capillary | 1.3.0 | `a9f0554` |
| Myosotis | 1.1.0 | `fd88484` |
| Aestivation | 0.5.0 | `b85cf91` |
| Drosera | 2.2.0 | `d05aff0` |

| Member | Shape passes | Behavior passes | Consistency passes | Operational passes |
| --- | --- | --- | --- | --- |
| Seed | 1 | 10 | 1 | 1 |
| Capillary | 1 | 13 | — | 1 |
| Myosotis | 1 | 8 | — | 1 |
| Aestivation | 1 | 7 | — | 1 |
| Drosera | 1 | 9 | — | 1 |
| Cross-family | — | — | 3 | — |

The grid reported `pass` with 61 passing checks, zero fails, zero unknowns,
and exit code 0. Trellis's standalone suite also passed all 59 tests.

The three new probes passed: `seed-abort-skips-execution`,
`drosera-lifecycle-notice-names-its-move`, and
`drosera-skill-document-needs-every-heading`. Before they were added, trellis
0.6.2 ran green against the same checkouts with 58 passing checks, so no
existing probe needed a fix. This note is one run, not a standing health claim.
