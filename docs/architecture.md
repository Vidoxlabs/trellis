# Trellis architecture

Probes ask, the grid runs, verdicts answer.

```
                    injected subjects (never imported by the core)
                              { seed: {namespace, pkg} | null, ... }
                                            │
   probe lists ──────► the multi-point grid ──────► results
   { id, point,      run every probe against             │
     applies,         its subject; absent               ▼
     summary, check }  subject = unknown           verdict math
                                            fail > unknown > pass
                                                        │
                                                        ▼
                                    per-subject, per-point report
                                    (bundle runner prints it, dated)
```

## The four points

| Point | The question it asks | How it asks |
| :--- | :--- | :--- |
| `shape` | Is the public surface what the repo claims? | Probes check exports, package discipline: `VERSION` present, the documented entry symbols defined, module type, engines floor, zero runtime dependencies. |
| `behavior` | Do the load-bearing invariants hold under direct calls? | Probes call the subject's functions with known inputs and assert the invariants the member's contract promises: epochs bump, gates hold, hooks fail closed, omissions are declared. |
| `consistency` | Do the siblings agree where they claim to? | Cross probes receive the whole subject map: the tool grammar mirrors accept and reject identically, shared conventions hold, versions are declared everywhere. |
| `operational` | Does each test suite actually run green? | The bundle runner spawns each present sibling's `npm test` and records the exit code as the point result. |

No point substitutes for another. The grid keeps them separate all the way to the report, so a failure names its point.

## The subject map

A subject is `{ namespace, pkg }` — a loaded module namespace and the parsed `package.json` — or `null` for an absent checkout. Absence is a first-class state, not an error: the grid records `unknown` with the reason "checkout absent," and the verdict math carries it honestly. The core learns siblings only through this map; it has no path to a sibling's files.

## The grid and the verdicts

`familyGrid({ subjects, probes })` (or `familyGridAsync`, which awaits asynchronous checks and is what the bundle runner uses) runs every probe whose subject is present, records one result per probe — pass, fail, or unknown, with a detail message — and rolls up a per-subject, per-point summary plus an overall verdict.

The verdict math is a strictness order, not an average:

- any fail makes the verdict `fail`, no matter how many passes;
- with no fails, any unknown makes the verdict `unknown`;
- only all-pass is `pass`.

There is no partial credit and no weighting. The order exists so that the two dishonest summaries — averaging away a failure, and stamping "operational" over unknowns — are both structurally impossible.

## The engine and the bundle runner

Two layers, deliberate:

- **The engine** (`src/`) is pure: probe records, fail-closed execution, the grid, the verdict math. It tests green with only this repository present, using fixtures as subjects.
- **The bundle runner** (`scripts/family.mjs`, `npm run family`) resolves the canonical workspace layout — each sibling checkout beside the others — loads the present siblings as subjects, runs the default probe lists, spawns each sibling's `npm test` for the operational point, prints the dated report, and exits nonzero on any fail. Absent siblings are reported as unknown; the runner never errors out on absence.

Evidence documents (`docs/evidence/`) record the dated runs of the bundle runner: which members, which points, what verdict, and on what date — with receipts, and with no detail about the machines the runs happened on.
