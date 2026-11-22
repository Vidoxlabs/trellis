# Trellis interop

How trellis meets the family. Every behavior attributed to a sibling below is sourced from that sibling's published repository; the default probes cite the contract each check holds. The core never imports a sibling — subjects are injected, and cross-repo truth enters only through the bundle runner over the canonical workspace layout.

## seed — the grammar anchor

Probed on:

- **shape** — the tool-id contract surface: `VERSION`, `parseToolId`, `formatToolId`, `isValidToolId`, `isWellFormedRegistryEntry`, `RESERVED_DOMAINS` all present; package discipline held.
- **behavior** — grammar edges reject exactly as the contract says (vendor segments, infrastructure-like segments, unknown verbs, over-long IDs), valid IDs parse to their parts, and a registry entry validates or names its errors.
- **consistency** — the reserved domains still hold the anchors the family leans on: the memory domain and the context domain. Siblings' interop docs point here; the point holds the promise.

## capillary — declared packets

Probed on:

- **shape** — the retrieval surface: `VERSION`, `recordSource`, `buildContextPacket`, `relationRecord`, `isSoundLedger`, `BLOOM_BASELINE` present.
- **behavior** — honest packets: budget-driven truncation is declared (`shortened`, `carried`, `cut`), out-of-budget items land in `omitted` with their reason, a source without a 64-hex digest never enters, and the ledger soundness audit catches dangling endpoints and duplicate relations.
- The probes hold capillary's oldest rule, inherited from the systems it revamps: a packet declares what it did.

## myosotis — the structural forget

Probed on:

- **shape** — the memory surface: `MEMORY_KINDS`, `memoryRecord`, `requiresConsent`, `consentState`, `openStore`, `admitMemory`, `forgetMemory`, `recallAll`, `projectionStamp`, `projectionIsValid`, `VERSION` present.
- **behavior** — the forget contract, under direct load: a real forget removes the record and bumps the epoch; a projection stamped before the bump fails closed after it; a forget miss is declared `unknown` with no state change; personal-consented memory is refused without a live grant; the kind set stays closed.

## aestivation — the gate that does not bend

Probed on:

- **shape** — the loop surface: `STAGE_KINDS`, `validatePlan`, `planProposal`, `DECISIONS`, `verdictRecord`, `latestVerdict`, `isSoundVerdictLedger`, `assemblyGate`, `VERSION` present.
- **behavior** — the gate order under direct load: an approved but invalid plan stays held (`plan-invalid`; deterministic outranks judgment), a revise verdict refuses to record without reasons, and a revise-then-approve ledger ends permitted with both verdicts kept.

## drosera — fail closed, resolve early

Probed on:

- **shape** — the tooling surface: `EFFECT_CLASSES`, `parseToolId`, `toolFace`, `toolPack`, `skill`, `skillPack`, `EVENTS`, `hook`, `hookPack`, `runHooks`, `recipe`, `cookbook`, `checkRecipe`, `VERSION` present.
- **behavior** — hook dispatch fails closed (a throwing check is a failed check), a face with a non-closed effect is rejected, and cookbook reference resolution catches a dangling face at check time.

## Cross-family — where the siblings agree

- **Grammar mirror agreement** — drosera mirrors seed's tool-id grammar locally, by doctrine; the cross probe feeds both parsers the same corpus of valid and invalid IDs and passes only when they accept and reject identically. Either checkout absent: declared unknown — agreement is a two-member property, and it is not observed by wishing.
- **Version discipline** — every present subject declares a `VERSION` in `x.y.z` form. The point does not require the versions to be equal; it requires the declarations to exist, because trellis' shape claims in the evidence docs speak of what the modules said about themselves.

## The family members not probed here

Bloom, the family's team workspace, and videsign, the design canon, are not subjects of the engine: the engine probes module repositories with exported surfaces, and each of those carries its own contract discipline in its own home. Their absence from the grid is a boundary, not a judgment, and this section names it so a future change would be a decision, not an accident.

## Evidence

Runs of the bundle runner are recorded in `docs/evidence/` as dated observations: which members ran, each point's verdict, and the overall verdict. They are receipts, not standing claims — the next health statement is the next run.
