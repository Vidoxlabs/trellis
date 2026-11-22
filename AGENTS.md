# Trellis workspace

## What this is

Trellis is the testing lattice of the public bloom agent family. It holds the contracts and modules for multi-point testing: shape (is the public surface what it claims), behavior (do the invariants hold under load-bearing calls), consistency (do the siblings agree where they claim to), and operational (do the test suites run green). A family of contract modules earns the word "operational" only through observed multi-point runs, and trellis is where those runs live.

This repository holds contracts first, and second a small, dependency-free reference module implementing the probe, grid, and verdict engine, plus a bundle runner that exercises the whole family when the canonical workspace layout is present. Nothing here is a hosted CI service.

## Claim labels

Every capability in this repository carries exactly one label, and it must be true on its face:

- `implemented` - exists as tested code in `src/` with `npm test` coverage.
- `specified` - exists as a written contract a competent party could implement against.
- `planned` - named as an intent. Never presented as done.
- `observed` - recorded as observed behavior of a dated run, kept with its receipts in `docs/evidence/`.

A label is a claim about this repository in its current state. When a label stops being true, the label changes or the claim is removed.

## Progress honesty

The reference modules are honest library implementations of probe, grid, and verdict rules, exercised by unit tests in this repository. The bundle runner is code in `scripts/` exercised against the canonical family workspace; statements about family health in `docs/evidence/` are dated observed runs, never standing claims of permanent health. Nothing in this repository is deployed online. Do not write docs, READMEs, or comments that imply it is.

## Testing honesty rules

These rules bind contributions to this repository and the code it accepts:

- Pass, fail, unknown — those are the only verdicts, and a fail always outranks an unknown. An absent sibling checkout is declared unknown with its reason, never skipped silently and never counted as a pass.
- Probes fail closed. A check that throws is a failed probe, recorded with its error, never a skipped one.
- Probes are deterministic code. A probe that needs a model to judge is not a probe; judgment belongs to reviewers, and trellis records what code observed.
- The core never imports a sibling. Subjects are injected: the published library tests green with only this repository present, and cross-repo truth enters only through the bundle runner over the canonical layout.
- Health claims are dated. "The family is operational" is a sentence about a run that happened, with its date and its point results kept in `docs/evidence/` — not a property the repositories somehow permanently hold.
- Operational points read exit codes, not vibes: a sibling's suite runs, and the point records what its exit code said, with failures named.

## Public safety

This is a public repository. No hostnames, addresses, ports, cluster names, container names, credentials, or personal names in any file. Evidence docs record runs by repository name, pass/fail/unknown, and date — nothing about the machines the runs happened on. A leak is a defect; finding one means fixing it before anything else ships.

## Verification

- `npm test` must stay green with only this repository present. `npm run family` additionally exercises the bundle runner against the canonical workspace; its absence is a declared unknown, not an error.
- Every verdict rule must be visible in a test. If it cannot be tested, it is a wish, and it must be labeled `planned`, not `implemented`.
- Docs change with code or they do not change at all. There is no "docs later."
