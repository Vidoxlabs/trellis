# Family grid run on 2026-11-22 (UTC)

Status `observed`. Trellis 0.5.0 ran `npm run family` against the five clean
module checkouts below. The operational probes ran each member's `npm test`.

| Member | Version | Commit |
| --- | --- | --- |
| Seed | 0.5.0 | `9ada09f` |
| Capillary | 1.1.0 | `3535826` |
| Myosotis | 1.1.0 | `fd88484` |
| Aestivation | 0.5.0 | `b85cf91` |
| Drosera | 0.5.0 | `210cee0` |

| Member | Shape passes | Behavior passes | Consistency passes | Operational passes |
| --- | --- | --- | --- | --- |
| Seed | 1 | 8 | 1 | 1 |
| Capillary | 1 | 8 | — | 1 |
| Myosotis | 1 | 8 | — | 1 |
| Aestivation | 1 | 7 | — | 1 |
| Drosera | 1 | 7 | — | 1 |
| Cross-family | — | — | 3 | — |

The grid reported `pass` with 52 passing checks, zero fails, zero unknowns,
and exit code 0. Trellis's standalone suite also passed all 43 tests.

The baseline grid had one failing consent probe. It supplied a personal record
without the sensitivity and confirmation provenance required by Myosotis 1.0.0.
The updated fixture lets the probe isolate the consent decision. The digest
probe now supplies the classification required by Capillary 1.0.0 to isolate
digest validation. Seven versioned probes cover dry runs, source classification,
bounded reads, personal provenance, bounded recall, scope refusal, and public
skill catalog access.
