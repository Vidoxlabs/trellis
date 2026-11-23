# Family grid run on 2026-11-23 (UTC), trellis 0.8.0

Status `observed`. Trellis 0.8.0 ran `npm run family` against the five clean
module checkouts below. The operational probes ran each member's `npm test`.
Every commit below matched its remote's `main` when this run happened.

| Member | Version | Commit |
| --- | --- | --- |
| Seed | 0.8.0 | `7c0cdae` |
| Capillary | 1.3.0 | `a9f0554` |
| Myosotis | 1.2.0 | `79d0938` |
| Aestivation | 0.5.0 | `b85cf91` |
| Drosera | 2.2.0 | `d05aff0` |

| Member | Shape passes | Behavior passes | Consistency passes | Operational passes |
| --- | --- | --- | --- | --- |
| Seed | 1 | 11 | 1 | 1 |
| Capillary | 1 | 13 | — | 1 |
| Myosotis | 1 | 8 | — | 1 |
| Aestivation | 1 | 7 | — | 1 |
| Drosera | 1 | 9 | — | 1 |
| Cross-family | — | — | 3 | — |

The grid reported `pass` with 62 passing checks, zero fails, zero unknowns,
and exit code 0. Trellis's standalone suite also passed all 62 tests.

The new probe passed: `seed-registry-documents-fail-closed`. Against seed
`0.8.0`, a `null` agents document was named `agents` in `missing` with no
path, an agent that named an unlisted tool was an error, and `ok` was false
in both cases. The probe passed its documents in memory and read no file.
Before it was added, trellis 0.7.0 ran green against the same checkouts with
61 passing checks, so no existing probe needed a fix. This note is one run,
not a standing health claim.
