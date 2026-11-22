# Trellis interop

How trellis meets the family. Every behavior attributed to a sibling below is sourced from that sibling's published repository; the default probes cite the contract each check holds. The core never imports a sibling — subjects are injected, and cross-repo truth enters only through the bundle runner over the canonical workspace layout.

## seed — the grammar anchor

Probed on:

- **shape** — the tool-id contract surface: `VERSION`, `parseToolId`, `formatToolId`, `isValidToolId`, `isWellFormedRegistryEntry`, `RESERVED_DOMAINS` all present; package discipline held.
- **behavior** — grammar edges reject exactly as the contract says (vendor segments, infrastructure-like segments, unknown verbs, over-long IDs), valid IDs parse to their parts, and a registry entry validates or names its errors.
- **behavior, from 0.2.0** — admission holds at intent: an attempt copies its objective's admission list, an intent naming a tool off it is refused, and an attempt with no list admits nothing. An entry with no rollback reads as `unsupported`, and a registry whose compensating tool is not registered names it.
- **consistency** — the reserved domains still hold the anchors the family leans on: the memory domain and the context domain. Siblings' interop docs point here; the point holds the promise.

## capillary — declared packets

Probed on:

- **shape** — the retrieval surface: `VERSION`, `recordSource`, `buildContextPacket`, `relationRecord`, `isSoundLedger`, `BLOOM_BASELINE` present.
- **behavior** — honest packets: budget-driven truncation is declared (`shortened`, `carried`, `cut`), out-of-budget items land in `omitted` with their reason, a source without a 64-hex digest never enters, and the ledger soundness audit catches dangling endpoints and duplicate relations.
- **behavior, from 0.2.0** — a source that could not be read is recorded as unknown with a null digest; its excerpts never enter a packet, even with a digest attached, and the packet lists it.
- The probes hold capillary's oldest rule, inherited from the systems it revamps: a packet declares what it did.

## myosotis — the structural forget

Probed on:

- **shape** — the memory surface: `MEMORY_KINDS`, `memoryRecord`, `requiresConsent`, `consentState`, `openStore`, `admitMemory`, `forgetMemory`, `recallAll`, `projectionStamp`, `projectionIsValid`, `VERSION` present.
- **behavior** — the forget contract, under direct load: a real forget removes the record and bumps the epoch; a projection stamped before the bump fails closed after it; a forget miss is declared `unknown` with no state change; personal-consented memory is refused without a live grant; the kind set stays closed.
- **behavior, from 0.2.0** — a projection built before a forget is refused and serves nothing, and current recall rebuilds without the forgotten record.
- **behavior, from 0.3.0** — consent follows the sequence: a grant after a revocation is re-consent, a later revocation ends it, and a tie or an unsequenced side goes to the revocation.

## aestivation — the gate that does not bend

Probed on:

- **shape** — the loop surface: `STAGE_KINDS`, `validatePlan`, `planProposal`, `DECISIONS`, `verdictRecord`, `latestVerdict`, `isSoundVerdictLedger`, `assemblyGate`, `VERSION` present.
- **behavior** — the gate order under direct load: an approved but invalid plan stays held (`plan-invalid`; deterministic outranks judgment), a revise verdict refuses to record without reasons, and a revise-then-approve ledger ends permitted with both verdicts kept.
- **behavior, from 0.2.0** — a hand-built approval with no judge holds the gate as `ledger-unsound` and is never surfaced as the verdict.
- **behavior, from 0.3.0** — given the plan digest, an approval of that exact plan permits, and an approval of a changed plan holds as `review-stale`.

## drosera — fail closed, resolve early

Probed on:

- **shape** — the tooling surface: `EFFECT_CLASSES`, `parseToolId`, `toolFace`, `toolPack`, `skill`, `skillPack`, `EVENTS`, `hook`, `hookPack`, `runHooks`, `recipe`, `cookbook`, `checkRecipe`, `VERSION` present.
- **behavior** — hook dispatch fails closed (a throwing check is a failed check), a face with a non-closed effect is rejected, and cookbook reference resolution catches a dangling face at check time.
- **behavior, from 0.2.0** — every pack revalidates its entries: a frozen object that is not a valid face, skill, hook, or recipe is refused.
- **behavior, from 0.3.0** — a skill name with a vendor word is refused, whole words only, and protocol words stay allowed.

## Cross-family — where the siblings agree

- **Grammar mirror agreement** — drosera mirrors seed's tool-id grammar locally, by doctrine; the cross probe feeds both parsers the same corpus of valid and invalid IDs and passes only when they accept and reject identically. Either checkout absent: declared unknown — agreement is a two-member property, and it is not observed by wishing.
- **Vendor list agreement** — drosera's `VENDOR_NAMES` claims to be the vendor half of seed's forbidden segments. The cross probe tries a corpus: the vendor words both contracts name, drosera's own list, candidate vendor words neither lists, and seed's protocol words. Every word drosera refuses in a skill name must be a segment seed refuses; every corpus word seed refuses that drosera allows must be a protocol word; and drosera must allow the protocol words. Seed does not export its list, so a vendor seed adds outside the corpus is not seen. Either checkout absent, or drosera older than 0.3.0: declared unknown.
- **Version discipline** — every present subject declares a `VERSION` in `x.y.z` form. The point does not require the versions to be equal; it requires the declarations to exist, because trellis' shape claims in the evidence docs speak of what the modules said about themselves.

## Claims made after a first release

A probe marked "from" a version is held only against a checkout at or past it. An older checkout reads `unknown` for that probe, with both versions named, rather than failing a claim it never made or passing one nobody checked. The rule is in `docs/contracts/probes.md`.

## The family members not probed here

Bloom, the family's team workspace, and videsign, the design canon, are not subjects of the engine: the engine probes module repositories with exported surfaces, and each of those carries its own contract discipline in its own home. Their absence from the grid is a boundary, not a judgment, and this section names it so a future change would be a decision, not an accident.

## Evidence

Runs of the bundle runner are recorded in `docs/evidence/` as dated observations: which members ran, each point's verdict, and the overall verdict. They are receipts, not standing claims — the next health statement is the next run.
