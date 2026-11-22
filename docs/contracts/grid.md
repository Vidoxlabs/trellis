# Contract: the grid

Label: `specified` (rules), `implemented` in `src/grid.mjs` and `src/score.mjs`.

## Shape

```
familyGrid({ subjects, probes }) → { results, bySubject, verdict }
subjects   { name: { namespace, pkg } | null, ... } — null means absent
probes     a list of probe records (see probes.md)
results    one execution result per probe, in probe-list order
bySubject  { name: { points: { point: { pass, fail, unknown } }, verdict } }
           plus the '*' rollup for cross probes under the subject '*'
verdict    'pass' | 'fail' | 'unknown' — the overall family verdict
```

## Grid rules

1. **Subjects are injected.** The grid receives the subject map; it never loads, imports, or infers a sibling. Where a subject map entry is `null`, the grid records the declared unknown rather than skipping the probes: absence is data, not an absence of data.
2. **Probes run in order, once each.** Deterministic input, deterministic grid output. A probe list with a duplicate id is rejected, not merged.
3. **Results are frozen.** The report is built from frozen result records; rolling up never re-runs or re-weighs a check.

## Verdict math

The verdict is a strictness order, computed from the results:

```
fail    if any probe failed        — regardless of passes or unknowns
unknown if no probe failed, and any result is unknown
pass    only if every probe passed
```

Two dishonest summaries are structurally impossible under this order:

- **No averaging.** Ten passes cannot outvote one fail. The grid has no weights.
- **No unknown laundering.** "Operational" cannot be stamped over unknowns; an unknown is carried to the top verdict unless a fail outranks it.

## Per-subject and per-point rollup

`bySubject` counts each point's pass, fail, and unknown for one subject, and gives that subject its own verdict under the same math. A cross probe (`applies: '*'`) belongs to the family, not to any one member: it rolls into the `'*'` bucket and into the overall verdict. The report therefore answers both questions honestly: "is the family holding," and "which member, at which point, is not."

## Operational points and the bundle runner

The operational point's data enters through results the bundle runner records — in the shipped runner, the exit code of each present sibling's `npm test`, spawned from the sibling's checkout in the canonical layout. The grid accepts those results like any other; the runner prints the dated report and exits nonzero on any fail, so a warm-feeling human or a tool chain over the runner's output cannot mistake a fail for success. An absent checkout keeps its operational result `unknown`, with its reason, exactly as elsewhere.

## What the grid never does

- Never re-derives a probe's result from another probe's.
- Never drops a result to make a verdict look better.
- Never claims a subject absent from the subject map.
- Never resolves an unknown without a new run.
