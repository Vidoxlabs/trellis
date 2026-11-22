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
6. **A claim is probed from the version that made it.** A behavior a member added after its first release is held by a probe that names that version. Against a checkout whose `VERSION` is older, or that declares no `x.y.z` version, the probe is `unknown` and names both versions: probing a claim the subject never made would be a superset (see below). Against a checkout at or past that version the claim is held in full, and a subject that cannot honor it fails.

## Execution result

```
runProbe(probe, subjects) → { id, applies, point, subject, status, detail }
runProbeAsync(probe, subjects) → Promise of the same result
status   'pass' | 'fail' | 'unknown'
detail   the message that says why
```

- `pass` — the check returned `ok: true`.
- `fail` — the check returned `ok: false`, or it threw; the detail carries the message or the error.
- A check may return a promise when the claim it holds is asynchronous. `runProbeAsync` awaits it, and a rejection is a `fail` like a throw. `runProbe` does not wait: it records `unknown`, naming `runProbeAsync`, because it did not observe the outcome.
- `unknown` — the subject is absent (a named probe whose subject is `null`), or the check returned `{ unknown: true, message }` for a reason it states, such as "grammar agreement needs both checkouts present" when one is missing.

An `unknown` is declared with its reason, carried to the verdict math, and never resolved by wishful re-reading of other results.

## What a probe never is

- Not a judge. A probe verifies claims and invariants; opinions about contract quality are review's business.
- Not a leak. A probe's messages quote errors and results, never environment details — what ran matters, where it ran does not.
- Not a superset. A probe checks what is claimed claimed. Probing things the subject never claimed is a defect in the probe, not a failure in the subject.

## Changes

- `0.5.0` — seven versioned behavior probes check the following contracts.
  - Seed `0.5.0` reports a dry run without executing steps.
  - Capillary `1.0.0` requires evidence classification on recorded sources, and
    `1.1.0` returns an untrusted bounded-read envelope.
  - Myosotis `1.0.0` refuses model-inferred personal provenance, and `1.1.0` bounds
    recall and checks the reported counts.
  - Aestivation `0.5.0` refuses correction scope expansion before changing the lineage.
  - Drosera `0.5.0` exposes only promoted MIT skills in its catalog.

  The existing digest and consent probes supply the metadata that each subject
  requires as of `1.0.0`. Earlier and absent subjects remain unknown for new claims.

- `0.4.0` — `runProbeAsync`, and `familyGridAsync` in the grid, await asynchronous
  checks; the bundle runner uses them. `runProbe` and `familyGrid` keep their results
  for every synchronous check and record an asynchronous one as `unknown`. Seven
  probes hold the newer member claims from the versions that made them: seed `0.3.0`
  resume, leases, and caller admission; capillary `0.3.0` separate relevance and
  recency and the deletion-epoch refusal; aestivation `0.4.0` read-only intent and
  corrections. The resume and epoch probes are asynchronous.

- `0.3.0` — probes speak each member's call shape by its declared version. From myosotis
  `0.4.0` a forget is sent as a confirmed, keyed request; from drosera `0.4.0` a skill is
  built with procedure, guardrails, and verification. Earlier versions keep the earlier
  shapes, so their results do not move. Two new behavior probes hold the `0.4.0` claims
  from that version: `myosotis-forget-confirmed-and-keyed` and
  `drosera-skill-record-and-lifecycle`. Older checkouts read `unknown` for both.

- `0.2.0` — rule 6, the version gate, implemented as `since()` in `src/probes.mjs`. Eleven probes hold claims the members made after `0.1.0`, each from the version that made it, and the cross probe `vendor-list-agreement` holds drosera's vendor list against seed's forbidden segments. A grid over checkouts older than those versions reads `unknown` where it read `pass`: those claims were not probed before, and they are not probed now, but the report now says so.
