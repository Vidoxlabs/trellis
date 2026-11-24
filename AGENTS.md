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
- Same-PR ledger rule: update `docs/capabilities/index.json`, the owning capability spec, `docs/CHANGELOG.md`, and affected contract `Changes` sections in the same pull request as any capability change.

## Stay in this province

This repository probes the libraries from outside the call path. Seed is the floor. The four peers are capillary, myosotis, aestivation, and drosera. Bloom is the only composer. This task does not edit them. The core does not import them. An absent checkout is unknown, not a pass. A fail outranks an unknown. A dated note in `docs/evidence/` is one run, not a permanent health claim.

Do not declare bloom or videsign probed. The engine's subjects are the module repositories.

A consistency failure means two libraries disagree. Record it. Do not repair either library from this checkout. The repair is a later task in the repository that mirrors, after the repository that moved has its own tests green. This repository's `npm test` stays green when those siblings are absent.

## Where the other seven live

| The work | Repository |
| --- | --- |
| Run records, tool identity, provider shape | `seed` |
| Bounded retrieval and relations | `capillary` |
| Consent, forget, and recall | `myosotis` |
| Plans, verdicts, and the assembly gate | `aestivation` |
| Tool faces, skills, hooks, cookbooks | `drosera` |
| Probes over those libraries | `trellis` (here) |
| The team workspace a person opens | `bloom` |
| Family documentation, synced from every public repository | `docs` |

## Skills

This file is the working method. A probe is not a skill. A probe is deterministic code. A check that needs a model is not a probe.

## Agents

One working method lives here. Do not add a roster, and do not repair a sibling's code from this checkout. Record the verdict.

## References

Read in this order: this file, `docs/charter.md`, `docs/architecture.md`, `docs/contracts/`, `docs/interop.md`, `docs/capabilities/`, `docs/evidence/`, then `src/`. `npm test` must pass with only this repository present.

## Cookbook

1. Read this file and the charter.
2. Run `npm test`.
3. Run `npm run family` only when the sibling checkouts are present. If they are absent, the operational point is unknown.
4. Change a verdict rule only together with the test that holds it.

This recipe does not execute the siblings' tools.

## Research corpora

Before planning a change to a module that serves a capability, call `research_plan` with
this repository's name. One call returns every capability's claims, the axis with the test
that holds each decision, and the gaps already open. This repository is covered by the
`trellis` notebook.

- `research_plan <repo>` is the planning call; `research_for <capability>` (for example
  `CAP-04.3`) narrows to one, `research_axis <id>` gives the full decision with its
  options and the test that fails if it is reversed, `research_card <id>` the verbatim
  quote, and `research_challenge <term>` the evidence against behaviour already shipped.
- `research_queue` lists the gaps already recorded. Check it first so you do not re-raise
  one, and so you can see which capabilities are already blocked.
- A capability the plan calls `untouched` has neither a claim nor a gap. Call
  `research_raise` with the capability, the slice and the acceptance test it blocks, then
  stop that slice and report it. Do not plan it on general knowledge.

The tools are read-only apart from `research_raise`, and every call is recorded, so an
unconsulted plan is visible. Funding, syncing, labelling and source deletion belong to
extraction and are not exposed to you: never cite a source a card did not return, and
never edit `intel/research/`. The full rule is the research corpora rule in the workspace
`AGENTS.md`, one directory up.

## MCP

This repository is not an MCP server. Do not commit an MCP configuration, a server address, or a credential. Probes call injected subjects. They do not open a remote service.
