# trellis

The testing lattice: multi-point probes that keep the bloom agent family honest.

Trellis is the testing fabric of the public bloom agent family. Every member repository keeps its own tests; trellis checks the family from the outside, from four points each: **shape** (the public surface is what it claims), **behavior** (the load-bearing invariants hold under direct calls), **consistency** (the siblings agree where they claim to — one grammar, shared conventions), and **operational** (each test suite runs green when actually run). Verdicts are pass, fail, or unknown — and a fail always outranks an unknown, an absent checkout is declared unknown, and health claims are dated runs kept as evidence, not standing truths.

## The name

A trellis is the lattice a garden grows against. Climbing plants grip a lattice at many points, not one — and the lattice holds precisely because it is checked at every point it promises to hold. That is the entire doctrine of this fabric: the family is a garden of contract modules, and its health is a multi-point question, never a single green badge.

## Status

Version 0.1.0. Contracts and modules only; nothing shipped runtime-wise beyond the engine and the bundle runner. The probe, grid, and verdict engine is `implemented` as a tested reference library. Family health statements live in `docs/evidence/` as dated observed runs. The engine covers the family's module repositories; the harness and the design canon keep their own checks in their own homes.

## Install

```bash
npm install @vidoxlabs/trellis
```

Requires Node >= 22.13. Zero runtime dependencies.

## Modules

| Module | What it holds | Label |
| :--- | :--- | :--- |
| `point.mjs` | The four test points and the probe record: deterministic checks, fail closed, dedicated to one point. | `implemented` |
| `score.mjs` | Verdict math: pass, fail, unknown — fail outranks unknown, unknown outranks pass, and nothing is ever silently passed. | `implemented` |
| `grid.mjs` | The multi-point grid: run probes against injected subjects and roll the results up per subject and per point. | `implemented` |
| `probes.mjs` | The default probe lists for each family member and the cross-family consistency probes. | `implemented` |

The bundle runner, `scripts/family.mjs` (`npm run family`), wires the grid to the canonical family workspace: it loads each sibling's modules, runs the default probes, runs each sibling's own test suite for the operational point, and prints the dated report the evidence docs record.

## The family

Trellis is one of seven named projects that share one design law — ordinary botanical words for public products, mirroring five flower-named personas ([the law](https://github.com/Vidoxlabs/capillary/blob/main/docs/family.md)):

| Name | Province |
| :--- | :--- |
| [`seed`](https://github.com/Vidoxlabs/seed) | The agent harness foundation: runs, tools, providers. |
| [`capillary`](https://github.com/Vidoxlabs/capillary) | Context retrieval and relations, provenance-first. |
| [`myosotis`](https://github.com/Vidoxlabs/myosotis) | Governed memory: consent to keep, promise to forget. |
| [`aestivation`](https://github.com/Vidoxlabs/aestivation) | Plan proposal, deterministic validation, review verdicts, and the assembly gate. |
| [`drosera`](https://github.com/Vidoxlabs/drosera) | The tooling fabric: tool faces, skills, hooks, cookbooks. |
| `trellis` (this repo) | The testing lattice: multi-point probes over the family. |
| [`bloom`](https://github.com/Vidoxlabs/bloom) | The agent harness the family serves: the team workspace where agents run. |

The line grows against the trellis: the products are the plants; this is the lattice they are checked against.

## Documentation

- `docs/charter.md` — mission, principles, non-goals.
- `docs/architecture.md` — probes, grid, verdicts; engine and bundle runner.
- `docs/contracts/` — the probe and grid contracts.
- `docs/interop.md` — what each sibling is probed on, and the boundaries.
- `docs/evidence/` — dated observed family runs, with their receipts.

## Development

```bash
npm test       # engine and probe mechanics, no siblings required
npm run family # the bundle runner over the canonical workspace layout
```

Tests use the Node built-in runner. Adding a probe means adding the test that holds it.

## License

MIT
