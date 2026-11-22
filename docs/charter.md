# Trellis charter

## Mission

Keep the family honest from the outside. Trellis holds the contracts for multi-point testing of the public repositories: probes, run against each member's loaded modules, from four points — shape, behavior, consistency, operational — with verdicts that pass, fail, or stay unknown, and with health claims that are always dated runs rather than standing truths.

The name is the doctrine. A trellis is the lattice a garden grows against, and a climbing plant grips it at many points, never one. A family of contract modules is the same shape of thing: its health is not one green badge at the center, it is every load-bearing point holding at once — the exported surface matching the claim, the invariant surviving direct calls, the siblings still agreeing where they promised to, the suites actually running. Trellis exists to make that multi-point question answerable by code instead of vibes.

## Principles

1. **Multi-point by construction.** Four points per member: shape, behavior, consistency, operational. Each point asks a different question, and none substitutes for another — a module can ship a beautiful surface while its invariants rot, and trellis names which point failed.
2. **Fail closed, in the tester too.** A probe that throws is a failed probe, recorded with its error. Converting an error into a pass, or skipping a probe because it errored, is the exact failure mode this fabric exists to catch in others; it is prohibited here first.
3. **Unknown stays unknown.** An absent sibling checkout is a declared unknown with its reason. It is never silently skipped, never counted as a pass, and it never blocks a fail from being reported. A fail outranks an unknown; an unknown outranks a pass.
4. **The core never imports a sibling.** Subjects are injected. The published library tests green with only trellis present, and cross-repo truth enters only through the bundle runner over the canonical workspace layout. This keeps the tester honest about what it can know: in isolation, mechanics; in the workspace, the family.
5. **Probes are deterministic code.** A probe checks; it does not judge. Judgment belongs to reviewers and to the admission loop; a probe that wants a model's opinion is mislabeled and has no place in a probe set.
6. **Health is a dated observation.** "The family is operational" is a sentence about a run that happened, recorded in the evidence docs with its date and its point results. Repositories do not hold health as a property; runs observe it, and the next run observes it again.

## Non-goals

- **Not a CI service.** No hosting, no standing dashboards, no network listeners. The bundle runner prints its report to whoever runs it, and the evidence docs hold the dated runs.
- **Not a replacement for sibling tests.** Every member keeps its own suite; trellis probes cross-cutting health and invariants from outside. A member whose trellis probes pass and whose own tests fail is failing — the operational point exists to catch exactly that, and the bundle runner runs the member's suite, not a trellis copy of it.
- **Not a load, performance, or security harness.** Behavioral probes check invariants under direct calls, not throughput or audit posture. Those are real needs with their own provinces, named here so they are not invented later by accident.
- **Not a judge of content.** Probes verify that what is shipped matches what is claimed and that invariants hold. Whether a contract is wise is a review question, and the loop that holds it has its own home.
