# Contract: probes

Label: `specified` (rules), `implemented` (records and execution in `src/point.mjs`).

## Shape

```
probe { id, point, applies, summary, check }
id       kebab-case, unique within a probe list
point    one of: shape | behavior | consistency | operational
applies  a subject name ('seed'), or '*' for a cross-family probe
summary  non-empty; what the probe guarantees when it passes
check    a function: (subject, subjects) → { ok, message? } — deterministic code
```

For a named probe, the check receives its subject `{ namespace, pkg }` or `null`.
For a `'*'` probe, the check receives the whole subjects map. Every check may
consult `subjects`; only cross probes depend on more than their own.

## Rules

1. **The check is a function.** A probe record without a function is not a probe. Hooks in the tooling fabric established the shape rule; probes inherit it: checks are code the author wrote, deterministic, never prose, never a model call.
2. **Fail closed on throw.** Executing a probe turns an exception into a failed result carrying the error's message, in full, for the report. A probe is never skipped because it threw, and a throw never becomes a pass.
3. **One point each.** A probe names exactly one point. The multi-point discipline is that shape, behavior, consistency, and operational stay separate all the way to the report; a probe that "sort of" checks two points is two probes.
4. **Dedicated subjects.** A named probe applies to exactly one subject. Cross-family questions — agreements between siblings — are `'*'` probes, and they declare themselves by their `applies`.
5. **Summaries state the guarantee.** "The forget bumps the epoch and fails stale projections closed" is a summary; "tests the memory" is not. A reader of the report should know what every pass certified.

## Execution result

```
runProbe(probe, subjects) → { id, applies, point, subject, status, detail }
status   'pass' | 'fail' | 'unknown'
detail   the message that says why
```

- `pass` — the check returned `ok: true`.
- `fail` — the check returned `ok: false`, or it threw; the detail carries the message or the error.
- `unknown` — the subject is absent (a named probe whose subject is `null`), or the check returned `{ unknown: true, message }` for a reason it states, such as "grammar agreement needs both checkouts present" when one is missing.

An `unknown` is declared with its reason, carried to the verdict math, and never resolved by wishful re-reading of other results.

## What a probe never is

- Not a judge. A probe verifies claims and invariants; opinions about contract quality are review's business.
- Not a leak. A probe's messages quote errors and results, never environment details — what ran matters, where it ran does not.
- Not a superset. A probe checks what is claimed claimed. Probing things the subject never claimed is a defect in the probe, not a failure in the subject.
