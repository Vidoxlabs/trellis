# Architecture Decision Records

Architecture Decision Records (ADRs) for `trellis` live in this directory, numbered sequentially from `0001` (`NNNN-<slug>.md`).

- Format, lifecycle (`Proposed`, `Accepted`, `Superseded by NNNN`, `Deferred`), and review rules follow the hub ADR convention in [Vidoxlabs/docs](https://github.com/Vidoxlabs/docs/blob/main/docs/adr/README.md).
- Agents write `Proposed` ADRs; only an explicit owner decision moves an ADR to `Accepted`.
- Any runtime dependency proposal requires an ADR before adding a package.
- Record every added or updated ADR in `docs/capabilities/index.json` in the same pull request.
